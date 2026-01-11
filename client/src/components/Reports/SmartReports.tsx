"use client";

import { useState, useEffect } from "react";
import {
    BarChart3,
    TrendingUp,
    Package,
    Target,
    Sparkles,
    ChevronRight,
    Download,
    FileText,
    Zap,
    Star,
    TriangleAlert
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { generateZReportPDF, exportZReportExcel } from "@/lib/reports";

export default function SmartReports({ products }: any) {
    const [stats, setStats] = useState({
        totalSales: 0,
        totalProfit: 0,
        itemCount: 0,
        avgBasket: 0,
        comparison: 0
    });
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDailyStats();
    }, []);

    const fetchDailyStats = async () => {
        setLoading(true);
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // 1. Fetch Today's Sales
            const { data: sales, error: salesError } = await supabase
                .from('sales')
                .select('*')
                .gte('created_at', today.toISOString());

            if (salesError) throw salesError;

            // 2. Fetch Detailed Items for Top Products
            const { data: saleItems, error: itemsError } = await supabase
                .from('sale_items')
                .select('*, products(*)')
                .gte('created_at', today.toISOString());

            if (itemsError) throw itemsError;

            // Calculate stats based on EXISTING products only
            let totalSales = 0;
            let totalProfit = 0;
            const activeSaleItemIds = new Set(); // To count transactions if needed, but we stick to items for now

            saleItems?.forEach((item: any) => {
                // Only count if product still exists
                if (item.products) {
                    const price = Number(item.unit_price);
                    const qty = Number(item.quantity);
                    const cost = Number(item.products.purchase_price || 0);

                    const revenue = price * qty;
                    const profit = (price - cost) * qty;

                    totalSales += revenue;
                    totalProfit += profit;
                    activeSaleItemIds.add(item.sale_id);
                }
            });

            // Recalculate interesting metrics
            const itemCount = activeSaleItemIds.size; // Transactions with at least 1 active product
            const avgBasket = itemCount > 0 ? totalSales / itemCount : 0;

            setStats({
                totalSales,
                totalProfit,
                itemCount,
                avgBasket,
                comparison: 0 // In a real app, you'd compare with yesterday
            });

            // Group by product to find top sellers
            const productStats: any = {};
            saleItems?.forEach((item: any) => {
                // Skip if product deleted
                if (!item.products) return;

                const pid = item.product_id;
                if (!productStats[pid]) {
                    productStats[pid] = {
                        name: item.products?.name || "Bilinmeyen Ürün",
                        barcode: item.products?.barcode || "-",
                        totalRevenue: 0,
                        totalQty: 0
                    };
                }
                productStats[pid].totalRevenue += Number((item.unit_price * item.quantity) || 0);
                productStats[pid].totalQty += Number(item.quantity || 0);
            });

            const top = Object.values(productStats)
                .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
                .slice(0, 5);

            setTopProducts(top);

        } catch (error: any) {
            console.error("Rapor hatası:", error.message);
        } finally {
            setLoading(false);
        }
    };

    const lowStock = products.filter((p: any) => p.stock_quantity < 10);

    const insights = [
        {
            type: "success",
            icon: Zap,
            title: "Satış Performansı",
            desc: stats.totalSales > 0 ? `Bugün toplam ₺${stats.totalSales.toLocaleString('tr-TR')} ciro yaptınız. En çok satan ürününüz: ${topProducts[0]?.name || "-"}` : "Bugün henüz satış yapılmadı.",
        },
        {
            type: "warning",
            icon: TriangleAlert,
            title: "Kritik Stok Uyarısı",
            desc: lowStock.length > 0 ? `${lowStock[0]?.name} dahil ${lowStock.length} ürün kritik stok seviyesinde. Tedarik planı önerilir.` : "Tüm ürünlerin stok seviyesi yeterli.",
        },
        {
            type: "info",
            icon: Star,
            title: "Karlılık Analizi",
            desc: stats.totalProfit > 0 ? `Bugünkü kar marjınız yaklaşık %${((stats.totalProfit / stats.totalSales) * 100).toFixed(1)}. Mağaza verimliliği stabil.` : "Karlılık analizi için daha fazla satış verisi gerekiyor.",
        }
    ];

    return (
        <div className="space-y-10 pb-20">
            <div className="flex items-center justify-between bg-card/20 p-6 rounded-2xl border border-border">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-[3px]">Z-Raporu & Analiz</p>
                        <p className="text-sm text-secondary font-medium">Günün performansı ve veritabanı analizleri.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => exportZReportExcel(stats, topProducts)}
                        disabled={loading || stats.totalSales === 0}
                        className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 border border-border px-6 py-3 rounded-2xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        <Download className="w-4 h-4" />
                        <span>Excel</span>
                    </button>
                    <button
                        onClick={() => generateZReportPDF(stats, topProducts)}
                        disabled={loading || stats.totalSales === 0}
                        className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FileText className="w-5 h-5" />
                        <span>PDF İndir</span>
                    </button>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Bugünkü Ciro", val: `₺${stats.totalSales.toLocaleString('tr-TR', { minimumFractionDigits: 1 })}`, color: "text-white", icon: BarChart3, sub: stats.totalSales > 0 ? "Gerçek satış verisi" : "Henüz satış yok" },
                    { label: "Net Kar", val: `₺${stats.totalProfit.toLocaleString('tr-TR', { minimumFractionDigits: 1 })}`, color: "text-emerald-400", icon: TrendingUp, sub: `Marj: %${stats.totalSales > 0 ? ((stats.totalProfit / stats.totalSales) * 100).toFixed(1) : 0}` },
                    { label: "İşlem Sayısı", val: stats.itemCount, color: "text-blue-400", icon: Target, sub: `Ort. Sepet: ₺${stats.avgBasket.toFixed(0)}` },
                    { label: "Kritik Stok", val: lowStock.length, color: "text-rose-500", icon: Package, sub: "Ürün acil tedarik bekliyor" },
                ].map((s, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="glass-card !p-6 border-white/5 hover:border-white/10 transition-all"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-white/5 rounded-xl text-primary">
                                <s.icon className={`w-6 h-6 ${s.color}`} />
                            </div>
                        </div>
                        <p className="text-secondary text-[10px] font-bold uppercase tracking-widest">{s.label}</p>
                        <h3 className={`text-3xl font-bold mt-1 ${s.color}`}>{s.val}</h3>
                        <p className="text-[10px] text-secondary/60 mt-2 font-semibold uppercase">{s.sub}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Insights Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center space-x-3 mb-2">
                        <Sparkles className="w-6 h-6 text-primary" />
                        <h3 className="text-2xl font-bold">Smart Insights</h3>
                    </div>

                    <div className="space-y-4">
                        {insights.map((insight, i) => (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + (i * 0.1) }}
                                key={i}
                                className={`p-6 rounded-3xl border flex items-start space-x-6 group hover:scale-[1.01] transition-all cursor-default
                                    ${insight.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' :
                                        insight.type === 'warning' ? 'bg-rose-500/5 border-rose-500/20' :
                                            'bg-blue-500/5 border-blue-500/20'}`}
                            >
                                <div className={`p-4 rounded-2xl 
                                    ${insight.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                                        insight.type === 'warning' ? 'bg-rose-500/20 text-rose-400' :
                                            'bg-blue-500/20 text-blue-400'}`}>
                                    <insight.icon className="w-8 h-8" />
                                </div>
                                <div>
                                    <h4 className={`text-xl font-semibold mb-1 
                                        ${insight.type === 'success' ? 'text-emerald-400' :
                                            insight.type === 'warning' ? 'text-rose-400' :
                                                'text-blue-400'}`}>{insight.title}</h4>
                                    <p className="text-secondary leading-relaxed font-semibold">{insight.desc}</p>
                                </div>
                                <div className="flex-1 flex justify-end items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ChevronRight className="w-6 h-6 text-secondary" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Top Products Section */}
                <div className="space-y-6">
                    <h3 className="text-2xl font-bold flex items-center">
                        <Star className="w-6 h-6 text-amber-400 mr-2" /> Günün Yıldızları
                    </h3>
                    <div className="glass-card !p-0 overflow-hidden">
                        {loading ? (
                            <div className="p-10 text-center text-secondary font-semibold italic">Hesaplanıyor...</div>
                        ) : topProducts.length === 0 ? (
                            <div className="p-10 text-center text-secondary font-semibold italic">Henüz satış yok.</div>
                        ) : topProducts.map((p, i) => (
                            <div key={i} className="flex items-center justify-between p-5 border-b border-white/5 last:border-0 hover:bg-white/5 transition-all">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center font-bold text-primary">
                                        #{i + 1}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm uppercase tracking-tight">{p.name}</p>
                                        <p className="text-[10px] text-secondary uppercase font-bold tracking-widest">{p.barcode}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-emerald-400">₺{p.totalRevenue.toLocaleString('tr-TR')}</p>
                                    <p className="text-[10px] text-secondary font-bold uppercase tracking-tighter">{p.totalQty} Adet</p>
                                </div>
                            </div>
                        ))}
                        <div className="p-4 bg-white/5">
                            <button className="w-full py-4 rounded-xl border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all">
                                Tüm Listeyi Gör
                            </button>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 rounded-3xl p-6">
                        <h4 className="font-bold text-indigo-300 flex items-center mb-3 uppercase tracking-widest text-xs">
                            <Zap className="w-4 h-4 mr-2" /> Yapay Zeka Özeti
                        </h4>
                        <p className="text-xs text-indigo-200/70 leading-relaxed font-semibold italic">
                            {stats.totalSales > 0
                                ? "Bugünkü satış grafiğiniz yükseliş trendinde. Özellikle en çok satan ürünlerinizde stok kontrolü yapmanız önerilir."
                                : "Bugün henüz satış verisi oluşmadı. Satışlar başladığında yapay zeka analizi burada görünecektir."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
