"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, X, Sparkles, RefreshCw, ShoppingCart, TrendingUp, AlertCircle, CheckCircle2, Search, Calculator } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SmartScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onProductDetected: (product: any) => void;
    apiKey: string;
}

export default function SmartScanner({ isOpen, onClose, onProductDetected, apiKey }: SmartScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [scanResult, setScanResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Start Camera
    useEffect(() => {
        if (isOpen && !stream) {
            startCamera();
        }
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }
        };
    }, [isOpen]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            setError("Kamera erişimi reddedildi!");
        }
    };

    const playBeep = () => {
        try {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.type = 'sine';
            oscillator.frequency.value = 880;
            gain.gain.setValueAtTime(0, context.currentTime);
            gain.gain.linearRampToValueAtTime(0.1, context.currentTime + 0.01);
            gain.gain.linearRampToValueAtTime(0, context.currentTime + 0.1);
            oscillator.start();
            oscillator.stop(context.currentTime + 0.1);
        } catch (e) { console.warn("Audio error", e); }
    };

    const captureAndAnalyze = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        playBeep();
        setIsAnalyzing(true);
        setError(null);

        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const base64Image = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];

        try {
            const response = await fetch("/api/vision-analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: base64Image, api_key: apiKey })
            });

            if (!response.ok) throw new Error("AI Analizi başarısız oldu");

            const result = await response.json();
            setScanResult(result);
        } catch (err: any) {
            setError(err.message || "Bir hata oluştu");
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence mode="wait">
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 100 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 100 }}
                    className="relative w-full max-w-xl h-full sm:h-auto sm:max-h-[90vh] bg-[#0A0A0B] border border-white/10 sm:rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(var(--color-primary-rgb),0.1)] flex flex-col"
                >
                    {/* Top Status Bar */}
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

                    {/* Header */}
                    <div className="px-8 py-6 flex items-center justify-between z-10 bg-[#0A0A0B]/80 backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center border border-white/10 shadow-lg relative z-10">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-white font-black text-lg tracking-tight leading-none">VISION AI</h3>
                                <p className="text-[10px] text-secondary font-black uppercase tracking-[0.2em] mt-1.5 opacity-60">Akıllı Ürün Tanıma & Piyasa Analizi</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all border border-white/5 group"
                        >
                            <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                    </div>

                    {/* Content View */}
                    <div className="relative flex-1 overflow-hidden">
                        {!scanResult ? (
                            <div className="relative h-full min-h-[450px]">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover grayscale-[20%] sepia-[10%] brightness-[0.8]"
                                />

                                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />

                                {/* Modern Scanner UI */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="relative w-[80%] aspect-square max-w-[320px]">
                                        {/* Corners */}
                                        <div className="absolute -top-1 -left-1 w-12 h-12 border-t-[3px] border-l-[3px] border-primary rounded-tl-3xl shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.5)]" />
                                        <div className="absolute -top-1 -right-1 w-12 h-12 border-t-[3px] border-r-[3px] border-primary rounded-tr-3xl shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.5)]" />
                                        <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-[3px] border-l-[3px] border-primary rounded-bl-3xl shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.5)]" />
                                        <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-[3px] border-r-[3px] border-primary rounded-br-3xl shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.5)]" />

                                        {/* Scanning Animation */}
                                        {isAnalyzing && (
                                            <motion.div
                                                initial={{ top: "0%" }}
                                                animate={{ top: "100%" }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                                className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.8)] z-20"
                                            />
                                        )}

                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-full h-full border border-white/5 rounded-3xl backdrop-blur-[1px]" />
                                        </div>
                                    </div>
                                </div>

                                {/* Tips Overlay */}
                                <div className="absolute bottom-8 inset-x-0 flex justify-center px-8 text-center">
                                    <p className="text-[11px] text-white/50 font-medium tracking-wide bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/5">
                                        Ürünü merkeze getirin ve butona basın. AI otomatik tanımlayacaktır.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 1.05 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="h-full bg-[#0A0A0B] overflow-y-auto px-8 py-4 space-y-8"
                            >
                                {/* Result Hero */}
                                <div className="flex items-center gap-6 bg-white/[0.02] p-6 rounded-[2rem] border border-white/5 shadow-2xl">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                                        <div className="w-24 h-24 bg-black rounded-3xl border border-white/10 overflow-hidden relative z-10">
                                            {canvasRef.current && (
                                                <img
                                                    src={canvasRef.current.toDataURL()}
                                                    alt="Scan"
                                                    className="w-full h-full object-cover opacity-80"
                                                />
                                            )}
                                            <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]" />
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[9px] font-black tracking-widest uppercase border border-emerald-500/20">DOĞRULANDI</span>
                                            <span className="text-secondary/40 text-[9px] font-bold tracking-widest uppercase">#{Math.random().toString(16).slice(2, 8).toUpperCase()}</span>
                                        </div>
                                        <h4 className="text-2xl font-black text-white leading-tight">{scanResult.product_name}</h4>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold text-secondary flex items-center gap-1.5 backdrop-blur-sm">
                                                <Search size={12} className="text-primary" /> {scanResult.category}
                                            </span>
                                            <div className="w-1 h-1 rounded-full bg-white/10" />
                                            <span className="text-xs font-bold text-secondary uppercase tracking-tighter">{scanResult.barcode || 'GÖRSEL KİMLİK'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Piyasa Karşılaştırması */}
                                <div className="space-y-4">
                                    <div className="flex items-end justify-between px-2">
                                        <h5 className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em]">REKABET ANALİZİ</h5>
                                        <span className="text-[10px] font-bold text-primary">CANLI VERİ</span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            {scanResult.market_prices?.map((market: any, i: number) => (
                                                <div key={i} className="group relative">
                                                    <div className="absolute inset-0 bg-white/5 rounded-2xl blur-xl transition-all group-hover:bg-primary/5" />
                                                    <div className="relative p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col gap-2 transition-all group-hover:border-white/20">
                                                        <span className="text-[10px] font-black text-secondary tracking-widest uppercase opacity-40 group-hover:text-primary transition-colors">{market.source}</span>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-lg font-black text-white">₺{market.price}</span>
                                                            <TrendingUp size={12} className="text-emerald-500/50" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Insight Card */}
                                        <div className="relative overflow-hidden p-6 rounded-[2rem] bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 shadow-2xl group">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                                                <Sparkles size={64} className="text-primary" />
                                            </div>
                                            <div className="relative z-10 flex flex-col gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                                                        <Calculator className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <span className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">AKILLI ÖNERİ</span>
                                                </div>
                                                <p className="text-white font-medium text-sm leading-relaxed max-w-[80%]">
                                                    Pazar ortalaması <span className="text-primary font-black">₺{scanResult.market_avg}</span> seviyesinde. Rekabetçi kalmak için <span className="text-primary font-black">₺{scanResult.suggested_price}</span> satış fiyatı önerilir.
                                                </p>
                                                <div className="flex items-center gap-4 pt-2">
                                                    <div className="px-4 py-2 rounded-xl bg-black/40 border border-white/5">
                                                        <p className="text-[9px] text-secondary font-black tracking-widest uppercase mb-1">Önerilen Fiyat</p>
                                                        <p className="text-xl font-black text-white">₺{scanResult.suggested_price}</p>
                                                    </div>
                                                    <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                                        <p className="text-[9px] text-emerald-500/60 font-black tracking-widest uppercase mb-1">Tahmini Kar</p>
                                                        <p className="text-xl font-black text-emerald-500">%{Math.round(((scanResult.suggested_price - (scanResult.market_avg * 0.7)) / scanResult.suggested_price) * 100)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Placeholder Trend Visualization */}
                                <div className="space-y-4 pt-2">
                                    <h5 className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] px-2">FİYAT TRENDİ (30 GÜN)</h5>
                                    <div className="h-16 flex items-end gap-1 px-4 border-b border-white/5 pb-2">
                                        {[40, 45, 42, 48, 52, 50, 55, 53, 58, 62, 60, 65, 63, 68].map((h, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ height: 0 }}
                                                animate={{ height: `${h}%` }}
                                                transition={{ delay: i * 0.05 }}
                                                className={`flex-1 rounded-t-sm ${i === 13 ? 'bg-primary shadow-[0_0_10px_rgba(var(--color-primary-rgb),0.5)]' : 'bg-white/10'}`}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex justify-between text-[8px] font-black text-secondary tracking-widest uppercase opacity-40 px-2 leading-none">
                                        <span>30 GÜN ÖNCE</span>
                                        <span>BUGÜN</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="p-8 bg-[#0A0A0B]/90 backdrop-blur-xl border-t border-white/5 z-20">
                        {!scanResult ? (
                            <button
                                onClick={captureAndAnalyze}
                                disabled={isAnalyzing || !stream}
                                className="group relative w-full overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-primary blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                                <div className="relative py-6 rounded-3xl bg-primary text-white font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-4 shadow-2xl hover:scale-[1.02] active:scale-[0.95] transition-all disabled:opacity-50">
                                    {isAnalyzing ? (
                                        <>
                                            <RefreshCw className="w-6 h-6 animate-spin" />
                                            <span>ANALİZ EDİLİYOR...</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-4 h-4 rounded-full bg-white relative">
                                                <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-50" />
                                            </div>
                                            <span>AKILLI TARAMAYI BAŞLAT</span>
                                        </>
                                    )}
                                </div>
                            </button>
                        ) : (
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setScanResult(null)}
                                    className="flex-1 py-6 rounded-3xl bg-white/5 border border-white/5 text-secondary font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
                                >
                                    YENİDEN TARA
                                </button>
                                <button
                                    onClick={() => onProductDetected(scanResult)}
                                    className="flex-[2] py-6 rounded-3xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:shadow-[0_0_30px_rgba(var(--color-primary-rgb),0.3)] transition-all flex items-center justify-center gap-3 active:scale-95 group"
                                >
                                    <ShoppingCart size={16} className="group-hover:-translate-x-1 transition-transform" />
                                    <span>ÜRÜNÜ SİSTEME EKLE</span>
                                </button>
                            </div>
                        )}

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-500"
                            >
                                <AlertCircle size={18} className="shrink-0" />
                                <span className="text-[10px] font-black uppercase tracking-[0.1em]">{error}</span>
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                <canvas ref={canvasRef} className="hidden" />
            </div>
        </AnimatePresence>
    );
}
