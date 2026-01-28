
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { User } from '../../../types';
import { 
    X, User as UserIcon, Phone, Calendar, Crown, Wallet, 
    ArrowUpRight, ArrowDownCircle, CheckCircle2, 
    TrendingUp, Activity, CreditCard, Clock, ShieldCheck
} from 'lucide-react';

interface UserDetailModalProps {
    user: User;
    onClose: () => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, onClose }) => {
    const [stats, setStats] = useState({
        totalDeposits: 0,
        totalWithdrawals: 0,
        pendingWithdrawals: 0,
        tasksCompleted: 0,
        totalTaskEarnings: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDeepDetails = async () => {
            try {
                // 1. Fetch Deposits Stats
                const { data: deposits, error: depError } = await supabase
                    .from('deposits')
                    .select('amount, status')
                    .eq('user_id', user.id);
                
                if (depError) throw depError;

                // 2. Fetch Withdrawals Stats
                const { data: withdrawals, error: withError } = await supabase
                    .from('withdrawals')
                    .select('amount, status')
                    .eq('user_id', user.id);

                if (withError) throw withError;

                // 3. Fetch Tasks Stats
                const { data: tasks, error: taskError } = await supabase
                    .from('task_completions')
                    .select('earned_amount')
                    .eq('user_id', user.id);

                if (taskError) throw taskError;

                // Calculations
                const approvedDeposits = deposits?.filter(d => d.status === 'approved').reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
                const approvedWithdrawals = withdrawals?.filter(w => w.status === 'approved').reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
                const pendingWith = withdrawals?.filter(w => w.status === 'pending').reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
                const taskEarnings = tasks?.reduce((acc, curr) => acc + (curr.earned_amount || 0), 0) || 0;

                setStats({
                    totalDeposits: approvedDeposits,
                    totalWithdrawals: approvedWithdrawals,
                    pendingWithdrawals: pendingWith,
                    tasksCompleted: tasks?.length || 0,
                    totalTaskEarnings: taskEarnings
                });

            } catch (err) {
                console.error("Error fetching details:", err);
                setError('تعذر تحميل البيانات المالية الإضافية');
            } finally {
                setLoading(false);
            }
        };

        fetchDeepDetails();
    }, [user.id]);

    const InfoCard = ({ icon: Icon, label, value, subValue, colorClass }: any) => (
        <div className="bg-[#111] p-4 rounded-xl border border-[#222] flex items-start gap-4 hover:border-[#333] transition-colors">
            <div className={`p-3 rounded-xl bg-[#181818] border border-[#2A2A2A] ${colorClass}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-xs text-gray-500 font-bold mb-1">{label}</p>
                <p className="text-white font-bold font-mono text-lg">{value}</p>
                {subValue && <p className="text-[10px] text-gray-600 mt-1">{subValue}</p>}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md px-4 animate-fade-in py-8">
            <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-3xl w-full max-w-4xl shadow-2xl animate-slide-up flex flex-col max-h-full overflow-hidden">
                
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-[#2A2A2A] bg-[#181818]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#222] flex items-center justify-center border border-[#333]">
                            <UserIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                {user.username}
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${user.vip_level > 0 ? 'bg-primary/10 text-primary border-primary/20' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                                    {user.vip_level === 0 ? 'Intern' : `VIP ${user.vip_level}`}
                                </span>
                            </h2>
                            <p className="text-xs text-gray-500 font-mono flex items-center gap-2">
                                <span className="select-all">ID: {user.id}</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#333] rounded-full text-gray-400 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    
                    {/* Section 1: Personal Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-[#141414] p-4 rounded-2xl border border-[#2A2A2A] flex items-center gap-3">
                            <Phone className="w-5 h-5 text-gray-500" />
                            <div>
                                <p className="text-[10px] text-gray-500">رقم الهاتف</p>
                                <p className="text-white font-mono font-bold select-all">{user.phone}</p>
                            </div>
                        </div>
                        <div className="bg-[#141414] p-4 rounded-2xl border border-[#2A2A2A] flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-gray-500" />
                            <div>
                                <p className="text-[10px] text-gray-500">تاريخ الانضمام</p>
                                <p className="text-white font-mono font-bold">
                                    {new Date(user.created_at).toLocaleDateString('en-GB')}
                                    <span className="text-gray-600 text-[10px] mx-1">{new Date(user.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </p>
                            </div>
                        </div>
                        <div className="bg-[#141414] p-4 rounded-2xl border border-[#2A2A2A] flex items-center gap-3">
                            <ShieldCheck className="w-5 h-5 text-gray-500" />
                            <div>
                                <p className="text-[10px] text-gray-500">الحالة</p>
                                <p className="text-green-500 font-bold flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> نشط
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Financial Stats */}
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" /> نظرة مالية شاملة
                    </h3>
                    
                    {loading ? (
                        <div className="py-8 text-center text-gray-500 animate-pulse">جاري تحميل البيانات المالية...</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <InfoCard 
                                icon={Wallet} 
                                label="الرصيد الحالي" 
                                value={`${user.balance.toFixed(2)} MAD`}
                                colorClass="text-white"
                            />
                            <InfoCard 
                                icon={ArrowDownCircle} 
                                label="مجموع الإيداعات" 
                                value={`${stats.totalDeposits.toFixed(2)} MAD`}
                                colorClass="text-green-500"
                            />
                            <InfoCard 
                                icon={ArrowUpRight} 
                                label="مجموع السحوبات" 
                                value={`${stats.totalWithdrawals.toFixed(2)} MAD`}
                                subValue={`+${stats.pendingWithdrawals.toFixed(2)} معلق`}
                                colorClass="text-red-500"
                            />
                            <InfoCard 
                                icon={TrendingUp} 
                                label="أرباح المهام" 
                                value={`${stats.totalTaskEarnings.toFixed(2)} MAD`}
                                subValue={`${stats.tasksCompleted} مهمة منجزة`}
                                colorClass="text-blue-500"
                            />
                        </div>
                    )}

                    {/* Section 3: Referral Stats */}
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <Crown className="w-4 h-4 text-yellow-500" /> إحصائيات الفريق
                    </h3>
                    <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 mb-8">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center border-l border-[#222] last:border-0 pl-4">
                                <p className="text-gray-500 text-xs mb-1">عدد الإحالات</p>
                                <p className="text-2xl font-bold text-white">{user.referral_count}</p>
                            </div>
                            <div className="text-center border-l border-[#222] last:border-0 pl-4">
                                <p className="text-gray-500 text-xs mb-1">أرباح اليوم</p>
                                <p className="text-2xl font-bold text-yellow-500 font-mono">{(user.today_referral_profit || 0).toFixed(2)}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-gray-500 text-xs mb-1">إجمالي الأرباح</p>
                                <p className="text-2xl font-bold text-green-500 font-mono">{(user.total_referral_profit || 0).toFixed(2)}</p>
                            </div>
                         </div>
                    </div>

                    {/* Section 4: Additional Info */}
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-purple-500" /> معلومات إضافية
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-[#141414] p-4 rounded-2xl border border-[#2A2A2A]">
                             <p className="text-xs text-gray-500 mb-2 font-bold">كود الإحالة</p>
                             <div className="bg-[#111] p-3 rounded-lg font-mono text-center text-white tracking-widest border border-[#222]">
                                 {user.referral_code}
                             </div>
                        </div>
                        
                        <div className="bg-[#141414] p-4 rounded-2xl border border-[#2A2A2A]">
                             <p className="text-xs text-gray-500 mb-2 font-bold">تمت الدعوة بواسطة</p>
                             {user.referral_by ? (
                                 <div className="flex items-center gap-2 text-sm text-gray-300">
                                     <UserIcon className="w-4 h-4" />
                                     <span className="font-mono text-xs">{user.referral_by}</span>
                                 </div>
                             ) : (
                                 <div className="text-sm text-gray-600 italic">تسجيل مباشر (بدون إحالة)</div>
                             )}
                        </div>
                    </div>

                    {error && (
                        <div className="mt-6 p-3 bg-red-900/20 border border-red-900/50 rounded-xl text-red-400 text-xs text-center">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
