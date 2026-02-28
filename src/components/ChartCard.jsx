import { useState } from 'react';
import ChartErrorBoundary from './ChartErrorBoundary';

export default function ChartCard({ title, subtitle, children, className = '', zoomable = false }) {
    const [zoomed, setZoomed] = useState(false);

    const zoomBtn = zoomable ? (
        <button
            className="toggle-btn"
            onClick={() => setZoomed(true)}
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
            title="Expand chart"
        >
            🔍
        </button>
    ) : null;

    const combinedSubtitle = (zoomBtn || subtitle) ? (
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            {zoomBtn}
            {subtitle}
        </div>
    ) : null;

    return (
        <>
            <div className={`chart-card ${className}`}>
                <div className="chart-card__header">
                    <div className="chart-card__header-row">
                        <h3 className="chart-card__title">{title}</h3>
                        {combinedSubtitle && <div className="chart-card__subtitle">{combinedSubtitle}</div>}
                    </div>
                </div>
                <div className="chart-card__body">
                    <ChartErrorBoundary>
                        {children}
                    </ChartErrorBoundary>
                </div>
            </div>

            {zoomed && (
                <div className="chart-zoom-overlay" onClick={() => setZoomed(false)}>
                    <div className="chart-zoom-container" onClick={(e) => e.stopPropagation()}>
                        <div className="chart-zoom-header">
                            <h3>{title}</h3>
                            <button className="chart-zoom-close" onClick={() => setZoomed(false)}>✕</button>
                        </div>
                        <div style={{ height: 500 }}>
                            <ChartErrorBoundary>
                                {children}
                            </ChartErrorBoundary>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
