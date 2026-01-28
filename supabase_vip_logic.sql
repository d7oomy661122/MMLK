
-- RPC: Purchase VIP Level (Atomic & Secure)
CREATE OR REPLACE FUNCTION public.purchase_vip_level(
  p_user_id uuid,
  p_vip_level_id bigint
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- يعمل بصلاحيات الأدمن لتجاوز RLS عند الكتابة
AS $$
DECLARE
  v_user_balance numeric;
  v_user_current_rank int;
  
  v_plan_price numeric;
  v_plan_level int;
  v_plan_name text;
BEGIN
  -- 1. التحقق من الهوية (Security Check)
  IF auth.uid() != p_user_id THEN 
    RAISE EXCEPTION 'Unauthorized transaction'; 
  END IF;

  -- 2. قفل سجل المستخدم وتحديث البيانات (Lock Row)
  SELECT balance, vip_level 
  INTO v_user_balance, v_user_current_rank
  FROM public.users
  WHERE id = p_user_id
  FOR UPDATE;

  v_user_current_rank := COALESCE(v_user_current_rank, 0);

  -- 3. جلب تفاصيل الباقة
  SELECT price, level, name
  INTO v_plan_price, v_plan_level, v_plan_name
  FROM public.vip_levels
  WHERE id = p_vip_level_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'باقة VIP غير موجودة';
  END IF;

  -- 4. قواعد التحقق (Business Logic)
  
  -- أ: منع شراء Intern
  IF v_plan_level = 0 THEN
    RAISE EXCEPTION 'المستوى المجاني متاح تلقائياً للجميع.';
  END IF;

  -- ب: التحقق من الرصيد
  IF v_user_balance < v_plan_price THEN
    RAISE EXCEPTION 'رصيدك غير كافٍ لإتمام عملية الشراء.';
  END IF;

  -- 5. التنفيذ (Atomic Transaction)

  -- أولاً: خصم الرصيد وتحديث المستوى
  UPDATE public.users
  SET 
    balance = balance - v_plan_price,
    vip_level = v_plan_level, -- تحديث للمستوى الجديد المختار
    vip_joined_at = NOW()
  WHERE id = p_user_id;

  -- ثانياً: إدراج سجل الشراء (كما هو مطلوب لضمان تتبع المهام)
  INSERT INTO public.vip_purchases (user_id, vip_level_id, amount_paid, purchased_at)
  VALUES (p_user_id, p_vip_level_id, v_plan_price, NOW());

  -- 6. النتيجة
  RETURN json_build_object(
    'success', true,
    'message', 'تم تفعيل العضوية بنجاح',
    'new_balance', (v_user_balance - v_plan_price),
    'new_vip_level', v_plan_level
  );
END;
$$;
