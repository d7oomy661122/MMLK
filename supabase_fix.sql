
-- IMPORTANT: Run this SQL in your Supabase SQL Editor to fix the database schema issues

-- 1. Remove the old default value if it exists
ALTER TABLE public.users ALTER COLUMN vip_level DROP DEFAULT;

-- 2. Set the default value to 0 (Intern) instead of 'Intern' string
ALTER TABLE public.users ALTER COLUMN vip_level SET DEFAULT 0;

-- 3. (Optional) If you have existing rows with 'Intern' text (and the column is somehow text type but causing casting errors), 
-- you would need to convert them. Since the error says "invalid input syntax for type integer", it implies the column IS integer.
-- This command ensures triggers use 0.

-- 4. Update Trigger Function to use 0 instead of 'Intern' if specifically coded
CREATE OR REPLACE FUNCTION public.handle_new_user_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
begin
  -- Ensure new users get 0 if not provided (though Default handles this)
  if new.vip_level is null then
     new.vip_level := 0;
  end if;

  if new.referral_by is not null then
    update public.users
    set referral_count = referral_count + 1
    where id = new.referral_by;
  end if;
  return new;
end;
$$;
