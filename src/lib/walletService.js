// Sprint 3: Wallet Service
// Client-side service for wallet operations using the ledger RPC
// Covers W-01 (double-entry ledger), W-02 (fund lock/unlock)

import { supabase } from './supabase';
import { logAudit } from './middleware.jsx';

// ==========================================
// Wallet State
// ==========================================

/**
 * Get full wallet state for a user
 */
export async function getWalletState(userId) {
    const { data, error } = await supabase
        .from('inr_wallet')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) throw error;

    return {
        balance: Number(data.balance),
        lockedBalance: Number(data.locked_balance),
        freeBalance: Number(data.balance) - Number(data.locked_balance),
        totalDeposited: Number(data.total_deposited),
        totalWithdrawn: Number(data.total_withdrawn),
        updatedAt: data.updated_at
    };
}

/**
 * Get recent wallet transactions
 */
export async function getWalletTransactions(userId, limit = 20, offset = 0) {
    const { data, error, count } = await supabase
        .from('wallet_transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw error;
    return { transactions: data || [], total: count };
}

// ==========================================
// Ledger Operations (via RPC)
// ==========================================

/**
 * Deposit funds into wallet
 */
export async function depositFunds(userId, amount, method, paymentId = null) {
    const { data, error } = await supabase.rpc('wallet_ledger_transfer', {
        p_user_id: userId,
        p_operation: 'deposit',
        p_amount: amount,
        p_method: method,
        p_reference_id: paymentId,
        p_reference_type: paymentId ? 'payment_order' : null,
        p_description: `Deposit via ${method}`
    });

    if (error) throw error;
    await logAudit(userId, 'funds_deposited', 'wallet', null, { amount, method });
    return data;
}

/**
 * Withdraw funds from wallet
 */
export async function withdrawFunds(userId, amount, method, bankAccountId = null) {
    const { data, error } = await supabase.rpc('wallet_ledger_transfer', {
        p_user_id: userId,
        p_operation: 'withdraw',
        p_amount: amount,
        p_method: method,
        p_reference_id: bankAccountId,
        p_reference_type: bankAccountId ? 'bank_account' : null,
        p_description: `Withdrawal via ${method}`
    });

    if (error) throw error;
    await logAudit(userId, 'funds_withdrawn', 'wallet', null, { amount, method });
    return data;
}

/**
 * Lock funds for a pending order
 */
export async function lockFunds(userId, amount, orderId) {
    const { data, error } = await supabase.rpc('wallet_ledger_transfer', {
        p_user_id: userId,
        p_operation: 'lock',
        p_amount: amount,
        p_reference_id: orderId,
        p_reference_type: 'order',
        p_description: `Margin locked for order`
    });

    if (error) throw error;
    return data;
}

/**
 * Unlock funds (cancelled order / margin release)
 */
export async function unlockFunds(userId, amount, orderId) {
    const { data, error } = await supabase.rpc('wallet_ledger_transfer', {
        p_user_id: userId,
        p_operation: 'unlock',
        p_amount: amount,
        p_reference_id: orderId,
        p_reference_type: 'order',
        p_description: `Margin released for order`
    });

    if (error) throw error;
    return data;
}

// ==========================================
// Crypto Wallet
// ==========================================

/**
 * Get all crypto wallet balances
 */
export async function getCryptoBalances(userId) {
    const { data, error } = await supabase
        .from('crypto_wallet')
        .select('*')
        .eq('user_id', userId);

    if (error) throw error;
    return (data || []).map(w => ({
        asset: w.asset,
        balance: Number(w.balance),
        locked: Number(w.locked_balance),
        staked: Number(w.staked_balance),
        free: Number(w.balance) - Number(w.locked_balance),
        address: w.wallet_address
    }));
}

/**
 * Generate a deposit address for a crypto asset (simulated)
 */
export async function generateDepositAddress(userId, asset) {
    // In production: call exchange API to generate a unique deposit address
    const mockAddress = `0x${Array.from(crypto.getRandomValues(new Uint8Array(20))).map(b => b.toString(16).padStart(2, '0')).join('')}`;

    await supabase.from('crypto_wallet').upsert({
        user_id: userId,
        asset: asset,
        wallet_address: mockAddress
    }, { onConflict: 'user_id,asset' });

    await logAudit(userId, 'crypto_address_generated', 'crypto_wallet', null, { asset });
    return mockAddress;
}
