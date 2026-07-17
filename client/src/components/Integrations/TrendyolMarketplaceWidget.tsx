"use client";

import { useState, useCallback, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { useTenant } from "@/lib/tenant-context";
import {
    RefreshCw, Loader2, ShoppingBag, TrendingUp, Package,
    Info, AlertCircle, CheckCircle2, Clock,
} from "lucide-react";

// Trendyol PAZARYERI (marketplace) — GO'dan ayrı. settings.trendyol creds'i +
// /api/trendyol-marketplace/orders (gerçek api.trendyol.com/sapigw).

type SubTab = "overview" | "orders" | "finance" | "settings" | "mapping";
type MLine = { barcode: string; productName: string; quantity: number; price: number };
type MOrder = { orderNumber: string; orderDate: number; lines: MLine[] };

const money = (n: number) => (Number(n) || 0).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const dt = (ts: number) => { try { return new Date(ts).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); } catch { return "-"; } };
const orderTotal = (o: MOrder) => (o.lines || []).reduce((s, l) => s + (Number(l.price) || 0) * (Number(l.quantity) || 0), 0);

export default function TrendyolMarketplaceWidget({ activeSubTab = "overview" }: { activeSubTab?: SubTab }) {
    const { currentTenant } = useTenant();
    const cfg = ((currentTenant?.settings as any)?.trendyol) || {};
    const configured = !!(cfg.supplierId && cfg.apiKey && cfg.apiSecret);

    const [syncing, setSyncing] = useState(false);
    const [orders, setOrders] = useState<MOrder[]>([]);
    const [revenue, setRevenue] = useState(0);
    const [flash, setFlash] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [loaded, setLoaded] = useState(false);

    const sync = useCallback(async () => {
        setSyncing(true); setErr(null); setFlash(null);
        try {
            const res = await apiFetch("/api/trendyol-marketplace/orders", { method: "POST", body: JSON.stringify({ days: 14 }) });
            setOrders(res.orders || []);
            setRevenue(res.revenue || 0);
            setLoaded(true);
            setFlash(`${res.count || 0} sipariş çekildi (son 14 gün)`);
        } catch (e: any) {
            setErr(e?.message || "Siparişler alınamadı");
        } finally {
            setSyncing(false);
        }
    }, []);

    const avg = useMemo(() => (orders.length ? revenue / orders.length : 0), [orders, revenue]);

    const Stat = ({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) => (
        <div className="p-4 rounded-2xl bg-primary/5 border border-border">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1"><span style={{ color }}>{icon}</span> {label}</div>
            <div className="text-2xl font-black text-white">{value}</div>
        </div>
    );

    const TopBar = () => (
        <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs">
                {configured
                    ? <span className="flex items-center gap-1.5 text-emerald-400 font-semibold"><CheckCircle2 size={14} /> Bağlı · Supplier {cfg.supplierId}</span>
                    : <span className="flex items-center gap-1.5 text-amber-400 font-semibold"><AlertCircle size={14} /> Ayar yok — SuperAdmin&apos;den girin</span>}
            </div>
            <button
                onClick={sync}
                disabled={syncing || !configured}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm font-semibold hover:bg-rose-500/25 transition-all disabled:opacity-50"
            >
                {syncing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                {syncing ? "Senkronize ediliyor…" : "Siparişleri Çek"}
            </button>
        </div>
    );

    return (
        <div className="space-y-4">
            {flash && <div className="px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-semibold">{flash}</div>}
            {err && <div className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-semibold">{err}</div>}

            <TopBar />

            {activeSubTab === "overview" && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <Stat label="Sipariş (14g)" value={String(orders.length)} icon={<ShoppingBag size={14} />} color="#f43f5e" />
                        <Stat label="Ciro (14g)" value={`${money(revenue)} ₺`} icon={<TrendingUp size={14} />} color="#22c55e" />
                        <Stat label="Ort. Sepet" value={`${money(avg)} ₺`} icon={<Package size={14} />} color="#a855f7" />
                    </div>
                    {!loaded && (
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-border text-sm text-slate-400">
                            <Info size={18} className="text-rose-400 shrink-0 mt-0.5" />
                            <div><b className="text-white">Trendyol Pazaryeri</b> — Trendyol GO / Yemek&apos;ten ayrı bir entegrasyondur (api.trendyol.com/sapigw). Siparişleri görmek için <span className="text-rose-400">Siparişleri Çek</span>&apos;e basın.</div>
                        </div>
                    )}
                </div>
            )}

            {(activeSubTab === "orders" || activeSubTab === "mapping") && (
                <div className="grid gap-3">
                    {orders.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 text-sm">Sipariş yok. <span className="text-rose-400">Siparişleri Çek</span>&apos;e basın.</div>
                    ) : orders.map(o => (
                        <div key={o.orderNumber} className="p-4 rounded-xl bg-primary/5 border border-border">
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-bold text-white">#{o.orderNumber}</span>
                                        <span className="text-[11px] text-slate-500 flex items-center gap-1"><Clock size={11} /> {dt(o.orderDate)}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-1 truncate">
                                        {(o.lines || []).slice(0, 4).map(l => `${l.quantity}× ${l.productName}`).join(", ")}
                                        {(o.lines || []).length > 4 ? ` +${o.lines.length - 4}` : ""}
                                    </div>
                                </div>
                                <span className="text-lg font-black text-white shrink-0">{money(orderTotal(o))} ₺</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeSubTab === "finance" && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <Stat label="Toplam Ciro (14g)" value={`${money(revenue)} ₺`} icon={<TrendingUp size={14} />} color="#22c55e" />
                    <Stat label="Sipariş Sayısı" value={String(orders.length)} icon={<ShoppingBag size={14} />} color="#f43f5e" />
                    <Stat label="Ort. Sepet" value={`${money(avg)} ₺`} icon={<Package size={14} />} color="#a855f7" />
                </div>
            )}

            {activeSubTab === "settings" && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-border text-sm text-slate-400">
                    <Info size={18} className="text-rose-400 shrink-0 mt-0.5" />
                    <div>Trendyol Pazaryeri bilgileri (Supplier ID · API Key · Secret) <span className="text-white font-semibold">SuperAdmin → işletme → Trendyol Pazaryeri</span> ekranından girilir. Bu entegrasyon Trendyol GO&apos;dan bağımsızdır.</div>
                </div>
            )}
        </div>
    );
}
