/**
 * Generic groupBy + aggregate utilities for report data.
 */

export function groupBy(data, key) {
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

// ─── Report-specific aggregators ─────────────────────────────────

export function getKPISummary(data) {
    const agg = aggregateGroup(data);
    const dates = [...new Set(data.map(r => r.date).filter(Boolean))].sort();
    return {
        ...agg,
        dateRange: dates.length > 0 ? { start: dates[0], end: dates[dates.length - 1] } : null,
        uniqueDates: dates.length,
        uniqueStrategies: new Set(data.map(r => r.strategy).filter(Boolean)).size,
        uniquePages: new Set(data.map(r => r.page_type).filter(Boolean)).size,
        uniqueChannels: new Set(data.map(r => r.channel).filter(Boolean)).size,
    };
}

export function getChannelPerformance(data) {
    return aggregateByKey(data, 'channel');
}

export function getPagePerformance(data) {
    return aggregateByKey(data, 'page_type');
}

export function getStrategyFamilyPerformance(data) {
    return aggregateByKey(data, 'strategy_family');
}

export function getStrategyPerformance(data) {
    return aggregateByKey(data, 'strategy');
}

export function getStrategyTypePerformance(data) {
    return aggregateByKey(data, 'strategy_type');
}

export function getTrendData(data, granularity = 'daily') {
    // Group by date first
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

function getWeekKey(dateStr) {
    const d = new Date(dateStr);
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function getMonthKey(dateStr) {
    return dateStr.substring(0, 7); // YYYY-MM
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

export function getCrossDimensional(data, dim1, dim2, metric = 'ctr') {
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

export function getUnderperformers(data, viewThreshold = 1000) {
    // Group by strategy + page_type + channel
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

export function getMonthlyTrend(data) {
    return getTrendData(data, 'monthly');
}
