-- Migration: Performance Indexes
-- Covers: S-09 (012_indexes.sql)
-- Critical indexes for query performance across all domains

-- ==========================================
-- Users & Auth
-- ==========================================
create index if not exists idx_users_email on public.users (email);
create index if not exists idx_users_phone on public.users (phone);
create index if not exists idx_users_referral_code on public.users (referral_code);
create index if not exists idx_kyc_user on public.kyc_documents (user_id);
create index if not exists idx_bank_accounts_user on public.bank_accounts (user_id);

-- ==========================================
-- Orders
-- ==========================================
create index if not exists idx_orders_user on public.orders (user_id);
create index if not exists idx_orders_user_status on public.orders (user_id, status);
create index if not exists idx_orders_user_symbol on public.orders (user_id, symbol);
create index if not exists idx_orders_placed_at on public.orders (placed_at desc);
create index if not exists idx_orders_request_id on public.orders (request_id);
create index if not exists idx_orders_basket on public.orders (basket_id) where basket_id is not null;
create index if not exists idx_gtt_user_status on public.gtt_orders (user_id, status);

-- ==========================================
-- Portfolio
-- ==========================================
create index if not exists idx_holdings_user on public.holdings (user_id);
create index if not exists idx_holdings_user_symbol on public.holdings (user_id, symbol);
create index if not exists idx_transactions_user on public.transactions (user_id);
create index if not exists idx_transactions_user_date on public.transactions (user_id, trade_date desc);
create index if not exists idx_transactions_order on public.transactions (order_id);
create index if not exists idx_snapshots_user_date on public.portfolio_snapshots (user_id, snapshot_date desc);

-- ==========================================
-- Wallet
-- ==========================================
create index if not exists idx_wallet_txns_user on public.wallet_transactions (user_id);
create index if not exists idx_wallet_txns_user_created on public.wallet_transactions (user_id, created_at desc);
create index if not exists idx_crypto_wallet_user on public.crypto_wallet (user_id);
create index if not exists idx_crypto_wallet_user_asset on public.crypto_wallet (user_id, asset);

-- ==========================================
-- Payments
-- ==========================================
create index if not exists idx_payment_orders_user on public.payment_orders (user_id);
create index if not exists idx_payment_orders_gateway on public.payment_orders (gateway_order_id);
create index if not exists idx_payment_mandates_user on public.payment_mandates (user_id);

-- ==========================================
-- Investments
-- ==========================================
create index if not exists idx_mf_schemes_amfi on public.mf_schemes (amfi_code);
create index if not exists idx_mf_schemes_type on public.mf_schemes (scheme_type, is_active);
create index if not exists idx_mf_holdings_user on public.mf_holdings (user_id);
create index if not exists idx_sip_orders_user on public.sip_orders (user_id, status);
create index if not exists idx_sip_next_exec on public.sip_orders (next_execution_date) where status = 'active';
create index if not exists idx_mf_txns_user on public.mf_transactions (user_id);
create index if not exists idx_goals_user on public.goals (user_id);

-- ==========================================
-- Alerts & Notifications
-- ==========================================
create index if not exists idx_price_alerts_user on public.price_alerts (user_id, status);
create index if not exists idx_price_alerts_symbol on public.price_alerts (symbol, status) where status = 'active';
create index if not exists idx_notifications_user on public.notifications (user_id, is_read, created_at desc);

-- ==========================================
-- Brokerage & Audit
-- ==========================================
create index if not exists idx_broker_sessions_user on public.broker_sessions (user_id, broker);
create index if not exists idx_audit_user on public.audit_log (user_id, created_at desc);
create index if not exists idx_audit_entity on public.audit_log (entity_type, entity_id);
create index if not exists idx_audit_action on public.audit_log (action, created_at desc);
