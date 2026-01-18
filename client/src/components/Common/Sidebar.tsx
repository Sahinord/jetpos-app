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
    ArrowDownLeft,
    ArrowUpRight,
    FilePlus,
    ClipboardList,
    Scale,
    FileSearch,
    CalendarDays,
    LifeBuoy,
    HelpCircle,
    Landmark,
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
    description?: string;
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
    showHelpIcons: boolean;
}

export default function Sidebar({ activeTab, onTabChange, showHelpIcons }: SidebarProps) {
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
                { id: "home", label: "Ana Ekran", icon: Store, feature: null, description: "İşletmenizin genel özetini ve hızlı aksiyonları görebileceğiniz ana sayfa." },
                { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, feature: null, description: "Satış verileri ve stok durumlarını grafiklerle analiz edebileceğiniz panel." },
            ]
        },
        {
            id: "sales",
            label: "Satış & POS",
            icon: ShoppingCart,
            items: [
                { id: "pos", label: "Hızlı Satış", icon: ShoppingCart, feature: "pos", description: "Hızlı nakit veya kartlı satış işlemlerini gerçekleştirebileceğiniz satış ekranı." },
                { id: "history", label: "Satış Geçmişi", icon: History, feature: "sales_history", description: "Geçmişte yapılan tüm satışların detaylı dökümü ve yönetimi." },
                { id: "invoice", label: "E-Fatura", icon: FileText, feature: "invoice", description: "E-Fatura gönderimi ve takibi için entegrasyon ekranı." },
            ]
        },
        {
            id: "products",
            label: "Ürün Yönetimi",
            icon: Package,
            items: [
                { id: "products", label: "Ürün Listesi", icon: Boxes, feature: "products", description: "Stoktaki ürünlerin listelenmesi, yeni ürün ekleme ve düzenleme işlemleri." },
                { id: "alerts", label: "Stok Uyarıları", icon: AlertTriangle, feature: null, description: "Kritik stok seviyesine düşen ürünler için otomatik uyarılar." },
            ]
        },
        {
            id: "finance",
            label: "Finans",
            icon: Wallet,
            items: [
                { id: "expenses", label: "Gider Yönetimi", icon: Receipt, feature: null, description: "İşletme giderlerinin kaydedilmesi ve takibi." },
                { id: "calculator", label: "Kâr Hesaplama", icon: Calculator, feature: "profit_calculator", description: "Ürün bazlı veya genel kâr oranlarını hesaplama aracı." },
            ]
        },
        {
            id: "analytics",
            label: "Raporlar & Analiz",
            icon: BarChart3,
            items: [
                { id: "reports", label: "Satış Raporları", icon: FileBarChart, feature: "reports", description: "Geleneksel ve gelişmiş satış performans raporları." },
                { id: "simulation", label: "Fiyat Simülasyonu", icon: TrendingUp, feature: "price_simulator", description: "Fiyat değişikliklerinin kârlılık üzerindeki etkilerini simüle etme aracı." },
                { id: "ai_insights", label: "AI Öngörüleri", icon: Brain, feature: null, description: "Yapay zeka analizleri ile işletmenize özel büyüme önerileri." },
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
                        { id: "cari_tanim", label: "Cari Tanıtımı", icon: UserPlus, feature: null, description: "Müşteri ve tedarikçilerinizin sisteme tanımlanması." },
                        { id: "cari_grup", label: "Grup Tanıtımı", icon: FolderOpen, feature: null, description: "Carilerinizi gruplandırarak kategori bazlı takip yapmanızı sağlar." },
                        { id: "cari_ozelkod", label: "Özel Kod Tanıtımı", icon: Tags, feature: null, description: "Cari kartlar için özel gruplandırma ve raporlama kodları." },
                    ]
                },
                {
                    id: "cari_fisler",
                    label: "Cari Hesap Fişleri",
                    icon: FileOutput,
                    items: [
                        { id: "cari_borc", label: "Borç Dekontu", icon: FileOutput, feature: null, description: "Cari hesaplara borç kaydı girmek için dekont ekranı." },
                        { id: "cari_alacak", label: "Alacak Dekontu", icon: FileInput, feature: null, description: "Cari hesaplara alacak nakdi veya iade kaydı girer." },
                        { id: "cari_virman", label: "Virman Dekontu", icon: ArrowLeftRight, feature: null, description: "İki cari hesap arasında bakiye transferi işlemi." },
                        { id: "cari_devir", label: "Devir Fişi", icon: FilePlus, feature: null, description: "Dönem başı bakiye devir kayıtları." },
                    ]
                },
                {
                    id: "cari_raporlar",
                    label: "Raporlar / Analizler",
                    icon: PieChart,
                    items: [
                        { id: "cari_liste", label: "Cari Kartı Listesi", icon: ClipboardList, feature: null, description: "Tüm cari hesapların detaylı listesi." },
                        { id: "cari_bakiye", label: "Bakiye Raporu", icon: Scale, feature: null, description: "Carilerin güncel borç/alacak bakiye durum raporu." },
                        { id: "cari_hareket", label: "Hareket Raporu", icon: FileSearch, feature: null, description: "Cari hesap ekstreleri ve işlem geçmişi." },
                        { id: "cari_mutabakat", label: "Mutabakat Raporu", icon: FileText, feature: null, description: "Cari bakiyelerin doğrulanma ve mutabakat süreci." },
                        { id: "cari_gunluk", label: "Günlük Hareket", icon: CalendarDays, feature: null, description: "Günlük gerçekleşen tüm cari işlemler." },
                        { id: "cari_analiz", label: "Cari Analizi", icon: PieChart, feature: null, description: "Cari bazlı karlılık ve işlem yoğunluğu analizi." },
                    ]
                },
            ]
        },
        {
            id: "cash_ops",
            label: "Kasa İşlemleri",
            icon: Wallet,
            feature: "cash_management",
            subCategories: [
                {
                    id: "cash_defs",
                    label: "Tanıtımlar",
                    icon: Store,
                    items: [
                        { id: "cash_define", label: "Kasa Tanıtımı", icon: Wallet, feature: null, description: "İşletmenizdeki farklı kasa ve banka hesaplarının tanımlanması." },
                        { id: "cash_room", label: "Oda Tanıtımı", icon: LayoutDashboard, feature: null, description: "Hizmet verilen oda, masa veya birimlerin tanımlanması ve takibi." },
                    ]
                },
                {
                    id: "cash_transactions",
                    label: "İşlemler",
                    icon: ArrowLeftRight,
                    items: [
                        { id: "cash_in", label: "Kasa Tahsil Fişi", icon: FileInput, feature: null, description: "Tahsil edilen nakit paraların kasaya giriş kaydı." },
                        { id: "cash_out", label: "Kasa Tediye Fişi", icon: FileOutput, feature: null, description: "Kasadan yapılan ödeme ve nakit çıkışlarının kaydı." },
                        { id: "cash_transfer", label: "Kasa Virman Fişi", icon: ArrowLeftRight, feature: null, description: "Farklı kasalar arasında para aktarımı." },
                        { id: "cash_opening", label: "Kasa Devir Fişi", icon: FilePlus, feature: null, description: "Kasa açılış bakiyelerinin girilmesi." },
                    ]
                },
                {
                    id: "cash_reports",
                    label: "Raporlar / Analizler",
                    icon: PieChart,
                    items: [
                        { id: "cash_balance", label: "Kasa Bakiye Raporu", icon: Scale, feature: null, description: "Kasaların güncel nakit durum raporu." },
                        { id: "cash_history", label: "Kasa Hareket Raporu", icon: FileSearch, feature: null, description: "Kasa bazlı detaylı işlem ve hareket dökümü." },
                    ]
                },
            ]
        },
        {
            id: "bank_ops",
            label: "Banka İşlemleri",
            icon: Landmark,
            feature: "bank_management",
            subCategories: [
                {
                    id: "bank_defs",
                    label: "Tanıtımlar",
                    icon: Store,
                    items: [
                        { id: "bank_define", label: "Banka Tanıtımı", icon: Landmark, feature: null, description: "Banka hesaplarınızın, şube ve IBAN bilgilerinin sisteme tanımlanması." },
                    ]
                },
                {
                    id: "bank_transactions",
                    label: "İşlemler",
                    icon: ArrowLeftRight,
                    items: [
                        { id: "bank_withdraw", label: "Bankadan Para Çekme", icon: FileOutput, feature: null, description: "Banka hesabından nakit çekim işlemlerinin kaydı." },
                        { id: "bank_deposit", label: "Bankaya Para Yatırma", icon: FileInput, feature: null, description: "Banka hesabına yapılan nakit yatırım işlemleri." },
                        { id: "bank_transfer_in", label: "Gelen Havaleler", icon: ArrowDownLeft, feature: null, description: "Müşterilerden banka hesabına gelen havale/EFT ödemeleri." },
                        { id: "bank_transfer_out", label: "Yapılan Havaleler", icon: ArrowUpRight, feature: null, description: "Tedarikçilere veya 3. şahıslara yapılan havale/EFT ödemeleri." },
                        { id: "bank_transfer", label: "Banka Virman Fişi", icon: ArrowLeftRight, feature: null, description: "Kendi banka hesaplarınız arasındaki para transferleri." },
                        { id: "bank_opening", label: "Banka Devir Fişi", icon: FilePlus, feature: null, description: "Banka hesap açılış bakiyelerinin sisteme girişi." },
                    ]
                },
                {
                    id: "bank_reports",
                    label: "Raporlar / Analizler",
                    icon: PieChart,
                    items: [
                        { id: "bank_list", label: "Banka Listesi", icon: ClipboardList, feature: null, description: "Tanımlı tüm banka hesaplarının detaylı dökümü." },
                        { id: "bank_balance", label: "Hesap Bakiye Raporu", icon: Scale, feature: null, description: "Bankalardaki güncel bakiye ve borç/alacak durumları." },
                        { id: "bank_history", label: "Banka Hareket Raporu", icon: FileSearch, feature: null, description: "Banka hesaplarına ait detaylı ekstre ve işlem geçmişi." },
                    ]
                }
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
                            <div key={category.id} className="mb-2 relative group/cat">
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
                                            className="overflow-hidden group-hover/cat:overflow-visible"
                                        >
                                            <div className="pl-4 mt-1 space-y-1 border-l-2 border-white/10 ml-6">
                                                {/* Render SubCategories if exists */}
                                                {hasSubCategories && category.subCategories!.map((subCategory) => {
                                                    const subFilteredItems = getFilteredItems(subCategory.items);
                                                    const subIsOpen = openCategories.includes(subCategory.id);
                                                    const subHasActiveItem = hasActiveItemInCategory(subCategory);

                                                    return (
                                                        <div key={subCategory.id} className="mb-1 relative group/subcat">
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
                                                                        className="overflow-hidden group-hover/subcat:overflow-visible"
                                                                    >
                                                                        <div className="pl-3 mt-1 space-y-0.5 border-l border-white/5 ml-4">
                                                                            {subFilteredItems.map((item) => {
                                                                                const isItemFavorite = isFavorite(item.id);

                                                                                return (
                                                                                    <div key={item.id} className="flex items-center gap-1 group/item relative">
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
                                                                                            <span className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
                                                                                        </motion.button>

                                                                                        <div className="flex items-center gap-0.5">
                                                                                            {showHelpIcons && item.description && (
                                                                                                <div className="relative group/info">
                                                                                                    <HelpCircle className="w-3 h-3 text-secondary/30 hover:text-primary transition-colors cursor-help" />
                                                                                                    <div className="absolute right-0 bottom-full mb-2 w-48 p-3 bg-[#0a1628]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl opacity-0 group-hover/info:opacity-100 transition-all pointer-events-none z-[100] translate-y-1 group-hover/info:translate-y-0 text-center">
                                                                                                        <div className="absolute right-2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white/10" />
                                                                                                        <p className="text-[10px] text-white/90 leading-relaxed font-medium">
                                                                                                            {item.description}
                                                                                                        </p>
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}

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
                                                        <div key={item.id} className="flex items-center gap-1 group/item relative">
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

                                                            <div className="flex items-center gap-1">
                                                                {showHelpIcons && item.description && (
                                                                    <div className="relative group/info">
                                                                        <HelpCircle className="w-3.5 h-3.5 text-secondary/30 hover:text-primary transition-colors cursor-help" />
                                                                        <div className="absolute right-0 bottom-full mb-3 w-56 p-4 bg-[#0a1628]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] opacity-0 group-hover/info:opacity-100 transition-all pointer-events-none z-[100] translate-y-2 group-hover/info:translate-y-0">
                                                                            <div className="absolute right-4 top-full w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white/10" />
                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                <div className="w-1 h-3 bg-primary rounded-full" />
                                                                                <span className="text-[10px] font-black text-secondary tracking-widest uppercase">Nedir?</span>
                                                                            </div>
                                                                            <p className="text-xs text-white/90 leading-relaxed font-medium">
                                                                                {item.description}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                )}

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
