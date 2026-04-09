"use client";

import { useEffect, useState, useRef } from "react";
import {
    ShoppingCart, Monitor, Sparkles, Maximize2, Minimize2,
    CreditCard, CheckCircle2, Receipt, AlertCircle, TrendingUp,
    Clock, Tag, ShieldCheck, CloudSun, QrCode, Banknote
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CustomerFacingDisplay() {
    const [cart, setCart] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [lastItem, setLastItem] = useState<any>(null);
    const [status, setStatus] = useState<"idle" | "scanning" | "payment" | "completed">("idle");
    const statusRef = useRef<string>("idle"); // stale closure fix
    const setStatusWithRef = (s: "idle" | "scanning" | "payment" | "completed") => {
        statusRef.current = s;
        setStatus(s);
    };
    const [transaction, setTransaction] = useState<any>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [settings, setSettings] = useState<any>({
        welcomeTitle: 'HOŞGELDİNİZ',
        welcomeSubtitle: 'KEYİFLİ ALIŞVERİŞLER',
        showImages: true,
        backgroundColor: '#020617',
        accentColor: '#3b82f6',
        marqueeText: 'JETPOS İŞİNİZ JET HIZINDA • BU MAĞAZADA GÜVENLİ ÖDEME GEÇERLİDİR • KEYİFLİ ALIŞVERİŞLER DİLERİZ •',
        promoTitle: 'JETPOS',
        promoSubtitle: 'İŞİNİZ JET HIZINDA',
        versionText: 'JETPOS Müşteri Paneli v2.0',
        showMarquee: true,
        marqueeSpeed: 30,
        showClock: true,
        showWeather: true,
        showQR: false,
        qrText: '',
        qrLink: ''
    });
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        if (!settings.showClock) return;
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, [settings.showClock]);

    useEffect(() => {
        // POS ekranından gelen verileri dinle
        const channel = new BroadcastChannel("jetpos-display-sync");

        channel.onmessage = (event) => {
            const data = event.data;

            if (data.type === 'SETTINGS_UPDATE') {
                setSettings((prev: any) => ({ ...prev, ...data.settings }));
                return;
            }

            if (data.type === 'STATUS_UPDATE') {
                setStatusWithRef(data.status);
                setTransaction(data);
                if (data.status === 'completed') {
                    setTimeout(() => {
                        setStatusWithRef('idle');
                        setTransaction(null);
                    }, 13000); // 13 saniye göster
                }
                return;
            }

            if (data.type === 'CART_SYNC') {
                const { cart: newCart, total: newTotal, discount: newDiscount } = data;
                const currentStatus = statusRef.current; // stale closure'a düşme!

                if (newCart.length > 0) {
                    setLastItem(newCart[newCart.length - 1]);
                    // Sadece idle veya scanning modundayken tarama moduna geç
                    if (currentStatus === 'idle' || currentStatus === 'scanning') {
                        setStatusWithRef("scanning");
                    }
                } else if (newCart.length === 0) {
                    // Ödeme veya tamamlanma ekranındayken sepet boşalmasına izin verme
                    if (currentStatus !== 'completed' && currentStatus !== 'payment') {
                        setStatusWithRef("idle");
                        setLastItem(null);
                    }
                }

                setCart(newCart);
                setTotal(newTotal);
                setDiscount(newDiscount);
            }
        };

        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F11') {
                e.preventDefault();
                toggleFullscreen();
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            channel.close();
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [cart]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    return (
        <div
            ref={containerRef}
            className="h-screen w-full text-white flex flex-col p-3 md:p-5 overflow-hidden select-none transition-all duration-700 relative fixed inset-0"
            style={{
                backgroundColor: settings.backgroundColor || '#020617',
                fontFamily: "'Inter', sans-serif"
            }}
        >
            {/* Background Texture/Grain */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }} />

            {/* Fullscreen Toggle (Discreet) */}
            <button
                onClick={toggleFullscreen}
                className={`absolute top-4 right-4 z-[100] rounded-full transition-all duration-500 backdrop-blur-md border border-white/10 flex items-center justify-center
                    ${isFullscreen
                        ? 'w-8 h-8 opacity-0 hover:opacity-100 bg-white/5 text-white/20'
                        : 'w-12 h-12 opacity-100 bg-white/10 text-white/40 hover:text-white group-hover:scale-110'}`}
                title="F11 ile tam ekran"
            >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={20} />}
            </button>

            {/* Header */}
            <header className="relative z-10 flex flex-col md:flex-row items-center justify-between bg-white/5 backdrop-blur-[40px] border border-white/10 px-4 py-2.5 md:px-6 md:py-3 rounded-2xl shadow-2xl mb-3 transition-all duration-500 hover:border-white/20 gap-3 md:gap-0">
                <div className="flex items-center gap-3 md:gap-5 w-full md:w-auto">
                    <motion.div
                        whileHover={{ rotate: 12, scale: 1.05 }}
                        className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg border border-white/10 shrink-0"
                        style={{ backgroundColor: settings.accentColor || '#3b82f6' }}
                    >
                        <ShoppingCart size={20} className="md:size-[28px] text-white drop-shadow-lg" />
                    </motion.div>
                    <div>
                        <h1 className="text-base md:text-2xl font-black tracking-tighter uppercase mb-0.5 bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent italic leading-tight">
                            {settings.welcomeTitle || 'HOŞGELDİNİZ'}
                        </h1>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[8px] md:text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">{settings.versionText || 'JETPOS Müşteri Paneli v2.0'}</p>
                        </div>
                    </div>
                </div>

                <div className="text-right flex items-center gap-4 md:gap-8 self-end md:self-center">
                    {settings.showClock && (
                        <div className="flex flex-col items-end">
                            <div className="text-xl md:text-3xl font-black tracking-tighter tabular-nums leading-none">
                                {currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">
                                {currentTime.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </div>
                        </div>
                    )}

                    {settings.showWeather && (
                        <div className="hidden sm:flex items-center gap-2.5 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
                            <div className="text-right">
                                <div className="text-sm font-black">24°C</div>
                                <div className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Güneşli</div>
                            </div>
                            <CloudSun size={20} className="text-amber-400" />
                        </div>
                    )}

                    <div className="hidden lg:flex flex-col items-end gap-1 opacity-40">
                        <div className="flex gap-1">
                            <ShieldCheck size={11} className="text-emerald-500" />
                            <span className="text-[7px] font-black uppercase tracking-widest">Güvenli Ödeme</span>
                        </div>
                        <div className="flex gap-1">
                            <TrendingUp size={11} className="text-primary" />
                            <span className="text-[7px] font-black uppercase tracking-widest">Akıllı Senkron</span>
                        </div>
                    </div>
                    <div className="h-10 w-px bg-white/10 mx-1" />
                    <div>
                        <div className="text-white/20 font-black text-[9px] uppercase tracking-[0.4em] mb-1.5 flex items-center justify-end gap-1.5">
                            DURUM <Clock size={10} className="animate-spin-slow" />
                        </div>
                        <div className="text-sm md:text-xl font-black flex items-center gap-2 justify-end">
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Sparkles style={{ color: settings.accentColor || '#3b82f6' }} size={14} className="md:size-[18px]" />
                            </motion.div>
                            <span className="bg-gradient-to-l from-white to-white/70 bg-clip-text text-transparent whitespace-nowrap">
                                {settings.welcomeSubtitle || 'KEYİFLİ ALIŞVERİŞLER'}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0 relative z-10 overflow-hidden">
                {/* LEFT: Promotion/Last Item Area */}
                <div className="w-full lg:w-[42%] flex flex-col gap-3 shrink-0 h-full">
                    <section className="flex-1 bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
                        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]" />

                        <AnimatePresence mode="wait">
                            {lastItem ? (
                                <motion.div
                                    key={lastItem.id}
                                    initial={{ opacity: 0, scale: 0.9, y: 50, filter: "blur(10px)" }}
                                    animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                                    exit={{ opacity: 0, scale: 0.8, y: -50, filter: "blur(10px)" }}
                                    transition={{ type: "spring", damping: 15 }}
                                    className="w-full flex flex-col items-center space-y-8"
                                >
                                    {settings.showImages && (
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-primary/20 blur-[50px] rounded-full scale-120 animate-pulse" />
                                            <div className="w-44 h-44 bg-white/5 rounded-[3rem] border-2 border-white/10 flex items-center justify-center mx-auto shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative z-10 overflow-hidden ring-1 ring-white/20">
                                                {lastItem.image_url ? (
                                                    <img src={lastItem.image_url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <ShoppingCart size={64} className="text-white/10" />
                                                )}
                                                <div className="absolute top-4 right-4 bg-primary text-white text-[10px] font-black px-4 py-2 rounded-2xl shadow-xl ring-2 ring-white/20">
                                                    YENİ EKLENDİ
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-2 md:space-y-4">
                                        <h2 className="text-xl md:text-3xl lg:text-4xl font-black text-white transition-all duration-700 drop-shadow-2xl uppercase">
                                            {lastItem.name}
                                        </h2>
                                        <div className="flex flex-col items-center">
                                            <div className="text-4xl md:text-5xl lg:text-6xl font-black drop-shadow-2xl flex items-start gap-1" style={{ color: settings.accentColor || '#3b82f6' }}>
                                                <span className="text-lg md:text-2xl lg:text-3xl mt-2 md:mt-3 opacity-50">₺</span>
                                                {lastItem.sale_price.toFixed(2)}
                                            </div>
                                            <div className="text-sm md:text-base font-black text-white/40 tracking-[0.3em] uppercase mt-3 bg-white/5 px-4 md:px-6 py-1.5 rounded-full border border-white/5">
                                                {lastItem.quantity} x {lastItem.unit || 'ADET'}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="flex flex-col items-center gap-10"
                                >
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-primary/30 blur-[80px] scale-150 rounded-full" />
                                        <div className="w-24 h-24 bg-white/5 rounded-[2rem] border border-white/20 flex items-center justify-center relative z-10 shadow-2xl">
                                            <Monitor size={36} className="text-white/20 animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-white/10 font-black text-3xl md:text-5xl lg:text-6xl uppercase tracking-[0.2em] italic mb-2 leading-none">{settings.promoTitle || 'JETPOS'}</div>
                                        <p className="text-white/30 text-sm md:text-base font-black uppercase tracking-[0.5em]">{settings.promoSubtitle || 'İşiniz jet hızında'}</p>
                                    </div>

                                    {settings.showQR && (
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0, x: 20 }} animate={{ scale: 1, opacity: 1, x: 0 }}
                                            className="absolute bottom-8 right-8 p-6 bg-white/10 backdrop-blur-3xl rounded-[2.5rem] border border-white/20 flex items-center gap-6 shadow-2xl group transition-all hover:bg-white/15"
                                            style={{ boxShadow: `0 20px 50px -10px ${settings.accentColor || '#3b82f6'}40` }}
                                        >
                                            <div className="p-3 bg-white rounded-2xl shadow-inner shrink-0 group-hover:scale-105 transition-transform duration-500">
                                                <QrCode size={64} className="text-black" />
                                            </div>
                                            <div className="text-left pr-4">
                                                <p className="text-[10px] font-black text-white/40 tracking-[0.3em] uppercase mb-1 whitespace-nowrap">KAMPANYA KODU</p>
                                                <p className="text-xl font-black text-white leading-tight uppercase max-w-[150px] drop-shadow-md">
                                                    {settings.qrText || 'İNDİRİM KUPONU'}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest leading-none">Canlı Teklif</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </section>
                </div>

                {/* RIGHT: Cart & Totals Area */}
                <div className="flex-1 bg-white/5 backdrop-blur-[40px] border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-7 flex flex-col overflow-hidden shadow-2xl h-full">
                    <div className="flex-1 overflow-y-auto pr-2 md:pr-4 custom-scrollbar scroll-smooth">
                        <table className="w-full border-separate border-spacing-y-2">
                            <thead className="sticky top-0 z-20">
                                <tr className="text-left text-[9px] md:text-[11px] font-black text-white/20 tracking-[0.4em] md:tracking-[0.6em] uppercase">
                                    <th className="pb-4 pl-4">ÜRÜN DETAYI</th>
                                    <th className="pb-4 text-center">MİKTAR</th>
                                    <th className="pb-4 text-right pr-4">TUTAR</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart.map((item, idx) => (
                                    <motion.tr
                                        layout
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={item.id}
                                        className="text-base group"
                                    >
                                        <td className="py-3 pl-4 border-b border-white/5 group-last:border-none">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                                    <Tag size={14} className="text-white/20 group-hover:text-primary transition-colors" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black uppercase tracking-tight">{item.name}</span>
                                                    <span className="text-[11px] font-bold text-white/30">₺{item.sale_price.toFixed(2)} / {item.unit || 'ADET'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 text-center border-b border-white/5 group-last:border-none font-bold text-white/40 group-hover:text-white transition-colors">{item.quantity}</td>
                                        <td className="py-3 text-right pr-4 border-b border-white/5 group-last:border-none font-black text-primary" style={{ color: settings.accentColor || '#3b82f6' }}>
                                            <div className="flex flex-col items-end">
                                                {item.discount > 0 && (
                                                    <span className="text-xs text-rose-500 line-through opacity-50">₺{(item.price * item.quantity).toFixed(2)}</span>
                                                )}
                                                <span>₺{(item.sale_price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                                {cart.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="py-32 text-center">
                                            <div className="inline-flex flex-col items-center gap-6 opacity-10">
                                                <Receipt size={100} strokeWidth={1} />
                                                <p className="font-black text-3xl uppercase tracking-[0.3em]">Beklenen İşlem Yok</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Totals */}
                    <footer className="mt-5 pt-5 border-t-2 border-white/5 space-y-3">
                        <AnimatePresence>
                            {discount > 0 && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                    className="flex justify-between items-center text-rose-500 font-black px-4 py-2.5 bg-rose-500/5 rounded-2xl border border-rose-500/20"
                                >
                                    <div className="flex items-center gap-2 pl-1">
                                        <Sparkles size={14} />
                                        <span className="uppercase tracking-[0.4em] text-xs">Kazancınız</span>
                                    </div>
                                    <span className="text-2xl pr-2">- ₺{discount.toFixed(2)}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex justify-between items-end bg-gradient-to-r from-white/[0.03] to-transparent px-5 py-4 rounded-2xl border border-white/10 shadow-inner">
                            <div>
                                <div className="text-white/30 font-black text-[10px] uppercase tracking-[0.5em] mb-1">GÜNCEL TUTAR</div>
                                <div className="text-5xl md:text-6xl font-black leading-none text-white tracking-tighter flex items-start gap-1">
                                    <span className="text-2xl md:text-3xl mt-1 opacity-30">₺</span>
                                    {total.toFixed(2)}
                                </div>
                            </div>
                            <div className="pb-1">
                                <div className="flex justify-end mb-1.5">
                                    <motion.div
                                        animate={{ width: ["20px", "80px", "20px"] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                        className="h-1.5 rounded-full"
                                        style={{ backgroundColor: settings.accentColor || '#3b82f6', boxShadow: `0 0 20px ${settings.accentColor || '#3b82f6'}80` }}
                                    />
                                </div>
                                <p className="text-[9px] font-black text-white/20 tracking-[0.3em] uppercase text-right">Sistem Aktif</p>
                            </div>
                        </div>
                    </footer>
                </div>
            </main>

            {/* Bottom Marquee */}
            {settings.showMarquee !== false && (
                <div className="mt-8 border-t border-white/10 pt-4 overflow-hidden mask-fade relative z-10">
                    <div
                        className="whitespace-nowrap animate-marquee flex gap-20"
                        style={{ animationDuration: `${settings.marqueeSpeed || 30}s` }}
                    >
                        {Array.from({ length: 10 }).map((_, i) => (
                            <span key={i} className="text-sm font-black text-white/20 uppercase tracking-[0.5em] italic">
                                {settings.marqueeText || 'JETPOS İŞİNİZ JET HIZINDA • KEYİFLİ ALIŞVERİŞLER •'}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* STATUS OVERLAYS */}
            <AnimatePresence>
                {status === 'payment' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-[#020617]/98 backdrop-blur-[50px] flex flex-col items-center justify-center p-10 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-primary/10 animate-pulse" />
                        <motion.div
                            initial={{ scale: 0.5, y: 100 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.5, y: -100 }}
                            className="bg-white/5 border-2 border-white/10 p-16 rounded-[6rem] shadow-[0_0_100px_rgba(59,130,246,0.1)] flex flex-col items-center gap-10 relative"
                        >
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 blur-[60px] rounded-full" />
                            <div className="w-64 h-64 bg-primary rounded-full flex items-center justify-center shadow-[0_20px_80px_rgba(59,130,246,0.6)] border-8 border-white/20 relative">
                                <motion.div
                                    animate={{
                                        y: [0, -20, 0],
                                        rotate: [0, 5, -5, 0]
                                    }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                >
                                    {transaction?.paymentMethod === 'NAKİT' ? (
                                        <Banknote size={140} className="text-white drop-shadow-2xl" />
                                    ) : (
                                        <CreditCard size={140} className="text-white drop-shadow-2xl" />
                                    )}
                                </motion.div>
                                <motion.div
                                    animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="absolute -bottom-4 right-4 bg-emerald-500 rounded-full p-4 border-4 border-[#020617]"
                                >
                                    <div className="w-8 h-8 rounded-full bg-white animate-ping" />
                                </motion.div>
                            </div>

                            <div className="text-center space-y-6">
                                <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-none bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
                                    {transaction?.paymentMethod === 'NAKİT' ? 'NAKİT ÖDEME İŞLENİYOR' : 'LÜTFEN KARTI OKUTUNUZ'}
                                </h1>
                                <div className="p-4 bg-primary/20 rounded-2xl border border-primary/40 inline-block animate-pulse">
                                    <p className="text-primary font-black tracking-[0.5em] text-sm uppercase">
                                        {transaction?.paymentMethod === 'NAKİT' ? 'Kasa Onayı Bekleniyor...' : 'Hugin Terminali Bekleniyor...'}
                                    </p>
                                </div>
                                <div className="flex h-4 w-96 bg-white/10 rounded-full mx-auto overflow-hidden">
                                    <motion.div
                                        animate={{ x: ["-100%", "100%", "-100%"] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                        className="w-full bg-primary"
                                    />
                                </div>
                                <p className="text-2xl font-bold text-white/40 tracking-[0.4em] uppercase">İŞLEMİNİZ JET HIZINDA TAMAMLANACAK</p>
                            </div>
                        </motion.div>

                        <div className="mt-20 text-center">
                            <p className="text-xl font-bold text-white/20 italic tracking-widest uppercase">JETPOS GÜVENLİ ÖDEME ALTYAPISI</p>
                        </div>
                    </motion.div>
                )}

                {status === 'completed' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 overflow-hidden"
                    >
                        {/* Popup Kartı */}
                        <motion.div
                            initial={{ scale: 0.7, y: 60, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.8, y: 40, opacity: 0 }}
                            transition={{ type: "spring", damping: 20, stiffness: 300 }}
                            className="relative w-full max-w-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-[3rem] shadow-[0_40px_120px_rgba(0,0,0,0.6)] border-4 border-emerald-300/30 overflow-hidden"
                        >
                            {/* Dekoratif arka plan çemberi */}
                            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
                            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-300/20 rounded-full blur-2xl" />

                            <div className="relative z-10 p-10 flex flex-col items-center gap-6">
                                {/* İkon */}
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
                                    className="relative"
                                >
                                    <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-900/40">
                                        <CheckCircle2 className="size-16 text-emerald-500" />
                                    </div>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
                                        className="absolute -top-2 -right-2"
                                    >
                                        <Sparkles className="size-10 text-amber-300" />
                                    </motion.div>
                                </motion.div>

                                {/* Başlık */}
                                <div className="text-center">
                                    <h1 className="text-5xl font-black italic tracking-tighter text-white uppercase leading-tight drop-shadow-lg">
                                        İşlem Başarılı!
                                    </h1>
                                </div>

                                {/* Tutar + Ödeme Bilgileri */}
                                {transaction && (
                                    <div className="w-full grid grid-cols-2 gap-4">
                                        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/10">
                                            <p className="text-[10px] font-black text-white/50 tracking-widest uppercase mb-2">TOPLAM TUTAR</p>
                                            <p className="text-4xl font-black text-white">₺{transaction.total?.toFixed(2)}</p>
                                        </div>
                                        {transaction.paymentMethod === 'NAKİT' && transaction.changeAmount > 0 ? (
                                            <motion.div
                                                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }}
                                                className="bg-amber-400/90 rounded-2xl p-5 text-center border-2 border-white/30"
                                            >
                                                <p className="text-[10px] font-black text-white/70 tracking-widest uppercase mb-2">PARA ÜSTÜ</p>
                                                <p className="text-4xl font-black text-white">₺{transaction.changeAmount.toFixed(2)}</p>
                                            </motion.div>
                                        ) : (
                                            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/10">
                                                <p className="text-[10px] font-black text-white/50 tracking-widest uppercase mb-2">ÖDEME YÖNTEMİ</p>
                                                <div className="flex items-center justify-center gap-2">
                                                    {transaction.paymentMethod === 'NAKİT' ? <Banknote className="size-6 text-white/60" /> : <CreditCard className="size-6 text-white/60" />}
                                                    <p className="text-2xl font-black text-white uppercase">{transaction.paymentMethod}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Fiş Satırı */}
                                <div className="w-full flex items-center gap-4 bg-black/20 rounded-2xl px-6 py-4 border border-white/10">
                                    <Receipt className="size-7 text-white animate-pulse flex-shrink-0" />
                                    <div>
                                        <p className="text-[9px] font-black text-white/40 tracking-widest uppercase">JETPOS E-FİŞ SİSTEMİ</p>
                                        <p className="text-sm font-bold text-white uppercase animate-pulse">BİLGİ FİŞİNİZ YAZDIRILIYOR...</p>
                                    </div>
                                </div>

                                {/* Teşekkür mesajı */}
                                <div className="flex items-center gap-3">
                                    <ShoppingCart className="size-5 text-white/50" />
                                    <p className="text-sm font-bold text-white/60 uppercase tracking-widest">Bizi Tercih Ettiğiniz İçin Teşekkürler, Yine Bekleriz!</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .animate-spin-slow {
                    animation: spin 8s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes marquee {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                    width: max-content;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
                .mask-fade {
                    -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
                    mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
                }
            `}</style>
        </div>
    );
}

