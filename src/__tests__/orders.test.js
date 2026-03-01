// O-14: Order Service Tests
import { describe, it, expect, beforeAll } from 'vitest';

// ==========================================
// Order Validator Tests
// ==========================================
describe('Order Validator', () => {
    let engine;
    beforeAll(async () => { engine = await import('../lib/orderEngine.js'); });

    it('should accept a valid market order', () => {
        const result = engine.validateOrder({
            symbol: 'RELIANCE', side: 'BUY', quantity: 10,
            orderType: 'market', productType: 'CNC'
        });
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should reject order without symbol', () => {
        const result = engine.validateOrder({ side: 'BUY', quantity: 10, orderType: 'market', productType: 'CNC' });
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('Symbol'))).toBe(true);
    });

    it('should reject invalid side', () => {
        const result = engine.validateOrder({ symbol: 'TCS', side: 'LONG', quantity: 10, orderType: 'market', productType: 'CNC' });
        expect(result.valid).toBe(false);
    });

    it('should reject negative quantity', () => {
        const result = engine.validateOrder({ symbol: 'TCS', side: 'BUY', quantity: -5, orderType: 'market', productType: 'CNC' });
        expect(result.valid).toBe(false);
    });

    it('should reject fractional quantity', () => {
        const result = engine.validateOrder({ symbol: 'TCS', side: 'BUY', quantity: 10.5, orderType: 'market', productType: 'CNC' });
        expect(result.valid).toBe(false);
    });

    it('should require price for limit orders', () => {
        const result = engine.validateOrder({ symbol: 'TCS', side: 'BUY', quantity: 10, orderType: 'limit', productType: 'CNC' });
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('price'))).toBe(true);
    });

    it('should accept valid limit order with price', () => {
        const result = engine.validateOrder({ symbol: 'TCS', side: 'BUY', quantity: 10, orderType: 'limit', productType: 'CNC', price: 3750 });
        expect(result.valid).toBe(true);
    });

    it('should require trigger price for SL orders', () => {
        const result = engine.validateOrder({ symbol: 'TCS', side: 'BUY', quantity: 10, orderType: 'sl', productType: 'CNC', price: 3750 });
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('trigger'))).toBe(true);
    });
});

// ==========================================
// Idempotency Tests
// ==========================================
describe('Idempotency Check', () => {
    let engine;
    beforeAll(async () => { engine = await import('../lib/orderEngine.js'); });

    it('should allow new request ID', () => {
        const result = engine.checkIdempotency('unique-req-' + Date.now());
        expect(result.isDuplicate).toBe(false);
    });

    it('should detect duplicate request ID', () => {
        const id = 'dup-req-' + Date.now();
        engine.markProcessed(id);
        const result = engine.checkIdempotency(id);
        expect(result.isDuplicate).toBe(true);
    });

    it('should allow null request ID', () => {
        const result = engine.checkIdempotency(null);
        expect(result.isDuplicate).toBe(false);
    });
});

// ==========================================
// Charges Calculator Tests
// ==========================================
describe('Charges Calculator', () => {
    let engine;
    beforeAll(async () => { engine = await import('../lib/orderEngine.js'); });

    it('should calculate equity charges', () => {
        const charges = engine.calculateCharges({
            symbol: 'RELIANCE', side: 'BUY', quantity: 100,
            price: 2890, segment: 'EQ'
        });
        expect(charges.brokerage).toBeGreaterThan(0);
        expect(charges.stt).toBeGreaterThan(0);
        expect(charges.totalCharges).toBeGreaterThan(0);
        expect(charges.turnover).toBe(289000);
    });

    it('should cap brokerage at ₹20', () => {
        const charges = engine.calculateCharges({
            symbol: 'RELIANCE', side: 'BUY', quantity: 1000,
            price: 2890, segment: 'EQ'
        });
        expect(charges.brokerage).toBe(20);
    });

    it('should add DP charges only for equity SELL', () => {
        const buyCharges = engine.calculateCharges({ symbol: 'X', side: 'BUY', quantity: 10, price: 1000, segment: 'EQ' });
        const sellCharges = engine.calculateCharges({ symbol: 'X', side: 'SELL', quantity: 10, price: 1000, segment: 'EQ' });
        expect(buyCharges.dpCharges).toBe(0);
        expect(sellCharges.dpCharges).toBe(15.93);
    });

    it('should return valid breakdown', () => {
        const breakdown = engine.getChargesBreakdown({ symbol: 'TCS', side: 'BUY', quantity: 50, price: 3750 });
        expect(breakdown).toHaveLength(8);
        expect(breakdown[breakdown.length - 1].bold).toBe(true);
    });
});

// ==========================================
// XIRR Calculator Tests
// ==========================================
describe('XIRR Calculator', () => {
    let portfolio;
    beforeAll(async () => { portfolio = await import('../lib/portfolioManager.js'); });

    it('should calculate simple XIRR', () => {
        const values = [-10000, 11500]; // Invest 10k, get 11.5k
        const dates = [new Date('2025-01-01'), new Date('2026-01-01')]; // 1 year
        const xirr = portfolio.calculateXIRR(values, dates);
        expect(xirr).toBeCloseTo(0.15, 1); // ~15% return
    });

    it('should handle multiple cash flows', () => {
        const values = [-5000, -5000, 12000];
        const dates = [new Date('2025-01-01'), new Date('2025-07-01'), new Date('2026-01-01')];
        const xirr = portfolio.calculateXIRR(values, dates);
        expect(xirr).toBeGreaterThan(0);
    });

    it('should return 0 for insufficient data', () => {
        expect(portfolio.calculateXIRR([-1000], [new Date()])).toBe(0);
    });

    it('should return 0 if no positive flows', () => {
        expect(portfolio.calculateXIRR([-1000, -500], [new Date('2025-01-01'), new Date('2026-01-01')])).toBe(0);
    });
});

// ==========================================
// Broker Client Tests
// ==========================================
describe('Broker Clients', () => {
    let clients;
    beforeAll(async () => { clients = await import('../lib/brokerClients.js'); });

    it('should create internal client without session', () => {
        const internal = new clients.InternalBrokerClient();
        expect(internal.isReady).toBe(true);
        expect(internal.name).toBe('internal');
    });

    it('should place order on internal broker', async () => {
        const internal = new clients.InternalBrokerClient();
        const result = await internal.placeOrder({ symbol: 'RELIANCE', price: 2890, quantity: 10, orderType: 'market' });
        expect(result.success).toBe(true);
        expect(result.broker).toBe('internal');
        expect(result.orderId).toBeTruthy();
    });

    it('should cancel order on internal broker', async () => {
        const internal = new clients.InternalBrokerClient();
        const result = await internal.cancelOrder('INT12345');
        expect(result.success).toBe(true);
    });

    it('should create BrokerRouter with internal default', () => {
        const router = new clients.BrokerRouter();
        router.register('internal', new clients.InternalBrokerClient());
        const broker = router.getBrokerForOrder({ symbol: 'TCS' });
        expect(broker.name).toBe('internal');
    });
});
