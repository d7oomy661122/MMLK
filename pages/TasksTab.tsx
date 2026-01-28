
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { User, Task } from '../types';
import { Loader2, Play, CheckCircle2, Lock, X, Zap, Trophy, ShieldAlert, Clock } from 'lucide-react';

const TasksTab = ({ user, showToast, refreshUser }: { user: User | null, showToast: (msg: string, type: 'success' | 'error') => void, refreshUser: () => void }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Execution State
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [verifying, setVerifying] = useState<number | null>(null); 

  // Helpers
  const userVipLevel = user?.vip_level || 0;

  // Intern Expiry Logic (Client-side visual check only for messaging)
  const isInternExpired = useMemo(() => {
      if (!user) return false;
      if (userVipLevel > 0) return false; 
      
      const start = user.intern_started_at ? new Date(user.intern_started_at) : new Date(user.created_at);
      const now = new Date();
      // Expiry after 4 days
      const expiryDate = new Date(start.getTime() + (4 * 24 * 60 * 60 * 1000));
      return now > expiryDate;
  }, [user, userVipLevel]);

  // --- FETCH TASKS ---
  useEffect(() => {
    const fetchTasks = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Fetch tasks using the strict RPC function
            // This function now handles the "4-day intern rule" and "Exact VIP level" logic on the server
            const { data, error } = await supabase.rpc('get_available_tasks', { 
                p_user_id: user.id 
            });
            
            if (error) throw error;
            
            // We use the data directly as the DB strictly filters it now
            setTasks(data || []);
            
        } catch (e: any) {
            console.error("Fetch Tasks Error:", e);
        } finally {
            setLoading(false);
        }
    };

    fetchTasks();
  }, [user?.id, user?.vip_level]); // Refetch when VIP level changes

  // Timer Logic
  useEffect(() => {
     let interval: any;
     if (showWebView && activeTask && timeLeft > 0) {
         interval = setInterval(() => {
             setTimeLeft((prev) => prev - 1);
         }, 1000);
     }
     return () => clearInterval(interval);
  }, [showWebView, activeTask, timeLeft]);

  // --- ACTIONS ---

  const handleStartTask = async (task: Task) => {
    if (!user) return;
    
    // UI Check: Completed?
    if (task.is_completed_today) {
        showToast("لقد أتممت هذه المهمة اليوم بالفعل.", 'error');
        return;
    }

    setVerifying(task.id);
    try {
        // SECURE CHECK: Check Eligibility via RPC
        const { data, error } = await supabase.rpc('check_task_eligibility', {
            p_user_id: user.id,
            p_task_id: task.id
        });

        if (error) throw error;
        
        const result = data && data.length > 0 ? data[0] : null;

        if (result && result.allowed === false) {
            // Handle specific DB rejection reasons
            const msg = result.reason || "غير مسموح";
            if (msg.includes('24') || msg.includes('مؤخراً')) {
                 setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_completed_today: true } : t));
                 showToast("تم إنجاز المهمة مسبقاً خلال 24 ساعة", 'error');
            } else {
                 showToast(msg, 'error');
            }
            return;
        }

        // Start
        setActiveTask(task);
        setTimeLeft(task.duration_seconds || 30); 
        setShowWebView(true);

    } catch (e) {
        showToast("تعذر بدء المهمة، تحقق من الاتصال", 'error');
    } finally {
        setVerifying(null);
    }
  };

  const handleCloseWebView = () => {
      if (claiming) return;
      if (timeLeft > 0) {
          if (!window.confirm("الخروج الآن سيلغي المكافأة. هل أنت متأكد؟")) return;
      }
      setShowWebView(false);
      setActiveTask(null);
  };

  const handleClaimReward = async () => {
      if (!activeTask || !user || timeLeft > 0) return;
      setClaiming(true);

      try {
          const { data, error } = await supabase.rpc('complete_task_secure', {
              p_task_id: activeTask.id
          });

          if (error) throw error;

          if (data && !data.success) {
              throw new Error(data.message);
          }

          showToast(`تمت إضافة ${(activeTask.reward || 0).toFixed(2)} MAD بنجاح`, 'success');
          
          setTasks(prev => prev.map(t => t.id === activeTask.id ? { ...t, is_completed_today: true } : t));
          refreshUser();
          setShowWebView(false);
          setActiveTask(null);

      } catch (err: any) {
          showToast(err.message || "حدث خطأ أثناء استلام المكافأة", 'error');
          setShowWebView(false);
          setActiveTask(null);
      } finally {
          setClaiming(false);
      }
  };

  if (loading && tasks.length === 0) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

  return (
    <>
    <div className="pb-32 animate-fade-in relative min-h-screen">
       
       <div className="fixed top-0 left-0 w-full h-full bg-[#050505] -z-20"></div>
       <div className="fixed top-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>

       <div className="pt-10 px-6 mb-8 flex items-center gap-3">
          <div className="p-2.5 bg-[#141414] rounded-xl border border-[#2A2A2A] shadow-sm">
             <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div>
              <h1 className="text-xl font-bold text-white tracking-wide">مركز المهام</h1>
              <p className="text-[10px] text-gray-500 font-medium">أكمل المهام اليومية لزيادة أرباحك</p>
          </div>
       </div>

       <div className="px-5 grid gap-3">
          {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-16 h-16 bg-[#141414] rounded-full flex items-center justify-center mb-4 border border-[#222]">
                      <ShieldAlert className="w-8 h-8 text-gray-600" />
                  </div>
                  <h3 className="text-white font-bold mb-1">لا توجد مهام متاحة</h3>
                  <p className="text-xs text-gray-500 max-w-[200px]">
                      {userVipLevel === 0 && isInternExpired 
                        ? "انتهت فترة المهام المجانية. قم بالترقية لمتابعة الربح."
                        : "لقد أنهيت جميع المهام المتاحة لمستواك حالياً."}
                  </p>
              </div>
          ) : (
            tasks.map((t, idx) => {
               const isCompleted = t.is_completed_today;
               const isVerifyingThis = verifying === t.id;

               return (
               <div 
                  key={t.id} 
                  className={`
                    group relative rounded-2xl overflow-hidden transition-all duration-300 border
                    ${isCompleted 
                        ? 'bg-[#0f0f0f] border-[#1A1A1A] opacity-60' 
                        : 'bg-[#141414] border-[#222] hover:border-primary/30'
                    }
                  `}
                  style={{ animationDelay: `${idx * 50}ms` }}
               >
                  <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className={`
                              w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors
                              ${isCompleted 
                                ? 'bg-[#181818] text-green-600' 
                                : 'bg-[#1C1C1C] text-gray-300 group-hover:text-primary group-hover:bg-primary/10'
                              }
                          `}>
                              {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Zap className="w-5 h-5 fill-current" />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                              <h3 className={`font-bold text-sm mb-1 truncate ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{t.title}</h3>
                              <div className="flex items-center gap-3">
                                  <span className={`text-xs font-mono font-bold ${isCompleted ? 'text-gray-600' : 'text-primary'}`}>
                                    +{t.reward} MAD
                                  </span>
                                  <div className="w-1 h-1 rounded-full bg-[#333]"></div>
                                  <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> {t.duration_seconds}s
                                  </span>
                              </div>
                          </div>
                      </div>

                      <div className="mr-4">
                          <button 
                            onClick={() => handleStartTask(t)}
                            disabled={!!isCompleted || !!isVerifyingThis}
                            className={`
                                h-10 px-5 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 min-w-[100px]
                                ${isCompleted 
                                    ? 'bg-[#181818] text-gray-600 border border-[#222] cursor-default' 
                                    : 'bg-white text-black hover:bg-primary hover:border-primary border border-transparent shadow-lg shadow-white/5'
                                }
                            `}
                          >
                             {isVerifyingThis ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                <>
                                    {isCompleted ? 'مكتملة' : 'بدء'}
                                    {!isCompleted && <Play className="w-3 h-3 fill-current" />}
                                </>
                             )}
                          </button>
                      </div>
                  </div>
               </div>
            )})
          )}
       </div>
    </div>

    {showWebView && activeTask && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in">
            <div className="h-14 bg-[#141414]/90 backdrop-blur-md border-b border-[#222] flex items-center justify-between px-4 shrink-0 z-20 absolute top-0 left-0 right-0">
                <button onClick={handleCloseWebView} className="w-8 h-8 flex items-center justify-center bg-[#222] rounded-full text-gray-400 hover:text-white transition-colors border border-[#333]">
                    <X className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-3">
                    {timeLeft > 0 ? (
                        <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-sm">
                             <div className="relative w-5 h-5 flex items-center justify-center">
                                <svg className="transform -rotate-90 w-full h-full">
                                    <circle cx="10" cy="10" r="8" stroke="#333" strokeWidth="2" fill="none" />
                                    <circle 
                                        cx="10" cy="10" r="8" 
                                        stroke="#E0AA3E" strokeWidth="2" fill="none" 
                                        strokeDasharray="50.26"
                                        strokeDashoffset={50.26 - ((activeTask.duration_seconds - timeLeft) / activeTask.duration_seconds) * 50.26}
                                        className="transition-all duration-1000 ease-linear"
                                    />
                                </svg>
                             </div>
                             <span className="text-[10px] font-bold text-gray-300 tabular-nums tracking-wider">Please wait...</span>
                        </div>
                    ) : (
                        <button 
                            onClick={handleClaimReward}
                            disabled={claiming}
                            className="bg-green-500 hover:bg-green-400 text-black px-4 py-1.5 rounded-full font-bold text-xs shadow-[0_0_15px_rgba(34,197,94,0.4)] animate-pulse flex items-center gap-2 transition-all"
                        >
                            {claiming ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                            استلام
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 bg-white relative w-full h-full pt-14">
                <iframe 
                    src={activeTask.landing_url} 
                    className="w-full h-full border-0"
                    title="Task Content"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                />
            </div>
        </div>
    )}
    </>
  );
};

export default TasksTab;
