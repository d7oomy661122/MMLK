import React, { useState, useEffect, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const LiveNotification = () => {
  const [current, setCurrent] = useState(0);
  const activities = useMemo(() => [
      { user: "212637**756", action: "سحب", amount: "500", time: "الآن" },
      { user: "212701**129", action: "إيداع", amount: "1,200", time: "منذ دقيقة" },
      { user: "212661**882", action: "سحب", amount: "3,500", time: "منذ دقيقتين" },
      { user: "212644**001", action: "إيداع", amount: "200", time: "منذ 3 دقائق" },
      { user: "212770**993", action: "سحب", amount: "800", time: "منذ 5 دقائق" },
  ], []);

  useEffect(() => {
      const timer = setInterval(() => {
          setCurrent((prev) => (prev + 1) % activities.length);
      }, 3500); 
      return () => clearInterval(timer);
  }, [activities]);

  const active = activities[current];

  return (
    <div className="mx-5 my-6">
      <div className="bg-[#1A1A1A]/80 backdrop-blur-md border border-[#2A2A2A] rounded-2xl p-1.5 flex items-center shadow-lg transition-all relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-100%] animate-[shimmer_3s_infinite]"></div>
         <div className="flex items-center gap-4 w-full px-2 py-2 relative z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-inner ${active.action === 'سحب' ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}`}>
               {active.action === 'سحب' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
               <div className="flex justify-between items-center mb-1">
                  <span className="text-white font-bold text-sm font-mono tracking-wider">{active.user}</span>
                  <span className="text-[10px] text-gray-500">{active.time}</span>
               </div>
               <div className="text-xs text-gray-400 truncate">
                  قام بـ <span className={active.action === 'سحب' ? 'text-green-500 font-bold' : 'text-primary font-bold'}>{active.action}</span> مبلغ <span className="font-bold text-white font-mono text-sm">{active.amount} MAD</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default LiveNotification;