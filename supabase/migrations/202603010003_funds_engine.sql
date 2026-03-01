-- Migration: Simulate Fund Transfers
-- Description: PL/pgSQL function to mock deposits and withdrawals with ledger tracking.

create or replace function public.simulate_fund_transfer(
    p_user_id uuid,
    p_operation varchar, -- 'deposit' or 'withdraw'
    p_amount numeric,
    p_method varchar
)
returns void as $$
declare
    v_current_balance numeric(18,4);
    v_new_balance numeric(18,4);
    v_direction varchar(6);
begin
    -- Lock wallet row
    select balance into v_current_balance
    from public.inr_wallet
    where user_id = p_user_id
    for update;

    if not found then
        raise exception 'Wallet not found for user';
    end if;

    if p_operation = 'deposit' then
        v_new_balance := v_current_balance + p_amount;
        v_direction := 'CREDIT';
        
        update public.inr_wallet
        set balance = v_new_balance,
            total_deposited = total_deposited + p_amount
        where user_id = p_user_id;

    elsif p_operation = 'withdraw' then
        if v_current_balance < p_amount then
            raise exception 'Insufficient withdrawable balance. Available: %', v_current_balance;
        end if;

        v_new_balance := v_current_balance - p_amount;
        v_direction := 'DEBIT';

        update public.inr_wallet
        set balance = v_new_balance,
            total_withdrawn = total_withdrawn + p_amount
        where user_id = p_user_id;
    else
        raise exception 'Invalid operation. Use deposit or withdraw.';
    end if;

    -- Record transaction
    insert into public.wallet_transactions (
        user_id, wallet_type, type, amount, direction, balance_after, description
    ) values (
        p_user_id, 'INR', upper(p_operation), p_amount, v_direction, v_new_balance, p_method || ' Transfer'
    );

end;
$$ language plpgsql security definer;
