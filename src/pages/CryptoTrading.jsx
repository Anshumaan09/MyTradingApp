import React, { useState, useEffect, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, Zap, RefreshCw, ArrowRightLeft, TrendingUp, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
import { useWatchlist } from '../lib/useMarketData';
import { CRYPTO_PAIRS, validateCryptoOrder, calculateCryptoCharges, usdToInr } from '../lib/cryptoEngine';

const CRYPTO_LIST = Object.entries(CRYPTO_PAIRS).map(([pair, cfg]) => ({
    pair, ...cfg, symbol: pair
}));

const TICKER_SYMBOLS = CRYPTO_LIST.map(c => c.pair);

export const CryptoTrading = () => {
    const { user } = useAuth();
    const [holdings, setHoldings] = useState([]);
    const [orders, setOrders] = useState([]);
    const [wallet, setWallet] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedPair, setSelectedPair] = useState('BTCUSDT');
    const [side, setSide] = useState('BUY');
    const [quantity, setQuantity] = useState('');
    const [orderLoading, setOrderLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState(null);
    const [activeTab, setActiveTab] = useState('trade'); // 'trade' | 'portfolio' | 'history'

    // Live prices for all crypto
    const { items: livePrices, isConnected } = useWatchlist(TICKER_SYMBOLS);

    const livePriceMap = useMemo(() => {
        const map = {};
        TICKER_SYMBOLS.forEach((sym, i) => {
            if (livePrices[i]?.isLive) {
                map[sym] = livePrices[i];
            }
        });
        return map;
    }, [livePrices]);

    const selectedConfig = CRYPTO_PAIRS[selectedPair];
    const selectedLive = livePriceMap[selectedPair];
    const currentPrice = selectedLive?.ltp || 0;

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [hRes, oRes, wRes] = await Promise.all([
                supabase.from('crypto_holdings').select('*').eq('user_id', user.id),
                supabase.from('crypto_orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
                supabase.from('inr_wallet').select('balance').eq('user_id', user.id).single()
            ]);
            setHoldings(hRes.data || []);
            setOrders(oRes.data || []);
            if (wRes.data) setWallet(Number(wRes.data.balance));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [user]);

    // Charges preview
    const qty = Number(quantity) || 0;
    const charges = qty > 0 && currentPrice > 0 ? calculateCryptoCharges(qty, currentPrice, side) : null;
    const inrCost = charges ? usdToInr(charges.netCost) : 0;

    const handleOrder = async () => {
        if (!currentPrice || qty <= 0) return;

        const validation = validateCryptoOrder(selectedPair, side, qty, currentPrice);
        if (!validation.valid) {
            setStatusMsg({ type: 'error', text: validation.error });
            return;
        }

        setOrderLoading(true);
        try {
            const { error } = await supabase.rpc('process_crypto_order', {
                p_user_id: user.id,
                p_pair: selectedPair,
                p_side: side,
                p_order_type: 'market',
                p_quantity: qty,
                p_price: currentPrice
            });
            if (error) throw error;
            setStatusMsg({ type: 'success', text: `${side} ${qty} ${selectedConfig.base} @ $${currentPrice.toFixed(2)}` });
            setQuantity('');
            await fetchData();
        } catch (e) {
            setStatusMsg({ type: 'error', text: e.message });
        } finally { setOrderLoading(false); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header */}
            <div className="flex-between">
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>₿</span> Crypto Trading
                    {isConnected && <Zap size={14} color="var(--color-success)" />}
                </h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className="text-mono" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Wallet: </span>
                    <span className="text-mono" style={{ fontWeight: '600' }}>₹{wallet.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
            </div>

            {/* Live Ticker Strip */}
            <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                {CRYPTO_LIST.slice(0, 8).map((c, i) => {
                    const lp = livePrices[i];
                    const isPos = lp?.changePercent >= 0;
                    return (
                        <div key={c.pair} className="card" onClick={() => setSelectedPair(c.pair)}
                            style={{ minWidth: '140px', padding: '0.6rem 0.8rem', cursor: 'pointer', border: selectedPair === c.pair ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)', transition: 'border 0.15s' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                <span style={{ fontWeight: '600', fontSize: '0.825rem' }}>{c.icon} {c.base}</span>
                                {lp?.isLive && <span style={{ fontSize: '0.5rem', color: 'var(--color-success)' }}>●</span>}
                            </div>
                            <div className="text-mono" style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                                ${lp?.ltp?.toLocaleString('en-US', { maximumFractionDigits: lp?.ltp < 1 ? 4 : 2 }) || '—'}
                            </div>
                            <div className={`text-mono ${isPos ? 'color-success' : 'color-danger'}`} style={{ fontSize: '0.7rem' }}>
                                {isPos ? '+' : ''}{lp?.changePercent?.toFixed(2) || '0.00'}%
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Status */}
            {statusMsg && (
                <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: statusMsg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: statusMsg.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{statusMsg.text}</span>
                    <button onClick={() => setStatusMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><X size={14} /></button>
                </div>
            )}

            {/* Tab nav */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                {[{ key: 'trade', label: '⚡ Trade' }, { key: 'portfolio', label: '💰 Portfolio' }, { key: 'history', label: '📋 History' }].map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                        background: activeTab === t.key ? 'var(--bg-surface-elevated)' : 'none', border: 'none',
                        color: activeTab === t.key ? 'var(--text-primary)' : 'var(--text-muted)', padding: '0.5rem 1rem',
                        borderRadius: '6px', cursor: 'pointer', fontWeight: activeTab === t.key ? '600' : '500'
                    }}>{t.label}</button>
                ))}
            </div>

            {/* TAB: Trade */}
            {activeTab === 'trade' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {/* Left: Pair selector */}
                    <div className="card" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                        <h3 className="card-title" style={{ marginBottom: '0.75rem' }}>Markets</h3>
                        {CRYPTO_LIST.map((c, i) => {
                            const lp = livePrices[i];
                            const isPos = lp?.changePercent >= 0;
                            const isSelected = selectedPair === c.pair;
                            return (
                                <div key={c.pair} onClick={() => setSelectedPair(c.pair)}
                                    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.8fr', padding: '0.6rem 0.75rem', cursor: 'pointer', borderRadius: '6px', backgroundColor: isSelected ? 'var(--bg-surface-elevated)' : 'transparent', borderBottom: '1px solid var(--border-subtle)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '1.1rem' }}>{c.icon}</span>
                                        <div>
                                            <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{c.base}</div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{c.pair}</div>
                                        </div>
                                    </div>
                                    <div className="text-mono" style={{ fontSize: '0.85rem', fontWeight: '500', alignSelf: 'center' }}>
                                        ${lp?.ltp?.toLocaleString('en-US', { maximumFractionDigits: lp?.ltp < 1 ? 4 : 2 }) || '—'}
                                    </div>
                                    <div className={`text-mono ${isPos ? 'color-success' : 'color-danger'}`} style={{ fontSize: '0.8rem', alignSelf: 'center', textAlign: 'right' }}>
                                        {isPos ? '+' : ''}{lp?.changePercent?.toFixed(2) || '0.00'}%
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right: Order panel */}
                    <div className="card glass-panel">
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.3rem' }}>{selectedConfig.icon}</span> {selectedConfig.base}/USDT
                            <span className="text-mono" style={{ marginLeft: 'auto', fontSize: '1.1rem', fontWeight: '700', color: selectedLive?.changePercent >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                ${currentPrice.toLocaleString('en-US', { maximumFractionDigits: currentPrice < 1 ? 4 : 2 })}
                            </span>
                        </h3>

                        {/* BUY / SELL toggle */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', backgroundColor: 'var(--bg-base)', padding: '0.4rem', borderRadius: '8px' }}>
                            <button className={`btn ${side === 'BUY' ? 'btn-success' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => setSide('BUY')}>BUY</button>
                            <button className={`btn ${side === 'SELL' ? 'btn-danger' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => setSide('SELL')}>SELL</button>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Quantity ({selectedConfig.base})</label>
                            <input type="number" className="form-input text-mono" value={quantity} placeholder={`Min: ${selectedConfig.minQty}`}
                                step={selectedConfig.stepSize} min={selectedConfig.minQty}
                                onChange={(e) => setQuantity(e.target.value)} />
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                {[0.001, 0.01, 0.1, 1].map(q => (
                                    <button key={q} className="btn btn-secondary" style={{ flex: 1, padding: '0.25rem', fontSize: '0.7rem' }}
                                        onClick={() => setQuantity(String(Math.max(selectedConfig.minQty, q)))}>{q}</button>
                                ))}
                            </div>
                        </div>

                        {/* Charges breakdown */}
                        {charges && (
                            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-surface-highlight)', borderRadius: '8px', fontSize: '0.8rem' }}>
                                <div className="flex-between" style={{ marginBottom: '0.25rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Value</span>
                                    <span className="text-mono">${charges.totalValue.toFixed(2)}</span>
                                </div>
                                <div className="flex-between" style={{ marginBottom: '0.25rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Platform Fee (0.1%)</span>
                                    <span className="text-mono">${charges.platformFee.toFixed(2)}</span>
                                </div>
                                <div className="flex-between" style={{ marginBottom: '0.25rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>GST (18%)</span>
                                    <span className="text-mono">${charges.gst.toFixed(2)}</span>
                                </div>
                                {side === 'SELL' && (
                                    <div className="flex-between" style={{ marginBottom: '0.25rem' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>TDS (1%)</span>
                                        <span className="text-mono color-danger">${charges.tds.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex-between" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem', marginTop: '0.25rem', fontWeight: '600' }}>
                                    <span>Total {side === 'BUY' ? 'Cost' : 'Credit'}</span>
                                    <span className="text-mono">${charges.netCost.toFixed(2)} <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>(≈₹{inrCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })})</span></span>
                                </div>
                            </div>
                        )}

                        <button className={`btn ${side === 'BUY' ? 'btn-success' : 'btn-danger'}`}
                            style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', marginTop: '1.25rem' }}
                            disabled={orderLoading || qty <= 0 || currentPrice <= 0}
                            onClick={handleOrder}>
                            {orderLoading ? 'Processing...' : `${side} ${qty || '0'} ${selectedConfig.base}`}
                        </button>
                    </div>
                </div>
            )}

            {/* TAB: Portfolio */}
            {activeTab === 'portfolio' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
                        <h3 className="card-title">Crypto Holdings</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr', padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                        <div>Asset</div><div>Qty</div><div>Avg Cost</div><div>LTP</div><div>P&L</div><div>Value</div>
                    </div>
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
                    ) : holdings.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No crypto holdings. Buy your first crypto from the Trade tab!</div>
                    ) : (
                        holdings.map(h => {
                            const pair = h.asset + 'USDT';
                            const lp = livePriceMap[pair];
                            const ltp = lp?.ltp || Number(h.avg_buy_price);
                            const pnl = (ltp - Number(h.avg_buy_price)) * Number(h.quantity);
                            const value = ltp * Number(h.quantity);
                            const isPos = pnl >= 0;
                            return (
                                <div key={h.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr', padding: '0.8rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center' }}>
                                    <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {CRYPTO_PAIRS[pair]?.icon || '🪙'} {h.asset}
                                        {lp?.isLive && <Zap size={10} color="var(--color-success)" />}
                                    </div>
                                    <div className="text-mono">{Number(h.quantity).toFixed(h.quantity < 1 ? 6 : 4)}</div>
                                    <div className="text-mono">${Number(h.avg_buy_price).toFixed(2)}</div>
                                    <div className="text-mono">${ltp.toFixed(ltp < 1 ? 4 : 2)}</div>
                                    <div className={`text-mono ${isPos ? 'color-success' : 'color-danger'}`} style={{ fontWeight: '600' }}>{isPos ? '+' : ''}${pnl.toFixed(2)}</div>
                                    <div className="text-mono">${value.toFixed(2)}</div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* TAB: History */}
            {activeTab === 'history' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 className="card-title">Order History</h3>
                        <button className="btn btn-secondary" style={{ padding: '0.3rem 0.5rem' }} onClick={fetchData}><RefreshCw size={14} /></button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '0.5fr 1fr 0.8fr 0.8fr 0.8fr 0.6fr 0.6fr 1fr', padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600', backgroundColor: 'var(--bg-surface-elevated)' }}>
                        <div>Side</div><div>Pair</div><div>Qty</div><div>Price</div><div>Value</div><div>Fee</div><div>Status</div><div style={{ textAlign: 'right' }}>Time</div>
                    </div>
                    {orders.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No crypto orders yet.</div>
                    ) : (
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {orders.map(o => (
                                <div key={o.id} style={{ display: 'grid', gridTemplateColumns: '0.5fr 1fr 0.8fr 0.8fr 0.8fr 0.6fr 0.6fr 1fr', padding: '0.7rem 1.25rem', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center', fontSize: '0.8rem' }}>
                                    <div><span className={`badge ${o.side === 'BUY' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.6rem' }}>{o.side}</span></div>
                                    <div style={{ fontWeight: '600' }}>{o.pair}</div>
                                    <div className="text-mono">{Number(o.quantity).toFixed(o.quantity < 1 ? 6 : 4)}</div>
                                    <div className="text-mono">${Number(o.price || o.avg_fill_price || 0).toFixed(2)}</div>
                                    <div className="text-mono">${(Number(o.quantity) * Number(o.price || o.avg_fill_price || 0)).toFixed(2)}</div>
                                    <div className="text-mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>${Number(o.total_charges || 0).toFixed(2)}</div>
                                    <div><span className="badge" style={{ backgroundColor: o.status === 'filled' ? 'rgba(16,185,129,0.1)' : 'var(--bg-surface)', color: o.status === 'filled' ? 'var(--color-success)' : 'var(--text-muted)', fontSize: '0.55rem' }}>{o.status?.toUpperCase()}</span></div>
                                    <div className="text-mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'right' }}>{new Date(o.created_at).toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
