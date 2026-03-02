import React, { useState } from 'react';
import { Layers, Shield } from 'lucide-react';
import { useAuth } from '../lib/useAuth';

// ==========================================
// Strategy Templates
// ==========================================
const STRATEGIES = [
    { name: 'Bull Call Spread', legs: 2, risk: 'limited', reward: 'limited', type: 'bullish', description: 'Buy ITM Call + Sell OTM Call. Profits when stock rises moderately.', maxProfit: '₹5,200', maxLoss: '₹2,800', breakeven: '22,580' },
    { name: 'Bear Put Spread', legs: 2, risk: 'limited', reward: 'limited', type: 'bearish', description: 'Buy ITM Put + Sell OTM Put. Profits when stock falls moderately.', maxProfit: '₹4,800', maxLoss: '₹3,200', breakeven: '22,420' },
    { name: 'Long Straddle', legs: 2, risk: 'limited', reward: 'unlimited', type: 'neutral', description: 'Buy ATM Call + Buy ATM Put. Profits from large moves in either direction.', maxProfit: 'Unlimited', maxLoss: '₹6,400', breakeven: '22,180 / 22,820' },
    { name: 'Iron Condor', legs: 4, risk: 'limited', reward: 'limited', type: 'neutral', description: 'Sell OTM Call + Buy further OTM Call + Sell OTM Put + Buy further OTM Put.', maxProfit: '₹3,200', maxLoss: '₹1,800', breakeven: '22,280 / 22,720' },
    { name: 'Protective Put', legs: 2, risk: 'limited', reward: 'unlimited', type: 'bullish', description: 'Hold stock + Buy Put. Insurance against downside while keeping upside.', maxProfit: 'Unlimited', maxLoss: '₹4,100', breakeven: '22,644' },
    { name: 'Covered Call', legs: 2, risk: 'limited', reward: 'limited', type: 'neutral', description: 'Hold stock + Sell OTM Call. Generate income on existing holdings.', maxProfit: '₹7,600', maxLoss: '₹22,500', breakeven: '22,467' },
];

// ==========================================
// IPO Data
// ==========================================
const ACTIVE_IPOS = [
    { name: 'Swiggy Limited', type: 'Mainboard', price: '371-390', size: '₹11,327 Cr', openDate: 'Mar 5', closeDate: 'Mar 7', listing: 'Mar 12', subscription: 38.4, retail: 12.6, hni: 45.2, qib: 62.1, status: 'open', gmp: '+₹42', lot: 38 },
    { name: 'Ola Electric', type: 'Mainboard', price: '72-76', size: '₹5,500 Cr', openDate: 'Mar 3', closeDate: 'Mar 5', listing: 'Mar 10', subscription: 4.2, retail: 2.1, hni: 3.8, qib: 7.5, status: 'open', gmp: '+₹18', lot: 195 },
    { name: 'MobiKwik', type: 'SME', price: '265-279', size: '₹572 Cr', openDate: 'Feb 28', closeDate: 'Mar 2', listing: 'Mar 7', subscription: 119.0, retail: 134.2, hni: 98.0, qib: 125.0, status: 'closed', gmp: '+₹95', lot: 53 },
    { name: 'NTPC Green Energy', type: 'Mainboard', price: '102-108', size: '₹8,316 Cr', openDate: 'Mar 10', closeDate: 'Mar 12', listing: 'Mar 17', subscription: 0, retail: 0, hni: 0, qib: 0, status: 'upcoming', gmp: '+₹25', lot: 138 },
];

// ==========================================
// Main Component
// ==========================================
export const AdvancedTrading = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('strategy');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="flex-between">
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Layers size={28} color="var(--accent-primary)" /> Advanced Trading
                </h1>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                {[{ key: 'strategy', label: '🎯 Strategy Builder' }, { key: 'ipo', label: '🚀 IPO Corner' }].map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                        background: activeTab === t.key ? 'var(--bg-surface-elevated)' : 'none', border: 'none',
                        color: activeTab === t.key ? 'var(--text-primary)' : 'var(--text-muted)', padding: '0.5rem 1rem',
                        borderRadius: '6px', cursor: 'pointer', fontWeight: activeTab === t.key ? '600' : '500'
                    }}>{t.label}</button>
                ))}
            </div>

            {/* TAB: Strategy Builder */}
            {activeTab === 'strategy' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
                        {STRATEGIES.map(s => {
                            const typeColors = { bullish: '#10b981', bearish: '#ef4444', neutral: '#3b82f6' };
                            return (
                                <div key={s.name} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div className="flex-between">
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '1rem' }}>{s.name}</div>
                                            <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.25rem' }}>
                                                <span className="badge" style={{ backgroundColor: typeColors[s.type] + '15', color: typeColors[s.type], fontSize: '0.55rem' }}>{s.type.toUpperCase()}</span>
                                                <span className="badge" style={{ fontSize: '0.55rem' }}>{s.legs} Legs</span>
                                                <span className="badge" style={{ fontSize: '0.55rem' }}>Risk: {s.risk}</span>
                                            </div>
                                        </div>
                                        <Shield size={20} color={typeColors[s.type]} />
                                    </div>

                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.description}</p>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', padding: '0.5rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '6px', fontSize: '0.75rem' }}>
                                        <div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>Max Profit</div>
                                            <div className="text-mono color-success" style={{ fontWeight: '600' }}>{s.maxProfit}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>Max Loss</div>
                                            <div className="text-mono color-danger" style={{ fontWeight: '600' }}>{s.maxLoss}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>Breakeven</div>
                                            <div className="text-mono" style={{ fontWeight: '600' }}>{s.breakeven}</div>
                                        </div>
                                    </div>

                                    <button className="btn btn-primary" style={{ width: '100%', padding: '0.5rem' }}>
                                        Deploy Strategy
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB: IPO Corner */}
            {activeTab === 'ipo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
                        {ACTIVE_IPOS.map(ipo => {
                            const statusColor = ipo.status === 'open' ? 'var(--color-success)' : ipo.status === 'closed' ? 'var(--color-danger)' : 'var(--text-secondary)';
                            return (
                                <div key={ipo.name} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div className="flex-between">
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {ipo.name}
                                                <span className="badge" style={{ fontSize: '0.5rem', backgroundColor: statusColor + '20', color: statusColor }}>
                                                    {ipo.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{ipo.type} IPO</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Est. GMP</div>
                                            <div className="text-mono color-success" style={{ fontWeight: '700', fontSize: '0.9rem' }}>{ipo.gmp}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: 'var(--bg-surface-elevated)', padding: '0.75rem', borderRadius: '6px' }}>
                                        <div>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Price Band</div>
                                            <div className="text-mono" style={{ fontWeight: '600', fontSize: '0.8rem' }}>₹{ipo.price}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Issue Size</div>
                                            <div className="text-mono" style={{ fontWeight: '600', fontSize: '0.8rem' }}>{ipo.size}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Lot Size</div>
                                            <div className="text-mono" style={{ fontWeight: '600', fontSize: '0.8rem' }}>{ipo.lot} Shares</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Timelines</div>
                                            <div className="text-mono" style={{ fontWeight: '600', fontSize: '0.7rem' }}>{ipo.openDate} - {ipo.closeDate}</div>
                                        </div>
                                    </div>
                                    {ipo.status !== 'upcoming' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <div className="flex-between" style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>
                                                <span>Subscription (Overall {ipo.subscription}x)</span>
                                            </div>
                                            <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', backgroundColor: 'var(--bg-surface)' }}>
                                                <div style={{ width: '40%', backgroundColor: 'var(--accent-primary)' }} title={`QIB: ${ipo.qib}x`} />
                                                <div style={{ width: '30%', backgroundColor: 'var(--color-success)' }} title={`HNI: ${ipo.hni}x`} />
                                                <div style={{ width: '30%', backgroundColor: 'var(--color-warning)' }} title={`Retail: ${ipo.retail}x`} />
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                                <span>QIB: {ipo.qib}x</span>
                                                <span>HNI: {ipo.hni}x</span>
                                                <span>Retail: {ipo.retail}x</span>
                                            </div>
                                        </div>
                                    )}
                                    <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={ipo.status === 'closed'}>
                                        {ipo.status === 'closed' ? 'Application Closed' : 'Apply for IPO'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
