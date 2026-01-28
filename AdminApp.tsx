
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { User, Withdrawal, UserDeposit, Task, DepositInfo, VipLevel } from './types';
import { 
  Users, LogOut, Loader2, Search, Edit, ChevronLeft, ChevronRight, Check, ArrowDownCircle, ClipboardList, Plus, Link as LinkIcon, Clock, Power, Landmark, Trash2, CreditCard, Database, Gift, Banknote, Eye
} from 'lucide-react';
import { DepositImage } from './components/admin/DepositImage';
import { AdminToast } from './components/admin/AdminToast';
import { BalanceEditModal } from './components/admin/modals/BalanceEditModal';
import { TaskModal } from './components/admin/modals/TaskModal';
import { DepositInfoModal } from './components/admin/modals/DepositInfoModal';
import { VipLevelModal } from './components/admin/modals/VipLevelModal';
import { UserBankEditModal } from './components/admin/modals/UserBankEditModal';
import { AdminGiveVipModal } from './components/admin/modals/AdminGiveVipModal';
import { UserDetailModal } from './components/admin/modals/UserDetailModal';

const PAGE_SIZE = 10;

export const AdminApp = ({ session }: { session: any }) => {
  const [view, setView] = useState<'users' | 'withdrawals' | 'deposits' | 'tasks' | 'bank_info' | 'user_banks' | 'vip_levels'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [deposits, setDeposits] = useState<UserDeposit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [depositInfos, setDepositInfos] = useState<DepositInfo[]>([]);
  
  // New States for New Sections
  const [userBanks, setUserBanks] = useState<any[]>([]);
  const [vipLevels, setVipLevels] = useState<any[]>([]); // Using any to accommodate monthly_tasks if db has it
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  
  // Task Management States
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  // Bank Info Management States
  const [showDepositInfoModal, setShowDepositInfoModal] = useState(false);
  const [editingDepositInfo, setEditingDepositInfo] = useState<DepositInfo | undefined>(undefined);

  // New Modals States
  const [showVipLevelModal, setShowVipLevelModal] = useState(false);
  const [editingVipLevel, setEditingVipLevel] = useState<any | undefined>(undefined);
  
  const [editingUserBank, setEditingUserBank] = useState<any | undefined>(undefined);
  
  const [showGiveVipModal, setShowGiveVipModal] = useState(false);
  const [givingVipUser, setGivingVipUser] = useState<User | null>(null);

  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [processingId, setProcessingId] = useState<string | number | null>(null);

  // --- MANUAL REFERRAL BONUS LOGIC ---

  // ✅ New Function: Core Logic (As Requested)
  const addReferralBonus = async (depositId: string) => {
      setProcessingId(depositId);
      try {
          // Call RPC
          const { data, error } = await supabase.rpc('admin_add_referral_bonus', {
              p_deposit_id: depositId
          });

          if (error) throw error;

          // Process result
          if (data && data.success) {
               setToast({ msg: data.message, type: 'success' });
               
               // Update list to hide button
               setDeposits(prev => prev.map(d => 
                   d.id === depositId ? { ...d, referral_processed: true } : d
               ));
          } else {
               setToast({ msg: data?.message || 'فشلت العملية', type: 'error' });
          }
      } catch (e: any) {
          setToast({ msg: e.message || 'حدث خطأ في الاتصال', type: 'error' });
      } finally {
          setProcessingId(null);
      }
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
        .from('users')
        .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`username.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data, count } = await query.order('created_at', { ascending: false }).range(from, to);
    
    setUsers(data || []);
    setTotal(count || 0);
    setLoading(false);
  }, [page, search]);

  const fetchWithdrawals = useCallback(async () => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, count } = await supabase
        .from('withdrawals')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

    setWithdrawals(data || []);
    setTotal(count || 0);
    setLoading(false);
  }, [page]);

  const fetchDeposits = useCallback(async () => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, count } = await supabase
        .from('deposits')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

    setDeposits(data || []);
    setTotal(count || 0);
    setLoading(false);
  }, [page]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const { data, count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact' })
        .order('vip_level', { ascending: true })
        .order('id', { ascending: true });
    
    setTasks(data || []);
    setTotal(count || 0);
    setLoading(false);
  }, []);

  const fetchDepositInfos = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
        .from('deposit_info')
        .select('*')
        .order('id', { ascending: true });
    
    setDepositInfos(data || []);
    setLoading(false);
  }, []);

  // NEW FETCH FUNCTIONS
  const fetchUserBanks = useCallback(async () => {
      setLoading(true);
      // Fetch withdrawals for bank info
      const { data, error } = await supabase
          .from('withdrawals')
          .select('id, user_id, full_name, bank_name, account_number, created_at')
          .order('created_at', { ascending: false });
      
      if (error) console.error(error);
      setUserBanks(data || []);
      setTotal((data || []).length);
      setLoading(false);
  }, []);

  const fetchVipLevels = useCallback(async () => {
      setLoading(true);
      const { data, error } = await supabase
          .from('vip_levels')
          .select('*')
          .order('level', { ascending: true });
      
      if (error) console.error(error);
      setVipLevels(data || []);
      setTotal((data || []).length);
      setLoading(false);
  }, []);

  useEffect(() => {
     const timer = setTimeout(() => {
         if (view === 'users') fetchUsers();
         else if (view === 'withdrawals') fetchWithdrawals();
         else if (view === 'deposits') fetchDeposits();
         else if (view === 'tasks') fetchTasks();
         else if (view === 'bank_info') fetchDepositInfos();
         else if (view === 'user_banks') fetchUserBanks();
         else if (view === 'vip_levels') fetchVipLevels();
     }, 500);
     return () => clearTimeout(timer);
  }, [fetchUsers, fetchWithdrawals, fetchDeposits, fetchTasks, fetchDepositInfos, fetchUserBanks, fetchVipLevels, view]);

  // Reset pagination when switching views
  const handleSwitchView = (newView: typeof view) => {
      setView(newView);
      setPage(1);
      setSearch('');
  };

  const handleUpdateBalance = async (newBalance: number) => {
      if (!editingUser) return;
      try {
          const { error } = await supabase.from('users').update({ balance: newBalance }).eq('id', editingUser.id);
          if (error) throw error;
          
          setToast({ msg: 'تم تحديث الرصيد بنجاح', type: 'success' });
          setEditingUser(null);
          fetchUsers();
      } catch (e) {
          setToast({ msg: 'حدث خطأ أثناء التحديث', type: 'error' });
      }
  };

  const handleWithdrawalStatus = async (id: string, status: 'approved' | 'rejected') => {
      setProcessingId(id);
      try {
          const { error } = await supabase
              .from('withdrawals')
              .update({ status })
              .eq('id', id);

          if (error) throw error;

          setToast({ 
              msg: status === 'approved' ? 'تم قبول طلب السحب' : 'تم رفض طلب السحب', 
              type: 'success' 
          });
          
          fetchWithdrawals();

      } catch (e) {
          console.error(e);
          setToast({ msg: 'حدث خطأ أثناء تنفيذ العملية', type: 'error' });
      } finally {
          setProcessingId(null);
      }
  };

  const handleDepositStatus = async (deposit: UserDeposit, status: 'approved' | 'rejected') => {
      if (deposit.status === status) return;
      if (!deposit.id) {
          setToast({ msg: 'خطأ: معرف الإيداع غير موجود', type: 'error' });
          return;
      }
      
      setProcessingId(deposit.id);
      try {
          const { error: updateError } = await supabase
              .from('deposits')
              .update({ status })
              .eq('id', deposit.id);

          if (updateError) throw updateError;

          const { data: freshData, error: fetchError } = await supabase
              .from('deposits')
              .select('status')
              .eq('id', deposit.id)
              .maybeSingle();

          if (fetchError) throw fetchError;
          if (!freshData || freshData.status !== status) {
              throw new Error("لم يتم حفظ التغييرات في قاعدة البيانات.");
          }

          if (status === 'approved') {
              const { data: userData, error: userFetchError } = await supabase
                  .from('users')
                  .select('balance')
                  .eq('id', deposit.user_id)
                  .maybeSingle();

              if (userFetchError || !userData) {
                  await supabase.from('deposits').update({ status: 'pending' }).eq('id', deposit.id);
                  throw new Error(userFetchError?.message || 'المستخدم غير موجود، تم إلغاء العملية.');
              }

              const newBalance = (userData.balance || 0) + deposit.amount;

              const { error: balanceError } = await supabase
                  .from('users')
                  .update({ balance: newBalance })
                  .eq('id', deposit.user_id);

              if (balanceError) {
                  await supabase.from('deposits').update({ status: 'pending' }).eq('id', deposit.id);
                  throw new Error("فشل تحديث الرصيد. تم إلغاء قبول الإيداع.");
              }
          }

          setDeposits(prev => prev.map(d => 
              d.id === deposit.id ? { ...d, status: status } : d
          ));

          setToast({ 
              msg: status === 'approved' ? `تم قبول الإيداع وإضافة ${deposit.amount} MAD` : 'تم رفض الإيداع', 
              type: 'success' 
          });

      } catch (e: any) {
          console.error("Deposit Processing Error:", e);
          setToast({ msg: e.message || 'حدث خطأ أثناء معالجة الطلب', type: 'error' });
      } finally {
          setProcessingId(null);
      }
  };

  // --- Task Handlers ---
  const handleSaveTask = async (taskData: Partial<Task>) => {
      try {
          if (editingTask && editingTask.id) {
              // Update
              const { error } = await supabase.from('tasks').update(taskData).eq('id', editingTask.id);
              if (error) throw error;
              setToast({ msg: 'تم تحديث المهمة بنجاح', type: 'success' });
          } else {
              // Insert
              const { error } = await supabase.from('tasks').insert([taskData]);
              if (error) throw error;
              setToast({ msg: 'تم إضافة المهمة بنجاح', type: 'success' });
          }
          setShowTaskModal(false);
          setEditingTask(undefined);
          fetchTasks();
      } catch (e: any) {
          setToast({ msg: e.message || 'حدث خطأ أثناء حفظ المهمة', type: 'error' });
      }
  };

  const handleToggleTaskStatus = async (task: Task) => {
      try {
          const { error } = await supabase.from('tasks').update({ is_active: !task.is_active }).eq('id', task.id);
          if (error) throw error;
          // Optimistic update
          setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_active: !t.is_active } : t));
          setToast({ msg: !task.is_active ? 'تم تفعيل المهمة' : 'تم تعطيل المهمة', type: 'success' });
      } catch (e) {
          setToast({ msg: 'حدث خطأ أثناء تغيير الحالة', type: 'error' });
      }
  };

  // --- Bank Info Handlers ---
  const handleSaveDepositInfo = async (infoData: Partial<DepositInfo>) => {
    try {
        if (editingDepositInfo && editingDepositInfo.id) {
            const { error } = await supabase.from('deposit_info').update(infoData).eq('id', editingDepositInfo.id);
            if (error) throw error;
            setToast({ msg: 'تم تحديث بيانات البنك بنجاح', type: 'success' });
        } else {
            const { error } = await supabase.from('deposit_info').insert([infoData]);
            if (error) throw error;
            setToast({ msg: 'تم إضافة البنك بنجاح', type: 'success' });
        }
        setShowDepositInfoModal(false);
        setEditingDepositInfo(undefined);
        fetchDepositInfos();
    } catch (e: any) {
        setToast({ msg: e.message || 'حدث خطأ أثناء حفظ البيانات', type: 'error' });
    }
  };

  const handleDeleteDepositInfo = async (id: string) => {
      if(!window.confirm("هل أنت متأكد من حذف هذا البنك؟")) return;
      try {
          const { error } = await supabase.from('deposit_info').delete().eq('id', id);
          if (error) throw error;
          setToast({ msg: 'تم حذف البنك بنجاح', type: 'success' });
          fetchDepositInfos();
      } catch (e: any) {
          setToast({ msg: 'حدث خطأ أثناء الحذف', type: 'error' });
      }
  };

  // --- NEW HANDLERS FOR NEW SECTIONS ---

  // VIP Level Management
  const handleSaveVipLevel = async (vipData: any) => {
      try {
          if (editingVipLevel && editingVipLevel.id) {
              const { error } = await supabase.from('vip_levels').update(vipData).eq('id', editingVipLevel.id);
              if (error) throw error;
              setToast({ msg: 'تم تحديث VIP بنجاح', type: 'success' });
          } else {
              const { error } = await supabase.from('vip_levels').insert([vipData]);
              if (error) throw error;
              setToast({ msg: 'تم إضافة VIP بنجاح', type: 'success' });
          }
          setShowVipLevelModal(false);
          setEditingVipLevel(undefined);
          fetchVipLevels();
      } catch (e: any) {
          setToast({ msg: e.message || 'حدث خطأ أثناء الحفظ', type: 'error' });
      }
  };

  // User Bank Update (Withdrawals table)
  const handleUpdateUserBank = async (data: any) => {
      if (!editingUserBank) return;
      try {
          const { error } = await supabase.from('withdrawals').update({
              full_name: data.full_name,
              bank_name: data.bank_name,
              account_number: data.account_number
          }).eq('id', editingUserBank.id);

          if (error) throw error;
          setToast({ msg: 'تم تحديث معلومات البنك بنجاح', type: 'success' });
          setEditingUserBank(undefined);
          fetchUserBanks();
      } catch (e: any) {
          setToast({ msg: 'حدث خطأ أثناء التحديث', type: 'error' });
      }
  };

  // Admin Give VIP
  const handleGiveVip = async (vipId: number, price: number) => {
      if (!givingVipUser) return;
      try {
          // This call needs to handle numeric vip_level correctly in database trigger if any
          const { error } = await supabase.from('vip_purchases').insert({
              user_id: givingVipUser.id,
              vip_level_id: vipId,
              amount_paid: price,
              purchased_at: new Date().toISOString()
          });
          if (error) throw error;
          
          // Also update the user's vip_level in the users table to reflect the change immediately
          // Note: vipId corresponds to level in simple setup, but safer to get level from id
          const vipLevelObj = vipLevels.find(v => v.id === vipId);
          if (vipLevelObj) {
              await supabase.from('users').update({ vip_level: vipLevelObj.level }).eq('id', givingVipUser.id);
          }
          
          setToast({ msg: `تم منح VIP للمستخدم ${givingVipUser.username}`, type: 'success' });
          setShowGiveVipModal(false);
          setGivingVipUser(null);
          fetchUsers(); // Refresh user list to show new VIP level
      } catch (e: any) {
          setToast({ msg: e.message || 'حدث خطأ أثناء العملية', type: 'error' });
      }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload(); 
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 font-sans selection:bg-primary/30">
      {toast && <AdminToast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      
      {editingUser && <BalanceEditModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleUpdateBalance} />}
      
      {/* Detail Modal */}
      {viewingUser && <UserDetailModal user={viewingUser} onClose={() => setViewingUser(null)} />}

      {showTaskModal && (
          <TaskModal 
              task={editingTask} 
              onClose={() => { setShowTaskModal(false); setEditingTask(undefined); }} 
              onSave={handleSaveTask} 
          />
      )}
      
      {showDepositInfoModal && (
          <DepositInfoModal
             info={editingDepositInfo}
             onClose={() => { setShowDepositInfoModal(false); setEditingDepositInfo(undefined); }}
             onSave={handleSaveDepositInfo}
          />
      )}
      
      {/* NEW MODALS */}
      {showVipLevelModal && (
          <VipLevelModal 
              vip={editingVipLevel} 
              onClose={() => { setShowVipLevelModal(false); setEditingVipLevel(undefined); }} 
              onSave={handleSaveVipLevel}
          />
      )}
      
      {editingUserBank && (
          <UserBankEditModal 
              bankData={editingUserBank} 
              onClose={() => setEditingUserBank(undefined)} 
              onSave={handleUpdateUserBank}
          />
      )}
      
      {showGiveVipModal && givingVipUser && (
          <AdminGiveVipModal 
              user={givingVipUser}
              vips={vipLevels.length > 0 ? vipLevels : []} 
              onClose={() => { setShowGiveVipModal(false); setGivingVipUser(null); }}
              onConfirm={handleGiveVip}
          />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-[#141414] p-4 rounded-2xl border border-[#2A2A2A] gap-4">
            <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-xl text-primary"><CreditCard className="w-6 h-6" /></div>
                <div>
                    <h1 className="text-xl font-bold">Admin Panel</h1>
                    <p className="text-xs text-gray-500">لوحة التحكم</p>
                </div>
            </div>

            {/* View Switcher */}
            <div className="flex gap-2 bg-[#0f0f0f] p-1 rounded-xl border border-[#2A2A2A] overflow-x-auto max-w-full">
                <button 
                    onClick={() => handleSwitchView('users')} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${view === 'users' ? 'bg-[#222] text-primary shadow-lg shadow-black/50' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <Users className="w-4 h-4" /> المستخدمين
                </button>
                <button 
                    onClick={() => handleSwitchView('withdrawals')} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${view === 'withdrawals' ? 'bg-[#222] text-primary shadow-lg shadow-black/50' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <Banknote className="w-4 h-4" /> السحوبات
                </button>
                <button 
                    onClick={() => handleSwitchView('deposits')} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${view === 'deposits' ? 'bg-[#222] text-primary shadow-lg shadow-black/50' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <ArrowDownCircle className="w-4 h-4" /> الإيداعات
                </button>
                <button 
                    onClick={() => handleSwitchView('tasks')} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${view === 'tasks' ? 'bg-[#222] text-primary shadow-lg shadow-black/50' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <ClipboardList className="w-4 h-4" /> المهام
                </button>
                <button 
                    onClick={() => handleSwitchView('bank_info')} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${view === 'bank_info' ? 'bg-[#222] text-primary shadow-lg shadow-black/50' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <Landmark className="w-4 h-4" /> معلومات البنوك
                </button>
                <button 
                    onClick={() => handleSwitchView('user_banks')} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${view === 'user_banks' ? 'bg-[#222] text-primary shadow-lg shadow-black/50' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <Database className="w-4 h-4" /> بنوك المستخدمين
                </button>
                <button 
                    onClick={() => handleSwitchView('vip_levels')} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${view === 'vip_levels' ? 'bg-[#222] text-primary shadow-lg shadow-black/50' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <Gift className="w-4 h-4" /> VIP
                </button>
            </div>

            <button onClick={handleLogout} className="text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-colors"><LogOut className="w-5 h-5" /></button>
        </div>

        {/* Search - Only for Users */}
        {view === 'users' && (
            <div className="mb-6 relative">
                <input 
                    type="text" 
                    placeholder="بحث عن مستخدم (الاسم أو الهاتف)..." 
                    className="w-full bg-[#141414] border border-[#2A2A2A] text-white py-4 px-6 pr-12 rounded-2xl focus:outline-none focus:border-primary text-right"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            </div>
        )}

        {/* Add Buttons (Tasks & Bank Info & VIP) */}
        {view === 'tasks' && (
            <div className="mb-6 flex justify-end">
                <button 
                    onClick={() => { setEditingTask(undefined); setShowTaskModal(true); }}
                    className="bg-primary text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20"
                >
                    <Plus className="w-5 h-5" /> إضافة مهمة جديدة
                </button>
            </div>
        )}

        {view === 'bank_info' && (
             <div className="mb-6 flex justify-end">
                <button 
                    onClick={() => { setEditingDepositInfo(undefined); setShowDepositInfoModal(true); }}
                    className="bg-primary text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20"
                >
                    <Plus className="w-5 h-5" /> إضافة بنك جديد
                </button>
            </div>
        )}

        {view === 'vip_levels' && (
             <div className="mb-6 flex justify-end">
                <button 
                    onClick={() => { setEditingVipLevel(undefined); setShowVipLevelModal(true); }}
                    className="bg-primary text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20"
                >
                    <Plus className="w-5 h-5" /> إضافة VIP
                </button>
            </div>
        )}

        {/* Content Table */}
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
                {view === 'users' ? (
                    /* USERS TABLE */
                    <table className="w-full text-right min-w-[800px]">
                        <thead className="bg-[#0f0f0f] text-gray-400 text-xs uppercase border-b border-[#2A2A2A]">
                            <tr>
                                <th className="p-5 font-medium w-24">ID</th>
                                <th className="p-5 font-medium">المستخدم</th>
                                <th className="p-5 font-medium">رقم الهاتف</th>
                                <th className="p-5 font-medium">VIP</th>
                                <th className="p-5 font-medium">تاريخ التسجيل</th>
                                <th className="p-5 font-medium">الرصيد</th>
                                <th className="p-5 font-medium w-48">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2A2A2A] text-sm">
                            {loading ? (
                                <tr><td colSpan={7} className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={7} className="p-10 text-center text-gray-500">لا يوجد مستخدمين</td></tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u.id} className="hover:bg-[#1a1a1a] transition-colors group">
                                        <td className="p-5 text-gray-600 font-mono text-xs" title={u.id}>{u.id.substring(0, 8)}...</td>
                                        <td className="p-5 font-bold text-white">{u.username}</td>
                                        <td className="p-5 text-gray-400 font-mono tracking-wider flex items-center gap-2"><CreditCard className="w-3 h-3 text-gray-600" /> {u.phone}</td>
                                        <td className="p-5"><span className={`px-2 py-1 rounded text-xs font-bold border ${(u.vip_level) > 0 ? 'bg-primary/10 text-primary border-primary/20' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>{u.vip_level === 0 ? 'Intern' : `VIP ${u.vip_level}`}</span></td>
                                        <td className="p-5 text-gray-500 text-xs font-mono">{new Date(u.created_at).toLocaleDateString('en-GB')}</td>
                                        <td className="p-5 font-mono font-bold text-green-500 text-base">{u.balance.toFixed(2)}</td>
                                        <td className="p-5 flex gap-2">
                                            <button 
                                                onClick={() => setViewingUser(u)} 
                                                className="bg-[#222] hover:bg-gray-700 text-gray-300 p-2 rounded-lg transition-all border border-[#333]" 
                                                title="عرض التفاصيل"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setEditingUser(u)} className="bg-[#222] hover:bg-primary hover:text-black text-gray-300 px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-2 border border-[#333] hover:border-primary">
                                                <Edit className="w-3 h-3" /> تعديل
                                            </button>
                                            <button 
                                                onClick={async () => {
                                                    // Lazy load VIP levels if not yet loaded
                                                    if(vipLevels.length === 0) {
                                                        const { data } = await supabase.from('vip_levels').select('*');
                                                        if(data) setVipLevels(data);
                                                    }
                                                    setGivingVipUser(u);
                                                    setShowGiveVipModal(true);
                                                }} 
                                                className="bg-primary/10 hover:bg-primary hover:text-black text-primary px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-2 border border-primary/20"
                                            >
                                                <Gift className="w-3 h-3" /> VIP
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                ) : view === 'withdrawals' ? (
                    /* WITHDRAWALS TABLE */
                    <table className="w-full text-right min-w-[1000px]">
                        <thead className="bg-[#0f0f0f] text-gray-400 text-xs uppercase border-b border-[#2A2A2A]">
                            <tr>
                                <th className="p-5 font-medium w-24">User ID</th>
                                <th className="p-5 font-medium">الاسم الكامل</th>
                                <th className="p-5 font-medium">البنك</th>
                                <th className="p-5 font-medium">المبلغ المطلوب</th>
                                <th className="p-5 font-medium">الخصم (9%)</th>
                                <th className="p-5 font-medium">الصافي</th>
                                <th className="p-5 font-medium">الحالة</th>
                                <th className="p-5 font-medium">التاريخ</th>
                                <th className="p-5 font-medium text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2A2A2A] text-sm">
                            {loading ? (
                                <tr><td colSpan={9} className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></td></tr>
                            ) : withdrawals.length === 0 ? (
                                <tr><td colSpan={9} className="p-10 text-center text-gray-500">لا توجد طلبات سحب</td></tr>
                            ) : (
                                withdrawals.map((w) => {
                                    const amount = w.amount || 0;
                                    const fee = amount * 0.09;
                                    const net = amount - fee;
                                    const isPending = w.status === 'pending';
                                    const isProcessing = processingId === w.id;

                                    return (
                                        <tr key={w.id} className="hover:bg-[#1a1a1a] transition-colors">
                                            <td className="p-5 text-gray-600 font-mono text-xs" title={w.user_id}>{w.user_id.substring(0, 8)}...</td>
                                            <td className="p-5 font-bold text-white">{w.full_name || '---'}</td>
                                            <td className="p-5">
                                                <div className="font-bold text-white text-xs">{w.bank_name}</div>
                                                <div className="text-[10px] text-gray-500 font-mono mt-0.5">{w.account_number}</div>
                                            </td>
                                            <td className="p-5 font-mono font-bold text-white">{amount.toFixed(2)}</td>
                                            <td className="p-5 font-mono text-red-400 text-xs">-{fee.toFixed(2)}</td>
                                            <td className="p-5 font-mono font-bold text-green-500 text-base">{net.toFixed(2)} MAD</td>
                                            <td className="p-5">
                                                <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase border ${
                                                    w.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                                                    w.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                                                    'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                }`}>
                                                    {w.status}
                                                </span>
                                            </td>
                                            <td className="p-5 text-gray-500 text-xs font-mono">{new Date(w.created_at).toLocaleDateString('en-GB')}</td>
                                            <td className="p-5">
                                                {isPending ? (
                                                    <div className="flex justify-center gap-2">
                                                        <button 
                                                            onClick={() => handleWithdrawalStatus(w.id, 'approved')}
                                                            disabled={isProcessing || processingId !== null}
                                                            title="قبول"
                                                            className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500 hover:text-white border border-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                        </button>
                                                        <button 
                                                            onClick={() => handleWithdrawalStatus(w.id, 'rejected')}
                                                            disabled={isProcessing || processingId !== null}
                                                            title="رفض"
                                                            className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white border border-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="text-center text-gray-600 text-xs">-</div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                ) : view === 'deposits' ? (
                    /* DEPOSITS TABLE */
                    <table className="w-full text-right min-w-[1000px]">
                        <thead className="bg-[#0f0f0f] text-gray-400 text-xs uppercase border-b border-[#2A2A2A]">
                            <tr>
                                <th className="p-5 font-medium w-24">User ID</th>
                                <th className="p-5 font-medium">الاسم الكامل</th>
                                <th className="p-5 font-medium">RIB</th>
                                <th className="p-5 font-medium">المبلغ</th>
                                <th className="p-5 font-medium">الطريقة</th>
                                <th className="p-5 font-medium">الإثبات</th>
                                <th className="p-5 font-medium">الحالة</th>
                                <th className="p-5 font-medium">التاريخ</th>
                                <th className="p-5 font-medium text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2A2A2A] text-sm">
                            {loading ? (
                                <tr><td colSpan={9} className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></td></tr>
                            ) : deposits.length === 0 ? (
                                <tr><td colSpan={9} className="p-10 text-center text-gray-500">لا توجد طلبات إيداع</td></tr>
                            ) : (
                                deposits.map((d) => {
                                    const isPending = d.status === 'pending';
                                    const isApproved = d.status === 'approved';
                                    const isProcessing = processingId === d.id;

                                    return (
                                        <tr key={d.id} className="hover:bg-[#1a1a1a] transition-colors">
                                            <td className="p-5 text-gray-600 font-mono text-xs" title={d.user_id}>{d.user_id.substring(0, 8)}...</td>
                                            <td className="p-5 font-bold text-white">{d.full_name || '---'}</td>
                                            <td className="p-5 font-mono text-gray-300 text-xs select-all" title="اضغط للنسخ">{d.rib || '---'}</td>
                                            <td className="p-5 font-mono font-bold text-green-500 text-base">+{d.amount.toFixed(2)} MAD</td>
                                            <td className="p-5 text-gray-400 text-xs">{d.payment_method}</td>
                                            <td className="p-5">
                                                <DepositImage path={d.proof_url} />
                                            </td>
                                            <td className="p-5">
                                                <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase border ${
                                                    d.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                                                    d.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                                                    'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                }`}>
                                                    {d.status === 'approved' ? 'مقبول' : d.status === 'rejected' ? 'مرفوض' : 'قيد الانتظار'}
                                                </span>
                                            </td>
                                            <td className="p-5 text-gray-500 text-xs font-mono">{new Date(d.created_at).toLocaleDateString('en-GB')}</td>
                                            <td className="p-5">
                                                {isPending ? (
                                                    <div className="flex justify-center gap-2">
                                                        <button 
                                                            onClick={() => handleDepositStatus(d, 'approved')}
                                                            disabled={isProcessing || processingId !== null}
                                                            title="قبول وإضافة الرصيد"
                                                            className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500 hover:text-white border border-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDepositStatus(d, 'rejected')}
                                                            disabled={isProcessing || processingId !== null}
                                                            title="رفض"
                                                            className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white border border-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                ) : isApproved && !d.referral_processed ? (
                                                    <button 
                                                        onClick={() => addReferralBonus(d.id)}
                                                        disabled={isProcessing || processingId !== null}
                                                        className="w-full bg-primary/10 hover:bg-primary hover:text-black text-primary border border-primary/30 rounded-lg py-1.5 px-3 text-[10px] font-bold transition-all flex items-center justify-center gap-1 shadow-lg shadow-primary/5"
                                                    >
                                                        {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'مكافأة +10%'}
                                                    </button>
                                                ) : isApproved && d.referral_processed ? (
                                                     <div className="text-center text-[10px] font-bold text-gray-500 bg-[#222] py-1 rounded border border-[#333]">تمت المكافأة</div>
                                                ) : (
                                                    <div className="text-center text-gray-600 text-xs">-</div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                ) : view === 'tasks' ? (
                    /* TASKS TABLE */
                    <table className="w-full text-right min-w-[800px]">
                        <thead className="bg-[#0f0f0f] text-gray-400 text-xs uppercase border-b border-[#2A2A2A]">
                            <tr>
                                <th className="p-5 font-medium w-16">ID</th>
                                <th className="p-5 font-medium">العنوان</th>
                                <th className="p-5 font-medium">المكافأة</th>
                                <th className="p-5 font-medium">VIP المطلوب</th>
                                <th className="p-5 font-medium">المدة</th>
                                <th className="p-5 font-medium">الحالة</th>
                                <th className="p-5 font-medium w-32">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2A2A2A] text-sm">
                            {loading ? (
                                <tr><td colSpan={7} className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></td></tr>
                            ) : tasks.length === 0 ? (
                                <tr><td colSpan={7} className="p-10 text-center text-gray-500">لا توجد مهام</td></tr>
                            ) : (
                                tasks.map((t) => (
                                    <tr key={t.id} className="hover:bg-[#1a1a1a] transition-colors group">
                                        <td className="p-5 text-gray-600 font-mono text-xs">{t.id}</td>
                                        <td className="p-5 font-bold text-white">
                                            <div className="mb-1">{t.title}</div>
                                            <a href={t.landing_url} target="_blank" rel="noreferrer" className="text-[10px] text-gray-500 hover:text-primary flex items-center gap-1">
                                                <LinkIcon className="w-3 h-3" /> رابط المهمة
                                            </a>
                                        </td>
                                        <td className="p-5 font-mono font-bold text-green-500">{t.reward.toFixed(2)} MAD</td>
                                        <td className="p-5"><span className="bg-[#222] px-2 py-1 rounded text-xs border border-[#333]">{t.vip_level === 0 ? 'Intern' : `VIP ${t.vip_level}`}</span></td>
                                        <td className="p-5 text-gray-400 text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> {t.duration_seconds}s</td>
                                        <td className="p-5">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${t.is_active ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                                {t.is_active ? 'نشطة' : 'متوقفة'}
                                            </span>
                                        </td>
                                        <td className="p-5 flex items-center gap-2">
                                            <button 
                                                onClick={() => { setEditingTask(t); setShowTaskModal(true); }}
                                                className="bg-[#222] hover:bg-primary hover:text-black text-gray-300 p-2 rounded-lg transition-all border border-[#333] hover:border-primary"
                                                title="تعديل"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleToggleTaskStatus(t)}
                                                className={`p-2 rounded-lg transition-all border ${t.is_active ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500 hover:text-white'}`}
                                                title={t.is_active ? 'إيقاف' : 'تفعيل'}
                                            >
                                                <Power className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                ) : view === 'user_banks' ? (
                    /* USER BANKS TABLE */
                    <table className="w-full text-right min-w-[800px]">
                        <thead className="bg-[#0f0f0f] text-gray-400 text-xs uppercase border-b border-[#2A2A2A]">
                            <tr>
                                <th className="p-5 font-medium w-24">User ID</th>
                                <th className="p-5 font-medium">الاسم الكامل</th>
                                <th className="p-5 font-medium">البنك</th>
                                <th className="p-5 font-medium">رقم الحساب (RIB)</th>
                                <th className="p-5 font-medium">تاريخ الإنشاء</th>
                                <th className="p-5 font-medium w-24">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2A2A2A] text-sm">
                            {loading ? (
                                <tr><td colSpan={6} className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></td></tr>
                            ) : userBanks.length === 0 ? (
                                <tr><td colSpan={6} className="p-10 text-center text-gray-500">لا توجد بيانات</td></tr>
                            ) : (
                                userBanks.map((b) => (
                                    <tr key={b.id} className="hover:bg-[#1a1a1a] transition-colors group">
                                        <td className="p-5 text-gray-600 font-mono text-xs" title={b.user_id}>{b.user_id.substring(0, 8)}...</td>
                                        <td className="p-5 font-bold text-white">{b.full_name}</td>
                                        <td className="p-5">{b.bank_name}</td>
                                        <td className="p-5 font-mono text-gray-300 text-xs">{b.account_number}</td>
                                        <td className="p-5 text-gray-500 text-xs font-mono">{new Date(b.created_at).toLocaleDateString('en-GB')}</td>
                                        <td className="p-5">
                                            <button 
                                                onClick={() => setEditingUserBank(b)}
                                                className="bg-[#222] hover:bg-primary hover:text-black text-gray-300 p-2 rounded-lg transition-all border border-[#333] hover:border-primary"
                                                title="تعديل"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                ) : view === 'vip_levels' ? (
                    /* VIP LEVELS TABLE */
                    <table className="w-full text-right min-w-[800px]">
                        <thead className="bg-[#0f0f0f] text-gray-400 text-xs uppercase border-b border-[#2A2A2A]">
                            <tr>
                                <th className="p-5 font-medium">مستوى</th>
                                <th className="p-5 font-medium">الاسم</th>
                                <th className="p-5 font-medium">السعر</th>
                                <th className="p-5 font-medium">مهام يومية</th>
                                <th className="p-5 font-medium">دخل يومي</th>
                                <th className="p-5 font-medium">مهام شهرية</th>
                                <th className="p-5 font-medium">دخل شهري</th>
                                <th className="p-5 font-medium w-24">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2A2A2A] text-sm">
                            {loading ? (
                                <tr><td colSpan={8} className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></td></tr>
                            ) : vipLevels.length === 0 ? (
                                <tr><td colSpan={8} className="p-10 text-center text-gray-500">لا توجد مستويات VIP</td></tr>
                            ) : (
                                vipLevels.map((v) => (
                                    <tr key={v.id} className="hover:bg-[#1a1a1a] transition-colors group">
                                        <td className="p-5 font-bold text-white">{v.level}</td>
                                        <td className="p-5 text-white">{v.name}</td>
                                        <td className="p-5 font-mono text-primary font-bold">{v.price}</td>
                                        <td className="p-5">{v.daily_tasks}</td>
                                        <td className="p-5 text-green-500">{v.daily_income}</td>
                                        <td className="p-5">{v.monthly_tasks || '-'}</td>
                                        <td className="p-5 text-green-500">{v.monthly_income}</td>
                                        <td className="p-5">
                                            <button 
                                                onClick={() => { setEditingVipLevel(v); setShowVipLevelModal(true); }}
                                                className="bg-[#222] hover:bg-primary hover:text-black text-gray-300 p-2 rounded-lg transition-all border border-[#333] hover:border-primary"
                                                title="تعديل"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                ) : (
                    /* BANK INFO TABLE */
                    <table className="w-full text-right min-w-[800px]">
                        <thead className="bg-[#0f0f0f] text-gray-400 text-xs uppercase border-b border-[#2A2A2A]">
                            <tr>
                                <th className="p-5 font-medium w-16">ID</th>
                                <th className="p-5 font-medium">اسم البنك</th>
                                <th className="p-5 font-medium">رقم الحساب (RIB)</th>
                                <th className="p-5 font-medium">صاحب الحساب</th>
                                <th className="p-5 font-medium">الحالة</th>
                                <th className="p-5 font-medium w-32">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2A2A2A] text-sm">
                            {loading ? (
                                <tr><td colSpan={6} className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></td></tr>
                            ) : depositInfos.length === 0 ? (
                                <tr><td colSpan={6} className="p-10 text-center text-gray-500">لا توجد بنوك مضافة</td></tr>
                            ) : (
                                depositInfos.map((info) => (
                                    <tr key={info.id} className="hover:bg-[#1a1a1a] transition-colors group">
                                        <td className="p-5 text-gray-600 font-mono text-xs">{info.id}</td>
                                        <td className="p-5 font-bold text-white flex items-center gap-2">
                                            <Landmark className="w-4 h-4 text-gray-500" />
                                            {info.bank_name}
                                        </td>
                                        <td className="p-5 font-mono text-gray-300 tracking-wider">{info.account_number}</td>
                                        <td className="p-5 text-gray-400 flex items-center gap-2">
                                            <CreditCard className="w-3 h-3" />
                                            {info.account_holder_name}
                                        </td>
                                        <td className="p-5">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${info.is_active ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                                {info.is_active ? 'مفعل' : 'معطل'}
                                            </span>
                                        </td>
                                        <td className="p-5 flex items-center gap-2">
                                            <button 
                                                onClick={() => { setEditingDepositInfo(info); setShowDepositInfoModal(true); }}
                                                className="bg-[#222] hover:bg-primary hover:text-black text-gray-300 p-2 rounded-lg transition-all border border-[#333] hover:border-primary"
                                                title="تعديل"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteDepositInfo(info.id)}
                                                className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 p-2 rounded-lg transition-all border border-red-500/30"
                                                title="حذف"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination for Tables (Shared logic) */}
            {view !== 'tasks' && view !== 'bank_info' && view !== 'user_banks' && view !== 'vip_levels' && (
                <div className="flex items-center justify-between p-4 bg-[#0f0f0f] border-t border-[#2A2A2A]">
                    <span className="text-xs text-gray-500">صفحة {page} من {Math.ceil(total / PAGE_SIZE) || 1} • إجمالي {total}</span>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setPage(p => Math.max(1, p - 1))} 
                            disabled={page === 1}
                            className="p-2 rounded-lg hover:bg-[#222] disabled:opacity-30 transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </button>
                        <button 
                            onClick={() => setPage(p => p + 1)} 
                            disabled={page >= Math.ceil(total / PAGE_SIZE)}
                            className="p-2 rounded-lg hover:bg-[#222] disabled:opacity-30 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
