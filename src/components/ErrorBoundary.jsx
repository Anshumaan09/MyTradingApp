import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    minHeight: '300px', gap: '1.5rem', padding: '2rem',
                    backgroundColor: 'var(--bg-surface)', borderRadius: '12px',
                    border: '1px solid var(--border-subtle)'
                }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '50%',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center'
                    }}>
                        <AlertTriangle size={28} color="var(--color-danger)" />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <h3 style={{ marginBottom: '0.5rem' }}>Something went wrong</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '400px' }}>
                            {this.props.fallbackMessage || 'This component encountered an error and could not render. Try refreshing the page.'}
                        </p>
                    </div>
                    {this.state.error && (
                        <code style={{
                            padding: '0.75rem 1rem', backgroundColor: 'var(--bg-base)',
                            borderRadius: '8px', fontSize: '0.75rem', color: 'var(--color-danger)',
                            maxWidth: '500px', overflow: 'auto', border: '1px solid var(--border-subtle)'
                        }}>
                            {this.state.error.toString()}
                        </code>
                    )}
                    <button
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        onClick={() => this.setState({ hasError: false, error: null })}
                    >
                        <RefreshCw size={16} /> Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
