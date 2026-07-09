"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
    CreditCard, RefreshCw, TrendingUp, CheckCircle2, Clock,
    Save, Link as LinkIcon, ShieldCheck, Info
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";
import { apiFetch } from "@/lib/api";

type SubTab = "overview" | "orders" | "finance" | "settings" | "mapping";

type OdealTx = {
    id: string;
    reference_code: string;
    status: string;             // pending | succeeded | failed | cancelled
    amount: number | null;
    payment_method: string | null;
    payment_ref_code: string | null;
    einvoice_no: string | null;
    created_at: string;
    updated_at: string;
};

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
    succeeded: { label: "Başarılı", color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
    pending: { label: "Bekliyor", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
    failed: { label: "Başarısız", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
    cancelled: { label: "İptal", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
};
const money = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const timeAgo = (s: string) => {
    const m = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
    if (m < 1) return "az önce";
    if (m < 60) return `${m} dk önce`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} saat önce`;
    return `${Math.floor(h / 24)} gün önce`;
};

export default function OdealWidget({ activeSubTab = "overview" }: { activeSubTab?: SubTab }) {
    const { currentTenant, refreshTenants } = useTenant();
    const [txs, setTxs] = useState<OdealTx[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [registering, setRegistering] = useState(false);
    const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

    const od = (currentTenant as any)?.settings?.odeal || {};
    const [form, setForm] = useState({
        publicKey: "", secretKey: "", username: "", password: "",
        terminalSerial: "", paxId: "", vkn: "", externalDeviceKey: "", baseUrl: "",
        environment: "stage", active: false,
    });

    // currentTenant değişince formu doldur
    useEffect(() => {
        const o = (currentTenant as any)?.settings?.odeal || {};
        setForm({
            publicKey: o.publicKey || "", secretKey: o.secretKey || "", username: o.username || "",
            password: o.password || "", terminalSerial: o.terminalSerial || "", paxId: o.paxId || "",
            vkn: o.vkn || "", externalDeviceKey: o.externalDeviceKey || "", baseUrl: o.baseUrl || "",
            environment: o.environment || "stage", active: o.active === true,
        });
    }, [currentTenant]);

    const fetchTxs = useCallback(async () => {
        if (!currentTenant?.id) return;
        setLoading(true);
        try {
            const { data } = await supabase
                .from("odeal_transactions")
                .select("id, reference_code, status, amount, payment_method, payment_ref_code, einvoice_no, created_at, updated_at")
                .eq("tenant_id", currentTenant.id)
                .order("created_at", { ascending: false })
                .limit(200);
            if (data) setTxs(data as OdealTx[]);
        } finally { setLoading(false); }
    }, [currentTenant?.id]);

    useEffect(() => { fetchTxs(); }, [fetchTxs]);

    // ── REALTIME ── İşlemler ve tenant ayarları canlı güncellenir
    useEffect(() => {
        if (!currentTenant?.id) return;
        const ch = supabase
            .channel(`odeal_rt_${currentTenant.id}`)
            // Webhook ödeme yazınca / güncelleyince işlemler tazelensin
            .on("postgres_changes",
                { event: "*", schema: "public", table: "odeal_transactions", filter: `tenant_id=eq.${currentTenant.id}` },
                () => fetchTxs())
            // SuperAdmin (veya başka ekran) Ödeal ayarını değiştirince buraya yansısın
            .on("postgres_changes",
                { event: "UPDATE", schema: "public", table: "tenants", filter: `id=eq.${currentTenant.id}` },
                () => refreshTenants())
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [currentTenant?.id, fetchTxs, refreshTenants]);

    // İstatistikler
    const succeeded = useMemo(() => txs.filter(t => t.status === "succeeded"), [txs]);
    const failed = useMemo(() => txs.filter(t => t.status === "failed" || t.status === "cancelled"), [txs]);
    const pending = useMemo(() => txs.filter(t => t.status === "pending"), [txs]);
    const totalRevenue = useMemo(() => succeeded.reduce((s, t) => s + (Number(t.amount) || 0), 0), [succeeded]);
    const isActive = od.active === true;

    const saveSettings = async () => {
        if (!currentTenant?.id) return;
        setSaving(true); setMsg(null);
        try {
            // Service-role route (anon client RLS'e takılıp sessizce kaydetmiyordu)
            await apiFetch("/api/odeal/save-settings", {
                method: "POST",
                body: JSON.stringify(form),
            });
            await refreshTenants();
            setMsg({ type: "ok", text: "Ödeal ayarları kaydedildi. Kart ödemeleri artık cihaza yönlenecek." });
        } catch (e: any) {
            setMsg({ type: "err", text: "Kaydedilemedi: " + (e?.message || "hata") });
        } finally { setSaving(false); }
    };

    const registerCallbacks = async () => {
        setRegistering(true); setMsg(null);
        try {
            await apiFetch("/api/odeal/register-callbacks", { method: "POST" });
            setMsg({ type: "ok", text: "Callback URL'leri Ödeal'e kaydedildi." });
        } catch (e: any) {
            setMsg({ type: "err", text: "Callback kaydı başarısız: " + (e?.message || "hata") });
        } finally { setRegistering(false); }
    };

    // ══════════ GENEL BAKIŞ ══════════
    if (activeSubTab === "overview") {
        const cards = [
            { label: "Toplam İşlem", value: String(txs.length), icon: CreditCard, color: "#06b6d4" },
            { label: "Başarılı", value: String(succeeded.length), icon: CheckCircle2, color: "#22c55e" },
            { label: "Toplam Tahsilat", value: `₺${money(totalRevenue)}`, icon: TrendingUp, color: "#22c55e" },
            { label: "Bekleyen / Başarısız", value: `${pending.length} / ${failed.length}`, icon: Clock, color: "#f59e0b" },
        ];
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20">
                            <CreditCard className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <p className="font-black text-white text-sm">Ödeal A910S</p>
                            <p className="text-[11px] text-secondary/50">{form.environment === "prod" ? "Production" : "Stage (Test)"} • D2D</p>
                        </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${isActive ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}`}>
                        <span className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-400" : "bg-red-400"}`} />
                        <span className={`text-[11px] font-black ${isActive ? "text-emerald-400" : "text-red-400"}`}>{isActive ? "AKTİF" : "PASİF"}</span>
                    </div>
                </div>

                {!isActive && (
                    <div className="flex items-start gap-3 bg-amber-500/[0.06] border border-amber-500/20 rounded-2xl p-4">
                        <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-secondary/70">
                            Entegrasyon pasif. <strong className="text-white">Ayarlar</strong> sekmesinden bilgileri girip &quot;Entegrasyon Aktif&quot;i açın; ardından POS&apos;ta <strong className="text-white">KART</strong> ödemesi Ödeal cihazına yönlenir.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {cards.map((c, i) => (
                        <div key={i} className="relative overflow-hidden bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
                            <c.icon className="absolute right-3 top-3 w-10 h-10 opacity-[0.06]" style={{ color: c.color }} />
                            <div className="text-[10px] uppercase tracking-widest font-black mb-2" style={{ color: c.color }}>{c.label}</div>
                            <div className="text-2xl font-black text-white leading-none">{c.value}</div>
                        </div>
                    ))}
                </div>

                <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-black text-white">Son İşlemler</h3>
                        <button onClick={fetchTxs} className="text-xs text-cyan-400 font-bold flex items-center gap-1">
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Yenile
                        </button>
                    </div>
                    {txs.length === 0 ? (
                        <div className="text-center py-12 text-secondary/30 text-sm">Henüz ödeme işlemi yok.</div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {txs.slice(0, 6).map(t => {
                                const st = STATUS[t.status] || STATUS.pending;
                                return (
                                    <div key={t.id} className="flex items-center justify-between gap-3 p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                                        <div className="min-w-0">
                                            <div className="font-bold text-white text-sm">₺{money(Number(t.amount) || 0)}
                                                <span className="text-secondary/40 font-medium text-xs"> · {t.payment_method || "—"}</span>
                                            </div>
                                            <div className="text-[11px] text-secondary/40">{timeAgo(t.created_at)}</div>
                                        </div>
                                        <span className="text-[10px] font-black px-2.5 py-1 rounded-lg" style={{ color: st.color, background: st.bg }}>{st.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ══════════ İŞLEMLER ══════════
    if (activeSubTab === "orders") {
        return (
            <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-white">Ödeme İşlemleri</h3>
                    <button onClick={fetchTxs} className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-black flex items-center gap-2">
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Yenile
                    </button>
                </div>
                {txs.length === 0 ? (
                    <div className="text-center py-16 text-secondary/30"><CreditCard className="w-10 h-10 mx-auto mb-3 opacity-40" /><p className="text-sm">İşlem yok.</p></div>
                ) : (
                    <div className="grid gap-2">
                        {txs.map(t => {
                            const st = STATUS[t.status] || STATUS.pending;
                            return (
                                <div key={t.id} className="flex items-center justify-between gap-3 p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                                    <div className="min-w-0">
                                        <div className="font-black text-white">₺{money(Number(t.amount) || 0)}</div>
                                        <div className="text-[11px] text-secondary/40">
                                            {t.payment_method || "—"} · {t.reference_code.slice(-10)} · {timeAgo(t.created_at)}
                                            {t.einvoice_no ? ` · e-Fatura: ${t.einvoice_no}` : ""}
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black px-2.5 py-1 rounded-lg flex-shrink-0" style={{ color: st.color, background: st.bg }}>{st.label}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // ══════════ FİNANS ══════════
    if (activeSubTab === "finance") {
        const avg = succeeded.length ? totalRevenue / succeeded.length : 0;
        const rows = [
            { label: "Toplam Tahsilat (başarılı)", value: `₺${money(totalRevenue)}`, color: "#22c55e" },
            { label: "Başarılı İşlem Sayısı", value: String(succeeded.length), color: "#06b6d4" },
            { label: "Ortalama İşlem Tutarı", value: `₺${money(avg)}`, color: "#a855f7" },
            { label: "Başarısız / İptal", value: String(failed.length), color: "#ef4444" },
        ];
        return (
            <div className="grid md:grid-cols-2 gap-3 animate-in fade-in duration-300">
                {rows.map((r, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
                        <span className="text-sm font-bold text-secondary/70">{r.label}</span>
                        <span className="text-xl font-black" style={{ color: r.color }}>{r.value}</span>
                    </div>
                ))}
            </div>
        );
    }

    // ══════════ AYARLAR ══════════
    if (activeSubTab === "settings") {
        const field = (key: keyof typeof form, label: string, type = "text", ph = "") => (
            <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-secondary/50">{label}</label>
                <input type={type} value={String(form[key])} placeholder={ph}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50" />
            </div>
        );
        return (
            <div className="space-y-4 max-w-2xl animate-in fade-in duration-300">
                <div className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-cyan-400" />
                        <div>
                            <p className="font-bold text-white text-sm">Entegrasyon Aktif</p>
                            <p className="text-[11px] text-secondary/50">Açıksa POS&apos;ta KART ödemesi Ödeal cihazına gider</p>
                        </div>
                    </div>
                    <button onClick={() => setForm({ ...form, active: !form.active })}
                        className={`w-12 h-6 rounded-full relative transition-all ${form.active ? "bg-cyan-500" : "bg-white/10"}`}>
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.active ? "right-1" : "left-1"}`} />
                    </button>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                    {field("publicKey", "Public Key")}
                    {field("secretKey", "Secret Key", "password")}
                    {field("externalDeviceKey", "Cihaz Kodu (externalDeviceKey)", "text", "Cihazdaki Cihazlarım'dan")}
                    {field("paxId", "PaxID")}
                    {field("terminalSerial", "Terminal Seri No")}
                    {field("vkn", "VKN")}
                    {field("username", "Kullanıcı Adı")}
                    {field("password", "Şifre", "password")}
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                    {field("baseUrl", "API Base URL (boş = stage varsayılan)")}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-secondary/50">Ortam</label>
                        <select value={form.environment} onChange={e => setForm({ ...form, environment: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50">
                            <option value="stage" className="bg-slate-900">Stage (Test)</option>
                            <option value="prod" className="bg-slate-900">Production (Canlı)</option>
                        </select>
                    </div>
                </div>

                {msg && (
                    <div className={`p-3 rounded-xl text-sm ${msg.type === "ok" ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300" : "bg-red-500/10 border border-red-500/30 text-red-300"}`}>
                        {msg.text}
                    </div>
                )}

                <div className="flex gap-3 flex-wrap">
                    <button onClick={saveSettings} disabled={saving}
                        className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-black flex items-center gap-2 disabled:opacity-50">
                        {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                        Kaydet
                    </button>
                    <button onClick={registerCallbacks} disabled={registering || !isActive}
                        className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold flex items-center gap-2 disabled:opacity-40">
                        {registering ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                        Callback&apos;leri Ödeal&apos;e Kaydet
                    </button>
                </div>
                <p className="text-[11px] text-secondary/40">
                    Callback kaydı, ödeme sonucunun (başarılı/iptal) otomatik gelmesi içindir. Kaydet&apos;ten sonra bir kez tıklaman yeterli (ilk KART ödemesinde otomatik de yapılır).
                </p>
            </div>
        );
    }

    // ══════════ ÜRÜN EŞLEŞTİRME (Ödeal'de yok) ══════════
    return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-4 animate-in fade-in duration-300">
            <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center border border-cyan-500/20">
                <CreditCard className="w-9 h-9 text-cyan-400/60" />
            </div>
            <div>
                <h3 className="text-2xl font-black text-white mb-1">Ödeal Ödeme Entegrasyonu</h3>
                <p className="text-secondary/50 text-sm max-w-md">Ödeal bir ödeme (POS) entegrasyonudur; ürün eşleştirme gerektirmez. Ayarlar ve işlemler diğer sekmelerde.</p>
            </div>
        </div>
    );
}
