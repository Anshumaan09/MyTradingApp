-- Migration: Crypto Trading Engine
-- Atomic RPC for crypto order processing + missing RLS policies

-- ==========================================
-- process_crypto_order: Atomic crypto buy/sell
-- ==========================================
create or replace function public.process_crypto_order(
    p_user_id uuid,
    p_pair varchar,
    p_side varchar,
    p_order_type varchar,
    p_quantity numeric,
    p_price numeric
)
returns void as $$
declare
    v_wallet_balance numeric(18,4);
    v_base_asset varchar(10);
    v_quote_asset varchar(10);
    v_total_value numeric(28,8);
    v_platform_fee numeric(18,4);
    v_tds numeric(18,4) := 0;
    v_gst numeric(18,4);
    v_total_charges numeric(18,4);
    v_order_id uuid;
    v_holding_id uuid;
    v_current_qty numeric(28,8);
    v_current_avg numeric(28,8);
    v_realized_pnl numeric(28,8) := 0;
begin
    -- Parse pair: 'BTCUSDT' -> base='BTC', quote='USDT'
    v_base_asset := replace(p_pair, 'USDT', '');
    v_quote_asset := 'USDT';

    -- Calculate values
    v_total_value := p_quantity * p_price;
    v_platform_fee := v_total_value * 0.001; -- 0.1% fee
    v_gst := v_platform_fee * 0.18; -- 18% GST on fee

    -- TDS: 1% on sell (Indian crypto tax compliance)
    if p_side = 'SELL' then
        v_tds := v_total_value * 0.01;
    end if;

    v_total_charges := v_platform_fee + v_gst + v_tds;

    -- Get wallet balance
    select balance into v_wallet_balance
    from public.inr_wallet
    where user_id = p_user_id
    for update;

    if not found then
        raise exception 'Wallet not found';
    end if;

    -- For BUY: need enough balance for total + charges
    if p_side = 'BUY' then
        if v_wallet_balance < (v_total_value + v_total_charges) then
            raise exception 'Insufficient funds. Need ₹% but have ₹%',
                (v_total_value + v_total_charges)::numeric(18,2), v_wallet_balance::numeric(18,2);
        end if;
    end if;

    -- For SELL: verify holdings
    if p_side = 'SELL' then
        select id, quantity, avg_buy_price into v_holding_id, v_current_qty, v_current_avg
        from public.crypto_holdings
        where user_id = p_user_id and asset = v_base_asset
        for update;

        if not found or v_current_qty < p_quantity then
            raise exception 'Insufficient crypto holdings';
        end if;
    end if;

    -- Create crypto order
    insert into public.crypto_orders (
        user_id, exchange, pair, base_asset, quote_asset, side,
        order_type, quantity, price, filled_quantity, avg_fill_price,
        status, tds_amount, platform_fee, gst_on_fee, total_charges
    ) values (
        p_user_id, 'binance', p_pair, v_base_asset, v_quote_asset, p_side,
        p_order_type::crypto_order_type, p_quantity, p_price, p_quantity, p_price,
        'filled', v_tds, v_platform_fee, v_gst, v_total_charges
    ) returning id into v_order_id;

    -- Process wallet & holdings
    if p_side = 'BUY' then
        -- Deduct wallet
        update public.inr_wallet
        set balance = balance - (v_total_value + v_total_charges)
        where user_id = p_user_id;

        -- Wallet transaction record
        insert into public.wallet_transactions (
            user_id, wallet_type, type, amount, direction, balance_after, description
        ) values (
            p_user_id, 'INR', 'CRYPTO_BUY', (v_total_value + v_total_charges), 'DEBIT',
            v_wallet_balance - (v_total_value + v_total_charges),
            'BUY ' || p_quantity || ' ' || v_base_asset || ' @ $' || p_price
        );

        -- Upsert crypto holdings
        select id, quantity, avg_buy_price into v_holding_id, v_current_qty, v_current_avg
        from public.crypto_holdings
        where user_id = p_user_id and asset = v_base_asset;

        if found then
            update public.crypto_holdings
            set quantity = quantity + p_quantity,
                avg_buy_price = ((v_current_qty * v_current_avg) + (p_quantity * p_price)) / (v_current_qty + p_quantity),
                total_invested = total_invested + v_total_value
            where id = v_holding_id;
        else
            insert into public.crypto_holdings (
                user_id, asset, quantity, avg_buy_price, total_invested, first_buy_date
            ) values (
                p_user_id, v_base_asset, p_quantity, p_price, v_total_value, current_date
            );
        end if;

    elsif p_side = 'SELL' then
        -- Realized PNL
        v_realized_pnl := (p_price - v_current_avg) * p_quantity;

        -- Credit wallet (sale value minus charges)
        update public.inr_wallet
        set balance = balance + (v_total_value - v_total_charges)
        where user_id = p_user_id;

        -- Wallet transaction
        insert into public.wallet_transactions (
            user_id, wallet_type, type, amount, direction, balance_after, description
        ) values (
            p_user_id, 'INR', 'CRYPTO_SELL', (v_total_value - v_total_charges), 'CREDIT',
            v_wallet_balance + (v_total_value - v_total_charges),
            'SELL ' || p_quantity || ' ' || v_base_asset || ' @ $' || p_price
        );

        -- Update holdings
        if v_current_qty = p_quantity then
            delete from public.crypto_holdings where id = v_holding_id;
        else
            update public.crypto_holdings
            set quantity = quantity - p_quantity,
                total_invested = total_invested - (p_quantity * v_current_avg)
            where id = v_holding_id;
        end if;
    end if;

    -- Record transaction
    insert into public.crypto_transactions (
        user_id, order_id, pair, side, quantity, price, total_value, fee, tds, realised_pnl
    ) values (
        p_user_id, v_order_id, p_pair, p_side, p_quantity, p_price, v_total_value,
        v_platform_fee + v_gst, v_tds, v_realized_pnl
    );

end;
$$ language plpgsql security definer;
