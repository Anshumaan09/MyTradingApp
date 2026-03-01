-- Migration: Trading Engine & Order Processing Logic
-- Description: PL/pgSQL function to handle atomic order placement, margin checking, wallet deductions, and holding updates.

create or replace function public.process_order(
    p_user_id uuid,
    p_symbol varchar,
    p_order_type varchar,
    p_side varchar,
    p_quantity numeric,
    p_price numeric,
    p_leverage int
)
returns void as $$
declare
    v_wallet_balance numeric(18,4);
    v_required_margin numeric(18,4);
    v_order_id uuid;
    v_holding_id uuid;
    v_current_qty int;
    v_current_avg numeric(18,4);
    v_new_avg numeric(18,4);
    v_realized_pnl numeric(18,4) := 0;
begin
    -- 1. Get Wallet Balance (Lock row for update to prevent concurrent race conditions)
    select balance into v_wallet_balance
    from public.inr_wallet
    where user_id = p_user_id
    for update;

    if not found then
        raise exception 'Wallet not found for user';
    end if;

    -- 2. Calculate Required Margin
    -- Note: For simplicity, assuming price submitted is the execution price (mocking a market order fill).
    v_required_margin := (p_quantity * p_price) / p_leverage;

    -- 3. Pre-Trade Risk Check
    if p_side = 'BUY' and v_wallet_balance < v_required_margin then
        raise exception 'Insufficient margin. Required: % Available: %', v_required_margin, v_wallet_balance;
    end if;

    -- For SELL, verify we have the holding (unless shorting is allowed, which we'll block here for spot)
    if p_side = 'SELL' then
        select id, quantity, avg_buy_price into v_holding_id, v_current_qty, v_current_avg
        from public.holdings
        where user_id = p_user_id and symbol = p_symbol
        for update;

        if not found or v_current_qty < p_quantity then
            raise exception 'Insufficient holdings to execute SELL order.';
        end if;
    end if;

    -- 4. Create Order Entry
    insert into public.orders (
        user_id, exchange, segment, symbol, order_type, product_type, transaction_type, quantity, price, filled_quantity, avg_price, status, request_id
    ) values (
        p_user_id, 'MOCK', 'EQ', p_symbol, p_order_type, 'MIS', p_side, p_quantity, p_price, p_quantity, p_price, 'complete', gen_random_uuid()
    ) returning id into v_order_id;

    -- 5. Process Ledger & Portfolio
    if p_side = 'BUY' then
        -- Deduct Wallet
        update public.inr_wallet
        set balance = balance - v_required_margin
        where user_id = p_user_id;

        -- Record Wallet Transaction
        insert into public.wallet_transactions (
            user_id, wallet_type, type, amount, direction, balance_after, description
        ) values (
            p_user_id, 'INR', 'TRADE_MARGIN', v_required_margin, 'DEBIT', v_wallet_balance - v_required_margin, 'Margin blocked for BUY ' || p_symbol
        );

        -- Update Holdings
        select id, quantity, avg_buy_price into v_holding_id, v_current_qty, v_current_avg
        from public.holdings
        where user_id = p_user_id and symbol = p_symbol
        for update;

        if found then
            -- Recalculate Average Cost (Weighted Average)
            v_new_avg := ((v_current_qty * v_current_avg) + (p_quantity * p_price)) / (v_current_qty + p_quantity);
            
            update public.holdings
            set quantity = quantity + p_quantity,
                avg_buy_price = v_new_avg,
                total_invested = total_invested + (p_quantity * p_price)
            where id = v_holding_id;
        else
            insert into public.holdings (
                user_id, exchange, symbol, quantity, avg_buy_price, total_invested, product_type, first_buy_date
            ) values (
                p_user_id, 'MOCK', p_symbol, p_quantity, p_price, (p_quantity * p_price), 'MIS', current_date
            );
        end if;

    elsif p_side = 'SELL' then
        -- Calculate Realized PNL
        v_realized_pnl := (p_price - v_current_avg) * p_quantity;

        -- Credit Wallet (Returning Margin + Realized PNL)
        -- Margin to return = (Quantity * AvgPrice) / Leverage. Assuming leverage=1 for returning funds on closing, or just credit the full sale value if it's spot.
        -- We will credit the full sale value for simple Spot logic.
        update public.inr_wallet
        set balance = balance + (p_quantity * p_price)
        where user_id = p_user_id;

        -- Record Wallet Transaction
        insert into public.wallet_transactions (
            user_id, wallet_type, type, amount, direction, balance_after, description
        ) values (
            p_user_id, 'INR', 'TRADE_CREDIT', (p_quantity * p_price), 'CREDIT', v_wallet_balance + (p_quantity * p_price), 'Funds credited for SELL ' || p_symbol
        );

        -- Update Holdings
        if v_current_qty = p_quantity then
            delete from public.holdings where id = v_holding_id;
        else
            update public.holdings
            set quantity = quantity - p_quantity,
                total_invested = total_invested - (p_quantity * v_current_avg)
            where id = v_holding_id;
        end if;
    end if;

    -- 6. Insert Transaction Record (Trade Book)
    insert into public.transactions (
        user_id, order_id, symbol, segment, transaction_type, quantity, price, total_value, charges, trade_date, settlement_type, realised_pnl
    ) values (
        p_user_id, v_order_id, p_symbol, 'EQ', p_side, p_quantity, p_price, (p_quantity * p_price), 0, current_date, 'T+1', v_realized_pnl
    );

end;
$$ language plpgsql security definer;
