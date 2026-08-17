"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
    RefreshCw, Search, ShoppingBag, Clock, ChefHat, Package,
    Truck, CheckCircle2, XCircle, Bell, BellOff, Volume2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";
import { apiFetch } from "@/lib/api";

// ══════════════════════════════════════════════════════════════════════
//  BİRLEŞİK CANLI SİPARİŞ PANOSU
//  Getir Çarşı + Trendyol GO + Yemek (Trendyol/Uber/Getir) siparişlerini
//  TEK ekranda toplar. Her kanal LİSANSA (tenant.features) göre gösterilir:
//  ilgili feature açık değilse o kanal hiç yüklenmez / yönetilemez.
//  Yeni sipariş sesi + realtime + kanal bazlı aksiyon (onayla/hazırla/…).
// ══════════════════════════════════════════════════════════════════════

// Ortak sipariş modeli
type Stage = "pending" | "preparing" | "ready" | "onway" | "delivered" | "cancelled";
interface UniOrder {
    uid: string;             // channelKey + id (React key)
    channelKey: string;      // getir | trendyol_go | tgo_yemek
    channelLabel: string;
    color: string;           // kanal rengi
    id: string;              // aksiyon için sipariş kimliği
    orderNo: string;
    customer: string;
    total: number;
    itemsCount: number;
    createdAt: string;
    stage: Stage;
    statusLabel: string;
    raw: any;
}

interface ChannelDef {
    key: string;
    feature: string;         // tenant.features anahtarı
    label: string;
    color: string;
    table: string;
    orderIdField: string;    // aksiyon route'una gönderilecek id alanı
    normalize: (row: any) => Omit<UniOrder, "uid" | "channelKey" | "channelLabel" | "color">;
    nextActions: (o: UniOrder) => { label: string; action: string; cls: string }[];
    sync: (tenantId: string) => Promise<any>;
    doAction: (tenantId: string, o: UniOrder, action: string) => Promise<any>;
}

const STAGE_META: Record<Stage, { label: string; color: string; bg: string; icon: any }> = {
    pending: { label: "Onay Bekliyor", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: Clock },
    preparing: { label: "Hazırlanıyor", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", icon: ChefHat },
    ready: { label: "Hazır", color: "#3b82f6", bg: "rgba(59,130,246,0.12)", icon: Package },
    onway: { label: "Yolda", color: "#a855f7", bg: "rgba(168,85,247,0.12)", icon: Truck },
    delivered: { label: "Teslim Edildi", color: "#22c55e", bg: "rgba(34,197,94,0.12)", icon: CheckCircle2 },
    cancelled: { label: "İptal", color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: XCircle },
};

// ── Getir Çarşı statü kodu → stage ──
const getirStage = (code: number | null, cancelled: boolean): Stage => {
    if (cancelled || code === 1500 || code === 1600) return "cancelled";
    if (code === 900) return "delivered";
    if (code === 600 || code === 700 || code === 550 || code === 560 || code === 570) return "onway";
    if (code === 500) return "preparing";
    return "pending";
};

// ── Trendyol GO paket statüsü → stage ──
const tgoStage = (s: string): Stage => {
    const x = (s || "").toLowerCase();
    if (["cancelled", "unsupplied"].includes(x)) return "cancelled";
    if (x === "delivered") return "delivered";
    if (x === "shipped") return "onway";
    if (x === "invoiced") return "ready";
    if (["picking", "picked", "packing", "readyforcollection"].includes(x)) return "preparing";
    return "pending";
};

// ── Yemek (tgo_yemek) iç statüsü → stage ──
const yemekStage = (s: string): Stage => {
    const x = (s || "new").toLowerCase();
    if (x === "cancelled") return "cancelled";
    if (x === "delivered") return "delivered";
    if (x === "on_way") return "onway";
    if (x === "ready") return "ready";
    if (["accepted", "preparing"].includes(x)) return "preparing";
    return "pending";
};

const itemsLen = (v: any) => (Array.isArray(v) ? v.length : 0);

// ── KANAL KAYIT DEFTERİ ──
const CHANNELS: ChannelDef[] = [
    {
        key: "getir", feature: "getir", label: "Getir Çarşı", color: "#7C3AED",
        table: "getir_carsi_orders", orderIdField: "getir_order_id",
        normalize: (r) => {
            const stage = getirStage(r.getir_status_code, r.is_cancelled);
            return {
                id: r.getir_order_id, orderNo: r.order_number || String(r.getir_order_id).slice(-8),
                customer: r.customer_name || "Müşteri", total: Number(r.total_price) || 0,
                itemsCount: itemsLen(r.items), createdAt: r.created_at, stage,
                statusLabel: STAGE_META[stage].label, raw: r,
            };
        },
        nextActions: (o) => {
            const dt = o.raw.delivery_type || 1;
            if (o.stage === "pending") return [{ label: "Onayla", action: "verify", cls: "bg-emerald-500 hover:bg-emerald-600" }, { label: "İptal", action: "cancel", cls: "bg-rose-500/80 hover:bg-rose-600" }];
            if (o.stage === "preparing") return [{ label: "Hazırla", action: "prepare", cls: "bg-violet-500 hover:bg-violet-600" }];
            if (o.stage === "onway" || o.raw.getir_status_code === 550) return dt === 2 ? [{ label: "Müşteriye Teslim", action: "deliver", cls: "bg-blue-500 hover:bg-blue-600" }] : [{ label: "Kuryeye Teslim", action: "handover", cls: "bg-blue-500 hover:bg-blue-600" }];
            return [];
        },
        sync: (tenantId) => apiFetch("/api/getir-carsi/sync-orders", { method: "POST", body: JSON.stringify({}) }),
        doAction: (tenantId, o, action) => apiFetch("/api/getir-carsi/order-action", { method: "POST", body: JSON.stringify({ orderId: o.id, action }) }),
    },
    {
        key: "trendyol_go", feature: "trendyol_go", label: "Trendyol GO", color: "#F97316",
        table: "trendyol_go_orders", orderIdField: "order_number",
        normalize: (r) => {
            const stage = tgoStage(r.status);
            return {
                id: r.order_number, orderNo: r.order_number, customer: r.customer_name || "Müşteri",
                total: Number(r.total_price) || 0, itemsCount: itemsLen(r.items), createdAt: r.created_at,
                stage, statusLabel: STAGE_META[stage].label, raw: r,
            };
        },
        nextActions: (o) => {
            if (o.stage === "pending") return [{ label: "Onayla / Topla", action: "accept", cls: "bg-emerald-500 hover:bg-emerald-600" }];
            if (o.stage === "preparing") return [{ label: "Faturala / Hazır", action: "invoiced", cls: "bg-blue-500 hover:bg-blue-600" }];
            if (o.stage === "ready") return [{ label: "Kargola", action: "shipped", cls: "bg-purple-500 hover:bg-purple-600" }];
            return [];
        },
        sync: (tenantId) => apiFetch(`/api/trendyol/sync-orders?tenantId=${tenantId}`, { method: "POST" }),
        doAction: (tenantId, o, action) => apiFetch("/api/trendyol/order-action", { method: "POST", body: JSON.stringify({ tenantId, orderNumber: o.id, action }) }),
    },
    {
        key: "tgo_yemek", feature: "tgo_yemek", label: "Yemek (TY·Uber·Getir)", color: "#EF4444",
        table: "tgo_yemek_orders", orderIdField: "tgo_order_id",
        normalize: (r) => {
            const stage = yemekStage(r.status);
            return {
                id: r.tgo_order_id, orderNo: r.order_number || String(r.tgo_order_id).slice(-8),
                customer: r.customer_name || "Müşteri", total: Number(r.total_price) || 0,
                itemsCount: itemsLen(r.items), createdAt: r.created_at, stage,
                statusLabel: r.store_name ? `${STAGE_META[stage].label}` : STAGE_META[stage].label, raw: r,
            };
        },
        nextActions: (o) => {
            if (o.stage === "pending") return [{ label: "Kabul Et", action: "accept", cls: "bg-emerald-500 hover:bg-emerald-600" }, { label: "İptal", action: "cancel", cls: "bg-rose-500/80 hover:bg-rose-600" }];
            if (o.stage === "preparing") return [{ label: "Hazırlandı", action: "ready", cls: "bg-blue-500 hover:bg-blue-600" }];
            if (o.stage === "ready") return [{ label: "Yola Çıktı", action: "onway", cls: "bg-purple-500 hover:bg-purple-600" }];
            if (o.stage === "onway") return [{ label: "Teslim Edildi", action: "delivered", cls: "bg-green-500 hover:bg-green-600" }];
            return [];
        },
        sync: (tenantId) => apiFetch("/api/tgo-yemek/sync-orders", { method: "POST", body: JSON.stringify({}) }),
        doAction: (tenantId, o, action) => apiFetch("/api/tgo-yemek/order-action", { method: "POST", body: JSON.stringify({ orderId: o.id, action }) }),
    },
];

const money = (n: number) => (Number(n) || 0).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const timeAgo = (s: string) => {
    const m = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
    if (m < 1) return "az önce";
    if (m < 60) return `${m} dk`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} sa`;
    return `${Math.floor(h / 24)} gün`;
};

export default function LiveOrdersBoard() {
    const { currentTenant } = useTenant();
    const features = (currentTenant?.features || {}) as Record<string, any>;

    // Lisansta açık kanallar
    const activeChannels = useMemo(
        () => CHANNELS.filter(c => features[c.feature] === true),
        [currentTenant?.id] // features aynı tenant'ta sabit
    );

    const [ordersByCh, setOrdersByCh] = useState<Record<string, UniOrder[]>>({});
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [chFilter, setChFilter] = useState<string>("all");
    const [stageFilter, setStageFilter] = useState<Stage | "all">("all");
    const [search, setSearch] = useState("");
    const [busyId, setBusyId] = useState<string | null>(null);
    const [flash, setFlash] = useState<string | null>(null);
    const [soundOn, setSoundOn] = useState(true);
    const seenIds = useRef<Set<string>>(new Set());
    const firstLoad = useRef(true);

    const beep = useCallback(() => {
        if (!soundOn) return;
        try {
            const AC = (window.AudioContext || (window as any).webkitAudioContext);
            if (!AC) return;
            const ctx = new AC();
            [880, 1175].forEach((f, i) => {
                const o = ctx.createOscillator(), g = ctx.createGain();
                o.connect(g); g.connect(ctx.destination); o.type = "sine"; o.frequency.value = f;
                const t = ctx.currentTime + i * 0.18;
                g.gain.setValueAtTime(0.0001, t);
                g.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
                g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
                o.start(t); o.stop(t + 0.34);
            });
        } catch { /* yut */ }
    }, [soundOn]);

    const fetchChannel = useCallback(async (ch: ChannelDef) => {
        if (!currentTenant?.id) return [];
        const { data, error } = await supabase
            .from(ch.table)
            .select("*")
            .eq("tenant_id", currentTenant.id)
            .order("created_at", { ascending: false })
            .limit(200);
        if (error || !data) return [];
        return data.map(r => {
            const n = ch.normalize(r);
            return { ...n, uid: `${ch.key}:${n.id}`, channelKey: ch.key, channelLabel: ch.label, color: ch.color } as UniOrder;
        });
    }, [currentTenant?.id]);

    const fetchAll = useCallback(async (notify = false) => {
        if (activeChannels.length === 0) { setLoading(false); return; }
        const results = await Promise.all(activeChannels.map(async ch => [ch.key, await fetchChannel(ch)] as const));
        const map: Record<string, UniOrder[]> = {};
        let newCount = 0;
        for (const [key, list] of results) {
            map[key] = list;
            for (const o of list) {
                if (!seenIds.current.has(o.uid)) {
                    if (!firstLoad.current && o.stage === "pending") newCount++;
                    seenIds.current.add(o.uid);
                }
            }
        }
        setOrdersByCh(map);
        setLoading(false);
        firstLoad.current = false;
        if (notify && newCount > 0) {
            beep();
            setFlash(`🔔 ${newCount} yeni sipariş geldi`);
            setTimeout(() => setFlash(null), 6000);
        }
    }, [activeChannels, fetchChannel, beep]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // Realtime: her açık kanal tablosunu dinle
    useEffect(() => {
        if (!currentTenant?.id || activeChannels.length === 0) return;
        const channels = activeChannels.map(ch =>
            supabase.channel(`live_${ch.key}_${currentTenant.id}`)
                .on("postgres_changes", { event: "*", schema: "public", table: ch.table, filter: `tenant_id=eq.${currentTenant.id}` }, () => fetchAll(true))
                .subscribe()
        );
        return () => { channels.forEach(c => supabase.removeChannel(c)); };
    }, [currentTenant?.id, activeChannels, fetchAll]);

    // 30 sn'de bir tüm kanalları çek (poll)
    const syncAll = useCallback(async () => {
        if (!currentTenant?.id || activeChannels.length === 0) return;
        setSyncing(true);
        try {
            await Promise.allSettled(activeChannels.map(ch => ch.sync(currentTenant.id)));
            await fetchAll(true);
        } finally { setSyncing(false); }
    }, [currentTenant?.id, activeChannels, fetchAll]);

    useEffect(() => {
        if (activeChannels.length === 0) return;
        const t = setInterval(() => syncAll(), 30000);
        return () => clearInterval(t);
    }, [activeChannels, syncAll]);

    const doAction = useCallback(async (o: UniOrder, action: string) => {
        if (!currentTenant?.id) return;
        const ch = CHANNELS.find(c => c.key === o.channelKey);
        if (!ch) return;
        setBusyId(o.uid);
        try {
            await ch.doAction(currentTenant.id, o, action);
            await fetchAll(false);
        } catch (e: any) {
            setFlash(`İşlem hatası: ${e?.message || "bilinmeyen"}`);
            setTimeout(() => setFlash(null), 5000);
        } finally { setBusyId(null); }
    }, [currentTenant?.id, fetchAll]);

    // Birleşik, sıralı liste
    const allOrders = useMemo(() => {
        const merged = Object.values(ordersByCh).flat();
        return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [ordersByCh]);

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        return allOrders.filter(o => {
            if (chFilter !== "all" && o.channelKey !== chFilter) return false;
            if (stageFilter !== "all" && o.stage !== stageFilter) return false;
            if (q && !(o.orderNo.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q))) return false;
            return true;
        });
    }, [allOrders, chFilter, stageFilter, search]);

    const counts = useMemo(() => {
        const c: Record<string, number> = { all: allOrders.length };
        for (const o of allOrders) c[o.stage] = (c[o.stage] || 0) + 1;
        return c;
    }, [allOrders]);

    // Lisansta hiç kanal yoksa
    if (activeChannels.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
                <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center">
                    <ShoppingBag className="w-9 h-9 text-secondary/40" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-foreground mb-1">Canlı Sipariş Kanalı Yok</h3>
                    <p className="text-sm text-secondary/60 max-w-md">
                        Lisansınızda Getir Çarşı, Trendyol GO veya Yemek entegrasyonu açık değil.
                        Etkinleştirmek için sistem yöneticinizle iletişime geçin.
                    </p>
                </div>
            </div>
        );
    }

    const STAGE_CHIPS: { key: Stage | "all"; label: string }[] = [
        { key: "all", label: "Tümü" },
        { key: "pending", label: "Onay Bekleyen" },
        { key: "preparing", label: "Hazırlanıyor" },
        { key: "ready", label: "Hazır" },
        { key: "onway", label: "Yolda" },
        { key: "delivered", label: "Teslim" },
        { key: "cancelled", label: "İptal" },
    ];

    return (
        <div className="space-y-5 animate-in fade-in duration-300">
            {/* Üst bar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                        <span className="relative inline-flex w-3 h-3 rounded-full bg-emerald-400" />
                    </div>
                    <h2 className="text-lg font-black text-foreground">Canlı Siparişler</h2>
                    <span className="text-[11px] font-bold text-secondary/50">{activeChannels.length} kanal · {allOrders.length} sipariş</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setSoundOn(s => !s)} title={soundOn ? "Sesi kapat" : "Sesi aç"}
                        className={`p-2.5 rounded-xl border transition-all ${soundOn ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-white/5 border-white/10 text-secondary"}`}>
                        {soundOn ? <Volume2 className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                    </button>
                    <button onClick={syncAll} disabled={syncing}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-black shadow-lg shadow-primary/25 disabled:opacity-60 transition-all">
                        <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} /> Tümünü Çek
                    </button>
                </div>
            </div>

            {flash && (
                <div className="px-4 py-3 rounded-2xl bg-primary/15 border border-primary/30 text-primary text-sm font-bold animate-in slide-in-from-top-2">
                    {flash}
                </div>
            )}

            {/* Kanal filtreleri (renkli, sadece açık kanallar) */}
            <div className="flex gap-2 flex-wrap">
                <button onClick={() => setChFilter("all")}
                    className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${chFilter === "all" ? "bg-white/10 border-white/20 text-white" : "bg-white/[0.02] border-white/5 text-secondary hover:text-white"}`}>
                    Tüm Kanallar
                </button>
                {activeChannels.map(ch => {
                    const cnt = (ordersByCh[ch.key] || []).length;
                    const on = chFilter === ch.key;
                    return (
                        <button key={ch.key} onClick={() => setChFilter(ch.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black border transition-all ${on ? "text-white" : "text-secondary hover:text-white bg-white/[0.02] border-white/5"}`}
                            style={on ? { background: `${ch.color}22`, borderColor: `${ch.color}66`, color: ch.color } : {}}>
                            <span className="w-2 h-2 rounded-full" style={{ background: ch.color }} />
                            {ch.label}
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-white/10">{cnt}</span>
                        </button>
                    );
                })}
            </div>

            {/* Statü filtreleri */}
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                {STAGE_CHIPS.map(s => (
                    <button key={s.key} onClick={() => setStageFilter(s.key)}
                        className={`px-3.5 py-2 rounded-xl text-[11px] font-black whitespace-nowrap border transition-all ${stageFilter === s.key ? "bg-primary/15 border-primary/40 text-primary" : "bg-white/[0.02] border-white/5 text-secondary hover:text-white"}`}>
                        {s.label}
                        {s.key !== "all" && counts[s.key] ? <span className="ml-1.5 opacity-70">{counts[s.key]}</span> : null}
                    </button>
                ))}
            </div>

            {/* Arama */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/40" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Sipariş no veya müşteri ara..."
                    className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/5 rounded-2xl text-white text-sm outline-none focus:border-primary/40" />
            </div>

            {/* Sipariş kartları */}
            {loading ? (
                <div className="py-16 text-center text-secondary/40 flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin" /> Yükleniyor...
                </div>
            ) : visible.length === 0 ? (
                <div className="py-16 text-center text-secondary/30">
                    <Bell className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium">Bu filtrede sipariş yok.</p>
                </div>
            ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {visible.map(o => {
                        const sm = STAGE_META[o.stage];
                        const acts = o.channelKey ? (CHANNELS.find(c => c.key === o.channelKey)?.nextActions(o) || []) : [];
                        const busy = busyId === o.uid;
                        return (
                            <div key={o.uid} className="rounded-2xl border border-white/[0.06] bg-card/60 p-4 flex flex-col gap-3"
                                style={{ boxShadow: `inset 3px 0 0 ${o.color}` }}>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-black px-2 py-1 rounded-lg" style={{ color: o.color, background: `${o.color}1a` }}>
                                        {o.channelLabel}
                                    </span>
                                    <span className="text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wide flex items-center gap-1" style={{ color: sm.color, background: sm.bg }}>
                                        <sm.icon className="w-3 h-3" /> {o.statusLabel}
                                    </span>
                                </div>
                                <div className="flex items-end justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="text-[11px] font-mono text-secondary/50">#{o.orderNo}</div>
                                        <div className="font-bold text-white text-sm truncate">{o.customer}</div>
                                        <div className="text-[11px] text-secondary/40">
                                            {o.itemsCount > 0 ? `${o.itemsCount} ürün · ` : ""}{timeAgo(o.createdAt)} önce
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-[9px] uppercase tracking-wide text-secondary/40 font-bold">Toplam</div>
                                        <div className="text-lg font-black text-white">₺{money(o.total)}</div>
                                    </div>
                                </div>
                                {acts.length > 0 && (
                                    <div className="flex gap-2 pt-1">
                                        {acts.map(a => (
                                            <button key={a.action} disabled={busy} onClick={() => doAction(o, a.action)}
                                                className={`flex-1 py-2 rounded-xl text-xs font-black text-white transition-all disabled:opacity-50 ${a.cls}`}>
                                                {busy ? "…" : a.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
