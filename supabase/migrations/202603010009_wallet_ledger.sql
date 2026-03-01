-- Migration: Double-Entry Wallet Ledger & Fund Operations
-- Covers: W-01 (Double-entry ledger), W-02 (Fund lock/unlock)
-- Replaces the simple simulate_fund_transfer with production-grade logic

-- ==========================================
-- W-01: Double-Entry Ledger Transfer Function
-- Every money movement creates TWO entries (debit + credit)
-- ==========================================

create or replace function public.wallet_ledger_transfer(
    p_user_id uuid,
    p_operation varchar,     -- 'deposit', 'withdraw', 'trade_debit', 'trade_credit', 'lock', 'unlock'
    p_amount numeric,
    p_method varchar default null,
    p_reference_id uuid default null,
    p_reference_type varchar default null,
    p_description text default null
)
returns jsonb as $$
declare
    v_wallet record;
    v_new_balance numeric(18,4);
    v_new_locked  numeric(18,4);
    v_direction   varchar(6);
    v_txn_type    varchar(30);
begin
    -- Validate amount
    if p_amount <= 0 then
        raise exception 'Amount must be positive';
    end if;

    -- Lock wallet row for atomic update
    select * into v_wallet
    from public.inr_wallet
    where user_id = p_user_id
    for update;

    if not found then
        raise exception 'Wallet not found for user %', p_user_id;
    end if;

    v_new_balance := v_wallet.balance;
    v_new_locked  := v_wallet.locked_balance;

    -- Process based on operation
    case p_operation
        when 'deposit' then
            v_new_balance := v_wallet.balance + p_amount;
            v_direction := 'CREDIT';
            v_txn_type := 'DEPOSIT';

            update public.inr_wallet set
                balance = v_new_balance,
                total_deposited = total_deposited + p_amount
            where user_id = p_user_id;

        when 'withdraw' then
            if v_wallet.balance - v_wallet.locked_balance < p_amount then
                raise exception 'Insufficient withdrawable balance. Available: %, Requested: %',
                    v_wallet.balance - v_wallet.locked_balance, p_amount;
            end if;

            v_new_balance := v_wallet.balance - p_amount;
            v_direction := 'DEBIT';
            v_txn_type := 'WITHDRAWAL';

            update public.inr_wallet set
                balance = v_new_balance,
                total_withdrawn = total_withdrawn + p_amount
            where user_id = p_user_id;

        when 'lock' then
            -- W-02: Lock funds for pending orders / margin
            if v_wallet.balance - v_wallet.locked_balance < p_amount then
                raise exception 'Insufficient free balance to lock. Free: %, Requested: %',
                    v_wallet.balance - v_wallet.locked_balance, p_amount;
            end if;

            v_new_locked := v_wallet.locked_balance + p_amount;
            v_direction := 'DEBIT';
            v_txn_type := 'FUND_LOCK';

            update public.inr_wallet set
                locked_balance = v_new_locked
            where user_id = p_user_id;

        when 'unlock' then
            -- W-02: Unlock funds (order cancelled / margin release)
            if v_wallet.locked_balance < p_amount then
                raise exception 'Cannot unlock more than locked. Locked: %, Requested: %',
                    v_wallet.locked_balance, p_amount;
            end if;

            v_new_locked := v_wallet.locked_balance - p_amount;
            v_direction := 'CREDIT';
            v_txn_type := 'FUND_UNLOCK';

            update public.inr_wallet set
                locked_balance = v_new_locked
            where user_id = p_user_id;

        when 'trade_debit' then
            -- Deduct from balance (order executed)
            if v_wallet.balance < p_amount then
                raise exception 'Insufficient balance for trade. Available: %, Required: %',
                    v_wallet.balance, p_amount;
            end if;

            v_new_balance := v_wallet.balance - p_amount;
            -- Also reduce locked if it was previously locked
            if v_wallet.locked_balance >= p_amount then
                v_new_locked := v_wallet.locked_balance - p_amount;
            else
                v_new_locked := 0;
            end if;
            v_direction := 'DEBIT';
            v_txn_type := 'TRADE_MARGIN';

            update public.inr_wallet set
                balance = v_new_balance,
                locked_balance = v_new_locked
            where user_id = p_user_id;

        when 'trade_credit' then
            -- Credit from trade (sell proceeds)
            v_new_balance := v_wallet.balance + p_amount;
            v_direction := 'CREDIT';
            v_txn_type := 'TRADE_CREDIT';

            update public.inr_wallet set
                balance = v_new_balance
            where user_id = p_user_id;

        else
            raise exception 'Invalid operation: %', p_operation;
    end case;

    -- Record double-entry ledger transaction
    insert into public.wallet_transactions (
        user_id, wallet_type, type, amount, direction,
        balance_after, reference_id, reference_type, description
    ) values (
        p_user_id, 'INR', v_txn_type, p_amount, v_direction,
        v_new_balance, p_reference_id, p_reference_type,
        coalesce(p_description, p_operation || ' via ' || coalesce(p_method, 'system'))
    );

    -- Return updated wallet state
    return jsonb_build_object(
        'success', true,
        'balance', v_new_balance,
        'locked_balance', v_new_locked,
        'free_balance', v_new_balance - v_new_locked,
        'txn_type', v_txn_type,
        'direction', v_direction,
        'amount', p_amount
    );
end;
$$ language plpgsql security definer;


-- ==========================================
-- W-03: Crypto Wallet Operations
-- ==========================================

create or replace function public.crypto_wallet_transfer(
    p_user_id uuid,
    p_asset varchar,
    p_operation varchar,  -- 'credit', 'debit', 'lock', 'unlock'
    p_amount numeric
)
returns jsonb as $$
declare
    v_wallet record;
    v_new_balance numeric(28,8);
begin
    if p_amount <= 0 then
        raise exception 'Amount must be positive';
    end if;

    -- Get or create crypto wallet for this asset
    select * into v_wallet
    from public.crypto_wallet
    where user_id = p_user_id and asset = p_asset
    for update;

    if not found then
        insert into public.crypto_wallet (user_id, asset, balance, locked_balance, staked_balance)
        values (p_user_id, p_asset, 0, 0, 0)
        returning * into v_wallet;
    end if;

    case p_operation
        when 'credit' then
            update public.crypto_wallet set balance = balance + p_amount
            where user_id = p_user_id and asset = p_asset;
            v_new_balance := v_wallet.balance + p_amount;

        when 'debit' then
            if v_wallet.balance - v_wallet.locked_balance < p_amount then
                raise exception 'Insufficient % balance', p_asset;
            end if;
            update public.crypto_wallet set balance = balance - p_amount
            where user_id = p_user_id and asset = p_asset;
            v_new_balance := v_wallet.balance - p_amount;

        when 'lock' then
            if v_wallet.balance - v_wallet.locked_balance < p_amount then
                raise exception 'Insufficient free % to lock', p_asset;
            end if;
            update public.crypto_wallet set locked_balance = locked_balance + p_amount
            where user_id = p_user_id and asset = p_asset;
            v_new_balance := v_wallet.balance;

        when 'unlock' then
            update public.crypto_wallet set locked_balance = greatest(0, locked_balance - p_amount)
            where user_id = p_user_id and asset = p_asset;
            v_new_balance := v_wallet.balance;

        else
            raise exception 'Invalid crypto operation: %', p_operation;
    end case;

    -- Ledger entry
    insert into public.wallet_transactions (
        user_id, wallet_type, asset, type, amount, direction,
        balance_after, description
    ) values (
        p_user_id, 'CRYPTO', p_asset, upper(p_operation), p_amount,
        case when p_operation in ('credit', 'unlock') then 'CREDIT' else 'DEBIT' end,
        v_new_balance, p_operation || ' ' || p_amount || ' ' || p_asset
    );

    return jsonb_build_object('success', true, 'asset', p_asset, 'balance', v_new_balance);
end;
$$ language plpgsql security definer;
