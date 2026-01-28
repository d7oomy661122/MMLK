
-- 🎓 الخطوة 1: التأكد من الأعمدة (تجهيز مكان العمل)
-- نحن بحاجة لعمود "ختم" لنعرف هل تم دفع المكافأة أم لا.

DO $$
BEGIN
    -- نضيف العمود فقط إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deposits' AND column_name='referral_processed') THEN
        ALTER TABLE public.deposits ADD COLUMN referral_processed BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- ملاحظة للمتعلم: جدول users لديه بالفعل referral_by (وهو referrer_id)
    -- وجدول deposits لديه status (حيث 'approved' تعني الموافقة)
END $$;


-- 🎓 الخطوة 2: الدالة "المحاسب" (Function)
-- هذه الدالة تقوم بكل العمليات الحسابية

CREATE OR REPLACE FUNCTION public.calculate_referral_profit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- تعمل بصلاحيات عالية لتتمكن من تعديل الأرصدة
AS $$
DECLARE
    v_referrer_id UUID; -- هنا سنحفظ رقم هوية الشخص الذي دعا المستخدم
    v_bonus NUMERIC;    -- هنا سنحفظ قيمة المكافأة (10%)
BEGIN
    -- 🛑 الفحص الأمني (الشروط):
    -- 1. هل الحالة الآن "approved" (مقبول)؟
    -- 2. هل الحالة السابقة لم تكن "approved"؟ (يعني توها تغيرت)
    -- 3. هل المكافأة لم تُدفع بعد (referral_processed = false)؟
    
    IF NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.referral_processed = FALSE THEN
        
        -- 🔍 البحث: من هو الشخص الذي دعا صاحب هذا الإيداع؟
        -- نستخدم referral_by الموجود في جدول users
        SELECT referral_by INTO v_referrer_id
        FROM public.users
        WHERE id = NEW.user_id;

        -- ✅ إذا وجدنا "محيل" (Referrer)
        IF v_referrer_id IS NOT NULL THEN
            
            -- 🧮 الحساب: 10% من قيمة الإيداع
            v_bonus := NEW.amount * 0.10;

            -- 💰 الدفع: تحديث رصيد وأرباح المحيل
            UPDATE public.users
            SET 
                balance = balance + v_bonus, -- إضافة للرصيد القابل للسحب
                today_referral_profit = COALESCE(today_referral_profit, 0) + v_bonus, -- إحصائيات اليوم
                total_referral_profit = COALESCE(total_referral_profit, 0) + v_bonus  -- إحصائيات الكل
            WHERE id = v_referrer_id;

            -- 📝 الختم: نعلن أننا انتهينا من هذا الإيداع حتى لا نكرر العملية
            -- بما أننا في trigger نوعه AFTER، نستخدم أمر UPDATE منفصل
            UPDATE public.deposits 
            SET referral_processed = TRUE 
            WHERE id = NEW.id;
            
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


-- 🎓 الخطوة 3: الزناد "الحارس" (Trigger)
-- هذا يراقب الجدول وينادي الدالة عند الحاجة

DROP TRIGGER IF EXISTS trg_calculate_referral_after_approval ON public.deposits;

CREATE TRIGGER trg_calculate_referral_after_approval
AFTER UPDATE OF status ON public.deposits -- يراقب تحديث عمود الحالة
FOR EACH ROW
EXECUTE FUNCTION public.calculate_referral_profit_trigger();

-- ✅ تم! الآن أي إيداع يوافق عليه الأدمن سيتم حساب 10% للمحيل تلقائياً.
