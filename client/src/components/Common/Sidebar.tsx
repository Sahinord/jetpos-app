"use client";

import { useState, useEffect } from "react";
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Calculator,
    TrendingUp,
    BarChart3,
    Settings,
    History,
    Clock,
    Lock,
    LogOut,
    Sparkles,
    FileText,
    ChevronDown,
    ChevronRight,
    Wallet,
    Tags,
    AlertTriangle,
    Layers,
    Receipt,
    PieChart,
    Activity,
    User,
    Palette,
    Store,
    CreditCard,
    FileBarChart,
    Brain,
    Boxes,
    Star,
    Users,
    UserPlus,
    FolderOpen,
    FileInput,
    FileOutput,
    ArrowLeftRight,
    FilePlus,
    ClipboardList,
    Scale,
    FileSearch,
    CalendarDays,
    LifeBuoy,
    type LucideIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTenant } from "@/lib/tenant-context";
import { toggleFavorite, isFavorite } from "@/components/Home/HomePage";

interface MenuItem {
    id: string;
    label: string;
    icon: LucideIcon;
    feature?: string | null;
}

interface MenuCategory {
    id: string;
    label: string;
    icon: LucideIcon;
    items?: MenuItem[];
    subCategories?: MenuCategory[];
    defaultOpen?: boolean;
    feature?: string | null;
}

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
    const { currentTenant } = useTenant();
    const [openCategories, setOpenCategories] = useState<string[]>(["main", "sales", "products"]);
    const [, setFavoritesVersion] = useState(0); // Force re-render on favorites change

    // Listen for favorites changes
    useEffect(() => {
        const handleFavoritesChange = () => {
            setFavoritesVersion(v => v + 1);
        };
        window.addEventListener('favorites-changed', handleFavoritesChange);
        return () => window.removeEventListener('favorites-changed', handleFavoritesChange);
    }, []);

    // Kategorili menü yapısı
    const menuCategories: MenuCategory[] = [
        {
            id: "main",
            label: "Ana Menü",
            icon: LayoutDashboard,
            defaultOpen: true,
            items: [
                { id: "home", label: "Ana Ekran", icon: Store, feature: null },
                { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, feature: null },
            ]
        },
        {
            id: "sales",
            label: "Satış & POS",
            icon: ShoppingCart,
            items: [
                { id: "pos", label: "Hızlı Satış", icon: ShoppingCart, feature: "pos" },
                { id: "history", label: "Satış Geçmişi", icon: History, feature: "sales_history" },
                { id: "invoice", label: "E-Fatura", icon: FileText, feature: "invoice" },
            ]
        },
        {
            id: "products",
            label: "Ürün Yönetimi",
            icon: Package,
            items: [
                { id: "products", label: "Ürün Listesi", icon: Boxes, feature: "products" },
                { id: "alerts", label: "Stok Uyarıları", icon: AlertTriangle, feature: null },
            ]
        },
        {
            id: "finance",
            label: "Finans",
            icon: Wallet,
            items: [
                { id: "expenses", label: "Gider Yönetimi", icon: Receipt, feature: null },
                { id: "calculator", label: "Kâr Hesaplama", icon: Calculator, feature: "profit_calculator" },
            ]
        },
        {
            id: "analytics",
            label: "Raporlar & Analiz",
            icon: BarChart3,
            items: [
                { id: "reports", label: "Satış Raporları", icon: FileBarChart, feature: "reports" },
                { id: "simulation", label: "Fiyat Simülasyonu", icon: TrendingUp, feature: "price_simulator" },
                { id: "ai_insights", label: "AI Öngörüleri", icon: Brain, feature: null },
            ]
        },
        {
            id: "cari_hesap",
            label: "Cari Hesap Takibi",
            icon: Users,
            feature: "cari_hesap",
            subCategories: [
                {
                    id: "cari_tanimlar",
                    label: "Tanıtımlar",
                    icon: UserPlus,
                    items: [
                        { id: "cari_tanim", label: "Cari Tanıtımı", icon: UserPlus, feature: null },
                        { id: "cari_grup", label: "Grup Tanıtımı", icon: FolderOpen, feature: null },
                        { id: "cari_ozelkod", label: "Özel Kod Tanıtımı", icon: Tags, feature: null },
                    ]
                },
                {
                    id: "cari_fisler",
                    label: "Cari Hesap Fişleri",
                    icon: FileOutput,
                    items: [
                        { id: "cari_borc", label: "Borç Dekontu", icon: FileOutput, feature: null },
                        { id: "cari_alacak", label: "Alacak Dekontu", icon: FileInput, feature: null },
                        { id: "cari_virman", label: "Virman Dekontu", icon: ArrowLeftRight, feature: null },
                        { id: "cari_devir", label: "Devir Fişi", icon: FilePlus, feature: null },
                    ]
                },
                {
                    id: "cari_raporlar",
                    label: "Raporlar / Analizler",
                    icon: PieChart,
                    items: [
                        { id: "cari_liste", label: "Cari Kartı Listesi", icon: ClipboardList, feature: null },
                        { id: "cari_bakiye", label: "Bakiye Raporu", icon: Scale, feature: null },
                        { id: "cari_hareket", label: "Hareket Raporu", icon: FileSearch, feature: null },
                        { id: "cari_mutabakat", label: "Mutabakat Raporu", icon: FileText, feature: null },
                        { id: "cari_gunluk", label: "Günlük Hareket", icon: CalendarDays, feature: null },
                        { id: "cari_analiz", label: "Cari Analizi", icon: PieChart, feature: null },
                    ]
                },
            ]
        },
    ];

    // Feature kontrolü
    const isFeatureEnabled = (feature: string | null | undefined): boolean => {
        if (!feature) return true;
        if (!currentTenant?.features) return false;
        return currentTenant.features[feature] === true;
    };

    // Kategori içindeki aktif itemları filtrele
    const getFilteredItems = (items?: MenuItem[]) => {
        if (!items) return [];
        return items.filter(item => isFeatureEnabled(item.feature));
    };

    // Kilitli itemları bul
    const getLockedItems = (items?: MenuItem[]) => {
        if (!items) return [];
        return items.filter(item => item.feature && !isFeatureEnabled(item.feature));
    };

    // Tüm kilitli itemları topla (kategori ve item seviyesinde)
    const allLockedItems = menuCategories.flatMap(cat => {
        // Kategori seviyesinde kilitli mi?
        if (cat.feature && !isFeatureEnabled(cat.feature)) {
            return [{ id: cat.id, label: cat.label, icon: cat.icon, feature: cat.feature }];
        }
        if (cat.subCategories) {
            return cat.subCategories.flatMap(sub => getLockedItems(sub.items));
        }
        return getLockedItems(cat.items);
    });

    // Kategori aç/kapa
    const toggleCategory = (categoryId: string) => {
        setOpenCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    // Bir kategori veya alt kategoride aktif item var mı kontrol et
    const hasActiveItemInCategory = (category: MenuCategory): boolean => {
        if (category.items?.some(item => item.id === activeTab)) {
            return true;
        }
        if (category.subCategories?.some(sub => hasActiveItemInCategory(sub))) {
            return true;
        }
        return false;
    };

    // Tab değişince ilgili kategoriyi aç
    const handleTabChange = (tabId: string) => {
        // Ana kategorilerde ara
        for (const category of menuCategories) {
            if (category.items?.some(item => item.id === tabId)) {
                if (!openCategories.includes(category.id)) {
                    setOpenCategories(prev => [...prev, category.id]);
                }
                break;
            }
            // Alt kategorilerde ara
            if (category.subCategories) {
                for (const sub of category.subCategories) {
                    if (sub.items?.some(item => item.id === tabId)) {
                        if (!openCategories.includes(category.id)) {
                            setOpenCategories(prev => [...prev, category.id]);
                        }
                        if (!openCategories.includes(sub.id)) {
                            setOpenCategories(prev => [...prev, sub.id]);
                        }
                        break;
                    }
                }
            }
        }
        onTabChange(tabId);
    };

    return (
        <aside className="w-72 border-r border-border bg-card/50 backdrop-blur-sm flex flex-col h-screen sticky top-0 overflow-hidden">
            {/* Logo / Firma Header */}
            <div className="p-6 border-b border-border">
                <div className="flex items-center space-x-3">
                    {currentTenant?.logo_url ? (
                        <img
                            src={currentTenant.logo_url}
                            alt={currentTenant.company_name}
                            className="w-12 h-12 rounded-xl object-cover shadow-lg"
                        />
                    ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">
                                {currentTenant?.company_name?.substring(0, 2).toUpperCase() || 'JP'}
                            </span>
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-black text-white truncate">
                            {currentTenant?.company_name || 'JetPos'}
                        </h1>
                        <p className="text-xs text-secondary truncate">Yönetim Paneli</p>
                    </div>
                </div>
            </div>

            {/* Scrollable Menu Area */}
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="px-3 space-y-1">
                    {menuCategories.map((category) => {
                        const filteredItems = getFilteredItems(category.items);
                        const isOpen = openCategories.includes(category.id);
                        const hasActiveItem = hasActiveItemInCategory(category);
                        const hasSubCategories = category.subCategories && category.subCategories.length > 0;
                        const isCategoryEnabled = isFeatureEnabled(category.feature);

                        // Eğer kategori lisanslı ve açık değilse, gösterme
                        if (!isCategoryEnabled) return null;

                        // Eğer kategoride hiç gösterilecek item veya alt kategori yoksa, kategoriyi gösterme
                        if (filteredItems.length === 0 && !hasSubCategories) return null;

                        return (
                            <div key={category.id} className="mb-2">
                                {/* Category Header */}
                                <button
                                    onClick={() => toggleCategory(category.id)}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all ${hasActiveItem
                                        ? 'bg-white/10 text-white'
                                        : 'text-secondary hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <category.icon className="w-5 h-5" />
                                        <span className="font-bold text-sm">{category.label}</span>
                                    </div>
                                    <motion.div
                                        animate={{ rotate: isOpen ? 180 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ChevronDown className="w-4 h-4" />
                                    </motion.div>
                                </button>

                                {/* Category Content */}
                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pl-4 mt-1 space-y-1 border-l-2 border-white/10 ml-6">
                                                {/* Render SubCategories if exists */}
                                                {hasSubCategories && category.subCategories!.map((subCategory) => {
                                                    const subFilteredItems = getFilteredItems(subCategory.items);
                                                    const subIsOpen = openCategories.includes(subCategory.id);
                                                    const subHasActiveItem = hasActiveItemInCategory(subCategory);

                                                    return (
                                                        <div key={subCategory.id} className="mb-1">
                                                            {/* SubCategory Header */}
                                                            <button
                                                                onClick={() => toggleCategory(subCategory.id)}
                                                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-sm ${subHasActiveItem
                                                                    ? 'bg-white/10 text-white'
                                                                    : 'text-secondary hover:bg-white/5 hover:text-white'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <subCategory.icon className="w-4 h-4" />
                                                                    <span className="font-semibold">{subCategory.label}</span>
                                                                </div>
                                                                <motion.div
                                                                    animate={{ rotate: subIsOpen ? 180 : 0 }}
                                                                    transition={{ duration: 0.2 }}
                                                                >
                                                                    <ChevronDown className="w-3 h-3" />
                                                                </motion.div>
                                                            </button>

                                                            {/* SubCategory Items */}
                                                            <AnimatePresence initial={false}>
                                                                {subIsOpen && (
                                                                    <motion.div
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: "auto", opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        transition={{ duration: 0.2 }}
                                                                        className="overflow-hidden"
                                                                    >
                                                                        <div className="pl-3 mt-1 space-y-0.5 border-l border-white/5 ml-4">
                                                                            {subFilteredItems.map((item) => {
                                                                                const isItemFavorite = isFavorite(item.id);

                                                                                return (
                                                                                    <div key={item.id} className="flex items-center gap-1 group/item">
                                                                                        <motion.button
                                                                                            whileHover={{ x: 4 }}
                                                                                            whileTap={{ scale: 0.98 }}
                                                                                            onClick={() => handleTabChange(item.id)}
                                                                                            className={`flex-1 flex items-center gap-2 px-2 py-2 rounded-lg transition-all text-xs ${activeTab === item.id
                                                                                                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                                                                                : 'text-secondary hover:bg-white/5 hover:text-white'
                                                                                                }`}
                                                                                        >
                                                                                            <item.icon className="w-3.5 h-3.5" />
                                                                                            <span className="font-medium">{item.label}</span>
                                                                                        </motion.button>

                                                                                        <button
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                toggleFavorite(item.id);
                                                                                            }}
                                                                                            className={`p-1 rounded-lg transition-all hover:bg-white/10 ${isItemFavorite
                                                                                                ? 'text-yellow-500 opacity-100'
                                                                                                : 'text-secondary/40 hover:text-yellow-500 opacity-0 group-hover/item:opacity-100'
                                                                                                }`}
                                                                                            title={isItemFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                                                                                        >
                                                                                            <Star className={`w-3 h-3 ${isItemFavorite ? 'fill-yellow-500' : ''}`} />
                                                                                        </button>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    );
                                                })}

                                                {/* Render Items if no subCategories */}
                                                {!hasSubCategories && filteredItems.map((item) => {
                                                    const isItemFavorite = isFavorite(item.id);
                                                    const canBeFavorite = item.id !== 'home';

                                                    return (
                                                        <div key={item.id} className="flex items-center gap-1 group/item">
                                                            <motion.button
                                                                whileHover={{ x: 4 }}
                                                                whileTap={{ scale: 0.98 }}
                                                                onClick={() => handleTabChange(item.id)}
                                                                className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${activeTab === item.id
                                                                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                                                    : 'text-secondary hover:bg-white/5 hover:text-white'
                                                                    }`}
                                                            >
                                                                <item.icon className="w-4 h-4" />
                                                                <span className="font-medium">{item.label}</span>
                                                            </motion.button>

                                                            {canBeFavorite && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        toggleFavorite(item.id);
                                                                    }}
                                                                    className={`p-1.5 rounded-lg transition-all hover:bg-white/10 ${isItemFavorite
                                                                        ? 'text-yellow-500 opacity-100'
                                                                        : 'text-secondary/40 hover:text-yellow-500 opacity-0 group-hover/item:opacity-100'
                                                                        }`}
                                                                    title={isItemFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                                                                >
                                                                    <Star className={`w-3.5 h-3.5 ${isItemFavorite ? 'fill-yellow-500' : ''}`} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </nav>

                {/* Locked Features Section */}
                {allLockedItems.length > 0 && (
                    <div className="px-6 pt-6 mt-4 border-t border-white/5">
                        <p className="text-xs font-bold text-secondary/50 uppercase tracking-wider mb-3">
                            Kilitli Özellikler
                        </p>
                        <div className="space-y-1">
                            {allLockedItems.slice(0, 3).map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 border border-white/5 opacity-50 cursor-not-allowed"
                                >
                                    <item.icon className="w-4 h-4 text-secondary" />
                                    <span className="text-xs font-medium text-secondary flex-1">{item.label}</span>
                                    <Lock className="w-3 h-3 text-secondary" />
                                </div>
                            ))}
                            {allLockedItems.length > 3 && (
                                <p className="text-xs text-secondary/40 text-center py-1">
                                    +{allLockedItems.length - 3} daha fazla
                                </p>
                            )}
                        </div>
                        <p className="text-xs text-secondary/50 mt-3 text-center">
                            Yükseltme için iletişime geçin
                        </p>
                    </div>
                )}
            </div>

            {/* Bottom Section - User & Settings */}
            <div className="p-4 border-t border-border mt-auto bg-card/30">
                {/* User Info */}
                <div className="flex items-center space-x-3 mb-3 px-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-xs">
                            {currentTenant?.company_name?.substring(0, 2).toUpperCase() || 'JP'}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                            {currentTenant?.company_name || 'JetPos'}
                        </p>
                        <p className="text-xs text-secondary">Admin</p>
                    </div>
                </div>

                {/* Settings & Logout */}
                <div className="space-y-1">
                    <button
                        onClick={() => handleTabChange('settings')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${activeTab === 'settings'
                            ? 'bg-primary text-white'
                            : 'text-secondary hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <Settings className="w-4 h-4" />
                        <span className="font-semibold">Ayarlar</span>
                    </button>

                    <button
                        onClick={() => handleTabChange('support')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${activeTab === 'support'
                            ? 'bg-primary text-white'
                            : 'text-secondary hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <LifeBuoy className="w-4 h-4" />
                        <span className="font-semibold">Destek</span>
                    </button>

                    <button
                        onClick={() => handleTabChange('profile')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${activeTab === 'profile'
                            ? 'bg-primary text-white'
                            : 'text-secondary hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <User className="w-4 h-4" />
                        <span className="font-semibold">Profil</span>
                    </button>

                    <button
                        onClick={() => {
                            localStorage.clear();
                            window.location.reload();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all text-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="font-semibold">Çıkış Yap</span>
                    </button>
                </div>

                {/* Version Info */}
                <div className="flex items-center justify-between text-xs text-secondary mt-3 pt-3 border-t border-white/10 px-2">
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        Çevrimiçi
                    </span>
                    <span className="font-mono">v1.0</span>
                </div>
            </div>
        </aside>
    );
}
