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
];

function getHeatColor(value, maxVal, colorScale) {
    if (value == null || maxVal === 0) return 'transparent';
    const intensity = Math.min(value / maxVal, 1);
    const alpha = 0.1 + intensity * 0.75;

    const scales = {
        blue: `rgba(99, 102, 241, ${alpha})`,
        cyan: `rgba(6, 182, 212, ${alpha})`,
        amber: `rgba(245, 158, 11, ${alpha})`,
        green: `rgba(16, 185, 129, ${alpha})`,
    };
    return scales[colorScale] || scales.blue;
}

export default function CrossDimensional({ data }) {
    const [dim1, setDim1] = useState('channel');
    const [dim2, setDim2] = useState('page_type');
    const [metric, setMetric] = useState('ctr');

    const { result, loading } = useWorkerData(data, 'getCrossDimensional', dim1, dim2, metric);

    const metricConfig = METRICS.find(m => m.key === metric) || METRICS[0];

    const maxVal = useMemo(() => {
        if (!result) return 0;
        let max = 0;
        for (const row of result.matrix) {
            for (const col of result.dim2Values) {
                if (row[col] != null && row[col] > max) max = row[col];
            }
        }
        return max;
    }, [result]);

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
                                </tr>
                            </thead>
                            <tbody>
                                {result.matrix.map((row, i) => (
                                    <tr key={i}>
                                        <td className="heatmap-td heatmap-td--label">{row.name}</td>
                                        {result.dim2Values.map(col => (
                                            <td
                                                key={col}
                                                className="heatmap-td heatmap-td--value"
                                                style={{ backgroundColor: getHeatColor(row[col], maxVal, metricConfig.colorScale) }}
                                            >
                                                {row[col] != null ? metricConfig.format(row[col]) : '—'}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </ChartCard>
        </div>
    );
}
