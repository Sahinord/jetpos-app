"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Calculator, Search, ArrowLeft, ArrowUpRight, ArrowDownLeft, Store, DollarSign } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';

interface Kasa {
    id: string;
    kasa_adi: string;
    kasa_kodu: string;
    para_birimi: string;
    balance?: number;
}

export default function KasaPage() {
    const router = useRouter();
    const [kasalar, setKasalar] = useState<Kasa[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchKasalar();
    }, []);

    const fetchKasalar = async () => {
        try {
            const tenantId = localStorage.getItem('tenantId');
            if (!tenantId) return;

            await supabase.rpc('set_current_tenant', { tenant_id: tenantId });

            // Fetch kasas
            const { data: kasas, error: kasaError } = await supabase
                .from('kasa_tanimlari')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('kasa_adi', { ascending: true });

            if (kasaError) throw kasaError;

            // Fetch balances
            const { data: movements, error: moveError } = await supabase
                .from('kasa_fis_satirlari')
                .select('kasa_id, borc_tutari, alacak_tutari')
                .eq('tenant_id', tenantId);

            if (moveError) throw moveError;

            const balances: Record<string, number> = {};
            movements?.forEach(m => {
                balances[m.kasa_id] = (balances[m.kasa_id] || 0) + (Number(m.borc_tutari) || 0) - (Number(m.alacak_tutari) || 0);
            });

            const combined = kasas?.map(k => ({
                ...k,
                balance: balances[k.id] || 0
            })) || [];

            setKasalar(combined);
        } catch (error) {
            console.error('Kasa fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredKasalar = useMemo(() => {
        if (!searchTerm) return kasalar;
        const lower = searchTerm.toLowerCase();
        return kasalar.filter(k => 
            k.kasa_adi.toLowerCase().includes(lower) || 
            k.kasa_kodu.toLowerCase().includes(lower)
        );
    }, [kasalar, searchTerm]);

    return (
        <div className="min-h-screen bg-slate-950 pb-24">
            {/* Header */}
            <header className="sticky top-0 z-50 glass border-b border-white/5 p-4 space-y-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 glass-dark rounded-xl border border-white/5">
                        <ArrowLeft size={20} className="text-secondary" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight leading-none uppercase">Kasa İşlemleri</h1>
                        <p className="text-[10px] font-black text-amber-500 tracking-[2px] uppercase mt-1">Sıcak Para Yönetimi</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Kasa ara..."
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
                ) : filteredKasalar.length === 0 ? (
                    <div className="py-20 text-center opacity-30">
                        <Store size={48} className="mx-auto mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest text-white">Kasa Kaydı Yok</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredKasalar.map((kasa) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={kasa.id}
                                className="glass-dark border border-white/10 rounded-3xl p-5 space-y-4 relative overflow-hidden group"
                            >
                                <div className="flex items-start justify-between relative z-10">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-black text-base truncate mb-1">{kasa.kasa_adi}</h3>
                                        <p className="text-[10px] font-mono text-secondary uppercase tracking-widest">{kasa.kasa_kodu}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl glass border border-white/5 flex items-center justify-center text-amber-400">
                                        <DollarSign size={18} />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5 relative z-10 flex items-end justify-between">
                                    <div>
                                        <p className="text-[9px] font-black text-secondary tracking-widest uppercase mb-1">MEVCUT NAKİT</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-white">
                                                ₺{kasa.balance?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                            </span>
                                            <span className="text-[10px] font-bold text-secondary">{kasa.para_birimi}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => router.push(`/kasa/${kasa.id}/fis`)}
                                        className="px-4 py-2 glass border border-amber-500/20 text-amber-500 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                                    >
                                        Detay
                                    </button>
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
