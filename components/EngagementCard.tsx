
import React from 'react';

interface EngagementCardProps {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  delay?: number;
  imageSrc?: string;
  status?: 'coming_soon' | 'live';
}

const EngagementCard: React.FC<EngagementCardProps> = ({ title, subtitle, icon: Icon, color, delay, imageSrc, status = 'coming_soon' }) => (
   <div className={`bg-gradient-to-br from-[#141414] to-[#0f0f0f] border border-[#2A2A2A] p-5 rounded-3xl relative overflow-hidden animate-slide-up active:scale-[0.98] transition-transform w-full group`} style={{ animationDelay: `${delay}ms` }}>
      <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-${color}-500/10 transition-colors duration-500`}></div>
      <div className="relative z-10">
         <div className={`w-12 h-12 rounded-2xl bg-${color}-500/10 flex items-center justify-center mb-4 text-${color}-500 shadow-inner border border-${color}-500/20`}>
            {imageSrc ? (
               <img src={imageSrc} alt={title} className="w-8 h-8 object-contain drop-shadow-md transform group-hover:scale-110 transition-transform duration-300" loading="lazy" />
            ) : (
               <Icon className="w-6 h-6" />
            )}
         </div>
         <h3 className="text-white font-bold text-base mb-1 truncate">{title}</h3>
         <p className="text-gray-500 text-xs mb-4 truncate">{subtitle}</p>
         
         {status === 'live' ? (
            <div className="flex items-center gap-1.5">
                <span className="bg-green-500/10 text-green-500 text-[10px] px-2.5 py-1 rounded-lg border border-green-500/20 font-bold shadow-[0_0_10px_rgba(34,197,94,0.2)]">متاح الآن</span>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            </div>
         ) : (
            <div className="flex items-center gap-1.5">
                <span className="bg-[#222]/80 backdrop-blur-sm text-gray-400 text-[10px] px-2.5 py-1 rounded-lg border border-[#333]">قريباً</span>
                <span className="w-2 h-2 rounded-full bg-gray-600 animate-pulse"></span>
            </div>
         )}
      </div>
   </div>
);

export default EngagementCard;
