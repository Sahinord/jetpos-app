"use client";

import { useState, useEffect, useCallback } from "react";
import {
    X, User, Receipt, TrendingUp, Save, Search, RefreshCw, Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

type Tab = "bilgiler" | "hareketler" | "fiyat";

interface Props {
    cari: any;
    initialTab?: Tab;
    onClose: () => void;
    onSaved?: () => void;
    showToast?: (m: string, t: "success" | "error" | "info" | "warning") => void;
}

const money = (n: number) =>
    (Number(n) || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const HAREKET_ETIKET: Record<string, string> = {
    borc: "Borç Dekontu", alacak: "Alacak Dekontu", satis: "Satış",
    tahsilat: "Tahsilat", odeme: "Ödeme", virman: "Virman", devir: "Devir", fatura: "Fatura",
};

export default function CariDetayModal({ cari, initialTab = "hareketler", onClose, onSaved, showToast }: Props) {
    const { currentTenant } = useTenant();
    const tenantId = currentTenant?.id;
    const [tab, setTab] = useState<Tab>(initialTab);

    // ── Bilgiler (düzenle) ──
    const [form, setForm] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    // ── Hesap hareketleri ──
    const [hareketler, setHareketler] = useState<any[]>([]);
    const [loadingHar, setLoadingHar] = useState(false);

    // ── Ürün fiyat geçmişi ──
    const [fiyatlar, setFiyatlar] = useState<any[]>([]);
    const [loadingFiy, setLoadingFiy] = useState(false);
    const [urunAra, setUrunAra] = useState("");

    // Tam cari kaydını çek (liste kısmi kolon taşıyor)
    useEffect(() => {
        if (!tenantId || !cari?.id) return;
        (async () => {
            const { data } = await supabase.from("cari_hesaplar").select("*").eq("id", cari.id).single();
            setForm(data || cari);
        })();
    }, [tenantId, cari?.id]);

    // Hesap hareketleri + yürüyen bakiye
    const loadHareketler = useCallback(async () => {
        if (!tenantId || !cari?.id) return;
        setLoadingHar(true);
        try {
            const { data } = await supabase
                .from("cari_hareketler")
                .select("*")
                .eq("tenant_id", tenantId)
                .eq("cari_id", cari.id)
                .order("tarih", { ascending: true });
            let bakiye = 0;
            const rows = (data || []).map((h: any) => {
                bakiye += (Number(h.borc) || 0) - (Number(h.alacak) || 0);
                return { ...h, _bakiye: bakiye };
            });
            rows.reverse(); // en yeni üstte
            setHareketler(rows);
        } catch { setHareketler([]); }
        finally { setLoadingHar(false); }
    }, [tenantId, cari?.id]);

    // Ürün fiyat geçmişi (bu cariye kesilen faturaların kalemleri)
    const loadFiyatlar = useCallback(async () => {
        if (!tenantId || !cari?.id) return;
        setLoadingFiy(true);
        try {
            const { data: invs } = await supabase
                .from("invoices")
                .select("id, invoice_number, invoice_type, invoice_date, created_at")
                .eq("tenant_id", tenantId)
                .eq("cari_id", cari.id)
                .order("created_at", { ascending: false })
                .limit(500);
            const list = invs || [];
            if (list.length === 0) { setFiyatlar([]); return; }
            const invMap: Record<string, any> = {};
            for (const i of list) invMap[i.id] = i;
            const { data: items } = await supabase
                .from("invoice_items")
                .select("invoice_id, product_name, unit, quantity, unit_price, total_amount")
                .in("invoice_id", list.map(i => i.id));
            const rows = (items || []).map((it: any) => {
                const inv = invMap[it.invoice_id] || {};
                return {
                    ...it,
                    tarih: inv.invoice_date || inv.created_at,
                    belge_no: inv.invoice_number,
                    tip: inv.invoice_type,
                };
            }).sort((a, b) => String(b.tarih).localeCompare(String(a.tarih)));
            setFiyatlar(rows);
        } catch { setFiyatlar([]); }
        finally { setLoadingFiy(false); }
    }, [tenantId, cari?.id]);

    useEffect(() => { if (tab === "hareketler") loadHareketler(); }, [tab, loadHareketler]);
    useEffect(() => { if (tab === "fiyat") loadFiyatlar(); }, [tab, loadFiyatlar]);

    const setF = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

    const kaydet = async () => {
        if (!form || !tenantId) return;
        if (!form.unvani?.trim()) { showToast?.("Ünvan boş olamaz", "error"); return; }
        setSaving(true);
        try {
            const payload = {
                unvani: form.unvani, cari_kodu: form.cari_kodu, cari_tipi: form.cari_tipi,
                durum: form.durum, vergi_dairesi: form.vergi_dairesi, vergi_no: form.vergi_no,
                tel_1: form.tel_1, cep_tel: form.cep_tel, email: form.email,
                adres: form.adres, il: form.il, ilce: form.ilce, notlar: form.notlar,
            };
            const { error } = await supabase.from("cari_hesaplar").update(payload)
                .eq("id", cari.id).eq("tenant_id", tenantId);
            if (error) throw error;
            showToast?.("Cari güncellendi", "success");
            onSaved?.();
        } catch (e: any) {
            showToast?.(e?.message || "Kaydedilemedi", "error");
        } finally { setSaving(false); }
    };

    const bakiye = Number(cari?.bakiye) || 0;
    const fiyatFiltre = fiyatlar.filter(f =>
        !urunAra.trim() || String(f.product_name || "").toLowerCase().includes(urunAra.toLowerCase()));

    const TABS: [Tab, string, any][] = [
        ["bilgiler", "Bilgiler", User],
        ["hareketler", "Hesap Hareketleri", Receipt],
        ["fiyat", "Ürün Fiyat Geçmişi", TrendingUp],
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div onClick={e => e.stopPropagation()}
                className="bg-card border border-border w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex items-start justify-between gap-4 flex-shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black flex-shrink-0">
                            {String(cari?.unvani || "?").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-base font-bold text-foreground truncate">{cari?.unvani || "Cari"}</h2>
                            <p className="text-xs text-secondary font-mono">{cari?.cari_kodu || "—"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                            <p className="text-[10px] uppercase tracking-wider text-secondary">Bakiye</p>
                            <p className={`text-lg font-black font-mono ${bakiye >= 0 ? "text-red-400" : "text-emerald-400"}`}>
                                {money(Math.abs(bakiye))} <span className="text-[10px]">{bakiye >= 0 ? "B" : "A"}</span>
                            </p>
                        </div>
                        <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-primary/10 flex items-center justify-center text-secondary hover:text-foreground transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 px-4 pt-3 border-b border-border flex-shrink-0">
                    {TABS.map(([k, label, Icon]) => (
                        <button key={k} onClick={() => setTab(k)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-all ${tab === k
                                ? "border-primary text-primary bg-primary/5"
                                : "border-transparent text-secondary hover:text-foreground"}`}>
                            <Icon className="w-4 h-4" /> {label}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">

                    {/* ── BİLGİLER ── */}
                    {tab === "bilgiler" && (
                        !form ? <Spinner /> : (
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="Ünvan"><input value={form.unvani || ""} onChange={e => setF("unvani", e.target.value)} className={inp} /></Field>
                                    <Field label="Cari Kodu"><input value={form.cari_kodu || ""} onChange={e => setF("cari_kodu", e.target.value)} className={inp} /></Field>
                                    <Field label="Cari Tipi">
                                        <select value={form.cari_tipi || ""} onChange={e => setF("cari_tipi", e.target.value)} className={inp}>
                                            <option value="">Seçiniz</option>
                                            <option value="Müşteri">Müşteri</option>
                                            <option value="Tedarikçi">Tedarikçi</option>
                                            <option value="Her İkisi">Her İkisi</option>
                                        </select>
                                    </Field>
                                    <Field label="Durum">
                                        <select value={form.durum || "Aktif"} onChange={e => setF("durum", e.target.value)} className={inp}>
                                            <option value="Aktif">Aktif</option>
                                            <option value="Pasif">Pasif</option>
                                        </select>
                                    </Field>
                                    <Field label="Vergi Dairesi"><input value={form.vergi_dairesi || ""} onChange={e => setF("vergi_dairesi", e.target.value)} className={inp} /></Field>
                                    <Field label="Vergi / TC No"><input value={form.vergi_no || ""} onChange={e => setF("vergi_no", e.target.value)} className={inp} /></Field>
                                    <Field label="Telefon"><input value={form.tel_1 || ""} onChange={e => setF("tel_1", e.target.value)} className={inp} /></Field>
                                    <Field label="Cep Telefonu"><input value={form.cep_tel || ""} onChange={e => setF("cep_tel", e.target.value)} className={inp} /></Field>
                                    <Field label="E-posta"><input value={form.email || ""} onChange={e => setF("email", e.target.value)} className={inp} /></Field>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Field label="İl"><input value={form.il || ""} onChange={e => setF("il", e.target.value)} className={inp} /></Field>
                                        <Field label="İlçe"><input value={form.ilce || ""} onChange={e => setF("ilce", e.target.value)} className={inp} /></Field>
                                    </div>
                                </div>
                                <Field label="Adres"><textarea value={form.adres || ""} onChange={e => setF("adres", e.target.value)} rows={2} className={inp} /></Field>
                                <Field label="Notlar"><textarea value={form.notlar || ""} onChange={e => setF("notlar", e.target.value)} rows={2} className={inp} /></Field>
                                <div className="flex justify-end">
                                    <button onClick={kaydet} disabled={saving}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Kaydet
                                    </button>
                                </div>
                            </div>
                        )
                    )}

                    {/* ── HESAP HAREKETLERİ ── */}
                    {tab === "hareketler" && (
                        loadingHar ? <Spinner /> : hareketler.length === 0 ? <Empty text="Bu cariye ait hareket yok." /> : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-secondary border-b border-border">
                                            <th className="py-2 pr-3 font-medium">Tarih</th>
                                            <th className="py-2 px-3 font-medium">Belge</th>
                                            <th className="py-2 px-3 font-medium">İşlem</th>
                                            <th className="py-2 px-3 font-medium text-right">Borç</th>
                                            <th className="py-2 px-3 font-medium text-right">Alacak</th>
                                            <th className="py-2 pl-3 font-medium text-right">Bakiye</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {hareketler.map((h, i) => (
                                            <tr key={h.id || i} className="border-b border-border/50 hover:bg-primary/5">
                                                <td className="py-2 pr-3 whitespace-nowrap text-foreground">{h.tarih ? new Date(h.tarih).toLocaleDateString("tr-TR") : "—"}</td>
                                                <td className="py-2 px-3 font-mono text-xs text-secondary">{h.belge_no || "—"}</td>
                                                <td className="py-2 px-3 text-foreground">{HAREKET_ETIKET[h.hareket_tipi] || h.hareket_tipi || h.aciklama || "—"}</td>
                                                <td className="py-2 px-3 text-right font-mono text-red-400">{h.borc > 0 ? money(h.borc) : "—"}</td>
                                                <td className="py-2 px-3 text-right font-mono text-emerald-400">{h.alacak > 0 ? money(h.alacak) : "—"}</td>
                                                <td className={`py-2 pl-3 text-right font-mono font-bold ${h._bakiye >= 0 ? "text-red-400" : "text-emerald-400"}`}>{money(Math.abs(h._bakiye))}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}

                    {/* ── ÜRÜN FİYAT GEÇMİŞİ ── */}
                    {tab === "fiyat" && (
                        <div className="space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                                <input value={urunAra} onChange={e => setUrunAra(e.target.value)} placeholder="Ürün ara…"
                                    className={`${inp} pl-9`} />
                            </div>
                            {loadingFiy ? <Spinner /> : fiyatFiltre.length === 0 ? (
                                <Empty text={fiyatlar.length === 0 ? "Bu cariye kesilmiş fatura kalemi yok." : "Aramaya uygun kayıt yok."} />
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-secondary border-b border-border">
                                                <th className="py-2 pr-3 font-medium">Tarih</th>
                                                <th className="py-2 px-3 font-medium">Ürün</th>
                                                <th className="py-2 px-3 font-medium text-right">Miktar</th>
                                                <th className="py-2 px-3 font-medium text-right">Birim Fiyat</th>
                                                <th className="py-2 pl-3 font-medium text-right">Tutar</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {fiyatFiltre.map((f, i) => (
                                                <tr key={i} className="border-b border-border/50 hover:bg-primary/5">
                                                    <td className="py-2 pr-3 whitespace-nowrap text-foreground">{f.tarih ? new Date(f.tarih).toLocaleDateString("tr-TR") : "—"}</td>
                                                    <td className="py-2 px-3 text-foreground">{f.product_name || "—"}</td>
                                                    <td className="py-2 px-3 text-right font-mono text-secondary">{money(f.quantity)} {f.unit || ""}</td>
                                                    <td className="py-2 px-3 text-right font-mono font-bold text-primary">{money(f.unit_price)}</td>
                                                    <td className="py-2 pl-3 text-right font-mono text-foreground">{money(f.total_amount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const inp = "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60 transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="block text-xs font-medium text-secondary mb-1.5">{label}</span>
            {children}
        </label>
    );
}

function Spinner() {
    return <div className="flex items-center justify-center py-16 text-secondary"><RefreshCw className="w-6 h-6 animate-spin" /></div>;
}

function Empty({ text }: { text: string }) {
    return <div className="text-center py-16 text-secondary text-sm">{text}</div>;
}
