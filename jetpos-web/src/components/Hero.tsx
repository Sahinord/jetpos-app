"use client";

import { useState } from "react";
import { Phone, User, ArrowRight, Scan, CheckCircle, TrendingUp, ShoppingCart, Clock, Shield } from "lucide-react";
import Image from "next/image";

const stats = [
    { icon: TrendingUp, label: "Ürün Çeşidi", value: "4.853", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
    { icon: ShoppingCart, label: "Stok Adedi", value: "135", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
    { icon: Clock, label: "İşlem Hızı", value: "0.8sn", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
];

export default function Hero() {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [focused, setFocused] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && phone) setSubmitted(true);
    };

    return (
        <section style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            position: "relative",
            overflow: "visible",
            paddingTop: "5rem",
        }}>
            {/* Glow orbs */}
            <div style={{
                position: "absolute", top: "15%", left: "5%",
                width: "500px", height: "500px",
                background: "radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 65%)",
                borderRadius: "50%", pointerEvents: "none",
                animation: "floatOrb 8s ease-in-out infinite",
            }} />
            <div style={{
                position: "absolute", bottom: "10%", right: "10%",
                width: "400px", height: "400px",
                background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 65%)",
                borderRadius: "50%", pointerEvents: "none",
                animation: "floatOrb 10s ease-in-out infinite reverse",
            }} />

            <div style={{
                maxWidth: "1400px", margin: "0 auto",
                padding: "3rem 2rem 5rem",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "2rem",
                alignItems: "center",
                width: "100%",
                position: "relative", zIndex: 1,
            }} className="hero-grid">

                {/* ── LEFT ── */}
                <div style={{
                    display: "flex", flexDirection: "column", gap: "2rem",
                    animation: "slideInLeft 0.8s cubic-bezier(0.22,1,0.36,1) both",
                }}>

                    {/* Top pill badge */}
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: "0.625rem",
                        background: "rgba(37,99,235,0.1)",
                        border: "1px solid rgba(59,130,246,0.2)",
                        borderRadius: "9999px",
                        padding: "0.4rem 1rem 0.4rem 0.5rem",
                        width: "fit-content",
                        animation: "fadeUp 0.6s 0.1s cubic-bezier(0.22,1,0.36,1) both",
                    }}>
                        <span style={{
                            background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                            borderRadius: "9999px", padding: "0.2rem 0.6rem",
                            fontSize: "0.7rem", fontWeight: 700, color: "white",
                            letterSpacing: "0.05em", textTransform: "uppercase",
                        }}>YENİ</span>
                        <span style={{ fontSize: "0.82rem", color: "#93c5fd", fontWeight: 500 }}>
                            Ramazan Ayı Kampanyası — %30 İndirim
                        </span>
                    </div>

                    {/* Heading */}
                    <div style={{ animation: "fadeUp 0.6s 0.25s cubic-bezier(0.22,1,0.36,1) both" }}>
                        <h1 style={{
                            fontSize: "clamp(2.75rem, 5.5vw, 4.25rem)",
                            fontWeight: 900,
                            lineHeight: 1.08,
                            color: "white",
                            letterSpacing: "-0.04em",
                            margin: 0,
                        }}>
                            Dükkanınızı
                            <br />
                            <span style={{
                                position: "relative",
                                display: "inline-block",
                            }}>
                                <span style={{
                                    background: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #60a5fa 100%)",
                                    backgroundSize: "200% auto",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    animation: "shimmer 4s linear infinite",
                                }}>dijitalleştirin.</span>
                            </span>
                        </h1>
                        <p style={{
                            marginTop: "1.25rem",
                            fontSize: "1.05rem",
                            color: "rgba(255,255,255,0.45)",
                            lineHeight: 1.75,
                            maxWidth: "460px",
                        }}>
                            Barkod okuyarak saniyeler içinde satış yapın. Ön muhasebe, stok takibi ve raporlama tek platformda.
                        </p>
                    </div>

                    {/* CTA row */}
                    <div style={{
                        display: "flex", gap: "0.875rem", alignItems: "center", flexWrap: "wrap",
                        animation: "fadeUp 0.6s 0.4s cubic-bezier(0.22,1,0.36,1) both",
                    }}>
                        <button style={{
                            display: "inline-flex", alignItems: "center", gap: "0.5rem",
                            padding: "0.8rem 1.75rem",
                            background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                            color: "white", fontWeight: 700, fontSize: "0.95rem",
                            border: "none", borderRadius: "0.875rem", cursor: "pointer",
                            boxShadow: "0 0 0 1px rgba(59,130,246,0.3), 0 8px 24px rgba(37,99,235,0.4)",
                            fontFamily: "inherit", transition: "all 0.25s",
                            letterSpacing: "-0.01em",
                        }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = "translateY(-2px)";
                                e.currentTarget.style.boxShadow = "0 0 0 1px rgba(59,130,246,0.4), 0 12px 32px rgba(37,99,235,0.55)";
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "0 0 0 1px rgba(59,130,246,0.3), 0 8px 24px rgba(37,99,235,0.4)";
                            }}
                        >
                            Hemen Teklif Al
                        </button>
                        <button style={{
                            display: "inline-flex", alignItems: "center", gap: "0.5rem",
                            padding: "0.8rem 1.5rem",
                            background: "transparent",
                            color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: "0.95rem",
                            border: "1px solid rgba(255,255,255,0.12)", borderRadius: "0.875rem",
                            cursor: "pointer", fontFamily: "inherit", transition: "all 0.25s",
                        }}
                            onMouseEnter={e => {
                                e.currentTarget.style.color = "white";
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
                                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                                e.currentTarget.style.background = "transparent";
                            }}
                        >
                            Ücretsiz Dene <ArrowRight style={{ width: "1rem", height: "1rem" }} />
                        </button>
                    </div>

                    {/* Trust row */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap",
                        animation: "fadeUp 0.6s 0.55s cubic-bezier(0.22,1,0.36,1) both",
                    }}>
                        <div style={{ display: "flex" }}>
                            {["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444"].map((c, i) => (
                                <div key={i} style={{
                                    width: "2rem", height: "2rem", borderRadius: "50%",
                                    background: `linear-gradient(135deg, ${c}dd, ${c}88)`,
                                    border: "2px solid #030712",
                                    marginLeft: i === 0 ? 0 : "-0.6rem",
                                    fontSize: "0.65rem", color: "white", fontWeight: 800,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    {["K", "M", "A", "S", "E"][i]}
                                </div>
                            ))}
                        </div>
                        <div>
                            <div style={{ display: "flex", gap: "2px", marginBottom: "2px" }}>
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} width="12" height="12" viewBox="0 0 12 12" fill="#f59e0b">
                                        <path d="M6 1l1.5 3 3.5.5-2.5 2.5.5 3.5L6 9l-3 1.5.5-3.5L1 4.5 4.5 4z" />
                                    </svg>
                                ))}
                            </div>
                            <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255,255,255,0.45)" }}>
                                <strong style={{ color: "rgba(255,255,255,0.75)" }}>2,400+</strong> işletme JetPOS&apos;ta büyüyor
                            </p>
                        </div>
                        <div style={{ width: "1px", height: "2rem", background: "rgba(255,255,255,0.08)" }} />
                        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                            <Shield style={{ width: "0.875rem", height: "0.875rem", color: "#10b981" }} />
                            <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)" }}>SSL Güvenli</span>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "1.25rem",
                        padding: "1.5rem",
                        position: "relative",
                        overflow: "hidden",
                        animation: "fadeUp 0.6s 0.7s cubic-bezier(0.22,1,0.36,1) both",
                    }}>
                        {/* subtle top accent line */}
                        <div style={{
                            position: "absolute", top: 0, left: "10%", right: "10%", height: "1px",
                            background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent)",
                        }} />

                        {submitted ? (
                            <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                                <div style={{
                                    width: "3rem", height: "3rem",
                                    background: "rgba(59,130,246,0.1)",
                                    border: "1px solid rgba(59,130,246,0.3)",
                                    borderRadius: "50%",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    margin: "0 auto 0.875rem",
                                }}>
                                    <CheckCircle style={{ width: "1.5rem", height: "1.5rem", color: "#3b82f6" }} />
                                </div>
                                <p style={{ color: "white", fontWeight: 700, fontSize: "1.05rem", margin: "0 0 0.25rem" }}>Talebiniz Alındı!</p>
                                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem", margin: 0 }}>En kısa sürede sizi arayacağız.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <p style={{ color: "white", fontWeight: 700, fontSize: "1rem", margin: "0 0 1rem", letterSpacing: "-0.01em" }}>
                                    Hemen Sizi Arayalım
                                </p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem", marginBottom: "0.75rem" }} className="form-grid">
                                    {[
                                        { id: "name", icon: User, placeholder: "Adınız ve Soyadınız *", value: name, onChange: setName, type: "text" },
                                        { id: "phone", icon: Phone, placeholder: "Telefon Numaranız *", value: phone, onChange: setPhone, type: "tel" },
                                    ].map(({ id, icon: Icon, placeholder, value, onChange, type }) => (
                                        <div key={id} style={{
                                            display: "flex", alignItems: "center", gap: "0.625rem",
                                            background: focused === id ? "rgba(59,130,246,0.06)" : "rgba(255,255,255,0.04)",
                                            border: `1px solid ${focused === id ? "rgba(59,130,246,0.35)" : "rgba(255,255,255,0.08)"}`,
                                            borderRadius: "0.75rem", padding: "0.625rem 0.875rem",
                                            transition: "all 0.2s",
                                        }}>
                                            <Icon style={{ width: "0.9rem", height: "0.9rem", color: focused === id ? "#60a5fa" : "rgba(255,255,255,0.25)", flexShrink: 0, transition: "color 0.2s" }} />
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
                                                    color: "white", fontSize: "0.83rem", width: "100%",
                                                    fontFamily: "inherit",
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <button type="submit" style={{
                                    width: "100%",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                                    padding: "0.75rem",
                                    background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                                    color: "white", fontWeight: 700, fontSize: "0.9rem",
                                    border: "none", borderRadius: "0.75rem", cursor: "pointer",
                                    fontFamily: "inherit",
                                    boxShadow: "0 4px 16px rgba(37,99,235,0.35)",
                                    transition: "all 0.2s",
                                    letterSpacing: "-0.01em",
                                }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = "translateY(-1px)";
                                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(37,99,235,0.5)";
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.boxShadow = "0 4px 16px rgba(37,99,235,0.35)";
                                    }}
                                >
                                    <Phone style={{ width: "0.9rem", height: "0.9rem" }} />
                                    Hemen Sizi Arayalım →
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* ── RIGHT — Scanner Mockup ── */}
                <div style={{
                    position: "relative",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "2rem 5rem",
                    animation: "slideInRight 0.8s 0.2s cubic-bezier(0.22,1,0.36,1) both",
                }}>

                    {/* Stat card — sol üst */}
                    <div style={{
                        position: "absolute", top: "-3%", left: "-1",
                        background: "rgba(3,7,18,0.88)",
                        border: `1px solid ${stats[0].color}33`,
                        borderRadius: "0.875rem",
                        padding: "0.75rem 1rem",
                        backdropFilter: "blur(16px)",
                        display: "flex", alignItems: "center", gap: "0.625rem",
                        boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px ${stats[0].color}22 inset`,
                        animation: "fadeUp 0.6s 0.5s cubic-bezier(0.22,1,0.36,1) both",
                        whiteSpace: "nowrap", zIndex: 10,
                    }} className="float-card-1">
                        <div style={{
                            width: "2rem", height: "2rem", borderRadius: "0.5rem",
                            background: stats[0].bg, border: `1px solid ${stats[0].color}33`,
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                            <TrendingUp style={{ width: "0.875rem", height: "0.875rem", color: stats[0].color }} />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: "0.62rem", color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>{stats[0].label}</p>
                            <p style={{ margin: 0, fontSize: "0.9rem", color: "white", fontWeight: 700 }}>{stats[0].value}</p>
                        </div>
                    </div>

                    {/* Stat card — sağ orta */}
                    <div style={{
                        position: "absolute", top: "38%", right: 0,
                        background: "rgba(3,7,18,0.88)",
                        border: `1px solid ${stats[1].color}33`,
                        borderRadius: "0.875rem",
                        padding: "0.75rem 1rem",
                        backdropFilter: "blur(16px)",
                        display: "flex", alignItems: "center", gap: "0.625rem",
                        boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px ${stats[1].color}22 inset`,
                        animation: "fadeUp 0.6s 0.7s cubic-bezier(0.22,1,0.36,1) both",
                        whiteSpace: "nowrap", zIndex: 10,
                    }} className="float-card-2">
                        <div style={{
                            width: "2rem", height: "2rem", borderRadius: "0.5rem",
                            background: stats[1].bg, border: `1px solid ${stats[1].color}33`,
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                            <ShoppingCart style={{ width: "0.875rem", height: "0.875rem", color: stats[1].color }} />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: "0.62rem", color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>{stats[1].label}</p>
                            <p style={{ margin: 0, fontSize: "0.9rem", color: "white", fontWeight: 700 }}>{stats[1].value}</p>
                        </div>
                    </div>

                    {/* Stat card — sol alt */}
                    <div style={{
                        position: "absolute", bottom: "-2%", left: "10%",
                        background: "rgba(3,7,18,0.88)",
                        border: `1px solid ${stats[2].color}33`,
                        borderRadius: "0.875rem",
                        padding: "0.75rem 1rem",
                        backdropFilter: "blur(16px)",
                        display: "flex", alignItems: "center", gap: "0.625rem",
                        boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px ${stats[2].color}22 inset`,
                        animation: "fadeUp 0.6s 0.9s cubic-bezier(0.22,1,0.36,1) both",
                        whiteSpace: "nowrap", zIndex: 10,
                    }} className="float-card-3">
                        <div style={{
                            width: "2rem", height: "2rem", borderRadius: "0.5rem",
                            background: stats[2].bg, border: `1px solid ${stats[2].color}33`,
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                            <Clock style={{ width: "0.875rem", height: "0.875rem", color: stats[2].color }} />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: "0.62rem", color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>{stats[2].label}</p>
                            <p style={{ margin: 0, fontSize: "0.9rem", color: "white", fontWeight: 700 }}>{stats[2].value}</p>
                        </div>
                    </div>

                    {/* Main card */}
                    <div style={{
                        background: "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "2rem",
                        padding: "2.25rem",
                        backdropFilter: "blur(24px)",
                        boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.06) inset",
                        width: "100%",
                        maxWidth: "480px",
                        position: "relative",
                        overflow: "hidden",
                    }}>
                        {/* Inner glow top */}
                        <div style={{
                            position: "absolute", top: 0, left: "20%", right: "20%", height: "1px",
                            background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent)",
                        }} />

                        {/* Header */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                                <div style={{
                                    width: "2.25rem", height: "2.25rem",
                                    background: "linear-gradient(135deg, rgba(37,99,235,0.2), rgba(59,130,246,0.1))",
                                    border: "1px solid rgba(59,130,246,0.25)",
                                    borderRadius: "0.625rem",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <Scan style={{ width: "1.1rem", height: "1.1rem", color: "#60a5fa" }} />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>JetPOS</p>
                                    <p style={{ margin: 0, fontSize: "0.875rem", color: "white", fontWeight: 700 }}>Barkod Okuyucu</p>
                                </div>
                            </div>
                            {/* Live indicator */}
                            <div style={{
                                display: "flex", alignItems: "center", gap: "0.375rem",
                                background: "rgba(16,185,129,0.1)",
                                border: "1px solid rgba(16,185,129,0.2)",
                                borderRadius: "9999px",
                                padding: "0.25rem 0.625rem",
                            }}>
                                <div style={{
                                    width: "0.4rem", height: "0.4rem", borderRadius: "50%",
                                    background: "#10b981",
                                    boxShadow: "0 0 6px #10b981",
                                    animation: "pulse 2s infinite",
                                }} />
                                <span style={{ fontSize: "0.7rem", color: "#10b981", fontWeight: 600 }}>Canlı</span>
                            </div>
                        </div>

                        {/* Image area */}
                        <div style={{
                            borderRadius: "1.25rem",
                            overflow: "hidden",
                            background: "radial-gradient(ellipse at center, rgba(37,99,235,0.12) 0%, rgba(0,0,0,0.4) 70%)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            minHeight: "240px",
                            position: "relative",
                            border: "1px solid rgba(255,255,255,0.05)",
                        }}>
                            {/* Scan line animation */}
                            <div style={{
                                position: "absolute", left: "10%", right: "10%", height: "2px",
                                background: "linear-gradient(90deg, transparent, #3b82f6, transparent)",
                                boxShadow: "0 0 12px #3b82f6",
                                animation: "scanLine 2.5s ease-in-out infinite",
                                zIndex: 2,
                            }} />
                            <Image
                                src="/scannerhero.png"
                                alt="Barkod Okuyucu"
                                width={420}
                                height={300}
                                style={{
                                    objectFit: "contain",
                                    maxHeight: "300px",
                                    width: "auto",
                                    filter: "drop-shadow(0 12px 32px rgba(37,99,235,0.35))",
                                    position: "relative", zIndex: 1,
                                }}
                            />
                        </div>

                        {/* Bottom buttons */}
                        <div style={{ display: "flex", justifyContent: "center", gap: "0.625rem", marginTop: "1.25rem" }}>
                            <button style={{
                                padding: "0.625rem 1.25rem",
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: "0.75rem",
                                color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", fontWeight: 600,
                                cursor: "pointer", fontFamily: "inherit",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem",
                                transition: "all 0.2s",
                            }}
                                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                            >
                                <Scan style={{ width: "0.8rem", height: "0.8rem" }} />
                                Önizleme
                            </button>
                            <button style={{
                                padding: "0.625rem 1.25rem",
                                background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
                                border: "none",
                                borderRadius: "0.75rem",
                                color: "white", fontSize: "0.8rem", fontWeight: 700,
                                cursor: "pointer", fontFamily: "inherit",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem",
                                boxShadow: "0 4px 12px rgba(37,99,235,0.4)",
                                transition: "all 0.2s",
                            }}
                                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 6px 20px rgba(37,99,235,0.6)")}
                                onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(37,99,235,0.4)")}
                            >
                                <Scan style={{ width: "0.8rem", height: "0.8rem" }} />
                                Barkod Okut
                            </button>
                        </div>


                    </div>

                </div>
            </div>

            <style>{`
                @keyframes slideInLeft {
                    from { opacity: 0; transform: translateX(-20px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(20px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes floatOrb {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-18px); }
                }
                @keyframes floatCard {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-5px); }
                }
                @keyframes floatCard2 {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-7px); }
                }
                @keyframes floatCard3 {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-4px); }
                }
                .float-card-1 {
                    animation: fadeUp 0.6s 0.5s cubic-bezier(0.22,1,0.36,1) both,
                               floatCard 6s 1.1s ease-in-out infinite;
                }
                .float-card-2 {
                    animation: fadeUp 0.6s 0.7s cubic-bezier(0.22,1,0.36,1) both,
                               floatCard2 7s 1.3s ease-in-out infinite;
                }
                .float-card-3 {
                    animation: fadeUp 0.6s 0.9s cubic-bezier(0.22,1,0.36,1) both,
                               floatCard3 8s 1.5s ease-in-out infinite;
                }
                @keyframes shimmer {
                    0% { background-position: 0% center; }
                    100% { background-position: 200% center; }
                }
                @keyframes scanLine {
                    0%   { top: 12%; opacity: 0; }
                    10%  { opacity: 0.6; }
                    90%  { opacity: 0.6; }
                    100% { top: 88%; opacity: 0; }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
                @media (max-width: 960px) {
                    .hero-grid {
                        grid-template-columns: 1fr !important;
                        gap: 3rem !important;
                    }
                    .form-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </section>
    );
}
