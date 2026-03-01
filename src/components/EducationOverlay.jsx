import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldCheck, ArrowRight, BookOpen } from 'lucide-react';

export const EducationOverlay = ({ onComplete, onCancel }) => {
    const [timer, setTimer] = useState(5); // 5 seconds mock for the "5-minute" module
    const [slide, setSlide] = useState(1);

    useEffect(() => {
        if (timer > 0) {
            const int = setTimeout(() => setTimer(timer - 1), 1000);
            return () => clearTimeout(int);
        }
    }, [timer, slide]);

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
        }}>
            <div className="card animate-fade-in" style={{
                maxWidth: '600px',
                width: '100%',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--accent-primary)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308', borderRadius: '8px' }}>
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Mandatory Risk Disclosure</h2>
                        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.875rem' }}>SEBI Derivatives (F&O) Module</p>
                    </div>
                </div>

                <div style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {slide === 1 && (
                        <div className="animate-fade-in">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <BookOpen size={18} color="var(--accent-primary)" /> 9 out of 10 traders lose money in F&O
                            </h3>
                            <ul style={{ color: 'var(--text-secondary)', paddingLeft: '1.5rem', lineHeight: 1.6 }}>
                                <li>Average loss among active traders is roughly ₹50,000.</li>
                                <li>Over and above the net trading losses incurred, loss makers expend an additional 28% of net trading losses as transaction costs.</li>
                            </ul>
                        </div>
                    )}

                    {slide === 2 && (
                        <div className="animate-fade-in">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <ShieldCheck size={18} color="var(--accent-primary)" /> Leverage is a Double-Edged Sword
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                Derivatives allow you to take larger positions with a smaller margin. While this amplifies profits, it equally amplifies losses. You can lose more than your initial capital investment. NexusTrade employs strict kill-switches, but market gaps can still expose you to unlimited risk.
                            </p>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={onCancel}
                    >
                        Decline & Go Back
                    </button>

                    <button
                        className="btn btn-primary"
                        disabled={timer > 0}
                        onClick={() => {
                            if (slide === 1) {
                                setSlide(2);
                                setTimer(5);
                            } else {
                                onComplete();
                            }
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: timer > 0 ? 0.5 : 1 }}
                    >
                        {timer > 0
                            ? `Please read (${timer}s)`
                            : (slide === 1 ? 'Next Slide' : 'I Understand & Accept')
                        }
                        {timer === 0 && <ArrowRight size={16} />}
                    </button>
                </div>
            </div>
        </div>
    );
};
