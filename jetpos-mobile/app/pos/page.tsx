"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
import { supabase, setCurrentTenant } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, ShoppingCart, Trash2, Plus, Minus,
    Banknote, Wallet, Building2, CreditCard,
    X, ChevronUp, ChevronDown, Package, CheckCircle,
    Users, ChevronRight, Camera, Mic, Loader2, AlertCircle, Bell
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { offlineDB } from '@/lib/offline-db';
import { SyncService } from '@/lib/sync-service';
import { useLiveQuery } from 'dexie-react-hooks';
import { apiFetch } from '@/lib/api';
import RequirePermission from '@/components/RequirePermission';

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

function POSPageInner() {
    // Data State
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    // Ürün yükleme hatası — sessizce boş liste göstermek yerine ekranda belirt
    const [loadError, setLoadError] = useState<string | null>(null);
    // Ödeal kart ödemesi: idle | sending | waiting
    const [odealPay, setOdealPay] = useState<{ status: string; ref?: string }>({ status: 'idle' });
    const odealPollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const odealChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
    // MÜKERRER SATIŞ KORUMASI: sonuç realtime'dan da poll'dan da gelebilir
    const odealDoneRef = useRef(false);

    // UI State
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [showCart, setShowCart] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [customerSearch, setCustomerSearch] = useState("");

    // Optimization & Sort State
    const [visibleCount, setVisibleCount] = useState(30);
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
        return products.filter((p: Product) => (p.stock_quantity || 0) < 5);
    }, [products]);

    // Scanner State
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const readerRef = useRef<BrowserMultiFormatReader | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const recognitionRef = useRef<any>(null);

    // Initial Fetch
    useEffect(() => {
        fetchData();
        const tenantId = localStorage.getItem('tenantId');
        if (!tenantId) return;
        SyncService.initAutoSync();
        const handleStatus = () => setIsOnline(window.navigator.onLine);
        window.addEventListener('online', handleStatus);
        window.addEventListener('offline', handleStatus);
        return () => {
            window.removeEventListener('online', handleStatus);
            window.removeEventListener('offline', handleStatus);
        };
    }, []);

    const [isOnline, setIsOnline] = useState(SyncService.isOnline());
    const pendingSales = useLiveQuery(() => offlineDB.pending_sales.toArray());
    const pendingCount = pendingSales?.length || 0;

    const fetchData = async () => {
        try {
            const tenantId = localStorage.getItem('tenantId');
            if (!tenantId) return;
            await setCurrentTenant(tenantId);

            if (!SyncService.isOnline()) {
                const local = await offlineDB.products.toArray();
                if (local.length > 0) {
                    setProducts(local);
                    setLoading(false);
                    return;
                }
            }

            const [catRes, custRes] = await Promise.all([
                supabase.from('categories').select('*').eq('tenant_id', tenantId),
                supabase.from('cari_hesaplar').select('*').eq('hesap_tipi', 'musteri').eq('tenant_id', tenantId)
            ]);

            if (catRes.data) setCategories(catRes.data);
            if (custRes.data) {
                setCustomers(custRes.data.map((c: any) => ({
                    id: c.id,
                    name: c.unvan,
                    phone: c.telefon
                })));
            }

            let allProducts: Product[] = [];
            let page = 0;
            const PAGE_SIZE = 1000;
            let hasMore = true;
            let loadErr: string | null = null;

            while (hasMore) {
                const from = page * PAGE_SIZE;
                const to = (page + 1) * PAGE_SIZE - 1;

                // NOT: Burada `status = 'active'` FİLTRESİ YOK.
                // Ürünler sayfasında da yok ve orada liste düzgün geliyordu; POS'ta
                // olduğu için status'ü boş/null ya da farklı yazılmış (Active, aktif…)
                // tüm ürünler POS'ta görünmüyordu. Eleme artık aşağıda, yalnızca
                // AÇIKÇA pasif olanlar için yapılıyor.
                let out = await supabase
                    .from('products')
                    .select('*')
                    .eq('tenant_id', tenantId)
                    .order('name', { ascending: true })
                    .range(from, to);

                // Sıralı sorgu hata verirse (büyük tabloda statement timeout) sırasız dene
                if (out.error) {
                    out = await supabase
                        .from('products')
                        .select('*')
                        .eq('tenant_id', tenantId)
                        .range(from, to);
                }

                if (out.error) { loadErr = out.error.message; break; }

                const rows = out.data || [];
                if (rows.length > 0) {
                    allProducts = [...allProducts, ...rows];
                    setProducts([...allProducts]);
                    if (page === 0) setLoading(false);
                    if (rows.length < PAGE_SIZE) hasMore = false;
                } else {
                    hasMore = false;
                    if (page === 0) setLoading(false);
                }
                page++;
            }

            // Yalnızca AÇIKÇA pasif işaretlenmiş ürünleri gizle.
            // Boş/null status = göster (eski kayıtlar bu yüzden kayboluyordu).
            const PASSIVE = ['passive', 'pasif', 'inactive', 'deleted', 'silindi', 'archived'];
            const visible = allProducts.filter(p => {
                const s = String((p as any).status ?? '').trim().toLowerCase();
                return s === '' || !PASSIVE.includes(s);
            });
            setProducts(visible);

            if (loadErr) {
                setLoadError(`Ürünler eksik yüklendi: ${loadErr}`);
            } else {
                setLoadError(null);
            }

            if (allProducts.length > 0) {
                await offlineDB.products.clear();
                await offlineDB.products.bulkAdd(allProducts.map(p => ({ ...p, tenant_id: tenantId })));
            }

            // AI anahtarı — yoksa/hata verirse ürün yüklemesini ASLA bozmamalı.
            // (Önceden .single() 0 satırda hata fırlatıyor, catch'e düşüp
            //  ürünler gelmiş olsa bile ekrana hata basıyordu.)
            try {
                const { data: licenseData } = await supabase
                    .from('licenses').select('openrouter_api_key').limit(1).maybeSingle();
                if (licenseData?.openrouter_api_key) setOpenRouterKey(licenseData.openrouter_api_key);
            } catch { /* yut */ }

        } catch (error: any) {
            console.error('POS Data Error:', error);
            setLoadError(error?.message || 'Ürünler yüklenemedi.');
            toast.error('Hata: ' + (error?.message || 'Bilinmeyen hata'));
        } finally {
            setLoading(false);
        }
    };

    const barcodeMap = useMemo(() => {
        const map = new Map<string, Product>();
        products.forEach((p: Product) => {
            if (p.barcode) map.set(p.barcode.toLowerCase(), p);
        });
        return map;
    }, [products]);

    const filteredProducts = useMemo(() => {
        let result = [...products];
        if (selectedCategory !== "all") result = result.filter((p: Product) => p.category_id === selectedCategory);
        if (search) {
            const lower = search.toLowerCase();
            const exactMatch = barcodeMap.get(lower);
            if (exactMatch) return [exactMatch];
            result = result.filter((p: Product) =>
                p.name.toLowerCase().includes(lower) || p.barcode?.includes(lower)
            );
        }
        result.sort((a, b) => {
            const nameA = a.name || "";
            const nameB = b.name || "";
            if (sortBy === 'name') return nameA.localeCompare(nameB, 'tr');
            if (sortBy === 'stock-asc') return (a.stock_quantity || 0) - (b.stock_quantity || 0);
            if (sortBy === 'stock-desc') return (b.stock_quantity || 0) - (a.stock_quantity || 0);
            return 0;
        });
        return result;
    }, [products, barcodeMap, selectedCategory, search, sortBy]);

    const displayedProducts = useMemo(() => filteredProducts.slice(0, visibleCount), [filteredProducts, visibleCount]);

    useEffect(() => {
        if (lowStockAlerts.length > 0 && !isAlertDismissed && !showLowStockModal) {
            setShowLowStockModal(true);
        }
    }, [lowStockAlerts.length, isAlertDismissed]);

    const startListening = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error("Tarayıcınız ses tanımayı desteklemiyor");
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = 'tr-TR';
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event: any) => processAICommand(event.results[0][0].transcript);
        recognition.start();
        recognitionRef.current = recognition;
    };

    const processAICommand = async (text: string) => {
        if (!openRouterKey) return toast.error("AI yapılandırılmamış");
        setIsProcessingAI(true);
        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: { "Authorization": `Bearer ${openRouterKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "google/gemini-2.0-flash-exp:free",
                    messages: [{ role: "system", content: `Ürünleri JSON döndür: [{"id": "id", "quantity": n}]. Liste: ${JSON.stringify(products.slice(0, 500).map(p => ({ id: p.id, name: p.name })))} Command: ${text}` }],
                    response_format: { type: "json_object" }
                })
            });
            const data = await response.json();
            const matches = JSON.parse(data.choices[0].message.content);
            if (Array.isArray(matches)) {
                matches.forEach(m => {
                    const p = products.find(prod => prod.id === m.id);
                    if (p) for (let i = 0; i < (m.quantity || 1); i++) addToCart(p);
                });
            }
        } catch (e) { toast.error("AI Hatası"); } finally { setIsProcessingAI(false); }
    };

    const addToCart = (product: Product) => {
        setCart((prev: CartItem[]) => {
            const existing = prev.find((p: CartItem) => p.id === product.id);
            if (existing) return prev.map((p: CartItem) => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p);
            return [...prev, { ...product, quantity: 1 }];
        });
        toast.success(`${product.name} sepette`);
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart((prev: CartItem[]) => prev.map((item: CartItem) => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
    };

    // ══════════ ÖDEAL KART ÖDEMESİ ══════════
    // Akış: sepeti cihaza gönder → sonucu BEKLE → başarılıysa satışı kapat.
    // Sonuç iki yoldan gelebilir:
    //   1) Supabase Broadcast (webhook masaüstüne düşünce oradan yayınlanır) — anında
    //   2) Yedek poll — yayın gelmezse garanti ağ
    // Hangisi önce gelirse satışı O kapatır (odealDoneRef), mükerrer satış olmaz.
    const stopOdealWait = () => {
        if (odealPollRef.current) { clearTimeout(odealPollRef.current); odealPollRef.current = null; }
        if (odealChannelRef.current) {
            try { supabase.removeChannel(odealChannelRef.current); } catch { /* yut */ }
            odealChannelRef.current = null;
        }
    };

    // Bileşen kapanırsa zamanlayıcı/kanal sızıntısı kalmasın
    useEffect(() => () => { stopOdealWait(); }, []);

    const handleOdealCard = async () => {
        if (cart.length === 0) return;

        const items = cart.map((c) => {
            const qty = Number(c.quantity) || 1;
            const unit = Number(c.sale_price) || 0;
            return {
                name: String(c.name || 'Ürün'),
                quantity: qty,
                grossPrice: Number((unit * qty).toFixed(2)), // satır toplamı, KDV dahil
                referenceCode: String(c.id || c.barcode || ''),
                vatRatio: 10,
            };
        });

        if (items.some(it => !(it.grossPrice > 0))) {
            toast.error('Sepette fiyatı 0 olan ürün var.');
            return;
        }

        setIsCheckingOut(true);
        setOdealPay({ status: 'sending' });

        try {
            const res = await apiFetch('/api/odeal/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ total: totalAmount, items }),
            });
            const ref = res?.referenceCode;
            if (!ref) throw new Error('Referans alınamadı');

            setOdealPay({ status: 'waiting', ref });
            stopOdealWait();
            odealDoneRef.current = false;

            const finish = (st: string) => {
                if (odealDoneRef.current) return;   // ilk gelen kazanır
                odealDoneRef.current = true;
                stopOdealWait();
                if (st === 'succeeded') {
                    setOdealPay({ status: 'idle' });
                    completeSale('KART');           // satışı normal akışla kapat
                } else {
                    setOdealPay({ status: 'idle' });
                    setIsCheckingOut(false);
                    toast.error(st === 'cancelled' ? 'Ödeme iptal edildi.' : 'Ödeme başarısız.');
                }
            };

            // 1) Realtime — masaüstü webhook'u alınca bu kanala yayın yapar
            try {
                odealChannelRef.current = supabase
                    .channel(`odeal-tx-${ref}`)
                    .on('broadcast', { event: 'status' }, (msg: { payload?: { status?: string } }) => {
                        const st = String(msg?.payload?.status || '');
                        if (st === 'succeeded' || st === 'failed' || st === 'cancelled') finish(st);
                    })
                    .subscribe();
            } catch { /* realtime kurulamazsa yedek poll devrede */ }

            // 2) Yedek poll — kademeli: ilk 30 sn 2 sn, 30-90 sn 5 sn, sonra 10 sn
            const startedAt = Date.now();
            const nextDelay = () => {
                const el = Date.now() - startedAt;
                return el < 30_000 ? 2000 : el < 90_000 ? 5000 : 10_000;
            };
            const tick = async () => {
                if (odealDoneRef.current) return;
                if (Date.now() - startedAt > 180_000) {  // ~3 dk
                    odealDoneRef.current = true;
                    stopOdealWait();
                    setOdealPay({ status: 'idle' });
                    setIsCheckingOut(false);
                    toast.error('Zaman aşımı. Cihazdan sonucu kontrol edin.');
                    return;
                }
                try {
                    const st = await apiFetch(`/api/odeal/status/${ref}`);
                    if (st?.status === 'succeeded' || st?.status === 'failed' || st?.status === 'cancelled') {
                        finish(st.status);
                        return;
                    }
                } catch { /* poll hatası yut */ }
                if (!odealDoneRef.current) odealPollRef.current = setTimeout(tick, nextDelay());
            };
            odealPollRef.current = setTimeout(tick, nextDelay());

        } catch (e: any) {
            const msg = String(e?.message || '');
            setOdealPay({ status: 'idle' });
            // Ödeal kurulu/aktif değilse sessizce normal KART satışına düş
            if (/ayar yok|kapalı|eksik|tanımlı değil/i.test(msg)) {
                completeSale('KART');
            } else {
                setIsCheckingOut(false);
                toast.error(msg || 'Ödeal\'e gönderilemedi.');
            }
        }
    };

    const handleCheckout = async (method: string) => {
        if (cart.length === 0) return;
        // KART → önce Ödeal cihazına gitmeyi dene
        if (method === 'KART') { handleOdealCard(); return; }
        completeSale(method);
    };

    const completeSale = async (method: string) => {
        if (cart.length === 0) return;
        setIsCheckingOut(true);
        const tenantId = localStorage.getItem('tenantId');
        const activeWhId = localStorage.getItem('activeWarehouseId');
        if (!SyncService.isOnline()) {
            await offlineDB.pending_sales.add({
                uuid: crypto.randomUUID(), tenant_id: tenantId || '', warehouse_id: activeWhId || '',
                items: cart.map(i => ({ product_id: i.id, item_name: i.name, quantity: i.quantity, unit_price: i.sale_price, total_price: i.sale_price * i.quantity })),
                total_amount: totalAmount, discount_amount: 0, payment_type: method, created_at: new Date().toISOString(), sync_status: 'pending'
            });
            toast.warning("Çevrimdışı kaydedildi");
            setCart([]); setShowCart(false); setIsCheckingOut(false);
            return;
        }
        try {
            const invoiceData = { invoice_number: `PER-${Date.now()}`, invoice_type: 'retail', grand_total: totalAmount, cari_id: selectedCustomer?.id || null, payment_status: 'paid', notes: `Mobil POS - ${method}` };
            const itemsData = cart.map(i => ({ product_id: i.id, item_name: i.name, quantity: i.quantity, unit_price: i.sale_price, line_total: i.sale_price * i.quantity }));
            const { error } = await supabase.rpc('create_pos_invoice', { p_tenant_id: tenantId, p_invoice_data: invoiceData, p_items_data: itemsData });
            if (error) throw error;
            toast.success(`Satış Tamamlandı!`);
            setCart([]); setShowCart(false); fetchData();
        } catch (e: any) { toast.error(e.message); } finally { setIsCheckingOut(false); }
    };

    const totalAmount = cart.reduce((sum: number, item: CartItem) => sum + (item.sale_price * item.quantity), 0);

    return (
        <div className="relative min-h-screen bg-background pb-32 overflow-x-hidden container-safe">
            {/* ══ ÖDEAL BEKLEME EKRANI — kart cihazda okutulurken ══ */}
            <AnimatePresence>
                {odealPay.status !== 'idle' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-[#020617]/95 backdrop-blur-md flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                            className="w-full max-w-sm text-center space-y-6"
                        >
                            <div className="relative w-24 h-24 mx-auto">
                                <div className="absolute inset-0 rounded-full border-4 border-[#2563FF]/10" />
                                <div className="absolute inset-0 rounded-full border-4 border-[#2563FF] border-t-transparent animate-spin" />
                                <CreditCard className="absolute inset-0 m-auto w-10 h-10 text-[#6FD3FF]" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-white tracking-tight">
                                    {odealPay.status === 'sending' ? 'Cihaza Gönderiliyor' : 'Kartı Okutun'}
                                </h2>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    {odealPay.status === 'sending'
                                        ? 'Sepet ödeme cihazına aktarılıyor...'
                                        : 'Ödeme cihazında işlemi tamamlayın. Sonuç otomatik gelecek.'}
                                </p>
                            </div>
                            <p className="text-3xl font-black text-[#6FD3FF] tracking-tighter">
                                ₺{totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </p>
                            {odealPay.status === 'waiting' && (
                                <button
                                    onClick={() => { odealDoneRef.current = true; stopOdealWait(); setOdealPay({ status: 'idle' }); setIsCheckingOut(false); }}
                                    className="w-full py-3 rounded-2xl glass-dark border border-white/10 text-slate-300 text-sm font-bold active:scale-95 transition-all"
                                >
                                    Bekleme Ekranını Kapat
                                </button>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-[#2563FF]/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[40%] bg-[#1E90FF]/10 rounded-full blur-[120px]" />
            </div>

            <header className="sticky top-0 z-50 glass border-b border-[#2D6BFF]/10 p-4 pt-[env(safe-area-inset-top,1rem)] space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 shrink-0 rounded-xl glass-dark border border-[#2D6BFF]/20 flex items-center justify-center shadow-lg">
                            <ShoppingCart className="w-5 h-5 text-[#6FD3FF]" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl font-black text-white leading-none truncate">JetKasa</h1>
                            <div className="flex items-center gap-1.5 mt-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-rose-500'}`} />
                                <p className={`text-[10px] font-black tracking-widest uppercase ${isOnline ? 'text-[#5B8CFF]' : 'text-rose-500'}`}>
                                    {isOnline ? 'ONLINE' : 'OFFLINE'}
                                </p>
                                {pendingCount > 0 && <p className="text-[10px] font-black text-[#6FD3FF] uppercase ml-2">({pendingCount} Bekliyor)</p>}
                            </div>
                        </div>
                    </div>
                    {lowStockAlerts.length > 0 && (
                        <button onClick={() => setShowLowStockModal(true)} className="relative w-11 h-11 shrink-0 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center active:scale-95 transition-all">
                            <Bell className="w-5 h-5 text-rose-400 animate-bounce" />
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-[10px] font-black text-white flex items-center justify-center border-2 border-[#050B1A]">
                                {lowStockAlerts.length > 9 ? '9+' : lowStockAlerts.length}
                            </div>
                        </button>
                    )}
                </div>

                <div className="flex gap-2">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5B8CFF]" />
                        <input
                            type="text"
                            placeholder="Ürün veya barkod..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-12 glass-dark border border-[#2D6BFF]/20 rounded-2xl pl-11 pr-24 text-xs font-black text-white placeholder-slate-600 outline-none focus:border-[#2563FF]/50"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <button onClick={startListening} className={`p-2 rounded-xl border transition-all ${isListening ? 'bg-red-500 text-white border-red-400' : 'bg-white/5 border-white/5 text-[#5B8CFF]'}`}>
                                {isProcessingAI ? <Loader2 size={18} className="animate-spin" /> : <Mic size={18} />}
                            </button>
                            <button onClick={() => setIsScannerOpen(true)} className="p-2 bg-[#2563FF]/20 text-[#6FD3FF] rounded-xl border border-[#2D6BFF]/30 active:scale-90 transition-all">
                                <Camera size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
                        <button onClick={() => setSelectedCategory("all")} className={`px-4 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${selectedCategory === "all" ? 'bg-[#2563FF] text-white border-[#4DA3FF] shadow-lg shadow-[#2563FF]/20' : 'glass-dark text-slate-500 border-white/5'}`}>
                            TÜMÜ
                        </button>
                        {categories.map((cat) => (
                            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-4 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${selectedCategory === cat.id ? 'bg-[#2563FF] text-white border-[#4DA3FF]' : 'glass-dark text-slate-500 border-white/5'}`}>
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="p-4 sm:p-6 grid grid-cols-2 gap-3 sm:gap-4 relative z-10">
                {loadError && (
                    <div className="col-span-2 flex items-start gap-3 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                        <p className="text-[11px] font-bold text-rose-300 leading-relaxed flex-1">{loadError}</p>
                        <button onClick={() => { setLoading(true); setLoadError(null); fetchData(); }}
                            className="text-[10px] font-black uppercase tracking-widest text-rose-200 underline shrink-0">
                            Tekrar Dene
                        </button>
                    </div>
                )}
                {loading ? (
                    <div className="col-span-2 flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-[#2563FF]/10 border-t-[#2563FF] rounded-full animate-spin" />
                    </div>
                ) : displayedProducts.length === 0 ? (
                    <div className="col-span-2 text-center py-16 space-y-3">
                        <Package className="w-12 h-12 mx-auto text-white/10" />
                        <p className="text-sm font-bold text-white/40">
                            {search || selectedCategory !== 'all' ? 'Aramanıza uygun ürün yok' : 'Bu işletmede kayıtlı ürün bulunamadı'}
                        </p>
                        {!search && selectedCategory === 'all' && (
                            <button onClick={() => { setLoading(true); fetchData(); }}
                                className="text-[10px] font-black uppercase tracking-widest text-[#5B8CFF] underline">
                                Yeniden Yükle
                            </button>
                        )}
                    </div>
                ) : (
                    displayedProducts.map((p) => (
                        <button key={p.id} onClick={() => addToCart(p)} className="relative group text-left h-44 sm:h-52 glass-dark border border-[#2D6BFF]/10 rounded-[1.75rem] p-3 overflow-hidden active:scale-95 transition-all">
                            <div className="absolute inset-0 bg-gradient-to-t from-[#050B1A]/95 via-[#050B1A]/40 to-transparent z-10" />
                            {p.image_url ? <img src={p.image_url} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" /> : <div className="absolute inset-0 flex items-center justify-center opacity-5"><Package size={80} /></div>}
                            <div className="relative z-20 flex flex-col h-full justify-between">
                                <div className="px-2 py-1 glass border border-white/10 rounded-lg self-start">
                                    <p className="text-[9px] font-black text-[#5B8CFF] uppercase tracking-widest leading-none">{p.stock_quantity || 0} Adet</p>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xs sm:text-sm font-black text-white leading-tight line-clamp-2 uppercase tracking-tight">{p.name?.trim() || p.barcode || 'İsimsiz Ürün'}</h3>
                                    <p className="text-lg font-black text-[#6FD3FF] tracking-tighter">₺{(p.sale_price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                                </div>
                            </div>
                        </button>
                    ))
                )}
                {filteredProducts.length > visibleCount && (
                    <div className="col-span-2 py-10 flex flex-col items-center gap-4">
                        <button onClick={() => setVisibleCount(v => v + 50)} className="w-full h-14 glass-dark border border-[#2D6BFF]/20 text-[10px] font-black uppercase tracking-[3px] text-white rounded-2xl hover:bg-[#2563FF]/10 active:scale-[0.98] transition-all">Daha Fazla Yükle</button>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {cart.length > 0 && !showCart && (
                    <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-24 left-4 right-4 z-40">
                        <button onClick={() => setShowCart(true)} className="w-full h-16 bg-[#2563FF] border border-[#4DA3FF]/50 rounded-2xl px-5 shadow-[0_10px_30px_rgba(37,99,255,0.4)] flex items-center justify-between group overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"><span className="font-black text-white text-sm">{cart.reduce((a, b) => a + b.quantity, 0)}</span></div>
                                <div className="text-left">
                                    <p className="text-[8px] font-black text-white/60 uppercase tracking-[2px] leading-none">Toplam Tutar</p>
                                    <p className="text-lg font-black text-white leading-none mt-1">₺{totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                                </div>
                            </div>
                            <ChevronUp className="w-6 h-6 text-white" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showCart && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCart(false)} className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110]" />
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30 }} className="fixed bottom-0 left-0 right-0 sheet-h-92 bg-[#0B1328] rounded-t-[2.5rem] z-[120] overflow-hidden flex flex-col border-t border-[#2D6BFF]/20 shadow-2xl container-safe">
                            <div className="w-full h-8 shrink-0 flex items-center justify-center" onClick={() => setShowCart(false)}><div className="w-12 h-1.5 rounded-full bg-white/10" /></div>
                            <div className="px-6 pb-4 border-b border-white/5 flex items-center justify-between shrink-0">
                                <h2 className="text-2xl font-black text-white tracking-tight">SEPETİM</h2>
                                <button onClick={() => setCart([])} className="px-4 py-2 bg-rose-500/10 text-rose-500 rounded-xl text-[10px] font-black border border-rose-500/20 uppercase tracking-widest">Temizle</button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                                {cart.map((i) => (
                                    <div key={i.id} className="flex items-center gap-4 glass-dark p-4 rounded-[1.75rem] border border-white/5">
                                        <div className="w-14 h-14 rounded-xl bg-black/40 shrink-0 flex items-center justify-center border border-white/5 overflow-hidden">
                                            {i.image_url ? <img src={i.image_url} className="w-full h-full object-cover" /> : <Package className="text-slate-700 w-6 h-6" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-black text-white text-sm truncate uppercase tracking-tight">{i.name?.trim() || i.barcode || 'İsimsiz Ürün'}</h3>
                                            <p className="text-[10px] text-[#5B8CFF] font-black mt-0.5">₺{i.sale_price.toLocaleString('tr-TR')}</p>
                                        </div>
                                        <div className="flex items-center gap-3 bg-black/30 p-1.5 rounded-xl border border-white/5">
                                            <button onClick={() => updateQuantity(i.id, -1)} className="p-1.5 text-slate-500 hover:text-white transition-colors">{i.quantity === 1 ? <Trash2 size={16} className="text-rose-500" /> : <Minus size={16} />}</button>
                                            <span className="text-sm font-black text-white w-6 text-center">{i.quantity}</span>
                                            <button onClick={() => updateQuantity(i.id, 1)} className="p-1.5 text-slate-500 hover:text-white transition-colors"><Plus size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-6 bg-[#050B1A] border-t border-[#2D6BFF]/10 space-y-5 shrink-0 pb-[env(safe-area-inset-bottom,2rem)]">
                                <div className="flex items-end justify-between px-2">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[4px]">TOPLAM TUTAR</span>
                                    <span className="text-3xl font-black text-white tracking-tighter">₺{totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                    {[ {l: 'NAKİT', i: Banknote, c: 'bg-emerald-500'}, {l: 'KART', i: CreditCard, c: 'bg-[#2563FF]'}, {l: 'VERESİYE', i: Users, c: 'bg-amber-500'}, {l: 'HAVALE', i: Building2, c: 'bg-purple-600'}].map((m) => (
                                        <button key={m.l} onClick={() => handleCheckout(m.l)} disabled={isCheckingOut} className={`h-16 ${m.c} rounded-2xl flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-all border border-white/10 group overflow-hidden relative`}>
                                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                                            <m.i className="w-6 h-6 text-white relative z-10" />
                                            <span className="text-[10px] font-black text-white uppercase tracking-[2px] relative z-10">{m.l}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <BottomNav />
        </div>
    );
}

// Yetki koruması: işletmede çalışan girişi açıksa PIN + can_access_pos zorunlu.
export default function POSPage() {
    return (
        <RequirePermission perm="can_access_pos" title="Satış Girişi">
            <POSPageInner />
        </RequirePermission>
    );
}
