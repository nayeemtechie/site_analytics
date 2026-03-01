import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList } from 'recharts';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';
import { useWorkerData } from '../utils/useWorkerData';
import { formatNumber, formatCurrency, formatPercent, formatCompact } from '../utils/formatters';

const COLORS_PALETTE = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function ChannelPerformance({ data }) {
    const { result: channels, loading } = useWorkerData(data, 'getChannelPerformance');
    const [showBarLabels, setShowBarLabels] = useState(false);
    const [showPieLabels, setShowPieLabels] = useState(false);

    const pieData = useMemo(() =>
        channels ? channels.filter(c => c.sales > 0).map((c, i) => ({ ...c, fill: COLORS_PALETTE[i % COLORS_PALETTE.length] })) : [],
        [channels]
    );

    const columns = [
        { key: 'name', label: 'Channel', align: 'left' },
        { key: 'views', label: 'Views', render: (v) => formatCompact(v) },
        { key: 'clicks', label: 'Clicks', render: (v) => formatCompact(v) },
        { key: 'ctr', label: 'CTR', render: (v) => formatPercent(v) },
        { key: 'sales', label: 'Attributable Sales', render: (v) => formatCompact(v) },
        { key: 'orders', label: 'Attributable Orders', render: (v) => formatNumber(v) },
        { key: 'revenuePerClick', label: 'Rev/Click', render: (v) => formatCurrency(v) },
    ];

    if (loading || !channels) {
        return (
            <div className="report-loading">
                <div className="spinner" />
                <p className="report-loading__text">Analyzing channels…</p>
            </div>
        );
    }

    return (
        <div className="report-page">
            <h2 className="report-title">Channel Performance</h2>
            <p className="report-subtitle">Breakdown of recommendation metrics by channel</p>

            <div className="chart-grid chart-grid--2col">
                <ChartCard
                    title="Views & Clicks by Channel"
                    zoomable
                    subtitle={
                        <button
                            className={`toggle-btn ${showBarLabels ? 'toggle-btn--active' : ''}`}
                            onClick={() => setShowBarLabels(prev => !prev)}
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                            title="Toggle data labels"
                        >
                            🏷️
                        </button>
                    }
                >
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={channels} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                            <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={formatCompact} />
                            <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={90} />
                            <Tooltip
                                contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }}
                                formatter={(v, n) => [formatNumber(v), n]}
                            />
                            <Bar dataKey="views" name="Views" fill="#6366f1" radius={[0, 4, 4, 0]}>
                                {showBarLabels && <LabelList dataKey="views" position="right" fontSize={9} fill="#64748b" formatter={formatCompact} />}
                            </Bar>
                            <Bar dataKey="clicks" name="Clicks" fill="#06b6d4" radius={[0, 4, 4, 0]}>
                                {showBarLabels && <LabelList dataKey="clicks" position="right" fontSize={9} fill="#64748b" formatter={formatCompact} />}
                            </Bar>
                            <Legend />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                    title="Attributable Sales Distribution by Channel"
                    zoomable
                    subtitle={
                        <button
                            className={`toggle-btn ${showPieLabels ? 'toggle-btn--active' : ''}`}
                            onClick={() => setShowPieLabels(prev => !prev)}
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                            title="Toggle data labels"
                        >
                            🏷️
                        </button>
                    }
                >
                    <ResponsiveContainer width="100%" height={320}>
                        <PieChart>
                            <Pie data={pieData} dataKey="sales" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={showPieLabels ? (e) => `${e.name}: ${(e.percent * 100).toFixed(1)}%` : (e) => `${e.name} ${(e.percent * 100).toFixed(1)}%`}>
                                {pieData.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }}
                                formatter={(v) => [formatCurrency(v), 'Attributable Sales']}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            <ChartCard title="Channel Details">
                <DataTable columns={columns} data={channels} defaultSortKey="views" />
            </ChartCard>
        </div>
    );
}
