
-- 🛠️ إصلاح شامل ونهائي لخطأ "record new has no field referrer_id" 🛠️

-- 1️⃣ تنظيف شامل: حذف جميع الدوال والزنادات التي قد تكون متبقية وتسبب الخطأ
DROP TRIGGER IF EXISTS on_auth_user_created_referral ON public.users;
DROP FUNCTION IF EXISTS public.handle_new_user_referral();

DROP TRIGGER IF EXISTS on_user_created ON public.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TRIGGER IF EXISTS trg_calculate_referral_after_approval ON public.deposits;
DROP FUNCTION IF EXISTS public.calculate_referral_profit_trigger();

DROP FUNCTION IF EXISTS public.handle_referral_commission();

-- 2️⃣ التأكد من هيكل الجدول (Schema Check)
DO $$
BEGIN
    -- عمود لمعالجة العمولات ومنع التكرار
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deposits' AND column_name='referral_processed') THEN
        ALTER TABLE public.deposits ADD COLUMN referral_processed BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- التأكد من وجود عمود referral_by (الاسم الصحيح)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='referral_by') THEN
        ALTER TABLE public.users ADD COLUMN referral_by UUID REFERENCES public.users(id);
    END IF;
END $$;

-- 3️⃣ الدالة الصحيحة لتسجيل المستخدم (تستخدم referral_by حصراً)
CREATE OR REPLACE FUNCTION public.handle_new_user_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- تعيين القيم الافتراضية
  NEW.vip_level := COALESCE(NEW.vip_level, 0); -- ضمان أن لا تكون القيمة NULL
  NEW.intern_started_at := NOW();

  -- منطق الإحالة: استخدام referral_by فقط (تجنب referrer_id)
  IF NEW.referral_by IS NOT NULL THEN
    -- زيادة العداد للمحيل
    UPDATE public.users
    SET referral_count = referral_count + 1
    WHERE id = NEW.referral_by;
  END IF;
  
  RETURN NEW;
END;
$$;

-- تفعيل الزناد عند الإدراج في جدول users
CREATE TRIGGER on_auth_user_created_referral
  BEFORE INSERT ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_referral();

-- 4️⃣ دالة ونظام عمولة الإيداع (10%)
CREATE OR REPLACE FUNCTION public.calculate_deposit_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_referrer_id UUID;
    v_bonus NUMERIC;
BEGIN
    -- العمل فقط عند الموافقة (approved) ولم يتم المعالجة مسبقاً
    IF NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.referral_processed = FALSE THEN
        
        -- البحث عن المحيل باستخدام العمود الصحيح referral_by
        SELECT referral_by INTO v_referrer_id
        FROM public.users
        WHERE id = NEW.user_id;

        IF v_referrer_id IS NOT NULL THEN
            v_bonus := NEW.amount * 0.10; -- 10% عمولة

            -- تحديث رصيد المحيل
            UPDATE public.users
            SET 
                balance = balance + v_bonus,
                today_referral_profit = COALESCE(today_referral_profit, 0) + v_bonus,
                total_referral_profit = COALESCE(total_referral_profit, 0) + v_bonus
            WHERE id = v_referrer_id;

            -- وضع علامة أن الإيداع تمت معالجته
            UPDATE public.deposits 
            SET referral_processed = TRUE 
            WHERE id = NEW.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- تفعيل زناد العمولة
CREATE TRIGGER trg_deposit_commission
AFTER UPDATE OF status ON public.deposits
FOR EACH ROW
EXECUTE FUNCTION public.calculate_deposit_commission();

-- 5️⃣ دالة مساعدة لعد الإحالات
CREATE OR REPLACE FUNCTION public.get_referral_count(p_user_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT count(*)::integer FROM public.users WHERE referral_by = p_user_id;
$$;
