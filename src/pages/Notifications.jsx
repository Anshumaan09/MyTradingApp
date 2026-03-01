import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, Filter, ArrowUpRight, ShoppingCart, AlertTriangle, Gift, Target, Zap, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';

const typeConfig = {
    trade: { icon: <ShoppingCart size={16} />, color: '#6366f1', label: 'Trade' },
    alert: { icon: <AlertTriangle size={16} />, color: '#f59e0b', label: 'Alert' },
    system: { icon: <Zap size={16} />, color: '#3b82f6', label: 'System' },
    sip: { icon: <RefreshCw size={16} />, color: '#10b981', label: 'SIP' },
    goal: { icon: <Target size={16} />, color: '#8b5cf6', label: 'Goal' },
    promo: { icon: <Gift size={16} />, color: '#ec4899', label: 'Promo' },
};

// Demo notifications for first-time users
const DEMO_NOTIFICATIONS = [
    { id: 'd1', type: 'system', title: 'Welcome to NexusTrade! 🎉', message: 'Your account is set up and ready to go. Start by exploring the Markets page to find instruments to trade.', is_read: false, created_at: new Date(Date.now() - 60000).toISOString(), action_url: '/markets' },
    { id: 'd2', type: 'trade', title: 'BUY RELIANCE — Completed', message: 'BUY 10 RELIANCE @ ₹2,890.00 executed successfully. Total value: ₹28,900.', is_read: false, created_at: new Date(Date.now() - 3600000).toISOString(), action_url: '/orders' },
    { id: 'd3', type: 'alert', title: 'Price Alert: NIFTY crossed 22,500', message: 'NIFTY 50 has crossed your price alert of 22,500. Current level: 22,543.', is_read: true, created_at: new Date(Date.now() - 7200000).toISOString(), action_url: '/markets' },
    { id: 'd4', type: 'sip', title: 'SIP Reminder: HDFC Mid-Cap', message: 'Your SIP of ₹5,000 in HDFC Mid-Cap Opportunities Fund is due on March 5th. Ensure sufficient balance.', is_read: false, created_at: new Date(Date.now() - 14400000).toISOString(), action_url: '/investments' },
    { id: 'd5', type: 'goal', title: 'Goal Milestone: Retirement Fund 25%', message: 'Congratulations! Your "Retirement Fund" goal has reached 25% completion. Keep going! 🚀', is_read: true, created_at: new Date(Date.now() - 28800000).toISOString(), action_url: '/investments' },
    { id: 'd6', type: 'trade', title: 'SELL TATA — Completed', message: 'SELL 1 TATA @ ₹1,140.16 executed. Realized P&L: -₹41,010.', is_read: true, created_at: new Date(Date.now() - 43200000).toISOString(), action_url: '/portfolio' },
    { id: 'd7', type: 'system', title: 'New Feature: Crypto Trading', message: 'You can now trade 15 crypto pairs with live prices and real-time order execution. Try it out!', is_read: true, created_at: new Date(Date.now() - 86400000).toISOString(), action_url: '/crypto' },
    { id: 'd8', type: 'promo', title: 'Zero Brokerage Week! 🎁', message: 'Trade with zero brokerage charges this week. Valid for all equity and crypto orders.', is_read: true, created_at: new Date(Date.now() - 172800000).toISOString() },
    { id: 'd9', type: 'alert', title: 'BTC crossed $67,000', message: 'Bitcoin has crossed your price alert of $67,000. Current price: $67,566.', is_read: false, created_at: new Date(Date.now() - 3600000 * 5).toISOString(), action_url: '/crypto' },
];

export const Notifications = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [dbNotifications, setDbNotifications] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
                setDbNotifications(data || []);
            } catch (e) { /* table may not exist yet */ }
            finally { setLoading(false); }
        };
        fetchNotifications();
    }, [user]);

    // Merge DB and demo notifications
    useEffect(() => {
        const merged = dbNotifications.length > 0 ? dbNotifications : DEMO_NOTIFICATIONS;
        setNotifications(merged);
    }, [dbNotifications]);

    const filtered = filter === 'all' ? notifications : filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications.filter(n => n.type === filter);
    const unreadCount = notifications.filter(n => !n.is_read).length;

    const markRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        // Also update in DB if it's a real notification
        if (!id.startsWith('d')) {
            supabase.from('notifications').update({ is_read: true }).eq('id', id).then(() => { });
        }
    };

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        if (user) {
            supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false).then(() => { });
        }
    };

    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
            {/* Header */}
            <div className="flex-between">
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Bell size={28} color="var(--accent-primary)" /> Notifications
                    {unreadCount > 0 && (
                        <span className="badge badge-danger" style={{ fontSize: '0.7rem', minWidth: '20px', textAlign: 'center' }}>{unreadCount}</span>
                    )}
                </h1>
                {unreadCount > 0 && (
                    <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }} onClick={markAllRead}>
                        <CheckCheck size={16} /> Mark all read
                    </button>
                )}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {[
                    { key: 'all', label: 'All' },
                    { key: 'unread', label: `Unread (${unreadCount})` },
                    { key: 'trade', label: '🛒 Trades' },
                    { key: 'alert', label: '⚠️ Alerts' },
                    { key: 'sip', label: '🔄 SIP' },
                    { key: 'goal', label: '🎯 Goals' },
                    { key: 'system', label: '⚡ System' },
                ].map(f => (
                    <button key={f.key} className={`btn ${filter === f.key ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                        onClick={() => setFilter(f.key)}>{f.label}</button>
                ))}
            </div>

            {/* Notification List */}
            {loading ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading notifications...</div>
            ) : filtered.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <Bell size={40} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--text-muted)' }}>No notifications to show.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {filtered.map(n => {
                        const cfg = typeConfig[n.type] || typeConfig.system;
                        return (
                            <div key={n.id} style={{
                                display: 'flex', gap: '0.75rem', padding: '0.9rem 1.1rem', borderRadius: '10px',
                                backgroundColor: n.is_read ? 'var(--bg-surface)' : 'var(--bg-surface-elevated)',
                                border: `1px solid ${n.is_read ? 'var(--border-subtle)' : cfg.color + '40'}`,
                                cursor: 'pointer', transition: 'all 0.2s',
                                opacity: n.is_read ? 0.75 : 1
                            }} onClick={() => { markRead(n.id); if (n.action_url) window.location.href = n.action_url; }}>
                                {/* Icon */}
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: cfg.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color, flexShrink: 0 }}>
                                    {cfg.icon}
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                        <span style={{ fontWeight: n.is_read ? '500' : '600', fontSize: '0.875rem' }}>{n.title}</span>
                                        {!n.is_read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', flexShrink: 0 }}></div>}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{n.message}</div>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{timeAgo(n.created_at)}</span>
                                        <span className="badge" style={{ backgroundColor: cfg.color + '15', color: cfg.color, fontSize: '0.55rem' }}>{cfg.label}</span>
                                        {n.action_url && <ArrowUpRight size={12} color="var(--text-muted)" />}
                                    </div>
                                </div>

                                {/* Read button */}
                                {!n.is_read && (
                                    <button onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                                        title="Mark as read" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', alignSelf: 'center', padding: '0.25rem' }}>
                                        <Check size={16} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
