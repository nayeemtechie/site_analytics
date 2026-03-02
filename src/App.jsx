import { useState, useCallback, Suspense, lazy } from 'react';
import FileUpload from './components/FileUpload';
import TabNavigation, { TABS } from './components/TabNavigation';

const ExecutiveDashboard = lazy(() => import('./reports/ExecutiveDashboard'));
const ChannelPerformance = lazy(() => import('./reports/ChannelPerformance'));
const PagePerformance = lazy(() => import('./reports/PagePerformance'));
const StrategyFamilyReport = lazy(() => import('./reports/StrategyFamilyReport'));
const StrategyDeepDive = lazy(() => import('./reports/StrategyDeepDive'));
const StrategyTypeReport = lazy(() => import('./reports/StrategyTypeReport'));
const TrendAnalysis = lazy(() => import('./reports/TrendAnalysis'));
const CrossDimensional = lazy(() => import('./reports/CrossDimensional'));
const UnderperformerReport = lazy(() => import('./reports/UnderperformerReport'));

const REPORT_COMPONENTS = {
    executive: ExecutiveDashboard,
    channel: ChannelPerformance,
    page: PagePerformance,
    'strategy-family': StrategyFamilyReport,
    'strategy-deep': StrategyDeepDive,
    'strategy-type': StrategyTypeReport,
    trend: TrendAnalysis,
    cross: CrossDimensional,
    underperformer: UnderperformerReport,
};

export default function App() {
    const [parsedData, setParsedData] = useState(null);
    const [activeTab, setActiveTab] = useState('executive');

    const handleDataLoaded = useCallback(({ data, meta }) => {
        setParsedData({ data, meta });
        setActiveTab('executive');
    }, []);

    const handleReset = useCallback(() => {
        setParsedData(null);
        setActiveTab('executive');
    }, []);

    if (!parsedData) {
        return (
            <div className="app app--upload">
                <FileUpload onDataLoaded={handleDataLoaded} />
                <footer className="app-footer">
                    <span>Site Analytics Dashboard</span>
                    <span className="app-footer__sep">·</span>
                    <span>Developed by Nayeemuddin Mohammed — CSA Team</span>
                </footer>
            </div>
        );
    }

    const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    function formatMetaDate(d) {
        if (!d || d.length < 10) return d || '';
        const [y, m, day] = d.split('-');
        return `${parseInt(day, 10)}-${MONTH_NAMES[parseInt(m, 10) - 1]}-${y.slice(2)}`;
    }

    const ActiveReport = REPORT_COMPONENTS[activeTab];

    return (
        <div className="app app--dashboard">
            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} onReset={handleReset} />
            <main className="main-content">
                <div className="report-meta">
                    <span className="report-meta__file">📁 {parsedData.meta.fileName}</span>
                    <span className="report-meta__rows">{parsedData.meta.rowCount.toLocaleString()} rows</span>
                    {parsedData.meta.dateRange && (
                        <span className="report-meta__dates">
                            {formatMetaDate(parsedData.meta.dateRange.start)} → {formatMetaDate(parsedData.meta.dateRange.end)}
                        </span>
                    )}
                </div>
                {ActiveReport && (
                    <Suspense fallback={
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
                            <div className="spinner" />
                        </div>
                    }>
                        <ActiveReport data={parsedData.data} />
                    </Suspense>
                )}
            </main>
            <footer className="app-footer">
                <span>Site Analytics Dashboard</span>
                <span className="app-footer__sep">·</span>
                <span>Developed by Nayeemuddin Mohammed — CSA Team</span>
            </footer>
        </div>
    );
}
