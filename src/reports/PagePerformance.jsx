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

    const ctrData = useMemo(() =>
        pages ? [...pages].sort((a, b) => b.ctr - a.ctr) : [],
        [pages]
    );

    const pieData = useMemo(() =>
        pages ? pages.filter(p => p.sales > 0).map((p, i) => ({ ...p, fill: COLORS[i % COLORS.length] })) : [],
        [pages]
    );

    const columns = [
        { key: 'name', label: 'Page Type', align: 'left' },
        { key: 'views', label: 'Views', render: (v) => formatCompact(v) },
        { key: 'clicks', label: 'Clicks', render: (v) => formatCompact(v) },
        { key: 'ctr', label: 'CTR', render: (v) => formatPercent(v) },
        { key: 'sales', label: 'Attributable Sales', render: (v) => formatCompact(v) },
        { key: 'orders', label: 'Attributable Orders', render: (v) => formatNumber(v) },
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
            <p className="report-subtitle">Performance metrics by page type</p>

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
                            <Bar dataKey="ctr" fill="#06b6d4" radius={[0, 4, 4, 0]}>
                                {ctrData.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                                {showCtrLabels && <LabelList dataKey="ctr" position="right" fontSize={10} fill="#64748b" formatter={(v) => v.toFixed(1) + '%'} />}
                            </Bar>
                        </BarChart>
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
                            <Pie data={pieData} dataKey="sales" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={showSalesLabels ? (e) => `${e.name}: ${formatCompact(e.sales)}` : (e) => e.name}>
                                {pieData.map((entry, i) => (
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

            <ChartCard title="Page Type Details">
                <DataTable columns={columns} data={pages} defaultSortKey="views" />
            </ChartCard>
        </div>
    );
}
