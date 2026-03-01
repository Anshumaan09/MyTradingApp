// A-07: Broker OAuth Service
// Handles OAuth2 authorization flow for connecting broker accounts.
// In production, the token exchange happens server-side (Edge Function).
// This module provides the client-side flow helpers.

import { supabase } from './supabase';
import { logAudit } from './middleware.jsx';

// ==========================================
// Broker Configuration
// ==========================================
const BROKER_CONFIG = {
    zerodha: {
        name: 'Zerodha Kite',
        authUrl: 'https://kite.zerodha.com/connect/login',
        tokenUrl: 'https://api.kite.trade/session/token',
        apiBase: 'https://api.kite.trade',
        scopes: ['orders', 'holdings', 'positions', 'market_data'],
        icon: '🟢'
    },
    upstox: {
        name: 'Upstox Pro',
        authUrl: 'https://api.upstox.com/v2/login/authorization/dialog',
        tokenUrl: 'https://api.upstox.com/v2/login/authorization/token',
        apiBase: 'https://api.upstox.com/v2',
        scopes: ['orders', 'holdings', 'positions', 'market_data'],
        icon: '🟣'
    },
    binance: {
        name: 'Binance',
        authUrl: null, // API key based, no OAuth
        apiBase: 'https://api.binance.com',
        scopes: ['spot', 'margin'],
        icon: '🟡'
    }
};

/**
 * Get list of available brokers with connection status
 */
export async function getAvailableBrokers(userId) {
    const { data: sessions } = await supabase
        .from('broker_sessions')
        .select('broker, is_active, last_used_at, token_expires_at')
        .eq('user_id', userId);

    return Object.entries(BROKER_CONFIG).map(([key, config]) => {
        const session = sessions?.find(s => s.broker === key);
        return {
            id: key,
            name: config.name,
            icon: config.icon,
            isConnected: session?.is_active ?? false,
            lastUsed: session?.last_used_at,
            tokenExpiry: session?.token_expires_at,
            isExpired: session ? new Date(session.token_expires_at) < new Date() : false,
            scopes: config.scopes
        };
    });
}

/**
 * Initiate OAuth flow for a broker
 * Opens authorization URL in a new window
 */
export function initiateBrokerOAuth(brokerId, apiKey, redirectUri) {
    const config = BROKER_CONFIG[brokerId];
    if (!config) throw new Error(`Unknown broker: ${brokerId}`);
    if (!config.authUrl) throw new Error(`${config.name} uses API keys, not OAuth`);

    const state = crypto.randomUUID(); // CSRF token
    sessionStorage.setItem('broker_oauth_state', state);
    sessionStorage.setItem('broker_oauth_broker', brokerId);

    const params = new URLSearchParams({
        api_key: apiKey,
        redirect_uri: redirectUri || `${window.location.origin}/auth/broker/callback`,
        state: state,
        ...(brokerId === 'upstox' && { response_type: 'code' })
    });

    const url = `${config.authUrl}?${params}`;

    // Open in popup for better UX
    const popup = window.open(url, 'broker_oauth', 'width=600,height=700');
    return { popup, state };
}

/**
 * Handle OAuth callback — exchange code for tokens
 * In production, this should happen on the server to protect client_secret
 */
export async function handleBrokerCallback(code, state) {
    const savedState = sessionStorage.getItem('broker_oauth_state');
    const brokerId = sessionStorage.getItem('broker_oauth_broker');

    if (state !== savedState) throw new Error('OAuth state mismatch — potential CSRF attack');

    // Clean up
    sessionStorage.removeItem('broker_oauth_state');
    sessionStorage.removeItem('broker_oauth_broker');

    // In production: call Edge Function to exchange code for tokens
    // The Edge Function would:
    // 1. Send code + api_secret to broker's token URL
    // 2. Encrypt the access_token with AES-256
    // 3. Store in broker_sessions table
    // 4. Return success/failure

    // For demo: simulate token storage
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const mockToken = `mock_${brokerId}_${crypto.randomUUID().slice(0, 8)}`;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 8); // Tokens typically expire in 8hrs

    const { error } = await supabase.from('broker_sessions').upsert({
        user_id: user.id,
        broker: brokerId,
        access_token_enc: mockToken, // In production: encrypted
        api_key: 'demo_api_key',
        token_expires_at: expiresAt.toISOString(),
        is_active: true,
        last_used_at: new Date().toISOString(),
        permissions: BROKER_CONFIG[brokerId].scopes
    }, { onConflict: 'user_id,broker' });

    if (error) throw error;

    await logAudit(user.id, 'broker_connected', 'broker_session', null, { broker: brokerId });

    return { success: true, broker: brokerId, expiresAt };
}

/**
 * Connect a broker using API key/secret (for Binance, etc.)
 */
export async function connectBrokerApiKey(brokerId, apiKey, apiSecret) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // API keys don't expire like OAuth

    const { error } = await supabase.from('broker_sessions').upsert({
        user_id: user.id,
        broker: brokerId,
        access_token_enc: `enc_${apiKey}`, // In production: AES-256 encrypted
        api_key: apiKey,
        api_secret_enc: `enc_${apiSecret}`, // In production: AES-256 encrypted
        token_expires_at: expiresAt.toISOString(),
        is_active: true,
        last_used_at: new Date().toISOString(),
        permissions: BROKER_CONFIG[brokerId].scopes
    }, { onConflict: 'user_id,broker' });

    if (error) throw error;

    await logAudit(user.id, 'broker_api_key_connected', 'broker_session', null, { broker: brokerId });
    return { success: true };
}

/**
 * Disconnect a broker
 */
export async function disconnectBroker(brokerId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    await supabase.from('broker_sessions')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('broker', brokerId);

    await logAudit(user.id, 'broker_disconnected', 'broker_session', null, { broker: brokerId });
    return { success: true };
}

/**
 * Get active broker session for placing orders
 */
export async function getActiveBrokerSession(userId, brokerId) {
    const { data } = await supabase
        .from('broker_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('broker', brokerId)
        .eq('is_active', true)
        .single();

    if (!data) return null;

    // Check if token is expired
    if (new Date(data.token_expires_at) < new Date()) {
        return { ...data, isExpired: true };
    }

    return { ...data, isExpired: false };
}
