import { Component } from 'react';

export default class ChartErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('Chart rendering error:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 200,
                    color: 'var(--text-muted)',
                    gap: '0.5rem',
                    padding: '2rem',
                    textAlign: 'center',
                }}>
                    <span style={{ fontSize: '2rem' }}>⚠️</span>
                    <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Chart failed to render</p>
                    <p style={{ fontSize: '0.8rem' }}>{this.state.error?.message || 'An unexpected error occurred'}</p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        style={{
                            marginTop: '0.5rem',
                            padding: '0.4rem 1rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '0.82rem',
                            fontFamily: 'var(--font-family)',
                        }}
                    >
                        Retry
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
