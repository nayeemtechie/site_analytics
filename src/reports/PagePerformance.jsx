import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LabelList } from 'recharts';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';
import { useWorkerData } from '../utils/useWorkerData';
import { formatNumber, formatCurrency, formatPercent, formatCompact } from '../utils/formatters';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function PagePerformance({ data }) {
    const { result: pages, loading } = useWorkerData(data, 'getPagePerformance');
    const [showCtrLabels, setShowCtrLabels] = useState(false);
    const [showSalesLabels, setShowSalesLabels] = useState(false);
    const [showRpcLabels, setShowRpcLabels] = useState(false);
    const [showViewsLabels, setShowViewsLabels] = useState(false);

    // KPI totals across all pages
    const kpi = useMemo(() => {
        if (!pages) return null;
        const views = pages.reduce((s, p) => s + p.views, 0);
        const clicks = pages.reduce((s, p) => s + p.clicks, 0);
        const sales = pages.reduce((s, p) => s + p.sales, 0);
        const orders = pages.reduce((s, p) => s + p.orders, 0);
        const items = pages.reduce((s, p) => s + p.items, 0);
        const ctr = views > 0 ? (clicks / views) * 100 : 0;
        const rpc = clicks > 0 ? sales / clicks : 0;
        const conversionRate = clicks > 0 ? (orders / clicks) * 100 : 0;
        const aov = orders > 0 ? sales / orders : 0;
        return { views, clicks, sales, orders, items, ctr, rpc, conversionRate, aov, pageCount: pages.length };
    }, [pages]);

    // Chart data
    const ctrData = useMemo(() =>
        pages ? [...pages].sort((a, b) => b.ctr - a.ctr) : [],
        [pages]
    );

    const rpcData = useMemo(() =>
        pages ? [...pages].filter(p => p.clicks >= 100).sort((a, b) => b.revenuePerClick - a.revenuePerClick) : [],
        [pages]
    );

    const salesPieData = useMemo(() =>
        pages ? pages.filter(p => p.sales > 0).map((p, i) => ({ ...p, fill: COLORS[i % COLORS.length] })) : [],
        [pages]
    );

    const viewsPieData = useMemo(() =>
        pages ? pages.filter(p => p.views > 0).map((p, i) => ({ ...p, fill: COLORS[i % COLORS.length] })) : [],
        [pages]
    );

    // Enhanced table columns
    const columns = [
        { key: 'name', label: 'Page Type', align: 'left' },
        { key: 'views', label: 'Views', render: (v) => formatCompact(v) },
        { key: 'clicks', label: 'Clicks', render: (v) => formatCompact(v) },
        { key: 'ctr', label: 'CTR', render: (v) => formatPercent(v) },
        { key: 'sales', label: 'Attributable Sales', render: (v) => formatCompact(v) },
        { key: 'orders', label: 'Attributable Orders', render: (v) => formatNumber(v) },
        { key: 'revenuePerClick', label: 'Rev/Click', render: (v) => formatCurrency(v) },
        { key: 'revenuePerView', label: 'Rev/View', render: (v) => '$' + v.toFixed(3) },
    ];

    if (loading || !pages) {
        return (
            <div className="report-loading">
                <div className="spinner" />
                <p className="report-loading__text">Analyzing page types…</p>
            </div>
        );
    }

    return (
        <div className="report-page">
            <h2 className="report-title">Page Performance</h2>
            <p className="report-subtitle">{kpi.pageCount} page types analyzed</p>

            {/* ── KPI Summary ── */}
            <div className="kpi-grid">
                <KPICard icon="👁️" label="Total Views" value={formatCompact(kpi.views)} subtitle={formatNumber(kpi.views)} />
                <KPICard icon="🖱️" label="Total Clicks" value={formatCompact(kpi.clicks)} subtitle={formatNumber(kpi.clicks)} />
                <KPICard icon="📊" label="Avg CTR" value={formatPercent(kpi.ctr)} subtitle={`Across ${kpi.pageCount} pages`} />
                <KPICard icon="💰" label="Total Sales" value={formatCompact(kpi.sales)} subtitle={formatCurrency(kpi.sales)} />
                <KPICard icon="💵" label="Revenue / Click" value={formatCurrency(kpi.rpc)} subtitle="Avg across all pages" />
                <KPICard icon="🎯" label="Conversion Rate" value={formatPercent(kpi.conversionRate)} subtitle={`${formatNumber(kpi.orders)} orders`} />
            </div>

            {/* ── Row 1: CTR & RPC ── */}
            <div className="chart-grid chart-grid--2col">
                <ChartCard
                    title="Click-Through Rate by Page Type"
                    zoomable
                    subtitle={
                        <button
                            className={`toggle-btn ${showCtrLabels ? 'toggle-btn--active' : ''}`}
                            onClick={() => setShowCtrLabels(prev => !prev)}
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                            title="Toggle data labels"
                        >
                            🏷️
                        </button>
                    }
                >
                    <ResponsiveContainer width="100%" height={340}>
                        <BarChart data={ctrData} layout="vertical" margin={{ left: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                            <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => v.toFixed(1) + '%'} />
                            <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={140} />
                            <Tooltip
                                contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }}
                                formatter={(v) => [formatPercent(v), 'CTR']}
                            />
                            <Bar dataKey="ctr" radius={[0, 4, 4, 0]}>
                                {ctrData.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                                {showCtrLabels && <LabelList dataKey="ctr" position="right" fontSize={10} fill="#64748b" formatter={(v) => v.toFixed(1) + '%'} />}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                    title="Revenue Per Click by Page Type"
                    zoomable
                    subtitle={
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <button
                                className={`toggle-btn ${showRpcLabels ? 'toggle-btn--active' : ''}`}
                                onClick={() => setShowRpcLabels(prev => !prev)}
                                style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                                title="Toggle data labels"
                            >
                                🏷️
                            </button>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Min 100 clicks</span>
                        </div>
                    }
                >
                    <ResponsiveContainer width="100%" height={340}>
                        <BarChart data={rpcData} layout="vertical" margin={{ left: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                            <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => '$' + v.toFixed(1)} />
                            <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={140} />
                            <Tooltip
                                contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }}
                                formatter={(v) => [formatCurrency(v), 'Rev/Click']}
                            />
                            <Bar dataKey="revenuePerClick" radius={[0, 4, 4, 0]}>
                                {rpcData.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                                {showRpcLabels && <LabelList dataKey="revenuePerClick" position="right" fontSize={10} fill="#64748b" formatter={(v) => '$' + v.toFixed(2)} />}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* ── Row 2: Views & Sales Distribution ── */}
            <div className="chart-grid chart-grid--2col">
                <ChartCard
                    title="Views Distribution by Page Type"
                    zoomable
                    subtitle={
                        <button
                            className={`toggle-btn ${showViewsLabels ? 'toggle-btn--active' : ''}`}
                            onClick={() => setShowViewsLabels(prev => !prev)}
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                            title="Toggle data labels"
                        >
                            🏷️
                        </button>
                    }
                >
                    <ResponsiveContainer width="100%" height={340}>
                        <PieChart>
                            <Pie data={viewsPieData} dataKey="views" nameKey="name" cx="50%" cy="50%" outerRadius={120}
                                label={showViewsLabels ? (e) => `${e.name}: ${(e.percent * 100).toFixed(1)}%` : (e) => `${e.name} ${(e.percent * 100).toFixed(1)}%`}
                                isAnimationActive={false}
                            >
                                {viewsPieData.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }}
                                formatter={(v) => [formatNumber(v), 'Views']}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                    title="Attributable Sales by Page Type"
                    zoomable
                    subtitle={
                        <button
                            className={`toggle-btn ${showSalesLabels ? 'toggle-btn--active' : ''}`}
                            onClick={() => setShowSalesLabels(prev => !prev)}
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                            title="Toggle data labels"
                        >
                            🏷️
                        </button>
                    }
                >
                    <ResponsiveContainer width="100%" height={340}>
                        <PieChart>
                            <Pie data={salesPieData} dataKey="sales" nameKey="name" cx="50%" cy="50%" outerRadius={120}
                                label={showSalesLabels ? (e) => `${e.name}: ${(e.percent * 100).toFixed(1)}%` : (e) => `${e.name} ${(e.percent * 100).toFixed(1)}%`}
                                isAnimationActive={false}
                            >
                                {salesPieData.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }}
                                formatter={(v) => [formatCurrency(v), 'Sales']}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* ── Detail Table ── */}
            <ChartCard title="Page Type Details" subtitle="Sortable · includes efficiency metrics">
                <DataTable columns={columns} data={pages} defaultSortKey="views" />
            </ChartCard>
        </div>
    );
}
