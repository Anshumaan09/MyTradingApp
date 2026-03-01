import React, { useState } from 'react';
import { ScrollText, Shield, AlertTriangle } from 'lucide-react';

const TABS = [
    { key: 'privacy', label: 'Privacy Policy', icon: <Shield size={16} /> },
    { key: 'terms', label: 'Terms & Conditions', icon: <ScrollText size={16} /> },
    { key: 'risk', label: 'Risk Disclosure', icon: <AlertTriangle size={16} /> },
];

const content = {
    privacy: {
        title: 'Privacy Policy',
        updated: 'March 1, 2026',
        sections: [
            { heading: '1. Information We Collect', text: 'We collect personal information you provide when creating an account, including your name, email address, phone number, PAN, Aadhaar (for KYC), bank account details, and trading preferences. We also collect usage data such as IP addresses, device information, browser type, pages visited, and trading activity through cookies and analytics.' },
            { heading: '2. How We Use Your Information', text: 'Your information is used to: (a) Provide and maintain trading services, (b) Process transactions and send related notifications, (c) Verify your identity for KYC compliance, (d) Personalize your experience with AI-driven insights, (e) Communicate service updates, market alerts, and promotional offers, (f) Comply with legal and regulatory requirements (SEBI, RBI, AMFI).' },
            { heading: '3. Data Security', text: 'We implement AES-256 encryption for sensitive data at rest and TLS 1.3 for data in transit. Multi-factor authentication (MFA) is available for all accounts. Our infrastructure is hosted on SOC 2 Type II certified data centers. Regular penetration testing and security audits are conducted quarterly.' },
            { heading: '4. Data Sharing', text: 'We do not sell your personal data. We may share information with: (a) Stock exchanges (NSE, BSE) and depositories (CDSL, NSDL) as required for trade execution, (b) Payment processors for fund transfers, (c) Regulatory bodies (SEBI, RBI) upon lawful request, (d) Cloud service providers under strict data processing agreements.' },
            { heading: '5. Your Rights', text: 'Under applicable data protection laws, you have the right to: access your personal data, request correction of inaccurate data, request deletion (subject to regulatory retention requirements), withdraw consent for marketing communications, and port your data to another service provider.' },
            { heading: '6. Data Retention', text: 'Trading records are retained for a minimum of 5 years as mandated by SEBI. KYC documents are retained for 5 years after account closure. You may request deletion of non-regulatory data at any time through Settings > Privacy.' },
        ]
    },
    terms: {
        title: 'Terms & Conditions',
        updated: 'March 1, 2026',
        sections: [
            { heading: '1. Acceptance of Terms', text: 'By accessing or using NexusTrade ("the Platform"), you agree to be bound by these Terms & Conditions. If you do not agree, you may not use the Platform. These terms constitute a legally binding agreement between you and NexusTrade Technologies Pvt. Ltd.' },
            { heading: '2. Eligibility', text: 'You must be at least 18 years of age and a resident of India to use our services. You must complete KYC verification before placing trades. Corporate accounts require additional documentation including board resolutions and authorized signatory details.' },
            { heading: '3. Trading Services', text: 'NexusTrade provides access to equity, F&O, cryptocurrency, mutual fund, and commodity markets. All trades are executed on a best-effort basis. We do not guarantee execution at displayed prices due to market volatility. Order types include Market, Limit, Stop-Loss, and GTT (Good Till Triggered).' },
            { heading: '4. Fees & Charges', text: 'Equity delivery: ₹0 brokerage. Intraday & F&O: ₹20 per order or 0.03%, whichever is lower. Crypto: 0.1% platform fee + 1% TDS on sell. Mutual Funds: Direct plans with zero commission. Additional statutory charges (STT, GST, stamp duty, exchange fees) apply as per regulatory norms.' },
            { heading: '5. Risk Acknowledgment', text: 'Trading in financial markets involves substantial risk of loss. Past performance is not indicative of future results. You are solely responsible for your trading decisions. NexusTrade does not provide investment advice. AI-generated insights are for informational purposes only and should not be considered as recommendations.' },
            { heading: '6. Account Security', text: 'You are responsible for maintaining confidentiality of your login credentials. Enable two-factor authentication for enhanced security. Report any unauthorized access immediately to security@nexustrade.in. We are not liable for losses resulting from unauthorized access due to user negligence.' },
            { heading: '7. Intellectual Property', text: 'All content, including software, designs, algorithms, AI models, and documentation, is the intellectual property of NexusTrade Technologies Pvt. Ltd. Unauthorized reproduction, distribution, or reverse engineering is prohibited.' },
            { heading: '8. Governing Law', text: 'These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Bangalore, Karnataka. Arbitration under the Indian Arbitration and Conciliation Act, 1996, is the preferred dispute resolution mechanism.' },
        ]
    },
    risk: {
        title: 'Risk Disclosure',
        updated: 'March 1, 2026',
        sections: [
            { heading: '⚠️ General Risk Warning', text: 'Trading and investing in financial instruments carry a high degree of risk. You may lose some or all of your invested capital. Only invest money you can afford to lose. This warning applies to all products available on NexusTrade including equities, derivatives, crypto, and mutual funds.' },
            { heading: 'Equity Trading Risks', text: 'Stock prices are subject to market risk and can fluctuate significantly due to company performance, economic factors, regulatory changes, and global events. Intraday trading with leverage amplifies both gains and losses. Auto square-off may result in realized losses.' },
            { heading: 'F&O Trading Risks', text: 'Derivatives trading involves leverage which amplifies risk. Options may expire worthless, resulting in 100% loss of premium paid. Futures positions require margin maintenance; failure to meet margin calls may result in forced liquidation. SEBI mandates minimum net worth of ₹2 lakhs for F&O trading.' },
            { heading: 'Cryptocurrency Risks', text: 'Crypto markets are highly volatile and operate 24/7. Regulatory environment in India is evolving — adverse regulations may impact prices. TDS of 1% applies on crypto sales. Crypto assets are not legal tender in India and are not backed by any government or central bank.' },
            { heading: 'Mutual Fund Risks', text: 'Mutual fund investments are subject to market risks. Read all scheme-related documents carefully before investing. Past NAV performance is not indicative of future returns. Exit loads may apply on early redemption. Tax treatment depends on holding period and fund type.' },
            { heading: 'AI & Algorithmic Trading Risks', text: 'AI-generated insights and recommendations are based on historical data and models that may not account for unprecedented events. Algorithmic strategies may malfunction due to software bugs, connectivity issues, or extreme market conditions. Always verify AI suggestions with your own research.' },
        ]
    }
};

export const Legal = () => {
    const [activeTab, setActiveTab] = useState('privacy');
    const c = content[activeTab];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><ScrollText size={28} color="var(--accent-primary)" /> Legal</h1>

            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                        background: activeTab === t.key ? 'var(--bg-surface-elevated)' : 'none', border: 'none',
                        color: activeTab === t.key ? 'var(--text-primary)' : 'var(--text-muted)', padding: '0.5rem 1rem',
                        borderRadius: '6px', cursor: 'pointer', fontWeight: activeTab === t.key ? '600' : '500',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>{t.icon} {t.label}</button>
                ))}
            </div>

            <div className="card" style={{ padding: '2rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ marginBottom: '0.25rem' }}>{c.title}</h2>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Last updated: {c.updated}</div>
                </div>
                {c.sections.map((s, i) => (
                    <div key={i} style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{s.heading}</h3>
                        <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>{s.text}</p>
                    </div>
                ))}
                <div style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', borderLeft: '3px solid var(--accent-primary)' }}>
                    <strong>NexusTrade Technologies Pvt. Ltd.</strong><br />
                    SEBI Reg No: INZ000XXXXXX | CIN: U67190KA2024PTC000000<br />
                    Registered Office: HSR Layout, Bangalore - 560102, Karnataka, India<br />
                    Support: support@nexustrade.in | Compliance: compliance@nexustrade.in
                </div>
            </div>
        </div>
    );
};
