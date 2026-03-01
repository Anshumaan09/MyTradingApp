/**
 * Crypto Trading Engine
 * Validation, charges calculation, and execution helpers for crypto trades.
 */

// Supported crypto pairs with trading parameters
export const CRYPTO_PAIRS = {
    BTCUSDT: { base: 'BTC', quote: 'USDT', minQty: 0.00001, stepSize: 0.00001, minNotional: 10, icon: '₿' },
    ETHUSDT: { base: 'ETH', quote: 'USDT', minQty: 0.0001, stepSize: 0.0001, minNotional: 10, icon: 'Ξ' },
    SOLUSDT: { base: 'SOL', quote: 'USDT', minQty: 0.01, stepSize: 0.01, minNotional: 5, icon: '◎' },
    XRPUSDT: { base: 'XRP', quote: 'USDT', minQty: 0.1, stepSize: 0.1, minNotional: 5, icon: '✕' },
    DOGEUSDT: { base: 'DOGE', quote: 'USDT', minQty: 1, stepSize: 1, minNotional: 1, icon: 'Ð' },
    ADAUSDT: { base: 'ADA', quote: 'USDT', minQty: 1, stepSize: 1, minNotional: 5, icon: '₳' },
    AVAXUSDT: { base: 'AVAX', quote: 'USDT', minQty: 0.01, stepSize: 0.01, minNotional: 5, icon: '🔺' },
    DOTUSDT: { base: 'DOT', quote: 'USDT', minQty: 0.01, stepSize: 0.01, minNotional: 5, icon: '●' },
    MATICUSDT: { base: 'MATIC', quote: 'USDT', minQty: 1, stepSize: 1, minNotional: 5, icon: '⬡' },
    LINKUSDT: { base: 'LINK', quote: 'USDT', minQty: 0.01, stepSize: 0.01, minNotional: 5, icon: '⬡' },
    UNIUSDT: { base: 'UNI', quote: 'USDT', minQty: 0.01, stepSize: 0.01, minNotional: 5, icon: '🦄' },
    ATOMUSDT: { base: 'ATOM', quote: 'USDT', minQty: 0.01, stepSize: 0.01, minNotional: 5, icon: '⚛' },
    NEARUSDT: { base: 'NEAR', quote: 'USDT', minQty: 0.1, stepSize: 0.1, minNotional: 5, icon: 'Ⓝ' },
    APTUSDT: { base: 'APT', quote: 'USDT', minQty: 0.01, stepSize: 0.01, minNotional: 5, icon: '🅰' },
    LTCUSDT: { base: 'LTC', quote: 'USDT', minQty: 0.001, stepSize: 0.001, minNotional: 5, icon: 'Ł' },
};

/**
 * Validate a crypto order
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateCryptoOrder(pair, side, quantity, price) {
    const config = CRYPTO_PAIRS[pair];
    if (!config) return { valid: false, error: `Unsupported pair: ${pair}` };
    if (!['BUY', 'SELL'].includes(side)) return { valid: false, error: 'Invalid side' };
    if (quantity <= 0) return { valid: false, error: 'Quantity must be positive' };
    if (quantity < config.minQty) return { valid: false, error: `Min quantity: ${config.minQty} ${config.base}` };
    if (price <= 0) return { valid: false, error: 'Price must be positive' };

    const notional = quantity * price;
    if (notional < config.minNotional) return { valid: false, error: `Min order value: $${config.minNotional}` };

    // Check step size
    const remainder = quantity % config.stepSize;
    if (Math.abs(remainder) > 1e-10) return { valid: false, error: `Quantity must be in steps of ${config.stepSize}` };

    return { valid: true };
}

/**
 * Calculate crypto trading charges
 * @returns {{ platformFee, gst, tds, totalCharges, netValue }}
 */
export function calculateCryptoCharges(quantity, price, side) {
    const totalValue = quantity * price;
    const platformFee = totalValue * 0.001; // 0.1%
    const gst = platformFee * 0.18;         // 18% GST on fee
    const tds = side === 'SELL' ? totalValue * 0.01 : 0; // 1% TDS on sell
    const totalCharges = platformFee + gst + tds;

    return {
        totalValue: +totalValue.toFixed(4),
        platformFee: +platformFee.toFixed(4),
        gst: +gst.toFixed(4),
        tds: +tds.toFixed(4),
        totalCharges: +totalCharges.toFixed(4),
        netCost: side === 'BUY' ? +(totalValue + totalCharges).toFixed(4) : +(totalValue - totalCharges).toFixed(4),
    };
}

/**
 * Convert INR amount to crypto quantity using USD/INR rate
 * Assumes ~83 INR/USD for demo purposes
 */
export const INR_USD_RATE = 83;

export function inrToUsd(inr) {
    return inr / INR_USD_RATE;
}

export function usdToInr(usd) {
    return usd * INR_USD_RATE;
}
