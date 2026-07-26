"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useEmployee } from "@/lib/employee-context";
import { getAppMode } from "@/lib/role-host";
import StaffLoginGate from "@/components/StaffLoginGate";
import EmployeePinGate from "@/components/EmployeePinGate";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";
import {
    Crown, TrendingUp, TrendingDown, Utensils, ChefHat, Users, Wallet,
    ShieldAlert, LogOut, RefreshCw, Plus, Pencil, Power, X, Bike, DollarSign,
} from "lucide-react";

const money = (n: number) => `₺${(Number(n) || 0).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

// tenant scope'unu ayarla (RLS) — her yüklemede güvenli
async function scopeTenant(tenantId: string) {
    try { await supabase.rpc("set_current_tenant", { tenant_id: tenantId }); } catch { /* yok say */ }
}

const ONLINE_MS = 5 * 60 * 1000; // son 5 dk → online

// ─────────────────────────────────────────────────────────────
// ANA SAYFA — erişim kilidi + sekmeler
// ─────────────────────────────────────────────────────────────
export default function PatronPage() {
    const { employee, ready, deviceBound, logout } = useEmployee();
    const mode = typeof window !== "undefined" ? getAppMode() : "full";

    if (!ready) {
        return (
            <div className="min-h-screen min-h-[100dvh] bg-[#020617] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // patron.jetpos.shop'ta cihaz bağlı değilse: işletme kodu + PIN
    if (mode === "patron" && !deviceBound) {
        return <StaffLoginGate title="Patron Girişi" />;
    }

    const role = (employee?.position || employee?.role || "").toLowerCase();
    const allowed = !!employee && (
        ["patron", "owner", "işletme sahibi", "isletme sahibi", "müdür", "mudur", "manager", "yönetici", "yonetici"].some(r => role.includes(r)) ||
        employee?.permissions?.can_manage_employees === true ||
        employee?.permissions?.["*"] === true
    );

    // Oturumu olan ama yetkisi olmayan personel
    if (employee && !allowed) {
        return (
            <div className="min-h-screen min-h-[100dvh] bg-[#020617] flex items-center justify-center p-6">
                <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 max-w-sm text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                        <ShieldAlert className="w-8 h-8 text-rose-400" />
                    </div>
                    <h1 className="text-xl font-black text-white">Patron Paneli Kapalı</h1>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        <span className="text-white font-bold">{employee.name}</span> için bu bölüm yalnızca patron/müdür yetkisiyle açılır.
                    </p>
                    <button onClick={logout} className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-300 font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
                        <LogOut className="w-4 h-4" /> Çıkış / Personel Değiştir
                    </button>
                </div>
            </div>
        );
    }

    // Oturum yok:
    //  - patron host → PIN iste
    //  - full mod (uygulama içinden sidebar) → sahibinin cihazı, doğrudan geç
    if (!employee && mode === "patron") {
        return <EmployeePinGate title="Patron" />;
    }

    return <PatronPanel />;
}

// ─────────────────────────────────────────────────────────────
type Tab = "ozet" | "personel" | "performans";

function PatronPanel() {
    const { logout } = useEmployee();
    const [tab, setTab] = useState<Tab>("ozet");
    const tenantId = typeof window !== "undefined" ? localStorage.getItem("tenantId") || "" : "";
    const company = typeof window !== "undefined" ? localStorage.getItem("companyName") || "İşletmem" : "İşletmem";

    return (
        <div className="min-h-screen min-h-[100dvh] bg-[#020617] text-white pb-28">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-[#020617]/95 backdrop-blur-xl border-b border-white/[0.06] px-5 pt-6 pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                            <Crown className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-lg font-black tracking-tight truncate">{company}</h1>
                            <p className="text-[10px] text-amber-400/80 font-bold uppercase tracking-[2px]">Patron Paneli</p>
                        </div>
                    </div>
                    <button onClick={logout} title="Çıkış"
                        className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-rose-400 active:scale-90 transition-all">
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>

                {/* Sekmeler */}
                <div className="flex gap-1 mt-4 bg-white/[0.03] p-1 rounded-2xl">
                    {([["ozet", "Özet"], ["personel", "Personel"], ["performans", "Performans"]] as [Tab, string][]).map(([k, label]) => (
                        <button key={k} onClick={() => setTab(k)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${tab === k ? "bg-amber-500/15 text-amber-300 border border-amber-500/20" : "text-slate-400"}`}>
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-5 pt-5">
                {tab === "ozet" && <OzetTab tenantId={tenantId} />}
                {tab === "personel" && <PersonelTab tenantId={tenantId} />}
                {tab === "performans" && <PerformansTab tenantId={tenantId} />}
            </div>

            <BottomNav />
        </div>
    );
}

// ═════════════════════════════════════════════════════════════
// SEKME 1 — ÖZET (canlı gözetim)
// ═════════════════════════════════════════════════════════════
function OzetTab({ tenantId }: { tenantId: string }) {
    const [loading, setLoading] = useState(true);
    const [d, setD] = useState({
        salesToday: 0, salesYesterday: 0, orderCount: 0,
        tablesTotal: 0, tablesOccupied: 0,
        kitchenQueue: 0, onlineStaff: [] as { id: string; name: string }[],
        deliveryActive: 0,
    });

    const load = useCallback(async () => {
        if (!tenantId) { setLoading(false); return; }
        setLoading(true);
        await scopeTenant(tenantId);

        const startToday = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
        const startYest = new Date(new Date(new Date().setDate(new Date().getDate() - 1)).setHours(0, 0, 0, 0)).toISOString();
        const endYest = new Date(new Date(new Date().setDate(new Date().getDate() - 1)).setHours(23, 59, 59, 999)).toISOString();

        // Ciro (invoices — dashboard ile aynı kaynak)
        let salesToday = 0, salesYesterday = 0, orderCount = 0;
        try {
            const { data: inv } = await supabase.from("invoices")
                .select("grand_total, created_at")
                .eq("tenant_id", tenantId)
                .in("invoice_type", ["sales", "retail"])
                .gte("created_at", startYest);
            for (const r of inv || []) {
                const t = Number(r.grand_total) || 0;
                if (r.created_at >= startToday) { salesToday += t; orderCount++; }
                else if (r.created_at >= startYest && r.created_at <= endYest) salesYesterday += t;
            }
        } catch { /* yok say */ }

        // Masalar
        let tablesTotal = 0, tablesOccupied = 0;
        try {
            const { data: tbl } = await supabase.from("restaurant_tables")
                .select("id, status").eq("tenant_id", tenantId);
            tablesTotal = (tbl || []).length;
            tablesOccupied = (tbl || []).filter((t: any) => t.status === "occupied").length;
        } catch { /* yok say */ }

        // Mutfak kuyruğu
        let kitchenQueue = 0;
        try {
            const { count } = await supabase.from("kitchen_orders")
                .select("id", { count: "exact", head: true })
                .eq("tenant_id", tenantId)
                .in("status", ["new", "pending", "preparing", "hazirlaniyor", "beklemede"]);
            kitchenQueue = count || 0;
        } catch { /* yok say */ }

        // Online personel (last_seen son 5 dk)
        let onlineStaff: { id: string; name: string }[] = [];
        try {
            const since = new Date(Date.now() - ONLINE_MS).toISOString();
            const { data: emp } = await supabase.from("employees")
                .select("id, first_name, last_name, last_seen")
                .eq("tenant_id", tenantId)
                .gte("last_seen", since);
            onlineStaff = (emp || []).map((e: any) => ({ id: e.id, name: `${e.first_name || ""} ${e.last_name || ""}`.trim() || "Personel" }));
        } catch { /* yok say */ }

        // Canlı yemek siparişleri (best-effort; tablo yoksa yok sayılır)
        let deliveryActive = 0;
        for (const t of ["yemeksepeti_orders", "getir_orders", "tgo_food_orders"]) {
            try {
                const { count } = await supabase.from(t as any)
                    .select("id", { count: "exact", head: true })
                    .eq("tenant_id", tenantId)
                    .in("status", ["new", "pending", "preparing", "accepted", "created", "verildi", "hazirlaniyor"]);
                deliveryActive += count || 0;
            } catch { /* tablo yok — yok say */ }
        }

        setD({ salesToday, salesYesterday, orderCount, tablesTotal, tablesOccupied, kitchenQueue, onlineStaff, deliveryActive });
        setLoading(false);
    }, [tenantId]);

    useEffect(() => { load(); const iv = setInterval(load, 30000); return () => clearInterval(iv); }, [load]);

    const delta = d.salesYesterday > 0 ? Math.round(((d.salesToday - d.salesYesterday) / d.salesYesterday) * 100) : null;

    if (loading) return <PanelSpinner />;

    return (
        <div className="space-y-4">
            {/* Ciro — büyük kart */}
            <div className="rounded-3xl p-5 bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/15">
                <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-[2px] text-amber-400/80">Bugünkü Ciro</p>
                    <button onClick={load} className="text-slate-500 active:scale-90"><RefreshCw className="w-3.5 h-3.5" /></button>
                </div>
                <p className="text-4xl font-black mt-1 tracking-tight">{money(d.salesToday)}</p>
                <div className="flex items-center gap-2 mt-2 text-xs">
                    {delta === null ? (
                        <span className="text-slate-500">Düne göre veri yok</span>
                    ) : (
                        <span className={`flex items-center gap-1 font-bold ${delta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {delta >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            %{Math.abs(delta)} <span className="text-slate-500 font-medium">düne göre</span>
                        </span>
                    )}
                    <span className="text-slate-500">· {d.orderCount} satış</span>
                </div>
            </div>

            {/* Küçük kartlar */}
            <div className="grid grid-cols-2 gap-3">
                <MiniCard icon={Utensils} color="cyan" label="Aktif Masa" value={`${d.tablesOccupied}/${d.tablesTotal || "—"}`} sub="dolu / toplam" />
                <MiniCard icon={ChefHat} color="orange" label="Mutfak Kuyruğu" value={String(d.kitchenQueue)} sub="bekleyen sipariş" />
                <MiniCard icon={Bike} color="rose" label="Canlı Yemek" value={String(d.deliveryActive)} sub="paket sipariş" />
                <MiniCard icon={Users} color="emerald" label="Online Personel" value={String(d.onlineStaff.length)} sub="son 5 dk" />
            </div>

            {/* Online personel listesi */}
            {d.onlineStaff.length > 0 && (
                <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/[0.06]">
                    <p className="text-[10px] font-bold uppercase tracking-[2px] text-slate-500 mb-3">Şu An Çalışan</p>
                    <div className="flex flex-wrap gap-2">
                        {d.onlineStaff.map(s => (
                            <div key={s.id} className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/15">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-xs font-bold text-emerald-200">{s.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function MiniCard({ icon: Icon, color, label, value, sub }: any) {
    const colors: any = {
        cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/15",
        orange: "text-orange-400 bg-orange-500/10 border-orange-500/15",
        rose: "text-rose-400 bg-rose-500/10 border-rose-500/15",
        emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/15",
    };
    return (
        <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/[0.06]">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${colors[color]}`}>
                <Icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black mt-3 tracking-tight">{value}</p>
            <p className="text-[11px] font-bold text-slate-300 mt-0.5">{label}</p>
            <p className="text-[10px] text-slate-500">{sub}</p>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════
// SEKME 2 — PERSONEL YÖNETİMİ
// ═════════════════════════════════════════════════════════════
const POSITIONS = ["Garson", "Mutfak", "Kasiyer", "Müdür", "Patron"];
const PERM_LABELS: [string, string][] = [
    ["can_access_pos", "Satış (POS)"],
    ["can_access_adisyon", "Adisyon"],
    ["can_access_inventory", "Ürün / Stok"],
    ["can_access_reports", "Raporlar / Kasa"],
    ["can_access_crm", "Cari"],
    ["can_access_settings", "Ayarlar"],
    ["can_manage_invoices", "Faturalar"],
    ["can_manage_employees", "Personel Yönetimi"],
    ["can_apply_discount", "İndirim"],
    ["can_delete_sales", "Satış İptali"],
];
// Role göre varsayılan yetki
function defaultPerms(pos: string) {
    const p = pos.toLowerCase();
    const base: any = {};
    for (const [k] of PERM_LABELS) base[k] = false;
    if (p === "garson") { base.can_access_pos = true; base.can_access_adisyon = true; }
    else if (p === "mutfak") { base.can_access_adisyon = true; }
    else if (p === "kasiyer") { base.can_access_pos = true; base.can_apply_discount = true; }
    else if (p === "müdür" || p === "mudur") { for (const [k] of PERM_LABELS) base[k] = true; }
    else if (p === "patron") { for (const [k] of PERM_LABELS) base[k] = true; }
    return base;
}

const emptyForm = () => ({
    id: "", first_name: "", last_name: "", position: "Garson",
    pin_code: "", status: "active" as "active" | "inactive",
    permissions: defaultPerms("Garson"),
});

function PersonelTab({ tenantId }: { tenantId: string }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [list, setList] = useState<any[]>([]);
    const [staffCode, setStaffCode] = useState<string>("");
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState<any>(emptyForm());

    const load = useCallback(async () => {
        if (!tenantId) { setLoading(false); return; }
        setLoading(true);
        await scopeTenant(tenantId);
        try {
            const { data } = await supabase.from("employees")
                .select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
            setList(data || []);
        } catch { /* yok say */ }
        try {
            const { data: t } = await supabase.from("tenants").select("staff_code").eq("id", tenantId).single();
            if (t?.staff_code) setStaffCode(t.staff_code);
        } catch { /* yok say */ }
        setLoading(false);
    }, [tenantId]);

    useEffect(() => { load(); }, [load]);

    const openNew = () => { setForm(emptyForm()); setModal(true); };
    const openEdit = (e: any) => {
        setForm({
            id: e.id, first_name: e.first_name || "", last_name: e.last_name || "",
            position: e.position || "Garson", pin_code: e.pin_code || "",
            status: e.status === "inactive" ? "inactive" : "active",
            permissions: { ...defaultPerms(e.position || "Garson"), ...(e.permissions || {}) },
        });
        setModal(true);
    };

    const save = async () => {
        if (!form.first_name.trim() || !form.last_name.trim()) { toast.error("Ad ve soyad zorunlu"); return; }
        if (!/^\d{4,6}$/.test(String(form.pin_code || ""))) { toast.error("PIN 4-6 haneli olmalı"); return; }
        setSaving(true);
        await scopeTenant(tenantId);
        const payload: any = {
            first_name: form.first_name.trim(), last_name: form.last_name.trim(),
            position: form.position, pin_code: String(form.pin_code),
            status: form.status, permissions: form.permissions, tenant_id: tenantId,
        };
        try {
            if (form.id) {
                const { error } = await supabase.from("employees").update(payload).eq("id", form.id).eq("tenant_id", tenantId);
                if (error) throw error;
                toast.success("Personel güncellendi");
            } else {
                const { error } = await supabase.from("employees").insert([payload]);
                if (error) throw error;
                toast.success("Personel eklendi");
            }
            setModal(false);
            await load();
        } catch (e: any) {
            toast.error(e?.message || "Kaydedilemedi");
        } finally { setSaving(false); }
    };

    const toggleActive = async (e: any) => {
        await scopeTenant(tenantId);
        const next = e.status === "inactive" ? "active" : "inactive";
        try {
            await supabase.from("employees").update({ status: next }).eq("id", e.id).eq("tenant_id", tenantId);
            await load();
        } catch (err: any) { toast.error(err?.message || "Güncellenemedi"); }
    };

    if (loading) return <PanelSpinner />;

    return (
        <div className="space-y-4">
            {/* İşletme kodu */}
            {staffCode && (
                <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[2px] text-slate-500">İşletme Kodu</p>
                        <p className="text-xl font-black tracking-[3px] text-amber-300 mt-0.5">{staffCode}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Personel bu kodla cihazını bağlar, sonra sadece PIN girer.</p>
                    </div>
                    <button onClick={() => { navigator.clipboard?.writeText(staffCode); toast.success("Kopyalandı"); }}
                        className="text-xs font-bold text-amber-300 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/15 active:scale-95">Kopyala</button>
                </div>
            )}

            <button onClick={openNew}
                className="w-full py-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/25 text-amber-300 font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
                <Plus className="w-4 h-4" /> Personel Ekle
            </button>

            <div className="space-y-2">
                {list.length === 0 && <p className="text-center text-sm text-slate-500 py-8">Henüz personel yok.</p>}
                {list.map(e => {
                    const inactive = e.status === "inactive";
                    return (
                        <div key={e.id} className={`rounded-2xl p-4 border flex items-center gap-3 ${inactive ? "bg-white/[0.01] border-white/[0.04] opacity-60" : "bg-white/[0.03] border-white/[0.06]"}`}>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-500/15 flex items-center justify-center text-sm font-black text-amber-300 flex-shrink-0">
                                {(e.first_name?.[0] || "").toUpperCase()}{(e.last_name?.[0] || "").toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-bold text-sm truncate">{e.first_name} {e.last_name}</p>
                                <p className="text-[11px] text-slate-400">{e.position || "—"}{inactive && " · pasif"}</p>
                            </div>
                            <button onClick={() => toggleActive(e)} title={inactive ? "Aktifleştir" : "Pasife çek"}
                                className={`w-9 h-9 rounded-xl flex items-center justify-center border active:scale-90 transition-all ${inactive ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/15" : "text-slate-400 bg-white/5 border-white/10"}`}>
                                <Power className="w-4 h-4" />
                            </button>
                            <button onClick={() => openEdit(e)}
                                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 active:scale-90 transition-all">
                                <Pencil className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Ekle/Düzenle modalı */}
            {modal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setModal(false)}>
                    <div onClick={ev => ev.stopPropagation()}
                        className="bg-[#0a0f1e] border border-white/10 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto">
                        <div className="sticky top-0 bg-[#0a0f1e] px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                            <h2 className="font-black">{form.id ? "Personeli Düzenle" : "Yeni Personel"}</h2>
                            <button onClick={() => setModal(false)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Ad"><input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} className={inputCls} /></Field>
                                <Field label="Soyad"><input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} className={inputCls} /></Field>
                            </div>
                            <Field label="Rol">
                                <select value={form.position}
                                    onChange={e => setForm({ ...form, position: e.target.value, permissions: defaultPerms(e.target.value) })}
                                    className={inputCls}>
                                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </Field>
                            <Field label="PIN (4-6 hane)">
                                <input value={form.pin_code} inputMode="numeric"
                                    onChange={e => setForm({ ...form, pin_code: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                                    className={`${inputCls} tracking-[4px] font-mono`} placeholder="••••" />
                            </Field>

                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[2px] text-slate-500 mb-2">Yetkiler</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {PERM_LABELS.map(([k, label]) => {
                                        const on = form.permissions?.[k] === true;
                                        return (
                                            <button key={k} type="button"
                                                onClick={() => setForm({ ...form, permissions: { ...form.permissions, [k]: !on } })}
                                                className={`text-left px-3 py-2.5 rounded-xl border text-[11px] font-bold transition-all ${on ? "bg-amber-500/15 border-amber-500/25 text-amber-200" : "bg-white/[0.02] border-white/[0.06] text-slate-400"}`}>
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <button onClick={save} disabled={saving}
                                className="w-full py-3.5 rounded-2xl bg-amber-500 text-black font-black flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all">
                                {saving ? "Kaydediliyor…" : "Kaydet"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const inputCls = "w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500/40";
function Field({ label, children }: any) {
    return (
        <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-slate-500 block mb-1.5">{label}</span>
            {children}
        </label>
    );
}

// ═════════════════════════════════════════════════════════════
// SEKME 3 — PERSONEL PERFORMANSI (garson metrikleri)
// ═════════════════════════════════════════════════════════════
function PerformansTab({ tenantId }: { tenantId: string }) {
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<any[]>([]);

    const load = useCallback(async () => {
        if (!tenantId) { setLoading(false); return; }
        setLoading(true);
        await scopeTenant(tenantId);
        const startToday = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
        const since = new Date(Date.now() - ONLINE_MS).toISOString();

        // Personel
        const byId: Record<string, any> = {};
        try {
            const { data: emp } = await supabase.from("employees")
                .select("id, first_name, last_name, position, last_seen, status")
                .eq("tenant_id", tenantId);
            for (const e of emp || []) {
                byId[e.id] = {
                    id: e.id, name: `${e.first_name || ""} ${e.last_name || ""}`.trim() || "Personel",
                    position: e.position || "", online: e.last_seen ? e.last_seen >= since : false,
                    tables: new Set<string>(), orders: 0, activeTables: 0, openTotal: 0, revenue: 0,
                };
            }
        } catch { /* yok say */ }

        const ensure = (id: string) => {
            if (!id) return null;
            if (!byId[id]) byId[id] = { id, name: "Bilinmeyen", position: "", online: false, tables: new Set<string>(), orders: 0, activeTables: 0, openTotal: 0, revenue: 0 };
            return byId[id];
        };

        // Bugünkü order_groups → masa & sipariş sayısı
        try {
            const { data: og } = await supabase.from("order_groups")
                .select("waiter_id, table_id, created_at")
                .eq("tenant_id", tenantId)
                .gte("created_at", startToday);
            for (const g of og || []) {
                const r = ensure(g.waiter_id); if (!r) continue;
                r.orders++;
                if (g.table_id) r.tables.add(g.table_id);
            }
        } catch { /* yok say */ }

        // Şu an dolu masalar → aktif masa + açık hesap toplamı
        try {
            const { data: tbl } = await supabase.from("restaurant_tables")
                .select("id, assigned_waiter_id, status")
                .eq("tenant_id", tenantId).eq("status", "occupied");
            const occ = tbl || [];
            const tableWaiter: Record<string, string> = {};
            for (const t of occ) {
                const r = ensure(t.assigned_waiter_id);
                if (r) { r.activeTables++; tableWaiter[t.id] = t.assigned_waiter_id; }
            }
            // Açık masaların table_orders toplamı
            const ids = occ.map((t: any) => t.id);
            if (ids.length) {
                const { data: ords } = await supabase.from("table_orders")
                    .select("table_id, quantity, unit_price")
                    .eq("tenant_id", tenantId).in("table_id", ids);
                for (const o of ords || []) {
                    const wid = tableWaiter[o.table_id];
                    const r = wid ? byId[wid] : null;
                    if (r) r.openTotal += (Number(o.quantity) || 0) * (Number(o.unit_price) || 0);
                }
            }
        } catch { /* yok say */ }

        // Bugünkü faturalar → garson başına günlük ciro (invoices.employee_id).
        // employee_id kolonu yoksa (migration çalışmadıysa) sessizce atlanır.
        try {
            const { data: inv } = await supabase.from("invoices")
                .select("employee_id, grand_total, created_at")
                .eq("tenant_id", tenantId)
                .gte("created_at", startToday);
            for (const i of (inv || []) as any[]) {
                const r = i.employee_id ? byId[i.employee_id] : null;
                if (r) r.revenue += Number(i.grand_total) || 0;
            }
        } catch { /* yok say */ }

        const arr = Object.values(byId)
            .map((r: any) => ({ ...r, tablesServed: r.tables.size }))
            // sadece bugün aktivitesi olan ya da online olanları öne al
            .sort((a: any, b: any) => (b.orders + b.activeTables) - (a.orders + a.activeTables) || b.openTotal - a.openTotal);
        setRows(arr);
        setLoading(false);
    }, [tenantId]);

    useEffect(() => { load(); const iv = setInterval(load, 30000); return () => clearInterval(iv); }, [load]);

    if (loading) return <PanelSpinner />;

    const maxOrders = Math.max(1, ...rows.map(r => r.orders));
    const withActivity = rows.filter(r => r.orders > 0 || r.activeTables > 0 || r.online || r.revenue > 0);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[2px] text-slate-500">Bugünkü Performans</p>
                <button onClick={load} className="text-slate-500 active:scale-90"><RefreshCw className="w-3.5 h-3.5" /></button>
            </div>

            {withActivity.length === 0 && (
                <p className="text-center text-sm text-slate-500 py-10">Bugün henüz aktivite yok.</p>
            )}

            {withActivity.map(r => (
                <div key={r.id} className="rounded-2xl p-4 bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-600/10 border border-cyan-500/15 flex items-center justify-center text-xs font-black text-cyan-300 flex-shrink-0">
                            {r.name.split(" ").map((x: string) => x[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm truncate flex items-center gap-2">
                                {r.name}
                                {r.online && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />}
                            </p>
                            <p className="text-[10px] text-slate-500">{r.position || "—"}</p>
                        </div>
                        {(r.revenue > 0 || r.openTotal > 0) && (
                            <div className="text-right flex-shrink-0">
                                {r.revenue > 0 ? (
                                    <>
                                        <p className="text-sm font-black text-emerald-300">{money(r.revenue)}</p>
                                        <p className="text-[9px] text-slate-500 uppercase tracking-wide">bugünkü ciro</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm font-black text-amber-300">{money(r.openTotal)}</p>
                                        <p className="text-[9px] text-slate-500 uppercase tracking-wide">açık hesap</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* metrikler */}
                    <div className="grid grid-cols-3 gap-2 mt-3">
                        <Metric label="Masa" value={r.tablesServed} />
                        <Metric label="Sipariş" value={r.orders} />
                        <Metric label="Aktif Masa" value={r.activeTables} />
                    </div>

                    {/* sipariş bar */}
                    <div className="mt-3 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${(r.orders / maxOrders) * 100}%` }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

function Metric({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] py-2 text-center">
            <p className="text-lg font-black tracking-tight">{value}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wide">{label}</p>
        </div>
    );
}

function PanelSpinner() {
    return (
        <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );
}
