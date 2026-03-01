-- Migration: Market Data Tables
-- Covers: S-10 (013_timescaledb.sql)
-- Note: TimescaleDB extension may not be available on all Supabase plans.
-- These tables use standard PostgreSQL with partitioning-ready design.
-- If TimescaleDB is available, convert to hypertables with the commented commands.

-- ==========================================
-- Market Ticks (Real-time price data)
-- ==========================================
create table public.market_ticks (
  id bigint generated always as identity primary key,
  symbol varchar(30) not null,
  exchange varchar(10) not null,
  ltp numeric(18,4) not null, -- last traded price
  open numeric(18,4),
  high numeric(18,4),
  low numeric(18,4),
  close numeric(18,4),
  volume bigint,
  oi bigint, -- open interest (for F&O)
  bid numeric(18,4),
  ask numeric(18,4),
  bid_qty int,
  ask_qty int,
  tick_timestamp timestamptz not null default now()
);

-- ==========================================
-- OHLCV Candles (1-minute aggregation base)
-- ==========================================
create table public.ohlcv_1m (
  symbol varchar(30) not null,
  exchange varchar(10) not null,
  bucket timestamptz not null, -- start of the 1-minute bucket
  open numeric(18,4) not null,
  high numeric(18,4) not null,
  low numeric(18,4) not null,
  close numeric(18,4) not null,
  volume bigint not null default 0,
  trade_count int not null default 0,
  vwap numeric(18,4), -- volume weighted average price
  primary key (symbol, exchange, bucket)
);

-- ==========================================
-- OHLCV Daily (for charts, screeners)
-- ==========================================
create table public.ohlcv_daily (
  symbol varchar(30) not null,
  exchange varchar(10) not null,
  trade_date date not null,
  open numeric(18,4) not null,
  high numeric(18,4) not null,
  low numeric(18,4) not null,
  close numeric(18,4) not null,
  adj_close numeric(18,4), -- adjusted for splits/dividends
  volume bigint not null default 0,
  delivery_qty bigint,
  delivery_percent numeric(6,2),
  prev_close numeric(18,4),
  change_percent numeric(8,4),
  primary key (symbol, exchange, trade_date)
);

-- ==========================================
-- Instrument Master
-- ==========================================
create table public.instruments (
  id bigint generated always as identity primary key,
  exchange varchar(10) not null,
  symbol varchar(30) not null,
  trading_symbol varchar(50) not null,
  instrument_token bigint,
  isin varchar(12),
  name varchar(200) not null,
  segment varchar(20) not null, -- 'EQ', 'FO', 'CDS', 'MCX', 'CRYPTO'
  instrument_type varchar(20) not null, -- 'stock', 'index', 'future', 'option', 'etf', 'crypto'
  lot_size int not null default 1,
  tick_size numeric(8,4) not null default 0.05,
  expiry date,
  strike numeric(18,4),
  option_type varchar(2), -- 'CE', 'PE'
  market_cap_category varchar(10), -- 'large', 'mid', 'small'
  sector varchar(100),
  industry varchar(200),
  is_active boolean not null default true,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique(exchange, trading_symbol)
);

-- ==========================================
-- Indexes for Market Data
-- ==========================================
create index if not exists idx_ticks_symbol_ts on public.market_ticks (symbol, tick_timestamp desc);
create index if not exists idx_ohlcv_1m_symbol on public.ohlcv_1m (symbol, bucket desc);
create index if not exists idx_ohlcv_daily_symbol on public.ohlcv_daily (symbol, trade_date desc);
create index if not exists idx_instruments_symbol on public.instruments (exchange, symbol);
create index if not exists idx_instruments_segment on public.instruments (segment, is_active);
create index if not exists idx_instruments_sector on public.instruments (sector) where sector is not null;

-- ==========================================
-- TimescaleDB Conversion (run manually if extension is available)
-- ==========================================
-- SELECT create_hypertable('market_ticks', 'tick_timestamp');
-- SELECT create_hypertable('ohlcv_1m', 'bucket');
-- SELECT add_retention_policy('market_ticks', INTERVAL '7 days');
-- SELECT add_retention_policy('ohlcv_1m', INTERVAL '90 days');
