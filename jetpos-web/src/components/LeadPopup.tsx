"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { X, Zap, Phone, User, ArrowRight, CheckCircle, Star, Clock, Store } from "lucide-react";

// Kampanya rozetini buradan güncelleyin
const CAMPAIGN_LABEL = "YAZ KAMPANYASI — %30 İNDİRİM";

const STATS = [
    { icon: Zap, big: "5 dk", small: "kurulum süresi" },
    { icon: Store, big: "500+", small: "aktif işletme" },
    { icon: Clock, big: "< 2 sa", small: "ortalama yanıt" },
];

const CONFETTI = [
    { left: "8%", delay: "0s", color: "#7886C7", size: 7 },
    { left: "18%", delay: "0.15s", color: "#f59e0b", size: 5 },
    { left: "28%", delay: "0.05s", color: "#22c55e", size: 6 },
    { left: "38%", delay: "0.25s", color: "#8b5cf6", size: 5 },
    { left: "48%", delay: "0.1s", color: "#06b6d4", size: 7 },
    { left: "58%", delay: "0.3s", color: "#7886C7", size: 5 },
    { left: "68%", delay: "0.08s", color: "#f59e0b", size: 6 },
    { left: "78%", delay: "0.2s", color: "#22c55e", size: 5 },
    { left: "88%", delay: "0.12s", color: "#8b5cf6", size: 7 },
];

export default function LeadPopup() {
    const [visible, setVisible] = useState(false);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !phone) return;
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/demo-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    phone,
                    source: "popup",
                    kvkk_acknowledged: true,
                    marketing_consent: false,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Bir hata oluştu.");
            setSubmitted(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Bir hata oluştu. Lütfen tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    };

    if (!visible) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={close}
                style={{
                    position: "fixed", inset: 0,
                    background: "rgba(17,24,39,0.5)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
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
                maxWidth: "780px",
                padding: "1rem",
                animation: closing ? "popOut 0.35s cubic-bezier(0.4,0,1,1) forwards" : "popIn 0.55s cubic-bezier(0.34,1.56,0.64,1) both",
            }}>
                {/* Akışkan gradient çerçeve */}
                <div style={{
                    padding: "1.5px",
                    borderRadius: "1.75rem",
                    backgroundImage: "linear-gradient(120deg, #7886C7, #8b5cf6, #06b6d4, #7886C7)",
                    backgroundSize: "300% 300%",
                    animation: "auraFlow 6s ease infinite",
                    boxShadow: "0 32px 80px rgba(17,24,39,0.3), 0 0 70px rgba(120, 134, 199, 0.3)",
                }}>
                    <div style={{
                        background: "#ffffff",
                        borderRadius: "calc(1.75rem - 1.5px)",
                        overflow: "hidden",
                        position: "relative",
                    }}>
                        {/* Kapat */}
                        <button
                            onClick={close}
                            style={{
                                position: "absolute", top: "1.1rem", right: "1.1rem",
                                width: "2rem", height: "2rem",
                                borderRadius: "50%",
                                background: "rgba(17,24,39,0.05)",
                                border: "1px solid rgba(17,24,39,0.1)",
                                color: "rgba(17,24,39,0.55)",
                                cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all 0.2s",
                                zIndex: 5,
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = "rgba(17,24,39,0.1)";
                                e.currentTarget.style.color = "#111827";
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = "rgba(17,24,39,0.05)";
                                e.currentTarget.style.color = "rgba(17,24,39,0.55)";
                            }}
                            aria-label="Kapat"
                        >
                            <X style={{ width: "0.875rem", height: "0.875rem" }} />
                        </button>

                        <div className="lead-grid">
                            {/* ── SOL PANEL: marka + istatistik ── */}
                            <aside className="lead-aside" style={{
                                position: "relative",
                                backgroundImage: "linear-gradient(160deg, #262f55 0%, #3d4877 45%, #5A659F 100%)",
                                padding: "2rem 1.6rem",
                                display: "flex", flexDirection: "column", justifyContent: "space-between",
                                overflow: "hidden",
                            }}>
                                {/* Dekor: nokta ızgarası + parlayan daireler */}
                                <div style={{
                                    position: "absolute", inset: 0,
                                    backgroundImage: "radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px)",
                                    backgroundSize: "18px 18px",
                                    maskImage: "linear-gradient(180deg, rgba(0,0,0,0.5), transparent 60%)",
                                    WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,0.5), transparent 60%)",
                                    pointerEvents: "none",
                                }} />
                                <div style={{
                                    position: "absolute", bottom: "-70px", right: "-70px",
                                    width: "230px", height: "230px", borderRadius: "50%",
                                    backgroundImage: "radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)",
                                    pointerEvents: "none",
                                }} />

                                <div style={{ position: "relative" }}>
                                    {/* Wordmark */}
                                    <p style={{ margin: "0 0 1.4rem", fontSize: "1.15rem", fontWeight: 900, color: "white", letterSpacing: "-0.02em" }}>
                                        Jet<span style={{ color: "#B0BAE6" }}>POS</span>
                                    </p>
                                    <p style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "white", lineHeight: 1.45, letterSpacing: "-0.01em" }}>
                                        Satış, stok ve e-fatura{" "}
                                        <span style={{ color: "#B0BAE6" }}>tek ekranda.</span>
                                    </p>
                                </div>

                                {/* İstatistik kartları */}
                                <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "1.6rem" }}>
                                    {STATS.map(({ icon: Icon, big, small }, i) => (
                                        <div key={i} style={{
                                            display: "flex", alignItems: "center", gap: "0.7rem",
                                            background: "rgba(255,255,255,0.09)",
                                            border: "1px solid rgba(255,255,255,0.16)",
                                            backdropFilter: "blur(8px)",
                                            borderRadius: "0.9rem",
                                            padding: "0.65rem 0.85rem",
                                            animation: `slideUp 0.5s ease ${0.15 + i * 0.12}s both`,
                                        }}>
                                            <div style={{
                                                width: "2rem", height: "2rem", borderRadius: "0.6rem", flexShrink: 0,
                                                background: "rgba(255,255,255,0.12)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                            }}>
                                                <Icon style={{ width: "0.95rem", height: "0.95rem", color: "#D9E0FF" }} />
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "white", lineHeight: 1.2 }}>{big}</p>
                                                <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.6)" }}>{small}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </aside>

                            {/* ── SAĞ PANEL: form / başarı ── */}
                            <section style={{ position: "relative", padding: "2rem 2rem 1.75rem", background: "#ffffff" }}>
                                {submitted ? (
                                    /* ── BAŞARI EKRANI ── */
                                    <div style={{
                                        textAlign: "center", padding: "1.5rem 0",
                                        animation: "fadeIn 0.4s ease both",
                                        position: "relative",
                                    }}>
                                        {/* Konfeti */}
                                        {CONFETTI.map((c, i) => (
                                            <span key={i} style={{
                                                position: "absolute", top: "-0.5rem", left: c.left,
                                                width: c.size, height: c.size * 1.6,
                                                background: c.color, borderRadius: "2px",
                                                animation: `confettiFall 1.6s ease-in ${c.delay} both`,
                                                pointerEvents: "none",
                                            }} />
                                        ))}
                                        <div style={{
                                            width: "5rem", height: "5rem",
                                            background: "rgba(16,185,129,0.1)",
                                            border: "1px solid rgba(16,185,129,0.3)",
                                            borderRadius: "50%",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            margin: "0 auto 1.5rem",
                                            boxShadow: "0 0 40px rgba(16,185,129,0.15)",
                                            animation: "successPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
                                        }}>
                                            <CheckCircle style={{ width: "2.25rem", height: "2.25rem", color: "#059669" }} />
                                        </div>
                                        <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111827", margin: "0 0 0.75rem", letterSpacing: "-0.02em" }}>
                                            Talebiniz Alındı! 🎉
                                        </h3>
                                        <p style={{ color: "rgba(17,24,39,0.6)", fontSize: "0.95rem", lineHeight: 1.6, margin: "0 0 1.75rem" }}>
                                            Ekibimiz <strong style={{ color: "#5A659F" }}>en kısa sürede</strong> sizi arayacak.<br />
                                            Ortalama yanıt süremiz <strong style={{ color: "#5A659F" }}>2 saatten az!</strong>
                                        </p>
                                        <button
                                            onClick={close}
                                            style={{
                                                padding: "0.75rem 2rem",
                                                backgroundImage: "linear-gradient(135deg, #5A659F, #7886C7)",
                                                color: "white", fontWeight: 700, fontSize: "0.95rem",
                                                border: "none", borderRadius: "0.875rem", cursor: "pointer",
                                                fontFamily: "inherit",
                                                boxShadow: "0 4px 16px rgba(120, 134, 199, 0.4)",
                                            }}
                                        >
                                            Tamam, Harika!
                                        </button>
                                    </div>
                                ) : (
                                    /* ── FORM EKRANI ── */
                                    <>
                                        {/* Kampanya rozeti — shimmer */}
                                        <div style={{
                                            display: "inline-flex", alignItems: "center", gap: "0.45rem",
                                            backgroundImage: "linear-gradient(110deg, #5A659F 0%, #7886C7 40%, #A5B1E4 50%, #7886C7 60%, #5A659F 100%)",
                                            backgroundSize: "220% 100%",
                                            animation: "shimmer 3.5s linear infinite",
                                            borderRadius: "9999px",
                                            padding: "0.35rem 0.95rem",
                                            marginBottom: "1rem",
                                            boxShadow: "0 4px 14px rgba(120, 134, 199, 0.35)",
                                        }}>
                                            <Zap style={{ width: "0.75rem", height: "0.75rem", color: "white", fill: "white" }} />
                                            <span style={{ fontSize: "0.72rem", color: "white", fontWeight: 800, letterSpacing: "0.06em" }}>
                                                {CAMPAIGN_LABEL}
                                            </span>
                                        </div>

                                        <h2 style={{
                                            fontSize: "1.55rem",
                                            fontWeight: 900,
                                            color: "#111827",
                                            margin: "0 0 0.5rem",
                                            lineHeight: 1.2,
                                            letterSpacing: "-0.03em",
                                        }}>
                                            Ücretsiz Demo &{" "}
                                            <span style={{
                                                backgroundImage: "linear-gradient(135deg, #5A659F, #7886C7)",
                                                WebkitBackgroundClip: "text",
                                                WebkitTextFillColor: "transparent",
                                            }}>
                                                Özel Teklif Al
                                            </span>
                                        </h2>
                                        <p style={{ margin: "0 0 1.4rem", fontSize: "0.875rem", color: "rgba(17,24,39,0.6)", lineHeight: 1.6 }}>
                                            Formu doldurun, uzmanımız sizi arasın. <strong style={{ color: "#111827" }}>Kredi kartı gerekmez.</strong>
                                        </p>

                                        {/* Form */}
                                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                            {[
                                                { id: "popup-name", icon: User, placeholder: "Adınız Soyadınız *", value: name, onChange: setName, type: "text" },
                                                { id: "popup-phone", icon: Phone, placeholder: "Telefon Numaranız *", value: phone, onChange: setPhone, type: "tel" },
                                            ].map(({ id, icon: Icon, placeholder, value, onChange, type }) => (
                                                <div key={id} style={{
                                                    display: "flex", alignItems: "center", gap: "0.75rem",
                                                    background: focused === id ? "#ffffff" : "rgba(17,24,39,0.04)",
                                                    border: `1px solid ${focused === id ? "rgba(120, 134, 199, 0.6)" : "rgba(17,24,39,0.1)"}`,
                                                    boxShadow: focused === id ? "0 0 0 4px rgba(120, 134, 199, 0.15)" : "none",
                                                    borderRadius: "0.875rem",
                                                    padding: "0.75rem 1rem",
                                                    transition: "all 0.25s",
                                                }}>
                                                    <Icon style={{
                                                        width: "1rem", height: "1rem",
                                                        color: focused === id ? "#5A659F" : "rgba(17,24,39,0.35)",
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
                                                        className="lead-input"
                                                        style={{
                                                            background: "none", border: "none", outline: "none",
                                                            color: "#111827", fontSize: "0.9rem", width: "100%",
                                                            fontFamily: "inherit",
                                                        }}
                                                    />
                                                </div>
                                            ))}

                                            {error && (
                                                <div style={{
                                                    background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.25)",
                                                    borderRadius: "0.75rem", padding: "0.7rem 0.9rem",
                                                    color: "#dc2626", fontSize: "0.8rem",
                                                }}>
                                                    {error}
                                                </div>
                                            )}

                                            <button type="submit" disabled={loading} style={{
                                                width: "100%",
                                                position: "relative", overflow: "hidden",
                                                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                                                padding: "0.9rem",
                                                background: loading ? "rgba(17,24,39,0.08)" : "linear-gradient(135deg, #5A659F, #7886C7)",
                                                color: loading ? "rgba(17,24,39,0.4)" : "white",
                                                fontWeight: 800, fontSize: "0.95rem",
                                                border: "none", borderRadius: "0.875rem",
                                                cursor: loading ? "not-allowed" : "pointer",
                                                fontFamily: "inherit",
                                                boxShadow: loading ? "none" : "0 6px 20px rgba(120, 134, 199, 0.45)",
                                                transition: "all 0.25s",
                                                letterSpacing: "-0.01em",
                                                marginTop: "0.25rem",
                                            }}
                                                onMouseEnter={e => {
                                                    if (loading) return;
                                                    e.currentTarget.style.transform = "translateY(-2px)";
                                                    e.currentTarget.style.boxShadow = "0 10px 30px rgba(120, 134, 199, 0.6)";
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.transform = "translateY(0)";
                                                    e.currentTarget.style.boxShadow = loading ? "none" : "0 6px 20px rgba(120, 134, 199, 0.45)";
                                                }}
                                            >
                                                {/* Parlama süpürmesi */}
                                                {!loading && (
                                                    <span style={{
                                                        position: "absolute", top: 0, left: "-80%",
                                                        width: "50%", height: "100%",
                                                        backgroundImage: "linear-gradient(105deg, transparent, rgba(255,255,255,0.35), transparent)",
                                                        animation: "shine 3s ease-in-out infinite",
                                                        pointerEvents: "none",
                                                    }} />
                                                )}
                                                {loading ? (
                                                    <>
                                                        <span style={{
                                                            width: "1rem", height: "1rem",
                                                            border: "2px solid rgba(17,24,39,0.2)", borderTopColor: "rgba(17,24,39,0.6)",
                                                            borderRadius: "50%", display: "inline-block",
                                                            animation: "spinLoad 0.8s linear infinite",
                                                        }} />
                                                        Gönderiliyor...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Zap style={{ width: "1rem", height: "1rem", fill: "white" }} />
                                                        Hemen Teklif Al — Ücretsiz!
                                                        <ArrowRight style={{ width: "1rem", height: "1rem" }} />
                                                    </>
                                                )}
                                            </button>

                                            {/* Sosyal kanıt */}
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", marginTop: "0.25rem" }}>
                                                <span style={{ display: "flex", gap: "0.1rem" }}>
                                                    {[0, 1, 2, 3, 4].map(i => (
                                                        <Star key={i} style={{ width: "0.75rem", height: "0.75rem", color: "#f59e0b", fill: "#f59e0b" }} />
                                                    ))}
                                                </span>
                                                <span style={{ fontSize: "0.75rem", color: "rgba(17,24,39,0.55)", fontWeight: 600 }}>
                                                    {`500+ işletme JetPOS'a güveniyor`}
                                                </span>
                                            </div>

                                            <p style={{ margin: 0, textAlign: "center", fontSize: "0.7rem", color: "rgba(17,24,39,0.45)", lineHeight: 1.5 }}>
                                                {`🔒 Spam yok. Gönderdiğinizde `}
                                                <Link href="/gizlilik" target="_blank" style={{ color: "#5A659F", textDecoration: "underline" }}>
                                                    Gizlilik &amp; KVKK Politikası
                                                </Link>
                                                {`'nı okuduğunuzu kabul etmiş olursunuz.`}
                                            </p>
                                        </form>
                                    </>
                                )}
                            </section>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .lead-grid {
                    display: grid;
                    grid-template-columns: 250px 1fr;
                }
                @media (max-width: 680px) {
                    .lead-grid { grid-template-columns: 1fr; }
                    .lead-aside { display: none !important; }
                }
                .lead-input::placeholder { color: rgba(17,24,39,0.4); }

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
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(14px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes auraFlow {
                    0%   { background-position: 0% 50%; }
                    50%  { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes shimmer {
                    0%   { background-position: 110% 50%; }
                    100% { background-position: -110% 50%; }
                }
                @keyframes shine {
                    0%, 60% { left: -80%; }
                    100%    { left: 130%; }
                }
                @keyframes spinLoad {
                    to { transform: rotate(360deg); }
                }
                @keyframes confettiFall {
                    0%   { opacity: 1; transform: translateY(0) rotate(0deg); }
                    100% { opacity: 0; transform: translateY(240px) rotate(320deg); }
                }
            `}</style>
        </>
    );
}
