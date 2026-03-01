-- Migration: Crypto Orders & Trading
-- Covers: S-12 (015_crypto_orders.sql)

-- ==========================================
-- Crypto Orders (separate from equity orders for regulatory compliance)
-- ==========================================

create type crypto_order_status as enum ('pending', 'open', 'partial', 'filled', 'cancelled', 'failed');
create type crypto_order_type as enum ('market', 'limit', 'stop_limit', 'oco');

create table public.crypto_orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  exchange varchar(20) not null, -- 'binance', 'coinbase', 'internal'
  exchange_order_id varchar(100),
  pair varchar(20) not null, -- 'BTC/USDT', 'ETH/INR'
  base_asset varchar(10) not null, -- 'BTC'
  quote_asset varchar(10) not null, -- 'USDT', 'INR'
  side varchar(4) not null, -- 'BUY', 'SELL'
  order_type crypto_order_type not null,
  quantity numeric(28,8) not null,
  price numeric(28,8), -- null for market orders
  stop_price numeric(28,8),
  filled_quantity numeric(28,8) not null default 0,
  avg_fill_price numeric(28,8),
  status crypto_order_status not null default 'pending',
  tds_amount numeric(18,4) not null default 0, -- TDS at 1% on sell
  platform_fee numeric(18,4) not null default 0,
  gst_on_fee numeric(18,4) not null default 0,
  total_charges numeric(18,4) not null default 0,
  rejection_reason text,
  request_id uuid not null unique default gen_random_uuid(),
  placed_at timestamptz not null default now(),
  executed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ==========================================
-- Crypto Holdings
-- ==========================================
create table public.crypto_holdings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  asset varchar(10) not null,
  quantity numeric(28,8) not null default 0,
  avg_buy_price numeric(28,8) not null default 0,
  total_invested numeric(28,8) not null default 0,
  first_buy_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, asset)
);

-- ==========================================
-- Crypto Transactions (Trade Book)
-- ==========================================
create table public.crypto_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  order_id uuid references public.crypto_orders(id) not null,
  pair varchar(20) not null,
  side varchar(4) not null,
  quantity numeric(28,8) not null,
  price numeric(28,8) not null,
  total_value numeric(28,8) not null,
  fee numeric(18,4) not null default 0,
  tds numeric(18,4) not null default 0,
  realised_pnl numeric(28,8),
  created_at timestamptz not null default now()
);

-- ==========================================
-- DCA / Recurring Buy Plans
-- ==========================================
create table public.crypto_recurring_buys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  asset varchar(10) not null,
  amount numeric(18,4) not null, -- INR amount per execution
  frequency varchar(20) not null default 'weekly', -- 'daily', 'weekly', 'biweekly', 'monthly'
  source varchar(20) not null default 'wallet', -- 'wallet', 'mandate'
  mandate_id uuid references public.payment_mandates(id),
  status varchar(20) not null default 'active',
  next_execution_date date not null,
  last_execution_date date,
  total_invested numeric(18,4) not null default 0,
  total_units numeric(28,8) not null default 0,
  executions_count int not null default 0,
  started_at timestamptz not null default now(),
  paused_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ==========================================
-- Swap Orders (instant conversion)
-- ==========================================
create table public.crypto_swaps (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  from_asset varchar(10) not null,
  to_asset varchar(10) not null,
  from_quantity numeric(28,8) not null,
  to_quantity numeric(28,8) not null,
  rate numeric(28,8) not null,
  fee numeric(18,4) not null default 0,
  status varchar(20) not null default 'completed',
  created_at timestamptz not null default now()
);

-- ==========================================
-- Triggers
-- ==========================================
create trigger crypto_orders_updated_at before update on public.crypto_orders for each row execute procedure handle_updated_at();
create trigger crypto_holdings_updated_at before update on public.crypto_holdings for each row execute procedure handle_updated_at();
create trigger crypto_recurring_updated_at before update on public.crypto_recurring_buys for each row execute procedure handle_updated_at();

-- ==========================================
-- RLS
-- ==========================================
alter table public.crypto_orders enable row level security;
alter table public.crypto_holdings enable row level security;
alter table public.crypto_transactions enable row level security;
alter table public.crypto_recurring_buys enable row level security;
alter table public.crypto_swaps enable row level security;

create policy "Users can view own crypto orders" on public.crypto_orders for select using (auth.uid() = user_id);
create policy "Users can view own crypto holdings" on public.crypto_holdings for select using (auth.uid() = user_id);
create policy "Users can view own crypto txns" on public.crypto_transactions for select using (auth.uid() = user_id);
create policy "Users can manage own recurring buys" on public.crypto_recurring_buys for all using (auth.uid() = user_id);
create policy "Users can view own swaps" on public.crypto_swaps for select using (auth.uid() = user_id);

-- Indexes
create index if not exists idx_crypto_orders_user on public.crypto_orders (user_id, status);
create index if not exists idx_crypto_orders_pair on public.crypto_orders (pair, placed_at desc);
create index if not exists idx_crypto_holdings_user on public.crypto_holdings (user_id);
create index if not exists idx_crypto_recurring_next on public.crypto_recurring_buys (next_execution_date) where status = 'active';
