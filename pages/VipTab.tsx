
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, VipLevel } from '../types';
import { Loader2, Crown, Wallet, CheckCircle2, ClipboardList, Coins, Calendar, Lock, ShieldCheck } from 'lucide-react';
import PurchaseModal from '../components/PurchaseModal';

const VipTab = ({ user, showToast, refreshUser }: { user: User | null, showToast: (msg: string, type: 'success' | 'error') => void, refreshUser: () => void }) => {
  const [vips, setVips] = useState<VipLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [selectedVip, setSelectedVip] = useState<VipLevel | null>(null);

  useEffect(() => {
    if(!user) return;
    const fetchData = async () => {
        try {
            const { data: vipData, error } = await supabase
                .from('vip_levels')
                .select('*')
                .order('level', { ascending: true });
            
            if (error) throw error;
            if (vipData) setVips(vipData);
        } catch (e) {
            console.error("Secure fetch failed");
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [user]);

  const initiatePurchase = (vip: VipLevel) => {
    if (!user) return;
    
    // Strict Logic Checks
    if (vip.level === 0) return; // Ignore Intern clicks
    
    // Balance Check
    if (user.balance < vip.price) { 
        showToast("رصيدك الحالي غير كافٍ للترقية. يرجى شحن الرصيد.", 'error'); 
        return; 
    }
    
    setSelectedVip(vip);
  };

  const confirmPurchase = async () => {
    if (!selectedVip || !user) return;
    const vip = selectedVip;
    setSelectedVip(null);
    setProcessingId(vip.id);

    try {
      // 1. Secure Execution via RPC
      const { data, error } = await supabase.rpc('purchase_vip_level', {
          p_user_id: user.id,
          p_vip_level_id: vip.id
      });

      if (error) throw error;

      // 2. Success Feedback
      showToast(`تمت الترقية إلى ${vip.name} بنجاح!`, 'success');
      showToast("تم تحديث قائمة المهام الخاصة بك.", 'success');
      
      // 3. Force Refresh to update UI immediately
      await refreshUser();

    } catch (err: any) {
       console.error(err);
       const msg = err.message || "";
       
       if (msg.includes('Insufficient') || msg.includes('رصيدك')) {
           showToast("رصيدك غير كافٍ.", 'error');
       } else if (msg.includes('intern')) {
           showToast("حدث خطأ في تحديد الباقة.", 'error');
       } else {
           showToast("حدث خطأ أثناء المعالجة، يرجى المحاولة لاحقاً.", 'error');
       }
    } finally {
       setProcessingId(null);
    }
  };

  if (loading) return <div className="pt-32 text-center"><Loader2 className="w-8 h-8 mx-auto text-primary animate-spin" /></div>;

  return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-[#050505] to-black pb-32 relative overflow-x-hidden animate-fade-in select-none">
          
          {selectedVip && (
              <PurchaseModal vip={selectedVip} onClose={() => setSelectedVip(null)} onConfirm={confirmPurchase} />
          )}

          <div className="pt-12 px-6 pb-6 relative z-10">
              {/* Title Section */}
              <div className="flex justify-between items-start mb-8">
                <div>
                   <div className="flex items-center gap-2 mb-3">
                       <ShieldCheck className="w-5 h-5 text-primary" />
                       <span className="text-primary font-bold tracking-[0.1em] text-[10px] uppercase">Official Membership</span>
                   </div>
                   <h1 className="text-3xl font-extrabold text-white leading-tight">عضويات <br/>كبار الشخصيات</h1>
                </div>
              </div>

              {/* Balance Card */}
              <div className="bg-[#181818]/90 backdrop-blur-xl border border-[#2A2A2A] rounded-3xl p-6 flex items-center justify-between shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                  
                  <div className="flex items-center gap-5 relative z-10">
                      <div className="w-14 h-14 bg-[#222] rounded-2xl flex items-center justify-center text-primary shadow-inner border border-[#2A2A2A]">
                          <Wallet className="w-7 h-7" />
                      </div>
                      <div>
                          <p className="text-xs text-gray-500 font-bold mb-1">الرصيد المتاح</p>
                          <p className="text-white font-mono font-bold text-2xl tracking-tight">
                              {(user?.balance || 0).toFixed(2)} <span className="text-sm text-gray-500 font-sans">MAD</span>
                          </p>
                      </div>
                  </div>
              </div>
          </div>

          {/* VIP Levels Grid */}
          <div className="px-5 space-y-5 relative z-20">
              {vips.map((vip) => {
                  const userLevel = user?.vip_level || 0;
                  const isIntern = vip.level === 0;
                  const isCurrentRank = userLevel === vip.level;
                  // If user is VIP 2, VIP 1 is "Previous", VIP 3 is "Next"
                  const isPrevious = userLevel > vip.level;
                  
                  return (
                      <div key={vip.id} className="relative group">
                          <div className={`
                             relative z-10 bg-[#141414] border rounded-3xl overflow-hidden transition-all duration-300
                             ${isCurrentRank 
                                ? 'border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.05)]' 
                                : 'border-[#262626] hover:border-primary/20 hover:shadow-lg'
                             }
                          `}>
                              <div className="p-6">
                                  {/* Header */}
                                  <div className="flex justify-between items-start mb-6">
                                      <div className="flex items-center gap-4">
                                          <div className={`
                                              w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold border shadow-inner
                                              ${isCurrentRank 
                                                  ? 'bg-green-500/10 border-green-500/30 text-green-500' 
                                                  : (isIntern 
                                                      ? 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-600' 
                                                      : 'bg-[#1C1C1C] border-[#2A2A2A] text-gray-300')
                                              }
                                          `}>
                                              {isIntern ? '0' : vip.level}
                                          </div>
                                          <div>
                                              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                                  {vip.name}
                                                  {isCurrentRank && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                                  {!isCurrentRank && !isIntern && !isPrevious && <Lock className="w-3.5 h-3.5 text-gray-600" />}
                                              </h3>
                                              <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-1">
                                                  <ClipboardList className="w-3 h-3" />
                                                  <span>{vip.daily_tasks} مهام يومية</span>
                                              </div>
                                          </div>
                                      </div>
                                      <div className="text-right">
                                          <div className="text-primary font-bold font-mono text-xl">{vip.price} <span className="text-[10px] text-gray-500">MAD</span></div>
                                          {vip.price > 0 && <div className="text-[10px] text-gray-700 line-through decoration-red-900">{(vip.price * 1.15).toFixed(0)}</div>}
                                      </div>
                                  </div>

                                  {/* Stats Grid */}
                                  <div className="grid grid-cols-2 gap-3 mb-6">
                                      <div className="bg-[#111] rounded-2xl p-3 border border-[#1F1F1F]">
                                          <div className="text-[10px] text-gray-500 mb-1 flex items-center gap-1.5"><Coins className="w-3 h-3"/> الدخل اليومي</div>
                                          <div className="text-gray-200 font-bold font-mono text-sm">{vip.daily_income} MAD</div>
                                      </div>
                                      <div className="bg-[#111] rounded-2xl p-3 border border-[#1F1F1F]">
                                          <div className="text-[10px] text-gray-500 mb-1 flex items-center gap-1.5"><Calendar className="w-3 h-3"/> الدخل الشهري</div>
                                          <div className="text-primary font-bold font-mono text-sm">{vip.monthly_income} MAD</div>
                                      </div>
                                  </div>

                                  {/* Action Button */}
                                  <button
                                      onClick={() => !isIntern && !isCurrentRank && !isPrevious && initiatePurchase(vip)}
                                      disabled={processingId !== null || isIntern || isCurrentRank || isPrevious} 
                                      className={`
                                          w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300
                                          ${isCurrentRank 
                                              ? 'bg-green-500/10 text-green-500 border border-green-500/20 cursor-default'
                                              : (isIntern || isPrevious)
                                                  ? 'bg-[#1C1C1C] text-gray-600 border border-[#2A2A2A] cursor-not-allowed'
                                                  : 'bg-primary text-black hover:bg-primary-hover shadow-lg shadow-primary/10 active:scale-[0.98]'
                                          }
                                      `}
                                  >
                                      {processingId === vip.id ? <Loader2 className="animate-spin w-5 h-5" /> : 
                                       isCurrentRank ? 'مفعل حالياً' :
                                       isPrevious ? 'تمت الترقية' :
                                       isIntern ? 'الباقة الأساسية' :
                                       'ترقية الآن'}
                                  </button>
                              </div>
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>
  );
};

export default VipTab;
