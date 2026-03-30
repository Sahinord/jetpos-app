"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Wallet, Search, ArrowLeft, ArrowUpRight, ArrowDownLeft, Building2, CreditCard } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';

interface Banka {
    id: string;
    tanimi: string;
    banka_adi: string;
    sube_adi: string;
    iban_no: string;
    para_birimi: string;
    aktif: boolean;
    balance?: number;
}

export default function BankaPage() {
    const router = useRouter();
    const [bankalar, setBankalar] = useState<Banka[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBankalar();
    }, []);

    const fetchBankalar = async () => {
        try {
            const tenantId = localStorage.getItem('tenantId');
            if (!tenantId) return;

            await supabase.rpc('set_current_tenant', { tenant_id: tenantId });

            // Fetch banks
            const { data: banks, error: bankError } = await supabase
                .from('bankalar')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('tanimi', { ascending: true });

            if (bankError) throw bankError;

            // Fetch balances
            const { data: movements, error: moveError } = await supabase
                .from('banka_hareketleri')
                .select('banka_id, borc, alacak')
                .eq('tenant_id', tenantId);

            if (moveError) throw moveError;

            const balances: Record<string, number> = {};
            movements?.forEach(m => {
                balances[m.banka_id] = (balances[m.banka_id] || 0) + (Number(m.borc) || 0) - (Number(m.alacak) || 0);
            });

            const combined = banks?.map(b => ({
                ...b,
                balance: balances[b.id] || 0
            })) || [];

            setBankalar(combined);
        } catch (error) {
            console.error('Banka fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredBankalar = useMemo(() => {
        if (!searchTerm) return bankalar;
        const lower = searchTerm.toLowerCase();
        return bankalar.filter(b => 
            b.tanimi.toLowerCase().includes(lower) || 
            b.banka_adi?.toLowerCase().includes(lower) ||
            b.iban_no?.toLowerCase().includes(lower)
        );
    }, [bankalar, searchTerm]);

    return (
        <div className="min-h-screen bg-slate-950 pb-24">
            {/* Header */}
            <header className="sticky top-0 z-50 glass border-b border-white/5 p-4 space-y-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 glass-dark rounded-xl border border-white/5">
                        <ArrowLeft size={20} className="text-secondary" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight leading-none uppercase">Banka Hesapları</h1>
                        <p className="text-[10px] font-black text-emerald-400 tracking-[2px] uppercase mt-1">Nakit & Mevduat</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Banka ara..."
                        className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-blue-500/50 transition-all font-medium"
                    />
                </div>
            </header>

            {/* Content */}
            <div className="p-4 space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-20">
                        <div className="w-8 h-8 border-2 border-white border-t-blue-500 rounded-full animate-spin mb-4" />
                    </div>
                ) : filteredBankalar.length === 0 ? (
                    <div className="py-20 text-center opacity-30">
                        <Building2 size={48} className="mx-auto mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest text-white">Hesap Bulunamadı</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredBankalar.map((bank) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={bank.id}
                                className="glass-dark border border-white/10 rounded-3xl p-5 space-y-4 relative overflow-hidden group"
                            >
                                <div className="flex items-start justify-between relative z-10">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-white font-black text-base truncate">{bank.tanimi}</h3>
                                            {!bank.aktif && (
                                                <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 text-[8px] font-black rounded-lg border border-rose-500/20">PASİF</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-secondary tracking-wider uppercase">
                                            <Building2 size={10} className="text-blue-500" />
                                            <span>{bank.banka_adi}</span>
                                            <span className="opacity-30">|</span>
                                            <span>{bank.sube_adi}</span>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl glass border border-white/5 flex items-center justify-center text-blue-400">
                                        <CreditCard size={18} />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5 relative z-10 flex items-end justify-between">
                                    <div>
                                        <p className="text-[9px] font-black text-secondary tracking-widest uppercase mb-1">GÜNCEL BAKİYE</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-white">
                                                ₺{bank.balance?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                            </span>
                                            <span className="text-[10px] font-bold text-secondary">{bank.para_birimi}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 items-end">
                                        <p className="text-[9px] font-mono text-secondary opacity-50 tracking-tighter truncate max-w-[150px]">{bank.iban_no}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}
