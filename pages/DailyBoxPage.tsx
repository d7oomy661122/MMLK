import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { ChevronRight, Gift, Clipboard, Loader2, Lock, Info, Check } from 'lucide-react';

interface DailyBoxPageProps {
  user: User | null;
  setActiveTab: (tab: string) => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
  refreshUser: () => void;
}

const DailyBoxPage: React.FC<DailyBoxPageProps> = ({ user, setActiveTab, showToast, refreshUser }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultState, setResultState] = useState<{ type: 'idle' | 'success' | 'error'; message: string; reward?: number }>({
    type: 'idle',
    message: '',
  });
  const [sessionValid, setSessionValid] = useState(true);

  // 1. Session Validation
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSessionValid(false);
        setResultState({
          type: 'error',
          message: 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً.',
        });
      }
    };
    checkSession();
  }, []);

  // 2. Paste Handler
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setCode(text.trim());
      }
    } catch (err) {
      // Fail silently or soft UX hint
    }
  };

  // Helper: Humanize Error Messages
  const getHumanErrorMessage = (msg: string): string => {
      const m = msg.toLowerCase();
      if (m.includes('invalid') || m.includes('found')) return "الرمز المدخل غير صحيح";
      if (m.includes('expired')) return "انتهت صلاحية هذا الرمز";
      if (m.includes('used') || m.includes('duplicate')) return "لقد استخدمت هذا الرمز مسبقاً";
      if (m.includes('network') || m.includes('fetch')) return "مشكلة في الاتصال، تحقق من الإنترنت";
      return "تعذر إتمام العملية حالياً، حاول لاحقاً";
  };

  // 3. Main Redemption Logic
  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    if (loading) return;
    
    setLoading(true);
    setResultState({ type: 'idle', message: '' });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.user) {
        setSessionValid(false);
        throw new Error('AUTH_REQUIRED');
      }

      const { data, error } = await supabase.rpc('redeem_golden_code', {
        p_code: code.trim(),
        p_user_id: session.user.id
      });

      if (error) throw error;

      if (data && data.success) {
        setResultState({
          type: 'success',
          message: 'تم إضافة المكافأة إلى رصيدك',
          reward: data.reward
        });
        refreshUser();
        setCode(''); 
      } else {
        setResultState({
          type: 'error',
          message: getHumanErrorMessage(data?.message || '')
        });
      }

    } catch (err: any) {
      console.error('Redeem Error', err); // Log for devs only
      setResultState({
        type: 'error',
        message: getHumanErrorMessage(err.message || '')
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] font-sans pb-10 text-right animate-fade-in relative selection:bg-primary/30">
      
      {/* Navbar */}
      <div className="pt-8 px-5 mb-10 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white tracking-tight">الصندوق الذهبي</h1>
        <button 
           onClick={() => setActiveTab('home')} 
           className="w-10 h-10 bg-[#18181B] rounded-full flex items-center justify-center border border-[#27272A] text-gray-400 hover:text-white transition-colors"
        >
           <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-md mx-auto px-5">
        
        {/* Icon */}
        <div className="text-center mb-10">
           <div className="w-20 h-20 mx-auto mb-6 bg-[#18181B] border border-[#27272A] rounded-2xl flex items-center justify-center">
              <Gift className="w-8 h-8 text-primary" />
           </div>
           
           <h2 className="text-2xl font-bold text-white mb-2">
             الكود اليومي
           </h2>
           <p className="text-sm text-gray-500 max-w-[280px] mx-auto leading-relaxed">
             أدخل الرمز من القناة الرسمية للحصول على مكافأة فورية.
           </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleRedeem} className="space-y-4 mb-8">
            <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
                    <Lock className="w-5 h-5" />
                </div>
                
                <input 
                    type="text" 
                    value={code}
                    onChange={(e) => { setCode(e.target.value); setResultState({type: 'idle', message: ''}); }}
                    placeholder="أدخل الكود هنا"
                    disabled={!sessionValid || loading}
                    className="w-full bg-[#121214] text-white text-center font-mono text-lg font-medium py-5 border border-[#27272A] rounded-2xl focus:outline-none focus:border-primary transition-colors placeholder:text-gray-700 disabled:opacity-50"
                    autoComplete="off"
                    spellCheck="false"
                />

                <button 
                    type="button"
                    onClick={handlePaste}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-white transition-colors"
                >
                    <Clipboard className="w-5 h-5" />
                </button>
            </div>

            {/* Error / Success Message */}
            {resultState.message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-slide-up ${
                    resultState.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                }`}>
                    {resultState.type === 'success' ? <Check className="w-5 h-5 shrink-0" /> : <Info className="w-5 h-5 shrink-0" />}
                    <div className="flex-1">
                        {resultState.message}
                        {resultState.type === 'success' && resultState.reward && (
                            <span className="block text-xs mt-1 opacity-80">+ {resultState.reward} MAD</span>
                        )}
                    </div>
                </div>
            )}

            <button 
                type="submit" 
                disabled={loading || !code.trim() || !sessionValid}
                className="w-full bg-primary text-[#09090B] py-4 rounded-2xl font-bold text-base hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تأكيد الرمز'}
            </button>
        </form>

        {/* Footer Link */}
        <div className="flex justify-center">
            <a 
                href="https://t.me/brixaofficial" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-500 text-xs hover:text-primary transition-colors border-b border-transparent hover:border-primary pb-0.5"
            >
                الانضمام للقناة الرسمية
            </a>
        </div>
      </div>
    </div>
  );
};

export default DailyBoxPage;