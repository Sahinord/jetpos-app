"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ShoppingBag, Info, Search, ChevronRight, 
    Star, ArrowRight, Menu, X, Utensils, Plus, MapPin, Phone, Instagram, ImageIcon,
    Wifi, Lock, ExternalLink, MessageCircle, Clock, Moon, AlertCircle
} from "lucide-react";

export default function PublicQRMenu({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = React.use(params);
    const [settings, setSettings] = useState<any>(null);
    const [categories, setCategories] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [cart, setCart] = useState<any[]>([]);
    const [showCart, setShowCart] = useState(false);
    const [showAbout, setShowAbout] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [isOpen, setIsOpen] = useState(true);

    useEffect(() => {
        // Add seamless marquee animation to head
        const styleId = 'marquee-animation-style-public-v2';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.innerHTML = `
                @keyframes marquee-seamless {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee-seamless {
                    display: flex !important;
                    animation: marquee-seamless linear infinite !important;
                    width: max-content !important;
                }
            `;
            document.head.appendChild(style);
        }

        if (slug) {
            fetchMenuData();
        }
    }, [slug]);

    const checkIsOpen = (settingsData: any) => {
        if (settingsData.is_closed_manual) return false;
        if (!settingsData.working_hours) return true;

        const now = new Date();
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = days[now.getDay()];
        const todayHours = settingsData.working_hours[dayName];

        if (!todayHours || !todayHours.active) return false;

        const [openHour, openMin] = todayHours.open.split(':').map(Number);
        const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
        
        const openTime = openHour * 60 + openMin;
        const closeTime = closeHour * 60 + closeMin;
        const currentTime = now.getHours() * 60 + now.getMinutes();

        return currentTime >= openTime && currentTime <= closeTime;
    };

    const fetchMenuData = async () => {
        try {
            // 1. Fetch Settings by Slug
            const { data: settingsData, error: sError } = await supabase
                .from('qr_menu_settings')
                .select('*, tenants!inner(*)')
                .eq('slug', slug)
                .single();

            if (sError) throw sError;
            setSettings(settingsData);
            setIsOpen(checkIsOpen(settingsData));

            if (!settingsData.is_active) {
                setLoading(false);
                return;
            }

            // 2. Fetch QR Categories
            const { data: catData, error: cError } = await supabase
                .from('categories')
                .select('*')
                .eq('tenant_id', settingsData.tenant_id);

            if (cError) throw cError;
            
            const qrCategories = catData.filter(c => c.is_qr_only || c.is_active !== false);
            setCategories(qrCategories);

            // 3. Fetch Products for these categories
            const catIds = qrCategories.map(c => c.id);
            if (catIds.length > 0) {
                const { data: prodData, error: pError } = await supabase
                    .from('products')
                    .select('*')
                    .in('category_id', catIds)
                    .eq('tenant_id', settingsData.tenant_id)
                    .eq('status', 'active');
                
                if (pError) throw pError;
                setProducts(prodData || []);
            }

        } catch (error) {
            console.error("Menu fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!settings || !settings.is_active) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6">
                    <X size={40} className="text-slate-400" />
                </div>
                <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Menü Bulunamadı</h1>
                <p className="text-slate-500 mt-2">Bu restoranın menüsü şu an aktif değil veya adres yanlış.</p>
            </div>
        );
    }

    const filteredProducts = products.filter(p => {
        const matchesCategory = activeCategory === "all" || p.category_id === activeCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const primaryColor = settings.primary_color || "#3b82f6";
    const fontFamily = settings.font_family || "Inter";
    const elementOrder = settings.element_order || ["header", "logo", "marquee", "banner", "social_bar", "wifi_info"];

    const addToCart = (product: any) => {
        if (!isOpen) return; // Closed protection
        const existing = cart.find(i => i.id === product.id);
        if (existing) {
            setCart(cart.map(i => i.id === product.id ? {...i, quantity: i.quantity + 1} : i));
        } else {
            setCart([...cart, {...product, quantity: 1}]);
        }
    };

    return (
        <div 
            className={`min-h-screen ${settings.dark_mode_enabled ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}
            style={{ fontFamily }}
        >
            {/* Wrapper for Tablet/PC - Responsive Container */}
            <div className="max-w-2xl mx-auto min-h-screen relative shadow-2xl bg-inherit pb-24 border-x border-black/5 sm:border-black/10">
                
                {/* Kaplanma/Kapalı Uyarısı (Closed Banner) */}
                {!isOpen && (
                    <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-4 flex items-center gap-4 text-amber-500">
                        <div className="p-2 bg-amber-500 text-white rounded-xl shadow-lg">
                            <Moon size={18} />
                        </div>
                        <div>
                            <span className="block text-[10px] font-black uppercase tracking-widest">Şu An Kapalıyız</span>
                            <span className="text-xs font-bold leading-none">Harika lezzetler için bir süre dinleniyoruz.</span>
                        </div>
                    </div>
                )}

                {/* Dinamik Sıralanmış Bileşenler */}
                {elementOrder.map((el: string) => {
                    if (el === 'header' && settings.fixed_header_text) {
                        return (
                            <div 
                                key="header"
                                className="sticky top-0 z-[60] py-3 px-4 text-center border-b border-black/10 shadow-sm backdrop-blur-md"
                                style={{ backgroundColor: `${settings.header_bg_color || '#000'}F5`, color: settings.header_text_color || '#fff' }}
                            >
                                <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em]">{settings.fixed_header_text}</span>
                            </div>
                        );
                    }

                    if (el === 'logo') {
                        return (
                            <div key="logo" className="pt-8 pb-6 flex flex-col items-center gap-4">
                                {settings.logo_url ? (
                                    <img 
                                        src={settings.logo_url} 
                                        alt="Logo" 
                                        className="object-contain drop-shadow-sm transition-all duration-300"
                                        style={{ 
                                            height: `${settings.logo_size || 80}px`,
                                            filter: !isOpen ? 'grayscale(100%) opacity(50%)' : 'none'
                                        }}
                                    />
                                ) : (
                                    <div className="p-4 bg-primary/10 rounded-full">
                                        <Utensils size={40} style={{ color: primaryColor }} />
                                    </div>
                                )}
                                <div className="flex flex-col items-center text-center px-6">
                                    <h1 className={`text-2xl sm:text-3xl font-black uppercase tracking-tighter leading-none mb-1 ${settings.dark_mode_enabled ? 'text-white' : 'text-slate-900'}`}>
                                        {settings.tenants?.company_name}
                                    </h1>
                                    <div 
                                        className="flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-sm"
                                        style={{ color: primaryColor, borderColor: `${primaryColor}40`, backgroundColor: `${primaryColor}08` }}
                                    >
                                        <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest">{settings.welcome_text}</span>
                                        {!isOpen && <AlertCircle size={10} className="text-amber-500 animate-pulse" />}
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    if (el === 'social_bar' && (settings.instagram_url || settings.whatsapp_number)) {
                        return (
                            <div key="social_bar" className="flex items-center justify-center gap-3 px-6 pb-4">
                                {settings.instagram_url && (
                                    <a 
                                        href={`https://instagram.com/${settings.instagram_url.replace('@', '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-tr from-pink-500 to-indigo-600 text-white text-[11px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                                    >
                                        <Instagram size={16} /> Instagram
                                    </a>
                                )}
                                {settings.whatsapp_number && (
                                    <a 
                                        href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g,'')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                                    >
                                        <MessageCircle size={16} /> WhatsApp
                                    </a>
                                )}
                            </div>
                        );
                    }

                    if (el === 'wifi_info' && settings.wifi_name) {
                        return (
                            <div key="wifi_info" className="px-6 pb-6">
                                <div className="p-4 sm:p-5 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between group active:scale-[0.98] transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                            <Wifi size={24} />
                                        </div>
                                        <div>
                                            <span className="block text-[10px] font-black text-blue-500 uppercase tracking-widest">WIFI ŞİFRESİ</span>
                                            <span className={`text-sm font-black uppercase ${settings.dark_mode_enabled ? 'text-white' : 'text-slate-800'}`}>{settings.wifi_name}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center gap-2 bg-blue-500/20 px-3 py-1.5 rounded-xl">
                                            <Lock size={12} className="text-blue-500" />
                                            <span className="text-xs font-black text-blue-500 tracking-tighter">{settings.wifi_password || 'Şifresiz'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    if (el === 'marquee' && settings.marquee_text) {
                        const spacing = settings.marquee_spacing || 80;
                        return (
                            <div 
                                key="marquee"
                                className="relative overflow-hidden py-2.5 border-y border-black/5 shadow-inner"
                                style={{ backgroundColor: settings.marquee_bg_color || '#ef4444' }}
                            >
                                <div 
                                    className="animate-marquee-seamless flex whitespace-nowrap"
                                    style={{ animationDuration: `${settings.marquee_speed || 20}s` }}
                                >
                                    {Array.from({ length: 20 }).map((_, i) => (
                                        <span 
                                            key={i} 
                                            className="text-[11px] font-black uppercase text-white shrink-0"
                                            style={{ paddingLeft: `${spacing / 2}px`, paddingRight: `${spacing / 2}px` }}
                                        >
                                            {settings.marquee_text}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    }

                    if (el === 'banner') {
                        return (
                            <div key="banner" className="p-4 sm:p-6">
                                <div className="relative h-44 sm:h-64 overflow-hidden rounded-[40px] shadow-2xl border border-white/20 group">
                                    {settings.banner_url ? (
                                        <img src={settings.banner_url} alt="Banner" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full" style={{ backgroundColor: `${primaryColor}20` }} />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex flex-col items-center justify-center p-6 text-center">
                                        <button 
                                            onClick={() => setShowAbout(true)}
                                            className="bg-white/20 hover:bg-white text-white hover:text-primary transition-all p-4 rounded-full backdrop-blur-2xl border border-white/30 shadow-2xl active:scale-90"
                                        >
                                            <Info size={24} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                    return null;
                })}

                {/* Sticky Search & Categories */}
                <div className={`sticky ${settings.fixed_header_text ? 'top-[44px] sm:top-[48px]' : 'top-0'} z-50 p-4 sm:p-6 space-y-4 ${settings.dark_mode_enabled ? 'bg-slate-950/90' : 'bg-slate-50/90'} backdrop-blur-2xl border-b border-black/5`}>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Nefis bir şeyler ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-12 pr-4 py-4 sm:py-5 rounded-3xl text-sm font-bold outline-none border transition-all ${
                                settings.dark_mode_enabled 
                                ? 'bg-slate-900 border-slate-800 text-white focus:ring-4 focus:ring-primary/10' 
                                : 'bg-white border-slate-200 text-slate-800 focus:ring-4 focus:ring-primary/10 shadow-lg'
                            }`}
                        />
                    </div>

                    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none px-1">
                        <button 
                            onClick={() => setActiveCategory("all")}
                            className={`px-8 py-3.5 whitespace-nowrap rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                activeCategory === "all" 
                                ? 'shadow-xl shadow-primary/30 scale-105' 
                                : 'opacity-40 hover:opacity-60'
                            }`}
                            style={{ 
                                backgroundColor: activeCategory === "all" ? primaryColor : 'transparent',
                                color: activeCategory === "all" ? '#fff' : (settings.dark_mode_enabled ? '#fff' : '#1e293b')
                            }}
                        >
                            TÜM MENÜ
                        </button>
                        {categories.map(cat => (
                            <button 
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`px-8 py-3.5 whitespace-nowrap rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                    activeCategory === cat.id 
                                    ? 'shadow-xl shadow-primary/30 scale-105' 
                                    : 'opacity-40 hover:opacity-60'
                                }`}
                                style={{ 
                                    backgroundColor: activeCategory === cat.id ? primaryColor : 'transparent',
                                    color: activeCategory === cat.id ? '#fff' : (settings.dark_mode_enabled ? '#fff' : '#1e293b')
                                }}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product List */}
                <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {filteredProducts.map(product => (
                        <motion.div 
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            key={product.id}
                            className={`group relative overflow-hidden rounded-[32px] border transition-all active:scale-[0.98] ${
                                settings.dark_mode_enabled 
                                ? 'bg-slate-900 border-slate-800' 
                                : 'bg-white border-slate-100 shadow-xl hover:shadow-2xl'
                            } ${!isOpen ? 'opacity-70 grayscale-[0.5]' : ''}`}
                        >
                            <div className="flex gap-4 p-4">
                                <div 
                                    onClick={() => setSelectedProduct(product)}
                                    className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[24px] overflow-hidden bg-slate-100 shrink-0 shadow-inner cursor-pointer"
                                >
                                    {product.badge_text && (
                                        <div 
                                            className="absolute top-2 left-2 z-10 px-2.5 py-1 rounded-lg shadow-lg"
                                            style={{ backgroundColor: product.badge_color || '#ef4444' }}
                                        >
                                            <span className="text-[8px] font-black text-white uppercase tracking-widest whitespace-nowrap">{product.badge_text}</span>
                                        </div>
                                    )}

                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <Utensils size={40} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 flex flex-col justify-between min-w-0 py-1">
                                    <div onClick={() => setSelectedProduct(product)} className="cursor-pointer">
                                        <h3 className={`font-black text-sm sm:text-base uppercase tracking-tight truncate leading-tight ${settings.dark_mode_enabled ? 'text-white' : 'text-slate-900'}`}>{product.name}</h3>
                                        <p className={`text-[11px] sm:text-xs line-clamp-2 mt-1.5 leading-relaxed font-medium ${settings.dark_mode_enabled ? 'opacity-60 text-white' : 'text-slate-500'}`}>
                                            {product.description || "Taze malzemelerle hazırlanan lezzetli bir seçim."}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black opacity-30 uppercase">FİYAT</span>
                                            <span className="text-lg sm:text-xl font-black" style={{ color: primaryColor }}>
                                                {product.sale_price} ₺
                                            </span>
                                        </div>
                                        {isOpen && (
                                            <button 
                                                onClick={() => addToCart(product)}
                                                className="p-4 rounded-3xl transition-all shadow-lg active:shadow-inner active:scale-90"
                                                style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                                            >
                                                <Plus size={20} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Product Detail Modal */}
                <AnimatePresence>
                    {selectedProduct && (
                        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedProduct(null)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
                            <motion.div 
                                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                                className={`relative w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] overflow-hidden ${settings.dark_mode_enabled ? 'bg-slate-950 border-t border-white/10' : 'bg-white shadow-2xl'}`}
                            >
                                <div className="relative h-72 sm:h-96 w-full">
                                    {selectedProduct.image_url ? (
                                        <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                                            <Utensils size={100} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/20" />
                                    
                                    {selectedProduct.badge_text && (
                                        <div className="absolute top-6 left-6 z-10 px-4 py-2 rounded-2xl shadow-2xl" style={{ backgroundColor: selectedProduct.badge_color || '#ef4444' }}>
                                            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{selectedProduct.badge_text}</span>
                                        </div>
                                    )}

                                    <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 p-4 bg-black/20 hover:bg-black/40 backdrop-blur-2xl text-white rounded-full transition-all active:scale-90 shadow-2xl">
                                        <X size={28} />
                                    </button>
                                </div>

                                <div className="p-8 sm:p-10 -mt-10 relative bg-inherit rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <h2 className={`text-2xl sm:text-3xl font-black uppercase tracking-tighter leading-none ${settings.dark_mode_enabled ? 'text-white' : 'text-slate-900'}`}>{selectedProduct.name}</h2>
                                            <div className="px-5 py-2 rounded-full border border-primary/20 bg-primary/5">
                                                <span className="text-xl sm:text-2xl font-black" style={{ color: primaryColor }}>{selectedProduct.sale_price} ₺</span>
                                            </div>
                                        </div>
                                        
                                        <p className={`text-sm sm:text-base leading-relaxed font-medium ${settings.dark_mode_enabled ? 'opacity-70 text-white' : 'text-slate-600'}`}>
                                            {selectedProduct.description || "Özel tarifimizle hazırlanan, damaklarda iz bırakacak benzersiz bir lezzet deneyimi."}
                                        </p>

                                        <div className="grid grid-cols-3 gap-3 py-6 my-2 border-y border-black/5">
                                            <div className="text-center">
                                                <span className="block text-[8px] font-black opacity-30 uppercase tracking-[0.2em] mb-1">HAZIRLIK</span>
                                                <span className="text-xs font-black uppercase">15 DK</span>
                                            </div>
                                            <div className="text-center border-x border-black/5">
                                                <span className="block text-[8px] font-black opacity-30 uppercase tracking-[0.2em] mb-1">KALORİ</span>
                                                <span className="text-xs font-black uppercase">420 KCAL</span>
                                            </div>
                                            <div className="text-center">
                                                <span className="block text-[8px] font-black opacity-30 uppercase tracking-[0.2em] mb-1">PORSİYON</span>
                                                <span className="text-xs font-black uppercase">DOYURUCU</span>
                                            </div>
                                        </div>

                                        {isOpen ? (
                                            <button 
                                                onClick={() => {
                                                    addToCart(selectedProduct);
                                                    setSelectedProduct(null);
                                                }}
                                                className="w-full mt-2 group bg-primary text-white p-6 rounded-[32px] shadow-2xl flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-95 ring-4 ring-white/10"
                                                style={{ backgroundColor: primaryColor }}
                                            >
                                                <ShoppingBag size={24} />
                                                <span className="text-base font-black uppercase tracking-widest">SEPETE EKLE</span>
                                            </button>
                                        ) : (
                                            <div className="w-full mt-2 bg-slate-200 dark:bg-slate-800 text-slate-400 p-6 rounded-[32px] flex items-center justify-center gap-4">
                                                <Moon size={24} />
                                                <span className="text-base font-black uppercase tracking-widest">ŞU AN KAPALIYIZ</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* About Modal */}
                <AnimatePresence>
                    {showAbout && (
                        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAbout(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                            <motion.div 
                                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                                className={`relative w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] overflow-hidden ${settings.dark_mode_enabled ? 'bg-slate-900 border-t border-white/10' : 'bg-white shadow-2xl'}`}
                            >
                                <div className="p-8 sm:p-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <h2 className={`text-2xl sm:text-3xl font-black uppercase tracking-tighter ${settings.dark_mode_enabled ? 'text-white' : 'text-slate-900'}`}>Bilgiler</h2>
                                        <button onClick={() => setShowAbout(false)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 active:scale-90 transition-all shadow-sm">
                                            <X size={28} />
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Working Hours List */}
                                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] border border-slate-100 dark:border-white/5">
                                            <div className="flex items-center gap-3 mb-4 text-primary" style={{ color: primaryColor }}>
                                                <Clock size={20} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Çalışma Saatleri</span>
                                            </div>
                                            <div className="space-y-2">
                                                {settings.working_hours && Object.entries(settings.working_hours).map(([day, hours]: [string, any]) => (
                                                    <div key={day} className="flex items-center justify-between">
                                                        <span className="text-xs font-bold uppercase opacity-60">
                                                            {day === 'monday' ? 'Pazartesi' : day === 'tuesday' ? 'Salı' : day === 'wednesday' ? 'Çarşamba' : day === 'thursday' ? 'Perşembe' : day === 'friday' ? 'Cuma' : day === 'saturday' ? 'Cumartesi' : 'Pazar'}
                                                        </span>
                                                        <span className="text-xs font-black uppercase">
                                                            {hours.active ? `${hours.open} - ${hours.close}` : 'Kapalı'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] border border-slate-100 dark:border-white/5">
                                            <p className={`text-xs sm:text-sm font-medium leading-relaxed italic text-center ${settings.dark_mode_enabled ? 'opacity-80 text-white' : 'text-slate-600'}`}>
                                                "{settings.about_text || "Restoranımız, taze malzemeler ve ustalıkla hazırlanan lezzetleriyle siz değerli misafirlerimize unutulmaz bir deneyim sunmayı amaçlar."}"
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all">
                                                <div className="w-10 h-10 flex items-center justify-center bg-blue-500/10 text-blue-500 rounded-xl shadow-sm">
                                                    <MapPin size={20} />
                                                </div>
                                                <div>
                                                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">LOKASYON</span>
                                                    <span className={`text-xs font-bold leading-tight ${settings.dark_mode_enabled ? 'text-white' : 'text-slate-800'}`}>{settings.tenants?.address || "Merkez Şube"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Bottom Floating Bar */}
                {cart.length > 0 && isOpen && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-50">
                        <button 
                            onClick={() => setShowCart(true)}
                            className="w-full group bg-primary text-white p-5 rounded-[32px] shadow-2xl flex items-center justify-between transition-all hover:scale-[1.02] active:scale-95 ring-4 ring-white/10"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner">
                                    <ShoppingBag size={28} />
                                </div>
                                <div className="text-left">
                                    <span className="block text-[10px] font-black uppercase tracking-widest opacity-80">SEPET BİLGİLERİ</span>
                                    <span className="text-lg font-black leading-none">{cart.reduce((acc: number, i) => acc + i.quantity, 0)} ÜRÜN</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-5">
                                <span className="text-xl font-black">
                                    {cart.reduce((acc: number, i) => acc + (i.sale_price * i.quantity), 0).toFixed(2)} ₺
                                </span>
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:text-primary transition-all">
                                    <ArrowRight className="w-6 h-6" />
                                </div>
                            </div>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
