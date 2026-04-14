"use client";

import { useState, useRef, useMemo, useEffect, useDeferredValue } from "react";
import {
    Search, ShoppingCart, Trash2, CreditCard, Banknote,
    Plus, Minus, Printer, Pause, Play, Delete,
    ChevronLeft, ChevronRight, Hash, BadgePercent,
    Calculator, MousePointer2, User, Clock, Monitor, X,
    Wallet, Building2, Sparkles, TrendingUp, Camera, Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PrintReceiptButton, triggerManualPrint, ReceiptPreview } from "./Receipt";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useTenant } from "@/lib/tenant-context";
import { supabase, auditLog } from "@/lib/supabase";
import { readScaleWeight } from "@/lib/hardware";
import CariSearchModal from "../Cari/CariSearchModal";


export default function POS({
    products = [],
    categories = [],
    onCheckout,
    showToast,
    campaignRate = 1.15,
    theme = 'modern',
    setTheme,
    isBeepEnabled = true,
    isPriceSyncEnabled = false,
    isStockSyncEnabled = false,
    isCashDrawerEnabled = false,
    cashDrawerPrinterName = "",
    receiptPrinterName = "",
    labelPrinterName = "",
    setActiveTab,
    initialCart = [],
    onCartCleared,
    onRefresh,
    receiptSettings = {}
}: any) {
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, product: any } | null>(null);
    const [isQuickEditModalOpen, setIsQuickEditModalOpen] = useState(false);
    const [quickEditingProduct, setQuickEditingProduct] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
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

    // Sync with initialCart (for Adisyon integration)
    useEffect(() => {
        if (initialCart && initialCart.length > 0) {
            setCart(initialCart);
            if (onCartCleared) onCartCleared();
        }
    }, [initialCart]);

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

    const [isScannerOpen, setIsScannerOpen] = useState(false);

    // CRM / Müşteri States
    const [selectedCari, setSelectedCari] = useState<any>(null);
    const [isCariModalOpen, setIsCariModalOpen] = useState(false);
    const [cariSearch, setCariSearch] = useState("");
    const [cariList, setCariList] = useState<any[]>([]);
    const [isListingCari, setIsListingCari] = useState(false);

    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const { currentTenant, activeWarehouse, warehouses, setActiveWarehouse, activeEmployee } = useTenant();

    // We use activeWarehouse directly from context for better reactivity


    // Performance Optimization: Visible products limit
    const [displayLimit, setDisplayLimit] = useState(24);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const gridContainerRef = useRef<HTMLDivElement>(null);

    // Reset limit on search/category change
    useEffect(() => {
        setDisplayLimit(24);
    }, [search, selectedCategory]);



    // Barcode Map for O(1) Lookups
    const barcodeMap = useMemo(() => {
        const map = new Map();
        products.forEach((p: any) => {
            if (p.barcode) map.set(p.barcode.toLowerCase(), p);
        });
        return map;
    }, [products]);

    // Defer search to keep UI snappy
    const deferredSearch = useDeferredValue(search);

    // Filtered Products - Optimized with Map and Deferred Value
    const filteredProducts = useMemo(() => {
        if (deferredSearch) {
            const lowSearch = deferredSearch.toLowerCase();

            // 1. Exact Barcode Match (Best Case) - O(1)
            const exactMatch = barcodeMap.get(lowSearch);
            if (exactMatch) return [exactMatch];

            // 2. Filter by Name Includes OR Barcode Includes
            const matches = products.filter((p: any) => {
                const nameMatch = p.name?.toLowerCase().includes(lowSearch);
                const barcodeMatch = p.barcode?.toLowerCase().includes(lowSearch);
                return nameMatch || barcodeMatch;
            });

            // 3. Sort by Relevance
            return matches.sort((a: any, b: any) => {
                const aName = a.name?.toLowerCase() || "";
                const bName = b.name?.toLowerCase() || "";
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
    }, [products, barcodeMap, selectedCategory, deferredSearch, activeWarehouse, isPriceSyncEnabled]);

    // Intersection Observer for Infinite Scroll
    useEffect(() => {
        if (!sentinelRef.current) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && filteredProducts.length > displayLimit) {
                setDisplayLimit(prev => prev + 24);
            }
        }, {
            root: gridContainerRef.current,
            rootMargin: '200px',
            threshold: 0.01
        });

        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [filteredProducts.length, displayLimit]);

    // Scanner Logic
    useEffect(() => {
        if (isScannerOpen) {
            const scanner = new Html5QrcodeScanner(
                "reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                false
            );

            const onScanSuccess = (decodedText: string) => {
                const product = barcodeMap.get(decodedText.toLowerCase());
                if (product) {
                    addToCart(product);
                    showToast(`${product.name} sepete eklendi`, "success");
                    setIsScannerOpen(false);
                    scanner.clear();
                } else {
                    showToast("Ürün bulunamadı: " + decodedText, "error");
                }
            };

            scanner.render(onScanSuccess, (err) => {
                // Errors ignored for scan loop
            });

            scannerRef.current = scanner;

            return () => {
                if (scannerRef.current) {
                    scannerRef.current.clear().catch(e => console.error("Scanner clear error", e));
                }
            };
        }
    }, [isScannerOpen, barcodeMap]);

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
        light: {
            bg: 'bg-background',
            card: 'bg-card border-border shadow-md',
            button: 'bg-slate-200/50 border-slate-200 text-foreground hover:bg-primary hover:text-white',
            accent: 'text-primary',
            numpadBg: 'bg-white border-primary/10',
            paymentNakit: 'bg-emerald-600 hover:bg-emerald-700',
            paymentKart: 'bg-blue-600 hover:bg-blue-700'
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

    // Cart Calculations
    const subtotal = cart.reduce((sum, item) => sum + (item.sale_price * item.quantity), 0);
    const total = Math.max(0, subtotal - discount);

    // Customer Display Sync (BroadcastChannel)
    useEffect(() => {
        const channel = new BroadcastChannel("jetpos-display-sync");
        channel.postMessage({ type: 'CART_SYNC', cart, total, discount });
        return () => channel.close();
    }, [cart, total, discount]);

    // Helper to update CFD status
    const updateDisplayStatus = (status: string, data?: any) => {
        const channel = new BroadcastChannel("jetpos-display-sync");
        channel.postMessage({ type: 'STATUS_UPDATE', status, ...data });
        channel.close();
    };

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

        const currentWarehouseId = activeWarehouse?.id || warehouses[0]?.id;

        // Find warehouse specific price unless sync is enabled
        const wsData = (!isPriceSyncEnabled && currentWarehouseId)
            ? product.warehouse_stock?.find((ws: any) => ws.warehouse_id === currentWarehouseId)
            : null;

        const basePrice = wsData?.sale_price !== null && wsData?.sale_price !== undefined ? wsData.sale_price : product.sale_price;
        const adjustedPrice = product.is_campaign ? parseFloat((basePrice * campaignRate).toFixed(2)) : basePrice;

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

    const handleReadFromScale = async () => {
        try {
            showToast("Teraziden veri bekleniyor...", "info");
            const weight = await readScaleWeight();
            setWeightInput((weight * 1000).toString()); // g cinsinden set et
            showToast(`Ağırlık okundu: ${weight} kg`, "success");
        } catch (err: any) {
            showToast("Terazi okunamadı: " + err.message, "error");
        }
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

    const searchCari = async (term: string = "") => {
        if (!currentTenant) return;
        setIsListingCari(true);
        try {
            let query = supabase
                .from('cari_hesaplar')
                .select('*')
                .eq('tenant_id', currentTenant.id)
                .eq('durum', 'Aktif');

            if (term) {
                query = query.or(`unvani.ilike.%${term}%,cari_kodu.ilike.%${term}%`);
            }

            const { data, error } = await query.limit(20);
            if (error) throw error;
            setCariList(data || []);
        } catch (err: any) {
            console.error("Cari arama hatası:", err);
            if (showToast) showToast("Müşteri listesi alınamadı", "error");
        } finally {
            setIsListingCari(false);
        }
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

        // VERESİYE kontrolü: Müşteri seçili değilse modalı aç ve dur.
        if (method === "VERESİYE" && !selectedCari) {
            setIsCariModalOpen(true);
            showToast("Veresiye satışı için lütfen önce müşteri seçiniz!", "warning");
            return;
        }

        const saleId = Math.random().toString(36).substr(2, 9).toUpperCase();

        const receivedAmount = parseFloat(numpadValue.replace(',', '.')) || 0;
        const changeAmount = Math.max(0, receivedAmount - total);

        // CRM Integration: Pass selected customer id
        onCheckout(cart, method, selectedCari?.id);

        setLastTransaction({
            items: [...cart],
            total,
            paymentMethod: method,
            date: new Date(),
            saleId,
            customer: selectedCari,
            receivedAmount: method === 'NAKİT' ? receivedAmount : 0,
            changeAmount: method === 'NAKİT' ? changeAmount : 0,
            receiptSettings
        });
        updateDisplayStatus('completed', {
            total,
            receivedAmount,
            changeAmount,
            paymentMethod: method,
            customerName: selectedCari?.unvani
        });
        setShowReceiptModal(true);
        setCart([]);
        setSelectedCari(null); // Reset customer
        setDiscount(0);
        setNumpadValue("");

        // --- ÇEKMECE TETİKLEME (NAKİT VEYA KART) ---
        if ((method === 'NAKİT' || method === 'KART' || method === 'KREDİ KARTI') && isCashDrawerEnabled && window.require) {
            try {
                const { ipcRenderer } = window.require('electron');
                ipcRenderer.send('open-cash-drawer', { printerName: cashDrawerPrinterName });
            } catch (err) {
                console.error("Kasa çekmecesi tetikleme hatası (Renderer):", err);
            }
        }
    };

    const handleOpenCashDrawerManual = async () => {
        if (!isCashDrawerEnabled) {
            showToast("Kasa çekmecesi ayarları kapalı!", "error");
            return;
        }

        try {
            // Log manually
            if (currentTenant) {
                auditLog(currentTenant.id, 'CASH_DRAWER_OPEN', 'Kasa çekmecesi manuel olarak açıldı');
            }

            // Trigger hardware
            if (window.require) {
                const { ipcRenderer } = window.require('electron');
                ipcRenderer.send('open-cash-drawer', { printerName: cashDrawerPrinterName });
            }

            showToast("Kasa Çekmecesi Açıldı", "success");
        } catch (err) {
            console.error("Kasa açma hatası:", err);
            showToast("Donanım tetiklenemedi!", "error");
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-10px)] gap-2 select-none">
            {/* Premium Top Info Bar */}
            <div className="relative flex items-center justify-between bg-gradient-to-r from-card/60 via-card/40 to-card/60 backdrop-blur-xl border-2 border-border/40 p-2 rounded-xl shadow-xl overflow-hidden mt-2">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-50" />
                <div className="absolute -left-20 -top-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute -right-20 -top-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />

                <div className="relative flex items-center gap-6">
                    {/* Online Status */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl border border-emerald-500/30 backdrop-blur-sm">
                        <div className="relative">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                        </div>
                        <span className="text-xs font-black tracking-wider">SİSTEM ÇEVRİMİÇİ</span>
                    </div>

                    {/* Terminal Info */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-xl border border-border backdrop-blur-sm">
                        <Monitor size={16} className="text-primary" />
                        <span className="text-xs font-black text-secondary uppercase tracking-wider">Terminal #01</span>
                    </div>

                    {/* Kasa Aç Butonu */}
                    <button
                        onClick={handleOpenCashDrawerManual}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-xl border border-amber-500/30 transition-all font-black text-xs uppercase tracking-wider"
                    >
                        <Wallet size={16} />
                        KASA AÇ
                    </button>

                    {/* User Info */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20 backdrop-blur-sm">
                        <User size={16} className="text-primary" />
                        <span className="text-xs font-black text-foreground uppercase tracking-wider">
                            {activeEmployee ? `${activeEmployee.first_name} ${activeEmployee.last_name}` : 'YÖNETİCİ'}
                        </span>
                        {activeEmployee?.position && (
                            <span className="text-[8px] font-bold text-secondary uppercase opacity-70">({activeEmployee.position})</span>
                        )}
                    </div>

                    {/* Müşteri Seçimi (CRM) */}
                    <div className="flex items-center gap-2">
                        {!selectedCari ? (
                            <button
                                onClick={() => { setIsCariModalOpen(true); }}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-primary/10 text-secondary hover:text-primary rounded-xl border border-border hover:border-primary/30 transition-all font-black text-xs uppercase tracking-wider"
                            >
                                <Users size={16} />
                                MÜŞTERİ SEÇ
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 border-emerald-500/30 rounded-xl border backdrop-blur-sm group">
                                <Users size={16} />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest">{selectedCari.unvani}</span>
                                    <span className="text-[8px] opacity-70">Puan: {selectedCari.loyalty_points_total || 0}</span>
                                </div>
                                <button
                                    onClick={() => setSelectedCari(null)}
                                    className="ml-2 hover:bg-rose-500/20 p-1 rounded-full text-rose-500/50 hover:text-rose-500 transition-all"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Warehouse/Store Selector */}
                    {warehouses.length > 0 && (
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 rounded-xl border border-indigo-500/30 backdrop-blur-sm">
                            <Building2 size={16} className="text-indigo-400" />
                            <select
                                value={activeWarehouse?.id || ""}
                                onChange={(e) => {
                                    const selected = warehouses.find(w => w.id === e.target.value);
                                    if (selected) {
                                        if (cart.length > 0) {
                                            if (confirm("Mağaza değişince sepetinizdeki fiyatlar güncellenmeyebilir. Sepeti temizlemek ister misiniz?")) {
                                                setCart([]);
                                            }
                                        }
                                        setActiveWarehouse(selected);
                                        if (showToast) {
                                            showToast(`${selected.name} mağazasına geçildi.`, "success");
                                        }
                                    }
                                }}
                                className="bg-transparent text-xs font-bold text-indigo-200 outline-none cursor-pointer"
                            >
                                {warehouses.map((w: any) => (
                                    <option key={w.id} value={w.id} className="bg-slate-900 text-white">
                                        {w.name} {w.type === 'virtual' ? '(Online)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Pricing Mode Badge */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-sm ${isPriceSyncEnabled ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'}`}>
                        <BadgePercent size={14} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">
                            {isPriceSyncEnabled ? "Fiyatlar Senkronize" : "Mağaza Bazlı Fiyatlar"}
                        </span>
                    </div>
                </div>

                <div className="relative flex items-center gap-4">
                    {/* Settings Button */}
                    <button
                        onClick={() => setActiveTab("settings")}
                        className="group p-2.5 bg-primary/5 hover:bg-primary/10 rounded-xl border border-border hover:border-primary/30 text-secondary hover:text-primary transition-all flex items-center gap-2 backdrop-blur-sm"
                    >
                        <Calculator size={16} className="group-hover:rotate-12 transition-transform" />
                        <span className="text-xs font-bold tracking-wide hidden xl:block">AYARLAR</span>
                    </button>

                    {/* Date & Time */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-xl border border-border backdrop-blur-sm">
                            <Clock size={14} className="text-secondary" />
                            <span className="font-black text-sm text-secondary">
                                {currentTime.toLocaleDateString('tr-TR')}
                            </span>
                        </div>
                        <div className="bg-gradient-to-r from-primary/20 to-primary/10 px-4 py-2 rounded-xl border-2 border-primary/30 backdrop-blur-sm">
                            <span className="font-black text-sm text-primary animate-pulse">
                                {currentTime.toLocaleTimeString('tr-TR')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex gap-2 min-h-0">
                {/* LEFT: Cart and Totals - Modern Premium Design */}
                <div className="w-full lg:w-[35%] flex flex-col gap-2 min-h-0">
                    <div className="glass-card !p-0 overflow-hidden flex flex-col border-2 border-border/40 shadow-xl h-[calc(100vh-200px)]">
                        {/* Modern Header with Gradient */}
                        <div className="relative p-4 border-b-2 border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-50" />
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/20 rounded-xl border border-primary/30">
                                        <ShoppingCart size={20} className="text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-sm uppercase tracking-widest text-foreground">SATIŞ LİSTESİ</h3>
                                        <p className="text-[9px] text-secondary font-bold tracking-wider">{cart.length} ürün</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setCart([])}
                                    className="px-4 py-2 text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 rounded-xl transition-all active:scale-95"
                                >
                                    TEMİZLE
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-card z-10 text-[10px] font-black text-secondary uppercase tracking-widest border-b border-border">
                                    <tr>
                                        <th className="p-4 w-12 text-center">#</th>
                                        <th className="p-4">ÜRÜN / BARKOD</th>
                                        <th className="p-4 text-center">MİKTAR</th>
                                        <th className="p-4 text-right">FİYAT</th>
                                        <th className="p-4 text-right">TOPLAM</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    <AnimatePresence initial={false}>
                                        {cart.map((item, index) => (
                                            <motion.tr
                                                key={item.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                className="group hover:bg-primary/5 transition-colors"
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
                                                    <div className="font-bold text-sm text-foreground leading-tight break-words max-w-[250px]">{item.name}</div>
                                                    <div className="text-[10px] text-secondary font-medium tracking-wider">{item.barcode}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-rose-500 transition-colors"><Minus size={14} /></button>
                                                        <input
                                                            type="number"
                                                            step={item.unit === 'kg' ? '0.001' : '1'}
                                                            value={item.unit === 'kg' ? item.quantity.toFixed(3) : item.quantity}
                                                            onChange={(e) => {
                                                                const newQty = parseFloat(e.target.value) || 0;
                                                                if (newQty > 0) {
                                                                    setCart(cart.map(i => i.id === item.id ? { ...i, quantity: newQty } : i));
                                                                }
                                                            }}
                                                            className="font-black text-primary text-sm w-16 text-center bg-transparent border border-primary/20 rounded px-1 py-0.5 focus:outline-none focus:border-primary"
                                                        />
                                                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-emerald-500 transition-colors"><Plus size={14} /></button>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right font-bold text-xs text-secondary">₺{item.sale_price.toFixed(2)}</td>
                                                <td className="p-4 text-right font-black text-sm text-foreground">₺{(item.sale_price * item.quantity).toFixed(2)}</td>
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

                        {/* Premium Totals Section - Ultra Compact */}
                        <div className="relative px-3 py-2 bg-card border-t border-border space-y-1.5 overflow-hidden shrink-0">
                            {/* Decorative Elements */}
                            <div className="absolute -top-10 -left-10 w-20 h-20 bg-primary/5 rounded-full blur-2xl" />
                            <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl" />

                            <div className="relative space-y-2">
                                {/* Subtotal */}
                                <div className="flex justify-between items-center px-3 py-1.5 bg-primary/5 rounded-lg border border-primary/10">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-secondary flex items-center gap-1.5">
                                        <Calculator size={10} className="text-primary/50" />
                                        Ara Toplam
                                    </span>
                                    <span className="text-xs font-bold text-foreground">₺{subtotal.toFixed(2)}</span>
                                </div>

                                {/* Discount */}
                                <div className="flex justify-between items-center px-3 py-1.5 bg-rose-500/5 rounded-lg border border-rose-500/20">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-1.5">
                                        <BadgePercent size={10} className="text-rose-500" />
                                        İndirim
                                    </span>
                                    <span className="text-xs font-bold text-rose-500">- ₺{discount.toFixed(2)}</span>
                                </div>

                                {/* Tax */}
                                <div className="flex justify-between items-center px-3 py-1.5 bg-blue-500/5 rounded-lg border border-blue-500/20">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-1.5">
                                        <Hash size={10} className="text-blue-600" />
                                        KDV Dahil
                                    </span>
                                    <span className="text-xs font-bold text-blue-600">₺{(total * 0.1).toFixed(2)}</span>
                                </div>

                                {/* Paid Amount (Cash) */}
                                <div className="flex justify-between items-center px-3 py-1.5 bg-primary/5 rounded-lg border border-primary/10">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-secondary flex items-center gap-1.5">
                                        <Banknote size={10} className="text-emerald-400/50" />
                                        Ödenen (Nakit)
                                    </span>
                                    <span className="text-xs font-bold text-foreground">₺{parseFloat(numpadValue.replace(',', '.')) || 0}</span>
                                </div>

                                {/* Change */}
                                <div className="flex justify-between items-center px-3 py-2 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                                        <Sparkles size={10} className="animate-pulse" />
                                        Para Üstü
                                    </span>
                                    <span className="text-lg font-black text-primary">₺{Math.max(0, (parseFloat(numpadValue.replace(',', '.')) || 0) - total).toFixed(2)}</span>
                                </div>

                                {/* Grand Total - Ultra Compact Card */}
                                <div className="relative mt-2 p-3 bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent rounded-xl border border-emerald-500/30 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent" />
                                    <div className="relative flex justify-between items-center">
                                        <div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-300 block mb-0.5">Genel Toplam</span>
                                            <span className="text-[10px] text-emerald-400/60 font-bold">{cart.length} Ürün</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                                                ₺{total.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Grid & Actions */}
                <div className="flex-1 flex flex-col gap-3 overflow-hidden">
                    {/* Categories & Search - Enhanced */}
                    <div className="flex gap-4">
                        {/* Search Bar with Glow Effect */}
                        <div className="relative w-full max-w-[600px] group">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary w-5 h-5 transition-colors" />
                            <input
                                type="text"
                                placeholder="Ürün ara veya barkod okut..."
                                className="relative w-full bg-card/50 border border-border/60 focus:border-primary/40 rounded-xl py-4 pl-12 pr-12 outline-none font-medium placeholder:text-secondary/40 transition-all focus:shadow-lg focus:shadow-primary/5 backdrop-blur-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                {search && (
                                    <button
                                        onClick={() => setSearch("")}
                                        className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                                    >
                                        <X size={18} className="text-secondary hover:text-rose-500" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex gap-4 min-h-0">
                        <div ref={gridContainerRef} className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
                                {filteredProducts.slice(0, displayLimit).map((p: any) => (
                                    <motion.div
                                        key={p.id}
                                        onClick={() => addToCart(p)}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setContextMenu({ x: e.clientX, y: e.clientY, product: p });
                                        }}
                                        className="group cursor-pointer relative text-left flex flex-col justify-between h-[180px] rounded-lg transition-all overflow-hidden bg-card/50 border border-border/30 hover:border-primary/30 hover:shadow-md backdrop-blur-sm"
                                    >
                                        {/* Minimal glow */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/2 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                        {/* Product Image Background / Placeholder */}
                                        {p.image_url ? (
                                            <div className="absolute inset-0 opacity-5 group-hover:opacity-8 transition-opacity duration-300">
                                                <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.03] transition-opacity flex items-center justify-center">
                                                <ShoppingCart size={120} strokeWidth={0.5} />
                                            </div>
                                        )}

                                        <div className="p-4 relative z-10 h-full flex flex-col">
                                            <div className="flex-1">
                                                {/* Product Name */}
                                                <div className="font-bold text-[13px] text-foreground group-hover:text-primary leading-tight transition-colors [overflow-wrap:anywhere] pr-1">
                                                    {p.name}
                                                </div>
                                            </div>

                                            {/* Price Section */}
                                            <div className="flex items-end justify-between mt-auto gap-2">
                                                <div className="space-y-0.5">
                                                    {/* Current Price */}
                                                    {(() => {
                                                        const currentWarehouseId = activeWarehouse?.id || warehouses[0]?.id;
                                                        const wsData = p.warehouse_stock?.find((ws: any) => ws.warehouse_id === currentWarehouseId);
                                                        const price = (!isPriceSyncEnabled && wsData?.sale_price !== null && wsData?.sale_price !== undefined) ? wsData.sale_price : p.sale_price;
                                                        const qty = (isStockSyncEnabled || !activeWarehouse) ? (p.stock_quantity || 0) : (wsData?.quantity || 0);
                                                        return <>
                                                            <div className="text-xl font-bold text-foreground tracking-tight">
                                                                ₺{price.toFixed(2)}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border backdrop-blur-md transition-all ${qty > 10 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                                                    qty > 0 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                                                        'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                                                    }`}>
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${qty > 10 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                                                        qty > 0 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                                                                            'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                                                                        }`} />
                                                                    <span className="text-[10px] font-black tracking-tight whitespace-nowrap uppercase">
                                                                        {qty} STOK
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </>
                                                            ;
                                                    })()}
                                                </div>

                                            </div>
                                        </div>
                                    </motion.div>
                                ))}

                                {/* Sentinel element for infinite scroll */}
                                <div ref={sentinelRef} className="col-span-full h-10 flex items-center justify-center text-secondary/20 font-black text-[10px] tracking-[4px] uppercase py-10">
                                    {filteredProducts.length > displayLimit ? "Ürünler Yükleniyor..." : "Listenin Sonu"}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Grid & Actions - Ergonomic Layout */}
                        <div className="w-[340px] flex flex-col gap-3 overflow-y-auto max-h-full pr-2 custom-scrollbar">



                            {/* NEW POSITION: Actions moved UP */}
                            <div className="flex flex-col gap-3">
                                {/* Suspend/Resume Actions */}
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={suspendSale} className="py-3 bg-primary/5 border border-border text-secondary font-bold rounded-xl hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all text-[9px] tracking-widest uppercase flex items-center justify-center gap-2">
                                        <Pause size={12} /> ASKIYA AL
                                    </button>
                                    <button onClick={() => setShowSuspendedModal(true)} className="py-3 bg-primary/5 border border-border text-secondary font-bold rounded-xl hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all text-[9px] tracking-widest uppercase flex items-center justify-center gap-2 relative">
                                        <Play size={12} /> ASKIYI AÇ
                                        {suspendedSales.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[9px] rounded-full flex items-center justify-center border-2 border-card">{suspendedSales.length}</span>}
                                    </button>
                                </div>

                                {/* Secondary Actions (Fiyat Gör, Müşteri, vb.) */}
                                <div className="grid grid-cols-4 gap-2">
                                    <button onClick={() => { setActiveInput(activeInput === "quantity" ? "discount" : "quantity"); }} className={`aspect-square rounded-xl flex items-center justify-center transition-all border ${activeInput === "discount" ? 'bg-primary text-white border-primary shadow-md' : 'bg-primary/5 border-border text-secondary hover:bg-primary/10'}`} title="Mod Değiştir">
                                        <BadgePercent size={18} />
                                    </button>
                                    <button onClick={() => { setIsPriceCheckMode(!isPriceCheckMode); }} className={`aspect-square rounded-xl flex items-center justify-center transition-all border ${isPriceCheckMode ? 'bg-primary text-white border-primary' : 'bg-primary/5 border-border text-secondary hover:bg-primary/10'}`} title="Fiyat Gör">
                                        <Search size={18} />
                                    </button>
                                    <button onClick={() => setIsScannerOpen(true)} className="aspect-square rounded-xl bg-primary/5 border border-border text-primary flex items-center justify-center hover:bg-primary/10 transition-all shadow-sm" title="Barkod Tara">
                                        <Camera size={18} />
                                    </button>
                                    <button onClick={() => setCart(cart.slice(0, -1))} className="aspect-square rounded-xl bg-primary/5 border border-border text-rose-500 flex items-center justify-center hover:bg-rose-500/10 transition-all shadow-sm" title="Son Satırı Sil">
                                        <Delete size={18} />
                                    </button>
                                    <button onClick={() => setCart([])} className="aspect-square rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center hover:bg-rose-500/20 transition-all shadow-sm" title="Belge İptal">
                                        <X size={18} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (lastTransaction && lastTransaction.items) {
                                                setCart([...lastTransaction.items]);
                                                showToast("Son satıştaki ürünler sepete geri yüklendi", "success");
                                            }
                                        }}
                                        className={`aspect-square rounded-xl flex items-center justify-center transition-all border ${lastTransaction ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20 shadow-sm' : 'bg-primary/5 border-border text-secondary/20 cursor-not-allowed'}`}
                                        title="Son Fişi Sepete Geri Yükle"
                                        disabled={!lastTransaction}
                                    >
                                        <Clock size={18} />
                                    </button>
                                    <button
                                        onClick={handleOpenCashDrawerManual}
                                        className="aspect-square rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center hover:bg-amber-500/20 transition-all shadow-sm"
                                        title="Kasa Aç"
                                    >
                                        <Wallet size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Keyboard Input Box */}
                            <div className="relative group/input text-right py-2 border-b border-primary/20 mb-2">
                                <input
                                    type="text"
                                    value={numpadValue}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(',', '.');
                                        // Allow numbers and decimal point
                                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                            setNumpadValue(val);
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            applyNumpadAction();
                                        }
                                    }}
                                    placeholder="0"
                                    className="w-full bg-transparent text-right text-3xl font-black text-foreground font-mono outline-none focus:text-primary transition-all pr-12 placeholder:opacity-20"
                                    autoFocus
                                />
                                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-black text-primary uppercase tracking-[2px] pointer-events-none">
                                    {activeInput === "quantity" ? "AD" : "₺"}
                                </span>
                            </div>

                            {/* Numpad Buttons */}
                            <div className="grid grid-cols-4 gap-2.5 bg-card/40 p-3 rounded-xl border border-border/40">
                                <div className="col-span-3 grid grid-cols-3 gap-2.5">
                                    {[7, 8, 9, 4, 5, 6, 1, 2, 3, 0, '.', 'C'].map((num, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                if (num === 'C') return setNumpadValue("");
                                                if (num === '.') return setNumpadValue(prev => prev.includes('.') ? prev : prev + '.');
                                                setNumpadValue(prev => prev + num);
                                            }}
                                            className={`w-full aspect-square rounded-lg ${s.button} text-xl font-bold transition-all active:scale-90 flex items-center justify-center hover:shadow-md`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                                <div className="grid grid-rows-3 gap-2.5">
                                    <button onClick={() => setNumpadValue(prev => prev.slice(0, -1))} className="row-span-1 w-full rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center hover:bg-rose-500/20 active:scale-90 transition-all"><Delete size={18} /></button>
                                    <button onClick={applyNumpadAction} className="row-span-2 w-full rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 shadow-md shadow-primary/20 active:scale-95 transition-all outline-none">
                                        <div className="flex flex-col items-center gap-1 font-black">
                                            <Plus size={20} />
                                            <span className="text-[8px]">OK</span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Payment Buttons - Modern 2x2 Grid */}
                            <div>
                                <div className="grid grid-cols-2 gap-3">
                                    {/* NAKİT */}
                                    <button
                                        onClick={() => {
                                            if (cart.length === 0) return;
                                            updateDisplayStatus('payment', { paymentMethod: 'NAKİT' });
                                            setTimeout(() => handleCheckout("NAKİT"), 800);
                                        }}
                                        className="group relative flex flex-col items-center justify-center p-3 rounded-xl bg-primary text-white hover:scale-[1.01] transition-all shadow-md shadow-primary/20 active:scale-95 border border-primary/20 overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <Banknote size={20} className="mb-1.5 group-hover:scale-105 transition-transform relative z-10" />
                                        <span className="text-[10px] font-bold tracking-wider relative z-10">NAKİT</span>
                                        <span className="text-[7px] opacity-70 mt-0.5 relative z-10">CASH</span>
                                    </button>

                                    {/* KART */}
                                    <button
                                        onClick={() => {
                                            if (cart.length === 0) return;
                                            updateDisplayStatus('payment', { paymentMethod: 'KART' });
                                            // Simulate terminal wait or just go to checkout after slight delay for effect
                                            setTimeout(() => handleCheckout("KART"), 1500);
                                        }}
                                        className="group relative flex flex-col items-center justify-center p-3 rounded-xl bg-primary text-white hover:scale-[1.01] transition-all shadow-md shadow-primary/20 active:scale-95 border border-primary/20 overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <CreditCard size={20} className="mb-1.5 group-hover:scale-105 transition-transform relative z-10" />
                                        <span className="text-[10px] font-bold tracking-wider relative z-10">KART</span>
                                        <span className="text-[7px] opacity-70 mt-0.5 relative z-10">CARD</span>
                                    </button>

                                    {/* VERESİYE */}
                                    <button
                                        onClick={() => handleCheckout("VERESİYE")}
                                        className="group relative flex flex-col items-center justify-center p-3 rounded-xl bg-primary text-white hover:scale-[1.01] transition-all shadow-md shadow-primary/20 active:scale-95 border border-primary/20 overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <Wallet size={20} className="mb-1.5 group-hover:scale-105 transition-transform relative z-10" />
                                        <span className="text-[10px] font-bold tracking-wider relative z-10">VERESİYE</span>
                                        <span className="text-[7px] opacity-70 mt-0.5 relative z-10">CREDIT</span>
                                    </button>

                                    {/* HAVALE/EFT */}
                                    <button
                                        onClick={() => handleCheckout("HAVALE/EFT")}
                                        className="group relative flex flex-col items-center justify-center p-3 rounded-xl bg-primary text-white hover:scale-[1.01] transition-all shadow-md shadow-primary/20 active:scale-95 border border-primary/20 overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <Building2 size={20} className="mb-1.5 group-hover:scale-105 transition-transform relative z-10" />
                                        <span className="text-[10px] font-bold tracking-wider relative z-10">HAVALE/EFT</span>
                                        <span className="text-[7px] opacity-70 mt-0.5 relative z-10">TRANSFER</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Appearance Settings Modal removed - Moved to global settings */}

            {/* Barcode Scanner Modal */}
            <AnimatePresence>
                {isScannerOpen && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-background/95 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass-card w-full max-w-lg !p-0 overflow-hidden shadow-2xl border-primary/20"
                        >
                            <div className="p-6 border-b border-border bg-primary/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Camera className="text-primary" />
                                    <h3 className="font-black uppercase tracking-widest">BARKOD TARA</h3>
                                </div>
                                <button
                                    onClick={() => setIsScannerOpen(false)}
                                    className="p-2 hover:bg-white/5 rounded-xl transition-all"
                                >
                                    <X />
                                </button>
                            </div>
                            <div className="p-6">
                                <div id="reader" className="w-full overflow-hidden rounded-2xl border-2 border-primary/20 bg-black/40 aspect-square"></div>
                                <p className="mt-4 text-center text-xs text-secondary font-bold tracking-widest uppercase">
                                    Ürün barkodunu kameraya yaklaştırın
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
                            <div className="space-y-4">
                                <button
                                    onClick={handleReadFromScale}
                                    className="w-full py-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 font-black flex items-center justify-center gap-2 hover:bg-amber-500/20 transition-all"
                                >
                                    <Calculator size={18} />
                                    BAĞLI TERAZİDEN OKU
                                </button>
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => setWeightModalProduct(null)} className="py-4 rounded-xl bg-white/5 font-bold hover:bg-white/10">VAZGEÇ</button>
                                    <button onClick={handleWeightSubmit} className="py-4 rounded-xl bg-primary text-white font-black shadow-lg shadow-primary/20">EKLE</button>
                                </div>
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

            {/* Müşteri Seçim Modalı */}
            <CariSearchModal
                isOpen={isCariModalOpen}
                onClose={() => setIsCariModalOpen(false)}
                onSelect={(c) => {
                    setSelectedCari(c);
                    setIsCariModalOpen(false);
                }}
                title="MÜŞTERİ SEÇİMİ (CRM)"
            />

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
                            className="glass-card w-full max-w-lg !p-0 text-center border-emerald-500/30 cursor-default overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-6 bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border-b border-emerald-500/20 shrink-0">
                                <div className="flex items-center justify-center gap-3 mb-2">
                                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40">
                                        <Printer size={24} className="text-white" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-xl font-black text-white uppercase tracking-widest">SATIŞ TAMAMLANDI</h3>
                                        <p className="text-secondary font-bold text-[10px] tracking-widest uppercase">FİŞ OTOMATİK OLARAK YAZDIRILIYOR</p>
                                    </div>
                                </div>
                            </div>

                            {/* Scrollable Receipt Preview */}
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                <ReceiptPreview data={lastTransaction} />
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-4 p-6 border-t border-white/5 shrink-0 bg-card/80">
                                <button
                                    onClick={async () => {
                                        await triggerManualPrint(lastTransaction);
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
            <PrintReceiptButton data={lastTransaction} printerName={receiptPrinterName} onAfterPrint={() => console.log('Yazdırıldı')} />

            {/* Right Click Context Menu */}
            <AnimatePresence>
                {contextMenu && (
                    <>
                        <div
                            className="fixed inset-0 z-[199]"
                            onClick={() => setContextMenu(null)}
                            onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            style={{ left: contextMenu.x, top: contextMenu.y }}
                            className="fixed z-[200] w-48 bg-card/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden p-1.5"
                        >
                            <button
                                onClick={() => {
                                    setQuickEditingProduct({ ...contextMenu.product });
                                    setIsQuickEditModalOpen(true);
                                    setContextMenu(null);
                                }}
                                className="w-full text-left px-4 py-2.5 hover:bg-primary/10 rounded-lg text-sm font-bold text-foreground flex items-center gap-3 transition-colors"
                            >
                                <Plus size={16} className="text-primary" /> Düzenle
                            </button>
                            <button
                                onClick={async () => {
                                    const { printBarcodeLabel } = await import("@/lib/hardware");
                                    printBarcodeLabel(contextMenu.product, { printerName: labelPrinterName || receiptPrinterName });
                                    setContextMenu(null);
                                }}
                                className="w-full text-left px-4 py-2.5 hover:bg-emerald-500/10 rounded-lg text-sm font-bold text-emerald-400 flex items-center gap-3 transition-colors"
                            >
                                <Printer size={16} className="text-emerald-500" /> Barkod Yazdır
                            </button>
                            <div className="h-[1px] bg-white/5 my-1" />
                            <button
                                onClick={() => setContextMenu(null)}
                                className="w-full text-left px-4 py-2.5 hover:bg-rose-500/10 rounded-lg text-sm font-bold text-rose-400 flex items-center gap-3 transition-colors"
                            >
                                <X size={16} /> Vazgeç
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Quick Edit Modal */}
            <AnimatePresence>
                {isQuickEditModalOpen && (
                    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="glass-card max-w-sm w-full border border-white/10 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />

                            <div className="relative p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-black text-white uppercase tracking-widest">Hızlı Düzenle</h2>
                                    <button onClick={() => setIsQuickEditModalOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-secondary tracking-widest uppercase">Ürün Adı</label>
                                        <input
                                            type="text"
                                            value={quickEditingProduct.name}
                                            onChange={(e) => setQuickEditingProduct({ ...quickEditingProduct, name: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm font-bold focus:border-primary/50 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-secondary tracking-widest uppercase">Satış Fiyatı</label>
                                            <input
                                                type="number"
                                                value={quickEditingProduct.sale_price}
                                                onChange={(e) => setQuickEditingProduct({ ...quickEditingProduct, sale_price: parseFloat(e.target.value) })}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm font-bold focus:border-primary/50 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-secondary tracking-widest uppercase">Birim</label>
                                            <input
                                                type="text"
                                                value={quickEditingProduct.unit}
                                                onChange={(e) => setQuickEditingProduct({ ...quickEditingProduct, unit: e.target.value })}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm font-bold focus:border-primary/50 outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-secondary tracking-widest uppercase">Barkod</label>
                                            <input
                                                type="text"
                                                value={quickEditingProduct.barcode}
                                                onChange={(e) => setQuickEditingProduct({ ...quickEditingProduct, barcode: e.target.value })}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm font-bold focus:border-primary/50 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-secondary tracking-widest uppercase">Stok Miktarı</label>
                                            <input
                                                type="number"
                                                value={quickEditingProduct.stock_quantity ?? 0}
                                                onChange={(e) => setQuickEditingProduct({ ...quickEditingProduct, stock_quantity: parseFloat(e.target.value) })}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm font-bold focus:border-primary/50 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        disabled={isSaving}
                                        onClick={() => setIsQuickEditModalOpen(false)}
                                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                    >
                                        Vazgeç
                                    </button>
                                    <button
                                        disabled={isSaving}
                                        onClick={async () => {
                                            if (!currentTenant) return;
                                            try {
                                                setIsSaving(true);
                                                const { error } = await supabase
                                                    .from('products')
                                                    .update({
                                                        name: quickEditingProduct.name,
                                                        sale_price: quickEditingProduct.sale_price,
                                                        barcode: quickEditingProduct.barcode,
                                                        unit: quickEditingProduct.unit,
                                                        stock_quantity: quickEditingProduct.stock_quantity
                                                    })
                                                    .eq('id', quickEditingProduct.id)
                                                    .eq('tenant_id', currentTenant.id);

                                                if (error) throw error;

                                                showToast("Ürün güncellendi", "success");
                                                setIsQuickEditModalOpen(false);
                                                if (onRefresh) onRefresh();
                                            } catch (err: any) {
                                                showToast(err.message, "error");
                                            } finally {
                                                setIsSaving(false);
                                            }
                                        }}
                                        className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
                                    >
                                        {isSaving ? "Kaydediliyor..." : "Kaydet"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

