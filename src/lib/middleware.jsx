// A-06: Authentication Middleware & Route Guards
// Provides React components and hooks for protecting routes
// based on auth state, KYC status, and permissions.

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { supabase } from './supabase';
import { useState, useEffect, createContext, useContext } from 'react';

// ==========================================
// Auth Context with extended user profile
// ==========================================
const AuthProfileContext = createContext(null);

export function AuthProfileProvider({ children }) {
    const { user, session, loading: authLoading } = useAuth();
    const [profile, setProfile] = useState(null);
    const [kycStatus, setKycStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setProfile(null);
            setKycStatus(null);
            setLoading(false);
            return;
        }

        async function fetchProfile() {
            try {
                const [{ data: userProfile }, { data: kycDoc }] = await Promise.all([
                    supabase.from('users').select('*').eq('id', user.id).single(),
                    supabase.from('kyc_documents').select('*').eq('user_id', user.id).maybeSingle()
                ]);
                setProfile(userProfile);
                setKycStatus(kycDoc);
            } catch (err) {
                console.error('Failed to fetch profile:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, [user]);

    return (
        <AuthProfileContext.Provider value={{
            user,
            session,
            profile,
            kycStatus,
            loading: authLoading || loading,
            isAuthenticated: !!user,
            isKycComplete: profile?.kyc_status >= 4, // 'complete' = 4 in our schema
            isProUser: profile?.nexus_pro === true,
            isFoEnabled: profile?.fo_enabled === true,
            refreshProfile: async () => {
                if (!user) return;
                const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
                setProfile(data);
            }
        }}>
            {children}
        </AuthProfileContext.Provider>
    );
}

export function useAuthProfile() {
    const ctx = useContext(AuthProfileContext);
    if (!ctx) throw new Error('useAuthProfile must be used within AuthProfileProvider');
    return ctx;
}

// ==========================================
// Route Guard Components
// ==========================================

/**
 * Requires authentication — redirects to /auth if not logged in
 */
export function RequireAuth({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return (
        <div className="flex-center" style={{ minHeight: '100vh' }}>
            <div className="animate-pulse" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Loading NexusTrade...</div>
        </div>
    );

    if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;
    return children;
}

/**
 * Requires KYC completion — redirects to /kyc if KYC is incomplete
 */
export function RequireKYC({ children }) {
    const { user, loading } = useAuth();
    const [kycComplete, setKycComplete] = useState(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        if (!user) { setChecking(false); return; }

        supabase.from('users').select('kyc_status').eq('id', user.id).single()
            .then(({ data }) => {
                setKycComplete(data?.kyc_status >= 4);
                setChecking(false);
            });
    }, [user]);

    if (loading || checking) return (
        <div className="flex-center" style={{ minHeight: '100vh' }}>
            <div className="animate-pulse">Verifying KYC status...</div>
        </div>
    );

    if (!kycComplete) return <Navigate to="/auth" replace />;
    return children;
}

/**
 * Requires admin role
 */
export function RequireAdmin({ children, fallback }) {
    const { session } = useAuth();

    // Check JWT claims for admin role
    const payload = session?.access_token ? JSON.parse(atob(session.access_token.split('.')[1])) : null;
    const isAdmin = payload?.user_role === 'admin' || payload?.role === 'admin';

    if (!isAdmin) return fallback || <Navigate to="/" replace />;
    return children;
}

// ==========================================
// Permission Checks (Hooks)
// ==========================================

/**
 * Check if user has a specific permission based on their profile
 */
export function usePermission(permission) {
    const { profile } = useAuthProfile();

    switch (permission) {
        case 'trade_equity': return profile?.kyc_status >= 4;
        case 'trade_fo': return profile?.fo_enabled === true;
        case 'trade_crypto': return profile?.kyc_status >= 4;
        case 'trade_mtf': return profile?.mtf_enabled === true;
        case 'invest_mf': return profile?.kyc_status >= 4;
        case 'pro_features': return profile?.nexus_pro === true;
        default: return false;
    }
}

/**
 * Log an audit trail entry
 */
export async function logAudit(userId, action, entityType = null, entityId = null, metadata = {}) {
    try {
        await supabase.from('audit_log').insert({
            user_id: userId,
            action,
            entity_type: entityType,
            entity_id: entityId,
            metadata,
            ip_address: null // Would be set server-side in production
        });
    } catch (err) {
        console.error('Audit log failed:', err);
    }
}
