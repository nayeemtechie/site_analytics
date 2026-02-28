const TABS = [
    { id: 'executive', label: 'Executive Insights', icon: '📈' },
    { id: 'page', label: 'Page Performance', icon: '📄' },
    { id: 'channel', label: 'Channel Performance', icon: '📱' },
    { id: 'strategy-family', label: 'Strategy Families', icon: '🧬' },
    { id: 'strategy-deep', label: 'Strategy Deep-Dive', icon: '🔬' },
    { id: 'strategy-type', label: 'Strategy Types', icon: '⚙️' },
    { id: 'trend', label: 'Trend Analysis', icon: '📉' },
    { id: 'cross', label: 'Cross-Dimensional', icon: '🗺️' },
    { id: 'underperformer', label: 'Underperformers', icon: '🚨' },
];

export { TABS };

export default function TabNavigation({ activeTab, onTabChange, onReset }) {
    return (
        <div className="tab-bar-wrapper">
            <div className="tab-bar">
                <div className="tab-bar__logo" onClick={onReset} title="Upload new file">
                    📊
                </div>
                <div className="tab-bar__tabs">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            className={`tab-btn ${activeTab === tab.id ? 'tab-btn--active' : ''}`}
                            onClick={() => onTabChange(tab.id)}
                        >
                            <span className="tab-btn__icon">{tab.icon}</span>
                            <span className="tab-btn__label">{tab.label}</span>
                        </button>
                    ))}
                </div>
                <button className="tab-bar__reset" onClick={onReset} title="Upload new file">
                    ↻ New File
                </button>
            </div>
        </div>
    );
}
