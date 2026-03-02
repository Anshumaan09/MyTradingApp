import React, { useState, useMemo } from 'react';
import { MarketView } from './MarketView';
import { Search, TrendingUp, TrendingDown, ChevronRight, Activity, Zap, Plus, Star, StarOff } from 'lucide-react';
import { useMarketData } from '../lib/useMarketData';

// ==========================================
// Comprehensive Instrument Catalog
// ==========================================
const ALL_INSTRUMENTS = [
    // ── Equities (NSE Top 30) ──
    { id: 'RELIANCE', name: 'Reliance Industries', class: 'Equities', sector: 'Oil & Gas', basePrice: 2890, vol: '15M', currency: '₹' },
    { id: 'TCS', name: 'Tata Consultancy Services', class: 'Equities', sector: 'IT', basePrice: 3750, vol: '12M', currency: '₹' },
    { id: 'HDFCBANK', name: 'HDFC Bank Ltd', class: 'Equities', sector: 'Banking', basePrice: 1680, vol: '22M', currency: '₹' },
    { id: 'INFY', name: 'Infosys Ltd', class: 'Equities', sector: 'IT', basePrice: 1520, vol: '18M', currency: '₹' },
    { id: 'ICICIBANK', name: 'ICICI Bank Ltd', class: 'Equities', sector: 'Banking', basePrice: 1250, vol: '20M', currency: '₹' },
    { id: 'WIPRO', name: 'Wipro Ltd', class: 'Equities', sector: 'IT', basePrice: 480, vol: '8M', currency: '₹' },
    { id: 'SBIN', name: 'State Bank of India', class: 'Equities', sector: 'Banking', basePrice: 780, vol: '25M', currency: '₹' },
    { id: 'BHARTIARTL', name: 'Bharti Airtel Ltd', class: 'Equities', sector: 'Telecom', basePrice: 1890, vol: '10M', currency: '₹' },
    { id: 'ITC', name: 'ITC Ltd', class: 'Equities', sector: 'FMCG', basePrice: 495, vol: '30M', currency: '₹' },
    { id: 'LT', name: 'Larsen & Toubro', class: 'Equities', sector: 'Infra', basePrice: 3480, vol: '6M', currency: '₹' },
    { id: 'TATAMOTORS', name: 'Tata Motors Ltd', class: 'Equities', sector: 'Auto', basePrice: 720, vol: '14M', currency: '₹' },
    { id: 'BAJFINANCE', name: 'Bajaj Finance Ltd', class: 'Equities', sector: 'NBFC', basePrice: 7200, vol: '5M', currency: '₹' },
    { id: 'MARUTI', name: 'Maruti Suzuki India', class: 'Equities', sector: 'Auto', basePrice: 12500, vol: '3M', currency: '₹' },
    { id: 'SUNPHARMA', name: 'Sun Pharmaceutical', class: 'Equities', sector: 'Pharma', basePrice: 1780, vol: '7M', currency: '₹' },
    { id: 'TITAN', name: 'Titan Company Ltd', class: 'Equities', sector: 'Consumer', basePrice: 3650, vol: '4M', currency: '₹' },
    { id: 'AXISBANK', name: 'Axis Bank Ltd', class: 'Equities', sector: 'Banking', basePrice: 1120, vol: '16M', currency: '₹' },
    { id: 'KOTAKBANK', name: 'Kotak Mahindra Bank', class: 'Equities', sector: 'Banking', basePrice: 1980, vol: '9M', currency: '₹' },
    { id: 'ADANIENT', name: 'Adani Enterprises', class: 'Equities', sector: 'Conglomerate', basePrice: 2350, vol: '11M', currency: '₹' },
    { id: 'ADANIPORTS', name: 'Adani Ports & SEZ', class: 'Equities', sector: 'Infra', basePrice: 1180, vol: '7M', currency: '₹' },
    { id: 'HINDUNILVR', name: 'Hindustan Unilever', class: 'Equities', sector: 'FMCG', basePrice: 2450, vol: '5M', currency: '₹' },
    { id: 'ASIANPAINT', name: 'Asian Paints Ltd', class: 'Equities', sector: 'Consumer', basePrice: 2780, vol: '3M', currency: '₹' },
    { id: 'NESTLEIND', name: 'Nestle India Ltd', class: 'Equities', sector: 'FMCG', basePrice: 24500, vol: '1M', currency: '₹' },
    { id: 'TECHM', name: 'Tech Mahindra Ltd', class: 'Equities', sector: 'IT', basePrice: 1450, vol: '6M', currency: '₹' },
    { id: 'HCLTECH', name: 'HCL Technologies', class: 'Equities', sector: 'IT', basePrice: 1680, vol: '8M', currency: '₹' },
    { id: 'POWERGRID', name: 'Power Grid Corp', class: 'Equities', sector: 'Power', basePrice: 310, vol: '12M', currency: '₹' },
    { id: 'NTPC', name: 'NTPC Ltd', class: 'Equities', sector: 'Power', basePrice: 380, vol: '15M', currency: '₹' },
    { id: 'ONGC', name: 'Oil & Natural Gas Corp', class: 'Equities', sector: 'Oil & Gas', basePrice: 260, vol: '18M', currency: '₹' },
    { id: 'COALINDIA', name: 'Coal India Ltd', class: 'Equities', sector: 'Mining', basePrice: 450, vol: '10M', currency: '₹' },
    { id: 'JSWSTEEL', name: 'JSW Steel Ltd', class: 'Equities', sector: 'Steel', basePrice: 890, vol: '6M', currency: '₹' },
    { id: 'TATASTEEL', name: 'Tata Steel Ltd', class: 'Equities', sector: 'Steel', basePrice: 145, vol: '20M', currency: '₹' },

    // ── F&O (Index Derivatives) ──
    { id: 'NIFTY50', name: 'Nifty 50 Index', class: 'F&O', sector: 'Index', basePrice: 21840, vol: '450M', currency: '₹' },
    { id: 'BANKNIFTY', name: 'Bank Nifty Index', class: 'F&O', sector: 'Index', basePrice: 45980, vol: '320M', currency: '₹' },
    { id: 'FINNIFTY', name: 'Fin Nifty Index', class: 'F&O', sector: 'Index', basePrice: 21450, vol: '120M', currency: '₹' },
    { id: 'MIDCPNIFTY', name: 'Midcap Nifty Index', class: 'F&O', sector: 'Index', basePrice: 12350, vol: '80M', currency: '₹' },
    { id: 'SENSEX', name: 'BSE Sensex', class: 'F&O', sector: 'Index', basePrice: 72152, vol: '180M', currency: '₹' },

    // ── Crypto (Top 20) ──
    { id: 'BTCUSDT', name: 'Bitcoin', class: 'Crypto', sector: 'Layer 1', basePrice: 67500, vol: '28B', currency: '$' },
    { id: 'ETHUSDT', name: 'Ethereum', class: 'Crypto', sector: 'Layer 1', basePrice: 3800, vol: '14B', currency: '$' },
    { id: 'BNBUSDT', name: 'BNB', class: 'Crypto', sector: 'Exchange', basePrice: 620, vol: '1.8B', currency: '$' },
    { id: 'SOLUSDT', name: 'Solana', class: 'Crypto', sector: 'Layer 1', basePrice: 185, vol: '4.2B', currency: '$' },
    { id: 'XRPUSDT', name: 'XRP (Ripple)', class: 'Crypto', sector: 'Payments', basePrice: 0.62, vol: '2.1B', currency: '$' },
    { id: 'ADAUSDT', name: 'Cardano', class: 'Crypto', sector: 'Layer 1', basePrice: 0.45, vol: '800M', currency: '$' },
    { id: 'DOGEUSDT', name: 'Dogecoin', class: 'Crypto', sector: 'Meme', basePrice: 0.12, vol: '1.5B', currency: '$' },
    { id: 'DOTUSDT', name: 'Polkadot', class: 'Crypto', sector: 'Layer 0', basePrice: 7.5, vol: '320M', currency: '$' },
    { id: 'MATICUSDT', name: 'Polygon (MATIC)', class: 'Crypto', sector: 'Layer 2', basePrice: 0.72, vol: '450M', currency: '$' },
    { id: 'AVAXUSDT', name: 'Avalanche', class: 'Crypto', sector: 'Layer 1', basePrice: 38, vol: '520M', currency: '$' },
    { id: 'LINKUSDT', name: 'Chainlink', class: 'Crypto', sector: 'Oracle', basePrice: 18.5, vol: '680M', currency: '$' },
    { id: 'UNIUSDT', name: 'Uniswap', class: 'Crypto', sector: 'DeFi', basePrice: 12.3, vol: '240M', currency: '$' },
    { id: 'ATOMUSDT', name: 'Cosmos', class: 'Crypto', sector: 'Layer 0', basePrice: 9.2, vol: '180M', currency: '$' },
    { id: 'NEARUSDT', name: 'NEAR Protocol', class: 'Crypto', sector: 'Layer 1', basePrice: 5.8, vol: '350M', currency: '$' },
    { id: 'APTUSDT', name: 'Aptos', class: 'Crypto', sector: 'Layer 1', basePrice: 8.5, vol: '280M', currency: '$' },

    // ── Commodities (MCX) ──
    { id: 'GOLD', name: 'Gold (MCX)', class: 'Commodities', sector: 'Precious Metals', basePrice: 62450, vol: '8M', currency: '₹' },
    { id: 'SILVER', name: 'Silver (MCX)', class: 'Commodities', sector: 'Precious Metals', basePrice: 74500, vol: '6M', currency: '₹' },
    { id: 'CRUDEOIL', name: 'Crude Oil (MCX)', class: 'Commodities', sector: 'Energy', basePrice: 6780, vol: '12M', currency: '₹' },
    { id: 'NATURALGAS', name: 'Natural Gas (MCX)', class: 'Commodities', sector: 'Energy', basePrice: 185, vol: '5M', currency: '₹' },
    { id: 'COPPER', name: 'Copper (MCX)', class: 'Commodities', sector: 'Base Metals', basePrice: 780, vol: '4M', currency: '₹' },
    { id: 'ALUMINIUM', name: 'Aluminium (MCX)', class: 'Commodities', sector: 'Base Metals', basePrice: 215, vol: '3M', currency: '₹' },
    { id: 'ZINC', name: 'Zinc (MCX)', class: 'Commodities', sector: 'Base Metals', basePrice: 245, vol: '2M', currency: '₹' },
    { id: 'COTTON', name: 'Cotton (MCX)', class: 'Commodities', sector: 'Agriculture', basePrice: 26800, vol: '1M', currency: '₹' },

    // ── Currency (CDS) ──
    { id: 'USDINR', name: 'US Dollar / INR', class: 'Currency', sector: 'Major', basePrice: 83.15, vol: '40M', currency: '₹' },
    { id: 'EURINR', name: 'Euro / INR', class: 'Currency', sector: 'Major', basePrice: 90.25, vol: '15M', currency: '₹' },
    { id: 'GBPINR', name: 'British Pound / INR', class: 'Currency', sector: 'Major', basePrice: 105.40, vol: '10M', currency: '₹' },
    { id: 'JPYINR', name: 'Japanese Yen / INR', class: 'Currency', sector: 'Major', basePrice: 0.556, vol: '8M', currency: '₹' },
    { id: 'EURUSD', name: 'Euro / US Dollar', class: 'Currency', sector: 'Major', basePrice: 1.0855, vol: '120B', currency: '$' },
    { id: 'GBPUSD', name: 'British Pound / USD', class: 'Currency', sector: 'Major', basePrice: 1.2675, vol: '80B', currency: '$' },
];

export const MarketBrowser = () => {
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [filterQuery, setFilterQuery] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const [watchlist, setWatchlist] = useState(() => {
        try { return JSON.parse(localStorage.getItem('nexus_watchlist') || '[]'); } catch { return []; }
    });

    // Get all symbols for live pricing
    const allSymbols = ALL_INSTRUMENTS.map(a => a.id);
    const { prices, isConnected } = useMarketData(allSymbols);

    const tabs = ['All', 'Equities', 'F&O', 'Crypto', 'Commodities', 'Currency', '★ Watchlist'];

    // Toggle watchlist
    const toggleWatchlist = (symbol) => {
        setWatchlist(prev => {
            const next = prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol];
            localStorage.setItem('nexus_watchlist', JSON.stringify(next));
            return next;
        });
    };

    // Merge live prices into assets
    const enrichedAssets = useMemo(() => ALL_INSTRUMENTS.map(a => {
        const live = prices[a.id];
        return {
            ...a,
            price: live?.ltp ?? a.basePrice,
            change: live?.changePercent ?? ((Math.random() - 0.5) * 2),
            isLive: !!live,
            isWatchlisted: watchlist.includes(a.id)
        };
    }), [prices, watchlist]);

    const filteredAssets = useMemo(() => enrichedAssets.filter(a => {
        const q = filterQuery.toLowerCase();
        const matchesSearch = !q || a.id.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || (a.sector || '').toLowerCase().includes(q);
        if (activeTab === '★ Watchlist') return matchesSearch && watchlist.includes(a.id);
        const matchesTab = activeTab === 'All' || a.class === activeTab;
        return matchesSearch && matchesTab;
    }), [enrichedAssets, filterQuery, activeTab, watchlist]);

    // Tab counts
    const tabCounts = useMemo(() => ({
        'All': ALL_INSTRUMENTS.length,
        'Equities': ALL_INSTRUMENTS.filter(a => a.class === 'Equities').length,
        'F&O': ALL_INSTRUMENTS.filter(a => a.class === 'F&O').length,
        'Crypto': ALL_INSTRUMENTS.filter(a => a.class === 'Crypto').length,
        'Commodities': ALL_INSTRUMENTS.filter(a => a.class === 'Commodities').length,
        'Currency': ALL_INSTRUMENTS.filter(a => a.class === 'Currency').length,
        '★ Watchlist': watchlist.length,
    }), [watchlist]);

    if (selectedAsset) {
        return (
            <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <button className="btn btn-secondary" style={{ alignSelf: 'flex-start', marginBottom: '1rem' }} onClick={() => setSelectedAsset(null)}>
                    ← Back to Markets
                </button>
                <div style={{ flex: 1, minHeight: 0 }}>
                    <MarketView assetId={selectedAsset.id} assetName={selectedAsset.name} price={selectedAsset.price} change={selectedAsset.change} />
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
            <div className="flex-between">
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Activity size={28} color="var(--accent-primary)" /> Market Explorer
                        {isConnected && <Zap size={16} color="var(--color-success)" style={{ marginLeft: '-4px' }} />}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {ALL_INSTRUMENTS.length} instruments across Equities, F&O, Crypto, Commodities & Currency.
                        {isConnected && <span style={{ color: 'var(--color-success)', marginLeft: '8px', fontSize: '0.8rem' }}>● Live</span>}
                    </p>
                </div>

                <div style={{ position: 'relative', width: '340px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search stocks, crypto, currency, commodities..."
                        className="form-input"
                        style={{ paddingLeft: '2.5rem' }}
                        value={filterQuery}
                        onChange={(e) => setFilterQuery(e.target.value.toUpperCase())}
                    />
                </div>
            </div>

            {/* Asset class tabs with counts */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
                {tabs.map(tab => (
                    <button
                        key={tab}
                        style={{
                            background: activeTab === tab ? 'var(--bg-surface-elevated)' : 'none',
                            border: 'none',
                            color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: activeTab === tab ? '600' : '500',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap',
                            display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)', padding: '1px 6px', borderRadius: '10px' }}>
                            {tabCounts[tab]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', flex: 1 }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '0.3fr 2fr 0.8fr 1fr 1fr 0.8fr 0.5fr',
                    padding: '0.75rem 1.5rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    fontWeight: '600',
                    backgroundColor: 'var(--bg-surface-elevated)'
                }}>
                    <div></div>
                    <div>Instrument</div>
                    <div>Class</div>
                    <div style={{ textAlign: 'right' }}>Price</div>
                    <div style={{ textAlign: 'right' }}>Change</div>
                    <div style={{ textAlign: 'right' }}>Volume</div>
                    <div></div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', maxHeight: 'calc(100vh - 380px)' }}>
                    {filteredAssets.map(asset => {
                        const isPositive = asset.change >= 0;
                        return (
                            <div
                                key={asset.id}
                                style={{
                                    display: 'grid', gridTemplateColumns: '0.3fr 2fr 0.8fr 1fr 1fr 0.8fr 0.5fr',
                                    padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--border-subtle)',
                                    alignItems: 'center', cursor: 'pointer', transition: 'background-color 0.15s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-highlight)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                onClick={() => setSelectedAsset(asset)}
                            >
                                {/* Watchlist star */}
                                <div>
                                    <button onClick={(e) => { e.stopPropagation(); toggleWatchlist(asset.id); }}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: asset.isWatchlisted ? '#f59e0b' : 'var(--text-muted)', transition: 'color 0.15s' }}>
                                        {asset.isWatchlisted ? <Star size={14} fill="#f59e0b" /> : <StarOff size={14} />}
                                    </button>
                                </div>

                                {/* Instrument */}
                                <div>
                                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {asset.id}
                                        {asset.isLive && <Zap size={10} color="var(--color-success)" />}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{asset.name}</div>
                                </div>

                                {/* Class badge */}
                                <div>
                                    <span className="badge" style={{
                                        backgroundColor: {
                                            'Equities': 'rgba(59, 130, 246, 0.1)', 'F&O': 'rgba(168, 85, 247, 0.1)',
                                            'Crypto': 'rgba(245, 158, 11, 0.1)', 'Commodities': 'rgba(16, 185, 129, 0.1)',
                                            'Currency': 'rgba(236, 72, 153, 0.1)'
                                        }[asset.class] || 'var(--bg-surface-highlight)',
                                        color: {
                                            'Equities': 'var(--accent-primary)', 'F&O': '#a855f7',
                                            'Crypto': '#f59e0b', 'Commodities': '#10b981',
                                            'Currency': '#ec4899'
                                        }[asset.class] || 'var(--text-secondary)',
                                        fontSize: '0.7rem'
                                    }}>
                                        {asset.class}
                                    </span>
                                </div>

                                {/* Price */}
                                <div className="text-mono" style={{ textAlign: 'right', fontWeight: '500', transition: 'color 0.15s' }}>
                                    {asset.currency}{asset.price.toLocaleString(asset.currency === '$' ? 'en-US' : 'en-IN', { minimumFractionDigits: asset.price < 1 ? 4 : 2, maximumFractionDigits: asset.price < 1 ? 6 : 2 })}
                                </div>

                                {/* Change */}
                                <div className={`text-mono ${isPositive ? 'color-success' : 'color-danger'}`} style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                    {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                    {isPositive ? '+' : ''}{asset.change.toFixed(2)}%
                                </div>

                                {/* Volume */}
                                <div className="text-mono" style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{asset.vol}</div>

                                {/* Arrow */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <ChevronRight size={18} color="var(--text-muted)" />
                                </div>
                            </div>
                        );
                    })}

                    {filteredAssets.length === 0 && (
                        <div className="flex-center" style={{ padding: '3rem', color: 'var(--text-muted)', flexDirection: 'column', gap: '0.5rem' }}>
                            <Search size={32} />
                            <span>No instruments found matching "{filterQuery}"</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
