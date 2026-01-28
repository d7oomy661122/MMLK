
-- 1. تنظيف: حذف أي نسخ سابقة للدالة لتجنب تضارب التوقيعات
DROP FUNCTION IF EXISTS public.request_withdrawal_secure(numeric);
DROP FUNCTION IF EXISTS public.request_withdrawal_secure(uuid, numeric);

-- 2. إنشاء الدالة الآمنة المطلوبة من الواجهة
CREATE OR REPLACE FUNCTION public.request_withdrawal_secure(p_amount numeric)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- تشغيل بصلاحيات عالية للوصول للجداول
AS $$
DECLARE
    v_user_id UUID;
    v_current_hour INT;
    v_user_record RECORD;
    v_method_record RECORD;
    v_existing_requests INT;
    v_fee NUMERIC;
    v_net_amount NUMERIC;
BEGIN
    -- أ. التحقق من المستخدم
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'يجب تسجيل الدخول أولاً');
    END IF;

    -- ب. التحقق من الوقت (توقيت المغرب 09:00 - 17:00)
    v_current_hour := EXTRACT(HOUR FROM NOW() AT TIME ZONE 'Africa/Casablanca');
    IF v_current_hour < 9 OR v_current_hour >= 17 THEN
        RETURN json_build_object('success', false, 'message', 'خدمة السحب متاحة فقط بين الساعة 9 صباحاً و 5 مساءً بتوقيت المغرب');
    END IF;

    -- ج. قفل سجل المستخدم لمنع التلاعب بالرصيد أثناء العملية
    SELECT * INTO v_user_record 
    FROM public.users 
    WHERE id = v_user_id 
    FOR UPDATE;

    -- د. التحقق من الشروط
    
    -- 1. التحقق من VIP (يجب أن يكون VIP 1 أو أعلى)
    IF COALESCE(v_user_record.vip_level, 0) < 1 THEN
        RETURN json_build_object('success', false, 'message', 'غير مسموح بالسحب لحساب Intern. يرجى الترقية إلى VIP.');
    END IF;

    -- 2. الحد الأدنى للمبلغ
    IF p_amount < 30 THEN
        RETURN json_build_object('success', false, 'message', 'الحد الأدنى للسحب هو 30 درهم');
    END IF;

    -- 3. كفاية الرصيد
    IF v_user_record.balance < p_amount THEN
        RETURN json_build_object('success', false, 'message', 'رصيدك غير كافٍ لإتمام العملية');
    END IF;

    -- 4. التحقق من وجود معلومات بنكية
    SELECT * INTO v_method_record 
    FROM public.withdrawal_methods 
    WHERE user_id = v_user_id 
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'يرجى إعداد معلومات السحب (البنك) أولاً في صفحة السحب');
    END IF;

    -- 5. التحقق من التكرار اليومي
    SELECT COUNT(*) INTO v_existing_requests 
    FROM public.withdrawals 
    WHERE user_id = v_user_id 
      AND created_at >= CURRENT_DATE;

    IF v_existing_requests > 0 THEN
        RETURN json_build_object('success', false, 'message', 'يمكنك تقديم طلب سحب واحد فقط في اليوم');
    END IF;

    -- هـ. تنفيذ العملية
    
    -- حساب الرسوم (9%)
    v_fee := p_amount * 0.09;
    v_net_amount := p_amount - v_fee;

    -- 1. خصم المبلغ بالكامل من رصيد المستخدم
    UPDATE public.users 
    SET balance = balance - p_amount 
    WHERE id = v_user_id;

    -- 2. إدراج طلب السحب في السجل (استخدام المبلغ الصافي وبيانات withdrawal_methods)
    INSERT INTO public.withdrawals (
        user_id,
        amount,          -- المبلغ الصافي الذي سيصل للمستخدم
        status,
        bank_name,
        account_number,
        full_name,
        created_at
    ) VALUES (
        v_user_id,
        v_net_amount,
        'pending',
        v_method_record.bank_name,
        v_method_record.account_number,
        v_method_record.full_name,
        NOW()
    );

    RETURN json_build_object('success', true, 'message', 'تم تقديم طلب السحب بنجاح');

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', 'حدث خطأ في النظام: ' || SQLERRM);
END;
$$;
