import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, LineChart, Wallet, ArrowLeftRight, Settings, Bell, Search, LogOut, Landmark, Bitcoin, TrendingUp, Brain, Layers, BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/useAuth';
import { CommandPalette } from '../CommandPalette';
import { ErrorBoundary } from '../ErrorBoundary';

const Sidebar = () => {
    const { user } = useAuth();
    const [profileName, setProfileName] = useState('');

    useEffect(() => {
        if (!user) return;
        supabase.from('users').select('full_name').eq('id', user.id).single()
            .then(({ data }) => { if (data?.full_name) setProfileName(data.full_name); });
    }, [user]);

    const displayName = profileName || user?.email?.split('@')[0] || 'User';
    const initials = profileName
        ? profileName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : (user?.email?.[0] || 'U').toUpperCase();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
        { name: 'Markets', path: '/markets', icon: <LineChart size={20} /> },
        { name: 'Portfolio', path: '/portfolio', icon: <Wallet size={20} /> },
        { name: 'Funds', path: '/funds', icon: <Landmark size={20} /> },
        { name: 'Orders', path: '/orders', icon: <ArrowLeftRight size={20} /> },
        { name: 'Crypto', path: '/crypto', icon: <Bitcoin size={20} /> },
        { name: 'Investments', path: '/investments', icon: <TrendingUp size={20} /> },
        { name: 'AI Insights', path: '/ai-insights', icon: <Brain size={20} /> },
        { name: 'Advanced', path: '/advanced', icon: <Layers size={20} /> },
        { name: 'Analytics', path: '/analytics', icon: <BarChart3 size={20} /> },
        { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
    ];

    return (
        <div style={{
            width: 'var(--sidebar-width)',
            height: '100vh',
            backgroundColor: 'var(--bg-surface)',
            borderRight: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            left: 0,
            top: 0,
            zIndex: 40
        }}>
            <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.2rem'
                }}>N</div>
                <span style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.025em' }}>NexusTrade</span>
            </div>

            <nav style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            color: isActive ? 'white' : 'var(--text-secondary)',
                            backgroundColor: isActive ? 'var(--accent-primary-glow)' : 'transparent',
                            textDecoration: 'none',
                            fontWeight: isActive ? '600' : '500',
                            transition: 'all 0.2s ease',
                            borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent'
                        })}
                    >
                        {item.icon}
                        {item.name}
                    </NavLink>
                ))}
            </nav>

            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>{initials}</span>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>{displayName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pro Member</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Header = ({ onOpenPalette }) => {
    const { user } = useAuth();
    const headerNav = React.useMemo(() => {
        // We'll use window.location for simple navigation
        return { goToNotifs: () => { window.location.href = '/notifications'; } };
    }, []);

    return (
        <header className="glass-panel" style={{
            height: 'var(--header-height)',
            position: 'fixed',
            top: 0,
            right: 0,
            left: 'var(--sidebar-width)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2rem',
            zIndex: 30,
            borderRadius: 0,
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', width: '400px' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search markets, commands... (Cmd + K)"
                        className="form-input"
                        style={{ paddingLeft: '2.5rem', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-subtle)', cursor: 'text' }}
                        onFocus={(e) => { e.target.blur(); onOpenPalette(); }}
                        readOnly
                    />
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingRight: '1rem', borderRight: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Status:</span>
                    <span className="badge badge-success">Connected</span>
                </div>
                <div style={{ paddingRight: '1rem', borderRight: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.875rem' }}>{user?.email}</span>
                </div>
                <button className="btn-icon" title="Notifications" onClick={headerNav.goToNotifs} style={{ position: 'relative' }}>
                    <Bell size={20} />
                    <span style={{ position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }} />
                </button>
                <button
                    className="btn-icon"
                    title="Sign Out"
                    onClick={async () => {
                        await supabase.auth.signOut();
                    }}
                >
                    <LogOut size={20} />
                </button>
            </div>
        </header>
    );
};

export const WorkspaceLayout = () => {
    const [isPaletteOpen, setIsPaletteOpen] = React.useState(false);

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <div style={{ flex: 1, marginLeft: 'var(--sidebar-width)', paddingTop: 'var(--header-height)', display: 'flex', flexDirection: 'column' }}>
                <Header onOpenPalette={() => setIsPaletteOpen(true)} />
                <main className="animate-fade-in" style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                    <ErrorBoundary>
                        <Outlet />
                    </ErrorBoundary>
                </main>
            </div>
            <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
        </div>
    );
};
