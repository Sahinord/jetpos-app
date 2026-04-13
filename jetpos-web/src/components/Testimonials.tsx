"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

const testimonials = [
    {
        name: "Ahmet Kaya",
        role: "Bakkal İşletmecisi",
        city: "İstanbul, Kadıköy",
        initials: "AK",
        color: "#3b82f6",
        rating: 5,
        text: "JetPOS'tan önce muhasebeciye her ay para ödüyorduk. Şimdi her şeyi kendimiz hallediyoruz. Stok takibi, fatura kesme, raporlar — hepsi tek ekranda. Keşke daha önce geçseydik!",
        since: "8 aydır kullanıyor",
        highlight: "Muhasebe maliyetini sıfırladı",
    },
    {
        name: "Fatma Demir",
        role: "Kozmetik Mağazası Sahibi",
        city: "Ankara, Çankaya",
        initials: "FD",
        color: "#a78bfa",
        rating: 5,
        text: "Trendyol ile entegrasyon muhteşem. Şubemi de ekledim, artık iki dükkanı bir yerden yönetiyorum. Barkod okuyarak satış yapmak inanılmaz hız kazandırdı, kuyruk sorunu bitti.",
        since: "1 yıldır kullanıyor",
        highlight: "2 şubeyi tek panelden yönetiyor",
    },
    {
        name: "Mehmet Arslan",
        role: "Elektronik Market",
        city: "İzmir, Bornova",
        initials: "MA",
        color: "#10b981",
        rating: 5,
        text: "E-fatura geçiş sürecinde JetPOS ekibi bize çok yardımcı oldu. 48 saat içinde her şey hazırdı. Yapay zeka satış tahminleri gerçekten işe yarıyor, stok açığı yaşamıyorum artık.",
        since: "6 aydır kullanıyor",
        highlight: "E-fatura geçişi 48 saatte tamamlandı",
    },
    {
        name: "Ayşe Yılmaz",
        role: "Şarküteri & Kasap",
        city: "Bursa, Osmangazi",
        initials: "AY",
        color: "#f59e0b",
        rating: 5,
        text: "Daha önce 3 farklı program kullanıyordum. JetPOS hepsini tek çatı altında topladı. Telefonumdan da barkod okutabiliyorum, artık el terminaline ihtiyacım yok. Fiyatı da çok makul.",
        since: "5 aydır kullanıyor",
        highlight: "3 programı tek uygulamaya indirdi",
    },
    {
        name: "Kemal Çelik",
        role: "Oyuncak & Kırtasiye",
        city: "Antalya, Muratpaşa",
        initials: "KÇ",
        color: "#ef4444",
        rating: 5,
        text: "Kasa açık kaldı mı, stok bitti mi — artık anlık bildirim alıyorum. Raporlar sayesinde hangi ürünün ne zaman biteceğini önceden tahmin edebiliyorum. Müşteri desteği de çok hızlı.",
        since: "10 aydır kullanıyor",
        highlight: "Anlık stok bildirimleri hayat kurtarıyor",
    },
];

export default function Testimonials() {
    const [current, setCurrent] = useState(0);
    const [direction, setDirection] = useState(0); // -1 or 1
    const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 100 : -100,
            opacity: 0,
            scale: 0.95,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1,
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 100 : -100,
            opacity: 0,
            scale: 0.95,
        }),
    };

    const next = () => {
        setDirection(1);
        setCurrent((prev) => (prev + 1) % testimonials.length);
    };

    const prev = () => {
        setDirection(-1);
        setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    useEffect(() => {
        autoRef.current = setInterval(next, 8000);
        return () => { if (autoRef.current) clearInterval(autoRef.current); };
    }, []);

    const t = testimonials[current];

    return (
        <section style={{ padding: "6rem 0", position: "relative", zIndex: 2, overflow: "visible" }}>
            
            {/* Dynamic Animated Aura */}
            <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 0,
            }}>
                <motion.div
                    animate={{
                        background: `radial-gradient(circle at 50% 50%, ${t.color}0A 0%, transparent 55%)`,
                    }}
                    transition={{ duration: 1 }}
                    style={{ width: "100%", height: "100%" }}
                />
            </div>

            <div className="site-container" style={{ position: "relative", zIndex: 1 }}>
                
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ textAlign: "center", marginBottom: "3.5rem" }}
                >
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: "0.4rem",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "9999px",
                        padding: "0.4rem 1rem",
                        marginBottom: "1.25rem",
                        backdropFilter: "blur(6px)",
                    }}>
                        <Star style={{ width: "0.9rem", height: "0.9rem", color: "#f59e0b", fill: "#f59e0b" }} />
                        <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", fontWeight: 600, letterSpacing: "0.01em" }}>
                            Müşteri Deneyimleri
                        </span>
                    </div>
                    <h2 style={{
                        fontSize: "clamp(2rem, 5vw, 3rem)",
                        fontWeight: 900,
                        color: "white",
                        margin: "0 0 0.75rem",
                        lineHeight: 1.1,
                        letterSpacing: "-0.03em",
                    }}>
                        İşletmeler <span className="holographic-text">JetPOS'u Seçiyor</span>
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "1rem", fontWeight: 500 }}>
                        2,400+ işletme ile büyüyen kocaman bir topluluk.
                    </p>
                </motion.div>

                {/* Slider Container */}
                <div style={{ maxWidth: "850px", margin: "0 auto", position: "relative", minHeight: "380px" }}>
                    
                    {/* Navigation Buttons */}
                    <div style={{ 
                        position: "absolute", 
                        width: "calc(100% + 100px)", 
                        left: "-50px", 
                        top: "50%", 
                        transform: "translateY(-50%)",
                        display: "flex",
                        justifyContent: "space-between",
                        zIndex: 10,
                    }} className="nav-container">
                        {[
                            { icon: ChevronLeft, fn: prev },
                            { icon: ChevronRight, fn: next }
                        ].map((btn, i) => (
                            <motion.button
                                key={i}
                                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.08)" }}
                                whileTap={{ scale: 0.95 }}
                                onClick={btn.fn}
                                style={{
                                    width: "3rem", height: "3rem",
                                    borderRadius: "50%",
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    color: "white",
                                    cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    backdropFilter: "blur(12px)",
                                }}
                            >
                                <btn.icon style={{ width: "1.25rem", height: "1.25rem" }} />
                            </motion.button>
                        ))}
                    </div>

                    <AnimatePresence initial={false} custom={direction} mode="wait">
                        <motion.div
                            key={current}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 400, damping: 40 },
                                opacity: { duration: 0.25 }
                            }}
                            style={{
                                width: "100%",
                                background: "rgba(10, 15, 30, 0.4)",
                                border: `1px solid ${t.color}22`,
                                borderRadius: "2rem",
                                padding: "2.5rem 3rem",
                                backdropFilter: "blur(24px)",
                                boxShadow: `0 30px 80px -15px rgba(0,0,0,0.4), 0 0 0 1px ${t.color}10 inset`,
                                position: "relative",
                                display: "grid",
                                gridTemplateColumns: "140px 1fr",
                                gap: "2.5rem",
                                alignItems: "center",
                            }}
                            className="testimonial-card"
                        >
                            {/* Visual Accent */}
                            <div style={{
                                position: "absolute",
                                top: 0,
                                left: "20%",
                                right: "20%",
                                height: "1px",
                                background: `linear-gradient(90deg, transparent, ${t.color}, transparent)`,
                                opacity: 0.4,
                            }} />

                            {/* Left Side: Profile */}
                            <div style={{ textAlign: "center" }}>
                                <div style={{ position: "relative", width: "100px", height: "100px", margin: "0 auto 1.25rem" }}>
                                    <div style={{
                                        width: "100%", height: "100%",
                                        borderRadius: "1.5rem",
                                        background: `linear-gradient(135deg, ${t.color}, ${t.color}88)`,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: "2rem", fontWeight: 900, color: "white",
                                        boxShadow: `0 12px 24px ${t.color}33`,
                                        position: "relative",
                                        zIndex: 2,
                                    }}>
                                        {t.initials}
                                    </div>
                                    <div style={{
                                        position: "absolute", inset: "-6px",
                                        border: `1px dashed ${t.color}33`,
                                        borderRadius: "1.75rem",
                                        animation: "spin 15s linear infinite",
                                        zIndex: 1,
                                    }} />
                                </div>
                                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "white", marginBottom: "0.15rem" }}>{t.name}</h3>
                                <p style={{ color: "rgba(255,255,255,0.35)", fontWeight: 700, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                    {t.role}
                                </p>
                            </div>

                            {/* Right Side: Content */}
                            <div>
                                <div style={{ display: "flex", gap: "0.3rem", marginBottom: "1rem" }}>
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} style={{ width: "0.9rem", height: "0.9rem", color: "#f59e0b", fill: "#f59e0b" }} />
                                    ))}
                                </div>

                                <Quote style={{ width: "2.5rem", height: "2.5rem", color: `${t.color}15`, position: "absolute", top: "2rem", right: "3rem" }} />

                                <blockquote style={{
                                    fontSize: "1.1rem",
                                    color: "rgba(255,255,255,0.85)",
                                    lineHeight: 1.6,
                                    margin: "0 0 1.5rem",
                                    fontWeight: 500,
                                }}>
                                    &ldquo;{t.text}&rdquo;
                                </blockquote>

                                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: "0.5rem",
                                        background: `${t.color}15`,
                                        border: `1px solid ${t.color}25`,
                                        padding: "0.4rem 1rem",
                                        borderRadius: "0.75rem",
                                    }}>
                                        <CheckCircle2 style={{ width: "0.9rem", height: "0.9rem", color: t.color }} />
                                        <span style={{ fontSize: "0.8rem", color: "white", fontWeight: 700 }}>{t.highlight}</span>
                                    </div>
                                    <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>
                                        {t.city} • {t.since}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Pagination Dots */}
                    <div style={{ display: "flex", justifyContent: "center", gap: "0.6rem", marginTop: "2rem" }}>
                        {testimonials.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setDirection(i > current ? 1 : -1);
                                    setCurrent(i);
                                }}
                                style={{
                                    width: i === current ? "2rem" : "0.6rem",
                                    height: "0.6rem",
                                    borderRadius: "999px",
                                    background: i === current ? t.color : "rgba(255,255,255,0.1)",
                                    border: "none",
                                    cursor: "pointer",
                                    transition: "all 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
                                    padding: 0,
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @media (max-width: 960px) {
                    .testimonial-card {
                        grid-template-columns: 1fr !important;
                        padding: 3rem 2rem !important;
                        text-align: center !important;
                    }
                    .testimonial-card blockquote {
                        font-size: 1.15rem !important;
                    }
                    .nav-container {
                        display: none !important;
                    }
                }
            `}</style>
        </section>
    );
}

