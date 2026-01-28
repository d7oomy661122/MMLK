
-- 1. REFERRAL & DEFAULT SETUP TRIGGER FUNCTION
-- Corrected to use 'referral_by' and avoid 'referrer_id' errors
create or replace function public.handle_new_user_referral()
returns trigger
language plpgsql
security definer
as $$
begin
  -- 1. Enforce System Defaults
  NEW.vip_level := COALESCE(NEW.vip_level, 0); 
  NEW.intern_started_at := NOW();

  -- 2. Handle Referral Logic (Using correct column referral_by)
  if new.referral_by is not null then
    update public.users
    set referral_count = referral_count + 1
    where id = new.referral_by;
  end if;
  
  return new;
end;
$$;

-- 2. APPLY TRIGGER
drop trigger if exists on_auth_user_created_referral on public.users;
create trigger on_auth_user_created_referral
  before insert on public.users
  for each row execute procedure public.handle_new_user_referral();

-- 3. ENABLE RLS
alter table public.users enable row level security;

-- 4. HELPER FUNCTION
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer;

-- 5. POLICIES (No changes needed here, but kept for completeness)
-- ... (Existing policies logic assumed retained or managed via dashboard)
