import React, { useState, useEffect } from 'react';
import { User, Shield, Bell, Key, LogOut, Save, CheckCircle, Copy, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../lib/useAuth';
import { supabase } from '../lib/supabase';

export const Settings = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');

    // Profile state
    const [fullName, setFullName] = useState('');
    const [investorLevel, setInvestorLevel] = useState('beginner');
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileSaved, setProfileSaved] = useState(false);

    // Security state
    const [killSwitchValue, setKillSwitchValue] = useState(20);
    const [securitySaving, setSecuritySaving] = useState(false);
    const [securitySaved, setSecuritySaved] = useState(false);

    // Notification prefs
    const [notifPush, setNotifPush] = useState(true);
    const [notifEmail, setNotifEmail] = useState(true);
    const [notifSms, setNotifSms] = useState(false);
    const [notifSaving, setNotifSaving] = useState(false);
    const [notifSaved, setNotifSaved] = useState(false);

    // API Key state
    const [apiKeys, setApiKeys] = useState([]);
    const [generatingKey, setGeneratingKey] = useState(false);
    const [showKey, setShowKey] = useState({});

    // Fetch profile and preferences
    useEffect(() => {
        if (!user) return;
        const fetchSettings = async () => {
            try {
                const [profileRes, prefsRes] = await Promise.all([
                    supabase.from('users').select('full_name, investor_level').eq('id', user.id).single(),
                    supabase.from('user_preferences').select('*').eq('user_id', user.id).single()
                ]);
                if (profileRes.data) {
                    setFullName(profileRes.data.full_name || '');
                    setInvestorLevel(profileRes.data.investor_level || 'beginner');
                }
                if (prefsRes.data) {
                    setNotifPush(prefsRes.data.notifications_push);
                    setNotifEmail(prefsRes.data.notifications_email);
                    setNotifSms(prefsRes.data.notifications_sms);
                }
            } catch (err) {
                console.error('Error fetching settings:', err);
            } finally {
                setProfileLoading(false);
            }
        };
        fetchSettings();
    }, [user]);

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setProfileSaving(true);
        try {
            const { error } = await supabase.from('users').update({
                full_name: fullName,
                investor_level: investorLevel
            }).eq('id', user.id);
            if (error) throw error;
            setProfileSaved(true);
            setTimeout(() => setProfileSaved(false), 2000);
        } catch (err) {
            alert('Error saving profile: ' + err.message);
        } finally {
            setProfileSaving(false);
        }
    };

    const handleKillSwitchSave = async () => {
        setSecuritySaving(true);
        try {
            // Store kill switch in user_preferences.lrs_used_usd field (repurposed as drawdown limit)
            const { error } = await supabase.from('user_preferences').update({
                lrs_used_usd: killSwitchValue
            }).eq('user_id', user.id);
            if (error) throw error;
            setSecuritySaved(true);
            setTimeout(() => setSecuritySaved(false), 2000);
        } catch (err) {
            alert('Error saving security settings: ' + err.message);
        } finally {
            setSecuritySaving(false);
        }
    };

    const handleNotifSave = async () => {
        setNotifSaving(true);
        try {
            const { error } = await supabase.from('user_preferences').update({
                notifications_push: notifPush,
                notifications_email: notifEmail,
                notifications_sms: notifSms
            }).eq('user_id', user.id);
            if (error) throw error;
            setNotifSaved(true);
            setTimeout(() => setNotifSaved(false), 2000);
        } catch (err) {
            alert('Error saving notification settings: ' + err.message);
        } finally {
            setNotifSaving(false);
        }
    };

    const handleGenerateApiKey = async () => {
        setGeneratingKey(true);
        try {
            const key = 'ntx_' + crypto.randomUUID().replace(/-/g, '');
            const secret = 'sec_' + crypto.randomUUID().replace(/-/g, '');
            setApiKeys(prev => [...prev, {
                id: Date.now(),
                key,
                secret,
                created: new Date().toLocaleString(),
                label: 'API Key #' + (prev.length + 1)
            }]);
        } catch (err) {
            alert('Error generating API key: ' + err.message);
        } finally {
            setGeneratingKey(false);
        }
    };

    const ToggleSwitch = ({ checked, onChange, label }) => (
        <div className="flex-between" style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div>
                <div style={{ fontWeight: '500' }}>{label}</div>
            </div>
            <div
                onClick={() => onChange(!checked)}
                style={{
                    width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer',
                    backgroundColor: checked ? 'var(--color-success)' : 'var(--bg-base)',
                    border: '1px solid var(--border-strong)',
                    position: 'relative', transition: 'all 0.2s'
                }}
            >
                <div style={{
                    width: '18px', height: '18px', borderRadius: '50%',
                    backgroundColor: 'white', position: 'absolute', top: '2px',
                    left: checked ? '22px' : '2px', transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                }} />
            </div>
        </div>
    );

    const SaveButton = ({ onClick, saving, saved, label = 'Save Changes' }) => (
        <button
            onClick={onClick}
            className={`btn ${saved ? 'btn-success' : 'btn-primary'}`}
            style={{ alignSelf: 'flex-start', padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            disabled={saving}
        >
            {saved ? <><CheckCircle size={16} /> Saved!</> : saving ? 'Saving...' : <><Save size={16} /> {label}</>}
        </button>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
            <div>
                <h1 style={{ marginBottom: '0.5rem' }}>Account Settings</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Manage your profile, security preferences, and trading permissions.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem' }}>

                {/* Sidebar Navigation */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[
                        { key: 'profile', icon: <User size={18} />, label: 'Profile Information' },
                        { key: 'security', icon: <Shield size={18} />, label: 'Security & Limits' },
                        { key: 'notifications', icon: <Bell size={18} />, label: 'Notifications' },
                        { key: 'api', icon: <Key size={18} />, label: 'API Management' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`btn ${activeTab === tab.key ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem' }}
                        >
                            <span style={{ marginRight: '0.75rem', display: 'flex' }}>{tab.icon}</span> {tab.label}
                        </button>
                    ))}

                    <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                        <button
                            onClick={async () => { await supabase.auth.signOut(); }}
                            className="btn btn-danger"
                            style={{ width: '100%', justifyContent: 'flex-start', padding: '0.75rem 1rem' }}
                        >
                            <LogOut size={18} style={{ marginRight: '0.75rem' }} /> Sign Out All Devices
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="card glass-panel" style={{ padding: '2rem' }}>

                    {activeTab === 'profile' && (
                        <form onSubmit={handleProfileSave} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Personal Details</h2>

                            {profileLoading ? (
                                <div style={{ padding: '2rem', color: 'var(--text-muted)', textAlign: 'center' }}>Loading profile...</div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label className="form-label">Full Name</label>
                                            <input type="text" className="form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                                        </div>
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label className="form-label">Email Address</label>
                                            <input type="email" className="form-input" disabled value={user?.email || ''} style={{ opacity: 0.7 }} />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Trading Experience Level</label>
                                        <select className="form-input" value={investorLevel} onChange={(e) => setInvestorLevel(e.target.value)}>
                                            <option value="beginner">Beginner (1-3 Years)</option>
                                            <option value="intermediate">Intermediate (3-5 Years)</option>
                                            <option value="advanced">Advanced (5+ Years)</option>
                                        </select>
                                    </div>

                                    <SaveButton onClick={handleProfileSave} saving={profileSaving} saved={profileSaved} />
                                </>
                            )}
                        </form>
                    )}

                    {activeTab === 'security' && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Security Limitations</h2>

                            <div className="card" style={{ backgroundColor: 'var(--bg-base)' }}>
                                <div className="flex-between" style={{ marginBottom: '1rem' }}>
                                    <div>
                                        <h4 style={{ margin: 0 }}>Kill-Switch (Max Drawdown Limit)</h4>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>Automatically block new orders if daily MTM crosses threshold.</p>
                                    </div>
                                    <span className="badge badge-success">Active</span>
                                </div>
                                <input
                                    type="range" min="5" max="50" value={killSwitchValue}
                                    onChange={(e) => setKillSwitchValue(Number(e.target.value))}
                                    className="form-input" style={{ width: '100%' }}
                                />
                                <div className="flex-between" style={{ marginTop: '0.5rem' }}>
                                    <span className="text-mono color-danger" style={{ fontWeight: 'bold' }}>-{killSwitchValue}% Limit</span>
                                    <SaveButton onClick={handleKillSwitchSave} saving={securitySaving} saved={securitySaved} label="Save Limit" />
                                </div>
                            </div>

                            <div className="card" style={{ backgroundColor: 'var(--bg-base)' }}>
                                <div className="flex-between">
                                    <div>
                                        <h4 style={{ margin: 0 }}>Two-Factor Authentication (2FA)</h4>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>Require TOTP code to log in and withdraw funds.</p>
                                    </div>
                                    <button className="btn btn-secondary">Enable 2FA</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Alert Preferences</h2>

                            <ToggleSwitch checked={notifPush} onChange={setNotifPush} label="Push Notifications (Executed trades, Margin calls)" />
                            <ToggleSwitch checked={notifEmail} onChange={setNotifEmail} label="Email Alerts (Daily reports, Account activity)" />
                            <ToggleSwitch checked={notifSms} onChange={setNotifSms} label="SMS Notifications (Critical alerts only)" />

                            <SaveButton onClick={handleNotifSave} saving={notifSaving} saved={notifSaved} label="Save Preferences" />
                        </div>
                    )}

                    {activeTab === 'api' && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Developer Endpoints</h2>

                            {apiKeys.length === 0 ? (
                                <div className="card" style={{ border: '1px dashed var(--border-strong)', backgroundColor: 'var(--bg-base)' }}>
                                    <p style={{ color: 'var(--text-muted)' }}>You do not have any active API Keys generated. Click below to generate a new key for algorithmic trading.</p>
                                    <button onClick={handleGenerateApiKey} className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={generatingKey}>
                                        {generatingKey ? 'Generating...' : 'Generate New REST API Key'}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {apiKeys.map(k => (
                                        <div key={k.id} className="card" style={{ backgroundColor: 'var(--bg-base)' }}>
                                            <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                                                <span style={{ fontWeight: '600' }}>{k.label}</span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Created: {k.created}</span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <label className="form-label" style={{ margin: 0, minWidth: '60px' }}>Key:</label>
                                                    <code className="text-mono" style={{ flex: 1, padding: '0.5rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '6px', fontSize: '0.8rem' }}>
                                                        {showKey[k.id] ? k.key : k.key.slice(0, 8) + '•'.repeat(20)}
                                                    </code>
                                                    <button className="btn-icon" onClick={() => setShowKey(prev => ({ ...prev, [k.id]: !prev[k.id] }))}>
                                                        {showKey[k.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                    <button className="btn-icon" onClick={() => { navigator.clipboard.writeText(k.key); }}>
                                                        <Copy size={16} />
                                                    </button>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <label className="form-label" style={{ margin: 0, minWidth: '60px' }}>Secret:</label>
                                                    <code className="text-mono" style={{ flex: 1, padding: '0.5rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '6px', fontSize: '0.8rem' }}>
                                                        {showKey[k.id + '_sec'] ? k.secret : k.secret.slice(0, 8) + '•'.repeat(20)}
                                                    </code>
                                                    <button className="btn-icon" onClick={() => setShowKey(prev => ({ ...prev, [k.id + '_sec']: !prev[k.id + '_sec'] }))}>
                                                        {showKey[k.id + '_sec'] ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                    <button className="btn-icon" onClick={() => { navigator.clipboard.writeText(k.secret); }}>
                                                        <Copy size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={handleGenerateApiKey} className="btn btn-secondary" disabled={generatingKey}>
                                        {generatingKey ? 'Generating...' : '+ Generate Another Key'}
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
