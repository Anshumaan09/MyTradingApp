import React, { useState, useEffect } from 'react';
import { Wallet, ArrowUpRight, ArrowDownRight, CreditCard, Landmark, History, Lock, Unlock, Copy, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../lib/useAuth';
import { supabase } from '../lib/supabase';
import { getWalletState, getWalletTransactions, depositFunds, withdrawFunds } from '../lib/walletService';
import { createRazorpayOrder, verifyRazorpayPayment, initiateWithdrawal } from '../lib/paymentGateway';

export const Funds = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('deposit');
    const [amount, setAmount] = useState('');
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [method, setMethod] = useState('upi');
    const [statusMsg, setStatusMsg] = useState(null); // { type: 'success' | 'error', text: '' }

    const fetchWalletData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [walletData, txnData] = await Promise.all([
                getWalletState(user.id),
                getWalletTransactions(user.id, 10)
            ]);
            setWallet(walletData);
            setTransactions(txnData.transactions);
        } catch (err) {
            console.error('Error fetching wallet:', err);
            // Fallback to direct query if RPC not available
            try {
                const { data } = await supabase.from('inr_wallet').select('*').eq('user_id', user.id).single();
                setWallet(data ? { balance: Number(data.balance), lockedBalance: Number(data.locked_balance), freeBalance: Number(data.balance) - Number(data.locked_balance), totalDeposited: Number(data.total_deposited), totalWithdrawn: Number(data.total_withdrawn) } : null);
                const { data: txns } = await supabase.from('wallet_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);
                setTransactions(txns || []);
            } catch (e2) { console.error(e2); }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchWalletData(); }, [user]);

    const handleTransaction = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setStatusMsg(null);

        const numAmount = Number(amount);
        if (numAmount < 100) {
            setStatusMsg({ type: 'error', text: 'Minimum amount is ₹100' });
            setProcessing(false);
            return;
        }

        try {
            if (activeTab === 'deposit') {
                if (method === 'upi') {
                    // Use Razorpay UPI flow
                    const order = await createRazorpayOrder(user.id, numAmount);
                    // In production: open Razorpay Checkout SDK
                    // For demo: simulate immediate success
                    await verifyRazorpayPayment(order.orderId, null, null);
                    setStatusMsg({ type: 'success', text: `₹${numAmount.toLocaleString('en-IN')} deposited via UPI` });
                } else {
                    // Netbanking, NEFT — use direct deposit
                    await depositFunds(user.id, numAmount, method);
                    setStatusMsg({ type: 'success', text: `₹${numAmount.toLocaleString('en-IN')} deposited via ${method.toUpperCase()}` });
                }
            } else {
                // Withdrawal — try new ledger, fallback to old function
                try {
                    await withdrawFunds(user.id, numAmount, method);
                } catch {
                    await supabase.rpc('simulate_fund_transfer', { p_user_id: user.id, p_operation: 'withdraw', p_amount: numAmount, p_method: method.toUpperCase() });
                }
                setStatusMsg({ type: 'success', text: `₹${numAmount.toLocaleString('en-IN')} withdrawn via ${method.toUpperCase()}. ${method === 'upi' || method === 'imps' ? 'Instant settlement.' : 'Expected: 2-4 hours.'}` });
            }
            setAmount('');
            fetchWalletData();
        } catch (err) {
            setStatusMsg({ type: 'error', text: err.message || 'Transaction failed' });
        } finally {
            setProcessing(false);
        }
    };

    const quickAmounts = [1000, 5000, 10000, 25000, 50000];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="flex-between">
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Wallet size={28} color="var(--accent-primary)" /> Ledger & Funds</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>

                {/* Left Panel: Balances & Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Primary Balance */}
                    <div className="card glass-panel" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Available Margin (INR)</span>
                        <div style={{ fontSize: '2.5rem', fontWeight: '700', fontFamily: 'var(--font-mono)', margin: '0.5rem 0', color: 'var(--text-primary)' }}>
                            ₹{wallet ? wallet.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                            <span className="badge" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Unlock size={12} /> Free: ₹{wallet ? (wallet.freeBalance ?? (wallet.balance - wallet.lockedBalance)).toLocaleString('en-IN') : '0'}
                            </span>
                            <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Lock size={12} /> Locked: ₹{wallet ? wallet.lockedBalance.toLocaleString('en-IN') : '0'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <span className="badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-primary)' }}>
                                ↑ ₹{wallet ? wallet.totalDeposited.toLocaleString('en-IN') : '0'}
                            </span>
                            <span className="badge" style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', color: 'var(--accent-secondary)' }}>
                                ↓ ₹{wallet ? wallet.totalWithdrawn.toLocaleString('en-IN') : '0'}
                            </span>
                        </div>
                    </div>

                    {/* Action Panel */}
                    <div className="card">
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
                            <button
                                className={`btn ${activeTab === 'deposit' ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ flex: 1, borderRadius: '8px 8px 0 0', borderBottom: activeTab === 'deposit' ? 'none' : '' }}
                                onClick={() => { setActiveTab('deposit'); setStatusMsg(null); }}
                            >
                                <ArrowUpRight size={16} /> Deposit
                            </button>
                            <button
                                className={`btn ${activeTab === 'withdraw' ? 'btn-danger' : 'btn-secondary'}`}
                                style={{ flex: 1, borderRadius: '8px 8px 0 0', borderBottom: activeTab === 'withdraw' ? 'none' : '' }}
                                onClick={() => { setActiveTab('withdraw'); setStatusMsg(null); }}
                            >
                                <ArrowDownRight size={16} /> Withdraw
                            </button>
                        </div>

                        {statusMsg && (
                            <div style={{
                                padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem',
                                backgroundColor: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'var(--color-danger-bg)',
                                border: `1px solid ${statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                color: statusMsg.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
                                display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}>
                                {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                {statusMsg.text}
                            </div>
                        )}

                        <form onSubmit={handleTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Amount (INR)</label>
                                <input type="number" className="form-input text-mono" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} required min="100" step="1" />
                                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                    {quickAmounts.map(q => (
                                        <button key={q} type="button" className="badge" onClick={() => setAmount(String(q))}
                                            style={{ cursor: 'pointer', padding: '4px 10px', backgroundColor: amount === String(q) ? 'var(--accent-primary)' : 'var(--bg-surface)', color: amount === String(q) ? 'white' : 'var(--text-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '100px', fontSize: '0.75rem', transition: 'all 0.15s' }}>
                                            ₹{q.toLocaleString('en-IN')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Payment Method</label>
                                <select className="form-input" value={method} onChange={(e) => setMethod(e.target.value)}>
                                    <option value="upi">UPI (Instant)</option>
                                    <option value="netbanking">Net Banking</option>
                                    {activeTab === 'withdraw' && <option value="imps">IMPS (Instant)</option>}
                                    <option value="neft">NEFT (2-4 hrs)</option>
                                </select>
                            </div>

                            <button type="submit" className={`btn ${activeTab === 'deposit' ? 'btn-primary' : 'btn-danger'}`} disabled={processing}
                                style={{ padding: '0.75rem', fontSize: '1rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                {processing ? 'Processing...' : (
                                    activeTab === 'deposit'
                                        ? <><ArrowUpRight size={18} /> Add ₹{amount ? Number(amount).toLocaleString('en-IN') : '...'}</>
                                        : <><ArrowDownRight size={18} /> Withdraw ₹{amount ? Number(amount).toLocaleString('en-IN') : '...'}</>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Panel: Transaction History */}
                <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div className="card-header" style={{ padding: '1.5rem', marginBottom: 0, borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
                        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><History size={20} /> Transaction Ledger</h3>
                    </div>

                    <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
                        {loading ? (
                            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Loading ledger...</div>
                        ) : transactions.length === 0 ? (
                            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No wallet transactions found. Make your first deposit!</div>
                        ) : (
                            transactions.map((tx) => {
                                const isCredit = tx.direction === 'CREDIT';
                                const typeLabels = {
                                    'DEPOSIT': 'Deposit', 'WITHDRAWAL': 'Withdrawal', 'TRADE_MARGIN': 'Trade Margin',
                                    'TRADE_CREDIT': 'Trade Credit', 'FUND_LOCK': 'Margin Locked', 'FUND_UNLOCK': 'Margin Released',
                                    'WITHDRAW': 'Withdrawal'
                                };
                                return (
                                    <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '8px', transition: 'border-color 0.15s' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: '50%',
                                                backgroundColor: isCredit ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                color: isCredit ? 'var(--color-success)' : 'var(--color-danger)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                {tx.type === 'FUND_LOCK' ? <Lock size={18} /> :
                                                    tx.type === 'FUND_UNLOCK' ? <Unlock size={18} /> :
                                                        isCredit ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{typeLabels[tx.type] || tx.type}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(tx.created_at).toLocaleString()}</div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div className="text-mono" style={{ fontWeight: '700', fontSize: '1.05rem', color: isCredit ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                                {isCredit ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                                            </div>
                                            {tx.description && (
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {tx.description}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
