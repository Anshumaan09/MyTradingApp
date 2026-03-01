import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, BarChart3, Plus, X, Search, Pause, Play, Trash2, Calculator } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';

// Hardcoded popular MF schemes for demo (normally fetched from mf_schemes table)
const DEMO_MF_SCHEMES = [
    { id: '1', amfi_code: '100356', scheme_name: 'HDFC Mid-Cap Opportunities Fund', amc_name: 'HDFC AMC', scheme_type: 'equity', plan: 'growth', nav: 178.45, return_1y: 28.4, return_3y: 22.1, return_5y: 18.9, risk_rating: 'high', expense_ratio: 1.56, min_sip_amount: 500, min_lumpsum: 5000 },
    { id: '2', amfi_code: '119598', scheme_name: 'SBI Blue Chip Fund', amc_name: 'SBI MF', scheme_type: 'equity', plan: 'growth', nav: 82.33, return_1y: 18.2, return_3y: 16.5, return_5y: 14.8, risk_rating: 'moderately_high', expense_ratio: 1.42, min_sip_amount: 500, min_lumpsum: 5000 },
    { id: '3', amfi_code: '112323', scheme_name: 'Axis Long Term Equity (ELSS)', amc_name: 'Axis AMC', scheme_type: 'elss', plan: 'growth', nav: 92.11, return_1y: 22.6, return_3y: 18.3, return_5y: 16.1, risk_rating: 'moderately_high', expense_ratio: 1.51, min_sip_amount: 500, min_lumpsum: 500 },
    { id: '4', amfi_code: '118834', scheme_name: 'Parag Parikh Flexi Cap Fund', amc_name: 'PPFAS AMC', scheme_type: 'equity', plan: 'growth', nav: 72.89, return_1y: 32.1, return_3y: 24.5, return_5y: 21.2, risk_rating: 'high', expense_ratio: 0.63, min_sip_amount: 1000, min_lumpsum: 1000 },
    { id: '5', amfi_code: '120716', scheme_name: 'Mirae Asset Large Cap Fund', amc_name: 'Mirae AMC', scheme_type: 'equity', plan: 'growth', nav: 105.67, return_1y: 19.7, return_3y: 15.8, return_5y: 14.2, risk_rating: 'moderately_high', expense_ratio: 1.28, min_sip_amount: 500, min_lumpsum: 5000 },
    { id: '6', amfi_code: '130503', scheme_name: 'Kotak Equity Opportunities Fund', amc_name: 'Kotak AMC', scheme_type: 'equity', plan: 'growth', nav: 298.45, return_1y: 26.3, return_3y: 20.1, return_5y: 17.5, risk_rating: 'high', expense_ratio: 1.58, min_sip_amount: 1000, min_lumpsum: 5000 },
    { id: '7', amfi_code: '118989', scheme_name: 'ICICI Pru Balanced Advantage', amc_name: 'ICICI Pru AMC', scheme_type: 'hybrid', plan: 'growth', nav: 68.23, return_1y: 14.8, return_3y: 12.9, return_5y: 11.6, risk_rating: 'moderate', expense_ratio: 1.15, min_sip_amount: 500, min_lumpsum: 5000 },
    { id: '8', amfi_code: '127042', scheme_name: 'HDFC Corporate Bond Fund', amc_name: 'HDFC AMC', scheme_type: 'debt', plan: 'growth', nav: 29.18, return_1y: 7.8, return_3y: 7.2, return_5y: 7.9, risk_rating: 'moderate', expense_ratio: 0.34, min_sip_amount: 500, min_lumpsum: 5000 },
    { id: '9', amfi_code: '118551', scheme_name: 'DSP Tax Saver (ELSS)', amc_name: 'DSP AMC', scheme_type: 'elss', plan: 'growth', nav: 118.55, return_1y: 25.1, return_3y: 19.7, return_5y: 16.8, risk_rating: 'high', expense_ratio: 1.77, min_sip_amount: 500, min_lumpsum: 500 },
    { id: '10', amfi_code: '125497', scheme_name: 'SBI Liquid Fund', amc_name: 'SBI MF', scheme_type: 'liquid', plan: 'growth', nav: 3568.12, return_1y: 6.8, return_3y: 5.9, return_5y: 5.5, risk_rating: 'low', expense_ratio: 0.18, min_sip_amount: 500, min_lumpsum: 5000 },
];

const riskColors = { low: '#10b981', moderate: '#3b82f6', moderately_high: '#f59e0b', high: '#ef4444', very_high: '#dc2626' };
const typeColors = { equity: '#8b5cf6', debt: '#3b82f6', hybrid: '#06b6d4', elss: '#ef4444', liquid: '#10b981' };

// SIP Calculator
const SIPCalculator = ({ onClose }) => {
    const [monthly, setMonthly] = useState(5000);
    const [years, setYears] = useState(10);
    const [returnRate, setReturnRate] = useState(12);

    const r = returnRate / 100 / 12;
    const n = years * 12;
    const futureValue = monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    const totalInvested = monthly * n;
    const wealthGained = futureValue - totalInvested;

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="card" style={{ width: '440px', maxWidth: '95vw', padding: '2rem', position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calculator size={20} color="var(--accent-primary)" /> SIP Calculator</h3>

                <div className="form-group">
                    <label className="form-label">Monthly Investment (₹)</label>
                    <input type="number" className="form-input text-mono" value={monthly} onChange={(e) => setMonthly(Number(e.target.value))} min={500} step={500} />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Period (Years)</label>
                        <input type="number" className="form-input text-mono" value={years} onChange={(e) => setYears(Number(e.target.value))} min={1} max={40} />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Expected Return (%)</label>
                        <input type="number" className="form-input text-mono" value={returnRate} onChange={(e) => setReturnRate(Number(e.target.value))} min={1} max={30} step={0.5} />
                    </div>
                </div>

                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '8px' }}>
                    <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Invested</span>
                        <span className="text-mono" style={{ fontWeight: '600' }}>₹{totalInvested.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Wealth Gained</span>
                        <span className="text-mono color-success" style={{ fontWeight: '600' }}>₹{Math.round(wealthGained).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex-between" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
                        <span style={{ fontWeight: '600' }}>Maturity Value</span>
                        <span className="text-mono" style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--accent-primary)' }}>₹{Math.round(futureValue).toLocaleString('en-IN')}</span>
                    </div>
                </div>

                {/* Simple bar visualization */}
                <div style={{ marginTop: '1rem', display: 'flex', height: '24px', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ width: `${(totalInvested / futureValue * 100)}%`, backgroundColor: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#fff', fontWeight: '600' }}>Invested</div>
                    <div style={{ flex: 1, backgroundColor: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#fff', fontWeight: '600' }}>Returns</div>
                </div>
            </div>
        </div>
    );
};

export const Investments = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('funds');
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [goals, setGoals] = useState([]);
    const [sips, setSips] = useState([]);
    const [mfHoldings, setMfHoldings] = useState([]);
    const [showCalc, setShowCalc] = useState(false);
    const [showGoalForm, setShowGoalForm] = useState(false);
    const [goalForm, setGoalForm] = useState({ name: '', target_amount: '', target_date: '', risk_profile: 'moderate' });
    const [statusMsg, setStatusMsg] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetch = async () => {
            setLoading(true);
            try {
                const [gRes, sRes, hRes] = await Promise.all([
                    supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
                    supabase.from('sip_orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
                    supabase.from('mf_holdings').select('*').eq('user_id', user.id)
                ]);
                setGoals(gRes.data || []);
                setSips(sRes.data || []);
                setMfHoldings(hRes.data || []);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetch();
    }, [user]);

    const filteredSchemes = DEMO_MF_SCHEMES.filter(s => {
        const matchSearch = s.scheme_name.toLowerCase().includes(searchQuery.toLowerCase()) || s.amc_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchType = typeFilter === 'all' || s.scheme_type === typeFilter;
        return matchSearch && matchType;
    });

    const createGoal = async () => {
        if (!goalForm.name || !goalForm.target_amount || !goalForm.target_date) return;
        try {
            const { error } = await supabase.from('goals').insert({
                user_id: user.id,
                name: goalForm.name,
                target_amount: Number(goalForm.target_amount),
                target_date: goalForm.target_date,
                risk_profile: goalForm.risk_profile,
                monthly_investment: Math.round(Number(goalForm.target_amount) / (((new Date(goalForm.target_date) - new Date()) / (1000 * 60 * 60 * 24 * 30)) || 1))
            });
            if (error) throw error;
            setStatusMsg({ type: 'success', text: `Goal "${goalForm.name}" created!` });
            setShowGoalForm(false);
            setGoalForm({ name: '', target_amount: '', target_date: '', risk_profile: 'moderate' });
            // Refresh
            const { data } = await supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
            setGoals(data || []);
        } catch (e) {
            setStatusMsg({ type: 'error', text: e.message });
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {showCalc && <SIPCalculator onClose={() => setShowCalc(false)} />}

            {/* Header */}
            <div className="flex-between">
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><TrendingUp size={28} color="var(--accent-primary)" /> Investments</h1>
                <button className="btn btn-secondary" onClick={() => setShowCalc(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calculator size={16} /> SIP Calculator</button>
            </div>

            {statusMsg && (
                <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: statusMsg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: statusMsg.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{statusMsg.text}</span>
                    <button onClick={() => setStatusMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><X size={14} /></button>
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                {[{ key: 'funds', label: 'Mutual Funds', icon: <BarChart3 size={16} /> }, { key: 'sips', label: 'My SIPs', icon: <TrendingUp size={16} /> }, { key: 'goals', label: 'Goals', icon: <Target size={16} /> }].map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                        background: activeTab === t.key ? 'var(--bg-surface-elevated)' : 'none', border: 'none',
                        color: activeTab === t.key ? 'var(--text-primary)' : 'var(--text-muted)', padding: '0.5rem 1rem',
                        borderRadius: '6px', cursor: 'pointer', fontWeight: activeTab === t.key ? '600' : '500',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>{t.icon} {t.label}</button>
                ))}
            </div>

            {/* TAB: Mutual Funds Marketplace */}
            {activeTab === 'funds' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Search + Filter */}
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input type="text" className="form-input" placeholder="Search mutual funds..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ paddingLeft: '2.25rem' }} />
                        </div>
                        {['all', 'equity', 'debt', 'hybrid', 'elss', 'liquid'].map(t => (
                            <button key={t} className={`btn ${typeFilter === t ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', textTransform: 'capitalize' }}
                                onClick={() => setTypeFilter(t)}>{t === 'all' ? 'All' : t}</button>
                        ))}
                    </div>

                    {/* Scheme Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
                        {filteredSchemes.map(s => (
                            <div key={s.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', transition: 'border-color 0.2s' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600', fontSize: '0.9rem', lineHeight: 1.3 }}>{s.scheme_name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{s.amc_name}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                                        <span className="badge" style={{ backgroundColor: typeColors[s.scheme_type] + '20', color: typeColors[s.scheme_type], fontSize: '0.6rem' }}>{s.scheme_type.toUpperCase()}</span>
                                        <span className="badge" style={{ backgroundColor: riskColors[s.risk_rating] + '20', color: riskColors[s.risk_rating], fontSize: '0.6rem' }}>{s.risk_rating?.replace('_', ' ')}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                                    <div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>NAV</div>
                                        <div className="text-mono" style={{ fontWeight: '600' }}>₹{s.nav.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>1Y Return</div>
                                        <div className="text-mono color-success" style={{ fontWeight: '600' }}>+{s.return_1y}%</div>
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>3Y Return</div>
                                        <div className="text-mono color-success" style={{ fontWeight: '600' }}>+{s.return_3y}%</div>
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Expense</div>
                                        <div className="text-mono">{s.expense_ratio}%</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                    <button className="btn btn-primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
                                        onClick={() => setStatusMsg({ type: 'success', text: `Investment in "${s.scheme_name}" queued! Min SIP: ₹${s.min_sip_amount}` })}>
                                        Start SIP
                                    </button>
                                    <button className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
                                        onClick={() => setStatusMsg({ type: 'success', text: `Lumpsum of ₹${s.min_lumpsum} in "${s.scheme_name}" initiated.` })}>
                                        One-time
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB: My SIPs */}
            {activeTab === 'sips' && (
                <div>
                    {loading ? (
                        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Loading...</div>
                    ) : sips.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                            <TrendingUp size={40} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No active SIPs. Start a SIP from the Mutual Funds tab!</p>
                            <button className="btn btn-primary" onClick={() => setActiveTab('funds')}>Browse Funds</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {sips.map(s => (
                                <div key={s.id} className="card" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 0.5fr', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: '600' }}>SIP #{s.id.slice(0, 8)}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>₹{Number(s.amount).toLocaleString()}/month</div>
                                    </div>
                                    <div className="text-mono" style={{ fontSize: '0.85rem' }}>{s.installments_done}/{s.installments_total || '∞'}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Next: {s.next_execution_date}</div>
                                    <div><span className="badge" style={{ backgroundColor: s.status === 'active' ? 'rgba(16,185,129,0.1)' : 'var(--bg-surface)', color: s.status === 'active' ? 'var(--color-success)' : 'var(--text-muted)' }}>{s.status}</span></div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button title="Pause" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Pause size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB: Goals */}
            {activeTab === 'goals' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="flex-between">
                        <h3>Financial Goals</h3>
                        <button className="btn btn-primary" onClick={() => setShowGoalForm(!showGoalForm)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Plus size={16} /> New Goal
                        </button>
                    </div>

                    {/* Goal creation form */}
                    {showGoalForm && (
                        <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <h4>Create Goal</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Goal Name</label>
                                    <input type="text" className="form-input" placeholder="e.g. Retirement, House" value={goalForm.name} onChange={(e) => setGoalForm(f => ({ ...f, name: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Target Amount (₹)</label>
                                    <input type="number" className="form-input text-mono" placeholder="5000000" value={goalForm.target_amount} onChange={(e) => setGoalForm(f => ({ ...f, target_amount: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Target Date</label>
                                    <input type="date" className="form-input" value={goalForm.target_date} onChange={(e) => setGoalForm(f => ({ ...f, target_date: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Risk Profile</label>
                                    <select className="form-input" value={goalForm.risk_profile} onChange={(e) => setGoalForm(f => ({ ...f, risk_profile: e.target.value }))}>
                                        <option value="conservative">Conservative</option>
                                        <option value="moderate">Moderate</option>
                                        <option value="aggressive">Aggressive</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-primary" onClick={createGoal}>Create Goal</button>
                                <button className="btn btn-secondary" onClick={() => setShowGoalForm(false)}>Cancel</button>
                            </div>
                        </div>
                    )}

                    {/* Goals list */}
                    {goals.length === 0 && !showGoalForm ? (
                        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                            <Target size={40} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No goals yet. Set a financial goal to start planning!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
                            {goals.map(g => {
                                const progress = Math.min(100, (Number(g.current_amount) / Number(g.target_amount)) * 100);
                                const monthsLeft = Math.max(0, Math.round((new Date(g.target_date) - new Date()) / (1000 * 60 * 60 * 24 * 30)));
                                const remaining = Number(g.target_amount) - Number(g.current_amount);
                                const monthlyNeeded = monthsLeft > 0 ? remaining / monthsLeft : remaining;

                                return (
                                    <div key={g.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div className="flex-between">
                                            <div>
                                                <div style={{ fontWeight: '600', fontSize: '1rem' }}>{g.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{g.risk_profile} risk • {monthsLeft} months left</div>
                                            </div>
                                            <span className="badge" style={{ backgroundColor: g.status === 'active' ? 'rgba(16,185,129,0.1)' : 'var(--bg-surface)', color: g.status === 'active' ? 'var(--color-success)' : 'var(--text-muted)' }}>{g.status}</span>
                                        </div>

                                        {/* Progress bar */}
                                        <div>
                                            <div className="flex-between" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                                                <span className="text-mono">₹{Number(g.current_amount).toLocaleString('en-IN')}</span>
                                                <span className="text-mono">₹{Number(g.target_amount).toLocaleString('en-IN')}</span>
                                            </div>
                                            <div style={{ height: '8px', backgroundColor: 'var(--bg-surface-highlight)', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ width: `${progress}%`, height: '100%', backgroundColor: progress >= 100 ? 'var(--color-success)' : 'var(--accent-primary)', borderRadius: '4px', transition: 'width 0.3s' }}></div>
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{progress.toFixed(1)}% achieved</div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', padding: '0.5rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '6px', fontSize: '0.8rem' }}>
                                            <div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Monthly Needed</div>
                                                <div className="text-mono" style={{ fontWeight: '600' }}>₹{Math.round(monthlyNeeded).toLocaleString('en-IN')}</div>
                                            </div>
                                            <div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Target Date</div>
                                                <div className="text-mono" style={{ fontWeight: '600' }}>{new Date(g.target_date).toLocaleDateString('en-IN')}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
