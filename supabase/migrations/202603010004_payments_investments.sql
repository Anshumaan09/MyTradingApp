-- Migration: Payments & Investments Domain
-- Covers: S-07 (007_payments.sql + 008_investments.sql)
-- Tables: payment_orders, payment_mandates, mf_schemes, mf_holdings, sip_orders, goals, fd_schemes, fd_bookings

-- ==========================================
-- 07 Payments Domain
-- ==========================================

create type payment_status as enum ('initiated', 'processing', 'success', 'failed', 'refunded');
create type payment_method as enum ('upi', 'netbanking', 'imps', 'neft', 'rtgs', 'card');
create type mandate_status as enum ('created', 'authorized', 'paused', 'revoked', 'expired');

create table public.payment_orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  gateway varchar(30) not null, -- 'razorpay', 'cashfree'
  gateway_order_id varchar(100) unique,
  gateway_payment_id varchar(100),
  operation varchar(10) not null, -- 'deposit', 'withdraw'
  method payment_method not null,
  amount numeric(18,4) not null,
  currency varchar(3) not null default 'INR',
  status payment_status not null default 'initiated',
  failure_reason text,
  bank_ref_no varchar(100),
  utr varchar(30),
  ip_address inet,
  metadata jsonb default '{}',
  initiated_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payment_mandates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  gateway varchar(30) not null,
  mandate_id varchar(100) unique,
  mandate_type varchar(20) not null default 'autopay', -- 'autopay', 'emandate'
  upi_id varchar(100),
  bank_account_id uuid references public.bank_accounts(id),
  max_amount numeric(18,4) not null,
  frequency varchar(20) not null default 'monthly', -- 'daily','weekly','monthly','quarterly'
  status mandate_status not null default 'created',
  authorized_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ==========================================
-- 08 Investments Domain
-- ==========================================

create type sip_status as enum ('active', 'paused', 'completed', 'cancelled');

create table public.mf_schemes (
  id uuid default gen_random_uuid() primary key,
  amfi_code varchar(20) not null unique,
  isin varchar(12) unique,
  scheme_name varchar(500) not null,
  amc_name varchar(200) not null,
  scheme_type varchar(50) not null, -- 'equity', 'debt', 'hybrid', 'elss', 'liquid'
  scheme_category varchar(100),
  plan varchar(10) not null, -- 'growth', 'dividend', 'idcw'
  nav numeric(18,4),
  nav_date date,
  aum numeric(18,4), -- in crores
  expense_ratio numeric(6,4),
  exit_load text,
  min_sip_amount numeric(18,4) default 500,
  min_lumpsum numeric(18,4) default 1000,
  benchmark varchar(200),
  risk_rating varchar(20), -- 'low', 'moderate', 'moderately_high', 'high', 'very_high'
  launch_date date,
  return_1y numeric(8,4),
  return_3y numeric(8,4),
  return_5y numeric(8,4),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mf_holdings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  scheme_id uuid references public.mf_schemes(id) not null,
  folio_number varchar(50),
  units numeric(18,4) not null default 0,
  invested_amount numeric(18,4) not null default 0,
  current_value numeric(18,4) not null default 0,
  avg_nav numeric(18,4) not null default 0,
  xirr numeric(8,4),
  first_investment_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, scheme_id)
);

create table public.sip_orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  scheme_id uuid references public.mf_schemes(id) not null,
  mandate_id uuid references public.payment_mandates(id),
  amount numeric(18,4) not null,
  frequency varchar(20) not null default 'monthly',
  sip_date int not null default 1, -- day of month (1-28)
  installments_total int, -- null = perpetual
  installments_done int not null default 0,
  status sip_status not null default 'active',
  next_execution_date date not null,
  last_execution_date date,
  started_at timestamptz not null default now(),
  paused_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mf_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  scheme_id uuid references public.mf_schemes(id) not null,
  holding_id uuid references public.mf_holdings(id) not null,
  sip_id uuid references public.sip_orders(id),
  payment_id uuid references public.payment_orders(id),
  transaction_type varchar(10) not null, -- 'purchase', 'redemption', 'switch_in', 'switch_out'
  amount numeric(18,4) not null,
  nav numeric(18,4) not null,
  units numeric(18,4) not null,
  stamp_duty numeric(18,4) not null default 0,
  status varchar(20) not null default 'pending',
  executed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  name varchar(200) not null,
  target_amount numeric(18,4) not null,
  target_date date not null,
  current_amount numeric(18,4) not null default 0,
  risk_profile varchar(30) not null default 'moderate',
  monthly_investment numeric(18,4),
  asset_allocation jsonb, -- {"equity": 60, "debt": 30, "gold": 10}
  linked_sip_ids uuid[] default '{}',
  status varchar(20) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.fd_schemes (
  id uuid default gen_random_uuid() primary key,
  issuer_name varchar(200) not null,
  issuer_type varchar(20) not null, -- 'bank', 'nbfc', 'corporate'
  tenure_months int not null,
  rate_general numeric(6,4) not null,
  rate_senior numeric(6,4),
  min_amount numeric(18,4) not null,
  max_amount numeric(18,4),
  is_cumulative boolean not null default true,
  premature_penalty numeric(6,4) default 1.00,
  rating varchar(10), -- 'AAA', 'AA+', etc.
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.fd_bookings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  scheme_id uuid references public.fd_schemes(id) not null,
  principal numeric(18,4) not null,
  rate numeric(6,4) not null,
  tenure_months int not null,
  maturity_amount numeric(18,4) not null,
  interest_payout varchar(20) not null default 'cumulative',
  start_date date not null,
  maturity_date date not null,
  status varchar(20) not null default 'active',
  premature_closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Triggers
create trigger payment_orders_updated_at before update on public.payment_orders for each row execute procedure handle_updated_at();
create trigger payment_mandates_updated_at before update on public.payment_mandates for each row execute procedure handle_updated_at();
create trigger mf_schemes_updated_at before update on public.mf_schemes for each row execute procedure handle_updated_at();
create trigger mf_holdings_updated_at before update on public.mf_holdings for each row execute procedure handle_updated_at();
create trigger sip_orders_updated_at before update on public.sip_orders for each row execute procedure handle_updated_at();
create trigger goals_updated_at before update on public.goals for each row execute procedure handle_updated_at();
create trigger fd_bookings_updated_at before update on public.fd_bookings for each row execute procedure handle_updated_at();

-- RLS
alter table public.payment_orders enable row level security;
alter table public.payment_mandates enable row level security;
alter table public.mf_holdings enable row level security;
alter table public.sip_orders enable row level security;
alter table public.mf_transactions enable row level security;
alter table public.goals enable row level security;
alter table public.fd_bookings enable row level security;

-- RLS Policies
create policy "Users can view own payments" on public.payment_orders for select using (auth.uid() = user_id);
create policy "Users can view own mandates" on public.payment_mandates for select using (auth.uid() = user_id);
create policy "Users can view own mf holdings" on public.mf_holdings for select using (auth.uid() = user_id);
create policy "Users can view own sips" on public.sip_orders for select using (auth.uid() = user_id);
create policy "Users can view own mf txns" on public.mf_transactions for select using (auth.uid() = user_id);
create policy "Users can view own goals" on public.goals for select using (auth.uid() = user_id);
create policy "Users can manage own goals" on public.goals for all using (auth.uid() = user_id);
create policy "Users can view own fds" on public.fd_bookings for select using (auth.uid() = user_id);
-- Public read for schemes
create policy "Anyone can view mf schemes" on public.mf_schemes for select using (true);
create policy "Anyone can view fd schemes" on public.fd_schemes for select using (true);
alter table public.mf_schemes enable row level security;
alter table public.fd_schemes enable row level security;
