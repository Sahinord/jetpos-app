"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Users, ShoppingCart, TrendingUp, Star } from "lucide-react";

function useCountUp(target: number, duration = 2000, start = false) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!start) return;
        let startTime: number | null = null;
        const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            // ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [target, duration, start]);
    return count;
}

const stats = [
    {
        icon: Users,
        value: 2400,
        suffix: "+",
        label: "Aktif İşletme",
        sublabel: "Türkiye genelinde",
        color: "#3b82f6",
        bg: "rgba(59,130,246,0.1)",
        border: "rgba(59,130,246,0.2)",
        glow: "rgba(59,130,246,0.3)",
    },
    {
        icon: ShoppingCart,
        value: 1200000,
        suffix: "+",
        label: "Aylık İşlem",
        sublabel: "Güvenle tamamlandı",
        color: "#a78bfa",
        bg: "rgba(167,139,250,0.1)",
        border: "rgba(167,139,250,0.2)",
        glow: "rgba(167,139,250,0.3)",
        format: "M",
    },
    {
        icon: TrendingUp,
        value: 999,
        suffix: "%",
        label: "Uptime",
        sublabel: "Kesintisiz hizmet",
        color: "#10b981",
        bg: "rgba(16,185,129,0.1)",
        border: "rgba(16,185,129,0.2)",
        glow: "rgba(16,185,129,0.3)",
        isDecimal: true,
    },
    {
        icon: Star,
        value: 49,
        suffix: "",
        label: "Müşteri Puanı",
        sublabel: "App Store & Play Store",
        color: "#f59e0b",
        bg: "rgba(245,158,11,0.1)",
        border: "rgba(245,158,11,0.2)",
        glow: "rgba(245,158,11,0.3)",
        isRating: true,
    },
];

function formatValue(value: number, stat: typeof stats[0]) {
    if (stat.isDecimal) {
        // 999 → 99.9
        const str = value.toString().padStart(3, "0");
        return str.slice(0, 2) + "." + str.slice(2);
    }
    if (stat.isRating) {
        // 49 → 4.9
        return (value / 10).toFixed(1);
    }
    if (stat.format === "M") {
        return (value / 1000000).toFixed(1) + "M";
    }
    return value.toLocaleString("tr-TR");
}

export default function Stats() {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.3 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <section
            ref={ref}
            style={{
                padding: "5rem 0",
                position: "relative",
                zIndex: 2,
                overflow: "hidden",
            }}
        >
            {/* Subtle separator top */}
            <div style={{
                position: "absolute", top: 0, left: "15%", right: "15%", height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.3), transparent)",
            }} />
            <div style={{
                position: "absolute", bottom: 0, left: "15%", right: "15%", height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.2), transparent)",
            }} />

            {/* Background glow */}
            <div style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                width: "600px", height: "300px",
                background: "radial-gradient(ellipse, rgba(37,99,235,0.06) 0%, transparent 70%)",
                pointerEvents: "none",
            }} />

            <div className="site-container">
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: "0.5rem",
                        background: "rgba(59,130,246,0.08)",
                        border: "1px solid rgba(59,130,246,0.18)",
                        borderRadius: "9999px",
                        padding: "0.35rem 1rem",
                        marginBottom: "1rem",
                    }}>
                        <div style={{
                            width: "0.4rem", height: "0.4rem", borderRadius: "50%",
                            background: "#3b82f6", boxShadow: "0 0 6px #3b82f6",
                            animation: "statPulse 2s ease-in-out infinite",
                        }} />
                        <span style={{ fontSize: "0.78rem", color: "#93c5fd", fontWeight: 600, letterSpacing: "0.04em" }}>
                            Gerçek Zamanlı Veriler
                        </span>
                    </div>
                    <h2 style={{
                        fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
                        fontWeight: 900,
                        color: "white",
                        lineHeight: 1.15,
                        letterSpacing: "-0.03em",
                        margin: 0,
                    }}>
                        Rakamlarla{" "}
                        <span style={{
                            background: "linear-gradient(135deg, #60a5fa, #a78bfa)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}>JetPOS</span>
                    </h2>
                </div>

                {/* Stats Grid */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "1.25rem",
                }} className="stats-grid">
                    {stats.map((stat, i) => (
                        <StatCard key={i} stat={stat} index={i} visible={visible} />
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes statPulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(0.8); }
                }
                @keyframes statFadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes statGlow {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
                @keyframes barFill {
                    from { width: 0%; }
                    to   { width: var(--bar-width); }
                }
                @media (max-width: 900px) {
                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                }
                @media (max-width: 480px) {
                    .stats-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </section>
    );
}

function StatCard({ stat, index, visible }: { stat: typeof stats[0]; index: number; visible: boolean }) {
    const [hovered, setHovered] = useState(false);

    // Each stat has a different duration for staggered feel
    const durations = [2200, 2500, 1800, 2000];
    const count = useCountUp(stat.value, durations[index], visible);
    const displayValue = formatValue(count, stat);

    // Progress bar widths
    const barWidths = ["72%", "88%", "99.9%", "94%"];

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: hovered
                    ? `linear-gradient(135deg, ${stat.bg}, rgba(255,255,255,0.01))`
                    : "rgba(255,255,255,0.02)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: `1px solid ${hovered ? stat.border : "rgba(255,255,255,0.06)"}`,
                borderRadius: "2rem",
                padding: "2.25rem",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
                transform: hovered ? "translateY(-8px) scale(1.02)" : "translateY(0) scale(1)",
                boxShadow: hovered
                    ? `0 30px 60px -12px rgba(0,0,0,0.5), 0 0 0 1px ${stat.border}, 0 0 30px ${stat.glow}`
                    : "0 10px 40px -10px rgba(0,0,0,0.3)",
                cursor: "default",
                animation: `statFadeUp 0.8s ${0.1 + index * 0.15}s cubic-bezier(0.23, 1, 0.32, 1) both`,
            }}
        >
            {/* Background Texture/Noise (Subtle) */}
            <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: "url('https://www.transparenttextures.com/patterns/carbon-fibre.png')",
                opacity: 0.03, pointerEvents: "none"
            }} />

            {/* Bloom/Glow Orb */}
            <div style={{
                position: "absolute", top: "-20%", right: "-20%",
                width: "150px", height: "150px",
                background: `radial-gradient(circle, ${stat.color}15 0%, transparent 70%)`,
                opacity: hovered ? 1 : 0.4,
                transition: "opacity 0.6s ease",
                pointerEvents: "none",
            }} />

            {/* Icon Container */}
            <div style={{
                width: "3.5rem", height: "3.5rem",
                background: `linear-gradient(135deg, ${stat.bg}, rgba(255,255,255,0.05))`,
                border: `1px solid ${stat.border}`,
                borderRadius: "1.125rem",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "1.75rem",
                transition: "all 0.4s",
                transform: hovered ? "scale(1.1) rotate(-8deg)" : "scale(1) rotate(0deg)",
                boxShadow: hovered ? `0 0 20px ${stat.glow}` : "none",
            }}>
                <stat.icon style={{ width: "1.5rem", height: "1.5rem", color: stat.color }} />
            </div>

            {/* Value Display */}
            <div style={{
                marginBottom: "0.5rem",
                display: "flex",
                alignItems: "baseline",
                gap: "0.15rem",
            }}>
                <span style={{
                    fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
                    fontWeight: 900,
                    lineHeight: 1,
                    color: "white",
                    letterSpacing: "-0.05em",
                    background: hovered 
                        ? `linear-gradient(135deg, #ffffff 30%, ${stat.color} 100%)`
                        : "white",
                    WebkitBackgroundClip: hovered ? "text" : "none",
                    WebkitTextFillColor: hovered ? "transparent" : "none",
                    filter: hovered ? `drop-shadow(0 0 12px ${stat.color}40)` : "none",
                    transition: "all 0.4s ease",
                }}>
                    {displayValue}
                </span>
                {stat.suffix && (
                    <span style={{
                        fontSize: "1.5rem",
                        color: stat.color,
                        fontWeight: 900,
                        opacity: 0.9,
                        marginLeft: "2px"
                    }}>{stat.suffix}</span>
                )}
            </div>

            {/* Text Content */}
            <div style={{ marginBottom: "2rem" }}>
                <h3 style={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "1.125rem",
                    margin: "0 0 0.5rem",
                    letterSpacing: "-0.01em",
                }}>
                    {stat.label}
                </h3>
                <p style={{
                    color: "rgba(255,255,255,0.45)",
                    fontSize: "0.875rem",
                    margin: 0,
                    lineHeight: 1.5,
                }}>
                    {stat.sublabel}
                </p>
            </div>

            {/* Enhanced Progress Indicator */}
            <div style={{ position: "relative" }}>
                <div style={{
                    height: "4px",
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: "9999px",
                    overflow: "hidden",
                    position: "relative"
                }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: visible ? barWidths[index] : 0 }}
                        transition={{ 
                            duration: 2.5, 
                            delay: 0.5 + index * 0.2, 
                            ease: [0.22, 1, 0.36, 1] 
                        }}
                        style={{
                            height: "100%",
                            background: `linear-gradient(90deg, ${stat.color}ee, white)`,
                            borderRadius: "9999px",
                            boxShadow: `0 0 10px ${stat.color}aa`,
                        }}
                    />
                </div>
                {/* Percentage label hidden but kept for accessibility/future use */}
            </div>

            {/* Decorative Edge Glow (Hover) */}
            {hovered && (
                <div style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "2rem",
                    padding: "1px",
                    background: `linear-gradient(135deg, ${stat.color}60, transparent 40%, ${stat.color}40)`,
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                    pointerEvents: "none",
                }} />
            )}
        </div>
    );
}
