"use client";

import { motion } from "framer-motion";
import { Check, Zap, Star, Building2 } from "lucide-react";
import { useState } from "react";

const plans = [
    {
        name: "Başlangıç",
        icon: Zap,
        price: { monthly: 299, yearly: 249 },
        description: "Küçük işletmeler için ideal başlangıç paketi",
        color: "#60a5fa",
        features: [
            "1 Kullanıcı",
            "Barkod ile satış",
            "Stok takibi",
            "Temel raporlar",
            "E-posta desteği",
            "500 ürün limiti",
        ],
        notIncluded: ["E-Fatura", "Yapay Zeka", "API Erişimi"],
    },
    {
        name: "Pro",
        icon: Star,
        price: { monthly: 599, yearly: 499 },
        description: "Büyüyen işletmeler için tam özellikli paket",
        color: "#a78bfa",
        popular: true,
        features: [
            "5 Kullanıcı",
            "Barkod ile satış",
            "Gelişmiş stok takibi",
            "E-Fatura & E-Arşiv",
            "Yapay Zeka analizleri",
            "Sınırsız ürün",
            "Cari hesap yönetimi",
            "Öncelikli destek",
        ],
        notIncluded: ["Özel API Erişimi"],
    },
    {
        name: "Kurumsal",
        icon: Building2,
        price: { monthly: 1299, yearly: 999 },
        description: "Büyük işletmeler için özelleştirilebilir çözüm",
        color: "#34d399",
        features: [
            "Sınırsız Kullanıcı",
            "Tüm Pro özellikleri",
            "API Erişimi",
            "Özel entegrasyonlar",
            "Trendyol / N11 sync",
            "Çoklu şube desteği",
            "Özel raporlama",
            "7/24 telefon desteği",
            "Özel eğitim",
        ],
        notIncluded: [],
    },
];

export default function Pricing() {
    const [yearly, setYearly] = useState(false);

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
                        Tüm planlar 14 gün ücretsiz deneme içerir. Kredi kartı gerekmez.
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
                                fontSize: "0.9rem",
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
                                fontSize: "0.9rem",
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
                                %20 İndirim
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
                            {plan.popular && (
                                <div style={{
                                    position: "absolute",
                                    top: "-1px",
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
                                    color: "white",
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    padding: "0.35rem 1.25rem",
                                    borderRadius: "0 0 0.75rem 0.75rem",
                                    letterSpacing: "0.05em",
                                    zIndex: 10,
                                    whiteSpace: "nowrap"
                                }}>
                                    ⭐ EN POPÜLER
                                </div>
                            )}
                            <div style={{
                                background: plan.popular ? "rgba(139,92,246,0.08)" : "rgba(255,255,255,0.03)",
                                border: `1px solid ${plan.popular ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.07)"}`,
                                borderRadius: "1.5rem",
                                padding: "2.25rem",
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                gap: "1.5rem",
                                transition: "all 0.3s ease",
                                boxShadow: plan.popular ? "0 0 40px rgba(139,92,246,0.15)" : "none",
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
                                        <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "white" }}>{plan.name}</span>
                                    </div>
                                    <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{plan.description}</p>
                                </div>

                                {/* Price */}
                                <div>
                                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem" }}>
                                        <span style={{ fontSize: "2.75rem", fontWeight: 800, color: "white", lineHeight: 1 }}>
                                            ₺{yearly ? plan.price.yearly : plan.price.monthly}
                                        </span>
                                        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>/ay</span>
                                    </div>
                                    {yearly && (
                                        <p style={{ fontSize: "0.8rem", color: "#4ade80", marginTop: "0.25rem" }}>
                                            Yıllık ödeme ile ₺{(plan.price.monthly - plan.price.yearly) * 12} tasarruf
                                        </p>
                                    )}
                                </div>

                                {/* CTA */}
                                <button style={{
                                    width: "100%",
                                    padding: "0.875rem",
                                    borderRadius: "0.875rem",
                                    border: plan.popular ? "none" : `1px solid rgba(255,255,255,0.15)`,
                                    background: plan.popular ? "linear-gradient(135deg, #7c3aed, #a78bfa)" : "rgba(255,255,255,0.05)",
                                    color: "white",
                                    fontWeight: 600,
                                    fontSize: "0.95rem",
                                    cursor: "pointer",
                                    transition: "all 0.3s",
                                }}>
                                    14 Gün Ücretsiz Dene
                                </button>

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
                                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.625rem", opacity: 0.35 }}>
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

                {/* Bottom note */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    style={{ textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: "0.875rem", marginTop: "2.5rem" }}
                >
                    Tüm fiyatlara KDV dahil değildir. İstediğiniz zaman iptal edebilirsiniz.
                </motion.p>
            </div>
        </section>
    );
}
