// A-01: JWT Utilities
// Works with Supabase's built-in JWT system + custom token helpers.
// On Supabase, auth.getSession() returns the JWT. These utilities help
// decode, verify expiry, and extract claims for client-side use.

/**
 * Decode a JWT token payload without verification (client-side).
 * For server-side verification, use Supabase Edge Functions.
 */
export function decodeJwt(token) {
    try {
        const payload = token.split('.')[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    } catch {
        return null;
    }
}

/**
 * Check if a JWT token is expired
 */
export function isTokenExpired(token) {
    const payload = decodeJwt(token);
    if (!payload?.exp) return true;
    return Date.now() >= payload.exp * 1000;
}

/**
 * Get remaining seconds until token expires
 */
export function tokenTTL(token) {
    const payload = decodeJwt(token);
    if (!payload?.exp) return 0;
    return Math.max(0, Math.floor((payload.exp * 1000 - Date.now()) / 1000));
}

/**
 * Extract user role from JWT custom claims
 */
export function getUserRole(token) {
    const payload = decodeJwt(token);
    return payload?.user_role || payload?.role || 'user';
}

/**
 * Extract user ID from JWT
 */
export function getUserIdFromToken(token) {
    const payload = decodeJwt(token);
    return payload?.sub || null;
}

/**
 * Generate a unique request ID for idempotent API calls
 */
export function generateRequestId() {
    return crypto.randomUUID();
}

/**
 * Generate a referral code (6 chars alphanumeric)
 */
export function generateReferralCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    const arr = new Uint8Array(8);
    crypto.getRandomValues(arr);
    for (let i = 0; i < 8; i++) {
        code += chars[arr[i] % chars.length];
    }
    return code;
}
