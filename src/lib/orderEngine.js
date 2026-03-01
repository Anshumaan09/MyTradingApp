// Sprint 5: Order Engine — Core Modules
// O-01: Order Validator
// O-02: Idempotency Check
// O-03: Fund Check + Lock
// O-04: Charges Calculator

import { supabase } from './supabase';
import { getMarketDataService } from './marketDataService';

// ==========================================
// O-01: Order Validator
// ==========================================

const VALID_EXCHANGES = ['NSE', 'BSE', 'MCX', 'CDS', 'MOCK'];
const VALID_ORDER_TYPES = ['market', 'limit', 'sl', 'sl-m'];
const VALID_PRODUCT_TYPES = ['CNC', 'MIS', 'NRML', 'MTF'];
const VALID_SIDES = ['BUY', 'SELL'];

export function validateOrder(order) {
    const errors = [];

    if (!order.symbol || typeof order.symbol !== 'string' || order.symbol.length < 1) {
        errors.push('Symbol is required');
    }

    if (!VALID_SIDES.includes(order.side?.toUpperCase())) {
        errors.push(`Invalid side: ${order.side}. Must be BUY or SELL`);
    }

    if (!order.quantity || order.quantity <= 0 || !Number.isInteger(order.quantity)) {
        errors.push('Quantity must be a positive integer');
    }

    if (!VALID_ORDER_TYPES.includes(order.orderType?.toLowerCase())) {
        errors.push(`Invalid order type: ${order.orderType}. Must be: ${VALID_ORDER_TYPES.join(', ')}`);
    }

    if (!VALID_PRODUCT_TYPES.includes(order.productType?.toUpperCase())) {
        errors.push(`Invalid product type: ${order.productType}. Must be: ${VALID_PRODUCT_TYPES.join(', ')}`);
    }

    // Limit orders need a price
    if (['limit', 'sl'].includes(order.orderType?.toLowerCase())) {
        if (!order.price || order.price <= 0) {
            errors.push('Limit/SL orders require a positive price');
        }
    }

    // SL orders need a trigger price
    if (['sl', 'sl-m'].includes(order.orderType?.toLowerCase())) {
        if (!order.triggerPrice || order.triggerPrice <= 0) {
            errors.push('Stop-loss orders require a trigger price');
        }
        // Validate trigger vs price for SL orders
        if (order.triggerPrice && order.price) {
            if (order.side === 'BUY' && order.triggerPrice < order.price) {
                errors.push('For BUY SL orders, trigger price should be ≥ limit price');
            }
            if (order.side === 'SELL' && order.triggerPrice > order.price) {
                errors.push('For SELL SL orders, trigger price should be ≤ limit price');
            }
        }
    }

    // Quantity lot size validation for F&O
    if (order.segment === 'FO' && order.lotSize) {
        if (order.quantity % order.lotSize !== 0) {
            errors.push(`F&O quantity must be a multiple of lot size (${order.lotSize})`);
        }
    }

    // Price tick size validation
    if (order.price) {
        const tickSize = order.tickSize || 0.05;
        const remainder = (order.price * 100) % (tickSize * 100);
        if (Math.abs(remainder) > 0.001) {
            errors.push(`Price must be a multiple of tick size (${tickSize})`);
        }
    }

    return { valid: errors.length === 0, errors };
}

// ==========================================
// O-02: Idempotency Check
// ==========================================

const processedRequests = new Map(); // requestId → timestamp
const IDEMPOTENCY_WINDOW = 5 * 60 * 1000; // 5 minutes

/**
 * Check if a request ID has already been processed
 */
export function checkIdempotency(requestId) {
    if (!requestId) return { isDuplicate: false };

    const existing = processedRequests.get(requestId);
    if (existing && Date.now() - existing < IDEMPOTENCY_WINDOW) {
        return { isDuplicate: true, message: `Order with request ID ${requestId} was already processed` };
    }

    return { isDuplicate: false };
}

/**
 * Mark a request ID as processed
 */
export function markProcessed(requestId) {
    processedRequests.set(requestId, Date.now());
    // Cleanup old entries
    if (processedRequests.size > 1000) {
        const cutoff = Date.now() - IDEMPOTENCY_WINDOW;
        for (const [key, time] of processedRequests) {
            if (time < cutoff) processedRequests.delete(key);
        }
    }
}

/**
 * DB-level idempotency check using orders.request_id
 */
export async function checkIdempotencyDB(requestId) {
    if (!requestId) return { isDuplicate: false };

    const { data } = await supabase
        .from('orders')
        .select('id, status')
        .eq('request_id', requestId)
        .maybeSingle();

    return {
        isDuplicate: !!data,
        existingOrderId: data?.id,
        existingStatus: data?.status
    };
}

// ==========================================
// O-03: Fund Check + Lock
// ==========================================

/**
 * Pre-trade fund check and margin lock
 */
export async function preTradeFundCheck(userId, order) {
    const requiredMargin = calculateRequiredMargin(order);

    // Get current wallet
    const { data: wallet } = await supabase
        .from('inr_wallet')
        .select('balance, locked_balance')
        .eq('user_id', userId)
        .single();

    if (!wallet) throw new Error('Wallet not found');

    const freeBalance = Number(wallet.balance) - Number(wallet.locked_balance);

    if (order.side === 'BUY' && freeBalance < requiredMargin) {
        return {
            sufficient: false,
            required: requiredMargin,
            available: freeBalance,
            shortfall: requiredMargin - freeBalance,
            message: `Insufficient margin. Required: ₹${requiredMargin.toLocaleString('en-IN')}, Available: ₹${freeBalance.toLocaleString('en-IN')}`
        };
    }

    // For SELL — check holdings
    if (order.side === 'SELL') {
        const { data: holding } = await supabase
            .from('holdings')
            .select('quantity')
            .eq('user_id', userId)
            .eq('symbol', order.symbol)
            .maybeSingle();

        if (!holding || Number(holding.quantity) < order.quantity) {
            return {
                sufficient: false,
                required: order.quantity,
                available: Number(holding?.quantity || 0),
                message: `Insufficient holdings. Have: ${holding?.quantity || 0}, Need: ${order.quantity}`
            };
        }
    }

    // Lock funds for BUY orders
    if (order.side === 'BUY') {
        const { error } = await supabase.rpc('wallet_ledger_transfer', {
            p_user_id: userId,
            p_operation: 'lock',
            p_amount: requiredMargin,
            p_description: `Margin for ${order.side} ${order.quantity} ${order.symbol}`
        });
        if (error) throw error;
    }

    return { sufficient: true, required: requiredMargin, available: freeBalance, locked: true };
}

function calculateRequiredMargin(order) {
    const price = order.price || order.ltp || 0;
    const totalValue = order.quantity * price;

    // Margin depends on product type
    switch (order.productType) {
        case 'CNC': return totalValue; // Full delivery — 100%
        case 'MIS': return totalValue * 0.2; // Intraday — 20% margin (5x leverage)
        case 'NRML': return totalValue * 0.15; // F&O normal — 15%
        case 'MTF': return totalValue * 0.25; // Margin funding — 25%
        default: return totalValue;
    }
}


// ==========================================
// O-04: Brokerage & Charges Calculator
// ==========================================

/**
 * Calculate all charges for an order
 * Based on Indian brokerage structure (2026 rates)
 */
export function calculateCharges(order) {
    const totalValue = order.quantity * (order.price || order.ltp || 0);
    const segment = order.segment || 'EQ';
    const side = order.side?.toUpperCase();

    // Base charges
    const brokerage = Math.min(20, totalValue * 0.0003); // ₹20 flat or 0.03%
    const stt = side === 'SELL' ? totalValue * 0.001 : totalValue * 0.001; // 0.1% STT
    const exchangeCharges = totalValue * 0.0000345; // NSE charges
    const gst = (brokerage + exchangeCharges) * 0.18; // 18% GST on brokerage + exchange
    const sebi = totalValue * 0.000001; // ₹10 per crore
    const stampDuty = side === 'BUY' ? totalValue * 0.00015 : totalValue * 0.00003;
    const dpCharges = side === 'SELL' && segment === 'EQ' ? 15.93 : 0;

    const totalCharges = brokerage + stt + exchangeCharges + gst + sebi + stampDuty + dpCharges;

    // For F&O
    if (segment === 'FO') {
        const foStt = side === 'SELL' ? totalValue * 0.0005 : 0;
        const foCharges = brokerage + foStt + exchangeCharges * 10 + gst + sebi + stampDuty;
        return {
            brokerage: +brokerage.toFixed(2),
            stt: +foStt.toFixed(2),
            exchangeCharges: +(exchangeCharges * 10).toFixed(2),
            gst: +gst.toFixed(2),
            sebi: +sebi.toFixed(4),
            stampDuty: +stampDuty.toFixed(2),
            dpCharges: 0,
            totalCharges: +foCharges.toFixed(2),
            netValue: +(totalValue + (side === 'BUY' ? foCharges : -foCharges)).toFixed(2),
            turnover: +totalValue.toFixed(2)
        };
    }

    return {
        brokerage: +brokerage.toFixed(2),
        stt: +stt.toFixed(2),
        exchangeCharges: +exchangeCharges.toFixed(2),
        gst: +gst.toFixed(2),
        sebi: +sebi.toFixed(4),
        stampDuty: +stampDuty.toFixed(2),
        dpCharges: +dpCharges.toFixed(2),
        totalCharges: +totalCharges.toFixed(2),
        netValue: +(totalValue + (side === 'BUY' ? totalCharges : -totalCharges)).toFixed(2),
        turnover: +totalValue.toFixed(2)
    };
}

/**
 * Get breakdown as formatted strings for UI
 */
export function getChargesBreakdown(order) {
    const c = calculateCharges(order);
    return [
        { label: 'Brokerage', value: `₹${c.brokerage}` },
        { label: 'STT', value: `₹${c.stt}` },
        { label: 'Exchange Txn', value: `₹${c.exchangeCharges}` },
        { label: 'GST (18%)', value: `₹${c.gst}` },
        { label: 'SEBI Fees', value: `₹${c.sebi}` },
        { label: 'Stamp Duty', value: `₹${c.stampDuty}` },
        { label: 'DP Charges', value: `₹${c.dpCharges}` },
        { label: 'Total Charges', value: `₹${c.totalCharges}`, bold: true },
    ];
}
