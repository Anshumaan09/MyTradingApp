import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CommandPalette = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const listRef = useRef(null);
    const navigate = useNavigate();

    const commands = [
        { title: 'Go to Dashboard', category: 'Navigation', shortcut: 'G D', action: () => navigate('/') },
        { title: 'View Markets', category: 'Navigation', shortcut: 'G M', action: () => navigate('/markets') },
        { title: 'My Portfolio', category: 'Navigation', shortcut: 'G P', action: () => navigate('/portfolio') },
        { title: 'Wallet & Funds', category: 'Navigation', shortcut: 'G W', action: () => navigate('/funds') },
        { title: 'Place Order', category: 'Trading', shortcut: 'O', action: () => navigate('/orders') },
        { title: 'Toggle Dark Mode', category: 'Preferences', shortcut: 'T D', action: () => alert('Dark mode toggler coming soon!') },
        { title: 'Account Settings', category: 'Preferences', shortcut: 'S', action: () => navigate('/settings') },
    ];

    const filteredCommands = commands.filter(c =>
        c.title.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase())
    );

    // Reset selection when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Reset state when palette opens
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const executeCommand = useCallback((index) => {
        const cmd = filteredCommands[index];
        if (cmd) {
            cmd.action();
            onClose();
        }
    }, [filteredCommands, onClose]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (isOpen) onClose();
            }
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            }
            if (e.key === 'Enter' && isOpen) {
                e.preventDefault();
                executeCommand(selectedIndex);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, selectedIndex, filteredCommands.length, executeCommand]);

    // Scroll selected item into view
    useEffect(() => {
        if (listRef.current) {
            const items = listRef.current.querySelectorAll('[data-cmd-item]');
            if (items[selectedIndex]) {
                items[selectedIndex].scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex]);

    if (!isOpen) return null;

    // Flatten filtered commands with category grouping for index tracking
    let flatIndex = -1;

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '10vh'
        }} onClick={onClose}>
            <div
                className="card animate-fade-in"
                style={{
                    width: '100%',
                    maxWidth: '640px',
                    padding: 0,
                    overflow: 'hidden',
                    border: '1px solid var(--border-strong)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: 'flex', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-base)' }}>
                    <Search size={24} color="var(--text-muted)" style={{ marginRight: '1rem' }} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Type a command or search..."
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: 'var(--text-primary)',
                            fontSize: '1.25rem'
                        }}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                </div>

                <div ref={listRef} style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {filteredCommands.length > 0 ? (
                        <div style={{ padding: '0.5rem' }}>
                            {['Navigation', 'Trading', 'Preferences'].map(category => {
                                const categoryCommands = filteredCommands.filter(c => c.category === category);
                                if (categoryCommands.length === 0) return null;

                                return (
                                    <div key={category} style={{ marginBottom: '1rem' }}>
                                        <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            {category}
                                        </div>
                                        {categoryCommands.map(cmd => {
                                            flatIndex++;
                                            const currentIdx = flatIndex;
                                            const isSelected = currentIdx === selectedIndex;

                                            return (
                                                <div
                                                    key={cmd.title}
                                                    data-cmd-item
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '0.75rem 1rem',
                                                        cursor: 'pointer',
                                                        borderRadius: '8px',
                                                        color: isSelected ? 'white' : 'var(--text-secondary)',
                                                        backgroundColor: isSelected ? 'var(--bg-surface-highlight)' : 'transparent',
                                                        transition: 'all 0.1s'
                                                    }}
                                                    onMouseEnter={() => setSelectedIndex(currentIdx)}
                                                    onClick={() => executeCommand(currentIdx)}
                                                >
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <ArrowRight size={16} /> {cmd.title}
                                                    </span>
                                                    <span className="badge" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
                                                        {cmd.shortcut}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex-center" style={{ padding: '3rem', color: 'var(--text-muted)' }}>
                            No commands found for "{query}"
                        </div>
                    )}
                </div>

                <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-base)', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Use <kbd style={{ padding: '0.1rem 0.3rem', backgroundColor: 'var(--bg-surface)', borderRadius: '4px', border: '1px solid var(--border-strong)' }}>↑</kbd> <kbd style={{ padding: '0.1rem 0.3rem', backgroundColor: 'var(--bg-surface)', borderRadius: '4px', border: '1px solid var(--border-strong)' }}>↓</kbd> to navigate</span>
                    <span><kbd style={{ padding: '0.1rem 0.3rem', backgroundColor: 'var(--bg-surface)', borderRadius: '4px', border: '1px solid var(--border-strong)' }}>Enter</kbd> to select</span>
                    <span><kbd style={{ padding: '0.1rem 0.3rem', backgroundColor: 'var(--bg-surface)', borderRadius: '4px', border: '1px solid var(--border-strong)' }}>esc</kbd> to dismiss</span>
                </div>
            </div>
        </div>
    );
};
