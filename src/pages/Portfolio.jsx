import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, CircleDollarSign, History, Download, X, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
import { useWatchlist } from '../lib/useMarketData';

// Sell Confirmation Modal
const SellModal = ({ holding, livePrice, onClose, onConfirm, loading }) => {
    const [sellQty, setSellQty] = useState(Number(holding.quantity));
    const avgCost = Number(holding.avg_buy_price);
    const currentPrice = livePrice || avgCost;
    const estimatedPnl = (currentPrice - avgCost) * sellQty;
    const estimatedValue = currentPrice * sellQty;
    const isProfit = estimatedPnl >= 0;

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="card" style={{ width: '440px', maxWidth: '95vw', padding: '2rem', position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <X size={20} />
                </button>

                <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-danger)' }}>Sell {holding.symbol}</h3>

                {/* Stock info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg Cost</div>
                        <div className="text-mono" style={{ fontWeight: '600' }}>₹{avgCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Price</div>
                        <div className="text-mono" style={{ fontWeight: '600', color: isProfit ? 'var(--color-success)' : 'var(--color-danger)' }}>₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    </div>
                </div>

                {/* Quantity input */}
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Sell Quantity (max: {holding.quantity})</label>
                    <input type="number" className="form-input text-mono" value={sellQty}
                        min={1} max={Number(holding.quantity)} step={1}
                        onChange={(e) => setSellQty(Math.min(Number(e.target.value), Number(holding.quantity)))} />
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        {[0.25, 0.5, 0.75, 1].map(pct => (
                            <button key={pct} className="btn btn-secondary" style={{ flex: 1, padding: '0.3rem', fontSize: '0.75rem' }}
                                onClick={() => setSellQty(Math.max(1, Math.floor(Number(holding.quantity) * pct)))}>
                                {pct * 100}%
                            </button>
                        ))}
                    </div>
                </div>

                {/* P&L Preview */}
                <div style={{ padding: '1rem', backgroundColor: isProfit ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', borderRadius: '8px', border: `1px solid ${isProfit ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`, marginBottom: '1.5rem' }}>
                    <div className="flex-between" style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Estimated Value</span>
                        <span className="text-mono" style={{ fontWeight: '600' }}>₹{estimatedValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex-between" style={{ fontSize: '0.875rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Estimated P&L</span>
                        <span className={`text-mono ${isProfit ? 'color-success' : 'color-danger'}`} style={{ fontWeight: '700' }}>
                            {isProfit ? '+' : ''}₹{estimatedPnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                    </div>
                </div>

                <button className="btn btn-danger" style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}
                    disabled={loading || sellQty <= 0}
                    onClick={() => onConfirm(holding, sellQty, currentPrice)}>
                    {loading ? 'Selling...' : `Sell ${sellQty} ${holding.symbol} at Market`}
                </button>
            </div>
        </div>
    );
};

export const Portfolio = () => {
    const { user } = useAuth();
    const [holdings, setHoldings] = useState([]);
    const [tradeHistory, setTradeHistory] = useState([]);
    const [wallet, setWallet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sellModal, setSellModal] = useState(null);
    const [selling, setSelling] = useState(false);
    const [statusMsg, setStatusMsg] = useState(null);
    const nav = useNavigate();

    // Live prices for all holdings
    const holdingSymbols = holdings.map(h => h.symbol);
    const { items: liveHoldings, isConnected } = useWatchlist(holdingSymbols);

    const downloadCSV = () => {
        if (holdings.length === 0) { alert('No holdings to export.'); return; }
        const header = 'Symbol,Type,Quantity,Avg Buy Price,Total Invested\n';
        const rows = holdings.map(h => `${h.symbol},${h.product_type},${h.quantity},${h.avg_buy_price},${h.total_invested}`).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `nexustrade_portfolio_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click(); URL.revokeObjectURL(url);
    };

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [hRes, ordersRes, wRes] = await Promise.all([
                supabase.from('holdings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
                supabase.from('orders').select('*').eq('user_id', user.id).eq('status', 'complete').order('created_at', { ascending: false }).limit(50),
                supabase.from('inr_wallet').select('balance, locked_balance').eq('user_id', user.id).single()
            ]);
            if (hRes.error) throw hRes.error;
            setHoldings(hRes.data || []);
            setTradeHistory(ordersRes.data || []);
            if (wRes.data) setWallet(wRes.data);
        } catch (err) {
            console.error('Error fetching portfolio:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [user]);

    // Sell handler — uses the same atomic process_order RPC as BUY
    const handleSell = async (holding, sellQty, sellPrice) => {
        setSelling(true);
        try {
            // The process_order RPC handles everything atomically:
            // 1. Verifies holdings exist with sufficient quantity
            // 2. Creates order record (status: complete)
            // 3. Credits wallet with sale proceeds
            // 4. Updates/deletes holdings
            // 5. Records transaction with realized P&L
            const { error } = await supabase.rpc('process_order', {
                p_user_id: user.id,
                p_symbol: holding.symbol,
                p_order_type: 'market',
                p_side: 'SELL',
                p_quantity: sellQty,
                p_price: sellPrice,
                p_leverage: 1
            });

            if (error) throw error;

            const pnl = (sellPrice - Number(holding.avg_buy_price)) * sellQty;
            setStatusMsg({ type: 'success', text: `Sold ${sellQty} ${holding.symbol} @ ₹${sellPrice.toFixed(2)} — P&L: ${pnl >= 0 ? '+' : ''}₹${pnl.toFixed(0)}` });
            setSellModal(null);
            await fetchData();
        } catch (err) {
            console.error('Sell error:', err);
            setStatusMsg({ type: 'error', text: 'Failed to sell: ' + err.message });
        } finally {
            setSelling(false);
        }
    };

    // Computed metrics with live prices
    const walletBalance = wallet ? Number(wallet.balance) : 0;
    const lockedBalance = wallet ? Number(wallet.locked_balance) : 0;
    let totalInvested = 0;
    let currentValue = 0;

    holdings.forEach((h, i) => {
        const invested = Number(h.total_invested);
        totalInvested += invested;
        const live = liveHoldings[i];
        const price = live?.isLive ? live.ltp : Number(h.avg_buy_price);
        currentValue += price * Number(h.quantity);
    });

    const unrealizedPnl = currentValue - totalInvested;
    const totalEquity = walletBalance + currentValue;
    const allocatedPct = totalEquity > 0 ? ((lockedBalance / totalEquity) * 100).toFixed(1) : '0.0';

    // Compute realized P&L from completed sell orders
    // For each SELL, P&L = (sell_price - avg_buy_price_at_time) * qty
    // We pair BUY/SELL orders per symbol to compute this
    const realizedPnl = (() => {
        const buyAvg = {};
        // Process orders chronologically (oldest first) to build running avg cost
        const sorted = [...tradeHistory].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        let pnl = 0;
        sorted.forEach(o => {
            const sym = o.symbol;
            const qty = Number(o.quantity);
            const price = Number(o.avg_price || o.price);
            if (o.transaction_type === 'BUY') {
                if (!buyAvg[sym]) buyAvg[sym] = { qty: 0, cost: 0 };
                buyAvg[sym].cost = ((buyAvg[sym].qty * buyAvg[sym].cost) + (qty * price)) / (buyAvg[sym].qty + qty);
                buyAvg[sym].qty += qty;
            } else if (o.transaction_type === 'SELL') {
                const avgCost = buyAvg[sym]?.cost || price;
                pnl += (price - avgCost) * qty;
                if (buyAvg[sym]) buyAvg[sym].qty = Math.max(0, buyAvg[sym].qty - qty);
            }
        });
        return pnl;
    })();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Sell Modal */}
            {sellModal && (
                <SellModal
                    holding={sellModal.holding}
                    livePrice={sellModal.livePrice}
                    onClose={() => setSellModal(null)}
                    onConfirm={handleSell}
                    loading={selling}
                />
            )}

            {/* Status message */}
            {statusMsg && (
                <div style={{
                    padding: '1rem', borderRadius: '8px',
                    backgroundColor: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: statusMsg.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <span>{statusMsg.text}</span>
                    <button onClick={() => setStatusMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><X size={16} /></button>
                </div>
            )}

            <div className="flex-between">
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CircleDollarSign size={28} color="var(--accent-primary)" /> Global Portfolio
                    {isConnected && <Zap size={14} color="var(--color-success)" />}
                </h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-secondary" onClick={downloadCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Download size={16} /> Export CSV</button>
                    <button className="btn btn-primary" onClick={() => nav('/funds')}>Add Funds</button>
                </div>
            </div>

            {/* Metrics */}
            <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="card" style={{ flex: 1, borderLeft: '4px solid var(--accent-primary)' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Equity</span>
                    <div style={{ fontSize: '2rem', fontWeight: '700', fontFamily: 'var(--font-mono)', margin: '0.5rem 0' }}>₹{totalEquity.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                    <span className={`${unrealizedPnl >= 0 ? 'color-success' : 'color-danger'} text-mono`} style={{ fontSize: '0.875rem' }}>{unrealizedPnl >= 0 ? '+' : ''}₹{unrealizedPnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })} unrealized</span>
                </div>
                <div className="card" style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Available Cash</span>
                    <div style={{ fontSize: '2rem', fontWeight: '700', fontFamily: 'var(--font-mono)', margin: '0.5rem 0' }}>₹{walletBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{allocatedPct}% Allocated</span>
                </div>
                <div className="card" style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Realized P&L</span>
                    <div style={{ fontSize: '2rem', fontWeight: '700', fontFamily: 'var(--font-mono)', margin: '0.5rem 0', color: realizedPnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{realizedPnl >= 0 ? '+' : ''}₹{realizedPnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>All time</span>
                </div>
            </div>

            {/* Holdings table with SELL button */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="card-header" style={{ padding: '1.25rem 1.5rem', marginBottom: 0, borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
                    <h3 className="card-title">Holdings & Open Positions</h3>
                    <span className="badge" style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>{holdings.length}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 1fr 1fr 1fr 1fr 0.8fr', padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                    <div>Instrument</div>
                    <div>Qty</div>
                    <div>Avg Cost</div>
                    <div>LTP</div>
                    <div>P&L</div>
                    <div>Return</div>
                    <div>Action</div>
                </div>

                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading holdings...</div>
                ) : holdings.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No open positions. Start trading from the Markets page!</div>
                ) : (
                    holdings.map((h, i) => {
                        const live = liveHoldings[i];
                        const currentPrice = live?.isLive ? live.ltp : Number(h.avg_buy_price);
                        const pnl = (currentPrice - Number(h.avg_buy_price)) * Number(h.quantity);
                        const pnlPct = ((currentPrice - Number(h.avg_buy_price)) / Number(h.avg_buy_price)) * 100;
                        const isPos = pnl >= 0;

                        return (
                            <div key={h.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 1fr 1fr 1fr 1fr 0.8fr', padding: '0.9rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {h.symbol}
                                        {live?.isLive && <Zap size={10} color="var(--color-success)" />}
                                    </div>
                                    <span className="badge" style={{ backgroundColor: 'var(--bg-surface-highlight)', color: 'var(--text-secondary)', fontSize: '0.65rem' }}>{h.product_type}</span>
                                </div>
                                <div className="text-mono">{h.quantity}</div>
                                <div className="text-mono">₹{Number(h.avg_buy_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                <div className="text-mono" style={{ color: live?.isLive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                <div className={`text-mono ${isPos ? 'color-success' : 'color-danger'}`} style={{ fontWeight: '600' }}>{isPos ? '+' : ''}₹{Math.abs(pnl).toFixed(0)}</div>
                                <div>
                                    <span className={`badge ${isPos ? 'badge-success' : 'badge-danger'}`}>
                                        {isPos ? <ArrowUpRight size={12} style={{ marginRight: '2px' }} /> : <ArrowDownRight size={12} style={{ marginRight: '2px' }} />}
                                        {Math.abs(pnlPct).toFixed(2)}%
                                    </span>
                                </div>
                                <div>
                                    <button className="btn btn-danger" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                                        onClick={() => setSellModal({ holding: h, livePrice: currentPrice })}>
                                        SELL
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Trade History (from orders table) */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><History size={20} /> Trade History</h3>
                {loading ? (
                    <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>Loading...</div>
                ) : tradeHistory.length === 0 ? (
                    <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>No trades yet. Buy stocks from the Markets page to get started!</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {tradeHistory.map((o) => {
                            const isBuy = o.transaction_type === 'BUY';
                            const orderPrice = Number(o.avg_price || o.price);
                            return (
                                <div key={o.id} style={{ backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '8px', padding: '0.75rem 1rem', border: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: '1fr 1fr 0.8fr 1fr', alignItems: 'center', gap: '1rem' }}>
                                    <div>
                                        <span className={isBuy ? 'color-success' : 'color-danger'} style={{ fontWeight: '600' }}>{o.transaction_type}</span>
                                        <span style={{ fontWeight: '600', marginLeft: '0.5rem' }}>{o.symbol}</span>
                                    </div>
                                    <div className="text-mono" style={{ fontSize: '0.85rem' }}>{o.quantity} × ₹{orderPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                    <div>
                                        <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', fontSize: '0.65rem' }}>{o.status?.toUpperCase()}</span>
                                    </div>
                                    <div className="text-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>{new Date(o.created_at).toLocaleString()}</div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
