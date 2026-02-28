import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';
import { useWorkerData } from '../utils/useWorkerData';
import { formatNumber, formatCurrency, formatPercent, formatCompact } from '../utils/formatters';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function StrategyDeepDive({ data }) {
    const { result: strategies, loading: stratLoading } = useWorkerData(data, 'getStrategyPerformance');
    const { result: pageAreas, loading: paLoading } = useWorkerData(data, 'getPageAreaPerformance');
    const { result: detail, loading: detailLoading } = useWorkerData(data, 'getStrategyPageAreaDetail');

    const [showSalesLabels, setShowSalesLabels] = useState(false);
    const [showCtrLabels, setShowCtrLabels] = useState(false);
    const [showPageAreaSalesLabels, setShowPageAreaSalesLabels] = useState(false);
    const [showPageAreaCtrLabels, setShowPageAreaCtrLabels] = useState(false);

    // Top 10 strategies by Attributable Sales
    const top10BySales = useMemo(() =>
        strategies ? [...strategies].sort((a, b) => b.sales - a.sales).slice(0, 10) : [],
        [strategies]
    );

    // Top 10 strategies by CTR (min 1000 views)
    const top10ByCTR = useMemo(() =>
        strategies ? strategies.filter(s => s.views >= 1000).sort((a, b) => b.ctr - a.ctr).slice(0, 10) : [],
        [strategies]
    );

    // Page Area data sorted by sales
    const pageAreaBySales = useMemo(() =>
        pageAreas ? [...pageAreas].sort((a, b) => b.sales - a.sales).slice(0, 10) : [],
        [pageAreas]
    );

    const pageAreaByCTR = useMemo(() =>
        pageAreas ? [...pageAreas].filter(p => p.views >= 1000).sort((a, b) => b.ctr - a.ctr).slice(0, 10) : [],
        [pageAreas]
    );

    // Strategy columns
    const strategyColumns = [
        { key: 'name', label: 'Strategy', align: 'left' },
        { key: 'views', label: 'Views', render: (v) => formatCompact(v) },
        { key: 'clicks', label: 'Clicks', render: (v) => formatCompact(v) },
        { key: 'ctr', label: 'CTR', render: (v) => formatPercent(v) },
        { key: 'sales', label: 'Attributable Sales', render: (v) => formatCompact(v) },
        { key: 'revenuePerClick', label: 'Rev/Click', render: (v) => formatCurrency(v) },
    ];

    // Detail breakdown columns
    const detailColumns = [
        { key: 'strategy', label: 'Strategy', align: 'left' },
        { key: 'page_type', label: 'Page Type', align: 'left' },
        { key: 'page_area', label: 'Page Area', align: 'left' },
        { key: 'views', label: 'Views', render: (v) => formatCompact(v) },
        { key: 'clicks', label: 'Clicks', render: (v) => formatCompact(v) },
        { key: 'ctr', label: 'CTR', render: (v) => formatPercent(v) },
        { key: 'sales', label: 'Attributable Sales', render: (v) => formatCompact(v) },
        { key: 'orders', label: 'Attributable Orders', render: (v) => formatNumber(v) },
        { key: 'revenuePerClick', label: 'Rev/Click', render: (v) => formatCurrency(v) },
    ];

    const [filterPageType, setFilterPageType] = useState('');
    const [filterPageArea, setFilterPageArea] = useState('');

    // Extract unique page types and page areas from detail data
    const uniquePageTypes = useMemo(() =>
        detail ? [...new Set(detail.map(d => d.page_type))].filter(Boolean).sort() : [],
        [detail]
    );
    const uniquePageAreas = useMemo(() => {
        if (!detail) return [];
        const filtered = filterPageType ? detail.filter(d => d.page_type === filterPageType) : detail;
        return [...new Set(filtered.map(d => d.page_area))].filter(Boolean).sort();
    }, [detail, filterPageType]);

    // Filtered detail data
    const filteredDetail = useMemo(() => {
        if (!detail) return [];
        let result = detail;
        if (filterPageType) result = result.filter(d => d.page_type === filterPageType);
        if (filterPageArea) result = result.filter(d => d.page_area === filterPageArea);
        return result;
    }, [detail, filterPageType, filterPageArea]);

    const loading = stratLoading || paLoading || detailLoading;

    if (loading || !strategies) {
        return (
            <div className="report-loading">
                <div className="spinner" />
                <p className="report-loading__text">Analyzing strategies…</p>
            </div>
        );
    }

    return (
        <div className="report-page">
            <h2 className="report-title">Strategy Deep Dive</h2>
            <p className="report-subtitle">{strategies.length} strategies · {pageAreas?.length || 0} page areas analyzed</p>

            {/* ── Strategy Performance ── */}
            <h3 className="report-section-title" style={{ margin: '1.5rem 0 0.75rem', fontSize: '1rem', color: '#475569', fontWeight: 600 }}>
                📊 Strategy Performance
            </h3>
            <div className="chart-grid chart-grid--2col">
                <ChartCard
                    title="Top 10 Strategies by Attributable Sales"
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
                    <ResponsiveContainer width="100%" height={360}>
                        <BarChart data={top10BySales} layout="vertical" margin={{ left: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                            <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={formatCompact} />
                            <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={200} />
                            <Tooltip
                                contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }}
                                formatter={(v) => [formatCurrency(v), 'Attributable Sales']}
                            />
                            <Bar dataKey="sales" radius={[0, 4, 4, 0]}>
                                {top10BySales.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                                {showSalesLabels && <LabelList dataKey="sales" position="right" fontSize={9} fill="#64748b" formatter={formatCompact} />}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                    title="Top 10 Strategies by CTR"
                    zoomable
                    subtitle={
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <button
                                className={`toggle-btn ${showCtrLabels ? 'toggle-btn--active' : ''}`}
                                onClick={() => setShowCtrLabels(prev => !prev)}
                                style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                                title="Toggle data labels"
                            >
                                🏷️
                            </button>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Min 1,000 views</span>
                        </div>
                    }
                >
                    <ResponsiveContainer width="100%" height={360}>
                        <BarChart data={top10ByCTR} layout="vertical" margin={{ left: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                            <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => v.toFixed(1) + '%'} />
                            <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={200} />
                            <Tooltip
                                contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }}
                                formatter={(v) => [formatPercent(v), 'CTR']}
                            />
                            <Bar dataKey="ctr" radius={[0, 4, 4, 0]}>
                                {top10ByCTR.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                                {showCtrLabels && <LabelList dataKey="ctr" position="right" fontSize={9} fill="#64748b" formatter={(v) => v.toFixed(1) + '%'} />}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* ── Page Area Performance ── */}
            {pageAreas && pageAreas.length > 0 && (
                <>
                    <h3 className="report-section-title" style={{ margin: '2rem 0 0.75rem', fontSize: '1rem', color: '#475569', fontWeight: 600 }}>
                        📍 Placement Performance
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400, marginLeft: '0.5rem' }}>
                            — Which placements drive the most engagement and revenue?
                        </span>
                    </h3>
                    <div className="chart-grid chart-grid--2col">
                        <ChartCard
                            title="Top 10 Placements by Attributable Sales"
                            zoomable
                            subtitle={
                                <button
                                    className={`toggle-btn ${showPageAreaSalesLabels ? 'toggle-btn--active' : ''}`}
                                    onClick={() => setShowPageAreaSalesLabels(prev => !prev)}
                                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                                    title="Toggle data labels"
                                >
                                    🏷️
                                </button>
                            }
                        >
                            <ResponsiveContainer width="100%" height={360}>
                                <BarChart data={pageAreaBySales} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                                    <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={formatCompact} />
                                    <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={160} />
                                    <Tooltip
                                        contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }}
                                        formatter={(v) => [formatCurrency(v), 'Attributable Sales']}
                                    />
                                    <Bar dataKey="sales" radius={[0, 4, 4, 0]}>
                                        {pageAreaBySales.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                        {showPageAreaSalesLabels && <LabelList dataKey="sales" position="right" fontSize={9} fill="#64748b" formatter={formatCompact} />}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard
                            title="Top 10 Placements by CTR"
                            zoomable
                            subtitle={
                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                    <button
                                        className={`toggle-btn ${showPageAreaCtrLabels ? 'toggle-btn--active' : ''}`}
                                        onClick={() => setShowPageAreaCtrLabels(prev => !prev)}
                                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                                        title="Toggle data labels"
                                    >
                                        🏷️
                                    </button>
                                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Min 1,000 views</span>
                                </div>
                            }
                        >
                            <ResponsiveContainer width="100%" height={360}>
                                <BarChart data={pageAreaByCTR} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                                    <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => v.toFixed(1) + '%'} />
                                    <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={160} />
                                    <Tooltip
                                        contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }}
                                        formatter={(v) => [formatPercent(v), 'CTR']}
                                    />
                                    <Bar dataKey="ctr" radius={[0, 4, 4, 0]}>
                                        {pageAreaByCTR.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                        {showPageAreaCtrLabels && <LabelList dataKey="ctr" position="right" fontSize={9} fill="#64748b" formatter={(v) => v.toFixed(1) + '%'} />}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>
                </>
            )}

            {/* ── Strategy × Placement Detail ── */}
            <h3 className="report-section-title" style={{ margin: '2rem 0 0.75rem', fontSize: '1rem', color: '#475569', fontWeight: 600 }}>
                🔍 Strategy × Placement Breakdown
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400, marginLeft: '0.5rem' }}>
                    — Identify which placements to optimize
                </span>
            </h3>

            <div className="controls-bar" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <select
                    value={filterPageType}
                    onChange={(e) => { setFilterPageType(e.target.value); setFilterPageArea(''); }}
                    style={{
                        padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0',
                        fontSize: '0.85rem', color: '#334155', background: '#fff', cursor: 'pointer',
                        minWidth: 160,
                    }}
                >
                    <option value="">All Page Types</option>
                    {uniquePageTypes.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                </select>

                <select
                    value={filterPageArea}
                    onChange={(e) => setFilterPageArea(e.target.value)}
                    style={{
                        padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0',
                        fontSize: '0.85rem', color: '#334155', background: '#fff', cursor: 'pointer',
                        minWidth: 160,
                    }}
                >
                    <option value="">All Page Areas</option>
                    {uniquePageAreas.map(pa => <option key={pa} value={pa}>{pa}</option>)}
                </select>

                {(filterPageType || filterPageArea) && (
                    <button
                        onClick={() => { setFilterPageType(''); setFilterPageArea(''); }}
                        className="toggle-btn"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                    >
                        ✕ Clear Filters
                    </button>
                )}
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {filteredDetail.length} {filteredDetail.length === 1 ? 'row' : 'rows'}
                </span>
            </div>

            <ChartCard title="Detailed Performance Breakdown">
                {detail ? (
                    <DataTable columns={detailColumns} data={filteredDetail} defaultSortKey="views" maxRows={100} />
                ) : (
                    <div className="report-loading"><div className="spinner" /></div>
                )}
            </ChartCard>

            {/* ── All Strategies Table ── */}
            <ChartCard title="All Strategies">
                <DataTable columns={strategyColumns} data={strategies} defaultSortKey="views" maxRows={50} />
            </ChartCard>
        </div>
    );
}
