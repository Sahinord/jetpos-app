"use client";

import { useState, useCallback, useEffect } from "react";
import {
    Save, X, Trash2, Plus,
    Calendar, Clock, FileText,
    Hash, User, Briefcase,
    ChevronRight, Sparkles,
    ArrowUpRight, ArrowDownLeft,
    Banknote, Search, ArrowLeftRight,
    Settings, List, Info, Tag, Shield,
    MoreHorizontal, Wallet, Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

interface KasaFisProps {
    type: "Tahsilat" | "Tediye" | "Virman" | "Devir";
    showToast?: (message: string, type: "success" | "error" | "info" | "warning") => void;
}

export default function KasaFis({ type, showToast }: KasaFisProps) {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"items" | "other">("items");
    const [kasalar, setKasalar] = useState<any[]>([]);

    const [header, setHeader] = useState({
        fisNo: "",
        fisTarihi: new Date().toISOString().split("T")[0],
        fisSaati: new Date().toLocaleTimeString('tr-TR', { hour12: false }).slice(0, 5),
        isyeriKodu: "Merkez",
        belgeNo: "",
        aciklama: "",
        paraBirimi: "TRY",
        muhAciklama: ""
    });

    const [rows, setRows] = useState<any[]>([
        { id: Date.now(), kasa_id: "", unvan: "", aciklama: "", tutar: 0, hareket_tipi: type === "Tediye" ? "Cikis" : "Giris" }
    ]);

    useEffect(() => {
        const loadKasalar = async () => {
            if (!currentTenant) return;
            const { data } = await supabase
                .from('kasa_tanimlari')
                .select('id, kasa_kodu, kasa_adi')
                .eq('tenant_id', currentTenant.id);
            if (data) setKasalar(data);
        };
        loadKasalar();
    }, [currentTenant]);

    const addRow = () => {
        setRows([...rows, {
            id: Date.now(),
            kasa_id: "",
            unvan: "",
            aciklama: "",
            tutar: 0,
            hareket_tipi: type === "Tediye" ? "Cikis" : "Giris"
        }]);
    };

    const removeRow = (id: number) => {
        if (rows.length > 1) {
            setRows(rows.filter(r => r.id !== id));
        }
    };

    const updateRow = (id: number, field: string, value: any) => {
        setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const totalAmount = rows.reduce((sum, r) => sum + (parseFloat(r.tutar) || 0), 0);

    const handleSave = async () => {
        if (!currentTenant) return;
        if (!header.fisNo) {
            showToast?.("Fiş No zorunludur", "warning");
            return;
        }

        setLoading(true);
        try {
            // 1. Fiş Başlığını Kaydet
            const fisData = {
                tenant_id: currentTenant.id,
                fis_no: header.fisNo,
                fis_tipi: type,
                fis_tarihi: header.fisTarihi,
                fis_saati: header.fisSaati,
                isyeri_kodu: header.isyeriKodu,
                belge_no: header.belgeNo,
                para_birimi: header.paraBirimi,
                toplam_tutar: totalAmount,
                aciklama: header.aciklama
            };

            const { data: fisRes, error: fisErr } = await supabase
                .from('kasa_fisleri')
                .insert([fisData])
                .select()
                .single();

            if (fisErr) throw fisErr;

            // 2. Fiş Satırlarını Kaydet
            const rowData = rows.map(r => ({
                tenant_id: currentTenant.id,
                fis_id: fisRes.id,
                kasa_id: r.kasa_id,
                unvan: r.unvan,
                aciklama: r.aciklama,
                tutar: r.tutar,
                borc_tutari: (r.hareket_tipi === "Giris" || type === "Tahsilat" || type === "Devir") ? r.tutar : 0,
                alacak_tutari: (r.hareket_tipi === "Cikis" || type === "Tediye") ? r.tutar : 0,
            }));

            const { error: rowErr } = await supabase.from('kasa_fis_satirlari').insert(rowData);
            if (rowErr) throw rowErr;

            showToast?.("Kasa fişi başarıyla kaydedildi", "success");
            handleClear();
        } catch (err: any) {
            showToast?.(err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setHeader({
            fisNo: "",
            fisTarihi: new Date().toISOString().split("T")[0],
            fisSaati: new Date().toLocaleTimeString('tr-TR', { hour12: false }).slice(0, 5),
            isyeriKodu: "Merkez",
            belgeNo: "",
            aciklama: "",
            paraBirimi: "TRY",
            muhAciklama: ""
        });
        setRows([{ id: Date.now(), kasa_id: "", unvan: "", aciklama: "", tutar: 0, hareket_tipi: type === "Tediye" ? "Cikis" : "Giris" }]);
    };

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-48 px-4 md:px-8">
            {/* Header Dashboard / Action Bar */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-[#020617]/40 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 via-transparent to-transparent pointer-events-none" />

                <div className="flex flex-wrap items-center gap-4 relative z-10">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-8 py-3.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-[11px] tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                        SİSTEME KAYDET
                    </button>
                    <button
                        onClick={handleClear}
                        className="px-8 py-3.5 bg-white/5 hover:bg-white/10 text-secondary hover:text-white border border-white/10 rounded-xl font-bold text-[11px] tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95"
                    >
                        <X className="w-4 h-4" /> VAZGEÇ
                    </button>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-stretch md:items-center gap-6">
                    <div className="flex flex-col items-end">
                        <p className="text-[10px] font-bold text-secondary tracking-widest uppercase opacity-40 mb-1">Hesaplanan Toplam</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xs font-bold text-primary/60 italic">TRY</span>
                            <span className="text-3xl font-black text-white tracking-tighter">
                                {totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                    <div className="h-12 w-[1px] bg-white/5 hidden md:block" />
                    <div className={`px-6 py-4 rounded-2xl border flex items-center gap-3 font-black text-[10px] tracking-widest ${type === 'Tahsilat' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                        type === 'Tediye' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                            'bg-amber-500/10 border-amber-500/20 text-amber-500'
                        }`}>
                        {type === 'Tahsilat' ? <ArrowUpRight className="w-4 h-4" /> :
                            type === 'Tediye' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowLeftRight className="w-4 h-4" />}
                        {type.toUpperCase()} FİŞİ
                    </div>
                </div>
            </motion.div>

            {/* Header Form Section */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-8 md:p-10 border-white/5 relative overflow-hidden group shadow-2xl"
            >
                <div className="absolute -right-24 -top-24 p-24 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity pointer-events-none">
                    <Wallet className="w-[30rem] h-[30rem] -rotate-12" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
                            <Hash className="w-3.5 h-3.5 text-primary/60" /> Fiş Numarası
                        </label>
                        <input
                            type="text"
                            value={header.fisNo}
                            onChange={e => setHeader({ ...header, fisNo: e.target.value })}
                            className="w-full bg-[#020617]/60 border border-white/10 rounded-xl px-5 py-3 text-white text-sm font-bold outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all uppercase tracking-wider"
                            placeholder="FİŞ NO..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-primary/60" /> İşlem Tarihi
                        </label>
                        <input
                            type="date"
                            value={header.fisTarihi}
                            onChange={e => setHeader({ ...header, fisTarihi: e.target.value })}
                            className="w-full bg-[#020617]/60 border border-white/10 rounded-xl px-5 py-3 text-white text-sm font-bold outline-none focus:border-primary/50 transition-all font-bold"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-primary/60" /> İşlem Saati
                        </label>
                        <input
                            type="time"
                            value={header.fisSaati}
                            onChange={e => setHeader({ ...header, fisSaati: e.target.value })}
                            className="w-full bg-[#020617]/60 border border-white/10 rounded-xl px-5 py-3 text-white text-sm font-bold outline-none focus:border-primary/50 transition-all font-bold"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
                            <Banknote className="w-3.5 h-3.5 text-primary/60" /> Para Birimi
                        </label>
                        <select
                            value={header.paraBirimi}
                            onChange={e => setHeader({ ...header, paraBirimi: e.target.value })}
                            className="w-full bg-[#020617] border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm font-bold outline-none focus:border-primary/50 transition-all cursor-pointer appearance-none uppercase tracking-wider text-center"
                        >
                            <option value="TRY">TRY - TÜRK LİRASI</option>
                            <option value="USD">USD - DOLAR</option>
                            <option value="EUR">EUR - EURO</option>
                        </select>
                    </div>
                </div>
            </motion.div>

            {/* Content Tabs */}
            <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-4 bg-[#020617]/40 backdrop-blur-md p-2 rounded-3xl border border-white/5 w-fit">
                    <TabButton
                        active={activeTab === "items"}
                        onClick={() => setActiveTab("items")}
                        icon={List}
                        label="İŞLEM SATIRLARI"
                    />
                    <TabButton
                        active={activeTab === "other"}
                        onClick={() => setActiveTab("other")}
                        icon={Settings}
                        label="EK TANIMLAR"
                    />
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === "items" ? (
                        <motion.div
                            key="items"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="glass-card border-white/5 overflow-hidden shadow-2xl relative"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0" />

                            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                <table className="w-full text-left border-collapse min-w-[1200px]">
                                    <thead>
                                        <tr className="bg-white/[0.02] border-b border-white/5">
                                            <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest w-16 text-center">#</th>
                                            {type === 'Virman' && <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest w-32 text-center">Yön</th>}
                                            <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest w-72">Kasa Hesabı</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest w-80">Cari Ünvan / İlgili</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest">Satır Açıklaması</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest w-48 text-right">Tutar</th>
                                            <th className="px-4 py-4 w-20"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {rows.map((row, index) => (
                                            <tr key={row.id} className="hover:bg-white/[0.01] transition-colors group">
                                                <td className="px-8 py-5">
                                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-secondary/30 mx-auto group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                                        {index + 1}
                                                    </div>
                                                </td>
                                                {type === 'Virman' && (
                                                    <td className="px-8 py-5">
                                                        <select
                                                            value={row.hareket_tipi}
                                                            onChange={e => updateRow(row.id, "hareket_tipi", e.target.value)}
                                                            className={`w-full bg-[#020617] border rounded-2xl px-2 py-3 text-[9px] font-black outline-none appearance-none text-center cursor-pointer transition-all ${row.hareket_tipi === 'Giris' ? 'border-emerald-500/30 text-emerald-400' : 'border-rose-500/30 text-rose-400'
                                                                }`}
                                                        >
                                                            <option value="Giris">GİRİŞ (+)</option>
                                                            <option value="Cikis">ÇIKIŞ (-)</option>
                                                        </select>
                                                    </td>
                                                )}
                                                <td className="px-8 py-5">
                                                    <div className="relative">
                                                        <select
                                                            value={row.kasa_id}
                                                            onChange={e => updateRow(row.id, "kasa_id", e.target.value)}
                                                            className="w-full bg-[#020617]/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-xs font-black outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all cursor-pointer appearance-none uppercase tracking-widest"
                                                        >
                                                            <option value="">KASA SEÇİN...</option>
                                                            {kasalar.map(k => (
                                                                <option key={k.id} value={k.id}>{k.kasa_adi} [{k.kasa_kodu}]</option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                                                            <MoreHorizontal className="w-4 h-4 rotate-90" />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="relative group/field">
                                                        <input
                                                            type="text"
                                                            value={row.unvan}
                                                            onChange={e => updateRow(row.id, "unvan", e.target.value)}
                                                            className="w-full bg-[#020617]/40 border border-white/10 rounded-2xl px-12 py-3.5 text-white text-xs font-bold outline-none focus:border-primary/50 transition-all uppercase tracking-wide placeholder:text-secondary/10"
                                                            placeholder="ÜNVAN VEYA KİŞİ..."
                                                        />
                                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/20 group-focus-within/field:text-primary transition-colors" />
                                                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary/10" />
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <input
                                                        type="text"
                                                        value={row.aciklama}
                                                        onChange={e => updateRow(row.id, "aciklama", e.target.value)}
                                                        className="w-full bg-[#020617]/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-xs font-medium outline-none focus:border-primary/40 transition-all placeholder:text-secondary/10"
                                                        placeholder="SATIR DETAYI..."
                                                    />
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="relative group/input">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/20 text-[10px] font-black group-focus-within/input:text-primary/60 transition-colors">₺</span>
                                                        <input
                                                            type="number"
                                                            value={row.tutar}
                                                            onChange={e => updateRow(row.id, "tutar", e.target.value)}
                                                            className="w-full bg-[#020617]/40 border border-white/10 rounded-2xl pl-10 pr-5 py-3.5 text-white text-base outline-none text-right font-black focus:border-primary/40 transition-all tracking-tighter"
                                                            placeholder="0,00"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <button
                                                        onClick={() => removeRow(row.id)}
                                                        className="p-3 text-secondary hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center mx-auto"
                                                        title="Satırı Sil"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-6 bg-white/[0.01] border-t border-white/5 flex justify-center">
                                <button
                                    onClick={addRow}
                                    className="px-12 py-3.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-[11px] font-bold tracking-widest transition-all flex items-center gap-4 active:scale-95 shadow-2xl shadow-primary/5 group"
                                >
                                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                                    YENİ SATIR EKLE
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="other"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="glass-card p-12 md:p-14 border-white/5 grid grid-cols-1 lg:grid-cols-2 gap-14"
                        >
                            <div className="space-y-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <Info className="w-4 h-4 text-primary" />
                                        </div>
                                        FİŞ GENEL AÇIKLAMASI
                                    </label>
                                    <textarea
                                        value={header.aciklama}
                                        onChange={e => setHeader({ ...header, aciklama: e.target.value })}
                                        rows={6}
                                        className="w-full bg-[#020617]/40 border border-white/10 rounded-[2.5rem] px-8 py-7 text-white text-sm font-medium outline-none focus:border-primary/50 resize-none leading-relaxed transition-all placeholder:text-secondary/10"
                                        placeholder="İşlem ile ilgili genel notlar ve detaylar..."
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-secondary uppercase tracking-[0.3em]">BELGE NO / REF</label>
                                        <input
                                            type="text"
                                            value={header.belgeNo}
                                            onChange={e => setHeader({ ...header, belgeNo: e.target.value })}
                                            className="w-full bg-[#020617]/40 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm font-black outline-none focus:border-primary/50 transition-all uppercase tracking-widest"
                                            placeholder="REFERANS..."
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-secondary uppercase tracking-[0.3em]">İŞYERİ KODU</label>
                                        <input
                                            type="text"
                                            value={header.isyeriKodu}
                                            onChange={e => setHeader({ ...header, isyeriKodu: e.target.value })}
                                            className="w-full bg-[#020617]/40 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm font-black outline-none focus:border-primary/50 transition-all uppercase tracking-widest"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-10">
                                <div className="glass-card p-10 border-white/5 bg-primary/5 space-y-8 relative overflow-hidden group shadow-inner">
                                    <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:scale-110 transition-all duration-700">
                                        <Shield className="w-48 h-48" />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                                            <Tag className="w-6 h-6 text-primary" />
                                        </div>
                                        <span className="text-xs font-black text-white uppercase tracking-[0.3em]">SİSTEM DENETİM BİLGİSİ</span>
                                    </div>
                                    <div className="space-y-4 font-medium">
                                        <p className="text-sm text-secondary/70 leading-relaxed italic">
                                            Bu işlem kaydı maliyet yönetimi ve nakit akış tablolarına otomatik olarak yansıtılacaktır.
                                            Oluşturulan fişlerin doğruluğu denetim loglarına işlenmektedir.
                                        </p>
                                        <div className="pt-4 flex flex-wrap gap-3">
                                            <Badge icon={Shield} text="GÜVENLİ KAYIT" />
                                            <Badge icon={Clock} text="ANLIK İŞLEME" />
                                            <Badge icon={Sparkles} text="DENETİM HAZIR" />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-secondary uppercase tracking-[0.3em]">VERGİ / MUHASEBE NOTU</label>
                                    <textarea
                                        value={header.muhAciklama}
                                        onChange={e => setHeader({ ...header, muhAciklama: e.target.value })}
                                        rows={4}
                                        className="w-full bg-[#020617]/40 border border-white/10 rounded-[2rem] px-8 py-6 text-white text-sm font-medium outline-none focus:border-primary/50 resize-none transition-all placeholder:text-secondary/10"
                                        placeholder="Muhasebe departmanı için özel notlar..."
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Sticky/Fixed Summary for Desktop */}
            <div className="hidden xl:flex fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] gap-10 bg-[#020617]/85 backdrop-blur-3xl px-10 py-5 rounded-3xl border border-white/10 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-bottom-12 duration-700">
                <div className="flex flex-col items-start gap-1 min-w-[240px]">
                    <p className="text-[10px] font-bold text-secondary/40 uppercase tracking-widest mb-1 italic">TOPLAM FİŞ TUTARI</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-sm font-bold text-primary/30">TRY</span>
                        <p className="text-3xl font-black text-white tracking-tighter">
                            {totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                <div className="w-[1px] h-12 bg-white/10" />

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-10 py-3.5 bg-white text-black hover:bg-white/90 rounded-2xl font-bold text-[11px] tracking-widest transition-all hover:scale-[1.05] active:scale-95 shadow-2xl disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                        SİSTEME KAYDET
                    </button>
                    <button
                        onClick={handleClear}
                        className="p-3.5 bg-white/5 hover:bg-rose-500/10 text-secondary hover:text-rose-500 border border-white/5 rounded-full transition-all active:scale-90"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Mobile Footer Sticky View */}
            <div className="xl:hidden fixed bottom-0 left-0 w-full p-4 z-[100] pointer-events-none">
                <div className="glass-card p-6 border-white/10 bg-[#020617]/95 backdrop-blur-3xl space-y-4 shadow-[0_-20px_60px_rgba(0,0,0,0.6)] pointer-events-auto rounded-[2rem]">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-secondary/50 uppercase tracking-widest">TOPLAM</span>
                        <span className="text-2xl font-black text-white tracking-tighter">₺{totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-xs tracking-widest shadow-2xl shadow-primary/30 active:scale-95 disabled:opacity-50"
                    >
                        SİSTEME KAYDET
                    </button>
                </div>
            </div>
        </div>
    );
}

// Helper Components
function TabButton({ active, onClick, icon: Icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`px-6 py-2.5 rounded-xl flex items-center gap-3 transition-all font-bold text-[11px] tracking-wider uppercase border ${active
                ? 'bg-primary text-white border-primary shadow-2xl shadow-primary/25'
                : 'bg-transparent text-secondary hover:text-white border-transparent hover:bg-white/5'
                }`}
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );
}

function Badge({ icon: Icon, text }: { icon: any, text: string }) {
    return (
        <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 flex items-center gap-2">
            <Icon className="w-3 h-3 text-primary" />
            <span className="text-[9px] font-black text-secondary uppercase tracking-[0.1em]">{text}</span>
        </div>
    );
}
