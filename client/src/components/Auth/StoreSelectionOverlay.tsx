"use client";

import { useState, useEffect } from 'react';
import { Building2, ArrowRight, Store, ShoppingBag, MapPin, Sparkles, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/lib/tenant-context';

export default function StoreSelectionOverlay() {
    const { currentTenant, activeWarehouse, setActiveWarehouse, warehouses, refreshWarehouses } = useTenant();
    const [isInternalLoading, setIsInternalLoading] = useState(false);

    const handleQuickSetup = async () => {
        setIsInternalLoading(true);
        const { error } = await supabase
            .from('warehouses')
            .insert([
                { 
                    name: 'Fiziksel Mağaza (Kasa)', 
                    type: 'storage', 
                    is_default: true, 
                    tenant_id: currentTenant?.id,
                    is_active: true,
                    code: 'FIZ-001'
                },
                { 
                    name: 'Trendyol Mağazası', 
                    type: 'virtual', 
                    is_default: false, 
                    tenant_id: currentTenant?.id,
                    is_active: true,
                    code: 'TRN-001'
                }
            ]);

        if (error) {
            alert("Mağaza oluşturulurken hata: " + error.message);
        } else {
            // Refresh global warehouses list
            await refreshWarehouses();
            // Don't auto-select, let user see both and choose
        }
        setIsInternalLoading(false);
    };

    if (activeWarehouse || isInternalLoading) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950 p-4 overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.15),transparent_70%)]" />
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full" />
            <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative w-full max-w-4xl"
            >
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="inline-flex p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 mb-6"
                    >
                        <Building2 className="w-12 h-12 text-indigo-400" />
                    </motion.div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">
                        {warehouses.length === 0 ? 'Sistem Hazırlanıyor' : 'Mağaza Seçimi Yapın'}
                    </h1>
                    <p className="text-secondary font-medium uppercase tracking-widest text-sm">
                        {currentTenant?.company_name} — {warehouses.length === 0 ? 'Lütfen ilk mağazanızı tanımlayın veya hızlı kurulumu kullanın' : 'Devam etmek için bir çalışma alanı seçin'}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {warehouses.map((w, idx) => (
                        <motion.button
                            key={w.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            onClick={() => setActiveWarehouse(w)}
                            className="group relative text-left bg-slate-900/50 border border-white/10 p-6 rounded-3xl hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                {w.type === 'virtual' ? <ShoppingBag size={80} /> : <Store size={80} />}
                            </div>

                            <div className="relative z-10 flex flex-col h-full">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                                    w.type === 'virtual' ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'
                                }`}>
                                    {w.type === 'virtual' ? <ShoppingBag className="w-6 h-6" /> : <Store className="w-6 h-6" />}
                                </div>

                                <h3 className="text-xl font-bold text-white uppercase group-hover:text-indigo-400 transition-colors">
                                    {w.name}
                                </h3>
                                <p className="text-xs text-secondary font-medium tracking-wider mb-8">
                                    {w.type === 'virtual' ? 'Online Mağaza' : w.type === 'shelf' ? 'Raf Sistemi' : 'Depo / Mağaza'}
                                </p>

                                <div className="mt-auto flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-secondary tracking-widest uppercase">
                                        <MapPin className="w-3 h-3 text-secondary/50" />
                                        {w.address || 'Merkez'}
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-indigo-500 transform group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>

                            {/* Hover Glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.button>
                    ))}

                    {/* Quick Setup Button if empty */}
                    {warehouses.length === 0 && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={handleQuickSetup}
                            className="relative group p-6 rounded-3xl bg-indigo-500/20 border-2 border-indigo-500/30 hover:bg-indigo-500/30 transition-all flex flex-col items-center justify-center text-center space-y-3 lg:col-span-1"
                        >
                            <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-black text-white uppercase tracking-widest">Hızlı Kurulum Başlat</span>
                            <span className="text-[10px] text-indigo-200/60 font-medium">Fiziksel ve Trendyol mağazalarını otomatik oluştur</span>
                        </motion.button>
                    )}

                    {/* New Store Placeholder */}
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: warehouses.length * 0.1 }}
                        onClick={handleQuickSetup}
                        className="relative group border-2 border-dashed border-white/5 p-6 rounded-3xl hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all flex flex-col items-center justify-center text-center space-y-3"
                    >
                        <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center text-white/20 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all">
                            <Plus size={24} />
                        </div>
                        <span className="text-xs font-black text-secondary uppercase tracking-widest">Mağaza Ayarları</span>
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}

