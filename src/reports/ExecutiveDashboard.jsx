import { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import { useWorkerData } from '../utils/useWorkerData';
import { formatNumber, formatCurrency, formatPercent, formatCompact } from '../utils/formatters';

const COLORS = {
    views: '#6366f1',
    clicks: '#06b6d4',
    sales: '#10b981',
    ctr: '#f59e0b',
    orders: '#ef4444',
};

const GRANULARITIES = ['daily', 'monthly', 'quarterly'];
const CHART_TYPES = ['line', 'bar'];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDateLabel(dateStr, granularity) {
    if (granularity === 'monthly' && dateStr.length === 7) {
        const [year, month] = dateStr.split('-');
        return `${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`;
    }
    if (granularity === 'quarterly' && dateStr.includes('-Q')) {
        const [year, quarter] = dateStr.split('-');
        return `${quarter} ${year}`;
    }
    if (dateStr.length >= 10) {
        const [, month, day] = dateStr.split('-');
        return `${MONTH_NAMES[parseInt(month, 10) - 1]} ${parseInt(day, 10)}`;
    }
    return dateStr;
}

function formatHeaderDate(dateStr) {
    if (!dateStr || dateStr.length < 10) return dateStr || '';
    const [year, month, day] = dateStr.split('-');
    return `${parseInt(day, 10)}-${MONTH_NAMES[parseInt(month, 10) - 1]}-${year.slice(2)}`;
}

function GranularityToggle({ value, onChange }) {
    return (
        <div className="granularity-toggle" style={{ marginBottom: 0 }}>
            {GRANULARITIES.map(g => (
                <button
                    key={g}
                    className={`toggle-btn ${value === g ? 'toggle-btn--active' : ''}`}
                    onClick={() => onChange(g)}
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                >
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
            ))}
        </div>
    );
}

function ChartTypeToggle({ value, onChange }) {
    return (
        <div className="granularity-toggle" style={{ marginBottom: 0 }}>
            {CHART_TYPES.map(t => (
                <button
                    key={t}
                    className={`toggle-btn ${value === t ? 'toggle-btn--active' : ''}`}
                    onClick={() => onChange(t)}
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                >
                    {t === 'line' ? '📈' : '📊'}
                </button>
            ))}
        </div>
    );
}

function ChartContent({ trend, chartType, dataKey, color, showLabels, xTickFormatter, yTickFormatter, labelFormatter, formatter, title, granularity, height = 280 }) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            {chartType === 'bar' ? (
                <BarChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickFormatter={xTickFormatter} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={yTickFormatter} />
                    <Tooltip
                        contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }}
                        labelStyle={{ color: '#94a3b8' }}
                        labelFormatter={(d) => formatDateLabel(d, granularity)}
                        formatter={(v) => [formatter(v), title]}
                    />
                    <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]}>
                        {showLabels && <LabelList dataKey={dataKey} position="top" fontSize={9} fill="#64748b" formatter={labelFormatter} />}
                    </Bar>
                </BarChart>
            ) : (
                <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickFormatter={xTickFormatter} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={yTickFormatter} />
                    <Tooltip
                        contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }}
                        labelStyle={{ color: '#94a3b8' }}
                        labelFormatter={(d) => formatDateLabel(d, granularity)}
                        formatter={(v) => [formatter(v), title]}
                    />
                    <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={granularity !== 'daily'} activeDot={{ r: 4 }}>
                        {showLabels && <LabelList dataKey={dataKey} position="top" fontSize={9} fill="#64748b" formatter={labelFormatter} />}
                    </Line>
                </LineChart>
            )}
        </ResponsiveContainer>
    );
}

function TrendChart({ data, title, dataKey, color, formatter, granularity, onGranularityChange }) {
    const [chartType, setChartType] = useState('line');
    const [showLabels, setShowLabels] = useState(false);
    const [zoomed, setZoomed] = useState(false);
    const { result: trend, loading } = useWorkerData(data, 'getTrendData', granularity);

    const yTickFormatter = formatter === formatPercent ? (v) => v.toFixed(1) + '%' : formatCompact;
    const xTickFormatter = (d) => formatDateLabel(d, granularity);
    const labelFormatter = formatter === formatPercent ? (v) => v.toFixed(1) + '%' : formatCompact;

    const chartProps = { trend, chartType, dataKey, color, showLabels, xTickFormatter, yTickFormatter, labelFormatter, formatter, title, granularity };

    return (
        <>
            <ChartCard
                title={title}
                subtitle={
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button
                            className="toggle-btn"
                            onClick={() => setZoomed(true)}
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                            title="Expand chart"
                        >
                            🔍
                        </button>
                        <button
                            className={`toggle-btn ${showLabels ? 'toggle-btn--active' : ''}`}
                            onClick={() => setShowLabels(prev => !prev)}
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                            title="Toggle data labels"
                        >
                            🏷️
                        </button>
                        <ChartTypeToggle value={chartType} onChange={setChartType} />
                        <GranularityToggle value={granularity} onChange={onGranularityChange} />
                    </div>
                }
            >
                {loading || !trend ? (
                    <div className="report-loading"><div className="spinner" /></div>
                ) : (
                    <ChartContent {...chartProps} height={280} />
                )}
            </ChartCard>

            {zoomed && trend && (
                <div className="chart-zoom-overlay" onClick={() => setZoomed(false)}>
                    <div className="chart-zoom-container" onClick={(e) => e.stopPropagation()}>
                        <div className="chart-zoom-header">
                            <h3>{title}</h3>
                            <button className="chart-zoom-close" onClick={() => setZoomed(false)}>✕</button>
                        </div>
                        <ChartContent {...chartProps} height={500} />
                    </div>
                </div>
            )}
        </>
    );
}

function InsightCard({ item, idx, type }) {
    const isTop = type === 'top';
    const accent = isTop ? '#16a34a' : '#dc2626';
    const labelBg = isTop ? '#16a34a' : '#dc2626';
    const placementLabel = isTop ? 'Best Placement' : 'Weakest Placement';
    const strategyLabel = isTop ? 'Winning Strategy' : 'Strategy to Review';

    return (
        <div style={{
            background: 'rgba(255,255,255,0.8)',
            borderRadius: 10,
            padding: '1rem',
            marginBottom: '0.75rem',
            border: `1px solid ${isTop ? 'rgba(22, 163, 74, 0.15)' : 'rgba(153, 27, 27, 0.12)'}`,
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <span style={{ fontWeight: 600, color: isTop ? '#166534' : '#991b1b', fontSize: '0.9rem' }}>
                    {idx + 1}. {item.page}
                </span>
                <span style={{
                    background: labelBg,
                    color: '#fff',
                    padding: '0.2rem 0.6rem',
                    borderRadius: 20,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                }}>
                    CTR {formatPercent(item.ctr)}
                </span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: '#475569', marginBottom: '0.5rem' }}>
                <span>👁️ {formatCompact(item.views)} views</span>
                <span>💰 {formatCompact(item.sales)} sales</span>
            </div>
            {item.detail && (
                <div style={{ borderTop: `1px dashed ${isTop ? 'rgba(22, 163, 74, 0.2)' : 'rgba(153, 27, 27, 0.15)'}`, paddingTop: '0.5rem', fontSize: '0.78rem', color: '#334155' }}>
                    <div style={{ marginBottom: '0.3rem' }}>
                        <span style={{ color: '#94a3b8' }}>{placementLabel}:</span>{' '}
                        <strong>{item.detail.placement}</strong>
                        <span style={{ color: accent, marginLeft: '0.4rem' }}>({formatPercent(item.detail.placementCtr)} CTR)</span>
                    </div>
                    <div>
                        <span style={{ color: '#94a3b8' }}>{strategyLabel}:</span>{' '}
                        <strong>{item.detail.strategy}</strong>
                        <span style={{ color: accent, marginLeft: '0.4rem' }}>({formatPercent(item.detail.strategyCtr)} CTR · {formatCompact(item.detail.strategySales)} sales)</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ExecutiveDashboard({ data }) {
    const { result: kpi, loading: kpiLoading } = useWorkerData(data, 'getKPISummary');
    const { result: insights, loading: insightsLoading } = useWorkerData(data, 'getPagePerformanceInsights');

    const [viewsGranularity, setViewsGranularity] = useState('daily');
    const [salesGranularity, setSalesGranularity] = useState('daily');
    const [ctrGranularity, setCtrGranularity] = useState('daily');
    const [ordersGranularity, setOrdersGranularity] = useState('daily');

    if (kpiLoading || !kpi) {
        return (
            <div className="report-loading">
                <div className="spinner" />
                <p className="report-loading__text">Crunching numbers…</p>
            </div>
        );
    }

    return (
        <div className="report-page">
            <h2 className="report-title">Executive Insights</h2>
            <p className="report-subtitle">
                {kpi.dateRange ? `${formatHeaderDate(kpi.dateRange.start)} — ${formatHeaderDate(kpi.dateRange.end)}` : ''}
                {kpi.uniqueDates ? ` · ${kpi.uniqueDates} days` : ''}
            </p>

            <div className="kpi-grid">
                <KPICard icon="👁️" label="Total Views" value={formatCompact(kpi.views)} subtitle={formatNumber(kpi.views)} trend={kpi.mom?.views} />
                <KPICard icon="🖱️" label="Total Clicks" value={formatCompact(kpi.clicks)} subtitle={formatNumber(kpi.clicks)} trend={kpi.mom?.clicks} />
                <KPICard icon="📊" label="Overall CTR" value={formatPercent(kpi.ctr)} subtitle={`${formatNumber(kpi.clicks)} / ${formatNumber(kpi.views)}`} trend={kpi.mom?.ctr} />
                <KPICard icon="💰" label="Attributable Sales" value={formatCompact(kpi.sales)} subtitle={formatCurrency(kpi.sales)} trend={kpi.mom?.sales} />
                <KPICard icon="📦" label="Attributable Orders" value={formatCompact(kpi.orders)} subtitle={formatNumber(kpi.orders)} trend={kpi.mom?.orders} />
                <KPICard icon="💵" label="Revenue / Click" value={formatCurrency(kpi.rpc)} subtitle="Per click revenue" trend={kpi.mom?.rpc} />
                <KPICard icon="🎯" label="Conversion Rate" value={formatPercent(kpi.conversionRate)} subtitle={`${formatNumber(kpi.orders)} orders / ${formatNumber(kpi.clicks)} clicks`} />
                <KPICard icon="🛒" label="Avg Order Value" value={formatCurrency(kpi.aov)} subtitle="Per order revenue" />
                <KPICard icon="📦" label="Items / Order" value={kpi.itemsPerOrder.toFixed(1)} subtitle={`${formatNumber(kpi.items)} items total`} />
                <KPICard icon="🧪" label="Active Strategies" value={kpi.uniqueStrategies} subtitle={`${kpi.uniquePages} page types · ${kpi.uniqueChannels} channels`} />
            </div>

            {/* ── Quick Highlights ── */}
            <div style={{
                display: 'flex', gap: '1rem', flexWrap: 'wrap',
                margin: '1rem 0 0.5rem',
            }}>
                {kpi.topChannel && (
                    <div style={{
                        flex: '1 1 280px',
                        background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                        border: '1px solid #bfdbfe',
                        borderRadius: 10,
                        padding: '0.75rem 1rem',
                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                    }}>
                        <span style={{ fontSize: '1.2rem' }}>📱</span>
                        <div style={{ fontSize: '0.82rem', color: '#1e40af' }}>
                            <strong>{kpi.topChannel}</strong> drives <strong>{kpi.topChannelPct.toFixed(0)}%</strong> of attributable sales
                        </div>
                    </div>
                )}
                {kpi.bestStrategy && (
                    <div style={{
                        flex: '1 1 280px',
                        background: 'linear-gradient(135deg, #faf5ff, #ede9fe)',
                        border: '1px solid #ddd6fe',
                        borderRadius: 10,
                        padding: '0.75rem 1rem',
                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                    }}>
                        <span style={{ fontSize: '1.2rem' }}>⚡</span>
                        <div style={{ fontSize: '0.82rem', color: '#6d28d9' }}>
                            <strong>{kpi.bestStrategy}</strong> has the highest RPC at <strong>{formatCurrency(kpi.bestRpc)}</strong>
                        </div>
                    </div>
                )}
            </div>            <div className="chart-grid chart-grid--2col">
                <TrendChart
                    data={data}
                    title="Rec Views"
                    dataKey="views"
                    color={COLORS.views}
                    formatter={formatNumber}
                    granularity={viewsGranularity}
                    onGranularityChange={setViewsGranularity}
                />
                <TrendChart
                    data={data}
                    title="Attributable Sales"
                    dataKey="sales"
                    color={COLORS.sales}
                    formatter={formatCurrency}
                    granularity={salesGranularity}
                    onGranularityChange={setSalesGranularity}
                />
                <TrendChart
                    data={data}
                    title="CTR"
                    dataKey="ctr"
                    color={COLORS.ctr}
                    formatter={formatPercent}
                    granularity={ctrGranularity}
                    onGranularityChange={setCtrGranularity}
                />
                <TrendChart
                    data={data}
                    title="Attributable Orders"
                    dataKey="orders"
                    color={COLORS.orders}
                    formatter={formatNumber}
                    granularity={ordersGranularity}
                    onGranularityChange={setOrdersGranularity}
                />
            </div>

            {/* ── Performance Insights ── */}
            {insights && (
                <div style={{ marginTop: '2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', color: '#334155', fontWeight: 600, marginBottom: '1rem' }}>
                        💡 Performance Insights
                    </h3>

                    <div className="chart-grid chart-grid--2col" style={{ gap: '1.5rem' }}>
                        {/* Top Performing Pages */}
                        <div style={{
                            background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                            border: '1px solid #bbf7d0',
                            borderRadius: 12,
                            padding: '1.25rem',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>🏆</span>
                                <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#166534', fontWeight: 600 }}>
                                    Top Performing Pages by CTR
                                </h4>
                            </div>
                            {insights.top.map((item, idx) => (
                                <InsightCard key={idx} item={item} idx={idx} type="top" />
                            ))}
                        </div>

                        {/* Bottom Performing Pages */}
                        <div style={{
                            background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                            border: '1px solid #fecaca',
                            borderRadius: 12,
                            padding: '1.25rem',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                                <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#991b1b', fontWeight: 600 }}>
                                    Underperforming Pages by CTR
                                </h4>
                            </div>
                            {insights.bottom.map((item, idx) => (
                                <InsightCard key={idx} item={item} idx={idx} type="bottom" />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
