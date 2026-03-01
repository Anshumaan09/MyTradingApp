import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-base)', padding: '2rem'
        }}>
            <div style={{ textAlign: 'center', maxWidth: '500px' }}>
                {/* Animated 404 */}
                <div style={{ position: 'relative', marginBottom: '2rem' }}>
                    <div style={{
                        fontSize: '8rem', fontWeight: '900', fontFamily: 'var(--font-mono)',
                        background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6, #ec4899)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        lineHeight: 1, letterSpacing: '-0.05em'
                    }}>404</div>
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        width: '120px', height: '120px', borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
                        animation: 'pulse 2s infinite'
                    }}></div>
                </div>

                <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.75rem' }}>Page Not Found</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                    The page you're looking for doesn't exist or has been moved. Let's get you back to trading!
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button className="btn btn-primary" onClick={() => navigate('/')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
                        <Home size={18} /> Go to Dashboard
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate(-1)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
                        <ArrowLeft size={18} /> Go Back
                    </button>
                </div>

                <div style={{ marginTop: '3rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    NexusTrade v2.0 — Sprints 1-8 Complete ✨
                </div>
            </div>

            <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
        }
      `}</style>
        </div>
    );
};
