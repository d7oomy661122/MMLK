-- 1. Enable RLS on withdrawals table (if not already enabled)
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- 2. Drop insecure policies (that only checked for user_id)
DROP POLICY IF EXISTS "Users can insert their own withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Users can view their own withdrawals" ON public.withdrawals;

-- 3. Create READ Policy (Allowed for everyone to see their own history)
CREATE POLICY "Users can view their own withdrawals"
ON public.withdrawals FOR SELECT
USING (auth.uid() = user_id);

-- 4. Create STRICT INSERT Policy (Blocks 'Intern')
CREATE POLICY "Users can insert withdrawals only if VIP"
ON public.withdrawals FOR INSERT
WITH CHECK (
  -- Check 1: User is inserting for themselves
  auth.uid() = user_id
  AND 
  -- Check 2: Check profile status in users table
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND vip_level != 'Intern' -- STRICT BLOCK: Interns cannot pass this
  )
);