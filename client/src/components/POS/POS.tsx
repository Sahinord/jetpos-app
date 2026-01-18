"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import {
    Search, ShoppingCart, Trash2, CreditCard, Banknote,
    Plus, Minus, Printer, Pause, Play, Delete,
    ChevronLeft, ChevronRight, Hash, BadgePercent,
    Calculator, MousePointer2, User, Clock, Monitor, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PrintReceiptButton } from "./Receipt";

export default function POS({
    products = [],
    categories = [],
    onCheckout,
    showToast,
    campaignRate = 1.15,
    theme = 'modern',
    setTheme,
    isBeepEnabled = true,
    setActiveTab
}: any) {
    // Audio Utility for "Beep"
    const playBeep = () => {
        if (!isBeepEnabled) return; // Respect global sound setting
        try {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gain = context.createGain();

            // Real cashier scanner tone is usually around 2500Hz - 3000Hz
            oscillator.type = 'triangle'; // Gives it that clean digital retail feel
            oscillator.frequency.setValueAtTime(2800, context.currentTime);

            oscillator.connect(gain);
            gain.connect(context.destination);

            // Very fast attack and decay for a crisp "clicky" beep
            gain.gain.setValueAtTime(0, context.currentTime);
            gain.gain.linearRampToValueAtTime(0.15, context.currentTime + 0.005);
            gain.gain.linearRampToValueAtTime(0.1, context.currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.08);

            oscillator.start();
            oscillator.stop(context.currentTime + 0.08);

            // Auto close context to save resources
            setTimeout(() => context.close(), 200);
        } catch (e) {
            console.error("Audio error:", e);
        }
    };

    // Core Sales State
    const [cart, setCart] = useState<any[]>([]);
    const [suspendedSales, setSuspendedSales] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [discount, setDiscount] = useState(0);
    const [lastTransaction, setLastTransaction] = useState<any>(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);

    // UI States
    const [numpadValue, setNumpadValue] = useState("");
    const [activeInput, setActiveInput] = useState<"quantity" | "discount" | "price">("quantity");
    const [weightModalProduct, setWeightModalProduct] = useState<any>(null);
    const [weightInput, setWeightInput] = useState("");
    const [currentTime, setCurrentTime] = useState(new Date());

    const [isPriceCheckMode, setIsPriceCheckMode] = useState(false);
    const [priceCheckProduct, setPriceCheckProduct] = useState<any>(null);

    // Performance Optimization: Visible products limit
    const [displayLimit, setDisplayLimit] = useState(24);
    const sentinelRef = useRef<HTMLDivElement>(null);

    // Reset limit on search/category change
    useEffect(() => {
        setDisplayLimit(24);
    }, [search, selectedCategory]);

    // Intersection Observer for Infinite Scroll
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setDisplayLimit(prev => prev + 24);
            }
        }, { threshold: 0.1 });

        if (sentinelRef.current) {
            observer.observe(sentinelRef.current);
        }

        return () => observer.disconnect();
    }, [search, selectedCategory]);

    // Barcode Auto-Add Logic disabled as per user request (User prefers manual add)
    /*
    useEffect(() => {
        if (search.length >= 3) {
            const exactMatch = products.find((p: any) => p.barcode === search);
            if (exactMatch) {
                addToCart(exactMatch);
                setSearch("");
                showToast(`${exactMatch.name} eklendi`, "success");
            }
        }
    }, [search]);
    */


    // Theme styles mapping
    const themeStyles: any = {
        modern: {
            bg: 'bg-background',
            card: 'bg-card/40 border-border/40',
            button: 'bg-white/5 border-white/5 text-white hover:bg-primary',
            accent: 'text-primary',
            numpadBg: 'bg-[#0f172a] border-primary/20',
            paymentNakit: 'bg-emerald-500 hover:bg-emerald-600',
            paymentKart: 'bg-blue-500 hover:bg-blue-600'
        },
        wood: {
            bg: 'bg-[#4a3728]',
            card: 'bg-[#d2b48c] border-[#8b4513] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]',
            button: 'bg-gradient-to-b from-[#deb887] to-[#8b4513] border-[#5d2e0a] text-white font-serif shadow-lg',
            accent: 'text-[#ffd700]',
            numpadBg: 'bg-[#2d1e12] border-[#8b4513]',
            paymentNakit: 'bg-[#228b22] hover:bg-[#006400] border-[#004d00]',
            paymentKart: 'bg-[#cd853f] hover:bg-[#a0522d] border-[#8b4513]'
        },
        glass: {
            bg: 'bg-[#e0f2f1]',
            card: 'bg-white/60 backdrop-blur-xl border-white/40 shadow-xl',
            button: 'bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-none text-white shadow-[0_4px_15px_rgba(0,0,0,0.1)] hover:scale-105',
            accent: 'text-blue-600',
            numpadBg: 'bg-white/80 border-blue-200 shadow-inner',
            paymentNakit: 'bg-[#ff1744] hover:bg-[#d50000] rounded-full shadow-lg',
            paymentKart: 'bg-[#00e5ff] hover:bg-[#00b8d4] rounded-full shadow-lg text-slate-800'
        }
    };

    const s = themeStyles[theme];

    // Update Clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Filtered Products - Improved search and category handling
    const filteredProducts = useMemo(() => {
        if (search) {
            const lowSearch = search.toLocaleLowerCase('tr-TR');

            // 1. Exact Barcode Match (Best Case)
            // 1. Exact Barcode Match (Best Case)
            const exactMatch = products.find((p: any) => p.barcode?.toLocaleLowerCase('tr-TR') === lowSearch);
            if (exactMatch) return [exactMatch];

            // 2. Filter by Name Includes OR Barcode Includes
            const matches = products.filter((p: any) => {
                const nameMatch = p.name?.toLocaleLowerCase('tr-TR').includes(lowSearch);
                const barcodeMatch = p.barcode?.toLocaleLowerCase('tr-TR').includes(lowSearch);
                return nameMatch || barcodeMatch;
            });

            // 3. Sort by Relevance
            return matches.sort((a: any, b: any) => {
                const aName = a.name?.toLocaleLowerCase('tr-TR') || "";
                const bName = b.name?.toLocaleLowerCase('tr-TR') || "";

                // Priority: Starts with > Layout inside
                const aStarts = aName.startsWith(lowSearch);
                const bStarts = bName.startsWith(lowSearch);

                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;

                return aName.localeCompare(bName);
            });
        }

        if (selectedCategory !== "all") {
            return products.filter((p: any) => p.category_id === selectedCategory);
        }

        return products;
    }, [products, selectedCategory, search]);

    // Cart Calculations
    const subtotal = cart.reduce((sum, item) => sum + (item.sale_price * item.quantity), 0);
    const total = Math.max(0, subtotal - discount);

    const addToCart = (product: any, manualQty?: number) => {
        if (isPriceCheckMode) {
            setPriceCheckProduct(product);
            setIsPriceCheckMode(false);
            setSearch("");
            return;
        }

        const isKG = product.unit?.toLowerCase() === 'kg';
        if (isKG && !manualQty) {
            setWeightModalProduct(product);
            setWeightInput("");
            return;
        }

        const qtyToAdd = manualQty || 1;
        const existing = cart.find(item => item.id === product.id);
        const adjustedPrice = product.is_campaign ? parseFloat((product.sale_price * campaignRate).toFixed(2)) : product.sale_price;

        if (existing) {
            setCart(cart.map(item =>
                item.id === product.id ? { ...item, quantity: item.quantity + qtyToAdd } : item
            ));
        } else {
            setCart([...cart, { ...product, sale_price: adjustedPrice, quantity: qtyToAdd }]);
        }
        playBeep();
        setNumpadValue("");
    };

    const handleWeightSubmit = () => {
        const grams = parseFloat(weightInput.replace(',', '.'));
        if (isNaN(grams) || grams <= 0) return showToast("Geçerli gramaj girin!", "error");
        addToCart(weightModalProduct, grams / 1000);
        setWeightModalProduct(null);
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const newQty = Math.max(0.001, item.quantity + delta);
                return { ...item, quantity: parseFloat(newQty.toFixed(3)) };
            }
            return item;
        }));
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
        playBeep();
    };

    const applyNumpadAction = () => {
        const val = parseFloat(numpadValue.replace(',', '.'));
        if (isNaN(val)) return;

        if (activeInput === "discount") {
            setDiscount(val);
        } else if (activeInput === "quantity" && cart.length > 0) {
            const lastItem = cart[cart.length - 1];
            setCart(cart.map((item, idx) =>
                idx === cart.length - 1 ? { ...item, quantity: val } : item
            ));
        }
        setNumpadValue("");
    };

    const [showSuspendedModal, setShowSuspendedModal] = useState(false);

    const suspendSale = () => {
        if (cart.length === 0) return;
        setSuspendedSales([...suspendedSales, { id: Date.now(), cart, discount, time: new Date() }]);
        setCart([]);
        setDiscount(0);
        showToast("Satış askıya alındı");
    };

    const recallSale = (suspended: any) => {
        setCart(suspended.cart);
        setDiscount(suspended.discount);
        setSuspendedSales(suspendedSales.filter(s => s.id !== suspended.id));
        setShowSuspendedModal(false);
    };

    const handleCheckout = (method: string) => {
        if (cart.length === 0) return;
        const saleId = Math.random().toString(36).substr(2, 9).toUpperCase();

        const receivedAmount = parseFloat(numpadValue.replace(',', '.')) || 0;
        const changeAmount = Math.max(0, receivedAmount - total);

        onCheckout(cart, method);
        setLastTransaction({
            items: [...cart],
            total,
            method,
            date: new Date(),
            saleId,
            receivedAmount: method === 'NAKİT' ? receivedAmount : 0,
            changeAmount: method === 'NAKİT' ? changeAmount : 0
        });
        setShowReceiptModal(true);
        setCart([]);
        setDiscount(0);
        setNumpadValue(""); // Clear numpad after checkout
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] gap-4 select-none">
            {/* Top Info Bar */}
            <div className="flex items-center justify-between bg-card/40 border border-border p-3 rounded-2xl backdrop-blur-md">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 text-xs font-bold">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        SİSTEM ÇEVRİMİÇİ
                    </div>
                    <div className="flex items-center gap-2 text-secondary text-xs font-bold uppercase tracking-widest">
                        <Monitor size={14} className="text-primary" />
                        TERMİNAL #01
                    </div>
                    <div className="flex items-center gap-2 text-secondary text-xs font-bold uppercase tracking-widest">
                        <User size={14} className="text-primary" />
                        KASİYER: GENEL MÜDÜR
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setActiveTab("settings")}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-secondary hover:text-white transition-all flex items-center gap-2 text-xs font-bold"
                    >
                        <Calculator size={14} /> GÖRÜNÜM AYARLARI
                    </button>
                    <div className="flex items-center gap-4 text-secondary font-black text-sm">
                        <span className="bg-white/5 px-4 py-1.5 rounded-xl border border-white/5">
                            {currentTime.toLocaleDateString('tr-TR')}
                        </span>
                        <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-xl border border-primary/20">
                            {currentTime.toLocaleTimeString('tr-TR')}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex gap-4 min-h-0">
                {/* LEFT: Cart and Totals - Compact version */}
                <div className="w-full lg:w-[35%] flex flex-col gap-4">
                    <div className="flex-1 glass-card !p-0 overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-border bg-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ShoppingCart size={18} className="text-primary" />
                                <h3 className="font-black text-sm uppercase tracking-widest">SATIŞ LİSTESİ</h3>
                            </div>
                            <button onClick={() => setCart([])} className="text-xs font-bold text-rose-500 hover:bg-rose-500/10 px-3 py-1 rounded-lg transition-all">
                                TEMİZLE
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-[#1e293b] z-10 text-[10px] font-black text-secondary uppercase tracking-widest border-b border-border">
                                    <tr>
                                        <th className="p-4 w-12 text-center">#</th>
                                        <th className="p-4">ÜRÜN / BARKOD</th>
                                        <th className="p-4 text-center">MİKTAR</th>
                                        <th className="p-4 text-right">FİYAT</th>
                                        <th className="p-4 text-right">TOPLAM</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    <AnimatePresence initial={false}>
                                        {cart.map((item, index) => (
                                            <motion.tr
                                                key={item.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                className="group hover:bg-white/5 transition-colors"
                                            >
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="p-2 text-secondary hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-bold text-sm text-white leading-tight break-words max-w-[250px]">{item.name}</div>
                                                    <div className="text-[10px] text-secondary font-medium tracking-wider">{item.barcode}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-rose-500 transition-colors"><Minus size={14} /></button>
                                                        <span className="font-black text-primary text-sm min-w-[40px] text-center">
                                                            {item.unit === 'kg' ? item.quantity.toFixed(3) : item.quantity}
                                                        </span>
                                                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-emerald-500 transition-colors"><Plus size={14} /></button>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right font-bold text-xs text-secondary">₺{item.sale_price.toFixed(2)}</td>
                                                <td className="p-4 text-right font-black text-sm text-white">₺{(item.sale_price * item.quantity).toFixed(2)}</td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                            {cart.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-secondary opacity-20 p-20">
                                    <ShoppingCart size={80} strokeWidth={1} />
                                    <p className="mt-4 font-black uppercase tracking-[4px]">SEPET BOŞ</p>
                                </div>
                            )}
                        </div>

                        {/* Totals Section */}
                        <div className="p-6 bg-primary/5 border-t border-primary/20 space-y-4">
                            <div className="grid grid-cols-2 gap-x-12 gap-y-2">
                                <div className="flex justify-between items-center text-secondary">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Ara Toplam</span>
                                    <span className="font-bold">₺{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-rose-400">
                                    <span className="text-[10px] font-black uppercase tracking-widest">İndirim</span>
                                    <span className="font-bold">- ₺{discount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-secondary">
                                    <span className="text-[10px] font-black uppercase tracking-widest">KDV Dahil</span>
                                    <span className="font-bold">₺{(total * 0.1).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-secondary border-t border-white/5 pt-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Ödenen (Nakit)</span>
                                    <span className="font-bold">₺{parseFloat(numpadValue.replace(',', '.')) || 0}</span>
                                </div>
                                <div className="flex justify-between items-center text-primary font-black">
                                    <span className="text-[10px] uppercase tracking-widest">Para Üstü</span>
                                    <span className="text-xl">₺{Math.max(0, (parseFloat(numpadValue.replace(',', '.')) || 0) - total).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-emerald-400 border-t border-primary/20 pt-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Genel Toplam</span>
                                    <span className="text-3xl font-black">₺{total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Grid & Actions */}
                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                    {/* Categories & Search */}
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Ürün ara veya barkod okut..."
                                className="w-full bg-card/60 border border-border rounded-2xl py-4 pl-12 pr-4 focus:border-primary/50 outline-none font-bold placeholder:text-secondary/50 transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar max-w-[400px]">
                            {categories.map((cat: any) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? "all" : cat.id)}
                                    className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all border ${selectedCategory === cat.id ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-card/40 border-border text-secondary hover:border-primary/30'}`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 flex gap-4 min-h-0">
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
                                {filteredProducts.slice(0, displayLimit).map((p: any) => (
                                    <button
                                        key={p.id}
                                        onClick={() => addToCart(p)}
                                        className={`group ${s.card} hover:border-primary/50 text-left flex flex-col justify-between overflow-hidden h-[160px] rounded-2xl transition-all active:scale-95 relative`}
                                    >
                                        {/* Product Image Background / Placeholder */}
                                        {p.image_url ? (
                                            <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity flex items-center justify-center">
                                                <ShoppingCart size={100} />
                                            </div>
                                        )}

                                        <div className="p-4 relative z-10 h-full flex flex-col justify-between">
                                            <div>
                                                <div className={`text-[9px] font-black ${theme === 'modern' ? 'text-primary' : 'text-slate-600'} uppercase tracking-[2px] mb-1 opacity-60 truncate`}>{p.categories?.name || 'GENEL'}</div>
                                                <div className={`font-bold text-sm ${theme === 'modern' ? 'text-secondary' : 'text-slate-800'} group-hover:text-white line-clamp-2 leading-tight transition-colors`}>{p.name}</div>
                                            </div>

                                            <div className="flex items-end justify-between">
                                                <div className="space-y-0.5">
                                                    <div className={`text-xs font-bold ${theme === 'modern' ? 'text-secondary/40' : 'text-slate-400'} line-through`}>₺{(p.sale_price * 1.2).toFixed(2)}</div>
                                                    <div className={`text-xl font-black ${theme === 'glass' ? 'text-blue-600' : 'text-emerald-400'} tracking-tighter`}>₺{p.sale_price}</div>
                                                </div>
                                                <div className={`w-9 h-9 rounded-xl ${theme === 'glass' ? 'bg-blue-500' : 'bg-primary/10'} flex items-center justify-center ${theme === 'glass' ? 'text-white' : 'text-primary'} group-hover:bg-primary group-hover:text-white transition-all shadow-lg`}>
                                                    <Plus size={20} />
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}

                                {/* Sentinel element for infinite scroll */}
                                <div ref={sentinelRef} className="col-span-full h-10 flex items-center justify-center text-secondary/20 font-black text-[10px] tracking-[4px] uppercase py-10">
                                    {filteredProducts.length > displayLimit ? "Ürünler Yükleniyor..." : "Listenin Sonu"}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Grid & Actions - Ergonomic Layout */}
                        <div className="w-[340px] flex flex-col gap-4">
                            {/* NEW: Numpad Display - Sleek Digital Look */}
                            <div className={`${s.numpadBg} border-2 rounded-3xl p-5 relative shadow-inner overflow-hidden`}>
                                <div className="absolute top-4 left-5 flex gap-1.5">
                                    <div className={`w-2 h-2 rounded-full ${activeInput === "quantity" ? (theme === 'modern' ? 'bg-primary' : 'bg-red-500') + ' animate-pulse' : 'bg-white/10'}`} />
                                    <div className={`w-2 h-2 rounded-full ${activeInput === "discount" ? 'bg-amber-500 animate-pulse' : 'bg-white/10'}`} />
                                </div>
                                <div className={`text-[10px] font-black ${theme === 'modern' ? 'text-secondary' : 'text-slate-400'} tracking-[2px] mb-1 pl-8`}>
                                    {activeInput === "quantity" ? "MİKTAR GİRİŞİ" : "İNDİRİM GİRİŞİ"}
                                </div>
                                <div className={`text-5xl font-black ${theme === 'modern' ? 'text-white' : (theme === 'wood' ? 'text-[#ffd700]' : 'text-slate-800')} text-right font-mono tracking-tighter`}>
                                    {numpadValue || "0"}<span className="text-primary/50 text-2xl ml-1 font-sans">{activeInput === "quantity" ? "AD" : "₺"}</span>
                                </div>

                                {parseFloat(numpadValue.replace(',', '.')) > 0 && activeInput === "quantity" && (
                                    <div className={`mt-4 pt-3 border-t ${theme === 'modern' ? 'border-white/5' : 'border-black/10'} flex justify-between items-center animate-in fade-in duration-300`}>
                                        <div className="text-[10px] font-bold text-secondary tracking-widest uppercase">PARA ÜSTÜ</div>
                                        <div className={`text-2xl font-black ${theme === 'glass' ? 'text-blue-600' : 'text-emerald-400'}`}>₺{(Math.max(0, parseFloat(numpadValue.replace(',', '.')) - total)).toFixed(2)}</div>
                                    </div>
                                )}
                            </div>



                            {/* NEW POSITION: Actions moved UP */}
                            <div className="flex flex-col gap-3">
                                {/* Suspend/Resume Actions */}
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={suspendSale} className="py-3 bg-white/5 border border-white/10 text-secondary font-bold rounded-2xl hover:bg-amber-500/20 hover:text-amber-500 hover:border-amber-500/30 transition-all text-[9px] tracking-widest uppercase flex items-center justify-center gap-2">
                                        <Pause size={12} /> ASKIYA AL
                                    </button>
                                    <button onClick={() => setShowSuspendedModal(true)} className="py-3 bg-white/5 border border-white/10 text-secondary font-bold rounded-2xl hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/30 transition-all text-[9px] tracking-widest uppercase flex items-center justify-center gap-2 relative">
                                        <Play size={12} /> ASKIYI AÇ
                                        {suspendedSales.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-[9px] rounded-full flex items-center justify-center border-2 border-[#0f172a]">{suspendedSales.length}</span>}
                                    </button>
                                </div>

                                {/* Secondary Actions (Fiyat Gör, Müşteri, vb.) */}
                                <div className="grid grid-cols-4 gap-2">
                                    <button onClick={() => { setActiveInput(activeInput === "quantity" ? "discount" : "quantity"); }} className={`aspect-square rounded-2xl flex items-center justify-center transition-all border ${activeInput === "discount" ? 'bg-amber-500 text-white border-amber-500 shadow-lg' : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'}`} title="Mod Değiştir">
                                        <BadgePercent size={18} />
                                    </button>
                                    <button onClick={() => { setIsPriceCheckMode(!isPriceCheckMode); }} className={`aspect-square rounded-2xl flex items-center justify-center transition-all border ${isPriceCheckMode ? 'bg-blue-500 text-white border-blue-500 animate-pulse' : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10'}`} title="Fiyat Gör">
                                        <Search size={18} />
                                    </button>
                                    <button onClick={() => setCart(cart.slice(0, -1))} className="aspect-square rounded-2xl bg-white/5 border border-white/10 text-rose-500 flex items-center justify-center hover:bg-rose-500/10 transition-all shadow-sm" title="Son Satırı Sil">
                                        <Delete size={18} />
                                    </button>
                                    <button onClick={() => setCart([])} className="aspect-square rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center hover:bg-rose-500/20 transition-all shadow-sm" title="Belge İptal">
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Numpad Buttons */}
                            <div className="grid grid-cols-4 gap-2.5 bg-card/40 p-3 rounded-[32px] border border-border/40">
                                <div className="col-span-3 grid grid-cols-3 gap-2.5">
                                    {[7, 8, 9, 4, 5, 6, 1, 2, 3, 0, '.', 'C'].map((num, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                if (num === 'C') return setNumpadValue("");
                                                if (num === '.') return setNumpadValue(prev => prev.includes('.') ? prev : prev + '.');
                                                setNumpadValue(prev => prev + num);
                                            }}
                                            className={`w-full aspect-square ${theme === 'glass' ? 'rounded-full' : (theme === 'wood' ? 'rounded-2xl' : 'rounded-full')} ${s.button} text-xl font-bold transition-all active:scale-90 flex items-center justify-center hover:shadow-lg`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                                <div className="grid grid-rows-3 gap-2.5">
                                    <button onClick={() => setNumpadValue(prev => prev.slice(0, -1))} className="row-span-1 w-full rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center hover:bg-rose-500/20 active:scale-90 transition-all"><Delete size={18} /></button>
                                    <button onClick={applyNumpadAction} className="row-span-2 w-full rounded-[32px] bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all outline-none">
                                        <div className="flex flex-col items-center gap-1 font-black">
                                            <Plus size={20} />
                                            <span className="text-[8px]">OK</span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Payment Buttons (Bottommost now) */}
                            {/* 
                                KONUM DEĞİŞTİRME NOTU:
                                - 'mt-auto' butonları kolonun en altına yaslar. 
                                - Yukarı kaldırmak için 'mt-auto' yerine 'mt-4' (veya istediğiniz bir boşluk) yazabilirsiniz.
                                - Eğer butonları tamamen başka bir yerin (mesela numpad'in) üstüne taşımak isterseniz, 
                                  bu <div> bloğunu komple kesip istediğiniz satıra yapıştırmalısınız.
                            */}
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <button onClick={() => handleCheckout("NAKİT")} className={`flex flex-col items-center justify-center p-4 rounded-3xl ${s.paymentNakit} text-white hover:scale-[1.02] transition-all shadow-lg active:scale-95 group border-b-4 ${theme === 'modern' ? 'border-emerald-700' : 'border-black/20'}`}>
                                    <Banknote size={20} className="mb-1 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black tracking-[1px]">NAKİT</span>
                                </button>
                                <button onClick={() => handleCheckout("KART")} className={`flex flex-col items-center justify-center p-4 rounded-3xl ${s.paymentKart} text-white hover:scale-[1.02] transition-all shadow-lg active:scale-95 group border-b-4 ${theme === 'modern' ? 'border-blue-700' : 'border-black/20'}`}>
                                    <CreditCard size={20} className="mb-1 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black tracking-[1px]">KART</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Appearance Settings Modal removed - Moved to global settings */}

            {/* Suspended Sales Modal */}
            <AnimatePresence>
                {showSuspendedModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="glass-card w-full max-w-xl !p-0 overflow-hidden shadow-2xl border-amber-500/20">
                            <div className="p-6 border-b border-border bg-amber-500/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Clock className="text-amber-500" />
                                    <h3 className="font-black uppercase tracking-widest">ASKIYA ALINMIŞ SATIŞLAR</h3>
                                </div>
                                <button onClick={() => setShowSuspendedModal(false)} className="p-2 hover:bg-white/5 rounded-xl transition-all"><X /></button>
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
                                {suspendedSales.length === 0 ? (
                                    <div className="text-center py-20 text-secondary font-bold opacity-30">ASKIDA SATIŞ BULUNMUYOR</div>
                                ) : (
                                    suspendedSales.map((s) => (
                                        <div key={s.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-amber-500/30 transition-all">
                                            <div className="flex items-center gap-6">
                                                <div className="text-2xl font-black text-amber-500/50 group-hover:text-amber-500 transition-colors">
                                                    {s.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-white">{s.cart.length} Ürün</div>
                                                    <div className="text-[10px] text-secondary font-black uppercase tracking-widest">{s.cart.map((i: any) => i.name).join(', ').slice(0, 40)}...</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-xl font-black text-white">₺{s.cart.reduce((a: any, b: any) => a + (b.sale_price * b.quantity), 0).toFixed(2)}</div>
                                                <button onClick={() => recallSale(s)} className="bg-amber-500 px-6 py-2 rounded-xl text-white font-black text-xs hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all active:scale-95">SEPETE AL</button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Weight Input Modal */}
            <AnimatePresence>
                {weightModalProduct && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card w-full max-w-sm !p-8 shadow-2xl border-primary/20 space-y-6">
                            <div className="text-center">
                                <h3 className="text-xl font-black text-white uppercase">{weightModalProduct.name}</h3>
                                <div className="text-[10px] font-bold text-secondary tracking-widest mt-2 uppercase">KG BİRİMİ - GRAMAJ GİRİN</div>
                            </div>
                            <div className="relative">
                                <input
                                    type="text" autoFocus
                                    className="w-full bg-white/5 border-2 border-primary/30 rounded-2xl py-6 px-4 text-4xl font-black text-center text-primary outline-none focus:border-primary transition-all"
                                    value={weightInput}
                                    onChange={(e) => setWeightInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleWeightSubmit()}
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xl font-black text-secondary opacity-30">GR</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setWeightModalProduct(null)} className="py-4 rounded-xl bg-white/5 font-bold hover:bg-white/10">VAZGEÇ</button>
                                <button onClick={handleWeightSubmit} className="py-4 rounded-xl bg-primary text-white font-black shadow-lg shadow-primary/20">EKLE</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Price Check Result Modal */}
            <AnimatePresence>
                {priceCheckProduct && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-2xl text-center space-y-8">
                            <div className="space-y-2">
                                <div className="text-secondary font-black uppercase tracking-[10px]">FİYAT SORGULAMA</div>
                                <h2 className="text-6xl font-black text-white leading-tight">{priceCheckProduct.name}</h2>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-[40px] p-12 inline-block min-w-[400px]">
                                <div className="text-9xl font-black text-emerald-400 tracking-tighter">
                                    ₺{priceCheckProduct.sale_price.toFixed(2)}
                                </div>
                                <div className="text-secondary font-bold mt-4 uppercase tracking-widest text-xl">
                                    1 {priceCheckProduct.unit || 'ADET'} FİYATI
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-4">
                                <button
                                    onClick={() => {
                                        const p = priceCheckProduct;
                                        setPriceCheckProduct(null);
                                        addToCart(p);
                                    }}
                                    className="bg-primary text-white px-12 py-6 rounded-3xl font-black text-2xl hover:bg-primary/90 transition-all active:scale-95 shadow-2xl shadow-primary/20"
                                >
                                    SEPETE EKLE
                                </button>
                                <button onClick={() => setPriceCheckProduct(null)} className="text-secondary font-bold hover:text-white transition-colors">KAPAT (ESC)</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Sale Success & Receipt Modal */}
            <AnimatePresence>
                {showReceiptModal && lastTransaction && (
                    <div
                        onClick={() => setShowReceiptModal(false)}
                        className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-emerald-500/20 backdrop-blur-xl cursor-pointer"
                    >
                        <motion.div
                            onClick={(e) => e.stopPropagation()}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="glass-card w-full max-w-md !p-8 text-center space-y-6 border-emerald-500/30 cursor-default"
                        >
                            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/40">
                                <Printer size={40} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-widest">SATIŞ TAMAMLANDI</h3>
                                <p className="text-secondary font-bold mt-1 text-xs">FİŞ OTOMATİK OLARAK YAZDIRILIYOR</p>
                            </div>

                            <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-3">
                                <div className="flex justify-between text-xs font-bold text-secondary uppercase tracking-widest">
                                    <span>İŞLEM NO</span>
                                    <span className="text-white">#{lastTransaction.saleId}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold text-secondary uppercase tracking-widest">
                                    <span>ÖDEME TİPİ</span>
                                    <span className="text-white">{lastTransaction.method}</span>
                                </div>
                                <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                                    <span className="text-sm font-black text-white">TOPLAM</span>
                                    <span className="text-3xl font-black text-emerald-400">₺{lastTransaction.total.toFixed(2)}</span>
                                </div>

                                {lastTransaction.method === 'NAKİT' && lastTransaction.receivedAmount > 0 && (
                                    <>
                                        <div className="flex justify-between text-xs font-bold text-secondary uppercase tracking-widest pt-2">
                                            <span>ÖDENEN</span>
                                            <span className="text-white">₺{lastTransaction.receivedAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                                            <span className="text-xs font-black text-secondary uppercase tracking-widest">PARA ÜSTÜ</span>
                                            <span className="text-xl font-black text-primary">₺{lastTransaction.changeAmount.toFixed(2)}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => {
                                        const btn = document.getElementById('print-receipt-trigger');
                                        if (btn) btn.click();
                                    }}
                                    className="py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                                >
                                    <Printer size={18} /> TEKRAR YAZDIR
                                </button>
                                <button
                                    onClick={() => setShowReceiptModal(false)}
                                    className="py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95"
                                >
                                    YENİ SATIŞ
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Hidden Printing Component */}
            <PrintReceiptButton data={lastTransaction} onAfterPrint={() => console.log('Yazdırıldı')} />
        </div>
    );
}
