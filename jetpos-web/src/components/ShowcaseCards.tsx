"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { ArrowRight, Zap, Package, Check } from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

const cards = [
    {
        id: "pc",
        image: "/pc.png",
        imageAlt: "Kasap işletmesi sahibi JetPOS kasa ekranı kullanıyor",
        badgeLabel: "⚡ Canlı Satış Takibi",
        title: "Kasadan Tam Kontrol",
        desc: "Satışlarınızı, ödemelerinizi ve günlük cironuzu tek ekrandan yönetin.",
        features: ["Anlık Yönetim", "Gerçek Zamanlı Satış", "Günlük Ciro Takibi"],
        notif: { emoji: "✓", label: "Yeni Ödeme Alındı", sub: "₺1.240 Tahsil Edildi", time: "Şimdi", emojiColor: "#10B981" },
        accent: "#7886C7",
        accentRgb: "120,134,199",
        ctaText: "Canlı Önizleme",
    },
    {
        id: "phone",
        image: "/phone.png",
        imageAlt: "Mağaza çalışanı mobil cihazla ürün tarıyor",
        badgeLabel: "📦 Anlık Stok Kontrolü",
        title: "Mobil Stok Takibi",
        desc: "Ürünlerinizi telefonunuzdan takip edin, stok durumunu anlık görüntüleyin.",
        features: ["Barkod Okutma", "Anlık Güncelleme", "Mobil Yönetim"],
        notif: { emoji: "⚠", label: "Stok Uyarısı", sub: "Coca Cola stok 5 adetin altında", time: "Şimdi", emojiColor: "#F59E0B" },
        accent: "#5A659F",
        accentRgb: "90,101,159",
        ctaText: "Özelliği Keşfet",
    },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ShowcaseCards() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    const [hovered, setHovered] = useState<string | null>(null);
    // Per-card notification state: null | "in" | "out"
    const [notifState, setNotifState] = useState<Record<string, "in" | "out" | null>>({});
    const notifTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    // Scroll fade-up
    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
            { threshold: 0.12 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    // Trigger floating notification when a card is hovered
    const handleMouseEnter = useCallback((id: string) => {
        setHovered(id);
        // Clear any existing timers for this card
        clearTimeout(notifTimers.current[id]);
        clearTimeout(notifTimers.current[id + "_out"]);

        // Show notification after 150ms
        notifTimers.current[id] = setTimeout(() => {
            setNotifState(s => ({ ...s, [id]: "in" }));

            // Auto-hide after 2.0s
            notifTimers.current[id + "_out"] = setTimeout(() => {
                setNotifState(s => ({ ...s, [id]: "out" }));
            }, 2000);
        }, 150);
    }, []);

    const handleMouseLeave = useCallback((id: string) => {
        setHovered(null);
        clearTimeout(notifTimers.current[id]);
        clearTimeout(notifTimers.current[id + "_out"]);
        setNotifState(s => ({ ...s, [id]: null }));
    }, []);

    return (
        <section
            ref={sectionRef}
            style={{
                backgroundColor: "#FFFFFF",
                padding: "120px 2rem 80px",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Ambient glow */}
            <div style={{
                position: "absolute", top: 0, left: "50%",
                transform: "translateX(-50%)",
                width: "1000px", height: "420px",
                background: "radial-gradient(ellipse at center top, rgba(120,134,199,0.07) 0%, transparent 65%)",
                pointerEvents: "none",
            }} />

            <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative" }}>

                {/* ── Header ──────────────────────────────────────────── */}
                <div style={{
                    textAlign: "center",
                    marginBottom: "60px",
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(28px)",
                    transition: "opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1)",
                }}>
                    <h2 style={{
                        fontSize: "clamp(2rem, 4vw, 2.75rem)",
                        fontWeight: 900, color: "#111827",
                        letterSpacing: "-0.025em", lineHeight: 1.2,
                        margin: "0 0 1rem",
                    }}>
                        İşletmeniz Her An{" "}
                        <span style={{
                            background: "linear-gradient(135deg, #7886C7, #5A659F)",
                            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                        }}>
                            Yanınızda.
                        </span>
                    </h2>
                    <p style={{
                        fontSize: "1.05rem", color: "#6b7280", lineHeight: 1.7,
                        maxWidth: "560px", margin: "0 auto", fontWeight: 450,
                    }}>
                        JetPOS ile satışlarınızı yönetin, stoklarınızı takip edin ve işletmenizi
                        ister kasadan ister telefonunuzdan anlık olarak kontrol edin.
                    </p>
                </div>

                {/* ── Cards ───────────────────────────────────────────── */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "24px",
                }} className="sc-grid">
                    {cards.map((card, i) => {
                        const isHovered = hovered === card.id;
                        const nState = notifState[card.id];
                        const notifVisible = nState === "in";

                        return (
                            <div
                                key={card.id}
                                onMouseEnter={() => handleMouseEnter(card.id)}
                                onMouseLeave={() => handleMouseLeave(card.id)}
                                style={{
                                    position: "relative",
                                    borderRadius: "24px",
                                    overflow: "hidden",
                                    isolation: "isolate", // Fixes backdrop-filter rendering inside rounded cards
                                    // Fallback background color prevents white flash and aligns with dark theme
                                    backgroundColor: "#050814",
                                    height: "420px",
                                    cursor: "pointer",
                                    border: `1px solid ${isHovered ? `rgba(${card.accentRgb},0.4)` : "rgba(120,134,199,0.1)"}`,
                                    boxShadow: isHovered
                                        ? "0 25px 60px rgba(120,134,199,0.18), 0 0 40px rgba(120,134,199,0.10)"
                                        : "0 4px 24px rgba(0,0,0,0.06)",
                                    transform: isHovered ? "translateY(-8px)" : "translateY(0)",
                                    transition: "transform 420ms cubic-bezier(0.22,1,0.36,1), box-shadow 420ms ease, border-color 420ms ease, opacity 0.6s cubic-bezier(0.22,1,0.36,1)",
                                    opacity: visible ? 1 : 0,
                                    transitionDelay: visible ? `${0.1 + i * 0.14}s` : "0s",
                                }}
                                className="sc-card"
                            >
                                {/* ── Image ── */}
                                <Image
                                    src={card.image}
                                    alt={card.imageAlt}
                                    fill
                                    style={{
                                        objectFit: "cover",
                                        transform: isHovered ? "scale(1.04)" : "scale(1)",
                                        transition: "transform 0.6s ease",
                                        zIndex: 1, // Bottom layer
                                    }}
                                    sizes="(max-width: 768px) 100vw, 600px"
                                />

                                {/* ── Always-on gradient overlay ── */}
                                <div style={{
                                    position: "absolute", inset: 0, 
                                    zIndex: 2, // Middle layer
                                    background: isHovered
                                        ? "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(5,8,20,0.22) 35%, rgba(5,8,20,0.80) 70%, rgba(5,8,20,0.96) 100%)"
                                        : "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(5,8,20,0.15) 35%, rgba(5,8,20,0.75) 70%, rgba(5,8,20,0.92) 100%)",
                                    transition: "background 420ms ease",
                                }} />

                                {/* ── Floating notification (top-right) ── */}
                                <div style={{
                                    position: "absolute", top: "16px", right: "16px",
                                    zIndex: 10, // Top layer
                                    opacity: notifVisible ? 1 : 0,
                                    transform: notifVisible ? "translateY(0) scale(1)" : "translateY(-10px) scale(0.94)",
                                    transition: nState === null
                                        ? "none"
                                        : "opacity 0.4s cubic-bezier(0.22,1,0.36,1), transform 0.4s cubic-bezier(0.22,1,0.36,1)",
                                    pointerEvents: "none",
                                }}>
                                    <div style={{
                                        background: "rgba(10, 15, 30, 0.85)", // Dark premium translucent background
                                        backdropFilter: "blur(12px)",
                                        WebkitBackdropFilter: "blur(12px)",
                                        border: "1px solid rgba(255, 255, 255, 0.1)",
                                        borderRadius: "14px",
                                        padding: "0.6rem 0.875rem",
                                        boxShadow: `0 8px 32px rgba(${card.accentRgb},0.25), 0 2px 8px rgba(0,0,0,0.15)`,
                                        display: "flex", alignItems: "flex-start", gap: "0.55rem",
                                        minWidth: "170px",
                                    }}>
                                        <span style={{ fontSize: "1rem", lineHeight: 1.3, flexShrink: 0, color: card.notif.emojiColor, fontWeight: 800 }}>{card.notif.emoji}</span>
                                        <div>
                                            <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, color: "white", lineHeight: 1.3 }}>
                                                {card.notif.label}
                                            </p>
                                            <p style={{ margin: "0.15rem 0 0", fontSize: "0.65rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.3 }}>
                                                {card.notif.sub}
                                            </p>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.25rem" }}>
                                                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: card.accent, boxShadow: `0 0 6px ${card.accent}`, display: "inline-block" }} />
                                                <span style={{ fontSize: "0.6rem", color: card.accent, fontWeight: 600 }}>{card.notif.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Glassmorphism content panel (slides up on hover) ── */}
                                <div style={{
                                    position: "absolute", left: 0, right: 0, bottom: 0,
                                    zIndex: 5, // Above image and gradient
                                    transform: isHovered ? "translateY(0)" : "translateY(0)",
                                    transition: "transform 420ms cubic-bezier(0.22,1,0.36,1)",
                                }}>
                                    {/* Badge — visible on hover */}
                                    <div style={{
                                        paddingLeft: "2rem",
                                        marginBottom: "0.6rem",
                                        opacity: isHovered ? 1 : 0,
                                        transform: isHovered ? "translateY(0)" : "translateY(8px)",
                                        transition: "opacity 350ms ease 60ms, transform 350ms cubic-bezier(0.22,1,0.36,1) 60ms",
                                    }}>
                                        <span style={{
                                            display: "inline-flex", alignItems: "center",
                                            background: `rgba(${card.accentRgb},0.25)`,
                                            backdropFilter: "blur(12px)",
                                            WebkitBackdropFilter: "blur(12px)",
                                            border: `1px solid rgba(${card.accentRgb},0.4)`,
                                            borderRadius: "9999px",
                                            padding: "0.22rem 0.7rem",
                                            fontSize: "0.68rem", fontWeight: 700, color: "white",
                                            letterSpacing: "0.03em",
                                        }}>
                                            {card.badgeLabel}
                                        </span>
                                    </div>

                                    {/* Glass panel */}
                                    <div style={{
                                        background: "rgba(10, 15, 35, 0.65)",
                                        backdropFilter: "blur(18px)",
                                        WebkitBackdropFilter: "blur(18px)",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        borderRadius: "16px",
                                        padding: "1.25rem 1.5rem 1.5rem",
                                        margin: "0 12px 12px",
                                    }}>
                                        {/* Title */}
                                        <h3 style={{
                                            margin: "0 0 0.375rem",
                                            fontSize: "1.2rem", fontWeight: 800,
                                            color: "white", letterSpacing: "-0.015em", lineHeight: 1.25,
                                            textShadow: "0 0 20px rgba(120,134,199,0.35)",
                                            transform: isHovered ? "translateX(0)" : "translateX(-12px)",
                                            transition: "transform 400ms cubic-bezier(0.22,1,0.36,1)",
                                        }}>
                                            {card.title}
                                        </h3>

                                        {/* Description */}
                                        <p style={{
                                            margin: 0, fontSize: "0.875rem",
                                            color: "rgba(255,255,255,0.68)", lineHeight: 1.6,
                                            transform: isHovered ? "translateX(0)" : "translateX(-12px)",
                                            opacity: isHovered ? 1 : 0.85,
                                            transition: "transform 400ms cubic-bezier(0.22,1,0.36,1), opacity 400ms ease",
                                            minHeight: "45px",
                                        }}>
                                            {card.desc}
                                        </p>

                                        {/* Feature list — only visible on hover */}
                                        <div style={{
                                            overflow: "hidden",
                                            maxHeight: isHovered ? "120px" : "0",
                                            opacity: isHovered ? 1 : 0,
                                            transition: "max-height 420ms cubic-bezier(0.22,1,0.36,1), opacity 350ms ease",
                                        }}>
                                            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: "1rem", paddingTop: "0.875rem", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                                                {card.features.map((f, fi) => (
                                                    <div key={fi} style={{
                                                        display: "flex", alignItems: "center", gap: "0.5rem",
                                                        opacity: isHovered ? 1 : 0,
                                                        transform: isHovered ? "translateX(0)" : "translateX(-12px)",
                                                        transition: `opacity 320ms ease ${100 + fi * 60}ms, transform 320ms cubic-bezier(0.22,1,0.36,1) ${100 + fi * 60}ms`,
                                                    }}>
                                                        <span style={{
                                                            width: "16px", height: "16px", borderRadius: "50%", flexShrink: 0,
                                                            background: `rgba(${card.accentRgb},0.2)`,
                                                            border: `1px solid rgba(${card.accentRgb},0.5)`,
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                        }}>
                                                            <Check style={{ width: "8px", height: "8px", color: card.accent, strokeWidth: 3 }} />
                                                        </span>
                                                        <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.78)", fontWeight: 500 }}>{f}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* CTA row — only on hover */}
                                        <div style={{
                                            display: "flex", alignItems: "center", justifyContent: "flex-end",
                                            marginTop: isHovered ? "1rem" : "0",
                                            opacity: isHovered ? 1 : 0,
                                            maxHeight: isHovered ? "40px" : "0",
                                            overflow: "hidden",
                                            transition: "opacity 350ms ease 220ms, max-height 420ms cubic-bezier(0.22,1,0.36,1)",
                                        }}>
                                            <div style={{
                                                display: "flex", alignItems: "center", gap: "0.375rem",
                                                color: card.accent, fontSize: "0.82rem", fontWeight: 700,
                                            }}>
                                                {card.ctaText}
                                                <ArrowRight style={{
                                                    width: "13px", height: "13px",
                                                    transform: isHovered ? "translateX(8px)" : "translateX(0)",
                                                    transition: "transform 300ms ease",
                                                }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        );
                    })}
                </div>

            </div>

            <style>{`
                @media (max-width: 768px) {
                    .sc-grid { grid-template-columns: 1fr !important; }
                    .sc-card { height: 360px !important; transform: none !important; }
                }
            `}</style>
        </section>
    );
}
