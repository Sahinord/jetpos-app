"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Zap, Star, Building2, ArrowRight } from "lucide-react";
import Link from "next/link";

const plans = [
    {
        name: "Starter",
        icon: Zap,
        tag: null,
        price: { monthly: 985, yearly: 790 },
        period: "Aylık · Taahhütsüz",
        description: "Küçük işletmeler için esnek giriş paketi. İstediğiniz zaman iptal edin.",
        color: "#60a5fa",
        popular: false,
        features: [
            "1 Kullanıcı",
            "JetKasa Satış Sistemi",
            "Barkodlu Satış",
            "Stok Takibi",
            "Kasa & Gün Sonu",
            "Temel Raporlama",
            "7/24 Teknik Destek",
        ],
        notIncluded: ["E-Fatura & E-Arşiv", "Yapay Zeka Analizleri", "Çoklu Şube"],
        cta: "Ücretsiz Dene",
    },
    {
        name: "JetScale",
        icon: Star,
        tag: "EN POPÜLER",
        price: { monthly: 1249, yearly: 985 },
        period: "Yıllık · %21 tasarruf",
        description: "Büyüyen işletmeler için tam donanımlı paket. E-Fatura dahil.",
        color: "#a78bfa",
        popular: true,
        features: [
            "3 Kullanıcı",
            "JetKasa Satış Sistemi",
            "Barkodlu Satış",
            "Gelişmiş Stok & Depo",
            "E-Fatura & E-Arşiv",
            "Yapay Zeka Analizleri",
            "Cari Hesap Yönetimi",
            "Personel Takibi",
            "7/24 Öncelikli Destek",
        ],
        notIncluded: ["Çoklu Şube", "Özel API Erişimi"],
        cta: "Ücretsiz Dene",
    },
    {
        name: "Pro",
        icon: Building2,
        tag: "EN İYİ DEĞİR",
        price: { monthly: 543, yearly: 394 },
        period: "2 Yıl + 1 Yıl Hediye",
        description: "3 yıl kullanım, barkod okuyucu hediye. Sınırsız kullanıcı.",
        color: "#34d399",
        popular: false,
        features: [
            "Sınırsız Kullanıcı",
            "Tüm Büyüme özellikleri",
            "Çoklu Şube (3'e kadar)",
            "KDV & Mizan Raporları",
            "Trendyol Entegrasyonu",
            "İkas Entegrasyonu",
            "Ücretsiz Kurulum & Geçiş",
            "Barkod Okuyucu Hediye",
            "+1 Yıl Kullanım Hediye",
        ],
        notIncluded: [],
        cta: "Bu Planı Seç",
        badge: "3 yıl öde, ücretsiz başla",
    },
];

export default function Pricing() {
    const [yearly, setYearly] = useState(true);

    return (
        <section id="pricing" style={{ padding: "7rem 0", position: "relative", zIndex: 2 }}>
            <div className="site-container">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    style={{ textAlign: "center", marginBottom: "4rem" }}
                >
                    <span className="badge" style={{ marginBottom: "1.25rem", display: "inline-flex" }}>
                        Şeffaf Fiyatlandırma
                    </span>
                    <h2 style={{
                        fontSize: "clamp(2rem, 5vw, 3.25rem)",
                        fontWeight: 800,
                        color: "white",
                        marginBottom: "1rem",
                        lineHeight: 1.2
                    }}>
                        İşletmenize Uygun{" "}
                        <span className="holographic-text">Planı Seçin</span>
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "1.125rem", maxWidth: "560px", margin: "0 auto 2rem" }}>
                        14 gün ücretsiz deneyin. Kredi kartı gerekmez, istediğiniz zaman iptal edin.
                    </p>

                    {/* Toggle */}
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "9999px", padding: "0.375rem" }}>
                        <button
                            onClick={() => setYearly(false)}
                            style={{
                                padding: "0.5rem 1.25rem",
                                borderRadius: "9999px",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: 600,
                                fontSize: "0.875rem",
                                fontFamily: "inherit",
                                transition: "all 0.3s",
                                background: !yearly ? "linear-gradient(135deg, #2563eb, #3b82f6)" : "transparent",
                                color: !yearly ? "white" : "rgba(255,255,255,0.5)",
                            }}
                        >
                            Aylık
                        </button>
                        <button
                            onClick={() => setYearly(true)}
                            style={{
                                padding: "0.5rem 1.25rem",
                                borderRadius: "9999px",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: 600,
                                fontSize: "0.875rem",
                                fontFamily: "inherit",
                                transition: "all 0.3s",
                                background: yearly ? "linear-gradient(135deg, #2563eb, #3b82f6)" : "transparent",
                                color: yearly ? "white" : "rgba(255,255,255,0.5)",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem"
                            }}
                        >
                            Yıllık
                            <span style={{ background: "#22c55e", color: "white", fontSize: "0.7rem", padding: "0.1rem 0.4rem", borderRadius: "9999px", fontWeight: 700 }}>
                                %20+ İndirim
                            </span>
                        </button>
                    </div>
                </motion.div>

                {/* Plans Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", maxWidth: "1100px", margin: "0 auto" }}>
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            style={{ position: "relative" }}
                        >
                            {/* Popular Badge */}
                            {plan.tag && (
                                <div style={{
                                    position: "absolute",
                                    top: "-1px",
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    background: plan.popular
                                        ? "linear-gradient(135deg, #7c3aed, #a78bfa)"
                                        : "linear-gradient(135deg, #059669, #34d399)",
                                    color: "white",
                                    fontSize: "0.7rem",
                                    fontWeight: 700,
                                    padding: "0.35rem 1.25rem",
                                    borderRadius: "0 0 0.75rem 0.75rem",
                                    letterSpacing: "0.08em",
                                    zIndex: 10,
                                    whiteSpace: "nowrap"
                                }}>
                                    {plan.tag === "EN İYİ DEĞİR" ? "⚡ EN İYİ DEĞER" : `⭐ ${plan.tag}`}
                                </div>
                            )}

                            <div style={{
                                background: plan.popular ? "rgba(139,92,246,0.08)" : "rgba(255,255,255,0.03)",
                                border: `1px solid ${plan.popular ? "rgba(139,92,246,0.4)" : plan.name === "Pro" ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.07)"}`,
                                borderRadius: "1.5rem",
                                padding: "2.25rem",
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                gap: "1.5rem",
                                transition: "all 0.3s ease",
                                boxShadow: plan.popular ? "0 0 40px rgba(139,92,246,0.15)" : plan.name === "Pro" ? "0 0 40px rgba(52,211,153,0.08)" : "none",
                            }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-6px)";
                                    (e.currentTarget as HTMLDivElement).style.boxShadow = `0 20px 50px rgba(0,0,0,0.4), 0 0 0 1px ${plan.color}33`;
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                                    (e.currentTarget as HTMLDivElement).style.boxShadow = plan.popular ? "0 0 40px rgba(139,92,246,0.15)" : "none";
                                }}
                            >
                                {/* Plan header */}
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                                        <div style={{
                                            width: "2.75rem", height: "2.75rem", borderRadius: "0.75rem",
                                            background: `${plan.color}20`,
                                            border: `1px solid ${plan.color}40`,
                                            display: "flex", alignItems: "center", justifyContent: "center"
                                        }}>
                                            <plan.icon style={{ width: "1.25rem", height: "1.25rem", color: plan.color }} />
                                        </div>
                                        <div>
                                            <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "white", display: "block" }}>{plan.name}</span>
                                            <span style={{ fontSize: "0.7rem", color: plan.color, fontWeight: 600, opacity: 0.8 }}>{plan.period}</span>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{plan.description}</p>
                                </div>

                                {/* Price */}
                                <div>
                                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem" }}>
                                        <span style={{ fontSize: "1rem", color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>₺</span>
                                        <span style={{ fontSize: "3rem", fontWeight: 800, color: "white", lineHeight: 1 }}>
                                            {yearly ? plan.price.yearly : plan.price.monthly}
                                        </span>
                                        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>/ay</span>
                                    </div>
                                    {yearly && (
                                        <p style={{ fontSize: "0.8rem", color: "#4ade80", marginTop: "0.35rem" }}>
                                            Yıllık ödemede ₺{((plan.price.monthly - plan.price.yearly) * 12).toLocaleString("tr-TR")} tasarruf
                                        </p>
                                    )}
                                    {plan.badge && (
                                        <div style={{
                                            marginTop: "0.75rem",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "0.35rem",
                                            background: "rgba(52,211,153,0.1)",
                                            border: "1px solid rgba(52,211,153,0.25)",
                                            borderRadius: "9999px",
                                            padding: "0.25rem 0.75rem",
                                            fontSize: "0.7rem",
                                            color: "#34d399",
                                            fontWeight: 700
                                        }}>
                                            🎁 {plan.badge}
                                        </div>
                                    )}
                                </div>

                                {/* CTA */}
                                <Link href="/demo" style={{
                                    display: "block",
                                    width: "100%",
                                    padding: "0.875rem",
                                    borderRadius: "0.875rem",
                                    border: plan.popular ? "none" : plan.name === "Pro" ? "none" : "1px solid rgba(255,255,255,0.15)",
                                    background: plan.popular
                                        ? "linear-gradient(135deg, #7c3aed, #a78bfa)"
                                        : plan.name === "Pro"
                                            ? "linear-gradient(135deg, #059669, #34d399)"
                                            : "rgba(255,255,255,0.05)",
                                    color: "white",
                                    fontWeight: 600,
                                    fontSize: "0.95rem",
                                    cursor: "pointer",
                                    transition: "all 0.3s",
                                    textAlign: "center",
                                    textDecoration: "none",
                                    boxShadow: plan.popular ? "0 4px 20px rgba(124,58,237,0.35)" : plan.name === "Pro" ? "0 4px 16px rgba(52,211,153,0.3)" : "none"
                                }}>
                                    {plan.cta}
                                </Link>

                                {/* Divider */}
                                <div style={{ height: "1px", background: "rgba(255,255,255,0.07)" }} />

                                {/* Features */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1 }}>
                                    {plan.features.map((f, i) => (
                                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                                            <div style={{
                                                width: "1.25rem", height: "1.25rem", borderRadius: "50%",
                                                background: `${plan.color}20`,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                flexShrink: 0
                                            }}>
                                                <Check style={{ width: "0.75rem", height: "0.75rem", color: plan.color }} />
                                            </div>
                                            <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.75)" }}>{f}</span>
                                        </div>
                                    ))}
                                    {plan.notIncluded.map((f, i) => (
                                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.625rem", opacity: 0.3 }}>
                                            <div style={{
                                                width: "1.25rem", height: "1.25rem", borderRadius: "50%",
                                                background: "rgba(255,255,255,0.05)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                flexShrink: 0
                                            }}>
                                                <span style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.4)" }}>✕</span>
                                            </div>
                                            <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.4)", textDecoration: "line-through" }}>{f}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
                
                {/* Custom Package CTA */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    style={{
                        marginTop: "4rem",
                        maxWidth: "1100px",
                        margin: "4rem auto 0",
                        padding: "2rem",
                        borderRadius: "1.5rem",
                        background: "rgba(37,99,235,0.05)",
                        border: "1px dashed rgba(37,99,235,0.3)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                        gap: "1.5rem"
                    }}
                >
                    <div>
                        <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "white", marginBottom: "0.5rem" }}>
                            Aradığınız paketi bulamadınız mı?
                        </h3>
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.95rem" }}>
                            İhtiyacın olan özellikleri kendin seç, sana özel paketi oluştur ve anında teklif al.
                        </p>
                    </div>
                    <Link href="/paket-olustur" style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        background: "#2563eb",
                        color: "white",
                        padding: "0.875rem 2rem",
                        borderRadius: "1rem",
                        fontWeight: 700,
                        textDecoration: "none",
                        transition: "all 0.3s"
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.transform = "scale(1.05)";
                        e.currentTarget.style.boxShadow = "0 10px 30px rgba(37,99,235,0.4)";
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow = "none";
                    }}
                    >
                        <Zap style={{ width: "1.25rem", height: "1.25rem" }} />
                        Kendi Paketini Oluştur
                    </Link>
                </motion.div>

                {/* All plans link */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    style={{ textAlign: "center", marginTop: "2.5rem" }}
                >
                    <Link href="/fiyatlandirma" style={{
                        display: "inline-flex", alignItems: "center", gap: "0.5rem",
                        color: "rgba(255,255,255,0.45)", fontSize: "0.875rem",
                        textDecoration: "none", transition: "color 0.2s",
                        fontWeight: 500
                    }}
                        onMouseEnter={e => (e.currentTarget.style.color = "white")}
                        onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
                    >
                        Tüm plan karşılaştırmasını gör
                        <ArrowRight style={{ width: "0.875rem", height: "0.875rem" }} />
                    </Link>
                    <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.8rem", marginTop: "0.75rem", lineHeight: 1.75 }}>
                        Tüm fiyatlara KDV dahil değildir. İstediğiniz zaman iptal edebilirsiniz.
                        <br />
                        <span style={{ color: "rgba(255,255,255,0.18)" }}>
                            * Yapay zeka özellikleri (stok tahmini, satış analizi vb.) kullanım bazlı token ücretlendirmesine tabidir ve plan fiyatlarına dahil değildir.
                        </span>
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
