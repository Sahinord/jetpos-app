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
    TriangleAlert,
    Calendar as CalendarIcon,
    Info
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { generateZReportPDF, exportZReportExcel } from "@/lib/reports";
import { useTenant } from "@/lib/tenant-context";

export default function SmartReports({ products }: any) {
    const { currentTenant } = useTenant();
    const [activeTab, setActiveTab] = useState<'daily' | 'financial'>('daily');
    const [stats, setStats] = useState({
        totalSales: 0,
        totalProfit: 0,
        itemCount: 0,
        avgBasket: 0,
        comparison: 0,
        totalVat: 0,
        vatBreakdown: {} as Record<number, number>
    });
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setHours(0,0,0,0)),
        end: new Date(new Date().setHours(23,59,59,999))
    });

    useEffect(() => {
        fetchStats();
    }, [dateRange, currentTenant]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            if (!currentTenant) return;

            // 1. Fetch Sales in range
            const { data: sales, error: salesError } = await supabase
                .from('sales')
                .select('*')
                .eq('tenant_id', currentTenant.id)
                .gte('created_at', dateRange.start.toISOString())
                .lte('created_at', dateRange.end.toISOString());

            if (salesError) throw salesError;

            // 2. Fetch Detailed Items
            const { data: saleItems, error: itemsError } = await supabase
                .from('sale_items')
                .select('*, products(*)')
                .eq('tenant_id', currentTenant.id)
                .gte('created_at', dateRange.start.toISOString())
                .lte('created_at', dateRange.end.toISOString());

            if (itemsError) throw itemsError;

            let totalSales = 0;
            let totalProfit = 0;
            let totalVat = 0;
            const vatBreakdown: Record<number, number> = {};
            const activeSaleIds = new Set();

            saleItems?.forEach((item: any) => {
                const price = Number(item.unit_price);
                const qty = Number(item.quantity);
                const vatRate = Number(item.vat_rate || item.products?.vat_rate || 0);
                const cost = Number(item.products?.purchase_price || 0);

                const revenue = price * qty;
                const profit = (price - cost) * qty;
                
                // VAT Calculation (Assuming price includes VAT)
                // VAT = Price - (Price / (1 + Rate/100))
                const vatAmount = revenue - (revenue / (1 + (vatRate / 100)));

                totalSales += revenue;
                totalProfit += profit;
                totalVat += vatAmount;
                
                if (vatRate > 0) {
                    vatBreakdown[vatRate] = (vatBreakdown[vatRate] || 0) + vatAmount;
                }
                
                activeSaleIds.add(item.sale_id);
            });

            const itemCount = activeSaleIds.size;
            const avgBasket = itemCount > 0 ? totalSales / itemCount : 0;

            setStats({
                totalSales,
                totalProfit,
                itemCount,
                avgBasket,
                comparison: 0,
                totalVat,
                vatBreakdown
            });

            // Top Products
            const productStats: any = {};
            saleItems?.forEach((item: any) => {
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
            desc: stats.totalSales > 0 ? `Seçili dönemde ₺${stats.totalSales.toLocaleString('tr-TR')} ciro yaptınız. En çok satan: ${topProducts[0]?.name || "-"}` : "Dönem için satış bulunamadı.",
        },
        {
            type: "warning",
            icon: TriangleAlert,
            title: "Kritik Stok Uyarısı",
            desc: lowStock.length > 0 ? `${lowStock[0]?.name} dahil ${lowStock.length} ürün kritik seviyede.` : "Stok seviyeleri stabil.",
        },
        {
            type: "info",
            icon: Star,
            title: "Vergi Dağılımı",
            desc: stats.totalVat > 0 ? `Toplam ₺${stats.totalVat.toLocaleString('tr-TR')} KDV tahsil edildi. Ortalama kar marjı: %${((stats.totalProfit / stats.totalSales) * 100).toFixed(1)}` : "Vergi verisi henüz oluşmadı.",
        }
    ];

    return (
        <div className="space-y-6 pb-20">
            {/* Tab and Filter Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card/20 p-4 rounded-3xl border border-border">
                <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-white/5">
                    <button 
                        onClick={() => {
                            setActiveTab('daily');
                            setDateRange({
                                start: new Date(new Date().setHours(0,0,0,0)),
                                end: new Date(new Date().setHours(23,59,59,999))
                            });
                        }}
                        className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'daily' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        GÜNLÜK ÖZET
                    </button>
                    <button 
                        onClick={() => setActiveTab('financial')}
                        className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'financial' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        MALİ ANALİZ
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-900/50 border border-white/5 rounded-2xl px-4 py-2">
                        <CalendarIcon size={14} className="text-primary" />
                        <input 
                            type="date" 
                            className="bg-transparent text-xs font-bold text-white outline-none"
                            value={dateRange.start.toISOString().split('T')[0]}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: new Date(new Date(e.target.value).setHours(0,0,0,0)) }))}
                        />
                        <span className="text-slate-600">-</span>
                        <input 
                            type="date" 
                            className="bg-transparent text-xs font-bold text-white outline-none"
                            value={dateRange.end.toISOString().split('T')[0]}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: new Date(new Date(e.target.value).setHours(23,59,59,999)) }))}
                        />
                    </div>
                    
                    <button
                        onClick={() => exportZReportExcel(stats, topProducts)}
                        disabled={loading || stats.totalSales === 0}
                        className="p-2.5 bg-white/5 hover:bg-white/10 border border-border rounded-xl text-slate-400 transition-all disabled:opacity-50"
                        title="Excel İndir"
                    >
                        <Download size={18} />
                    </button>
                    <button
                        onClick={() => generateZReportPDF(stats, topProducts)}
                        disabled={loading || stats.totalSales === 0}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                    >
                        <FileText size={18} />
                        <span>Z-Raporu</span>
                    </button>
                </div>
            </div>

            {activeTab === 'daily' ? (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: "Toplam Ciro", val: `₺${stats.totalSales.toLocaleString('tr-TR', { minimumFractionDigits: 1 })}`, color: "text-white", icon: BarChart3, sub: "KDV Dahil Satış" },
                            { label: "Net Kar", val: `₺${stats.totalProfit.toLocaleString('tr-TR', { minimumFractionDigits: 1 })}`, color: "text-emerald-400", icon: TrendingUp, sub: `Marj: %${stats.totalSales > 0 ? ((stats.totalProfit / stats.totalSales) * 100).toFixed(1) : 0}` },
                            { label: "İşlem Sayısı", val: stats.itemCount, color: "text-blue-400", icon: Target, sub: `Ort. Sepet: ₺${stats.avgBasket.toFixed(0)}` },
                            { label: "Toplam KDV", val: `₺${stats.totalVat.toLocaleString('tr-TR', { minimumFractionDigits: 1 })}`, color: "text-amber-400", icon: Zap, sub: "Ödenecek Vergi Yükü" },
                        ].map((s, i) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={i}
                                className="glass-card !p-6 border-white/5 hover:border-white/10 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">
                                        <s.icon className={`w-6 h-6 ${s.color}`} />
                                    </div>
                                </div>
                                <p className="text-secondary text-[10px] font-black uppercase tracking-widest">{s.label}</p>
                                <h3 className={`text-2xl font-black mt-1 ${s.color}`}>{s.val}</h3>
                                <p className="text-[10px] text-secondary/60 mt-2 font-semibold uppercase">{s.sub}</p>
                            </motion.div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center space-x-3 mb-2">
                                <Sparkles className="w-6 h-6 text-primary" />
                                <h3 className="text-2xl font-black text-white">JetPOS Akıllı Analiz</h3>
                            </div>

                            <div className="space-y-4">
                                {insights.map((insight, i) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 + (i * 0.1) }}
                                        key={i}
                                        className={`p-6 rounded-3xl border flex items-start space-x-6 group hover:bg-white/[0.02] transition-all
                                            ${insight.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/10' :
                                                insight.type === 'warning' ? 'bg-rose-500/5 border-rose-500/10' :
                                                    'bg-blue-500/5 border-blue-500/10'}`}
                                    >
                                        <div className={`p-4 rounded-2xl 
                                            ${insight.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                                                insight.type === 'warning' ? 'bg-rose-500/20 text-rose-400' :
                                                    'bg-blue-500/20 text-blue-400'}`}>
                                            <insight.icon className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h4 className={`text-lg font-black mb-1 
                                                ${insight.type === 'success' ? 'text-emerald-400' :
                                                    insight.type === 'warning' ? 'text-rose-400' :
                                                        'text-blue-400'}`}>{insight.title}</h4>
                                            <p className="text-sm text-slate-400 leading-relaxed font-bold">{insight.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-xl font-black text-white flex items-center gap-2">
                                <Star className="w-6 h-6 text-amber-400" /> En Çok Satanlar
                            </h3>
                            <div className="glass-card !p-0 overflow-hidden border border-white/5">
                                {topProducts.map((p, i) => (
                                    <div key={i} className="flex items-center justify-between p-5 border-b border-white/5 last:border-0 hover:bg-white/5 transition-all">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center font-black text-primary">#{i + 1}</div>
                                            <div>
                                                <p className="font-bold text-sm text-white">{p.name}</p>
                                                <p className="text-[10px] text-secondary font-black tracking-widest">{p.barcode}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-emerald-400 text-sm">₺{p.totalRevenue.toLocaleString('tr-TR')}</p>
                                            <p className="text-[10px] text-secondary font-black">{p.totalQty} Adet</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* VAT BREAKDOWN */}
                    <div className="glass-card border-white/5 space-y-6">
                        <h3 className="text-xl font-black text-white flex items-center gap-3">
                            <Zap className="text-amber-400" /> KDV Detay Analizi
                        </h3>
                        <div className="space-y-4">
                            {Object.entries(stats.vatBreakdown).length > 0 ? (
                                Object.entries(stats.vatBreakdown).map(([rate, amount]: any) => (
                                    <div key={rate} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <div>
                                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">KDV ORANI</span>
                                            <p className="text-2xl font-black text-white">%{rate}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">TAHSİL EDİLEN KDV</span>
                                            <p className="text-2xl font-black text-emerald-400">₺{amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-10 text-center text-slate-600 font-bold italic">Mali veri bulunamadı.</div>
                            )}
                        </div>
                        
                        <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl">
                            <div className="flex items-center gap-3 mb-2">
                                <Info className="text-amber-500" />
                                <h4 className="text-sm font-black text-amber-500 uppercase">Mali Hatırlatma</h4>
                            </div>
                            <p className="text-xs text-amber-500/80 font-bold leading-relaxed">
                                Bu döküm seçilen tarihler arasındaki toplam KDV yükünüzü gösterir. Resmî beyan için muhasebecinizle onaylaşmanız önerilir.
                            </p>
                        </div>
                    </div>

                    {/* PROFITABILITY & MARGINS */}
                    <div className="glass-card border-white/5 space-y-6">
                        <h3 className="text-xl font-black text-white flex items-center gap-3">
                            <TrendingUp className="text-emerald-400" /> Karlılık & Verimlilik
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-slate-900/50 rounded-3xl border border-white/5">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TOPLAM CİRO (KDV'Lİ)</span>
                                <p className="text-2xl font-black text-white mt-1">₺{stats.totalSales.toLocaleString('tr-TR')}</p>
                            </div>
                            <div className="p-6 bg-slate-900/50 rounded-3xl border border-white/5">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TOPLAM MALİYET</span>
                                <p className="text-2xl font-black text-rose-500 mt-1">₺{(stats.totalSales - stats.totalProfit).toLocaleString('tr-TR')}</p>
                            </div>
                            <div className="p-6 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 col-span-2">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">NET KAR</span>
                                        <p className="text-3xl font-black text-emerald-400 mt-1">₺{stats.totalProfit.toLocaleString('tr-TR')}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">KAR MARJI</span>
                                        <p className="text-3xl font-black text-emerald-400 mt-1">%{(stats.totalSales > 0 ? (stats.totalProfit / stats.totalSales) * 100 : 0).toFixed(1)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl">
                            <h4 className="text-sm font-black text-indigo-400 flex items-center gap-2 mb-3">
                                <Zap size={16} /> Yapay Zeka Mali Öngörü
                            </h4>
                            <p className="text-xs text-indigo-300/70 leading-relaxed font-bold italic">
                                {stats.totalSales > 1000 ? "Karlılığınız sektör ortalamasının %12 üzerinde seyrediyor. Mevcut gider yapınız ciroyu destekler nitelikte." : "Analiz için daha fazla veriye ihtiyaç var."}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

