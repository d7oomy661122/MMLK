
-- دالة RPC لإضافة مكافأة الإحالة يدوياً من الأدمن
-- تتحقق من جميع الشروط وتمنع التكرار
CREATE OR REPLACE FUNCTION public.admin_add_referral_bonus(p_deposit_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deposit record;
  v_referrer_id uuid;
  v_bonus numeric;
BEGIN
  -- 1. جلب بيانات الإيداع والتحقق منها
  SELECT * INTO v_deposit FROM public.deposits WHERE id = p_deposit_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'الإيداع غير موجود');
  END IF;

  IF v_deposit.status != 'approved' THEN
    RETURN json_build_object('success', false, 'message', 'يجب الموافقة على الإيداع أولاً');
  END IF;

  IF v_deposit.referral_processed THEN
    RETURN json_build_object('success', false, 'message', 'تم احتساب المكافأة مسبقاً');
  END IF;

  -- 2. البحث عن المحيل
  SELECT referral_by INTO v_referrer_id FROM public.users WHERE id = v_deposit.user_id;

  IF v_referrer_id IS NULL THEN
     -- إذا لم يوجد محيل، نضع علامة "تمت المعالجة" حتى يختفي الزر ولا يظهر مجدداً
     UPDATE public.deposits SET referral_processed = true WHERE id = p_deposit_id;
     RETURN json_build_object('success', true, 'message', 'لا يوجد محيل لهذا المستخدم (تم تحديث الحالة)');
  END IF;

  -- 3. حساب المكافأة (10%)
  v_bonus := v_deposit.amount * 0.10;

  -- 4. إضافة الرصيد للمحيل
  UPDATE public.users 
  SET 
    balance = balance + v_bonus,
    today_referral_profit = COALESCE(today_referral_profit, 0) + v_bonus,
    total_referral_profit = COALESCE(total_referral_profit, 0) + v_bonus
  WHERE id = v_referrer_id;

  -- 5. تحديث حالة الإيداع لمنع التكرار
  UPDATE public.deposits SET referral_processed = true WHERE id = p_deposit_id;

  RETURN json_build_object('success', true, 'message', 'تم إضافة مكافأة 10% للمحيل بنجاح');
END;
$$;
