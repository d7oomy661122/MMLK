
import React from 'react';
import { User } from '../types';
import { ChevronRight, Phone, User as UserIcon, Calendar, Crown } from 'lucide-react';

const SettingsTab = ({ user, setActiveTab }: { user: User, setActiveTab: (t: string) => void }) => {
    
    // Logic to display VIP level safely
    const displayVip = (level: number | string | null | undefined) => {
        if (level === undefined || level === null) return 'Intern';
        
        // If string 'Intern' (legacy support)
        if (level === 'Intern') return 'Intern';
        
        const lvlNum = Number(level);
        if (isNaN(lvlNum) || lvlNum === 0) return 'Intern';
        
        return `VIP ${lvlNum}`;
    };

    return (
        <div className="pt-12 px-5 pb-24 animate-slide-up">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setActiveTab('profile')} className="p-2 bg-[#1C1C1C] rounded-xl border border-[#2A2A2A] text-gray-400 hover:text-white transition-colors">
                    <ChevronRight className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold text-white">الإعدادات</h1>
            </div>

            <div className="bg-[#141414] border border-[#2A2A2A] rounded-3xl p-6 space-y-6 shadow-xl">
                
                {/* 1) Phone Number */}
                <div className="border-b border-[#222] pb-4 flex items-start gap-4">
                    <div className="p-3 bg-[#1C1C1C] rounded-xl border border-[#2A2A2A] text-gray-400">
                        <Phone className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 mb-1">رقم الهاتف</label>
                        <div className="text-white font-mono text-lg dir-ltr text-right tracking-wider">{user.phone}</div>
                    </div>
                </div>

                {/* 2) Username */}
                <div className="border-b border-[#222] pb-4 flex items-start gap-4">
                     <div className="p-3 bg-[#1C1C1C] rounded-xl border border-[#2A2A2A] text-gray-400">
                        <UserIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 mb-1">اسم المستخدم</label>
                        <div className="text-white font-bold text-lg">{user.username}</div>
                    </div>
                </div>

                {/* 3) Created At */}
                <div className="border-b border-[#222] pb-4 flex items-start gap-4">
                    <div className="p-3 bg-[#1C1C1C] rounded-xl border border-[#2A2A2A] text-gray-400">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 mb-1">تاريخ إنشاء الحساب</label>
                        <div className="text-white font-mono text-lg">
                            {new Date(user.created_at).toLocaleDateString('en-GB')}
                        </div>
                    </div>
                </div>

                {/* 4) VIP Level */}
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 text-primary shadow-[0_0_10px_rgba(255,159,28,0.1)]">
                        <Crown className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 mb-1">المستوى الحالي</label>
                        <div className="text-primary font-bold text-lg">
                            {displayVip(user.vip_level)}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SettingsTab;
