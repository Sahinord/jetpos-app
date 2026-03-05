"use client";

import { useEffect, useRef, useState } from "react";
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
                    ? `linear-gradient(145deg, ${stat.bg}, rgba(255,255,255,0.02))`
                    : "linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
                border: `1px solid ${hovered ? stat.border : "rgba(255,255,255,0.07)"}`,
                borderRadius: "1.5rem",
                padding: "1.75rem",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.4s cubic-bezier(0.22,1,0.36,1)",
                transform: hovered ? "translateY(-6px)" : "translateY(0)",
                boxShadow: hovered
                    ? `0 20px 48px rgba(0,0,0,0.35), 0 0 0 1px ${stat.border}, 0 0 40px ${stat.glow}`
                    : "0 4px 24px rgba(0,0,0,0.15)",
                cursor: "default",
                animation: `statFadeUp 0.6s ${0.1 + index * 0.12}s both`,
            }}
        >
            {/* Corner glow */}
            <div style={{
                position: "absolute", top: 0, right: 0,
                width: "80px", height: "80px",
                background: `radial-gradient(circle, ${stat.bg} 0%, transparent 70%)`,
                opacity: hovered ? 1 : 0.5,
                transition: "opacity 0.4s",
            }} />

            {/* Top accent line */}
            <div style={{
                position: "absolute", top: 0, left: "15%", right: "15%", height: "1px",
                background: `linear-gradient(90deg, transparent, ${stat.color}, transparent)`,
                opacity: hovered ? 0.8 : 0.3,
                transition: "opacity 0.4s",
            }} />

            {/* Icon */}
            <div style={{
                width: "2.75rem", height: "2.75rem",
                background: stat.bg,
                border: `1px solid ${stat.border}`,
                borderRadius: "0.875rem",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "1.25rem",
                transition: "transform 0.3s",
                transform: hovered ? "scale(1.1) rotate(-5deg)" : "scale(1) rotate(0deg)",
            }}>
                <stat.icon style={{ width: "1.25rem", height: "1.25rem", color: stat.color }} />
            </div>

            {/* Number */}
            <div style={{
                fontSize: "clamp(2rem, 4vw, 2.75rem)",
                fontWeight: 900,
                lineHeight: 1,
                color: "white",
                letterSpacing: "-0.04em",
                marginBottom: "0.25rem",
                display: "flex",
                alignItems: "baseline",
                gap: "0.1rem",
            }}>
                <span style={{
                    background: `linear-gradient(135deg, white 0%, ${stat.color} 100%)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                }}>
                    {displayValue}
                </span>
                {stat.suffix && (
                    <span style={{
                        fontSize: "1.25rem",
                        color: stat.color,
                        fontWeight: 800,
                    }}>{stat.suffix}</span>
                )}
            </div>

            {/* Label */}
            <p style={{
                color: "white",
                fontWeight: 700,
                fontSize: "0.95rem",
                margin: "0 0 0.25rem",
            }}>
                {stat.label}
            </p>
            <p style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: "0.78rem",
                margin: "0 0 1.25rem",
            }}>
                {stat.sublabel}
            </p>

            {/* Progress bar */}
            <div style={{
                height: "3px",
                background: "rgba(255,255,255,0.06)",
                borderRadius: "9999px",
                overflow: "hidden",
            }}>
                <div style={{
                    height: "100%",
                    width: visible ? barWidths[0] : "0%",
                    background: `linear-gradient(90deg, ${stat.color}88, ${stat.color})`,
                    borderRadius: "9999px",
                    transition: `width ${2 + index * 0.3}s cubic-bezier(0.22,1,0.36,1) ${0.3 + index * 0.1}s`,
                    boxShadow: `0 0 8px ${stat.glow}`,
                }} />
            </div>
        </div>
    );
}
