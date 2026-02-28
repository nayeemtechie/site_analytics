/**
 * Web Worker for data aggregation.
 * Runs all heavy computation off the main thread.
 */

// ─── Aggregation logic (duplicated from dataAggregator.js for worker isolation) ───

function groupBy(data, key) {
    const groups = {};
    for (const row of data) {
        const groupKey = row[key] ?? 'Unknown';
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(row);
    }
    return groups;
}

function sumField(rows, field) {
    return rows.reduce((sum, r) => sum + (Number(r[field]) || 0), 0);
}

function aggregateGroup(rows) {
    const views = sumField(rows, 'views');
    const clicks = sumField(rows, 'clicks');
    const sales = sumField(rows, 'sales');
    const items = sumField(rows, 'items');
    const orders = sumField(rows, 'orders');
    const ctr = views > 0 ? (clicks / views) * 100 : 0;
    const revenuePerClick = clicks > 0 ? sales / clicks : 0;
    const revenuePerView = views > 0 ? sales / views : 0;
    return { views, clicks, ctr, sales, items, orders, revenuePerClick, revenuePerView, rowCount: rows.length };
}

function aggregateByKey(data, key) {
    const groups = groupBy(data, key);
    return Object.entries(groups)
        .map(([name, rows]) => ({ name, ...aggregateGroup(rows) }))
        .sort((a, b) => b.views - a.views);
}

function getKPISummary(data) {
    const agg = aggregateGroup(data);
    const dates = [...new Set(data.map(r => r.date).filter(Boolean))].sort();

    // Derived efficiency metrics
    const rpc = agg.clicks > 0 ? agg.sales / agg.clicks : 0;
    const conversionRate = agg.clicks > 0 ? (agg.orders / agg.clicks) * 100 : 0;
    const aov = agg.orders > 0 ? agg.sales / agg.orders : 0;
    const itemsPerOrder = agg.orders > 0 ? agg.items / agg.orders : 0;

    // Month-over-Month deltas
    let mom = {};
    const monthGroups = {};
    for (const row of data) {
        if (!row.date) continue;
        const month = row.date.substring(0, 7);
        if (!monthGroups[month]) monthGroups[month] = [];
        monthGroups[month].push(row);
    }
    const months = Object.keys(monthGroups).sort();
    if (months.length >= 2) {
        const lastMonth = aggregateGroup(monthGroups[months[months.length - 1]]);
        const prevMonth = aggregateGroup(monthGroups[months[months.length - 2]]);
        const pctChange = (curr, prev) => prev > 0 ? ((curr - prev) / prev) * 100 : 0;
        const lastRpc = lastMonth.clicks > 0 ? lastMonth.sales / lastMonth.clicks : 0;
        const prevRpc = prevMonth.clicks > 0 ? prevMonth.sales / prevMonth.clicks : 0;
        mom = {
            views: pctChange(lastMonth.views, prevMonth.views),
            clicks: pctChange(lastMonth.clicks, prevMonth.clicks),
            ctr: pctChange(lastMonth.ctr, prevMonth.ctr),
            sales: pctChange(lastMonth.sales, prevMonth.sales),
            orders: pctChange(lastMonth.orders, prevMonth.orders),
            rpc: pctChange(lastRpc, prevRpc),
        };
    }

    // Top contributing channel by sales
    const channelGroups = groupBy(data, 'channel');
    let topChannel = null;
    let topChannelSales = 0;
    for (const [name, rows] of Object.entries(channelGroups)) {
        const s = sumField(rows, 'sales');
        if (s > topChannelSales) { topChannelSales = s; topChannel = name; }
    }
    const topChannelPct = agg.sales > 0 ? (topChannelSales / agg.sales) * 100 : 0;

    // Best strategy by RPC (min 1000 clicks)
    const stratGroups = groupBy(data, 'strategy');
    let bestStrategy = null;
    let bestRpc = 0;
    for (const [name, rows] of Object.entries(stratGroups)) {
        const clicks = sumField(rows, 'clicks');
        if (clicks >= 1000) {
            const sales = sumField(rows, 'sales');
            const r = sales / clicks;
            if (r > bestRpc) { bestRpc = r; bestStrategy = name; }
        }
    }

    return {
        ...agg,
        rpc,
        conversionRate,
        aov,
        itemsPerOrder,
        mom,
        topChannel,
        topChannelPct,
        bestStrategy,
        bestRpc,
        dateRange: dates.length > 0 ? { start: dates[0], end: dates[dates.length - 1] } : null,
        uniqueDates: dates.length,
        uniqueStrategies: new Set(data.map(r => r.strategy).filter(Boolean)).size,
        uniquePages: new Set(data.map(r => r.page_type).filter(Boolean)).size,
        uniqueChannels: new Set(data.map(r => r.channel).filter(Boolean)).size,
    };
}

function getChannelPerformance(data) {
    return aggregateByKey(data, 'channel');
}

function getPagePerformance(data) {
    return aggregateByKey(data, 'page_type');
}

function getStrategyFamilyPerformance(data) {
    return aggregateByKey(data, 'strategy_family');
}

function getStrategyPerformance(data) {
    return aggregateByKey(data, 'strategy');
}

function getStrategyTypePerformance(data) {
    return aggregateByKey(data, 'strategy_type');
}

function getWeekKey(dateStr) {
    const d = new Date(dateStr);
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function getMonthKey(dateStr) {
    return dateStr.substring(0, 7);
}

function getQuarterKey(dateStr) {
    const month = parseInt(dateStr.substring(5, 7), 10);
    const quarter = Math.ceil(month / 3);
    return `${dateStr.substring(0, 4)}-Q${quarter}`;
}

function aggregateByTimePeriod(dailyData, keyFn) {
    const groups = {};
    for (const day of dailyData) {
        const key = keyFn(day.date);
        if (!groups[key]) groups[key] = [];
        groups[key].push(day);
    }
    return Object.entries(groups)
        .map(([period, days]) => ({
            date: period,
            views: days.reduce((s, d) => s + d.views, 0),
            clicks: days.reduce((s, d) => s + d.clicks, 0),
            sales: days.reduce((s, d) => s + d.sales, 0),
            items: days.reduce((s, d) => s + d.items, 0),
            orders: days.reduce((s, d) => s + d.orders, 0),
            ctr: (() => {
                const v = days.reduce((s, d) => s + d.views, 0);
                const c = days.reduce((s, d) => s + d.clicks, 0);
                return v > 0 ? (c / v) * 100 : 0;
            })(),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

function getTrendData(data, granularity = 'daily') {
    const byDate = groupBy(data, 'date');
    let dailyData = Object.entries(byDate)
        .map(([date, rows]) => ({ date, ...aggregateGroup(rows) }))
        .sort((a, b) => a.date.localeCompare(b.date));

    if (granularity === 'weekly') {
        return aggregateByTimePeriod(dailyData, getWeekKey);
    } else if (granularity === 'monthly') {
        return aggregateByTimePeriod(dailyData, getMonthKey);
    } else if (granularity === 'quarterly') {
        return aggregateByTimePeriod(dailyData, getQuarterKey);
    }
    return dailyData;
}

function getMonthlyTrend(data) {
    return getTrendData(data, 'monthly');
}

function getCrossDimensional(data, dim1, dim2, metric = 'ctr') {
    const dim1Values = [...new Set(data.map(r => r[dim1]).filter(Boolean))].sort();
    const dim2Values = [...new Set(data.map(r => r[dim2]).filter(Boolean))].sort();

    const matrix = [];
    for (const d1 of dim1Values) {
        const row = { name: d1 };
        for (const d2 of dim2Values) {
            const filtered = data.filter(r => r[dim1] === d1 && r[dim2] === d2);
            if (filtered.length === 0) {
                row[d2] = null;
            } else {
                const agg = aggregateGroup(filtered);
                row[d2] = agg[metric];
            }
        }
        matrix.push(row);
    }
    return { matrix, dim1Values, dim2Values };
}

function getUnderperformers(data, viewThreshold = 1000) {
    const groupKey = (r) => `${r.strategy}||${r.page_type}||${r.channel}`;
    const groups = {};
    for (const row of data) {
        const key = groupKey(row);
        if (!groups[key]) groups[key] = { strategy: row.strategy, page_type: row.page_type, channel: row.channel, rows: [] };
        groups[key].rows.push(row);
    }

    const results = [];
    for (const group of Object.values(groups)) {
        const agg = aggregateGroup(group.rows);
        if (agg.views >= viewThreshold) {
            let issues = [];
            if (agg.clicks === 0) issues.push('Zero Clicks');
            else if (agg.ctr < 0.1) issues.push('Very Low CTR');
            if (agg.sales === 0 && agg.clicks > 0) issues.push('Zero Sales');

            if (issues.length > 0) {
                results.push({
                    strategy: group.strategy,
                    page_type: group.page_type,
                    channel: group.channel,
                    ...agg,
                    issues,
                });
            }
        }
    }
    return results.sort((a, b) => b.views - a.views);
}

function getPageAreaPerformance(data) {
    // Group by page_type + page_area combined
    const groups = {};
    for (const row of data) {
        const pt = row.page_type || 'Unknown';
        const pa = row.page_area || 'Unknown';
        const key = `${pt} › ${pa}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(row);
    }
    return Object.entries(groups)
        .map(([name, rows]) => ({ name, ...aggregateGroup(rows) }))
        .sort((a, b) => b.views - a.views);
}

function getStrategyByPageType(data) {
    // For each strategy, break down performance by page_type
    const strategyGroups = groupBy(data, 'strategy');
    const results = [];
    for (const [strategy, rows] of Object.entries(strategyGroups)) {
        const pageGroups = groupBy(rows, 'page_type');
        const overall = aggregateGroup(rows);
        const byPage = {};
        for (const [page, pageRows] of Object.entries(pageGroups)) {
            byPage[page] = aggregateGroup(pageRows);
        }
        results.push({ strategy, overall, byPage });
    }
    return results.sort((a, b) => b.overall.views - a.overall.views);
}

function getStrategyPageAreaDetail(data) {
    // Full breakdown: strategy × page_type × page_area
    const compositeKey = (r) => `${r.strategy}||${r.page_type}||${r.page_area || 'Unknown'}`;
    const groups = {};
    for (const row of data) {
        const key = compositeKey(row);
        if (!groups[key]) groups[key] = {
            strategy: row.strategy,
            page_type: row.page_type,
            page_area: row.page_area || 'Unknown',
            rows: []
        };
        groups[key].rows.push(row);
    }
    return Object.values(groups)
        .map(g => ({
            strategy: g.strategy,
            page_type: g.page_type,
            page_area: g.page_area,
            ...aggregateGroup(g.rows),
        }))
        .sort((a, b) => b.views - a.views);
}

function getPagePerformanceInsights(data) {
    // Step 1: Aggregate by page_type to find top/bottom CTR pages
    const pageGroups = groupBy(data, 'page_type');
    const pages = Object.entries(pageGroups)
        .map(([name, rows]) => ({ name, ...aggregateGroup(rows) }))
        .filter(p => p.views >= 1000);

    const sorted = [...pages].sort((a, b) => b.ctr - a.ctr);
    const topPages = sorted.slice(0, 3);
    const bottomPages = sorted.slice(-3).reverse();

    function getPlacementDetails(pageType, best) {
        const pageRows = pageGroups[pageType] || [];
        // Group by page_area within this page_type
        const areaGroups = groupBy(pageRows, 'page_area');
        const areas = Object.entries(areaGroups)
            .map(([area, rows]) => ({ area, ...aggregateGroup(rows) }))
            .filter(a => a.views >= 100)
            .sort((a, b) => best ? b.ctr - a.ctr : a.ctr - b.ctr);

        const topArea = areas[0];
        if (!topArea) return null;

        // Find the best/worst strategy within that placement
        const areaRows = areaGroups[topArea.area] || [];
        const stratGroups = groupBy(areaRows, 'strategy');
        const strats = Object.entries(stratGroups)
            .map(([name, rows]) => ({ name, ...aggregateGroup(rows) }))
            .filter(s => s.views >= 50)
            .sort((a, b) => best ? b.ctr - a.ctr : a.ctr - b.ctr);

        return {
            placement: `${pageType} › ${topArea.area}`,
            placementCtr: topArea.ctr,
            placementViews: topArea.views,
            placementSales: topArea.sales,
            strategy: strats[0]?.name || 'Unknown',
            strategyCtr: strats[0]?.ctr || 0,
            strategyViews: strats[0]?.views || 0,
            strategySales: strats[0]?.sales || 0,
        };
    }

    return {
        top: topPages.map(p => ({
            page: p.name,
            ctr: p.ctr,
            views: p.views,
            sales: p.sales,
            detail: getPlacementDetails(p.name, true),
        })),
        bottom: bottomPages.map(p => ({
            page: p.name,
            ctr: p.ctr,
            views: p.views,
            sales: p.sales,
            detail: getPlacementDetails(p.name, false),
        })),
    };
}

// ─── Function registry ───────────────────────────────────────────
const FUNCTIONS = {
    getKPISummary,
    getChannelPerformance,
    getPagePerformance,
    getStrategyFamilyPerformance,
    getStrategyPerformance,
    getStrategyTypePerformance,
    getTrendData,
    getMonthlyTrend,
    getCrossDimensional,
    getUnderperformers,
    getPageAreaPerformance,
    getStrategyByPageType,
    getStrategyPageAreaDetail,
    getPagePerformanceInsights,
};

// ─── Worker message handler ──────────────────────────────────────
let cachedData = null;

self.onmessage = (e) => {
    const { type, id, payload } = e.data;

    if (type === 'SET_DATA') {
        cachedData = payload;
        self.postMessage({ type: 'DATA_SET', id });
        return;
    }

    if (type === 'CALL') {
        const { fn, args = [] } = payload;
        const func = FUNCTIONS[fn];
        if (!func) {
            self.postMessage({ type: 'ERROR', id, error: `Unknown function: ${fn}` });
            return;
        }
        try {
            const result = func(cachedData, ...args);
            self.postMessage({ type: 'RESULT', id, result });
        } catch (err) {
            self.postMessage({ type: 'ERROR', id, error: err.message });
        }
        return;
    }
};
