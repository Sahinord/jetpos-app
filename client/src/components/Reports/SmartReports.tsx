"use client";

import { useState, useEffect } from "react";
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Zap,
    Star,
    Calendar as CalendarIcon,
    Download,
    FileText,
    Activity,
    Brain,
    Percent,
    Wallet,
    Banknote,
    CreditCard,
    Landmark,
    PieChart as PieChartIcon,
    Tags,
    PackageX
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
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

const PAYMENT_META: Record<string, { label: string; color: string; icon: any }> = {
    'NAKİT': { label: 'Nakit', color: '#10b981', icon: Banknote },
    'KART': { label: 'Kart', color: '#3b82f6', icon: CreditCard },
    'VERESİYE': { label: 'Veresiye', color: '#f59e0b', icon: Wallet },
    'HAVALE/EFT': { label: 'Havale/EFT', color: '#6366f1', icon: Landmark },
};
const OTHER_PAYMENT_COLOR = '#64748b';

export default function SmartReports({ products }: any) {
    const { currentTenant } = useTenant();
    const [activeTab, setActiveTab] = useState<'daily' | 'financial'>('daily');
    const [stats, setStats] = useState({
        totalSales: 0,
        totalProfit: 0,
        itemCount: 0,
        avgBasket: 0,
        totalVat: 0,
        vatBreakdown: {} as Record<number, number>,
        totalExpenses: 0,
        netProfitAfterExpenses: 0,
        salesChangePct: null as number | null
    });
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [paymentBreakdown, setPaymentBreakdown] = useState<{ method: string; amount: number }[]>([]);
    const [categoryBreakdown, setCategoryBreakdown] = useState<{ name: string; amount: number }[]>([]);
    const [criticalStock, setCriticalStock] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<any[]>([]);
    const [peakHour, setPeakHour] = useState<string | null>(null);

    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setHours(0,0,0,0)),
        end: new Date(new Date().setHours(23,59,59,999))
    });
    const [activePreset, setActivePreset] = useState<'today' | 'week' | 'month' | 'custom'>('today');

    useEffect(() => {
        fetchStats();
    }, [dateRange, currentTenant]);

    const applyPreset = (preset: 'today' | 'week' | 'month') => {
        const now = new Date();
        let start: Date;
        if (preset === 'today') {
            start = new Date(new Date().setHours(0,0,0,0));
        } else if (preset === 'week') {
            start = new Date();
            const diff = start.getDate() - start.getDay() + (start.getDay() === 0 ? -6 : 1);
            start = new Date(start.setDate(diff));
            start.setHours(0,0,0,0);
        } else {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            start.setHours(0,0,0,0);
        }
        setActivePreset(preset);
        setDateRange({ start, end: new Date(new Date().setHours(23,59,59,999)) });
    };

    const fetchStats = async () => {
        setLoading(true);
        try {
            if (!currentTenant) return;

            const startIsValid = dateRange.start instanceof Date && !isNaN(dateRange.start.getTime());
            const endIsValid = dateRange.end instanceof Date && !isNaN(dateRange.end.getTime());
            if (!startIsValid || !endIsValid) return;

            const startISO = dateRange.start.toISOString();
            const endISO = dateRange.end.toISOString();

            const rangeMs = dateRange.end.getTime() - dateRange.start.getTime();
            const prevEnd = new Date(dateRange.start.getTime() - 1);
            const prevStart = new Date(prevEnd.getTime() - rangeMs);

            const [
                { data: saleItems, error: itemsError },
                { data: salesRows },
                { data: prevSalesRows },
                { data: expenseRows },
                { data: stockRows }
            ] = await Promise.all([
                supabase
                    .from('sale_items')
                    .select('*, products(*, categories(name))')
                    .eq('tenant_id', currentTenant.id)
                    .gte('created_at', startISO)
                    .lte('created_at', endISO),
                supabase
                    .from('sales')
                    .select('total_amount, payment_method, status')
                    .eq('tenant_id', currentTenant.id)
                    .neq('status', 'cancelled')
                    .gte('created_at', startISO)
                    .lte('created_at', endISO),
                supabase
                    .from('sales')
                    .select('total_amount, status')
                    .eq('tenant_id', currentTenant.id)
                    .neq('status', 'cancelled')
                    .gte('created_at', prevStart.toISOString())
                    .lte('created_at', prevEnd.toISOString()),
                supabase
                    .from('expenses')
                    .select('amount')
                    .eq('tenant_id', currentTenant.id)
                    .gte('expense_date', startISO.split('T')[0])
                    .lte('expense_date', endISO.split('T')[0]),
                supabase
                    .from('products')
                    .select('id, name, stock_quantity')
                    .eq('tenant_id', currentTenant.id)
                    .lte('stock_quantity', 5)
                    .order('stock_quantity', { ascending: true })
                    .limit(5)
            ]);

            if (itemsError) throw itemsError;

            let totalSales = 0;
            let totalProfit = 0;
            let totalVat = 0;
            const vatBreakdown: Record<number, number> = {};
            const activeSaleIds = new Set();
            const hourlyData: Record<string, number> = {};
            const categoryMap: Record<string, number> = {};

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

                const catName = item.products?.categories?.name || 'Diğer';
                categoryMap[catName] = (categoryMap[catName] || 0) + revenue;
            });

            const chartDataArray = Object.entries(hourlyData)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => parseInt(a.name) - parseInt(b.name));

            if (chartDataArray.length === 0) {
                setChartData([
                    { name: '09:00', value: 0 }, { name: '12:00', value: 0 },
                    { name: '15:00', value: 0 }, { name: '18:00', value: 0 }, { name: '21:00', value: 0 }
                ]);
                setPeakHour(null);
            } else {
                setChartData(chartDataArray);
                const peak = chartDataArray.reduce((max, cur) => cur.value > max.value ? cur : max, chartDataArray[0]);
                setPeakHour(peak.value > 0 ? peak.name : null);
            }

            const itemCount = activeSaleIds.size;
            const avgBasket = itemCount > 0 ? totalSales / itemCount : 0;

            const totalExpenses = (expenseRows || []).reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);
            const netProfitAfterExpenses = totalProfit - totalExpenses;

            const currentPeriodTotal = (salesRows || []).reduce((sum: number, r: any) => sum + Number(r.total_amount || 0), 0);
            const prevPeriodTotal = (prevSalesRows || []).reduce((sum: number, r: any) => sum + Number(r.total_amount || 0), 0);
            const salesChangePct = prevPeriodTotal > 0
                ? ((currentPeriodTotal - prevPeriodTotal) / prevPeriodTotal) * 100
                : (currentPeriodTotal > 0 ? 100 : null);

            setStats({
                totalSales,
                totalProfit,
                itemCount,
                avgBasket,
                totalVat,
                vatBreakdown,
                totalExpenses,
                netProfitAfterExpenses,
                salesChangePct
            });

            const paymentMap: Record<string, number> = {};
            (salesRows || []).forEach((s: any) => {
                const method = s.payment_method || 'Diğer';
                paymentMap[method] = (paymentMap[method] || 0) + Number(s.total_amount || 0);
            });
            setPaymentBreakdown(
                Object.entries(paymentMap)
                    .map(([method, amount]) => ({ method, amount }))
                    .sort((a, b) => b.amount - a.amount)
            );

            setCategoryBreakdown(
                Object.entries(categoryMap)
                    .map(([name, amount]) => ({ name, amount }))
                    .sort((a, b) => b.amount - a.amount)
                    .slice(0, 5)
            );

            setCriticalStock(stockRows || []);

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
        { title: "Satış Performansı", val: `₺${stats.totalSales.toLocaleString('tr-TR')}`, icon: Zap, color: "text-blue-500", bg: "bg-blue-500/5", change: stats.salesChangePct },
        { title: "Net Kâr", val: `₺${stats.totalProfit.toLocaleString('tr-TR')}`, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/5", change: null },
        { title: "Sepet Ortalaması", val: `₺${stats.avgBasket.toFixed(0)}`, icon: Activity, color: "text-indigo-500", bg: "bg-indigo-500/5", change: null },
        { title: "KDV Toplamı", val: `₺${stats.totalVat.toLocaleString('tr-TR')}`, icon: Percent, color: "text-amber-500", bg: "bg-amber-500/5", change: null },
    ];

    const totalPaymentAmount = paymentBreakdown.reduce((s, p) => s + p.amount, 0);
    const totalCategoryAmount = categoryBreakdown.reduce((s, c) => s + c.amount, 0);
    const dominantPayment = paymentBreakdown[0];
    const topCategory = categoryBreakdown[0];

    const smartInsight = (() => {
        if (stats.totalSales === 0) return "Daha fazla analiz için satış verisi bekleniyor.";
        const parts: string[] = [];
        if (peakHour) parts.push(`En yoğun satış saati ${peakHour}.`);
        if (topCategory) parts.push(`En çok ciro getiren kategori "${topCategory.name}".`);
        if (dominantPayment) {
            const label = PAYMENT_META[dominantPayment.method]?.label || dominantPayment.method;
            const pct = totalPaymentAmount > 0 ? ((dominantPayment.amount / totalPaymentAmount) * 100).toFixed(0) : 0;
            parts.push(`Tahsilatların %${pct}'i ${label.toLowerCase()} ile yapılıyor.`);
        }
        if (criticalStock.length > 0) parts.push(`${criticalStock.length} üründe stok kritik seviyede, tedarik planlamanızı kontrol edin.`);
        return parts.join(' ');
    })();

    return (
        <div className="space-y-6 pb-12">
            {/* Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center bg-card border border-border rounded-xl p-1">
                    <button
                        onClick={() => setActiveTab('daily')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'daily' ? 'bg-primary text-primary-foreground' : 'text-secondary hover:text-foreground'}`}
                    >
                        Günlük Özet
                    </button>
                    <button
                        onClick={() => setActiveTab('financial')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'financial' ? 'bg-primary text-primary-foreground' : 'text-secondary hover:text-foreground'}`}
                    >
                        Mali Analiz
                    </button>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-secondary uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Canlı Veri
                </div>
            </div>

            {/* Date Filters & Export */}
            <div className="bg-card/50 border border-border p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center bg-background border border-border rounded-xl p-1">
                        {[
                            { key: 'today', label: 'Bugün' },
                            { key: 'week', label: 'Bu Hafta' },
                            { key: 'month', label: 'Bu Ay' },
                        ].map(p => (
                            <button
                                key={p.key}
                                onClick={() => applyPreset(p.key as any)}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${activePreset === p.key ? 'bg-primary text-primary-foreground' : 'text-secondary hover:text-foreground'}`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3 bg-background border border-border rounded-xl px-4 py-2">
                        <CalendarIcon size={16} className="text-secondary" />
                        <input
                            type="date"
                            className="bg-transparent text-xs font-bold text-foreground outline-none"
                            value={dateRange.start instanceof Date && !isNaN(dateRange.start.getTime()) ? dateRange.start.toISOString().split('T')[0] : ""}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (!val) return;
                                const d = new Date(val);
                                if (isNaN(d.getTime())) return;
                                setActivePreset('custom');
                                setDateRange(prev => ({ ...prev, start: new Date(d.setHours(0,0,0,0)) }));
                            }}
                        />
                        <span className="text-secondary">-</span>
                        <input
                            type="date"
                            className="bg-transparent text-xs font-bold text-foreground outline-none"
                            value={dateRange.end instanceof Date && !isNaN(dateRange.end.getTime()) ? dateRange.end.toISOString().split('T')[0] : ""}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (!val) return;
                                const d = new Date(val);
                                if (isNaN(d.getTime())) return;
                                setActivePreset('custom');
                                setDateRange(prev => ({ ...prev, end: new Date(d.setHours(23,59,59,999)) }));
                            }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={() => exportZReportExcel(stats, topProducts)} className="flex items-center gap-2 px-4 py-2 bg-muted/50 hover:bg-muted border border-border rounded-xl text-xs font-bold text-secondary transition-all">
                        <Download size={14} /> Excel
                    </button>
                    <button onClick={() => generateZReportPDF(stats, topProducts)} className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold transition-all shadow-lg shadow-primary/20">
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
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg ${s.bg} ${s.color}`}>
                                                <s.icon size={18} />
                                            </div>
                                            <span className="text-xs font-bold text-secondary uppercase tracking-tight">{s.title}</span>
                                        </div>
                                        {s.change !== null && s.change !== undefined && (
                                            <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-black ${s.change >= 0 ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'}`}>
                                                {s.change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                                {Math.abs(s.change).toFixed(0)}%
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-2xl font-bold text-foreground tracking-tight">{s.val}</h3>
                                    {s.change !== null && s.change !== undefined && (
                                        <p className="text-[10px] text-secondary font-bold mt-1">önceki döneme göre</p>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Chart Area */}
                            <div className="lg:col-span-2 bg-card border border-border p-6 rounded-2xl space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-foreground uppercase flex items-center gap-2">
                                        <BarChart3 size={16} className="text-primary" /> Satış Grafiği
                                    </h3>
                                    <span className="text-[10px] text-secondary font-bold">SAATLİK VERİ {peakHour ? `· ZİRVE ${peakHour}` : ''}</span>
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
                                <h3 className="text-sm font-bold text-foreground uppercase flex items-center gap-2">
                                    <Star size={16} className="text-amber-500" /> En Çok Satanlar
                                </h3>
                                <div className="space-y-3">
                                    {topProducts.length === 0 ? (
                                        <div className="py-12 text-center text-slate-600 text-xs font-bold italic">Veri bulunamadı.</div>
                                    ) : topProducts.map((p, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-border">
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center rounded-md">{i + 1}</span>
                                                <p className="text-xs font-bold text-foreground truncate max-w-[120px]">{p.name}</p>
                                            </div>
                                            <p className="text-xs font-bold text-emerald-500">₺{p.totalRevenue.toLocaleString('tr-TR')}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Next-gen analytics row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Payment method breakdown */}
                            <div className="bg-card border border-border p-6 rounded-2xl space-y-5">
                                <h3 className="text-sm font-bold text-foreground uppercase flex items-center gap-2">
                                    <PieChartIcon size={16} className="text-blue-500" /> Ödeme Yöntemi Dağılımı
                                </h3>
                                {paymentBreakdown.length === 0 ? (
                                    <div className="py-12 text-center text-slate-600 text-xs font-bold italic">Veri bulunamadı.</div>
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <div className="w-[110px] h-[110px] shrink-0">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={paymentBreakdown}
                                                        dataKey="amount"
                                                        nameKey="method"
                                                        innerRadius={32}
                                                        outerRadius={50}
                                                        paddingAngle={2}
                                                        stroke="none"
                                                    >
                                                        {paymentBreakdown.map((p, i) => (
                                                            <Cell key={i} fill={PAYMENT_META[p.method]?.color || OTHER_PAYMENT_COLOR} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '12px' }} formatter={(v: any) => `₺${Number(v).toLocaleString('tr-TR')}`} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="flex-1 space-y-2 min-w-0">
                                            {paymentBreakdown.map((p, i) => {
                                                const meta = PAYMENT_META[p.method];
                                                const pct = totalPaymentAmount > 0 ? (p.amount / totalPaymentAmount) * 100 : 0;
                                                return (
                                                    <div key={i} className="flex items-center justify-between gap-2 text-xs">
                                                        <span className="flex items-center gap-2 font-bold text-secondary truncate">
                                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: meta?.color || OTHER_PAYMENT_COLOR }} />
                                                            {meta?.label || p.method}
                                                        </span>
                                                        <span className="font-bold text-foreground shrink-0">%{pct.toFixed(0)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Category breakdown */}
                            <div className="bg-card border border-border p-6 rounded-2xl space-y-5">
                                <h3 className="text-sm font-bold text-foreground uppercase flex items-center gap-2">
                                    <Tags size={16} className="text-purple-500" /> Kategori Bazlı Satış
                                </h3>
                                {categoryBreakdown.length === 0 ? (
                                    <div className="py-12 text-center text-slate-600 text-xs font-bold italic">Veri bulunamadı.</div>
                                ) : (
                                    <div className="space-y-3">
                                        {categoryBreakdown.map((c, i) => {
                                            const pct = totalCategoryAmount > 0 ? (c.amount / totalCategoryAmount) * 100 : 0;
                                            return (
                                                <div key={i} className="space-y-1">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-bold text-foreground truncate max-w-[140px]">{c.name}</span>
                                                        <span className="font-bold text-secondary">₺{c.amount.toLocaleString('tr-TR')}</span>
                                                    </div>
                                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Critical stock */}
                            <div className="bg-card border border-border p-6 rounded-2xl space-y-5">
                                <h3 className="text-sm font-bold text-foreground uppercase flex items-center gap-2">
                                    <PackageX size={16} className="text-rose-500" /> Kritik Stok Uyarısı
                                </h3>
                                {criticalStock.length === 0 ? (
                                    <div className="py-12 text-center text-slate-600 text-xs font-bold italic">Kritik stokta ürün yok.</div>
                                ) : (
                                    <div className="space-y-2">
                                        {criticalStock.map((p) => (
                                            <div key={p.id} className="flex items-center justify-between p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                                                <p className="text-xs font-bold text-foreground truncate max-w-[140px]">{p.name}</p>
                                                <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 text-[10px] font-black">
                                                    {p.stock_quantity} adet
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Smart AI Insight */}
                        <div className="bg-indigo-500/5 border border-indigo-500/10 p-6 rounded-2xl flex items-start gap-4">
                            <Brain className="text-indigo-500 shrink-0 mt-1" size={24} />
                            <div>
                                <h4 className="text-sm font-bold text-indigo-500 dark:text-indigo-400 mb-1 uppercase tracking-tight">Akıllı Öneri</h4>
                                <p className="text-sm text-secondary font-medium leading-relaxed italic">
                                    {smartInsight}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="financial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-card border border-border p-8 rounded-2xl space-y-6">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-3 border-b border-border pb-4 uppercase tracking-tight">
                                <Zap className="text-amber-500" size={20} /> KDV Detayları
                            </h3>
                            <div className="space-y-4">
                                {Object.entries(stats.vatBreakdown).length > 0 ? (
                                    Object.entries(stats.vatBreakdown).map(([rate, amount]: any) => (
                                        <div key={rate} className="flex items-center justify-between p-5 bg-muted/20 rounded-2xl border border-border">
                                            <span className="text-xs font-bold text-secondary">%{rate} KDV</span>
                                            <p className="text-xl font-bold text-foreground">₺{amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 text-center text-slate-600 text-sm italic">Mali veri bulunamadı.</div>
                                )}
                            </div>
                        </div>

                        <div className="bg-card border border-border p-8 rounded-2xl space-y-6">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-3 border-b border-border pb-4 uppercase tracking-tight">
                                <TrendingUp className="text-emerald-500" size={20} /> Kâr Analizi
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 bg-background rounded-2xl border border-border">
                                    <span className="text-[10px] font-bold text-secondary uppercase">Toplam Ciro</span>
                                    <p className="text-2xl font-bold text-foreground mt-1">₺{stats.totalSales.toLocaleString('tr-TR')}</p>
                                </div>
                                <div className="p-6 bg-background rounded-2xl border border-border">
                                    <span className="text-[10px] font-bold text-secondary uppercase">Net Kâr</span>
                                    <p className="text-2xl font-bold text-emerald-500 mt-1">₺{stats.totalProfit.toLocaleString('tr-TR')}</p>
                                </div>
                                <div className="p-6 bg-background rounded-2xl border border-border">
                                    <span className="text-[10px] font-bold text-secondary uppercase">İşletme Giderleri</span>
                                    <p className="text-2xl font-bold text-rose-500 mt-1">₺{stats.totalExpenses.toLocaleString('tr-TR')}</p>
                                </div>
                                <div className="p-6 bg-background rounded-2xl border border-border">
                                    <span className="text-[10px] font-bold text-secondary uppercase">Gerçek Net Kâr</span>
                                    <p className={`text-2xl font-bold mt-1 ${stats.netProfitAfterExpenses >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>₺{stats.netProfitAfterExpenses.toLocaleString('tr-TR')}</p>
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
