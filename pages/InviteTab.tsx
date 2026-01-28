import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { getVipLabel } from '../utils/helpers';
import { Loader2, Users, Link as LinkIcon, Key, Copy, CheckCircle2, User as UserIcon } from 'lucide-react';

const InviteTab = ({ user }: { user: User | null }) => {
   const [referrals, setReferrals] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [copied, setCopied] = useState(false);
   const [codeCopied, setCodeCopied] = useState(false);
   
   // Internal Pagination State
   const [page, setPage] = useState(0);
   const [hasMore, setHasMore] = useState(true);
   const [fetchingMore, setFetchingMore] = useState(false);
   const PAGE_SIZE = 50;

   // Initial Fetch
   useEffect(() => {
     if(!user) return;
     const fetchReferrals = async () => {
         const { data } = await supabase
            .from('users')
            .select('id, phone, created_at, vip_level')
            .eq('referral_by', user.id)
            .order('created_at', { ascending: false })
            .range(0, PAGE_SIZE - 1);
         
         setReferrals(data || []);
         if ((data || []).length < PAGE_SIZE) setHasMore(false);
         setLoading(false);
     };
     fetchReferrals();
   }, [user]);

   // Infinite Scroll Handler (Invisible Pagination)
   useEffect(() => {
       const handleScroll = () => {
           if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && !fetchingMore && hasMore && !loading) {
               loadMore();
           }
       };
       window.addEventListener('scroll', handleScroll);
       return () => window.removeEventListener('scroll', handleScroll);
   }, [fetchingMore, hasMore, loading, page, user]);

   const loadMore = async () => {
       if (!user) return;
       setFetchingMore(true);
       const nextPage = page + 1;
       const from = nextPage * PAGE_SIZE;
       const to = from + PAGE_SIZE - 1;

       const { data } = await supabase
            .from('users')
            .select('id, phone, created_at, vip_level')
            .eq('referral_by', user.id)
            .order('created_at', { ascending: false })
            .range(from, to);
       
       if (data && data.length > 0) {
           setReferrals(prev => [...prev, ...data]);
           setPage(nextPage);
           if (data.length < PAGE_SIZE) setHasMore(false);
       } else {
           setHasMore(false);
       }
       setFetchingMore(false);
   };

   const link = `https://brixa.site/register?ref=${user?.referral_code || 'CODE'}`;
   const handleCopyLink = () => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); };
   const handleCopyCode = () => { navigator.clipboard.writeText(user?.referral_code || ''); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); };
  
  return (
    <div className="pt-12 px-5 pb-20 animate-slide-up">
       <h1 className="text-2xl font-bold text-white mb-6">دعوة الأصدقاء</h1>
       <div className="bg-gradient-to-br from-[#1C1C1C] to-[#111] border border-[#2A2A2A] rounded-3xl p-6 relative overflow-hidden mb-6 shadow-xl group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-primary/20 transition-colors duration-500"></div>
          <div className="relative z-10 text-center mb-6">
             <p className="text-gray-400 text-xs font-medium mb-1">مجموع أرباح الإحالات</p>
             <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600 font-mono tracking-tight text-shadow">{(user?.total_referral_profit || 0).toFixed(2)} <span className="text-sm text-gray-500">MAD</span></h2>
          </div>
          <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-3 border border-white/5 text-center hover:bg-black/50 transition-colors">
                  <div className="text-[10px] text-gray-500 mb-1">دعواتك</div>
                  <div className="text-xl font-bold text-white">{user?.referral_count || 0}</div>
              </div>
              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-3 border border-white/5 text-center hover:bg-black/50 transition-colors">
                  <div className="text-[10px] text-gray-500 mb-1">أرباح اليوم</div>
                  <div className="text-xl font-bold text-yellow-500">{(user?.today_referral_profit || 0).toFixed(2)}</div>
              </div>
          </div>
       </div>

       <div className="space-y-4 mb-8">
            {/* Invite Link */}
            <div>
                <label className="text-sm font-bold text-white mb-2 block flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-primary" /> رابط الدعوة الخاص بك
                </label>
                <div className="bg-[#0f0f0f] border border-[#333] rounded-xl flex items-center p-2 relative">
                    <div className="flex-1 text-gray-400 text-xs font-mono truncate px-2">{link}</div>
                    <button onClick={handleCopyLink} className="p-2 bg-[#222] rounded-lg text-white hover:bg-primary hover:text-black transition-colors">
                        {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Referral Code */}
            <div>
                <label className="text-sm font-bold text-white mb-2 block flex items-center gap-2">
                    <Key className="w-4 h-4 text-primary" /> رمز الدعوة (Code)
                </label>
                <div className="bg-[#0f0f0f] border border-[#333] rounded-xl flex items-center p-2 relative">
                    <div className="flex-1 text-white text-lg font-bold font-mono tracking-widest text-center">{user?.referral_code}</div>
                    <button onClick={handleCopyCode} className="p-2 bg-[#222] rounded-lg text-white hover:bg-primary hover:text-black transition-colors absolute left-2">
                        {codeCopied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
            </div>
       </div>

        <div className="space-y-3">
            <h3 className="text-white font-bold text-lg mb-4">قائمة الفريق ({referrals.length})</h3>
            {loading && page === 0 ? (
                <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary"/></div>
            ) : referrals.length === 0 ? (
                <div className="text-center py-10 bg-[#111] rounded-2xl border border-[#222] text-gray-500">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">لا يوجد إحالات بعد</p>
                </div>
            ) : (
                <>
                {referrals.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-4 bg-[#141414] border border-[#2A2A2A] rounded-2xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#222] flex items-center justify-center">
                                <UserIcon className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-white">{r.phone}</div>
                                <div className="text-[10px] text-gray-500">{new Date(r.created_at).toLocaleDateString()}</div>
                            </div>
                        </div>
                        <div className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded border border-primary/20">
                            {getVipLabel(r.vip_level)}
                        </div>
                    </div>
                ))}
                {fetchingMore && <div className="text-center py-4"><Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-500"/></div>}
                </>
            )}
        </div>
    </div>
  );
};

export default InviteTab;