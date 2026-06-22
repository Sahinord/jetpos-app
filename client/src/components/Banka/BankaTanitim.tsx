"use client";

import { useState, useEffect } from "react";
import {
    Save, X, Trash2, Landmark,
    Info, Phone, MapPin,
    CreditCard, Globe, Settings,
    Plus, List
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
        <div className="space-y-4 max-w-[1600px] mx-auto p-4">
            {/* Header / Actions */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/5">
                <div className="flex items-center gap-1 bg-white/[0.02] p-1 rounded-xl border border-white/5">
                    <button
                        onClick={() => setView("list")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${view === 'list' ? 'bg-primary text-white' : 'text-secondary hover:text-foreground'}`}
                    >
                        <List className="w-3.5 h-3.5" /> Liste
                    </button>
                    <button
                        onClick={() => {
                            setForm(initialForm);
                            setEditingId(null);
                            setView("form");
                        }}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${view === 'form' && !editingId ? 'bg-primary text-white' : 'text-secondary hover:text-foreground'}`}
                    >
                        <Plus className="w-3.5 h-3.5" /> Yeni Tanım
                    </button>
                </div>

                {view === "form" && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setView("list")}
                            className="bg-white/5 hover:bg-white/10 text-white/70 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border border-white/10"
                        >
                            <X className="w-4 h-4" /> İPTAL
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                            BİLGİLERİ KAYDET
                        </button>
                    </div>
                )}
            </div>

            <AnimatePresence mode="wait">
                {view === "list" ? (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="glass-card p-0 overflow-hidden"
                    >
                        <table className="w-full text-left text-xs">
                            <thead className="text-secondary/60 font-semibold uppercase tracking-wider text-[9px] border-b border-white/5">
                                <tr>
                                    <th className="px-4 py-3 w-32">Banka Kodu</th>
                                    <th className="px-4 py-3">Banka Tanımı &amp; Kurum</th>
                                    <th className="px-4 py-3">Şube &amp; IBAN</th>
                                    <th className="px-4 py-3 w-20">Döviz</th>
                                    <th className="px-4 py-3 text-right w-28">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {banks.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <Landmark className="w-10 h-10 mx-auto mb-3 opacity-10 text-foreground" />
                                            <p className="text-xs font-bold text-secondary/40 uppercase tracking-widest">Henüz kayıtlı banka tanımı yok</p>
                                        </td>
                                    </tr>
                                ) : banks.map((bank) => (
                                    <tr key={bank.id} className="hover:bg-white/[0.02] group">
                                        <td className="px-4 py-3">
                                            <span className="font-mono text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded-lg">
                                                {bank.banka_kodu || '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-bold text-foreground">{bank.tanimi}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Globe className="w-3 h-3 text-secondary/30" />
                                                <p className="text-[10px] text-secondary/60">{bank.banka_adi || 'Banka belirtilmemiş'}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-secondary">{bank.sube_adi || 'Merkez Şube'}</p>
                                            <p className="text-[10px] text-secondary/40 font-mono">{bank.iban_no || 'IBAN tanımsız'}</p>
                                        </td>
                                        <td className="px-4 py-3 font-bold text-secondary">{bank.para_birimi}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleEdit(bank)}
                                                    className="p-2 text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                                    title="Düzenle"
                                                >
                                                    <Settings className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(bank.id)}
                                                    className="p-2 text-secondary hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
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
                    </motion.div>
                ) : (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
                    >
                        {/* Primary Info */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="glass-card p-5 space-y-5 bg-white/[0.01]">
                                <h2 className="text-[10px] font-bold text-primary uppercase tracking-[0.25em] flex items-center gap-2 border-b border-white/5 pb-3">
                                    <Landmark className="w-4 h-4" />
                                    Banka Bilgileri
                                </h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Banka Kodu</label>
                                        <input
                                            type="text"
                                            value={form.banka_kodu}
                                            onChange={e => setForm({ ...form, banka_kodu: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                                            placeholder="Örn: TR-BNK-001"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Banka Tanımı</label>
                                        <input
                                            type="text"
                                            value={form.tanimi}
                                            onChange={e => setForm({ ...form, tanimi: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                                            placeholder="Örn: Ana Ticari TL Hesabı"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Resmi Banka Adı</label>
                                        <input
                                            type="text"
                                            value={form.banka_adi}
                                            onChange={e => setForm({ ...form, banka_adi: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                                            placeholder="Örn: Garanti Bankası A.Ş."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Şube Adı / Kodu</label>
                                        <input
                                            type="text"
                                            value={form.sube_adi}
                                            onChange={e => setForm({ ...form, sube_adi: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                                            placeholder="Örn: Şişli Ticari Şubesi"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className="md:col-span-3 space-y-2">
                                        <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest flex items-center gap-2">
                                            <CreditCard className="w-3.5 h-3.5" /> IBAN Numarası
                                        </label>
                                        <input
                                            type="text"
                                            value={form.iban_no}
                                            onChange={e => setForm({ ...form, iban_no: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono tracking-wider outline-none focus:border-primary"
                                            placeholder="TR00 0000 0000 0000 0000 0000 00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Döviz Birimi</label>
                                        <select
                                            value={form.para_birimi}
                                            onChange={e => setForm({ ...form, para_birimi: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                                        >
                                            <option value="TRY">TRY</option>
                                            <option value="USD">USD</option>
                                            <option value="EUR">EUR</option>
                                            <option value="GBP">GBP</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Hesap No</label>
                                        <input
                                            type="text"
                                            value={form.hesap_no}
                                            onChange={e => setForm({ ...form, hesap_no: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                                            placeholder="0000000"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest">TCMB Kodu</label>
                                        <input
                                            type="text"
                                            value={form.tcmb_kodu}
                                            onChange={e => setForm({ ...form, tcmb_kodu: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                                            placeholder="000"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="glass-card p-5 space-y-5 bg-white/[0.01]">
                                <h2 className="text-[10px] font-bold text-primary uppercase tracking-[0.25em] flex items-center gap-2 border-b border-white/5 pb-3">
                                    <Settings className="w-4 h-4" />
                                    Muhasebe Entegrasyonu &amp; Limit
                                </h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                    {[
                                        { label: "Mevduat Muh. Kodu", key: "muh_kodu_mev" },
                                        { label: "Müşteri Çek Muh.", key: "muh_kodu_cek" },
                                        { label: "Takastaki Çek Muh.", key: "muh_kodu_takas" },
                                        { label: "Tahsilat Muh. Kodu", key: "muh_kodu_tahsil" }
                                    ].map(item => (
                                        <div key={item.key} className="space-y-2">
                                            <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest">{item.label}</label>
                                            <input
                                                type="text"
                                                value={(form as any)[item.key]}
                                                onChange={e => setForm({ ...form, [item.key]: e.target.value })}
                                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono outline-none focus:border-primary"
                                                placeholder="102.01.001"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Tahsis Edilen Limit</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={form.limit_tutari}
                                                onChange={e => setForm({ ...form, limit_tutari: parseFloat(e.target.value) })}
                                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-secondary/40">TRY</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest">EFT/Havale İzni</label>
                                        <button
                                            onClick={() => setForm({ ...form, havale_uygun: !form.havale_uygun })}
                                            className={`w-full py-2 rounded-lg border flex items-center justify-center gap-2 transition-all text-xs font-bold ${form.havale_uygun ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-background border-border text-secondary'}`}
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full ${form.havale_uygun ? 'bg-emerald-500' : 'bg-secondary/30'}`} />
                                            {form.havale_uygun ? "Aktif" : "Kapalı"}
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Banka Masraf Hesabı</label>
                                        <input
                                            type="text"
                                            value={form.masraf_hesabi}
                                            onChange={e => setForm({ ...form, masraf_hesabi: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                                            placeholder="780.01.001"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Details */}
                        <div className="lg:col-span-1 space-y-4">
                            <div className="glass-card p-5 space-y-5 bg-white/[0.01]">
                                <h2 className="text-[10px] font-bold text-primary uppercase tracking-[0.25em] flex items-center gap-2 border-b border-white/5 pb-3">
                                    <Phone className="w-4 h-4" />
                                    İletişim &amp; Lokasyon
                                </h2>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Şube Telefonu</label>
                                        <input
                                            type="text"
                                            value={form.telefon1}
                                            onChange={e => setForm({ ...form, telefon1: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                                            placeholder="(05__) ___ __ __"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Yedek İletişim</label>
                                        <input
                                            type="text"
                                            value={form.telefon2}
                                            onChange={e => setForm({ ...form, telefon2: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Faks No</label>
                                        <input
                                            type="text"
                                            value={form.fax_no}
                                            onChange={e => setForm({ ...form, fax_no: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest flex items-center gap-2">
                                            <MapPin className="w-3.5 h-3.5" /> Şube Adresi
                                        </label>
                                        <textarea
                                            value={form.adres}
                                            onChange={e => setForm({ ...form, adres: e.target.value })}
                                            rows={3}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary resize-none"
                                            placeholder="Şube tam adresi..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="glass-card p-5 space-y-5 bg-white/[0.01]">
                                <h2 className="text-[10px] font-bold text-primary uppercase tracking-[0.25em] flex items-center gap-2 border-b border-white/5 pb-3">
                                    <Info className="w-4 h-4" />
                                    Sistem Parametreleri
                                </h2>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Kurum Özel Rapor Kodu</label>
                                        <input
                                            type="text"
                                            value={form.ozel_kodu}
                                            onChange={e => setForm({ ...form, ozel_kodu: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                                            placeholder="ÖZEL-01"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest">K.K. Valör Günü</label>
                                            <input
                                                type="number"
                                                value={form.kk_hes_gecis_gunu}
                                                onChange={e => setForm({ ...form, kk_hes_gecis_gunu: parseInt(e.target.value) })}
                                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground text-center outline-none focus:border-primary"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest">K.K. Komisyon %</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={form.kk_komisyon_oran}
                                                onChange={e => setForm({ ...form, kk_komisyon_oran: parseFloat(e.target.value) })}
                                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground text-center outline-none focus:border-primary"
                                            />
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
