
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { Loader2, ChevronRight, ArrowDownCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';

const DepositsHistoryTab = ({ user, setActiveTab }: { user: User | null, setActiveTab: (t: string) => void }) => {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            const { data } = await supabase
                .from('deposits')
                .select('id, amount, status, created_at, payment_method')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);
            setTransactions(data || []);
            setLoading(false);
        };
        fetchData();
    }, [user]);

    return (
        <div className="pt-12 px-5 pb-24 animate-slide-up">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setActiveTab('profile')} className="p-2 bg-[#1C1C1C] rounded-xl border border-[#2A2A2A] text-gray-400 hover:text-white"><ChevronRight className="w-5 h-5" /></button>
                <h1 className="text-2xl font-bold text-white">سجل الإيداع</h1>
            </div>

            <div className="space-y-3">
                {loading ? (
                    <div className="text-center py-10"><Loader2 className="w-8 h-8 mx-auto text-primary animate-spin" /></div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-10 bg-[#141414] border border-[#2A2A2A] rounded-2xl text-gray-500">
                        <ArrowDownCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">لا توجد عمليات إيداع</p>
                    </div>
                ) : (
                    transactions.map((item, idx) => (
                        <div key={idx} className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl ${
                                    item.status === 'approved' ? 'bg-green-500/10 text-green-500' : 
                                    item.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 
                                    'bg-yellow-500/10 text-yellow-500'
                                }`}>
                                    {item.status === 'approved' ? <CheckCircle2 className="w-5 h-5" /> : 
                                     item.status === 'rejected' ? <XCircle className="w-5 h-5" /> : 
                                     <Clock className="w-5 h-5" />}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white">{item.payment_method || 'تحويل بنكي'}</div>
                                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                                        {new Date(item.created_at).toLocaleDateString('en-GB')} • {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold font-mono text-green-500">
                                    {/* FIXED: Safe navigation for amount */}
                                    +{(item.amount || 0).toFixed(2)} MAD
                                </div>
                                <div className={`text-[10px] font-bold ${
                                    item.status === 'approved' ? 'text-green-500' : 
                                    item.status === 'rejected' ? 'text-red-500' : 'text-yellow-500'
                                }`}>
                                    {item.status === 'approved' ? 'مقبول' : item.status === 'rejected' ? 'مرفوض' : 'قيد الانتظار'}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DepositsHistoryTab;
