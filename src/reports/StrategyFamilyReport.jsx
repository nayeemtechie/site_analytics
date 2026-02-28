import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, LabelList } from 'recharts';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';
import { useWorkerData } from '../utils/useWorkerData';
import { formatNumber, formatCurrency, formatPercent, formatCompact } from '../utils/formatters';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function StrategyFamilyReport({ data }) {
    const { result: families, loading } = useWorkerData(data, 'getStrategyFamilyPerformance');
    const [showCtrLabels, setShowCtrLabels] = useState(false);
    const [showSalesLabels, setShowSalesLabels] = useState(false);

    const columns = [
        { key: 'name', label: 'Strategy Family', align: 'left' },
        { key: 'views', label: 'Views', render: (v) => formatCompact(v) },
        { key: 'clicks', label: 'Clicks', render: (v) => formatCompact(v) },
        { key: 'ctr', label: 'CTR', render: (v) => formatPercent(v) },
        { key: 'sales', label: 'Attributable Sales', render: (v) => formatCompact(v) },
        { key: 'orders', label: 'Attributable Orders', render: (v) => formatNumber(v) },
    ];

    if (loading || !families) {
        return (
            <div className="report-loading">
                <div className="spinner" />
                <p className="report-loading__text">Analyzing strategy families…</p>
            </div>
        );
    }

    return (
        <div className="report-page">
            <h2 className="report-title">Strategy Family Performance</h2>
            <p className="report-subtitle">Performance grouped by strategy family</p>

            <div className="chart-grid chart-grid--2col">
                <ChartCard
                    title="CTR by Strategy Family"
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
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={families}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} angle={-25} textAnchor="end" height={70} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => v.toFixed(1) + '%'} />
                            <Tooltip
                                contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }}
                                formatter={(v) => [formatPercent(v), 'CTR']}
                            />
                            <Bar dataKey="ctr" radius={[4, 4, 0, 0]}>
                                {families.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                                {showCtrLabels && <LabelList dataKey="ctr" position="top" fontSize={9} fill="#64748b" formatter={(v) => v.toFixed(1) + '%'} />}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                    title="Attributable Sales by Strategy Family"
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
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={families}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} angle={-25} textAnchor="end" height={70} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={formatCompact} />
                            <Tooltip
                                contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }}
                                formatter={(v) => [formatCurrency(v), 'Attributable Sales']}
                            />
                            <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                                {families.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                                {showSalesLabels && <LabelList dataKey="sales" position="top" fontSize={9} fill="#64748b" formatter={formatCompact} />}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            <ChartCard title="Strategy Family Details">
                <DataTable columns={columns} data={families} defaultSortKey="views" />
            </ChartCard>
        </div>
    );
}
