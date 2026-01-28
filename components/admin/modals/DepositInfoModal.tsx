import React, { useState } from 'react';
import { DepositInfo } from '../../../types';
import { X } from 'lucide-react';

interface DepositInfoModalProps {
    info?: DepositInfo;
    onClose: () => void;
    onSave: (info: Partial<DepositInfo>) => void;
}

export const DepositInfoModal: React.FC<DepositInfoModalProps> = ({ info, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        bank_name: info?.bank_name || '',
        account_number: info?.account_number || '',
        account_holder_name: info?.account_holder_name || '',
        transfer_reason: info?.transfer_reason || '',
        is_active: info?.is_active ?? true
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 animate-fade-in">
            <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">{info ? 'تعديل بيانات البنك' : 'إضافة بنك جديد'}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-[#333] rounded-full text-gray-400"><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">اسم البنك</label>
                        <input 
                            type="text" 
                            required
                            className="w-full bg-[#0f0f0f] border border-[#2A2A2A] text-white p-3 rounded-xl focus:border-primary focus:outline-none"
                            value={formData.bank_name}
                            onChange={e => setFormData({...formData, bank_name: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">رقم الحساب (RIB)</label>
                        <input 
                            type="text" 
                            required
                            className="w-full bg-[#0f0f0f] border border-[#2A2A2A] text-white p-3 rounded-xl focus:border-primary focus:outline-none font-mono"
                            value={formData.account_number}
                            onChange={e => setFormData({...formData, account_number: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">اسم صاحب الحساب</label>
                        <input 
                            type="text" 
                            required
                            className="w-full bg-[#0f0f0f] border border-[#2A2A2A] text-white p-3 rounded-xl focus:border-primary focus:outline-none"
                            value={formData.account_holder_name}
                            onChange={e => setFormData({...formData, account_holder_name: e.target.value})}
                        />
                    </div>
                    
                     <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">ملاحظة للتحويل (اختياري)</label>
                        <input 
                            type="text" 
                            className="w-full bg-[#0f0f0f] border border-[#2A2A2A] text-white p-3 rounded-xl focus:border-primary focus:outline-none"
                            value={formData.transfer_reason}
                            onChange={e => setFormData({...formData, transfer_reason: e.target.value})}
                            placeholder="مثلاً: سبب التحويل"
                        />
                    </div>

                    <div className="flex items-center gap-3 bg-[#111] p-3 rounded-xl border border-[#2A2A2A]">
                        <input 
                            type="checkbox"
                            id="isBankActive"
                            checked={formData.is_active}
                            onChange={e => setFormData({...formData, is_active: e.target.checked})}
                            className="w-5 h-5 accent-primary cursor-pointer"
                        />
                        <label htmlFor="isBankActive" className="text-sm font-bold text-white cursor-pointer select-none">تفعيل هذا البنك</label>
                    </div>

                    <button type="submit" className="w-full bg-primary text-black py-3 rounded-xl font-bold text-lg hover:bg-primary-hover transition-all mt-4">
                        حفظ البيانات
                    </button>
                </form>
            </div>
        </div>
    );
};
