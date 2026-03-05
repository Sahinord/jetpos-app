"use client";

import { useState, useEffect } from "react";
import { X, Zap, Phone, User, ArrowRight, CheckCircle, Gift } from "lucide-react";

export default function LeadPopup() {
    const [visible, setVisible] = useState(false);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [focused, setFocused] = useState<string | null>(null);
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        // Daha önce gösterildiyse tekrar gösterme
        const shown = sessionStorage.getItem("jetpos-popup-shown");
        if (shown) return;

        // 1) 10 saniye sonra göster
        const timer = setTimeout(() => {
            setVisible(true);
            sessionStorage.setItem("jetpos-popup-shown", "1");
        }, 10000);

        // 2) Exit intent — mouse sayfayı terk edince göster
        const handleMouseLeave = (e: MouseEvent) => {
            if (e.clientY <= 0 && !sessionStorage.getItem("jetpos-popup-shown")) {
                clearTimeout(timer);
                setVisible(true);
                sessionStorage.setItem("jetpos-popup-shown", "1");
            }
        };

        document.addEventListener("mouseleave", handleMouseLeave);
        return () => {
            clearTimeout(timer);
            document.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, []);

    const close = () => {
        setClosing(true);
        setTimeout(() => { setVisible(false); setClosing(false); }, 350);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && phone) setSubmitted(true);
    };

    if (!visible) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={close}
                style={{
                    position: "fixed", inset: 0,
                    background: "rgba(0,0,0,0.65)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    zIndex: 1000,
                    animation: closing ? "fadeOut 0.35s ease forwards" : "fadeIn 0.35s ease both",
                }}
            />

            {/* Popup */}
            <div style={{
                position: "fixed",
                top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 1001,
                width: "100%",
                maxWidth: "520px",
                padding: "1rem",
                animation: closing ? "popOut 0.35s cubic-bezier(0.4,0,1,1) forwards" : "popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
            }}>
                <div style={{
                    background: "linear-gradient(145deg, rgba(4,12,30,0.98), rgba(10,22,50,0.98))",
                    backdropFilter: "blur(24px)",
                    border: "1px solid rgba(59,130,246,0.25)",
                    borderRadius: "2rem",
                    overflow: "hidden",
                    boxShadow: "0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(59,130,246,0.08) inset, 0 0 80px rgba(37,99,235,0.15)",
                    position: "relative",
                }}>
                    {/* Animated top gradient line */}
                    <div style={{
                        height: "3px",
                        background: "linear-gradient(90deg, #2563eb, #7c3aed, #06b6d4, #2563eb)",
                        backgroundSize: "300% 100%",
                        animation: "rainbowFlow 3s linear infinite",
                    }} />

                    {/* BG glow orb */}
                    <div style={{
                        position: "absolute", top: "-60px", right: "-60px",
                        width: "240px", height: "240px",
                        background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)",
                        pointerEvents: "none",
                    }} />
                    <div style={{
                        position: "absolute", bottom: "-40px", left: "-40px",
                        width: "200px", height: "200px",
                        background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)",
                        pointerEvents: "none",
                    }} />

                    {/* Close button */}
                    <button
                        onClick={close}
                        style={{
                            position: "absolute", top: "1.25rem", right: "1.25rem",
                            width: "2rem", height: "2rem",
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "rgba(255,255,255,0.5)",
                            cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.2s",
                            zIndex: 2,
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                            e.currentTarget.style.color = "white";
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                            e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                        }}
                        aria-label="Kapat"
                    >
                        <X style={{ width: "0.875rem", height: "0.875rem" }} />
                    </button>

                    <div style={{ padding: "2rem 2rem 2.25rem", position: "relative", zIndex: 1 }}>
                        {submitted ? (
                            /* ── SUCCESS STATE ── */
                            <div style={{
                                textAlign: "center", padding: "1rem 0",
                                animation: "fadeIn 0.4s ease both",
                            }}>
                                <div style={{
                                    width: "5rem", height: "5rem",
                                    background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))",
                                    border: "1px solid rgba(16,185,129,0.3)",
                                    borderRadius: "50%",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    margin: "0 auto 1.5rem",
                                    boxShadow: "0 0 40px rgba(16,185,129,0.2)",
                                    animation: "successPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
                                }}>
                                    <CheckCircle style={{ width: "2.25rem", height: "2.25rem", color: "#10b981" }} />
                                </div>
                                <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "white", margin: "0 0 0.75rem", letterSpacing: "-0.02em" }}>
                                    Talebiniz Alındı! 🎉
                                </h3>
                                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.95rem", lineHeight: 1.6, margin: "0 0 1.75rem" }}>
                                    Ekibimiz <strong style={{ color: "#60a5fa" }}>en kısa sürede</strong> sizi arayacak.<br />
                                    Ortalama yanıt süremiz <strong style={{ color: "#60a5fa" }}>2 saatten az!</strong>
                                </p>
                                <button
                                    onClick={close}
                                    style={{
                                        padding: "0.75rem 2rem",
                                        background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                                        color: "white", fontWeight: 700, fontSize: "0.95rem",
                                        border: "none", borderRadius: "0.875rem", cursor: "pointer",
                                        fontFamily: "inherit",
                                        boxShadow: "0 4px 16px rgba(37,99,235,0.4)",
                                    }}
                                >
                                    Tamam, Harika!
                                </button>
                            </div>
                        ) : (
                            /* ── FORM STATE ── */
                            <>
                                {/* Header */}
                                <div style={{ marginBottom: "1.75rem" }}>
                                    {/* Promo badge */}
                                    <div style={{
                                        display: "inline-flex", alignItems: "center", gap: "0.5rem",
                                        background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))",
                                        border: "1px solid rgba(245,158,11,0.3)",
                                        borderRadius: "9999px",
                                        padding: "0.3rem 0.875rem",
                                        marginBottom: "1rem",
                                        animation: "badgePulse 3s ease-in-out infinite",
                                    }}>
                                        <Gift style={{ width: "0.75rem", height: "0.75rem", color: "#f59e0b" }} />
                                        <span style={{ fontSize: "0.75rem", color: "#fbbf24", fontWeight: 700, letterSpacing: "0.04em" }}>
                                            RAMAZAN ÖZEL — %30 İNDİRİM
                                        </span>
                                    </div>

                                    <h2 style={{
                                        fontSize: "1.625rem",
                                        fontWeight: 900,
                                        color: "white",
                                        margin: "0 0 0.5rem",
                                        lineHeight: 1.2,
                                        letterSpacing: "-0.03em",
                                    }}>
                                        Ücretsiz Demo &{" "}
                                        <span style={{
                                            background: "linear-gradient(135deg, #60a5fa, #a78bfa)",
                                            WebkitBackgroundClip: "text",
                                            WebkitTextFillColor: "transparent",
                                        }}>
                                            Özel Teklif Al
                                        </span>
                                    </h2>
                                    <p style={{ margin: 0, fontSize: "0.875rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
                                        Formu doldurun, uzmanımız sizi arasın. <strong style={{ color: "rgba(255,255,255,0.7)" }}>5 dakikada kurulum</strong>, kredi kartı gerekmez.
                                    </p>
                                </div>

                                {/* Benefits row */}
                                <div style={{
                                    display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap",
                                }}>
                                    {[
                                        { icon: "⚡", text: "Hızlı kurulum" },
                                        { icon: "🎯", text: "14 gün ücretsiz" },
                                        { icon: "📱", text: "Mobil destekli" },
                                    ].map((b, i) => (
                                        <div key={i} style={{
                                            display: "flex", alignItems: "center", gap: "0.35rem",
                                            background: "rgba(255,255,255,0.04)",
                                            border: "1px solid rgba(255,255,255,0.07)",
                                            borderRadius: "9999px",
                                            padding: "0.3rem 0.75rem",
                                        }}>
                                            <span style={{ fontSize: "0.75rem" }}>{b.icon}</span>
                                            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{b.text}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Form */}
                                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                    {[
                                        { id: "popup-name", icon: User, placeholder: "Adınız Soyadınız *", value: name, onChange: setName, type: "text" },
                                        { id: "popup-phone", icon: Phone, placeholder: "Telefon Numaranız *", value: phone, onChange: setPhone, type: "tel" },
                                    ].map(({ id, icon: Icon, placeholder, value, onChange, type }) => (
                                        <div key={id} style={{
                                            display: "flex", alignItems: "center", gap: "0.75rem",
                                            background: focused === id ? "rgba(59,130,246,0.07)" : "rgba(255,255,255,0.04)",
                                            border: `1px solid ${focused === id ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.1)"}`,
                                            borderRadius: "0.875rem",
                                            padding: "0.75rem 1rem",
                                            transition: "all 0.25s",
                                        }}>
                                            <Icon style={{
                                                width: "1rem", height: "1rem",
                                                color: focused === id ? "#60a5fa" : "rgba(255,255,255,0.3)",
                                                flexShrink: 0, transition: "color 0.25s",
                                            }} />
                                            <input
                                                id={id}
                                                type={type}
                                                placeholder={placeholder}
                                                value={value}
                                                onChange={e => onChange(e.target.value)}
                                                onFocus={() => setFocused(id)}
                                                onBlur={() => setFocused(null)}
                                                required
                                                style={{
                                                    background: "none", border: "none", outline: "none",
                                                    color: "white", fontSize: "0.9rem", width: "100%",
                                                    fontFamily: "inherit",
                                                }}
                                            />
                                        </div>
                                    ))}

                                    <button type="submit" style={{
                                        width: "100%",
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                                        padding: "0.9rem",
                                        background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                                        color: "white", fontWeight: 800, fontSize: "0.95rem",
                                        border: "none", borderRadius: "0.875rem", cursor: "pointer",
                                        fontFamily: "inherit",
                                        boxShadow: "0 6px 20px rgba(37,99,235,0.45)",
                                        transition: "all 0.25s",
                                        letterSpacing: "-0.01em",
                                        marginTop: "0.25rem",
                                    }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.transform = "translateY(-2px)";
                                            e.currentTarget.style.boxShadow = "0 10px 30px rgba(37,99,235,0.6)";
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.transform = "translateY(0)";
                                            e.currentTarget.style.boxShadow = "0 6px 20px rgba(37,99,235,0.45)";
                                        }}
                                    >
                                        <Zap style={{ width: "1rem", height: "1rem", fill: "white" }} />
                                        Hemen Teklif Al — Ücretsiz!
                                        <ArrowRight style={{ width: "1rem", height: "1rem" }} />
                                    </button>

                                    <p style={{ margin: 0, textAlign: "center", fontSize: "0.72rem", color: "rgba(255,255,255,0.25)" }}>
                                        🔒 Bilgileriniz güvende — spam göndermiyoruz
                                    </p>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
                @keyframes popIn {
                    from { opacity: 0; transform: translate(-50%, -48%) scale(0.88); }
                    to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
                @keyframes popOut {
                    from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    to   { opacity: 0; transform: translate(-50%, -52%) scale(0.88); }
                }
                @keyframes successPop {
                    from { opacity: 0; transform: scale(0.5); }
                    to   { opacity: 1; transform: scale(1); }
                }
                @keyframes rainbowFlow {
                    0%   { background-position: 0% 50%; }
                    100% { background-position: 300% 50%; }
                }
                @keyframes badgePulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
                    50%      { box-shadow: 0 0 0 4px rgba(245,158,11,0.12); }
                }
            `}</style>
        </>
    );
}
