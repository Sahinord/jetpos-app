"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Check, ChevronDown, Zap, Info, Star, ArrowRight,
    Barcode, FileText, Package, Wallet, CreditCard,
    Brain, Shield, Users, Building2, TrendingUp,
    Clock, Smartphone, Store, Truck, BarChart3
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/* ─── PLAN DATA ─────────────────────────────────────── */
const plans = [
    {
        id: "baslangic",
        name: "Aylık Paket",
        subtitle: "Esnek ödeme seçeneği ile başlangıç için idealdir. İstediğiniz zaman iptal edebilirsiniz.",
        monthlyPrice: 1499,
        yearlyPrice: 1249,
        highlight: false,
        badge: null,
        color: "#60a5fa",
        cta: "Bu Planı Seç",
        features: [
            { text: "7/24 Kişisel Teknik Destek", info: "Telefon, e-posta ve canlı chat" },
            { text: "Hızlı Satış Sistemi", info: "Barkod ile saniyeler içinde satış" },
            { text: "Mobil Üzerinden Barkodlu Satış", info: "iOS ve Android uyumlu" },
            { text: "Gelir Gider Takibi", info: null },
            { text: "Kasa - Gün Sonu Takibi", info: null },
            { text: "Kasiyer Takip", info: null },
            { text: "Detaylı Raporlandırma", info: null },
            { text: "Raporlama", info: null },
            { text: "E-Fatura", info: null },
            { text: "E-Arşiv", info: null },
            { text: "İşlem Takibi", info: null },
            { text: "Yapabileceğiniz", info: null },
            { text: "Stok Takibi", info: null },
            { text: "Cari (Müşteri) Takibi", info: null },
            { text: "Şube Sayısı: 1", info: null },
        ],
        extraFeatures: null,
        users: "1 Kullanıcı",
    },
    {
        id: "orta",
        name: "Orta Düzey İşletme",
        subtitle: "Yıllık ödeme ile %30 tasarruf edin. Profesyonel işletmeler için tüm temel özellikler dahil.",
        monthlyPrice: 1049,
        yearlyPrice: 733,
        highlight: false,
        badge: "%30 İndirim",
        badgeColor: "#22c55e",
        color: "#a78bfa",
        cta: "Bu Planı Seç",
        features: [
            { text: "7/24 Kişisel Teknik Destek", info: null },
            { text: "Hızlı Satış Sistemi", info: null },
            { text: "Mobil Üzerinden Barkodlu Satış", info: null },
            { text: "Gelir Gider Takibi", info: null },
            { text: "Kasa - Gün Sonu Takibi", info: null },
            { text: "Kasiyer Takip", info: null },
            { text: "Detaylı Raporlandırma", info: null },
            { text: "Raporlama", info: null },
            { text: "E-Fatura", info: null },
            { text: "E-Arşiv", info: null },
            { text: "İşlem Takibi", info: null },
            { text: "Stok Takibi", info: null },
            { text: "Cari (Müşteri) Takibi", info: null },
            { text: "Şube Sayısı: 1", info: null },
            { text: "Personel Takip", info: null },
            { text: "Teklif Oluşturma", info: null },
            { text: "Üretim Takibi", info: null },
            { text: "Depo Yönetimi", info: null },
        ],
        extraFeatures: {
            title: "Aylık Paket Pakete Ek Olarak;",
            subtitle: "Bu pakete özel avantajlar",
            items: [
                "Hızlı Satış Sistemi",
                "Mobil Üzerinden Barkodlu Satış",
                "Kasiyer Takip",
                "Raporlama",
                "Masraf Takibi",
            ]
        },
        users: "1 Kullanıcı",
    },
    {
        id: "ileri",
        name: "İleri Düzey İşletme",
        subtitle: "Gelişmiş özellikler ve 100 kontör hediyesiyle işletmenizi bir üst seviyeye taşıyın.",
        monthlyPrice: 1470,
        yearlyPrice: 883,
        highlight: false,
        badge: "%40 İndirim",
        badgeColor: "#f59e0b",
        color: "#34d399",
        cta: "Bu Planı Seç",
        features: [
            { text: "7/24 Kişisel Teknik Destek", info: null },
            { text: "Hızlı Satış Sistemi", info: null },
            { text: "Mobil Üzerinden Barkodlu Satış", info: null },
            { text: "Detaylı Raporlandırma", info: null },
            { text: "E-Fatura", info: null },
            { text: "E-Arşiv", info: null },
            { text: "Mağaza Takip", info: null },
        ],
        extraFeatures: {
            title: "Orta Düzey İşletme Pakete Ek Olarak;",
            subtitle: "Bu pakete özel avantajlar",
            items: [
                "100 Adet Kontör",
                "Detaylı Raporlandırma",
                "E-Fatura",
                "E-Arşiv",
                "Mağaza Takip",
            ]
        },
        users: "3 Kullanıcı",
    },
    {
        id: "kurumsal",
        name: "2 Yıl + 1 Yıl Bizden Paketi",
        subtitle: null,
        monthlyPrice: null,
        yearlyPrice: 543,
        originalYearly: 18750,
        highlight: true,
        badge: "En Çok Tercih Edilen",
        badgeColor: "#2563eb",
        color: "#60a5fa",
        cta: "Bu Planı Seç",
        features: [
            { text: "+1 Yıl", info: "Hediye", tag: "Hediye", tagColor: "#22c55e" },
            { text: "Barkod Okuyucu", info: null, tag: "Hediye", tagColor: "#22c55e" },
            { text: "Şube Sayısı: 3", info: null },
            { text: "Geçiş Desteği", info: null, tag: "Ücretsiz", tagColor: "#a78bfa" },
            { text: "Cari Kasa Virman", info: null },
        ],
        extraFeatures: {
            title: "İleri Düzey İşletme Pakete Ek Olarak;",
            subtitle: "Bu pakete özel avantajlar",
            items: [
                "+1 Yıl",
                "Barkod Okuyucu",
                "Şube Sayısı: 3",
                "Geçiş Desteği",
                "Cari Kasa Virman",
            ],
            itemTags: ["Hediye", "Hediye", null, "Ücretsiz", null]
        },
        users: "3 Kullanıcı",
        footnote: "✓ 3 yıl kullanım / Barkod okuyucu hediye / 1 yıl hediye",
    },
];

/* ─── FEATURE COMPARISON TABLE ─────────────────────── */
const featureCategories = [
    {
        title: "Satış & POS",
        icon: Barcode,
        features: [
            { name: "Hızlı Satış Sistemi", plans: [true, true, true, true] },
            { name: "Barkodlu Satış", plans: [true, true, true, true] },
            { name: "Mobil Barkod Okuma", plans: [true, true, true, true] },
            { name: "Kasiyer Takip", plans: [true, true, true, true] },
            { name: "Mağaza Takip", plans: [false, false, true, true] },
        ]
    },
    {
        title: "Finans & Muhasebe",
        icon: Wallet,
        features: [
            { name: "E-Fatura", plans: [true, true, true, true] },
            { name: "E-Arşiv", plans: [true, true, true, true] },
            { name: "Gelir Gider Takibi", plans: [true, true, true, true] },
            { name: "Kasa Gün Sonu", plans: [true, true, true, true] },
            { name: "Masraf Takibi", plans: [false, true, true, true] },
            { name: "Cari Kasa Virman", plans: [false, false, false, true] },
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
        title: "Müşteri & Cari",
        icon: Users,
        features: [
            { name: "Cari (Müşteri) Takibi", plans: [true, true, true, true] },
            { name: "Personel Takip", plans: [false, true, true, true] },
            { name: "100 Adet Kontör", plans: [false, false, true, true] },
        ]
    },
    {
        title: "Raporlama & Analiz",
        icon: BarChart3,
        features: [
            { name: "Temel Raporlama", plans: [true, true, true, true] },
            { name: "Detaylı Raporlandırma", plans: [true, true, true, true] },
            { name: "İşlem Takibi", plans: [true, true, true, true] },
        ]
    },
    {
        title: "Destek & Ekstra",
        icon: Shield,
        features: [
            { name: "7/24 Teknik Destek", plans: [true, true, true, true] },
            { name: "Şube Sayısı", plans: ["1", "1", "3", "3"] },
            { name: "Geçiş Desteği", plans: [false, false, false, "Ücretsiz"] },
            { name: "Barkod Okuyucu", plans: [false, false, false, "Hediye"] },
            { name: "+1 Yıl Bonus", plans: [false, false, false, "Hediye"] },
        ]
    },
];

/* ─── PLAN CARD ─────────────────────────────────────── */
function PlanCard({ plan, yearly }: { plan: typeof plans[0]; yearly: boolean }) {
    const [expanded, setExpanded] = useState(false);
    const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
    const visibleFeatures = expanded ? plan.features : plan.features.slice(0, 8);

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
                    background: plan.highlight ? "linear-gradient(135deg, #1d4ed8, #2563eb)" : plan.badgeColor,
                    color: "white", fontSize: "0.7rem", fontWeight: 700,
                    padding: "0.3rem 1rem", borderRadius: "0 0 0.625rem 0.625rem",
                    whiteSpace: "nowrap", zIndex: 10, letterSpacing: "0.04em"
                }}>
                    {plan.highlight && <Star style={{ width: "0.7rem", height: "0.7rem", display: "inline", marginRight: "0.25rem" }} />}
                    {plan.badge}
                </div>
            )}

            <div style={{
                background: plan.highlight ? "rgba(37,99,235,0.1)" : "rgba(255,255,255,0.025)",
                border: `1px solid ${plan.highlight ? "rgba(37,99,235,0.45)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: "1.25rem",
                padding: "1.75rem 1.5rem",
                display: "flex", flexDirection: "column", gap: "1.25rem",
                height: "100%",
                boxShadow: plan.highlight ? "0 0 40px rgba(37,99,235,0.18)" : "none",
                transition: "all 0.3s ease",
            }}>
                {/* Header */}
                <div>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "white", marginBottom: "0.5rem" }}>
                        {plan.name}
                    </h3>
                    {plan.subtitle && (
                        <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
                            {plan.subtitle}
                        </p>
                    )}
                </div>

                {/* Price */}
                <div>
                    {plan.originalYearly && (
                        <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.35)", textDecoration: "line-through", marginBottom: "0.25rem" }}>
                            ₺{plan.originalYearly.toLocaleString("tr-TR")} +KDV
                        </div>
                    )}
                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem" }}>
                        <span style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>₺</span>
                        <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "white", lineHeight: 1 }}>
                            {price?.toLocaleString("tr-TR") ?? "—"}
                        </span>
                        <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>/ay +KDV</span>
                    </div>
                    {plan.monthlyPrice && yearly && (
                        <p style={{ fontSize: "0.75rem", color: "#4ade80", marginTop: "0.25rem" }}>
                            Yıllık ₺{((plan.monthlyPrice - (plan.yearlyPrice ?? 0)) * 12).toLocaleString("tr-TR")} tasarruf
                        </p>
                    )}
                </div>

                {/* CTA */}
                <button style={{
                    width: "100%", padding: "0.75rem",
                    borderRadius: "0.75rem", border: "none",
                    background: plan.highlight
                        ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
                        : "rgba(255,255,255,0.06)",
                    color: "white", fontWeight: 600, fontSize: "0.9rem",
                    cursor: "pointer", transition: "all 0.25s",
                    fontFamily: "inherit",
                    boxShadow: plan.highlight ? "0 4px 16px rgba(37,99,235,0.4)" : "none"
                }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                >
                    {plan.cta}
                </button>

                {/* Divider */}
                <div style={{ height: "1px", background: "rgba(255,255,255,0.07)" }} />

                {/* Features */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", flex: 1 }}>
                    {visibleFeatures.map((f, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Check style={{ width: "0.875rem", height: "0.875rem", color: plan.color, flexShrink: 0 }} />
                            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.75)", flex: 1 }}>{f.text}</span>
                            {(f as { text: string; info: string | null; tag?: string; tagColor?: string }).tag && (
                                <span style={{
                                    fontSize: "0.65rem", fontWeight: 700,
                                    padding: "0.15rem 0.5rem", borderRadius: "9999px",
                                    background: `${(f as { text: string; info: string | null; tag?: string; tagColor?: string }).tagColor}20`,
                                    color: (f as { text: string; info: string | null; tag?: string; tagColor?: string }).tagColor,
                                    border: `1px solid ${(f as { text: string; info: string | null; tag?: string; tagColor?: string }).tagColor}40`
                                }}>
                                    {(f as { text: string; info: string | null; tag?: string; tagColor?: string }).tag}
                                </span>
                            )}
                            {f.info && !((f as { text: string; info: string | null; tag?: string }).tag) && (
                                <Info style={{ width: "0.75rem", height: "0.75rem", color: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Expand toggle */}
                {plan.features.length > 8 && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        style={{
                            display: "flex", alignItems: "center", gap: "0.375rem",
                            background: "none", border: "none", cursor: "pointer",
                            color: plan.color, fontSize: "0.8rem", fontWeight: 600,
                            fontFamily: "inherit", padding: 0
                        }}
                    >
                        {expanded ? "Daha Az Göster" : "Tüm Özellikler"}
                        <ChevronDown style={{
                            width: "0.875rem", height: "0.875rem",
                            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s"
                        }} />
                    </button>
                )}

                {/* Extra features */}
                {plan.extraFeatures && (
                    <div style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "0.875rem",
                        padding: "1rem"
                    }}>
                        <p style={{ fontSize: "0.78rem", fontWeight: 700, color: plan.color, marginBottom: "0.25rem" }}>
                            {plan.extraFeatures.title}
                        </p>
                        <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", marginBottom: "0.75rem" }}>
                            {plan.extraFeatures.subtitle}
                        </p>
                        {plan.extraFeatures.items.map((item, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                <Check style={{ width: "0.75rem", height: "0.75rem", color: plan.color, flexShrink: 0 }} />
                                <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.65)", flex: 1 }}>{item}</span>
                                {plan.extraFeatures.itemTags?.[i] && (
                                    <span style={{
                                        fontSize: "0.6rem", fontWeight: 700,
                                        padding: "0.1rem 0.4rem", borderRadius: "9999px",
                                        background: plan.extraFeatures.itemTags[i] === "Hediye" ? "rgba(34,197,94,0.15)" : "rgba(167,139,250,0.15)",
                                        color: plan.extraFeatures.itemTags[i] === "Hediye" ? "#4ade80" : "#a78bfa",
                                    }}>
                                        {plan.extraFeatures.itemTags[i]}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Footnote */}
                {plan.footnote && (
                    <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
                        {plan.footnote}
                    </p>
                )}
            </div>
        </motion.div>
    );
}

/* ─── COMPARISON TABLE ──────────────────────────────── */
function ComparisonTable() {
    const [open, setOpen] = useState(false);

    return (
        <div style={{ marginTop: "5rem" }}>
            <button
                onClick={() => setOpen(!open)}
                style={{
                    display: "flex", alignItems: "center", gap: "0.625rem",
                    margin: "0 auto", background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)", borderRadius: "0.75rem",
                    padding: "0.75rem 1.75rem", color: "white", fontWeight: 600,
                    fontSize: "0.95rem", cursor: "pointer", fontFamily: "inherit",
                    transition: "all 0.2s"
                }}
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
                        transition={{ duration: 0.4 }}
                        style={{ overflow: "hidden", marginTop: "2rem" }}
                    >
                        <div style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.07)",
                            borderRadius: "1.25rem",
                            overflow: "hidden"
                        }}>
                            {/* Header row */}
                            <div style={{
                                display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                                background: "rgba(255,255,255,0.04)",
                                borderBottom: "1px solid rgba(255,255,255,0.07)",
                                padding: "1rem 1.5rem", gap: "0.5rem"
                            }}>
                                <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Özellik</div>
                                {plans.map(p => (
                                    <div key={p.id} style={{ fontSize: "0.75rem", fontWeight: 700, color: p.color, textAlign: "center" }}>
                                        {p.name.split(" ").slice(0, 2).join(" ")}
                                    </div>
                                ))}
                            </div>

                            {featureCategories.map((cat, ci) => (
                                <div key={ci}>
                                    {/* Category header */}
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: "0.5rem",
                                        padding: "0.75rem 1.5rem",
                                        background: "rgba(255,255,255,0.02)",
                                        borderTop: ci > 0 ? "1px solid rgba(255,255,255,0.05)" : "none"
                                    }}>
                                        <cat.icon style={{ width: "0.875rem", height: "0.875rem", color: "rgba(255,255,255,0.4)" }} />
                                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                            {cat.title}
                                        </span>
                                    </div>

                                    {cat.features.map((feat, fi) => (
                                        <div key={fi} style={{
                                            display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                                            padding: "0.625rem 1.5rem", gap: "0.5rem",
                                            borderTop: "1px solid rgba(255,255,255,0.04)",
                                            alignItems: "center"
                                        }}>
                                            <span style={{ fontSize: "0.825rem", color: "rgba(255,255,255,0.7)" }}>{feat.name}</span>
                                            {feat.plans.map((val, pi) => (
                                                <div key={pi} style={{ display: "flex", justifyContent: "center" }}>
                                                    {val === true ? (
                                                        <Check style={{ width: "1rem", height: "1rem", color: plans[pi].color }} />
                                                    ) : val === false ? (
                                                        <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.875rem" }}>—</span>
                                                    ) : (
                                                        <span style={{
                                                            fontSize: "0.65rem", fontWeight: 700,
                                                            padding: "0.15rem 0.5rem", borderRadius: "9999px",
                                                            background: "rgba(34,197,94,0.15)", color: "#4ade80"
                                                        }}>{val}</span>
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
                                Fiyatlandırma
                            </span>
                            <h1 style={{
                                fontSize: "clamp(2.25rem, 6vw, 4rem)",
                                fontWeight: 800, color: "white",
                                lineHeight: 1.15, marginBottom: "1rem",
                                letterSpacing: "-0.03em"
                            }}>
                                İşletmenize Uygun{" "}
                                <span className="holographic-text">Planı Seçin</span>
                            </h1>
                            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.05rem", maxWidth: "500px", margin: "0 auto 2rem" }}>
                                Tüm planlar 14 gün ücretsiz deneme ile gelir. Memnun kalmazsanız ücret alınmaz.
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
                                    }}>%40&apos;a varan indirim</span>
                                </button>
                            </div>
                        </motion.div>

                        {/* Plans Grid */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                            gap: "1.25rem",
                            alignItems: "start"
                        }}>
                            {plans.map((plan) => (
                                <PlanCard key={plan.id} plan={plan} yearly={yearly} />
                            ))}
                        </div>

                        {/* Comparison Table */}
                        <ComparisonTable />

                        {/* FAQ / Bottom CTA */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            style={{
                                marginTop: "5rem",
                                background: "rgba(37,99,235,0.08)",
                                border: "1px solid rgba(37,99,235,0.25)",
                                borderRadius: "1.5rem",
                                padding: "3rem",
                                textAlign: "center"
                            }}
                        >
                            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700, color: "white", marginBottom: "1rem" }}>
                                Hangi planın size uygun olduğundan emin değil misiniz?
                            </h2>
                            <p style={{ color: "rgba(255,255,255,0.55)", marginBottom: "2rem", maxWidth: "480px", margin: "0 auto 2rem" }}>
                                Uzmanlarımız işletmenize en uygun planı belirlemenize yardımcı olsun.
                            </p>
                            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                                <button className="btn-primary" style={{ fontSize: "1rem", padding: "0.875rem 2rem" }}>
                                    Demo Talep Et
                                    <ArrowRight style={{ width: "1rem", height: "1rem" }} />
                                </button>
                                <button className="btn-outline" style={{ fontSize: "1rem", padding: "0.875rem 2rem" }}>
                                    Bize Ulaşın
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>

                <Footer />
            </main>
        </>
    );
}
