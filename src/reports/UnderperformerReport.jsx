import { useState, useMemo } from 'react';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';
import { useWorkerData } from '../utils/useWorkerData';
import { formatNumber, formatCurrency, formatPercent, formatCompact } from '../utils/formatters';

export default function UnderperformerReport({ data }) {
    const [viewThreshold, setViewThreshold] = useState(1000);
    const [strategyFilter, setStrategyFilter] = useState('all');

    const { result: underperformers, loading } = useWorkerData(data, 'getUnderperformers', viewThreshold);

    // Extract unique strategies for the filter dropdown
    const strategies = useMemo(() => {
        if (!underperformers) return [];
        return [...new Set(underperformers.map(u => u.strategy).filter(Boolean))].sort();
    }, [underperformers]);

    // Apply strategy filter
    const filtered = useMemo(() => {
        if (!underperformers) return [];
        if (strategyFilter === 'all') return underperformers;
        return underperformers.filter(u => u.strategy === strategyFilter);
    }, [underperformers, strategyFilter]);

    if (loading || !underperformers) {
        return (
            <div className="report-loading">
                <div className="spinner" />
                <p className="report-loading__text">Finding underperformers…</p>
            </div>
        );
    }

    const zeroClickCount = filtered.filter(u => u.issues.includes('Zero Clicks')).length;
    const zeroSalesCount = filtered.filter(u => u.issues.includes('Zero Sales')).length;
    const lowCTRCount = filtered.filter(u => u.issues.includes('Very Low CTR')).length;
    const totalWastedViews = filtered
        .filter(u => u.issues.includes('Zero Clicks'))
        .reduce((sum, u) => sum + u.views, 0);

    const columns = [
        { key: 'strategy', label: 'Strategy', align: 'left' },
        { key: 'page_type', label: 'Page Type', align: 'left' },
        { key: 'channel', label: 'Channel', align: 'left' },
        { key: 'views', label: 'Views', render: (v) => formatCompact(v) },
        { key: 'clicks', label: 'Clicks', render: (v) => formatCompact(v) },
        { key: 'ctr', label: 'CTR', render: (v) => formatPercent(v) },
        { key: 'sales', label: 'Attributable Sales', render: (v) => formatCompact(v) },
        {
            key: 'issues', label: 'Issues', align: 'left',
            render: (issues) => (
                <div className="issue-badges">
                    {issues.map((issue, i) => (
                        <span key={i} className={`issue-badge issue-badge--${issue.replace(/\s+/g, '-').toLowerCase()}`}>
                            {issue}
                        </span>
                    ))}
                </div>
            )
        },
    ];

    return (
        <div className="report-page">
            <h2 className="report-title">Under Performance Report</h2>
            <p className="report-subtitle">Items with high visibility but low engagement or conversion</p>

            <div className="controls-bar">
                <div className="control-group">
                    <label className="control-label">Min. Views Threshold</label>
                    <select className="control-select" value={viewThreshold} onChange={(e) => setViewThreshold(Number(e.target.value))}>
                        <option value={100}>100+</option>
                        <option value={500}>500+</option>
                        <option value={1000}>1,000+</option>
                        <option value={5000}>5,000+</option>
                        <option value={10000}>10,000+</option>
                        <option value={50000}>50,000+</option>
                    </select>
                </div>
                <div className="control-group">
                    <label className="control-label">Strategy</label>
                    <select className="control-select" value={strategyFilter} onChange={(e) => setStrategyFilter(e.target.value)}>
                        <option value="all">All Strategies ({strategies.length})</option>
                        {strategies.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="kpi-grid kpi-grid--4col">
                <KPICard
                    icon="🚫"
                    label="Zero-Click Items"
                    value={zeroClickCount}
                    subtitle="Strategies with no clicks"
                    className="kpi-card--danger"
                />
                <KPICard
                    icon="💸"
                    label="Zero-Sales Items"
                    value={zeroSalesCount}
                    subtitle="Clicks but no revenue"
                    className="kpi-card--warning"
                />
                <KPICard
                    icon="📉"
                    label="Very Low CTR"
                    value={lowCTRCount}
                    subtitle="CTR below 0.1%"
                    className="kpi-card--warning"
                />
                <KPICard
                    icon="👁️"
                    label="Wasted Views"
                    value={formatCompact(totalWastedViews)}
                    subtitle="Views with zero clicks"
                    className="kpi-card--danger"
                />
            </div>

            <ChartCard title={`Underperforming Items (${filtered.length} found)`} subtitle={`Threshold: ${formatNumber(viewThreshold)}+ views${strategyFilter !== 'all' ? ` · Strategy: ${strategyFilter}` : ''}`}>
                <DataTable columns={columns} data={filtered} defaultSortKey="views" maxRows={100} />
            </ChartCard>
        </div>
    );
}
