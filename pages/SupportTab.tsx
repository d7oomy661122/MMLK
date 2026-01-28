
import React from 'react';
import { ChevronRight, ExternalLink } from 'lucide-react';

const SupportTab = ({ setActiveTab }: { setActiveTab: (t: string) => void }) => {
    
    const supportChannels = [
        {
            title: 'القناة الرسمية',
            subtitle: 'تابع آخر الأخبار والتحديثات',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg',
            link: 'https://t.me/brixaofficial'
        },
        {
            title: 'دعم تليغرام',
            subtitle: 'تواصل مباشر مع فريق الدعم',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg',
            link: 'https://t.me/arickcoklat'
        },
        {
            title: 'دعم واتساب',
            subtitle: 'تواصل معنا عبر واتساب',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg',
            link: 'https://wa.me/48459078105'
        }
    ];

    return (
        <div className="pt-12 px-5 pb-24 animate-slide-up bg-black min-h-screen text-right font-sans" dir="rtl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setActiveTab('profile')} className="p-2 bg-[#1C1C1C] rounded-xl border border-[#2A2A2A] text-gray-400 hover:text-white transition-colors">
                    <ChevronRight className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold text-white">مركز الدعم</h1>
            </div>

            {/* Introduction */}
            <div className="mb-8">
                <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                    نحن هنا لمساعدتك. اختر وسيلة التواصل المناسبة لك من القائمة أدناه، وسنقوم بالرد عليك في أقرب وقت.
                </p>
            </div>

            {/* Contact Cards */}
            <div className="space-y-4">
                {supportChannels.map((channel, idx) => (
                    <a 
                        key={idx}
                        href={channel.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 flex items-center justify-between hover:bg-[#1a1a1a] hover:border-primary/30 transition-all group relative overflow-hidden"
                    >
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-14 h-14 bg-[#1C1C1C] rounded-2xl border border-[#2A2A2A] flex items-center justify-center p-3 shadow-inner group-hover:scale-105 transition-transform">
                                <img src={channel.icon} alt={channel.title} className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-base mb-1 group-hover:text-primary transition-colors">{channel.title}</h3>
                                <p className="text-xs text-gray-500">{channel.subtitle}</p>
                            </div>
                        </div>
                        
                        <div className="p-2 bg-[#1C1C1C] rounded-xl text-gray-500 group-hover:text-primary group-hover:bg-primary/10 transition-colors border border-[#2A2A2A]">
                            <ExternalLink className="w-5 h-5" />
                        </div>
                    </a>
                ))}
            </div>

            {/* Status Footer */}
            <div className="mt-12 text-center">
                 <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#141414] rounded-full border border-[#2A2A2A]">
                     <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                     <span className="text-[10px] text-gray-400 font-bold">فريق الدعم متاح 24/7</span>
                 </div>
            </div>
        </div>
    );
};

export default SupportTab;
