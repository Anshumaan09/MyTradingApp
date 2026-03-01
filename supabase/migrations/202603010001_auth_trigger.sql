-- 202603010001_auth_trigger.sql
-- Create a trigger function to handle new user signups and sync them to public.users

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, phone, referral_code)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'Unknown User'),
    coalesce(new.raw_user_meta_data->>'phone', substring(md5(new.id::text) from 1 for 15)),
    substring(md5(new.id::text) from 1 for 8)
  );
  
  -- Create a default INR wallet with demo money 
  insert into public.inr_wallet (user_id, balance)
  values (new.id, 100000.00); 

  -- Create default user preferences
  insert into public.user_preferences (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Trigger the function every time a user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
