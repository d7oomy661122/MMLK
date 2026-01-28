
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { Loader2, ChevronRight, ArrowUpRight, ArrowDownCircle, CheckCircle2 } from 'lucide-react';

const HistoryTab = ({ user, setActiveTab }: { user: User | null, setActiveTab: (t: string) => void }) => {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            const { data: w } = await supabase.from('withdrawals').select('id, amount, status, created_at, bank_name').eq('user_id', user.id).limit(20);
            const { data: d } = await supabase.from('deposits').select('id, amount, status, created_at, payment_method').eq('user_id', user.id).limit(20);
            const { data: t } = await supabase.from('task_completions').select('id, earned_amount, completed_at, tasks(title)').eq('user_id', user.id).limit(20);

            const all = [
                ...(w || []).map(x => ({ ...x, type: 'withdrawal', date: x.created_at })),
                ...(d || []).map(x => ({ ...x, type: 'deposit', date: x.created_at })),
                ...(t || []).map(x => ({ ...x, type: 'task', amount: x.earned_amount, date: x.completed_at, title: x.tasks?.title }))
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setTransactions(all);
            setLoading(false);
        };
        fetchData();
    }, [user]);

    return (
        <div className="pt-12 px-5 pb-24 animate-slide-up">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setActiveTab('profile')} className="p-2 bg-[#1C1C1C] rounded-xl border border-[#2A2A2A] text-gray-400 hover:text-white"><ChevronRight className="w-5 h-5" /></button>
                <h1 className="text-2xl font-bold text-white">سجل المعاملات</h1>
            </div>

            <div className="space-y-3">
                {loading ? (
                    <div className="text-center py-10"><Loader2 className="w-8 h-8 mx-auto text-primary animate-spin" /></div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">لا توجد معاملات بعد</div>
                ) : (
                    transactions.map((item, idx) => (
                        <div key={idx} className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl ${
                                    item.type === 'withdrawal' ? 'bg-red-500/10 text-red-500' : 
                                    item.type === 'deposit' ? 'bg-green-500/10 text-green-500' : 
                                    'bg-primary/10 text-primary'
                                }`}>
                                    {item.type === 'withdrawal' ? <ArrowUpRight className="w-5 h-5" /> : 
                                     item.type === 'deposit' ? <ArrowDownCircle className="w-5 h-5" /> : 
                                     <CheckCircle2 className="w-5 h-5" />}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white">
                                        {item.type === 'withdrawal' ? 'سحب أرباح' : 
                                         item.type === 'deposit' ? 'إيداع رصيد' : 
                                         item.title || 'مكافأة مهمة'}
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                                        {new Date(item.date).toLocaleDateString('en-GB')} • {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`font-bold font-mono ${item.type === 'withdrawal' ? 'text-white' : 'text-green-500'}`}>
                                    {/* FIXED: Safe navigation for amount */}
                                    {item.type === 'withdrawal' ? '-' : '+'}{(item.amount || 0).toFixed(2)}
                                </div>
                                {item.status && (
                                    <div className={`text-[10px] font-bold ${
                                        item.status === 'approved' ? 'text-green-500' : 
                                        item.status === 'rejected' ? 'text-red-500' : 'text-yellow-500'
                                    }`}>
                                        {item.status === 'approved' ? 'مقبول' : item.status === 'rejected' ? 'مرفوض' : 'قيد المعالجة'}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default HistoryTab;
