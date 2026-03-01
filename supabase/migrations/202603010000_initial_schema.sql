-- NexusTrade Database Schema
-- Version 1.0 representing PostgreSQL + Supabase features

create extension if not exists "pgcrypto";

-- Enum types for strong typing
create type user_role as enum ('user', 'admin');
create type kyc_status as enum ('pending', 'pan_done', 'aadhaar_done', 'bank_done', 'complete', 'rejected');
create type account_status as enum ('active', 'suspended', 'closed');
create type order_type as enum ('market', 'limit', 'sl', 'sl_market', 'amo', 'gtt_child');
create type order_status as enum ('pending', 'open', 'partial', 'complete', 'cancelled', 'rejected');
create type transaction_type as enum ('BUY', 'SELL');

-- ==========================================
-- 02 Auth & Users Domain
-- ==========================================
create table public.users (
  id uuid references auth.users not null primary key,
  phone varchar(15) not null unique,
  email varchar(320) unique,
  full_name varchar(200) not null,
  date_of_birth date,
  gender varchar(10),
  kyc_status smallint not null default 0,
  account_status smallint not null default 0,
  risk_profile varchar(30),
  investor_level varchar(20) not null default 'beginner',
  fo_enabled boolean not null default false,
  mtf_enabled boolean not null default false,
  nps_pran varchar(16) unique,
  nexus_pro boolean not null default false,
  pro_expires_at timestamptz,
  loyalty_tier varchar(20) not null default 'bronze',
  referral_code varchar(12) not null unique,
  referred_by_user_id uuid references public.users(id),
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.kyc_documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  pan_encrypted bytea,
  pan_name varchar(200),
  pan_verified boolean not null default false,
  aadhaar_last4 varchar(4),
  aadhaar_verified boolean not null default false,
  digilocker_token text,
  selfie_s3_key varchar(500),
  verification_method varchar(30) not null default 'manual',
  rejected_reason text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bank_accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  account_no_enc bytea not null,
  ifsc varchar(11) not null,
  bank_name varchar(100) not null,
  account_type varchar(20) not null,
  is_primary boolean not null default false,
  is_verified boolean not null default false,
  penny_drop_ref varchar(100),
  created_at timestamptz not null default now()
);

create table public.user_preferences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null unique,
  theme varchar(10) not null default 'dark',
  language varchar(10) not null default 'en',
  beginner_mode boolean not null default true,
  default_order_type varchar(10) not null default 'market',
  notifications_push boolean not null default true,
  notifications_email boolean not null default true,
  notifications_sms boolean not null default false,
  lrs_used_usd numeric(12,2) not null default 0,
  updated_at timestamptz not null default now()
);

-- ==========================================
-- 03 Orders Domain
-- ==========================================
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  broker_order_id varchar(100) unique,
  exchange varchar(10) not null,
  segment varchar(20) not null,
  symbol varchar(30) not null,
  instrument_token bigint,
  order_type varchar(20) not null,
  product_type varchar(10) not null,
  transaction_type varchar(4) not null,
  quantity int not null,
  price numeric(18,4),
  trigger_price numeric(18,4),
  filled_quantity int not null default 0,
  avg_price numeric(18,4),
  status varchar(20) not null default 'pending',
  rejection_reason text,
  brokerage numeric(18,4) not null default 0,
  stt numeric(18,4) not null default 0,
  exchange_charges numeric(18,4) not null default 0,
  gst numeric(18,4) not null default 0,
  stamp_duty numeric(18,4) not null default 0,
  sebi_charges numeric(18,4) not null default 0,
  dp_charges numeric(18,4) not null default 0,
  total_charges numeric(18,4) not null default 0,
  basket_id uuid, -- Fk to baskets
  gtt_id uuid, -- Fk to gtt
  request_id uuid not null unique,
  placed_at timestamptz not null default now(),
  executed_at timestamptz,
  created_at timestamptz not null default now()
  -- Partitioning by month is usually done via pg_partman or native partitions 
  -- in full postgres, but omitted for simplicity in local Supabase for now
);

create table public.gtt_orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  gtt_type varchar(10) not null,
  exchange varchar(10) not null,
  symbol varchar(30) not null,
  transaction_type varchar(4) not null,
  quantity int not null,
  trigger_price numeric(18,4) not null,
  limit_price numeric(18,4) not null,
  sl_trigger_price numeric(18,4),
  sl_limit_price numeric(18,4),
  target_price numeric(18,4),
  target_limit_price numeric(18,4),
  status varchar(20) not null default 'active',
  triggered_order_id uuid references public.orders(id),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.baskets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  name varchar(100) not null,
  description text,
  is_template boolean not null default false,
  template_type varchar(30),
  status varchar(20) not null default 'draft',
  executed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.orders add constraint fk_basket foreign key (basket_id) references public.baskets(id);
alter table public.orders add constraint fk_gtt foreign key (gtt_id) references public.gtt_orders(id);


-- ==========================================
-- 04 Portfolio Domain
-- ==========================================
create table public.holdings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  exchange varchar(10) not null,
  symbol varchar(30) not null,
  isin varchar(12),
  quantity int not null,
  avg_buy_price numeric(18,4) not null,
  total_invested numeric(18,4) not null,
  product_type varchar(10) not null,
  is_pledged boolean not null default false,
  pledged_qty int not null default 0,
  first_buy_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  order_id uuid references public.orders(id) not null unique,
  symbol varchar(30) not null,
  segment varchar(20) not null,
  transaction_type varchar(4) not null,
  quantity int not null,
  price numeric(18,4) not null,
  total_value numeric(18,4) not null,
  charges numeric(18,4) not null,
  trade_date date not null,
  settlement_type varchar(5) not null,
  realised_pnl numeric(18,4),
  created_at timestamptz not null default now()
);

create table public.portfolio_snapshots (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  snapshot_date date not null,
  total_invested numeric(18,4) not null,
  current_value numeric(18,4) not null,
  total_pnl numeric(18,4) not null,
  pnl_percent numeric(8,4) not null,
  day_pnl numeric(18,4) not null,
  xirr numeric(8,4),
  equity_value numeric(18,4) not null,
  mf_value numeric(18,4) not null,
  crypto_value numeric(18,4) not null,
  created_at timestamptz not null default now(),
  unique(user_id, snapshot_date)
);

-- ==========================================
-- 05 Wallet Domain
-- ==========================================
create table public.inr_wallet (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null unique,
  balance numeric(18,4) not null default 0,
  locked_balance numeric(18,4) not null default 0,
  total_deposited numeric(18,4) not null default 0,
  total_withdrawn numeric(18,4) not null default 0,
  updated_at timestamptz not null default now()
);

create table public.crypto_wallet (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  asset varchar(20) not null,
  balance numeric(28,8) not null default 0,
  locked_balance numeric(28,8) not null default 0,
  staked_balance numeric(28,8) not null default 0,
  wallet_address varchar(100),
  updated_at timestamptz not null default now()
);

create table public.wallet_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  wallet_type varchar(10) not null,
  asset varchar(20),
  type varchar(30) not null,
  amount numeric(28,8) not null,
  direction varchar(6) not null,
  balance_after numeric(28,8) not null,
  reference_id uuid,
  reference_type varchar(30),
  description text,
  created_at timestamptz not null default now()
);

-- ==========================================
-- Automated Timestamps Triggers
-- ==========================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at before update on public.users for each row execute procedure handle_updated_at();
create trigger kyc_docs_updated_at before update on public.kyc_documents for each row execute procedure handle_updated_at();
create trigger user_prefs_updated_at before update on public.user_preferences for each row execute procedure handle_updated_at();
create trigger gtt_updated_at before update on public.gtt_orders for each row execute procedure handle_updated_at();
create trigger baskets_updated_at before update on public.baskets for each row execute procedure handle_updated_at();
create trigger holdings_updated_at before update on public.holdings for each row execute procedure handle_updated_at();
create trigger inr_wallet_updated_at before update on public.inr_wallet for each row execute procedure handle_updated_at();
create trigger crypto_wallet_updated_at before update on public.crypto_wallet for each row execute procedure handle_updated_at();

-- ==========================================
-- RLS Policies
-- ==========================================
alter table public.users enable row level security;
alter table public.kyc_documents enable row level security;
alter table public.user_preferences enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.orders enable row level security;
alter table public.holdings enable row level security;
alter table public.transactions enable row level security;
alter table public.inr_wallet enable row level security;
alter table public.wallet_transactions enable row level security;

-- Basic Policies: Users can only see and edit their own data
create policy "Users can view own data" on public.users for select using (auth.uid() = id);
create policy "Users can update own data" on public.users for update using (auth.uid() = id);

create policy "Users can view own prefs" on public.user_preferences for select using (auth.uid() = user_id);
create policy "Users can update own prefs" on public.user_preferences for update using (auth.uid() = user_id);

create policy "Users can view own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Users can view own holdings" on public.holdings for select using (auth.uid() = user_id);
create policy "Users can view own wallet" on public.inr_wallet for select using (auth.uid() = user_id);
create policy "Users can view own wallet txns" on public.wallet_transactions for select using (auth.uid() = user_id);
