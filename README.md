# NexusTrade — Full-Stack Trading Platform

A production-grade trading application built with **React + Vite + Supabase**, featuring live market data, order execution, crypto trading, AI-powered insights, and more.

![NexusTrade Dashboard](https://img.shields.io/badge/React-18-blue) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green) ![Vite](https://img.shields.io/badge/Vite-5-purple)

---

## ✨ Features

| Module | Description |
|--------|-------------|
| **Dashboard** | Portfolio overview, live tickers, AI morning brief, quick-action cards |
| **Markets** | 68+ instruments across Equities, F&O, Crypto, Commodities, Currency |
| **Portfolio** | Holdings with live P&L, sell functionality, trade history |
| **Funds** | INR wallet, UPI deposit, IMPS/NEFT withdrawal, transaction ledger |
| **Orders** | Market/Limit/SL order ticket, GTT orders, order history |
| **Crypto** | 15 crypto pairs, live ticker, buy/sell with charges breakdown |
| **Investments** | Mutual fund marketplace, SIP manager, financial goals tracker |
| **AI Insights** | Morning brief, Fear & Greed gauge, news with sentiment tags, AI chatbot |
| **Advanced Trading** | F&O options chain with Greeks, 6 strategy templates, IPO corner |
| **Analytics** | Portfolio allocation, monthly P&L, risk metrics, tax report, CSV export |
| **Notifications** | Real-time notification feed with filters and read/unread state |
| **Settings** | Profile, security, notification preferences, API management |

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, Lightweight Charts, Lucide Icons
- **Backend:** Supabase (PostgreSQL, Auth, RLS, RPC functions)
- **Styling:** Custom CSS design system (dark theme, glassmorphism)
- **State:** React hooks, Supabase Realtime subscriptions

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project

### Setup

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/NexusTrade.git
cd NexusTrade

# Install dependencies
npm install

# Create .env file with your Supabase credentials
cp .env.example .env
# Edit .env with your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Run the migrations in Supabase SQL Editor
# (files in /supabase/migrations/ — run in order)

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/          # WorkspaceLayout, sidebar, header
│   └── CommandPalette.jsx
├── lib/
│   ├── supabase.js      # Supabase client
│   ├── useAuth.js       # Auth hook
│   ├── useMarketData.js # Live price feeds
│   ├── cryptoEngine.js  # Crypto validation & charges
│   └── ...
├── pages/
│   ├── Dashboard.jsx
│   ├── MarketBrowser.jsx
│   ├── Portfolio.jsx
│   ├── Funds.jsx
│   ├── Orders.jsx
│   ├── CryptoTrading.jsx
│   ├── Investments.jsx
│   ├── AIInsights.jsx
│   ├── AdvancedTrading.jsx
│   ├── Analytics.jsx
│   ├── Notifications.jsx
│   ├── Legal.jsx
│   ├── Settings.jsx
│   ├── Auth.jsx
│   └── NotFound.jsx
└── App.jsx

supabase/
└── migrations/          # PostgreSQL schema, RPC functions, RLS policies
```

## 📄 License

MIT License — feel free to use this for learning, portfolios, or as a starting point for your own trading platform.
