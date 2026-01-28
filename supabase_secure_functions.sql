
-- 🛑 HARD RESET: Drop functions with CASCADE to remove all dependencies/conflicts
DROP FUNCTION IF EXISTS public.get_available_tasks(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.check_task_eligibility(uuid, bigint) CASCADE;
DROP FUNCTION IF EXISTS public.complete_task_secure(bigint) CASCADE;
DROP FUNCTION IF EXISTS public.purchase_vip_level(uuid, bigint) CASCADE;

-- 1. RPC: Get Available Tasks (Strict Filtering)
CREATE OR REPLACE FUNCTION public.get_available_tasks(p_user_id uuid)
RETURNS TABLE (
  id bigint,
  title text,
  landing_url text,
  duration_seconds int,
  reward numeric,
  vip_level int,
  display_level text,
  is_active boolean,
  is_completed_today boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_u_vip_level int;
  v_u_intern_start timestamptz;
  v_u_created_at timestamptz;
  v_is_intern_expired boolean := false;
BEGIN
  -- Security Check
  IF auth.uid() IS NULL OR p_user_id != auth.uid() THEN 
    RETURN; 
  END IF;

  -- Get User Info (Aliased to avoid ambiguity)
  SELECT 
    u.vip_level, u.intern_started_at, u.created_at 
  INTO 
    v_u_vip_level, v_u_intern_start, v_u_created_at
  FROM public.users u
  WHERE u.id = p_user_id;

  v_u_vip_level := COALESCE(v_u_vip_level, 0);

  -- Check Intern Expiry
  IF v_u_vip_level = 0 THEN
      -- Use intern_started_at, fallback to created_at
      IF NOW() > (COALESCE(v_u_intern_start, v_u_created_at) + INTERVAL '4 days') THEN
          v_is_intern_expired := true;
      END IF;
  END IF;

  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.landing_url,
    t.duration_seconds,
    t.reward,
    t.vip_level,
    (CASE WHEN t.vip_level = 0 THEN 'Intern' ELSE 'VIP ' || t.vip_level END)::text as display_level,
    t.is_active,
    -- Check completion in last 24h
    EXISTS (
        SELECT 1 FROM public.task_completions tc
        WHERE tc.task_id = t.id 
        AND tc.user_id = p_user_id
        AND tc.completed_at > (NOW() - INTERVAL '24 hours')
    ) as is_completed_today,
    t.created_at
  FROM public.tasks t
  WHERE 
    t.is_active = true
    AND (
        -- Scenario A: User is VIP -> Show only exact level match
        (v_u_vip_level > 0 AND t.vip_level = v_u_vip_level)
        OR
        -- Scenario B: User is Intern -> Show Level 0 ONLY IF not expired
        (v_u_vip_level = 0 AND t.vip_level = 0 AND v_is_intern_expired = false)
    )
  ORDER BY t.reward DESC, t.id ASC;
END;
$$;


-- 2. RPC: Check Eligibility (Gatekeeper)
CREATE OR REPLACE FUNCTION public.check_task_eligibility(
  p_user_id uuid,
  p_task_id bigint
)
RETURNS TABLE (
  allowed boolean,
  reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_u_vip_level int;
  v_u_intern_start timestamptz;
  v_u_created_at timestamptz;
  v_t_vip_level int;
  v_last_completion timestamptz;
BEGIN
  IF auth.uid() != p_user_id THEN
    RETURN QUERY SELECT false, 'غير مصرح لك'::text; RETURN;
  END IF;

  -- 1. Get User Data
  SELECT u.vip_level, u.intern_started_at, u.created_at
  INTO v_u_vip_level, v_u_intern_start, v_u_created_at
  FROM public.users u WHERE u.id = p_user_id;
  
  v_u_vip_level := COALESCE(v_u_vip_level, 0);

  -- 2. Get Task Data
  SELECT t.vip_level INTO v_t_vip_level FROM public.tasks t WHERE t.id = p_task_id;
  IF NOT FOUND THEN
     RETURN QUERY SELECT false, 'المهمة غير موجودة'::text; RETURN;
  END IF;

  -- 3. Check Intern Expiry
  IF v_u_vip_level = 0 THEN
      IF NOW() > (COALESCE(v_u_intern_start, v_u_created_at) + INTERVAL '4 days') THEN
          RETURN QUERY SELECT false, 'انتهت فترة التجربة المجانية. يرجى الترقية.'::text; RETURN;
      END IF;
  END IF;

  -- 4. Check Level Match
  IF v_u_vip_level < v_t_vip_level THEN
     RETURN QUERY SELECT false, 'يجب ترقية مستواك لإنجاز هذه المهمة.'::text; RETURN;
  END IF;

  -- 5. Check 24h Cooldown
  SELECT MAX(tc.completed_at) INTO v_last_completion
  FROM public.task_completions tc
  WHERE tc.task_id = p_task_id AND tc.user_id = p_user_id;

  IF v_last_completion IS NOT NULL AND v_last_completion > (NOW() - INTERVAL '24 hours') THEN
      RETURN QUERY SELECT false, 'تم إنجاز المهمة مؤخراً. حاول غداً.'::text; RETURN;
  END IF;

  RETURN QUERY SELECT true, NULL::text;
END;
$$;


-- 3. RPC: Complete Task (Transactional)
CREATE OR REPLACE FUNCTION public.complete_task_secure(
  p_task_id bigint
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_allowed boolean;
  v_reason text;
  v_reward numeric;
  v_new_balance numeric;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN 
     RETURN json_build_object('success', false, 'code', 'AUTH', 'message', 'يجب تسجيل الدخول');
  END IF;

  -- A. Validate
  SELECT allowed, reason INTO v_allowed, v_reason
  FROM public.check_task_eligibility(v_user_id, p_task_id);
  
  IF v_allowed = false THEN
     RETURN json_build_object('success', false, 'code', 'ELIGIBILITY', 'message', v_reason);
  END IF;

  SELECT reward INTO v_reward FROM public.tasks WHERE id = p_task_id;

  -- B. Execute (Insert + Update)
  INSERT INTO public.task_completions (user_id, task_id, earned_amount, completed_at)
  VALUES (v_user_id, p_task_id, v_reward, NOW());

  UPDATE public.users
  SET balance = balance + v_reward
  WHERE id = v_user_id
  RETURNING balance INTO v_new_balance;

  RETURN json_build_object(
    'success', true, 
    'message', 'تم استلام المكافأة بنجاح',
    'reward', v_reward, 
    'new_balance', v_new_balance
  );
END;
$$;


-- 4. RPC: Purchase VIP (Atomic, No Re-buy)
CREATE OR REPLACE FUNCTION public.purchase_vip_level(
  p_user_id uuid,
  p_vip_level_id bigint
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_balance numeric;
  v_user_current_rank int;
  v_plan_price numeric;
  v_plan_level int;
  v_plan_name text;
BEGIN
  IF auth.uid() != p_user_id THEN 
    RETURN json_build_object('success', false, 'code', 'AUTH', 'message', 'عملية غير مصرح بها'); 
  END IF;

  -- A. Lock User Row for Update
  SELECT u.balance, u.vip_level 
  INTO v_user_balance, v_user_current_rank
  FROM public.users u
  WHERE u.id = p_user_id 
  FOR UPDATE;
  
  v_user_current_rank := COALESCE(v_user_current_rank, 0);

  -- B. Get Plan Info
  SELECT v.price, v.level, v.name 
  INTO v_plan_price, v_plan_level, v_plan_name
  FROM public.vip_levels v 
  WHERE v.id = p_vip_level_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'code', 'NOT_FOUND', 'message', 'باقة VIP غير موجودة');
  END IF;

  -- C. STRICT Rules
  IF v_plan_level = 0 THEN
    RETURN json_build_object('success', false, 'code', 'INVALID_PLAN', 'message', 'المستوى المجاني متاح تلقائياً');
  END IF;

  IF v_plan_level <= v_user_current_rank THEN
     RETURN json_build_object('success', false, 'code', 'ALREADY_OWNED', 'message', 'أنت بالفعل في هذا المستوى أو مستوى أعلى');
  END IF;

  IF v_user_balance < v_plan_price THEN
    RETURN json_build_object('success', false, 'code', 'INSUFFICIENT_BALANCE', 'message', 'رصيدك غير كافٍ لإتمام العملية');
  END IF;

  -- D. Execution
  UPDATE public.users
  SET 
    balance = balance - v_plan_price, 
    vip_level = v_plan_level, 
    vip_joined_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO public.vip_purchases (user_id, vip_level_id, amount_paid, purchased_at)
  VALUES (p_user_id, p_vip_level_id, v_plan_price, NOW());

  RETURN json_build_object(
    'success', true,
    'message', 'تم تفعيل العضوية بنجاح',
    'new_balance', (v_user_balance - v_plan_price),
    'new_vip_level', v_plan_level
  );
END;
$$;
