-- Migration: Fix missing RLS policies for transactions, holdings delete, portfolio snapshots
-- The transactions table had RLS enabled but no SELECT policy, so users couldn't read their own trades.

-- 1. Allow users to view their own transactions (trade book)
create policy "Users can view own transactions"
    on public.transactions for select
    using (auth.uid() = user_id);

-- 2. Allow users to view own bank accounts
create policy "Users can view own bank accounts"
    on public.bank_accounts for select
    using (auth.uid() = user_id);

-- 3. Allow users to view own KYC documents
create policy "Users can view own kyc"
    on public.kyc_documents for select
    using (auth.uid() = user_id);

-- 4. Allow users to view own GTT orders
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'gtt_orders' AND policyname = 'Users can view own gtt orders'
    ) THEN
        EXECUTE 'create policy "Users can view own gtt orders" on public.gtt_orders for select using (auth.uid() = user_id)';
    END IF;
END $$;
