"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Check, ChevronDown, Zap, Star, ArrowRight,
    Barcode, FileText, Package, Wallet,
    Brain, Shield, Users, Building2, BarChart3, PhoneCall
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

/* ─── PLAN DATA ─────────────────────────────────────── */
const plans = [
    {
        id: "baslangic",
        name: "Starter",
        period: "Aylık · Taahhütsüz",
        subtitle: "Taahhütsüz, esnek ödeme. İstediğiniz zaman iptal edebilirsiniz.",
        monthlyPrice: 1249,
        yearlyPrice: 985,
        highlight: false,
        badge: "Taahhütsüz",
        badgeColor: "#60a5fa",
        color: "#60a5fa",
        cta: "14 Gün Ücretsiz Dene",
        users: "1 Kullanıcı",
        features: [
            { text: "Hızlı Satış Sistemi" },
            { text: "Barkodlu Satış" },
            { text: "Mobil Barkod Okuma" },
            { text: "Stok Takibi" },
            { text: "Kasa & Gün Sonu Takibi" },
            { text: "Kasiyer Takip" },
            { text: "Gelir Gider Takibi" },
            { text: "Temel Raporlama" },
            { text: "7/24 Teknik Destek" },
        ],
        notIncluded: [
            "E-Fatura & E-Arşiv",
            "Yapay Zeka Analizleri",
            "Depo Yönetimi",
            "Çoklu Şube",
        ],
    },
    {
        id: "buyume",
        name: "JetScale",
        period: "Yıllık · %21 Tasarruf",
        subtitle: "E-Fatura, AI analizleri ve gelişmiş depo yönetimi dahil.",
        monthlyPrice: 883,
        yearlyPrice: 679,
        highlight: false,
        badge: "⭐ En Popüler",
        badgeColor: "#a78bfa",
        color: "#a78bfa",
        cta: "14 Gün Ücretsiz Dene",
        users: "3 Kullanıcı",
        features: [
            { text: "Tüm Starter özellikleri" },
            { text: "E-Fatura & E-Arşiv", tag: "Dahil", tagColor: "#a78bfa" },
            { text: "Yapay Zeka Analizleri", tag: "Dahil", tagColor: "#a78bfa" },
            { text: "Depo Yönetimi" },
            { text: "Cari Hesap Yönetimi" },
            { text: "Personel Takibi" },
            { text: "Üretim Takibi" },
            { text: "Teklif Oluşturma" },
            { text: "Detaylı Raporlama" },
            { text: "Barkod Yazdırma" },
            { text: "Ücretsiz Kurulum", tag: "Hediye", tagColor: "#22c55e" },
        ],
        notIncluded: [
            "Çoklu Şube",
            "Sınırsız Kullanıcı",
        ],
    },
    {
        id: "pro",
        name: "Pro",
        period: "2 Yıl Öde · 3 Yıl Kullan",
        subtitle: "2 yıl öde, 3 yıl kullan. Sınırsız kullanıcı ve barkod okuyucu hediye.",
        monthlyPrice: 543,
        yearlyPrice: 394,
        originalYearly: 21255,
        highlight: true,
        badge: "⚡ En İyi Değer",
        badgeColor: "#059669",
        color: "#34d399",
        cta: "Bu Planı Seç",
        users: "Sınırsız",
        features: [
            { text: "Tüm JetScale özellikleri" },
            { text: "Sınırsız Kullanıcı", tag: "Hediye", tagColor: "#22c55e" },
            { text: "Çoklu Şube (3'e kadar)" },
            { text: "KDV & Mizan Raporları" },
            { text: "Trendyol Entegrasyonu", tag: "Hediye", tagColor: "#22c55e" },
            { text: "İkas Entegrasyonu", tag: "Hediye", tagColor: "#22c55e" },
            { text: "Özel Barkod Yazdırma" },
            { text: "Ücretsiz Kurulum & Geçiş", tag: "Hediye", tagColor: "#22c55e" },
            { text: "Barkod Okuyucu", tag: "Hediye", tagColor: "#22c55e" },
            { text: "+1 Yıl Kullanım", tag: "Hediye", tagColor: "#22c55e" },
        ],
        notIncluded: [],
        footnote: "✓ 3 yıl kullanım · Barkod okuyucu hediye · 1 yıl bonus",
    },
    {
        id: "ozel",
        name: "Kurumsal",
        period: "Özel Teklif",
        subtitle: "Çok şubeli zincirler ve büyük işletmeler için özel çözüm.",
        monthlyPrice: 0,
        yearlyPrice: 0,
        highlight: false,
        badge: "Teklif Al",
        badgeColor: "#ec4899",
        color: "#ec4899",
        isCustom: true,
        cta: "Bize Ulaşın",
        users: "Sınırsız",
        features: [
            { text: "Tüm Pro özellikleri" },
            { text: "Sınırsız Şube & Kullanıcı" },
            { text: "Özel API Erişimi" },
            { text: "ERP Entegrasyonu" },
            { text: "Özel Raporlama & KPI" },
            { text: "Özel Temsilci Atama" },
            { text: "SLA Garantisi" },
            { text: "7/24 Telefon Desteği" },
        ],
        notIncluded: [],
    },
];

/* ─── COMPARISON ──────────────────────────────── */
const featureCategories = [
    {
        title: "Satış & POS",
        icon: Barcode,
        features: [
            { name: "Hızlı Satış Sistemi", plans: [true, true, true, true] },
            { name: "Barkodlu Satış", plans: [true, true, true, true] },
            { name: "Mobil Barkod Okuma", plans: [true, true, true, true] },
            { name: "Kasiyer Takip", plans: [true, true, true, true] },
            { name: "Çoklu Şube", plans: [false, false, "3 Şube", "Sınırsız"] },
        ]
    },
    {
        title: "Finans & Muhasebe",
        icon: Wallet,
        features: [
            { name: "Gelir Gider Takibi", plans: [true, true, true, true] },
            { name: "Kasa Gün Sonu", plans: [true, true, true, true] },
            { name: "E-Fatura & E-Arşiv", plans: [false, true, true, true] },
            { name: "KDV & Mizan Raporları", plans: [false, false, true, true] },
            { name: "Cari Hesap Yönetimi", plans: [false, true, true, true] },
        ]
    },
    {
        title: "Stok & Depo",
        icon: Package,
        features: [
            { name: "Stok Takibi", plans: [true, true, true, true] },
            { name: "Depo Yönetimi", plans: [false, true, true, true] },
            { name: "Üretim Takibi", plans: [false, true, true, true] },
            { name: "Teklif Oluşturma", plans: [false, true, true, true] },
        ]
    },
    {
        title: "Personel & Müşteri",
        icon: Users,
        features: [
            { name: "Kullanıcı Sayısı", plans: ["1", "3", "Sınırsız", "Sınırsız"] },
            { name: "Personel Takibi", plans: [false, true, true, true] },
            { name: "Özel Temsilci", plans: [false, false, false, true] },
        ]
    },
    {
        title: "Yapay Zeka & Raporlama",
        icon: Brain,
        features: [
            { name: "Temel Raporlama", plans: [true, true, true, true] },
            { name: "Detaylı Raporlama", plans: [false, true, true, true] },
            { name: "AI Satış Analizleri", plans: [false, true, true, true] },
            { name: "Özel KPI Raporları", plans: [false, false, false, true] },
        ]
    },
    {
        title: "Entegrasyon & Destek",
        icon: Shield,
        features: [
            { name: "7/24 Teknik Destek", plans: [true, true, true, true] },
            { name: "Ücretsiz Kurulum", plans: [false, "Hediye", "Hediye", "Hediye"] },
            { name: "Trendyol Entegrasyonu", plans: [false, false, "Hediye", true] },
            { name: "Barkod Okuyucu", plans: [false, false, "Hediye", true] },
            { name: "API Erişimi", plans: [false, false, false, true] },
        ]
    },
];

/* ─── PLAN CARD ─────────────────────────────────────── */
function PlanCard({ plan, yearly }: { plan: typeof plans[0]; yearly: boolean }) {
    const [expanded, setExpanded] = useState(false);
    const isCustom = (plan as any).isCustom;
    const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
    const visibleFeatures = expanded ? plan.features : plan.features.slice(0, 7);

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{ position: "relative", display: "flex", flexDirection: "column" }}
        >
            {/* Badge */}
            {plan.badge && (
                <div style={{
                    position: "absolute", top: "-1px", left: "50%", transform: "translateX(-50%)",
                    background: plan.highlight
                        ? "linear-gradient(135deg, #047857, #059669)"
                        : plan.badge === "⭐ En Popüler"
                            ? "linear-gradient(135deg, #6d28d9, #7c3aed)"
                            : plan.badgeColor,
                    color: "white", fontSize: "0.68rem", fontWeight: 700,
                    padding: "0.3rem 1rem", borderRadius: "0 0 0.625rem 0.625rem",
                    whiteSpace: "nowrap", zIndex: 10, letterSpacing: "0.05em"
                }}>
                    {plan.badge}
                </div>
            )}

            <div style={{
                background: plan.highlight ? "rgba(5,150,105,0.07)" : "rgba(255,255,255,0.025)",
                border: `1px solid ${plan.highlight ? "rgba(52,211,153,0.35)" : plan.badge === "⭐ En Popüler" ? "rgba(139,92,246,0.35)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: "1.25rem",
                padding: "1.75rem 1.5rem",
                display: "flex", flexDirection: "column", gap: "1.25rem",
                height: "100%",
                boxShadow: plan.highlight ? "0 0 40px rgba(52,211,153,0.12)" : plan.badge === "⭐ En Popüler" ? "0 0 30px rgba(139,92,246,0.12)" : "none",
                transition: "all 0.3s ease",
            }}>
                {/* Header */}
                <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "white", margin: 0 }}>
                            {plan.name}
                        </h3>
                        <span style={{
                            fontSize: "0.65rem", fontWeight: 700, color: plan.color,
                            background: `${plan.color}15`, border: `1px solid ${plan.color}30`,
                            padding: "0.2rem 0.6rem", borderRadius: "9999px",
                            whiteSpace: "nowrap"
                        }}>
                            {plan.users}
                        </span>
                    </div>
                    <p style={{ fontSize: "0.7rem", color: plan.color, fontWeight: 600, marginBottom: "0.5rem" }}>
                        {plan.period}
                    </p>
                    <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                        {plan.subtitle}
                    </p>
                </div>

                {/* Price */}
                <div>
                    {(plan as any).originalYearly && (
                        <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", textDecoration: "line-through", marginBottom: "0.25rem" }}>
                            ₺{(plan as any).originalYearly.toLocaleString("tr-TR")} +KDV
                        </div>
                    )}
                    {isCustom ? (
                        <div>
                            <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "white" }}>Teklif Bazlı</span>
                            <p style={{ fontSize: "0.8rem", color: plan.color, fontWeight: 600, marginTop: "0.25rem" }}>İşletmenize özel fiyat</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "0.2rem" }}>
                                <span style={{ fontSize: "1rem", color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>₺</span>
                                <span style={{ fontSize: "3rem", fontWeight: 900, color: "white", lineHeight: 1 }}>
                                    {price?.toLocaleString("tr-TR")}
                                </span>
                                <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>+KDV/ay</span>
                            </div>
                            {yearly && plan.monthlyPrice > 0 && (
                                <p style={{ fontSize: "0.75rem", color: "#4ade80", marginTop: "0.3rem" }}>
                                    Yıllık ₺{((plan.monthlyPrice - plan.yearlyPrice) * 12).toLocaleString("tr-TR")} tasarruf
                                </p>
                            )}
                        </>
                    )}
                </div>

                {/* CTA */}
                <Link
                    href={isCustom ? "/#contact" : "/demo"}
                    style={{
                        display: "block", textAlign: "center",
                        width: "100%", padding: "0.9rem",
                        borderRadius: "0.875rem",
                        border: "none",
                        background: plan.highlight
                            ? "linear-gradient(135deg, #059669, #34d399)"
                            : plan.badge === "⭐ En Popüler"
                                ? "linear-gradient(135deg, #6d28d9, #7c3aed)"
                                : isCustom
                                    ? "linear-gradient(135deg, #be185d, #ec4899)"
                                    : "rgba(255,255,255,0.07)",
                        color: "white", fontWeight: 700, fontSize: "0.95rem",
                        cursor: "pointer", textDecoration: "none",
                        boxShadow: plan.highlight ? "0 4px 16px rgba(52,211,153,0.3)" : plan.badge === "⭐ En Popüler" ? "0 4px 16px rgba(124,58,237,0.35)" : "none",
                        border2: plan.highlight || plan.badge === "⭐ En Popüler" || isCustom ? "none" : "1px solid rgba(255,255,255,0.12)",
                    } as any}
                >
                    {plan.cta}
                </Link>

                <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />

                {/* Features */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", flex: 1 }}>
                    {visibleFeatures.map((f: any, i: number) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Check style={{ width: "0.875rem", height: "0.875rem", color: plan.color, flexShrink: 0 }} />
                            <span style={{ fontSize: "0.83rem", color: "rgba(255,255,255,0.75)", flex: 1 }}>{f.text}</span>
                            {f.tag && (
                                <span style={{
                                    fontSize: "0.6rem", fontWeight: 800,
                                    padding: "0.1rem 0.4rem", borderRadius: "4px",
                                    background: `${f.tagColor}20`, color: f.tagColor,
                                    border: `1px solid ${f.tagColor}35`,
                                    whiteSpace: "nowrap"
                                }}>
                                    {f.tag}
                                </span>
                            )}
                        </div>
                    ))}
                    {(plan as any).notIncluded?.map((f: string, i: number) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", opacity: 0.3 }}>
                            <span style={{ width: "0.875rem", height: "0.875rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>✕</span>
                            <span style={{ fontSize: "0.83rem", color: "rgba(255,255,255,0.4)", textDecoration: "line-through" }}>{f}</span>
                        </div>
                    ))}
                </div>

                {/* Expand */}
                {plan.features.length > 7 && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        style={{
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem",
                            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                            cursor: "pointer", borderRadius: "0.5rem",
                            color: "rgba(255,255,255,0.4)", fontSize: "0.78rem", fontWeight: 600,
                            fontFamily: "inherit", padding: "0.5rem 1rem",
                        }}
                    >
                        {expanded ? "Daha Az" : "Tüm Özellikleri Gör"}
                        <ChevronDown style={{
                            width: "0.8rem", height: "0.8rem",
                            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s"
                        }} />
                    </button>
                )}

                {(plan as any).footnote && (
                    <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
                        {(plan as any).footnote}
                    </p>
                )}
            </div>
        </motion.div>
    );
}

/* ─── COMPARISON TABLE ──────────────────────────────── */
function ComparisonTable() {
    const [open, setOpen] = useState(false);
    const planColors = plans.map(p => p.color);

    return (
        <div style={{ marginTop: "4rem" }}>
            <button
                onClick={() => setOpen(!open)}
                style={{
                    display: "flex", alignItems: "center", gap: "0.625rem",
                    margin: "0 auto", background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.75rem",
                    padding: "0.75rem 1.75rem", color: "rgba(255,255,255,0.7)", fontWeight: 600,
                    fontSize: "0.9rem", cursor: "pointer", fontFamily: "inherit",
                    transition: "all 0.2s"
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
            >
                Tüm Özellikleri Karşılaştır
                <ChevronDown style={{ width: "1rem", height: "1rem", transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.3s" }} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.35 }}
                        style={{ overflow: "hidden", marginTop: "2rem" }}
                    >
                        <div style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.07)",
                            borderRadius: "1.25rem", overflow: "auto"
                        }}>
                            {/* Header */}
                            <div style={{
                                display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr",
                                background: "rgba(255,255,255,0.03)",
                                borderBottom: "1px solid rgba(255,255,255,0.07)",
                                padding: "1rem 1.5rem", gap: "0.5rem", minWidth: "600px"
                            }}>
                                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Özellik</div>
                                {plans.map(p => (
                                    <div key={p.id} style={{ fontSize: "0.78rem", fontWeight: 800, color: p.color, textAlign: "center" }}>
                                        {p.name}
                                    </div>
                                ))}
                            </div>

                            {featureCategories.map((cat, ci) => (
                                <div key={ci}>
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: "0.5rem",
                                        padding: "0.625rem 1.5rem",
                                        background: "rgba(255,255,255,0.015)",
                                        borderTop: ci > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                                        minWidth: "600px"
                                    }}>
                                        <cat.icon style={{ width: "0.8rem", height: "0.8rem", color: "rgba(255,255,255,0.35)" }} />
                                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                            {cat.title}
                                        </span>
                                    </div>

                                    {cat.features.map((feat, fi) => (
                                        <div key={fi} style={{
                                            display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr",
                                            padding: "0.6rem 1.5rem", gap: "0.5rem",
                                            borderTop: "1px solid rgba(255,255,255,0.035)",
                                            alignItems: "center", minWidth: "600px",
                                        }}>
                                            <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.65)" }}>{feat.name}</span>
                                            {feat.plans.map((val, pi) => (
                                                <div key={pi} style={{ display: "flex", justifyContent: "center" }}>
                                                    {val === true ? (
                                                        <Check style={{ width: "0.9rem", height: "0.9rem", color: planColors[pi] }} />
                                                    ) : val === false ? (
                                                        <span style={{ color: "rgba(255,255,255,0.12)", fontSize: "0.8rem" }}>—</span>
                                                    ) : (
                                                        <span style={{
                                                            fontSize: "0.6rem", fontWeight: 700,
                                                            padding: "0.15rem 0.45rem", borderRadius: "9999px",
                                                            background: "rgba(34,197,94,0.12)", color: "#4ade80",
                                                            border: "1px solid rgba(34,197,94,0.2)"
                                                        }}>
                                                            {val}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── PAGE ──────────────────────────────────────────── */
export default function FiyatlandirmaPage() {
    const [yearly, setYearly] = useState(true);

    return (
        <>
            <div className="site-bg" />
            <main style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
                <Navbar />

                <div style={{ paddingTop: "7rem", paddingBottom: "5rem" }}>
                    <div className="site-container">

                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            style={{ textAlign: "center", marginBottom: "3.5rem" }}
                        >
                            <span className="badge" style={{ marginBottom: "1.25rem", display: "inline-flex" }}>
                                <Zap style={{ width: "0.875rem", height: "0.875rem" }} />
                                Şeffaf Fiyatlandırma
                            </span>
                            <h1 style={{
                                fontSize: "clamp(2.25rem, 6vw, 3.75rem)",
                                fontWeight: 800, color: "white",
                                lineHeight: 1.15, marginBottom: "1rem",
                                letterSpacing: "-0.03em"
                            }}>
                                İşletmenize Uygun{" "}
                                <span className="holographic-text">Planı Seçin</span>
                            </h1>
                            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.05rem", maxWidth: "500px", margin: "0 auto 2rem" }}>
                                14 gün ücretsiz deneyin. Kredi kartı gerekmez, memnun kalmazsanız ücret alınmaz.
                            </p>

                            {/* Toggle */}
                            <div style={{
                                display: "inline-flex", alignItems: "center", gap: "0",
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "9999px", padding: "0.3rem"
                            }}>
                                <button onClick={() => setYearly(false)} style={{
                                    padding: "0.5rem 1.25rem", borderRadius: "9999px", border: "none",
                                    cursor: "pointer", fontWeight: 600, fontSize: "0.875rem",
                                    fontFamily: "inherit", transition: "all 0.25s",
                                    background: !yearly ? "linear-gradient(135deg, #2563eb, #3b82f6)" : "transparent",
                                    color: !yearly ? "white" : "rgba(255,255,255,0.5)",
                                }}>Aylık</button>
                                <button onClick={() => setYearly(true)} style={{
                                    padding: "0.5rem 1.25rem", borderRadius: "9999px", border: "none",
                                    cursor: "pointer", fontWeight: 600, fontSize: "0.875rem",
                                    fontFamily: "inherit", transition: "all 0.25s",
                                    background: yearly ? "linear-gradient(135deg, #2563eb, #3b82f6)" : "transparent",
                                    color: yearly ? "white" : "rgba(255,255,255,0.5)",
                                    display: "flex", alignItems: "center", gap: "0.5rem"
                                }}>
                                    Yıllık
                                    <span style={{
                                        background: "#22c55e", color: "white",
                                        fontSize: "0.65rem", padding: "0.1rem 0.4rem",
                                        borderRadius: "9999px", fontWeight: 700
                                    }}>%20&apos;ye varan indirim</span>
                                </button>
                            </div>
                        </motion.div>

                        {/* Plans Grid */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                            gap: "1.25rem",
                            alignItems: "stretch"
                        }}>
                            {plans.map((plan) => (
                                <PlanCard key={plan.id} plan={plan} yearly={yearly} />
                            ))}
                        </div>

                        {/* Comparison Table */}
                        <ComparisonTable />

                        {/* CTA Banner */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            style={{
                                marginTop: "5rem",
                                background: "rgba(37,99,235,0.07)",
                                border: "1px solid rgba(37,99,235,0.2)",
                                borderRadius: "1.5rem",
                                padding: "3rem 2rem",
                                textAlign: "center"
                            }}
                        >
                            <div style={{
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                width: "3.5rem", height: "3.5rem", borderRadius: "1rem",
                                background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)",
                                marginBottom: "1.5rem"
                            }}>
                                <PhoneCall style={{ width: "1.5rem", height: "1.5rem", color: "#60a5fa" }} />
                            </div>
                            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, color: "white", marginBottom: "0.75rem" }}>
                                Hangi plan size uygun, emin değil misiniz?
                            </h2>
                            <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "2rem", maxWidth: "440px", margin: "0 auto 2rem", lineHeight: 1.7 }}>
                                Satış uzmanlarımız işletmenize özel en uygun planı belirlesinler. Ücretsiz danışmanlık alın.
                            </p>
                            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                                <Link href="/demo" className="btn-primary" style={{ fontSize: "0.95rem", padding: "0.875rem 2rem", display: "inline-flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
                                    Demo Talep Et <ArrowRight style={{ width: "1rem", height: "1rem" }} />
                                </Link>
                                <Link href="/#contact" style={{
                                    fontSize: "0.95rem", padding: "0.875rem 2rem",
                                    display: "inline-flex", alignItems: "center", gap: "0.5rem",
                                    borderRadius: "9999px", border: "1px solid rgba(255,255,255,0.15)",
                                    color: "rgba(255,255,255,0.75)", textDecoration: "none",
                                    fontWeight: 600, background: "transparent",
                                    transition: "all 0.2s"
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"; e.currentTarget.style.color = "white"; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "rgba(255,255,255,0.75)"; }}
                                >
                                    Bize Ulaşın
                                </Link>
                            </div>
                        </motion.div>

                        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.22)", fontSize: "0.85rem", marginTop: "2rem", lineHeight: 1.6 }}>
                            Tüm fiyatlara KDV dahil değildir. İstediğiniz zaman iptal edebilirsiniz.
                            <br />
                            <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.75rem" }}>
                                * Yapay zeka özellikleri (stok tahmini, satış analizi, otomatik kategorizasyon vb.) kullanım bazlı token ücretlendirmesine tabidir ve paket fiyatlarına dahil değildir.
                            </span>
                        </p>
                    </div>
                </div>

                <Footer />
            </main>
        </>
    );
}
