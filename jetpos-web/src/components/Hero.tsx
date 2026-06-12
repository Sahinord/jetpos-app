"use client";

import React, { useState, useEffect, useRef } from "react";
import { Phone, User, TrendingUp, ShoppingCart, Bell, AlertCircle, ArrowRight, CheckCircle, BarChart3, Package, FileText, Wallet } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const feedEvents = [
    { title: "Yeni sipariş tamamlandı", desc: "₺1.240 barkodlu ödeme alındı", time: "Şimdi", color: "#10B981" },
    { title: "Günlük hedef aşıldı", desc: "Bugün ₺28.450 satış yapıldı", time: "2 dk önce", color: "#7886C7" },
    { title: "Düşük stok uyarısı", desc: "3 ürün için sipariş gerekli", time: "5 dk önce", color: "#f59e0b" },
    { title: "Yeni ürün eklendi", desc: "Stok sisteme kaydedildi", time: "8 dk önce", color: "#8b5cf6" },
];

const rotatingWords = ["Yönetin.", "Büyütün.", "Dijitalleştirin.", "Hızlandırın."];

type DashPeriod = "daily" | "monthly" | "yearly";
const periodData: Record<DashPeriod, { label: string; sales: number; orders: number; invoices: number; cash: string; cashSub: string; growth: string; salesLabel: string }> = {
    daily:   { label: "Günlük", salesLabel: "Günlük Satış Hacmi", sales: 28450,    orders: 142,   invoices: 98,   cash: "₺18.250 Nakit",    cashSub: "₺10.200 Kredi / POS",   growth: "+250%" },
    monthly: { label: "Aylık",  salesLabel: "Aylık Satış Hacmi",  sales: 854200,   orders: 4260,  invoices: 2940, cash: "₺547.500 Nakit",   cashSub: "₺306.700 Kredi / POS",  growth: "+180%" },
    yearly:  { label: "Yıllık", salesLabel: "Yıllık Satış Hacmi", sales: 10250000, orders: 51120, invoices: 35280,cash: "₺6.570.000 Nakit", cashSub: "₺3.680.000 Kredi / POS",growth: "+320%" },
};

export default function Hero() {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [focused, setFocused] = useState<string | null>(null);
    const [count, setCount] = useState(0);
    const [wordIndex, setWordIndex] = useState(0);
    const [dashPeriod, setDashPeriod] = useState<DashPeriod>("daily");
    
    // Live dashboard metrics count-up states
    const [salesCount, setSalesCount] = useState(0);
    const [orderCount, setOrderCount] = useState(0);
    const [invoiceCount, setInvoiceCount] = useState(0);
    const [cashDisplay, setCashDisplay] = useState(periodData.daily.cash);
    const [cashSubDisplay, setCashSubDisplay] = useState(periodData.daily.cashSub);
    const [pulse, setPulse] = useState(false);

    const heroRef = useRef<HTMLDivElement>(null);

    // Easing count up animation for counters — re-runs when dashPeriod changes
    useEffect(() => {
        const target = periodData[dashPeriod];
        let currentStep = 0;
        const duration = 1200; // ms
        const fps = 60;
        const totalSteps = Math.round((duration / 1000) * fps);
        
        // Capture starting values for smooth transition
        let startSales = 0, startOrders = 0, startInvoices = 0;
        setSalesCount(prev => { startSales = prev; return prev; });
        setOrderCount(prev => { startOrders = prev; return prev; });
        setInvoiceCount(prev => { startInvoices = prev; return prev; });

        setCashDisplay(target.cash);
        setCashSubDisplay(target.cashSub);
        
        const timer = setInterval(() => {
            currentStep++;
            const progress = currentStep / totalSteps;
            // Easing out cubic
            const ease = 1 - Math.pow(1 - progress, 3);
            
            setSalesCount(Math.floor(startSales + (target.sales - startSales) * ease));
            setOrderCount(Math.floor(startOrders + (target.orders - startOrders) * ease));
            setInvoiceCount(Math.floor(startInvoices + (target.invoices - startInvoices) * ease));
            
            if (currentStep >= totalSteps) {
                setSalesCount(target.sales);
                setOrderCount(target.orders);
                setInvoiceCount(target.invoices);
                clearInterval(timer);
            }
        }, 1000 / fps);
        
        return () => clearInterval(timer);
    }, [dashPeriod]);

    // One-time count-up for business counter badge
    useEffect(() => {
        let step = 0;
        const total = 90; // ~1.5s at 60fps
        const timer = setInterval(() => {
            step++;
            const ease = 1 - Math.pow(1 - step / total, 3);
            setCount(Math.floor(ease * 1500));
            if (step >= total) { setCount(1500); clearInterval(timer); }
        }, 1000 / 60);
        return () => clearInterval(timer);
    }, []);

    // Live continuous increment for the business counter
    useEffect(() => {
        if (count < 1500) return;

        const liveInterval = setInterval(() => {
            setCount(prev => prev + Math.floor(Math.random() * 2) + 1);
        }, 3000 + Math.random() * 3000); // Increment every 3-6 seconds

        return () => clearInterval(liveInterval);
    }, [count >= 1500]);

    // Micro-animation pulse trigger on increment
    useEffect(() => {
        if (count > 1500) {
            setPulse(true);
            const timer = setTimeout(() => setPulse(false), 500);
            return () => clearTimeout(timer);
        }
    }, [count]);

    // Rotating word animation for hero headline
    useEffect(() => {
        const wordTimer = setInterval(() => {
            setWordIndex(prev => (prev + 1) % rotatingWords.length);
        }, 3000);
        return () => clearInterval(wordTimer);
    }, []);

    // Mouse move parallax listener
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!heroRef.current) return;
            const { clientX, clientY } = e;
            const rect = heroRef.current.getBoundingClientRect();
            
            // Calculate cursor offset relative to container center (-0.5 to 0.5)
            const x = (clientX - rect.left) / rect.width - 0.5;
            const y = (clientY - rect.top) / rect.height - 0.5;
            
            heroRef.current.style.setProperty("--mx", `${x}`);
            heroRef.current.style.setProperty("--my", `${y}`);
        };
        
        const container = heroRef.current;
        if (container) {
            container.addEventListener("mousemove", handleMouseMove);
        }
        return () => {
            if (container) {
                container.removeEventListener("mousemove", handleMouseMove);
            }
        };
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && phone) setSubmitted(true);
    };

    return (
        <section 
            ref={heroRef}
            style={{
                position: "relative",
                minHeight: "100vh",
                backgroundColor: "#FFFFFF",
                overflow: "hidden",
                paddingTop: "7rem",
                color: "#111827",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* Subtle Radial Glow Spot behind the dashboard/timeline (Hardware-Accelerated) */}
            <div style={{
                position: "absolute",
                top: "10%",
                right: "5%",
                width: "700px",
                height: "700px",
                background: "radial-gradient(circle, rgba(120, 134, 199, 0.08) 0%, transparent 70%)",
                pointerEvents: "none",
                zIndex: 0,
                transform: "translate3d(0,0,0)",
                willChange: "transform",
            }} />

            <div style={{
                maxWidth: "1400px", margin: "0 auto",
                padding: "2rem 2rem 6rem",
                display: "grid",
                gridTemplateColumns: "1fr 1.15fr", // Right column does not exceed 55% of total width
                gap: "5rem", // Standard Stripe/Linear spacing gap
                alignItems: "center",
                width: "100%",
                position: "relative", zIndex: 2,
            }} className="hero-grid">

                {/* ── LEFT COLUMN ── */}
                <div style={{
                    display: "flex", flexDirection: "column", gap: "2rem",
                }}>
                    
                    {/* Badge */}
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: "0.625rem",
                        background: "white",
                        border: "1px solid rgba(120,134,199,0.12)",
                        borderRadius: "9999px",
                        padding: "0.4rem 1rem",
                        width: "fit-content",
                        boxShadow: "0 4px 12px rgba(120,134,199,0.04)",
                        animation: "fadeUp 0.8s 0.1s cubic-bezier(0.22,1,0.36,1) both",
                    }}>
                        <span style={{ fontSize: "1rem" }}>⚡</span>
                        <span style={{ fontSize: "0.875rem", color: "#111827", fontWeight: 600 }}>
                            7 Gün Ücretsiz Deneme
                        </span>
                    </div>

                    {/* Headline */}
                    <div>
                        <h1 style={{
                            fontSize: "clamp(3rem, 5.5vw, 4.5rem)",
                            fontWeight: 900,
                            lineHeight: 1.2,
                            color: "#111827",
                            letterSpacing: "-0.02em",
                            margin: 0,
                        }}>
                            <div style={{ animation: "fadeUp 0.8s 0.2s cubic-bezier(0.22,1,0.36,1) both" }}>İşletmenizi</div>
                            <div style={{ animation: "fadeUp 0.8s 0.3s cubic-bezier(0.22,1,0.36,1) both" }}>Tek Ekrandan</div>
                            <div style={{
                                animation: "fadeUp 0.8s 0.4s cubic-bezier(0.22,1,0.36,1) both",
                                position: "relative",
                                height: "1.3em",
                                overflow: "hidden",
                                display: "inline-block",
                            }}>
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={rotatingWords[wordIndex]}
                                        initial={{ y: "100%", opacity: 0 }}
                                        animate={{ y: "0%", opacity: 1 }}
                                        exit={{ y: "-100%", opacity: 0 }}
                                        transition={{
                                            duration: 0.5,
                                            ease: [0.22, 1, 0.36, 1],
                                        }}
                                        style={{
                                            display: "block",
                                            willChange: "transform, opacity",
                                            background: "linear-gradient(135deg, #7886C7 0%, #5A659F 60%, #9AA7DF 100%)",
                                            backgroundSize: "200% 200%",
                                            WebkitBackgroundClip: "text",
                                            WebkitTextFillColor: "transparent",
                                            backgroundClip: "text",
                                            animation: "gradientShift 4s ease infinite",
                                        }}
                                    >
                                        {rotatingWords[wordIndex]}
                                    </motion.span>
                                </AnimatePresence>
                            </div>
                        </h1>
                        <p style={{
                            marginTop: "1.5rem",
                            fontSize: "1.125rem",
                            color: "#4b5563",
                            lineHeight: 1.7,
                            maxWidth: "480px",
                            fontWeight: 500,
                            animation: "fadeUp 0.8s 0.5s cubic-bezier(0.22,1,0.36,1) both",
                        }}>
                            Satış, stok, raporlama, cari hesap ve e-fatura süreçlerinizi JetPOS ile kolayca yönetin.
                        </p>
                    </div>

                    {/* Social Proof */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap",
                        animation: "fadeUp 0.8s 0.6s cubic-bezier(0.22,1,0.36,1) both",
                    }}>
                        <div style={{ display: "flex" }}>
                            {["#7886C7", "#4F46E5", "#6366F1", "#818CF8"].map((c, i) => (
                                <div key={i} style={{
                                    width: "2.5rem", height: "2.5rem", borderRadius: "50%",
                                    backgroundImage: `linear-gradient(135deg, ${c}dd, ${c}88)`,
                                    border: "2px solid #F8FAFC",
                                    marginLeft: i === 0 ? 0 : "-0.75rem",
                                    fontSize: "0.75rem", color: "white", fontWeight: 800,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                }}>
                                    {["J", "P", "O", "S"][i]}
                                </div>
                            ))}
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: "0.9rem", color: "#4b5563", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                <span style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    position: "relative",
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "50%",
                                    background: "#10B981",
                                    marginRight: "0.125rem"
                                }}>
                                    <span style={{
                                        position: "absolute",
                                        width: "100%",
                                        height: "100%",
                                        borderRadius: "50%",
                                        background: "#10B981",
                                        animation: "pulseDot 1.5s infinite",
                                    }} />
                                </span>
                                <div style={{ 
                                    position: "relative",
                                    height: "1.35rem", 
                                    overflow: "hidden", 
                                    display: "inline-flex",
                                    alignItems: "center",
                                }}>
                                    <AnimatePresence mode="popLayout">
                                        <motion.strong
                                            key={count}
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -15 }}
                                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                            style={{ 
                                                display: "inline-block",
                                                color: "#111827",
                                                fontWeight: 800,
                                                transformOrigin: "left center",
                                            }}
                                        >
                                            {count.toLocaleString('tr-TR')}+ işletme
                                        </motion.strong>
                                    </AnimatePresence>
                                </div>
                                <span>JetPOS'a güveniyor</span>
                            </p>
                        </div>
                    </div>

                    {/* Contact Form Card */}
                    <div style={{
                        background: "white",
                        border: "1px solid rgba(120,134,199,0.15)",
                        borderRadius: "1.5rem",
                        padding: "1.75rem",
                        boxShadow: "0 20px 40px rgba(120,134,199,0.03), 0 1px 3px rgba(120,134,199,0.02)",
                        maxWidth: "460px",
                        animation: "fadeUp 0.8s 0.7s cubic-bezier(0.22,1,0.36,1) both",
                    }}>
                        {submitted ? (
                            <div style={{ textAlign: "center", padding: "2rem 0" }}>
                                <div style={{
                                    width: "4rem", height: "4rem",
                                    background: "rgba(120, 134, 199, 0.1)",
                                    borderRadius: "50%",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    margin: "0 auto 1rem",
                                }}>
                                    <CheckCircle style={{ width: "2rem", height: "2rem", color: "#7886C7" }} />
                                </div>
                                <p style={{ color: "#111827", fontWeight: 800, fontSize: "1.25rem", margin: "0 0 0.5rem" }}>Talebiniz Alındı!</p>
                                <p style={{ color: "#6b7280", fontSize: "1rem", margin: 0 }}>Uzman ekibimiz sizi en kısa sürede arayacak.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div style={{ marginBottom: "1.25rem" }}>
                                    <p style={{ color: "#111827", fontWeight: 800, fontSize: "1.125rem", margin: "0 0 0.25rem" }}>
                                        Hemen Sizi Arayalım
                                    </p>
                                    <p style={{ color: "#6b7280", fontSize: "0.875rem", margin: 0 }}>
                                        Birkaç dakika içinde geri dönüş
                                    </p>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", marginBottom: "1.25rem" }}>
                                    {[
                                        { id: "name", icon: User, placeholder: "Ad Soyad", value: name, onChange: setName, type: "text" },
                                        { id: "phone", icon: Phone, placeholder: "Telefon Numaranız", value: phone, onChange: setPhone, type: "tel" },
                                    ].map(({ id, icon: Icon, placeholder, value, onChange, type }) => (
                                        <div key={id} style={{
                                            display: "flex", alignItems: "center", gap: "0.75rem",
                                            background: "#F8FAFC",
                                            border: `1px solid ${focused === id ? "rgba(120, 134, 199, 0.6)" : "rgba(120, 134, 199, 0.15)"}`,
                                            borderRadius: "0.75rem", padding: "0.875rem 1rem",
                                            transition: "all 0.2s ease",
                                            boxShadow: focused === id 
                                                ? "0 0 0 4px rgba(120, 134, 199, 0.12), 0 4px 12px rgba(120, 134, 199, 0.04)" 
                                                : "0 2px 4px rgba(0,0,0,0.01) inset",
                                        }}>
                                            <Icon style={{ width: "1rem", height: "1rem", color: focused === id ? "#7886C7" : "#9ca3af", flexShrink: 0, transition: "color 0.2s" }} />
                                            <input
                                                type={type}
                                                placeholder={placeholder}
                                                value={value}
                                                onChange={e => onChange(e.target.value)}
                                                onFocus={() => setFocused(id)}
                                                onBlur={() => setFocused(null)}
                                                required
                                                style={{
                                                    background: "none", border: "none", outline: "none",
                                                    color: "#111827", fontSize: "0.95rem", width: "100%",
                                                    fontFamily: "inherit", fontWeight: 500,
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <button type="submit" className="cta-btn" style={{
                                    width: "100%",
                                    padding: "1rem",
                                    backgroundImage: "linear-gradient(135deg, #7886C7, #5A659F)",
                                    color: "white", fontWeight: 700, fontSize: "1rem",
                                    border: "none", borderRadius: "0.875rem", cursor: "pointer",
                                    fontFamily: "inherit",
                                    boxShadow: "0 4px 16px rgba(120, 134, 199, 0.25)",
                                    transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem"
                                }}>
                                    Hemen Başlayın
                                    <ArrowRight className="arrow-icon" style={{ width: "1rem", height: "1rem", transition: "transform 0.3s" }} />
                                </button>
                                <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.75rem", color: "#9ca3af", margin: "1rem 0 0" }}>
                                    Bilgileriniz gizli tutulur - KVKK uyumlu
                                </p>
                            </form>
                        )}
                    </div>
                </div>

                {/* ── RIGHT COLUMN ── */}
                <div style={{
                    position: "relative",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    animation: "slideInRight 0.8s 0.2s cubic-bezier(0.22,1,0.36,1) both",
                }}>
                    
                    {/* Unified Parallax Wrapper for Dashboard and Timeline */}
                    <div style={{
                        transform: "translate3d(calc(var(--mx, 0) * 15px), calc(var(--my, 0) * 15px), 0)",
                        transition: "transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)",
                        zIndex: 2,
                    }}>
                        {/* Floating Animation Wrapper containing both elements */}
                        <div style={{
                            display: "flex",
                            alignItems: "center", // Vertically centers dashboard and timeline
                            gap: "2.5rem", // Exactly 40px spacing gap between dashboard and timeline
                            position: "relative",
                            animation: "floatMain 8s ease-in-out infinite",
                            paddingTop: "3rem", // Compact margin at the top of the floating group for ticker space
                        }}>
                            {/* Horizontal SaaS Info Ticker - Floats directly above the dashboard card */}
                            <div className="ticker-wrap" style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                zIndex: 10,
                                width: "420px", // Matched with dashboard card width
                            }}>
                                {/* Left Blur Fade */}
                                <div style={{
                                    position: "absolute", left: 0, top: 0, bottom: 0, width: "35px", zIndex: 2,
                                    background: "linear-gradient(to right, #EEF2FF, transparent)",
                                    pointerEvents: "none"
                                }} />
                                {/* Right Blur Fade */}
                                <div style={{
                                    position: "absolute", right: 0, top: 0, bottom: 0, width: "35px", zIndex: 2,
                                    background: "linear-gradient(to left, #EEF2FF, transparent)",
                                    pointerEvents: "none"
                                }} />
                                
                                <div className="ticker-track">
                                    {[
                                        "Anlık Satış Takibi",
                                        "Stok Yönetimi",
                                        "E-Fatura Entegrasyonu",
                                        "ÖKC Uyumlu",
                                        "Bulut Tabanlı",
                                        "Çoklu Şube Yönetimi",
                                        "Cari Hesap Takibi",
                                        "Mobil Erişim",
                                        "Barkod Sistemi",
                                        "Anlık Raporlama"
                                    ].concat([
                                        "Anlık Satış Takibi",
                                        "Stok Yönetimi",
                                        "E-Fatura Entegrasyonu",
                                        "ÖKC Uyumlu",
                                        "Bulut Tabanlı",
                                        "Çoklu Şube Yönetimi",
                                        "Cari Hesap Takibi",
                                        "Mobil Erişim",
                                        "Barkod Sistemi",
                                        "Anlık Raporlama"
                                    ]).map((item, index) => (
                                        <div key={index} className="ticker-item">
                                            <span className="ticker-check">✓</span>
                                            <span>{item}</span>
                                            <span className="ticker-separator">✦</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Dashboard Card - Rebalanced sizes */}
                            <div className="dashboard-card" style={{
                                background: "rgba(10, 15, 30, 0.95)",
                                backdropFilter: "blur(20px)",
                                borderRadius: "1.5rem",
                                padding: "2.25rem 2rem", // Spacious, premium padding
                                width: "420px", // Exact width (420-460px)
                                height: "620px", // Exact height (620-680px)
                                boxShadow: "20px 50px 100px -20px rgba(0, 0, 0, 0.45), 0 0 80px -10px rgba(120, 134, 199, 0.35), 15px 20px 50px -10px rgba(120, 134, 199, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1) inset",
                                transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                            }}>
                                {/* Premium header */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "1rem" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <div style={{ width: "2rem", height: "2rem", background: "rgba(120, 134, 199, 0.15)", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <BarChart3 style={{ width: "1rem", height: "1rem", color: "#7886C7" }} />
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            <span style={{ color: "white", fontWeight: 700, fontSize: "0.9rem", lineHeight: 1.2 }}>JetPOS Canlı Panel</span>
                                            <span style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: "0.7rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#7886C7", display: "inline-block", animation: "pulseDot 1.5s infinite" }} /> Canlı İzleme
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "0.25rem", background: "rgba(255,255,255,0.05)", borderRadius: "9999px", padding: "0.15rem" }}>
                                        {(["daily", "monthly", "yearly"] as DashPeriod[]).map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setDashPeriod(p)}
                                                style={{
                                                    padding: "0.2rem 0.6rem",
                                                    borderRadius: "9999px",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    fontSize: "0.65rem",
                                                    fontWeight: 700,
                                                    fontFamily: "inherit",
                                                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                                                    background: dashPeriod === p ? "rgba(120, 134, 199, 0.25)" : "transparent",
                                                    color: dashPeriod === p ? "#A8B4E0" : "rgba(255,255,255,0.35)",
                                                    boxShadow: dashPeriod === p ? "0 0 12px rgba(120, 134, 199, 0.3)" : "none",
                                                }}
                                            >
                                                {periodData[p].label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Main Stat: Satışlar */}
                                <div style={{ marginBottom: "1rem" }}>
                                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", marginBottom: "0.3rem", fontWeight: 600 }}>{periodData[dashPeriod].salesLabel}</p>
                                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                                        <h3 style={{ fontSize: "2rem", fontWeight: 800, color: "white", margin: 0, lineHeight: 1, letterSpacing: "-0.02em", transition: "opacity 0.2s" }}>
                                            ₺{salesCount.toLocaleString('tr-TR')}
                                        </h3>
                                        <span style={{ color: "#7886C7", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.125rem" }}>
                                            <TrendingUp style={{ width: "0.8rem", height: "0.8rem" }} /> {periodData[dashPeriod].growth}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Premium Sparkline Chart */}
                                <div style={{ margin: "1rem 0 1.5rem" }}>
                                    <svg viewBox="0 0 300 50" width="100%" height="50" style={{ overflow: "visible" }}>
                                        <defs>
                                            <linearGradient id="glowGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#7886C7" stopOpacity="0.3"/>
                                                <stop offset="100%" stopColor="#7886C7" stopOpacity="0.0"/>
                                            </linearGradient>
                                        </defs>
                                        <path d="M 0 35 Q 30 18 60 28 T 120 12 T 180 22 T 240 8 T 300 12" fill="none" stroke="#7886C7" strokeWidth="2.5" />
                                        <path d="M 0 35 Q 30 18 60 28 T 120 12 T 180 22 T 240 8 T 300 12 L 300 50 L 0 50 Z" fill="url(#glowGrad)" />
                                        <circle cx="300" cy="12" r="3.5" fill="#7886C7" />
                                    </svg>
                                </div>

                                {/* Metrics Grid - Premium layout spacing */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1.25rem" }}>
                                    {[
                                        { label: `${periodData[dashPeriod].label} Sipariş`, val: `${orderCount.toLocaleString('tr-TR')} Adet`, icon: ShoppingCart, desc: "Anlık sipariş akışı" },
                                        { label: "Stok Durumu", val: "3 Kritik", icon: Package, desc: "Sipariş gerekli", warning: true },
                                        { label: "E-Fatura", val: `${invoiceCount.toLocaleString('tr-TR')} Başarılı`, icon: FileText, desc: "%100 hatasız gönderim" },
                                        { label: "Kasa Özeti", val: cashDisplay, icon: Wallet, desc: cashSubDisplay }
                                    ].map((item, index) => (
                                        <div key={index} style={{
                                            background: "rgba(255, 255, 255, 0.02)",
                                            border: "1px solid rgba(255, 255, 255, 0.05)",
                                            borderRadius: "0.625rem",
                                            padding: "0.75rem 0.875rem",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "0.2rem",
                                        }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.1rem" }}>
                                                <item.icon style={{ width: "0.8rem", height: "0.8rem", color: item.warning ? "#f59e0b" : "#7886C7" }} />
                                                <span style={{ fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.4)", fontWeight: 600 }}>{item.label}</span>
                                            </div>
                                            <span style={{ fontSize: "0.9rem", color: "white", fontWeight: 700 }}>{item.val}</span>
                                            <span style={{ fontSize: "0.65rem", color: "rgba(255, 255, 255, 0.35)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Activity Feed Premium Glassmorphism Card - Centered, 80% height of dashboard */}
                            <div className="timeline-card" style={{
                                position: "relative",
                                width: "300px", // Proportional width (total right group = 760px)
                                height: "496px", // Dashboard height 620px * 0.80 = 496px
                                background: "rgba(255, 255, 255, 0.45)", // White card glassmorphism effect
                                backdropFilter: "blur(20px)",
                                WebkitBackdropFilter: "blur(20px)",
                                border: "1px solid rgba(120, 134, 199, 0.12)",
                                borderRadius: "1.5rem",
                                padding: "1.75rem 1.5rem", // Compact, premium padding
                                boxShadow: "0 30px 60px -15px rgba(120, 134, 199, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.5) inset",
                                display: "flex",
                                flexDirection: "column",
                            }}>
                                {/* Vertical timeline line (spans top to bottom padding) */}
                                <div style={{
                                    position: "absolute",
                                    left: "34px", // Precisely centered under the dots (24px card left padding + 10px dot center offset)
                                    top: "1.75rem",
                                    bottom: "1.75rem",
                                    width: "2px",
                                    background: "linear-gradient(180deg, rgba(120, 134, 199, 0.08) 0%, rgba(120, 134, 199, 0.5) 50%, rgba(120, 134, 199, 0.08) 100%)",
                                    boxShadow: "0 0 8px rgba(120, 134, 199, 0.5)", // Light blue glow
                                    zIndex: 1,
                                }} />

                                {/* Event List - Distributed statically, no duplicates or scroll */}
                                <div style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    height: "100%",
                                    position: "relative",
                                    zIndex: 2,
                                }}>
                                    {feedEvents.map((event, index) => (
                                        <div key={index} className="activity-item" style={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            position: "relative",
                                            padding: "0.75rem 0.5rem 0.75rem 1.75rem", // Beautiful static vertical spacing
                                            cursor: "pointer",
                                            borderRadius: "0.75rem",
                                            ...({ "--dot-color": event.color } as React.CSSProperties)
                                        }}>
                                            {/* Timeline dot */}
                                            <div className="activity-dot" style={{
                                                position: "absolute",
                                                left: "6px",
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                width: "10px",
                                                height: "10px",
                                                borderRadius: "50%",
                                                background: event.color,
                                                boxShadow: `0 0 8px ${event.color}`,
                                                zIndex: 2,
                                                transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s",
                                            }} />

                                            {/* Event Details */}
                                            <div style={{ flex: 1, minWidth: 0, paddingRight: "0.5rem" }}>
                                                <p style={{ margin: 0, fontSize: "0.825rem", color: "#0f172a", fontWeight: 700, lineHeight: 1.2 }}>
                                                    {event.title}
                                                </p>
                                                <p style={{ margin: 0, fontSize: "0.725rem", color: "#475569", marginTop: "0.25rem", lineHeight: 1.2 }}>
                                                    {event.desc}
                                                </p>
                                            </div>

                                            {/* Relative Timestamp */}
                                            <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, flexShrink: 0 }}>
                                                {event.time}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <style>{`
                @keyframes slideInLeft {
                    from { opacity: 0; transform: translateX(-30px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(30px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes floatMain {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-12px); }
                }
                @keyframes activityFeedScrollDown {
                    0% { transform: translateY(-20%); }
                    100% { transform: translateY(0%); }
                }
                @keyframes pulseDot {
                    0% { opacity: 0.4; }
                    50% { opacity: 1; }
                    100% { opacity: 0.4; }
                }
                
                /* hero-title shimmer removed — using inline gradient on rotating word instead */

                /* CTA Button Hover */
                .cta-btn:hover {
                    transform: translateY(-2px) scale(1.02) !important;
                    box-shadow: 0 12px 32px rgba(120, 134, 199, 0.4) !important;
                }
                .cta-btn:hover .arrow-icon {
                    transform: translateX(4px) !important;
                }

                /* Dashboard Card Hover */
                .dashboard-container:hover .dashboard-card {
                    transform: translateY(-6px) scale(1.02);
                    box-shadow: 25px 60px 110px -20px rgba(0, 0, 0, 0.55), 0 0 100px -5px rgba(120, 134, 199, 0.45), 20px 25px 60px -10px rgba(120, 134, 199, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.15) inset !important;
                }

                 .activity-track {
                     animation: activityFeedScrollDown 22s linear infinite;
                 }
                 .activity-track:hover {
                     animation-play-state: paused;
                 }
                 .activity-item {
                     transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                     opacity: 0.9;
                 }
                 .activity-item:hover {
                     opacity: 1;
                     transform: translateX(4px);
                     background: rgba(120, 134, 199, 0.05);
                     box-shadow: 0 4px 12px rgba(120, 134, 199, 0.02);
                 }
                 .activity-item:hover .activity-dot {
                     transform: translateY(-50%) scale(1.3) !important;
                     box-shadow: 0 0 12px var(--dot-color) !important;
                 }

                 /* Ticker Styles */
                 .ticker-wrap {
                     display: flex;
                     align-items: center;
                     overflow: hidden;
                     width: 100%;
                     max-width: 400px;
                     height: 38px;
                     background: rgba(120, 134, 199, 0.04);
                     border: 1px solid rgba(120, 134, 199, 0.15);
                     border-radius: 9999px;
                     position: relative;
                     backdrop-filter: blur(6px);
                     -webkit-backdrop-filter: blur(6px);
                     box-shadow: 0 4px 12px rgba(120, 134, 199, 0.02);
                 }

                 .ticker-track {
                     display: flex;
                     width: max-content;
                     animation: tickerLoop 24s linear infinite;
                     gap: 1.5rem;
                     padding-left: 0.75rem;
                 }

                 .ticker-track:hover {
                     animation-play-state: paused;
                 }

                 .ticker-item {
                     display: flex;
                     align-items: center;
                     gap: 0.5rem;
                     font-size: 0.825rem;
                     font-weight: 700;
                     color: #5A659F;
                     white-space: nowrap;
                 }

                 .ticker-check {
                     color: #7886C7;
                     font-weight: 900;
                     text-shadow: 0 0 6px rgba(120, 134, 199, 0.5);
                 }

                 .ticker-separator {
                     color: rgba(120, 134, 199, 0.35);
                     font-size: 0.875rem;
                     margin-left: 0.5rem;
                     text-shadow: 0 0 4px rgba(120, 134, 199, 0.3);
                 }

                 @keyframes tickerLoop {
                     0% { transform: translate3d(0, 0, 0); }
                     100% { transform: translate3d(-50%, 0, 0); }
                 }
                
                @media (max-width: 960px) {
                    .hero-grid {
                        grid-template-columns: 1fr !important;
                        gap: 3rem !important;
                    }
                }
            `}</style>
        </section>
    );
}
