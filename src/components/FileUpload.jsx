import { useState, useCallback } from 'react';
import { parseFile } from '../utils/fileParser';
import { formatFileSize } from '../utils/formatters';

const FEATURES = [
    { icon: '📄', title: '9 Report Views', desc: 'Executive dashboard, page, channel, strategy, trend analysis and more' },
    { icon: '📈', title: 'Interactive Charts', desc: 'Line & bar charts with zoom, data labels, and granularity toggles' },
    { icon: '⏱️', title: 'Time Aggregation', desc: 'Switch between daily, monthly, and quarterly views instantly' },
    { icon: '🔍', title: 'Deep-Dive Analysis', desc: 'Strategy families, types, cross-dimensional heatmaps' },
    { icon: '🚨', title: 'Underperformer Detection', desc: 'Automatically flags low CTR and zero-sales combinations' },
    { icon: '⚡', title: 'Fast Processing', desc: 'Web Worker handles 45K+ rows without freezing your browser' },
];

const STEPS = [
    { num: '1', text: 'Export the Site Analytics detailed report from your DXP dashboard' },
    { num: '2', text: 'Upload the .xlsx / .csv file using the drop zone below' },
    { num: '3', text: 'Explore 9 interactive report tabs with charts, KPIs, and tables' },
];

const HELP_SECTIONS = [
    {
        title: 'Supported File Format',
        content: 'Upload the "Site Analytics - Detailed Report" export from your DXP product recommendations dashboard. The file should contain columns like date, strategy, page_type, page_area, channel, views, clicks, sales, orders, and items. Files can be .xlsx, .xls, or .csv format.',
    },
    {
        title: 'Available Reports',
        content: 'Executive Insights — KPIs, trend charts, and performance insights showing top/bottom pages by CTR with placement and strategy attribution.\n\nPage Performance — CTR and attributable sales breakdown by page type.\n\nChannel Performance — Compare metrics across channels with views/clicks bar chart and attributable sales pie chart.\n\nStrategy Families — Performance grouped by strategy family.\n\nStrategy Deep Dive — Top 10 strategies by attributable sales and CTR. Placement performance (page type × page area) charts showing top 10 placements. Strategy × placement detail table with page type and page area filters.\n\nStrategy Types — Aggregate by strategy type with views distribution pie and CTR/attributable sales comparison.\n\nTrend Analysis — Daily/weekly/monthly trends with metric toggles (views, clicks, attributable sales, CTR, attributable orders).\n\nCross-Dimensional — Heatmap matrix across any two dimensions and metrics.\n\nUnderperformers — Auto-flagged low-performing strategy/page/channel combos.',
    },
    {
        title: 'Chart Controls',
        content: '🏷️ — Toggle data labels on/off for all chart types (bar, line, pie)\n🔍 — Zoom chart to fullscreen overlay for screenshots and presentations\nDaily / Weekly / Monthly — Switch time aggregation on trend charts\nPage Type / Page Area filters — Filter the strategy placement breakdown table',
    },
    {
        title: 'Tips',
        content: 'Charts and data processing run on a background thread (Web Worker), so even with 45K+ rows your browser stays responsive.\n\nUse the 🔍 zoom button to expand any chart to fullscreen before taking screenshots.\n\nToggle 🏷️ data labels to overlay exact values on chart bars, lines, and pie slices.\n\nAll data stays in your browser — nothing is uploaded to any server.',
    },
];

export default function FileUpload({ onDataLoaded }) {
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fileInfo, setFileInfo] = useState(null);
    const [showHelp, setShowHelp] = useState(false);

    const handleFile = useCallback(async (file) => {
        setError(null);
        setIsLoading(true);
        setFileInfo(null);

        try {
            const result = await parseFile(file);
            setFileInfo(result.meta);
            onDataLoaded(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [onDataLoaded]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);

    const handleInputChange = (e) => {
        const file = e.target.files[0];
        if (file) handleFile(file);
    };

    return (
        <div className="upload-container">
            <div className="upload-hero">
                <div className="upload-icon">📊</div>
                <h1 className="upload-title">Site Analytics</h1>
                <p className="upload-subtitle">Product Recommendations Performance Dashboard</p>
            </div>

            {/* Description */}
            <p className="upload-desc">
                Visualize your DXP product recommendation metrics with interactive charts, KPIs, and 9 detailed report views.
                Upload your Site Analytics export to get started.
            </p>

            {/* Help link */}
            <button className="help-link" onClick={() => setShowHelp(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Need help? View documentation
            </button>

            {/* Quick start steps */}
            <div className="quick-steps">
                {STEPS.map(s => (
                    <div className="quick-step" key={s.num}>
                        <span className="quick-step__num">{s.num}</span>
                        <span className="quick-step__text">{s.text}</span>
                    </div>
                ))}
            </div>

            {/* Drop zone */}
            <div
                className={`drop-zone ${isDragging ? 'drop-zone--active' : ''} ${isLoading ? 'drop-zone--loading' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                {isLoading ? (
                    <div className="drop-zone__loading">
                        <div className="spinner" />
                        <p>Analyzing your data...</p>
                    </div>
                ) : (
                    <>
                        <div className="drop-zone__icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        </div>
                        <p className="drop-zone__text">
                            Drag & drop your file here
                        </p>
                        <p className="drop-zone__hint">or</p>
                        <label className="drop-zone__button">
                            Browse Files
                            <input
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleInputChange}
                                hidden
                            />
                        </label>
                        <p className="drop-zone__formats">
                            Supports <span className="badge">.xlsx</span> <span className="badge">.xls</span> <span className="badge">.csv</span>
                        </p>
                    </>
                )}
            </div>

            {error && (
                <div className="upload-error">
                    <span className="upload-error__icon">⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            {fileInfo && (
                <div className="file-info">
                    <div className="file-info__item">
                        <span className="file-info__label">File</span>
                        <span className="file-info__value">{fileInfo.fileName}</span>
                    </div>
                    <div className="file-info__item">
                        <span className="file-info__label">Size</span>
                        <span className="file-info__value">{formatFileSize(fileInfo.fileSize)}</span>
                    </div>
                    <div className="file-info__item">
                        <span className="file-info__label">Rows</span>
                        <span className="file-info__value">{fileInfo.rowCount.toLocaleString()}</span>
                    </div>
                    {fileInfo.dateRange && (
                        <div className="file-info__item">
                            <span className="file-info__label">Date Range</span>
                            <span className="file-info__value">{fileInfo.dateRange.start} → {fileInfo.dateRange.end}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Feature highlights */}
            <div className="feature-grid">
                {FEATURES.map(f => (
                    <div className="feature-card" key={f.title}>
                        <span className="feature-card__icon">{f.icon}</span>
                        <h3 className="feature-card__title">{f.title}</h3>
                        <p className="feature-card__desc">{f.desc}</p>
                    </div>
                ))}
            </div>

            {/* Privacy note */}
            <p className="privacy-note">
                🔒 Your data stays in your browser — nothing is uploaded to any server.
            </p>

            {/* Help modal */}
            {showHelp && (
                <div className="help-overlay" onClick={() => setShowHelp(false)}>
                    <div className="help-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="help-modal__header">
                            <h2>📖 Documentation</h2>
                            <button className="help-modal__close" onClick={() => setShowHelp(false)}>✕</button>
                        </div>
                        <div className="help-modal__body">
                            {HELP_SECTIONS.map(section => (
                                <div className="help-section" key={section.title}>
                                    <h3 className="help-section__title">{section.title}</h3>
                                    <p className="help-section__content">{section.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
