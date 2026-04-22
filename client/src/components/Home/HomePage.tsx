"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Calculator,
    TrendingUp,
    BarChart3,
    Settings,
    History,
    AlertTriangle,
    Sparkles,
    FileText,
    Receipt,
    Star,
    X,
    Boxes,
    Brain,
    FileBarChart,
    User,
    ChevronRight,
    Zap,
    Clock,
    TrendingDown,
    DollarSign,
    Activity,
    Lightbulb,
    Users,
    Store,
    Cpu,
    ShieldCheck,
    type LucideIcon
} from "lucide-react";
import { useTenant } from "@/lib/tenant-context";

interface QuickAccessItem {
    id: string;
    label: string;
    icon: LucideIcon;
    color: string;
    gradient: string;
}

interface HomePageProps {
    onNavigate: (tab: string) => void;
}

// Tüm kullanılabilir sayfalar
export const ALL_PAGES: QuickAccessItem[] = [
    { id: "dashboard", label: "Konsol", icon: LayoutDashboard, color: "from-cyan-500 to-blue-600", gradient: "bg-cyan-500/20" },
    { id: "pos", label: "Hızlı Satış", icon: ShoppingCart, color: "from-emerald-500 to-teal-600", gradient: "bg-emerald-500/20" },
    { id: "products", label: "Envanter", icon: Boxes, color: "from-purple-500 to-indigo-600", gradient: "bg-purple-500/20" },
    { id: "reports", label: "Analiz", icon: FileBarChart, color: "from-rose-500 to-pink-600", gradient: "bg-rose-500/20" },
    { id: "history", label: "Loglar", icon: History, color: "from-amber-500 to-orange-600", gradient: "bg-amber-500/20" },
    { id: "ai_insights", label: "Zeka", icon: Brain, color: "from-fuchsia-500 to-purple-600", gradient: "bg-fuchsia-500/20" },
    { id: "cari_liste", label: "Cari", icon: Users, color: "from-blue-500 to-cyan-600", gradient: "bg-blue-500/20" },
    { id: "settings", label: "Sistem", icon: Settings, color: "from-slate-500 to-slate-600", gradient: "bg-slate-500/20" },
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

export default function HomePage({ onNavigate }: HomePageProps) {
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

    const today = new Date();
    const formattedDate = today.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });

    return (
        <div className="h-full flex flex-col p-6 lg:p-10 space-y-8 overflow-y-auto custom-scrollbar relative bg-background selection:bg-primary/30">
            {/* Subtle Gradient Glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[150px] rounded-full animate-pulse-slow" />
            </div>

            {/* Top Operational Header */}
            <header className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase"
                    >
                        Hoş Geldin, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500 font-black">{currentTenant?.company_name || "DEĞERLİ ÜYEMİZ"}</span>
                    </motion.h1>
                    <p className="text-secondary/40 font-mono text-xs uppercase tracking-widest">{formattedDate} // {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>

                <div className="flex gap-4">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="glass-card p-4 px-6 rounded-2xl flex items-center gap-4 overflow-hidden border-primary/20"
                    >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/30">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-primary/50 uppercase tracking-widest">Sistem Güvenliği</p>
                            <p className="text-sm font-bold text-white tracking-wide">AKTİF & KORUMALI</p>
                        </div>
                    </motion.div>
                </div>
            </header>

            {/* Main Operational Grid */}
            <main className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-[500px]">
                {/* Visual Analytics Hub (Large) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-8 glass-card rounded-[2rem] p-8 border-white/5 relative overflow-hidden group"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-30" />

                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary shadow-[0_0_20px_rgba(99,102,241,0.3)] flex items-center justify-center text-white">
                                <Activity className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white tracking-tight uppercase">Operasyonel Durum</h3>
                                <p className="text-[10px] font-mono text-primary/50 uppercase tracking-widest">Canlı İzleme Etkin</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-black text-white tracking-tighter">₺0.00</p>
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">+%0.0 BUGÜN</p>
                        </div>
                    </div>

                    {/* Action Hub Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {favoritePages.map((page, idx) => (
                            <motion.button
                                key={page.id}
                                whileHover={{ y: -5, scale: 1.02, backgroundColor: 'rgba(255,255,255,0.02)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onNavigate(page.id)}
                                className="flex flex-col items-center gap-4 p-6 rounded-[2rem] border border-white/5 bg-white/[0.01] transition-all group/btn relative overflow-hidden"
                            >
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${page.color} flex items-center justify-center shadow-lg group-hover/btn:scale-110 transition-transform`}>
                                    <page.icon className="w-7 h-7 text-white" />
                                </div>
                                <span className="text-[11px] font-black text-secondary group-hover/btn:text-white transition-colors uppercase tracking-widest">{page.label}</span>
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary scale-x-0 group-hover/btn:scale-x-50 transition-transform duration-500" />
                            </motion.button>
                        ))}
                    </div>

                    {/* Decor Elements */}
                    <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-primary/5 blur-[100px] rounded-full" />
                </motion.div>

                {/* AI & Secondary Column */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* AI Wisdom Panel */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass-card rounded-[2rem] p-6 border-primary/10 bg-primary/[0.02] flex flex-col justify-between relative overflow-hidden h-[45%]"
                    >
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <Brain className="w-5 h-5 animate-pulse" />
                                </div>
                                <span className="text-[10px] font-black text-primary uppercase tracking-[3px]">Zeka Analizi</span>
                            </div>
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={currentTip}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-sm font-medium text-white/80 leading-relaxed italic"
                                >
                                    "{TIPS[currentTip]}"
                                </motion.p>
                            </AnimatePresence>
                        </div>
                        <button
                            onClick={() => onNavigate('ai_insights')}
                            className="mt-6 w-full py-3 rounded-xl bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest hover:bg-primary/20 transition-all"
                        >
                            Detaylı Analizi Başlat
                        </button>
                    </motion.div>

                    {/* Quick Access List */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card rounded-[2rem] p-6 border-white/5 h-[55%] flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Hızlı Erişim</span>
                            <Zap className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="space-y-1 flex-1 overflow-y-auto custom-scrollbar pr-2">
                            {ALL_PAGES.slice(4).map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => onNavigate(p.id)}
                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg bg-gradient-to-br ${p.color} bg-opacity-20`}>
                                            <p.icon className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-xs font-bold text-secondary group-hover:text-white transition-colors">{p.label}</span>
                                    </div>
                                    <ChevronRight className="w-3 h-3 text-secondary/30 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </main>

            {/* Bottom Diagnostic Stats */}
            <footer className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                {[
                    { label: "GÜNLÜK İŞLEM", value: "0", sub: "Beklemede", icon: ShoppingCart, color: "text-emerald-400" },
                    { label: "KRİTİK STOK", value: "0", sub: "Ürün", icon: Package, color: "text-rose-400" },
                    { label: "AKTİF KULLANICI", value: "1", sub: "Çevrimiçi", icon: User, color: "text-blue-400" }
                ].map((diag, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + (i * 0.1) }}
                        className="glass-card p-4 px-6 rounded-2xl border-white/5 flex items-center gap-6"
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white/[0.02] border border-white/5 ${diag.color}`}>
                            <diag.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[9px] font-black text-secondary/40 uppercase tracking-widest mb-1">{diag.label}</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-white tracking-tighter">{diag.value}</span>
                                <span className={`text-[10px] font-bold ${diag.color} opacity-60 uppercase`}>{diag.sub}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </footer>
        </div>
    );
}
