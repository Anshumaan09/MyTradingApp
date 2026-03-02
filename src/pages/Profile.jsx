import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/useAuth';
import { supabase } from '../lib/supabase';
import { User, ShieldCheck, CreditCard, FileText, CheckCircle, AlertTriangle, Building, Briefcase } from 'lucide-react';

export const Profile = () => {
    const { user } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchProfile = async () => {
            try {
                const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
                setProfileData(data);
            } catch (err) {
                console.error("Error fetching profile", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [user]);

    if (loading) {
        return <div className="flex-center" style={{ minHeight: '60vh' }}><div className="animate-pulse">Loading Profile...</div></div>;
    }

    const displayName = profileData?.full_name || user?.email?.split('@')[0] || 'User';
    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
            <div>
                <h1 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <User size={28} color="var(--accent-primary)" /> My Profile
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>Manage your personal information, KYC status, and linked accounts.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
                {/* Left Column: Basic Info & KYC Status */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem 1.5rem' }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem',
                            boxShadow: '0 8px 16px rgba(99, 102, 241, 0.25)'
                        }}>
                            {initials}
                        </div>
                        <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem' }}>{displayName}</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>{user?.email}</p>
                        <div className="badge" style={{ backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
                            Pro Member
                        </div>
                    </div>

                    <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShieldCheck size={18} color="var(--color-success)" /> KYC Status
                        </h3>
                        <div style={{ padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-success)', fontWeight: '600', marginBottom: '0.5rem' }}>
                                <CheckCircle size={18} /> Fully Verified
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                                Your account is fully verified. You can trade in Equity, F&O, Currency, and Cryptocurrencies without restrictions.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Detailed Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Demat Details */}
                    <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                            <Briefcase size={18} color="var(--accent-primary)" /> Account Details
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Client ID (UCC)</div>
                                <div className="text-mono" style={{ fontWeight: '500' }}>NXTRD{user?.id.substring(0, 6).toUpperCase()}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Demat Account (BO ID)</div>
                                <div className="text-mono" style={{ fontWeight: '500' }}>12081600{user?.id.substring(0, 8).replace(/\D/g, '') || '837192'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Account Type</div>
                                <div style={{ fontWeight: '500' }}>Resident Individual</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Trading Segments</div>
                                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                    <span className="badge" style={{ fontSize: '0.6rem' }}>NSE</span>
                                    <span className="badge" style={{ fontSize: '0.6rem' }}>BSE</span>
                                    <span className="badge" style={{ fontSize: '0.6rem' }}>F&O</span>
                                    <span className="badge" style={{ fontSize: '0.6rem' }}>Crypto</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Personal & Bank Details */}
                    <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                            <FileText size={18} color="var(--accent-primary)" /> Personal & Bank Information
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>PAN Number</div>
                                <div className="text-mono" style={{ fontWeight: '500' }}>XXXXX{profileData?.investor_level === 'advanced' ? '9876' : '1234'}X</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Mobile Number</div>
                                <div className="text-mono" style={{ fontWeight: '500' }}>+91 ••••• ••839</div>
                            </div>
                        </div>

                        <div style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: 'var(--bg-base)', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                                <Building size={20} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>HDFC Bank Ltd.</div>
                                <div className="text-mono" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Account ending in •••• 4092</div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                    <span className="badge" style={{ fontSize: '0.6rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>Primary</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Verified via Penny Drop</span>
                                </div>
                            </div>
                            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>Manage</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
