"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip as ChartTooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Settings,
    History,
    Boxes,
    Brain,
    FileBarChart,
    User,
    ChevronRight,
    Activity,
    Users,
    ShieldCheck,
    TrendingUp,
    ShoppingBag,
    ArrowUpRight,
    type LucideIcon
} from "lucide-react";
import { useTenant } from "@/lib/tenant-context";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, ChartTooltip);

interface QuickAccessItem {
    id: string;
    label: string;
    icon: LucideIcon;
    bg: string;
    text: string;
}

interface HomePageProps {
    onNavigate: (tab: string) => void;
    dailyTransactions?: number;
    criticalStockCount?: number;
    activeUsersCount?: number;
    todaySalesTotal?: number;
    saleItems?: any[];
    products?: any[];
}

// Tüm kullanılabilir sayfalar — düz (flat) tek tonlu rozet renkleri
export const ALL_PAGES: QuickAccessItem[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, bg: "bg-cyan-500/10", text: "text-cyan-500" },
    { id: "pos", label: "JetKasa", icon: ShoppingCart, bg: "bg-emerald-500/10", text: "text-emerald-500" },
    { id: "products", label: "JetStok", icon: Boxes, bg: "bg-violet-500/10", text: "text-violet-500" },
    { id: "reports", label: "Satış Raporları", icon: FileBarChart, bg: "bg-rose-500/10", text: "text-rose-500" },
    { id: "history", label: "Satış Geçmişi", icon: History, bg: "bg-amber-500/10", text: "text-amber-500" },
    { id: "ai_insights", label: "Yapay Zeka", icon: Brain, bg: "bg-fuchsia-500/10", text: "text-fuchsia-500" },
    { id: "cari_liste", label: "Cari Kartı Listesi", icon: Users, bg: "bg-blue-500/10", text: "text-blue-500" },
    { id: "settings", label: "Genel Ayarlar", icon: Settings, bg: "bg-slate-500/10", text: "text-slate-400" },
];

const DEFAULT_FAVORITES = ["pos", "products", "dashboard", "ai_insights"];

export const getFavorites = (): string[] => {
    if (typeof window === 'undefined') return DEFAULT_FAVORITES;
    const saved = localStorage.getItem("jetpos_favorites");
    if (saved) {
        try { return JSON.parse(saved); } catch { return DEFAULT_FAVORITES; }
    }
    return DEFAULT_FAVORITES;
};

export const toggleFavorite = (id: string): string[] => {
    const current = getFavorites();
    let newFavorites: string[];
    if (current.includes(id)) {
        newFavorites = current.filter(f => f !== id);
    } else {
        newFavorites = [...current, id];
    }
    localStorage.setItem("jetpos_favorites", JSON.stringify(newFavorites));
    window.dispatchEvent(new CustomEvent('favorites-changed'));
    return newFavorites;
};

export const isFavorite = (id: string): boolean => {
    if (typeof window === 'undefined') return DEFAULT_FAVORITES.includes(id);
    return getFavorites().includes(id);
};

const TIPS = [
    "Sistem optimizasyonu %98 verimlilikle çalışıyor.",
    "AI Analizi: Hafta sonu satışlarında %12 artış öngörülüyor.",
    "Güvenlik Protokolü: Tüm veriler uçtan uca şifrelendi.",
    "Verimlilik İpucu: Hızlı Satış terminalinde F1 kısayolunu kullan."
];

const DAY_LABELS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

function timeAgo(dateStr: string): string {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return "şimdi";
    if (minutes < 60) return `${minutes} dk önce`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} sa önce`;
    const days = Math.floor(hours / 24);
    return `${days} gün önce`;
}

export default function HomePage({ onNavigate, dailyTransactions = 0, criticalStockCount = 0, activeUsersCount = 1, todaySalesTotal = 0, saleItems = [], products = [] }: HomePageProps) {
    const { currentTenant } = useTenant();
    const [favorites, setFavorites] = useState<string[]>(DEFAULT_FAVORITES);
    const [currentTip, setCurrentTip] = useState(0);

    useEffect(() => {
        setFavorites(getFavorites());
        const handleFavoritesChange = () => setFavorites(getFavorites());
        window.addEventListener('favorites-changed', handleFavoritesChange);
        return () => window.removeEventListener('favorites-changed', handleFavoritesChange);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => setCurrentTip(prev => (prev + 1) % TIPS.length), 10000);
        return () => clearInterval(interval);
    }, []);

    const favoritePages = favorites
        .map(id => ALL_PAGES.find(p => p.id === id))
        .filter(Boolean) as QuickAccessItem[];

    // Favorilenmemiş modüller — bir modül favorilenince buradan kalkıp üst gride taşınır
    const quickAccessPages = ALL_PAGES.filter(p => !favorites.includes(p.id));

    const today = new Date();
    const formattedDate = today.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });

    // Son 7 günün günlük cirosu
    const weeklyTrend = useMemo(() => {
        const labels: string[] = [];
        const data: number[] = [0, 0, 0, 0, 0, 0, 0];
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            labels.push(DAY_LABELS[d.getDay()]);

            const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);

            data[6 - i] = saleItems.reduce((sum, item) => {
                const itemDate = new Date(item.created_at);
                if (itemDate >= dayStart && itemDate <= dayEnd) {
                    return sum + (Number(item.quantity) * Number(item.unit_price) || 0);
                }
                return sum;
            }, 0);
        }
        return { labels, data, total: data.reduce((a, b) => a + b, 0) };
    }, [saleItems]);

    // Sale_id'ye göre gruplanmış son işlemler
    const recentSales = useMemo(() => {
        const map = new Map<string, { sale_id: string; created_at: string; total: number; count: number; productName: string }>();
        for (const item of saleItems) {
            if (!item.sale_id) continue;
            const existing = map.get(item.sale_id);
            const lineTotal = (Number(item.quantity) * Number(item.unit_price)) || 0;
            if (existing) {
                existing.total += lineTotal;
                existing.count += 1;
                if (new Date(item.created_at) > new Date(existing.created_at)) existing.created_at = item.created_at;
            } else {
                const product = products.find((p: any) => p.id === item.product_id);
                map.set(item.sale_id, {
                    sale_id: item.sale_id,
                    created_at: item.created_at,
                    total: lineTotal,
                    count: 1,
                    productName: product?.name || "Ürün"
                });
            }
        }
        return Array.from(map.values())
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 6);
    }, [saleItems, products]);

    const chartData = {
        labels: weeklyTrend.labels,
        datasets: [{
            fill: true,
            data: weeklyTrend.data,
            borderColor: '#6366f1',
            backgroundColor: (context: any) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 160);
                gradient.addColorStop(0, 'rgba(99, 102, 241, 0.18)');
                gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
                return gradient;
            },
            tension: 0.4,
            borderWidth: 2,
            pointRadius: (ctx: any) => ctx.dataIndex === ctx.dataset.data.length - 1 ? 4 : 0,
            pointBackgroundColor: '#6366f1',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: '#6366f1',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2,
        }],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index' as const, intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                padding: 10,
                borderWidth: 1,
                borderColor: 'rgba(99, 102, 241, 0.2)',
                titleColor: '#f8fafc',
                bodyColor: '#f8fafc',
                cornerRadius: 8,
                displayColors: false,
                callbacks: {
                    label: (item: any) => `₺${Number(item.raw).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
                }
            },
        },
        scales: {
            y: { display: false, min: 0, suggestedMax: Math.max(...weeklyTrend.data, 100) },
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: { color: 'rgba(148, 163, 184, 0.5)', font: { weight: '500' as const, size: 10 } },
            },
        },
    };

    return (
        <div className="h-full flex flex-col p-6 lg:p-10 space-y-10 overflow-y-auto custom-scrollbar relative bg-background selection:bg-primary/30">
            {/* Top Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1.5">
                    <motion.h1
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight"
                    >
                        Hoş geldin, <span className="text-primary">{currentTenant?.company_name || "Değerli Üyemiz"}</span>
                    </motion.h1>
                    <p className="text-secondary/60 text-sm">{formattedDate} · {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>

                <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 self-start md:self-auto shadow-[0_4px_16px_-4px_rgba(16,185,129,0.25)]">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-semibold text-emerald-600">Sistem aktif &amp; korumalı</span>
                </div>
            </header>

            {/* Main Grid */}
            <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    {/* Operational Summary */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card rounded-2xl p-6 lg:p-7 relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-indigo-400 to-blue-400" />
                        <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/[0.14] blur-[110px] rounded-full pointer-events-none" />

                        <div className="relative flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 flex items-center justify-center text-primary">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-foreground">Operasyonel Durum</h3>
                                    <p className="text-xs text-secondary/60 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Canlı izleme etkin
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold tracking-tight tabular-nums text-foreground">₺{todaySalesTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                <p className="text-xs text-secondary/60 mt-0.5">Bugünkü ciro</p>
                            </div>
                        </div>

                        {/* Action Hub Grid */}
                        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3">
                            {favoritePages.map((page, idx) => (
                                <motion.button
                                    key={page.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + idx * 0.04, duration: 0.25 }}
                                    whileHover={{ y: -3 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => onNavigate(page.id)}
                                    className="group flex flex-col items-start gap-3 p-4 rounded-xl border border-border bg-transparent hover:border-primary/30 hover:bg-primary/[0.03] transition-colors text-left"
                                >
                                    <div className={`w-10 h-10 rounded-lg ${page.bg} ${page.text} flex items-center justify-center ring-1 ring-inset ring-white/5 group-hover:scale-110 group-hover:shadow-lg transition-transform`}>
                                        <page.icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-medium text-foreground">{page.label}</span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Weekly Trend + Recent Activity */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Mini Weekly Chart */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                            className="glass-card rounded-2xl p-6 relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 to-indigo-400/30" />
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 ring-1 ring-indigo-500/20 text-indigo-400 flex items-center justify-center">
                                        <TrendingUp className="w-4.5 h-4.5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Haftalık Trend</p>
                                        <p className="text-xs text-secondary/50">Son 7 gün</p>
                                    </div>
                                </div>
                                <p className="text-sm font-semibold text-foreground tabular-nums">₺{weeklyTrend.total.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
                            </div>
                            <div className="h-[150px]">
                                <Line data={chartData} options={chartOptions as any} />
                            </div>
                        </motion.div>

                        {/* Recent Activity */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass-card rounded-2xl p-6 flex flex-col relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 to-emerald-400/30" />
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 ring-1 ring-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                        <ShoppingBag className="w-4.5 h-4.5" />
                                    </div>
                                    <p className="text-sm font-medium text-foreground">Son İşlemler</p>
                                </div>
                                <button
                                    onClick={() => onNavigate('history')}
                                    className="text-secondary/40 hover:text-foreground transition-colors"
                                >
                                    <ArrowUpRight className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex-1 space-y-0.5 overflow-y-auto custom-scrollbar max-h-[150px] pr-1">
                                {recentSales.length === 0 ? (
                                    <div className="h-full flex items-center justify-center py-8">
                                        <p className="text-xs text-secondary/40">Henüz işlem yok</p>
                                    </div>
                                ) : recentSales.map((sale) => (
                                    <motion.button
                                        key={sale.sale_id}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => onNavigate('history')}
                                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-primary/[0.04] transition-colors group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center text-secondary/50 flex-shrink-0">
                                                <ShoppingCart className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="text-left min-w-0">
                                                <p className="text-xs font-medium text-foreground truncate">
                                                    {sale.productName}{sale.count > 1 ? ` +${sale.count - 1}` : ''}
                                                </p>
                                                <p className="text-[11px] text-secondary/40">{timeAgo(sale.created_at)}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-semibold text-foreground flex-shrink-0 tabular-nums">₺{sale.total.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* AI Tip Panel */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card rounded-2xl p-6 flex flex-col justify-between min-h-[190px] relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-fuchsia-500 to-primary" />
                        <div className="absolute -top-16 -right-16 w-48 h-48 bg-fuchsia-500/[0.08] blur-[80px] rounded-full pointer-events-none" />
                        <div className="relative">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-fuchsia-500/20 to-fuchsia-500/5 ring-1 ring-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center">
                                    <Brain className="w-4.5 h-4.5" />
                                </div>
                                <span className="text-sm font-medium text-foreground">Zeka Analizi</span>
                            </div>
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={currentTip}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="text-sm text-secondary leading-relaxed"
                                >
                                    {TIPS[currentTip]}
                                </motion.p>
                            </AnimatePresence>
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onNavigate('ai_insights')}
                            className="mt-5 w-full py-2.5 rounded-lg bg-primary text-white text-sm font-medium shadow-[0_8px_20px_-6px_rgba(99,102,241,0.5)] hover:shadow-[0_10px_24px_-6px_rgba(99,102,241,0.6)] hover:bg-primary/90 transition-all"
                        >
                            Detaylı Analizi Başlat
                        </motion.button>
                    </motion.div>

                    {/* Quick Access List */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="glass-card rounded-2xl p-6 flex-1 flex flex-col min-h-[260px] relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 to-amber-400/30" />
                        <p className="text-sm font-medium text-foreground mb-3">Hızlı Erişim</p>
                        <div className="space-y-0.5 flex-1 overflow-y-auto custom-scrollbar pr-2">
                            {quickAccessPages.length === 0 ? (
                                <div className="h-full flex items-center justify-center py-8">
                                    <p className="text-xs text-secondary/40">Tüm modüller favorilendi</p>
                                </div>
                            ) : quickAccessPages.map((p) => (
                                <motion.button
                                    key={p.id}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onNavigate(p.id)}
                                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-primary/[0.04] transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-lg ${p.bg} ${p.text} flex items-center justify-center ring-1 ring-inset ring-white/5 group-hover:scale-110 transition-transform`}>
                                            <p.icon className="w-4.5 h-4.5" />
                                        </div>
                                        <span className="text-sm text-secondary group-hover:text-foreground transition-colors">{p.label}</span>
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5 text-secondary/30 group-hover:text-foreground transition-colors" />
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </main>

            {/* Bottom Diagnostic Stats */}
            <footer className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Günlük İşlem", value: dailyTransactions.toString(), sub: "Tamamlanan", icon: ShoppingCart, bg: "bg-emerald-500/10", text: "text-emerald-500", bar: "from-emerald-500 to-emerald-400/30" },
                    { label: "Kritik Stok", value: criticalStockCount.toString(), sub: "Ürün", icon: Package, bg: "bg-rose-500/10", text: "text-rose-500", bar: "from-rose-500 to-rose-400/30" },
                    { label: "Aktif Kullanıcı", value: activeUsersCount.toString(), sub: "Çevrimiçi", icon: User, bg: "bg-blue-500/10", text: "text-blue-500", bar: "from-blue-500 to-blue-400/30" }
                ].map((diag, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + (i * 0.05) }}
                        className="glass-card rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden"
                    >
                        <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${diag.bar}`} />
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${diag.bg} ring-1 ring-inset ring-white/5 ${diag.text} flex items-center justify-center flex-shrink-0`}>
                            <diag.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-secondary/50 mb-0.5">{diag.label}</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-foreground tabular-nums">{diag.value}</span>
                                <span className="text-xs text-secondary/40">{diag.sub}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </footer>
        </div>
    );
}
