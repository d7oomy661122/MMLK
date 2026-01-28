import React, { useState } from 'react';
import { User } from '../../../types';
import { X } from 'lucide-react';

interface BalanceEditModalProps {
    user: User;
    onClose: () => void;
    onSave: (amount: number) => void;
}

export const BalanceEditModal: React.FC<BalanceEditModalProps> = ({ user, onClose, onSave }) => {
    const [balance, setBalance] = useState(user.balance.toString());

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 animate-fade-in">
            <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-2xl w-full max-w-md p-6 shadow-2xl animate-slide-up">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">تعديل رصيد المستخدم</h3>
                    <button onClick={onClose} className="p-2 hover:bg-[#333] rounded-full text-gray-400"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="mb-6 space-y-4">
                    <div className="bg-[#111] p-4 rounded-xl border border-[#222]">
                        <div className="text-xs text-gray-500 mb-1">المستخدم</div>
                        <div className="font-bold text-white text-lg">{user.username}</div>
                        <div className="text-xs text-gray-500 font-mono mt-1">{user.phone}</div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">الرصيد الجديد (MAD)</label>
                        <input 
                            type="number" 
                            className="w-full bg-[#0f0f0f] border border-[#2A2A2A] text-white p-4 rounded-xl text-2xl font-bold font-mono focus:border-primary focus:outline-none"
                            value={balance}
                            onChange={(e) => setBalance(e.target.value)}
                        />
                    </div>
                </div>

                <button 
                    onClick={() => {
                        const val = parseFloat(balance);
                        if (isNaN(val) || val < 0) return alert('قيمة غير صالحة');
                        onSave(val);
                    }}
                    className="w-full bg-primary text-black py-4 rounded-xl font-bold text-lg hover:bg-primary-hover transition-all shadow-lg"
                >
                    حفظ التغييرات
                </button>
            </div>
        </div>
    );
};
