
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { User } from './types';
import { AdminApp } from './AdminApp';
import { Loader2, Home, ClipboardList, Crown, Users, User as UserIcon, WifiOff, RefreshCcw } from 'lucide-react';

// Imported Components
import Toast from './components/Toast';
import NavButton from './components/NavButton';

// Imported Pages
import AuthScreens from './pages/AuthScreens';
import HomeTab from './pages/HomeTab';
import TasksTab from './pages/TasksTab';
import VipTab from './pages/VipTab';
import InviteTab from './pages/InviteTab';
import ProfileTab from './pages/ProfileTab';
import WithdrawTab from './pages/WithdrawTab';
import HistoryTab from './pages/HistoryTab';
import WithdrawalsHistoryTab from './pages/WithdrawalsHistoryTab';
import DepositsHistoryTab from './pages/DepositsHistoryTab';
import DepositTab from './pages/DepositTab';
import SettingsTab from './pages/SettingsTab';
import LuckCardPage from './pages/LuckCardPage';
import DailyBoxPage from './pages/DailyBoxPage';
import SupportTab from './pages/SupportTab';

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState('home');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const triggerToast = (msg: string, type: 'success' | 'error') => {
      setToastMessage(msg);
      setToastType(type);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      else setLoading(false);
    }).catch((err) => {
      console.error("Session check failed:", err);
      setLoading(false);
      setError(true); 
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
          setError(false);
          setLoading(true);
          fetchUserProfile(session.user.id);
      } else {
          setUser(null);
          setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Routing: Clean URL when authenticated
  useEffect(() => {
    if (session) {
        const path = window.location.pathname;
        if (path === '/login' || path === '/register') {
            window.history.replaceState({}, '', '/');
        }
    }
  }, [session]);

  const fetchUserProfile = async (userId: string, attempt = 0) => {
    if (!navigator.onLine) {
        setError(true);
        setLoading(false);
        return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, phone, balance, role, vip_level, referral_code, referral_by, referral_count, total_referral_profit, today_referral_profit, intern_started_at, created_at, luck_card_attempts')
        .eq('id', userId)
        .maybeSingle(); 
      
      if (error) throw error;
      
      if (data) {
        setUser(data);
        setLoading(false);
        setError(false);
      } else {
        if (attempt < 10) {
             const delay = attempt * 500 + 1000; 
             setTimeout(() => fetchUserProfile(userId, attempt + 1), delay);
             return;
        }
        await supabase.auth.signOut();
        setSession(null);
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error.message || error);
      if (attempt < 5) {
           setTimeout(() => fetchUserProfile(userId, attempt + 1), 2000);
           return;
      }
      setError(true);
      setLoading(false);
    }
  };

  const refreshUser = () => {
    if (user) fetchUserProfile(user.id).catch(console.error);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

  if (!session) return <AuthScreens />;

  if (error && !user) {
      return (
          <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center animate-fade-in">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                  <WifiOff className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">تعذر الاتصال</h2>
              <p className="text-gray-500 mb-8 max-w-xs mx-auto">
                  يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.
              </p>
              <button 
                onClick={() => { setLoading(true); setError(false); fetchUserProfile(session.user.id); }}
                className="bg-primary text-black px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-hover transition-colors"
              >
                  <RefreshCcw className="w-5 h-5" /> إعادة المحاولة
              </button>
              <button 
                onClick={() => supabase.auth.signOut()}
                className="mt-6 text-gray-500 text-sm hover:text-white transition-colors"
              >
                  تسجيل الخروج
              </button>
          </div>
      );
  }

  if (!user) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

  if (user.role === 'admin') return <AdminApp session={session} />;

  // Hide nav on specific immersive pages
  const hideNav = activeTab === 'luck_card' || activeTab === 'daily_box';

  return (
    <div className="min-h-screen bg-black font-sans text-right w-full overflow-x-hidden" dir="rtl">
      {showToast && <Toast message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />}
      
      <div className={hideNav ? "" : "pb-24"}>
        {activeTab === 'home' && <HomeTab user={user} setActiveTab={setActiveTab} />}
        {activeTab === 'tasks' && <TasksTab user={user} showToast={triggerToast} refreshUser={refreshUser} />}
        {activeTab === 'vip' && <VipTab user={user} showToast={triggerToast} refreshUser={refreshUser} />}
        {activeTab === 'invite' && <InviteTab user={user} />}
        {activeTab === 'profile' && <ProfileTab user={user} showToast={triggerToast} setActiveTab={setActiveTab} />}
        {activeTab === 'withdraw' && <WithdrawTab user={user} setActiveTab={setActiveTab} showToast={triggerToast} />}
        {activeTab === 'history' && <HistoryTab user={user} setActiveTab={setActiveTab} />}
        
        {activeTab === 'withdraw_history' && <WithdrawalsHistoryTab user={user} setActiveTab={setActiveTab} />}
        {activeTab === 'deposit_history' && <DepositsHistoryTab user={user} setActiveTab={setActiveTab} />}
        {activeTab === 'deposit' && <DepositTab user={user} setActiveTab={setActiveTab} showToast={triggerToast} />}
        
        {activeTab === 'settings' && <SettingsTab user={user} setActiveTab={setActiveTab} />}
        {activeTab === 'support' && <SupportTab setActiveTab={setActiveTab} />}
        
        {activeTab === 'luck_card' && (
            <LuckCardPage 
                user={user} 
                setActiveTab={setActiveTab} 
                showToast={triggerToast}
                refreshUser={refreshUser}
            />
        )}

        {activeTab === 'daily_box' && (
            <DailyBoxPage
                user={user}
                setActiveTab={setActiveTab}
                showToast={triggerToast}
                refreshUser={refreshUser}
            />
        )}
      </div>

      {!hideNav && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#141414]/90 backdrop-blur-md border-t border-[#2A2A2A] py-2 safe-bottom px-6 z-50">
            <div className="flex justify-between items-center">
                <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={Home} label="الرئيسية" />
                <NavButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} icon={ClipboardList} label="المهام" />
                <NavButton active={activeTab === 'vip'} onClick={() => setActiveTab('vip')} icon={Crown} label="VIP" />
                <NavButton active={activeTab === 'invite'} onClick={() => setActiveTab('invite')} icon={Users} label="الفريق" />
                <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={UserIcon} label="حسابي" />
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
