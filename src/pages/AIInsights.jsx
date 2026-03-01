import React, { useState, useEffect, useRef } from 'react';
import { Brain, Sun, TrendingUp, TrendingDown, Minus, Newspaper, MessageCircle, Send, Sparkles, RefreshCw, ArrowUpRight, ArrowDownRight, Clock, Zap, BarChart3, AlertTriangle } from 'lucide-react';
import { useAuth } from '../lib/useAuth';

// ==========================================
// Simulated AI Data (In production: FastAPI + FinBERT)
// ==========================================

const generateMorningBrief = () => {
    const date = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return {
        date,
        greeting: new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening',
        marketOutlook: 'cautiously_bullish',
        summary: `Markets opened on a positive note with Nifty crossing 22,500 levels. Banking stocks led the rally with HDFC Bank and ICICI Bank gaining 2-3%. IT sector showed mixed results amid global tech selloff concerns. FII inflows remained positive for the 3rd consecutive day at ₹2,847 Cr. Key events today: RBI MPC minutes release at 2:30 PM, US Fed Chair speech at 11:30 PM IST.`,
        keyPoints: [
            { icon: '📈', text: 'Nifty 50 up 0.8% at 22,543 — bullish breakout above 22,400 resistance' },
            { icon: '🏦', text: 'Bank Nifty surges 1.2% — HDFC Bank, ICICI Bank, SBI lead gains' },
            { icon: '💰', text: 'FII net buyers: ₹2,847 Cr | DII net sellers: ₹431 Cr' },
            { icon: '🪙', text: 'Bitcoin holds $67,500 — ETH recovers to $3,800 after flash dip' },
            { icon: '⚠️', text: 'US 10Y yield rises to 4.35% — watch for impact on IT stocks' },
        ],
        sectorPerformance: [
            { name: 'Banking', change: 1.8, sentiment: 'bullish' },
            { name: 'IT', change: -0.4, sentiment: 'bearish' },
            { name: 'Pharma', change: 0.6, sentiment: 'neutral' },
            { name: 'Auto', change: 1.2, sentiment: 'bullish' },
            { name: 'FMCG', change: 0.3, sentiment: 'neutral' },
            { name: 'Metal', change: -0.8, sentiment: 'bearish' },
            { name: 'Energy', change: 0.9, sentiment: 'bullish' },
            { name: 'Realty', change: 2.1, sentiment: 'bullish' },
        ],
    };
};

const SENTIMENT_DATA = {
    overall: 68, // 0-100 (0=extreme fear, 50=neutral, 100=extreme greed)
    label: 'Greed',
    indicators: [
        { name: 'Market Momentum', value: 72, signal: 'bullish' },
        { name: 'Volume Flow', value: 65, signal: 'bullish' },
        { name: 'Put/Call Ratio', value: 45, signal: 'neutral' },
        { name: 'VIX (Volatility)', value: 28, signal: 'neutral' },
        { name: 'FII/DII Flow', value: 78, signal: 'bullish' },
        { name: 'Advance/Decline', value: 71, signal: 'bullish' },
    ],
};

const NEWS_FEED = [
    { id: 1, title: 'RBI holds repo rate at 6.5%, maintains growth outlook at 7%', source: 'Economic Times', time: '2h ago', sentiment: 'positive', impact: 'high', category: 'macro' },
    { id: 2, title: 'HDFC Bank Q3 results: Net profit rises 33% YoY to ₹16,372 Cr', source: 'Moneycontrol', time: '3h ago', sentiment: 'positive', impact: 'high', category: 'earnings' },
    { id: 3, title: 'Infosys loses $1.5B deal with European client — stock dips 2%', source: 'LiveMint', time: '4h ago', sentiment: 'negative', impact: 'medium', category: 'earnings' },
    { id: 4, title: 'Bitcoin ETF sees record $1.2B daily inflow — BTC crosses $67K', source: 'CoinDesk', time: '5h ago', sentiment: 'positive', impact: 'medium', category: 'crypto' },
    { id: 5, title: 'Crude oil rises 3% on Middle East tensions — Brent at $82/bbl', source: 'Reuters', time: '6h ago', sentiment: 'negative', impact: 'medium', category: 'commodities' },
    { id: 6, title: 'Adani Group plans ₹75,000 Cr investment in green energy by 2030', source: 'Business Standard', time: '7h ago', sentiment: 'positive', impact: 'low', category: 'corporate' },
    { id: 7, title: 'US Fed signals no rate cuts until inflation sustainably at 2%', source: 'Bloomberg', time: '8h ago', sentiment: 'negative', impact: 'high', category: 'macro' },
    { id: 8, title: 'Tata Motors EV sales surge 45% in February — market share at 72%', source: 'Autocar India', time: '9h ago', sentiment: 'positive', impact: 'medium', category: 'corporate' },
];

const AI_RESPONSES = {
    'reliance': 'Based on technical analysis, RELIANCE is trading above its 200-DMA at ₹2,891. The RSI is at 58 (neutral zone). Consensus target: ₹3,100 (7.2% upside). Key catalysts: Jio IPO timeline, retail expansion, and O2C margins. **Sentiment: Moderately Bullish** 📈',
    'gold': 'Gold is at $2,340/oz, near all-time highs. Factors supporting: geopolitical risks, central bank buying (China, India), and upcoming Fed rate cuts. However, strong USD could cap gains. **Recommendation: Allocate 5-10% of portfolio as hedge.** Consider Sovereign Gold Bonds for tax efficiency.',
    'market': 'Indian markets are showing resilience despite global headwinds. Nifty PE at 22.8x (slightly above 10Y avg of 21.5x). Earnings growth expected at 14% for FY25. Key risks: US election volatility, crude oil spikes, FII outflows. **Overall: Cautiously bullish for 3-6 month horizon.**',
    'sip': 'For a ₹10,000/month SIP over 15 years at 12% CAGR, expected corpus: ~₹50 lakhs. Top recommendations: (1) Parag Parikh Flexi Cap — consistent outperformer, (2) HDFC Mid-Cap Opportunities — strong in midcaps, (3) Axis ELSS — tax saving + growth. **Start immediately — time in market > timing the market.**',
    'bitcoin': 'BTC at $67,500, up 150% in 12 months. ETF inflows driving institutional adoption. Halving in April 2024 historically triggers 12-18 month bull runs. However, RSI at 72 suggests short-term overbought. **Strategy: DCA with 3-5% portfolio allocation. Avoid FOMO at ATH.**',
    'default': "I can help with market analysis, stock recommendations, portfolio strategy, SIP planning, and more. Try asking:\n• \"What's the outlook for RELIANCE?\"\n• \"Should I invest in gold?\"\n• \"Best SIP strategy for ₹10K/month\"\n• \"Is Bitcoin a good buy now?\"\n• \"How's the market looking?\""
};

// ==========================================
// Components
// ==========================================

const SentimentGauge = ({ value, label }) => {
    const angle = (value / 100) * 180 - 90; // -90 to 90 degrees
    const getColor = (v) => {
        if (v < 25) return '#ef4444';
        if (v < 40) return '#f97316';
        if (v < 60) return '#eab308';
        if (v < 75) return '#84cc16';
        return '#22c55e';
    };
    const color = getColor(value);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ position: 'relative', width: '180px', height: '100px', overflow: 'hidden' }}>
                {/* Background arc */}
                <div style={{ position: 'absolute', width: '180px', height: '180px', borderRadius: '50%', border: '12px solid var(--bg-surface-highlight)', borderBottomColor: 'transparent', borderRightColor: 'transparent', transform: 'rotate(-45deg)' }}></div>
                {/* Colored arc */}
                <div style={{ position: 'absolute', width: '180px', height: '180px', borderRadius: '50%', border: '12px solid transparent', borderTopColor: color, borderLeftColor: value > 50 ? color : 'transparent', transform: `rotate(${-45 + (value / 100) * 180}deg)`, transition: 'transform 1s ease' }}></div>
                {/* Center value */}
                <div style={{ position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
                    <div className="text-mono" style={{ fontSize: '2rem', fontWeight: '700', color }}>{value}</div>
                </div>
            </div>
            <div style={{ fontWeight: '600', color, fontSize: '0.9rem', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Fear & Greed Index</div>
        </div>
    );
};

const AIChatBot = () => {
    const [messages, setMessages] = useState([
        { role: 'assistant', text: "Hi! I'm NexusAI, your market intelligence assistant. Ask me about stocks, crypto, SIPs, or market trends. 🤖" }
    ]);
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const chatRef = useRef(null);

    useEffect(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setTyping(true);

        // Simulate AI response with keyword matching
        setTimeout(() => {
            const lower = userMsg.toLowerCase();
            let response = AI_RESPONSES.default;
            if (lower.includes('reliance')) response = AI_RESPONSES.reliance;
            else if (lower.includes('gold')) response = AI_RESPONSES.gold;
            else if (lower.includes('market') || lower.includes('nifty')) response = AI_RESPONSES.market;
            else if (lower.includes('sip') || lower.includes('mutual')) response = AI_RESPONSES.sip;
            else if (lower.includes('bitcoin') || lower.includes('btc') || lower.includes('crypto')) response = AI_RESPONSES.bitcoin;

            setMessages(prev => [...prev, { role: 'assistant', text: response }]);
            setTyping(false);
        }, 800 + Math.random() * 1200);
    };

    return (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '460px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.75rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Brain size={16} color="#fff" />
                </div>
                <div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>NexusAI Assistant</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-success)' }}>● Online</div>
                </div>
                <Sparkles size={14} color="var(--accent-primary)" style={{ marginLeft: 'auto' }} />
            </div>

            <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem' }}>
                {messages.map((m, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                            maxWidth: '85%', padding: '0.65rem 0.9rem', borderRadius: '12px', fontSize: '0.825rem', lineHeight: 1.5,
                            backgroundColor: m.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                            color: m.role === 'user' ? '#fff' : 'var(--text-primary)',
                            borderBottomRightRadius: m.role === 'user' ? '4px' : '12px',
                            borderBottomLeftRadius: m.role === 'assistant' ? '4px' : '12px',
                            whiteSpace: 'pre-wrap'
                        }}>{m.text}</div>
                    </div>
                ))}
                {typing && (
                    <div style={{ display: 'flex' }}>
                        <div style={{ padding: '0.65rem 0.9rem', borderRadius: '12px', borderBottomLeftRadius: '4px', backgroundColor: 'var(--bg-surface-elevated)', fontSize: '0.85rem' }}>
                            <span className="animate-pulse">NexusAI is thinking...</span>
                        </div>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <input type="text" className="form-input" placeholder="Ask about markets, stocks, crypto..." value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    style={{ flex: 1, fontSize: '0.85rem' }} />
                <button className="btn btn-primary" onClick={handleSend} style={{ padding: '0.5rem 0.75rem' }}><Send size={16} /></button>
            </div>
        </div>
    );
};

// ==========================================
// Main Page
// ==========================================
export const AIInsights = () => {
    const { user } = useAuth();
    const [brief] = useState(generateMorningBrief);
    const [newsFilter, setNewsFilter] = useState('all');

    const filteredNews = newsFilter === 'all' ? NEWS_FEED : NEWS_FEED.filter(n => n.category === newsFilter);
    const sentimentColors = { positive: 'var(--color-success)', negative: 'var(--color-danger)', neutral: 'var(--text-muted)' };
    const impactColors = { high: '#ef4444', medium: '#f59e0b', low: '#6b7280' };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header */}
            <div className="flex-between">
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Brain size={28} color="var(--accent-primary)" /> AI Insights
                    <span className="badge" style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#a78bfa', fontSize: '0.6rem' }}>POWERED BY AI</span>
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <Clock size={14} /> Updated {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>

            {/* Morning Brief */}
            <div className="card glass-panel" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.06))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <Sun size={22} color="#fbbf24" />
                    <div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{brief.greeting}, {user?.email?.split('@')[0] || 'Trader'}!</h2>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{brief.date} • Daily Market Brief</div>
                    </div>
                    <span className="badge" style={{ marginLeft: 'auto', backgroundColor: 'rgba(34,197,94,0.1)', color: 'var(--color-success)' }}>
                        {brief.marketOutlook === 'cautiously_bullish' ? '📈 Cautiously Bullish' : '📊 Neutral'}
                    </span>
                </div>

                <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: '1rem' }}>{brief.summary}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {brief.keyPoints.map((kp, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.4rem 0', fontSize: '0.825rem' }}>
                            <span style={{ fontSize: '1rem' }}>{kp.icon}</span>
                            <span style={{ color: 'var(--text-primary)' }}>{kp.text}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Middle row: Sentiment + Sectors */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
                {/* Sentiment Gauge */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <h3 className="card-title" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BarChart3 size={18} /> Market Sentiment
                    </h3>
                    <SentimentGauge value={SENTIMENT_DATA.overall} label={SENTIMENT_DATA.label} />
                    <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        {SENTIMENT_DATA.indicators.map(ind => (
                            <div key={ind.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0.5rem', borderRadius: '6px', backgroundColor: 'var(--bg-surface-elevated)', fontSize: '0.75rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>{ind.name}</span>
                                <span style={{ fontWeight: '600', color: ind.signal === 'bullish' ? 'var(--color-success)' : ind.signal === 'bearish' ? 'var(--color-danger)' : 'var(--text-muted)' }}>{ind.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sector Heatmap */}
                <div className="card">
                    <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <TrendingUp size={18} /> Sector Performance
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                        {brief.sectorPerformance.map(s => {
                            const isPos = s.change >= 0;
                            const intensity = Math.min(1, Math.abs(s.change) / 3);
                            const bg = isPos ? `rgba(34,197,94,${0.05 + intensity * 0.15})` : `rgba(239,68,68,${0.05 + intensity * 0.15})`;
                            return (
                                <div key={s.name} style={{ padding: '0.9rem 0.75rem', borderRadius: '10px', backgroundColor: bg, textAlign: 'center', border: '1px solid var(--border-subtle)', transition: 'transform 0.2s', cursor: 'default' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>{s.name}</div>
                                    <div className={`text-mono ${isPos ? 'color-success' : 'color-danger'}`} style={{ fontSize: '1rem', fontWeight: '700' }}>
                                        {isPos ? '+' : ''}{s.change.toFixed(1)}%
                                    </div>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.15rem', textTransform: 'capitalize' }}>{s.sentiment}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Bottom row: News + AI Chat */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
                {/* News Feed */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', maxHeight: '500px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Newspaper size={18} /> Market News
                        </h3>
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                        {['all', 'macro', 'earnings', 'crypto', 'commodities', 'corporate'].map(f => (
                            <button key={f} className={`btn ${newsFilter === f ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ padding: '0.25rem 0.6rem', fontSize: '0.65rem', textTransform: 'capitalize' }}
                                onClick={() => setNewsFilter(f)}>{f}</button>
                        ))}
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {filteredNews.map(n => (
                            <div key={n.id} style={{ padding: '0.65rem 0.75rem', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: sentimentColors[n.sentiment], marginTop: '0.45rem', flex: 'none' }}></div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.825rem', fontWeight: '500', lineHeight: 1.4, marginBottom: '0.3rem' }}>{n.title}</div>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.65rem' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>{n.source}</span>
                                            <span style={{ color: 'var(--text-muted)' }}>•</span>
                                            <span style={{ color: 'var(--text-muted)' }}>{n.time}</span>
                                            <span className="badge" style={{ backgroundColor: sentimentColors[n.sentiment] + '20', color: sentimentColors[n.sentiment], fontSize: '0.55rem', padding: '0.1rem 0.4rem' }}>{n.sentiment}</span>
                                            <span className="badge" style={{ backgroundColor: impactColors[n.impact] + '20', color: impactColors[n.impact], fontSize: '0.55rem', padding: '0.1rem 0.4rem' }}>{n.impact} impact</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Chat */}
                <AIChatBot />
            </div>
        </div>
    );
};
