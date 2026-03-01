import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, PieChart, TrendingUp, Download, Calendar, ArrowUpRight, ArrowDownRight, Shield, Zap } from 'lucide-react';
import { createChart, HistogramSeries } from 'lightweight-charts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';

// Simulated portfolio allocation data
const ALLOCATION_DATA = [
    { sector: 'Banking', weight: 28.5, color: '#6366f1', value: 18525 },
    { sector: 'IT', weight: 22.3, color: '#3b82f6', value: 14495 },
    { sector: 'Pharma', weight: 12.8, color: '#10b981', value: 8320 },
    { sector: 'Auto', weight: 11.2, color: '#f59e0b', value: 7280 },
    { sector: 'FMCG', weight: 9.5, color: '#ec4899', value: 6175 },
    { sector: 'Energy', weight: 8.1, color: '#8b5cf6', value: 5265 },
    { sector: 'Crypto', weight: 4.8, color: '#f97316', value: 3120 },
    { sector: 'Others', weight: 2.8, color: '#6b7280', value: 1820 },
];

// Monthly P&L
const MONTHLY_PNL = [
    { month: 'Oct', pnl: 12400 }, { month: 'Nov', pnl: -3200 }, { month: 'Dec', pnl: 18700 },
    { month: 'Jan', pnl: 8500 }, { month: 'Feb', pnl: -1800 }, { month: 'Mar', pnl: 5200 },
];

const RISK_METRICS = [
    { name: 'Sharpe Ratio', value: '1.42', benchmark: '> 1.0', status: 'good', description: 'Risk-adjusted return. Higher is better.' },
    { name: 'Max Drawdown', value: '-8.3%', benchmark: '< 15%', status: 'good', description: 'Largest peak-to-trough decline.' },
    { name: 'Portfolio Beta', value: '0.92', benchmark: '≈ 1.0', status: 'neutral', description: 'Sensitivity to market movements.' },
    { name: 'Sortino Ratio', value: '1.68', benchmark: '> 1.5', status: 'good', description: 'Downside risk-adjusted return.' },
    { name: 'Win Rate', value: '67%', benchmark: '> 50%', status: 'good', description: 'Percentage of profitable trades.' },
    { name: 'Avg Holding Period', value: '14 days', benchmark: '—', status: 'neutral', description: 'Average time in a position.' },
];

const TAX_SUMMARY = [
    { type: 'Short-Term Capital Gains (STCG)', rate: '15%', gains: 28400, tax: 4260 },
    { type: 'Long-Term Capital Gains (LTCG)', rate: '10% (above ₹1L)', gains: 45200, tax: 3520 },
    { type: 'Crypto (Section 115BBH)', rate: '30%', gains: 12600, tax: 3780 },
    { type: 'F&O (Business Income)', rate: 'Slab Rate', gains: 18300, tax: 5490 },
];

const PnLChart = () => {
    const chartRef = useRef(null);
    useEffect(() => {
        if (!chartRef.current) return;
        let chart;
        try {
            chart = createChart(chartRef.current, {
                width: chartRef.current.clientWidth, height: 250,
                layout: { background: { color: 'transparent' }, textColor: '#94a3b8' },
                grid: { vertLines: { visible: false }, horzLines: { color: 'rgba(45,45,59,0.3)' } },
                rightPriceScale: { borderVisible: false }, timeScale: { borderVisible: false },
            });
            const series = chart.addSeries(HistogramSeries, {
                color: '#3b82f6',
            });
            const data = MONTHLY_PNL.map((m, i) => ({
                time: `2026-${String(i + 10 > 12 ? i - 2 : i + 10).padStart(2, '0')}-15`,
                value: m.pnl,
                color: m.pnl >= 0 ? '#10b981' : '#ef4444',
            }));
            series.setData(data);
            chart.timeScale().fitContent();
            const handleResize = () => { if (chartRef.current) chart.applyOptions({ width: chartRef.current.clientWidth }); };
            window.addEventListener('resize', handleResize);
            return () => { window.removeEventListener('resize', handleResize); chart.remove(); };
        } catch (e) { console.error(e); }
    }, []);
    return <div ref={chartRef} style={{ width: '100%', minHeight: '250px' }} />;
};

export const Analytics = () => {
    const { user } = useAuth();
    const [wallet, setWallet] = useState(0);
    const [period, setPeriod] = useState('6m');

    useEffect(() => {
        if (!user) return;
        supabase.from('inr_wallet').select('balance').eq('user_id', user.id).single()
            .then(({ data }) => { if (data) setWallet(Number(data.balance)); });
    }, [user]);

    const totalValue = ALLOCATION_DATA.reduce((s, a) => s + a.value, 0);
    const totalPnl = MONTHLY_PNL.reduce((s, m) => s + m.pnl, 0);
    const totalTax = TAX_SUMMARY.reduce((s, t) => s + t.tax, 0);

    const handleExport = () => {
        const csv = 'Month,P&L\n' + MONTHLY_PNL.map(m => `${m.month},${m.pnl}`).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'nexustrade_pnl_report.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="flex-between">
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><BarChart3 size={28} color="var(--accent-primary)" /> Analytics & Reports</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['1m', '3m', '6m', '1y', 'all'].map(p => (
                        <button key={p} className={`btn ${period === p ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}
                            onClick={() => setPeriod(p)}>{p.toUpperCase()}</button>
                    ))}
                    <button className="btn btn-secondary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                        <Download size={14} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Top row: Allocation + P&L */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
                {/* Allocation Donut */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><PieChart size={18} /> Portfolio Allocation</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {ALLOCATION_DATA.map(a => (
                            <div key={a.sector} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: a.color, flexShrink: 0 }}></div>
                                <span style={{ fontSize: '0.825rem', flex: 1 }}>{a.sector}</span>
                                <span className="text-mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>₹{a.value.toLocaleString()}</span>
                                <div style={{ width: '80px', height: '6px', backgroundColor: 'var(--bg-surface-highlight)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${a.weight}%`, height: '100%', backgroundColor: a.color, borderRadius: '3px' }}></div>
                                </div>
                                <span className="text-mono" style={{ fontSize: '0.7rem', width: '40px', textAlign: 'right' }}>{a.weight}%</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '8px', textAlign: 'center' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Total Portfolio</span>
                        <div className="text-mono" style={{ fontSize: '1.3rem', fontWeight: '700' }}>₹{totalValue.toLocaleString('en-IN')}</div>
                    </div>
                </div>

                {/* P&L Chart */}
                <div className="card">
                    <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TrendingUp size={18} /> Monthly P&L</h3>
                        <span className={`text-mono ${totalPnl >= 0 ? 'color-success' : 'color-danger'}`} style={{ fontWeight: '700', fontSize: '1.1rem' }}>{totalPnl >= 0 ? '+' : ''}₹{totalPnl.toLocaleString('en-IN')}</span>
                    </div>
                    <PnLChart />
                    <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '0.75rem' }}>
                        {MONTHLY_PNL.map(m => (
                            <div key={m.month} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{m.month}</div>
                                <div className={`text-mono ${m.pnl >= 0 ? 'color-success' : 'color-danger'}`} style={{ fontSize: '0.75rem', fontWeight: '600' }}>{m.pnl >= 0 ? '+' : ''}₹{(m.pnl / 1000).toFixed(1)}K</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Risk Metrics */}
            <div className="card">
                <h3 className="card-title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Shield size={18} /> Risk Metrics</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    {RISK_METRICS.map(m => (
                        <div key={m.name} style={{ padding: '0.85rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                            <div className="flex-between" style={{ marginBottom: '0.35rem' }}>
                                <span style={{ fontSize: '0.825rem', fontWeight: '600' }}>{m.name}</span>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: m.status === 'good' ? 'var(--color-success)' : m.status === 'warning' ? '#f59e0b' : 'var(--text-muted)' }}></span>
                            </div>
                            <div className="text-mono" style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.25rem' }}>{m.value}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Benchmark: {m.benchmark}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{m.description}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tax Report */}
            <div className="card">
                <div className="flex-between" style={{ marginBottom: '1rem' }}>
                    <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={18} /> Tax Report (FY 2025-26)</h3>
                    <span className="text-mono" style={{ fontWeight: '600', color: 'var(--color-danger)' }}>Total Tax: ₹{totalTax.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 0.8fr 1fr 1fr', padding: '0.6rem 1rem', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '6px 6px 0 0' }}>
                    <div>Type</div><div>Rate</div><div>Gains</div><div>Tax</div>
                </div>
                {TAX_SUMMARY.map(t => (
                    <div key={t.type} style={{ display: 'grid', gridTemplateColumns: '2.5fr 0.8fr 1fr 1fr', padding: '0.7rem 1rem', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.8rem', alignItems: 'center' }}>
                        <div style={{ fontWeight: '500' }}>{t.type}</div>
                        <div className="text-mono" style={{ color: 'var(--text-muted)' }}>{t.rate}</div>
                        <div className="text-mono color-success">₹{t.gains.toLocaleString()}</div>
                        <div className="text-mono color-danger">₹{t.tax.toLocaleString()}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};
