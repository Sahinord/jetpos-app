"use client";

import { useState, useEffect, useRef } from "react";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";

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
    const [animating, setAnimating] = useState(false);
    const [direction, setDirection] = useState<"left" | "right">("right");
    const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const go = (idx: number, dir: "left" | "right") => {
        if (animating) return;
        setDirection(dir);
        setAnimating(true);
        setTimeout(() => {
            setCurrent(idx);
            setAnimating(false);
        }, 350);
    };

    const prev = () => go((current - 1 + testimonials.length) % testimonials.length, "left");
    const next = () => go((current + 1) % testimonials.length, "right");

    // Auto-advance
    useEffect(() => {
        autoRef.current = setInterval(next, 5000);
        return () => { if (autoRef.current) clearInterval(autoRef.current); };
    }, [current]);

    const t = testimonials[current];

    return (
        <section style={{ padding: "7rem 0", position: "relative", zIndex: 2, overflow: "hidden" }}>
            {/* BG glow */}
            <div style={{
                position: "absolute", top: "30%", left: "50%",
                transform: "translateX(-50%)",
                width: "700px", height: "400px",
                background: `radial-gradient(ellipse, ${t.color}0D 0%, transparent 70%)`,
                pointerEvents: "none",
                transition: "background 0.8s ease",
            }} />

            <div className="site-container">
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "4rem" }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: "0.5rem",
                        background: "rgba(59,130,246,0.08)",
                        border: "1px solid rgba(59,130,246,0.18)",
                        borderRadius: "9999px",
                        padding: "0.35rem 1rem",
                        marginBottom: "1.25rem",
                    }}>
                        <Star style={{ width: "0.75rem", height: "0.75rem", color: "#f59e0b", fill: "#f59e0b" }} />
                        <span style={{ fontSize: "0.78rem", color: "#93c5fd", fontWeight: 600 }}>Müşteri Yorumları</span>
                    </div>
                    <h2 style={{
                        fontSize: "clamp(2rem, 4vw, 3rem)",
                        fontWeight: 900,
                        color: "white",
                        margin: "0 0 1rem",
                        lineHeight: 1.15,
                        letterSpacing: "-0.03em",
                    }}>
                        İşletmeler{" "}
                        <span style={{
                            background: "linear-gradient(135deg, #60a5fa, #a78bfa)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}>JetPOS'u Seviyor</span>
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "1rem", margin: 0 }}>
                        Türkiye genelinde 2,400+ işletmenin deneyimi
                    </p>
                </div>

                {/* Main Card */}
                <div style={{ maxWidth: "800px", margin: "0 auto", position: "relative" }}>
                    {/* Nav buttons */}
                    {[{ fn: prev, dir: "left" }, { fn: next, dir: "right" }].map(({ fn, dir }) => (
                        <button
                            key={dir}
                            onClick={fn}
                            style={{
                                position: "absolute",
                                top: "50%",
                                [dir]: dir === "left" ? "-3.5rem" : "-3.5rem",
                                ...(dir === "left" ? { left: "-3.5rem" } : { right: "-3.5rem" }),
                                transform: "translateY(-50%)",
                                width: "2.75rem", height: "2.75rem",
                                borderRadius: "50%",
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "rgba(255,255,255,0.7)",
                                cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all 0.2s",
                                zIndex: 10,
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLButtonElement).style.background = "rgba(59,130,246,0.15)";
                                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(59,130,246,0.3)";
                                (e.currentTarget as HTMLButtonElement).style.color = "white";
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
                                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)";
                                (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)";
                            }}
                        >
                            {dir === "left"
                                ? <ChevronLeft style={{ width: "1.125rem", height: "1.125rem" }} />
                                : <ChevronRight style={{ width: "1.125rem", height: "1.125rem" }} />
                            }
                        </button>
                    ))}

                    {/* Card */}
                    <div style={{
                        background: "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
                        border: `1px solid ${t.color}25`,
                        borderRadius: "2rem",
                        padding: "2.5rem",
                        position: "relative",
                        overflow: "hidden",
                        boxShadow: `0 24px 64px rgba(0,0,0,0.35), 0 0 0 1px ${t.color}15 inset`,
                        transition: "border-color 0.6s, box-shadow 0.6s",
                        opacity: animating ? 0 : 1,
                        transform: animating
                            ? `translateX(${direction === "right" ? "-20px" : "20px"})`
                            : "translateX(0)",
                        // transition for the transform/opacity
                        ...(animating ? {} : { transition: "opacity 0.35s ease, transform 0.35s ease, border-color 0.6s, box-shadow 0.6s" }),
                    }}>
                        {/* Top accent */}
                        <div style={{
                            position: "absolute", top: 0, left: "10%", right: "10%", height: "1px",
                            background: `linear-gradient(90deg, transparent, ${t.color}60, transparent)`,
                            transition: "background 0.6s",
                        }} />

                        {/* Quote icon */}
                        <div style={{
                            position: "absolute", top: "1.5rem", right: "1.5rem",
                            width: "3rem", height: "3rem",
                            background: `${t.color}15`,
                            border: `1px solid ${t.color}25`,
                            borderRadius: "0.875rem",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "background 0.6s",
                        }}>
                            <Quote style={{ width: "1.125rem", height: "1.125rem", color: t.color }} />
                        </div>

                        {/* Stars */}
                        <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.25rem" }}>
                            {[...Array(t.rating)].map((_, i) => (
                                <Star key={i} style={{ width: "1rem", height: "1rem", color: "#f59e0b", fill: "#f59e0b" }} />
                            ))}
                        </div>

                        {/* Quote text */}
                        <blockquote style={{
                            margin: "0 0 1.75rem",
                            fontSize: "1.05rem",
                            color: "rgba(255,255,255,0.8)",
                            lineHeight: 1.75,
                            fontStyle: "italic",
                        }}>
                            &ldquo;{t.text}&rdquo;
                        </blockquote>

                        {/* Highlight pill */}
                        <div style={{
                            display: "inline-flex", alignItems: "center", gap: "0.4rem",
                            background: `${t.color}15`,
                            border: `1px solid ${t.color}30`,
                            borderRadius: "9999px",
                            padding: "0.3rem 0.875rem",
                            marginBottom: "1.75rem",
                            transition: "background 0.6s, border-color 0.6s",
                        }}>
                            <div style={{ width: "0.35rem", height: "0.35rem", borderRadius: "50%", background: t.color }} />
                            <span style={{ fontSize: "0.78rem", color: t.color, fontWeight: 600 }}>{t.highlight}</span>
                        </div>

                        {/* Author row */}
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            {/* Avatar */}
                            <div style={{
                                width: "3rem", height: "3rem",
                                borderRadius: "50%",
                                background: `linear-gradient(135deg, ${t.color}cc, ${t.color}66)`,
                                border: `2px solid ${t.color}40`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "0.875rem", fontWeight: 800, color: "white",
                                flexShrink: 0,
                                transition: "background 0.6s, border-color 0.6s",
                            }}>
                                {t.initials}
                            </div>
                            <div>
                                <p style={{ margin: 0, fontWeight: 700, color: "white", fontSize: "0.95rem" }}>{t.name}</p>
                                <p style={{ margin: 0, fontSize: "0.8rem", color: "rgba(255,255,255,0.45)" }}>
                                    {t.role} · {t.city}
                                </p>
                            </div>
                            <div style={{
                                marginLeft: "auto",
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: "0.625rem",
                                padding: "0.35rem 0.75rem",
                            }}>
                                <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.35)" }}>{t.since}</p>
                            </div>
                        </div>
                    </div>

                    {/* Dots */}
                    <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "2rem" }}>
                        {testimonials.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => go(i, i > current ? "right" : "left")}
                                style={{
                                    width: i === current ? "1.75rem" : "0.5rem",
                                    height: "0.5rem",
                                    borderRadius: "9999px",
                                    background: i === current ? testimonials[current].color : "rgba(255,255,255,0.15)",
                                    border: "none",
                                    cursor: "pointer",
                                    transition: "all 0.4s cubic-bezier(0.22,1,0.36,1)",
                                    padding: 0,
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Bottom mini cards */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "1rem",
                    maxWidth: "700px",
                    margin: "3rem auto 0",
                }} className="testimonial-mini-grid">
                    {[
                        { emoji: "⭐", value: "4.9/5", label: "App Store Puanı" },
                        { emoji: "💬", value: "98%", label: "Memnuniyet Oranı" },
                        { emoji: "🔄", value: "< 2h", label: "Ortalama Destek Süresi" },
                    ].map((item, i) => (
                        <div key={i} style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.07)",
                            borderRadius: "1rem",
                            padding: "1rem",
                            textAlign: "center",
                        }}>
                            <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>{item.emoji}</div>
                            <p style={{ margin: 0, fontWeight: 800, color: "white", fontSize: "1.1rem" }}>{item.value}</p>
                            <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>{item.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                @media (max-width: 700px) {
                    .testimonial-mini-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </section>
    );
}
