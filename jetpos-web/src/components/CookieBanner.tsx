"use client";

import { useState, useEffect } from "react";
import { Shield, Settings, X, Check } from "lucide-react";
import Link from "next/link";

export default function CookieBanner() {
    const [visible, setVisible] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [analytics, setAnalytics] = useState(true);
    const [marketing, setMarketing] = useState(false);

    useEffect(() => {
        // Daha önce karar verilmişse gösterme
        const consent = localStorage.getItem("jetpos-cookie-consent");
        if (!consent) {
            // 1.5 saniye sonra göster (sayfanın yüklenmesini bekle)
            const t = setTimeout(() => setVisible(true), 1500);
            return () => clearTimeout(t);
        }
    }, []);

    const acceptAll = () => {
        localStorage.setItem("jetpos-cookie-consent", JSON.stringify({
            necessary: true,
            analytics: true,
            marketing: true,
            timestamp: new Date().toISOString(),
        }));
        setVisible(false);
    };

    const acceptSelected = () => {
        localStorage.setItem("jetpos-cookie-consent", JSON.stringify({
            necessary: true,
            analytics,
            marketing,
            timestamp: new Date().toISOString(),
        }));
        setVisible(false);
    };

    const rejectAll = () => {
        localStorage.setItem("jetpos-cookie-consent", JSON.stringify({
            necessary: true,
            analytics: false,
            marketing: false,
            timestamp: new Date().toISOString(),
        }));
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <>
            {/* Backdrop (sadece detay açıkken) */}
            {showDetails && (
                <div
                    onClick={() => setShowDetails(false)}
                    style={{
                        position: "fixed", inset: 0,
                        background: "rgba(0,0,0,0.5)",
                        backdropFilter: "blur(4px)",
                        zIndex: 998,
                    }}
                />
            )}

            {/* Banner */}
            <div style={{
                position: "fixed",
                bottom: "1.5rem",
                left: "1.5rem",
                right: "1.5rem",
                zIndex: 999,
                maxWidth: "560px",
                margin: "0 auto",
                animation: "cookieSlideUp 0.5s cubic-bezier(0.22,1,0.36,1) both",
            }}>
                <div style={{
                    background: "rgba(4,12,30,0.97)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    border: "1px solid rgba(59,130,246,0.2)",
                    borderRadius: "1.5rem",
                    overflow: "hidden",
                    boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.06) inset",
                }}>
                    {/* Top accent */}
                    <div style={{
                        height: "2px",
                        background: "linear-gradient(90deg, #2563eb, #7c3aed, #2563eb)",
                        backgroundSize: "200% 100%",
                        animation: "bannerGrad 3s linear infinite",
                    }} />

                    <div style={{ padding: "1.5rem" }}>
                        {/* Header Row */}
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem", marginBottom: "1rem" }}>
                            <div style={{
                                width: "2.25rem", height: "2.25rem",
                                background: "rgba(37,99,235,0.12)",
                                border: "1px solid rgba(59,130,246,0.2)",
                                borderRadius: "0.625rem",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0,
                            }}>
                                <Shield style={{ width: "1rem", height: "1rem", color: "#3b82f6" }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: "0 0 0.25rem", fontWeight: 700, color: "white", fontSize: "0.95rem" }}>
                                    Çerez Tercihleriniz
                                </p>
                                <p style={{ margin: 0, fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
                                    Deneyiminizi iyileştirmek için çerezler kullanıyoruz. KVKK kapsamında tercihlerinizi belirleyebilirsiniz.{" "}
                                    <Link href="/gizlilik-politikasi" style={{ color: "#60a5fa", textDecoration: "none" }}>
                                        Gizlilik Politikası
                                    </Link>
                                </p>
                            </div>
                        </div>

                        {/* Detay paneli */}
                        {showDetails && (
                            <div style={{
                                marginBottom: "1rem",
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.07)",
                                borderRadius: "0.875rem",
                                overflow: "hidden",
                                animation: "cookieFadeIn 0.3s ease both",
                            }}>
                                {[
                                    {
                                        id: "necessary",
                                        label: "Zorunlu Çerezler",
                                        desc: "Sitenin çalışması için gerekli, kapatılamaz.",
                                        color: "#10b981",
                                        checked: true,
                                        disabled: true,
                                        onChange: () => { },
                                    },
                                    {
                                        id: "analytics",
                                        label: "Analitik Çerezler",
                                        desc: "Ziyaretçi davranışını analiz etmemize yardımcı olur.",
                                        color: "#3b82f6",
                                        checked: analytics,
                                        disabled: false,
                                        onChange: () => setAnalytics(v => !v),
                                    },
                                    {
                                        id: "marketing",
                                        label: "Pazarlama Çerezleri",
                                        desc: "Size özel içerik ve reklamlar göstermek için kullanılır.",
                                        color: "#a78bfa",
                                        checked: marketing,
                                        disabled: false,
                                        onChange: () => setMarketing(v => !v),
                                    },
                                ].map(item => (
                                    <div key={item.id} style={{
                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                        padding: "0.875rem 1rem",
                                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                                        gap: "1rem",
                                    }}>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 600, color: "white", fontSize: "0.82rem" }}>{item.label}</p>
                                            <p style={{ margin: 0, fontSize: "0.73rem", color: "rgba(255,255,255,0.4)" }}>{item.desc}</p>
                                        </div>
                                        {/* Toggle */}
                                        <button
                                            onClick={item.onChange}
                                            disabled={item.disabled}
                                            style={{
                                                width: "2.5rem",
                                                height: "1.375rem",
                                                borderRadius: "9999px",
                                                background: item.checked ? item.color : "rgba(255,255,255,0.1)",
                                                border: "none",
                                                cursor: item.disabled ? "not-allowed" : "pointer",
                                                position: "relative",
                                                transition: "background 0.25s",
                                                flexShrink: 0,
                                                opacity: item.disabled ? 0.6 : 1,
                                            }}
                                        >
                                            <div style={{
                                                position: "absolute",
                                                top: "0.1875rem",
                                                left: item.checked ? "calc(100% - 1rem - 0.1875rem)" : "0.1875rem",
                                                width: "1rem",
                                                height: "1rem",
                                                background: "white",
                                                borderRadius: "50%",
                                                transition: "left 0.25s",
                                                boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                                            }} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Button Row */}
                        <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
                            <button
                                onClick={acceptAll}
                                style={{
                                    flex: 1,
                                    padding: "0.625rem 1rem",
                                    background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "0.75rem",
                                    fontWeight: 700,
                                    fontSize: "0.82rem",
                                    cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem",
                                    transition: "all 0.2s",
                                    fontFamily: "inherit",
                                    minWidth: "120px",
                                    boxShadow: "0 4px 12px rgba(37,99,235,0.35)",
                                }}
                                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 6px 20px rgba(37,99,235,0.55)")}
                                onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(37,99,235,0.35)")}
                            >
                                <Check style={{ width: "0.75rem", height: "0.75rem" }} />
                                Tümünü Kabul Et
                            </button>

                            {showDetails ? (
                                <button
                                    onClick={acceptSelected}
                                    style={{
                                        flex: 1,
                                        padding: "0.625rem 1rem",
                                        background: "rgba(255,255,255,0.07)",
                                        color: "white",
                                        border: "1px solid rgba(255,255,255,0.12)",
                                        borderRadius: "0.75rem",
                                        fontWeight: 600,
                                        fontSize: "0.82rem",
                                        cursor: "pointer",
                                        fontFamily: "inherit",
                                        transition: "all 0.2s",
                                        minWidth: "120px",
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
                                >
                                    Seçilenleri Kabul Et
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowDetails(true)}
                                    style={{
                                        padding: "0.625rem 0.875rem",
                                        background: "rgba(255,255,255,0.05)",
                                        color: "rgba(255,255,255,0.6)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        borderRadius: "0.75rem",
                                        fontWeight: 600,
                                        fontSize: "0.78rem",
                                        cursor: "pointer",
                                        fontFamily: "inherit",
                                        display: "flex", alignItems: "center", gap: "0.35rem",
                                        transition: "all 0.2s",
                                        flexShrink: 0,
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)";
                                        (e.currentTarget as HTMLButtonElement).style.color = "white";
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
                                        (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)";
                                    }}
                                >
                                    <Settings style={{ width: "0.75rem", height: "0.75rem" }} />
                                    Özelleştir
                                </button>
                            )}

                            <button
                                onClick={rejectAll}
                                style={{
                                    padding: "0.625rem 0.875rem",
                                    background: "transparent",
                                    color: "rgba(255,255,255,0.35)",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    borderRadius: "0.75rem",
                                    fontWeight: 500,
                                    fontSize: "0.78rem",
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                    transition: "all 0.2s",
                                    flexShrink: 0,
                                }}
                                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
                                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
                            >
                                Reddet
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes cookieSlideUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to   { transform: translateY(0); opacity: 1; }
                }
                @keyframes cookieFadeIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes bannerGrad {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 200% 50%; }
                }
            `}</style>
        </>
    );
}
