"use client";

import { useState, useEffect } from "react";
import {
    Save, X, Trash2, Plus,
    Calendar, Clock, FileText,
    Hash, User, Briefcase,
    ChevronRight, Sparkles,
    Landmark, Search, ArrowLeftRight,
    ArrowUpRight, ArrowDownLeft, Wallet,
    CreditCard, Tag, Info, Shield, List, Settings, Users,
    MoreHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

interface BankaFisProps {
    type: "Para Çekme" | "Para Yatırma" | "Gelen Havale" | "Yapılan Havale" | "Virman" | "Devir";
    showToast?: (message: string, type: "success" | "error" | "info" | "warning") => void;
}

export default function BankaFis({ type, showToast }: BankaFisProps) {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"items" | "other">("items");

    // Data for selects
    const [banks, setBanks] = useState<any[]>([]);
    const [kasalar, setKasalar] = useState<any[]>([]);
    const [cariler, setCariler] = useState<any[]>([]);

    const [header, setHeader] = useState({
        fisNo: "",
        fisTarihi: new Date().toISOString().split("T")[0],
        fisSaati: new Date().toLocaleTimeString('tr-TR', { hour12: false }).slice(0, 5),
        belgeNo: "",
        belgeTarihi: new Date().toISOString().split("T")[0],
        belgeTipi: "",
        paraBirimi: "TRY",
        aciklama: "",
        muhAciklama: "",
        isyeriKodu: "Merkez"
    });

    const [rows, setRows] = useState<any[]>([
        {
            id: Date.now(),
            banka_id: "",
            karsi_hesap_tipi: type === "Para Çekme" || type === "Para Yatırma" ? "Kasa" : (type === "Virman" ? "Banka" : "Cari"),
            karsi_hesap_id: "",
            unvan: "",
            aciklama: "",
            belge_no: "",
            borc: 0,
            alacak: 0,
            hizmet_kodu: "",
            masraf_kodu: "",
            personel_kodu: ""
        }
    ]);

    useEffect(() => {
        loadData();
    }, [currentTenant]);

    const loadData = async () => {
        if (!currentTenant) return;

        // Fetch Banks
        const { data: bankData } = await supabase
            .from('bankalar')
            .select('id, banka_kodu, tanimi, banka_adi')
            .eq('tenant_id', currentTenant.id);
        if (bankData) setBanks(bankData);

        // Fetch Kasalar
        const { data: kasaData } = await supabase
            .from('kasa_tanimlari')
            .select('id, kasa_kodu, kasa_adi')
            .eq('tenant_id', currentTenant.id);
        if (kasaData) setKasalar(kasaData);

        // Fetch Cariler
        const { data: cariData } = await supabase
            .from('cari_hesaplar')
            .select('id, cari_kodu, unvani')
            .eq('tenant_id', currentTenant.id);
        if (cariData) setCariler(cariData);
    };

    const addRow = () => {
        setRows([...rows, {
            id: Date.now(),
            banka_id: "",
            karsi_hesap_tipi: rows[rows.length - 1]?.karsi_hesap_tipi || "Cari",
            karsi_hesap_id: "",
            unvan: "",
            aciklama: "",
            belge_no: "",
            borc: 0,
            alacak: 0,
            hizmet_kodu: "",
            masraf_kodu: "",
            personel_kodu: ""
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

    const totalBorc = rows.reduce((sum, r) => sum + (parseFloat(r.borc) || 0), 0);
    const totalAlacak = rows.reduce((sum, r) => sum + (parseFloat(r.alacak) || 0), 0);

    const handleSave = async () => {
        if (!currentTenant) return;
        if (!header.fisNo) {
            showToast?.("Fiş No zorunludur", "warning");
            return;
        }

        setLoading(true);
        try {
            // 1. Save Header
            const { data: fisRes, error: fisErr } = await supabase
                .from('banka_fisleri')
                .insert([{
                    tenant_id: currentTenant.id,
                    fis_no: header.fisNo,
                    fis_tarihi: header.fisTarihi,
                    fis_tipi: type,
                    belge_no: header.belgeNo,
                    belge_tarihi: header.belgeTarihi,
                    para_birimi: header.paraBirimi,
                    toplam_borc: totalBorc,
                    toplam_alacak: totalAlacak,
                    aciklama: header.aciklama,
                    muh_aciklama: header.muhAciklama
                }])
                .select()
                .single();

            if (fisErr) throw fisErr;

            // 2. Save Lines
            const rowData = rows.map(r => ({
                tenant_id: currentTenant.id,
                fis_id: fisRes.id,
                banka_id: r.banka_id || null,
                karsi_hesap_tipi: r.karsi_hesap_tipi,
                karsi_hesap_id: r.karsi_hesap_id || null,
                karsi_hesap_unvan: r.unvan,
                aciklama: r.aciklama,
                belge_no: r.belge_no,
                borc: r.borc,
                alacak: r.alacak,
                para_birimi: header.paraBirimi,
                hizmet_kodu: r.hizmet_kodu,
                masraf_kodu: r.masraf_kodu,
                personel_kodu: r.personel_kodu
            }));

            const { error: rowErr } = await supabase.from('banka_fis_satirlari').insert(rowData);
            if (rowErr) throw rowErr;

            showToast?.("Banka fişi başarıyla kaydedildi", "success");
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
            belgeNo: "",
            belgeTarihi: new Date().toISOString().split("T")[0],
            belgeTipi: "",
            paraBirimi: "TRY",
            aciklama: "",
            muhAciklama: "",
            isyeriKodu: "Merkez"
        });
        setRows([{ id: Date.now(), banka_id: "", karsi_hesap_tipi: (type === "Para Çekme" || type === "Para Yatırma" ? "Kasa" : (type === "Virman" ? "Banka" : "Cari")), karsi_hesap_id: "", unvan: "", aciklama: "", belge_no: "", borc: 0, alacak: 0, hizmet_kodu: "", masraf_kodu: "", personel_kodu: "" }]);
    };

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-48 px-4 md:px-8">
            {/* Action Bar */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-[#020617]/40 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

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
                        <X className="w-5 h-5" /> VAZGEÇ
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                    <SummaryCard label="Borç Toplamı" value={totalBorc} color="emerald" icon={ArrowDownLeft} />
                    <SummaryCard label="Alacak Toplamı" value={totalAlacak} color="rose" icon={ArrowUpRight} />
                </div>
            </motion.div>

            {/* Header Fields Section */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-8 md:p-10 border-white/5 relative overflow-hidden group shadow-2xl"
            >
                <div className="absolute -right-20 -top-20 p-20 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity pointer-events-none">
                    <Landmark className="w-96 h-96 -rotate-12" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 relative z-10">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
                            <Hash className="w-3.5 h-3.5 text-primary" /> Fiş Numarası
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={header.fisNo}
                                onChange={e => setHeader({ ...header, fisNo: e.target.value })}
                                className="w-full bg-[#020617]/60 border border-white/10 rounded-xl px-5 py-3 text-white text-sm font-bold outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all uppercase tracking-wider"
                                placeholder="FİŞ NO..."
                            />
                            {!header.fisNo && <Sparkles className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-30 animate-pulse" />}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-primary/60" /> Fiş Tarihi
                        </label>
                        <input
                            type="date"
                            value={header.fisTarihi}
                            onChange={e => setHeader({ ...header, fisTarihi: e.target.value })}
                            className="w-full bg-[#020617]/60 border border-white/10 rounded-xl px-5 py-3 text-white text-sm font-bold outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-primary/60" /> Belge No & Tipi
                        </label>
                        <div className="flex gap-2">
                            <select
                                value={header.belgeTipi}
                                onChange={e => setHeader({ ...header, belgeTipi: e.target.value })}
                                className="w-24 bg-[#020617] border border-white/10 rounded-xl px-2 py-3 text-xs font-bold text-white outline-none focus:border-primary/50 transition-all uppercase appearance-none text-center"
                            >
                                <option value="">TİP</option>
                                <option value="Dekont">DKNT</option>
                                <option value="Havale">HVLE</option>
                                <option value="EFT">EFT</option>
                            </select>
                            <input
                                type="text"
                                value={header.belgeNo}
                                onChange={e => setHeader({ ...header, belgeNo: e.target.value })}
                                className="flex-1 bg-[#020617]/60 border border-white/10 rounded-xl px-5 py-3 text-white text-sm font-bold outline-none focus:border-primary/50 transition-all uppercase"
                                placeholder="NO..."
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-primary/60" /> Belge Tarihi
                        </label>
                        <input
                            type="date"
                            value={header.belgeTarihi}
                            onChange={e => setHeader({ ...header, belgeTarihi: e.target.value })}
                            className="w-full bg-[#020617]/60 border border-white/10 rounded-xl px-5 py-3 text-white text-sm font-bold outline-none focus:border-primary/50 transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
                            <CreditCard className="w-3.5 h-3.5 text-primary/60" /> Para Birimi
                        </label>
                        <select
                            value={header.paraBirimi}
                            onChange={e => setHeader({ ...header, paraBirimi: e.target.value })}
                            className="w-full bg-[#020617] border border-white/10 rounded-xl px-5 py-3 text-white text-sm font-bold outline-none focus:border-primary/50 transition-all cursor-pointer appearance-none uppercase tracking-wider text-center"
                        >
                            <option value="TRY">TRY - TÜRK LİRASI</option>
                            <option value="USD">USD - DOLAR</option>
                            <option value="EUR">EUR - EURO</option>
                        </select>
                    </div>
                </div>
            </motion.div>

            {/* Tab Navigation */}
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
                        label="EK BİLGİLER"
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
                                <table className="w-full text-left border-collapse min-w-[1400px]">
                                    <thead>
                                        <tr className="bg-white/[0.02] border-b border-white/5">
                                            <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest w-16 text-center">#</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest w-72">Banka Hesabı</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest w-40 text-center">Hedef Türü</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest w-80">Karşı Hesap Bilgisi</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest">Satır Açıklaması</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest w-44 text-right">Borç</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest w-44 text-right">Alacak</th>
                                            <th className="px-4 py-4 w-20"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {rows.map((row, index) => (
                                            <tr key={row.id} className="hover:bg-white/[0.01] transition-colors group">
                                                <td className="px-8 py-4">
                                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-secondary/40 mx-auto group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                                        {index + 1}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <div className="relative">
                                                        <select
                                                            value={row.banka_id}
                                                            onChange={e => updateRow(row.id, "banka_id", e.target.value)}
                                                            className="w-full bg-[#020617]/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-xs font-black outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all cursor-pointer appearance-none uppercase tracking-widest"
                                                        >
                                                            <option value="">HESAP SEÇİN...</option>
                                                            {banks.map(b => (
                                                                <option key={b.id} value={b.id}>{b.tanimi}</option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                                                            <MoreHorizontal className="w-4 h-4 rotate-90" />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <select
                                                        value={row.karsi_hesap_tipi}
                                                        onChange={e => updateRow(row.id, "karsi_hesap_tipi", e.target.value)}
                                                        className="w-full bg-[#020617] border border-white/10 rounded-2xl px-4 py-3.5 text-white text-[10px] font-black outline-none focus:border-primary/40 transition-all cursor-pointer text-center uppercase tracking-[0.2em]"
                                                    >
                                                        <option value="Cari">CARİ</option>
                                                        <option value="Kasa">KASA</option>
                                                        <option value="Banka">BANKA</option>
                                                        <option value="Masraf">MASRAF</option>
                                                    </select>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <AccountSelector
                                                        type={row.karsi_hesap_tipi}
                                                        value={row.karsi_hesap_id}
                                                        onChange={(val: string, unvan: string) => {
                                                            updateRow(row.id, "karsi_hesap_id", val);
                                                            updateRow(row.id, "unvan", unvan);
                                                        }}
                                                        data={{ cariler, kasalar, banks }}
                                                    />
                                                </td>
                                                <td className="px-8 py-4">
                                                    <input
                                                        type="text"
                                                        value={row.aciklama}
                                                        onChange={e => updateRow(row.id, "aciklama", e.target.value)}
                                                        className="w-full bg-[#020617]/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-xs font-medium outline-none focus:border-primary/40 transition-all placeholder:text-secondary/20"
                                                        placeholder="İŞLEM DETAYI..."
                                                    />
                                                </td>
                                                <td className="px-8 py-4">
                                                    <div className="relative group/input">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/20 text-[10px] font-black group-focus-within/input:text-emerald-500/60 transition-colors">₺</span>
                                                        <input
                                                            type="number"
                                                            value={row.borc}
                                                            onChange={e => updateRow(row.id, "borc", e.target.value)}
                                                            className="w-full bg-[#020617]/40 border border-white/10 rounded-2xl pl-10 pr-5 py-3.5 text-white text-sm outline-none text-right font-black text-emerald-400 focus:border-emerald-500/30 transition-all"
                                                            placeholder="0,00"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <div className="relative group/input">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500/20 text-[10px] font-black group-focus-within/input:text-rose-500/60 transition-colors">₺</span>
                                                        <input
                                                            type="number"
                                                            value={row.alacak}
                                                            onChange={e => updateRow(row.id, "alacak", e.target.value)}
                                                            className="w-full bg-[#020617]/40 border border-white/10 rounded-2xl pl-10 pr-5 py-3.5 text-white text-sm outline-none text-right font-black text-rose-400 focus:border-rose-500/30 transition-all"
                                                            placeholder="0,00"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
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
                            className="glass-card p-10 md:p-14 border-white/5 grid grid-cols-1 lg:grid-cols-2 gap-12"
                        >
                            <div className="space-y-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <Info className="w-4 h-4 text-primary" />
                                        </div>
                                        MUHASEBE ÖZEL AÇIKLAMASI
                                    </label>
                                    <textarea
                                        value={header.muhAciklama}
                                        onChange={e => setHeader({ ...header, muhAciklama: e.target.value })}
                                        rows={5}
                                        className="w-full bg-[#020617]/40 border border-white/10 rounded-[2rem] px-8 py-6 text-white text-sm font-medium outline-none focus:border-primary/50 resize-none leading-relaxed transition-all placeholder:text-secondary/10"
                                        placeholder="Muhasebe kayıtları için özel entegrasyon notları..."
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <FileText className="w-4 h-4 text-primary" />
                                        </div>
                                        FİŞ GENEL AÇIKLAMASI
                                    </label>
                                    <textarea
                                        value={header.aciklama}
                                        onChange={e => setHeader({ ...header, aciklama: e.target.value })}
                                        rows={5}
                                        className="w-full bg-[#020617]/40 border border-white/10 rounded-[2rem] px-8 py-6 text-white text-sm font-medium outline-none focus:border-primary/50 resize-none leading-relaxed transition-all placeholder:text-secondary/10"
                                        placeholder="İşlem ile ilgili detaylı bilgi ve notlar..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-10">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-secondary uppercase tracking-[0.3em]">İŞYERİ / ŞUBE KODU</label>
                                        <input
                                            type="text"
                                            value={header.isyeriKodu}
                                            onChange={e => setHeader({ ...header, isyeriKodu: e.target.value })}
                                            className="w-full bg-[#020617]/40 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm font-black outline-none focus:border-primary/50 transition-all uppercase tracking-widest"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-secondary uppercase tracking-[0.3em]">FİRMA TANIM NO</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value="01 (JETPOS)"
                                                disabled
                                                className="w-full bg-[#020617] border border-white/10 rounded-2xl px-6 py-4 text-secondary/30 text-sm font-black outline-none opacity-50 tracking-widest"
                                            />
                                            <Shield className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 opacity-10" />
                                        </div>
                                    </div>
                                </div>
                                <div className="glass-card p-10 border-white/5 bg-primary/5 space-y-6 relative overflow-hidden group shadow-inner">
                                    <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700">
                                        <Tag className="w-40 h-40" />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                                            <Tag className="w-5 h-5 text-primary" />
                                        </div>
                                        <span className="text-xs font-black text-white uppercase tracking-[0.3em]">GELİŞMİŞ İŞLEM ETİKETLERİ</span>
                                    </div>
                                    <p className="text-sm text-secondary/60 italic leading-relaxed font-medium">
                                        Bu fiş içerisinde yapılan tüm hareketler otomatik olarak kurumsal raporlama sisteminize dahil edilecektir.
                                        Özel kodlar ve masraf merkezlerini satır bazında tanımlayabilirsiniz.
                                    </p>
                                    <div className="flex items-center gap-2 pt-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">ENTEGRASYON HAZIR</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Desktop Floating Summary Section */}
            <div className="hidden xl:flex fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] gap-10 bg-[#020617]/80 backdrop-blur-3xl px-10 py-5 rounded-3xl border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-bottom-10 duration-700">
                <div className="flex flex-col items-start gap-1 min-w-[220px] border-r border-white/10 pr-10">
                    <div className="flex items-center gap-2 text-emerald-500">
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">HESAP BORÇ TOPLAMI</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-sm font-bold text-white/20">TRY</span>
                        <p className="text-3xl font-black text-white tracking-tighter">
                            {totalBorc.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-start gap-1 min-w-[220px]">
                    <div className="flex items-center gap-2 text-rose-500">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">HESAP ALACAK TOPLAMI</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-sm font-bold text-white/20">TRY</span>
                        <p className="text-3xl font-black text-white tracking-tighter">
                            {totalAlacak.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                <div className="ml-2 flex items-center">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-8 py-3.5 bg-white text-black hover:bg-white/90 rounded-2xl font-bold text-[11px] tracking-widest transition-all hover:scale-[1.05] active:scale-95 shadow-2xl disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                        SİSTEME KAYDET
                    </button>
                </div>
            </div>

            {/* Mobile/Small Screen Footer Totals */}
            <div className="xl:hidden fixed bottom-0 left-0 w-full p-4 z-[100] pointer-events-none">
                <div className="glass-card p-5 border-white/10 bg-[#020617]/95 backdrop-blur-3xl space-y-4 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] pointer-events-auto rounded-[2rem]">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <div className="flex items-center gap-2">
                            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[10px] font-bold text-secondary/60 uppercase tracking-wider">BORÇ</span>
                        </div>
                        <span className="text-xl font-black text-emerald-400">₺{totalBorc.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center justify-between pb-1">
                        <div className="flex items-center gap-2">
                            <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
                            <span className="text-[10px] font-bold text-secondary/60 uppercase tracking-wider">ALACAK</span>
                        </div>
                        <span className="text-xl font-black text-rose-400">₺{totalAlacak.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-xs tracking-widest shadow-2xl shadow-primary/30 active:scale-95 disabled:opacity-50 px-2"
                    >
                        FİŞİ KAYDET
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

function SummaryCard({ label, value, color, icon: Icon }: any) {
    const colorClasses: any = {
        emerald: "border-emerald-500/10 text-emerald-400 bg-emerald-500/[0.03] shadow-emerald-500/5",
        rose: "border-rose-500/10 text-rose-400 bg-rose-500/[0.03] shadow-rose-500/5"
    };

    return (
        <div className={`glass-card px-8 py-4 flex items-center gap-5 ${colorClasses[color]} border min-w-[220px] shadow-2xl group/card transition-all hover:bg-opacity-10`}>
            <div className={`p-3 rounded-2xl bg-current opacity-20 group-hover/card:scale-110 transition-transform`}><Icon className="w-6 h-6" /></div>
            <div>
                <p className="text-[9px] font-black text-secondary/60 tracking-[0.2em] uppercase mb-1 leading-none">{label}</p>
                <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-black opacity-30 italic">₺</span>
                    <span className="text-2xl font-black text-current leading-none tracking-tighter">{value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                </div>
            </div>
        </div>
    );
}

function AccountSelector({ type, value, onChange, data }: any) {
    const list = type === "Cari" ? data.cariler : (type === "Kasa" ? data.kasalar : data.banks);
    const labelField = type === "Cari" ? "unvani" : (type === "Kasa" ? "kasa_adi" : "tanimi");

    return (
        <div className="relative group/sel">
            <select
                value={value}
                onChange={e => {
                    const item = list.find((i: any) => i.id === e.target.value);
                    onChange(e.target.value, item ? item[labelField] : "");
                }}
                className="w-full bg-[#020617]/40 border border-white/10 rounded-2xl px-6 py-3.5 text-white text-xs font-black outline-none focus:border-primary/40 group-hover/sel:border-white/20 transition-all appearance-none uppercase tracking-widest"
            >
                <option value="">{type} ARŞİVİ...</option>
                {list.map((item: any) => (
                    <option key={item.id} value={item.id} className="bg-[#020617]">
                        {item[labelField]?.toUpperCase()} {item.cari_kodu || item.kasa_kodu || item.banka_kodu ? `[${item.cari_kodu || item.kasa_kodu || item.banka_kodu}]` : ""}
                    </option>
                ))}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-secondary/20 group-hover/sel:text-primary/60 transition-colors">
                {type === "Cari" ? <Users className="w-4 h-4" /> : (type === "Kasa" ? <Wallet className="w-4 h-4" /> : <Landmark className="w-4 h-4" />)}
            </div>
        </div>
    );
}
