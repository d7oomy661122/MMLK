
import React, { useState, useEffect, useCallback, memo } from 'react';
import { supabase, generateReferralCode } from '../lib/supabase';
import { User } from '../types';
import { Input } from '../components/Input';
import { Loader2, AlertCircle, User as UserIcon, Eye, EyeOff, Lock, Key, Smartphone } from 'lucide-react';
import { getErrorMessage } from '../utils/helpers';

// --- Components: Brand Identity & UI Assets ---

// Logo: Professional, clickable, abstract geometric design
const BrandLogo = memo(() => (
  <a href="/" className="relative group block transform transition-transform duration-500 hover:scale-105 cursor-pointer">
    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 drop-shadow-2xl">
      <rect x="12" y="12" width="40" height="40" rx="10" stroke="#FF9F1C" strokeWidth="2" className="group-hover:stroke-[#FFBF69] transition-colors"/>
      <path d="M32 12V52" stroke="#FF9F1C" strokeWidth="2" strokeLinecap="round" className="opacity-20"/>
      <path d="M12 32H52" stroke="#FF9F1C" strokeWidth="2" strokeLinecap="round" className="opacity-20"/>
      <path d="M32 20L42 32L32 44L22 32L32 20Z" fill="#FF9F1C" className="group-hover:fill-[#FFBF69] transition-colors"/>
    </svg>
  </a>
));

// Background: Subtle, deep, and premium (No distractions)
const AmbientBackground = memo(() => (
  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[#050505]">
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_#141414_0%,_#000000_100%)]"></div>
    <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[80%] bg-primary/5 rounded-full blur-[180px] opacity-60"></div>
    <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[150px] opacity-40"></div>
  </div>
));

const AuthScreens = () => {
  // --- State Management ---
  // Initialize view based on current URL
  const [view, setView] = useState<'login' | 'register'>(() => {
     if (typeof window !== 'undefined') {
         const path = window.location.pathname;
         // Default to login if on login path or if on dashboard (e.g. after logout)
         if (path === '/login' || path === '/dashboard') return 'login';
         return 'register';
     }
     return 'register';
  });

  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [userCaptcha, setUserCaptcha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Routing & Effects ---
  
  // Handle Browser Back/Forward & Initial URL normalization
  useEffect(() => {
    const handlePopState = () => {
        const path = window.location.pathname;
        if (path === '/login') {
            setView('login');
            setError(null);
        } else if (path === '/register') {
            setView('register');
            setError(null);
        }
    };

    window.addEventListener('popstate', handlePopState);

    const path = window.location.pathname;
    // If root path, default to register in URL without reload
    if (path === '/' || path === '') {
        window.history.replaceState({}, '', '/register');
        setView('register');
    } 
    // If user lands on dashboard without auth, redirect to login
    else if (path === '/dashboard') {
        window.history.replaceState({}, '', '/login');
        setView('login');
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle Referral Params & URL sync
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get('ref');
    if (refParam) {
      setReferralCode(refParam);
      // If we are forcing registration due to referral, ensure URL matches
      if (view === 'login' || window.location.pathname !== '/register') {
          setView('register');
          window.history.replaceState({}, '', '/register' + window.location.search);
      }
    }
  }, []);

  const generateCaptcha = useCallback(() => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setCaptcha(code);
    setUserCaptcha('');
  }, []);

  useEffect(() => {
    if (view === 'register') generateCaptcha();
  }, [view, generateCaptcha]);

  // --- View Switcher Logic ---
  const switchView = (target: 'login' | 'register') => {
      setView(target);
      setError(null);
      generateCaptcha();
      // Push state to browser history without reloading
      window.history.pushState({}, '', target === 'login' ? '/login' : '/register');
  };

  // --- Helpers ---
  const isValidPhone = (p: string) => /^(0?)(6|7)\d{8}$/.test(p);

  // --- Logic Handlers (Optimized for High Concurrency) ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // Prevent double submit
    
    setError(null);
    setIsLoading(true);

    try {
      // 1. Client-Side Validation (Fail Fast)
      const cleanUsername = username.trim().toLowerCase().replace(/\s/g, '');
      const cleanPhone = phone.trim().replace(/\s/g, '');
      const cleanReferralCode = referralCode.trim().toUpperCase();

      if (!cleanUsername || cleanUsername.length < 3) throw new Error('اسم المستخدم قصير جداً');
      if (!/^[a-z0-9]+$/.test(cleanUsername)) throw new Error('اسم المستخدم يجب أن يحتوي أحرف وأرقام إنجليزية فقط');
      if (!isValidPhone(cleanPhone)) throw new Error('رقم الهاتف غير صحيح');
      if (password.length < 6) throw new Error('كلمة المرور قصيرة');
      if (password !== confirmPassword) throw new Error('كلمات المرور غير متطابقة');
      if (!cleanReferralCode) throw new Error('كود الإحالة مطلوب');
      if (userCaptcha !== captcha) {
          generateCaptcha();
          throw new Error('رمز التحقق خاطئ');
      }

      // 2. Resolve Referrer (Single Query)
      let referrerId: string | null = null;
      if (cleanReferralCode) {
        const { data: referrer } = await supabase
            .from('users')
            .select('id')
            .eq('referral_code', cleanReferralCode)
            .maybeSingle();
            
        if (!referrer) throw new Error('كود الإحالة غير صحيح');
        referrerId = referrer.id;
      }

      // 3. Supabase Auth (Sign Up)
      const newReferralCode = generateReferralCode();
      const emailIdentifier = `${cleanPhone}@brixa.com`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailIdentifier,
        password: password,
        options: { 
            data: { 
                username: cleanUsername, 
                phone: cleanPhone,
                referral_by: referrerId
            } 
        }
      });

      if (authError) {
         if (authError.message?.toLowerCase().includes('already registered') || authError.status === 422) {
             throw new Error('رقم الهاتف مسجل مسبقاً. يرجى تسجيل الدخول.');
         }
         throw new Error('فشل إنشاء الحساب، يرجى المحاولة لاحقاً');
      }

      if (!authData.user || !authData.session) {
          throw new Error('لم يتم إنشاء الجلسة، يرجى المحاولة مجدداً');
      }

      // 4. Create Profile Record (Optimistic UI Approach handled by triggers usually, but explicit here for safety)
      // Note: Triggers in Supabase usually handle this to ensure consistency, 
      // but if we do client-side insert, we catch race conditions.
      const now = new Date().toISOString();
      const newUser: Partial<User> = {
          id: authData.user.id,
          username: cleanUsername,
          phone: cleanPhone,
          referral_code: newReferralCode,
          referral_by: referrerId,
          balance: 0,
          role: 'user',
          referral_count: 0,
          total_referral_profit: 0,
          today_referral_profit: 0,
          created_at: now,
          luck_card_attempts: 1
      };

      const { error: insertError } = await supabase.from('users').insert(newUser);
      
      if (insertError) {
          // If profile exists (trigger created it), ignore error. If unexpected error, rollback auth.
          if (!insertError.message?.includes('duplicate')) {
              console.error('Profile Creation Failed:', insertError);
              await supabase.auth.signOut();
              throw new Error('حدث خطأ في تهيئة الحساب.');
          }
      }

    } catch (err: any) {
      setError(getErrorMessage(err, 'حدث خطأ غير متوقع'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    setError(null);
    setIsLoading(true);

    try {
      const cleanPhone = phone.trim().replace(/\s/g, '');
      if (!cleanPhone || !password) throw new Error('البيانات ناقصة');

      const emailIdentifier = `${cleanPhone}@brixa.com`;
      const { error } = await supabase.auth.signInWithPassword({ email: emailIdentifier, password: password });
      
      if (error) throw new Error('رقم الهاتف أو كلمة المرور غير صحيحة');
      
    } catch (err: any) {
      setError(getErrorMessage(err, 'حدث خطأ أثناء تسجيل الدخول'));
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render (Clean, Full-Width, Native Interaction) ---
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative font-sans selection:bg-primary/20 selection:text-white select-text">
      <AmbientBackground />

      <div className="w-full max-w-md relative z-10">
        
        {/* Container: Removed Borders/Shadows for seamless mobile feel */}
        <div className="bg-transparent p-4 md:p-6 animate-fade-in relative">
          
          {/* Header Section */}
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="mb-6">
               <BrandLogo />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-2">
              {view === 'register' ? 'ابدأ رحلتك المالية' : 'مرحباً بعودتك'}
            </h1>
            <p className="text-sm text-gray-500 font-medium max-w-[260px] leading-relaxed">
              {view === 'register' 
                ? 'انضم إلى مجتمع النخبة واستثمر في مستقبلك اليوم.' 
                : 'تابع تقدمك واستثماراتك بكل سهولة.'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-500/5 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3 animate-slide-up select-none">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={view === 'register' ? handleRegister : handleLogin} className="space-y-5" autoComplete="on">
            
            {view === 'register' && (
               <Input 
                 label="اسم المستخدم" 
                 placeholder="اسمك المستعار" 
                 value={username} 
                 onChange={(e) => setUsername(e.target.value)} 
                 required 
                 leftElement={<UserIcon className="w-5 h-5" />} 
                 className="lowercase placeholder:text-gray-600"
                 autoComplete="username"
                 name="username"
                 id="username"
               />
            )}

            <Input 
              label="رقم الهاتف" 
              placeholder="600000000" 
              type="tel" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              required 
              dir="ltr" 
              leftElement={<div className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-gray-500" /><span className="text-white font-bold font-mono text-sm pt-0.5">+212</span></div>} 
              className="font-mono tracking-widest pl-20 placeholder:text-gray-600"
              autoComplete="tel"
              name="phone"
              id="phone"
            />
            
            <Input 
              label="كلمة المرور" 
              placeholder="••••••••" 
              type={showPassword ? "text" : "password"} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              leftElement={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-white transition-colors focus:outline-none" tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              } 
              autoComplete={view === 'register' ? "new-password" : "current-password"}
              name="password"
              id="password"
            />

            {view === 'register' && (
              <div className="animate-slide-up space-y-5">
                <Input 
                  label="تأكيد كلمة المرور" 
                  placeholder="••••••••" 
                  type={showPassword ? "text" : "password"} 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                  leftElement={<Lock className="w-5 h-5 text-gray-500" />} 
                  autoComplete="new-password"
                  name="confirmPassword"
                  id="confirmPassword"
                />
                
                <Input 
                  label="كود الإحالة" 
                  placeholder="CODE" 
                  value={referralCode} 
                  onChange={(e) => setReferralCode(e.target.value)} 
                  maxLength={6} 
                  required 
                  className="text-center font-mono uppercase tracking-[0.2em] font-bold border-primary/30 bg-primary/5 focus:bg-primary/10 transition-colors" 
                  leftElement={<Key className="w-5 h-5 text-primary" />} 
                  autoComplete="off"
                  name="referralCode"
                  id="referralCode"
                />

                <div className="pt-2">
                   <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold text-gray-400 select-none">التحقق الأمني</label>
                      <button type="button" onClick={generateCaptcha} className="text-[10px] text-primary hover:text-primary-hover transition-colors cursor-pointer font-medium select-none">تغيير الرمز</button>
                   </div>
                   <div className="flex gap-3">
                      <div 
                        className="h-14 w-36 bg-[#0a0a0a] border border-[#2A2A2A] rounded-2xl flex items-center justify-center select-none overflow-hidden relative group cursor-pointer hover:border-primary/40 transition-colors" 
                        onClick={generateCaptcha}
                        title="انقر للتحديث"
                      >
                         <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                         <span className="text-2xl font-mono font-bold text-white tracking-[0.2em] z-10">{captcha}</span>
                         <div className="absolute w-full h-[1px] bg-gray-700/50 rotate-12"></div>
                      </div>
                      <div className="flex-1 relative brand-input rounded-2xl overflow-hidden bg-[#0a0a0a] focus-within:ring-2 focus-within:ring-primary/20 transition-all border border-[#2A2A2A]">
                         <input 
                            type="number" 
                            placeholder="أدخل الرمز" 
                            className="w-full h-full bg-transparent text-white text-center font-bold text-lg focus:outline-none placeholder-gray-700 font-mono" 
                            value={userCaptcha} 
                            onChange={(e) => setUserCaptcha(e.target.value)} 
                            required 
                            autoComplete="off"
                         />
                      </div>
                   </div>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-gradient-to-r from-primary to-[#FF8C00] hover:from-[#FFB74D] hover:to-primary text-black font-extrabold text-base py-4 rounded-2xl transition-all duration-300 mt-8 shadow-[0_4px_20px_rgba(255,159,28,0.15)] hover:shadow-[0_8px_30px_rgba(255,159,28,0.25)] active:scale-[0.98] transform disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none select-none touch-manipulation"
            >
              {isLoading ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : (view === 'register' ? 'إنشاء الحساب' : 'الدخول إلى حسابي')}
            </button>
          </form>

          {/* Footer Switcher */}
          <div className="mt-8 pt-6 border-t border-[#222] text-center select-none">
            <button 
               onClick={() => switchView(view === 'login' ? 'register' : 'login')} 
               className="text-gray-500 text-sm hover:text-white transition-colors group p-2 font-medium"
            >
              {view === 'register' ? 'لديك حساب بالفعل؟ ' : 'جديد في المنصة؟ '}
              <span className="text-primary font-bold group-hover:text-primary-hover transition-colors mr-1">
                {view === 'register' ? 'تسجيل الدخول' : 'إنشاء عضوية'}
              </span>
            </button>
          </div>
        </div>
        
        {/* Copyright Footer Removed */}
      </div>
    </div>
  );
};

export default AuthScreens;
