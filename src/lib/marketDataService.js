// M-04 / M-05 / M-06: Market Data Service
// Aggregates ticks from all WebSocket providers into:
// - In-memory price cache (M-05, replaces Redis for Path A)
// - OHLCV candle builder + DB writer (M-06)
// - Tick event bus (M-04, replaces Kafka for Path A)

import { supabase } from './supabase';
import { createProvider, PROVIDER_STATUS } from './marketProviders';

// ==========================================
// M-05: In-Memory Price Cache (Redis replacement)
// ==========================================
class PriceCache {
    constructor() {
        this.prices = new Map();       // symbol → latest tick
        this.snapshots = new Map();    // symbol → last 100 ticks (for sparkline)
        this.maxSnapshots = 100;
    }

    update(tick) {
        this.prices.set(tick.symbol, tick);

        if (!this.snapshots.has(tick.symbol)) {
            this.snapshots.set(tick.symbol, []);
        }
        const snaps = this.snapshots.get(tick.symbol);
        snaps.push({ ltp: tick.ltp, ts: tick.timestamp });
        if (snaps.length > this.maxSnapshots) snaps.shift();
    }

    get(symbol) {
        return this.prices.get(symbol) || null;
    }

    getAll() {
        return Object.fromEntries(this.prices);
    }

    getSparkline(symbol) {
        return (this.snapshots.get(symbol) || []).map(s => s.ltp);
    }

    getMulti(symbols) {
        const result = {};
        symbols.forEach(s => {
            const p = this.prices.get(s);
            if (p) result[s] = p;
        });
        return result;
    }

    clear() {
        this.prices.clear();
        this.snapshots.clear();
    }
}

// ==========================================
// M-06: OHLCV Candle Builder + DB Writer
// ==========================================
class OHLCVWriter {
    constructor() {
        this.candles = new Map(); // "symbol:exchange" → { open, high, low, close, volume, tradeCount, bucket }
        this.flushInterval = 60000; // Flush every 60 seconds
        this._timer = null;
    }

    start() {
        this._timer = setInterval(() => this.flush(), this.flushInterval);
    }

    processTick(tick) {
        const key = `${tick.symbol}:${tick.exchange}`;
        const now = new Date();
        const bucket = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());

        let candle = this.candles.get(key);

        if (!candle || candle.bucket.getTime() !== bucket.getTime()) {
            // New minute candle
            if (candle) this._writeCandle(key, candle); // Write previous candle
            candle = {
                symbol: tick.symbol,
                exchange: tick.exchange,
                bucket: bucket,
                open: tick.ltp,
                high: tick.ltp,
                low: tick.ltp,
                close: tick.ltp,
                volume: tick.volume || 0,
                tradeCount: 1,
                vwap: tick.ltp
            };
            this.candles.set(key, candle);
        } else {
            candle.high = Math.max(candle.high, tick.ltp);
            candle.low = Math.min(candle.low, tick.ltp);
            candle.close = tick.ltp;
            candle.volume += (tick.volume || 0);
            candle.tradeCount += 1;
        }
    }

    async _writeCandle(key, candle) {
        try {
            await supabase.from('ohlcv_1m').upsert({
                symbol: candle.symbol,
                exchange: candle.exchange,
                bucket: candle.bucket.toISOString(),
                open: candle.open,
                high: candle.high,
                low: candle.low,
                close: candle.close,
                volume: candle.volume,
                trade_count: candle.tradeCount,
                vwap: candle.vwap
            }, { onConflict: 'symbol,exchange,bucket' });
        } catch (err) {
            console.error(`[OHLCV Writer] Failed to write candle for ${key}:`, err.message);
        }
    }

    async flush() {
        const promises = [];
        for (const [key, candle] of this.candles) {
            promises.push(this._writeCandle(key, candle));
        }
        await Promise.allSettled(promises);
    }

    stop() {
        clearInterval(this._timer);
        this.flush(); // Final flush
    }
}

// ==========================================
// M-04: Market Data Event Bus (Kafka replacement)
// ==========================================
class MarketEventBus {
    constructor() {
        this.subscribers = new Map(); // topic → [callback]
    }

    subscribe(topic, callback) {
        if (!this.subscribers.has(topic)) this.subscribers.set(topic, []);
        this.subscribers.get(topic).push(callback);
        return () => {
            const subs = this.subscribers.get(topic);
            const idx = subs.indexOf(callback);
            if (idx > -1) subs.splice(idx, 1);
        };
    }

    publish(topic, data) {
        (this.subscribers.get(topic) || []).forEach(cb => {
            try { cb(data); } catch (e) { console.error(`[EventBus] Error in ${topic} subscriber:`, e); }
        });
        // Wildcard subscribers
        (this.subscribers.get('*') || []).forEach(cb => {
            try { cb({ topic, data }); } catch (e) { /* silent */ }
        });
    }

    unsubscribeAll(topic) {
        this.subscribers.delete(topic);
    }
}

// ==========================================
// Main Market Data Service (Singleton)
// ==========================================
class MarketDataService {
    constructor() {
        this.providers = new Map();
        this.cache = new PriceCache();
        this.ohlcvWriter = new OHLCVWriter();
        this.eventBus = new MarketEventBus();
        this.isRunning = false;
    }

    /**
     * Add and connect a provider
     */
    addProvider(name, credentials = {}) {
        if (this.providers.has(name)) return;

        const provider = createProvider(name, credentials);
        provider.on('tick', (tick) => {
            this.cache.update(tick);
            this.ohlcvWriter.processTick(tick);
            this.eventBus.publish('tick', tick);
            this.eventBus.publish(`tick:${tick.symbol}`, tick);
        });

        this.providers.set(name, provider);
        return provider;
    }

    /**
     * Start all providers
     */
    start(defaultSymbols = []) {
        if (this.isRunning) return;
        this.isRunning = true;
        this.ohlcvWriter.start();

        this.providers.forEach((provider, name) => {
            provider.connect();
            if (defaultSymbols.length > 0) {
                provider.subscribe(defaultSymbols);
            }
        });

        console.log(`[MarketDataService] Started with ${this.providers.size} providers`);
    }

    /**
     * Subscribe to symbols across all providers
     */
    subscribe(symbols) {
        this.providers.forEach(p => p.subscribe(symbols));
    }

    /**
     * Unsubscribe from symbols
     */
    unsubscribe(symbols) {
        this.providers.forEach(p => p.unsubscribe(symbols));
    }

    /**
     * Get latest price for a symbol
     */
    getQuote(symbol) {
        return this.cache.get(symbol);
    }

    /**
     * Get prices for multiple symbols
     */
    getQuotes(symbols) {
        return this.cache.getMulti(symbols);
    }

    /**
     * Get sparkline data (last N ticks)
     */
    getSparkline(symbol) {
        return this.cache.getSparkline(symbol);
    }

    /**
     * Subscribe to tick events
     */
    onTick(symbolOrCallback, callback) {
        if (typeof symbolOrCallback === 'function') {
            return this.eventBus.subscribe('tick', symbolOrCallback);
        }
        return this.eventBus.subscribe(`tick:${symbolOrCallback}`, callback);
    }

    /**
     * Stop all providers
     */
    stop() {
        this.providers.forEach(p => p.disconnect());
        this.ohlcvWriter.stop();
        this.isRunning = false;
        console.log('[MarketDataService] Stopped');
    }
}

// Singleton instance
let _instance = null;

export function getMarketDataService() {
    if (!_instance) {
        _instance = new MarketDataService();
    }
    return _instance;
}

export { PriceCache, OHLCVWriter, MarketEventBus, MarketDataService };
