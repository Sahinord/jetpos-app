"use client";

import { useState } from "react";
import Image from "next/image";

const features = [
    {
        icon: "/fatura.png",
        title: "E-Fatura Yönetimi",
        desc: "E-Fatura ve E-Arşiv süreçlerinizi dijital ortamda sorunsuz yönetin.",
    },
    {
        icon: "/calendar.png",
        title: "Stok Takibi",
        desc: "Perakende işletmenizde stok hareketlerinizi anlık olarak takip edin ve optimize edin.",
    },
    {
        icon: "/money.png",
        title: "Kasa Takibi",
        desc: "Kasa hareketlerinizi kolayca yönetin, raporlayın ve analiz edin.",
    },
    {
        icon: "/pc.png",
        title: "Ödeme Takibi",
        desc: "Alacak ve borçlarınızı sistematik olarak takip edin, vadeli ödemeleri yönetin.",
    },
    {
        icon: "/phone.png",
        title: "Telefondan Yönetim",
        desc: "El terminaline artık ihtiyaç yok! Tüm stok takibi ve fatura işlemlerinizi tek tıkla uzaktan halledin.",
    },
    {
        icon: "/ai.png",
        title: "AI Satış Asistanı",
        desc: "Yapay zeka ile satış trendlerini analiz et, akıllı öneriler al ve işletmeni bir adım öne taşı.",
    },
    {
        icon: "/analiz.png",
        title: "Akıllı Raporlar",
        desc: "Günlük, haftalık ve aylık satış raporlarını tek ekranda görüntüle, kârlılığını analiz et.",
    },
    {
        icon: "/personal.png",
        title: "Çalışan Yönetimi",
        desc: "Personel ve vardiya takibini kolayca organize et, çalışan performansını izle.",
    },
    {
        icon: "/bank.png",
        title: "Kasa & Banka",
        desc: "Nakit ve banka hareketlerini anlık takip et, otomatik mutabakat ile zaman kazan.",
    },
];

const COLOR = "#3b82f6";
const GLOW = "rgba(59,130,246,0.2)";
const BORDER = "rgba(59,130,246,0.25)";

export default function Features() {
    const [hovered, setHovered] = useState<number | null>(null);

    const renderCard = (f: typeof features[0], i: number) => (
        <div
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
                background: hovered === i
                    ? "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)"
                    : "linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                border: `1px solid ${hovered === i ? BORDER : "rgba(255,255,255,0.07)"}`,
                borderRadius: "1.5rem",
                padding: "1.25rem",
                cursor: "default",
                transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
                transform: hovered === i ? "translateY(-6px)" : "translateY(0)",
                boxShadow: hovered === i
                    ? `0 20px 48px rgba(0,0,0,0.4), 0 0 0 1px ${BORDER} inset, 0 0 40px ${GLOW}`
                    : "0 4px 24px rgba(0,0,0,0.2)",
                display: "flex",
                flexDirection: "column" as const,
                gap: "1rem",
                position: "relative" as const,
                overflow: "hidden",
                animation: `featFadeUp 0.6s ${0.05 + i * 0.07}s both`,
            }}
        >
            {/* Corner dot */}
            <div style={{
                position: "absolute", top: "1rem", right: "1rem",
                width: "0.4rem", height: "0.4rem", borderRadius: "50%",
                background: COLOR,
                opacity: hovered === i ? 1 : 0.3,
                boxShadow: hovered === i ? `0 0 8px ${COLOR}` : "none",
                transition: "all 0.35s",
            }} />

            {/* Icon */}
            <div style={{
                width: "100%",
                minHeight: "160px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `radial-gradient(ellipse at center, ${GLOW} 0%, transparent 70%)`,
                borderRadius: "1rem",
            }}>
                <Image
                    src={f.icon}
                    alt={f.title}
                    width={180}
                    height={180}
                    style={{
                        objectFit: "contain",
                        width: "180px",
                        height: "180px",
                        transform: hovered === i ? "scale(1.08) translateY(-4px)" : "scale(1)",
                        transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
                    }}
                />
            </div>

            {/* Text */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <h3 style={{
                    margin: 0,
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "white",
                    letterSpacing: "-0.01em",
                }}>
                    {f.title}
                </h3>
                <p style={{
                    margin: 0,
                    fontSize: "0.8rem",
                    color: "rgba(255,255,255,0.45)",
                    lineHeight: 1.6,
                }}>
                    {f.desc}
                </p>
            </div>
        </div>
    );

    return (
        <section style={{
            padding: "6rem 2rem",
            position: "relative",
            overflow: "hidden",
        }}>
            {/* Top separator */}
            <div style={{
                position: "absolute", top: 0, left: "20%", right: "20%", height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.3), transparent)",
            }} />

            <div style={{ maxWidth: "1400px", margin: "0 auto" }}>

                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "4rem" }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: "0.5rem",
                        background: "rgba(59,130,246,0.08)",
                        border: "1px solid rgba(59,130,246,0.18)",
                        borderRadius: "9999px",
                        padding: "0.35rem 1rem",
                        marginBottom: "1.5rem",
                        animation: "featFadeUp 0.6s 0.1s both",
                    }}>
                        <div style={{
                            width: "0.4rem", height: "0.4rem", borderRadius: "50%",
                            background: "#3b82f6", boxShadow: "0 0 6px #3b82f6",
                        }} />
                        <span style={{ fontSize: "0.78rem", color: "#93c5fd", fontWeight: 600, letterSpacing: "0.04em" }}>
                            Yapabilecekleriniz
                        </span>
                    </div>

                    <h2 style={{
                        fontSize: "clamp(2rem, 4vw, 3.25rem)",
                        fontWeight: 900,
                        color: "white",
                        margin: "0 0 1rem",
                        lineHeight: 1.15,
                        animation: "featFadeUp 0.6s 0.2s both",
                    }}>
                        Kolay Ön Muhasebe
                    </h2>

                    <p style={{
                        fontSize: "1rem",
                        color: "rgba(255,255,255,0.45)",
                        margin: 0,
                        animation: "featFadeUp 0.6s 0.3s both",
                    }}>
                        Bütçe Dostu 💙
                    </p>
                </div>

                {/* Satır 1 — 5 kart */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: "1.25rem",
                    marginBottom: "1.25rem",
                }} className="features-row-top">
                    {features.slice(0, 5).map((f, i) => renderCard(f, i))}
                </div>

                {/* Satır 2 — 4 kart, ortalanmış */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "1.25rem",
                    maxWidth: "80%",
                    margin: "0 auto",
                }} className="features-row-bottom">
                    {features.slice(5).map((f, i) => renderCard(f, i + 5))}
                </div>
            </div>

            <style>{`
                @keyframes featFadeUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @media (max-width: 1100px) {
                    .features-row-top, .features-row-bottom {
                        grid-template-columns: repeat(3, 1fr) !important;
                        max-width: 100% !important;
                    }
                }
                @media (max-width: 700px) {
                    .features-row-top, .features-row-bottom {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                }
                @media (max-width: 440px) {
                    .features-row-top, .features-row-bottom {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </section>
    );
}
