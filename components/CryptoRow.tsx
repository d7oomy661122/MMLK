
import React, { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CryptoRowProps {
  symbol: string;
  name: string;
  price: string;
  change: string;
  color?: string;
  icon?: string;
}

const CryptoRow: React.FC<CryptoRowProps> = ({ symbol, name, price, change, color, icon }) => {
    const isPositive = change.includes('+') || (!change.includes('-') && parseFloat(change) > 0);
    const [imgError, setImgError] = useState(false);
    
    return (
        <div className="flex items-center justify-between p-4 bg-[#121212] border border-[#222] rounded-2xl mb-3 hover:bg-[#161616] transition-colors group">
           <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#0a0a0a] border border-[#222] shrink-0 overflow-hidden">
                 {icon && !imgError ? (
                    <img 
                        src={icon} 
                        alt={symbol} 
                        className="w-6 h-6 object-contain" 
                        onError={() => setImgError(true)}
                        loading="lazy"
                    />
                 ) : (
                    <span className={`text-xs font-bold ${color || 'text-white'}`}>{symbol.substring(0, 1)}</span>
                 )}
              </div>
              <div className="min-w-0 flex-1">
                 <div className="font-bold text-white text-sm mb-0.5 truncate">{name}</div>
                 <div className="text-[10px] text-gray-500 font-medium flex items-center gap-1 truncate">
                    {symbol}
                 </div>
              </div>
           </div>
           <div className="text-right shrink-0 ml-4">
              <div className="font-bold text-white text-sm font-mono tracking-wide mb-1">{price}</div>
              <div className={`text-[10px] font-bold ${isPositive ? 'text-green-500' : 'text-red-500'} flex items-center justify-end gap-1`}>
                 {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                 {change}
              </div>
           </div>
        </div>
    );
};

export default CryptoRow;
