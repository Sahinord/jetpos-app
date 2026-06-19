"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import IndustryCarousel from "@/components/IndustryCarousel";
import Link from "next/link";
import Image from "next/image";
import { 
    Check, ShoppingCart, Package, Users, Receipt, PieChart, 
    ArrowRight, Zap, ShieldCheck, Layers, Barcode, TrendingUp,
    Plus, Minus
} from "lucide-react";

/* ─── DATA ────────────────────────────────────────────── */

const features = [
    {
        icon: Barcode,
        title: "Barkodlu Satış",
        desc: "Ürünleri saniyeler içinde okutun, kasada kuyrukları tamamen bitirin.",
        color: "#7886C7"
    },
    {
        icon: Package,
        title: "Stok Yönetimi",
        desc: "Kritik stok uyarıları alın, deponuzda ne var ne yok anlık takip edin.",
        color: "#10b981"
    },
    {
        icon: Users,
        title: "Cari Takibi",
        desc: "Müşteri ve tedarikçilerinizi, alacak-verecek dengenizi kolayca yönetin.",
        color: "#f59e0b"
    },
    {
        icon: Receipt,
        title: "E-Fatura",
        desc: "Saniyeler içinde e-fatura kesin, resmi muhasebeye otomatik aktarın.",
        color: "#8b5cf6"
    },
    {
        icon: Layers,
        title: "Ön Muhasebe",
        desc: "Gelir ve giderlerinizi, kasa hareketlerinizi kuruşu kuruşuna izleyin.",
        color: "#ec4899"
    },
    {
        icon: PieChart,
        title: "Raporlama",
        desc: "Anlık ciro, kârlılık ve personel performansı analizlerini canlı görün.",
        color: "#3b82f6"
    }
];

const benefits = [
    {
        icon: Zap,
        title: "%70 Daha Hızlı Satış",
        desc: "Akıllı arayüz sayesinde kasada işlem sürelerini minimuma indirin."
    },
    {
        icon: ShieldCheck,
        title: "Hatasız Stok Yönetimi",
        desc: "İnsan hatasını ortadan kaldırın, kayıp ve kaçakları sıfıra yaklaştırın."
    },
    {
        icon: TrendingUp,
        title: "Anlık Raporlar",
        desc: "İşletmenizin nabzını her an, her yerden, tüm cihazlardan canlı izleyin."
    },
    {
        icon: Layers,
        title: "Tek Platform",
        desc: "Muhasebe, e-fatura, stok ve satış için ayrı ayrı programlara veda edin."
    }
];

const tabs = [
    { id: "satis", label: "Satış & POS", icon: ShoppingCart, image: "/jetkasa_app.png" },
    { id: "stok", label: "Stok Takibi", icon: Package, image: "/jetstok_app.png" },
    { id: "cari", label: "Cari Yönetimi", icon: Users, image: "/jetcari.png" },
    { id: "raporlar", label: "Gelişmiş Raporlar", icon: PieChart, image: "/jetrapor_app.png" },
    { id: "efatura", label: "E-Fatura & E-Arşiv", icon: Receipt, image: "/jetfatura_app.png" },
];

const faqs = [
    {
        question: "JetPOS hangi sektörlere uygun?",
        answer: "Market, bakkal, kasap, manav, kırtasiye, petshop, elektronik, giyim ve daha pek çok perakende sektöründe yüzlerce işletme tarafından aktif olarak kullanılmaktadır."
    },
    {
        question: "JetPOS bulut tabanlı mı?",
        answer: "Evet! Verileriniz anlık olarak buluta yedeklenir. Telefon, tablet veya bilgisayarınızdan nerede olursanız olun işletmenizi canlı izleyebilirsiniz."
    },
    {
        question: "E-Fatura destekliyor mu?",
        answer: "Kesinlikle. JetPOS içerisinden tek tuşla saniyeler içinde e-Fatura ve e-Arşiv faturası oluşturabilir, anında GİB ve müşterinize iletebilirsiniz."
    },
    {
        question: "Mobil uygulama var mı?",
        answer: "Evet, hem iOS hem de Android için mobil uygulamamız mevcuttur. Telefonunuzun kamerasını kullanarak bile barkod okutabilir, stok sayımı yapabilirsiniz."
    },
    {
        question: "Şube yönetimi destekliyor mu?",
        answer: "Sınırsız şube desteği mevcuttur. Tüm şubelerinizin ciro, stok ve personel verilerini tek bir merkezden, tek ekranda konsolide edilmiş raporlarla görebilirsiniz."
    }
];

const mockNotifications = [
    { id: 1, text: "Yeni Satış: ₺420.50", type: "success" },
    { id: 2, text: "Stok Kritik: Süt (2 Adet)", type: "warning" },
    { id: 3, text: "E-Fatura Kesildi", type: "info" },
    { id: 4, text: "Cari Tahsilat: ₺1,200", type: "success" }
];

/* ─── PAGE COMPONENT ──────────────────────────────────── */

export default function JetPOSProductPage() {
    const [activeTab, setActiveTab] = useState(tabs[0].id);
    const [notifs, setNotifs] = useState<typeof mockNotifications>([]);
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    // Live notification simulation for the hero mockup
    useEffect(() => {
        let currentIndex = 0;
        const interval = setInterval(() => {
            setNotifs(prev => {
                const newNotif = { ...mockNotifications[currentIndex % mockNotifications.length], id: Date.now() };
                const updated = [newNotif, ...prev].slice(0, 3);
                return updated;
            });
            currentIndex++;
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ background: "#F8FAFC", color: "#111827", minHeight: "100vh", overflowX: "hidden" }}>
            <Navbar />

            {/* Background Effects */}
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
                <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "70%", height: "70%", background: "radial-gradient(ellipse at center, rgba(120, 134, 199, 0.15) 0%, transparent 60%)", filter: "blur(60px)" }} />
                <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: "60%", height: "60%", background: "radial-gradient(ellipse at center, rgba(139, 92, 246, 0.1) 0%, transparent 60%)", filter: "blur(60px)" }} />
            </div>

            <main style={{ position: "relative", zIndex: 1 }}>

                {/* ── HERO SECTION ── */}
                <section style={{ paddingTop: "11rem", paddingBottom: "6rem" }}>
                    <div className="site-container">
                        <div className="hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
                            
                            {/* Left Content */}
                            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
                                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "white", border: "1px solid rgba(120, 134, 199, 0.15)", padding: "0.4rem 1rem", borderRadius: "99px", marginBottom: "1.5rem", boxShadow: "0 4px 12px rgba(120, 134, 199, 0.05)" }}>
                                    <span style={{ fontSize: "1.2rem" }}>🚀</span>
                                    <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#7886C7", letterSpacing: "0.05em" }}>JETPOS ANA ÜRÜN</span>
                                </div>
                                <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 900, lineHeight: 1.1, marginBottom: "1.5rem", letterSpacing: "-0.04em", color: "#111827" }}>
                                    Satış Süreçlerinizi <br />
                                    <span style={{ background: "linear-gradient(135deg, #7886C7, #5A659F)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Hızlandırın</span>
                                </h1>
                                <p style={{ fontSize: "1.2rem", color: "#4B5563", marginBottom: "2.5rem", maxWidth: "90%", lineHeight: 1.6 }}>
                                    Kasadan muhasebeye kadar tüm süreçleri JetPOS ile tek bir platform üzerinden yönetin.
                                </p>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "3rem" }}>
                                    {["Barkodlu Satış", "Stok Takibi", "Cari Yönetimi", "E-Fatura", "Raporlama", "Çoklu Şube"].map((item, i) => (
                                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                            <div style={{ width: "1.5rem", height: "1.5rem", borderRadius: "50%", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <Check style={{ width: "0.875rem", height: "0.875rem", color: "#10b981" }} />
                                            </div>
                                            <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "#111827" }}>{item}</span>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                                    <Link href="/demo" style={{ background: "linear-gradient(135deg, #7886C7, #5A659F)", color: "white", padding: "1rem 2rem", borderRadius: "1rem", fontWeight: 800, textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem", transition: "all 0.3s", boxShadow: "0 10px 30px -10px rgba(120, 134, 199, 0.4)" }}>
                                        Ücretsiz Demo Talep Et <ArrowRight style={{ width: "1.2rem", height: "1.2rem" }} />
                                    </Link>
                                    <a href="#preview" style={{ background: "white", border: "1px solid rgba(120, 134, 199, 0.2)", color: "#111827", padding: "1rem 2rem", borderRadius: "1rem", fontWeight: 700, textDecoration: "none", transition: "all 0.3s", boxShadow: "0 4px 12px rgba(120, 134, 199, 0.05)" }}>
                                        Canlı Önizleme
                                    </a>
                                </div>
                            </motion.div>

                            {/* Right Mockup */}
                            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }} style={{ position: "relative" }}>
                                <div style={{ background: "white", border: "1px solid rgba(120, 134, 199, 0.15)", borderRadius: "1.5rem", padding: "0.5rem", boxShadow: "0 40px 100px -20px rgba(120, 134, 199, 0.15)", position: "relative", overflow: "hidden" }}>
                                    
                                    {/* Mockup Top Bar */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", padding: "0.5rem 1rem", borderBottom: "1px solid rgba(120,134,199,0.05)" }}>
                                        <div style={{ display: "flex", gap: "0.5rem" }}>
                                            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ef4444" }} />
                                            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#f59e0b" }} />
                                            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#10b981" }} />
                                        </div>
                                        <div style={{ fontSize: "0.85rem", color: "#6B7280", fontWeight: 600 }}>JetPOS.app</div>
                                    </div>

                                    {/* Real Image Mockup */}
                                    <div style={{ width: "100%", height: "350px", position: "relative", borderRadius: "1rem", overflow: "hidden", background: "#F8FAFC" }}>
                                        <Image src="/jetdashboard.png" alt="JetPOS Dashboard" fill style={{ objectFit: "cover", objectPosition: "top" }} quality={100} unoptimized={true} />
                                    </div>

                                </div>

                                {/* Floating Live Notifications */}
                                <div style={{ position: "absolute", top: "10%", right: "-10%", width: "240px", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                    <AnimatePresence>
                                        {notifs.map((n) => (
                                            <motion.div
                                                key={n.id}
                                                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                                style={{ 
                                                    background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(12px)", 
                                                    border: "1px solid rgba(120, 134, 199, 0.15)",
                                                    padding: "0.875rem 1rem", borderRadius: "0.75rem",
                                                    display: "flex", alignItems: "center", gap: "0.75rem",
                                                    boxShadow: "0 10px 20px rgba(120, 134, 199, 0.1)"
                                                }}
                                            >
                                                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: n.type === 'success' ? '#10b981' : n.type === 'warning' ? '#f59e0b' : '#7886C7', boxShadow: `0 0 10px ${n.type === 'success' ? '#10b981' : n.type === 'warning' ? '#f59e0b' : '#7886C7'}` }} />
                                                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#111827" }}>{n.text}</span>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </motion.div>

                        </div>
                    </div>
                </section>

                {/* ── FEATURES GRID ── */}
                <section style={{ padding: "6rem 0", background: "white", borderTop: "1px solid rgba(120,134,199,0.1)", borderBottom: "1px solid rgba(120,134,199,0.1)" }}>
                    <div className="site-container">
                        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
                            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, marginBottom: "1rem", color: "#111827" }}>
                                Sınırsız Özellikler
                            </h2>
                            <p style={{ color: "#4B5563", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto" }}>
                                İşletmenizin uçtan uca tüm dijital ihtiyaçları tek bir platformda toplandı.
                            </p>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
                            {features.map((f, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    whileHover={{ y: -5, boxShadow: `0 20px 40px ${f.color}15`, borderColor: `${f.color}40` }}
                                    style={{ 
                                        background: "white", border: "1px solid rgba(120, 134, 199, 0.15)",
                                        borderRadius: "1.5rem", padding: "2rem", transition: "all 0.3s ease",
                                        position: "relative", overflow: "hidden", boxShadow: "0 4px 12px rgba(120,134,199,0.03)"
                                    }}
                                >
                                    <div style={{ position: "absolute", top: 0, right: 0, width: "150px", height: "150px", background: `radial-gradient(circle, ${f.color}10 0%, transparent 70%)`, filter: "blur(20px)" }} />
                                    <div style={{ width: "3.5rem", height: "3.5rem", borderRadius: "1rem", background: `${f.color}10`, border: `1px solid ${f.color}20`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
                                        <f.icon style={{ width: "1.5rem", height: "1.5rem", color: f.color }} />
                                    </div>
                                    <h3 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.75rem", color: "#111827" }}>{f.title}</h3>
                                    <p style={{ color: "#6B7280", lineHeight: 1.6, fontSize: "0.95rem" }}>{f.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── INDUSTRY CAROUSEL ── */}
                <div style={{ paddingTop: "6rem", background: "#F8FAFC" }}>
                    <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                        <h2 style={{ fontSize: "clamp(2rem, 4vw, 2.5rem)", fontWeight: 900, color: "#111827" }}>
                            Her İşletmeye Uygun
                        </h2>
                    </div>
                    <IndustryCarousel />
                </div>

                {/* ── BENEFITS SECTION ── */}
                <section style={{ padding: "8rem 0", background: "#F8FAFC" }}>
                    <div className="site-container">
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", marginBottom: "4rem", textAlign: "center" }}>
                            <h2 style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)", fontWeight: 900, lineHeight: 1.1, color: "#111827" }}>
                                Neler Kazandırır?
                            </h2>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem" }}>
                            {benefits.map((b, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    style={{ textAlign: "center", padding: "2rem", background: "white", borderRadius: "1.5rem", border: "1px solid rgba(120,134,199,0.1)", boxShadow: "0 10px 30px rgba(120,134,199,0.05)" }}
                                >
                                    <div style={{ width: "5rem", height: "5rem", borderRadius: "1.5rem", background: "rgba(120, 134, 199, 0.1)", border: "1px solid rgba(120, 134, 199, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                                        <b.icon style={{ width: "2.5rem", height: "2.5rem", color: "#7886C7" }} />
                                    </div>
                                    <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "0.75rem", color: "#111827" }}>{b.title}</h3>
                                    <p style={{ color: "#4B5563", fontSize: "0.95rem", lineHeight: 1.6 }}>{b.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── DASHBOARD PREVIEW TABS ── */}
                <section id="preview" style={{ padding: "6rem 0", background: "white", borderTop: "1px solid rgba(120,134,199,0.1)" }}>
                    <div className="site-container">
                        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, marginBottom: "1rem", color: "#111827" }}>
                                Tüm Sistem Elinizin Altında
                            </h2>
                            <p style={{ color: "#4B5563", fontSize: "1.1rem" }}>Arayüzü keşfedin ve işletmenizi nasıl yöneteceğinizi görün.</p>
                        </div>

                        {/* Tabs */}
                        <div className="preview-tabs-container" style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "3rem", flexWrap: "wrap" }}>
                            {tabs.map((t) => {
                                const isActive = activeTab === t.id;
                                return (
                                    <button
                                        key={t.id}
                                        onClick={() => setActiveTab(t.id)}
                                        style={{
                                            display: "flex", alignItems: "center", gap: "0.5rem",
                                            padding: "0.75rem 1.5rem", borderRadius: "99px",
                                            border: isActive ? "1px solid rgba(120, 134, 199, 0.4)" : "1px solid rgba(120,134,199,0.15)",
                                            background: isActive ? "rgba(120, 134, 199, 0.1)" : "white",
                                            color: isActive ? "#5A659F" : "#6B7280",
                                            fontWeight: 600, fontSize: "0.95rem", cursor: "pointer",
                                            transition: "all 0.3s",
                                            boxShadow: isActive ? "0 4px 12px rgba(120,134,199,0.1)" : "none"
                                        }}
                                    >
                                        <t.icon style={{ width: "1.1rem", height: "1.1rem", color: isActive ? "#7886C7" : "currentColor" }} />
                                        {t.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Real Dashboard Image Display */}
                        <div style={{ position: "relative", width: "100%", maxWidth: "1000px", margin: "0 auto", height: "600px", borderRadius: "2rem", background: "#F8FAFC", border: "1px solid rgba(120,134,199,0.15)", overflow: "hidden", boxShadow: "0 30px 60px rgba(120,134,199,0.1)" }}>
                            
                            {/* Window controls */}
                            <div style={{ height: "40px", background: "white", display: "flex", alignItems: "center", padding: "0 1.5rem", gap: "0.5rem", borderBottom: "1px solid rgba(120,134,199,0.1)" }}>
                                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ef4444" }} />
                                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#f59e0b" }} />
                                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#10b981" }} />
                                <div style={{ marginLeft: "1rem", background: "#F3F4F6", padding: "0.2rem 1rem", borderRadius: "4px", fontSize: "0.75rem", color: "#6B7280", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <ShieldCheck style={{ width: "10px", height: "10px" }} /> jetpos.app
                                </div>
                            </div>

                            {/* Content Area */}
                            <div style={{ position: "relative", width: "100%", height: "calc(100% - 40px)" }}>
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                        exit={{ opacity: 0, scale: 1.02, filter: "blur(4px)" }}
                                        transition={{ duration: 0.4 }}
                                        style={{ position: "absolute", inset: 0 }}
                                    >
                                        <Image 
                                            src={tabs.find(t => t.id === activeTab)?.image || "/jetdashboard.png"} 
                                            alt={activeTab} 
                                            fill 
                                            style={{ objectFit: "cover", objectPosition: "top center" }} 
                                            quality={100} 
                                            unoptimized={true}
                                        />
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── FAQ ── */}
                <section style={{ padding: "8rem 0", background: "#F8FAFC" }}>
                    <div className="site-container" style={{ maxWidth: "800px" }}>
                        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
                            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, marginBottom: "1rem", color: "#111827" }}>
                                Sık Sorulan Sorular
                            </h2>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {faqs.map((faq, index) => {
                                const isOpen = openFaq === index;
                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        style={{
                                            background: "white",
                                            border: `1px solid ${isOpen ? "#7886C7" : "rgba(120,134,199,0.15)"}`,
                                            borderRadius: "1rem", overflow: "hidden", transition: "all 0.3s",
                                            boxShadow: isOpen ? "0 10px 30px rgba(120,134,199,0.1)" : "0 4px 12px rgba(120,134,199,0.02)"
                                        }}
                                    >
                                        <button
                                            onClick={() => setOpenFaq(isOpen ? null : index)}
                                            style={{ width: "100%", padding: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: "transparent", border: "none", color: "#111827", cursor: "pointer", textAlign: "left", fontWeight: 700, fontSize: "1.05rem" }}
                                        >
                                            {faq.question}
                                            {isOpen ? <Minus style={{ color: "#7886C7" }} /> : <Plus style={{ color: "#9CA3AF" }} />}
                                        </button>
                                        <AnimatePresence>
                                            {isOpen && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                                    <div style={{ padding: "0 1.5rem 1.5rem", color: "#4B5563", lineHeight: 1.6 }}>
                                                        {faq.answer}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ── FINAL CTA ── */}
                <section style={{ paddingBottom: "6rem", background: "#F8FAFC" }}>
                    <div className="site-container">
                        <div style={{
                            background: "linear-gradient(135deg, #7886C7 0%, #5A659F 100%)",
                            border: "1px solid rgba(120,134,199,0.3)",
                            borderRadius: "2rem", padding: "5rem 2rem",
                            textAlign: "center", position: "relative", overflow: "hidden",
                            boxShadow: "0 40px 100px -20px rgba(120,134,199,0.4)"
                        }}>
                            <div style={{ position: "absolute", top: 0, left: "50%", transform: "translate(-50%, -50%)", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)", filter: "blur(40px)" }} />
                            <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, marginBottom: "1.5rem", position: "relative", color: "white" }}>
                                İşletmenizi JetPOS ile Tanıştırın
                            </h2>
                            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "1.2rem", maxWidth: "600px", margin: "0 auto 3rem", position: "relative" }}>
                                Bugün başlayın, satış süreçlerinizi dijitalleştirin ve kârlılığınızı anında artırın.
                            </p>
                            <Link href="/demo" style={{ display: "inline-flex", background: "white", color: "#5A659F", padding: "1.25rem 3rem", borderRadius: "1.5rem", fontWeight: 800, fontSize: "1.1rem", textDecoration: "none", transition: "all 0.3s", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", position: "relative", zIndex: 2 }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                                Ücretsiz Demo Talep Et
                            </Link>
                        </div>
                    </div>
                </section>

            </main>

            <Footer />

            <style>{`
                @media (max-width: 900px) {
                    .hero-grid { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 600px) {
                    .preview-tabs-container { flex-direction: column; width: 100%; }
                    .preview-tabs-container button { width: 100%; justify-content: center; }
                }
            `}</style>
        </div>
    );
}
