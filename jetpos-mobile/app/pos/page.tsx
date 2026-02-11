"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
import { supabase, setCurrentTenant } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, ShoppingCart, Trash2, Plus, Minus,
    Banknote, Wallet, Building2,
    X, ChevronUp, ChevronDown, Package, CheckCircle,
    Users, ChevronRight, Camera, Mic, Loader2, AlertCircle, Bell
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';
import { BrowserMultiFormatReader } from '@zxing/browser';

interface Product {
    id: string;
    name: string;
    barcode: string;
    stock_quantity: number;
    sale_price: number;
    purchase_price: number;
    category_id?: string;
    image_url?: string;
}

interface CartItem extends Product {
    quantity: number;
}

interface Category {
    id: string;
    name: string;
}

interface Customer {
    id: string;
    name: string;
    phone?: string;
}

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    show: { y: 0, opacity: 1 }
};

export default function POSPage() {
    // Data State
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [showCart, setShowCart] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [customerSearch, setCustomerSearch] = useState("");

    // Optimization & Sort State
    const [visibleCount, setVisibleCount] = useState(50);
    const [sortBy, setSortBy] = useState<'name' | 'stock-asc' | 'stock-desc'>('name');

    // Cart State
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    // AI & Notification State
    const [isListening, setIsListening] = useState(false);
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const [openRouterKey, setOpenRouterKey] = useState<string | null>(null);
    const [showLowStockModal, setShowLowStockModal] = useState(false);
    const [isAlertDismissed, setIsAlertDismissed] = useState(() => {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem('jetpos_low_stock_dismissed') === 'true';
        }
        return false;
    });

    const lowStockAlerts = useMemo(() => {
        return products.filter(p => (p.stock_quantity || 0) < 5);
    }, [products]);

    // Scanner State
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const readerRef = useRef<BrowserMultiFormatReader | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const controlsRef = useRef<any>(null);
    const recognitionRef = useRef<any>(null);

    // Initial Fetch
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const tenantId = localStorage.getItem('tenantId');
            if (!tenantId) return;
            await setCurrentTenant(tenantId);

            // Fetch Categories and Customers first
            const [catRes, custRes] = await Promise.all([
                supabase.from('categories').select('*'),
                supabase.from('cari_hesaplar').select('*').eq('hesap_tipi', 'musteri')
            ]);

            if (catRes.data) setCategories(catRes.data);
            if (custRes.data) {
                setCustomers(custRes.data.map((c: any) => ({
                    id: c.id,
                    name: c.unvan,
                    phone: c.telefon
                })));
            }

            // Progressive Product Fetching
            let allProducts: Product[] = [];
            let page = 0;
            const PAGE_SIZE = 1000;
            let hasMore = true;

            while (hasMore) {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('status', 'active')
                    .order('name', { ascending: true })
                    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

                if (error) throw error;

                if (data && data.length > 0) {
                    allProducts = [...allProducts, ...data];
                    setProducts([...allProducts]);

                    if (page === 0) setLoading(false);

                    if (data.length < PAGE_SIZE) {
                        hasMore = false;
                    }
                } else {
                    hasMore = false;
                    if (page === 0) setLoading(false);
                }
                page++;
            }

            // Fetch License for AI Key
            const { data: licenseData } = await supabase
                .from('licenses')
                .select('openrouter_api_key')
                .limit(1)
                .single();

            if (licenseData?.openrouter_api_key) {
                setOpenRouterKey(licenseData.openrouter_api_key);
            }

        } catch (error: any) {
            console.error('POS Data Error:', error);
            toast.error('Hata: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Barcode Map for O(1) Lookups
    const barcodeMap = useMemo(() => {
        const map = new Map();
        products.forEach(p => {
            if (p.barcode) map.set(p.barcode.toLowerCase(), p);
        });
        return map;
    }, [products]);

    // Optimized Filter & Sort Logic
    const filteredProducts = useMemo(() => {
        let result = [...products];

        // 1. Category Filter
        if (selectedCategory !== "all") {
            result = result.filter(p => p.category_id === selectedCategory);
        }

        // 2. Search Filter
        if (search) {
            const lower = search.toLowerCase();
            const exactMatch = barcodeMap.get(lower);
            if (exactMatch) return [exactMatch];

            result = result.filter(p =>
                p.name.toLowerCase().includes(lower) ||
                p.barcode?.includes(lower)
            );
        }

        // 3. Sorting
        result.sort((a, b) => {
            const nameA = a.name || "";
            const nameB = b.name || "";

            if (sortBy === 'name') {
                return nameA.localeCompare(nameB, 'tr');
            } else if (sortBy === 'stock-asc') {
                return (a.stock_quantity || 0) - (b.stock_quantity || 0);
            } else if (sortBy === 'stock-desc') {
                return (b.stock_quantity || 0) - (a.stock_quantity || 0);
            }
            return 0;
        });

        return result;
    }, [products, barcodeMap, selectedCategory, search, sortBy]);

    // Visible slice for performance
    const displayedProducts = useMemo(() => {
        const slice = filteredProducts.slice(0, visibleCount);
        console.log('Displayed Products Count:', slice.length, 'Total Filtered:', filteredProducts.length);
        return slice;
    }, [filteredProducts, visibleCount]);

    // Low Stock Alert Auto-Trigger
    useEffect(() => {
        // Only auto-show if not already dismissed in this session
        if (lowStockAlerts.length > 0 && !isAlertDismissed && !showLowStockModal) {
            setShowLowStockModal(true);
        }
    }, [lowStockAlerts.length, isAlertDismissed]);



    // Voice Recognition Logic
    const startListening = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error("Tarayıcınız ses tanımayı desteklemiyor");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'tr-TR';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);
        recognition.onresult = (event: any) => {
            const text = event.results[0][0].transcript;
            processAICommand(text);
        };

        recognition.start();
        recognitionRef.current = recognition;
    };

    const processAICommand = async (text: string) => {
        if (!openRouterKey) {
            toast.error("AI özelliği henüz yapılandırılmamış (API Key eksik)");
            return;
        }

        setIsProcessingAI(true);
        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${openRouterKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": window.location.origin,
                },
                body: JSON.stringify({
                    model: "google/gemini-2.0-flash-exp:free",
                    messages: [
                        {
                            role: "system",
                            content: `Müşteri şu ürünleri istiyor: "${text}". 
                            Aşağıdaki ürün listesinden en yakın eşleşmeleri bul ve şu formatta JSON döndür: 
                            [{"id": "urun_id", "quantity": sayi}]. 
                            Sadece JSON döndür. 
                            Ürün Listesi: ${JSON.stringify(products.slice(0, 500).map(p => ({ id: p.id, name: p.name })))}`
                        }
                    ],
                    response_format: { type: "json_object" }
                })
            });

            const data = await response.json();
            const resultText = data.choices[0].message.content;
            const matches = JSON.parse(resultText);

            if (matches && Array.isArray(matches)) {
                let addedCount = 0;
                matches.forEach((match: any) => {
                    const product = products.find(p => p.id === match.id);
                    if (product) {
                        for (let i = 0; i < (match.quantity || 1); i++) {
                            addToCart(product);
                        }
                        addedCount++;
                    }
                });
                if (addedCount > 0) toast.success(`${addedCount} farklı ürün eklendi`);
                else toast.error("Ürünler bulunamadı");
            }
        } catch (error) {
            console.error("AI Error:", error);
            toast.error("AI işlemi sırasında hata oluştu");
        } finally {
            setIsProcessingAI(false);
        }
    };

    // Scanner Logic
    useEffect(() => {
        if (isScannerOpen) {
            startScanner();
        } else {
            stopScanner();
        }
        return () => stopScanner();
    }, [isScannerOpen]);

    const startScanner = async () => {
        try {
            // Clean up any previous instance first
            stopScanner();

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                toast.error('Kamera erişimi desteklenmiyor. HTTPS gerekli olabilir.');
                setIsScannerOpen(false);
                return;
            }

            // Wait for video element to be mounted
            await new Promise(resolve => setTimeout(resolve, 300));

            if (!videoRef.current) {
                console.warn('Video element not ready');
                return;
            }

            const reader = new BrowserMultiFormatReader();
            readerRef.current = reader;

            // Let decodeFromVideoDevice handle the camera stream entirely
            // Pass undefined as deviceId to use the default back camera
            const controls = await reader.decodeFromVideoDevice(
                undefined,
                videoRef.current,
                (result) => {
                    if (result) {
                        const barcode = result.getText().toLowerCase();
                        const product = barcodeMap.get(barcode);
                        if (product) {
                            addToCart(product);
                            setIsScannerOpen(false);
                            playBeep();
                        }
                    }
                }
            );
            controlsRef.current = controls;

            // Extract stream reference from video element for cleanup
            if (videoRef.current.srcObject) {
                streamRef.current = videoRef.current.srcObject as MediaStream;
            }

            console.log('✅ POS Scanner started successfully');
        } catch (error) {
            console.error('Kamera hatası:', error);
            toast.error('Kamera açılamadı. Lütfen kamera iznini kontrol edin.');
            setIsScannerOpen(false);
        }
    };

    const stopScanner = () => {
        // 1. Stop decode controls first
        if (controlsRef.current) {
            try { controlsRef.current.stop(); } catch (e) { }
            controlsRef.current = null;
        }

        // 2. Stop all media tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                try { track.stop(); } catch (e) { }
            });
            streamRef.current = null;
        }

        // 3. Also stop tracks from video element directly (belt and suspenders)
        if (videoRef.current && videoRef.current.srcObject) {
            const mediaStream = videoRef.current.srcObject as MediaStream;
            mediaStream.getTracks().forEach(track => {
                try { track.stop(); } catch (e) { }
            });
            videoRef.current.srcObject = null;
        }

        // 4. Clear reader reference
        if (readerRef.current) {
            readerRef.current = null;
        }
    };

    const playBeep = () => {
        try {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = context.createOscillator();
            const gain = context.createGain();
            osc.connect(gain);
            gain.connect(context.destination);
            osc.frequency.setValueAtTime(800, context.currentTime);
            gain.gain.setValueAtTime(0, context.currentTime);
            gain.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
            osc.start();
            osc.stop(context.currentTime + 0.12);
        } catch (e) { }
    };

    // Cart Actions
    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(p => p.id === product.id);
            if (existing) {
                return prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        toast.success(`${product.name} sepete eklendi`);
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

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    // Calculations
    const totalAmount = cart.reduce((sum, item) => sum + (item.sale_price * item.quantity), 0);

    // Checkout Logic
    const handleCheckout = async (method: string) => {
        if (cart.length === 0) return;
        setIsCheckingOut(true);

        try {
            const tenantId = localStorage.getItem('tenantId');
            if (tenantId) {
                console.log('Setting Tenant Context:', tenantId);
                await setCurrentTenant(tenantId);
            }

            const totalCost = cart.reduce((sum, item) => sum + (item.purchase_price * item.quantity), 0);

            // Prepare Data for RPC
            const invoiceData = {
                invoice_number: `PER-${Date.now()}`,
                invoice_type: 'retail',
                invoice_date: new Date().toISOString().split('T')[0],
                cari_id: selectedCustomer?.id || null,
                cari_name: selectedCustomer?.name || 'Perakende Müşterisi',
                grand_total: totalAmount,
                subtotal: totalAmount / 1.2,
                total_vat: totalAmount - (totalAmount / 1.2),
                payment_status: 'paid',
                status: 'approved',
                notes: `Mobil POS Satışı - ${method}`
            };

            const itemsData = cart.map(item => ({
                product_id: item.id,
                item_name: item.name,
                item_code: item.barcode,
                quantity: item.quantity,
                unit_price: item.sale_price,
                line_total: item.sale_price * item.quantity,
                vat_rate: 20
            }));

            // Call the Transactional RPC
            const { data, error } = await supabase.rpc('create_pos_invoice', {
                p_tenant_id: tenantId,
                p_invoice_data: invoiceData,
                p_items_data: itemsData
            });

            if (error) throw error;

            toast.success(`Satış Başarılı! (${method})`);
            setCart([]);
            setShowCart(false);
            fetchData(); // Refresh stocks
        } catch (error: any) {
            console.error('Checkout Error:', error);
            toast.error('Satış işlemi başarısız: ' + error.message);
        } finally {
            setIsCheckingOut(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-background pb-32 overflow-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
            </div>

            {/* Header */}
            <div className="sticky top-0 z-40 glass border-b border-white/5 p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <ShoppingCart className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white leading-none">Hızlı Satış</h1>
                            <p className="text-[10px] text-secondary font-bold tracking-widest uppercase mt-1">Mobil POS Terminali</p>
                        </div>
                    </div>

                    {lowStockAlerts.length > 0 && (
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    console.log('Opening Low Stock Modal');
                                    setShowLowStockModal(true);
                                }}
                                className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center active:scale-95 transition-all shadow-lg"
                            >
                                <Bell className="w-6 h-6 text-rose-500 animate-tada" />
                            </button>
                            <div className="absolute -top-1 -right-1 min-w-[22px] h-5 rounded-full bg-rose-600 border-2 border-[#020617] flex items-center justify-center pointer-events-none shadow-[0_0_15px_rgba(225,29,72,0.6)]">
                                <span className="text-[10px] font-black text-white leading-none px-1.5">
                                    {lowStockAlerts.length > 99 ? '99+' : lowStockAlerts.length}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Search & AI */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-secondary" />
                        </div>
                        <input
                            type="text"
                            placeholder="Ürün ara veya barkod..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-24 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all placeholder:text-secondary/50"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-4">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    startListening();
                                }}
                                disabled={isProcessingAI}
                                className={`p-2 rounded-xl border transition-all ${isListening ? 'bg-red-500 text-white animate-pulse border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-white/5 text-secondary border-white/10 hover:bg-white/10'}`}
                            >
                                {isProcessingAI ? <Loader2 size={20} className="animate-spin" /> : <Mic size={20} />}
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsScannerOpen(true);
                                }}
                                className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30 active:scale-90 transition-all shadow-md"
                            >
                                <Camera size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Categories & Sorting */}
                <div className="space-y-3">
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        <button
                            onClick={() => setSelectedCategory("all")}
                            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${selectedCategory === "all" ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-white/5 text-secondary border-white/10'}`}
                        >
                            TÜMÜ
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${selectedCategory === cat.id ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-white/5 text-secondary border-white/10'}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                        <span className="text-[10px] font-black text-secondary/40 uppercase tracking-widest flex-shrink-0">Sırala:</span>
                        <button
                            onClick={() => setSortBy('name')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold whitespace-nowrap border transition-all ${sortBy === 'name' ? 'bg-white/10 text-white border-white/20' : 'text-secondary border-transparent'}`}
                        >
                            İSİM (A-Z)
                        </button>
                        <button
                            onClick={() => setSortBy('stock-asc')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold whitespace-nowrap border transition-all ${sortBy === 'stock-asc' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'text-secondary border-transparent'}`}
                        >
                            DÜŞÜK STOK
                        </button>
                        <button
                            onClick={() => setSortBy('stock-desc')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold whitespace-nowrap border transition-all ${sortBy === 'stock-desc' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'text-secondary border-transparent'}`}
                        >
                            YÜKSEK STOK
                        </button>
                    </div>
                </div>
            </div>

            {/* Product Grid */}
            <div className="p-4">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {displayedProducts.map(product => (
                            <button
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className="relative group text-left h-48 flex flex-col justify-between bg-white/5 border border-white/5 rounded-2xl p-3 overflow-hidden active:scale-95 transition-all"
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />

                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                        <Package className="w-20 h-20 text-white" />
                                    </div>
                                )}

                                <div className="relative z-20 flex-1">
                                    <div className="bg-black/30 backdrop-blur-md self-start inline-block px-2 py-1 rounded-lg border border-white/10">
                                        <p className="text-[10px] font-mono text-secondary">{product.stock_quantity || 0} Adet</p>
                                    </div>
                                </div>

                                <div className="relative z-20 space-y-1">
                                    <h3 className="text-sm font-bold text-white leading-tight line-clamp-2">{product.name}</h3>
                                    <p className="text-lg font-black text-blue-400">₺{(product.sale_price || 0).toFixed(2)}</p>
                                </div>

                                <div className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                    <Plus className="w-5 h-5 text-white" />
                                </div>
                            </button>
                        ))}

                        {/* Pagination - Load More */}
                        {filteredProducts.length > visibleCount && (
                            <div className="col-span-2 py-10 flex flex-col items-center gap-4">
                                <p className="text-[10px] font-bold text-secondary uppercase tracking-[3px]">
                                    {filteredProducts.length} üründen {visibleCount} tanesi gösteriliyor
                                </p>
                                <button
                                    onClick={() => setVisibleCount(prev => prev + 50)}
                                    className="px-10 py-4 bg-blue-500 hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                                >
                                    Daha Fazla Ürün Yükle
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Floating Cart Indicator */}
            <AnimatePresence>
                {cart.length > 0 && !showCart && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-24 left-4 right-4 z-40"
                    >
                        <button
                            onClick={() => setShowCart(true)}
                            className="w-full bg-blue-600 glass border border-white/20 rounded-2xl p-4 shadow-2xl flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                    <span className="font-black text-white">{cart.reduce((a, b) => a + b.quantity, 0)}</span>
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">Sepet Toplamı</p>
                                    <p className="text-xl font-black text-white">₺{totalAmount.toFixed(2)}</p>
                                </div>
                            </div>
                            <ChevronUp className="w-6 h-6 text-white group-hover:-translate-y-1 transition-transform" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cart Modal / Sheet */}
            <AnimatePresence>
                {showCart && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCart(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 h-[92vh] bg-[#0f172a] rounded-t-[2.5rem] z-50 overflow-hidden flex flex-col border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
                        >
                            {/* Drag Handle */}
                            <div className="w-full h-8 flex items-center justify-center flex-shrink-0" onClick={() => setShowCart(false)}>
                                <div className="w-12 h-1.5 rounded-full bg-white/20" />
                            </div>

                            {/* Cart Header */}
                            <div className="px-6 pb-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                                <h2 className="text-2xl font-black text-white">Sepetim</h2>
                                <button
                                    onClick={() => setCart([])}
                                    className="px-4 py-2 bg-red-500/10 text-red-400 rounded-xl text-xs font-bold border border-red-500/20 hover:bg-red-500/20"
                                >
                                    Temizle
                                </button>
                            </div>

                            {/* Customer Selection */}
                            <div className="px-6 py-3 border-b border-white/5 bg-black/20">
                                <button
                                    onClick={() => setShowCustomerModal(true)}
                                    className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedCustomer ? 'bg-blue-500 text-white' : 'bg-white/10 text-secondary'}`}>
                                            <Users size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] uppercase font-bold text-secondary tracking-wider">Müşteri (Cari)</p>
                                            <p className={`font-bold ${selectedCustomer ? 'text-white' : 'text-white/50'}`}>
                                                {selectedCustomer ? selectedCustomer.name : 'Müşteri Seçiniz'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-white/10 p-1.5 rounded-lg">
                                        {selectedCustomer ? (
                                            <X
                                                size={16}
                                                className="text-white"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedCustomer(null);
                                                }}
                                            />
                                        ) : (
                                            <ChevronRight size={16} className="text-white" />
                                        )}
                                    </div>
                                </button>
                            </div>

                            {/* Cart Items */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {cart.map(item => (
                                    <div key={item.id} className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                                        <div className="w-16 h-16 rounded-xl bg-black/40 overflow-hidden flex-shrink-0">
                                            {item.image_url ? (
                                                <img src={item.image_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <Package className="text-secondary w-6 h-6" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-white text-sm truncate">{item.name}</h3>
                                            <p className="text-[10px] text-secondary font-mono">Birim: ₺{item.sale_price.toFixed(2)}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="font-black text-white">₺{(item.sale_price * item.quantity).toFixed(2)}</div>
                                            <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
                                                <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-white text-secondary transition-colors">
                                                    {item.quantity === 1 ? <Trash2 size={14} className="text-red-400" /> : <Minus size={14} />}
                                                </button>
                                                <span className="text-xs font-bold text-white w-4 text-center">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-white text-secondary transition-colors">
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Totals & Checkout */}
                            <div className="p-6 bg-black/40 border-t border-white/10 space-y-4 flex-shrink-0 pb-12">
                                <div className="flex items-center justify-between">
                                    <span className="text-secondary font-bold">Toplam Tutar</span>
                                    <span className="text-3xl font-black text-white">₺{totalAmount.toFixed(2)}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* NAKİT */}
                                    <button
                                        onClick={() => handleCheckout("NAKİT")}
                                        disabled={isCheckingOut}
                                        className="py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
                                    >
                                        <Banknote className="w-6 h-6 text-white" />
                                        <span className="text-xs font-black text-white uppercase tracking-wider">NAKİT</span>
                                    </button>

                                    {/* KART */}
                                    <button
                                        onClick={() => handleCheckout("KART")}
                                        disabled={isCheckingOut}
                                        className="py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                                    >
                                        <Wallet className="w-6 h-6 text-white" />
                                        <span className="text-xs font-black text-white uppercase tracking-wider">KART</span>
                                    </button>

                                    {/* VERESİYE */}
                                    <button
                                        onClick={() => handleCheckout("VERESİYE")}
                                        disabled={isCheckingOut}
                                        className="py-4 bg-amber-600 hover:bg-amber-500 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-lg shadow-amber-600/20"
                                    >
                                        <Wallet className="w-6 h-6 text-white" />
                                        <span className="text-xs font-black text-white uppercase tracking-wider">VERESİYE</span>
                                    </button>

                                    {/* HAVALE/EFT */}
                                    <button
                                        onClick={() => handleCheckout("HAVALE/EFT")}
                                        disabled={isCheckingOut}
                                        className="py-4 bg-purple-600 hover:bg-purple-500 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-lg shadow-purple-600/20"
                                    >
                                        <Building2 className="w-6 h-6 text-white" />
                                        <span className="text-xs font-black text-white uppercase tracking-wider">HAVALE</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Customer Selection Modal */}
            <AnimatePresence>
                {showCustomerModal && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
                    >
                        <div className="w-full max-w-sm bg-[#0f172a] rounded-3xl border border-white/10 overflow-hidden flex flex-col max-h-[80vh]">
                            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                <h3 className="text-lg font-black text-white">Müşteri Seç</h3>
                                <button onClick={() => setShowCustomerModal(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>

                            <div className="p-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 w-5 h-5 text-secondary" />
                                    <input
                                        type="text"
                                        placeholder="Müşteri ara..."
                                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500/50"
                                        value={customerSearch}
                                        onChange={(e) => setCustomerSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {customers
                                    .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()))
                                    .map(customer => (
                                        <button
                                            key={customer.id}
                                            onClick={() => {
                                                setSelectedCustomer(customer);
                                                setShowCustomerModal(false);
                                                toast.success(`Müşteri seçildi: ${customer.name}`);
                                            }}
                                            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${selectedCustomer?.id === customer.id
                                                ? 'bg-blue-600/20 border-blue-500/50'
                                                : 'bg-white/5 border-white/5 hover:bg-white/10'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                                    {customer.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-bold text-white text-sm">{customer.name}</p>
                                                    <p className="text-xs text-secondary">{customer.phone || 'Telefon yok'}</p>
                                                </div>
                                            </div>
                                            {selectedCustomer?.id === customer.id && (
                                                <CheckCircle className="w-5 h-5 text-blue-400" />
                                            )}
                                        </button>
                                    ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Premium Scanner Modal */}
            <AnimatePresence>
                {isScannerOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black flex flex-col"
                    >
                        {/* Scanner Header with Blur */}
                        <div className="absolute top-0 left-0 right-0 z-[110] p-6 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                                <h3 className="text-lg font-black text-white tracking-widest uppercase">AKILLI TARAYICI</h3>
                            </div>
                            <button
                                onClick={() => setIsScannerOpen(false)}
                                className="w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 text-white hover:bg-white/20 transition-all active:scale-95"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover opacity-80"
                            />

                            {/* Modern Scanning Overlay - Rectangular for Barcodes */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                {/* Visual Frame - Adjusted to Rectangular Shape */}
                                <div className="relative w-[85vw] h-48 max-w-md">
                                    {/* Corner Accents - Futuristic Style */}
                                    <div className="absolute -top-2 -left-2 w-10 h-10 border-t-4 border-l-4 border-blue-500 rounded-tl-xl shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                                    <div className="absolute -top-2 -right-2 w-10 h-10 border-t-4 border-r-4 border-blue-500 rounded-tr-xl shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                                    <div className="absolute -bottom-2 -left-2 w-10 h-10 border-b-4 border-l-4 border-blue-500 rounded-bl-xl shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                                    <div className="absolute -bottom-2 -right-2 w-10 h-10 border-b-4 border-r-4 border-blue-500 rounded-br-xl shadow-[0_0_15px_rgba(59,130,246,0.5)]" />

                                    {/* Laser Line */}
                                    <motion.div
                                        animate={{ top: ['10%', '90%'] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute left-4 right-4 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_20px_rgba(59,130,246,0.8)] z-20"
                                    />

                                    {/* Scanner Pulse Background */}
                                    <div className="absolute inset-0 bg-blue-500/5 backdrop-blur-[1px] rounded-xl border border-white/5" />
                                </div>
                            </div>

                            {/* Blackout mask around the frame - Updated to Rectangle */}
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute inset-0 bg-black/40" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] h-48 max-w-md bg-transparent ring-[1000px] ring-black/60 rounded-xl" />
                            </div>
                        </div>

                        <div className="absolute bottom-12 left-0 right-0 z-[110] px-10 text-center">
                            <div className="inline-block px-6 py-3 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                                <p className="text-secondary text-[10px] font-black uppercase tracking-[3px] animate-pulse">
                                    Barkodu Çerçeveye Hizalayın
                                </p>
                            </div>
                        </div>

                        {/* Ambient Bottom Glow */}
                        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-blue-500/10 to-transparent pointer-events-none" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Low Stock Popup */}
            <AnimatePresence mode="wait">
                {showLowStockModal && (
                    <div className="fixed inset-0 z-[9995] flex items-center justify-center">
                        <motion.div
                            key="stock-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowLowStockModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            key="stock-modal"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-[calc(100%-2rem)] max-w-sm mx-auto z-[9999]"
                        >
                            <div className="bg-[#0f172a] border border-rose-500/30 rounded-[2.5rem] p-7 shadow-[0_0_80px_rgba(0,0,0,0.9)] relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-rose-500 to-transparent animate-pulse" />

                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-rose-500/20 flex items-center justify-center shrink-0 shadow-inner">
                                            <AlertCircle className="w-8 h-8 text-rose-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-white leading-none tracking-tight">Kritik Stok!</h3>
                                            <p className="text-[11px] text-rose-300/40 font-black uppercase tracking-[3px] mt-2">Envanter Uyarısı</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowLowStockModal(false)}
                                        className="p-3 bg-white/5 rounded-2xl text-rose-300/30 hover:bg-white/10 transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="space-y-3 mb-8">
                                    {lowStockAlerts.slice(0, 3).map(p => (
                                        <div key={p.id} className="flex items-center justify-between p-4 bg-white/5 rounded-[1.5rem] border border-white/5 backdrop-blur-md">
                                            <span className="text-sm font-bold text-white truncate max-w-[180px]">{p.name}</span>
                                            <span className="text-xs font-black text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20">
                                                {p.stock_quantity ?? 0} Adet
                                            </span>
                                        </div>
                                    ))}
                                    {lowStockAlerts.length > 3 && (
                                        <div className="text-center py-2">
                                            <span className="text-[10px] text-rose-300/30 uppercase font-black tracking-widest bg-white/5 px-4 py-1.5 rounded-full">
                                                +{lowStockAlerts.length - 3} DİĞER ÜRÜN
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-4">
                                    <button
                                        onClick={() => setShowLowStockModal(false)}
                                        className="w-full py-5 bg-rose-500 hover:bg-rose-600 text-white text-base font-black rounded-[1.5rem] transition-all shadow-2xl shadow-rose-500/30 active:scale-95"
                                    >
                                        ANLADIM, KAPAT
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsAlertDismissed(true);
                                            sessionStorage.setItem('jetpos_low_stock_dismissed', 'true');
                                            setShowLowStockModal(false);
                                        }}
                                        className="w-full py-2 text-[10px] font-black text-rose-300/20 hover:text-rose-300/50 transition-colors uppercase tracking-[4px]"
                                    >
                                        Oturum Boyunca Gizle
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Voice Listening Overlay */}
            <AnimatePresence>
                {isListening && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] bg-blue-600/20 backdrop-blur-md flex flex-col items-center justify-center"
                    >
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full bg-blue-500/20 animate-ping absolute inset-0" />
                            <div className="w-32 h-32 rounded-full bg-blue-500/40 animate-pulse absolute inset-0" />
                            <div className="w-32 h-32 rounded-full border-2 border-white/20 flex items-center justify-center">
                                <Mic size={48} className="text-white animate-bounce" />
                            </div>
                        </div>
                        <p className="mt-8 text-xl font-black text-white tracking-widest uppercase animate-pulse">Sizi Dinliyorum...</p>
                        <p className="mt-2 text-blue-200 text-sm font-medium">"2 ekmek, 1 süt alabilir miyim?"</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <BottomNav />
        </div>
    );
}
