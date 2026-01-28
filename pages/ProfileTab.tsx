
import React from 'react';
import { supabase } from '../lib/supabase';
import { getVipLabel } from '../utils/helpers';
import { User as UserIcon, Settings, ChevronLeft, ArrowUpRight, ArrowDownCircle, LogOut, Headphones } from 'lucide-react';

const ProfileTab = ({ user, showToast, setActiveTab }: any) => {
    return (
        <div className="pt-12 px-5 pb-24 animate-slide-up">
            <div className="text-center mb-8">
                <div className="w-24 h-24 bg-[#181818] rounded-full mx-auto mb-4 flex items-center justify-center border border-[#2A2A2A] shadow-xl relative">
                    <UserIcon className="w-10 h-10 text-gray-400" />
                    <div className="absolute bottom-0 right-0 bg-primary text-black text-[10px] font-bold px-2 py-0.5 rounded-full border border-black">
                        {getVipLabel(user?.vip_level)}
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">{user?.username}</h2>
                <p className="text-gray-500 font-mono tracking-wider">{user?.phone}</p>
            </div>
            {/* ... Rest of Profile Tab ... */}
            <div className="bg-gradient-to-br from-[#1C1C1C] to-[#111] border border-[#2A2A2A] rounded-3xl p-6 mb-6 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-[60px] pointer-events-none"></div>
                <div className="relative z-10 flex flex-col items-center">
                    <p className="text-gray-400 text-xs font-medium mb-2">الرصيد الكلي</p>
                    {/* FIXED: Safe navigation for user balance */}
                    <h3 className="text-4xl font-bold text-white font-mono tracking-tight mb-6">{(user?.balance || 0).toFixed(2)} <span className="text-base text-gray-500">MAD</span></h3>
                    
                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={() => setActiveTab('deposit')}
                            className="flex-1 bg-primary text-black py-3 rounded-xl font-bold hover:bg-primary-hover transition-colors shadow-lg shadow-primary/10 active:scale-95"
                        >
                            إيداع
                        </button>
                        <button 
                            onClick={() => setActiveTab('withdraw')}
                            className="flex-1 bg-[#222] text-white py-3 rounded-xl font-bold hover:bg-[#2a2a2a] transition-colors border border-[#333] active:scale-95"
                        >
                            سحب
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <button 
                    onClick={() => setActiveTab('settings')}
                    className="w-full bg-[#181818] p-4 rounded-2xl flex items-center justify-between border border-[#2A2A2A] hover:border-primary/30 transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-[#222] p-2 rounded-lg text-gray-400 group-hover:text-primary transition-colors"><Settings className="w-5 h-5" /></div>
                        <span className="font-bold text-gray-200">الإعدادات</span>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-gray-500" />
                </button>
                
                <button 
                    onClick={() => setActiveTab('withdraw_history')}
                    className="w-full bg-[#181818] p-4 rounded-2xl flex items-center justify-between border border-[#2A2A2A] hover:border-primary/30 transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-[#222] p-2 rounded-lg text-gray-400 group-hover:text-primary transition-colors"><ArrowUpRight className="w-5 h-5" /></div>
                        <span className="font-bold text-gray-200">سجل السحب</span>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-gray-500" />
                </button>

                <button 
                    onClick={() => setActiveTab('deposit_history')}
                    className="w-full bg-[#181818] p-4 rounded-2xl flex items-center justify-between border border-[#2A2A2A] hover:border-primary/30 transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-[#222] p-2 rounded-lg text-gray-400 group-hover:text-primary transition-colors"><ArrowDownCircle className="w-5 h-5" /></div>
                        <span className="font-bold text-gray-200">سجل الإيداع</span>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-gray-500" />
                </button>

                {/* New Support Button */}
                <button 
                    onClick={() => setActiveTab('support')}
                    className="w-full bg-[#181818] p-4 rounded-2xl flex items-center justify-between border border-[#2A2A2A] hover:border-primary/30 transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-[#222] p-2 rounded-lg text-gray-400 group-hover:text-primary transition-colors"><Headphones className="w-5 h-5" /></div>
                        <span className="font-bold text-gray-200">الدعم والمساعدة</span>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-gray-500" />
                </button>

                <button 
                    onClick={() => supabase.auth.signOut()} 
                    className="w-full bg-red-500/5 p-4 rounded-2xl flex items-center justify-center gap-2 border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all mt-6 font-bold"
                >
                    <LogOut className="w-5 h-5" /> تسجيل الخروج
                </button>
            </div>
            
            {/* Version Footer Removed */}
        </div>
    );
};

export default ProfileTab;
