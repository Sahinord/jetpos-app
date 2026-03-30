"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Search, Users, ArrowLeft, ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';

interface Cari {
    id: string;
    unvani: string;
    cari_kodu: string;
    bakiye: number;
    borc_toplami: number;
    alacak_toplami: number;
    para_birimi: string;
    durum: string;
}

export default function CariPage() {
    const router = useRouter();
    const [cariler, setCariler] = useState<Cari[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCariler();
    }, []);

    const fetchCariler = async () => {
        try {
            const tenantId = localStorage.getItem('tenantId');
            if (!tenantId) return;

            await supabase.rpc('set_current_tenant', { tenant_id: tenantId });

            const { data, error } = await supabase
                .from('cari_hesaplar')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('unvani', { ascending: true });

            if (error) throw error;
            if (data) setCariler(data);
        } catch (error) {
            console.error('Cari fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCariler = useMemo(() => {
        if (!searchTerm) return cariler;
        const lower = searchTerm.toLowerCase();
        return cariler.filter(c => 
            c.unvani.toLowerCase().includes(lower) || 
            c.cari_kodu.toLowerCase().includes(lower)
        );
    }, [cariler, searchTerm]);

    return (
        <div className="min-h-screen bg-slate-950 pb-24">
            {/* Header */}
            <header className="sticky top-0 z-50 glass border-b border-white/5 p-4 space-y-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 glass-dark rounded-xl border border-white/5">
                        <ArrowLeft size={20} className="text-secondary" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight leading-none uppercase">Cari Hesaplar</h1>
                        <p className="text-[10px] font-black text-blue-400 tracking-[2px] uppercase mt-1">Müşteri & Tedarikçi</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cari ara..."
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
                ) : filteredCariler.length === 0 ? (
                    <div className="py-20 text-center opacity-30">
                        <Users size={48} className="mx-auto mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest text-white">Sonuç Bulunamadı</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredCariler.map((cari) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={cari.id}
                                className="glass-dark border border-white/10 rounded-3xl p-5 space-y-4 relative overflow-hidden group"
                            >
                                <div className="flex items-start justify-between relative z-10">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-white font-black text-base truncate">{cari.unvani}</h3>
                                            {cari.durum === 'Pasif' && (
                                                <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 text-[8px] font-black rounded-lg border border-rose-500/20">PASİF</span>
                                            )}
                                        </div>
                                        <p className="text-[10px] font-mono text-secondary uppercase tracking-widest">{cari.cari_kodu}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl glass border border-white/5 flex items-center justify-center text-blue-400">
                                        <Users size={18} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5 relative z-10">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-secondary tracking-widest uppercase">BAKİYE</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className={`text-lg font-black ${cari.bakiye >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                ₺{Math.abs(cari.bakiye).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                            </span>
                                            <span className="text-[9px] font-bold text-secondary">{cari.bakiye >= 0 ? '(A)' : '(B)'}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col justify-end items-end gap-1">
                                        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                                            <ArrowDownLeft size={10} className="text-emerald-400" />
                                            <span className="text-[10px] font-bold text-white">₺{cari.alacak_toplami?.toLocaleString('tr-TR')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                                            <ArrowUpRight size={10} className="text-rose-400" />
                                            <span className="text-[10px] font-bold text-white">₺{cari.borc_toplami?.toLocaleString('tr-TR')}</span>
                                        </div>
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
