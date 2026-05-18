"use client";

import { useState, useEffect, useRef } from "react";
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
    Trash2,
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
    Building2,
    CreditCard,
    ShoppingBag,
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
    MessageSquare,
    Blocks,
    Search,
    X,
    Utensils,
    Grid3X3,
    QrCode,
    Heart,
    Target,
    Gift,
    Monitor,
    Globe,
    ExternalLink,
    Image as ImageIcon,
    Coins,
    QrCode as QrCodeIcon,
    type LucideIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTenant } from "@/lib/tenant-context";
import { supabase } from "@/lib/supabase";
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
    showToast?: (message: string, type?: "success" | "error" | "warning" | "info") => void;
    isMobileOpen?: boolean;
}

export default function Sidebar({ activeTab, onTabChange, showHelpIcons, showToast, isMobileOpen }: SidebarProps) {
    const { currentTenant, warehouses, activeWarehouse, setActiveWarehouse, activeEmployee, logoutEmployee, isAccountant, refreshWarehouses } = useTenant();
    const [isSyncingStores, setIsSyncingStores] = useState(false);
    const [openCategories, setOpenCategories] = useState<string[]>(["main", "sales", "products"]);
    const [, setFavoritesVersion] = useState(0); 
    const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(true); 
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Keyboard shortcut for search (CTRL+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Listen for favorites changes
    useEffect(() => {
        const handleFavoritesChange = () => {
            setFavoritesVersion(v => v + 1);
        };
        window.addEventListener('favorites-changed', handleFavoritesChange);
        return () => window.removeEventListener('favorites-changed', handleFavoritesChange);
    }, []);

    const missingStores = (currentTenant?.fixed_warehouses || []).filter((fw: any) => 
        !warehouses.some(w => w.name === fw.name || (fw.platform && (w as any).platform === fw.platform))
    );

    const handleSyncStores = async () => {
        if (missingStores.length === 0) return;
        setIsSyncingStores(true);
        try {
            const storesToCreate = missingStores.map((fw: any) => ({
                name: fw.name,
                type: fw.type || 'storage',
                platform: fw.platform || null,
                tenant_id: currentTenant?.id,
                is_active: true,
                code: fw.code || `SBT-${Math.floor(Math.random() * 1000)}`,
                is_default: false
            }));

            // Real insert logic
            const { error: insertError } = await supabase
                .from('warehouses')
                .insert(storesToCreate);

            if (insertError) throw insertError;
            
            if (refreshWarehouses) await refreshWarehouses();
            if (showToast) showToast(`${missingStores.length} yeni mağaza tanımlandı.`, "success");
        } catch (err: any) {
            if (showToast) showToast("Hata: " + err.message, "error");
        } finally {
            setIsSyncingStores(false);
        }
    };

    // Kategorili menü yapısı
    const menuCategories: MenuCategory[] = [
        {
            id: "main",
            label: "JetPanel :)",
            icon: LayoutDashboard,
            defaultOpen: true,
            items: [
                { id: "home", label: "Ana Ekran", icon: Store, feature: null, description: "İşletmenizin genel özetini ve hızlı aksiyonları görebileceğiniz ana sayfa." },
                { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, feature: null, description: "Satış verileri ve stok durumlarını grafiklerle analiz edebileceğiniz panel." },
            ]
        },
        {
            id: "sales",
            label: "JetKasa",
            icon: ShoppingCart,
            items: [
                { id: "pos", label: "Hızlı Satış", icon: ShoppingCart, feature: "pos", description: "Hızlı nakit veya kartlı satış işlemlerini gerçekleştirebileceğiniz satış ekranı." },
                { id: "history", label: "Satış Geçmişi", icon: History, feature: "sales_history", description: "Geçmişte yapılan tüm satışların detaylı dökümü ve yönetimi." },
                { id: "invoice", label: "Fatura İşlemleri", icon: FileText, feature: "invoice", description: "Elektronik fatura gönderimi ve takibi için entegrasyon ekranı." },
            ]
        },
        {
            id: "adisyon",
            label: "JetMasa",
            icon: Utensils,
            feature: "adisyon",
            items: [
                { id: "adisyon", label: "Masa Yönetimi", icon: Grid3X3, feature: null, description: "Restoran ve kafeler için masa bazlı sipariş takip ve adisyon ekranı." },
            ]
        },
        {
            id: "web",
            label: "JetWeb & Dijital",
            icon: Globe,
            items: [
                { id: "qrmenu", label: "QR Menü Yönetimi", icon: ExternalLink, feature: "qrmenu", description: "Dijital menünüzü tasarlayın ve yayınlayın." },
                { id: "showcase", label: "Vitrin Tasarımı", icon: Monitor, feature: "showcase", description: "Müşterileriniz için premium bir açılış sayfası (Vitrin) oluşturun." },
            ]
        },
        {
            id: "marketing",
            label: "JetGörünüm",
            icon: Monitor,
            items: [
                { id: "cfd", label: "Müşteri Ekranı (CFD)", icon: Monitor, feature: "cfd", description: "Müşteri tarafında duran işlem takip ekranını yönetin ve özelleştirin." },
            ]
        },
        {
            id: "products",
            label: "JetStok",
            icon: Package,
            items: [
                { id: "products", label: "Ürün Listesi", icon: Boxes, feature: "products", description: "Stoktaki ürünlerin listelenmesi, yeni ürün ekleme ve düzenleme işlemleri." },
                { id: "warehouse", label: "Depo Yönetimi", icon: Building2, feature: "products", description: "Farklı depo ve mağazaların stok ve fiyat yönetimi." },
                { id: "alerts", label: "Stok Uyarıları", icon: AlertTriangle, feature: "products", description: "Kritik stok seviyesine düşen ürünler için otomatik uyarılar." },
                { id: "label_designer", label: "Ürün Etiketleri", icon: Tags, feature: "label_designer", description: "Barkodlu fiyat etiketleri tasarla ve yazdır." },
                { id: "trash", label: "Geri Dönüşüm Kutusu", icon: Trash2, feature: "products", description: "Silinen ürünleri görüntüleyin ve gerekirse geri yükleyin." },
            ]
        },
        {
            id: "jet_muhasebe",
            label: "JetMuhasebe",
            icon: Landmark,
            subCategories: [
                {
                    id: "cari_hesap",
                    label: "Cari Hesap Takibi",
                    icon: Users,
                    items: [
                        { id: "cari_tanim", label: "Cari Tanıtımı", icon: UserPlus, feature: null, description: "Müşteri ve tedarikçilerinizin sisteme tanımlanması." },
                        { id: "cari_borc", label: "Borç Dekontu", icon: FileOutput, feature: null, description: "Cari hesaplara borç kaydı girmek için dekont ekranı." },
                        { id: "cari_alacak", label: "Alacak Dekontu", icon: FileInput, feature: null, description: "Cari hesaplara alacak nakdi veya iade kaydı girer." },
                        { id: "cari_virman", label: "Virman Dekontu", icon: ArrowLeftRight, feature: null, description: "İki cari hesap arasında bakiye transferi işlemi." },
                        { id: "cari_liste", label: "Cari Kartı Listesi", icon: ClipboardList, feature: null, description: "Tüm cari hesapların detaylı listesi." },
                        { id: "cari_hareket", label: "Hareket Raporu", icon: FileSearch, feature: null, description: "Cari hesap ekstreleri ve işlem geçmişi." },
                    ]
                },
                {
                    id: "cash_ops",
                    label: "Kasa İşlemleri",
                    icon: Wallet,
                    items: [
                        { id: "cash_define", label: "Kasa Tanıtımı", icon: Wallet, feature: null, description: "Kasa ve banka hesaplarının tanımlanması." },
                        { id: "cash_in", label: "Kasa Tahsil Fişi", icon: FileInput, feature: null, description: "Tahsil edilen nakit paraların kasaya giriş kaydı." },
                        { id: "cash_out", label: "Kasa Tediye Fişi", icon: FileOutput, feature: null, description: "Kasadan yapılan ödeme ve nakit çıkışlarının kaydı." },
                        { id: "cash_transfer", label: "Kasa Virman Fişi", icon: ArrowLeftRight, feature: null, description: "Farklı kasalar arasında para aktarımı." },
                        { id: "cash_history", label: "Kasa Hareket Raporu", icon: FileSearch, feature: null, description: "Kasa bazlı detaylı işlem ve hareket dökümü." },
                    ]
                },
                {
                    id: "bank_ops",
                    label: "Banka İşlemleri",
                    icon: Landmark,
                    items: [
                        { id: "bank_define", label: "Banka Tanıtımı", icon: Landmark, feature: null, description: "Banka hesaplarının tanımlanması." },
                        { id: "bank_deposit", label: "Bankaya Para Yatırma", icon: FileInput, feature: null, description: "Banka hesabına nakit yatırım işlemleri." },
                        { id: "bank_withdraw", label: "Bankadan Para Çekme", icon: FileOutput, feature: null, description: "Banka hesabından nakit çekim işlemleri." },
                        { id: "bank_transfer", label: "Banka Virman Fişi", icon: ArrowLeftRight, feature: null, description: "Hesaplar arası transferler." },
                        { id: "bank_history", label: "Banka Hareket Raporu", icon: FileSearch, feature: null, description: "Banka hesaplarına ait detaylı ekstre." },
                    ]
                },
                {
                    id: "invoice_waybill_management",
                    label: "Fatura ve İrsaliye",
                    icon: FileText,
                    items: [
                        { id: "alis_irsaliyesi", label: "Alış İrsaliyesi", icon: FileInput, description: "Mal alımında gelen irsaliyelerin kaydı." },
                        { id: "satis_irsaliyesi", label: "Satış İrsaliyesi", icon: FileOutput, description: "Müşterilere sevkiyat öncesi kesilen sevk irsaliyesi." },
                        { id: "alis_faturasi", label: "Alış Faturası", icon: FilePlus, description: "Tedarikçilerden gelen mal ve stok faturaları." },
                        { id: "satis_faturasi", label: "Satış Faturası", icon: FileText, description: "Toptan müşterilere kesilen kurumsal faturalar." },
                        { id: "perakende_satis_faturasi", label: "Perakende Satış", icon: ShoppingBag, description: "Nihai tüketicilere kesilen perakende faturaları." },
                        { id: "iade_faturasi", label: "İade Faturası", icon: History, description: "İade alınan veya iade edilen malların fatura takibi." },
                        { id: "fatura_listesi", label: "Fatura Listesi", icon: FileText, description: "Kesilen ve alınan tüm faturaların detaylı dökümü." },
                    ]
                },
                {
                    id: "finance",
                    label: "Finans & Giderler",
                    icon: Receipt,
                    items: [
                        { id: "mali_takvim", label: "Mali Takvim", icon: CalendarDays, feature: null, description: "Ödemelerinizi, tahsilatlarınızı ve vergi takviminizi yönetin." },
                        { id: "expenses", label: "Gider Yönetimi", icon: Receipt, feature: null, description: "İşletme giderlerinin kaydedilmesi ve takibi." },
                        { id: "calculator", label: "Kâr Hesaplama", icon: Calculator, feature: "profit_calculator", description: "Ürün bazlı veya genel kâr oranlarını hesaplama aracı." },
                    ]
                }
            ]
        },
        {
            id: "crm",
            label: "JetPuan & Sadakat",
            icon: Heart,
            items: [
                { id: "crm_overview", label: "Müşteri Analizi", icon: Brain, description: "Yapay zeka destekli müşteri analizi ve sadakat programı özeti." },
                { id: "crm_segments", label: "Segmentler", icon: Users, description: "Müşteri grupları (VIP, Risk, Yeni)." },
                { id: "crm_loyalty", label: "Puan Sistemi", icon: Gift, description: "Sadakat puanı ayarları ve müşteri puan takibi." },
                { id: "employee_manager", label: "JetKadro (Personel)", icon: Users, feature: "employee_module", description: "Personel bilgileri ve tanımlamalarını yönet." },
                { id: "shift_manager", label: "Vardiya Takibi", icon: Clock, feature: "employee_module", description: "Çalışan giriş/çıkış ve vardiya performans takibi." },
            ]
        },
        {
            id: "integrations",
            label: "JetEntegre",
            icon: Blocks,
            items: [
                { id: "trendyol_integration", label: "Trendyol Pazaryeri", icon: ShoppingBag, feature: "trendyol_marketplace", description: "Trendyol Pazaryeri siparişleri ve stok senkronizasyonu." },
                { id: "trendyol_go_integration", label: "Trendyol GO / Yemek", icon: ShoppingCart, feature: "trendyol_go", description: "Trendyol GO ve Yemek siparişleri, gelir ve net kar analizi." },
                { id: "yemeksepeti_integration", label: "Yemeksepeti", icon: Store, feature: "yemeksepeti", description: "Yemeksepeti siparişleri, gelir ve net kar analizi." },
                { id: "getir_integration", label: "Getir", icon: Package, feature: "getir", description: "Getir siparişleri, gelir ve net kar analizi." },
            ]
        },
        {
            id: "analytics",
            label: "JetRapor",
            icon: BarChart3,
            items: [
                { id: "reports", label: "Satış Raporları", icon: FileBarChart, feature: "reports", description: "Geleneksel ve gelişmiş satış performans raporları." },
                { id: "profit_pilot", label: "Kâr Pilotu (AI)", icon: Target, feature: "ai_features", description: "İşletmenizi kâra sokacak yapay zeka destekli stratejiler." },
                { id: "basket_offers", label: "Akıllı Sepet", icon: ShoppingCart, feature: "ai_features", description: "Sepet değerini arttıran dinamik teklif ve kampanya yönetimi." },
                { id: "dead_stock", label: "Stok Eritme", icon: Trash2, feature: "ai_features", description: "Rafta yatan parayı (bayat stok) nakde çevirme operasyonu." },
                { id: "simulation", label: "Fiyat Simülasyonu", icon: TrendingUp, feature: "price_simulator", description: "Fiyat değişikliklerinin kärlılık üzerindeki etkilerini simüle etme aracı." },
                { id: "ai_insights", label: "AI Öngörüleri", icon: Brain, feature: "ai_features", description: "Yapay zeka analizleri ile işletmenize özel büyüme önerileri." },
            ]
        },
        {
            id: "admin",
            label: "JetYönetim",
            icon: Settings,
            items: [
                { id: "audit_logs", label: "Sistem Kayıtları", icon: History, feature: null, description: "Fiyat değişimleri, silme işlemleri ve kritik dükkan hareketleri." },
                { id: "settings", label: "Genel Ayarlar", icon: Settings, feature: null, description: "Sistem ayarları ve dükkan yapılandırması." },
            ]
        },
        {
            id: "tools",
            label: "JetAraçlar",
            icon: Layers,
            items: [
                { id: "universal_converter", label: "Akıllı Dönüştürücü", icon: ImageIcon, feature: null, description: "Görsel, PDF ve Word dosyalarınız için hepsi bir arada dönüşüm aracı." },
                { id: "qr_generator", label: "QR Kod Oluşturucu", icon: QrCodeIcon, feature: null, description: "WiFi, URL veya metinler için şık QR kodlar tasarlayın." },
                { id: "currency_converter", label: "Döviz Çevirici", icon: Coins, feature: null, description: "Canlı kurlarla anlık döviz çeviri işlemleri yapın." },
                { id: "receipt_designer", label: "Fiş Düzenleyicisi", icon: Receipt, feature: null, description: "Bilgi fişlerinizi özelleştirin: logo, mağaza adı, alt başlık, vergi bilgileri." },
            ]
        }
    ];

    // Yetki bazlı filtreleme
    const filteredMenuCategories = menuCategories.map(category => {
        // --- ACCOUNTANT MODE FILTERING ---
        if (isAccountant) {
            // Sadece Muhasebeci'nin görmesi gerekenler
            const allowedForAccountant = ["sales", "jet_muhasebe", "analytics"];
            if (!allowedForAccountant.includes(category.id)) return null;

            // Satış içinden sadece "History" ve "Invoice" kalsın, "POS" gitmeli
            if (category.id === "sales") {
                return {
                    ...category,
                    items: category.items?.filter(item => ["history", "invoice"].includes(item.id))
                };
            }
            return category;
        }

        // Eğer geliştirilmiş yetkilendirme kapalıysa veya çalışan Patron ise filtreleme yapma
        const permissionsEnabled = currentTenant?.features?.employee_permissions;
        const permissions = activeEmployee?.permissions;
        const isPatron = activeEmployee?.position?.toLowerCase() === 'patron';

        if (permissionsEnabled && permissions && !isPatron) {
            // Kategori veya altındaki itemlar için yetki kontrolü
            const isCategoryAllowed = (cat: MenuCategory) => {
                if (cat.id === 'main') return true; // Ana menü her zaman açık
                if (cat.id === 'sales') return permissions.can_access_pos;
                if (cat.id === 'adisyon') return permissions.can_access_adisyon;
                if (cat.id === 'products') return permissions.can_access_inventory;
                if (cat.id === 'jet_muhasebe') return permissions.can_access_expenses || permissions.can_manage_invoices || permissions.can_access_crm;
                if (cat.id === 'crm') return permissions.can_access_crm;
                if (cat.id === 'employees') return permissions.can_manage_employees;
                if (cat.id === 'analytics') return permissions.can_access_reports;
                if (cat.id === 'web' || cat.id === 'marketing') return permissions.can_access_settings;
                if (cat.id === 'tools') return permissions.can_access_settings;
                return false; // Bilinmeyen kategoriler varsayılan KAPALI (Güvenli yaklaşım)
            };

            const isItemAllowed = (itemId: string) => {
                const map: any = {
                    'pos': permissions.can_access_pos,
                    'adisyon': permissions.can_access_adisyon,
                    'reports': permissions.can_access_reports,
                    'simulation': permissions.can_access_reports,
                    'ai_insights': permissions.can_access_reports,
                    'products': permissions.can_access_inventory,
                    'warehouse': permissions.can_access_inventory,
                    'expenses': permissions.can_access_expenses,
                    'crm_overview': permissions.can_access_crm,
                    'employee_manager': permissions.can_manage_employees,
                    'shift_manager': permissions.can_manage_employees,
                    'settings': permissions.can_access_settings,
                    'alis_faturasi': permissions.can_manage_invoices,
                    'satis_faturasi': permissions.can_manage_invoices,
                    'perakende_satis_faturasi': permissions.can_manage_invoices,
                    'iade_faturasi': permissions.can_manage_invoices,
                    'dashboard': permissions.can_access_reports,
                    'history': permissions.can_access_reports,
                    'invoice': permissions.can_manage_invoices,
                };
                return map[itemId] ?? true;
            };

            if (!isCategoryAllowed(category)) return null;

            // İçerideki item'ları da filtrele
            return {
                ...category,
                items: category.items?.filter(item => isItemAllowed(item.id)),
                subCategories: category.subCategories?.filter(sub => isCategoryAllowed(sub))
            };
        }

        return category;
    }).filter(Boolean) as MenuCategory[];

    // Arama sonuçlarını hesapla
    const getSearchResults = () => {
        if (!searchQuery.trim()) return [];
        const results: MenuItem[] = [];
        const query = searchQuery.toLowerCase();

        menuCategories.forEach(cat => {
            // Ana itemlarda ara
            cat.items?.forEach(item => {
                if (item.label.toLowerCase().includes(query) || item.description?.toLowerCase().includes(query)) {
                    results.push(item);
                }
            });
            // Alt kategorilerde ara
            cat.subCategories?.forEach(sub => {
                sub.items?.forEach(item => {
                    if (item.label.toLowerCase().includes(query) || item.description?.toLowerCase().includes(query)) {
                        results.push(item);
                    }
                });
            });
        });
        return results;
    };

    const searchResults = getSearchResults();

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
    const allLockedItems = filteredMenuCategories.flatMap(cat => {
        // Kategori seviyesinde kilitli mi?
        if (cat.feature && !isFeatureEnabled(cat.feature)) {
            return [{ id: cat.id, label: cat.label, icon: cat.icon, feature: cat.feature }];
        }
        if (cat.subCategories) {
            return cat.subCategories.flatMap(sub => getLockedItems(sub.items));
        }
        return getLockedItems(cat.items);
    });

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

    // Kategori aç/kapa
    const toggleCategory = (categoryId: string) => {
        setOpenCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    // Tab değişince ilgili kategoriyi aç
    const handleTabChange = (tabId: string) => {
        // Ana kategorilerde ara
        for (const category of filteredMenuCategories) {
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
        <aside className={`w-72 premium-sidebar flex flex-col h-screen fixed lg:sticky top-0 left-0 bg-card z-50 overflow-hidden border-r transition-transform duration-300 ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0 shadow-none'}`}>
            {/* Logo / Firma Header */}
            <div className="p-6 border-b border-border">
                <div className="flex items-center justify-center space-x-3">
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
                        <h1 className="text-lg font-black text-[var(--color-sidebar-foreground)] truncate">
                            {currentTenant?.company_name || 'JetPos'}
                        </h1>
                        <p className="text-xs text-[var(--color-sidebar-muted)] truncate">Yönetim Paneli</p>
                    </div>
                </div>
            </div>


            <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                {/* Search Bar (Inside scrollable for hide-on-scroll) */}
                <div className="px-4 mt-4 mb-6 relative">
                    <div className={`relative flex items-center transition-all duration-300 ${isSearchFocused ? 'scale-[1.02]' : ''}`}>
                        <Search className={`absolute left-3 w-4 h-4 transition-colors ${isSearchFocused ? 'text-primary' : 'text-secondary/40'}`} />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Menüde ara... (CTRL+K)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                            className="w-full bg-[var(--color-faded)] border border-[var(--color-border)] focus:border-primary/50 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-[var(--color-sidebar-foreground)] placeholder:text-[var(--color-muted)] outline-none transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 p-1 hover:bg-white/10 rounded-lg text-[var(--color-muted)] hover:text-primary transition-all"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    {/* Search Results Dropdown */}
                    <AnimatePresence>
                        {searchQuery && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute left-4 right-4 mt-2 bg-card border border-[var(--color-border)] rounded-2xl shadow-2xl z-[110] max-h-[300px] overflow-y-auto custom-scrollbar p-2 space-y-1"
                            >
                                {searchResults.length > 0 ? (
                                    searchResults.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                handleTabChange(item.id);
                                                setSearchQuery("");
                                            }}
                                            className="w-full flex items-center gap-3 p-2.5 hover:bg-[var(--color-faded)] rounded-xl transition-all group group-hover:translate-x-1"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                                                <item.icon className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="flex flex-col items-start min-w-0">
                                                <span className="text-xs font-black text-[var(--color-sidebar-foreground)]">{item.label}</span>
                                                {item.description && (
                                                    <span className="text-[10px] text-[var(--color-muted)] truncate w-full text-left">{item.description}</span>
                                                )}
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-8 text-center">
                                        <p className="text-xs font-bold text-secondary/40 italic">Sonuç bulunamadı...</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <nav className="px-3 space-y-1">
                    {filteredMenuCategories.map((category) => {
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
                                        ? 'sidebar-item-active'
                                        : 'text-[var(--color-sidebar-muted)] hover:bg-primary/5 hover:text-[var(--color-sidebar-foreground)]'
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
                                            <div className="pl-4 mt-1 space-y-1 border-l-2 border-[var(--color-border)] ml-6">
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
                                                                    ? 'bg-primary/10 text-[var(--color-sidebar-foreground)]'
                                                                    : 'text-[var(--color-sidebar-muted)] hover:bg-primary/5 hover:text-[var(--color-sidebar-foreground)]'
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
                                                                        <div className="pl-3 mt-1 space-y-0.5 border-l border-[var(--color-border)] ml-4">
                                                                            {subFilteredItems.map((item) => {
                                                                                const isItemFavorite = isFavorite(item.id);

                                                                                return (
                                                                                    <div key={item.id} className="flex items-center gap-1 group/item relative">
                                                                                        <motion.button
                                                                                            whileHover={{ x: 4 }}
                                                                                            whileTap={{ scale: 0.98 }}
                                                                                            onClick={() => handleTabChange(item.id)}
                                                                                            className={`flex-1 flex items-center gap-2 px-2 py-2 rounded-lg transition-all text-xs ${activeTab === item.id
                                                                                                ? 'sidebar-item-active'
                                                                                                : 'text-[var(--color-sidebar-muted)] hover:bg-primary/5 hover:text-[var(--color-sidebar-foreground)]'
                                                                                                }`}
                                                                                        >
                                                                                            <item.icon className="w-3.5 h-3.5" />
                                                                                            <span className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
                                                                                        </motion.button>

                                                                                        <div className="flex items-center gap-0.5">
                                                                                            {showHelpIcons && item.description && (
                                                                                                <div className="relative group/info">
                                                                                                    <HelpCircle className="w-3 h-3 text-secondary/30 hover:text-primary transition-colors cursor-help" />
                                                                                                    <div className="absolute right-0 bottom-full mb-2 w-48 p-3 bg-[var(--color-card)]/95 backdrop-blur-xl border border-[var(--color-border)] rounded-xl shadow-2xl opacity-0 group-hover/info:opacity-100 transition-all pointer-events-none z-[100] translate-y-1 group-hover/info:translate-y-0 text-center">
                                                                                                        <div className="absolute right-2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-[var(--color-border)]" />
                                                                                                        <p className="text-[10px] text-[var(--color-foreground)]/90 leading-relaxed font-medium">
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
                                                                    ? 'sidebar-item-active'
                                                                    : 'text-[var(--color-sidebar-muted)] hover:bg-primary/5 hover:text-[var(--color-sidebar-foreground)]'
                                                                    }`}
                                                            >
                                                                <item.icon className="w-4 h-4" />
                                                                <span className="font-medium">{item.label}</span>
                                                            </motion.button>

                                                            <div className="flex items-center gap-1">
                                                                {showHelpIcons && item.description && (
                                                                    <div className="relative group/info">
                                                                        <HelpCircle className="w-3.5 h-3.5 text-secondary/30 hover:text-primary transition-colors cursor-help" />
                                                                        <div className="absolute right-0 bottom-full mb-3 w-56 p-4 bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-xl opacity-0 group-hover/info:opacity-100 transition-all pointer-events-none z-[100] translate-y-2 group-hover/info:translate-y-0">
                                                                            <div className="absolute right-4 top-full w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white/10" />
                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                <div className="w-1 h-3 bg-primary rounded-full" />
                                                                                <span className="text-[10px] font-black text-[var(--color-muted)] tracking-widest uppercase">Nedir?</span>
                                                                            </div>
                                                                            <p className="text-xs text-[var(--color-card-foreground)] leading-relaxed font-medium">
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
                                                                        className={`p-1.5 rounded-lg transition-all hover:bg-primary/5 ${isItemFavorite
                                                                            ? 'text-yellow-500 opacity-100'
                                                                            : 'text-[var(--color-sidebar-muted)] hover:text-yellow-500 opacity-0 group-hover/item:opacity-100'
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
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/5 border border-border opacity-50 cursor-not-allowed"
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

            {/* Bottom Section - User & Settings (Collapsible) */}
            <div className="border-t border-border mt-auto bg-primary/5">
                {/* Toggle Button */}
                <button
                    onClick={() => setIsBottomPanelOpen(!isBottomPanelOpen)}
                    className="w-full py-2 flex items-center justify-center hover:bg-primary/5 transition-colors group"
                >
                    <motion.div
                        animate={{ rotate: isBottomPanelOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ChevronDown className="w-4 h-4 text-secondary group-hover:text-foreground transition-colors" />
                    </motion.div>
                </button>

                {/* Collapsible Content */}
                <AnimatePresence initial={false}>
                    {isBottomPanelOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1, transitionEnd: { overflow: "visible" } }}
                            exit={{ height: 0, opacity: 0, overflow: "hidden" }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                        >
                            <div className="p-4">
                                {activeEmployee && (
                                    <div className="mb-4 p-3 bg-primary/5 border border-primary/10 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">{activeEmployee.position}</span>
                                                <span className="text-xs font-bold text-foreground truncate max-w-[100px]">{activeEmployee.first_name} {activeEmployee.last_name}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={logoutEmployee}
                                            className="p-2 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-lg transition-all"
                                            title="Çalışan Çıkış"
                                        >
                                            <LogOut className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                                {/* User Info */}
                                <div className="flex items-center space-x-3 mb-3 px-2">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                                        <span className="text-white font-bold text-xs">
                                            {currentTenant?.company_name?.substring(0, 2).toUpperCase() || 'JP'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-[var(--color-sidebar-foreground)] truncate">
                                            {currentTenant?.company_name || 'JetPos'}
                                        </p>
                                        <p className="text-xs text-[var(--color-sidebar-muted)]">Admin</p>
                                    </div>
                                </div>

                                {/* Store Switcher */}
                                <div className="mb-4 px-2">
                                    <div className="relative group/store">
                                        <button
                                            onClick={() => {
                                                // Local state for dropdown if needed, or just show a small list
                                                // For now, let's just make it a simple list if clicked, or a fixed selector
                                            }}
                                            className="w-full flex items-center justify-between gap-3 p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-all text-left"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                                    {activeWarehouse?.type === 'virtual' ? <ShoppingBag className="w-4 h-4 text-indigo-400" /> : <Store className="w-4 h-4 text-indigo-400" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-black text-indigo-400/70 uppercase tracking-widest leading-none mb-1">Aktif Mağaza</p>
                                                    <p className="text-xs font-bold text-white truncate">{activeWarehouse?.name || 'Seçilmedi'}</p>
                                                </div>
                                            </div>
                                            <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400/50" />
                                        </button>

                                        {/* Simple Dropdown on Hover/Click - Let's use a simple absolute menu */}
                                        <div className="absolute bottom-full left-0 w-64 mb-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover/store:opacity-100 group-hover/store:visible transition-all z-[100] p-2 space-y-1">
                                            <p className="text-[10px] font-black text-secondary/50 uppercase tracking-widest p-2 border-b border-white/5 mb-1">Mağaza Değiştir</p>
                                            <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                                                {warehouses.map(w => (
                                                    <button
                                                        key={w.id}
                                                        onClick={() => {
                                                            setActiveWarehouse(w);
                                                            if (showToast) {
                                                                showToast(`${w.name} mağazasına geçildi.`, "success");
                                                            }
                                                        }}
                                                        className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left ${activeWarehouse?.id === w.id ? 'bg-indigo-500/20 text-white' : 'hover:bg-white/5 text-secondary hover:text-white'}`}
                                                    >
                                                        {w.type === 'virtual' ? <ShoppingBag className="w-3.5 h-3.5" /> : <Store className="w-3.5 h-3.5" />}
                                                        <span className="text-xs font-bold truncate">{w.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            
                                            {missingStores.length > 0 && (
                                                <button
                                                    onClick={handleSyncStores}
                                                    disabled={isSyncingStores}
                                                    className="w-full mt-2 flex items-center justify-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all group/sync"
                                                >
                                                    <Sparkles className={`w-3.5 h-3.5 ${isSyncingStores ? 'animate-spin' : 'group-hover/sync:animate-pulse'}`} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                                        {isSyncingStores ? 'Kuruluyor...' : `${missingStores.length} Eksik Mağazayı Kur`}
                                                    </span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Settings & Logout */}
                                <div className="space-y-1">
                                    <button
                                        onClick={() => handleTabChange('settings')}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${activeTab === 'settings'
                                            ? 'sidebar-item-active'
                                            : 'text-[var(--color-sidebar-muted)] hover:bg-primary/5 hover:text-[var(--color-sidebar-foreground)]'
                                            }`}
                                    >
                                        <Settings className="w-4 h-4" />
                                        <span className="font-semibold">Ayarlar</span>
                                    </button>

                                    <button
                                        onClick={() => handleTabChange('support')}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${activeTab === 'support'
                                            ? 'sidebar-item-active'
                                            : 'text-[var(--color-sidebar-muted)] hover:bg-primary/5 hover:text-[var(--color-sidebar-foreground)]'
                                            }`}
                                    >
                                        <LifeBuoy className="w-4 h-4" />
                                        <span className="font-semibold">Destek</span>
                                    </button>

                                    <button
                                        onClick={() => handleTabChange('profile')}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${activeTab === 'profile'
                                            ? 'sidebar-item-active'
                                            : 'text-[var(--color-sidebar-muted)] hover:bg-primary/5 hover:text-[var(--color-sidebar-foreground)]'
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
                                <div className="flex items-center justify-between text-xs text-secondary mt-3 pt-3 border-t border-border px-2">
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                        Çevrimiçi
                                    </span>
                                    <span className="font-mono">v{process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </aside>
    );
}
