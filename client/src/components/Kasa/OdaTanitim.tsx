"use client";

import { useState, useCallback, useEffect } from "react";
import {
    Save, X, Trash2, LayoutDashboard,
    MoreHorizontal, Bed, Home, Map,
    Layers, Banknote, ShieldCheck,
    Plus, Search, ChevronRight, Sparkles,
    CircleDot, CheckCircle2, AlertCircle, Hammer
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

interface OdaTanitimProps {
    showToast?: (message: string, type: "success" | "error" | "info" | "warning") => void;
}

export default function OdaTanitim({ showToast }: OdaTanitimProps) {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [odaCount, setOdaCount] = useState(0);

    const [formData, setFormData] = useState({
        odaNo: "",
        odaAdi: "",
        odaTipi: "Standart",
        katNo: "",
        fiyat: "",
        paraBirimi: "TRY",
        durum: "Bos"
    });

    const loadOdaCount = async () => {
        if (!currentTenant) return;
        const { count } = await supabase
            .from('odalar')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', currentTenant.id);
        setOdaCount(count || 0);
    };

    useEffect(() => {
        loadOdaCount();
    }, [currentTenant]);

    const updateField = useCallback((field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleSave = async () => {
        if (!currentTenant) return;
        if (!formData.odaNo) {
            showToast?.("Oda No zorunludur", "warning");
            return;
        }

        setLoading(true);
        try {
            const dbData = {
                tenant_id: currentTenant.id,
                oda_no: formData.odaNo,
                oda_adi: formData.odaAdi,
                oda_tipi: formData.odaTipi,
                kat_no: formData.katNo ? parseInt(formData.katNo) : null,
                fiyat: formData.fiyat ? parseFloat(formData.fiyat) : 0,
                para_birimi: formData.paraBirimi,
                durum: formData.durum,
            };

            if (editingId) {
                const { error } = await supabase.from('odalar').update(dbData).eq('id', editingId);
                if (error) throw error;
                showToast?.("Oda/Masa güncellendi", "success");
            } else {
                const { error } = await supabase.from('odalar').insert([dbData]);
                if (error) {
                    if (error.code === '23505') {
                        showToast?.("Bu oda numarası zaten mevcut", "error");
                    } else throw error;
                    return;
                }
                showToast?.("Oda/Masa kaydedildi", "success");
            }
            handleClear();
            loadOdaCount();
        } catch (err: any) {
            showToast?.(err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!editingId) return;
        if (!confirm("Seçili kaydı silmek istediğinize emin misiniz?")) return;

        setLoading(true);
        try {
            const { error } = await supabase.from('odalar').delete().eq('id', editingId);
            if (error) throw error;
            showToast?.("Kayıt silindi", "success");
            handleClear();
            loadOdaCount();
        } catch (err: any) {
            showToast?.(err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setEditingId(null);
        setFormData({
            odaNo: "",
            odaAdi: "",
            odaTipi: "Standart",
            katNo: "",
            fiyat: "",
            paraBirimi: "TRY",
            durum: "Bos"
        });
    };

    const handleSearch = async () => {
        if (!formData.odaNo || !currentTenant) return;
        const { data, error } = await supabase
            .from('odalar')
            .select('*')
            .eq('tenant_id', currentTenant.id)
            .eq('oda_no', formData.odaNo)
            .single();

        if (data) {
            setEditingId(data.id);
            setFormData({
                odaNo: data.oda_no || "",
                odaAdi: data.oda_adi || "",
                odaTipi: data.oda_tipi || "Standart",
                katNo: data.kat_no?.toString() || "",
                fiyat: data.fiyat?.toString() || "",
                paraBirimi: data.para_birimi || "TRY",
                durum: data.durum || "Bos"
            });
            showToast?.("Oda detayları yüklendi", "info");
        } else {
            showToast?.("Oda bulunamadı", "warning");
        }
    };

    const statusIcons: any = {
        Bos: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
        Dolu: <CircleDot className="w-4 h-4 text-primary" />,
        Temizlik: <Sparkles className="w-4 h-4 text-amber-500" />,
        Arizali: <AlertCircle className="w-4 h-4 text-rose-500" />
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            {/* Header / Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-1 glass-card p-6 bg-gradient-to-br from-primary/10 to-transparent border-primary/20 relative overflow-hidden group"
                >
                    <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Home className="w-32 h-32 rotate-12" />
                    </div>
                    <div className="relative z-10 text-center lg:text-left">
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center mb-4 mx-auto lg:mx-0">
                            <LayoutDashboard className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-sm text-secondary font-medium">Toplam Oda / Masa</p>
                        <h3 className="text-3xl font-black text-white mt-1">{odaCount}</h3>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-3 glass-card p-6 border-white/5 flex items-center justify-between bg-white/[0.02]"
                >
                    <div className="flex gap-8 overflow-x-auto pb-2 scrollbar-none w-full">
                        <div className="flex flex-col gap-1 min-w-fit">
                            <span className="text-[10px] font-black uppercase tracking-widest text-secondary">Tipleme</span>
                            <div className="flex gap-2">
                                <span className="px-2 py-1 bg-white/5 rounded text-[11px] text-white/50">Standart</span>
                                <span className="px-2 py-1 bg-white/5 rounded text-[11px] text-white/50">Masa</span>
                                <span className="px-2 py-1 bg-white/5 rounded text-[11px] text-white/50">Vip</span>
                            </div>
                        </div>
                        <div className="h-10 w-px bg-white/5" />
                        <div className="flex flex-col gap-1 min-w-fit">
                            <span className="text-[10px] font-black uppercase tracking-widest text-secondary">Hızlı Erişim</span>
                            <div className="flex gap-2">
                                <button className="p-2 bg-primary/10 rounded-lg text-primary hover:bg-primary transition-colors hover:text-white"><Plus className="w-4 h-4" /></button>
                                <button className="p-2 bg-white/5 rounded-lg text-secondary hover:bg-white/10 transition-colors"><Search className="w-4 h-4" /></button>
                                <button className="p-2 bg-white/5 rounded-lg text-secondary hover:bg-white/10 transition-colors"><Map className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Form Section */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-8 space-y-6"
                >
                    <div className="glass-card p-8 border-white/5 space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                            <Bed className="w-32 h-32" />
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="h-8 w-1.5 bg-primary rounded-full" />
                            <h2 className="text-xl font-bold text-white tracking-tight">Oda / Masa Detayları</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-7">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-secondary uppercase tracking-widest flex items-center gap-2">
                                    <Home className="w-3 h-3 text-primary" /> Oda / Masa No
                                </label>
                                <div className="group relative">
                                    <input
                                        type="text"
                                        value={formData.odaNo}
                                        onChange={e => updateField("odaNo", e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl px-5 py-3.5 text-white text-sm transition-all outline-none"
                                        placeholder="Benzersiz numara veya ad..."
                                    />
                                    <button
                                        onClick={handleSearch}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-primary/20 rounded-xl transition-colors text-primary"
                                    >
                                        <Search className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-secondary uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles className="w-3 h-3 text-primary" /> Tanımı / Adı
                                </label>
                                <input
                                    type="text"
                                    value={formData.odaAdi}
                                    onChange={e => updateField("odaAdi", e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl px-5 py-3.5 text-white text-sm transition-all outline-none"
                                    placeholder="Opsiyonel açıklayıcı isim..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-secondary uppercase tracking-widest flex items-center gap-2">
                                    <Layers className="w-3 h-3 text-primary" /> Bölüm / Kat
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={formData.katNo}
                                        onChange={e => updateField("katNo", e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl px-5 py-3.5 text-white text-sm transition-all outline-none"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-white/20 font-bold">floor.id</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-secondary uppercase tracking-widest flex items-center gap-2">
                                    <Map className="w-3 h-3 text-primary" /> Birim Tipi
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.odaTipi}
                                        onChange={e => updateField("odaTipi", e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl px-5 py-3.5 text-white text-sm transition-all outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="Standart">Standart Oda</option>
                                        <option value="Süit">Süit Oda</option>
                                        <option value="Deluxe">Deluxe Oda</option>
                                        <option value="Masa">Masa (Restoran)</option>
                                        <option value="Stand">Ayakta / Stand</option>
                                    </select>
                                    <ChevronRight className="w-4 h-4 text-secondary absolute right-4 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-secondary uppercase tracking-widest flex items-center gap-2">
                                        <Banknote className="w-3 h-3 text-primary" /> Taban Fiyat
                                    </label>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={formData.fiyat}
                                            onChange={e => updateField("fiyat", e.target.value)}
                                            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm outline-none focus:border-primary/50"
                                            placeholder="0.00"
                                        />
                                        <select
                                            value={formData.paraBirimi}
                                            onChange={e => updateField("paraBirimi", e.target.value)}
                                            className="w-24 bg-white/5 border border-white/10 rounded-2xl px-2 text-white text-sm outline-none appearance-none text-center"
                                        >
                                            <option value="TRY">TRY</option>
                                            <option value="USD">USD</option>
                                            <option value="EUR">EUR</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-secondary uppercase tracking-widest">Durum Seçimi</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {["Bos", "Dolu", "Temizlik", "Arizali"].map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => updateField("durum", s)}
                                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[11px] font-black transition-all ${formData.durum === s
                                                        ? 'bg-primary/20 border-primary text-white'
                                                        : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'
                                                    }`}
                                            >
                                                {statusIcons[s]}
                                                {s === 'Bos' ? 'BOŞ' : s === 'Arizali' ? 'ARIZALI' : s.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Actions Section */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-4 space-y-6"
                >
                    <div className="glass-card p-6 border-white/5 space-y-4 shadow-2xl shadow-primary/5">
                        <div className="flex items-center gap-3 mb-2">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            <h4 className="text-sm font-bold text-white uppercase tracking-tight">Kayıt İşlemleri</h4>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="w-full flex items-center justify-between p-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black transition-all group active:scale-[0.98]"
                        >
                            <span className="flex items-center gap-4">
                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
                                {editingId ? 'GÜNCELLE' : 'SİSTEME KAYDET'}
                            </span>
                            <ChevronRight className="w-5 h-5 opacity-30 group-hover:opacity-100 transition-opacity" />
                        </button>

                        <button
                            onClick={handleClear}
                            className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all border border-white/10 group"
                        >
                            <span className="flex items-center gap-4 text-secondary group-hover:text-white transition-colors">
                                <X className="w-5 h-5" /> TEMİZLE
                            </span>
                        </button>

                        <AnimatePresence>
                            {editingId && (
                                <motion.button
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    onClick={handleDelete}
                                    className="w-full flex items-center justify-between p-4 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-2xl font-black transition-all border border-rose-500/20 group"
                                >
                                    <span className="flex items-center gap-4">
                                        <Trash2 className="w-5 h-5" /> KAYDI SİL
                                    </span>
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="glass-card p-6 border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                            <Hammer className="w-12 h-12" />
                        </div>
                        <h4 className="text-xs font-black text-primary uppercase mb-3 tracking-widest">Hızlı İpucu</h4>
                        <p className="text-xs text-secondary leading-relaxed font-medium">
                            Oda veya Masalarınızı kat planına göre numaralandırmanız, sipariş takibinde size hız kazandıracaktır.
                            Örneğin 1. kat için 101, 102... şeklinde ilerleyebilirsiniz.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
