import React, { useState } from 'react';

const generateOptionsChain = (spot) => {
    const strikes = [];
    // Ensure spot is a valid number, default to 1000 if not
    const safeSpot = Number(spot) || 1000;
    const step = safeSpot > 10000 ? 100 : safeSpot > 1000 ? 50 : 10;
    const baseStrike = Math.round(safeSpot / step) * step;

    for (let i = -8; i <= 8; i++) {
        const strike = baseStrike + (i * step);
        const itm = strike < safeSpot;
        const dist = Math.abs(safeSpot - strike) / safeSpot;
        const ceIV = 12 + Math.random() * 8 + dist * 30;
        const peIV = 12 + Math.random() * 8 + dist * 30;
        const timeDecay = 0.85 + Math.random() * 0.3;

        strikes.push({
            strike,
            isATM: i === 0,
            ce: {
                ltp: Math.max(0.05, itm ? (safeSpot - strike) + Math.random() * step * 0.5 : Math.random() * step * 0.3).toFixed(2),
                oi: Math.round(50000 + Math.random() * 200000),
                oiChange: Math.round(-5000 + Math.random() * 10000),
                iv: ceIV.toFixed(1),
                delta: Math.max(0.01, Math.min(0.99, 0.5 + (safeSpot - strike) / (safeSpot * 0.1))).toFixed(2),
                gamma: (0.001 + Math.random() * 0.003).toFixed(4),
                theta: (-timeDecay * (1 + dist)).toFixed(2),
                vega: (5 + Math.random() * 10).toFixed(2),
            },
            pe: {
                ltp: Math.max(0.05, !itm ? (strike - safeSpot) + Math.random() * step * 0.5 : Math.random() * step * 0.3).toFixed(2),
                oi: Math.round(50000 + Math.random() * 200000),
                oiChange: Math.round(-5000 + Math.random() * 10000),
                iv: peIV.toFixed(1),
                delta: Math.max(-0.99, Math.min(-0.01, -0.5 + (safeSpot - strike) / (safeSpot * 0.1))).toFixed(2),
                gamma: (0.001 + Math.random() * 0.003).toFixed(4),
                theta: (-timeDecay * (1 + dist)).toFixed(2),
                vega: (5 + Math.random() * 10).toFixed(2),
            },
        });
    }
    return strikes;
};

export const OptionsChain = ({ underlyingSymbol, currentPrice }) => {
    const [showGreeks, setShowGreeks] = useState(false);
    const [optionType, setOptionType] = useState('all'); // 'all' | 'ce' | 'pe'
    const [expiry, setExpiry] = useState('weekly');

    const optionsChain = generateOptionsChain(currentPrice);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
            {/* Controls */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <select className="form-input" style={{ width: '140px', fontSize: '0.8rem' }} value={expiry} onChange={(e) => setExpiry(e.target.value)}>
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
            <div className="card" style={{ padding: 0, overflow: 'auto', flex: 1, minHeight: '400px' }}>
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
    );
};
