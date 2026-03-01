-- Migration: Alerts, Brokerage Config & Audit Log
-- Covers: S-08 (009–011 alerts, brokerage, audit)

-- ==========================================
-- 09 Price Alerts & Notifications
-- ==========================================

create type alert_condition as enum ('above', 'below', 'percent_change_up', 'percent_change_down');
create type alert_status as enum ('active', 'triggered', 'expired', 'cancelled');

create table public.price_alerts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  symbol varchar(30) not null,
  exchange varchar(10) not null,
  condition alert_condition not null,
  target_value numeric(18,4) not null,
  current_value_at_creation numeric(18,4),
  status alert_status not null default 'active',
  notify_push boolean not null default true,
  notify_email boolean not null default false,
  notify_sms boolean not null default false,
  triggered_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  type varchar(50) not null, -- 'order_filled', 'margin_call', 'price_alert', 'sip_debit', 'system'
  title varchar(200) not null,
  body text not null,
  data jsonb default '{}', -- Additional context (order_id, symbol, etc.)
  channel varchar(10) not null default 'push', -- 'push', 'email', 'sms'
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- ==========================================
-- 10 Brokerage Configuration
-- ==========================================

create table public.broker_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  broker varchar(30) not null, -- 'zerodha', 'upstox', 'binance'
  access_token_enc bytea not null,
  refresh_token_enc bytea,
  api_key varchar(100),
  api_secret_enc bytea,
  token_expires_at timestamptz not null,
  is_active boolean not null default true,
  last_used_at timestamptz,
  permissions jsonb default '[]', -- ['orders', 'holdings', 'market_data']
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, broker)
);

create table public.brokerage_charges (
  id uuid default gen_random_uuid() primary key,
  segment varchar(20) not null, -- 'EQ', 'FO', 'CDS', 'MCX', 'CRYPTO'
  transaction_type varchar(4) not null, -- 'BUY', 'SELL'
  brokerage_flat numeric(18,4), -- flat per order (e.g. 20)
  brokerage_percent numeric(8,6), -- percent of turnover
  stt_percent numeric(8,6) not null,
  exchange_charge_percent numeric(8,6) not null,
  gst_percent numeric(6,4) not null default 18.0000,
  sebi_per_crore numeric(18,4) not null default 10.0000,
  stamp_percent numeric(8,6) not null,
  dp_charges numeric(18,4) not null default 0, -- per scrip per day
  effective_from date not null,
  effective_to date, -- null = current
  created_at timestamptz not null default now(),
  unique(segment, transaction_type, effective_from)
);

-- ==========================================
-- 11 Audit Log
-- ==========================================

create table public.audit_log (
  id bigint generated always as identity primary key,
  user_id uuid references public.users(id),
  action varchar(100) not null, -- 'login', 'order_placed', 'funds_deposited', 'settings_changed', etc.
  entity_type varchar(50), -- 'order', 'wallet', 'holding', 'kyc', etc.
  entity_id uuid,
  ip_address inet,
  user_agent text,
  old_data jsonb,
  new_data jsonb,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

-- ==========================================
-- Triggers
-- ==========================================
create trigger price_alerts_updated_at before update on public.price_alerts for each row execute procedure handle_updated_at();
create trigger broker_sessions_updated_at before update on public.broker_sessions for each row execute procedure handle_updated_at();

-- ==========================================
-- RLS Policies
-- ==========================================
alter table public.price_alerts enable row level security;
alter table public.notifications enable row level security;
alter table public.broker_sessions enable row level security;
alter table public.audit_log enable row level security;

create policy "Users can manage own alerts" on public.price_alerts for all using (auth.uid() = user_id);
create policy "Users can view own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users can update own notifications" on public.notifications for update using (auth.uid() = user_id);
create policy "Users can view own broker sessions" on public.broker_sessions for select using (auth.uid() = user_id);
create policy "Users can view own audit log" on public.audit_log for select using (auth.uid() = user_id);

-- Brokerage charges are public read
alter table public.brokerage_charges enable row level security;
create policy "Anyone can view charges" on public.brokerage_charges for select using (true);

-- ==========================================
-- Seed: Default Brokerage Charges (India 2026)
-- ==========================================
insert into public.brokerage_charges (segment, transaction_type, brokerage_flat, brokerage_percent, stt_percent, exchange_charge_percent, gst_percent, sebi_per_crore, stamp_percent, dp_charges, effective_from) values
  ('EQ', 'BUY',  20, null,    0.1000, 0.003450, 18.0000, 10.0000, 0.015000, 0,     '2026-01-01'),
  ('EQ', 'SELL', 20, null,    0.1000, 0.003450, 18.0000, 10.0000, 0.003000, 15.93, '2026-01-01'),
  ('FO', 'BUY',  20, null,    0.0500, 0.050000, 18.0000, 10.0000, 0.003000, 0,     '2026-01-01'),
  ('FO', 'SELL', 20, null,    0.0500, 0.050000, 18.0000, 10.0000, 0.003000, 0,     '2026-01-01'),
  ('CDS','BUY',  20, null,    0.0100, 0.003500, 18.0000, 10.0000, 0.001000, 0,     '2026-01-01'),
  ('CDS','SELL', 20, null,    0.0100, 0.003500, 18.0000, 10.0000, 0.001000, 0,     '2026-01-01'),
  ('CRYPTO','BUY',  0, 0.0500, 1.0000, 0.000000, 18.0000,  0.0000, 0.000000, 0,     '2026-01-01'),
  ('CRYPTO','SELL', 0, 0.0500, 1.0000, 0.000000, 18.0000,  0.0000, 0.000000, 0,     '2026-01-01');
