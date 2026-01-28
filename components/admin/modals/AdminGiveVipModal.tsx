import React, { useState } from 'react';
import { User, VipLevel } from '../../../types';
import { X } from 'lucide-react';

interface AdminGiveVipModalProps {
    user: User;
    vips: VipLevel[];
    onClose: () => void;
    onConfirm: (vipId: number, price: number) => void;
}

export const AdminGiveVipModal: React.FC<AdminGiveVipModalProps> = ({ user, vips, onClose, onConfirm }) => {
    const [selectedVipId, setSelectedVipId] = useState<number | string>("");

    const handleSubmit = () => {
        if (!selectedVipId) return;
        const vip = vips.find(v => v.id === Number(selectedVipId));
        if (vip) onConfirm(vip.id, vip.price);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 animate-fade-in">
            <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-slide-up">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">منح VIP لمستخدم</h3>
                    <button onClick={onClose} className="p-2 hover:bg-[#333] rounded-full text-gray-400"><X className="w-5 h-5" /></button>
                </div>
                <div className="mb-6">
                    <p className="text-gray-400 text-sm mb-1">المستخدم:</p>
                    <p className="text-white font-bold">{user.username}</p>
                    <p className="text-xs text-gray-500 font-mono">{user.phone}</p>
                </div>
                <div className="mb-6">
                    <label className="block text-sm text-gray-400 mb-2">اختر باقة VIP</label>
                    <select 
                        className="w-full bg-[#0f0f0f] border border-[#2A2A2A] text-white p-3 rounded-xl focus:border-primary focus:outline-none appearance-none"
                        value={selectedVipId}
                        onChange={(e) => setSelectedVipId(e.target.value)}
                    >
                        <option value="">-- اختر الباقة --</option>
                        {vips.map(v => (
                            <option key={v.id} value={v.id}>{v.name} (Level {v.level}) - {v.price} MAD</option>
                        ))}
                    </select>
                </div>
                <button 
                    onClick={handleSubmit}
                    disabled={!selectedVipId}
                    className="w-full bg-primary text-black py-3 rounded-xl font-bold text-lg hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    تأكيد المنح
                </button>
            </div>
        </div>
    );
};
