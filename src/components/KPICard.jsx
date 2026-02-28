export default function KPICard({ label, value, subtitle, icon, trend, className = '' }) {
    return (
        <div className={`kpi-card ${className}`}>
            <div className="kpi-card__header">
                {icon && <span className="kpi-card__icon">{icon}</span>}
                <span className="kpi-card__label">{label}</span>
            </div>
            <div className="kpi-card__value">{value}</div>
            {subtitle && <div className="kpi-card__subtitle">{subtitle}</div>}
            {trend !== undefined && (
                <div className={`kpi-card__trend ${trend >= 0 ? 'kpi-card__trend--up' : 'kpi-card__trend--down'}`}>
                    {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
                </div>
            )}
        </div>
    );
}
