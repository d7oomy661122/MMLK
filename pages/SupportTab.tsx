
import React from 'react';
import { ChevronRight, Send } from 'lucide-react';

const SupportTab = ({ setActiveTab }: { setActiveTab: (t: string) => void }) => {
    return (
        <div className="pt-12 px-6 pb-24 animate-slide-up min-h-screen bg-black select-none font-sans text-right" dir="rtl">
            
            {/* Header / Navigation */}
            <div className="flex items-center gap-4 mb-8">
                <button 
                    onClick={() => setActiveTab('profile')} 
                    className="w-10 h-10 bg-[#18181B] rounded-full flex items-center justify-center border border-[#27272A] text-gray-400 hover:text-white transition-colors active:scale-95"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
                <span className="text-sm font-bold text-gray-500">العودة</span>
            </div>

            {/* Welcome / Hero Section */}
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">مركز الدعم</h1>
                <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                    للحصول على المساعدة وآخر التحديثات، يرجى الانضمام إلى قناتنا الرسمية.
                </p>
            </div>

            {/* Telegram Button */}
            <a 
                href="https://t.me/brixaofficial" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full bg-[#18181B] border border-[#27272A] p-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:bg-[#202022] hover:border-gray-700 active:scale-[0.98] group shadow-sm"
            >
                <Send className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors transform -rotate-45 -translate-y-0.5" />
                <span className="text-white font-bold text-sm group-hover:text-gray-200">انضم إلى قناتنا على تيليجرام</span>
            </a>

        </div>
    );
};

export default SupportTab;
