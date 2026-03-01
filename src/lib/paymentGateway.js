// Sprint 3: Payment Gateway Service
// Covers W-04 (Razorpay UPI), W-05 (IMPS/NEFT), W-06 (Cashfree AutoPay)
// These are client-side wrappers. In production, order creation happens server-side.

import { supabase } from './supabase';
import { logAudit } from './middleware.jsx';

// ==========================================
// W-04: Razorpay UPI Deposit
// ==========================================

/**
 * Create a Razorpay payment order for UPI deposit
 * In production: Edge Function creates order via Razorpay API
 */
export async function createRazorpayOrder(userId, amount) {
    // 1. Create payment_order record
    const { data: paymentOrder, error } = await supabase
        .from('payment_orders')
        .insert({
            user_id: userId,
            gateway: 'razorpay',
            operation: 'deposit',
            method: 'upi',
            amount: amount,
            currency: 'INR',
            status: 'initiated',
            metadata: { initiated_from: 'web' }
        })
        .select()
        .single();

    if (error) throw error;

    // 2. In production: call Razorpay Orders API to create order
    // const rzpOrder = await fetch('/api/payments/razorpay/create', { ... });

    // 3. Simulate Razorpay order ID
    const gatewayOrderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await supabase.from('payment_orders')
        .update({ gateway_order_id: gatewayOrderId, status: 'processing' })
        .eq('id', paymentOrder.id);

    return {
        orderId: paymentOrder.id,
        gatewayOrderId,
        amount,
        currency: 'INR',
        // These would be used with Razorpay Checkout SDK
        razorpayOptions: {
            key: import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_demo',
            amount: amount * 100, // Razorpay uses paise
            currency: 'INR',
            name: 'NexusTrade',
            description: 'Wallet Deposit',
            order_id: gatewayOrderId,
            prefill: {},
            theme: { color: '#3b82f6' }
        }
    };
}

/**
 * Verify Razorpay payment after completion
 * In production: server-side webhook or verification
 */
export async function verifyRazorpayPayment(orderId, paymentId, signature) {
    // In production: verify signature using Razorpay secret on server

    const { data: paymentOrder } = await supabase
        .from('payment_orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (!paymentOrder) throw new Error('Payment order not found');

    // Mark as success
    await supabase.from('payment_orders').update({
        gateway_payment_id: paymentId || `pay_${Date.now()}`,
        status: 'success',
        completed_at: new Date().toISOString()
    }).eq('id', orderId);

    // Credit wallet via ledger
    const { data: result } = await supabase.rpc('wallet_ledger_transfer', {
        p_user_id: paymentOrder.user_id,
        p_operation: 'deposit',
        p_amount: paymentOrder.amount,
        p_method: 'razorpay_upi',
        p_reference_id: orderId,
        p_reference_type: 'payment_order',
        p_description: `UPI deposit via Razorpay`
    });

    await logAudit(paymentOrder.user_id, 'payment_success', 'payment_order', orderId,
        { amount: paymentOrder.amount, gateway: 'razorpay' });

    return result;
}


// ==========================================
// W-05: IMPS/NEFT Withdrawal
// ==========================================

/**
 * Initiate a bank withdrawal via IMPS/NEFT
 */
export async function initiateWithdrawal(userId, amount, method, bankAccountId) {
    if (!['imps', 'neft', 'rtgs'].includes(method)) {
        throw new Error('Invalid withdrawal method. Use imps, neft, or rtgs.');
    }

    // 1. Check withdrawable balance
    const { data: wallet } = await supabase
        .from('inr_wallet').select('balance, locked_balance').eq('user_id', userId).single();

    const freeBalance = Number(wallet.balance) - Number(wallet.locked_balance);
    if (freeBalance < amount) {
        throw new Error(`Insufficient withdrawable balance. Available: ₹${freeBalance.toLocaleString('en-IN')}`);
    }

    // 2. Get bank account
    const { data: bankAccount } = await supabase
        .from('bank_accounts').select('*').eq('id', bankAccountId).eq('user_id', userId).single();

    if (!bankAccount) throw new Error('Bank account not found');

    // 3. Create payment order
    const { data: paymentOrder, error } = await supabase
        .from('payment_orders')
        .insert({
            user_id: userId,
            gateway: method === 'imps' ? 'razorpay' : 'cashfree',
            operation: 'withdraw',
            method: method,
            amount: amount,
            currency: 'INR',
            status: 'processing',
            metadata: { bank_account_id: bankAccountId, bank_name: bankAccount.bank_name, ifsc: bankAccount.ifsc }
        })
        .select()
        .single();

    if (error) throw error;

    // 4. Debit wallet
    await supabase.rpc('wallet_ledger_transfer', {
        p_user_id: userId,
        p_operation: 'withdraw',
        p_amount: amount,
        p_method: method.toUpperCase(),
        p_reference_id: paymentOrder.id,
        p_reference_type: 'payment_order',
        p_description: `Withdrawal via ${method.toUpperCase()} to ${bankAccount.bank_name}`
    });

    // 5. In production: call payout API (Razorpay X or Cashfree Payouts)
    // const payout = await fetch('/api/payments/payout', { ... });

    // 6. Simulate completion
    const utr = `UTR${Date.now()}`;
    await supabase.from('payment_orders').update({
        status: 'success',
        utr: utr,
        completed_at: new Date().toISOString()
    }).eq('id', paymentOrder.id);

    await logAudit(userId, 'withdrawal_initiated', 'payment_order', paymentOrder.id,
        { amount, method, bank: bankAccount.bank_name });

    return { success: true, orderId: paymentOrder.id, utr, estimatedTime: method === 'imps' ? '< 1 minute' : '2-4 hours' };
}


// ==========================================
// W-06: Cashfree UPI AutoPay Mandate
// ==========================================

/**
 * Create a UPI AutoPay mandate for SIP/recurring payments
 */
export async function createAutoPayMandate(userId, upiId, maxAmount, frequency) {
    // 1. Create mandate record
    const { data: mandate, error } = await supabase
        .from('payment_mandates')
        .insert({
            user_id: userId,
            gateway: 'cashfree',
            mandate_type: 'autopay',
            upi_id: upiId,
            max_amount: maxAmount,
            frequency: frequency || 'monthly',
            status: 'created',
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
        })
        .select()
        .single();

    if (error) throw error;

    // 2. In production: call Cashfree Create Mandate API
    // const cfMandate = await fetch('https://api.cashfree.com/api/v2/subscriptions', { ... });

    // 3. Simulate authorization
    const mandateId = `mandate_${Date.now()}`;
    await supabase.from('payment_mandates').update({
        mandate_id: mandateId,
        status: 'authorized',
        authorized_at: new Date().toISOString()
    }).eq('id', mandate.id);

    await logAudit(userId, 'mandate_created', 'payment_mandate', mandate.id,
        { upi_id: upiId, max_amount: maxAmount, frequency });

    return { success: true, mandateId: mandate.id, status: 'authorized' };
}

/**
 * Execute a mandate payment (for SIP debit)
 */
export async function executeMandatePayment(userId, mandateId, amount, description) {
    const { data: mandate } = await supabase
        .from('payment_mandates')
        .select('*')
        .eq('id', mandateId)
        .eq('user_id', userId)
        .eq('status', 'authorized')
        .single();

    if (!mandate) throw new Error('Active mandate not found');
    if (amount > Number(mandate.max_amount)) throw new Error(`Amount exceeds mandate limit of ₹${mandate.max_amount}`);

    // In production: call Cashfree Charge Mandate API
    // Simulate: create payment and credit wallet
    const { data: paymentOrder } = await supabase.from('payment_orders').insert({
        user_id: userId,
        gateway: 'cashfree',
        operation: 'deposit',
        method: 'upi',
        amount: amount,
        status: 'success',
        metadata: { mandate_id: mandateId, description },
        completed_at: new Date().toISOString()
    }).select().single();

    // Credit wallet
    await supabase.rpc('wallet_ledger_transfer', {
        p_user_id: userId,
        p_operation: 'deposit',
        p_amount: amount,
        p_method: 'autopay',
        p_reference_id: paymentOrder.id,
        p_reference_type: 'payment_order',
        p_description: description || 'AutoPay SIP debit'
    });

    return { success: true, paymentId: paymentOrder.id };
}

/**
 * Revoke a mandate
 */
export async function revokeMandate(userId, mandateId) {
    await supabase.from('payment_mandates').update({
        status: 'revoked',
        revoked_at: new Date().toISOString()
    }).eq('id', mandateId).eq('user_id', userId);

    await logAudit(userId, 'mandate_revoked', 'payment_mandate', mandateId);
    return { success: true };
}

/**
 * Get active mandates for a user
 */
export async function getActiveMandates(userId) {
    const { data } = await supabase
        .from('payment_mandates')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['authorized', 'created'])
        .order('created_at', { ascending: false });

    return data || [];
}
