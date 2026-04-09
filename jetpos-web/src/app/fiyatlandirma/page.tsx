"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Check, ChevronDown, Zap, Star, ArrowRight,
    Barcode, FileText, Package, Wallet,
    Brain, Shield, Users, Building2, BarChart3, PhoneCall, HelpCircle, Globe, Utensils, X
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
                background: plan.highlight ? "rgba(5,150,105,0.07)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${plan.highlight ? "rgba(52,211,153,0.3)" : plan.badge === "⭐ En Popüler" ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: "1rem",
                padding: "1.25rem",
                display: "flex", flexDirection: "column", gap: "1rem",
                height: "100%",
                transition: "all 0.3s ease",
            }}>
                {/* Header */}
                <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "white", margin: 0 }}>
                            {plan.name}
                        </h3>
                        <span style={{
                            fontSize: "0.6rem", fontWeight: 700, color: plan.color,
                            background: `${plan.color}10`, border: `1px solid ${plan.color}20`,
                            padding: "0.15rem 0.5rem", borderRadius: "9999px"
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

/* ─── PAGE CONTENT ───────────────────────────────────── */
function FiyatlandirmaContent() {
    const searchParams = useSearchParams();
    const [yearly, setYearly] = useState(true);
    const [viewMode, setViewMode] = useState<"plans" | "custom">("plans");

    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab === "custom") setViewMode("custom");
    }, [searchParams]);

    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({ name: "", email: "", phone: "", company: "", message: "" });

    const FEATURES = [
        { 
            id: "pos", 
            label: "Hızlı Satış (POS)", 
            description: "Market, mağaza ve perakende noktaları için ultra hızlı barkodlu satış terminali.",
            detailed: "Saniyeler içinde fiş kesmenizi sağlar. Online/Offline çalışma özelliğiyle internet kesilse bile satışa devam edebilirsiniz. Terazi entegrasyonu ve dokunmatik ekran desteği mevcuttur.",
            benefit: "Kasa kuyruklarını %40 azaltın, saniyeler içinde fiş kesin.",
            icon: Barcode, 
            category: "Operasyon" 
        },
        { 
            id: "adisyon", 
            label: "Adisyon & Restoran", 
            description: "Masa takibi, mutfak yönetimi ve garson uygulaması ile tam entegre restoran çözümü.",
            detailed: "Masaları anlık görün, siparişleri mutfağa otomatik iletin. Reçete sistemi ile maliyet hesabı yapın. Yemeksepeti, Getir ve Trendyol Yemek entegrasyonu dahildir.",
            benefit: "Sipariş hatalarını sıfıra indirin, mutfak hızını artırın.",
            icon: Utensils, 
            category: "Restaurant & Cafe" 
        },
        { 
            id: "ecommerce", 
            label: "E-Ticaret Entegrasyonu", 
            description: "Shopify, Woocommerce ve İkas gibi platformlarla tam stok ve fiyat senkronizasyonu.", 
            detailed: "Fiziksel mağazanızdaki stoklar ile web sitenizdeki stoklar tek panelden yönetilir. Bir yerden satıldığında her yerde otomatik düşer. Fiyat güncellemeleri anlıktır.",
            benefit: "Stok hatalarını önleyin, manuel iş yükünü %90 azaltın.",
            icon: Globe, 
            category: "Pazaryeri" 
        },
        { 
            id: "products", 
            label: "Gelişmiş Stok Yönetimi", 
            description: "Kritik stok seviyesi uyarıları, varyantlı ürün takibi ve barkod etiket tasarımı.", 
            detailed: "Çoklu depo takibi yapabilir, depolar arası transferleri yönetebilirsiniz. Parti ve seri no takibi ile son kullanma tarihi yaklaşan ürünleri önceden görün.",
            benefit: "Kaybolan ürünleri engelleyin, deponuzdaki her kuruşu takip edin.",
            icon: Package, 
            category: "Operasyon" 
        },
        { 
            id: "sicak_satis", 
            label: "Sıcak Satış (Plasiyer)", 
            description: "Saha ekipleri için araçta fatura kesme ve tahsilat yönetimi modülü.", 
            detailed: "Plasiyerleriniz sahada telefon veya tabletten sipariş alabilir, fatura kesebilir. GPS takibi ile rota yönetimi ve anlık depo kontrolü sağlar.",
            benefit: "Saha verimliliğini %50 artırın, hatalı sevkiyatı önleyin.",
            icon: PhoneCall, 
            category: "Mobilite" 
        },
        { 
            id: "loyalty", 
            label: "Müşteri Sadakat (Puan)", 
            description: "Müşterilerinize alışveriş yaptıkça puan kazandırın, sadakati artırın.", 
            detailed: "Müşteri kartı veya telefon numarası ile puan toplama. Özel günlerde kampanya tanımlama (örn: Doğum gününde 2 kat puan). SMS marketing entegreli.",
            benefit: "Müşteri geri dönüş oranını %30 artırın.",
            icon: Star, 
            category: "Pazaryeri" 
        },
        { 
            id: "currency", 
            label: "Dövizli İşlemler", 
            description: "Dolar, Euro veya Altın bazlı satış yapma ve kasa tutma özelliği.", 
            detailed: "Merkez Bankası kurlarını otomatik çeker. Cari hesaplarınızı dövizli takip edebilir, raporlarınızı istediğiniz para birimiyle anlık olarak alabilirsiniz.",
            benefit: "Enflasyona karşı nakit akışınızı koruyun, kur kaybını önleyin.",
            icon: Wallet, 
            category: "Finansal" 
        },
        { 
            id: "cari_hesap", 
            label: "Cari & Veresiye Takibi", 
            description: "Müşteri ve tedarikçi limitleri, borç hatırlatıcı ve vadelendirme sistemi.", 
            detailed: "Ödeme gecikmelerinde otomatik hatırlatma. Risk analizi ve limit tanımlama. Hesap özetini tek tıkla PDF veya WhatsApp üzerinden gönderme.",
            benefit: "Alacaklarınızı zamanında toplayın, nakit akışınızı koruyun.",
            icon: Users, 
            category: "Finansal" 
        },
        { 
            id: "invoice", 
            label: "E-Fatura & E-Arşiv", 
            description: "Dosya kağıdı yerine resmi fatura düzenleme. QNB Finansbank garantisiyle.", 
            detailed: "BİS entegrasyonu ile tam yasal uyumluluk. İptal ve iade süreçleri kolayca yönetilir. Arşivleme süresi boyunca yasal saklama garantisi.",
            benefit: "Fatura maliyetlerini %80 düşürün, resmi süreçleri hızlandırın.",
            icon: FileText, 
            category: "Dijital Dönüşüm" 
        },
        { 
            id: "ai_insights", 
            label: "Yapay Zeka (JetAI)", 
            description: "Gelecek satışı tahmin eden ve ölü stokları uyaran akıllı asistan.", 
            detailed: "Mevsimsellik analizi ve talep tahmini. Karlılık odaklı stok önerileri. Robot asistan ile işletme durumu hakkında sesli veya yazılı rapor sunumu.",
            benefit: "Geleceği verilerle tahmin edin, rakiplerinizden öne geçin.",
            icon: Brain, 
            category: "İleri Teknoloji" 
        },
        { 
            id: "mobile_app", 
            label: "Uzaktan Yönetim Uygulaması", 
            description: "Mağazanızdan uzakta olsanız bile tüm satışları anlık takip edin.", 
            detailed: "iOS ve Android uyumlu yerel uygulama. Anlık bildirimler, canlı kasa durumu, personel performans raporları. Dünyanın her yerinden tam kontrol.",
            benefit: "İşletmenizin durumu her an avucunuzun içinde olsun.",
            icon: BarChart3, 
            category: "Mobilite" 
        },
    ];

    const [expandedDetails, setExpandedDetails] = useState<string[]>([]);

    const toggleDetail = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setExpandedDetails(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleFeature = (id: string) => {
        setSelectedFeatures(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
    };

    const categories = Array.from(new Set(FEATURES.map(f => f.category)));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const packageFeatures = selectedFeatures.map(id => FEATURES.find(x => x.id === id)?.label).join(", ");
        const payload = { ...formData, package_interest: "Custom Builder", message: `[KENDİ PAKETİNİ OLUŞTUR] Seçilen Özellikler: ${packageFeatures}\n\nNot: ${formData.message}` };
        try {
            const res = await fetch("/api/demo-request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            if (res.ok) { setSuccess(true); setShowForm(false); setSelectedFeatures([]); }
        } finally { setLoading(false); }
    };

    return (
        <>
            <div className="site-bg" />
            <main style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
                <Navbar />

                <div style={{ paddingTop: "7.5rem", paddingBottom: "7rem" }}>
                    <div className="site-container">

                        {/* Header */}
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", marginBottom: "4rem" }}>
                            <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "100px", padding: "0.25rem", marginBottom: "2.5rem" }}>
                                <button onClick={() => setViewMode("plans")} style={{ padding: "0.5rem 1.5rem", borderRadius: "100px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem", background: viewMode === "plans" ? "#2563eb" : "transparent", color: viewMode === "plans" ? "white" : "rgba(255,255,255,0.4)" }}>Standart</button>
                                <button onClick={() => setViewMode("custom")} style={{ padding: "0.5rem 1.5rem", borderRadius: "100px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem", background: viewMode === "custom" ? "#2563eb" : "transparent", color: viewMode === "custom" ? "white" : "rgba(255,255,255,0.4)" }}>Özel Paket</button>
                            </div>

                            <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, color: "white", marginBottom: "1rem", letterSpacing: "-0.03em" }}>
                                {viewMode === "plans" ? "Hızınıza Hız Katın" : "Sadece Gerekeni Seçin"}
                            </h1>
                            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "1rem", maxWidth: "550px", margin: "0 auto 2rem" }}>
                                {viewMode === "plans" 
                                    ? "Hazır paketlerimizden birini seçerek anında başlayın."
                                    : "İhtiyacın olmayan özelliklere para ödeme, kendi paketini yap."}
                            </p>

                            {viewMode === "plans" && (
                                <div style={{ display: "inline-flex", alignItems: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "100px", padding: "0.2rem" }}>
                                    <button onClick={() => setYearly(false)} style={{ padding: "0.4rem 1.25rem", borderRadius: "100px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.75rem", background: !yearly ? "white" : "transparent", color: !yearly ? "black" : "rgba(255,255,255,0.3)" }}>Aylık</button>
                                    <button onClick={() => setYearly(true)} style={{ padding: "0.4rem 1.25rem", borderRadius: "100px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.75rem", background: yearly ? "white" : "transparent", color: yearly ? "black" : "rgba(255,255,255,0.3)" }}>Yıllık</button>
                                </div>
                            )}
                        </motion.div>

                        <AnimatePresence mode="wait">
                            {viewMode === "plans" ? (
                                <motion.div key="plans" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "1rem" }}>
                                        {plans.map((p) => <PlanCard key={p.id} plan={p} yearly={yearly} />)}
                                    </div>
                                    <ComparisonTable />
                                </motion.div>
                            ) : (
                                <motion.div key="custom" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}>
                                    {categories.map((cat, idx) => (
                                        <div key={cat} style={{ marginBottom: idx === categories.length - 1 ? 0 : "3rem" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                                                <div style={{ height: "1px", flex: 1, background: "linear-gradient(to right, transparent, rgba(37,99,235,0.2))" }} />
                                                <h3 style={{ fontSize: "0.9rem", fontWeight: 800, color: "rgba(37,99,235,0.8)", textTransform: "uppercase", letterSpacing: "0.2em" }}>{cat}</h3>
                                                <div style={{ height: "1px", flex: 1, background: "linear-gradient(to left, transparent, rgba(37,99,235,0.2))" }} />
                                            </div>
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
                                                {FEATURES.filter(f => f.category === cat).map((f: any) => {
                                                    const active = selectedFeatures.includes(f.id);
                                                    const isExpanded = expandedDetails.includes(f.id);
                                                    return (
                                                        <motion.div key={f.id} layout style={{
                                                            background: active ? "rgba(37,99,235,0.08)" : "rgba(255,255,255,0.015)",
                                                            border: `1px solid ${active ? "rgba(37,99,235,0.3)" : "rgba(255,255,255,0.04)"}`,
                                                            borderRadius: "1.25rem", padding: "1.25rem", position: "relative", transition: "all 0.3s ease",
                                                            cursor: "pointer"
                                                        }} onClick={() => toggleFeature(f.id)}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                                                <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", background: active ? "#2563eb" : "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", color: active ? "white" : "rgba(255,255,255,0.25)", transition: "all 0.3s" }}>
                                                                    <f.icon style={{ width: "1.1rem", height: "1.1rem" }} />
                                                                </div>
                                                                <div style={{ flex: 1 }}>
                                                                    <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "white", marginBottom: "0.15rem" }}>{f.label}</h3>
                                                                    <button 
                                                                        onClick={(e) => toggleDetail(f.id, e)}
                                                                        style={{ 
                                                                            background: "none", border: "none", padding: 0, 
                                                                            color: "#3b82f6", fontSize: "0.7rem", fontWeight: 700, 
                                                                            cursor: "pointer", display: "flex", alignItems: "center", 
                                                                            gap: "0.25rem", position: "relative", zIndex: 10
                                                                        }}
                                                                    >
                                                                        {isExpanded ? "Kapat" : "Modül Hakkında"}
                                                                    </button>
                                                                </div>
                                                                {active && (
                                                                    <div style={{ background: "#2563eb", borderRadius: "50%", padding: "0.15rem", boxShadow: "0 0 10px rgba(37,99,235,0.3)" }}>
                                                                        <Check style={{ width: "0.75rem", height: "0.75rem", color: "white" }} strokeWidth={3} />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <AnimatePresence>
                                                                {isExpanded && (
                                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                                                                        <div style={{ paddingTop: "1rem", marginTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                                                                            <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.5, marginBottom: "0.75rem" }}>{f.detailed}</p>
                                                                            <div style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.1)", borderRadius: "0.75rem", padding: "0.75rem" }}>
                                                                                <div style={{ color: "#4ade80", fontSize: "0.65rem", fontWeight: 800, marginBottom: "0.2rem" }}>FAYDA:</div>
                                                                                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.8)", fontStyle: "italic" }}>"{f.benefit}"</div>
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Summary Bar */}
                        <AnimatePresence>
                            {selectedFeatures.length > 0 && viewMode === "custom" && (
                                <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} style={{
                                    position: "fixed", bottom: "3.5rem", left: "50%", transform: "translateX(-50%)",
                                    background: "rgba(10, 15, 25, 0.8)", backdropFilter: "blur(24px) saturate(180%)", border: "1px solid rgba(37,99,235,0.3)",
                                    padding: "1.25rem 3rem", borderRadius: "100px", display: "flex", alignItems: "center", gap: "3.5rem", zIndex: 1000, boxShadow: "0 30px 60px rgba(0,0,0,0.6)"
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                                        <div style={{ width: "3.25rem", height: "3.25rem", borderRadius: "50%", background: "linear-gradient(135deg, #2563eb, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "1.35rem", color: "white", boxShadow: "0 0 20px rgba(37,99,235,0.4)" }}>{selectedFeatures.length}</div>
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            <span style={{ fontWeight: 900, fontSize: "1.1rem", color: "white" }}>Harika Bir Paket!</span>
                                            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.45)" }}>Sizin için en uygun teklifi hazırlayalım</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowForm(true)} style={{ background: "#2563eb", color: "white", border: "none", padding: "1rem 3.5rem", borderRadius: "100px", fontWeight: 900, fontSize: "1rem", cursor: "pointer", transition: "all 0.3s", boxShadow: "0 8px 25px rgba(37,99,235,0.5)" }}>Teklifi İncele →</button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Modal Form */}
                        <AnimatePresence>
                            {showForm && (
                                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(16px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
                                    <motion.div initial={{ y: 50, scale: 0.9, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 50, scale: 0.9, opacity: 0 }} style={{ background: "#0a0c10", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "3rem", padding: "4rem", width: "100%", maxWidth: "600px", position: "relative", boxShadow: "0 40px 100px rgba(0,0,0,0.8)" }}>
                                        <button onClick={() => setShowForm(false)} style={{ position: "absolute", top: "2rem", right: "2rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", width: "3.5rem", height: "3.5rem", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X style={{ width: "1.5rem" }} /></button>
                                        
                                        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
                                            <div style={{ width: "4rem", height: "4rem", background: "rgba(37,99,235,0.15)", borderRadius: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}><Zap style={{ color: "#2563eb", width: "2rem" }} /></div>
                                            <h2 style={{ fontSize: "2.5rem", fontWeight: 950, marginBottom: "0.75rem", color: "white", letterSpacing: "-0.04em" }}>Neredeyse Bitti!</h2>
                                            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "1.1rem" }}>{selectedFeatures.length} modül içeren size özel yapılandırma için bir adım kaldı.</p>
                                        </div>

                                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                                    <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", fontWeight: 800, paddingLeft: "1rem" }}>AD SOYAD</label>
                                                    <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ padding: "1.25rem", borderRadius: "1.25rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", color: "white", fontSize: "1rem" }} />
                                                </div>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                                    <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", fontWeight: 800, paddingLeft: "1rem" }}>TELEFON NO</label>
                                                    <input required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={{ padding: "1.25rem", borderRadius: "1.25rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", color: "white", fontSize: "1rem" }} />
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                                <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", fontWeight: 800, paddingLeft: "1rem" }}>İŞLETME ADI</label>
                                                <input required value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} style={{ padding: "1.25rem", borderRadius: "1.25rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", color: "white", fontSize: "1rem" }} />
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                                <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", fontWeight: 800, paddingLeft: "1rem" }}>E-POSTA</label>
                                                <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ padding: "1.25rem", borderRadius: "1.25rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", color: "white", fontSize: "1rem" }} />
                                            </div>
                                            <button disabled={loading} style={{ marginTop: "1rem", background: "#2563eb", color: "white", border: "none", padding: "1.5rem", borderRadius: "1.5rem", fontWeight: 900, fontSize: "1.2rem", cursor: "pointer", transition: "all 0.3s", boxShadow: "0 10px 30px rgba(37,99,235,0.3)" }}>{loading ? "GÖNDERİLİYOR..." : "ÖZEL TEKLİFİMİ İLET"}</button>
                                        </form>
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>

                        <div style={{ marginTop: "7rem", textAlign: "center", color: "rgba(255,255,255,0.15)", fontSize: "0.9rem", lineHeight: 2 }}>
                            © 2026 JetPOS Teknolojileri A.Ş. Tüm hakları saklıdır.
                            <br />
                            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.1)" }}>Donanım gereksinimleri ve entegrasyon detayları için lütfen kullanım koşullarını inceleyin.</span>
                        </div>
                    </div>
                </div>
                <Footer />
            </main>
            {success && <motion.div initial={{ y: -100 }} animate={{ y: 20 }} style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", background: "#10b981", color: "white", padding: "1.25rem 3.5rem", borderRadius: "5rem", fontWeight: 900, fontSize: "1.1rem", zIndex: 10000, boxShadow: "0 20px 50px rgba(16,185,129,0.4)" }}>🚀 Harika! Talebiniz Alındı. <button onClick={() => setSuccess(false)} style={{ background: "none", border: "none", color: "white", marginLeft: "1.5rem", cursor: "pointer", fontSize: "1.25rem" }}>✕</button></motion.div>}
        </>
    );
}

export default function FiyatlandirmaPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
            <FiyatlandirmaContent />
        </Suspense>
    );
}
