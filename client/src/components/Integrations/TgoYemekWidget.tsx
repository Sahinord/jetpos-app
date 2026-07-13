"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
    RefreshCw, Clock, CheckCircle2, XCircle, ChefHat, Bike,
    PackageCheck, Store, Bell, Loader2, TrendingUp, ShoppingBag, Info,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";
import { apiFetch } from "@/lib/api";

// Uber Eats · Trendyol Go — YEMEK sipariş panosu.
// Yeni sipariş düşünce bildirim (ses + banner), aksiyon butonlarıyla durum akışı.
// activeSubTab: overview (istatistik) / orders (canlı) / finance / settings.

type Order = {
    id: string;
    store_id: string;
    store_name: string | null;
    tgo_order_id: string;
    order_number: string | null;
    customer_name: string | null;
    total_price: number | null;
    tgo_status: string | null;
    status: string;
    is_cancelled: boolean;
    items: unknown[];
    created_at: string;
};

// "mapping" Yemek'te kullanılmaz ama IntegrationsDashboard'ın ortak tab tipiyle
// uyumlu olmak için dahil edildi (Yemek'te hiçbir panele denk gelmez).
type SubTab = "overview" | "orders" | "finance" | "settings" | "mapping";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    new:       { label: "Yeni Sipariş", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
    accepted:  { label: "Kabul Edildi", color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
    preparing: { label: "Hazırlanıyor", color: "#7886C7", bg: "rgba(120,134,199,0.15)" },
    ready:     { label: "Hazır",        color: "#a855f7", bg: "rgba(168,85,247,0.15)" },
    on_way:    { label: "Yolda",        color: "#a855f7", bg: "rgba(168,85,247,0.15)" },
    delivered: { label: "Teslim Edildi", color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
    cancelled: { label: "İptal",        color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
};

const NEXT_ACTIONS: Record<string, Array<{ action: string; label: string }>> = {
    new:       [{ action: "accept", label: "Kabul Et" }, { action: "cancel", label: "İptal" }],
    accepted:  [{ action: "preparing", label: "Hazırla" }, { action: "cancel", label: "İptal" }],
    preparing: [{ action: "ready", label: "Hazırlandı" }],
    ready:     [{ action: "onway", label: "Yola Çıktı" }],
    on_way:    [{ action: "delivered", label: "Teslim Edildi" }],
    delivered: [],
    cancelled: [],
};

const money = (n: number) => (Number(n) || 0).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const timeAgo = (s: string) => {
    const m = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
    if (m < 1) return "az önce";
    if (m < 60) return `${m} dk önce`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} saat önce`;
    return `${Math.floor(h / 24)} gün önce`;
};

function beep() {
    try {
        const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
        if (!Ctx) return;
        const ctx = new Ctx();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = "sine"; o.frequency.value = 880;
        g.gain.setValueAtTime(0.001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        o.start(); o.stop(ctx.currentTime + 0.5);
    } catch { /* sessiz geç */ }
}

export default function TgoYemekWidget({ activeSubTab = "orders" }: { activeSubTab?: SubTab } = {}) {
    const { currentTenant } = useTenant();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [storeFilter, setStoreFilter] = useState<string>("all");
    const [busyId, setBusyId] = useState<string | null>(null);
    const [flash, setFlash] = useState<string | null>(null);
    const seenIds = useRef<Set<string>>(new Set());

    const fetchOrders = useCallback(async () => {
        if (!currentTenant?.id) return;
        try {
            const { data, error } = await supabase
                .from("tgo_yemek_orders")
                .select("id, store_id, store_name, tgo_order_id, order_number, customer_name, total_price, tgo_status, status, is_cancelled, items, created_at")
                .eq("tenant_id", currentTenant.id)
                .order("created_at", { ascending: false })
                .limit(500);
            if (!error && data) {
                setOrders(data as Order[]);
                if (seenIds.current.size === 0) data.forEach(o => seenIds.current.add((o as Order).tgo_order_id));
            }
        } finally {
            setLoading(false);
        }
    }, [currentTenant?.id]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const notifyNew = useCallback((o: Partial<Order>) => {
        if (!o.tgo_order_id || seenIds.current.has(o.tgo_order_id)) return;
        seenIds.current.add(o.tgo_order_id);
        beep();
        setFlash(`🔔 Yeni sipariş — ${o.store_name || "Mağaza"} · #${o.order_number || o.tgo_order_id}`);
        setTimeout(() => setFlash(null), 6000);
        try {
            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
                new Notification("Yeni Yemek Siparişi", { body: `${o.store_name || ""} · ${o.customer_name || ""} · ${money(Number(o.total_price) || 0)} ₺` });
            }
        } catch { /* yoksay */ }
    }, []);

    useEffect(() => {
        if (!currentTenant?.id) return;
        try { if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission(); } catch { /* yoksay */ }
        const ch = supabase
            .channel("tgo_yemek_orders_rt")
            .on("postgres_changes",
                { event: "INSERT", schema: "public", table: "tgo_yemek_orders", filter: `tenant_id=eq.${currentTenant.id}` },
                (payload) => { notifyNew(payload.new as Partial<Order>); fetchOrders(); })
            .on("postgres_changes",
                { event: "UPDATE", schema: "public", table: "tgo_yemek_orders", filter: `tenant_id=eq.${currentTenant.id}` },
                () => fetchOrders())
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [currentTenant?.id, fetchOrders, notifyNew]);

    const sync = useCallback(async () => {
        setSyncing(true);
        try {
            const res = await apiFetch("/api/tgo-yemek/sync-orders", { method: "POST", body: JSON.stringify({}) });
            if (res?.newCount > 0) {
                beep();
                setFlash(`🔔 ${res.newCount} yeni sipariş geldi`);
                setTimeout(() => setFlash(null), 6000);
            }
            await fetchOrders();
        } catch (e: any) {
            setFlash(`Senkron hatası: ${e?.message || "bilinmeyen"}`);
            setTimeout(() => setFlash(null), 5000);
        } finally {
            setSyncing(false);
        }
    }, [fetchOrders]);

    const doAction = useCallback(async (order: Order, action: string) => {
        setBusyId(order.tgo_order_id);
        try {
            await apiFetch("/api/tgo-yemek/order-action", {
                method: "POST",
                body: JSON.stringify({ orderId: order.tgo_order_id, action }),
            });
            await fetchOrders();
        } catch (e: any) {
            setFlash(`İşlem hatası: ${e?.message || "bilinmeyen"}`);
            setTimeout(() => setFlash(null), 5000);
        } finally {
            setBusyId(null);
        }
    }, [fetchOrders]);

    const stores = useMemo(() => {
        const m = new Map<string, string>();
        orders.forEach(o => { if (o.store_id) m.set(o.store_id, o.store_name || o.store_id); });
        return Array.from(m, ([id, name]) => ({ id, name }));
    }, [orders]);

    const visible = useMemo(
        () => orders.filter(o => storeFilter === "all" || o.store_id === storeFilter),
        [orders, storeFilter]
    );

    // İstatistikler (Genel Bakış / Finans)
    const stats = useMemo(() => {
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const active = orders.filter(o => !["delivered", "cancelled"].includes(o.status));
        const delivered = orders.filter(o => o.status === "delivered");
        const revenue = delivered.reduce((s, o) => s + (Number(o.total_price) || 0), 0);
        const todayCount = orders.filter(o => new Date(o.created_at) >= todayStart).length;
        const byStore = new Map<string, { name: string; count: number; active: number; revenue: number }>();
        orders.forEach(o => {
            const k = o.store_id || "?";
            const e = byStore.get(k) || { name: o.store_name || k, count: 0, active: 0, revenue: 0 };
            e.count++;
            if (!["delivered", "cancelled"].includes(o.status)) e.active++;
            if (o.status === "delivered") e.revenue += Number(o.total_price) || 0;
            byStore.set(k, e);
        });
        return { todayCount, activeCount: active.length, revenue, deliveredCount: delivered.length, byStore: Array.from(byStore.values()) };
    }, [orders]);

    const actionIcon = (action: string) => {
        if (action === "accept") return <CheckCircle2 size={15} />;
        if (action === "preparing") return <ChefHat size={15} />;
        if (action === "ready") return <PackageCheck size={15} />;
        if (action === "onway") return <Bike size={15} />;
        if (action === "delivered") return <CheckCircle2 size={15} />;
        if (action === "cancel") return <XCircle size={15} />;
        return null;
    };
    const isCancel = (a: string) => a === "cancel";

    const StatCard = ({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) => (
        <div className="p-4 rounded-2xl bg-primary/5 border border-border">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1">
                <span style={{ color }}>{icon}</span> {label}
            </div>
            <div className="text-2xl font-black text-white">{value}</div>
        </div>
    );

    const OrderCard = ({ o }: { o: Order }) => {
        const st = STATUS_MAP[o.status] || STATUS_MAP.new;
        const actions = NEXT_ACTIONS[o.status] || [];
        const busy = busyId === o.tgo_order_id;
        return (
            <div className="p-4 rounded-xl bg-primary/5 border border-border">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-white">#{o.order_number || o.tgo_order_id}</span>
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold" style={{ color: st.color, background: st.bg }}>{st.label}</span>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1"><Store size={11} /> {o.store_name || o.store_id}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                            {o.customer_name || "Müşteri"} · <span className="text-slate-300 font-semibold">{money(Number(o.total_price))} ₺</span>
                            <span className="text-slate-500"> · <Clock size={11} className="inline -mt-0.5" /> {timeAgo(o.created_at)}</span>
                        </div>
                        {Array.isArray(o.items) && o.items.length > 0 && (
                            <div className="text-[11px] text-slate-500 mt-1 truncate">
                                {o.items.slice(0, 4).map((it: any) => `${it?.quantity || it?.amount || 1}× ${it?.name || it?.productName || "ürün"}`).join(", ")}
                                {o.items.length > 4 ? ` +${o.items.length - 4}` : ""}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {actions.map(a => (
                            <button
                                key={a.action}
                                onClick={() => doAction(o, a.action)}
                                disabled={busy}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${isCancel(a.action)
                                    ? "bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25"
                                    : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25"}`}
                            >
                                {busy ? <Loader2 size={14} className="animate-spin" /> : actionIcon(a.action)}
                                {a.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {flash && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-sm font-semibold animate-pulse">
                    <Bell size={16} /> {flash}
                </div>
            )}

            {/* Üst bar — her sekmede senkron butonu */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="text-xs text-slate-400">
                    {stats.activeCount} aktif · {stores.length} mağaza · bugün {stats.todayCount} sipariş
                </div>
                <button
                    onClick={sync}
                    disabled={syncing}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-300 text-sm font-semibold hover:bg-orange-500/25 transition-all disabled:opacity-50"
                >
                    {syncing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                    {syncing ? "Senkronize ediliyor…" : "Senkronize Et"}
                </button>
            </div>

            {/* GENEL BAKIŞ */}
            {activeSubTab === "overview" && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <StatCard label="Aktif Sipariş" value={String(stats.activeCount)} icon={<ShoppingBag size={14} />} color="#f59e0b" />
                        <StatCard label="Bugün" value={String(stats.todayCount)} icon={<Clock size={14} />} color="#3b82f6" />
                        <StatCard label="Teslim Edilen" value={String(stats.deliveredCount)} icon={<CheckCircle2 size={14} />} color="#22c55e" />
                        <StatCard label="Ciro (teslim)" value={`${money(stats.revenue)} ₺`} icon={<TrendingUp size={14} />} color="#a855f7" />
                    </div>
                    <div className="grid gap-2">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mağaza Bazlı</div>
                        {stats.byStore.length === 0 ? (
                            <div className="text-sm text-slate-500 py-4">Henüz sipariş yok.</div>
                        ) : stats.byStore.map(s => (
                            <div key={s.name} className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-border text-sm">
                                <span className="font-semibold text-white flex items-center gap-2"><Store size={13} className="text-orange-400" /> {s.name}</span>
                                <span className="text-slate-400 text-xs">{s.active} aktif · {s.count} toplam · <span className="text-slate-300 font-semibold">{money(s.revenue)} ₺</span></span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CANLI SİPARİŞLER */}
            {activeSubTab === "orders" && (
                <>
                    {stores.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                onClick={() => setStoreFilter("all")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${storeFilter === "all" ? "bg-orange-500 text-white" : "bg-primary/5 border border-border text-slate-300 hover:bg-primary/10"}`}
                            >Tümü</button>
                            {stores.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => setStoreFilter(s.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${storeFilter === s.id ? "bg-orange-500 text-white" : "bg-primary/5 border border-border text-slate-300 hover:bg-primary/10"}`}
                                >{s.name}</button>
                            ))}
                        </div>
                    )}
                    {loading ? (
                        <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="animate-spin mr-2" size={18} /> Yükleniyor…</div>
                    ) : visible.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 text-sm">
                            Sipariş yok. <span className="text-orange-400">Senkronize Et</span>'e basarak çekebilirsiniz.
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {visible.map(o => <OrderCard key={o.id} o={o} />)}
                        </div>
                    )}
                </>
            )}

            {/* FİNANS */}
            {activeSubTab === "finance" && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <StatCard label="Toplam Ciro (teslim)" value={`${money(stats.revenue)} ₺`} icon={<TrendingUp size={14} />} color="#22c55e" />
                        <StatCard label="Teslim Edilen Sipariş" value={String(stats.deliveredCount)} icon={<CheckCircle2 size={14} />} color="#3b82f6" />
                        <StatCard label="Ort. Sepet" value={`${money(stats.deliveredCount ? stats.revenue / stats.deliveredCount : 0)} ₺`} icon={<ShoppingBag size={14} />} color="#a855f7" />
                    </div>
                    <div className="grid gap-2">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mağaza Bazlı Ciro</div>
                        {stats.byStore.map(s => (
                            <div key={s.name} className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-border text-sm">
                                <span className="font-semibold text-white">{s.name}</span>
                                <span className="text-slate-300 font-semibold">{money(s.revenue)} ₺</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* AYARLAR */}
            {activeSubTab === "settings" && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-border text-sm text-slate-400">
                    <Info size={18} className="text-orange-400 shrink-0 mt-0.5" />
                    <div>
        Bağlantı bilgileri <span className="text-white font-semibold">SuperAdmin → işletme → YEMEK</span> ekranından girilir: <b>Trendyol Go · Uber Eats</b> tek bağlantı (siparişler Uber Eats / Trendyol Yemek diye etiketlenir) + ayrı <b>Getir Yemek</b>. Buradaki panel canlı siparişleri ve durum akışını yönetir.
                    </div>
                </div>
            )}
        </div>
    );
}
