import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LabelList } from 'recharts';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';
import { useWorkerData } from '../utils/useWorkerData';
import { formatNumber, formatCurrency, formatPercent, formatCompact } from '../utils/formatters';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function StrategyTypeReport({ data }) {
    const { result: types, loading } = useWorkerData(data, 'getStrategyTypePerformance');
    const [showPieLabels, setShowPieLabels] = useState(false);
    const [showBarLabels, setShowBarLabels] = useState(false);

    const typeWithColor = useMemo(() =>
        types ? types.map((t, i) => ({ ...t, fill: COLORS[i % COLORS.length] })) : [],
        [types]
    );

    const columns = [
        { key: 'name', label: 'Strategy Type', align: 'left' },
        { key: 'views', label: 'Views', render: (v) => formatCompact(v) },
        { key: 'clicks', label: 'Clicks', render: (v) => formatCompact(v) },
        { key: 'ctr', label: 'CTR', render: (v) => formatPercent(v) },
        { key: 'sales', label: 'Attributable Sales', render: (v) => formatCompact(v) },
        { key: 'orders', label: 'Attributable Orders', render: (v) => formatNumber(v) },
    ];

    if (loading || !types) {
        return (
            <div className="report-loading">
                <div className="spinner" />
                <p className="report-loading__text">Analyzing strategy types…</p>
            </div>
        );
    }

    return (
        <div className="report-page">
            <h2 className="report-title">Strategy Type Report</h2>
            <p className="report-subtitle">Comparison across recommendation strategy types</p>

            <div className="chart-grid chart-grid--2col">
                <ChartCard
                    title="Views Distribution"
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
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={typeWithColor} dataKey="views" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={showPieLabels ? (e) => `${e.name}: ${formatCompact(e.views)}` : (e) => e.name}>
                                {typeWithColor.map((entry, i) => (
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
                    title="CTR & Attributable Sales Comparison"
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
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={typeWithColor}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                            <YAxis yAxisId="ctr" stroke="#06b6d4" fontSize={11} tickFormatter={(v) => v.toFixed(1) + '%'} />
                            <YAxis yAxisId="sales" orientation="right" stroke="#10b981" fontSize={11} tickFormatter={formatCompact} />
                            <Tooltip
                                contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }}
                                formatter={(v, name) => [name === 'ctr' ? formatPercent(v) : formatCurrency(v), name === 'ctr' ? 'CTR' : 'Attributable Sales']}
                            />
                            <Bar yAxisId="ctr" dataKey="ctr" name="ctr" fill="#06b6d4" radius={[4, 4, 0, 0]}>
                                {showBarLabels && <LabelList dataKey="ctr" position="top" fontSize={9} fill="#64748b" formatter={(v) => v.toFixed(1) + '%'} />}
                            </Bar>
                            <Bar yAxisId="sales" dataKey="sales" name="sales" fill="#10b981" radius={[4, 4, 0, 0]}>
                                {showBarLabels && <LabelList dataKey="sales" position="top" fontSize={9} fill="#64748b" formatter={formatCompact} />}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            <ChartCard title="Strategy Type Details">
                <DataTable columns={columns} data={types} defaultSortKey="views" />
            </ChartCard>
        </div>
    );
}
