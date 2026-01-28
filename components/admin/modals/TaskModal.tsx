import React, { useState } from 'react';
import { Task } from '../../../types';
import { X } from 'lucide-react';

interface TaskModalProps {
    task?: Task;
    onClose: () => void;
    onSave: (task: Partial<Task>) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ task, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        title: task?.title || '',
        landing_url: task?.landing_url || '',
        reward: task?.reward?.toString() || '0',
        vip_level: task?.vip_level?.toString() || '0',
        duration_seconds: task?.duration_seconds?.toString() || '30',
        is_active: task?.is_active ?? true
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            reward: parseFloat(formData.reward),
            vip_level: parseInt(formData.vip_level),
            duration_seconds: parseInt(formData.duration_seconds)
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 animate-fade-in">
            <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">{task ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-[#333] rounded-full text-gray-400"><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">عنوان المهمة</label>
                        <input 
                            type="text" 
                            required
                            className="w-full bg-[#0f0f0f] border border-[#2A2A2A] text-white p-3 rounded-xl focus:border-primary focus:outline-none"
                            value={formData.title}
                            onChange={e => setFormData({...formData, title: e.target.value})}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">رابط المهمة (URL)</label>
                        <input 
                            type="url" 
                            required
                            placeholder="https://..."
                            className="w-full bg-[#0f0f0f] border border-[#2A2A2A] text-white p-3 rounded-xl focus:border-primary focus:outline-none text-left dir-ltr"
                            value={formData.landing_url}
                            onChange={e => setFormData({...formData, landing_url: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2">المكافأة (MAD)</label>
                            <input 
                                type="number" 
                                required
                                step="0.01"
                                className="w-full bg-[#0f0f0f] border border-[#2A2A2A] text-white p-3 rounded-xl focus:border-primary focus:outline-none"
                                value={formData.reward}
                                onChange={e => setFormData({...formData, reward: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2">مستوى VIP المطلوب</label>
                            <input 
                                type="number" 
                                required
                                min="0"
                                className="w-full bg-[#0f0f0f] border border-[#2A2A2A] text-white p-3 rounded-xl focus:border-primary focus:outline-none"
                                value={formData.vip_level}
                                onChange={e => setFormData({...formData, vip_level: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">المدة (ثواني)</label>
                        <input 
                            type="number" 
                            required
                            min="5"
                            className="w-full bg-[#0f0f0f] border border-[#2A2A2A] text-white p-3 rounded-xl focus:border-primary focus:outline-none"
                            value={formData.duration_seconds}
                            onChange={e => setFormData({...formData, duration_seconds: e.target.value})}
                        />
                    </div>

                    <div className="flex items-center gap-3 bg-[#111] p-3 rounded-xl border border-[#2A2A2A]">
                        <input 
                            type="checkbox"
                            id="isActive"
                            checked={formData.is_active}
                            onChange={e => setFormData({...formData, is_active: e.target.checked})}
                            className="w-5 h-5 accent-primary cursor-pointer"
                        />
                        <label htmlFor="isActive" className="text-sm font-bold text-white cursor-pointer select-none">تفعيل المهمة</label>
                    </div>

                    <button type="submit" className="w-full bg-primary text-black py-3 rounded-xl font-bold text-lg hover:bg-primary-hover transition-all mt-4">
                        حفظ
                    </button>
                </form>
            </div>
        </div>
    );
};
