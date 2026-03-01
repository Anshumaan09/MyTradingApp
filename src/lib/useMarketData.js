// M-08: WebSocket Gateway — React Hook
// Provides useMarketData hook for components to subscribe to live ticks.
// Replaces the need for a uWebSockets.js gateway in Path A architecture.

import { useState, useEffect, useRef, useCallback } from 'react';
import { getMarketDataService } from './marketDataService';

/**
 * React hook for live market data subscription
 *
 * @param {string[]} symbols - Symbols to subscribe to
 * @param {object} options - { autoConnect: true, providers: ['upstox'] }
 * @returns {{ prices, isConnected, subscribe, unsubscribe }}
 *
 * @example
 * const { prices, isConnected } = useMarketData(['RELIANCE', 'TCS', 'INFY']);
 * // prices.RELIANCE.ltp → 2890.50
 */
export function useMarketData(symbols = [], options = {}) {
    const { autoConnect = true, providers = ['upstox'] } = options;
    const [prices, setPrices] = useState({});
    const [isConnected, setIsConnected] = useState(false);
    const unsubscribersRef = useRef([]);
    const mdsRef = useRef(null);

    useEffect(() => {
        const mds = getMarketDataService();
        mdsRef.current = mds;

        // Initialize providers if not already done
        if (autoConnect && !mds.isRunning) {
            providers.forEach(p => mds.addProvider(p));
            mds.start(symbols);
            setIsConnected(true);
        } else if (mds.isRunning) {
            mds.subscribe(symbols);
            setIsConnected(true);
        }

        // Subscribe to tick updates for our symbols
        const unsubs = symbols.map(symbol => {
            return mds.onTick(symbol, (tick) => {
                setPrices(prev => ({
                    ...prev,
                    [tick.symbol]: {
                        ...tick,
                        change: tick.ltp - tick.close,
                        changePercent: ((tick.ltp - tick.close) / tick.close * 100)
                    }
                }));
            });
        });

        unsubscribersRef.current = unsubs;

        return () => {
            unsubs.forEach(unsub => { if (typeof unsub === 'function') unsub(); });
        };
    }, [JSON.stringify(symbols)]);

    const subscribe = useCallback((newSymbols) => {
        if (mdsRef.current) mdsRef.current.subscribe(newSymbols);
    }, []);

    const unsubscribe = useCallback((oldSymbols) => {
        if (mdsRef.current) mdsRef.current.unsubscribe(oldSymbols);
    }, []);

    return { prices, isConnected, subscribe, unsubscribe };
}

/**
 * React hook for a single symbol's live price
 *
 * @param {string} symbol
 * @returns {{ price, sparkline, isLive }}
 */
export function useSymbolPrice(symbol) {
    const { prices, isConnected } = useMarketData(symbol ? [symbol] : []);
    const mds = getMarketDataService();

    return {
        price: prices[symbol] || null,
        sparkline: mds.getSparkline(symbol),
        isLive: isConnected && !!prices[symbol]
    };
}

/**
 * React hook for watchlist with live prices
 *
 * @param {string[]} watchlist - Array of symbols
 * @returns {{ items, isConnected }}
 */
export function useWatchlist(watchlist = []) {
    const { prices, isConnected } = useMarketData(watchlist);

    const items = watchlist.map(symbol => {
        const tick = prices[symbol];
        return {
            symbol,
            ltp: tick?.ltp || 0,
            change: tick?.change || 0,
            changePercent: tick?.changePercent || 0,
            high: tick?.high || 0,
            low: tick?.low || 0,
            volume: tick?.volume || 0,
            isLive: !!tick
        };
    });

    return { items, isConnected };
}

/**
 * React hook for sparkline chart data (last N prices for a symbol)
 *
 * @param {string} symbol
 * @param {number} maxPoints
 * @returns {number[]} Array of price points
 */
export function useSparkline(symbol, maxPoints = 50) {
    const [points, setPoints] = useState([]);
    const mds = getMarketDataService();

    useEffect(() => {
        if (!symbol) return;

        const unsub = mds.onTick(symbol, (tick) => {
            setPoints(prev => {
                const next = [...prev, tick.ltp];
                return next.length > maxPoints ? next.slice(-maxPoints) : next;
            });
        });

        return () => { if (typeof unsub === 'function') unsub(); };
    }, [symbol, maxPoints]);

    return points;
}
