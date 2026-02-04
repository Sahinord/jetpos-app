"use client";

import { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Camera, X, Flashlight, ScanLine } from 'lucide-react';
import ProductCard from './ProductCard';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function BarcodeScanner() {
    const [scanning, setScanning] = useState(false);
    const [product, setProduct] = useState<any>(null);
    const [torchOn, setTorchOn] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const readerRef = useRef<BrowserMultiFormatReader | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        if (scanning) {
            startScanner();
        } else {
            stopScanner();
        }
        return () => stopScanner();
    }, [scanning]);

    const startScanner = async () => {
        try {
            // HTTPS kontrolü
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
                        if (result) {
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
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (readerRef.current) {
            readerRef.current = null; // reset() yerine null yap
        }
    };

    const handleBarcodeDetected = async (barcode: string) => {
        console.log('Barkod okundu:', barcode);

        if (navigator.vibrate) {
            navigator.vibrate([50, 30, 50]);
        }

        playBeep();

        // Flash'ı otomatik kapat (iOS uyumlu)
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

        setScanning(false);

        try {
            const tenantId = localStorage.getItem('tenantId');
            if (tenantId) {
                // RLS context set et
                await supabase.rpc('set_current_tenant', { tenant_id: tenantId });
            }

            const { data, error } = await supabase
                .from('products')
                .select('*, categories(name)')
                .eq('barcode', barcode)
                .single();

            if (data) {
                setProduct(data);
                toast.success('Ürün bulundu!');
            } else {
                toast.error('Ürün bulunamadı');
            }
        } catch (error) {
            console.error('Ürün sorgulanırken hata:', error);
            toast.error('Bir hata oluştu');
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
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;

        oscillator.start();
        setTimeout(() => oscillator.stop(), 100);
    };

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-b border-white/10">
                <div className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">JetPos Scanner</p>
                        <h1 className="text-xl font-black text-white">Barkod Okuyucu</h1>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-4 space-y-4">
                {!scanning && !product && (
                    <button
                        onClick={() => setScanning(true)}
                        className="w-full h-72 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl flex flex-col items-center justify-center gap-6 shadow-2xl shadow-blue-600/20 active:scale-95 transition-transform"
                    >
                        <div className="relative">
                            <Camera className="w-20 h-20 text-white" />
                            <div className="absolute -inset-4 bg-white/20 rounded-full animate-ping" />
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-black text-white mb-2">Barkod Okut</p>
                            <p className="text-sm text-white/80">Kamerayı açmak için dokun</p>
                        </div>
                    </button>
                )}

                {scanning && (
                    <div className="relative">
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-[500px] object-cover bg-black"
                            />

                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute inset-0 border-2 border-white/20" />
                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <ScanLine className="w-64 h-64 text-blue-500/50 animate-pulse" strokeWidth={1} />
                                </div>
                            </div>

                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4">
                                <button
                                    onClick={toggleTorch}
                                    className={`p-4 rounded-2xl backdrop-blur-xl transition-all ${torchOn
                                        ? 'bg-yellow-500/90 text-white'
                                        : 'bg-white/10 text-white/80'
                                        }`}
                                >
                                    <Flashlight className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={() => setScanning(false)}
                                    className="px-8 py-4 bg-red-500/90 backdrop-blur-xl rounded-2xl text-white font-bold"
                                >
                                    İptal
                                </button>
                            </div>
                        </div>

                        <p className="text-center text-gray-400 text-sm mt-4 animate-pulse">
                            Barkodu kamera çerçevesine hizalayın...
                        </p>
                    </div>
                )}

                {product && (
                    <div className="relative">
                        {/* Close Button - Sağ Üstte */}
                        <button
                            onClick={() => {
                                setProduct(null);
                                setScanning(true); // Yeni okutma ekranına dön
                            }}
                            className="absolute -top-2 -right-2 z-50 p-3 bg-red-500 hover:bg-red-600 rounded-full shadow-lg transition-all active:scale-95"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>

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
                                // Ürün güncellendiyse, barkodu tekrar sorgula
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
                    </div>
                )}
            </div>
        </div>
    );
}
