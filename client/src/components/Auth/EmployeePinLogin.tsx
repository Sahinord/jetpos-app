
"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, ArrowRight, X, Delete } from 'lucide-react';
import { useTenant } from '@/lib/tenant-context';
import { supabase } from '@/lib/supabase';

interface EmployeePinLoginProps {
    onSuccess?: (employee: any) => void;
    onCancel?: () => void;
    isModal?: boolean;
}

export default function EmployeePinLogin({ onSuccess, onCancel, isModal = false }: EmployeePinLoginProps) {
    const { currentTenant, verifyEmployeePin, setActiveEmployee } = useTenant();
    const [pin, setPin] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isPasswordMode, setIsPasswordMode] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleNumberClick = (num: string) => {
        if (pin.length < 6) {
            setPin(prev => prev + num);
            setError("");
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
    };

    const handleLogin = async () => {
        if (pin.length < 4) {
            setError("Lütfen geçerli bir PIN girin");
            return;
        }

        setLoading(true);
        const result = await verifyEmployeePin(pin);
        if (result.success) {
            if (onSuccess) onSuccess(result.employee);
        } else {
            setError(result.message || "Geçersiz PIN");
            setPin("");
        }
        setLoading(false);
    };

    const handlePasswordLogin = async () => {
        if (!password) {
            setError("Lütfen yönetici şifresini girin");
            return;
        }

        setLoading(true);
        try {
            const { data, error: rpcError } = await supabase.rpc('verify_tenant_password', {
                p_tenant_id: currentTenant?.id,
                p_password: password
            });

            if (rpcError) throw rpcError;
            
            if (data.success) {
                // Şifre ile girildiğinde "Patron" yetkisi veriyoruz (Virtual Employee)
                const bossEmployee = {
                    id: 'boss-' + currentTenant?.id,
                    first_name: 'İşletme',
                    last_name: 'Sahibi',
                    position: 'Patron',
                    permissions: {
                        can_access_pos: true, can_access_adisyon: true, can_access_reports: true,
                        can_access_settings: true, can_access_inventory: true, can_access_expenses: true,
                        can_access_crm: true, can_manage_employees: true, can_apply_discount: true,
                        can_delete_sales: true, can_manage_invoices: true
                    }
                };
                
                // 🔥 KRİTİK: State'i güncelle ve tarayıcıya kaydet
                setActiveEmployee(bossEmployee);
                localStorage.setItem('activeEmployee', JSON.stringify(bossEmployee));

                if (onSuccess) onSuccess(bossEmployee);
                else window.location.reload(); // Başka yerde kullanılmıyorsa sayfayı yenile ki giriş yapılsın
            } else {
                setError(data.message || "Hatalı şifre");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (pin.length >= 4 && pin.length <= 6) {
            // Auto-submit if needed or just wait for 4-6
        }
    }, [pin]);

    return (
        <div className={`${isModal ? 'absolute' : 'fixed'} inset-0 z-[10000] flex items-center justify-center bg-[#020617]/90 p-4 overflow-hidden backdrop-blur-md`}>
             {/* Background Glows */}
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_70%)]" />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl"
            >
                {onCancel && (
                    <button onClick={onCancel} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-xl transition-all">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                )}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-primary/20 border border-primary/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <User className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Çalışan Girişi</h2>
                    <p className="text-slate-400 text-sm mt-2 font-medium">
                        {currentTenant?.company_name} — Devam etmek için PIN kodunuzu girin
                    </p>
                </div>

                {error && (
                    <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-rose-500 text-center text-sm font-bold mb-6 bg-rose-500/10 py-2 rounded-xl"
                    >
                        {error}
                    </motion.p>
                )}

                {/* PIN Mode Display & Pad */}
                {!isPasswordMode ? (
                    <>
                        <div className="flex justify-center gap-4 mb-10">
                            {[...Array(4)].map((_, i) => (
                                <div 
                                    key={i}
                                    className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                                        pin.length > i 
                                        ? 'bg-emerald-500 border-emerald-500 scale-125 shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                                        : 'border-white/20 bg-white/5'
                                    }`}
                                />
                            ))}
                            <div className="w-1 h-5 bg-white/10 mx-1 rounded-full self-center" />
                            {[...Array(2)].map((_, i) => (
                                <div 
                                    key={i+4}
                                    className={`w-4 h-4 rounded-full border-2 border-dashed transition-all duration-300 ${
                                        pin.length > i+4 
                                        ? 'bg-emerald-500 border-emerald-500 scale-110 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                                        : 'border-white/10'
                                    }`}
                                />
                            ))}
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-8">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => handleNumberClick(num.toString())}
                                    className="h-16 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 text-2xl font-bold text-white transition-all active:scale-90"
                                >
                                    {num}
                                </button>
                            ))}
                            <button
                                onClick={handleDelete}
                                className="h-16 rounded-2xl bg-rose-500/10 border border-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center justify-center transition-all active:scale-90"
                            >
                                <Delete />
                            </button>
                            <button
                                onClick={() => handleNumberClick("0")}
                                className="h-16 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 text-2xl font-bold text-white transition-all active:scale-90"
                            >
                                0
                            </button>
                            <button
                                onClick={handleLogin}
                                disabled={loading || pin.length < 4}
                                className="h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white flex items-center justify-center transition-all active:scale-90 disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <ArrowRight />
                                )}
                            </button>
                        </div>

                        <button 
                            onClick={() => setIsPasswordMode(true)}
                            className="w-full py-4 text-slate-500 hover:text-white text-xs font-black uppercase tracking-widest transition-all"
                        >
                            Yönetici Şifresi ile Giriş Yap →
                        </button>
                    </>
                ) : (
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-500 ml-1 flex items-center gap-2">
                                <Lock className="w-3 h-3" />
                                Sistem Yönetici Şifresi (Master)
                            </label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl text-white outline-none focus:border-emerald-500/50 text-center text-lg tracking-[0.3em]"
                                placeholder="••••••••"
                                autoFocus
                            />
                            <p className="text-[10px] text-slate-500 text-center italic">
                                İşletme kurulumunda belirlenen ana şifreyi girin.
                            </p>
                        </div>
                        <button
                            onClick={handlePasswordLogin}
                            disabled={loading}
                            className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/30 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Giriş Yap"}
                        </button>
                        <button 
                            onClick={() => setIsPasswordMode(false)}
                            className="w-full py-2 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            ← PIN Moduna Dön
                        </button>
                    </div>
                )}

                <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-6">
                    Güvenliğiniz için bilgilerinizi kimseyle paylaşmayın
                </p>
            </motion.div>
        </div>
    );
}
