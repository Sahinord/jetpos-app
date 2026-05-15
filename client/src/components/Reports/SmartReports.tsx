"use client";

import { useState, useEffect } from "react";
import {
    BarChart3,
    TrendingUp,
    Zap,
    Star,
    Calendar as CalendarIcon,
    Download,
    FileText,
    Activity,
    Info,
    ArrowUpRight,
    Brain,
    Percent
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { generateZReportPDF, exportZReportExcel } from "@/lib/reports";
import { useTenant } from "@/lib/tenant-context";
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer 
} from 'recharts';

export default function SmartReports({ products }: any) {
    const { currentTenant } = useTenant();
    const [activeTab, setActiveTab] = useState<'daily' | 'financial'>('daily');
    const [stats, setStats] = useState({
        totalSales: 0,
        totalProfit: 0,
        itemCount: 0,
        avgBasket: 0,
        totalVat: 0,
        vatBreakdown: {} as Record<number, number>
    });
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<any[]>([]);

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
            const hourlyData: Record<string, number> = {};

            saleItems?.forEach((item: any) => {
                const price = Number(item.unit_price);
                const qty = Number(item.quantity);
                const vatRate = Number(item.vat_rate || item.products?.vat_rate || 0);
                const cost = Number(item.products?.purchase_price || 0);

                const revenue = price * qty;
                const profit = (price - cost) * qty;
                const vatAmount = revenue - (revenue / (1 + (vatRate / 100)));

                totalSales += revenue;
                totalProfit += profit;
                totalVat += vatAmount;
                
                if (vatRate > 0) {
                    vatBreakdown[vatRate] = (vatBreakdown[vatRate] || 0) + vatAmount;
                }
                
                activeSaleIds.add(item.sale_id);

                const hour = new Date(item.created_at).getHours();
                const hourStr = `${hour}:00`;
                hourlyData[hourStr] = (hourlyData[hourStr] || 0) + revenue;
            });

            const chartDataArray = Object.entries(hourlyData)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => parseInt(a.name) - parseInt(b.name));
            
            if (chartDataArray.length === 0) {
                setChartData([
                    { name: '09:00', value: 0 }, { name: '12:00', value: 0 }, 
                    { name: '15:00', value: 0 }, { name: '18:00', value: 0 }, { name: '21:00', value: 0 }
                ]);
            } else {
                setChartData(chartDataArray);
            }

            const itemCount = activeSaleIds.size;
            const avgBasket = itemCount > 0 ? totalSales / itemCount : 0;

            setStats({
                totalSales,
                totalProfit,
                itemCount,
                avgBasket,
                totalVat,
                vatBreakdown
            });

            const productStats: any = {};
            saleItems?.forEach((item: any) => {
                if (!item.products) return;
                const pid = item.product_id;
                if (!productStats[pid]) {
                    productStats[pid] = {
                        name: item.products?.name || "Bilinmeyen Ürün",
                        totalRevenue: 0,
                        totalQty: 0
                    };
                }
                productStats[pid].totalRevenue += Number((item.unit_price * item.quantity) || 0);
                productStats[pid].totalQty += Number(item.quantity || 0);
            });

            setTopProducts(Object.values(productStats).sort((a: any, b: any) => b.totalRevenue - a.totalRevenue).slice(0, 5));

        } catch (error: any) {
            console.error("Rapor hatası:", error.message);
        } finally {
            setLoading(false);
        }
    };

    const insights = [
        { title: "Satış Performansı", val: `₺${stats.totalSales.toLocaleString('tr-TR')}`, icon: Zap, color: "text-blue-500", bg: "bg-blue-500/5" },
        { title: "Net Kâr", val: `₺${stats.totalProfit.toLocaleString('tr-TR')}`, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/5" },
        { title: "Sepet Ortalaması", val: `₺${stats.avgBasket.toFixed(0)}`, icon: Activity, color: "text-indigo-500", bg: "bg-indigo-500/5" },
        { title: "KDV Toplamı", val: `₺${stats.totalVat.toLocaleString('tr-TR')}`, icon: Percent, color: "text-amber-500", bg: "bg-amber-500/5" },
    ];

    return (
        <div className="space-y-6 pb-12">
            {/* Simple Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">İşletme Raporları</h1>
                    <p className="text-sm text-slate-400">Verilerinizi net ve anlaşılır şekilde takip edin.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-card border border-border rounded-xl p-1">
                        <button 
                            onClick={() => setActiveTab('daily')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'daily' ? 'bg-primary text-white' : 'text-slate-400'}`}
                        >
                            Günlük Özet
                        </button>
                        <button 
                            onClick={() => setActiveTab('financial')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'financial' ? 'bg-primary text-white' : 'text-slate-400'}`}
                        >
                            Mali Analiz
                        </button>
                    </div>
                </div>
            </div>

            {/* Date Filters & Export */}
            <div className="bg-card/50 border border-border p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 bg-background border border-border rounded-xl px-4 py-2">
                    <CalendarIcon size={16} className="text-slate-500" />
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

                <div className="flex items-center gap-2">
                    <button onClick={() => exportZReportExcel(stats, topProducts)} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-border rounded-xl text-xs font-bold text-slate-300 transition-all">
                        <Download size={14} /> Excel
                    </button>
                    <button onClick={() => generateZReportPDF(stats, topProducts)} className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-primary/20">
                        <FileText size={14} /> Z-Raporu Al
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'daily' ? (
                    <motion.div key="daily" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {insights.map((s, i) => (
                                <div key={i} className="bg-card border border-border p-5 rounded-2xl hover:border-primary/50 transition-all group">
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className={`p-2 rounded-lg ${s.bg} ${s.color}`}>
                                            <s.icon size={18} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{s.title}</span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white tracking-tight">{s.val}</h3>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Chart Area */}
                            <div className="lg:col-span-2 bg-card border border-border p-6 rounded-2xl space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                                        <BarChart3 size={16} className="text-primary" /> Satış Grafiği
                                    </h3>
                                    <span className="text-[10px] text-slate-500 font-bold">SAATLİK VERİ</span>
                                </div>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(val) => `₺${val}`} />
                                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '12px' }} />
                                            <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fill="url(#colorValue)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Top Selling Products */}
                            <div className="bg-card border border-border p-6 rounded-2xl space-y-6">
                                <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                                    <Star size={16} className="text-amber-500" /> En Çok Satanlar
                                </h3>
                                <div className="space-y-3">
                                    {topProducts.length === 0 ? (
                                        <div className="py-12 text-center text-slate-600 text-xs font-bold italic">Veri bulunamadı.</div>
                                    ) : topProducts.map((p, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center rounded-md">{i + 1}</span>
                                                <p className="text-xs font-bold text-white truncate max-w-[120px]">{p.name}</p>
                                            </div>
                                            <p className="text-xs font-bold text-emerald-500">₺{p.totalRevenue.toLocaleString('tr-TR')}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Quick AI Insight */}
                        <div className="bg-indigo-500/5 border border-indigo-500/10 p-6 rounded-2xl flex items-start gap-4">
                            <Brain className="text-indigo-500 shrink-0 mt-1" size={24} />
                            <div>
                                <h4 className="text-sm font-bold text-indigo-400 mb-1 uppercase tracking-tight">Akıllı Öneri</h4>
                                <p className="text-sm text-slate-400 font-medium leading-relaxed italic">
                                    {stats.totalSales > 0 
                                        ? "Bugünkü satış verilerinize göre akşam saatlerindeki hareketlilik kâr marjınızı %5 yukarı taşıyabilir." 
                                        : "Daha fazla analiz için satış verisi bekleniyor."}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="financial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-card border border-border p-8 rounded-2xl space-y-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-3 border-b border-border pb-4 uppercase tracking-tight">
                                <Zap className="text-amber-500" size={20} /> KDV Detayları
                            </h3>
                            <div className="space-y-4">
                                {Object.entries(stats.vatBreakdown).length > 0 ? (
                                    Object.entries(stats.vatBreakdown).map(([rate, amount]: any) => (
                                        <div key={rate} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5">
                                            <span className="text-xs font-bold text-slate-400">%{rate} KDV</span>
                                            <p className="text-xl font-bold text-white">₺{amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 text-center text-slate-600 text-sm italic">Mali veri bulunamadı.</div>
                                )}
                            </div>
                        </div>

                        <div className="bg-card border border-border p-8 rounded-2xl space-y-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-3 border-b border-border pb-4 uppercase tracking-tight">
                                <TrendingUp className="text-emerald-500" size={20} /> Kâr Analizi
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 bg-background rounded-2xl border border-border">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Toplam Ciro</span>
                                    <p className="text-2xl font-bold text-white mt-1">₺{stats.totalSales.toLocaleString('tr-TR')}</p>
                                </div>
                                <div className="p-6 bg-background rounded-2xl border border-border">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Net Kâr</span>
                                    <p className="text-2xl font-bold text-emerald-500 mt-1">₺{stats.totalProfit.toLocaleString('tr-TR')}</p>
                                </div>
                                <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl col-span-2 flex justify-between items-center">
                                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Net Kâr Marjı</span>
                                    <p className="text-3xl font-bold text-emerald-500">%{(stats.totalSales > 0 ? (stats.totalProfit / stats.totalSales) * 100 : 0).toFixed(1)}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
