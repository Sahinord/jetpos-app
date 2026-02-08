"use client";

import { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Camera, X, Flashlight, ScanLine } from 'lucide-react';
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

    const videoRef = useRef<HTMLVideoElement>(null);
    const readerRef = useRef<BrowserMultiFormatReader | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const isProcessing = useRef(false);

    useEffect(() => {
        if (scanning) {
            isProcessing.current = false; // Reset lock when scanning starts
            startScanner();
        } else {
            stopScanner();
        }
        return () => stopScanner();
    }, [scanning]);

    const startScanner = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                const isHttps = window.location.protocol === 'https:';
                const errorMsg = !isHttps
                    ? '🔒 Kamera erişimi için HTTPS gerekli!\n\nLütfen ngrok veya HTTPS ile erişin.'
                    : '📱 Tarayıcınız kamera API\'sini desteklemiyor.';

                toast.error(errorMsg);
                setScanning(false);
                return;
            }

            readerRef.current = new BrowserMultiFormatReader();

            const constraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;

                readerRef.current.decodeFromVideoDevice(
                    undefined,
                    videoRef.current,
                    (result, error) => {
                        if (result && !isProcessing.current) {
                            handleBarcodeDetected(result.getText());
                        }
                    }
                );
            }
        } catch (error) {
            console.error('Kamera erişim hatası:', error);
            toast.error('Kamera açılamadı. Lütfen izin verin.');
            setScanning(false);
        }
    };

    const stopScanner = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                try { track.stop(); } catch (e) { }
            });
            streamRef.current = null;
        }
        if (readerRef.current) {
            readerRef.current = null;
        }
    };

    const handleBarcodeDetected = async (barcode: string) => {
        if (isProcessing.current) return;
        isProcessing.current = true; // Lock immediately

        console.log('Barkod okundu:', barcode);

        if (navigator.vibrate) {
            try { navigator.vibrate([50, 30, 50]); } catch (e) { }
        }

        playBeep();

        // Flash'ı kapat
        if (torchOn && streamRef.current) {
            try {
                const track = streamRef.current.getVideoTracks()[0];
                await track.applyConstraints({
                    advanced: [{ torch: false } as any]
                });
                setTorchOn(false);
            } catch (error) {
                console.log('Flash kapatılamadı:', error);
            }
        }

        // Scanner'ı durdur
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
                .single();

            if (data) {
                setProduct(data);
                toast.success('Ürün bulundu!', { id: 'scan-success' }); // Unique ID prevents multiple toasts
                setManualBarcode('');
            } else {
                toast.error('Ürün bulunamadı: ' + barcode, { id: 'scan-error' });
                // Ürün bulunamadıysa tekrar taramaya hazır olabilmesi için
                // isProcessing.current burada veya bir süre sonra false yapılabilir
                // Ama şimdilik setScanning(false) yapıldığı için UI'dan tekrar açılması gerekecek.
            }
        } catch (error) {
            console.error('Ürün sorgulanırken hata:', error);
            toast.error('Bir hata oluştu');
        } finally {
            setFetching(false);
        }
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualBarcode.trim()) {
            handleBarcodeDetected(manualBarcode.trim());
        } else {
            toast.error('Lütfen bir barkod girin');
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
                toast.error('Flaş desteklenmiyor');
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
        } catch (error) {
            console.error('Ses çalınamadı:', error);
        }
    };

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
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
            </motion.div>

            {/* Main Content */}
            <div className="p-6 relative z-10 space-y-8">
                <AnimatePresence mode="wait">
                    {!scanning && !product ? (
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

                                    {/* Decorative Scan Line */}
                                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent -translate-y-full group-hover:animate-[scan_2s_infinite]" />
                                </motion.button>
                            </div>

                            {/* Divider with Style */}
                            <div className="flex items-center gap-6 px-4">
                                <div className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent" />
                                <span className="text-[10px] font-black text-secondary uppercase tracking-[4px]">Manuel</span>
                                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                            </div>

                            {/* Manual Form Redesign */}
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
                            className="relative min-h-[70vh] flex flex-col pt-10"
                        >
                            <div className="relative aspect-[3/4] rounded-[3rem] overflow-hidden glass-dark border-2 border-white/10 shadow-3xl">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover scale-[1.01]"
                                />

                                {/* Scanning Overlay */}
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />

                                    {/* Corner Accents */}
                                    <div className="absolute top-10 left-10 w-12 h-12 border-t-4 border-l-4 border-blue-500 rounded-tl-2xl" />
                                    <div className="absolute top-10 right-10 w-12 h-12 border-t-4 border-r-4 border-blue-500 rounded-tr-2xl" />
                                    <div className="absolute bottom-10 left-10 w-12 h-12 border-b-4 border-l-4 border-blue-500 rounded-bl-2xl" />
                                    <div className="absolute bottom-10 right-10 w-12 h-12 border-b-4 border-r-4 border-blue-500 rounded-br-2xl" />

                                    {/* Scanning Beam */}
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 blur-sm animate-[scan_3s_infinite]" />
                                    <div className="absolute top-0 left-10 right-10 h-0.5 bg-blue-400 opacity-50 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-[scan_3s_infinite]" />
                                </div>

                                {/* Scanner Controls */}
                                <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-6 px-10">
                                    <button
                                        onClick={toggleTorch}
                                        className={`w-16 h-16 rounded-3xl glass backdrop-blur-2xl flex items-center justify-center transition-all ${torchOn ? 'bg-amber-500/90 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'text-white'
                                            }`}
                                    >
                                        <Flashlight className="w-7 h-7" />
                                    </button>
                                    <button
                                        onClick={() => setScanning(false)}
                                        className="flex-1 h-16 bg-red-500/90 backdrop-blur-2xl rounded-3xl text-white font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
                                    >
                                        Okumayı Durdur
                                    </button>
                                </div>
                            </div>

                            <div className="mt-10 text-center">
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
                    ) : product && (
                        <motion.div
                            key="product"
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="relative"
                        >
                            <ProductCard
                                product={product}
                                onClose={() => {
                                    setProduct(null);
                                    setScanning(false);
                                }}
                                onScanAgain={() => {
                                    setProduct(null);
                                    setScanning(true);
                                }}
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
