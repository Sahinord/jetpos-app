"use client";

import { useState, useEffect } from "react";
import {
    ArrowLeft, Edit3, Package, Activity, Zap, DollarSign,
    Box, ArrowUpRight, ArrowDownRight, Printer, ShieldAlert,
    TrendingUp, BarChart3, Clock, Layers, Target, Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer
} from "recharts";

interface ProductDetailProps {
    product: any;
    onBack: () => void;
    onEdit: (product: any) => void;
}

export default function ProductDetailView({ product, onBack, onEdit }: ProductDetailProps) {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');
    const [stats, setStats] = useState<any>({
        totalSales: 0, totalRevenue: 0, totalProfit: 0,
        salesData: [], movements: [], performanceScore: 0
    });

    useEffect(() => {
        if (product) fetchProductInsights();
    }, [product]);

    const fetchProductInsights = async () => {
        setLoading(true);
        try {
            const savedTenantId = localStorage.getItem('currentTenantId');
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data: saleItems } = await supabase
                .from('sale_items')
                .select(`quantity, unit_price, total_price, profit, created_at, sale_id, sales!inner ( id, cashier_name, tenant_id )`)
                .eq('product_id', product.id)
                .eq('sales.tenant_id', savedTenantId)
                .gte('created_at', thirtyDaysAgo.toISOString())
                .order('created_at', { ascending: false });

            const { data: logs } = await supabase
                .from('product_change_logs')
                .select('*')
                .eq('product_id', product.id)
                .eq('tenant_id', savedTenantId)
                .order('created_at', { ascending: false })
                .limit(5);

            const dailyData: Record<string, any> = {};
            let totalQty = 0, totalRev = 0, totalProf = 0;

            for (let i = 6; i >= 0; i--) {
                const d = new Date(); d.setDate(d.getDate() - i);
                const label = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
                dailyData[label] = { date: label, ciro: 0, kar: 0 };
            }

            saleItems?.forEach(item => {
                const date = new Date(item.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
                if (dailyData[date]) {
                    dailyData[date].ciro += Number(item.total_price);
                    dailyData[date].kar += Number(item.profit);
                }
                totalQty += Number(item.quantity);
                totalRev += Number(item.total_price);
                totalProf += Number(item.profit);
            });

            const movements = [
                ...(saleItems?.slice(0, 6).map(item => ({
                    type: 'Satış', quantity: item.quantity, price: item.unit_price,
                    user: (item as any).sales?.cashier_name || 'Kasa',
                    date: item.created_at, color: 'emerald'
                })) || []),
                ...(logs?.map(log => ({
                    type: log.change_type === 'stock' ? 'Stok' : 'Fiyat',
                    quantity: log.change_type === 'stock' ? (Number(log.new_value) - Number(log.old_value)) : 0,
                    price: log.change_type === 'price' ? Number(log.new_value) : 0,
                    user: log.changed_by || 'Sistem', date: log.created_at, color: 'blue'
                })) || [])
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

            setStats({
                totalSales: totalQty, totalRevenue: totalRev, totalProfit: totalProf,
                salesData: Object.values(dailyData), movements,
                performanceScore: Math.min(100, Math.max(15, (totalQty / 15) * 100))
            });
        } catch (error) {
            console.error("Product insights error:", error);
        } finally {
            setLoading(false);
        }
    };

    const profitMargin = product.sale_price > 0
        ? Math.round(((product.sale_price - product.purchase_price) / product.sale_price) * 100)
        : 0;

    const capitalTied = (product.stock_quantity || 0) * (product.purchase_price || 0);

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-[3px] border-white/10 border-t-primary rounded-full animate-spin" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-[3px]">Analiz yükleniyor</p>
            </motion.div>
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-5 pb-12">

            {/* ──────── HEADER ──────── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onBack}
                        className="w-10 h-10 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95">
                        <ArrowLeft size={18} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10">
                            <Package className="text-primary w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white tracking-tight">{product.name}</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-slate-500 font-mono font-bold tracking-widest">{product.barcode || "—"}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider
                                    ${product.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-500/15 text-slate-400'}`}>
                                    {product.status === 'active' ? 'AKTİF' : 'PASİF'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => onEdit(product)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/15 rounded-xl text-[11px] font-bold transition-all active:scale-95">
                        <Edit3 size={13} /> Düzenle
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] text-slate-400 border border-white/[0.06] rounded-xl text-[11px] font-bold transition-all">
                        <Printer size={13} /> Etiket
                    </button>
                </div>
            </div>

            {/* ──────── KPI CARDS ROW ──────── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                    { label: "Satış Fiyatı", value: `₺${(product.sale_price || 0).toLocaleString('tr-TR', {minimumFractionDigits:2})}`, icon: DollarSign, color: "text-blue-400", bg: "from-blue-500/10 to-blue-500/5", border: "border-blue-500/10" },
                    { label: "Kâr Marjı", value: `%${profitMargin}`, icon: Target, color: profitMargin >= 30 ? "text-emerald-400" : "text-amber-400", bg: profitMargin >= 30 ? "from-emerald-500/10 to-emerald-500/5" : "from-amber-500/10 to-amber-500/5", border: profitMargin >= 30 ? "border-emerald-500/10" : "border-amber-500/10" },
                    { label: "Toplam Satış", value: `${stats.totalSales} adet`, icon: BarChart3, color: "text-violet-400", bg: "from-violet-500/10 to-violet-500/5", border: "border-violet-500/10" },
                    { label: "Toplam Ciro", value: `₺${stats.totalRevenue.toLocaleString('tr-TR', {maximumFractionDigits:0})}`, icon: TrendingUp, color: "text-cyan-400", bg: "from-cyan-500/10 to-cyan-500/5", border: "border-cyan-500/10" },
                    { label: "Net Kâr", value: `₺${stats.totalProfit.toLocaleString('tr-TR', {maximumFractionDigits:0})}`, icon: Sparkles, color: "text-emerald-400", bg: "from-emerald-500/10 to-emerald-500/5", border: "border-emerald-500/10" },
                ].map((kpi, i) => (
                    <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        className={`bg-gradient-to-br ${kpi.bg} border ${kpi.border} rounded-2xl p-4 relative overflow-hidden group hover:scale-[1.02] transition-transform`}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</span>
                            <kpi.icon size={14} className={`${kpi.color} opacity-60`} />
                        </div>
                        <p className={`text-xl font-black tracking-tight ${kpi.color}`}>{kpi.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* ──────── MAIN GRID ──────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* LEFT: Chart */}
                <div className="lg:col-span-2 bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5 flex flex-col">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="text-sm font-bold text-white">Satış Trendi</h3>
                            <p className="text-[10px] text-slate-500 mt-0.5">Son 7 günlük ciro ve kâr</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                <span className="text-[9px] font-bold text-slate-500">Ciro</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-[9px] font-bold text-slate-500">Kâr</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 min-h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.salesData}>
                                <defs>
                                    <linearGradient id="gCiro" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gKar" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" vertical={false} />
                                <XAxis dataKey="date" stroke="#ffffff10" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#475569', fontWeight: 600 }} />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', fontSize: '11px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                                    itemStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                                    labelStyle={{ color: '#64748b', fontSize: '10px', fontWeight: 700, marginBottom: 4 }}
                                />
                                <Area type="monotone" dataKey="ciro" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#gCiro)" name="Ciro (₺)" />
                                <Area type="monotone" dataKey="kar" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#gKar)" name="Kâr (₺)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* RIGHT: Product Info */}
                <div className="space-y-4">
                    {/* Price Breakdown */}
                    <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5 space-y-4">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <DollarSign size={12} className="text-slate-400" /> Fiyat Detayı
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.03]">
                                <p className="text-[9px] text-slate-500 font-bold mb-1">ALIŞ</p>
                                <p className="text-base font-bold text-slate-300">₺{(product.purchase_price || 0).toLocaleString('tr-TR', {minimumFractionDigits:2})}</p>
                            </div>
                            <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.03]">
                                <p className="text-[9px] text-slate-500 font-bold mb-1">SATIŞ</p>
                                <p className="text-base font-bold text-white">₺{(product.sale_price || 0).toLocaleString('tr-TR', {minimumFractionDigits:2})}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between bg-emerald-500/[0.06] border border-emerald-500/10 rounded-xl px-4 py-2.5">
                            <span className="text-[10px] font-bold text-emerald-500/80">Birim Kâr</span>
                            <span className="text-sm font-black text-emerald-400">₺{((product.sale_price || 0) - (product.purchase_price || 0)).toLocaleString('tr-TR', {minimumFractionDigits:2})}</span>
                        </div>
                    </div>

                    {/* Stock Card */}
                    <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5 space-y-4">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Box size={12} className="text-slate-400" /> Stok Durumu
                        </h3>
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-3xl font-black text-white tracking-tight">{product.stock_quantity || 0}</p>
                                <p className="text-[10px] text-slate-500 font-bold mt-0.5">{product.unit || "Adet"}</p>
                            </div>
                            <div className={`px-3 py-1.5 rounded-lg text-[10px] font-bold
                                ${(product.stock_quantity || 0) > 10 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                {(product.stock_quantity || 0) > 10 ? 'Yeterli' : 'Kritik'}
                            </div>
                        </div>
                        <div className="w-full bg-white/[0.04] h-1.5 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, ((product.stock_quantity || 0) / 50) * 100)}%` }}
                                transition={{ duration: 0.8 }}
                                className={`h-full rounded-full ${(product.stock_quantity || 0) > 10 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        </div>
                        <div className="flex items-center justify-between text-[9px] font-bold text-slate-600">
                            <span>Bağlı Sermaye</span>
                            <span className="text-slate-400">₺{capitalTied.toLocaleString('tr-TR', {maximumFractionDigits:0})}</span>
                        </div>
                    </div>

                    {/* AI Insight */}
                    <div className="relative bg-gradient-to-br from-primary/[0.08] to-transparent border border-primary/10 rounded-2xl p-5 overflow-hidden">
                        <div className="absolute -right-8 -top-8 w-24 h-24 bg-primary/10 blur-[40px] rounded-full" />
                        <div className="flex items-center gap-2 mb-3 relative">
                            <Zap size={14} className="text-primary" />
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">AI Öngörü</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed relative">
                            {stats.totalSales > 5
                                ? `Bu ürün son 30 günde ${stats.totalSales} adet satıldı ve ₺${stats.totalProfit.toLocaleString('tr-TR', {maximumFractionDigits:0})} net kâr bıraktı. Performansı ${stats.performanceScore > 60 ? 'ortalamanın üzerinde' : 'geliştirilmeli'}.`
                                : `Bu ürünün son 30 günde satış hacmi düşük. Fiyat optimizasyonu veya kampanya desteği ile satış artırılabilir.`
                            }
                        </p>
                        <div className="flex items-center justify-between mt-4 relative">
                            <span className="text-[9px] font-bold text-slate-600">Skor</span>
                            <div className="flex items-center gap-2">
                                <div className="w-20 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${stats.performanceScore}%` }}
                                        transition={{ duration: 1 }} className="h-full bg-primary rounded-full" />
                                </div>
                                <span className="text-[10px] font-bold text-primary">{Math.round(stats.performanceScore)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ──────── MOVEMENTS TABLE ──────── */}
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-400" />
                        <h3 className="text-sm font-bold text-white">Son İşlemler</h3>
                        <span className="text-[9px] font-bold text-slate-600 bg-white/[0.04] px-2 py-0.5 rounded-md">{stats.movements.length}</span>
                    </div>
                </div>
                <div className="divide-y divide-white/[0.03]">
                    {stats.movements.length === 0 ? (
                        <div className="px-5 py-12 text-center">
                            <Activity size={24} className="text-slate-700 mx-auto mb-3" />
                            <p className="text-xs text-slate-600 font-bold">Henüz işlem kaydı yok</p>
                        </div>
                    ) : stats.movements.map((move: any, i: number) => (
                        <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                            className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center
                                    ${move.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                    {move.color === 'emerald' ? <ArrowUpRight size={14} /> : <Activity size={14} />}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white">{move.type}</p>
                                    <p className="text-[10px] text-slate-500">{move.user}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="text-xs font-bold text-slate-300 tabular-nums">{move.quantity} {product.unit || 'ad.'}</span>
                                <span className="text-xs font-bold text-slate-300 tabular-nums">₺{Number(move.price).toLocaleString('tr-TR', {minimumFractionDigits:2})}</span>
                                <span className="text-[10px] text-slate-500 font-medium min-w-[90px] text-right">
                                    {new Date(move.date).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* ──────── BOTTOM ROW: Alerts + Category ──────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5 space-y-3">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldAlert size={12} className="text-amber-400" /> Uyarılar
                    </h3>
                    <div className="space-y-2">
                        {(product.stock_quantity || 0) <= 5 && (
                            <div className="flex items-center gap-3 p-3 bg-rose-500/[0.06] border border-rose-500/10 rounded-xl">
                                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                                <p className="text-[11px] font-medium text-rose-300">Stok kritik seviyede — tedarik gerekli</p>
                            </div>
                        )}
                        {profitMargin < 20 && (
                            <div className="flex items-center gap-3 p-3 bg-amber-500/[0.06] border border-amber-500/10 rounded-xl">
                                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                <p className="text-[11px] font-medium text-amber-300">Kâr marjı düşük — fiyat optimizasyonu önerilir</p>
                            </div>
                        )}
                        {profitMargin >= 20 && (product.stock_quantity || 0) > 5 && (
                            <div className="flex items-center gap-3 p-3 bg-emerald-500/[0.06] border border-emerald-500/10 rounded-xl">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                <p className="text-[11px] font-medium text-emerald-300">Ürün sağlıklı — stok ve marj dengeli</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5 space-y-3">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers size={12} className="text-slate-400" /> Ürün Bilgileri
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { label: "Kategori", value: product.categories?.name || product.category?.name || "Genel" },
                            { label: "Birim", value: product.unit || "Adet" },
                            { label: "KDV", value: `%${product.vat_rate || 0}` },
                            { label: "SKU", value: product.sku || "—" },
                        ].map(info => (
                            <div key={info.label} className="bg-white/[0.02] border border-white/[0.03] rounded-xl px-3 py-2.5">
                                <p className="text-[9px] text-slate-600 font-bold mb-0.5">{info.label}</p>
                                <p className="text-xs font-bold text-slate-300 truncate">{info.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
