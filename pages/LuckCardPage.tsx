
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { ChevronRight, Loader2, Lock, Trophy, RotateCcw, HelpCircle, AlertCircle, Check, Zap, Users, ShieldCheck } from 'lucide-react';

interface LuckCardPageProps {
  user: User | null;
  setActiveTab: (tab: string) => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
  refreshUser: () => void;
}

const LuckCardPage: React.FC<LuckCardPageProps> = ({ user, setActiveTab, showToast, refreshUser }) => {
  const [loading, setLoading] = useState(true);
  
  // Game State Machine
  const [gameState, setGameState] = useState<'ready' | 'processing' | 'revealed'>('ready');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  
  // State: Grid of numbers
  const [cardGrid, setCardGrid] = useState<(number | null)[]>(Array(9).fill(null));
  
  // Security: Lock interaction immediately
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (user) {
        setLoading(false);
    }
  }, [user]);

  // Real-time attempts from server data
  const attempts = user?.luck_card_attempts || 0;

  // --- Game Logic ---
  const constructGrid = (winningIndex: number, winningAmount: number): number[] => {
      const fakePool = [1, 2, 3, 5, 8, 10, 15, 20, 50, 100, 250, 500];
      const shuffledFakes = fakePool.sort(() => Math.random() - 0.5);

      const grid: number[] = [];
      let fakePointer = 0;

      for (let i = 0; i < 9; i++) {
          if (i === winningIndex) {
              grid.push(winningAmount);
          } else {
              grid.push(shuffledFakes[fakePointer]);
              fakePointer = (fakePointer + 1) % shuffledFakes.length;
          }
      }
      return grid;
  };

  const generateRealReward = useCallback(() => {
      return Math.floor(Math.random() * 12) + 1;
  }, []);

  const handleCardClick = async (index: number) => {
    if (!user) return;
    
    // Security Checks
    if (gameState !== 'ready' || isProcessingRef.current) return;
    if (attempts <= 0) {
        showToast("لقد استنفذت محاولاتك، قم بالترقية للحصول على المزيد.", 'error');
        return;
    }

    isProcessingRef.current = true;
    setSelectedIndex(index);
    setGameState('processing'); // Start Flip Animation immediately
    
    try {
      // 1. Logic Calculation
      const realReward = generateRealReward();
      const finalGrid = constructGrid(index, realReward);
      
      // 2. Set Grid State (Numbers become available in DOM)
      setCardGrid(finalGrid);

      // 3. Backend Secure Call
      const { error } = await supabase.rpc('play_luck_card', {
          p_user_id: user.id,
          p_source: 'luck_card',
          p_reward_amount: realReward
      });

      if (error) throw error;
      
      // 4. Update UI Balance & Attempts
      refreshUser();

      // 5. Reveal All Cards after delay
      setTimeout(() => {
          setGameState('revealed');
          isProcessingRef.current = false;
      }, 800);

    } catch (e: any) {
      console.error("Game Error:", e);
      setGameState('ready');
      setSelectedIndex(null);
      setCardGrid(Array(9).fill(null)); 
      isProcessingRef.current = false;
      showToast(e.message || "حدث خطأ غير متوقع", 'error');
    }
  };

  // Reset Game Logic (Stay on page)
  const handleReset = () => {
      if (attempts > 0) {
          setGameState('ready');
          setSelectedIndex(null);
          setCardGrid(Array(9).fill(null));
      } else {
          showToast("لا توجد محاولات متبقية", 'error');
      }
  };

  const handleExit = () => {
      setActiveTab('home');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#09090B]"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#09090B] pb-10 relative overflow-hidden select-none font-sans text-right" dir="rtl">
       
       {/* Header */}
       <div className="pt-8 px-5 mb-6 flex items-center justify-between relative z-10 border-b border-[#27272A] pb-4 bg-[#09090B]/80 backdrop-blur-md sticky top-0">
          <div className="flex items-center gap-3">
             <div className="bg-[#18181B] border border-[#27272A] p-2 rounded-xl">
                <Trophy className="w-5 h-5 text-primary" />
             </div>
             <div>
                 <h1 className="text-lg font-bold text-white tracking-tight">بطاقة الحظ</h1>
                 <p className="text-[10px] text-gray-500 font-medium">الجوائز اليومية</p>
             </div>
          </div>
          <button 
             onClick={() => setActiveTab('home')} 
             className="w-9 h-9 bg-[#18181B] rounded-full flex items-center justify-center border border-[#27272A] text-gray-400 hover:text-white transition-colors"
          >
             <ChevronRight className="w-5 h-5" />
          </button>
       </div>

       <div className="px-5 max-w-sm mx-auto mt-2">
          
          {/* Real-time Status Bar */}
          <div className="flex justify-center mb-8">
             <div className={`
                 px-6 py-3 rounded-2xl border flex items-center gap-3 transition-all duration-300 shadow-lg
                 ${attempts > 0 
                    ? 'bg-[#18181B] border-primary/30' 
                    : 'bg-[#18181B] border-[#27272A]'
                 }
             `}>
                 {attempts > 0 ? (
                    <>
                        <div className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                        </div>
                        <span className="text-sm font-bold text-white">محاولاتك المتبقية: <span className="text-primary font-mono text-lg mx-1">{attempts}</span></span>
                    </>
                 ) : (
                    <>
                        <Lock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-bold text-gray-500">انتهت المحاولات لليوم</span>
                    </>
                 )}
             </div>
          </div>

          {/* THE GRID */}
          <div className="grid grid-cols-3 gap-3 mb-8 perspective-1000">
             {cardGrid.map((value, index) => {
                const isSelected = index === selectedIndex;
                const isRevealed = gameState === 'revealed';
                
                // Rotation Logic
                const shouldFlip = (isSelected && gameState !== 'ready') || isRevealed;
                
                // Winner Logic (The card clicked is implicitly the winner in this mechanic)
                const isWinner = isSelected; 
                const displayValue = value !== null ? value : 0;

                return (
                   <div 
                      key={index}
                      onClick={() => handleCardClick(index)}
                      className={`
                        aspect-[3/4] relative
                        ${attempts <= 0 && gameState === 'ready' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                        ${gameState !== 'ready' ? 'pointer-events-none' : ''}
                      `}
                   >
                      <div 
                         className={`
                            w-full h-full relative transition-transform duration-700 transform-style-3d
                            ${shouldFlip ? 'rotate-y-180' : ''}
                            ${gameState === 'ready' && attempts > 0 ? 'hover:scale-[1.02]' : ''}
                         `}
                      >
                         
                         {/* FRONT FACE (Hidden when flipped) */}
                         <div className="backface-hidden rounded-xl bg-[#18181B] border border-[#27272A] flex items-center justify-center z-20">
                            <div className="w-10 h-10 rounded-full bg-[#121214] flex items-center justify-center shadow-inner border border-[#222]">
                                <HelpCircle className="w-5 h-5 text-[#333]" />
                            </div>
                         </div>

                         {/* BACK FACE (Shown when flipped) */}
                         <div className={`
                            backface-hidden rotate-y-180 rounded-xl flex flex-col items-center justify-center border shadow-xl overflow-hidden z-10
                            ${isWinner 
                                ? 'bg-[#E0AA3E] border-[#E0AA3E]' 
                                : 'bg-[#121214] border-[#27272A]'
                            }
                         `}>
                             {/* Content Pushed Forward in Z-Space for Visibility */}
                             <div className="flex flex-col items-center leading-none relative z-30 translate-z-10">
                                 {isWinner && <Trophy className="w-6 h-6 mb-2 text-black fill-current animate-bounce" />}
                                 
                                 {value !== null ? (
                                    <span className={`font-black text-3xl tracking-tighter ${isWinner ? 'text-black' : 'text-gray-500'}`}>
                                        {displayValue}
                                    </span>
                                 ) : (
                                    <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                                 )}
                                 
                                 <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${isWinner ? 'text-black/80' : 'text-gray-600'}`}>
                                     MAD
                                 </span>
                             </div>

                             {isWinner && <div className="absolute inset-0 bg-white/20 animate-pulse z-20 pointer-events-none"></div>}
                         </div>
                      </div>
                   </div>
                );
             })}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-center min-h-[60px] mb-10">
             {gameState === 'revealed' ? (
                 attempts > 0 ? (
                    <button 
                        onClick={handleReset}
                        className="flex items-center gap-2 bg-primary text-black px-8 py-3 rounded-xl font-bold text-sm hover:bg-primary-hover transition-all animate-fade-in shadow-lg shadow-primary/20"
                    >
                        <RotateCcw className="w-4 h-4" />
                        العب مرة أخرى
                    </button>
                 ) : (
                    <button 
                        onClick={handleExit}
                        className="flex items-center gap-2 bg-[#27272A] text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-[#333] transition-all animate-fade-in"
                    >
                        <Check className="w-4 h-4" />
                        إنهاء
                    </button>
                 )
             ) : (
                 <div className="text-center">
                     {attempts > 0 ? (
                         <p className="text-xs text-gray-500 animate-pulse">اختر بطاقة لكشف جائزتك</p>
                     ) : (
                         <button onClick={() => setActiveTab('vip')} className="flex items-center gap-2 text-primary hover:text-white transition-colors text-xs font-bold border border-primary/20 px-4 py-2 rounded-lg bg-primary/5">
                             <Zap className="w-3 h-3" />
                             احصل على محاولات إضافية
                         </button>
                     )}
                 </div>
             )}
          </div>

          {/* Professional Instructions Section */}
          <div className="border-t border-[#27272A] pt-6">
              <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  كيف تضاعف فرصك؟
              </h3>
              
              <div className="space-y-3">
                  <div className="bg-[#141414] rounded-xl p-3 flex items-start gap-3 border border-[#222]">
                      <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500 shrink-0">
                          <Users className="w-4 h-4" />
                      </div>
                      <div>
                          <h4 className="text-white text-xs font-bold mb-0.5">دعوة الأصدقاء</h4>
                          <p className="text-[10px] text-gray-500 leading-relaxed">تحصل على محاولات إضافية فورية عند تسجيل أصدقائك وتفعيل حساباتهم.</p>
                      </div>
                  </div>

                  <div className="bg-[#141414] rounded-xl p-3 flex items-start gap-3 border border-[#222]">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                          <Zap className="w-4 h-4" />
                      </div>
                      <div>
                          <h4 className="text-white text-xs font-bold mb-0.5">ترقية العضوية</h4>
                          <p className="text-[10px] text-gray-500 leading-relaxed">أعضاء VIP يحصلون على عدد محاولات يومي أكبر وفرص ربح مضاعفة.</p>
                      </div>
                  </div>
              </div>
          </div>

       </div>
    </div>
  );
};

export default LuckCardPage;
