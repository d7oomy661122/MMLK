import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
    <div className="fixed top-6 left-0 right-0 z-[9999] flex justify-center px-4 pointer-events-none w-full max-w-[100vw] overflow-hidden">
        <div className="animate-slide-up w-full max-w-sm pointer-events-auto">
            <div className={`bg-[#1C1C1C] border ${type === 'error' ? 'border-red-500' : 'border-primary'} text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 backdrop-blur-md`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {type === 'error' ? <AlertCircle className="w-5 h-5 text-red-500 shrink-0" /> : <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                    <span className="text-sm font-bold leading-tight break-words">{message}</span>
                </div>
                <button onClick={onClose} className="shrink-0 p-1 hover:bg-white/5 rounded-full"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
        </div>
    </div>
);

export default Toast;