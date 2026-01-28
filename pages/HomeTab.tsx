
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Zap, MessageCircle, Sparkles, Star, Flame, Gift, Trophy, Activity, Crown, Send, X } from 'lucide-react';
import { getVipLabel } from '../utils/helpers';
import LiveNotification from '../components/LiveNotification';
import EngagementCard from '../components/EngagementCard';
import CryptoRow from '../components/CryptoRow';

const HomeTab = ({ user, setActiveTab }: { user: any, setActiveTab?: (tab: string) => void }) => {
  const [cryptoData, setCryptoData] = useState<any[]>([]);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(true);

  // Security: Prevent closing via Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (isWelcomeOpen && e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
        }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    document.body.style.overflow = isWelcomeOpen ? 'hidden' : 'auto';
    return () => {
        window.removeEventListener('keydown', handleKeyDown, true);
        document.body.style.overflow = 'auto';
    };
  }, [isWelcomeOpen]);

  // Professional Assets & Icons (Reliable CDN Sources)
  const assets = {
      // Logo: Custom SVG Data URI - Scaled UP to fill the container better (reduced internal padding)
      // viewBox 0 0 200 200, Rect increased from 120 to 160 size to look bigger.
      logo: "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%20200%20200%27%3E%3Cdefs%3E%3ClinearGradient%20id%3D%27grad%27%20x1%3D%270%25%27%20y1%3D%270%25%27%20x2%3D%27100%25%27%20y2%3D%27100%25%27%3E%3Cstop%20offset%3D%270%25%27%20style%3D%27stop-color%3A%23FF9F1C%3Bstop-opacity%3A1%27%20%2F%3E%3Cstop%20offset%3D%27100%25%27%20style%3D%27stop-color%3A%23FFBF69%3Bstop-opacity%3A1%27%20%2F%3E%3C%2FlinearGradient%3E%3Cfilter%20id%3D%27shadow%27%3E%3CfeDropShadow%20dx%3D%270%27%20dy%3D%274%27%20stdDeviation%3D%274%27%20flood-opacity%3D%270.25%27%2F%3E%3C%2Ffilter%3E%3C%2Fdefs%3E%3Crect%20x%3D%2720%27%20y%3D%2720%27%20width%3D%27160%27%20height%3D%27160%27%20rx%3D%2740%27%20fill%3D%27url(%23grad)%27%20filter%3D%27url(%23shadow)%27%20%2F%3E%3Cpath%20d%3D%27M60%20140%20L90%20110%20L115%20135%20L155%2085%27%20stroke%3D%27white%27%20stroke-width%3D%2718%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%20fill%3D%27none%27%2F%3E%3Ccircle%20cx%3D%27155%27%20cy%3D%2785%27%20r%3D%2710%27%20fill%3D%27white%27%2F%3E%3C%2Fsvg%3E",
      
      // Luck Card: Gem Stone
      luck: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Gem%20Stone.png",
      
      // Event: Fire
      event: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Fire.png",
      
      // Daily Box: Updated to a transparent PNG gift box matching the style
      gift: "https://i.ibb.co/zhZXrpkb/Pngtree-cartoon-yellow-gift-box-download-4448703.png",
      
      // Challenge: Trophy
      challenge: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Trophy.png"
  };

  useEffect(() => {
      // Base data with EXACT requested fallback values in MAD
      const coins = [
          { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', defaultPrice: 811970.86, defaultChange: 2.4, color: 'text-orange-500' },
          { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', defaultPrice: 26752.26, defaultChange: -0.8, color: 'text-purple-500' },
          { id: 'binancecoin', symbol: 'BNB', name: 'Binance Coin', defaultPrice: 7964.73, defaultChange: 1.2, color: 'text-yellow-500' },
          { id: 'tron', symbol: 'TRX', name: 'Tron', defaultPrice: 2.71, defaultChange: -1.5, color: 'text-red-500' },
          { id: 'ripple', symbol: 'XRP', name: 'Ripple', defaultPrice: 17.32, defaultChange: 0.5, color: 'text-blue-500' },
          { id: 'tether', symbol: 'USDT', name: 'Tether', defaultPrice: 9.16, defaultChange: 0.01, color: 'text-green-500' }
      ];

      // Set initial data immediately using the requested prices
      setCryptoData(coins.map(c => ({
          ...c,
          price: c.defaultPrice,
          change: c.defaultChange
      })));

      // AbortController to handle component unmounts and prevent "Failed to fetch" on navigation
      const controller = new AbortController();

      // Fetch live data from CoinGecko API every minute to keep it updated
      const fetchData = async () => {
          try {
              const ids = coins.map(c => c.id).join(',');
              const response = await fetch(
                  `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=mad&include_24hr_change=true`,
                  { signal: controller.signal }
              );
              
              if (response.ok) {
                  const data = await response.json();
                  
                  const updated = coins.map(c => {
                      const coinData = data[c.id];
                      // Validate data existence and type safety
                      if (coinData && typeof coinData.mad === 'number') {
                          return {
                              ...c,
                              price: coinData.mad,
                              change: typeof coinData.mad_24h_change === 'number' ? coinData.mad_24h_change : c.defaultChange
                          };
                      }
                      // Fallback for individual coin failure
                      return { ...c, price: c.defaultPrice, change: c.defaultChange };
                  });
                  setCryptoData(updated);
              }
          } catch (e: any) {
              if (e.name === 'AbortError') return; // Ignore aborts
              // API usage is limited and might be blocked by ad-blockers or CORS.
              // Silently ignore errors and continue using default fallback values.
          }
      };

      fetchData();
      const interval = setInterval(fetchData, 60000); // Update every minute
      
      return () => {
          clearInterval(interval);
          controller.abort();
      };
  }, []);

  return (
    <div className="min-h-screen bg-black pb-32 animate-fade-in relative overflow-x-hidden">
       {/* Ambient Light Removed for Pure Black Background */}

       {/* 1. Header: Professional Typography & Brand Icon */}
       <div className="pt-12 px-6 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/5 shrink-0 overflow-hidden bg-transparent">
                <img src={assets.logo} alt="Brixa" className="w-full h-full object-contain" />
             </div>
             <div>
                <h1 className="text-2xl font-bold text-white tracking-tight leading-none mb-1 font-sans">Brixa</h1>
                <p className="text-[10px] text-gray-400 font-semibold tracking-[0.2em] uppercase opacity-70">Future Finance</p>
             </div>
          </div>
          <a href="https://t.me/brixaofficial" target="_blank" rel="noopener noreferrer" className="bg-[#1C1C1C] hover:bg-[#252525] border border-[#2A2A2A] text-blue-400 p-3 rounded-2xl transition-all flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-500/30 active:scale-95 shrink-0">
             <MessageCircle className="w-6 h-6" />
          </a>
       </div>

       {/* 2. Live Activity Notification */}
       <div className="my-2">
         <LiveNotification />
       </div>

       {/* 3. Engagement Cards: 3D Icons */}
       <div className="px-6 mb-8 relative z-10">
          <div className="flex items-center gap-3 mb-5">
             <div className="bg-primary/10 p-2 rounded-xl border border-primary/10">
                <Sparkles className="w-5 h-5 text-primary" />
             </div>
             <h2 className="text-lg font-bold text-white tracking-wide">جوائز و أحداث</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-3">
                {/* Luck Card - ACTIVE */}
                <div onClick={() => setActiveTab && setActiveTab('luck_card')} className="cursor-pointer">
                    <EngagementCard 
                        title="بطاقة الحظ" 
                        subtitle="جرب حظك يومياً" 
                        icon={Star} 
                        imageSrc={assets.luck}
                        color="yellow" 
                        delay={100}
                        status="live"
                    />
                </div>
                
                <EngagementCard 
                    title="حدث الأسبوع" 
                    subtitle="مسابقات حصرية" 
                    icon={Flame} 
                    imageSrc={assets.event}
                    color="red" 
                    delay={300}
                />
             </div>
             <div className="space-y-3">
                 {/* Daily Box - ACTIVE (New Page) */}
                 <div onClick={() => setActiveTab && setActiveTab('daily_box')} className="cursor-pointer">
                     <EngagementCard 
                        title="الصندوق اليومي" 
                        subtitle="افتح الكود اليومي" 
                        icon={Gift} 
                        imageSrc={assets.gift}
                        color="purple" 
                        delay={200}
                        status="live"
                     />
                 </div>
                 
                 <EngagementCard 
                    title="التحدي الكبير" 
                    subtitle="قريباً في رمضان" 
                    icon={Trophy} 
                    imageSrc={assets.challenge}
                    color="blue" 
                    delay={400}
                 />
             </div>
          </div>
       </div>

       {/* 4. Crypto Market: Refined Table Look */}
       <div className="px-6 relative z-10">
          <div className="flex items-center justify-between mb-5 px-1">
             <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-xl border border-primary/10">
                   <Activity className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-bold text-white tracking-wide">السوق المباشر</h2>
             </div>
             <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-xl shadow-sm shadow-green-500/10 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] text-green-500 font-bold tracking-wide">مباشر</span>
             </div>
          </div>
          
          <div className="space-y-2">
             {cryptoData.map((coin) => (
                 <CryptoRow 
                    key={coin.id}
                    symbol={coin.symbol} 
                    name={coin.name} 
                    // Safe handling for price: Ensure it's a number before formatting
                    price={`${(typeof coin.price === 'number' ? coin.price : 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`} 
                    // Safe handling for change: Ensure it's a number before formatting
                    change={`${(typeof coin.change === 'number') ? (coin.change >= 0 ? '+' : '') + coin.change.toFixed(2) : '0.00'}%`} 
                    color={coin.color} 
                    // Use SpotHQ for reliable crypto icons matched by symbol
                    icon={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${coin.symbol.toLowerCase()}.png`}
                 />
             ))}
          </div>
       </div>

       {/* 
          =============================================
          SECURE WELCOME DIALOG (POPUP)
          - Updated Design: No Glow, Clean Dark Theme, Specific Icon
          =============================================
       */}
       {isWelcomeOpen && (
         <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center px-5 bg-black/95 backdrop-blur-sm animate-fade-in touch-none"
            role="dialog"
            aria-modal="true"
         >
            <div className="w-full max-w-sm bg-[#121214] border border-[#27272A] rounded-3xl p-6 relative overflow-hidden animate-slide-up shadow-2xl">
                
                <div className="flex flex-col items-center text-center relative z-10">
                    {/* Icon Image */}
                    <div className="mb-6 relative">
                        <img 
                            src="https://i.ibb.co/zhZXrpkb/Pngtree-cartoon-yellow-gift-box-download-4448703.png" 
                            alt="Gift Box" 
                            className="w-28 h-28 object-contain drop-shadow-md" 
                        />
                    </div>

                    {/* Content */}
                    <h2 className="text-xl font-bold text-white mb-3 tracking-tight">مرحباً بك في منصتنا!</h2>
                    <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-[260px]">
                        انضم إلى القناة الرسمية للبقاء على اطلاع بكل جديد، وتلقي التحديثات والهدايا الحصرية.
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-3 w-full">
                        <button 
                            onClick={() => setIsWelcomeOpen(false)}
                            className="flex-1 bg-[#1A1A1A] text-gray-400 font-bold py-3.5 rounded-xl border border-[#2A2A2A] hover:text-white hover:bg-[#222] hover:border-[#333] transition-all active:scale-95"
                        >
                            إلغاء
                        </button>
                        <a 
                            href="https://t.me/brixaofficial" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-[1.5] bg-primary text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary-hover transition-all active:scale-95"
                        >
                            انضم الآن <Send className="w-4 h-4 ml-1" />
                        </a>
                    </div>
                </div>
            </div>
         </div>
       )}
    </div>
  );
};

export default HomeTab;
