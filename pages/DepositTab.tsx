
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { Input } from '../components/Input';
import { Loader2, ChevronRight, Check, ArrowDownCircle, Landmark, Copy, Info, User as UserIcon, Hash, UploadCloud } from 'lucide-react';

const DepositTab = ({ user, setActiveTab, showToast }: { user: User | null, setActiveTab: (t: string) => void, showToast: (m: string, t: 'success' | 'error') => void }) => {
    const [step, setStep] = useState(1);
    const [amount, setAmount] = useState('');
    const [selectedBank, setSelectedBank] = useState<string | null>(null);
    const [bankDetails, setBankDetails] = useState<any>(null);
    const [fetchingBank, setFetchingBank] = useState(false);
    
    // Step 4 User Info
    const [fullName, setFullName] = useState('');
    const [rib, setRib] = useState('');
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    // Step 1: Amount Validation
    const handleNextStep1 = () => {
        const val = parseFloat(amount);
        if (isNaN(val) || val < 100) {
            showToast('أقل مبلغ للإيداع هو 100 درهم', 'error');
            return;
        }
        setStep(2);
    };

    // Step 2: Bank Selection
    const handleBankSelect = (bank: string) => {
        setSelectedBank(bank);
    };

    const handleNextStep2 = async () => {
        if (!selectedBank) {
            showToast('المرجو اختيار البنك', 'error');
            return;
        }
        setFetchingBank(true);
        try {
            const { data, error } = await supabase
                .from('deposit_info')
                .select('*')
                .eq('bank_name', selectedBank) // Assuming Exact Match or modify to ilike if needed
                .maybeSingle();
            
            if (!data) {
                 showToast('هذا البنك غير متوفر حالياً، يرجى اختيار بنك آخر', 'error');
                 setFetchingBank(false);
                 return;
            }
            
            setBankDetails(data);
            setStep(3);
        } catch (e) {
            showToast('حدث خطأ أثناء جلب المعلومات', 'error');
        } finally {
            setFetchingBank(false);
        }
    };

    // Step 3: Copy Info
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast('تم النسخ بنجاح', 'success');
    };

    // Step 4: Submission
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                showToast('يرجى رفع صورة فقط', 'error');
                return;
            }
            setProofFile(file);
        }
    };

    const handleSubmit = async () => {
        if (!user || !selectedBank) return;
        if (!fullName.trim() || !rib.trim() || !proofFile) {
            showToast('جميع الحقول وصورة الإثبات مطلوبة', 'error');
            return;
        }

        setUploading(true);
        try {
            // 1. Upload Image
            const fileExt = proofFile.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('deposit_proofs')
                .upload(fileName, proofFile);

            if (uploadError) throw uploadError;

            // 2. Insert Record
            const { error: insertError } = await supabase.from('deposits').insert({
                user_id: user.id,
                amount: parseFloat(amount),
                payment_method: selectedBank,
                full_name: fullName,
                rib: rib,
                proof_url: uploadData.path,
                status: 'pending',
                created_at: new Date().toISOString()
            });

            if (insertError) throw insertError;

            showToast('تم إرسال طلب الإيداع بنجاح! سيتم مراجعته قريباً.', 'success');
            setActiveTab('deposit_history');

        } catch (e) {
            console.error(e);
            showToast('حدث خطأ أثناء إرسال الطلب', 'error');
        } finally {
            setUploading(false);
        }
    };

    const commonBanks = [
        'CIH Bank', 'Al Barid Bank', 'Attijari Bank', 'BMCE Bank', 'Lbankalik'
    ];

    return (
        <div className="pt-12 px-5 pb-24 animate-slide-up">
            <div className="flex items-center gap-4 mb-8">
                <button 
                    onClick={() => {
                        if (step > 1) setStep(step - 1);
                        else setActiveTab('profile');
                    }} 
                    className="p-2 bg-[#1C1C1C] rounded-xl border border-[#2A2A2A] text-gray-400 hover:text-white"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold text-white">إيداع الرصيد</h1>
            </div>

            {/* Stepper Indicator */}
            <div className="flex justify-between mb-8 px-2 relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[#222] -z-10 -translate-y-1/2"></div>
                {[1, 2, 3, 4].map(s => (
                    <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= s ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'bg-[#222] text-gray-500 border border-[#333]'}`}>
                        {step > s ? <Check className="w-4 h-4" /> : s}
                    </div>
                ))}
            </div>

            {/* Step 1: Amount */}
            {step === 1 && (
                <div className="bg-[#141414] border border-[#2A2A2A] rounded-3xl p-6">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                            <ArrowDownCircle className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-lg font-bold text-white">أدخل المبلغ</h2>
                        <p className="text-xs text-gray-500 mt-1">الحد الأدنى للإيداع هو 100 درهم</p>
                    </div>

                    <div className="relative mb-6">
                        <input 
                            type="number" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                            className="w-full bg-transparent text-5xl font-bold text-white text-center focus:outline-none placeholder-gray-800"
                        />
                        <div className="text-center text-sm text-gray-500 mt-2 font-bold">MAD</div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-6">
                        {[100, 200, 500, 1000].map(amt => (
                            <button key={amt} onClick={() => setAmount(amt.toString())} className="bg-[#222] hover:bg-[#333] text-gray-300 py-3 rounded-xl text-sm font-bold border border-[#333] transition-colors">
                                {amt}
                            </button>
                        ))}
                    </div>

                    <button onClick={handleNextStep1} className="w-full bg-primary text-black py-4 rounded-xl font-bold text-lg hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 active:scale-95">
                        التالي
                    </button>
                </div>
            )}

            {/* Step 2: Bank Selection */}
            {step === 2 && (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-white mb-2">اختر البنك</h2>
                        <p className="text-sm text-gray-500">اختر البنك الذي تريد التحويل إليه</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {commonBanks.map((bank) => (
                            <button 
                                key={bank}
                                onClick={() => handleBankSelect(bank)}
                                className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all ${selectedBank === bank ? 'bg-primary/10 border-primary text-white shadow-lg shadow-primary/5' : 'bg-[#141414] border-[#2A2A2A] text-gray-400 hover:border-gray-600'}`}
                            >
                                <Landmark className={`w-8 h-8 ${selectedBank === bank ? 'text-primary' : 'text-gray-600'}`} />
                                <span className="text-xs font-bold text-center">{bank}</span>
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={handleNextStep2} 
                        disabled={fetchingBank}
                        className="w-full bg-primary text-black py-4 rounded-xl font-bold text-lg hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {fetchingBank ? <Loader2 className="animate-spin w-6 h-6 mx-auto" /> : 'التالي'}
                    </button>
                </div>
            )}

            {/* Step 3: Bank Info Display */}
            {step === 3 && bankDetails && (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-white mb-2">معلومات التحويل</h2>
                        <p className="text-sm text-gray-500">يرجى تحويل المبلغ إلى الحساب التالي</p>
                    </div>

                    <div className="bg-[#141414] border border-[#2A2A2A] rounded-3xl p-6 space-y-4">
                        <div className="bg-[#1C1C1C] p-4 rounded-2xl border border-[#333]">
                            <div className="text-xs text-gray-500 mb-1">اسم البنك</div>
                            <div className="text-white font-bold">{bankDetails.bank_name}</div>
                        </div>

                        <div className="bg-[#1C1C1C] p-4 rounded-2xl border border-[#333] relative group">
                            <div className="text-xs text-gray-500 mb-1">اسم صاحب الحساب</div>
                            <div className="text-white font-bold text-lg">{bankDetails.account_holder_name}</div>
                            <button onClick={() => copyToClipboard(bankDetails.account_holder_name)} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-[#333] rounded-lg text-gray-400 hover:text-white transition-colors">
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="bg-[#1C1C1C] p-4 rounded-2xl border border-[#333] relative group">
                            <div className="text-xs text-gray-500 mb-1">رقم الحساب (RIB)</div>
                            <div className="text-primary font-mono font-bold text-sm tracking-wider break-all">{bankDetails.account_number}</div>
                            <button onClick={() => copyToClipboard(bankDetails.account_number)} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-[#333] rounded-lg text-gray-400 hover:text-white transition-colors">
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>

                        {bankDetails.transfer_reason && (
                            <div className="bg-[#1C1C1C] p-4 rounded-2xl border border-[#333] relative group">
                                <div className="text-xs text-gray-500 mb-1">ملاحظة / سبب التحويل</div>
                                <div className="text-white font-bold text-sm">{bankDetails.transfer_reason}</div>
                                <button onClick={() => copyToClipboard(bankDetails.transfer_reason)} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-[#333] rounded-lg text-gray-400 hover:text-white transition-colors">
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-start gap-3">
                            <Info className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-yellow-200/80 leading-relaxed">
                                يرجى التأكد من نسخ المعلومات بشكل صحيح. قم بأخذ لقطة شاشة (Screenshot) لعملية التحويل الناجحة للانتقال للخطوة التالية.
                            </p>
                        </div>
                    </div>

                    <button onClick={() => setStep(4)} className="w-full bg-primary text-black py-4 rounded-xl font-bold text-lg hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 active:scale-95">
                        التالي
                    </button>
                </div>
            )}

            {/* Step 4: User Info & Proof */}
            {step === 4 && (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-white mb-2">تأكيد الإيداع</h2>
                        <p className="text-sm text-gray-500">أدخل معلوماتك وأرفق صورة التحويل</p>
                    </div>

                    <div className="bg-[#141414] border border-[#2A2A2A] rounded-3xl p-6 space-y-4">
                        <Input 
                            label="الاسم الكامل" 
                            placeholder="الاسم الذي قمت بالتحويل منه" 
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            leftElement={<UserIcon className="w-5 h-5" />}
                        />
                        <Input 
                            label="رقم حسابك (RIB)" 
                            placeholder="رقم الحساب المرسل منه" 
                            value={rib}
                            onChange={(e) => setRib(e.target.value)}
                            leftElement={<Hash className="w-5 h-5" />}
                        />

                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2 mr-1">صورة إثبات التحويل</label>
                            <div className="relative border-2 border-dashed border-[#333] rounded-2xl p-6 text-center hover:border-primary/50 transition-colors bg-[#0f0f0f]">
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                {proofFile ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-2">
                                            <Check className="w-6 h-6" />
                                        </div>
                                        <span className="text-white font-bold text-sm truncate max-w-[200px]">{proofFile.name}</span>
                                        <span className="text-xs text-green-500">تم اختيار الصورة</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-gray-500">
                                        <UploadCloud className="w-8 h-8 mb-2" />
                                        <span className="text-sm font-bold">اضغط لرفع الصورة</span>
                                        <span className="text-[10px]">JPG, PNG فقط</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleSubmit} 
                        disabled={uploading}
                        className="w-full bg-primary text-black py-4 rounded-xl font-bold text-lg hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {uploading ? <Loader2 className="animate-spin w-6 h-6 mx-auto" /> : 'تأكيد وإرسال الطلب'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default DepositTab;
