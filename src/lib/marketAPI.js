// M-07: Market Data REST API Layer
// Provides /quote, /history, /search, /screen endpoints
// Uses Supabase queries for persistent data, PriceCache for live data

import { supabase } from './supabase';
import { getMarketDataService } from './marketDataService';

// ==========================================
// GET /quote — Live or cached quote
// ==========================================

/**
 * Get real-time quote for a symbol
 */
export async function getQuote(symbol) {
    const mds = getMarketDataService();
    const live = mds.getQuote(symbol);
    if (live) return live;

    // Fallback: check daily OHLCV
    const { data } = await supabase
        .from('ohlcv_daily')
        .select('*')
        .eq('symbol', symbol)
        .order('trade_date', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (data) {
        return {
            symbol, exchange: data.exchange,
            ltp: Number(data.close), open: Number(data.open),
            high: Number(data.high), low: Number(data.low),
            close: Number(data.close), volume: Number(data.volume),
            changePercent: Number(data.change_percent),
            timestamp: new Date(data.trade_date).getTime()
        };
    }
    return null;
}

/**
 * Get quotes for multiple symbols
 */
export async function getQuotes(symbols) {
    const mds = getMarketDataService();
    const result = {};

    for (const sym of symbols) {
        const live = mds.getQuote(sym);
        if (live) {
            result[sym] = live;
        }
    }

    // Fill missing from DB
    const missing = symbols.filter(s => !result[s]);
    if (missing.length > 0) {
        const { data } = await supabase
            .from('ohlcv_daily')
            .select('*')
            .in('symbol', missing)
            .order('trade_date', { ascending: false });

        // Group by symbol, take latest
        const seen = new Set();
        (data || []).forEach(row => {
            if (!seen.has(row.symbol)) {
                seen.add(row.symbol);
                result[row.symbol] = {
                    symbol: row.symbol, exchange: row.exchange,
                    ltp: Number(row.close), open: Number(row.open),
                    high: Number(row.high), low: Number(row.low),
                    close: Number(row.close), volume: Number(row.volume),
                    timestamp: new Date(row.trade_date).getTime()
                };
            }
        });
    }

    return result;
}

// ==========================================
// GET /history — OHLCV candlestick data
// ==========================================

/**
 * Get historical OHLCV candles
 * @param {string} symbol
 * @param {string} interval - '1m', '5m', '15m', '1h', '1d'
 * @param {number} limit - Number of candles
 */
export async function getHistory(symbol, interval = '1d', limit = 100) {
    if (interval === '1d') {
        const { data, error } = await supabase
            .from('ohlcv_daily')
            .select('trade_date, open, high, low, close, volume')
            .eq('symbol', symbol)
            .order('trade_date', { ascending: true })
            .limit(limit);

        if (error) throw error;

        return (data || []).map(d => ({
            time: d.trade_date,
            open: Number(d.open), high: Number(d.high),
            low: Number(d.low), close: Number(d.close),
            volume: Number(d.volume)
        }));
    }

    if (interval === '1m') {
        const { data, error } = await supabase
            .from('ohlcv_1m')
            .select('bucket, open, high, low, close, volume')
            .eq('symbol', symbol)
            .order('bucket', { ascending: true })
            .limit(limit);

        if (error) throw error;

        return (data || []).map(d => ({
            time: Math.floor(new Date(d.bucket).getTime() / 1000),
            open: Number(d.open), high: Number(d.high),
            low: Number(d.low), close: Number(d.close),
            volume: Number(d.volume)
        }));
    }

    // For 5m, 15m, 1h — aggregate from 1m candles
    const multiplier = { '5m': 5, '15m': 15, '1h': 60 }[interval] || 5;
    const rawLimit = limit * multiplier;

    const { data } = await supabase
        .from('ohlcv_1m')
        .select('bucket, open, high, low, close, volume')
        .eq('symbol', symbol)
        .order('bucket', { ascending: true })
        .limit(rawLimit);

    if (!data || data.length === 0) return [];

    // Aggregate into larger candles
    const aggregated = [];
    for (let i = 0; i < data.length; i += multiplier) {
        const chunk = data.slice(i, i + multiplier);
        if (chunk.length === 0) break;
        aggregated.push({
            time: Math.floor(new Date(chunk[0].bucket).getTime() / 1000),
            open: Number(chunk[0].open),
            high: Math.max(...chunk.map(c => Number(c.high))),
            low: Math.min(...chunk.map(c => Number(c.low))),
            close: Number(chunk[chunk.length - 1].close),
            volume: chunk.reduce((sum, c) => sum + Number(c.volume), 0)
        });
    }
    return aggregated;
}

// ==========================================
// GET /search — Instrument search
// ==========================================

/**
 * Search instruments by name or symbol
 */
export async function searchInstruments(query, segment = null, limit = 20) {
    let q = supabase
        .from('instruments')
        .select('*')
        .eq('is_active', true)
        .or(`symbol.ilike.%${query}%,name.ilike.%${query}%,trading_symbol.ilike.%${query}%`)
        .limit(limit);

    if (segment) q = q.eq('segment', segment);

    const { data, error } = await q;
    if (error) throw error;

    return (data || []).map(i => ({
        symbol: i.symbol,
        name: i.name,
        exchange: i.exchange,
        segment: i.segment,
        type: i.instrument_type,
        sector: i.sector,
        lotSize: i.lot_size,
        tradingSymbol: i.trading_symbol
    }));
}

/**
 * Static fallback for when instruments table is empty
 */
export function getDefaultStocks() {
    return [
        { symbol: 'RELIANCE', name: 'Reliance Industries', exchange: 'NSE', segment: 'EQ', sector: 'Oil & Gas', ltp: 2890 },
        { symbol: 'TCS', name: 'Tata Consultancy Services', exchange: 'NSE', segment: 'EQ', sector: 'IT', ltp: 3750 },
        { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', exchange: 'NSE', segment: 'EQ', sector: 'Banking', ltp: 1680 },
        { symbol: 'INFY', name: 'Infosys Ltd', exchange: 'NSE', segment: 'EQ', sector: 'IT', ltp: 1520 },
        { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', exchange: 'NSE', segment: 'EQ', sector: 'Banking', ltp: 1250 },
        { symbol: 'WIPRO', name: 'Wipro Ltd', exchange: 'NSE', segment: 'EQ', sector: 'IT', ltp: 480 },
        { symbol: 'SBIN', name: 'State Bank of India', exchange: 'NSE', segment: 'EQ', sector: 'Banking', ltp: 780 },
        { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', exchange: 'NSE', segment: 'EQ', sector: 'Telecom', ltp: 1890 },
        { symbol: 'ITC', name: 'ITC Ltd', exchange: 'NSE', segment: 'EQ', sector: 'FMCG', ltp: 495 },
        { symbol: 'LT', name: 'Larsen & Toubro', exchange: 'NSE', segment: 'EQ', sector: 'Infrastructure', ltp: 3480 },
        { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', exchange: 'NSE', segment: 'EQ', sector: 'Auto', ltp: 720 },
        { symbol: 'AXISBANK', name: 'Axis Bank Ltd', exchange: 'NSE', segment: 'EQ', sector: 'Banking', ltp: 1120 },
        { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', exchange: 'NSE', segment: 'EQ', sector: 'NBFC', ltp: 7200 },
        { symbol: 'MARUTI', name: 'Maruti Suzuki Ltd', exchange: 'NSE', segment: 'EQ', sector: 'Auto', ltp: 12500 },
        { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', exchange: 'NSE', segment: 'EQ', sector: 'Pharma', ltp: 1780 },
        { symbol: 'TITAN', name: 'Titan Company Ltd', exchange: 'NSE', segment: 'EQ', sector: 'Consumer', ltp: 3650 },
    ];
}

// ==========================================
// GET /screen — Stock screener
// ==========================================

/**
 * Screen stocks based on criteria
 */
export async function screenStocks(filters = {}) {
    let q = supabase
        .from('instruments')
        .select('*')
        .eq('is_active', true)
        .eq('instrument_type', 'stock');

    if (filters.sector) q = q.eq('sector', filters.sector);
    if (filters.marketCap) q = q.eq('market_cap_category', filters.marketCap);
    if (filters.exchange) q = q.eq('exchange', filters.exchange);

    const { data, error } = await q.limit(filters.limit || 50);
    if (error) throw error;

    return data || [];
}
