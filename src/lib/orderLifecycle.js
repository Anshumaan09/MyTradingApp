// Sprint 5: Order Lifecycle Orchestrator
// O-08: Full order flow — validate → idempotency → fund check → broker route → execute → ledger
// O-09: GTT (Good-Till-Triggered) Evaluator
// O-10: Basket Orders

import { supabase } from './supabase';
import { validateOrder, checkIdempotency, markProcessed, preTradeFundCheck, calculateCharges, checkIdempotencyDB } from './orderEngine';
import { getBrokerRouter } from './brokerClients';
import { logAudit } from './middleware.jsx';
import { getMarketDataService } from './marketDataService';

// ==========================================
// O-08: Order Lifecycle Orchestrator
// ==========================================

/**
 * Place a new order — full pipeline
 * 1. Validate → 2. Idempotency → 3. Fund check → 4. Route → 5. Execute → 6. Ledger
 */
export async function placeOrder(userId, orderInput) {
    const requestId = orderInput.requestId || crypto.randomUUID();

    try {
        // Get current market price if not provided
        if (!orderInput.price && orderInput.orderType === 'market') {
            const mds = getMarketDataService();
            const quote = mds.getQuote(orderInput.symbol);
            if (quote) orderInput.price = quote.ltp;
            else orderInput.price = orderInput.ltp || 0;
        }

        // Step 1: Validate
        const validation = validateOrder(orderInput);
        if (!validation.valid) {
            return { success: false, stage: 'validation', errors: validation.errors };
        }

        // Step 2: Idempotency check
        const idemCheck = checkIdempotency(requestId);
        if (idemCheck.isDuplicate) {
            return { success: false, stage: 'idempotency', message: idemCheck.message };
        }

        const dbIdem = await checkIdempotencyDB(requestId);
        if (dbIdem.isDuplicate) {
            return { success: false, stage: 'idempotency', message: `Duplicate order: ${dbIdem.existingOrderId}`, existingOrderId: dbIdem.existingOrderId };
        }

        // Step 3: Pre-trade fund check + lock
        const fundCheck = await preTradeFundCheck(userId, orderInput);
        if (!fundCheck.sufficient) {
            return { success: false, stage: 'fund_check', message: fundCheck.message, ...fundCheck };
        }

        // Step 4: Calculate charges
        const charges = calculateCharges(orderInput);

        // Step 5: Route to broker + execute
        const router = await getBrokerRouter(userId);
        const broker = router.getBrokerForOrder(orderInput);
        const brokerResult = await broker.placeOrder({
            ...orderInput,
            price: orderInput.price,
            requestId
        });

        // Step 6: Save order to DB
        const { data: savedOrder, error: saveError } = await supabase
            .from('orders')
            .insert({
                user_id: userId,
                exchange: orderInput.exchange || 'MOCK',
                segment: orderInput.segment || 'EQ',
                symbol: orderInput.symbol,
                order_type: orderInput.orderType,
                product_type: orderInput.productType || 'CNC',
                transaction_type: orderInput.side,
                quantity: orderInput.quantity,
                price: orderInput.price,
                trigger_price: orderInput.triggerPrice || null,
                filled_quantity: brokerResult.filledQty || 0,
                avg_price: brokerResult.avgPrice || orderInput.price,
                status: brokerResult.status || 'open',
                request_id: requestId,
                broker_order_id: brokerResult.orderId,
                charges: charges.totalCharges,
                basket_id: orderInput.basketId || null
            })
            .select()
            .single();

        if (saveError) throw saveError;

        // Step 7: If filled, process portfolio via existing RPC
        if (brokerResult.status === 'complete' && brokerResult.filledQty > 0) {
            try {
                await supabase.rpc('process_order', {
                    p_user_id: userId,
                    p_symbol: orderInput.symbol,
                    p_order_type: orderInput.orderType,
                    p_side: orderInput.side,
                    p_quantity: orderInput.quantity,
                    p_price: brokerResult.avgPrice || orderInput.price,
                    p_leverage: orderInput.productType === 'MIS' ? 5 : 1
                });
            } catch (rpcErr) {
                console.warn('[OrderLifecycle] process_order RPC failed, order saved but portfolio not updated:', rpcErr.message);
            }
        }

        // Mark idempotency
        markProcessed(requestId);

        // Audit
        await logAudit(userId, 'order_placed', 'order', savedOrder.id, {
            symbol: orderInput.symbol, side: orderInput.side,
            qty: orderInput.quantity, price: orderInput.price,
            broker: broker.name, charges: charges.totalCharges
        });

        return {
            success: true,
            orderId: savedOrder.id,
            brokerOrderId: brokerResult.orderId,
            status: brokerResult.status,
            filledQty: brokerResult.filledQty,
            avgPrice: brokerResult.avgPrice,
            charges,
            broker: broker.name,
            message: brokerResult.message
        };

    } catch (err) {
        console.error('[OrderLifecycle] Error:', err);
        return { success: false, stage: 'execution', message: err.message };
    }
}

/**
 * Cancel an order
 */
export async function cancelOrder(userId, orderId) {
    const { data: order } = await supabase
        .from('orders').select('*').eq('id', orderId).eq('user_id', userId).single();

    if (!order) throw new Error('Order not found');
    if (order.status === 'complete' || order.status === 'cancelled') {
        throw new Error(`Cannot cancel ${order.status} order`);
    }

    // Cancel on broker
    const router = await getBrokerRouter(userId);
    const broker = router.getBrokerForOrder(order);
    if (order.broker_order_id) {
        await broker.cancelOrder(order.broker_order_id);
    }

    // Update status
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);

    // Unlock funds if BUY order
    if (order.transaction_type === 'BUY') {
        const margin = Number(order.quantity) * Number(order.price);
        try {
            await supabase.rpc('wallet_ledger_transfer', {
                p_user_id: userId,
                p_operation: 'unlock',
                p_amount: margin,
                p_reference_id: orderId,
                p_reference_type: 'order',
                p_description: `Margin released: cancelled ${order.symbol}`
            });
        } catch { /* ignore if unlock fails */ }
    }

    await logAudit(userId, 'order_cancelled', 'order', orderId, { symbol: order.symbol });
    return { success: true, orderId };
}

/**
 * Get order book for a user
 */
export async function getOrderBook(userId, status = null) {
    let q = supabase.from('orders').select('*').eq('user_id', userId).order('placed_at', { ascending: false }).limit(50);
    if (status) q = q.eq('status', status);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
}

// ==========================================
// O-09: GTT (Good-Till-Triggered) Evaluator
// ==========================================

/**
 * Create a GTT order
 */
export async function createGTT(userId, gttInput) {
    const { data, error } = await supabase
        .from('gtt_orders')
        .insert({
            user_id: userId,
            symbol: gttInput.symbol,
            exchange: gttInput.exchange || 'NSE',
            trigger_type: gttInput.triggerType || 'single', // 'single' or 'oco'
            trigger_price_1: gttInput.triggerPrice1,
            trigger_price_2: gttInput.triggerPrice2 || null, // For OCO
            order_side: gttInput.side,
            order_type: gttInput.orderType || 'limit',
            quantity: gttInput.quantity,
            price_1: gttInput.price1 || gttInput.triggerPrice1,
            price_2: gttInput.price2 || gttInput.triggerPrice2,
            product_type: gttInput.productType || 'CNC',
            status: 'active'
        })
        .select()
        .single();

    if (error) throw error;
    await logAudit(userId, 'gtt_created', 'gtt_order', data.id, { symbol: gttInput.symbol });
    return data;
}

/**
 * Evaluate all active GTT orders against current prices
 * Should be called periodically (e.g., every tick or every few seconds)
 */
export async function evaluateGTTs(userId) {
    const { data: gtts } = await supabase
        .from('gtt_orders')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

    if (!gtts || gtts.length === 0) return [];

    const mds = getMarketDataService();
    const triggered = [];

    for (const gtt of gtts) {
        const quote = mds.getQuote(gtt.symbol);
        if (!quote) continue;

        const ltp = quote.ltp;
        let shouldTrigger = false;
        let triggerSide = null;

        if (gtt.trigger_type === 'single') {
            if (gtt.order_side === 'BUY' && ltp >= gtt.trigger_price_1) shouldTrigger = true;
            if (gtt.order_side === 'SELL' && ltp <= gtt.trigger_price_1) shouldTrigger = true;
        } else if (gtt.trigger_type === 'oco') {
            // OCO: trigger_price_1 = stop-loss, trigger_price_2 = target
            if (ltp <= gtt.trigger_price_1) { shouldTrigger = true; triggerSide = 'stop_loss'; }
            if (ltp >= gtt.trigger_price_2) { shouldTrigger = true; triggerSide = 'target'; }
        }

        if (shouldTrigger) {
            // Place the order
            const result = await placeOrder(userId, {
                symbol: gtt.symbol,
                side: gtt.order_side,
                orderType: gtt.order_type,
                quantity: gtt.quantity,
                price: triggerSide === 'target' ? gtt.price_2 : gtt.price_1,
                productType: gtt.product_type,
                exchange: gtt.exchange
            });

            // Update GTT status
            await supabase.from('gtt_orders').update({
                status: 'triggered',
                triggered_at: new Date().toISOString()
            }).eq('id', gtt.id);

            triggered.push({ gttId: gtt.id, symbol: gtt.symbol, triggerSide, orderResult: result });
        }
    }

    return triggered;
}

// ==========================================
// O-10: Basket Orders
// ==========================================

/**
 * Create a basket with multiple orders
 */
export async function createBasket(userId, basketInput) {
    // Create basket
    const { data: basket, error } = await supabase
        .from('baskets')
        .insert({
            user_id: userId,
            name: basketInput.name,
            description: basketInput.description || null,
            status: 'draft'
        })
        .select()
        .single();

    if (error) throw error;
    return basket;
}

/**
 * Execute all orders in a basket
 */
export async function executeBasket(userId, basketId) {
    // Get basket orders
    const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('basket_id', basketId)
        .eq('user_id', userId)
        .eq('status', 'draft');

    if (!orders || orders.length === 0) {
        throw new Error('No pending orders in basket');
    }

    const results = [];
    for (const order of orders) {
        const result = await placeOrder(userId, {
            symbol: order.symbol,
            side: order.transaction_type,
            orderType: order.order_type,
            quantity: order.quantity,
            price: order.price,
            productType: order.product_type,
            exchange: order.exchange,
            basketId
        });
        results.push({ symbol: order.symbol, ...result });
    }

    // Update basket status
    const allSuccess = results.every(r => r.success);
    await supabase.from('baskets').update({
        status: allSuccess ? 'executed' : 'partial'
    }).eq('id', basketId);

    await logAudit(userId, 'basket_executed', 'basket', basketId, {
        totalOrders: results.length,
        successful: results.filter(r => r.success).length
    });

    return { basketId, results, allSuccess };
}
