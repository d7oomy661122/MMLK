import React, { useState } from 'react';
import { X } from 'lucide-react';

interface VipLevelModalProps {
    vip?: any;
    onClose: () => void;
    onSave: (vip: any) => void;
}

export const VipLevelModal: React.FC<VipLevelModalProps> = ({ vip, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        level: vip?.level?.toString() || '0',
        name: vip?.name || '',
        price: vip?.price?.toString() || '0',
        daily_tasks: vip?.daily_tasks?.toString() || '0',
        daily_income: vip?.daily_income?.toString() || '0',
        monthly_income: vip?.monthly_income?.toString() || '0',
        monthly_tasks: vip?.monthly_tasks?.toString() || '0', 
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            level: parseInt(formData.level),
            price: parseFloat(formData.price),
            daily_tasks: parseInt(formData.daily_tasks),
            daily_income: parseFloat(formData.daily_income),
            monthly_income: parseFloat(formData.monthly_income),
            monthly_tasks: parseInt(formData.monthly_tasks),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 animate-fade-in">
            <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">{vip ? 'تعديل VIP' : 'إضافة VIP جديد'}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-[#333] rounded-full text-gray-400"><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2">المستوى (Level)</label>
                            <input type="number" required className="w-full bg-[#0f0f0f] border border-[#2A2A2A] text-white p-3 rounded-xl focus:border-primary focus:outline-none" value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2">الاسم</label>
                            <input type="text" required className="w-full bg-[#0f0f0f] border border-[#2A2A2A] text-white p-3 rounded-xl focus:border-primary focus:outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">السعر (MAD)</label>
                        <input type="number" step="0.01" required className="w-full bg-[#0f0f0f] border border-[#2A2A2A] text-white p-3 rounded-xl focus:border-primary focus:outline-none" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2">المهام اليومية</label>
                            <input type="number" required className="w-full bg-[#0f0f0f] border border-[#2A2A2A] text-white p-3 rounded-xl focus:border-primary focus:outline-none" value={formData.daily_tasks} onChange={e => setFormData({...formData, daily_tasks: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2">الدخل اليومي</label>
                            <input type="number" step="0.01" required className="w-full bg-[#0f0f0f] border border-[#2A2A2A] text-white p-3 rounded-xl focus:border-primary focus:outline-none" value={formData.daily_income} onChange={e => setFormData({...formData, daily_income: e.target.value})} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2">المهام الشهرية</label>
                            <input type="number" required className="w-full bg-[#0f0f0f] border border-[#2A2A2A] text-white p-3 rounded-xl focus:border-primary focus:outline-none" value={formData.monthly_tasks} onChange={e => setFormData({...formData, monthly_tasks: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2">الدخل الشهري</label>
                            <input type="number" step="0.01" required className="w-full bg-[#0f0f0f] border border-[#2A2A2A] text-white p-3 rounded-xl focus:border-primary focus:outline-none" value={formData.monthly_income} onChange={e => setFormData({...formData, monthly_income: e.target.value})} />
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-primary text-black py-3 rounded-xl font-bold text-lg hover:bg-primary-hover transition-all mt-4">
                        حفظ البيانات
                    </button>
                </form>
            </div>
        </div>
    );
};
