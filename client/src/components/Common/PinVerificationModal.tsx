"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, Delete, ArrowRight } from 'lucide-react';
import { useTenant } from '@/lib/tenant-context';
import { supabase } from '@/lib/supabase';

interface PinVerificationModalProps {
    isOpen: boolean;
    title?: string;
    description?: string;
    requiredPermission?: string; // e.g. 'can_apply_discount' or 'can_delete_sales'
    requiredRoles?: string[]; // e.g. ['Owner', 'Manager']
    onSuccess: (employee: any) => void;
    onCancel: () => void;
}

export default function PinVerificationModal({
    isOpen,
    title = "Yetkili Onayı Gerekli",
    description = "Bu işlemi gerçekleştirmek için yetkili PIN kodunu girin.",
    requiredPermission,
    requiredRoles = ['Owner', 'Manager'],
    onSuccess,
    onCancel
}: PinVerificationModalProps) {
    const { currentTenant } = useTenant();
    const [pin, setPin] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleNumberClick = (num: string) => {
        if (pin.length < 6) {
            setPin(prev => prev + num);
            setError("");
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
    };

    const handleVerify = async () => {
        if (pin.length < 4) {
            setError("Lütfen geçerli bir PIN girin");
            return;
        }

        setLoading(true);
        try {
            const { data, error: rpcError } = await supabase.rpc('verify_employee_pin', {
                p_tenant_id: currentTenant?.id,
                p_pin_code: pin
            });

            if (rpcError) throw rpcError;

            if (data.success && data.employee) {
                const emp = data.employee;
                const role = emp.role || emp.position;

                // Validate if employee matches the required roles or permissions
                const hasRole = requiredRoles.includes(role);
                const hasPermission = requiredPermission ? emp.permissions?.[requiredPermission] === true : false;

                if (hasRole || hasPermission || role === 'Patron' || role === 'Owner') {
                    onSuccess(emp);
                } else {
                    setError("Bu işlem için yetkiniz yetersiz.");
                    setPin("");
                }
            } else {
                setError(data.message || "Geçersiz PIN kodu");
                setPin("");
            }
        } catch (err: any) {
            setError(err.message || "Doğrulama hatası oluştu.");
            setPin("");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (pin.length === 6) {
            handleVerify();
        }
    }, [pin]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-[#020617]/90 p-4 backdrop-blur-md">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.08),transparent_70%)]" />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl text-white"
            >
                <button onClick={onCancel} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-xl transition-all">
                    <X className="w-5 h-5 text-slate-400" />
                </button>

                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-400">
                        <ShieldCheck className="w-7 h-7" />
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-tight">{title}</h2>
                    <p className="text-slate-400 text-xs mt-2 font-medium px-4">
                        {description}
                    </p>
                </div>

                {error && (
                    <motion.p 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-rose-500 text-center text-xs font-bold mb-5 bg-rose-500/10 py-2 rounded-xl border border-rose-500/10"
                    >
                        ⚠️ {error}
                    </motion.p>
                )}

                {/* Dots representation */}
                <div className="flex justify-center gap-3 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div 
                            key={i}
                            className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                                pin.length > i 
                                ? 'bg-indigo-500 border-indigo-500 scale-110 shadow-[0_0_10px_rgba(99,102,241,0.5)]' 
                                : 'border-white/20 bg-white/5'
                            }`}
                        />
                    ))}
                    <div className="w-0.5 h-4 bg-white/10 self-center" />
                    {[...Array(2)].map((_, i) => (
                        <div 
                            key={i+4}
                            className={`w-3.5 h-3.5 rounded-full border-2 border-dashed transition-all duration-300 ${
                                pin.length > i+4 
                                ? 'bg-indigo-500 border-indigo-500 scale-105 shadow-[0_0_8px_rgba(99,102,241,0.3)]' 
                                : 'border-white/10'
                            }`}
                        />
                    ))}
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-3.5 mb-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(num.toString())}
                            className="h-14 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 text-xl font-bold transition-all active:scale-90"
                        >
                            {num}
                        </button>
                    ))}
                    <button
                        onClick={handleDelete}
                        className="h-14 rounded-2xl bg-rose-500/10 border border-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center justify-center transition-all active:scale-90"
                    >
                        <Delete size={18} />
                    </button>
                    <button
                        onClick={() => handleNumberClick("0")}
                        className="h-14 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 text-xl font-bold transition-all active:scale-90"
                    >
                        0
                    </button>
                    <button
                        onClick={handleVerify}
                        disabled={loading || pin.length < 4}
                        className="h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all active:scale-90 disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <ArrowRight size={18} />
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
