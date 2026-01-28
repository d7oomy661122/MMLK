
-- 1. RPC: Get Available Tasks
-- يجلب المهام المناسبة لمستوى المستخدم وحالتها خلال آخر 24 ساعة
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
  u_vip_level int;
BEGIN
  -- التحقق من المستخدم
  IF auth.uid() IS NULL OR p_user_id != auth.uid() THEN 
    RETURN; 
  END IF;

  -- الحصول على مستوى المستخدم الحالي (مع اعتبار 0 كقيمة افتراضية)
  SELECT COALESCE(users.vip_level, 0) INTO u_vip_level
  FROM public.users 
  WHERE users.id = p_user_id;

  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.landing_url,
    t.duration_seconds,
    t.reward,
    t.vip_level,
    -- تنسيق العرض للمستوى
    CASE WHEN t.vip_level = 0 THEN 'Intern' ELSE 'VIP ' || t.vip_level END,
    t.is_active,
    -- التحقق هل تم إنجاز المهمة في آخر 24 ساعة
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
    -- الفلتر الأساسي: المستخدم يرى المهام التي مستواها أقل من أو يساوي مستواه
    AND t.vip_level <= u_vip_level
  ORDER BY 
    t.vip_level DESC, 
    t.reward DESC;
END;
$$;


-- 2. RPC: Check Eligibility (Gatekeeper)
-- هذه الدالة هي الحكم قبل فتح أي مهمة
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
  u_vip_level int;
  u_intern_start timestamptz;
  u_created_at timestamptz;
  
  t_vip_level int;
  last_completion timestamptz;
BEGIN
  -- التحقق من هوية المستخدم
  IF auth.uid() != p_user_id THEN
    RETURN QUERY SELECT false, 'Unauthorized'::text; RETURN;
  END IF;

  -- جلب بيانات المستخدم
  SELECT vip_level, intern_started_at, created_at
  INTO u_vip_level, u_intern_start, u_created_at
  FROM public.users WHERE id = p_user_id;
  
  u_vip_level := COALESCE(u_vip_level, 0);

  -- جلب بيانات المهمة
  SELECT vip_level INTO t_vip_level FROM public.tasks WHERE id = p_task_id;
  IF NOT FOUND THEN
     RETURN QUERY SELECT false, 'المهمة غير موجودة'::text; RETURN;
  END IF;

  -- الشرط 1: مدة Intern (4 أيام)
  IF u_vip_level = 0 THEN
      -- نعتمد على intern_started_at، وإذا كانت فارغة نعود لـ created_at
      IF NOW() > (COALESCE(u_intern_start, u_created_at) + INTERVAL '4 days') THEN
          RETURN QUERY SELECT false, 'انتهت فترة التجربة المجانية (Intern). يرجى شراء VIP للاستمرار.'::text; RETURN;
      END IF;
  END IF;

  -- الشرط 2: مستوى المستخدم كافٍ للمهمة
  IF u_vip_level < t_vip_level THEN
     RETURN QUERY SELECT false, 'مستواك الحالي أقل من المستوى المطلوب لهذه المهمة.'::text; RETURN;
  END IF;

  -- الشرط 3: عدم التكرار خلال 24 ساعة
  SELECT MAX(completed_at) INTO last_completion
  FROM public.task_completions 
  WHERE task_id = p_task_id AND user_id = p_user_id;

  IF last_completion IS NOT NULL AND last_completion > (NOW() - INTERVAL '24 hours') THEN
      RETURN QUERY SELECT false, 'لقد أنجزت هذه المهمة مؤخراً. حاول مرة أخرى بعد 24 ساعة.'::text; RETURN;
  END IF;

  -- إذا نجح في كل الشروط
  RETURN QUERY SELECT true, NULL::text;
END;
$$;


-- 3. RPC: Complete Task & Reward
-- تنفيذ العملية المالية وتسجيل الإنجاز
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
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Login required'; END IF;

  -- إعادة التحقق للأمان (Security Layer)
  SELECT allowed, reason INTO v_allowed, v_reason
  FROM public.check_task_eligibility(v_user_id, p_task_id);
  
  IF v_allowed = false THEN
     RAISE EXCEPTION '%', v_reason;
  END IF;

  -- جلب قيمة المكافأة
  SELECT reward INTO v_reward FROM public.tasks WHERE id = p_task_id;

  -- تسجيل الإنجاز
  INSERT INTO public.task_completions (user_id, task_id, earned_amount, completed_at)
  VALUES (v_user_id, p_task_id, v_reward, NOW());

  -- تحديث رصيد المستخدم
  UPDATE public.users
  SET balance = balance + v_reward
  WHERE id = v_user_id
  RETURNING balance INTO v_new_balance;

  RETURN json_build_object(
    'success', true, 
    'reward', v_reward, 
    'new_balance', v_new_balance
  );
END;
$$;
