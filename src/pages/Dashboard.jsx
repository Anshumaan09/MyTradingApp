import React, { useState, useEffect, useRef } from 'react';
import { ArrowUpRight, ArrowDownRight, Activity, DollarSign, PieChart, Sparkles, TrendingUp, TrendingDown, Zap, Bitcoin, Brain, Bell, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createChart, AreaSeries } from 'lightweight-charts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';
import { useWatchlist } from '../lib/useMarketData';

const PerformanceChart = ({ equity }) => {
    const chartRef = useRef(null);

    useEffect(() => {
        if (!chartRef.current) return;
        let chart;
        try {
            chart = createChart(chartRef.current, {
                width: chartRef.current.clientWidth,
                height: 280,
                layout: { background: { color: 'transparent' }, textColor: '#94a3b8' },
                grid: { vertLines: { visible: false }, horzLines: { color: 'rgba(45,45,59,0.3)' } },
                rightPriceScale: { borderVisible: false },
                timeScale: { borderVisible: false, timeVisible: true },
            });

            const series = chart.addSeries(AreaSeries, {
                lineColor: '#3b82f6',
                topColor: 'rgba(59, 130, 246, 0.4)',
                bottomColor: 'rgba(59, 130, 246, 0.02)',
                lineWidth: 2,
            });

            const base = equity || 50000;
            const data = [];
            let value = base * 0.92;
            for (let i = 30; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().slice(0, 10);
                value += (Math.random() - 0.35) * (base * 0.008);
                data.push({ time: dateStr, value: Math.max(value, base * 0.85) });
            }
            data[data.length - 1].value = base;
            series.setData(data);
            chart.timeScale().fitContent();

            const handleResize = () => {
                if (chartRef.current) chart.applyOptions({ width: chartRef.current.clientWidth });
            };
            window.addEventListener('resize', handleResize);
            return () => { window.removeEventListener('resize', handleResize); chart.remove(); };
        } catch (err) {
            console.error('Dashboard chart error:', err);
        }
    }, [equity]);

    return <div ref={chartRef} style={{ flex: 1, minHeight: '280px' }} />;
};

const StatCard = ({ title, value, change, isPositive, icon }) => (
    <div className="card">
        <div className="card-header" style={{ marginBottom: '0.5rem' }}>
            <span className="form-label" style={{ marginBottom: 0 }}>{title}</span>
            <div style={{ color: 'var(--text-muted)' }}>{icon}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>{value}</span>
            <span className={`badge ${isPositive ? 'badge-success' : 'badge-danger'}`} style={{ marginBottom: '0.5rem' }}>
                {isPositive ? <ArrowUpRight size={14} style={{ marginRight: '2px' }} /> : <ArrowDownRight size={14} style={{ marginRight: '2px' }} />}
                {change}
            </span>
        </div>
    </div>
);

// Live ticking market strip component
const MarketStrip = ({ symbol, label }) => {
    const { items, isConnected } = useWatchlist([symbol]);
    const item = items[0];

    return (
        <div className="card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {label}
                    {isConnected && item?.isLive && <Zap size={10} color="var(--color-success)" />}
                </div>
                <div className="text-mono" style={{
                    fontSize: '1.125rem', fontWeight: '700',
                    transition: 'color 0.15s',
                    color: item?.isLive ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}>
                    ₹{item?.ltp ? item.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
                </div>
            </div>
            <div className={`badge ${item?.changePercent >= 0 ? 'badge-success' : 'badge-danger'}`}>
                {item?.changePercent >= 0 ? <TrendingUp size={14} style={{ marginRight: '4px' }} /> : <TrendingDown size={14} style={{ marginRight: '4px' }} />}
                {item?.changePercent !== undefined ? `${item.changePercent >= 0 ? '+' : ''}${item.changePercent.toFixed(2)}%` : '—'}
            </div>
        </div>
    );
};

export const Dashboard = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [wallet, setWallet] = useState(null);
    const [holdings, setHoldings] = useState([]);

    // Live prices for holdings
    const holdingSymbols = holdings.map(h => h.symbol);
    const { items: liveHoldings } = useWatchlist(holdingSymbols);

    useEffect(() => {
        if (!user) return;
        const fetchDashboardData = async () => {
            try {
                const [profileRes, walletRes, holdingsRes] = await Promise.all([
                    supabase.from('users').select('full_name').eq('id', user.id).single(),
                    supabase.from('inr_wallet').select('balance, locked_balance').eq('user_id', user.id).single(),
                    supabase.from('holdings').select('*').eq('user_id', user.id)
                ]);

                if (profileRes.data) setProfile(profileRes.data);
                if (walletRes.data) setWallet(walletRes.data);
                if (holdingsRes.data) setHoldings(holdingsRes.data);
            } catch (err) {
                console.error('Dashboard fetch error:', err);
            }
        };
        fetchDashboardData();
    }, [user]);

    const userName = profile?.full_name || user?.email?.split('@')[0] || 'Trader';
    const walletBalance = wallet ? Number(wallet.balance) : 0;
    const lockedMargin = wallet ? Number(wallet.locked_balance) : 0;

    // Compute portfolio with live prices where available
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
    const marginUtilization = totalEquity > 0 ? ((lockedMargin / totalEquity) * 100) : 0;

    const nav = useNavigate();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h1 style={{ marginBottom: '0.5rem' }}>Dashboard</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {userName}. Here's your portfolio overview.</p>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                {[
                    { label: 'Trade Crypto', icon: <Bitcoin size={20} />, path: '/crypto', color: '#f7931a', bg: 'rgba(247,147,26,0.1)' },
                    { label: 'AI Insights', icon: <Brain size={20} />, path: '/ai-insights', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
                    { label: 'My Goals', icon: <Target size={20} />, path: '/investments', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
                    { label: 'Notifications', icon: <Bell size={20} />, path: '/notifications', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
                ].map(a => (
                    <div key={a.label} className="card" onClick={() => nav(a.path)}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', transition: 'border-color 0.2s, transform 0.15s', borderColor: 'var(--border-subtle)' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color }}>{a.icon}</div>
                        <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>{a.label}</span>
                        <ArrowUpRight size={14} color="var(--text-muted)" style={{ marginLeft: 'auto' }} />
                    </div>
                ))}
            </div>

            {/* AI Morning Brief */}
            <div className="card" style={{
                background: 'linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                display: 'flex', gap: '1.5rem', alignItems: 'flex-start'
            }}>
                <div style={{
                    padding: '1rem', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Sparkles size={24} />
                </div>
                <div>
                    <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        AI Morning Brief <span className="badge" style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}>Live</span>
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.9375rem' }}>
                        Markets are opening positive today following the US Fed's dovish comments. NIFTY50 is expected to gap up by 0.5%. Your portfolio has {holdings.length} active position{holdings.length !== 1 ? 's' : ''} worth ₹{currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}. {unrealizedPnl >= 0 ? 'Consider setting trailing stop-losses to protect gains.' : 'Monitor your positions closely for recovery opportunities.'}
                    </p>
                </div>
            </div>

            {/* LIVE Market Strips — ticking every second */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                <MarketStrip symbol="RELIANCE" label="RELIANCE" />
                <MarketStrip symbol="TCS" label="TCS" />
                <MarketStrip symbol="HDFCBANK" label="HDFC BANK" />
                <MarketStrip symbol="INFY" label="INFOSYS" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                <StatCard
                    title="Total Portfolio Value"
                    value={`₹${totalEquity.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                    change={unrealizedPnl >= 0 ? `+${((unrealizedPnl / (totalEquity || 1)) * 100).toFixed(2)}%` : `${((unrealizedPnl / (totalEquity || 1)) * 100).toFixed(2)}%`}
                    isPositive={unrealizedPnl >= 0}
                    icon={<DollarSign size={20} />}
                />
                <StatCard
                    title="Unrealized PNL"
                    value={`${unrealizedPnl >= 0 ? '+' : ''}₹${unrealizedPnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                    change="Today"
                    isPositive={unrealizedPnl >= 0}
                    icon={<Activity size={20} />}
                />
                <StatCard
                    title="Margin Utilization"
                    value={`${marginUtilization.toFixed(2)}%`}
                    change={`₹${lockedMargin.toLocaleString('en-IN', { maximumFractionDigits: 0 })} locked`}
                    isPositive={marginUtilization < 50}
                    icon={<PieChart size={20} />}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                    <div className="card-header">
                        <span className="card-title">Portfolio Performance</span>
                        <span className="badge" style={{ backgroundColor: 'var(--bg-surface-highlight)', color: 'var(--text-secondary)' }}>30D</span>
                    </div>
                    <PerformanceChart equity={totalEquity} />
                </div>

                <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                    <div className="card-header">
                        <span className="card-title">Open Positions</span>
                        <span className="badge" style={{ backgroundColor: 'var(--bg-surface-highlight)', color: 'var(--text-secondary)' }}>{holdings.length}</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
                        {holdings.length === 0 ? (
                            <div className="flex-center" style={{ flex: 1, color: 'var(--text-muted)' }}>No open positions</div>
                        ) : (
                            holdings.map((h, i) => {
                                const live = liveHoldings[i];
                                const currentPrice = live?.isLive ? live.ltp : Number(h.avg_buy_price);
                                const pnl = (currentPrice - Number(h.avg_buy_price)) * Number(h.quantity);
                                const isPos = pnl >= 0;
                                return (
                                    <div key={h.id} style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                        <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                                            <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {h.symbol}
                                                <span className="badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)' }}>{h.product_type}</span>
                                                {live?.isLive && <Zap size={10} color="var(--color-success)" />}
                                            </span>
                                            <span className={`${isPos ? 'color-success' : 'color-danger'} text-mono`} style={{ fontWeight: '600' }}>{isPos ? '+' : ''}₹{pnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                        </div>
                                        <div className="flex-between" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            <span>{h.quantity} units @ ₹{Number(h.avg_buy_price).toLocaleString()}</span>
                                            <span className="text-mono">LTP: ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
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
