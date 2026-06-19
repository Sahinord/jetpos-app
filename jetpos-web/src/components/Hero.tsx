"use client";

import React, { useState, useEffect, useRef } from "react";
import { Phone, User, TrendingUp, ShoppingCart, ArrowRight, CheckCircle, BarChart3, Package, FileText, Wallet, ShoppingBag, CreditCard, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Data ────────────────────────────────────────────────────────────────────

const feedEvents = [
    { title: "Yeni sipariş tamamlandı", desc: "₺1.240 barkodlu ödeme alındı", time: "Şimdi",    color: "#10B981", Icon: ShoppingBag   },
    { title: "Günlük hedef aşıldı",     desc: "Bugün ₺28.450 satış yapıldı",  time: "2 dk önce", color: "#7886C7", Icon: TrendingUp    },
    { title: "Düşük stok uyarısı",      desc: "3 ürün için sipariş gerekli",  time: "5 dk önce", color: "#f59e0b", Icon: AlertTriangle },
    { title: "Yeni ürün eklendi",        desc: "Stok sisteme kaydedildi",      time: "8 dk önce", color: "#8b5cf6", Icon: Package       },
];

const liveNotifications = [
    { id: "order",   Icon: ShoppingBag,    label: "Yeni Sipariş Alındı",  desc: "Masa 12 siparişi tamamlandı",  color: "#10B981", colorBg: "rgba(16,185,129,0.1)",   colorBorder: "rgba(16,185,129,0.25)" },
    { id: "payment", Icon: CreditCard,     label: "Ödeme Alındı",         desc: "₺1.240 kart ödemesi",          color: "#3b82f6", colorBg: "rgba(59,130,246,0.1)",   colorBorder: "rgba(59,130,246,0.25)" },
    { id: "stock",   Icon: AlertTriangle,  label: "Düşük Stok Uyarısı",   desc: "Kola stoğu kritik seviyede",   color: "#f97316", colorBg: "rgba(249,115,22,0.1)",   colorBorder: "rgba(249,115,22,0.25)" },
];

const rotatingWords = ["Yönetin.", "Büyütün.", "Dijitalleştirin.", "Hızlandırın."];

type DashPeriod = "daily" | "monthly" | "yearly";
const periodData: Record<DashPeriod, { label: string; sales: number; orders: number; invoices: number; cash: string; cashSub: string; growth: string; salesLabel: string }> = {
    daily:   { label: "Günlük", salesLabel: "Günlük Satış Hacmi",  sales: 28450,    orders: 142,   invoices: 98,   cash: "₺18.250 Nakit",    cashSub: "₺10.200 Kredi / POS",   growth: "+250%" },
    monthly: { label: "Aylık",  salesLabel: "Aylık Satış Hacmi",   sales: 854200,   orders: 4260,  invoices: 2940, cash: "₺547.500 Nakit",   cashSub: "₺306.700 Kredi / POS",  growth: "+180%" },
    yearly:  { label: "Yıllık", salesLabel: "Yıllık Satış Hacmi",  sales: 10250000, orders: 51120, invoices: 35280,cash: "₺6.570.000 Nakit", cashSub: "₺3.680.000 Kredi / POS",growth: "+320%" },
};

// ✨ Sparkle particles — rise from INSIDE the frosted glass timeline card body
// Each has independent right-offset, start-top (inside card body), total rise distance, size, stagger delay
const SPARKLE_PARTICLES = [
    { id: 0, right: 28, yStart: 88,  yRise: 130, delay: 0.00, size: 7,  opacity: 1.00 },
    { id: 1, right: 9,  yStart: 68,  yRise: 110, delay: 0.12, size: 9,  opacity: 0.95 },
    { id: 2, right: 50, yStart: 102, yRise: 145, delay: 0.07, size: 5,  opacity: 0.85 },
    { id: 3, right: 18, yStart: 118, yRise: 158, delay: 0.22, size: 4,  opacity: 0.75 },
    { id: 4, right: 40, yStart: 78,  yRise: 118, delay: 0.30, size: 7,  opacity: 0.90 },
];

const BG_PARTICLES = [
    { id: 0, size: 2.1, x: 14.5, y: 82.3, duration: 12.4, delay: 1.2, opacity: 0.12 },
    { id: 1, size: 3.5, x: 88.2, y: 15.6, duration: 8.7, delay: 4.5, opacity: 0.25 },
    { id: 2, size: 1.8, x: 45.1, y: 91.0, duration: 10.1, delay: 2.1, opacity: 0.18 },
    { id: 3, size: 2.9, x: 67.4, y: 34.2, duration: 14.0, delay: 0.5, opacity: 0.15 },
    { id: 4, size: 1.6, x: 23.8, y: 56.7, duration: 7.2, delay: 3.8, opacity: 0.22 },
    { id: 5, size: 3.8, x: 92.1, y: 77.5, duration: 11.5, delay: 5.1, opacity: 0.11 },
    { id: 6, size: 2.4, x: 5.5, y: 44.8, duration: 9.3, delay: 2.9, opacity: 0.20 },
    { id: 7, size: 3.1, x: 74.9, y: 12.3, duration: 13.8, delay: 1.7, opacity: 0.14 },
    { id: 8, size: 1.9, x: 38.2, y: 65.4, duration: 8.1, delay: 4.2, opacity: 0.26 },
    { id: 9, size: 2.7, x: 81.6, y: 88.9, duration: 10.9, delay: 0.8, opacity: 0.17 },
    { id: 10, size: 1.5, x: 55.4, y: 23.1, duration: 12.6, delay: 3.4, opacity: 0.21 },
    { id: 11, size: 3.6, x: 18.7, y: 7.6, duration: 7.8, delay: 5.6, opacity: 0.13 },
    { id: 12, size: 2.2, x: 95.3, y: 55.5, duration: 11.2, delay: 2.5, opacity: 0.24 },
    { id: 13, size: 3.3, x: 31.9, y: 38.7, duration: 9.7, delay: 1.1, opacity: 0.19 },
    { id: 14, size: 1.7, x: 62.8, y: 71.2, duration: 13.5, delay: 4.8, opacity: 0.16 },
    { id: 15, size: 2.8, x: 9.1, y: 96.4, duration: 6.9, delay: 0.3, opacity: 0.23 },
    { id: 16, size: 3.9, x: 48.5, y: 4.2, duration: 14.5, delay: 3.1, opacity: 0.10 },
    { id: 17, size: 2.0, x: 86.4, y: 49.8, duration: 8.4, delay: 5.9, opacity: 0.25 },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Hero() {
    const [name, setName]           = useState("");
    const [phone, setPhone]         = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [focused, setFocused]     = useState<string | null>(null);
    const [count, setCount]         = useState(0);
    const [wordIndex, setWordIndex] = useState(0);
    const [dashPeriod, setDashPeriod] = useState<DashPeriod>("daily");
    const [pulse, setPulse]         = useState(false);

    const [salesCount, setSalesCount]     = useState(0);
    const [orderCount, setOrderCount]     = useState(0);
    const [invoiceCount, setInvoiceCount] = useState(0);
    const [cashDisplay, setCashDisplay]   = useState(periodData.daily.cash);
    const [cashSubDisplay, setCashSubDisplay] = useState(periodData.daily.cashSub);

    // Notification / particle system state
    type LivePhase = "idle" | "rising" | "materializing" | "staying" | "exiting";
    const [livePhase, setLivePhase]   = useState<LivePhase>("idle");
    const [notifIndex, setNotifIndex] = useState(0);
    const [cycleKey, setCycleKey]     = useState(0);   // remounts particles fresh each cycle
    const [glowIndex, setGlowIndex]   = useState(-1);

    const heroRef = useRef<HTMLDivElement>(null);

    // ── Count-up on period change ─────────────────────────────────────────────
    useEffect(() => {
        const target = periodData[dashPeriod];
        let step = 0;
        const fps = 60, totalSteps = Math.round((1200 / 1000) * fps);
        let s0 = 0, o0 = 0, i0 = 0;
        setSalesCount(p  => { s0 = p; return p; });
        setOrderCount(p  => { o0 = p; return p; });
        setInvoiceCount(p => { i0 = p; return p; });
        setCashDisplay(target.cash);
        setCashSubDisplay(target.cashSub);
        const t = setInterval(() => {
            step++;
            const ease = 1 - Math.pow(1 - step / totalSteps, 3);
            setSalesCount(Math.floor(s0 + (target.sales   - s0) * ease));
            setOrderCount(Math.floor(o0 + (target.orders  - o0) * ease));
            setInvoiceCount(Math.floor(i0 + (target.invoices - i0) * ease));
            if (step >= totalSteps) {
                setSalesCount(target.sales); setOrderCount(target.orders); setInvoiceCount(target.invoices);
                clearInterval(t);
            }
        }, 1000 / fps);
        return () => clearInterval(t);
    }, [dashPeriod]);

    // ── Business counter ──────────────────────────────────────────────────────
    useEffect(() => {
        let step = 0;
        const t = setInterval(() => {
            step++;
            const ease = 1 - Math.pow(1 - step / 90, 3);
            setCount(Math.floor(ease * 1500));
            if (step >= 90) { setCount(1500); clearInterval(t); }
        }, 1000 / 60);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        if (count < 1500) return;
        const t = setInterval(() => setCount(p => p + Math.floor(Math.random() * 2) + 1), 3000 + Math.random() * 3000);
        return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [count >= 1500]);

    useEffect(() => {
        if (count > 1500) { setPulse(true); const t = setTimeout(() => setPulse(false), 500); return () => clearTimeout(t); }
    }, [count]);

    // ── Rotating headline words ───────────────────────────────────────────────
    useEffect(() => {
        const t = setInterval(() => setWordIndex(p => (p + 1) % rotatingWords.length), 3000);
        return () => clearInterval(t);
    }, []);

    // ── Mouse parallax ────────────────────────────────────────────────────────
    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!heroRef.current) return;
            const r = heroRef.current.getBoundingClientRect();
            heroRef.current.style.setProperty("--mx", `${(e.clientX - r.left) / r.width - 0.5}`);
            heroRef.current.style.setProperty("--my", `${(e.clientY - r.top) / r.height - 0.5}`);
        };
        const el = heroRef.current;
        el?.addEventListener("mousemove", onMove);
        return () => el?.removeEventListener("mousemove", onMove);
    }, []);

    // ── Live particle + notification state machine ─────────────────────────────
    // rising(1300ms) → materializing(900ms) → staying(4000ms) → exiting(750ms) → [next]
    useEffect(() => {
        let t: ReturnType<typeof setTimeout>;

        const runCycle = (idx: number) => {
            setCycleKey(k => k + 1);
            setNotifIndex(idx);
            setGlowIndex(0);
            setLivePhase("rising");

            t = setTimeout(() => {
                setLivePhase("materializing");

                t = setTimeout(() => {
                    setLivePhase("staying");

                    t = setTimeout(() => {
                        setLivePhase("exiting");

                        t = setTimeout(() => {
                            setGlowIndex(-1);
                            setLivePhase("idle");
                            t = setTimeout(() => runCycle((idx + 1) % liveNotifications.length), 350);
                        }, 750);
                    }, 4000);
                }, 900);
            }, 1300);
        };

        t = setTimeout(() => runCycle(0), 2200);
        return () => clearTimeout(t);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && phone) setSubmitted(true);
    };

    const activeNotif = liveNotifications[notifIndex];
    const cardVisible  = livePhase === "materializing" || livePhase === "staying" || livePhase === "exiting";
    const particlesOn  = livePhase === "rising" || livePhase === "materializing";

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <section
            ref={heroRef}
            style={{
                position: "relative",
                minHeight: "100vh",
                backgroundColor: "#FFFFFF",
                overflow: "hidden",
                color: "#111827",
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
            }}
        >
            {/* ── BACKGROUND ───────────────────────────────────────────────── */}
            <div style={{ position: "absolute", top: "5%", right: "-5%", width: "860px", height: "860px", background: "radial-gradient(ellipse at center, rgba(120,134,199,0.13) 0%, rgba(120,134,199,0.05) 45%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
            <div style={{ position: "absolute", bottom: "5%", left: "-8%", width: "500px", height: "500px", background: "radial-gradient(ellipse at center, rgba(120,134,199,0.06) 0%, transparent 65%)", pointerEvents: "none", zIndex: 0 }} />
            <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(120,134,199,0.12) 1px, transparent 1px)", backgroundSize: "32px 32px", pointerEvents: "none", zIndex: 0, maskImage: "radial-gradient(ellipse 80% 70% at 65% 40%, black 0%, transparent 100%)", WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 65% 40%, black 0%, transparent 100%)" }} />
            {BG_PARTICLES.map(p => (
                <div key={p.id} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, width: `${p.size}px`, height: `${p.size}px`, borderRadius: "50%", background: `rgba(120,134,199,${p.opacity})`, boxShadow: `0 0 ${p.size * 3}px rgba(120,134,199,${p.opacity * 1.5})`, animation: `particleFloat ${p.duration}s ${p.delay}s ease-in-out infinite`, pointerEvents: "none", zIndex: 0, willChange: "transform" }} />
            ))}

            {/* ── CONTENT ──────────────────────────────────────────────────── */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", paddingTop: "7rem", paddingBottom: "5rem", position: "relative", zIndex: 2 }}>
                <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 2rem", display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: "5rem", alignItems: "center", width: "100%" }} className="hero-grid">

                    {/* ── LEFT COLUMN ──────────────────────────────────────── */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

                        {/* Badge */}
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.625rem", background: "white", border: "1px solid rgba(120,134,199,0.12)", borderRadius: "9999px", padding: "0.4rem 1rem", width: "fit-content", boxShadow: "0 4px 12px rgba(120,134,199,0.04)", animation: "fadeUp 0.8s 0.1s cubic-bezier(0.22,1,0.36,1) both" }}>
                            <span style={{ fontSize: "1rem" }}>⚡</span>
                            <span style={{ fontSize: "0.875rem", color: "#111827", fontWeight: 600 }}>7 Gün Ücretsiz Deneme</span>
                        </div>

                        {/* Headline */}
                        <div>
                            <h1 style={{ fontSize: "clamp(2.8rem, 5.5vw, 4.5rem)", fontWeight: 900, lineHeight: 1.2, color: "#111827", letterSpacing: "-0.02em", margin: 0 }}>
                                <div style={{ animation: "fadeUp 0.8s 0.2s cubic-bezier(0.22,1,0.36,1) both" }}>İşletmenizi</div>
                                <div style={{ animation: "fadeUp 0.8s 0.3s cubic-bezier(0.22,1,0.36,1) both" }}>Tek Ekrandan</div>
                                <div style={{ animation: "fadeUp 0.8s 0.4s cubic-bezier(0.22,1,0.36,1) both", position: "relative", height: "1.3em", overflow: "hidden", display: "inline-block" }}>
                                    <AnimatePresence mode="wait">
                                        <motion.span
                                            key={rotatingWords[wordIndex]}
                                            initial={{ y: "100%", opacity: 0 }}
                                            animate={{ y: "0%", opacity: 1 }}
                                            exit={{ y: "-100%", opacity: 0 }}
                                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                            style={{ display: "block", willChange: "transform, opacity", background: "linear-gradient(135deg, #7886C7 0%, #5A659F 60%, #9AA7DF 100%)", backgroundSize: "200% 200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "gradientShift 4s ease infinite" }}
                                        >
                                            {rotatingWords[wordIndex]}
                                        </motion.span>
                                    </AnimatePresence>
                                </div>
                            </h1>
                            <p style={{ marginTop: "1.5rem", fontSize: "1.125rem", color: "#4b5563", lineHeight: 1.7, maxWidth: "480px", fontWeight: 500, animation: "fadeUp 0.8s 0.5s cubic-bezier(0.22,1,0.36,1) both" }}>
                                Satış, stok, raporlama, cari hesap ve e-fatura süreçlerinizi JetPOS ile kolayca yönetin.
                            </p>
                        </div>

                        {/* Social proof */}
                        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap", animation: "fadeUp 0.8s 0.6s cubic-bezier(0.22,1,0.36,1) both" }}>
                            <div style={{ display: "flex" }}>
                                {["#7886C7", "#4F46E5", "#6366F1", "#818CF8"].map((c, i) => (
                                    <div key={i} style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", backgroundImage: `linear-gradient(135deg, ${c}dd, ${c}88)`, border: "2px solid #F8FAFC", marginLeft: i === 0 ? 0 : "-0.75rem", fontSize: "0.75rem", color: "white", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                                        {["J", "P", "O", "S"][i]}
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", position: "relative", width: "8px", height: "8px", borderRadius: "50%", background: "#10B981" }}>
                                    <span style={{ position: "absolute", width: "100%", height: "100%", borderRadius: "50%", background: "#10B981", animation: "pulseDot 1.5s infinite" }} />
                                </span>
                                <div style={{ position: "relative", height: "1.35rem", overflow: "hidden", display: "inline-flex", alignItems: "center" }}>
                                    <AnimatePresence mode="popLayout">
                                        <motion.strong key={count} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} style={{ display: "inline-block", color: "#111827", fontWeight: 800, fontSize: "0.9rem" }}>
                                            {count.toLocaleString("tr-TR")}+ işletme
                                        </motion.strong>
                                    </AnimatePresence>
                                </div>
                                <span style={{ fontSize: "0.9rem", color: "#4b5563", fontWeight: 600 }}>JetPOS&apos;a güveniyor</span>
                            </div>
                        </div>

                        {/* Form */}
                        <div style={{ background: "white", border: "1px solid rgba(120,134,199,0.15)", borderRadius: "1.5rem", padding: "1.75rem", boxShadow: "0 20px 40px rgba(120,134,199,0.03), 0 1px 3px rgba(120,134,199,0.02)", maxWidth: "460px", animation: "fadeUp 0.8s 0.7s cubic-bezier(0.22,1,0.36,1) both" }}>
                            {submitted ? (
                                <div style={{ textAlign: "center", padding: "2rem 0" }}>
                                    <div style={{ width: "4rem", height: "4rem", background: "rgba(120,134,199,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                                        <CheckCircle style={{ width: "2rem", height: "2rem", color: "#7886C7" }} />
                                    </div>
                                    <p style={{ color: "#111827", fontWeight: 800, fontSize: "1.25rem", margin: "0 0 0.5rem" }}>Talebiniz Alındı!</p>
                                    <p style={{ color: "#6b7280", fontSize: "1rem", margin: 0 }}>Uzman ekibimiz sizi en kısa sürede arayacak.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <div style={{ marginBottom: "1.25rem" }}>
                                        <p style={{ color: "#111827", fontWeight: 800, fontSize: "1.125rem", margin: "0 0 0.25rem" }}>Hemen Sizi Arayalım</p>
                                        <p style={{ color: "#6b7280", fontSize: "0.875rem", margin: 0 }}>Birkaç dakika içinde geri dönüş</p>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", marginBottom: "1.25rem" }}>
                                        {[
                                            { id: "name",  icon: User,  placeholder: "Ad Soyad",         value: name,  onChange: setName,  type: "text" },
                                            { id: "phone", icon: Phone, placeholder: "Telefon Numaranız", value: phone, onChange: setPhone, type: "tel"  },
                                        ].map(({ id, icon: Icon, placeholder, value, onChange, type }) => (
                                            <div key={id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "#F8FAFC", border: `1px solid ${focused === id ? "rgba(120,134,199,0.6)" : "rgba(120,134,199,0.15)"}`, borderRadius: "0.75rem", padding: "0.875rem 1rem", transition: "all 0.2s ease", boxShadow: focused === id ? "0 0 0 4px rgba(120,134,199,0.12)" : "none" }}>
                                                <Icon style={{ width: "1rem", height: "1rem", color: focused === id ? "#7886C7" : "#9ca3af", flexShrink: 0, transition: "color 0.2s" }} />
                                                <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} onFocus={() => setFocused(id)} onBlur={() => setFocused(null)} required style={{ background: "none", border: "none", outline: "none", color: "#111827", fontSize: "0.95rem", width: "100%", fontFamily: "inherit", fontWeight: 500 }} />
                                            </div>
                                        ))}
                                    </div>
                                    <button type="submit" className="cta-btn" style={{ width: "100%", padding: "1rem", backgroundImage: "linear-gradient(135deg, #7886C7, #5A659F)", color: "white", fontWeight: 700, fontSize: "1rem", border: "none", borderRadius: "0.875rem", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(120,134,199,0.25)", transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                                        Hemen Başlayın
                                        <ArrowRight className="arrow-icon" style={{ width: "1rem", height: "1rem", transition: "transform 0.3s" }} />
                                    </button>
                                    <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#9ca3af", margin: "1rem 0 0" }}>Bilgileriniz gizli tutulur — KVKK uyumlu</p>
                                </form>
                            )}
                        </div>

                    </div>

                    {/* ── RIGHT COLUMN ─────────────────────────────────────── */}
                    <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", animation: "slideInRight 0.8s 0.2s cubic-bezier(0.22,1,0.36,1) both" }}>
                        {/* Parallax */}
                        <div style={{ transform: "translate3d(calc(var(--mx,0)*15px), calc(var(--my,0)*15px), 0)", transition: "transform 0.2s cubic-bezier(0.25,1,0.5,1)" }}>
                            {/* Float wrapper */}
                            <div style={{ display: "flex", alignItems: "center", gap: "2.5rem", position: "relative", animation: "floatMain 8s ease-in-out infinite", paddingTop: "3rem" }}>

                                {/* Ticker */}
                                <div className="ticker-wrap" style={{ position: "absolute", top: 0, left: 0, zIndex: 10, width: "420px" }}>
                                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "35px", zIndex: 2, background: "linear-gradient(to right, #EEF2FF, transparent)", pointerEvents: "none" }} />
                                    <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "35px", zIndex: 2, background: "linear-gradient(to left, #EEF2FF, transparent)", pointerEvents: "none" }} />
                                    <div className="ticker-track">
                                        {["Anlık Satış Takibi","Stok Yönetimi","E-Fatura Entegrasyonu","ÖKC Uyumlu","Bulut Tabanlı","Çoklu Şube Yönetimi","Cari Hesap Takibi","Mobil Erişim","Barkod Sistemi","Anlık Raporlama"].concat(["Anlık Satış Takibi","Stok Yönetimi","E-Fatura Entegrasyonu","ÖKC Uyumlu","Bulut Tabanlı","Çoklu Şube Yönetimi","Cari Hesap Takibi","Mobil Erişim","Barkod Sistemi","Anlık Raporlama"]).map((item, i) => (
                                            <div key={i} className="ticker-item">
                                                <span className="ticker-check">✓</span>
                                                <span>{item}</span>
                                                <span className="ticker-separator">✦</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* ── Dashboard Card ── */}
                                <div className="dashboard-card" style={{ background: "rgba(10,15,30,0.95)", backdropFilter: "blur(20px)", borderRadius: "1.5rem", padding: "2.25rem 2rem", width: "420px", height: "620px", boxShadow: "20px 50px 100px -20px rgba(0,0,0,0.45), 0 0 80px -10px rgba(120,134,199,0.35), 0 0 0 1px rgba(255,255,255,0.1) inset", display: "flex", flexDirection: "column", justifyContent: "space-between", transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
                                    {/* Header */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "1rem" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <div style={{ width: "2rem", height: "2rem", background: "rgba(120,134,199,0.15)", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <BarChart3 style={{ width: "1rem", height: "1rem", color: "#7886C7" }} />
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column" }}>
                                                <span style={{ color: "white", fontWeight: 700, fontSize: "0.9rem", lineHeight: 1.2 }}>JetPOS Canlı Panel</span>
                                                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#7886C7", display: "inline-block", animation: "pulseDot 1.5s infinite" }} />
                                                    Canlı İzleme
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: "0.25rem", background: "rgba(255,255,255,0.05)", borderRadius: "9999px", padding: "0.15rem" }}>
                                            {(["daily","monthly","yearly"] as DashPeriod[]).map(p => (
                                                <button key={p} onClick={() => setDashPeriod(p)} style={{ padding: "0.2rem 0.6rem", borderRadius: "9999px", border: "none", cursor: "pointer", fontSize: "0.65rem", fontWeight: 700, fontFamily: "inherit", transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)", background: dashPeriod === p ? "rgba(120,134,199,0.25)" : "transparent", color: dashPeriod === p ? "#A8B4E0" : "rgba(255,255,255,0.35)", boxShadow: dashPeriod === p ? "0 0 12px rgba(120,134,199,0.3)" : "none" }}>
                                                    {periodData[p].label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Main stat */}
                                    <div style={{ marginBottom: "1rem" }}>
                                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", marginBottom: "0.3rem", fontWeight: 600 }}>{periodData[dashPeriod].salesLabel}</p>
                                        <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                                            <h3 style={{ fontSize: "2rem", fontWeight: 800, color: "white", margin: 0, lineHeight: 1, letterSpacing: "-0.02em" }}>₺{salesCount.toLocaleString("tr-TR")}</h3>
                                            <span style={{ color: "#7886C7", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.125rem" }}>
                                                <TrendingUp style={{ width: "0.8rem", height: "0.8rem" }} /> {periodData[dashPeriod].growth}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Sparkline */}
                                    <div style={{ margin: "1rem 0 1.5rem" }}>
                                        <svg viewBox="0 0 300 50" width="100%" height="50" style={{ overflow: "visible" }}>
                                            <defs>
                                                <linearGradient id="glowGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%"   stopColor="#7886C7" stopOpacity="0.3"/>
                                                    <stop offset="100%" stopColor="#7886C7" stopOpacity="0.0"/>
                                                </linearGradient>
                                            </defs>
                                            <path d="M 0 35 Q 30 18 60 28 T 120 12 T 180 22 T 240 8 T 300 12" fill="none" stroke="#7886C7" strokeWidth="2.5"/>
                                            <path d="M 0 35 Q 30 18 60 28 T 120 12 T 180 22 T 240 8 T 300 12 L 300 50 L 0 50 Z" fill="url(#glowGrad)"/>
                                            <circle cx="300" cy="12" r="3.5" fill="#7886C7"/>
                                        </svg>
                                    </div>

                                    {/* Metrics */}
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1.25rem" }}>
                                        {[
                                            { label: `${periodData[dashPeriod].label} Sipariş`, val: `${orderCount.toLocaleString("tr-TR")} Adet`, icon: ShoppingCart, desc: "Anlık sipariş akışı" },
                                            { label: "Stok Durumu", val: "3 Kritik", icon: Package, desc: "Sipariş gerekli", warning: true },
                                            { label: "E-Fatura", val: `${invoiceCount.toLocaleString("tr-TR")} Başarılı`, icon: FileText, desc: "%100 hatasız gönderim" },
                                            { label: "Kasa Özeti", val: cashDisplay, icon: Wallet, desc: cashSubDisplay }
                                        ].map((item, i) => (
                                            <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "0.625rem", padding: "0.75rem 0.875rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.1rem" }}>
                                                    <item.icon style={{ width: "0.8rem", height: "0.8rem", color: item.warning ? "#f59e0b" : "#7886C7" }} />
                                                    <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{item.label}</span>
                                                </div>
                                                <span style={{ fontSize: "0.9rem", color: "white", fontWeight: 700 }}>{item.val}</span>
                                                <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.desc}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* ── Timeline + Notification System ── */}
                                {/*
                                    z-index stacking within this wrapper:
                                    4  = sparkle particles (BEHIND frosted glass card)
                                    10 = timeline card (frosted glass)
                                    25 = notification card (ABOVE everything)
                                */}
                                <div style={{ position: "relative", zIndex: 0 }}>

                                    {/* ✨ SPARKLE PARTICLES
                                        Each particle starts INSIDE the card body (yStart px from card top).
                                        z-index 4 → they appear behind the frosted glass (which has z-index 10).
                                        As they float upward past the card's top edge, they fully emerge. */}
                                    {SPARKLE_PARTICLES.map(p => (
                                        <motion.div
                                            key={`spark-${cycleKey}-${p.id}`}
                                            initial={{ opacity: 0, y: 0, scale: 0.4, filter: "blur(5px)" }}
                                            animate={
                                                !particlesOn
                                                    ? { opacity: 0, y: 0, scale: 0.4, filter: "blur(5px)" }
                                                    : livePhase === "rising"
                                                    ? { opacity: p.opacity, y: -p.yRise, scale: 1, filter: "blur(0.4px)" }
                                                    : { opacity: 0, y: -(p.yRise + 44), scale: 0.25, filter: "blur(8px)" }
                                            }
                                            transition={
                                                livePhase === "rising"
                                                    ? { duration: 1.3, delay: p.delay, ease: [0.22, 1, 0.36, 1] }
                                                    : livePhase === "materializing"
                                                    ? { duration: 0.7, ease: "easeIn" }
                                                    : { duration: 0 }
                                            }
                                            style={{
                                                position: "absolute",
                                                right: `${p.right}px`,
                                                top: `${p.yStart}px`,
                                                zIndex: 4,
                                                pointerEvents: "none",
                                            }}
                                        >
                                            {/* ✨ Cross-beam sparkle shape */}
                                            <div style={{ position: "relative", width: `${p.size}px`, height: `${p.size}px` }}>
                                                {/* Core glow orb */}
                                                <div style={{ width: `${p.size}px`, height: `${p.size}px`, borderRadius: "50%", background: "white", boxShadow: `0 0 ${p.size * 1.2}px ${p.size * 0.6}px rgba(120,134,199,0.95), 0 0 ${p.size * 2.5}px ${p.size}px rgba(120,134,199,0.55), 0 0 ${p.size * 5}px ${p.size * 2}px rgba(120,134,199,0.2)` }} />
                                                {/* Horizontal beam */}
                                                <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: `${p.size * 3.5}px`, height: "1.5px", background: "linear-gradient(90deg, transparent, rgba(120,134,199,0.85) 40%, white 50%, rgba(120,134,199,0.85) 60%, transparent)", filter: "blur(0.6px)" }} />
                                                {/* Vertical beam */}
                                                <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: "1.5px", height: `${p.size * 3.5}px`, background: "linear-gradient(180deg, transparent, rgba(120,134,199,0.85) 40%, white 50%, rgba(120,134,199,0.85) 60%, transparent)", filter: "blur(0.6px)" }} />
                                            </div>
                                        </motion.div>
                                    ))}

                                    {/* NOTIFICATION CARD — materialises from the converged particle cloud */}
                                    <AnimatePresence>
                                        {cardVisible && (
                                            <motion.div
                                                key={`card-${notifIndex}-${cycleKey}`}
                                                initial={{ opacity: 0, y: 28, scale: 0.87, filter: "blur(10px)" }}
                                                animate={
                                                    livePhase === "exiting"
                                                        ? { opacity: 0, y: -20, scale: 1.04, filter: "blur(6px)" }
                                                        : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
                                                }
                                                transition={
                                                    livePhase === "exiting"
                                                        ? { duration: 0.75, ease: [0.55, 0, 1, 0.45] }
                                                        : { duration: 0.95, ease: [0.22, 1, 0.36, 1] }
                                                }
                                                style={{
                                                    position: "absolute",
                                                    top: "-120px",
                                                    right: "-14px",
                                                    zIndex: 25,
                                                    pointerEvents: "none",
                                                    ...(livePhase === "staying" ? { animation: "notifIdleFloat 3.8s ease-in-out infinite" } : {}),
                                                }}
                                            >
                                                {/* Residual particle glow halo */}
                                                <div style={{ position: "absolute", inset: "-14px", borderRadius: "24px", background: `radial-gradient(ellipse at 55% 85%, ${activeNotif.color}20 0%, transparent 70%)`, filter: "blur(8px)", pointerEvents: "none" }} />
                                                {/* Connector thread */}
                                                <div style={{ position: "absolute", bottom: "-14px", right: "24px", width: "1px", height: "14px", background: `linear-gradient(to bottom, ${activeNotif.color}80, transparent)` }} />
                                                {/* Card body */}
                                                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", background: "rgba(255,255,255,0.93)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: `1px solid ${activeNotif.colorBorder}`, borderRadius: "14px", padding: "0.72rem 0.95rem", boxShadow: `0 16px 48px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.05), 0 0 0 1px rgba(255,255,255,0.95) inset, 0 0 28px ${activeNotif.color}18`, minWidth: "198px", maxWidth: "218px" }}>
                                                    <div style={{ width: "30px", height: "30px", borderRadius: "9px", background: activeNotif.colorBg, border: `1px solid ${activeNotif.colorBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                        <activeNotif.Icon style={{ width: "14px", height: "14px", color: activeNotif.color, strokeWidth: 2.2 }} />
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, color: "#111827", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activeNotif.label}</p>
                                                        <p style={{ margin: "0.18rem 0 0", fontSize: "0.65rem", color: "#6b7280", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activeNotif.desc}</p>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.3rem" }}>
                                                            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: activeNotif.color, boxShadow: `0 0 6px ${activeNotif.color}`, flexShrink: 0, display: "inline-block", animation: "pulseDot 1.4s infinite" }} />
                                                            <p style={{ margin: 0, fontSize: "0.6rem", color: activeNotif.color, fontWeight: 600 }}>Şimdi</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* TIMELINE CARD — frosted glass, z-index 10 so particles appear behind it */}
                                    <div className="timeline-card" style={{ position: "relative", zIndex: 10, width: "300px", height: "496px", background: "rgba(255,255,255,0.45)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(120,134,199,0.12)", borderRadius: "1.5rem", padding: "1.75rem 1.5rem", boxShadow: "0 30px 60px -15px rgba(120,134,199,0.08), 0 0 0 1px rgba(255,255,255,0.5) inset", display: "flex", flexDirection: "column", overflow: "visible" }}>

                                        {/* CANLÌ badge — notification card connector point */}
                                        <div style={{ position: "absolute", top: "-11px", right: "14px", display: "flex", alignItems: "center", gap: "0.3rem", background: "rgba(255,255,255,0.96)", border: "1px solid rgba(120,134,199,0.2)", borderRadius: "9999px", padding: "0.2rem 0.55rem", boxShadow: glowIndex >= 0 ? "0 0 0 3px rgba(120,134,199,0.18), 0 2px 12px rgba(120,134,199,0.2)" : "0 2px 10px rgba(120,134,199,0.1)", zIndex: 26, transition: "box-shadow 0.5s ease" }}>
                                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: glowIndex >= 0 ? "#7886C7" : "#10B981", display: "inline-block", animation: "pulseDot 1.2s infinite", boxShadow: glowIndex >= 0 ? "0 0 10px #7886C7" : "0 0 6px #10B981", transition: "background 0.5s, box-shadow 0.5s" }} />
                                            <span style={{ fontSize: "0.62rem", fontWeight: 800, color: "#374151", letterSpacing: "0.04em" }}>CANLI</span>
                                        </div>

                                        {/* Vertical timeline line */}
                                        <div style={{ position: "absolute", left: "34px", top: "1.75rem", bottom: "1.75rem", width: "2px", background: "linear-gradient(180deg, rgba(120,134,199,0.08) 0%, rgba(120,134,199,0.5) 50%, rgba(120,134,199,0.08) 100%)", boxShadow: "0 0 8px rgba(120,134,199,0.4)", zIndex: 1 }} />

                                        {/* Events */}
                                        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", position: "relative", zIndex: 2 }}>
                                            {feedEvents.map((event, index) => (
                                                <div key={index} className="activity-item" style={{ display: "flex", alignItems: "flex-start", position: "relative", padding: "0.75rem 0.5rem 0.75rem 1.75rem", cursor: "pointer", borderRadius: "0.75rem", ...({ "--dot-color": event.color } as React.CSSProperties) }}>
                                                    {/* Icon badge — left:1px centers the 18px badge on the line at card-left+34px */}
                                                    <div className="activity-dot" style={{ position: "absolute", left: "1px", top: "50%", transform: index === 0 && glowIndex === 0 ? "translateY(-50%) scale(1.15)" : "translateY(-50%)", width: "18px", height: "18px", borderRadius: "6px", background: "white", border: `1.5px solid ${event.color}`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3, boxShadow: index === 0 && glowIndex === 0 ? `0 0 12px ${event.color}80, 0 0 24px ${event.color}40` : `0 2px 5px ${event.color}30`, transition: "box-shadow 0.5s ease, transform 0.3s cubic-bezier(0.16,1,0.3,1)" }}>
                                                        <event.Icon style={{ width: "9px", height: "9px", color: event.color, strokeWidth: 2.5 }} />
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0, paddingRight: "0.5rem" }}>
                                                        <p style={{ margin: 0, fontSize: "0.825rem", color: "#0f172a", fontWeight: 700, lineHeight: 1.2 }}>{event.title}</p>
                                                        <p style={{ margin: 0, fontSize: "0.725rem", color: "#475569", marginTop: "0.25rem", lineHeight: 1.2 }}>{event.desc}</p>
                                                    </div>
                                                    <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, flexShrink: 0 }}>{event.time}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                </div>

                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* ── STYLES ─────────────────────────────────────────────────────── */}
            <style>{`
                @keyframes slideInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes fadeUp       { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes floatMain    { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
                @keyframes pulseDot     { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
                @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                @keyframes particleFloat {
                    0%, 100% { transform: translateY(0) translateX(0); opacity: 0.6; }
                    33%      { transform: translateY(-18px) translateX(8px); opacity: 1; }
                    66%      { transform: translateY(-8px) translateX(-6px); opacity: 0.7; }
                }
                @keyframes notifIdleFloat {
                    0%, 100% { transform: translateY(0) rotate(-0.3deg); }
                    50%      { transform: translateY(-5px) rotate(0.3deg); }
                }

                .cta-btn:hover { transform: translateY(-2px) scale(1.02) !important; box-shadow: 0 12px 32px rgba(120,134,199,0.4) !important; }
                .cta-btn:hover .arrow-icon { transform: translateX(4px) !important; }

                .activity-item { transition: all 0.3s cubic-bezier(0.16,1,0.3,1); opacity: 0.9; }
                .activity-item:hover { opacity: 1; transform: translateX(4px); background: rgba(120,134,199,0.05); }
                .activity-item:hover .activity-dot { transform: translateY(-50%) scale(1.35) !important; box-shadow: 0 0 14px var(--dot-color) !important; }

                .ticker-wrap { display: flex; align-items: center; overflow: hidden; width: 100%; max-width: 400px; height: 38px; background: rgba(120,134,199,0.04); border: 1px solid rgba(120,134,199,0.15); border-radius: 9999px; position: relative; backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); box-shadow: 0 4px 12px rgba(120,134,199,0.02); }
                .ticker-track { display: flex; width: max-content; animation: tickerLoop 24s linear infinite; gap: 1.5rem; padding-left: 0.75rem; }
                .ticker-track:hover { animation-play-state: paused; }
                .ticker-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.825rem; font-weight: 700; color: #5A659F; white-space: nowrap; }
                .ticker-check { color: #7886C7; font-weight: 900; text-shadow: 0 0 6px rgba(120,134,199,0.5); }
                .ticker-separator { color: rgba(120,134,199,0.35); font-size: 0.875rem; margin-left: 0.5rem; }
                @keyframes tickerLoop { 0% { transform: translate3d(0,0,0); } 100% { transform: translate3d(-50%,0,0); } }

                @media (max-width: 960px) {
                    .hero-grid { grid-template-columns: 1fr !important; gap: 3rem !important; text-align: center; }
                    .hero-grid > div:first-child { align-items: center; }
                    .timeline-card { display: none !important; }
                    .dashboard-card { width: 100% !important; max-width: 420px !important; }
                    .ticker-wrap { width: 100% !important; max-width: 420px !important; left: 50% !important; transform: translateX(-50%) !important; }
                }
                @media (max-width: 480px) {
                    .dashboard-card { padding: 1.5rem 1.25rem !important; height: auto !important; min-height: 520px !important; }
                    .dashboard-card h3 { font-size: 1.5rem !important; }
                    .dashboard-card > div:last-child { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </section>
    );
}
