"use client";

import { useState, useCallback, useEffect } from "react";
import {
    Save, X, Trash2, Wallet, MoreHorizontal,
    ArrowUpRight, ArrowDownLeft, Activity,
    Shield, Briefcase, Building2, Coins,
    ChevronRight, Search, CreditCard, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

interface KasaTanitimProps {
    showToast?: (message: string, type: "success" | "error" | "info" | "warning") => void;
}

export default function KasaTanitim({ showToast }: KasaTanitimProps) {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [kasaCount, setKasaCount] = useState(0);

    const [formData, setFormData] = useState({
        kasaKodu: "",
        kasaAdi: "",
        yetkiliKisi: "",
        muhKodu1: "",
        muhKodu2: "",
        paraBirimi: "TRY",
        isyeriKodu: "",
        ozelKod: "",
        yetkiKodu: "",
        aciklama: "",
    });

    const [totals, setTotals] = useState({ borc: 0, alacak: 0, bakiye: 0 });

    const loadStats = async () => {
        if (!currentTenant) return;

        const { count } = await supabase
            .from('kasa_tanimlari')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', currentTenant.id);
        setKasaCount(count || 0);

        if (editingId) {
            const { data: movements } = await supabase
                .from('kasa_fis_satirlari')
                .select('borc_tutari, alacak_tutari')
                .eq('kasa_id', editingId);

            if (movements) {
                const b = movements.reduce((sum, m) => sum + (Number(m.borc_tutari) || 0), 0);
                const a = movements.reduce((sum, m) => sum + (Number(m.alacak_tutari) || 0), 0);
                setTotals({ borc: b, alacak: a, bakiye: b - a });
            }
        } else {
            setTotals({ borc: 0, alacak: 0, bakiye: 0 });
        }
    };

    useEffect(() => {
        loadStats();
    }, [currentTenant, editingId]);

    const updateField = useCallback((field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleSave = async () => {
        if (!currentTenant) return;
        if (!formData.kasaKodu || !formData.kasaAdi) {
            showToast?.("Kasa Kodu ve Kasa Adı zorunludur", "warning");
            return;
        }

        setLoading(true);
        try {
            const dbData = {
                tenant_id: currentTenant.id,
                kasa_kodu: formData.kasaKodu,
                kasa_adi: formData.kasaAdi,
                yetkili_kisi: formData.yetkiliKisi,
                muh_kodu_1: formData.muhKodu1,
                muh_kodu_2: formData.muhKodu2,
                para_birimi: formData.paraBirimi,
                isyeri_kodu: formData.isyeriKodu,
                ozel_kod: formData.ozelKod,
                yetki_kodu: formData.yetkiKodu,
                aciklama: formData.aciklama,
            };

            if (editingId) {
                const { error } = await supabase.from('kasa_tanimlari').update(dbData).eq('id', editingId);
                if (error) throw error;
                showToast?.("Kasa güncellendi", "success");
            } else {
                const { error } = await supabase.from('kasa_tanimlari').insert([dbData]);
                if (error) throw error;
                showToast?.("Kasa başarıyla oluşturuldu", "success");
            }
            handleClear();
            loadStats();
        } catch (err: any) {
            showToast?.(err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!editingId) return;
        if (!confirm("Bu kasayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) return;

        setLoading(true);
        try {
            const { error } = await supabase.from('kasa_tanimlari').delete().eq('id', editingId);
            if (error) throw error;
            showToast?.("Kasa silindi", "success");
            handleClear();
            loadStats();
        } catch (err: any) {
            showToast?.(err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setEditingId(null);
        setFormData({
            kasaKodu: "",
            kasaAdi: "",
            yetkiliKisi: "",
            muhKodu1: "",
            muhKodu2: "",
            paraBirimi: "TRY",
            isyeriKodu: "",
            ozelKod: "",
            yetkiKodu: "",
            aciklama: "",
        });
    };

    const handleSearch = async () => {
        if (!formData.kasaKodu || !currentTenant) return;
        const { data, error } = await supabase
            .from('kasa_tanimlari')
            .select('*')
            .eq('tenant_id', currentTenant.id)
            .eq('kasa_kodu', formData.kasaKodu)
            .single();

        if (data) {
            setEditingId(data.id);
            setFormData({
                kasaKodu: data.kasa_kodu || "",
                kasaAdi: data.kasa_adi || "",
                yetkiliKisi: data.yetkili_kisi || "",
                muhKodu1: data.mu_kodu_1 || "",
                muhKodu2: data.mu_kodu_2 || "",
                paraBirimi: data.para_birimi || "TRY",
                isyeriKodu: data.isyeri_kodu || "",
                ozelKod: data.ozel_kod || "",
                yetkiKodu: data.yetki_kodu || "",
                aciklama: data.aciklama || "",
            });
            showToast?.("Kasa detayları yüklendi", "info");
        } else {
            showToast?.("Kasa bulunamadı", "warning");
        }
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-32 px-4 md:px-8">
            {/* Header / Stats Wrapper */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="md:col-span-1 glass-card p-6 md:p-8 bg-gradient-to-br from-primary/10 to-transparent border-primary/20 relative overflow-hidden group shadow-xl"
                >
                    <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Wallet className="w-40 h-40 rotate-12" />
                    </div>
                    <div className="relative z-10">
                        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center mb-6 border border-primary/20">
                            <Wallet className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-1 opacity-60">Aktif Kasa Sayısı</p>
                        <h3 className="text-3xl font-bold text-white tracking-tight">{kasaCount}</h3>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="md:col-span-1 lg:col-span-3 glass-card p-6 md:p-8 border-white/5 relative overflow-hidden shadow-xl"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 text-emerald-500 mb-2">
                                <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20"><ArrowUpRight className="w-4 h-4" /></div>
                                <span className="text-[10px] uppercase font-bold tracking-widest">Borç Toplamı</span>
                            </div>
                            <p className="text-2xl font-bold text-white tracking-tight">
                                <span className="text-xs opacity-30 mr-2 font-bold whitespace-nowrap">TRY</span>
                                {totals.borc.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 text-rose-500 mb-2">
                                <div className="p-1.5 bg-rose-500/10 rounded-lg border border-rose-500/20"><ArrowDownLeft className="w-4 h-4" /></div>
                                <span className="text-[10px] uppercase font-bold tracking-widest">Alacak Toplamı</span>
                            </div>
                            <p className="text-2xl font-bold text-white tracking-tight">
                                <span className="text-xs opacity-30 mr-2 font-bold whitespace-nowrap">TRY</span>
                                {totals.alacak.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 text-primary mb-2">
                                <div className="p-1.5 bg-primary/10 rounded-lg border border-primary/20"><Activity className="w-4 h-4" /></div>
                                <span className="text-[10px] uppercase font-bold tracking-widest">Net Cari Bakiye</span>
                            </div>
                            <div className="flex items-baseline gap-2 overflow-hidden">
                                <p className={`text-2xl font-bold tracking-tight truncate ${totals.bakiye >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    <span className="text-xs opacity-50 mr-2 font-bold whitespace-nowrap italic">TRY</span>
                                    {Math.abs(totals.bakiye).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                </p>
                                <span className={`text-[10px] font-black shrink-0 px-2 py-0.5 rounded-md border ${totals.bakiye >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                                    {totals.bakiye >= 0 ? 'BORÇ' : 'ALACAK'}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Main Form Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-8 space-y-8"
                >
                    {/* Primary Info */}
                    <div className="glass-card p-6 md:p-10 border-white/5 space-y-10 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] -rotate-12 pointer-events-none">
                            <Sparkles className="w-48 h-48 text-primary" />
                        </div>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0" />

                        <div className="flex items-center gap-5 relative">
                            <div className="w-1.5 h-10 bg-primary/40 rounded-full" />
                            <div>
                                <h2 className="text-xl font-black text-white tracking-widest uppercase">Kasa Kimlik Bilgileri</h2>
                                <p className="text-[10px] text-secondary font-bold uppercase tracking-widest opacity-40 mt-1">Sistem içi benzersiz tanımlamalar ve yetkiler</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 relative">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-3">
                                    <div className="p-1.5 bg-primary/10 rounded-lg border border-primary/20"><Shield className="w-3.5 h-3.5 text-primary" /></div>
                                    Kasa Referans Kodu
                                </label>
                                <div className="group relative">
                                    <input
                                        type="text"
                                        value={formData.kasaKodu}
                                        onChange={e => updateField("kasaKodu", e.target.value)}
                                        className="w-full bg-[#020617]/40 border border-white/10 hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-xl px-5 py-3 text-white text-sm font-bold transition-all outline-none"
                                        placeholder="KASA-001"
                                    />
                                    <button
                                        onClick={handleSearch}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-primary/10 hover:bg-primary/20 rounded-xl transition-all text-primary border border-primary/10 active:scale-95"
                                        title="Kodu Ara"
                                    >
                                        <Search className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-3">
                                    <div className="p-1.5 bg-primary/10 rounded-lg border border-primary/20"><CreditCard className="w-3.5 h-3.5 text-primary" /></div>
                                    Resmi Kasa Tanımı
                                </label>
                                <input
                                    type="text"
                                    value={formData.kasaAdi}
                                    onChange={e => updateField("kasaAdi", e.target.value)}
                                    className="w-full bg-[#020617]/40 border border-white/10 hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-xl px-5 py-3 text-white text-sm font-bold transition-all outline-none"
                                    placeholder="Örn: Ana Merkez Kasası (TL)"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] flex items-center gap-3">
                                    <div className="p-1.5 bg-primary/10 rounded-lg border border-primary/20"><Briefcase className="w-3.5 h-3.5 text-primary" /></div>
                                    Sorumlu Yetkili Kişi
                                </label>
                                <input
                                    type="text"
                                    value={formData.yetkiliKisi}
                                    onChange={e => updateField("yetkiliKisi", e.target.value)}
                                    className="w-full bg-[#020617]/40 border border-white/10 hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-2xl px-6 py-4 text-white text-sm font-bold transition-all outline-none"
                                    placeholder="Ad Soyad giriniz..."
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] flex items-center gap-3">
                                    <div className="p-1.5 bg-primary/10 rounded-lg border border-primary/20"><Coins className="w-3.5 h-3.5 text-primary" /></div>
                                    Hesap Para Birimi
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.paraBirimi}
                                        onChange={e => updateField("paraBirimi", e.target.value)}
                                        className="w-full bg-[#020617] border border-white/10 hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-2xl px-6 py-4 text-white text-sm font-black transition-all outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="TRY">TRY - Türk Lirası</option>
                                        <option value="USD">USD - Amerikan Doları</option>
                                        <option value="EUR">EUR - Euro Para Birimi</option>
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-primary opacity-50 font-black text-[10px] italic">DEĞİŞTİR</div>
                                </div>
                            </div>
                        </div>

                        {/* Extra Details */}
                        <div className="pt-10 border-t border-white/5 space-y-10">
                            <div className="flex items-center gap-5 relative">
                                <div className="w-1.5 h-10 bg-primary/20 rounded-full" />
                                <div>
                                    <h2 className="text-xl font-black text-white tracking-widest uppercase">Muhasebe & Organizasyon</h2>
                                    <p className="text-[10px] text-secondary font-bold uppercase tracking-widest opacity-40 mt-1">Genişletilmiş raporlama ve entegrasyon ayarları</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 relative">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Birincil Muhasebe Kodu</label>
                                    <input
                                        type="text"
                                        value={formData.muhKodu1}
                                        onChange={e => updateField("muhKodu1", e.target.value)}
                                        className="w-full bg-[#020617]/40 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm font-mono tracking-widest outline-none focus:border-primary/50 transition-all placeholder:text-secondary/10"
                                        placeholder="100.01.001"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">İkincil Muhasebe Kodu</label>
                                    <input
                                        type="text"
                                        value={formData.muhKodu2}
                                        onChange={e => updateField("muhKodu2", e.target.value)}
                                        className="w-full bg-[#020617]/40 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm font-mono tracking-widest outline-none focus:border-primary/50 transition-all placeholder:text-secondary/10"
                                        placeholder="100.01.002"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] flex items-center gap-3">
                                        <Building2 className="w-3.5 h-3.5 text-primary opacity-40" />
                                        İşyeri / Şube Kodu
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.isyeriKodu}
                                        onChange={e => updateField("isyeriKodu", e.target.value)}
                                        className="w-full bg-[#020617]/40 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm font-bold outline-none focus:border-primary/50 transition-all"
                                        placeholder="Merkez"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Özel Raporlama Kodu</label>
                                    <input
                                        type="text"
                                        value={formData.ozelKod}
                                        onChange={e => updateField("ozelKod", e.target.value)}
                                        className="w-full bg-[#020617]/40 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm font-bold outline-none focus:border-primary/50 transition-all"
                                        placeholder="ÖZEL-01"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Sidebar Actions */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-4 flex flex-col gap-6"
                >
                    <div className="glass-card p-6 md:p-8 border-white/5 space-y-5 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-12 translate-x-12 blur-2xl" />

                        <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em] mb-2 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            İşlem Paneli
                        </h4>

                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className={`w-full flex items-center justify-between p-4 ${editingId ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-primary hover:bg-primary/90'} text-white rounded-xl font-bold text-[11px] tracking-widest transition-all group active:scale-95 shadow-lg ${editingId ? 'shadow-emerald-500/20' : 'shadow-primary/20'}`}
                        >
                            <span className="flex items-center gap-4">
                                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                                {editingId ? 'DEĞİŞİKLİKLERİ KAYDET' : 'YENİ KASA OLUŞTUR'}
                            </span>
                            <ChevronRight className="w-4 h-4 opacity-40 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button
                            onClick={handleClear}
                            className="w-full flex items-center justify-between p-4 bg-white/[0.03] hover:bg-white/[0.08] text-secondary hover:text-white rounded-xl font-bold text-[11px] tracking-widest transition-all border border-white/5 active:scale-95"
                        >
                            <span className="flex items-center gap-4">
                                <X className="w-5 h-5" /> FORMU TEMİZLE
                            </span>
                            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                        </button>

                        <AnimatePresence>
                            {editingId && (
                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    onClick={handleDelete}
                                    className="w-full flex items-center justify-between p-5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-2xl font-black text-xs tracking-[0.2em] transition-all border border-rose-500/20 active:scale-95 group"
                                >
                                    <span className="flex items-center gap-4">
                                        <Trash2 className="w-6 h-6 group-hover:rotate-12 transition-transform" /> MEVCUT KAYDI SİL
                                    </span>
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="glass-card p-6 md:p-8 border-white/5 bg-gradient-to-br from-indigo-500/5 to-transparent shadow-xl relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                            <Activity className="w-32 h-32" />
                        </div>
                        <div className="flex items-center gap-4 mb-5 relative">
                            <div className="p-2 bg-indigo-400/10 rounded-xl border border-indigo-400/20"><Activity className="w-5 h-5 text-indigo-400" /></div>
                            <h4 className="text-[11px] font-black text-white uppercase tracking-widest italic">Sistem Rehberi</h4>
                        </div>
                        <p className="text-xs text-secondary leading-relaxed font-medium opacity-70 relative">
                            Kasa tanımları, işletmenizin nakit akışını takip etmek için temel birimdir.
                            Her kasa için benzersiz bir kod ve sorumlu yetkili atayarak operasyonel denetimi güçlendirebilir,
                            muhasebede farklı hesap kodlarına otomatik entegrasyon sağlayabilirsiniz.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
