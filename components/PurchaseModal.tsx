import React from 'react';
import { Crown } from 'lucide-react';
import { VipLevel } from '../types';

const PurchaseModal = ({ vip, onClose, onConfirm }: { vip: VipLevel, onClose: () => void, onConfirm: () => void }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 animate-fade-in w-full h-full">
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
    <div className="bg-[#181818] border border-[#2A2A2A] rounded-3xl p-6 w-full max-w-sm relative z-10 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
      <div className="text-center mb-6">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-[0_0_20px_rgba(255,159,28,0.15)]">
           <Crown className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">تأكيد الاشتراك</h3>
        <p className="text-gray-400 text-sm leading-relaxed">هل أنت متأكد من شراء باقة <br/><span className="text-white font-bold text-lg">{vip.name}</span>؟</p>
      </div>
      
      <div className="bg-[#111] rounded-2xl p-5 mb-6 border border-[#222] divide-y divide-[#222]">
        <div className="flex justify-between items-center pb-4">
            <span className="text-gray-500 text-sm font-medium">سعر الباقة</span>
            <div className="text-right">
                <span className="text-white font-bold text-xl">{vip.price}</span>
                <span className="text-primary text-xs font-bold mr-1">MAD</span>
            </div>
        </div>
         <div className="flex justify-between items-center pt-4">
            <span className="text-gray-500 text-sm font-medium">الدخل اليومي</span>
            <span className="text-green-500 font-bold dir-ltr text-lg">{vip.daily_income} MAD</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button onClick={onConfirm} className="w-full bg-primary text-black py-4 rounded-2xl font-bold text-lg hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 active:scale-95">تأكيد الشراء</button>
        <button onClick={onClose} className="w-full bg-transparent text-gray-400 py-3 rounded-2xl font-bold hover:text-white transition-colors active:scale-95">إلغاء</button>
      </div>
    </div>
  </div>
);

export default PurchaseModal;