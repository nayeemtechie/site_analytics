import { useMemo, useState } from 'react';
import ChartCard from '../components/ChartCard';
import { useWorkerData } from '../utils/useWorkerData';
import { formatNumber, formatCurrency, formatPercent, formatCompact } from '../utils/formatters';

const DIMENSIONS = [
    { key: 'channel', label: 'Channel' },
    { key: 'page_type', label: 'Page Type' },
    { key: 'strategy_family', label: 'Strategy Family' },
    { key: 'strategy_type', label: 'Strategy Type' },
];

const METRICS = [
    { key: 'views', label: 'Views', format: formatCompact, colorScale: 'blue' },
    { key: 'clicks', label: 'Clicks', format: formatCompact, colorScale: 'cyan' },
    { key: 'ctr', label: 'CTR (%)', format: formatPercent, colorScale: 'amber' },
    { key: 'sales', label: 'Attributable Sales ($)', format: formatCurrency, colorScale: 'green' },
    { key: 'orders', label: 'Rec Orders', format: formatNumber, colorScale: 'red' },
    { key: 'revenuePerClick', label: 'Rev / Click ($)', format: formatCurrency, colorScale: 'purple' },
];

const SCALE_COLORS = {
    blue: { rgb: '99, 102, 241', label: '#6366f1' },
    cyan: { rgb: '6, 182, 212', label: '#06b6d4' },
    amber: { rgb: '245, 158, 11', label: '#f59e0b' },
    green: { rgb: '16, 185, 129', label: '#10b981' },
    red: { rgb: '239, 68, 68', label: '#ef4444' },
    purple: { rgb: '139, 92, 246', label: '#8b5cf6' },
};

function getHeatColor(value, maxVal, colorScale) {
    if (value == null || maxVal === 0) return 'transparent';
    const intensity = Math.min(value / maxVal, 1);
    const alpha = 0.1 + intensity * 0.75;
    const scale = SCALE_COLORS[colorScale] || SCALE_COLORS.blue;
    return `rgba(${scale.rgb}, ${alpha})`;
}

function ColorLegend({ metricConfig, minVal, maxVal }) {
    const scale = SCALE_COLORS[metricConfig.colorScale] || SCALE_COLORS.blue;
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            margin: '0.75rem 0', fontSize: '0.75rem', color: '#64748b',
        }}>
            <span>{metricConfig.format(minVal)}</span>
            <div style={{
                flex: '0 0 160px', height: 12, borderRadius: 6,
                background: `linear-gradient(to right, rgba(${scale.rgb}, 0.1), rgba(${scale.rgb}, 0.85))`,
                border: '1px solid rgba(0,0,0,0.06)',
            }} />
            <span>{metricConfig.format(maxVal)}</span>
            <span style={{ marginLeft: '0.5rem', fontStyle: 'italic', color: '#94a3b8' }}>
                {metricConfig.label}
            </span>
        </div>
    );
}

export default function CrossDimensional({ data }) {
    const [dim1, setDim1] = useState('channel');
    const [dim2, setDim2] = useState('page_type');
    const [metric, setMetric] = useState('ctr');

    const { result, loading } = useWorkerData(data, 'getCrossDimensional', dim1, dim2, metric);

    const metricConfig = METRICS.find(m => m.key === metric) || METRICS[0];

    const { maxVal, minVal, minCell, maxCell, sortedMatrix, colTotals } = useMemo(() => {
        if (!result) return { maxVal: 0, minVal: 0, minCell: null, maxCell: null, sortedMatrix: [], colTotals: {} };

        let max = -Infinity, min = Infinity;
        let minC = null, maxC = null;
        const totals = {};

        // Initialize column totals
        for (const col of result.dim2Values) {
            totals[col] = { sum: 0, count: 0 };
        }

        for (const row of result.matrix) {
            for (const col of result.dim2Values) {
                const v = row[col];
                if (v != null) {
                    if (v > max) { max = v; maxC = { row: row.name, col }; }
                    if (v < min) { min = v; minC = { row: row.name, col }; }
                    totals[col].sum += v;
                    totals[col].count += 1;
                }
            }
        }

        if (max === -Infinity) max = 0;
        if (min === Infinity) min = 0;

        // Compute row totals and sort by them
        const isRate = metric === 'ctr' || metric === 'revenuePerClick';
        const withTotals = result.matrix.map(row => {
            let sum = 0, count = 0;
            for (const col of result.dim2Values) {
                if (row[col] != null) { sum += row[col]; count++; }
            }
            return { ...row, _total: isRate ? (count > 0 ? sum / count : 0) : sum };
        });
        const sorted = [...withTotals].sort((a, b) => b._total - a._total);

        // Compute column totals
        const colTotalRow = {};
        for (const col of result.dim2Values) {
            colTotalRow[col] = isRate
                ? (totals[col].count > 0 ? totals[col].sum / totals[col].count : 0)
                : totals[col].sum;
        }

        return { maxVal: max, minVal: min, minCell: minC, maxCell: maxC, sortedMatrix: sorted, colTotals: colTotalRow };
    }, [result, metric]);

    return (
        <div className="report-page">
            <h2 className="report-title">Cross-Dimensional Heatmap</h2>
            <p className="report-subtitle">Explore performance across two dimensions</p>

            <div className="controls-bar">
                <div className="control-group">
                    <label className="control-label">Rows</label>
                    <select className="control-select" value={dim1} onChange={(e) => setDim1(e.target.value)}>
                        {DIMENSIONS.filter(d => d.key !== dim2).map(d => (
                            <option key={d.key} value={d.key}>{d.label}</option>
                        ))}
                    </select>
                </div>
                <div className="control-group">
                    <label className="control-label">Columns</label>
                    <select className="control-select" value={dim2} onChange={(e) => setDim2(e.target.value)}>
                        {DIMENSIONS.filter(d => d.key !== dim1).map(d => (
                            <option key={d.key} value={d.key}>{d.label}</option>
                        ))}
                    </select>
                </div>
                <div className="control-group">
                    <label className="control-label">Metric</label>
                    <select className="control-select" value={metric} onChange={(e) => setMetric(e.target.value)}>
                        {METRICS.map(m => (
                            <option key={m.key} value={m.key}>{m.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <ChartCard title={`${DIMENSIONS.find(d => d.key === dim1)?.label} × ${DIMENSIONS.find(d => d.key === dim2)?.label} — ${metricConfig.label}`} zoomable>
                {loading || !result ? (
                    <div className="report-loading"><div className="spinner" /></div>
                ) : (
                    <>
                        <ColorLegend metricConfig={metricConfig} minVal={minVal} maxVal={maxVal} />
                        <div className="heatmap-wrapper">
                            <table className="heatmap-table">
                                <thead>
                                    <tr>
                                        <th className="heatmap-th heatmap-th--corner">
                                            {DIMENSIONS.find(d => d.key === dim1)?.label}
                                        </th>
                                        {result.dim2Values.map(col => (
                                            <th key={col} className="heatmap-th">{col}</th>
                                        ))}
                                        <th className="heatmap-th" style={{ background: '#f1f5f9', fontWeight: 700, fontSize: '0.72rem' }}>
                                            {metric === 'ctr' || metric === 'revenuePerClick' ? 'Avg' : 'Total'}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedMatrix.map((row, i) => (
                                        <tr key={i}>
                                            <td className="heatmap-td heatmap-td--label">{row.name}</td>
                                            {result.dim2Values.map(col => {
                                                const isMax = maxCell && maxCell.row === row.name && maxCell.col === col;
                                                const isMin = minCell && minCell.row === row.name && minCell.col === col;
                                                return (
                                                    <td
                                                        key={col}
                                                        className="heatmap-td heatmap-td--value"
                                                        style={{
                                                            backgroundColor: getHeatColor(row[col], maxVal, metricConfig.colorScale),
                                                            fontWeight: isMax || isMin ? 700 : 400,
                                                            outline: isMax ? '2px solid #16a34a' : isMin ? '2px solid #dc2626' : 'none',
                                                            outlineOffset: '-1px',
                                                            borderRadius: isMax || isMin ? 3 : 0,
                                                        }}
                                                        title={isMax ? '⬆ Highest' : isMin ? '⬇ Lowest' : ''}
                                                    >
                                                        {row[col] != null ? metricConfig.format(row[col]) : '—'}
                                                    </td>
                                                );
                                            })}
                                            <td className="heatmap-td heatmap-td--value" style={{ background: '#f8fafc', fontWeight: 600, fontSize: '0.72rem' }}>
                                                {metricConfig.format(row._total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td className="heatmap-td heatmap-td--label" style={{ fontWeight: 700, background: '#f1f5f9', fontSize: '0.72rem' }}>
                                            {metric === 'ctr' || metric === 'revenuePerClick' ? 'Avg' : 'Total'}
                                        </td>
                                        {result.dim2Values.map(col => (
                                            <td key={col} className="heatmap-td heatmap-td--value" style={{ background: '#f1f5f9', fontWeight: 600, fontSize: '0.72rem' }}>
                                                {metricConfig.format(colTotals[col] || 0)}
                                            </td>
                                        ))}
                                        <td className="heatmap-td heatmap-td--value" style={{ background: '#e2e8f0', fontWeight: 700, fontSize: '0.72rem' }} />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </>
                )}
            </ChartCard>
        </div>
    );
}
