-- Migration: Notifications System (idempotent)
-- Adds trigger for auto-notifications on order completion

-- Table already exists from initial schema, ensure it's there
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  type varchar(30) not null default 'info',
  title varchar(200) not null,
  message text not null,
  action_url varchar(200),
  is_read boolean not null default false,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

-- RLS (skip if already enabled/exists)
alter table public.notifications enable row level security;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can view own notifications') THEN
    CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can update own notifications') THEN
    CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Index (skip if exists)
create index if not exists idx_notifications_user_unread on public.notifications (user_id, is_read, created_at desc);

-- Trigger: Auto-create notification when order completes
create or replace function public.notify_on_order_complete()
returns trigger as $$
begin
  if NEW.status = 'complete' and (OLD.status is null or OLD.status != 'complete') then
    insert into public.notifications (user_id, type, title, message, action_url)
    values (
      NEW.user_id,
      'trade',
      NEW.transaction_type || ' ' || NEW.symbol || ' — Completed',
      NEW.transaction_type || ' ' || NEW.quantity || ' ' || NEW.symbol || ' @ ₹' || NEW.price || ' executed successfully.',
      '/orders'
    );
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

-- Create trigger only if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_notify_order_complete') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders' AND table_schema = 'public') THEN
      EXECUTE 'CREATE TRIGGER trigger_notify_order_complete AFTER INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.notify_on_order_complete()';
    END IF;
  END IF;
END $$;
