"use client";

import { useState, useEffect } from "react";
import {
    Save, X, Trash2, Landmark,
    Hash, Info, Phone, MapPin,
    CreditCard, Globe, Shield,
    Settings, Search, Plus,
    ArrowLeft, List, History
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

interface BankaTanitimProps {
    showToast?: (message: string, type: "success" | "error" | "info" | "warning") => void;
}

export default function BankaTanitim({ showToast }: BankaTanitimProps) {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(false);
    const [banks, setBanks] = useState<any[]>([]);
    const [view, setView] = useState<"list" | "form">("list");
    const [editingId, setEditingId] = useState<string | null>(null);

    const initialForm = {
        banka_kodu: "",
        tanimi: "",
        banka_adi: "",
        sube_adi: "",
        tcmb_kodu: "",
        iban_no: "",
        hesap_no: "",
        para_birimi: "TRY",
        telefon1: "",
        telefon2: "",
        fax_no: "",
        isyeri_kodu: "Merkez",
        son_cek_no: "",
        ozel_kodu: "",
        yetki_kodu: "",
        limit_tutari: 0,
        muh_kodu_mev: "",
        muh_kodu_cek: "",
        muh_kodu_takas: "",
        muh_kodu_tahsil: "",
        adres: "",
        kk_hes_gecis_gunu: 0,
        kk_komisyon_oran: 0,
        masraf_hesabi: "",
        havale_uygun: false,
        aktif: true
    };

    const [form, setForm] = useState(initialForm);

    useEffect(() => {
        fetchBanks();
    }, [currentTenant]);

    const fetchBanks = async () => {
        if (!currentTenant) return;
        const { data, error } = await supabase
            .from('bankalar')
            .select('*')
            .eq('tenant_id', currentTenant.id)
            .order('created_at', { ascending: false });

        if (error) {
            showToast?.("Bankalar yüklenirken hata oluştu", "error");
        } else {
            setBanks(data || []);
        }
    };

    const handleSave = async () => {
        if (!currentTenant) return;
        if (!form.tanimi) {
            showToast?.("Tanım alanı zorunludur", "warning");
            return;
        }

        setLoading(true);
        try {
            const dataToSave = { ...form, tenant_id: currentTenant.id };

            if (editingId) {
                const { error } = await supabase
                    .from('bankalar')
                    .update(dataToSave)
                    .eq('id', editingId);
                if (error) throw error;
                showToast?.("Banka bilgileri güncellendi", "success");
            } else {
                const { error } = await supabase
                    .from('bankalar')
                    .insert([dataToSave]);
                if (error) throw error;
                showToast?.("Yeni banka başarıyla tanımlandı", "success");
            }

            setForm(initialForm);
            setEditingId(null);
            setView("list");
            fetchBanks();
        } catch (err: any) {
            showToast?.(err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (bank: any) => {
        setForm(bank);
        setEditingId(bank.id);
        setView("form");
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bu banka tanımını silmek istediğinize emin misiniz?")) return;

        try {
            const { error } = await supabase
                .from('bankalar')
                .delete()
                .eq('id', id);
            if (error) throw error;
            showToast?.("Banka tanımı silindi", "success");
            fetchBanks();
        } catch (err: any) {
            showToast?.(err.message, "error");
        }
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-32 px-4 md:px-8">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6">
                <div className="flex items-center gap-3 bg-[#020617]/40 backdrop-blur-md p-1 rounded-xl border border-white/5 shadow-xl">
                    <button
                        onClick={() => setView("list")}
                        className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-[11px] font-bold tracking-wider transition-all flex items-center justify-center gap-2 ${view === 'list' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-secondary hover:text-white hover:bg-white/5'}`}
                    >
                        <List className="w-4 h-4" /> LİSTE
                    </button>
                    <button
                        onClick={() => {
                            setForm(initialForm);
                            setEditingId(null);
                            setView("form");
                        }}
                        className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-[11px] font-bold tracking-wider transition-all flex items-center justify-center gap-2 ${view === 'form' && !editingId ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-secondary hover:text-white hover:bg-white/5'}`}
                    >
                        <Plus className="w-4 h-4" /> YENİ TANIM
                    </button>
                </div>

                {view === "form" && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex-1 sm:flex-none px-8 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-[11px] tracking-wider flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                        >
                            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                            BİLGİLERİ KAYDET
                        </button>
                        <button
                            onClick={() => setView("list")}
                            className="p-2.5 bg-white/5 hover:bg-white/10 text-secondary hover:text-white border border-white/10 rounded-xl transition-all active:scale-95"
                            title="İptal Et"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>

            <AnimatePresence mode="popLayout">
                {view === "list" ? (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="glass-card border-white/5 overflow-hidden shadow-2xl"
                    >
                        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="bg-white/[0.02] border-b border-white/5">
                                        <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest w-40">Banka Kodu</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest">Banka Tanımı & Kurum</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest">Şube & IBAN</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest w-24">Döviz</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest text-right w-32">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {banks.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-24 text-center">
                                                <Landmark className="w-12 h-12 text-secondary/10 mx-auto mb-4" />
                                                <p className="text-secondary/50 font-bold italic tracking-wide">Henüz kayıtlı bir banka tanımı bulunmuyor.</p>
                                            </td>
                                        </tr>
                                    ) : banks.map((bank) => (
                                        <tr key={bank.id} className="hover:bg-white/[0.01] transition-colors group">
                                            <td className="px-8 py-5">
                                                <span className="font-mono text-xs font-black text-primary bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10 tracking-wider">
                                                    {bank.banka_kodu || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black text-white tracking-tight uppercase">{bank.tanimi}</p>
                                                    <div className="flex items-center gap-2">
                                                        <Globe className="w-3 h-3 text-secondary/30" />
                                                        <p className="text-[10px] text-secondary font-bold uppercase tracking-tighter opacity-70">{bank.banka_adi || 'Banka Belirtilmemiş'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                                        <p className="text-xs text-white/70 font-bold tracking-tight">{bank.sube_adi || 'Merkez Şube'}</p>
                                                    </div>
                                                    <p className="text-[10px] text-secondary/40 font-mono tracking-widest pl-3.5 select-all">{bank.iban_no || 'IBAN TANIMSIZ'}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 font-black text-secondary tracking-widest italic text-xs">
                                                {bank.para_birimi}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                    <button
                                                        onClick={() => handleEdit(bank)}
                                                        className="p-2.5 bg-white/5 hover:bg-primary/20 text-secondary hover:text-primary rounded-xl transition-all border border-white/5 active:scale-90"
                                                        title="Düzenle"
                                                    >
                                                        <Settings className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(bank.id)}
                                                        className="p-2.5 bg-white/5 hover:bg-rose-500/20 text-secondary hover:text-rose-500 rounded-xl transition-all border border-white/5 active:scale-90"
                                                        title="Sil"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                    >
                        {/* Primary Info */}
                        <div className="lg:col-span-8 space-y-8">
                            <div className="glass-card p-6 md:p-10 border-white/5 space-y-10 relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 p-12 opacity-[0.02] -rotate-12 pointer-events-none">
                                    <Landmark className="w-64 h-64" />
                                </div>
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0" />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20"><Hash className="w-3 h-3 text-primary" /></div>
                                            Banka Kodu
                                        </label>
                                        <input
                                            type="text"
                                            value={form.banka_kodu}
                                            onChange={e => setForm({ ...form, banka_kodu: e.target.value })}
                                            className="w-full bg-[#020617]/40 border border-white/10 rounded-xl px-5 py-3 text-white text-sm font-bold outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all"
                                            placeholder="Örn: TR-BNK-001"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20"><Info className="w-3 h-3 text-primary" /></div>
                                            Banka Tanımı
                                        </label>
                                        <input
                                            type="text"
                                            value={form.tanimi}
                                            onChange={e => setForm({ ...form, tanimi: e.target.value })}
                                            className="w-full bg-[#020617]/40 border border-white/10 rounded-xl px-5 py-3 text-white text-sm font-bold outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all"
                                            placeholder="Örn: Ana Ticari Türk Lirası Hesabı"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary uppercase tracking-widest">Resmi Banka Adı</label>
                                        <input
                                            type="text"
                                            value={form.banka_adi}
                                            onChange={e => setForm({ ...form, banka_adi: e.target.value })}
                                            className="w-full bg-[#020617]/40 border border-white/10 rounded-xl px-5 py-3 text-white text-sm font-bold outline-none focus:border-primary/50 transition-all placeholder:text-secondary/20"
                                            placeholder="Örn: Garanti Bankası A.Ş."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary uppercase tracking-widest">Şube Adı / Kodu</label>
                                        <input
                                            type="text"
                                            value={form.sube_adi}
                                            onChange={e => setForm({ ...form, sube_adi: e.target.value })}
                                            className="w-full bg-[#020617]/40 border border-white/10 rounded-xl px-5 py-3 text-white text-sm font-bold outline-none focus:border-primary/50 transition-all placeholder:text-secondary/20"
                                            placeholder="Örn: Şişli Ticari Şubesi"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative pt-4">
                                    <div className="md:col-span-3 space-y-2">
                                        <label className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20"><CreditCard className="w-3 h-3 text-primary" /></div>
                                            IBAN Numarası
                                        </label>
                                        <input
                                            type="text"
                                            value={form.iban_no}
                                            onChange={e => setForm({ ...form, iban_no: e.target.value })}
                                            className="w-full bg-[#020617]/60 border border-white/20 rounded-xl px-5 py-3.5 text-white text-base font-mono tracking-widest outline-none focus:border-primary transition-all shadow-inner placeholder:text-secondary/5"
                                            placeholder="TR00 0000 0000 0000 0000 0000 00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary uppercase tracking-widest">Döviz Birimi</label>
                                        <div className="relative">
                                            <select
                                                value={form.para_birimi}
                                                onChange={e => setForm({ ...form, para_birimi: e.target.value })}
                                                className="w-full bg-[#020617] border border-white/10 rounded-xl px-5 py-3 text-white text-sm font-bold outline-none focus:border-primary/50 appearance-none cursor-pointer"
                                            >
                                                <option value="TRY">TRY</option>
                                                <option value="USD">USD</option>
                                                <option value="EUR">EUR</option>
                                                <option value="GBP">GBP</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary uppercase tracking-widest">Hesap No</label>
                                        <input
                                            type="text"
                                            value={form.hesap_no}
                                            onChange={e => setForm({ ...form, hesap_no: e.target.value })}
                                            className="w-full bg-[#020617]/40 border border-white/10 rounded-xl px-5 py-3 text-white text-sm font-bold outline-none focus:border-primary/50"
                                            placeholder="0000000"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary uppercase tracking-widest">TCMB Kodu</label>
                                        <input
                                            type="text"
                                            value={form.tcmb_kodu}
                                            onChange={e => setForm({ ...form, tcmb_kodu: e.target.value })}
                                            className="w-full bg-[#020617]/40 border border-white/10 rounded-xl px-5 py-3 text-white text-sm font-bold outline-none focus:border-primary/50"
                                            placeholder="000"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="glass-card p-6 md:p-10 border-white/5 space-y-8 shadow-xl">
                                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                                    <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em] flex items-center gap-4">
                                        <div className="w-2 h-8 bg-primary/20 rounded-full" />
                                        Muhasebe Entegrasyonu & Limit Yönetimi
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[
                                        { label: "Mevduat Muh. Kodu", key: "muh_kodu_mev" },
                                        { label: "Müşteri Çek Muh.", key: "muh_kodu_cek" },
                                        { label: "Takastaki Çek Muh.", key: "muh_kodu_takas" },
                                        { label: "Tahsilat Muh. Kodu", key: "muh_kodu_tahsil" }
                                    ].map(item => (
                                        <div key={item.key} className="space-y-3">
                                            <label className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] italic opacity-60">{item.label}</label>
                                            <input
                                                type="text"
                                                value={(form as any)[item.key]}
                                                onChange={e => setForm({ ...form, [item.key]: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs font-mono outline-none focus:border-primary/50 transition-all"
                                                placeholder="102.01.001"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-4">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Tahsis Edilen Limit</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={form.limit_tutari}
                                                onChange={e => setForm({ ...form, limit_tutari: parseFloat(e.target.value) })}
                                                className="w-full bg-[#020617]/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm font-black outline-none focus:border-primary/50"
                                            />
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-secondary opacity-30 tracking-tight">TRY</div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] italic">EFT/Havale İzin Durumu</label>
                                        <button
                                            onClick={() => setForm({ ...form, havale_uygun: !form.havale_uygun })}
                                            className={`w-full py-4 rounded-2xl border flex items-center justify-center gap-3 transition-all font-black text-[10px] tracking-[0.2em] group shadow-inner ${form.havale_uygun ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-white/5 border-white/10 text-secondary'}`}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${form.havale_uygun ? 'bg-emerald-500 animate-pulse' : 'bg-secondary/30'}`} />
                                            {form.havale_uygun ? "TRANSFERE UYGUN / AKTİF" : "TRANSFERE KAPALI"}
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Banka Masraf Hesabı</label>
                                        <input
                                            type="text"
                                            value={form.masraf_hesabi}
                                            onChange={e => setForm({ ...form, masraf_hesabi: e.target.value })}
                                            className="w-full bg-[#020617]/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm font-bold outline-none focus:border-primary/50 transition-all placeholder:text-secondary/10"
                                            placeholder="780.01.001"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Details */}
                        <div className="lg:col-span-4 space-y-8">
                            <div className="glass-card p-6 md:p-8 border-white/5 space-y-8 relative overflow-hidden shadow-xl">
                                <div className="absolute -top-12 -right-12 p-8 opacity-[0.03] scale-150 rotate-12">
                                    <Phone className="w-48 h-48" />
                                </div>
                                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-4 relative">
                                    <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20"><Phone className="w-4 h-4 text-primary" /></div>
                                    İletişim & Lokasyon
                                </h3>
                                <div className="space-y-6 relative">
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] italic flex items-center justify-between">
                                            <span>Müşteri Hizmetleri / Şube-1</span>
                                            <span className="text-primary opacity-50 font-mono">01</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.telefon1}
                                            onChange={e => setForm({ ...form, telefon1: e.target.value })}
                                            className="w-full bg-[#020617]/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm font-bold outline-none focus:border-primary/50 transition-all"
                                            placeholder="(05__) ___ __ __"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] italic flex items-center justify-between">
                                            <span>Yedek İletişim / Şube-2</span>
                                            <span className="text-primary opacity-50 font-mono">02</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.telefon2}
                                            onChange={e => setForm({ ...form, telefon2: e.target.value })}
                                            className="w-full bg-[#020617]/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm font-bold outline-none focus:border-primary/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] italic flex items-center justify-between">
                                            <span>Faks Protokol No</span>
                                            <span className="text-primary opacity-50 font-mono">FX</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.fax_no}
                                            onChange={e => setForm({ ...form, fax_no: e.target.value })}
                                            className="w-full bg-[#020617]/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm font-bold outline-none focus:border-primary/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-3 pt-2">
                                        <label className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] italic flex items-center gap-3">
                                            <MapPin className="w-3 h-3 text-primary opacity-50" /> Şube Resmi Adresi
                                        </label>
                                        <textarea
                                            value={form.adres}
                                            onChange={e => setForm({ ...form, adres: e.target.value })}
                                            rows={4}
                                            className="w-full bg-[#020617]/60 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm font-medium outline-none focus:border-primary/50 transition-all resize-none shadow-inner leading-relaxed placeholder:text-secondary/5"
                                            placeholder="Şube tam adresi buraya girilecek..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="glass-card p-6 md:p-8 border-white/5 space-y-8 relative overflow-hidden shadow-xl">
                                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-4">
                                    <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20"><Settings className="w-4 h-4 text-primary" /></div>
                                    Sistem Parametreleri
                                </h3>
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-secondary uppercase tracking-[0.2em]">Kurum Özel Rapor Kodu</label>
                                        <input
                                            type="text"
                                            value={form.ozel_kodu}
                                            onChange={e => setForm({ ...form, ozel_kodu: e.target.value })}
                                            className="w-full bg-[#020617]/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm font-black outline-none focus:border-primary/50 placeholder:text-secondary/5"
                                            placeholder="ÖZEL-01"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black text-secondary uppercase tracking-[0.2em]">K.K. Valör Günü</label>
                                            <input
                                                type="number"
                                                value={form.kk_hes_gecis_gunu}
                                                onChange={e => setForm({ ...form, kk_hes_gecis_gunu: parseInt(e.target.value) })}
                                                className="w-full bg-[#020617]/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm font-black outline-none focus:border-primary/50 text-center"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black text-secondary uppercase tracking-[0.2em]">K.K. Komisyon Oranı</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={form.kk_komisyon_oran}
                                                    onChange={e => setForm({ ...form, kk_komisyon_oran: parseFloat(e.target.value) })}
                                                    className="w-full bg-[#020617]/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm font-black outline-none focus:border-primary/50 text-center pl-8"
                                                />
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black text-xs opacity-50">%</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
