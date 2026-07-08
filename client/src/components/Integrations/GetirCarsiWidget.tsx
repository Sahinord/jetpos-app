"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
    Package, RefreshCw, TrendingUp, ShoppingCart, Clock, Truck,
    CheckCircle2, XCircle, Search, BarChart3, Info
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

type SubTab = "overview" | "orders" | "finance" | "settings" | "mapping";

// Getir Çarşı statü kodları (API dökümanı "Sipariş Statüleri")
const STATUS_MAP: Record<number, { label: string; color: string; bg: string }> = {
    400: { label: "Onay Bekliyor", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
    500: { label: "Hazırlanıyor", color: "#7886C7", bg: "rgba(120,134,199,0.15)" },
    550: { label: "Yola Çıktı", color: "#a855f7", bg: "rgba(168,85,247,0.15)" },
    700: { label: "Kurye Yolda", color: "#a855f7", bg: "rgba(168,85,247,0.15)" },
    900: { label: "Teslim Edildi", color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
    1500: { label: "İptal (Admin)", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
    1600: { label: "İptal (İşletme)", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
};

type GetirOrder = {
    id: string;
    getir_order_id: string;
    getir_shop_id: string | null;
    order_number: string | null;
    customer_name: string | null;
    total_price: number | null;
    getir_status_code: number | null;
    is_cancelled: boolean;
    items: unknown[];
    created_at: string;
};

const statusInfo = (o: GetirOrder) => {
    if (o.is_cancelled) return STATUS_MAP[o.getir_status_code || 1600] || { label: "İptal", color: "#ef4444", bg: "rgba(239,68,68,0.15)" };
    return STATUS_MAP[o.getir_status_code || 400] || { label: "Yeni", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" };
};
const money = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const timeAgo = (s: string) => {
    const m = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
    if (m < 1) return "az önce";
    if (m < 60) return `${m} dk önce`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} saat önce`;
    return `${Math.floor(h / 24)} gün önce`;
};

export default function GetirCarsiWidget({ activeSubTab = "overview" }: { activeSubTab?: SubTab }) {
    const { currentTenant } = useTenant();
    const [orders, setOrders] = useState<GetirOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [rangeDays, setRangeDays] = useState<1 | 7 | 30>(30);
    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "preparing" | "onway" | "delivered" | "cancelled">("all");
    const [search, setSearch] = useState("");

    const fetchOrders = useCallback(async () => {
        if (!currentTenant?.id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("getir_carsi_orders")
                .select("id, getir_order_id, getir_shop_id, order_number, customer_name, total_price, getir_status_code, is_cancelled, items, created_at")
                .eq("tenant_id", currentTenant.id)
                .order("created_at", { ascending: false })
                .limit(500);
            if (!error && data) setOrders(data as GetirOrder[]);
        } finally {
            setLoading(false);
        }
    }, [currentTenant?.id]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    // Yeni sipariş anında düşsün (webhook Supabase'e yazınca)
    useEffect(() => {
        if (!currentTenant?.id) return;
        const ch = supabase
            .channel("getir_carsi_orders_rt")
            .on("postgres_changes", { event: "*", schema: "public", table: "getir_carsi_orders", filter: `tenant_id=eq.${currentTenant.id}` }, () => fetchOrders())
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [currentTenant?.id, fetchOrders]);

    // Zaman aralığına göre filtre
    const ranged = useMemo(() => {
        const from = Date.now() - rangeDays * 24 * 60 * 60 * 1000;
        return orders.filter(o => new Date(o.created_at).getTime() >= from);
    }, [orders, rangeDays]);

    const active = useMemo(() => ranged.filter(o => !o.is_cancelled), [ranged]);
    const cancelled = useMemo(() => ranged.filter(o => o.is_cancelled), [ranged]);
    const delivered = useMemo(() => active.filter(o => o.getir_status_code === 900), [active]);
    const pending = useMemo(() => active.filter(o => (o.getir_status_code || 400) < 900), [active]);
    const totalRevenue = useMemo(() => delivered.reduce((s, o) => s + (Number(o.total_price) || 0), 0), [delivered]);
    const avgBasket = delivered.length ? totalRevenue / delivered.length : 0;

    const trend = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (6 - i));
            const nd = new Date(d); nd.setDate(d.getDate() + 1);
            const val = delivered
                .filter(o => { const t = new Date(o.created_at).getTime(); return t >= d.getTime() && t < nd.getTime(); })
                .reduce((s, o) => s + (Number(o.total_price) || 0), 0);
            return { label: d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" }), value: val };
        });
    }, [delivered]);
    const maxTrend = Math.max(...trend.map(t => t.value), 1);

    // Sipariş listesi filtresi (statü + arama)
    const filteredOrders = useMemo(() => {
        return ranged.filter(o => {
            const code = o.getir_status_code || 400;
            let ok = true;
            if (statusFilter === "delivered") ok = !o.is_cancelled && code === 900;
            else if (statusFilter === "cancelled") ok = o.is_cancelled;
            else if (statusFilter === "pending") ok = !o.is_cancelled && code === 400;
            else if (statusFilter === "preparing") ok = !o.is_cancelled && code === 500;
            else if (statusFilter === "onway") ok = !o.is_cancelled && (code === 550 || code === 700);
            if (!ok) return false;
            if (search) {
                const q = search.toLowerCase();
                return (o.customer_name || "").toLowerCase().includes(q) || (o.order_number || o.getir_order_id).toLowerCase().includes(q);
            }
            return true;
        });
    }, [ranged, statusFilter, search]);

    const RANGES: { v: 1 | 7 | 30; label: string }[] = [
        { v: 1, label: "24 Saat" }, { v: 7, label: "7 Gün" }, { v: 30, label: "30 Gün" },
    ];
    const STATUS_CHIPS: { v: typeof statusFilter; label: string; count: number; icon: typeof CheckCircle2 }[] = [
        { v: "all", label: "Tümü", count: ranged.length, icon: ShoppingCart },
        { v: "delivered", label: "Teslim", count: delivered.length, icon: CheckCircle2 },
        { v: "pending", label: "Onay Bekleyen", count: active.filter(o => (o.getir_status_code || 400) === 400).length, icon: Clock },
        { v: "preparing", label: "Hazırlanıyor", count: active.filter(o => o.getir_status_code === 500).length, icon: Package },
        { v: "onway", label: "Yolda", count: active.filter(o => [550, 700].includes(o.getir_status_code || 0)).length, icon: Truck },
        { v: "cancelled", label: "İptal", count: cancelled.length, icon: XCircle },
    ];

    const OrderCard = ({ o }: { o: GetirOrder }) => {
        const st = statusInfo(o);
        const itemCount = Array.isArray(o.items) ? o.items.length : 0;
        return (
            <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-[11px] font-black text-purple-400 bg-purple-500/10 px-2 py-1 rounded-lg">
                        #{o.order_number || o.getir_order_id.slice(-8)}
                    </span>
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wide" style={{ color: st.color, background: st.bg }}>
                        {st.label}
                    </span>
                </div>
                <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                        <div className="font-bold text-white text-sm truncate">{o.customer_name || "Müşteri"}</div>
                        <div className="text-[11px] text-secondary/40">
                            {itemCount > 0 ? `${itemCount} ürün · ` : ""}{timeAgo(o.created_at)}
                        </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <div className="text-[10px] uppercase tracking-wide text-secondary/40 font-bold">Toplam</div>
                        <div className="text-lg font-black text-white">₺{money(Number(o.total_price) || 0)}</div>
                    </div>
                </div>
            </div>
        );
    };

    // ══════════ GENEL BAKIŞ ══════════
    if (activeSubTab === "overview") {
        const cards = [
            { label: "Toplam Sipariş", sub: `Son ${rangeDays} gün`, value: String(ranged.length), icon: ShoppingCart, color: "#a855f7" },
            { label: "Bekleyen", sub: "İşlem bekliyor", value: String(pending.length), icon: Clock, color: "#f59e0b" },
            { label: "Toplam Ciro", sub: "Teslim edilen", value: `₺${money(totalRevenue)}`, icon: TrendingUp, color: "#22c55e" },
            { label: "Teslim Edildi", sub: `${cancelled.length} iptal`, value: String(delivered.length), icon: Truck, color: "#3b82f6" },
        ];
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
                            <Package className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="font-black text-white text-sm">Getir Çarşı</p>
                            <p className="text-[11px] text-secondary/50">Production • Tenant Bazlı</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-[11px] font-black text-emerald-400">BAĞLI</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {cards.map((c, i) => (
                        <div key={i} className="relative overflow-hidden bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
                            <c.icon className="absolute right-3 top-3 w-10 h-10 opacity-[0.06]" style={{ color: c.color }} />
                            <div className="text-[10px] uppercase tracking-widest font-black mb-2" style={{ color: c.color }}>{c.label}</div>
                            <div className="text-3xl font-black text-white leading-none">{c.value}</div>
                            <div className="text-[11px] text-secondary/40 mt-2">{c.sub}</div>
                        </div>
                    ))}
                </div>

                <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-purple-400" />
                            <h3 className="text-sm font-black text-white uppercase tracking-wide">Son 7 Gün Ciro Trendi</h3>
                        </div>
                        <span className="text-[11px] text-secondary/40">{money(totalRevenue)} ₺ teslim edilen</span>
                    </div>
                    <div className="flex items-end justify-between gap-2 h-44">
                        {trend.map((d, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                                <span className="text-[11px] font-black text-purple-300">{d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : money(d.value)}</span>
                                <div className="w-full rounded-t-lg transition-all" style={{
                                    height: `${Math.max(3, (d.value / maxTrend) * 100)}%`,
                                    background: "linear-gradient(180deg, #a855f7, #7c3aed)",
                                }} title={`₺${money(d.value)}`} />
                                <span className="text-[10px] text-secondary/40 font-bold">{d.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    onClick={fetchOrders}
                    className="w-full py-4 rounded-2xl bg-purple-500 hover:bg-purple-600 text-white font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/30"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} /> SİPARİŞLERİ YENİLE
                </button>
            </div>
        );
    }

    // ══════════ SİPARİŞLER ══════════
    if (activeSubTab === "orders") {
        return (
            <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5">
                        {RANGES.map(r => (
                            <button key={r.v} onClick={() => setRangeDays(r.v)}
                                className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${rangeDays === r.v ? "bg-purple-500 text-white" : "text-secondary hover:text-white"}`}>
                                {r.label}
                            </button>
                        ))}
                    </div>
                    <button onClick={fetchOrders}
                        className="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-sm font-black flex items-center gap-2 transition-all shadow-lg shadow-purple-500/25">
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Siparişleri Yenile
                    </button>
                </div>

                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                    {STATUS_CHIPS.map(c => (
                        <button key={c.v} onClick={() => setStatusFilter(c.v)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap border transition-all ${
                                statusFilter === c.v ? "bg-purple-500/15 border-purple-500/40 text-purple-300" : "bg-white/[0.02] border-white/5 text-secondary hover:text-white"
                            }`}>
                            <c.icon className="w-3.5 h-3.5" /> {c.label}
                            {c.count > 0 && <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${statusFilter === c.v ? "bg-purple-500/30" : "bg-white/5"}`}>{c.count}</span>}
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/40" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Sipariş no veya müşteri adı ile ara..."
                        className="w-full pl-11 pr-4 py-3.5 bg-white/[0.03] border border-white/5 rounded-2xl text-white text-sm outline-none focus:border-purple-500/40" />
                </div>

                {filteredOrders.length === 0 ? (
                    <div className="text-center py-16 text-secondary/30">
                        <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p className="text-sm font-medium">Bu filtrede sipariş yok.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {filteredOrders.map(o => <OrderCard key={o.id} o={o} />)}
                    </div>
                )}
            </div>
        );
    }

    // ══════════ FİNANS & ANALİZ ══════════
    if (activeSubTab === "finance") {
        const cancelledRevenue = cancelled.reduce((s, o) => s + (Number(o.total_price) || 0), 0);
        const rows = [
            { label: "Toplam Ciro (teslim edilen)", value: `₺${money(totalRevenue)}`, color: "#22c55e" },
            { label: "Teslim Edilen Sipariş", value: String(delivered.length), color: "#3b82f6" },
            { label: "Ortalama Sepet Tutarı", value: `₺${money(avgBasket)}`, color: "#a855f7" },
            { label: "İptal Edilen Sipariş", value: String(cancelled.length), color: "#ef4444" },
            { label: "İptal Tutarı", value: `₺${money(cancelledRevenue)}`, color: "#ef4444" },
        ];
        return (
            <div className="space-y-4 animate-in fade-in duration-300">
                <div className="grid md:grid-cols-2 gap-3">
                    {rows.map((r, i) => (
                        <div key={i} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
                            <span className="text-sm font-bold text-secondary/70">{r.label}</span>
                            <span className="text-xl font-black" style={{ color: r.color }}>{r.value}</span>
                        </div>
                    ))}
                </div>
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-6">
                    <h3 className="text-sm font-black text-white uppercase tracking-wide mb-5">Son 7 Gün Ciro</h3>
                    <div className="flex items-end justify-between gap-2 h-44">
                        {trend.map((d, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                                <span className="text-[11px] font-black text-purple-300">{d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : money(d.value)}</span>
                                <div className="w-full rounded-t-lg" style={{ height: `${Math.max(3, (d.value / maxTrend) * 100)}%`, background: "linear-gradient(180deg, #a855f7, #7c3aed)" }} />
                                <span className="text-[10px] text-secondary/40 font-bold">{d.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ══════════ AYARLAR ══════════
    if (activeSubTab === "settings") {
        const shopId = orders[0]?.getir_shop_id || "—";
        return (
            <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex items-start gap-3 bg-purple-500/[0.06] border border-purple-500/20 rounded-2xl p-5">
                    <Info className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-secondary/70 leading-relaxed">
                        Getir Çarşı bağlantı bilgileri (mağaza kimliği, kullanıcı adı/şifre, mağaza türü)
                        <strong className="text-white"> Süper Admin panelinden</strong> işletme bazlı yönetilir.
                        Buradan yalnızca görüntüleyebilirsiniz.
                    </div>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
                        <div className="text-[10px] uppercase tracking-widest font-black text-secondary/50 mb-1">Getir Shop ID</div>
                        <div className="text-white font-bold">{shopId}</div>
                    </div>
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
                        <div className="text-[10px] uppercase tracking-widest font-black text-secondary/50 mb-1">Bağlantı Durumu</div>
                        <div className="text-emerald-400 font-bold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Aktif</div>
                    </div>
                </div>
            </div>
        );
    }

    // ══════════ ÜRÜN EŞLEŞTİRME ══════════
    return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-4 animate-in fade-in duration-300">
            <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center border border-purple-500/20">
                <Package className="w-9 h-9 text-purple-400/60" />
            </div>
            <div>
                <h3 className="text-2xl font-black text-white mb-1">Ürün Eşleştirme — Çok Yakında</h3>
                <p className="text-secondary/50 text-sm max-w-md">
                    Getir Çarşı ürün kartlarınızı JetPos stoklarınızla eşleştirme özelliği yakında burada olacak.
                </p>
            </div>
        </div>
    );
}
