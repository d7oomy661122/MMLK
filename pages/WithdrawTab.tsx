
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, WithdrawalMethod } from '../types';
import { Input } from '../components/Input';
import { Loader2, ChevronRight, Banknote, Landmark, User as UserIcon, Hash, Edit2, AlertTriangle, Clock } from 'lucide-react';

// Defined amounts as per requirements: 10 options, starting from 30 to 10000
const PRESET_AMOUNTS = [30, 50, 100, 200, 300, 500, 1000, 2000, 5000, 10000];

const WithdrawTab = ({ user, setActiveTab, showToast }: { user: User | null, setActiveTab: (t: string) => void, showToast: (m: string, t: 'success' | 'error') => void }) => {
    const [savedMethod, setSavedMethod] = useState<WithdrawalMethod | null>(null);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Form State for Setup
    // Changed default to empty string to force user selection
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [fullName, setFullName] = useState('');

    useEffect(() => {
        if (!user) return;
        const fetchMethod = async () => {
            // Strictly fetch from Supabase to decide view
            const { data, error } = await supabase
                .from('withdrawal_methods')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();
            
            if (data) {
                setSavedMethod(data);
            }
            setLoading(false);
        };
        fetchMethod();
    }, [user]);

    const handleSaveMethod = async () => {
        if (!user) return;
        // Added validation for bankName
        if (!fullName || !accountNumber || !bankName) {
            showToast('جميع الحقول مطلوبة', 'error');
            return;
        }
        setSubmitting(true);
        try {
            const { data, error } = await supabase.from('withdrawal_methods').insert({
                user_id: user.id,
                bank_name: bankName,
                account_number: accountNumber,
                full_name: fullName
            }).select().single();

            if (error) throw error;
            
            showToast('تم حفظ معلومات السحب بنجاح', 'success');
            if (data) setSavedMethod(data);
            
        } catch (e: any) {
            showToast(e.message || 'حدث خطأ أثناء الحفظ', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleWithdraw = async () => {
        if (!user || !savedMethod) return;
        
        const val = parseFloat(amount);
        
        // Validation 1: Check if valid number
        if (isNaN(val) || val <= 0) {
            showToast('يرجى اختيار مبلغ للسحب', 'error');
            return;
        }

        // Validation 2: Check against allowed presets
        if (!PRESET_AMOUNTS.includes(val)) {
            showToast('المبلغ المختار غير متاح، يرجى اختيار مبلغ من القائمة', 'error');
            return;
        }

        setSubmitting(true);
        try {
            // Secure Server-Side Execution
            const { data, error } = await supabase.rpc('request_withdrawal_secure', {
                p_amount: val
            });

            if (error) throw error;

            if (data && data.success) {
                showToast(data.message, 'success'); // Success message from DB
                setActiveTab('profile'); 
            } else {
                // Show the specific logic error from DB (e.g., "Time window closed", "Insufficient balance")
                showToast(data?.message || 'تعذر إتمام العملية', 'error');
            }
        } catch (e: any) {
            console.error("Withdraw Error:", e);
            // Show actual technical error message instead of generic one
            showToast(e.message || 'حدث خطأ غير متوقع', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditAttempt = () => {
        showToast('لتعديل معلومات السحب، يرجى التواصل مع الدعم', 'error');
    };

    if (loading) return <div className="pt-20 text-center"><Loader2 className="w-8 h-8 mx-auto text-primary animate-spin" /></div>;

    // Calculation for display only
    const reqAmount = parseFloat(amount) || 0;
    const fee = reqAmount * 0.09;
    const netAmount = reqAmount - fee;

    return (
        <div className="pt-12 px-5 pb-24 animate-slide-up">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setActiveTab('profile')} className="p-2 bg-[#1C1C1C] rounded-xl border border-[#2A2A2A] text-gray-400 hover:text-white"><ChevronRight className="w-5 h-5" /></button>
                <h1 className="text-2xl font-bold text-white">سحب الأرباح</h1>
            </div>

            {!savedMethod ? (
                /* SETUP VIEW */
                <div className="bg-[#141414] border border-[#2A2A2A] rounded-3xl p-6">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Banknote className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-lg font-bold text-white">إعداد معلومات السحب</h2>
                        {/* Updated Text */}
                        <p className="text-xs text-gray-500 mt-1">يجب التأكد من صحة جميع المعلومات قبل الحفظ</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2 mr-1">البنك</label>
                            <div className="relative group brand-input rounded-xl overflow-hidden">
                                <select 
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    className="w-full bg-[#0f0f0f] text-white py-3.5 px-4 text-right focus:outline-none appearance-none"
                                >
                                    {/* Default placeholder option */}
                                    <option value="" disabled>اختر البنك</option>
                                    {['CIH Bank', 'Al Barid Bank', 'Attijari Bank', 'BMCE', 'Lbankalik'].map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                                <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            </div>
                        </div>

                        <Input label="الاسم الكامل" placeholder="الاسم كما في البنك" value={fullName} onChange={(e) => setFullName(e.target.value)} leftElement={<UserIcon className="w-5 h-5" />} />
                        <Input label="رقم الحساب (RIB)" placeholder="24 رقم" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} leftElement={<Hash className="w-5 h-5" />} />
                    
                        <button onClick={handleSaveMethod} disabled={submitting} className="w-full bg-primary text-black py-4 rounded-xl font-bold mt-4 hover:bg-primary-hover transition-all">
                            {submitting ? <Loader2 className="animate-spin w-5 h-5 mx-auto"/> : 'حفظ المعلومات'}
                        </button>
                    </div>
                </div>
            ) : (
                /* WITHDRAW REQUEST VIEW */
                <div className="space-y-6">
                    <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-2xl p-5 relative overflow-hidden">
                         <div className="flex justify-between items-start mb-4">
                             <div className="flex items-center gap-3">
                                 <div className="p-2 bg-[#222] rounded-lg text-primary"><Landmark className="w-5 h-5" /></div>
                                 <div>
                                     <div className="text-sm font-bold text-white">{savedMethod.bank_name}</div>
                                     <div className="text-xs text-gray-500">{savedMethod.full_name}</div>
                                 </div>
                             </div>
                             <button onClick={handleEditAttempt} className="p-2 bg-[#222] rounded-lg text-gray-500 hover:text-white transition-colors">
                                 <Edit2 className="w-4 h-4" />
                             </button>
                         </div>
                         <div className="bg-[#111] p-3 rounded-xl border border-[#222] flex justify-between items-center">
                             <span className="font-mono text-gray-300 tracking-wider text-sm truncate">{savedMethod.account_number}</span>
                             <span className="text-[10px] text-gray-500">RIB</span>
                         </div>
                    </div>

                    <div className="bg-[#141414] border border-[#2A2A2A] rounded-3xl p-6">
                        <div className="mb-6">
                            <span className="text-sm font-bold text-gray-400">المبلغ المراد سحبه</span>
                        </div>
                        
                        {reqAmount > 0 && (
                            <div className="bg-[#111] rounded-xl p-3 mb-6 border border-[#222] space-y-2">
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>المبلغ المطلوب</span>
                                    <span>{reqAmount.toFixed(2)} MAD</span>
                                </div>
                                <div className="flex justify-between text-xs text-red-400">
                                    <span>رسوم الخدمة (9%)</span>
                                    <span>-{fee.toFixed(2)} MAD</span>
                                </div>
                                <div className="border-t border-[#222] pt-2 flex justify-between text-sm font-bold text-white">
                                    <span>ستستلم</span>
                                    <span className="text-green-500">{netAmount.toFixed(2)} MAD</span>
                                </div>
                            </div>
                        )}

                        {/* Extended Grid for Presets - 2 Columns (5 rows) */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {PRESET_AMOUNTS.map(amt => (
                                <button 
                                    key={amt} 
                                    onClick={() => setAmount(amt.toString())} 
                                    className={`py-4 rounded-xl text-sm font-bold border transition-colors ${
                                        amount === amt.toString() 
                                            ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20' 
                                            : 'bg-[#222] hover:bg-[#333] text-gray-300 border-[#333]'
                                    }`}
                                >
                                    {amt} MAD
                                </button>
                            ))}
                        </div>

                        <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-4 mb-6 space-y-2">
                             <div className="flex items-start gap-2 text-[10px] text-yellow-500/80">
                                 <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                                 <span>الحد الأدنى للسحب 30 درهم</span>
                             </div>
                             <div className="flex items-start gap-2 text-[10px] text-yellow-500/80">
                                 <Clock className="w-3 h-3 shrink-0 mt-0.5" />
                                 <span>السحب متاح يومياً من 9 صباحاً إلى 5 مساءً</span>
                             </div>
                        </div>

                        <button onClick={handleWithdraw} disabled={submitting} className="w-full bg-primary text-black py-4 rounded-xl font-bold text-lg hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed">
                            {submitting ? <Loader2 className="animate-spin w-6 h-6 mx-auto"/> : 'تأكيد السحب'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WithdrawTab;
