// Sprint 5: Portfolio Management
// O-11: Portfolio Event Consumer (replaces Kafka consumer)
// O-12: Portfolio Snapshot Cron
// O-13: XIRR Calculator

import { supabase } from './supabase';

// ==========================================
// O-11: Portfolio Event Consumer
// Listens to order completion events and updates portfolio
// In production: Kafka consumer. Path A: called after order execution.
// ==========================================

/**
 * Process a completed trade into portfolio
 * Called by order lifecycle after successful execution
 */
export async function processTradeIntoPortfolio(userId, trade) {
    const { symbol, side, quantity, price, orderId } = trade;

    if (side === 'BUY') {
        // Check existing holding
        const { data: existing } = await supabase
            .from('holdings')
            .select('*')
            .eq('user_id', userId)
            .eq('symbol', symbol)
            .maybeSingle();

        if (existing) {
            // Update average cost
            const currentQty = Number(existing.quantity);
            const currentAvg = Number(existing.avg_buy_price);
            const newAvg = ((currentQty * currentAvg) + (quantity * price)) / (currentQty + quantity);

            await supabase.from('holdings').update({
                quantity: currentQty + quantity,
                avg_buy_price: +newAvg.toFixed(4),
                total_invested: Number(existing.total_invested) + (quantity * price)
            }).eq('id', existing.id);
        } else {
            await supabase.from('holdings').insert({
                user_id: userId,
                exchange: 'MOCK',
                symbol,
                quantity,
                avg_buy_price: price,
                total_invested: quantity * price,
                product_type: 'CNC',
                first_buy_date: new Date().toISOString().split('T')[0]
            });
        }
    } else if (side === 'SELL') {
        const { data: holding } = await supabase
            .from('holdings')
            .select('*')
            .eq('user_id', userId)
            .eq('symbol', symbol)
            .single();

        if (!holding) return;

        const currentQty = Number(holding.quantity);
        const avgPrice = Number(holding.avg_buy_price);
        const realisedPnl = (price - avgPrice) * quantity;

        if (currentQty <= quantity) {
            await supabase.from('holdings').delete().eq('id', holding.id);
        } else {
            await supabase.from('holdings').update({
                quantity: currentQty - quantity,
                total_invested: (currentQty - quantity) * avgPrice
            }).eq('id', holding.id);
        }

        // Record realized P&L in transaction
        await supabase.from('transactions').update({
            realised_pnl: realisedPnl
        }).eq('order_id', orderId);
    }
}


// ==========================================
// O-12: Portfolio Snapshot
// Takes a daily snapshot of portfolio for equity curve tracking
// ==========================================

/**
 * Create daily portfolio snapshot
 * Run once per day (e.g., after market close at 3:30 PM IST)
 */
export async function createPortfolioSnapshot(userId) {
    // Get all holdings
    const { data: holdings } = await supabase
        .from('holdings')
        .select('*')
        .eq('user_id', userId);

    if (!holdings || holdings.length === 0) return null;

    // Calculate totals
    let totalInvested = 0;
    let totalCurrentValue = 0;
    const holdingsSnapshot = [];

    for (const h of holdings) {
        const invested = Number(h.total_invested);
        // Use avg_buy_price as current value proxy if no live data
        const currentPrice = Number(h.avg_buy_price) * (1 + (Math.random() - 0.5) * 0.02); // ±1% for demo
        const currentValue = Number(h.quantity) * currentPrice;

        totalInvested += invested;
        totalCurrentValue += currentValue;

        holdingsSnapshot.push({
            symbol: h.symbol,
            quantity: Number(h.quantity),
            avgBuy: Number(h.avg_buy_price),
            currentPrice: +currentPrice.toFixed(2),
            currentValue: +currentValue.toFixed(2),
            pnl: +(currentValue - invested).toFixed(2),
            pnlPercent: invested > 0 ? +((currentValue - invested) / invested * 100).toFixed(2) : 0
        });
    }

    // Get wallet balance
    const { data: wallet } = await supabase
        .from('inr_wallet')
        .select('balance')
        .eq('user_id', userId)
        .single();

    const cashBalance = wallet ? Number(wallet.balance) : 0;
    const totalEquity = cashBalance + totalCurrentValue;

    // Save snapshot
    const { data: snapshot, error } = await supabase
        .from('portfolio_snapshots')
        .upsert({
            user_id: userId,
            snapshot_date: new Date().toISOString().split('T')[0],
            total_equity: +totalEquity.toFixed(2),
            total_invested: +totalInvested.toFixed(2),
            total_current_value: +totalCurrentValue.toFixed(2),
            total_pnl: +(totalCurrentValue - totalInvested).toFixed(2),
            cash_balance: +cashBalance.toFixed(2),
            holdings_count: holdings.length,
            holdings_data: holdingsSnapshot
        }, { onConflict: 'user_id,snapshot_date' })
        .select()
        .single();

    if (error) console.error('Snapshot error:', error);
    return snapshot;
}

/**
 * Get portfolio equity curve (for charts)
 */
export async function getEquityCurve(userId, days = 30) {
    const { data } = await supabase
        .from('portfolio_snapshots')
        .select('snapshot_date, total_equity, total_pnl, total_invested')
        .eq('user_id', userId)
        .order('snapshot_date', { ascending: true })
        .limit(days);

    return (data || []).map(d => ({
        date: d.snapshot_date,
        equity: Number(d.total_equity),
        pnl: Number(d.total_pnl),
        invested: Number(d.total_invested)
    }));
}


// ==========================================
// O-13: XIRR Calculator
// Extended Internal Rate of Return for investment performance
// ==========================================

/**
 * Calculate XIRR given cash flows and dates
 * Uses Newton-Raphson method
 *
 * @param {number[]} values - Cash flows (negative = outflow, positive = inflow)
 * @param {Date[]} dates - Corresponding dates
 * @returns {number} XIRR as a decimal (0.12 = 12%)
 */
export function calculateXIRR(values, dates, guess = 0.1) {
    if (values.length !== dates.length) throw new Error('Values and dates arrays must be same length');
    if (values.length < 2) return 0;

    const dayMS = 86400000;
    const d0 = dates[0].getTime();

    // Ensure there's at least one positive and one negative cash flow
    const hasPositive = values.some(v => v > 0);
    const hasNegative = values.some(v => v < 0);
    if (!hasPositive || !hasNegative) return 0;

    let rate = guess;

    for (let iteration = 0; iteration < 100; iteration++) {
        let fValue = 0;
        let fDerivative = 0;

        for (let i = 0; i < values.length; i++) {
            const years = (dates[i].getTime() - d0) / (365.25 * dayMS);
            const denom = Math.pow(1 + rate, years);
            fValue += values[i] / denom;
            fDerivative -= years * values[i] / (denom * (1 + rate));
        }

        if (Math.abs(fDerivative) < 1e-10) break;

        const newRate = rate - fValue / fDerivative;

        if (Math.abs(newRate - rate) < 1e-7) {
            return +newRate.toFixed(4);
        }

        rate = newRate;

        // Guard against divergence
        if (rate < -0.99 || rate > 10) return NaN;
    }

    return +rate.toFixed(4);
}

/**
 * Calculate XIRR for a stock holding using transaction history
 */
export async function calculateHoldingXIRR(userId, symbol) {
    const { data: txns } = await supabase
        .from('transactions')
        .select('transaction_type, quantity, price, total_value, trade_date')
        .eq('user_id', userId)
        .eq('symbol', symbol)
        .order('trade_date', { ascending: true });

    if (!txns || txns.length < 2) return null;

    const values = [];
    const dates = [];

    for (const tx of txns) {
        const amount = Number(tx.total_value);
        if (tx.transaction_type === 'BUY') {
            values.push(-amount); // Outflow
        } else {
            values.push(amount); // Inflow
        }
        dates.push(new Date(tx.trade_date));
    }

    // Add current holding value as final inflow
    const { data: holding } = await supabase
        .from('holdings')
        .select('quantity, avg_buy_price')
        .eq('user_id', userId)
        .eq('symbol', symbol)
        .maybeSingle();

    if (holding && Number(holding.quantity) > 0) {
        const currentValue = Number(holding.quantity) * Number(holding.avg_buy_price);
        values.push(currentValue);
        dates.push(new Date());
    }

    try {
        return calculateXIRR(values, dates);
    } catch {
        return null;
    }
}

/**
 * Calculate overall portfolio XIRR
 */
export async function calculatePortfolioXIRR(userId) {
    const { data: txns } = await supabase
        .from('wallet_transactions')
        .select('type, amount, direction, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    if (!txns || txns.length < 2) return null;

    const values = [];
    const dates = [];

    for (const tx of txns) {
        if (tx.type === 'DEPOSIT') { values.push(-Number(tx.amount)); dates.push(new Date(tx.created_at)); }
        if (tx.type === 'WITHDRAWAL') { values.push(Number(tx.amount)); dates.push(new Date(tx.created_at)); }
    }

    // Add current total equity as final value
    const { data: wallet } = await supabase.from('inr_wallet').select('balance').eq('user_id', userId).single();
    const { data: holdings } = await supabase.from('holdings').select('quantity, avg_buy_price').eq('user_id', userId);

    let totalEquity = wallet ? Number(wallet.balance) : 0;
    (holdings || []).forEach(h => { totalEquity += Number(h.quantity) * Number(h.avg_buy_price); });

    values.push(totalEquity);
    dates.push(new Date());

    try {
        return calculateXIRR(values, dates);
    } catch {
        return null;
    }
}
