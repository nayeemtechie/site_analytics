import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';
import ChartCard from '../components/ChartCard';
import { useWorkerData } from '../utils/useWorkerData';
import { formatNumber, formatCurrency, formatPercent, formatCompact } from '../utils/formatters';

const METRICS = [
    { key: 'views', label: 'Rec Views', color: '#6366f1', format: formatNumber },
    { key: 'clicks', label: 'Rec Clicks', color: '#06b6d4', format: formatNumber },
    { key: 'sales', label: 'Attributable Sales', color: '#10b981', format: formatCurrency },
    { key: 'ctr', label: 'CTR (%)', color: '#f59e0b', format: formatPercent },
    { key: 'orders', label: 'Rec Orders', color: '#ef4444', format: formatNumber },
];

export default function TrendAnalysis({ data }) {
    const [granularity, setGranularity] = useState('daily');
    const [activeMetrics, setActiveMetrics] = useState(['views', 'clicks']);
    const [showLabels, setShowLabels] = useState(false);

    const { result: trend, loading } = useWorkerData(data, 'getTrendData', granularity);

    const toggleMetric = (key) => {
        setActiveMetrics(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const columns = [
        { key: 'date', label: granularity === 'daily' ? 'Date' : 'Period', align: 'left' },
        { key: 'views', label: 'Views', render: (v) => formatCompact(v) },
        { key: 'clicks', label: 'Clicks', render: (v) => formatCompact(v) },
        { key: 'ctr', label: 'CTR', render: (v) => formatPercent(v) },
        { key: 'sales', label: 'Attributable Sales', render: (v) => formatCompact(v) },
        { key: 'orders', label: 'Attributable Orders', render: (v) => formatNumber(v) },
    ];

    return (
        <div className="report-page">
            <h2 className="report-title">Trend Analysis</h2>
            <p className="report-subtitle">Time-series view of recommendation metrics</p>

            <div className="controls-bar">
                <div className="granularity-toggle">
                    {['daily', 'weekly', 'monthly'].map(g => (
                        <button
                            key={g}
                            className={`toggle-btn ${granularity === g ? 'toggle-btn--active' : ''}`}
                            onClick={() => setGranularity(g)}
                        >
                            {g.charAt(0).toUpperCase() + g.slice(1)}
                        </button>
                    ))}
                </div>
                <div className="metric-toggles">
                    {METRICS.map(m => (
                        <button
                            key={m.key}
                            className={`metric-btn ${activeMetrics.includes(m.key) ? 'metric-btn--active' : ''}`}
                            style={{
                                '--metric-color': m.color,
                                borderColor: activeMetrics.includes(m.key) ? m.color : 'transparent',
                            }}
                            onClick={() => toggleMetric(m.key)}
                        >
                            <span className="metric-btn__dot" style={{ background: m.color }} />
                            {m.label}
                        </button>
                    ))}
                </div>
            </div>

            <ChartCard
                title={`${granularity.charAt(0).toUpperCase() + granularity.slice(1)} Trends`}
                zoomable
                subtitle={
                    <button
                        className={`toggle-btn ${showLabels ? 'toggle-btn--active' : ''}`}
                        onClick={() => setShowLabels(prev => !prev)}
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                        title="Toggle data labels"
                    >
                        🏷️
                    </button>
                }
            >
                {loading || !trend ? (
                    <div className="report-loading"><div className="spinner" /></div>
                ) : (
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={trend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickFormatter={(d) => {
                                const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                if (granularity === 'monthly' && d.length === 7) {
                                    const [year, month] = d.split('-');
                                    return `${MONTHS[parseInt(month, 10) - 1]}-${year.slice(2)}`;
                                }
                                return d.length > 7 ? d.slice(5) : d;
                            }} />
                            {activeMetrics.map((key, idx) => {
                                const metric = METRICS.find(m => m.key === key);
                                return (
                                    <YAxis
                                        key={key}
                                        yAxisId={key}
                                        orientation={idx % 2 === 0 ? 'left' : 'right'}
                                        stroke={metric.color}
                                        fontSize={11}
                                        tickFormatter={key === 'ctr' ? (v) => v.toFixed(1) + '%' : formatCompact}
                                        hide={idx > 1}
                                    />
                                );
                            })}
                            <Tooltip
                                contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }}
                                labelStyle={{ color: '#94a3b8' }}
                                formatter={(v, name) => {
                                    const metric = METRICS.find(m => m.key === name);
                                    return [metric ? metric.format(v) : v, metric?.label || name];
                                }}
                            />
                            <Legend wrapperStyle={{ fontSize: '0.85rem', fontWeight: 500 }} />
                            {activeMetrics.map(key => {
                                const metric = METRICS.find(m => m.key === key);
                                return (
                                    <Line
                                        key={key}
                                        yAxisId={key}
                                        type="monotone"
                                        dataKey={key}
                                        name={metric.label}
                                        stroke={metric.color}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                    >
                                        {showLabels && <LabelList dataKey={key} position="top" fontSize={9} fill={metric.color} formatter={key === 'ctr' ? (v) => v.toFixed(1) + '%' : formatCompact} />}
                                    </Line>
                                );
                            })}
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </ChartCard>
        </div>
    );
}
