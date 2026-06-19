"use client";

import { useState } from "react";
import Image from "next/image";

import { Package } from "lucide-react";

const features = [
    {
        icon: "/fatura.png",
        title: "E-Fatura Yönetimi",
        desc: "E-Fatura ve E-Arşiv süreçlerinizi dijital ortamda sorunsuz yönetin.",
    },
    {
        icon: Package,
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

const COLOR = "#7886C7";
const GLOW = "rgba(120, 134, 199, 0.15)";
const BORDER = "rgba(120, 134, 199, 0.35)";

export default function Features() {
    const [hovered, setHovered] = useState<number | null>(null);

    const renderCard = (f: typeof features[0], i: number) => {
        const isStringIcon = typeof f.icon === 'string';
        const IconComponent = !isStringIcon ? f.icon as React.ElementType : null;
        
        return (
        <div
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
                background: "#ffffff",
                border: `1px solid ${hovered === i ? BORDER : "#E5E7EB"}`,
                borderRadius: "1.5rem",
                padding: "1.25rem",
                cursor: "default",
                transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                transform: hovered === i ? "translateY(-6px)" : "translateY(0)",
                boxShadow: hovered === i
                    ? `0 20px 40px rgba(120, 134, 199, 0.06), 0 0 24px ${GLOW}`
                    : "0 4px 12px rgba(120, 134, 199, 0.01)",
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
                opacity: hovered === i ? 1 : 0.25,
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
                backgroundImage: `radial-gradient(ellipse at center, rgba(120, 134, 199, 0.06) 0%, transparent 70%)`,
                borderRadius: "1rem",
            }}>
                {isStringIcon ? (
                    <Image
                        src={f.icon as string}
                        alt={f.title}
                        width={180}
                        height={180}
                        style={{
                            objectFit: "contain",
                            width: "180px",
                            height: "180px",
                            transform: hovered === i ? "scale(1.06) translateY(-2px)" : "scale(1)",
                            transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                        }}
                    />
                ) : (
                    <div style={{
                        width: "180px",
                        height: "180px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transform: hovered === i ? "scale(1.06) translateY(-2px)" : "scale(1)",
                        transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}>
                        {IconComponent && <IconComponent style={{ width: "80px", height: "80px", color: "#7886C7", filter: hovered === i ? "drop-shadow(0 4px 12px rgba(120, 134, 199, 0.3))" : "none", transition: "all 0.3s" }} />}
                    </div>
                )}
            </div>

            {/* Text */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <h3 style={{
                    margin: 0,
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "#111827",
                    letterSpacing: "-0.01em",
                }}>
                    {f.title}
                </h3>
                <p style={{
                    margin: 0,
                    fontSize: "0.8rem",
                    color: "#4B5563",
                    lineHeight: 1.6,
                }}>
                    {f.desc}
                </p>
            </div>
        </div>
        );
    };

    return (
        <section 
            style={{
                padding: "6.5rem 2rem",
                position: "relative",
                overflow: "hidden",
                backgroundColor: "#FAFBFC",
            }}
        >
            {/* Subtle Radial Glow Spot at the top */}
            <div style={{
                position: "absolute",
                top: "-150px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "800px",
                height: "300px",
                background: "radial-gradient(circle at center, rgba(120, 134, 199, 0.04) 0%, transparent 70%)",
                pointerEvents: "none",
                zIndex: 1,
            }} />

            <div style={{ maxWidth: "1400px", margin: "0 auto", position: "relative", zIndex: 2 }}>

                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "4rem" }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: "0.5rem",
                        background: "rgba(120, 134, 199, 0.08)",
                        border: "1px solid rgba(120, 134, 199, 0.18)",
                        borderRadius: "9999px",
                        padding: "0.35rem 1rem",
                        marginBottom: "1.5rem",
                        animation: "featFadeUp 0.6s 0.1s both",
                    }}>
                        <div style={{
                            width: "0.4rem", height: "0.4rem", borderRadius: "50%",
                            background: "#7886C7", boxShadow: "0 0 6px #7886C7",
                        }} />
                        <span style={{ fontSize: "0.78rem", color: "#7886C7", fontWeight: 600, letterSpacing: "0.04em" }}>
                            Yapabilecekleriniz
                        </span>
                    </div>

                    <h2 style={{
                        fontSize: "clamp(2rem, 4vw, 3.25rem)",
                        fontWeight: 900,
                        color: "#111827",
                        margin: "0 0 1rem",
                        lineHeight: 1.15,
                        animation: "featFadeUp 0.6s 0.2s both",
                    }}>
                        Kolay Ön Muhasebe
                    </h2>

                    <p style={{
                        fontSize: "1rem",
                        color: "#4B5563",
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
            {/* Gradient transition to ConnectionAnimation section (#FFFFFF) */}
            <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "180px",
                background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,1) 100%)",
                pointerEvents: "none",
                zIndex: 10,
            }} />

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
