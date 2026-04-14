"use client";

import { useState, useEffect } from "react";
import { 
    Utensils, Instagram, ArrowRight, ArrowLeft, Search, Menu, X, 
    ShoppingCart, Star, Clock, Phone, MapPin, Instagram as InstagramIcon 
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { supabase } from "@/lib/supabase";

import React from "react";

export default function PublicShowcaseClient({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = React.use(params);
    const [settings, setSettings] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState<any[]>([]);
    const [showCart, setShowCart] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState<"home" | "about">("home");
    const [scrolled, setScrolled] = useState(false);

    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (slug) {
            fetchShowcaseData();
        }
    }, [slug]);

    const fetchShowcaseData = async () => {
        try {
            const { data: settingsData, error: sError } = await supabase
                .from('qr_menu_settings')
                .select('*, tenants!inner(*)')
                .eq('slug', slug)
                .single();

            if (sError) throw sError;
            setSettings(settingsData);

            if (!settingsData.is_showcase_active) {
                setLoading(false);
                return;
            }

            const { data: catData, error: cError } = await supabase
                .from('categories')
                .select('*')
                .eq('tenant_id', settingsData.tenant_id);

            if (cError) throw cError;
            setCategories(catData || []);

            const { data: prodData, error: pError } = await supabase
                .from('products')
                .select('*')
                .eq('tenant_id', settingsData.tenant_id)
                .eq('status', 'active');
            
            if (pError) throw pError;
            setProducts(prodData || []);

        } catch (error) {
            console.error("Showcase fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        setShowCart(true);
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.sale_price * item.quantity), 0);

    const handleCheckout = () => {
        const message = `*Yeni Sipariş (%s)*%0A%0A`.replace('%s', settings.tenants?.company_name || '');
        const items = cart.map(item => `- ${item.quantity}x ${item.name} (${(item.sale_price * item.quantity).toFixed(2)} ₺)`).join('%0A');
        const footer = `%0A%0A*Toplam: ${cartTotal.toFixed(2)} ₺*`;
        const whatsappUrl = `https://wa.me/${settings.tenants?.phone?.replace(/\D/g, '')}?text=${message}${items}${footer}`;
        window.open(whatsappUrl, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!settings || !settings.is_showcase_active) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6">
                    <X size={40} className="text-slate-700" />
                </div>
                <h1 className="text-2xl font-black text-white uppercase tracking-tight">Vitrin Bulunamadı</h1>
                <p className="text-slate-500 mt-2">Bu vitrin şu an yayında değil veya adres yanlış.</p>
            </div>
        );
    }

    const primaryColor = settings.primary_color || "#3b82f6";
    const bgColor = settings.secondary_color || "#0f172a";

    const filteredProducts = products.filter(p => {
        const matchesCategory = activeCategory === "all" || p.category_id === activeCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const isSelected = settings.showcase_use_automatic_products || (settings.showcase_selected_product_ids || []).includes(p.id);
        return matchesCategory && matchesSearch && isSelected;
    });

    const showcaseLinks = settings.showcase_navbar_links || [
        {label: "Anasayfa", href: "#home"}, 
        {label: "Ürünler", href: "#products"}, 
        {label: "Hakkımızda", href: "#about"}
    ];

    return (
        <div 
            className="min-h-screen text-white selection:bg-primary/30 selection:text-white transition-colors duration-700 overflow-x-hidden"
            style={{ 
                fontFamily: settings.showcase_primary_font || 'Inter',
                backgroundColor: bgColor,
                ['--primary' as any]: primaryColor
            }}
        >
            <style jsx global>{`
                :root { --primary: ${primaryColor}; }
                .scrollbar-none::-webkit-scrollbar { display: none; }
                .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
                @keyframes marquee-showcase { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                .animate-marquee-showcase { display: flex; animation: marquee-showcase linear infinite; width: max-content; }
            `}</style>

            {/* Navbar */}
            <nav className={`fixed top-0 inset-x-0 z-[100] transition-all duration-500 border-b ${scrolled ? 'backdrop-blur-2xl border-white/10 py-4 shadow-2xl' : 'bg-transparent border-transparent py-8'}`} style={{ backgroundColor: scrolled ? `${bgColor}dd` : 'transparent' }}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 cursor-pointer" onClick={() => setPage("home")}>
                        <div className="w-12 h-12 bg-white flex items-center justify-center rounded-2xl shadow-xl" style={{ backgroundColor: primaryColor }}><Utensils className="text-white" size={24} /></div>
                        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white">{settings.tenants?.company_name || "JetPOS"}</h1>
                    </motion.div>

                    <div className="hidden lg:flex items-center gap-10">
                        {showcaseLinks.map((link: any, i: number) => (
                            <button 
                                key={i} 
                                onClick={() => {
                                    if (link.href === "#about") setPage("about");
                                    else {
                                        setPage("home");
                                        if (link.href.startsWith("#") && link.href !== "#home") {
                                            setTimeout(() => document.getElementById(link.href.replace("#", ""))?.scrollIntoView({ behavior: "smooth" }), 100);
                                        } else window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }
                                }}
                                className={`text-[10px] font-black uppercase tracking-widest transition-colors relative group ${page === (link.href === "#about" ? "about" : "home") ? "text-white" : "text-slate-400 hover:text-white"}`}
                            >
                                {link.label}
                                <span className={`absolute -bottom-1 left-0 h-0.5 bg-indigo-500 transition-all ${page === (link.href === "#about" ? "about" : "home") ? "w-full" : "w-0 group-hover:w-full"}`} />
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setShowCart(true)}
                            className="relative p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all"
                        >
                            <ShoppingCart size={18} />
                            {cart.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-slate-950">
                                    {cart.reduce((a, b) => a + b.quantity, 0)}
                                </span>
                            )}
                        </button>
                        <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all"><InstagramIcon size={18} /></button>
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-3 bg-white/5 text-white rounded-2xl border border-white/10 transition-all"><Menu size={24} /></button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, x: "100%" }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: "100%" }}
                        className="fixed inset-0 z-[150] bg-slate-950 p-8 lg:hidden flex flex-col"
                    >
                        <div className="flex justify-between items-center mb-12">
                            <h2 className="text-2xl font-black uppercase tracking-tighter">MENÜ</h2>
                            <button onClick={() => setIsMenuOpen(false)} className="p-3 bg-white/10 rounded-2xl"><X size={24} /></button>
                        </div>
                        <div className="flex flex-col gap-8">
                            {showcaseLinks.map((link: any, i: number) => (
                                <button 
                                    key={i} 
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        if (link.href === "#about") setPage("about");
                                        else {
                                            setPage("home");
                                            setTimeout(() => document.getElementById(link.href.replace("#", ""))?.scrollIntoView({ behavior: "smooth" }), 100);
                                        }
                                    }}
                                    className="text-4xl font-black uppercase tracking-tighter text-left hover:text-indigo-500 transition-colors"
                                >
                                    {link.label}
                                </button>
                            ))}
                        </div>
                        <div className="mt-auto pt-10 border-t border-white/10 flex flex-col gap-4">
                             <div className="flex items-center gap-3 text-slate-400">
                                <Phone size={18} className="text-indigo-500" />
                                <span className="font-bold">{settings.tenants?.phone || "İletişim yok"}</span>
                             </div>
                             <div className="flex items-center gap-3 text-slate-400">
                                <MapPin size={18} className="text-indigo-500" />
                                <span className="text-xs line-clamp-1">{settings.tenants?.address || "Adres yok"}</span>
                             </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cart Drawer */}
            <AnimatePresence>
                {showCart && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCart(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]" 
                        />
                        <motion.div 
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 z-[201] shadow-2xl flex flex-col"
                        >
                            <div className="p-8 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <ShoppingCart size={24} className="text-indigo-500" />
                                    <h2 className="text-xl font-black uppercase tracking-tighter text-white">SEPETİM</h2>
                                </div>
                                <button onClick={() => setShowCart(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors"><X size={24} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                        <ShoppingCart size={64} className="mb-4" />
                                        <p className="font-black uppercase tracking-widest text-xs">Sepetiniz Boş</p>
                                    </div>
                                ) : (
                                    cart.map(item => (
                                        <div key={item.id} className="flex gap-4 group">
                                            <div className="w-20 h-20 bg-slate-800 rounded-2xl overflow-hidden shrink-0">
                                                {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Utensils size={24} className="opacity-10" /></div>}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div className="flex justify-between">
                                                    <h4 className="font-black uppercase tracking-tight text-sm">{item.name}</h4>
                                                    <button onClick={() => removeFromCart(item.id)} className="text-slate-500 hover:text-red-500 transition-colors"><X size={14} /></button>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3 bg-white/5 rounded-lg px-2 py-1">
                                                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-indigo-500 transition-colors"><ArrowLeft size={12} /></button>
                                                        <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                                                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-indigo-500 transition-colors"><ArrowRight size={12} /></button>
                                                    </div>
                                                    <span className="font-black text-indigo-400">{(item.sale_price * item.quantity).toFixed(2)} ₺</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {cart.length > 0 && (
                                <div className="p-8 bg-slate-950 border-t border-white/5 space-y-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Toplam Tutar</span>
                                        <span className="text-2xl font-black text-white">{cartTotal.toFixed(2)} ₺</span>
                                    </div>
                                    <button 
                                        onClick={handleCheckout}
                                        className="w-full py-5 bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 overflow-hidden group"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                        <span className="relative z-10 flex items-center gap-2">WhatsApp ile Sipariş Ver <ArrowRight size={16} /></span>
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>


            <AnimatePresence mode="wait">
                {page === "home" ? (
                    <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                        <section id="home" className="relative min-h-screen flex items-center px-6 overflow-hidden pt-20">
                            <motion.div style={{ y: y1 }} className="absolute inset-0 z-0">
                                {settings.showcase_hero_image_url ? (
                                    <img src={settings.showcase_hero_image_url} className="w-full h-[120%] object-cover opacity-30 grayscale" alt="Hero" />
                                ) : (
                                    <div className="w-full h-full bg-slate-950 flex items-center justify-center opacity-10"><Utensils size={300} /></div>
                                )}
                                <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(to bottom, transparent, ${bgColor})` }} />
                            </motion.div>

                            <div className="relative z-10 max-w-7xl mx-auto text-center w-full">
                                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                                    <h1 className="text-6xl sm:text-9xl font-black uppercase tracking-tighter leading-none mb-8">{settings.showcase_hero_title || settings.tenants?.company_name}</h1>
                                    <p className="max-w-2xl mx-auto text-lg text-slate-300 font-medium mb-12">{settings.showcase_hero_subtitle}</p>
                                    <button onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })} className="px-12 py-6 bg-white text-black rounded-full font-black uppercase tracking-widest text-sm shadow-2xl hover:scale-105 transition-all">MENÜYÜ İNCELE</button>
                                </motion.div>
                            </div>
                        </section>

                        {settings.marquee_text && (
                            <div className="py-8 bg-white/5 border-y border-white/5 overflow-hidden backdrop-blur-3xl relative z-10">
                                <div className="animate-marquee-showcase" style={{ animationDuration: `${settings.marquee_speed || 25}s` }}>
                                    {Array.from({ length: 15 }).map((_, i) => (
                                        <div key={i} className="flex items-center gap-10 px-8">
                                            <span className="text-4xl sm:text-7xl font-black uppercase tracking-tighter text-white/10">{settings.marquee_text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <section id="products" className="py-32 px-6">
                            <div className="max-w-7xl mx-auto space-y-20">
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                                    <div className="space-y-4">
                                        <div className="w-12 h-1 rounded-full" style={{ backgroundColor: primaryColor }} />
                                        <h2 className="text-5xl sm:text-7xl font-black uppercase tracking-tighter">MENÜMÜZ</h2>
                                    </div>
                                    <div className="relative w-full max-w-md">
                                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input type="text" placeholder="Ürün ara..." value={searchQuery || ""} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-3xl pl-16 pr-8 py-5 text-white font-bold outline-none focus:border-primary/50 transition-all font-sans" />
                                    </div>
                                </div>

                                <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-none relative">
                                    <button 
                                        onClick={() => setActiveCategory("all")} 
                                        className={`relative px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === "all" ? 'text-white' : 'text-slate-500 hover:text-white'}`}
                                    >
                                        {activeCategory === "all" && <motion.div layoutId="cat-pill" className="absolute inset-0 bg-primary rounded-2xl -z-10 shadow-xl shadow-primary/20" />}
                                        TÜMÜ
                                    </button>
                                    {categories.map(cat => (
                                        <button 
                                            key={cat.id} 
                                            onClick={() => setActiveCategory(cat.id)} 
                                            className={`relative px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat.id ? 'text-white' : 'text-slate-500 hover:text-white'}`}
                                        >
                                            {activeCategory === cat.id && <motion.div layoutId="cat-pill" className="absolute inset-0 bg-primary rounded-2xl -z-10 shadow-xl shadow-primary/20" />}
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>

                                <motion.div 
                                    layout
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                                >
                                    <AnimatePresence mode="popLayout">
                                        {filteredProducts.map((prod, i) => (
                                            <motion.div 
                                                key={prod.id} 
                                                layout
                                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                                transition={{ duration: 0.4, delay: i * 0.05 }}
                                                className="group space-y-6"
                                            >
                                                <div className="aspect-[4/5] bg-white/5 rounded-[40px] border border-white/5 overflow-hidden relative shadow-2xl group-hover:scale-[1.02] transition-transform duration-500">
                                                    {prod.image_url ? (
                                                        <img src={prod.image_url} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-white/5"><Utensils size={80} /></div>
                                                    )}
                                                    <div className="absolute top-6 right-6 px-4 py-2 bg-indigo-500 rounded-full text-[10px] font-black tracking-widest uppercase shadow-xl" style={{ backgroundColor: primaryColor }}>{prod.sale_price} ₺</div>
                                                    
                                                    {/* Add to Cart Overlay */}
                                                    <div className="absolute inset-0 bg-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                        <button 
                                                            onClick={() => addToCart(prod)}
                                                            className="w-14 h-14 bg-white text-slate-950 rounded-2xl flex items-center justify-center shadow-2xl scale-50 group-hover:scale-100 transition-transform duration-500 hover:bg-indigo-500 hover:text-white"
                                                        >
                                                            <ShoppingCart size={24} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 px-4">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="text-lg font-black uppercase tracking-tight text-white/90">{prod.name}</h4>
                                                        {prod.is_recommended && <Star size={14} className="text-yellow-500 fill-yellow-500" />}
                                                    </div>
                                                    <p className="text-sm text-slate-500 line-clamp-2">{prod.description || "Benzersiz lezzetlerin buluşma noktası."}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </motion.div>
                            </div>
                        </section>
                    </motion.div>
                ) : (
                    <motion.div key="about" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="pt-48 pb-32">
                        <section className="max-w-7xl mx-auto px-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
                                <div className="space-y-12">
                                    <div className="space-y-6">
                                        <div className="w-16 h-1 rounded-full" style={{ backgroundColor: primaryColor }} />
                                        <h1 className="text-6xl sm:text-8xl font-black uppercase tracking-tighter leading-none">{settings.showcase_about_title || "BİZ KİMİZ?"}</h1>
                                    </div>
                                    <p className="text-xl text-slate-400 leading-relaxed whitespace-pre-wrap font-medium">
                                        {settings.showcase_about_content || "Yakında burada."}
                                    </p>
                                    <button onClick={() => setPage("home")} className="px-10 py-5 rounded-[24px] text-[11px] font-black uppercase tracking-widest bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-4">
                                        <ArrowLeft size={16} /> ANA SAYFAYA DÖN
                                    </button>
                                </div>
                                <div className="aspect-[3/4] rounded-[60px] overflow-hidden border border-white/5 bg-white/10 shadow-2xl flex items-center justify-center">
                                    {settings.showcase_about_image_url ? (
                                        <img src={settings.showcase_about_image_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <Utensils size={180} className="opacity-5" />
                                    )}
                                </div>
                            </div>
                        </section>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer */}
            <footer className="py-20 px-6 border-t border-white/5 bg-slate-950/50 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-12">
                     <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white flex items-center justify-center rounded-[24px]" style={{ backgroundColor: primaryColor }}><Utensils className="text-white" size={32} /></div>
                        <h2 className="text-4xl font-black uppercase tracking-tighter text-white">{settings.tenants?.company_name || "JetPOS"}</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full text-sm font-medium">
                        <div className="space-y-4">
                            <h4 className="text-slate-500 font-black uppercase tracking-widest text-[10px]">İletişim</h4>
                            <p className="text-white">{settings.tenants?.phone}</p>
                            <p className="text-slate-500 whitespace-pre-wrap">{settings.tenants?.address}</p>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Hızlı Menü</h4>
                            <div className="flex flex-col gap-2">
                                {showcaseLinks.map((link: any, i: number) => (
                                    <button key={i} onClick={() => setPage(link.href === "#about" ? "about" : "home")} className="text-white hover:text-indigo-500 transition-colors uppercase tracking-tight">{link.label}</button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Sosyal Medya</h4>
                            <div className="flex justify-center gap-4">
                                <button className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all border border-white/10"><InstagramIcon size={20} /></button>
                                <button className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all border border-white/10 font-black text-xs">FB</button>
                                <button className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all border border-white/10 font-black text-xs">X</button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-20 border-t border-white/5 w-full flex flex-col md:flex-row justify-between items-center gap-6 opacity-30 grayscale contrast-150">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">© 2026 {settings.tenants?.company_name}. Tüm hakları saklıdır.</p>
                        <div className="flex items-center gap-2">
                             <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center font-black text-[10px] text-white">J</div>
                             <span className="text-[9px] font-black tracking-tighter text-white">POWERED BY JETPOS</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
