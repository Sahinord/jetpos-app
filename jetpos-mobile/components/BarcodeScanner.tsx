"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Camera, X, Flashlight, ScanLine, Plus, Package, Save, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from './ProductCard';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function BarcodeScanner() {
    const [scanning, setScanning] = useState(false);
    const [product, setProduct] = useState<any>(null);
    const [torchOn, setTorchOn] = useState(false);
    const [manualBarcode, setManualBarcode] = useState('');
    const [fetching, setFetching] = useState(false);

    // New Product Creation state
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [scannedBarcode, setScannedBarcode] = useState('');
    const [categories, setCategories] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: '',
        barcode: '',
        purchase_price: 0,
        sale_price: 0,
        vat_rate: 20,
        stock_quantity: 0,
        category_id: '',
        unit: 'Adet',
        status: 'active',
    });

    const videoRef = useRef<HTMLVideoElement>(null);
    const readerRef = useRef<BrowserMultiFormatReader | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const controlsRef = useRef<any>(null);

    const isProcessing = useRef(false);
    const scannerActive = useRef(false);

    useEffect(() => {
        if (scanning) {
            isProcessing.current = false;
            scannerActive.current = true;
            startScanner();
        } else {
            stopScanner();
        }
        return () => stopScanner();
    }, [scanning]);

    // Fetch categories for the create form
    useEffect(() => {
        const fetchCategories = async () => {
            const tenantId = localStorage.getItem('tenantId');
            if (tenantId) {
                await supabase.rpc('set_current_tenant', { tenant_id: tenantId });
            }
            const { data } = await supabase.from('categories').select('*');
            if (data) setCategories(data);
        };
        fetchCategories();
    }, []);

    const startScanner = async () => {
        try {
            // Clean up previous instance WITHOUT calling stopScanner
            if (controlsRef.current) {
                try { controlsRef.current.stop(); } catch (e) { }
                controlsRef.current = null;
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => {
                    try { track.stop(); } catch (e) { }
                });
                streamRef.current = null;
            }
            if (videoRef.current && videoRef.current.srcObject) {
                const ms = videoRef.current.srcObject as MediaStream;
                ms.getTracks().forEach(track => { try { track.stop(); } catch (e) { } });
                videoRef.current.srcObject = null;
            }
            if (readerRef.current) {
                readerRef.current = null;
            }

            scannerActive.current = true;
            isProcessing.current = false;

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                const isHttps = window.location.protocol === 'https:';
                const errorMsg = !isHttps
                    ? '🔒 Kamera erişimi için HTTPS gerekli!\n\nLütfen ngrok veya HTTPS ile erişin.'
                    : '📱 Tarayıcınız kamera API\'sini desteklemiyor.';
                toast.error(errorMsg, { id: 'camera-error' });
                setScanning(false);
                return;
            }

            // Poll for video element (AnimatePresence may delay mounting)
            let videoEl = videoRef.current;
            if (!videoEl) {
                for (let i = 0; i < 20; i++) {
                    await new Promise(r => setTimeout(r, 100));
                    videoEl = videoRef.current;
                    if (videoEl) break;
                }
            }
            if (!videoEl) {
                toast.error('Kamera başlatılamadı, tekrar deneyin.', { id: 'camera-error' });
                setScanning(false);
                return;
            }

            const reader = new BrowserMultiFormatReader();
            readerRef.current = reader;

            const controls = await reader.decodeFromVideoDevice(
                undefined,
                videoEl,
                (result, error) => {
                    if (!scannerActive.current || isProcessing.current) return;
                    if (!result) return;

                    const barcode = result.getText();
                    if (!barcode || barcode.length < 3) return;

                    isProcessing.current = true;
                    scannerActive.current = false;

                    handleBarcodeDetected(barcode);
                }
            );
            controlsRef.current = controls;

            if (videoEl.srcObject) {
                streamRef.current = videoEl.srcObject as MediaStream;
            }

            console.log('✅ Scanner started successfully');
        } catch (error) {
            console.error('Kamera erişim hatası:', error);
            toast.error('Kamera açılamadı. Lütfen kamera iznini verin.', { id: 'camera-error' });
            setScanning(false);
        }
    };

    const stopScanner = () => {
        scannerActive.current = false;

        if (controlsRef.current) {
            try { controlsRef.current.stop(); } catch (e) { }
            controlsRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                try { track.stop(); } catch (e) { }
            });
            streamRef.current = null;
        }

        if (videoRef.current && videoRef.current.srcObject) {
            const mediaStream = videoRef.current.srcObject as MediaStream;
            mediaStream.getTracks().forEach(track => {
                try { track.stop(); } catch (e) { }
            });
            videoRef.current.srcObject = null;
        }

        if (readerRef.current) {
            readerRef.current = null;
        }
    };

    const handleBarcodeDetected = async (barcode: string) => {
        isProcessing.current = true;
        scannerActive.current = false;

        console.log('Barkod okundu:', barcode);

        if (navigator.vibrate) {
            try { navigator.vibrate([50, 30, 50]); } catch (e) { }
        }

        playBeep();

        if (torchOn && streamRef.current) {
            try {
                const track = streamRef.current.getVideoTracks()[0];
                await track.applyConstraints({
                    advanced: [{ torch: false } as any]
                });
                setTorchOn(false);
            } catch (error) { }
        }

        stopScanner();
        setScanning(false);

        try {
            setFetching(true);
            const tenantId = localStorage.getItem('tenantId');
            if (tenantId) {
                await supabase.rpc('set_current_tenant', { tenant_id: tenantId });
            }

            const { data, error } = await supabase
                .from('products')
                .select('*, categories(name)')
                .eq('barcode', barcode)
                .eq('tenant_id', tenantId)
                .single();

            if (data) {
                setProduct(data);
                toast.success('Ürün bulundu!', { id: 'scan-result' });
                setManualBarcode('');
            } else {
                // Product not found → show create form with barcode pre-filled
                setScannedBarcode(barcode);
                setNewProduct({
                    name: '',
                    barcode: barcode,
                    purchase_price: 0,
                    sale_price: 0,
                    vat_rate: 20,
                    stock_quantity: 0,
                    category_id: '',
                    unit: 'Adet',
                    status: 'active',
                });
                setShowCreateForm(true);
                toast.info('Ürün bulunamadı — yeni ürün oluşturabilirsiniz', { id: 'scan-result' });
            }
        } catch (error) {
            console.error('Ürün sorgulanırken hata:', error);
            // Also show create form on error (product not found returns error with .single())
            setScannedBarcode(barcode);
            setNewProduct({
                name: '',
                barcode: barcode,
                purchase_price: 0,
                sale_price: 0,
                vat_rate: 20,
                stock_quantity: 0,
                category_id: '',
                unit: 'Adet',
                status: 'active',
            });
            setShowCreateForm(true);
            toast.info('Ürün bulunamadı — yeni ürün oluşturabilirsiniz', { id: 'scan-result' });
        } finally {
            setFetching(false);
        }
    };

    const handleCreateProduct = async () => {
        if (!newProduct.name.trim()) {
            toast.error('Ürün adı zorunludur', { id: 'create-error' });
            return;
        }
        if (!newProduct.sale_price || newProduct.sale_price <= 0) {
            toast.error('Satış fiyatı giriniz', { id: 'create-error' });
            return;
        }

        setSaving(true);
        try {
            const tenantId = localStorage.getItem('tenantId');
            if (tenantId) {
                await supabase.rpc('set_current_tenant', { tenant_id: tenantId });
            }

            const { data, error } = await supabase
                .from('products')
                .insert({
                    ...newProduct,
                    tenant_id: tenantId,
                })
                .select('*, categories(name)')
                .single();

            if (error) throw error;

            toast.success('✅ Ürün başarıyla oluşturuldu!', { id: 'create-success' });
            setShowCreateForm(false);
            setProduct(data);
        } catch (error: any) {
            console.error('Ürün oluşturma hatası:', error);
            toast.error('Ürün oluşturulamadı: ' + (error?.message || 'Bilinmeyen hata'), { id: 'create-error' });
        } finally {
            setSaving(false);
        }
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualBarcode.trim()) {
            handleBarcodeDetected(manualBarcode.trim());
        } else {
            toast.error('Lütfen bir barkod girin', { id: 'manual-error' });
        }
    };

    const toggleTorch = async () => {
        if (streamRef.current) {
            const track = streamRef.current.getVideoTracks()[0];
            const capabilities: any = track.getCapabilities();

            if (capabilities.torch) {
                await track.applyConstraints({
                    advanced: [{ torch: !torchOn } as any]
                });
                setTorchOn(!torchOn);
            } else {
                toast.error('Flaş desteklenmiyor', { id: 'torch-error' });
            }
        }
    };

    const playBeep = () => {
        try {
            const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return;

            const audioContext = new AudioContextClass();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.3;

            oscillator.start();
            setTimeout(() => {
                try {
                    oscillator.stop();
                    audioContext.close();
                } catch (e) { }
            }, 100);
        } catch (error) { }
    };

    const handleScanAgain = useCallback(() => {
        setProduct(null);
        setShowCreateForm(false);
        isProcessing.current = false;
        scannerActive.current = false;
        setTimeout(() => {
            setScanning(true);
        }, 300);
    }, []);

    const handleClose = useCallback(() => {
        setProduct(null);
        setShowCreateForm(false);
        setScanning(false);
        isProcessing.current = false;
        scannerActive.current = false;
    }, []);

    // Calculate profit for create form
    const netProfit = newProduct.sale_price - newProduct.purchase_price;
    const profitPercentage = newProduct.purchase_price > 0
        ? ((netProfit / newProduct.purchase_price) * 100).toFixed(0)
        : '0';

    return (
        <div className="relative min-h-screen bg-background overflow-x-hidden">
            {/* Background Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] animate-pulse" />
            </div>

            {/* Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="sticky top-0 z-[60] glass border-b border-white/5 px-6 py-4 flex items-center justify-between"
            >
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            if (scanning) stopScanner();
                            window.history.back();
                        }}
                        className="w-10 h-10 rounded-xl glass-dark border border-white/10 flex items-center justify-center active:scale-90 transition-all"
                    >
                        <X size={20} className="text-secondary" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black bg-gradient-to-r from-blue-400 to-accent bg-clip-text text-transparent tracking-tight">
                            JETPOS <span className="text-foreground">MOBILE</span>
                        </h1>
                        <p className="text-[10px] font-bold text-secondary uppercase tracking-[3px]">Next-Gen Scanner</p>
                    </div>
                </div>
                <div className="w-10 h-10 rounded-xl glass-dark flex items-center justify-center border border-white/10">
                    <div className={`w-2 h-2 rounded-full ${scanning ? 'bg-blue-500' : 'bg-emerald-500'} animate-pulse`} />
                </div>
            </motion.div>

            {/* Main Content */}
            <div className="p-6 relative z-10 space-y-8">
                <AnimatePresence mode="wait">
                    {!scanning && !product && !showCreateForm ? (
                        <motion.div
                            key="initial"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-10"
                        >
                            {/* Visual Scanner Area */}
                            <div className="relative group">
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setScanning(true)}
                                    className="w-full aspect-square glass-dark rounded-[3rem] border-white/10 flex flex-col items-center justify-center gap-6 relative overflow-hidden group transition-all hover:border-blue-500/30 shadow-2xl"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="relative w-24 h-24 flex items-center justify-center">
                                        <div className="absolute inset-0 bg-blue-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all" />
                                        <Camera className="w-16 h-16 text-blue-400 relative z-10" />
                                    </div>

                                    <div className="text-center relative z-10">
                                        <h3 className="text-2xl font-black text-white tracking-tight">Kamerayı Aç</h3>
                                        <p className="text-secondary text-sm font-medium mt-1">Barkodları otomatik tara</p>
                                    </div>

                                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent -translate-y-full group-hover:animate-[scan_2s_infinite]" />
                                </motion.button>
                            </div>

                            {/* Divider */}
                            <div className="flex items-center gap-6 px-4">
                                <div className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent" />
                                <span className="text-[10px] font-black text-secondary uppercase tracking-[4px]">Manuel</span>
                                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                            </div>

                            {/* Manual Form */}
                            <motion.form
                                onSubmit={handleManualSubmit}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="relative"
                            >
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                        <ScanLine className="w-5 h-5 text-secondary" />
                                    </div>
                                    <input
                                        type="text"
                                        value={manualBarcode}
                                        onChange={(e) => setManualBarcode(e.target.value)}
                                        placeholder="Barkodu elle yazın..."
                                        className="w-full h-16 glass-dark rounded-2xl pl-14 pr-32 text-white font-mono text-lg outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all"
                                    />
                                    <div className="absolute right-2 top-2 bottom-2">
                                        <button
                                            type="submit"
                                            disabled={fetching || !manualBarcode}
                                            className="h-full px-8 bg-blue-500 hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {fetching ? (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                'Sorgula'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.form>
                        </motion.div>
                    ) : scanning ? (
                        <motion.div
                            key="scanning"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="relative flex flex-col"
                        >
                            <div className="relative aspect-[4/5] max-h-[55vh] rounded-[2rem] overflow-hidden glass-dark border-2 border-white/10 shadow-3xl">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                />

                                {/* Scanning Overlay */}
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/30" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[65%] aspect-square">
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-blue-400 rounded-tl-xl" />
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-blue-400 rounded-tr-xl" />
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-blue-400 rounded-bl-xl" />
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-blue-400 rounded-br-xl" />
                                    </div>
                                    <div className="absolute left-[17.5%] right-[17.5%] top-0 h-0.5 bg-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.8)] animate-[scan_3s_infinite]" />
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex justify-center gap-4 mt-4 px-4">
                                <button
                                    onClick={toggleTorch}
                                    className={`w-14 h-14 rounded-2xl glass backdrop-blur-2xl flex items-center justify-center transition-all border border-white/10 ${torchOn ? 'bg-amber-500/90 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'text-white'
                                        }`}
                                >
                                    <Flashlight className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={() => setScanning(false)}
                                    className="flex-1 h-14 bg-red-500/90 backdrop-blur-2xl rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
                                >
                                    Okumayı Durdur
                                </button>
                            </div>

                            <div className="mt-6 text-center">
                                <motion.div
                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="inline-flex items-center gap-3 px-6 py-2 glass rounded-full"
                                >
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-white uppercase tracking-[4px]">Barkod Aranıyor</span>
                                </motion.div>
                            </div>
                        </motion.div>

                    ) : showCreateForm ? (
                        /* ===== NEW PRODUCT CREATION FORM ===== */
                        <motion.div
                            key="create-form"
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-5"
                        >
                            {/* Header */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleClose}
                                    className="w-10 h-10 rounded-xl glass-dark border border-white/10 flex items-center justify-center active:scale-90 transition-all"
                                >
                                    <ArrowLeft size={18} className="text-secondary" />
                                </button>
                                <div className="flex-1">
                                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                                        <Plus size={20} className="text-emerald-400" />
                                        Yeni Ürün Oluştur
                                    </h2>
                                    <p className="text-xs text-secondary mt-0.5">Barkod tarandı, ürün bulunamadı</p>
                                </div>
                            </div>

                            {/* Barcode Badge */}
                            <div className="glass-dark rounded-2xl p-4 border border-blue-500/20 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                    <ScanLine className="w-6 h-6 text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-secondary uppercase tracking-[2px]">Okunan Barkod</p>
                                    <p className="text-lg font-mono font-bold text-blue-400 truncate">{scannedBarcode}</p>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-4">
                                {/* Product Name */}
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Ürün Adı *</label>
                                    <input
                                        type="text"
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                        placeholder="Örn: Dana Kuşbaşı"
                                        className="w-full h-14 glass-dark rounded-xl px-4 text-white text-base outline-none focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-white/20"
                                        autoFocus
                                    />
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Kategori</label>
                                    <select
                                        value={newProduct.category_id}
                                        onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
                                        className="w-full h-14 glass-dark rounded-xl px-4 text-white text-base outline-none focus:ring-2 focus:ring-blue-500/30 transition-all appearance-none bg-transparent"
                                    >
                                        <option value="" className="bg-slate-900">Kategori Seçin</option>
                                        {categories.map((cat: any) => (
                                            <option key={cat.id} value={cat.id} className="bg-slate-900">{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Barcode (read-only) */}
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Barkod Numarası</label>
                                    <input
                                        type="text"
                                        value={newProduct.barcode}
                                        readOnly
                                        className="w-full h-14 glass-dark rounded-xl px-4 text-blue-400 font-mono text-base outline-none opacity-70 cursor-not-allowed"
                                    />
                                </div>

                                {/* Price Row */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Alış Fiyatı (₺)</label>
                                        <input
                                            type="number"
                                            value={newProduct.purchase_price === 0 ? '' : newProduct.purchase_price}
                                            onChange={(e) => setNewProduct({ ...newProduct, purchase_price: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                                            placeholder="0"
                                            className="w-full h-14 glass-dark rounded-xl px-4 text-white text-base outline-none focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-white/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Satış Fiyatı (₺) *</label>
                                        <input
                                            type="number"
                                            value={newProduct.sale_price === 0 ? '' : newProduct.sale_price}
                                            onChange={(e) => setNewProduct({ ...newProduct, sale_price: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                                            placeholder="0"
                                            className="w-full h-14 glass-dark rounded-xl px-4 text-white text-base outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all placeholder:text-white/20"
                                        />
                                    </div>
                                </div>

                                {/* Profit Analysis */}
                                {(newProduct.purchase_price > 0 || newProduct.sale_price > 0) && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="glass-dark rounded-xl p-4 border border-dashed border-white/10"
                                    >
                                        <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-2">📊 Kar Analizi</p>
                                        <div className="flex justify-between">
                                            <div>
                                                <p className="text-xs text-secondary">Net Kar</p>
                                                <p className={`text-lg font-black ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>₺{netProfit.toFixed(2)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-secondary">Kar Oranı</p>
                                                <p className={`text-lg font-black ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>%{profitPercentage}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* KDV & Stock Row */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">KDV Oranı</label>
                                        <select
                                            value={newProduct.vat_rate}
                                            onChange={(e) => setNewProduct({ ...newProduct, vat_rate: parseInt(e.target.value) })}
                                            className="w-full h-14 glass-dark rounded-xl px-4 text-white text-base outline-none focus:ring-2 focus:ring-blue-500/30 transition-all appearance-none bg-transparent"
                                        >
                                            <option value={1} className="bg-slate-900">%1</option>
                                            <option value={10} className="bg-slate-900">%10</option>
                                            <option value={20} className="bg-slate-900">%20</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2 flex items-center justify-between">
                                            <span>Stok</span>
                                            <div className="flex bg-white/5 rounded-lg p-0.5">
                                                {['Adet', 'KG'].map((u) => (
                                                    <button
                                                        key={u}
                                                        type="button"
                                                        onClick={() => setNewProduct({ ...newProduct, unit: u })}
                                                        className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${newProduct.unit === u ? 'bg-blue-500 text-white' : 'text-secondary'}`}
                                                    >
                                                        {u}
                                                    </button>
                                                ))}
                                            </div>
                                        </label>
                                        <input
                                            type="number"
                                            value={newProduct.stock_quantity === 0 ? '' : newProduct.stock_quantity}
                                            onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                                            placeholder="0"
                                            step="0.001"
                                            className="w-full h-14 glass-dark rounded-xl px-4 text-white text-lg font-bold outline-none focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-white/20"
                                        />
                                    </div>
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-3">Ürün Durumu</label>
                                    <div className="flex items-center gap-2">
                                        {[
                                            { id: 'active', label: 'AKTİF', color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' },
                                            { id: 'pending', label: 'BEKLEMEDE', color: 'border-amber-500/30 text-amber-400 bg-amber-500/10' },
                                            { id: 'passive', label: 'PASİF', color: 'border-rose-500/30 text-rose-400 bg-rose-500/10' }
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => setNewProduct({ ...newProduct, status: opt.id })}
                                                className={`flex-1 py-3 rounded-xl border-2 transition-all font-black text-[10px] uppercase tracking-widest ${newProduct.status === opt.id
                                                    ? `${opt.color} scale-[1.02] shadow-lg`
                                                    : 'border-white/5 text-secondary/30 bg-transparent'
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleScanAgain}
                                    className="flex-1 h-14 glass-dark rounded-2xl text-secondary font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all border border-white/5"
                                >
                                    <Camera size={18} />
                                    Tekrar Tara
                                </button>
                                <button
                                    onClick={handleCreateProduct}
                                    disabled={saving || !newProduct.name.trim() || !newProduct.sale_price}
                                    className="flex-[2] h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {saving ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Ürünü Kaydet
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>

                    ) : product && (
                        <motion.div
                            key="product"
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="relative"
                        >
                            <ProductCard
                                product={product}
                                onClose={handleClose}
                                onScanAgain={handleScanAgain}
                                onProductUpdated={async () => {
                                    const barcode = product.barcode;
                                    const tenantId = localStorage.getItem('tenantId');
                                    if (tenantId) {
                                        await supabase.rpc('set_current_tenant', { tenant_id: tenantId });
                                    }
                                    const { data } = await supabase
                                        .from('products')
                                        .select('*, categories(name)')
                                        .eq('barcode', barcode)
                                        .single();
                                    if (data) {
                                        setProduct(data);
                                    }
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
