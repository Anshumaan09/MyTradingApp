// Sprint 5: Broker Clients & Router
// O-05: Upstox Broker Client
// O-06: Zerodha Broker Client
// O-07: Broker Router

import { supabase } from './supabase';

// ==========================================
// Base Broker Client Interface
// ==========================================
class BaseBrokerClient {
    constructor(name, session) {
        this.name = name;
        this.session = session; // { access_token, api_key, ... }
        this.isReady = !!session;
    }

    async placeOrder(order) { throw new Error('Not implemented'); }
    async modifyOrder(orderId, changes) { throw new Error('Not implemented'); }
    async cancelOrder(orderId) { throw new Error('Not implemented'); }
    async getOrderStatus(orderId) { throw new Error('Not implemented'); }
    async getPositions() { throw new Error('Not implemented'); }
    async getHoldings() { throw new Error('Not implemented'); }
}

// ==========================================
// O-05: Upstox Broker Client
// ==========================================
class UpstoxBrokerClient extends BaseBrokerClient {
    constructor(session) {
        super('upstox', session);
        this.baseUrl = 'https://api.upstox.com/v2';
    }

    async placeOrder(order) {
        // Production: POST /order/place
        // const response = await fetch(`${this.baseUrl}/order/place`, {
        //     method: 'POST',
        //     headers: { Authorization: `Bearer ${this.session.access_token}`, 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ ... })
        // });

        // Simulated response
        await new Promise(r => setTimeout(r, 200));
        const exchangeOrderId = `UP${Date.now()}${Math.floor(Math.random() * 1000)}`;

        return {
            success: true,
            broker: 'upstox',
            orderId: exchangeOrderId,
            status: order.orderType === 'market' ? 'complete' : 'open',
            filledQty: order.orderType === 'market' ? order.quantity : 0,
            avgPrice: order.orderType === 'market' ? order.price : null,
            message: `Order placed on Upstox: ${exchangeOrderId}`
        };
    }

    async modifyOrder(orderId, changes) {
        await new Promise(r => setTimeout(r, 150));
        return { success: true, orderId, message: 'Order modified on Upstox' };
    }

    async cancelOrder(orderId) {
        await new Promise(r => setTimeout(r, 100));
        return { success: true, orderId, message: 'Order cancelled on Upstox' };
    }

    async getOrderStatus(orderId) {
        return { orderId, status: 'complete', broker: 'upstox' };
    }

    async getPositions() {
        return []; // Production: GET /portfolio/short-term-positions
    }

    async getHoldings() {
        return []; // Production: GET /portfolio/long-term-holdings
    }
}

// ==========================================
// O-06: Zerodha (Kite) Broker Client
// ==========================================
class ZerodhaBrokerClient extends BaseBrokerClient {
    constructor(session) {
        super('zerodha', session);
        this.baseUrl = 'https://api.kite.trade';
    }

    async placeOrder(order) {
        // Production: POST /orders/{variety}
        // variety: regular, amo, co, iceberg
        // const response = await fetch(`${this.baseUrl}/orders/regular`, { ... });

        await new Promise(r => setTimeout(r, 200));
        const exchangeOrderId = `ZR${Date.now()}${Math.floor(Math.random() * 1000)}`;

        return {
            success: true,
            broker: 'zerodha',
            orderId: exchangeOrderId,
            status: order.orderType === 'market' ? 'COMPLETE' : 'OPEN',
            filledQty: order.orderType === 'market' ? order.quantity : 0,
            avgPrice: order.orderType === 'market' ? order.price : null,
            message: `Order placed on Kite: ${exchangeOrderId}`
        };
    }

    async modifyOrder(orderId, changes) {
        await new Promise(r => setTimeout(r, 150));
        return { success: true, orderId, message: 'Order modified on Kite' };
    }

    async cancelOrder(orderId) {
        await new Promise(r => setTimeout(r, 100));
        return { success: true, orderId, message: 'Order cancelled on Kite' };
    }

    async getOrderStatus(orderId) {
        return { orderId, status: 'COMPLETE', broker: 'zerodha' };
    }

    async getPositions() {
        return []; // Production: GET /portfolio/positions
    }

    async getHoldings() {
        return []; // Production: GET /portfolio/holdings
    }
}

// ==========================================
// Internal Mock Broker (for demo trading without a real broker)
// ==========================================
class InternalBrokerClient extends BaseBrokerClient {
    constructor() {
        super('internal', { access_token: 'internal' });
    }

    async placeOrder(order) {
        await new Promise(r => setTimeout(r, 100));
        const orderId = `INT${Date.now()}`;

        // Internal broker always fills market orders instantly
        return {
            success: true,
            broker: 'internal',
            orderId,
            status: order.orderType === 'market' ? 'complete' : 'open',
            filledQty: order.orderType === 'market' ? order.quantity : 0,
            avgPrice: order.price,
            message: `Order executed internally: ${orderId}`
        };
    }

    async modifyOrder(orderId, changes) {
        return { success: true, orderId, message: 'Order modified' };
    }

    async cancelOrder(orderId) {
        return { success: true, orderId, message: 'Order cancelled' };
    }

    async getOrderStatus(orderId) {
        return { orderId, status: 'complete', broker: 'internal' };
    }

    async getPositions() { return []; }
    async getHoldings() { return []; }
}

// ==========================================
// O-07: Broker Router
// ==========================================
class BrokerRouter {
    constructor() {
        this.clients = new Map();
        this.defaultBroker = 'internal';
    }

    /**
     * Register a broker client
     */
    register(name, client) {
        this.clients.set(name, client);
    }

    /**
     * Get the appropriate broker for a segment/exchange
     */
    getBrokerForOrder(order) {
        // Priority: user preference → segment mapping → default
        if (order.broker) {
            const client = this.clients.get(order.broker);
            if (client?.isReady) return client;
        }

        // Segment-based routing
        if (order.segment === 'CRYPTO') {
            const binance = this.clients.get('binance');
            if (binance?.isReady) return binance;
        }

        // Try connected brokers in priority order
        for (const name of ['upstox', 'zerodha']) {
            const client = this.clients.get(name);
            if (client?.isReady) return client;
        }

        // Fallback to internal
        return this.clients.get('internal') || new InternalBrokerClient();
    }

    /**
     * Initialize router with user's connected brokers
     */
    async initForUser(userId) {
        const { data: sessions } = await supabase
            .from('broker_sessions')
            .select('broker, access_token_enc, api_key, is_active')
            .eq('user_id', userId)
            .eq('is_active', true);

        // Always have internal broker
        this.register('internal', new InternalBrokerClient());

        (sessions || []).forEach(s => {
            const session = { access_token: s.access_token_enc, api_key: s.api_key };
            switch (s.broker) {
                case 'upstox': this.register('upstox', new UpstoxBrokerClient(session)); break;
                case 'zerodha': this.register('zerodha', new ZerodhaBrokerClient(session)); break;
            }
        });

        return this;
    }
}

// Singleton
let _routerInstance = null;

export async function getBrokerRouter(userId) {
    if (!_routerInstance) {
        _routerInstance = new BrokerRouter();
        if (userId) await _routerInstance.initForUser(userId);
    }
    return _routerInstance;
}

export { UpstoxBrokerClient, ZerodhaBrokerClient, InternalBrokerClient, BrokerRouter };
