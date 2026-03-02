import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
import { AlertTriangle, ArrowRight, ShieldCheck, Clock, History, Filter, RefreshCw } from 'lucide-react';
import { EducationOverlay } from '../components/EducationOverlay';

export const Orders = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [symbol, setSymbol] = useState(location.state?.symbol || 'RELIANCE');
    const [side, setSide] = useState('BUY');
    const [orderType, setOrderType] = useState('limit');
    const [quantity, setQuantity] = useState('10');
    const [price, setPrice] = useState('2890');
    const [triggerPrice, setTriggerPrice] = useState('2850');
    const [leverage, setLeverage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);
    const [recentOrders, setRecentOrders] = useState([]);
    const [allOrders, setAllOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('ticket');
    const [historyFilter, setHistoryFilter] = useState('all');
    const [statusMsg, setStatusMsg] = useState(null);

    const fetchOrderData = async () => {
        if (!user) return;
        try {
            const [wRes, oRes, allRes] = await Promise.all([
                supabase.from('inr_wallet').select('balance').eq('user_id', user.id).single(),
                supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
                supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100)
            ]);
            if (wRes.data) setWalletBalance(Number(wRes.data.balance));
            if (oRes.data) setRecentOrders(oRes.data);
            if (allRes.data) setAllOrders(allRes.data);
        } catch (err) {
            console.error('Error fetching order data:', err);
        }
    };

    useEffect(() => { fetchOrderData(); }, [user]);

    const [showRiskWarning, setShowRiskWarning] = useState(false);
    const [foEnabled, setFoEnabled] = useState(false);
    const [showFOOverlay, setShowFOOverlay] = useState(false);

    React.useEffect(() => {
        if (!foEnabled && (symbol.includes('NIFTY') || symbol.includes('FUT') || symbol.includes('OPT'))) {
            setShowFOOverlay(true);
        }
    }, [symbol, foEnabled]);

    const currentMarketPrice = Number(price) || 0;
    const availableMargin = walletBalance;
    const requiredMargin = orderType === 'market'
        ? (Number(quantity) * currentMarketPrice) / leverage
        : (Number(quantity) * Number(price)) / leverage;
    const isMarginSufficient = requiredMargin <= availableMargin;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (leverage > 10 && !showRiskWarning) { setShowRiskWarning(true); return; }
        if (!isMarginSufficient) { setStatusMsg({ type: 'error', text: 'Insufficient margin. Reduce quantity or add funds.' }); return; }

        setLoading(true);
        try {
            if (orderType === 'gtt') {
                const { error } = await supabase.from('gtt_orders').insert([{
                    user_id: user.id, exchange: 'MOCK', symbol,
                    gtt_type: 'single', transaction_type: side,
                    quantity: Number(quantity), trigger_price: Number(triggerPrice),
                    limit_price: Number(price),
                    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                }]);
                if (error) throw error;
                setStatusMsg({ type: 'success', text: `GTT set: ${side} ${quantity} ${symbol} @ trigger ₹${triggerPrice}` });
            } else {
                const { error } = await supabase.rpc('process_order', {
                    p_user_id: user.id, p_symbol: symbol, p_order_type: orderType,
                    p_side: side, p_quantity: Number(quantity),
                    p_price: orderType === 'market' ? currentMarketPrice : Number(price),
                    p_leverage: leverage
                });
                if (error) throw error;
                setStatusMsg({ type: 'success', text: `${side} ${quantity} ${symbol} executed @ ₹${price}` });
            }
            setQuantity('10');
            setShowRiskWarning(false);
            await fetchOrderData();
        } catch (err) {
            console.error(err);
            setStatusMsg({ type: 'error', text: 'Order failed: ' + err.message });
        } finally {
            setLoading(false);
        }
    };

    // Filtered order history
    const filteredOrders = allOrders.filter(o => {
        if (historyFilter === 'all') return true;
        return o.status === historyFilter;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'complete': return { bg: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' };
            case 'cancelled': return { bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)' };
            case 'open': return { bg: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)' };
            case 'rejected': return { bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)' };
            default: return { bg: 'var(--bg-surface-highlight)', color: 'var(--text-secondary)' };
        }
    };

    return (
        <>
            {showFOOverlay && (
                <EducationOverlay
                    onComplete={() => { setFoEnabled(true); setShowFOOverlay(false); }}
                    onCancel={() => { setShowFOOverlay(false); setSymbol('RELIANCE'); }}
                />
            )}

            {/* Tab header */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                {[{ key: 'ticket', label: 'Order Ticket', icon: <ArrowRight size={16} /> }, { key: 'history', label: 'Order History', icon: <History size={16} /> }].map(tab => (
                    <button key={tab.key} style={{
                        background: activeTab === tab.key ? 'var(--bg-surface-elevated)' : 'none',
                        border: 'none', color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
                        padding: '0.6rem 1.25rem', borderRadius: '6px', cursor: 'pointer',
                        fontWeight: activeTab === tab.key ? '600' : '500', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
                    }} onClick={() => setActiveTab(tab.key)}>
                        {tab.icon} {tab.label}
                        {tab.key === 'history' && allOrders.length > 0 && (
                            <span style={{ fontSize: '0.7rem', backgroundColor: 'var(--bg-surface)', padding: '1px 6px', borderRadius: '10px', color: 'var(--text-muted)' }}>{allOrders.length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Status message */}
            {statusMsg && (
                <div style={{
                    padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem',
                    backgroundColor: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: statusMsg.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <span>{statusMsg.text}</span>
                    <button onClick={() => setStatusMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
                </div>
            )}

            {activeTab === 'ticket' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 450px) 1fr', gap: '2rem' }}>
                    {/* Order Ticket */}
                    <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ArrowRight size={20} color="var(--accent-primary)" /> Order Ticket
                        </h2>

                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', backgroundColor: 'var(--bg-base)', padding: '0.5rem', borderRadius: '8px' }}>
                            <button type="button" className={`btn ${side === 'BUY' ? 'btn-success' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => setSide('BUY')}>BUY</button>
                            <button type="button" className={`btn ${side === 'SELL' ? 'btn-danger' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => setSide('SELL')}>SELL</button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Symbol</label>
                                <input type="text" className="form-input text-mono" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} required />
                            </div>

                            <div className="flex-between">
                                <div className="form-group" style={{ flex: 1, marginRight: '0.5rem' }}>
                                    <label className="form-label">Order Type</label>
                                    <select className="form-input" value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                                        <option value="market">Market</option>
                                        <option value="limit">Limit</option>
                                        <option value="sl">Stop Loss</option>
                                        <option value="gtt">GTT</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex: 1, marginLeft: '0.5rem' }}>
                                    <label className="form-label">Product</label>
                                    <select className="form-input text-mono" value={leverage} onChange={(e) => { setLeverage(Number(e.target.value)); setShowRiskWarning(false); }}>
                                        <option value="1">CNC (Delivery)</option>
                                        <option value="5">MIS (Intraday)</option>
                                        <option value="10">NRML (F&O)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex-between">
                                <div className="form-group" style={{ flex: 1, marginRight: '0.5rem' }}>
                                    <label className="form-label">Quantity</label>
                                    <input type="number" step="1" min="1" className="form-input text-mono" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                                </div>
                                {orderType === 'gtt' ? (
                                    <div style={{ display: 'flex', gap: '0.5rem', flex: 2, marginLeft: '0.5rem' }}>
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label className="form-label">Trigger</label>
                                            <input type="number" step="0.05" className="form-input text-mono" value={triggerPrice} onChange={(e) => setTriggerPrice(e.target.value)} required />
                                        </div>
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label className="form-label">Limit</label>
                                            <input type="number" step="0.05" className="form-input text-mono" value={price} onChange={(e) => setPrice(e.target.value)} required />
                                        </div>
                                    </div>
                                ) : orderType !== 'market' ? (
                                    <div className="form-group" style={{ flex: 1, marginLeft: '0.5rem' }}>
                                        <label className="form-label">Price (₹)</label>
                                        <input type="number" step="0.05" className="form-input text-mono" value={price} onChange={(e) => setPrice(e.target.value)} required />
                                    </div>
                                ) : <div style={{ flex: 1, marginLeft: '0.5rem' }}></div>}
                            </div>

                            <div style={{ backgroundColor: 'var(--bg-surface-highlight)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--border-subtle)' }}>
                                <div className="flex-between" style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Required Margin</span>
                                    <span className={`text-mono ${isMarginSufficient ? '' : 'color-danger'}`} style={{ fontWeight: '600' }}>₹{requiredMargin.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                </div>
                                <div className="flex-between" style={{ fontSize: '0.875rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Available</span>
                                    <span className="text-mono color-success" style={{ fontWeight: '600' }}>₹{availableMargin.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                </div>
                            </div>

                            {showRiskWarning && leverage > 10 && (
                                <div style={{ backgroundColor: 'var(--color-warning)', color: '#000', padding: '1rem', borderRadius: '8px', fontSize: '0.875rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <AlertTriangle size={24} /><div><strong>High Leverage Warning</strong><br />Trading at {leverage}x leverage. Press Submit again to proceed.</div>
                                </div>
                            )}

                            <button type="submit" className={`btn ${side === 'BUY' ? 'btn-success' : 'btn-danger'}`}
                                style={{ padding: '1rem', fontSize: '1rem', marginTop: '0.5rem', opacity: !isMarginSufficient ? 0.5 : 1 }}
                                disabled={loading || !isMarginSufficient}>
                                {loading ? 'Placing...' : `${side} ${quantity} ${symbol}`}
                            </button>
                        </form>
                    </div>

                    {/* Right panel: Recent Orders */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={18} /> Recent Orders</span>
                                <button className="btn btn-secondary" style={{ padding: '0.3rem 0.5rem' }} onClick={fetchOrderData}><RefreshCw size={14} /></button>
                            </div>
                            {recentOrders.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)' }}>No orders yet. Place your first trade!</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {recentOrders.map(o => {
                                        const sc = getStatusColor(o.status);
                                        return (
                                            <div key={o.id} style={{ backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '8px', padding: '0.75rem 1rem', border: '1px solid var(--border-subtle)' }}>
                                                <div className="flex-between" style={{ marginBottom: '0.25rem' }}>
                                                    <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                                                        <span className={o.transaction_type === 'BUY' ? 'color-success' : 'color-danger'}>{o.transaction_type}</span> {o.symbol}
                                                    </span>
                                                    <span className="badge" style={{ backgroundColor: sc.bg, color: sc.color, fontSize: '0.65rem' }}>{o.status?.toUpperCase()}</span>
                                                </div>
                                                <div className="flex-between" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    <span className="text-mono">₹{Number(o.price).toLocaleString('en-IN')} × {o.quantity}</span>
                                                    <span>{new Date(o.created_at).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="card" style={{ flex: 1, backgroundColor: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                            <div className="card-header"><span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)' }}><ShieldCheck size={20} /> Risk Assessment</span></div>
                            <ul style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <li>Safe-by-default: leverage capped at venue limits.</li>
                                <li>Kill-Switch at -20% daily drawdown.</li>
                                <li>Slippage protection: ±1% tolerance on limits.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* ORDER HISTORY TAB */}
            {activeTab === 'history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="flex-between">
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><History size={22} /> Order History</h2>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <Filter size={14} color="var(--text-muted)" />
                            {['all', 'complete', 'open', 'cancelled'].map(f => (
                                <button key={f} className={`btn ${historyFilter === f ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', textTransform: 'capitalize' }}
                                    onClick={() => setHistoryFilter(f)}>
                                    {f === 'all' ? 'All' : f}
                                </button>
                            ))}
                            <button className="btn btn-secondary" style={{ padding: '0.3rem 0.5rem' }} onClick={fetchOrderData}><RefreshCw size={14} /></button>
                        </div>
                    </div>

                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        {/* Header */}
                        <div style={{ display: 'grid', gridTemplateColumns: '0.5fr 1.2fr 0.8fr 0.6fr 0.8fr 0.6fr 0.6fr 0.6fr 1fr', padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', backgroundColor: 'var(--bg-surface-elevated)' }}>
                            <div>Side</div>
                            <div>Symbol</div>
                            <div>Type</div>
                            <div>Qty</div>
                            <div>Price</div>
                            <div>Filled</div>
                            <div>Charges</div>
                            <div>Status</div>
                            <div style={{ textAlign: 'right' }}>Time</div>
                        </div>

                        {filteredOrders.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                {allOrders.length === 0 ? 'No orders yet. Place your first trade from the Order Ticket!' : `No ${historyFilter} orders found.`}
                            </div>
                        ) : (
                            <div style={{ maxHeight: 'calc(100vh - 320px)', overflowY: 'auto' }}>
                                {filteredOrders.map(o => {
                                    const sc = getStatusColor(o.status);
                                    return (
                                        <div key={o.id} style={{ display: 'grid', gridTemplateColumns: '0.5fr 1.2fr 0.8fr 0.6fr 0.8fr 0.6fr 0.6fr 0.6fr 1fr', padding: '0.7rem 1.25rem', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center', fontSize: '0.85rem' }}>
                                            <div><span className={`badge ${o.transaction_type === 'BUY' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>{o.transaction_type}</span></div>
                                            <div style={{ fontWeight: '600' }}>{o.symbol}</div>
                                            <div style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{o.order_type}</div>
                                            <div className="text-mono">{o.quantity}</div>
                                            <div className="text-mono">₹{Number(o.price || o.avg_price || 0).toLocaleString('en-IN')}</div>
                                            <div className="text-mono">{o.filled_quantity || 0}</div>
                                            <div className="text-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>₹{Number(o.charges || 0).toFixed(0)}</div>
                                            <div><span className="badge" style={{ backgroundColor: sc.bg, color: sc.color, fontSize: '0.6rem' }}>{o.status?.toUpperCase()}</span></div>
                                            <div className="text-mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right' }}>{new Date(o.created_at).toLocaleString()}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};
