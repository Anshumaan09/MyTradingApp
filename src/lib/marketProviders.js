// M-01 / M-02 / M-03: Multi-Broker WebSocket Market Data Providers
// Unified interface for Upstox, Zerodha (Kite), and Binance WebSocket feeds.
// Each provider normalizes data into a common tick format.

// ==========================================
// Common Tick Format
// ==========================================
// { symbol, exchange, ltp, open, high, low, close, volume, bid, ask, timestamp }

const PROVIDER_STATUS = { DISCONNECTED: 0, CONNECTING: 1, CONNECTED: 2, ERROR: 3 };

// ==========================================
// M-01: Upstox WebSocket Provider
// ==========================================
class UpstoxWebSocketProvider {
    constructor(accessToken) {
        this.accessToken = accessToken;
        this.ws = null;
        this.status = PROVIDER_STATUS.DISCONNECTED;
        this.listeners = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.subscribedTokens = new Set();
    }

    connect() {
        if (this.status === PROVIDER_STATUS.CONNECTED) return;
        this.status = PROVIDER_STATUS.CONNECTING;

        try {
            // Production: wss://api.upstox.com/v2/feed/market-data-feed
            // Demo: simulate with interval-based price generation
            this._startSimulation();
            this.status = PROVIDER_STATUS.CONNECTED;
            this.reconnectAttempts = 0;
            console.log('[Upstox WS] Connected (simulated)');
        } catch (err) {
            this.status = PROVIDER_STATUS.ERROR;
            this._scheduleReconnect();
        }
    }

    subscribe(symbols) {
        symbols.forEach(s => this.subscribedTokens.add(s));
    }

    unsubscribe(symbols) {
        symbols.forEach(s => this.subscribedTokens.delete(s));
    }

    on(event, callback) {
        if (!this.listeners.has(event)) this.listeners.set(event, []);
        this.listeners.get(event).push(callback);
    }

    _emit(event, data) {
        (this.listeners.get(event) || []).forEach(cb => cb(data));
    }

    _startSimulation() {
        this._interval = setInterval(() => {
            this.subscribedTokens.forEach(symbol => {
                const base = this._getBasePrice(symbol);
                const tick = {
                    symbol,
                    exchange: 'NSE',
                    provider: 'upstox',
                    ltp: +(base + (Math.random() - 0.5) * base * 0.002).toFixed(2),
                    open: +(base * 0.999).toFixed(2),
                    high: +(base * 1.015).toFixed(2),
                    low: +(base * 0.985).toFixed(2),
                    close: +base.toFixed(2),
                    volume: Math.floor(Math.random() * 100000) + 50000,
                    bid: +(base - 0.05).toFixed(2),
                    ask: +(base + 0.05).toFixed(2),
                    timestamp: Date.now()
                };
                this._emit('tick', tick);
            });
        }, 1000);
    }

    _getBasePrice(symbol) {
        const prices = {
            // Equities (NSE Top 30)
            'RELIANCE': 2890, 'TCS': 3750, 'HDFCBANK': 1680, 'INFY': 1520, 'ICICIBANK': 1250,
            'WIPRO': 480, 'SBIN': 780, 'BHARTIARTL': 1890, 'ITC': 495, 'LT': 3480,
            'TATAMOTORS': 720, 'AXISBANK': 1120, 'KOTAKBANK': 1980, 'BAJFINANCE': 7200,
            'MARUTI': 12500, 'ADANIENT': 2350, 'SUNPHARMA': 1780, 'TITAN': 3650,
            'ADANIPORTS': 1180, 'HINDUNILVR': 2450, 'ASIANPAINT': 2780, 'NESTLEIND': 24500,
            'TECHM': 1450, 'HCLTECH': 1680, 'POWERGRID': 310, 'NTPC': 380,
            'ONGC': 260, 'COALINDIA': 450, 'JSWSTEEL': 890, 'TATASTEEL': 145,
            // F&O Indices
            'NIFTY50': 21840, 'BANKNIFTY': 45980, 'FINNIFTY': 21450, 'MIDCPNIFTY': 12350, 'SENSEX': 72152,
            // Crypto
            'BTCUSDT': 67500, 'ETHUSDT': 3800, 'BNBUSDT': 620, 'SOLUSDT': 185,
            'XRPUSDT': 0.62, 'ADAUSDT': 0.45, 'DOGEUSDT': 0.12, 'DOTUSDT': 7.5,
            'MATICUSDT': 0.72, 'AVAXUSDT': 38, 'LINKUSDT': 18.5, 'UNIUSDT': 12.3,
            'ATOMUSDT': 9.2, 'NEARUSDT': 5.8, 'APTUSDT': 8.5,
            // Commodities (MCX)
            'GOLD': 62450, 'SILVER': 74500, 'CRUDEOIL': 6780, 'NATURALGAS': 185,
            'COPPER': 780, 'ALUMINIUM': 215, 'ZINC': 245, 'COTTON': 26800,
            // Currency (CDS)
            'USDINR': 83.15, 'EURINR': 90.25, 'GBPINR': 105.40, 'JPYINR': 0.556,
            'EURUSD': 1.0855, 'GBPUSD': 1.2675
        };
        return prices[symbol] || 1000 + Math.random() * 500;
    }

    _scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000));
    }

    disconnect() {
        clearInterval(this._interval);
        this.status = PROVIDER_STATUS.DISCONNECTED;
        this.subscribedTokens.clear();
        console.log('[Upstox WS] Disconnected');
    }
}


// ==========================================
// M-02: Zerodha (Kite) WebSocket Provider
// ==========================================
class ZerodhaWebSocketProvider {
    constructor(apiKey, accessToken) {
        this.apiKey = apiKey;
        this.accessToken = accessToken;
        this.ws = null;
        this.status = PROVIDER_STATUS.DISCONNECTED;
        this.listeners = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.subscribedTokens = new Set();
    }

    connect() {
        if (this.status === PROVIDER_STATUS.CONNECTED) return;
        this.status = PROVIDER_STATUS.CONNECTING;

        try {
            // Production: wss://ws.kite.trade?api_key=xxx&access_token=yyy
            this._startSimulation();
            this.status = PROVIDER_STATUS.CONNECTED;
            this.reconnectAttempts = 0;
            console.log('[Zerodha WS] Connected (simulated)');
        } catch (err) {
            this.status = PROVIDER_STATUS.ERROR;
            this._scheduleReconnect();
        }
    }

    subscribe(instrumentTokens) {
        instrumentTokens.forEach(t => this.subscribedTokens.add(t));
        // Production: send binary subscribe message
    }

    unsubscribe(instrumentTokens) {
        instrumentTokens.forEach(t => this.subscribedTokens.delete(t));
    }

    setMode(mode, instruments) {
        // Kite modes: 'modeFull', 'modeQuote', 'modeLTP'
        console.log(`[Zerodha WS] Set mode: ${mode} for ${instruments.length} instruments`);
    }

    on(event, callback) {
        if (!this.listeners.has(event)) this.listeners.set(event, []);
        this.listeners.get(event).push(callback);
    }

    _emit(event, data) {
        (this.listeners.get(event) || []).forEach(cb => cb(data));
    }

    _startSimulation() {
        this._interval = setInterval(() => {
            this.subscribedTokens.forEach(symbol => {
                const base = 1000 + Math.random() * 3000;
                const tick = {
                    symbol: String(symbol),
                    exchange: 'NSE',
                    provider: 'zerodha',
                    ltp: +(base + (Math.random() - 0.5) * base * 0.002).toFixed(2),
                    open: +(base * 0.999).toFixed(2),
                    high: +(base * 1.012).toFixed(2),
                    low: +(base * 0.988).toFixed(2),
                    close: +base.toFixed(2),
                    volume: Math.floor(Math.random() * 200000) + 30000,
                    oi: Math.floor(Math.random() * 50000),
                    bid: +(base - 0.10).toFixed(2),
                    ask: +(base + 0.10).toFixed(2),
                    timestamp: Date.now()
                };
                this._emit('tick', tick);
            });
        }, 1000);
    }

    _scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000));
    }

    disconnect() {
        clearInterval(this._interval);
        this.status = PROVIDER_STATUS.DISCONNECTED;
        this.subscribedTokens.clear();
        console.log('[Zerodha WS] Disconnected');
    }
}


// ==========================================
// M-03: Binance WebSocket Provider
// ==========================================
class BinanceWebSocketProvider {
    constructor() {
        this.ws = null;
        this.status = PROVIDER_STATUS.DISCONNECTED;
        this.listeners = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.subscribedPairs = new Set();
    }

    connect() {
        if (this.status === PROVIDER_STATUS.CONNECTED) return;
        this.status = PROVIDER_STATUS.CONNECTING;

        try {
            // Production: wss://stream.binance.com:9443/ws/<streams>
            this._startSimulation();
            this.status = PROVIDER_STATUS.CONNECTED;
            this.reconnectAttempts = 0;
            console.log('[Binance WS] Connected (simulated)');
        } catch (err) {
            this.status = PROVIDER_STATUS.ERROR;
            this._scheduleReconnect();
        }
    }

    subscribe(pairs) {
        pairs.forEach(p => this.subscribedPairs.add(p.toLowerCase()));
    }

    unsubscribe(pairs) {
        pairs.forEach(p => this.subscribedPairs.delete(p.toLowerCase()));
    }

    on(event, callback) {
        if (!this.listeners.has(event)) this.listeners.set(event, []);
        this.listeners.get(event).push(callback);
    }

    _emit(event, data) {
        (this.listeners.get(event) || []).forEach(cb => cb(data));
    }

    _startSimulation() {
        const cryptoPrices = {
            'btcusdt': 67500, 'ethusdt': 3800, 'bnbusdt': 620, 'solusdt': 185,
            'xrpusdt': 0.62, 'adausdt': 0.45, 'dogeusdt': 0.12, 'dotusdt': 7.5,
            'maticusdt': 0.72, 'avaxusdt': 38
        };

        this._interval = setInterval(() => {
            this.subscribedPairs.forEach(pair => {
                const base = cryptoPrices[pair] || 100;
                const tick = {
                    symbol: pair.toUpperCase(),
                    exchange: 'BINANCE',
                    provider: 'binance',
                    ltp: +(base + (Math.random() - 0.5) * base * 0.003).toFixed(base > 100 ? 2 : 6),
                    open: +(base * 0.998).toFixed(2),
                    high: +(base * 1.02).toFixed(2),
                    low: +(base * 0.98).toFixed(2),
                    close: +base.toFixed(2),
                    volume: +(Math.random() * 5000).toFixed(4),
                    bid: +(base * 0.9999).toFixed(base > 100 ? 2 : 6),
                    ask: +(base * 1.0001).toFixed(base > 100 ? 2 : 6),
                    timestamp: Date.now()
                };
                this._emit('tick', tick);
            });
        }, 500); // Crypto ticks faster
    }

    _scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000));
    }

    disconnect() {
        clearInterval(this._interval);
        this.status = PROVIDER_STATUS.DISCONNECTED;
        this.subscribedPairs.clear();
        console.log('[Binance WS] Disconnected');
    }
}


// ==========================================
// Factory
// ==========================================
export function createProvider(broker, credentials = {}) {
    switch (broker) {
        case 'upstox':
            return new UpstoxWebSocketProvider(credentials.accessToken);
        case 'zerodha':
            return new ZerodhaWebSocketProvider(credentials.apiKey, credentials.accessToken);
        case 'binance':
            return new BinanceWebSocketProvider();
        default:
            throw new Error(`Unknown broker: ${broker}`);
    }
}

export { UpstoxWebSocketProvider, ZerodhaWebSocketProvider, BinanceWebSocketProvider, PROVIDER_STATUS };
