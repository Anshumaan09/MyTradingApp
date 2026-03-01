import React, { useState } from 'react';
import { Layers, TrendingUp, TrendingDown, Target, Zap, ArrowUpRight, ArrowDownRight, BarChart3, Shield, DollarSign } from 'lucide-react';
import { useAuth } from '../lib/useAuth';

// ==========================================
// F&O Options Chain Data
// ==========================================
const UNDERLYING = [
    { symbol: 'NIFTY', ltp: 22543.50, change: 0.82 },
    { symbol: 'BANKNIFTY', ltp: 48125.30, change: 1.24 },
    { symbol: 'RELIANCE', ltp: 2891.40, change: 0.45 },
    { symbol: 'TCS', ltp: 3750.20, change: -0.12 },
    { symbol: 'HDFCBANK', ltp: 1679.10, change: 1.91 },
];

const generateOptionsChain = (spot) => {
    const strikes = [];
    const step = spot > 10000 ? 100 : spot > 1000 ? 50 : 10;
    const baseStrike = Math.round(spot / step) * step;
    for (let i = -6; i <= 6; i++) {
        const strike = baseStrike + (i * step);
        const itm = strike < spot;
        const dist = Math.abs(spot - strike) / spot;
        const ceIV = 12 + Math.random() * 8 + dist * 30;
        const peIV = 12 + Math.random() * 8 + dist * 30;
        const timeDecay = 0.85 + Math.random() * 0.3;

        strikes.push({
            strike,
            isATM: i === 0,
            ce: {
                ltp: Math.max(0.05, itm ? (spot - strike) + Math.random() * step * 0.5 : Math.random() * step * 0.3).toFixed(2),
                oi: Math.round(50000 + Math.random() * 200000),
                oiChange: Math.round(-5000 + Math.random() * 10000),
                iv: ceIV.toFixed(1),
                delta: Math.max(0.01, Math.min(0.99, 0.5 + (spot - strike) / (spot * 0.1))).toFixed(2),
                gamma: (0.001 + Math.random() * 0.003).toFixed(4),
                theta: (-timeDecay * (1 + dist)).toFixed(2),
                vega: (5 + Math.random() * 10).toFixed(2),
            },
            pe: {
                ltp: Math.max(0.05, !itm ? (strike - spot) + Math.random() * step * 0.5 : Math.random() * step * 0.3).toFixed(2),
                oi: Math.round(50000 + Math.random() * 200000),
                oiChange: Math.round(-5000 + Math.random() * 10000),
                iv: peIV.toFixed(1),
                delta: Math.max(-0.99, Math.min(-0.01, -0.5 + (spot - strike) / (spot * 0.1))).toFixed(2),
                gamma: (0.001 + Math.random() * 0.003).toFixed(4),
                theta: (-timeDecay * (1 + dist)).toFixed(2),
                vega: (5 + Math.random() * 10).toFixed(2),
            },
        });
    }
    return strikes;
};

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
    const [activeTab, setActiveTab] = useState('fno');
    const [selectedUnderlying, setSelectedUnderlying] = useState(UNDERLYING[0]);
    const [showGreeks, setShowGreeks] = useState(false);
    const [optionType, setOptionType] = useState('all'); // 'all' | 'ce' | 'pe'

    const optionsChain = generateOptionsChain(selectedUnderlying.ltp);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="flex-between">
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Layers size={28} color="var(--accent-primary)" /> Advanced Trading
                </h1>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                {[{ key: 'fno', label: '📊 F&O Options' }, { key: 'strategy', label: '🎯 Strategy Builder' }, { key: 'ipo', label: '🚀 IPO Corner' }].map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                        background: activeTab === t.key ? 'var(--bg-surface-elevated)' : 'none', border: 'none',
                        color: activeTab === t.key ? 'var(--text-primary)' : 'var(--text-muted)', padding: '0.5rem 1rem',
                        borderRadius: '6px', cursor: 'pointer', fontWeight: activeTab === t.key ? '600' : '500'
                    }}>{t.label}</button>
                ))}
            </div>

            {/* TAB: F&O Options Chain */}
            {activeTab === 'fno' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Underlying selector */}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        {UNDERLYING.map(u => (
                            <div key={u.symbol} className="card" onClick={() => setSelectedUnderlying(u)}
                                style={{ cursor: 'pointer', padding: '0.6rem 1rem', border: selectedUnderlying.symbol === u.symbol ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)', minWidth: '130px' }}>
                                <div style={{ fontWeight: '600', fontSize: '0.825rem' }}>{u.symbol}</div>
                                <div className="text-mono" style={{ fontSize: '0.85rem' }}>₹{u.ltp.toLocaleString('en-IN')}</div>
                                <div className={`text-mono ${u.change >= 0 ? 'color-success' : 'color-danger'}`} style={{ fontSize: '0.7rem' }}>{u.change >= 0 ? '+' : ''}{u.change}%</div>
                            </div>
                        ))}
                    </div>

                    {/* Controls */}
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <select className="form-input" style={{ width: '140px', fontSize: '0.8rem' }} defaultValue="weekly">
                            <option value="weekly">Weekly Expiry</option>
                            <option value="monthly">Monthly Expiry</option>
                            <option value="next">Next Month</option>
                        </select>
                        <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: 'var(--bg-surface)', padding: '0.2rem', borderRadius: '6px' }}>
                            {['all', 'ce', 'pe'].map(t => (
                                <button key={t} className={`btn ${optionType === t ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem' }}
                                    onClick={() => setOptionType(t)}>{t === 'all' ? 'All' : t.toUpperCase()}</button>
                            ))}
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', marginLeft: 'auto' }}>
                            <input type="checkbox" checked={showGreeks} onChange={(e) => setShowGreeks(e.target.checked)} />
                            Show Greeks
                        </label>
                    </div>

                    {/* Options Chain Table */}
                    <div className="card" style={{ padding: 0, overflow: 'auto' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: optionType === 'all' ? (showGreeks ? '0.6fr 0.4fr 0.4fr 0.4fr 0.4fr 0.5fr 0.6fr 0.8fr 0.6fr 0.5fr 0.4fr 0.4fr 0.4fr 0.4fr 0.6fr' : '0.8fr 0.6fr 0.6fr 0.8fr 0.8fr 0.6fr 0.6fr 0.8fr') : (showGreeks ? '0.8fr 0.6fr 0.6fr 0.5fr 0.5fr 0.5fr 0.5fr 0.8fr' : '1fr 0.8fr 0.8fr 1fr'), fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-secondary)', padding: '0.6rem 0.75rem', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
                            {(optionType === 'all' || optionType === 'ce') && <>
                                <div style={{ textAlign: 'center' }}>CE LTP</div>
                                <div style={{ textAlign: 'center' }}>OI</div>
                                {showGreeks && <><div style={{ textAlign: 'center' }}>Δ</div><div style={{ textAlign: 'center' }}>Γ</div><div style={{ textAlign: 'center' }}>θ</div><div style={{ textAlign: 'center' }}>IV</div></>}
                                <div style={{ textAlign: 'center' }}>OI Chg</div>
                            </>}
                            <div style={{ textAlign: 'center', fontWeight: '700', color: 'var(--text-primary)' }}>STRIKE</div>
                            {(optionType === 'all' || optionType === 'pe') && <>
                                <div style={{ textAlign: 'center' }}>OI Chg</div>
                                {showGreeks && <><div style={{ textAlign: 'center' }}>IV</div><div style={{ textAlign: 'center' }}>θ</div><div style={{ textAlign: 'center' }}>Γ</div><div style={{ textAlign: 'center' }}>Δ</div></>}
                                <div style={{ textAlign: 'center' }}>OI</div>
                                <div style={{ textAlign: 'center' }}>PE LTP</div>
                            </>}
                        </div>
                        {optionsChain.map(row => (
                            <div key={row.strike} style={{
                                display: 'grid', gridTemplateColumns: optionType === 'all' ? (showGreeks ? '0.6fr 0.4fr 0.4fr 0.4fr 0.4fr 0.5fr 0.6fr 0.8fr 0.6fr 0.5fr 0.4fr 0.4fr 0.4fr 0.4fr 0.6fr' : '0.8fr 0.6fr 0.6fr 0.8fr 0.8fr 0.6fr 0.6fr 0.8fr') : (showGreeks ? '0.8fr 0.6fr 0.6fr 0.5fr 0.5fr 0.5fr 0.5fr 0.8fr' : '1fr 0.8fr 0.8fr 1fr'),
                                padding: '0.45rem 0.75rem', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center',
                                fontSize: '0.75rem', backgroundColor: row.isATM ? 'rgba(99,102,241,0.08)' : 'transparent',
                            }}>
                                {(optionType === 'all' || optionType === 'ce') && <>
                                    <div className="text-mono color-success" style={{ textAlign: 'center', fontWeight: '600' }}>₹{row.ce.ltp}</div>
                                    <div className="text-mono" style={{ textAlign: 'center', fontSize: '0.65rem' }}>{(row.ce.oi / 1000).toFixed(0)}K</div>
                                    {showGreeks && <>
                                        <div className="text-mono" style={{ textAlign: 'center', fontSize: '0.65rem' }}>{row.ce.delta}</div>
                                        <div className="text-mono" style={{ textAlign: 'center', fontSize: '0.65rem' }}>{row.ce.gamma}</div>
                                        <div className="text-mono" style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--color-danger)' }}>{row.ce.theta}</div>
                                        <div className="text-mono" style={{ textAlign: 'center', fontSize: '0.65rem' }}>{row.ce.iv}%</div>
                                    </>}
                                    <div className="text-mono" style={{ textAlign: 'center', fontSize: '0.65rem', color: row.ce.oiChange > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{row.ce.oiChange > 0 ? '+' : ''}{(row.ce.oiChange / 1000).toFixed(1)}K</div>
                                </>}
                                <div className="text-mono" style={{ textAlign: 'center', fontWeight: '700', fontSize: '0.85rem', color: row.isATM ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                                    {row.strike.toLocaleString('en-IN')} {row.isATM && <span style={{ fontSize: '0.5rem', color: 'var(--accent-primary)' }}>ATM</span>}
                                </div>
                                {(optionType === 'all' || optionType === 'pe') && <>
                                    <div className="text-mono" style={{ textAlign: 'center', fontSize: '0.65rem', color: row.pe.oiChange > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{row.pe.oiChange > 0 ? '+' : ''}{(row.pe.oiChange / 1000).toFixed(1)}K</div>
                                    {showGreeks && <>
                                        <div className="text-mono" style={{ textAlign: 'center', fontSize: '0.65rem' }}>{row.pe.iv}%</div>
                                        <div className="text-mono" style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--color-danger)' }}>{row.pe.theta}</div>
                                        <div className="text-mono" style={{ textAlign: 'center', fontSize: '0.65rem' }}>{row.pe.gamma}</div>
                                        <div className="text-mono" style={{ textAlign: 'center', fontSize: '0.65rem' }}>{row.pe.delta}</div>
                                    </>}
                                    <div className="text-mono" style={{ textAlign: 'center', fontSize: '0.65rem' }}>{(row.pe.oi / 1000).toFixed(0)}K</div>
                                    <div className="text-mono color-danger" style={{ textAlign: 'center', fontWeight: '600' }}>₹{row.pe.ltp}</div>
                                </>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

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

                    {/* Margin Calculator */}
                    <div className="card glass-panel">
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><DollarSign size={18} /> SPAN Margin Calculator</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SPAN Margin</div>
                                <div className="text-mono" style={{ fontSize: '1.1rem', fontWeight: '700' }}>₹1,24,500</div>
                            </div>
                            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Exposure Margin</div>
                                <div className="text-mono" style={{ fontSize: '1.1rem', fontWeight: '700' }}>₹42,300</div>
                            </div>
                            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Margin</div>
                                <div className="text-mono" style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-primary)' }}>₹1,66,800</div>
                            </div>
                            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Premium Received</div>
                                <div className="text-mono color-success" style={{ fontSize: '1.1rem', fontWeight: '700' }}>₹8,200</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: IPO Corner */}
            {activeTab === 'ipo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {ACTIVE_IPOS.map(ipo => {
                        const statusColors = { open: '#10b981', closed: '#6b7280', upcoming: '#3b82f6' };
                        return (
                            <div key={ipo.name} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div className="flex-between">
                                    <div>
                                        <div style={{ fontWeight: '700', fontSize: '1.05rem' }}>{ipo.name}</div>
                                        <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.25rem' }}>
                                            <span className="badge" style={{ fontSize: '0.6rem' }}>{ipo.type}</span>
                                            <span className="badge" style={{ backgroundColor: statusColors[ipo.status] + '15', color: statusColors[ipo.status], fontSize: '0.6rem' }}>{ipo.status.toUpperCase()}</span>
                                            <span className="badge" style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', fontSize: '0.6rem' }}>GMP: {ipo.gmp}</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div className="text-mono" style={{ fontWeight: '700', fontSize: '1rem' }}>₹{ipo.price}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{ipo.size}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                                    <div><div style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>Open</div><div style={{ fontWeight: '600' }}>{ipo.openDate}</div></div>
                                    <div><div style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>Close</div><div style={{ fontWeight: '600' }}>{ipo.closeDate}</div></div>
                                    <div><div style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>Listing</div><div style={{ fontWeight: '600' }}>{ipo.listing}</div></div>
                                    <div><div style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>Lot Size</div><div className="text-mono" style={{ fontWeight: '600' }}>{ipo.lot}</div></div>
                                    <div><div style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>Subscription</div><div className="text-mono" style={{ fontWeight: '600', color: ipo.subscription > 10 ? 'var(--color-success)' : 'var(--text-primary)' }}>{ipo.subscription > 0 ? ipo.subscription + 'x' : '—'}</div></div>
                                    <div><div style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>Min Invest</div><div className="text-mono" style={{ fontWeight: '600' }}>₹{(ipo.lot * parseInt(ipo.price.split('-')[1] || ipo.price)).toLocaleString('en-IN')}</div></div>
                                </div>

                                {/* Subscription bars */}
                                {ipo.subscription > 0 && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', padding: '0.5rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '6px' }}>
                                        {[{ name: 'Retail', val: ipo.retail }, { name: 'HNI', val: ipo.hni }, { name: 'QIB', val: ipo.qib }].map(cat => (
                                            <div key={cat.name}>
                                                <div className="flex-between" style={{ fontSize: '0.65rem', marginBottom: '0.2rem' }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>{cat.name}</span>
                                                    <span className="text-mono" style={{ fontWeight: '600' }}>{cat.val}x</span>
                                                </div>
                                                <div style={{ height: '6px', backgroundColor: 'var(--bg-base)', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${Math.min(100, cat.val * 5)}%`, height: '100%', backgroundColor: cat.val >= 1 ? 'var(--color-success)' : 'var(--accent-primary)', borderRadius: '3px' }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button className={`btn ${ipo.status === 'open' ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ width: '100%', padding: '0.5rem' }}
                                    disabled={ipo.status !== 'open'}>
                                    {ipo.status === 'open' ? `Apply (${ipo.lot} shares)` : ipo.status === 'upcoming' ? 'Coming Soon' : 'Bidding Closed'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
