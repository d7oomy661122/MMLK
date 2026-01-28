
-- 1. Ensure Tables Exist (Safe check, keeping existing data)
CREATE TABLE IF NOT EXISTS public.golden_rice (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    reward_amount NUMERIC NOT NULL CHECK (reward_amount > 0),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.golden_rice_redemptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    golden_rice_id UUID REFERENCES public.golden_rice(id) NOT NULL,
    redeemed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, golden_rice_id)
);

-- 2. Enable RLS
ALTER TABLE public.golden_rice ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golden_rice_redemptions ENABLE ROW LEVEL SECURITY;

-- 3. CLEANUP: Drop potential conflicting functions to fix "Could not find function" error
DROP FUNCTION IF EXISTS public.redeem_golden_code(text);
DROP FUNCTION IF EXISTS public.redeem_golden_code(text, uuid);

-- 4. Create the CORRECT Function with (p_code, p_user_id) signature
CREATE OR REPLACE FUNCTION public.redeem_golden_code(p_code TEXT, p_user_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated permissions to update balance
AS $$
DECLARE
    v_code_record RECORD;
    v_already_redeemed BOOLEAN;
    v_new_balance NUMERIC;
BEGIN
    -- A. Security Check: Ensure the passed user_id matches the authenticated user
    -- This satisfies the frontend requirement while keeping backend secure.
    IF auth.uid() != p_user_id THEN
        RETURN json_build_object('success', false, 'message', 'Unauthorized: User ID mismatch');
    END IF;

    -- B. Find and Validate Code
    SELECT * INTO v_code_record
    FROM public.golden_rice
    WHERE code = p_code 
      AND is_active = TRUE
      AND expires_at > NOW();

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'الرمز غير صالح أو منتهي الصلاحية');
    END IF;

    -- C. Check if already redeemed
    SELECT EXISTS (
        SELECT 1 FROM public.golden_rice_redemptions 
        WHERE user_id = p_user_id AND golden_rice_id = v_code_record.id
    ) INTO v_already_redeemed;

    IF v_already_redeemed THEN
        RETURN json_build_object('success', false, 'message', 'لقد استخدمت هذا الرمز مسبقاً');
    END IF;

    -- D. Execute Transaction (Log + Update Balance)
    INSERT INTO public.golden_rice_redemptions (user_id, golden_rice_id)
    VALUES (p_user_id, v_code_record.id);

    UPDATE public.users
    SET balance = balance + v_code_record.reward_amount
    WHERE id = p_user_id
    RETURNING balance INTO v_new_balance;

    RETURN json_build_object(
        'success', true, 
        'message', 'تم إضافة المكافأة بنجاح', 
        'reward', v_code_record.reward_amount,
        'new_balance', v_new_balance
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', 'حدث خطأ غير متوقع: ' || SQLERRM);
END;
$$;
