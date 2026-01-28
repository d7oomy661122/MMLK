import React, { useState } from 'react';
import { X } from 'lucide-react';

interface UserBankEditModalProps {
    bankData: any;
    onClose: () => void;
    onSave: (data: any) => void;
}

export const UserBankEditModal: React.FC<UserBankEditModalProps> = ({ bankData, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        full_name: bankData?.full_name || '',
        bank_name: bankData?.bank_name || '',
        account_number: bankData?.account_number || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 animate-fade-in">
            <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-2xl w-full max-w-md p-6 shadow-2xl animate-slide-up">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">تعديل بيانات بنك المستخدم</h3>
                    <button onClick={onClose} className="p-2 hover:bg-[#333] rounded-full text-gray-400"><X className="w-5 h-5" /></button>
                </div>
                <div className="mb-4 bg-[#111] p-3 rounded-xl border border-[#222]">
                    <div className="text-xs text-gray-500">User ID</div>
                    <div className="text-sm font-mono text-white">{bankData.user_id}</div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">الاسم الكامل</label>
                        <input type="text" required className="w-full bg-[#0f0f0f] border border-[#2A2A2A] text-white p-3 rounded-xl focus:border-primary focus:outline-none" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">اسم البنك</label>
                        <input type="text" required className="w-full bg-[#0f0f0f] border border-[#2A2A2A] text-white p-3 rounded-xl focus:border-primary focus:outline-none" value={formData.bank_name} onChange={e => setFormData({...formData, bank_name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">رقم الحساب (RIB)</label>
                        <input type="text" required className="w-full bg-[#0f0f0f] border border-[#2A2A2A] text-white p-3 rounded-xl focus:border-primary focus:outline-none font-mono" value={formData.account_number} onChange={e => setFormData({...formData, account_number: e.target.value})} />
                    </div>
                    <button type="submit" className="w-full bg-primary text-black py-3 rounded-xl font-bold text-lg hover:bg-primary-hover transition-all mt-4">
                        حفظ التعديلات
                    </button>
                </form>
            </div>
        </div>
    );
};
