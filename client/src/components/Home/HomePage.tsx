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
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "from-blue-500 to-blue-600", gradient: "bg-gradient-to-br from-blue-500/20 to-blue-600/20" },
    { id: "pos", label: "Hızlı Satış", icon: ShoppingCart, color: "from-emerald-500 to-emerald-600", gradient: "bg-gradient-to-br from-emerald-500/20 to-emerald-600/20" },
    { id: "products", label: "Ürünler", icon: Boxes, color: "from-purple-500 to-purple-600", gradient: "bg-gradient-to-br from-purple-500/20 to-purple-600/20" },
    { id: "history", label: "Satış Geçmişi", icon: History, color: "from-amber-500 to-orange-600", gradient: "bg-gradient-to-br from-amber-500/20 to-orange-600/20" },
    { id: "calculator", label: "Kâr Hesaplama", icon: Calculator, color: "from-cyan-500 to-cyan-600", gradient: "bg-gradient-to-br from-cyan-500/20 to-cyan-600/20" },
    { id: "simulation", label: "Fiyat Simülasyonu", icon: TrendingUp, color: "from-pink-500 to-rose-600", gradient: "bg-gradient-to-br from-pink-500/20 to-rose-600/20" },
    { id: "reports", label: "Raporlar", icon: FileBarChart, color: "from-indigo-500 to-indigo-600", gradient: "bg-gradient-to-br from-indigo-500/20 to-indigo-600/20" },
    { id: "ai_insights", label: "AI Öngörüleri", icon: Brain, color: "from-violet-500 to-purple-600", gradient: "bg-gradient-to-br from-violet-500/20 to-purple-600/20" },
    { id: "invoice", label: "E-Fatura", icon: FileText, color: "from-teal-500 to-teal-600", gradient: "bg-gradient-to-br from-teal-500/20 to-teal-600/20" },
    { id: "expenses", label: "Giderler", icon: Receipt, color: "from-red-500 to-red-600", gradient: "bg-gradient-to-br from-red-500/20 to-red-600/20" },
    { id: "alerts", label: "Stok Uyarıları", icon: AlertTriangle, color: "from-yellow-500 to-amber-600", gradient: "bg-gradient-to-br from-yellow-500/20 to-amber-600/20" },
    { id: "cari_liste", label: "Cari Hesaplar", icon: Users, color: "from-cyan-500 to-blue-600", gradient: "bg-gradient-to-br from-cyan-500/20 to-blue-600/20" },
    { id: "settings", label: "Ayarlar", icon: Settings, color: "from-slate-500 to-slate-600", gradient: "bg-gradient-to-br from-slate-500/20 to-slate-600/20" },
    { id: "profile", label: "Profil", icon: User, color: "from-sky-500 to-sky-600", gradient: "bg-gradient-to-br from-sky-500/20 to-sky-600/20" },
];

// Varsayılan favoriler
const DEFAULT_FAVORITES = ["pos", "products", "dashboard", "reports"];

// Favori yönetim fonksiyonları (dışarıdan erişilebilir)
export const getFavorites = (): string[] => {
    if (typeof window === 'undefined') return DEFAULT_FAVORITES;
    const saved = localStorage.getItem("jetpos_favorites");
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch {
            return DEFAULT_FAVORITES;
        }
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
    return getFavorites().includes(id);
};

// İpuçları
const TIPS = [
    "💡 Ürün barkodunu okutarak hızlıca satış yapabilirsin",
    "📊 Dashboard'dan günlük satış grafiklerini takip et",
    "⭐ Sık kullandığın sayfaları favorilere ekle",
    "🔔 Stok uyarılarını kontrol etmeyi unutma",
    "📱 Klavye kısayollarıyla daha hızlı çalış",
];

export default function HomePage({ onNavigate }: HomePageProps) {
    const { currentTenant } = useTenant();
    const [favorites, setFavorites] = useState<string[]>(DEFAULT_FAVORITES);
    const [currentTip, setCurrentTip] = useState(0);

    // LocalStorage'dan favorileri yükle
    useEffect(() => {
        setFavorites(getFavorites());

        const handleFavoritesChange = () => {
            setFavorites(getFavorites());
        };

        window.addEventListener('favorites-changed', handleFavoritesChange);
        return () => window.removeEventListener('favorites-changed', handleFavoritesChange);
    }, []);

    // İpucu rotasyonu
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTip(prev => (prev + 1) % TIPS.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Favorilerdeki sayfaları getir
    const favoritePages = favorites
        .map(id => ALL_PAGES.find(p => p.id === id))
        .filter(Boolean) as QuickAccessItem[];

    // Şu anki tarih
    const today = new Date();
    const formattedDate = today.toLocaleDateString('tr-TR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="h-full flex flex-col p-4 lg:p-6">
            <div className="w-full flex-1 flex flex-col gap-5">
                {/* Header - Compact */}
                <div className="flex items-center justify-between">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-2xl font-black text-foreground"
                        >
                            Merhaba, <span className="text-primary">{currentTenant?.company_name || "JetPos"}</span>! 👋
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-secondary text-sm"
                        >
                            {formattedDate}
                        </motion.p>
                    </div>

                    {/* Tip Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hidden md:flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-xl border border-primary/10"
                    >
                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={currentTip}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-sm text-secondary"
                            >
                                {TIPS[currentTip]}
                            </motion.span>
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* Main Content Grid */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Favorites & Quick Actions */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Quick Access Grid */}
                        <div className="glass-card p-5 flex-1">
                            <div className="flex items-center gap-2 mb-4">
                                <Star className="w-4 h-4 text-yellow-500" />
                                <h2 className="text-base font-bold text-foreground">Hızlı Erişim</h2>
                                {favoritePages.length === 0 && (
                                    <span className="text-xs text-secondary ml-2">(Yıldıza tıklayarak ekle)</span>
                                )}
                            </div>

                            {favoritePages.length === 0 ? (
                                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {ALL_PAGES.slice(0, 10).map((page, index) => (
                                        <motion.button
                                            key={page.id}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.03 }}
                                            whileHover={{ scale: 1.03, y: -3 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => onNavigate(page.id)}
                                            className={`rounded-2xl border border-primary/10 backdrop-blur-sm p-5 flex flex-col items-center justify-center gap-3 transition-all hover:border-primary/20 hover:shadow-xl cursor-pointer ${page.gradient}`}
                                        >
                                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${page.color} flex items-center justify-center shadow-lg`}>
                                                <page.icon className="w-8 h-8 text-white" />
                                            </div>
                                            <span className="text-foreground font-semibold text-sm text-center leading-tight">{page.label}</span>
                                        </motion.button>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {favoritePages.map((page, index) => (
                                        <motion.button
                                            key={page.id}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.03 }}
                                            whileHover={{ scale: 1.03, y: -3 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => onNavigate(page.id)}
                                            className={`rounded-2xl border border-primary/10 backdrop-blur-sm p-5 flex flex-col items-center justify-center gap-3 transition-all hover:border-primary/20 hover:shadow-xl cursor-pointer ${page.gradient}`}
                                        >
                                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${page.color} flex items-center justify-center shadow-lg`}>
                                                <page.icon className="w-8 h-8 text-white" />
                                            </div>
                                            <span className="text-foreground font-semibold text-sm text-center leading-tight">{page.label}</span>
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quick Actions Row */}
                        <div className="grid grid-cols-3 gap-4">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onNavigate("pos")}
                                className="glass-card p-4 flex items-center gap-3 cursor-pointer hover:bg-primary/5 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-foreground font-bold text-sm truncate">Yeni Satış</p>
                                    <p className="text-secondary text-xs">POS'u aç</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-secondary group-hover:text-primary" />
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onNavigate("products")}
                                className="glass-card p-4 flex items-center gap-3 cursor-pointer hover:bg-primary/5 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                                    <Package className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-foreground font-bold text-sm truncate">Ürünler</p>
                                    <p className="text-secondary text-xs">Stok yönet</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-secondary group-hover:text-primary" />
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onNavigate("reports")}
                                className="glass-card p-4 flex items-center gap-3 cursor-pointer hover:bg-primary/5 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                                    <BarChart3 className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-foreground font-bold text-sm truncate">Raporlar</p>
                                    <p className="text-secondary text-xs">Analiz et</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-secondary group-hover:text-primary" />
                            </motion.div>
                        </div>
                    </div>

                    {/* Right Column - Stats & Activity */}
                    <div className="flex flex-col gap-6">
                        {/* Today's Summary */}
                        <div className="glass-card p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Activity className="w-4 h-4 text-primary" />
                                <h2 className="text-base font-bold text-foreground">Bugünkü Özet</h2>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                            <DollarSign className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <span className="text-secondary text-sm">Satış</span>
                                    </div>
                                    <span className="text-foreground font-bold">₺0</span>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                            <ShoppingCart className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <span className="text-secondary text-sm">İşlem</span>
                                    </div>
                                    <span className="text-foreground font-bold">0</span>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                            <TrendingUp className="w-4 h-4 text-purple-500" />
                                        </div>
                                        <span className="text-secondary text-sm">Kâr</span>
                                    </div>
                                    <span className="text-foreground font-bold">₺0</span>
                                </div>
                            </div>

                            <button
                                onClick={() => onNavigate("dashboard")}
                                className="w-full mt-4 py-2 text-sm text-primary hover:text-white hover:bg-primary rounded-lg transition-all"
                            >
                                Detaylı Dashboard →
                            </button>
                        </div>

                        {/* Recent Activity */}
                        <div className="glass-card p-5 flex-1">
                            <div className="flex items-center gap-2 mb-4">
                                <Clock className="w-4 h-4 text-amber-500" />
                                <h2 className="text-base font-bold text-foreground">Son Aktivite</h2>
                            </div>

                            <div className="flex flex-col items-center justify-center h-32 text-center">
                                <Clock className="w-8 h-8 text-secondary/30 mb-2" />
                                <p className="text-secondary text-sm">Henüz aktivite yok</p>
                                <p className="text-secondary/60 text-xs mt-1">Satış yaptığında burada görünecek</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
