
-- 1. Ensure Withdrawal Methods Table Exists and is Secure
CREATE TABLE IF NOT EXISTS public.withdrawal_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    full_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id) -- Ensures one method per user
);

-- Enable RLS for methods
ALTER TABLE public.withdrawal_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own methods" ON public.withdrawal_methods 
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. The Main Secure Withdrawal Function
CREATE OR REPLACE FUNCTION public.request_withdrawal_secure(
    p_amount NUMERIC
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to update balance/insert withdrawal
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
    -- A. Identify User
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'يجب تسجيل الدخول أولاً');
    END IF;

    -- B. Time Check (Morocco Time: UTC+1 or specific timezone logic)
    -- We cast NOW() to the Morocco timezone and extract the hour (0-23)
    v_current_hour := EXTRACT(HOUR FROM NOW() AT TIME ZONE 'Africa/Casablanca');
    
    -- Window: 09:00 to 17:00 (5 PM)
    IF v_current_hour < 9 OR v_current_hour >= 17 THEN
        RETURN json_build_object('success', false, 'message', 'خدمة السحب متاحة فقط بين الساعة 9 صباحاً و 5 مساءً بتوقيت المغرب');
    END IF;

    -- C. Fetch & Lock User Data (Prevent Race Conditions)
    SELECT * INTO v_user_record 
    FROM public.users 
    WHERE id = v_user_id 
    FOR UPDATE;

    -- D. Validation Checks
    
    -- 1. VIP Level Check (Must be >= 1)
    IF COALESCE(v_user_record.vip_level, 0) < 1 THEN
        RETURN json_build_object('success', false, 'message', 'غير مسموح بالسحب لحساب Intern. يرجى الترقية إلى VIP.');
    END IF;

    -- 2. Minimum Amount Check
    IF p_amount < 30 THEN
        RETURN json_build_object('success', false, 'message', 'الحد الأدنى للسحب هو 30 درهم');
    END IF;

    -- 3. Balance Check
    IF v_user_record.balance < p_amount THEN
        RETURN json_build_object('success', false, 'message', 'رصيدك غير كافٍ لإتمام العملية');
    END IF;

    -- 4. Withdrawal Method Check
    SELECT * INTO v_method_record 
    FROM public.withdrawal_methods 
    WHERE user_id = v_user_id 
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'يرجى إعداد معلومات السحب (البنك) أولاً');
    END IF;

    -- 5. Daily Frequency Check
    SELECT COUNT(*) INTO v_existing_requests 
    FROM public.withdrawals 
    WHERE user_id = v_user_id 
      AND created_at >= CURRENT_DATE; -- Entries created today

    IF v_existing_requests > 0 THEN
        RETURN json_build_object('success', false, 'message', 'يمكنك تقديم طلب سحب واحد فقط في اليوم');
    END IF;

    -- E. Execution (Atomic)
    
    -- Calculate Fee (9%)
    v_fee := p_amount * 0.09;
    v_net_amount := p_amount - v_fee;

    -- 1. Deduct Full Amount from User Balance
    UPDATE public.users 
    SET balance = balance - p_amount 
    WHERE id = v_user_id;

    -- 2. Create Withdrawal Record
    -- We store the NET amount (what user receives) as per previous system logic,
    -- or we could store gross. Based on existing code, we insert net.
    INSERT INTO public.withdrawals (
        user_id,
        amount,          -- Storing Net Amount
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
    -- Fallback error handling
    RETURN json_build_object('success', false, 'message', 'حدث خطأ في النظام: ' || SQLERRM);
END;
$$;
