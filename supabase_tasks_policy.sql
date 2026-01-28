
-- 1. Enable RLS on tables
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;

-- 2. Tasks Policies
-- Drop old policies to avoid conflicts
DROP POLICY IF EXISTS "Admin full access" ON public.tasks;
DROP POLICY IF EXISTS "Users view active tasks" ON public.tasks;

-- Admin can do everything
CREATE POLICY "Admin full access" ON public.tasks FOR ALL 
USING (public.is_admin());

-- Users: CANNOT SELECT DIRECTLY for business logic (Logic is hidden in RPC)
-- However, if you need to show "All Tasks" for marketing, you might allow SELECT.
-- Based on requirements: "No SELECT direct from tasks for logic".
-- We will allow SELECT only for authenticated users to VIEW tasks, 
-- but the logic for *availability* is strictly in the RPC.
CREATE POLICY "Users can view tasks" ON public.tasks FOR SELECT 
USING (true); 


-- 3. Task Completions Policies
-- Drop old policies
DROP POLICY IF EXISTS "Admin full access completions" ON public.task_completions;
DROP POLICY IF EXISTS "Users can view their own task completions" ON public.task_completions;
DROP POLICY IF EXISTS "Users can insert task completions logic" ON public.task_completions;

-- Admin Access
CREATE POLICY "Admin full access completions" ON public.task_completions FOR ALL 
USING (public.is_admin());

-- READ Policy: Users can see their own history
CREATE POLICY "Users can view their own task completions"
ON public.task_completions FOR SELECT
USING (auth.uid() = user_id);

-- INSERT Policy: BLOCKED
-- We DO NOT create an INSERT policy for users.
-- This forces the frontend to use `complete_task_secure` RPC.
-- If the frontend tries `supabase.from('task_completions').insert(...)`, it will fail with permission denied.
