"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Check, ChevronDown, Zap, Star, ArrowRight,
    Barcode, FileText, Package, Wallet,
    Brain, Shield, Users, Building2, BarChart3, PhoneCall, HelpCircle, Globe, Utensils, X, Eye,
    Store, ShoppingCart, Coffee, ShoppingBag, Heart, QrCode,
    Award, Medal, BadgeCheck, Sparkles, Flame
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

/* ─── PLAN DATA ─────────────────────────────────────── */
const plans = [
    {
        id: "baslangic",
        name: "JetStart",
        period: "Aylık · Taahhütsüz",
        subtitle: "Taahhütsüz, esnek ödeme. İstediğiniz zaman iptal edebilirsiniz.",
        monthlyPrice: 1149,
        yearlyPrice: 1149,
        highlight: false,
        badge: "Taahhütsüz",
        badgeColor: "#7886C7",
        color: "#7886C7",
        cta: "14 Gün Ücretsiz Dene",
        users: "1 Kullanıcı",
        features: [
            { text: "Hızlı Satış (POS) — nakit & kartlı" },
            { text: "Offline Satış — internet kesilse de çalışır" },
            { text: "Satış Geçmişi" },
            { text: "Barkodlu Satış & Mobil Barkod Okuma" },
            { text: "Stok Uyarıları — kritik seviye otomatik uyarı" },
            { text: "Ürün Etiketleri & Barkod Yazdırma" },
            { text: "Arşiv & Geri Dönüşüm" },
            { text: "Temel Satış Raporları" },
            { text: "Müşteri Ekranı (CFD)" },
            { text: "Nakit Çekmece Desteği" },
            { text: "Fiş Düzenleyicisi — logo & vergi bilgisi" },
            { text: "QR Kod Oluşturucu" },
            { text: "Döviz Çevirici — canlı kurlar" },
            { text: "7/24 Teknik Destek" },
        ],
        notIncluded: [
            "JetMuhasebe Modülü",
            "Yapay Zeka Analizleri",
            "Depo Yönetimi",
            "CRM & Sadakat Sistemi",
            "Pazaryeri Entegrasyonları",
            "Adisyon / Mutfak Ekranı",
        ],
        extras: null,
    },
    {
        id: "buyume",
        name: "JetPro",
        period: "Yıllık · %30 Tasarruf",
        subtitle: "E-Fatura, AI analizleri ve gelişmiş muhasebe dahil.",
        monthlyPrice: 1149,
        yearlyPrice: 799,
        highlight: false,
        badge: "⭐ En Popüler",
        badgeColor: "#7886C7",
        color: "#7886C7",
        taksit: "Vade Farksız 3 Taksit",
        cta: "14 Gün Ücretsiz Dene",
        users: "3 Kullanıcı",
        features: [
            { text: "JetStart'ın tüm özellikleri" },
            { text: "Depo Yönetimi — çoklu depo & fiyat" },
            { text: "Cari Hesap Takibi (müşteri & tedarikçi)" },
            { text: "Borç / Alacak / Virman Dekontu" },
            { text: "Kasa & Banka İşlemleri" },
            { text: "Alış & Satış Faturası / İrsaliyesi" },
            { text: "İade Faturası" },
            { text: "Mali Takvim — vergi & ödeme takvimi" },
            { text: "Gider Yönetimi" },
            { text: "Kâr Hesaplama — ürün bazlı" },
            { text: "Kâr Pilotu (AI) — kârlılık stratejileri" },
            { text: "Akıllı Sepet (AI) — kampanya önerileri" },
            { text: "Fiyat Simülasyonu" },
            { text: "Müşteri Analizi (AI) — sadakat özeti" },
            { text: "Müşteri Segmentleri — VIP, Risk, Yeni" },
            { text: "Sadakat Puan Sistemi" },
            { text: "Personel Tanımlama & Vardiya Takibi" },
            { text: "Personel Yetki Sistemi — rol bazlı erişim" },
            { text: "Detaylı Satış Raporları" },
        ],
        notIncluded: [
            "Adisyon & Mutfak Ekranı (KDS)",
            "Pazaryeri Entegrasyonları",
            "Çoklu Şube",
            "JetQR Dijital Menü",
            "Vitrin Tasarımı",
        ],
        extras: {
            label: "JetStart Pakete Ek;",
            group: "Gelişmiş İşletme Özellikleri",
            items: [
                { icon: "FileText", text: "Fatura & İrsaliye Yönetimi" },
                { icon: "Brain", text: "Yapay Zeka Analizleri" },
                { icon: "Package", text: "Depo Yönetimi" },
                { icon: "Wallet", text: "Cari Hesap & Muhasebe" },
                { icon: "Users", text: "Personel & Vardiya" },
                { icon: "BarChart3", text: "CRM & Sadakat Sistemi" },
            ],
        },
    },
    {
        id: "pro",
        name: "JetMax",
        period: "2 Yıl Öde · 3 Yıl Kullan",
        subtitle: "2 yıl öde, 3 yıl kullan. Sınırsız kullanıcı ve barkod okuyucu hediye.",
        monthlyPrice: 549,
        yearlyPrice: 549,
        originalYearly: 21255,
        highlight: true,
        badge: "⚡ En İyi Değer",
        badgeColor: "#5A659F",
        color: "#5A659F",
        taksit: "Vade Farksız 3 Taksit",
        cta: "Hemen Başla",
        users: "Sınırsız",
        features: [
            { text: "JetPro'nun tüm özellikleri" },
            { text: "Çoklu Şube / Depo (3'e kadar)" },
            { text: "Sınırsız Kullanıcı" },
            { text: "Masa Yönetimi (Adisyon)" },
            { text: "Mutfak Ekranı (KDS)" },
            { text: "Trendyol Pazaryeri entegrasyonu" },
            { text: "Trendyol GO & Yemek siparişleri" },
            { text: "Yemeksepeti entegrasyonu" },
            { text: "Getir entegrasyonu" },
            { text: "Hepsiburada & HepsiJet entegrasyonu" },
            { text: "Stok Eritme (AI) — yavaş satış tasfiyesi" },
            { text: "AI Öngörüleri — büyüme analizleri" },
            { text: "JetQR — dijital menü tasarımı & yayını" },
            { text: "Vitrin Tasarımı — özel landing page" },
            { text: "Akıllı Dönüştürücü — PDF, Word, görsel" },
            { text: "Sistem Kayıtları (Audit Log)" },
            { text: "+1 Yıl Kullanım Hediye" },
        ],
        notIncluded: [],
        footnote: "✓ 3 yıl kullanım · Barkod okuyucu hediye · 1 yıl bonus",
        extras: {
            label: "JetPro Pakete Ek;",
            group: "Büyüme & Zincir Özellikleri",
            items: [
                { icon: "Building2", text: "Çoklu Şube (3'e kadar)" },
                { icon: "Users", text: "Sınırsız Kullanıcı" },
                { icon: "Globe", text: "Pazaryeri Entegrasyonları" },
                { icon: "Utensils", text: "Adisyon & Mutfak Ekranı" },
                { icon: "Zap", text: "+1 Yıl Kullanım Hediye" },
            ],
        },
    },
    {
        id: "ozel",
        name: "Kurumsal",
        period: "Özel Teklif",
        subtitle: "Çok şubeli zincirler ve büyük ölçekli işletmeler için özel çözüm.",
        monthlyPrice: 0,
        yearlyPrice: 0,
        highlight: false,
        badge: "Teklif Al",
        badgeColor: "#9AA7DF",
        color: "#9AA7DF",
        isCustom: true,
        cta: "Bize Ulaşın",
        users: "Sınırsız",
        features: [
            { text: "JetMax'ın tüm özellikleri" },
            { text: "Sınırsız Şube & Depo" },
            { text: "Sınırsız Kullanıcı" },
            { text: "Beyaz Etiket — kendi markanızla" },
            { text: "Özel API Erişimi & ERP Entegrasyonu" },
            { text: "Özel Entegrasyon Geliştirme" },
            { text: "Özel Raporlama & KPI Paneli" },
            { text: "SLA Garantisi" },
            { text: "Dedicated Hesap Yöneticisi" },
            { text: "Yerinde Kurulum & Ekip Eğitimi" },
            { text: "7/24 Öncelikli Telefon Desteği" },
            { text: "Tüm Pazaryeri Entegrasyonları (Trendyol, Yemeksepeti, Getir, Hepsiburada)" },
            { text: "Masa Yönetimi & Mutfak Ekranı (KDS)" },
            { text: "JetQR Dijital Menü & Vitrin Tasarımı" },
            { text: "Sistem Kayıtları (Audit Log)" },
            { text: "JetMuhasebe — Tam Muhasebe Modülü" },
            { text: "CRM & Sadakat Puan Sistemi" },
            { text: "Personel & Vardiya Yönetimi" },
            { text: "AI Destekli Kâr Pilotu & Stok Eritme" },
            { text: "Akıllı Dönüştürücü (PDF, Word, görsel)" },
            { text: "Özel Onboarding Süreci" },
        ],
        notIncluded: [],
        extras: {
            label: "JetMax Pakete Ek;",
            group: "Kurumsal & Zincir Özellikleri",
            items: [
                { icon: "Building2", text: "Sınırsız Şube & Depo" },
                { icon: "Users", text: "Sınırsız Kullanıcı" },
                { icon: "Shield", text: "SLA Garantisi" },
                { icon: "Globe", text: "Özel API & ERP Entegrasyonu" },
                { icon: "Star", text: "Beyaz Etiket (White-label)" },
                { icon: "PhoneCall", text: "Dedicated Hesap Yöneticisi" },
            ],
        },
    },
];

/* ─── COMPARISON ──────────────────────────────── */
const featureCategories = [
    {
        title: "JetKasa — Satış & POS",
        icon: Barcode,
        features: [
            { name: "Hızlı Satış (POS)", plans: [true, true, true, true] },
            { name: "Offline Satış", plans: [true, true, true, true] },
            { name: "Satış Geçmişi", plans: [true, true, true, true] },
            { name: "Barkodlu Satış & Mobil Okuma", plans: [true, true, true, true] },
            { name: "Nakit Çekmece", plans: [true, true, true, true] },
        ]
    },
    {
        title: "JetStok — Ürün & Depo",
        icon: Package,
        features: [
            { name: "Ürün Listesi", plans: [true, true, true, true] },
            { name: "Stok Uyarıları", plans: [true, true, true, true] },
            { name: "Ürün Etiketleri & Barkod Yazdırma", plans: [true, true, true, true] },
            { name: "Arşiv & Geri Dönüşüm", plans: [true, true, true, true] },
            { name: "Depo Yönetimi (çoklu depo)", plans: [false, true, true, true] },
        ]
    },
    {
        title: "JetMuhasebe — Finans",
        icon: Wallet,
        features: [
            { name: "Cari Hesap Takibi", plans: [false, true, true, true] },
            { name: "Kasa & Banka İşlemleri", plans: [false, true, true, true] },
            { name: "Alış / Satış Faturası & İrsaliyesi", plans: [false, true, true, true] },
            { name: "İade Faturası", plans: [false, true, true, true] },
            { name: "Mali Takvim", plans: [false, true, true, true] },
            { name: "Gider Yönetimi", plans: [false, true, true, true] },
            { name: "Kâr Hesaplama", plans: [false, true, true, true] },
        ]
    },
    {
        title: "JetMasa — Restoran & Kafe",
        icon: Utensils,
        features: [
            { name: "Masa Yönetimi (Adisyon)", plans: [false, false, true, true] },
            { name: "Mutfak Ekranı (KDS)", plans: [false, false, true, true] },
        ]
    },
    {
        title: "JetRapor — AI & Analiz",
        icon: Brain,
        features: [
            { name: "Temel Satış Raporları", plans: [true, true, true, true] },
            { name: "Detaylı Satış Raporları", plans: [false, true, true, true] },
            { name: "Kâr Pilotu (AI)", plans: [false, true, true, true] },
            { name: "Akıllı Sepet (AI)", plans: [false, true, true, true] },
            { name: "Fiyat Simülasyonu", plans: [false, true, true, true] },
            { name: "Stok Eritme (AI)", plans: [false, false, true, true] },
            { name: "AI Öngörüleri", plans: [false, false, true, true] },
            { name: "Özel KPI Raporları", plans: [false, false, false, true] },
        ]
    },
    {
        title: "JetEntegre — Pazaryeri",
        icon: Globe,
        features: [
            { name: "Trendyol Pazaryeri", plans: [false, false, true, true] },
            { name: "Trendyol GO & Yemek", plans: [false, false, true, true] },
            { name: "Yemeksepeti", plans: [false, false, true, true] },
            { name: "Getir", plans: [false, false, true, true] },
            { name: "Hepsiburada & HepsiJet", plans: [false, false, true, true] },
            { name: "Özel API Erişimi", plans: [false, false, false, true] },
            { name: "ERP Entegrasyonu", plans: [false, false, false, true] },
        ]
    },
    {
        title: "JetPuan — CRM & Sadakat",
        icon: Users,
        features: [
            { name: "Müşteri Analizi (AI)", plans: [false, true, true, true] },
            { name: "Müşteri Segmentleri", plans: [false, true, true, true] },
            { name: "Sadakat Puan Sistemi", plans: [false, true, true, true] },
            { name: "Personel & Vardiya Takibi", plans: [false, true, true, true] },
            { name: "Personel Yetki Sistemi", plans: [false, true, true, true] },
        ]
    },
    {
        title: "JetWeb & Dijital",
        icon: Shield,
        features: [
            { name: "JetQR — Dijital Menü", plans: [false, false, true, true] },
            { name: "Vitrin Tasarımı (Landing Page)", plans: [false, false, true, true] },
            { name: "Beyaz Etiket (White-label)", plans: [false, false, false, true] },
        ]
    },
    {
        title: "Altyapı & Destek",
        icon: BarChart3,
        features: [
            { name: "Kullanıcı Sayısı", plans: ["1", "3", "Sınırsız", "Sınırsız"] },
            { name: "Şube / Depo", plans: ["1", "1", "3", "Sınırsız"] },
            { name: "Müşteri Ekranı (CFD)", plans: [true, true, true, true] },
            { name: "Sistem Kayıtları (Audit Log)", plans: [false, false, true, true] },
            { name: "Barkod Okuyucu", plans: [false, false, "Hediye", true] },
            { name: "7/24 Teknik Destek", plans: [true, true, true, true] },
            { name: "Öncelikli Telefon Desteği", plans: [false, false, false, true] },
            { name: "SLA Garantisi", plans: [false, false, false, true] },
        ]
    },
];

/* ─── CYCLING CHIP ─────────────────────────────────── */
function CyclingChip({ items, chipStyle }: {
    items: { text: string; Icon: React.ElementType }[];
    chipStyle: React.CSSProperties;
}) {
    const [idx, setIdx] = useState(0);
    useEffect(() => {
        if (items.length < 2) return;
        const t = setInterval(() => setIdx(i => (i + 1) % items.length), 2500);
        return () => clearInterval(t);
    }, [items.length]);
    const { text, Icon } = items[idx];
    return (
        <div style={{
            display: "inline-flex", alignItems: "center",
            fontSize: "0.6rem", fontWeight: 700,
            padding: "0.22rem 0.6rem", borderRadius: "9999px",
            overflow: "hidden", whiteSpace: "nowrap",
            minWidth: "7rem", justifyContent: "center",
            ...chipStyle,
        }}>
            <AnimatePresence mode="wait">
                <motion.span
                    key={idx}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
                >
                    <Icon style={{ width: "0.65rem", height: "0.65rem", flexShrink: 0 }} />
                    {text}
                </motion.span>
            </AnimatePresence>
        </div>
    );
}

/* ─── PLAN CARD ─────────────────────────────────────── */
function PlanCard({ plan, yearly, onBuy }: { plan: typeof plans[0]; yearly: boolean; onBuy?: (plan: typeof plans[0], yearly: boolean) => void }) {
    const [expanded, setExpanded] = useState(false);
    const isCustom = (plan as any).isCustom;
    const isPaid = !isCustom && plan.id !== "baslangic";
    const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
    const visibleFeatures = expanded ? plan.features : plan.features.slice(0, 7);

    return (
        <>
        <style>{`
            @keyframes shimmerBadge {
                0%   { background-position: -250% center; }
                100% { background-position: 250% center; }
            }
            @keyframes pulseBadge {
                0%, 100% { box-shadow: 0 0 0 0 rgba(120,134,199,0.35); }
                50%       { box-shadow: 0 0 0 5px rgba(120,134,199,0); }
            }
            .pricing-plan-card {
                box-shadow: 0 1px 2px rgba(17,24,39,0.04);
            }
            .pricing-plan-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 16px 32px rgba(90,101,159,0.16);
            }
        `}</style>
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ position: "relative", display: "flex", flexDirection: "column" }}
        >
            {/* Badge */}
            {plan.badge && (
                <div style={{
                    position: "absolute", top: "-1px", left: "50%", transform: "translateX(-50%)",
                    background: plan.highlight
                        ? "linear-gradient(90deg,#4a5899,#7886C7,#9faee8,#7886C7,#4a5899)"
                        : plan.badge?.includes("Popüler")
                            ? "linear-gradient(90deg,#6d3fc5,#8b5cf6,#a78bfa,#8b5cf6,#6d3fc5)"
                            : plan.badgeColor,
                    backgroundSize: (plan.highlight || plan.badge?.includes("Popüler")) ? "250% auto" : "auto",
                    animation: (plan.highlight || plan.badge?.includes("Popüler")) ? "shimmerBadge 3s linear infinite" : undefined,
                    color: "white", fontSize: "0.68rem", fontWeight: 700,
                    padding: "0.3rem 1rem", borderRadius: "0 0 0.625rem 0.625rem",
                    whiteSpace: "nowrap", zIndex: 10, letterSpacing: "0.05em",
                }}>
                    {plan.badge}
                </div>
            )}

            <div className="pricing-plan-card" style={{
                background: plan.highlight ? "rgba(120,134,199,0.04)" : "white",
                border: `1px solid ${plan.highlight ? "rgba(90,101,159,0.3)" : plan.badge === "⭐ En Popüler" ? "rgba(139,92,246,0.3)" : "rgba(120,134,199,0.15)"}`,
                borderRadius: "1rem",
                padding: "1.25rem",
                display: "flex", flexDirection: "column", gap: "1rem",
                height: "100%",
                transition: "transform 0.25s ease, box-shadow 0.25s ease",
            }}>
                {/* Header */}
                <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111827", margin: 0 }}>
                            {plan.name}
                        </h3>
                        {/* Cycling chip badge */}
                        {(() => {
                            const isHighlight = plan.highlight;
                            const isPopular = plan.badge?.includes("Popüler");
                            const isTaahhut = plan.badge === "Taahhütsüz";

                            if (isHighlight) {
                                return <CyclingChip
                                    items={[
                                        { text: "En Çok Tercih Edilen", Icon: Award },
                                        { text: "Sınırsız Kullanıcı", Icon: Users },
                                        { text: "En İyi Değer", Icon: Flame },
                                    ]}
                                    chipStyle={{
                                        background: "linear-gradient(90deg,#4a5899,#7886C7,#9faee8,#7886C7,#4a5899)",
                                        backgroundSize: "250% auto",
                                        animation: "shimmerBadge 3s linear infinite",
                                        color: "white",
                                    }}
                                />;
                            }
                            if (isPopular) {
                                return <CyclingChip
                                    items={[
                                        { text: "En Popüler Seçim", Icon: Medal },
                                        { text: "Sınırsız Ürün", Icon: Package },
                                        { text: "3 Taksit İmkanı", Icon: Wallet },
                                    ]}
                                    chipStyle={{
                                        background: "linear-gradient(90deg,#6d3fc5,#8b5cf6,#a78bfa,#8b5cf6,#6d3fc5)",
                                        backgroundSize: "250% auto",
                                        animation: "shimmerBadge 3s linear infinite",
                                        color: "white",
                                    }}
                                />;
                            }
                            if (isTaahhut) {
                                return <CyclingChip
                                    items={[
                                        { text: "14 Gün Ücretsiz", Icon: Sparkles },
                                        { text: "Kredi Kartı Yok", Icon: BadgeCheck },
                                        { text: "Anında İptal", Icon: Zap },
                                    ]}
                                    chipStyle={{
                                        background: "rgba(120,134,199,0.08)",
                                        border: "1px solid rgba(120,134,199,0.3)",
                                        color: "#7886C7",
                                    }}
                                />;
                            }
                            return <CyclingChip
                                items={[
                                    { text: "White-label", Icon: Star },
                                    { text: "SLA Garantisi", Icon: Shield },
                                    { text: "Sınırsız Şube", Icon: Building2 },
                                ]}
                                chipStyle={{
                                    background: "rgba(154,167,223,0.08)",
                                    border: "1px solid rgba(154,167,223,0.25)",
                                    color: "#9AA7DF",
                                }}
                            />;
                        })()}
                    </div>
                    <p style={{ fontSize: "0.7rem", color: plan.color, fontWeight: 600, marginBottom: "0.5rem" }}>
                        {plan.period}
                    </p>
                    <p style={{ fontSize: "0.85rem", color: "#4B5563", lineHeight: 1.5, minHeight: "2.55rem" }}>
                        {plan.subtitle}
                    </p>
                </div>

                {/* Price */}
                <div>
                    {isCustom ? (
                        <div>
                            <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111827" }}>Teklif Bazlı</span>
                            <p style={{ fontSize: "0.8rem", color: plan.color, fontWeight: 600, marginTop: "0.25rem" }}>İşletmenize özel fiyat</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "0.2rem" }}>
                                <span style={{ fontSize: "1rem", color: "#4B5563", fontWeight: 700 }}>₺</span>
                                <span style={{ fontSize: "3rem", fontWeight: 900, color: "#111827", lineHeight: 1 }}>
                                    {price?.toLocaleString("tr-TR")}
                                </span>
                                <span style={{ fontSize: "0.85rem", color: "#6B7280" }}>+KDV/ay</span>
                            </div>
                            {/* Karşılaştırma satırı — her kartta aynı yükseklikte, yoksa boş bırakılır (buton hizası için) */}
                            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.35rem", minHeight: "1.15rem" }}>
                                {(plan as any).originalYearly && plan.monthlyPrice === plan.yearlyPrice ? (
                                    <span style={{ fontSize: "0.75rem", color: "#9CA3AF", textDecoration: "line-through" }}>
                                        ₺{(plan as any).originalYearly.toLocaleString("tr-TR")} +KDV/ay
                                    </span>
                                ) : plan.monthlyPrice > plan.yearlyPrice ? (
                                    <>
                                        <span style={{ fontSize: "0.75rem", color: "#9CA3AF", textDecoration: "line-through" }}>
                                            ₺{(plan.monthlyPrice * 12).toLocaleString("tr-TR")}
                                        </span>
                                        <span style={{ fontSize: "0.75rem", color: "#4ade80", fontWeight: 700 }}>
                                            ₺{(plan.yearlyPrice * 12).toLocaleString("tr-TR")}/yıl +KDV
                                        </span>
                                    </>
                                ) : null}
                            </div>
                        </>
                    )}
                </div>

                {/* CTA */}
                {!isCustom ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {(() => {
                            const isTrial = !yearly || plan.badge === "Taahhütsüz";
                            return (
                                <>
                                    <button
                                        onClick={() => onBuy?.(plan, yearly)}
                                        style={{
                                            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
                                            width: "100%", padding: "0.9rem",
                                            borderRadius: "0.875rem", border: "none",
                                            background: isTrial
                                                ? "linear-gradient(135deg, #22c55e, #16a34a)"
                                                : plan.highlight
                                                    ? "linear-gradient(135deg, #5A659F, #7886C7)"
                                                    : "linear-gradient(135deg, #7886C7, #9AA7DF)",
                                            color: "white", fontWeight: 700, fontSize: "0.95rem",
                                            cursor: "pointer",
                                            boxShadow: isTrial
                                                ? "0 4px 16px rgba(34,197,94,0.3)"
                                                : plan.highlight ? "0 4px 16px rgba(90,101,159,0.3)" : "0 4px 16px rgba(120,134,199,0.3)",
                                        }}
                                    >
                                        {isTrial ? (
                                            <><Sparkles style={{ width: "0.9rem", height: "0.9rem" }} /> 14 Gün Ücretsiz Dene</>
                                        ) : (
                                            <><PhoneCall style={{ width: "0.9rem", height: "0.9rem" }} /> Sizi Arayalım</>
                                        )}
                                    </button>
                                </>
                            );
                        })()}
                    </div>
                ) : (
                    <button
                        onClick={() => onBuy?.(plan, yearly)}
                        style={{
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
                            width: "100%", padding: "0.9rem",
                            borderRadius: "0.875rem", border: "none",
                            background: "linear-gradient(135deg, #7886C7, #5A659F)",
                            color: "white", fontWeight: 700, fontSize: "0.95rem",
                            cursor: "pointer",
                            boxShadow: "0 4px 16px rgba(120,134,199,0.3)",
                        }}
                    >
                        <PhoneCall style={{ width: "0.9rem", height: "0.9rem" }} />
                        Teklif İsteyin
                    </button>
                )}

                <div style={{ height: "1px", background: "rgba(120, 134, 199, 0.12)" }} />

                {/* Extras — "X Pakete Ek;" section */}
                {(plan as any).extras && (() => {
                    const extras = (plan as any).extras;
                    const iconMap: Record<string, React.ElementType> = {
                        FileText, Brain, Package, Wallet, Users, BarChart3, Building2, Globe, Barcode, Zap, Shield, Star, PhoneCall, Utensils, Heart, QrCode, Store, ShoppingCart, Coffee, ShoppingBag,
                    };
                    return (
                        <div>
                            <p style={{ fontSize: "0.78rem", color: "#6B7280", fontWeight: 600, marginBottom: "0.625rem" }}>
                                {extras.label}
                            </p>
                            <div style={{
                                background: "rgba(120,134,199,0.05)",
                                border: "1px solid rgba(120,134,199,0.15)",
                                borderRadius: "0.75rem",
                                padding: "0.875rem",
                                marginBottom: "0.75rem",
                            }}>
                                <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#374151", marginBottom: "0.625rem" }}>
                                    {extras.group}
                                </p>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                    {extras.items.map((item: { icon: string; text: string }, i: number) => {
                                        const Icon = iconMap[item.icon] || Check;
                                        return (
                                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                <div style={{
                                                    width: "1.5rem", height: "1.5rem", borderRadius: "0.375rem",
                                                    background: "rgba(120,134,199,0.1)", display: "flex",
                                                    alignItems: "center", justifyContent: "center", flexShrink: 0,
                                                }}>
                                                    <Icon style={{ width: "0.75rem", height: "0.75rem", color: "#7886C7" }} />
                                                </div>
                                                <span style={{ fontSize: "0.8rem", color: "#374151", fontWeight: 500 }}>{item.text}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Features */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", flex: 1 }}>
                    {visibleFeatures.map((f: any, i: number) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Check style={{ width: "0.875rem", height: "0.875rem", color: plan.color, flexShrink: 0 }} />
                            <span style={{ fontSize: "0.83rem", color: "#374151", flex: 1 }}>{f.text}</span>
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
                            <span style={{ width: "0.875rem", height: "0.875rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.7rem", color: "#6B7280" }}>✕</span>
                            <span style={{ fontSize: "0.83rem", color: "#6B7280", textDecoration: "line-through" }}>{f}</span>
                        </div>
                    ))}
                </div>

                {/* Expand */}
                {plan.features.length > 7 && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        style={{
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem",
                            background: "white", border: "1px solid rgba(120, 134, 199, 0.15)",
                            cursor: "pointer", borderRadius: "0.5rem",
                            color: "#6B7280", fontSize: "0.78rem", fontWeight: 600,
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
                    <p style={{ fontSize: "0.68rem", color: "#9CA3AF", textAlign: "center" }}>
                        {(plan as any).footnote}
                    </p>
                )}
            </div>
        </motion.div>
        </>
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
                    margin: "0 auto", background: "white",
                    border: "1px solid rgba(120, 134, 199, 0.2)", borderRadius: "0.75rem",
                    padding: "0.75rem 1.75rem", color: "#374151", fontWeight: 600,
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
                            background: "white",
                            border: "1px solid rgba(120, 134, 199, 0.15)",
                            borderRadius: "1.25rem", overflow: "auto"
                        }}>
                            {/* Header */}
                            <div style={{
                                display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr",
                                background: "white",
                                borderBottom: "1px solid rgba(120, 134, 199, 0.15)",
                                padding: "1rem 1.5rem", gap: "0.5rem", minWidth: "600px"
                            }}>
                                <div style={{ fontSize: "0.75rem", color: "#4B5563", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Özellik</div>
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
                                        background: "#F8FAFC",
                                        borderTop: ci > 0 ? "1px solid rgba(120, 134, 199, 0.1)" : "none",
                                        minWidth: "600px"
                                    }}>
                                        <cat.icon style={{ width: "0.8rem", height: "0.8rem", color: "#4B5563" }} />
                                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                            {cat.title}
                                        </span>
                                    </div>

                                    {cat.features.map((feat, fi) => (
                                        <div key={fi} style={{
                                            display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr",
                                            padding: "0.6rem 1.5rem", gap: "0.5rem",
                                            borderTop: "1px solid rgba(120, 134, 199, 0.1)",
                                            alignItems: "center", minWidth: "600px",
                                        }}>
                                            <span style={{ fontSize: "0.82rem", color: "#4B5563" }}>{feat.name}</span>
                                            {feat.plans.map((val, pi) => (
                                                <div key={pi} style={{ display: "flex", justifyContent: "center" }}>
                                                    {val === true ? (
                                                        <Check style={{ width: "0.9rem", height: "0.9rem", color: planColors[pi] }} />
                                                    ) : val === false ? (
                                                        <span style={{ color: "#D1D5DB", fontSize: "0.8rem" }}>—</span>
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

/* ─── CALL MODAL ─────────────────────────────────────── */
function CallModal({ plan, yearly, onClose }: { plan: typeof plans[0]; yearly: boolean; onClose: () => void }) {
    const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
    const [form, setForm] = useState({ ad: "", soyad: "", telefon: "", email: "", sirket: "" });
    const [kvkk, setKvkk] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.ad || !form.soyad || !form.telefon || !form.email || !form.sirket) {
            setError("Lütfen tüm alanları doldurun.");
            return;
        }
        if (!kvkk) {
            setError("Kullanıcı sözleşmesini ve gizlilik politikasını kabul etmelisiniz.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/demo-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: `${form.ad} ${form.soyad}`,
                    email: form.email,
                    phone: form.telefon,
                    company: form.sirket,
                    package_interest: plan.name,
                    message: `[SİZİ ARAYALIM] Paket: ${plan.name} · ${price > 0 ? `₺${price?.toLocaleString("tr-TR")}/ay` : "Kurumsal Teklif"}`,
                }),
            });
            if (res.ok) setSuccess(true);
            else setError("Bir hata oluştu, lütfen tekrar deneyin.");
        } catch {
            setError("Bağlantı hatası, lütfen tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: "100%", padding: "0.75rem 1rem",
        border: "1.5px solid rgba(120,134,199,0.2)", borderRadius: "0.75rem",
        fontSize: "0.9rem", color: "#111827", outline: "none",
        background: "rgba(120,134,199,0.03)", boxSizing: "border-box",
        fontFamily: "inherit", transition: "border-color 0.2s",
    };

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem",
        }} onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "white", borderRadius: "1.5rem",
                    padding: "2rem", width: "100%", maxWidth: "420px",
                    boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
                }}
            >
                {success ? (
                    /* ── Success state ── */
                    <div style={{ textAlign: "center", padding: "1rem 0" }}>
                        <motion.div
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200 }}
                            style={{
                                width: "4rem", height: "4rem", borderRadius: "50%",
                                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                margin: "0 auto 1.25rem",
                            }}
                        >
                            <Check style={{ width: "2rem", height: "2rem", color: "white" }} strokeWidth={3} />
                        </motion.div>
                        <h2 style={{ fontSize: "1.3rem", fontWeight: 900, color: "#111827", marginBottom: "0.5rem" }}>
                            Talebiniz Alındı!
                        </h2>
                        <p style={{ color: "#4B5563", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                            En kısa sürede sizi arayacağız.<br />
                            <span style={{ color: "#7886C7", fontWeight: 700 }}>{plan.name}</span> paketini konuşacağız ve ödeme linkini ileteceğiz.
                        </p>
                        <button onClick={onClose} style={{
                            background: "linear-gradient(135deg, #7886C7, #5A659F)",
                            color: "white", border: "none", borderRadius: "0.75rem",
                            padding: "0.75rem 2rem", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem",
                        }}>Tamam</button>
                    </div>
                ) : (
                    /* ── Form state ── */
                    <>
                        {/* Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                                    <PhoneCall style={{ width: "1rem", height: "1rem", color: "#7886C7" }} />
                                    <span style={{ fontSize: "1.2rem", fontWeight: 900, color: "#111827" }}>Sizi Arayalım</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#7886C7", background: "rgba(120,134,199,0.1)", padding: "0.15rem 0.6rem", borderRadius: "9999px" }}>
                                        {plan.name}
                                    </span>
                                    {price > 0 && (
                                        <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>
                                            ₺{price?.toLocaleString("tr-TR")}/ay
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: "0.25rem" }}>
                                <X style={{ width: "1.25rem", height: "1.25rem" }} />
                            </button>
                        </div>

                        <p style={{ fontSize: "0.85rem", color: "#6B7280", marginBottom: "1.25rem", lineHeight: 1.6 }}>
                            Bilgilerinizi bırakın, sizi arayıp paketi etkinleştiriyoruz.
                        </p>

                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                                <input
                                    placeholder="Ad"
                                    value={form.ad}
                                    onChange={e => setForm(f => ({ ...f, ad: e.target.value }))}
                                    style={inputStyle}
                                />
                                <input
                                    placeholder="Soyad"
                                    value={form.soyad}
                                    onChange={e => setForm(f => ({ ...f, soyad: e.target.value }))}
                                    style={inputStyle}
                                />
                            </div>
                            <input
                                placeholder="Telefon Numarası"
                                type="tel"
                                value={form.telefon}
                                onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))}
                                style={inputStyle}
                            />
                            <input
                                placeholder="E-posta Adresi"
                                type="email"
                                value={form.email}
                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                style={inputStyle}
                            />
                            <input
                                placeholder="Şirket / İşletme Adı"
                                value={form.sirket}
                                onChange={e => setForm(f => ({ ...f, sirket: e.target.value }))}
                                style={inputStyle}
                            />

                            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", cursor: "pointer", marginTop: "0.25rem" }}>
                                <div
                                    onClick={() => setKvkk(v => !v)}
                                    style={{
                                        width: "1.1rem", height: "1.1rem", flexShrink: 0, marginTop: "0.1rem",
                                        borderRadius: "0.3rem", border: `2px solid ${kvkk ? "#7886C7" : "rgba(120,134,199,0.35)"}`,
                                        background: kvkk ? "#7886C7" : "white",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        transition: "all 0.15s",
                                    }}
                                >
                                    {kvkk && <Check style={{ width: "0.65rem", height: "0.65rem", color: "white" }} strokeWidth={3} />}
                                </div>
                                <span style={{ fontSize: "0.75rem", color: "#6B7280", lineHeight: 1.5 }}>
                                    <a href="/gizlilik" target="_blank" style={{ color: "#7886C7", fontWeight: 600, textDecoration: "none" }}>Kullanıcı Sözleşmesi</a>'ni ve{" "}
                                    <a href="/gizlilik" target="_blank" style={{ color: "#7886C7", fontWeight: 600, textDecoration: "none" }}>Gizlilik Politikası</a>'nı okudum, kabul ediyorum.
                                </span>
                            </label>

                            {error && (
                                <p style={{ fontSize: "0.78rem", color: "#ef4444", margin: 0 }}>{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                                    padding: "0.875rem", borderRadius: "0.875rem", border: "none",
                                    background: loading ? "#9CA3AF" : "linear-gradient(135deg, #7886C7, #5A659F)",
                                    color: "white", fontWeight: 700, fontSize: "0.95rem",
                                    cursor: loading ? "not-allowed" : "pointer",
                                    boxShadow: loading ? "none" : "0 4px 16px rgba(120,134,199,0.4)",
                                    marginTop: "0.25rem",
                                }}
                            >
                                {loading ? (
                                    "Gönderiliyor..."
                                ) : (
                                    <>
                                        <PhoneCall style={{ width: "0.95rem", height: "0.95rem" }} />
                                        Sizi Arasınlar
                                        <ArrowRight style={{ width: "0.95rem", height: "0.95rem" }} />
                                    </>
                                )}
                            </button>
                        </form>

                        <p style={{ fontSize: "0.7rem", color: "#9CA3AF", textAlign: "center", marginTop: "1rem" }}>
                            Bilgileriniz yalnızca sizinle iletişim amacıyla kullanılır.
                        </p>
                    </>
                )}
            </motion.div>
        </div>
    );
}

/* ─── PAGE CONTENT ───────────────────────────────────── */
/* ─── SECTOR PLANS ──────────────────────────────────── */
type SectorKey = "standart" | "restoran" | "kafe";

const SECTOR_PLANS: Record<SectorKey, typeof plans> = {
    standart: plans,
    restoran: [
        {
            id: "baslangic", name: "JetRestoran", period: "Aylık · Taahhütsüz",
            subtitle: "KDS, JetQR, pazaryeri ve adisyon dahil — tüm restoran araçları tek pakette.",
            monthlyPrice: 1299, yearlyPrice: 1299,
            highlight: false, badge: "Taahhütsüz", badgeColor: "#7886C7", color: "#7886C7",
            cta: "14 Gün Ücretsiz Dene", users: "Sınırsız",
            features: [
                { text: "Hızlı POS Satış — nakit, kartlı, QR ödeme" },
                { text: "Masa & Adisyon Yönetimi — sınırsız masa" },
                { text: "Mutfak Ekranı (KDS) — anlık sipariş akışı" },
                { text: "JetQR Dijital Menü — masadan telefonla sipariş" },
                { text: "Garson Uygulaması — mobilden sipariş alma" },
                { text: "Yemeksepeti Entegrasyonu" },
                { text: "Getir Entegrasyonu" },
                { text: "Trendyol GO & Yemek" },
                { text: "Stok Takibi & Kritik Uyarılar" },
                { text: "Personel & Vardiya Takibi" },
                { text: "Cari Hesap Yönetimi" },
                { text: "Fatura & İrsaliye" },
                { text: "Detaylı Satış & Kâr Raporları" },
                { text: "7/24 Teknik Destek" },
            ],
            notIncluded: ["Hepsiburada Entegrasyonu", "CRM & Sadakat", "AI Analizler", "Çoklu Şube"],
            extras: null,
        },
        {
            id: "pro", name: "JetRestoran Pro", period: "Yıllık · Yılda ₺4.800 Tasarruf",
            subtitle: "AI analizleri, CRM ve çoklu şube — yıllık ödeme ile %31 indirim.",
            monthlyPrice: 1299, yearlyPrice: 899,
            originalYearly: 15588,
            highlight: true, badge: "⚡ %31 Tasarruf", badgeColor: "#5A659F", color: "#5A659F",
            taksit: "Vade Farksız 3 Taksit",
            cta: "Hemen Başla", users: "Sınırsız",
            features: [
                { text: "JetRestoran'ın tüm özellikleri" },
                { text: "Hepsiburada & Hepsi Yemek Entegrasyonu" },
                { text: "CRM & Müşteri Sadakat Puan Sistemi" },
                { text: "Müşteri Segmentleri (AI) — VIP, Risk, Yeni" },
                { text: "Kâr Pilotu (AI) — kârlılık optimizasyonu" },
                { text: "Stok Eritme (AI) — fire ve israfı azalt" },
                { text: "AI Büyüme Öngörüleri — işletme analizi" },
                { text: "Çoklu Şube (2'ye kadar)" },
                { text: "Vitrin Tasarımı & Online Katalog" },
                { text: "Audit Log — kritik sistem kayıtları" },
                { text: "+6 Ay Ücretsiz Kullanım" },
            ],
            notIncluded: [],
            footnote: "✓ Yıllık ₺10.788 · Yılda ₺4.800 tasarruf · Barkod okuyucu hediye",
            extras: {
                label: "JetRestoran Pakete Ek;",
                group: "Pro Özellikler",
                items: [
                    { icon: "Globe", text: "Hepsiburada & Hepsi Yemek" },
                    { icon: "Heart", text: "CRM & Sadakat Puan Sistemi" },
                    { icon: "Brain", text: "Kâr Pilotu & AI Öngörüleri" },
                    { icon: "Building2", text: "Çoklu Şube (2'ye kadar)" },
                    { icon: "QrCode", text: "Vitrin & Online Katalog" },
                    { icon: "Zap", text: "+6 Ay Ücretsiz Kullanım" },
                ],
            },
        },
    ],
    kafe: [
        {
            id: "baslangic", name: "JetStarter", period: "Aylık · Taahhütsüz",
            subtitle: "Küçük kafe ve kahveciler için hızlı başlangıç.",
            monthlyPrice: 1149, yearlyPrice: 1149,
            highlight: false, badge: "Taahhütsüz", badgeColor: "#7886C7", color: "#7886C7",
            cta: "14 Gün Ücretsiz Dene", users: "1 Kullanıcı",
            features: [
                { text: "Hızlı Satış (POS)" },
                { text: "Masa Yönetimi (Adisyon)" },
                { text: "Mutfak Ekranı (KDS)" },
                { text: "Stok Takibi" },
                { text: "Temel Raporlar" },
                { text: "7/24 Teknik Destek" },
            ],
            notIncluded: ["Pazaryeri Entegrasyonları", "Personel Takibi", "AI Analizler"],
            extras: null,
        },
        {
            id: "buyume", name: "JetPro", period: "Yıllık · %30 Tasarruf",
            subtitle: "Trendyol GO ve Yemeksepeti ile büyüyen kafeler için.",
            monthlyPrice: 1149, yearlyPrice: 799,
            highlight: false, badge: "⭐ En Popüler", badgeColor: "#7886C7", color: "#7886C7",
            taksit: "Vade Farksız 3 Taksit",
            cta: "14 Gün Ücretsiz Dene", users: "3 Kullanıcı",
            features: [
                { text: "JetStarter'ın tüm özellikleri" },
                { text: "Trendyol GO & Yemek" },
                { text: "Yemeksepeti Entegrasyonu" },
                { text: "Getir Entegrasyonu" },
                { text: "Personel & Vardiya Takibi" },
                { text: "Cari Hesap" },
                { text: "Kâr Pilotu (AI)" },
            ],
            notIncluded: ["Çoklu Şube", "Sınırsız Kullanıcı"],
            extras: {
                label: "JetStarter Pakete Ek;",
                group: "Büyüyen Kafe Özellikleri",
                items: [
                    { icon: "Globe", text: "Trendyol GO & Yemeksepeti" },
                    { icon: "Zap", text: "Getir Entegrasyonu" },
                    { icon: "Users", text: "Personel & Vardiya" },
                    { icon: "Wallet", text: "Cari Hesap" },
                    { icon: "Brain", text: "Kâr Pilotu (AI)" },
                    { icon: "BarChart3", text: "Detaylı Raporlama" },
                ],
            },
        },
        {
            id: "pro", name: "JetPlus", period: "2 Yıl Öde · 3 Yıl Kullan",
            subtitle: "Zincir kafe ve çok şubeli işletmeler için.",
            monthlyPrice: 549, yearlyPrice: 549,
            originalYearly: 21255,
            highlight: true, badge: "⚡ En İyi Değer", badgeColor: "#5A659F", color: "#5A659F",
            taksit: "Vade Farksız 3 Taksit",
            cta: "Hemen Başla", users: "Sınırsız",
            features: [
                { text: "JetPro'nun tüm özellikleri" },
                { text: "Çoklu Şube (3'e kadar)" },
                { text: "Sınırsız Kullanıcı" },
                { text: "CRM & Sadakat Puan Sistemi" },
                { text: "AI Öngörüleri" },
                { text: "+1 Yıl Kullanım Hediye" },
            ],
            notIncluded: [],
            footnote: "✓ 3 yıl kullanım · Barkod okuyucu hediye · 1 yıl bonus",
            extras: {
                label: "JetPro Pakete Ek;",
                group: "Zincir Kafe Özellikleri",
                items: [
                    { icon: "Building2", text: "Çoklu Şube (3'e kadar)" },
                    { icon: "Users", text: "Sınırsız Kullanıcı" },
                    { icon: "Heart", text: "CRM & Sadakat" },
                    { icon: "Brain", text: "AI Öngörüleri" },
                    { icon: "Zap", text: "+1 Yıl Kullanım Hediye" },
                ],
            },
        },
        {
            id: "ozel", name: "Kurumsal", period: "Özel Teklif",
            subtitle: "Franchise ve çok şubeli kafe zincirleri için.",
            monthlyPrice: 0, yearlyPrice: 0,
            highlight: false, badge: "Teklif Al", badgeColor: "#9AA7DF", color: "#9AA7DF",
            isCustom: true, cta: "Bize Ulaşın", users: "Sınırsız",
            features: [
                { text: "JetPlus'ın tüm özellikleri" },
                { text: "Sınırsız Şube & Kullanıcı" },
                { text: "Özel API & ERP Entegrasyonu" },
                { text: "Beyaz Etiket (White-label)" },
                { text: "SLA Garantisi" },
                { text: "Dedicated Hesap Yöneticisi" },
            ],
            notIncluded: [],
            extras: {
                label: "JetPlus Pakete Ek;",
                group: "Kurumsal & Zincir Özellikleri",
                items: [
                    { icon: "Building2", text: "Sınırsız Şube & Kullanıcı" },
                    { icon: "Globe", text: "Özel API & ERP Entegrasyonu" },
                    { icon: "Star", text: "Beyaz Etiket (White-label)" },
                    { icon: "Shield", text: "SLA Garantisi" },
                    { icon: "PhoneCall", text: "Dedicated Hesap Yöneticisi" },
                    { icon: "Zap", text: "Özel Entegrasyon Geliştirme" },
                ],
            },
        },
    ],
};

const SECTORS: { id: SectorKey; label: string; Icon: React.ElementType }[] = [
    { id: "standart", label: "JetPos", Icon: Store },
    { id: "restoran", label: "Restoran", Icon: Utensils },
    { id: "kafe", label: "Kafe", Icon: Coffee },
];

function FiyatlandirmaContent() {
    const searchParams = useSearchParams();
    const [yearly, setYearly] = useState(true);
    const [viewMode, setViewMode] = useState<"plans" | "custom">("plans");
    const [sector, setSector] = useState<SectorKey>("standart");
    const [callModal, setCallModal] = useState<{ plan: typeof plans[0]; yearly: boolean } | null>(null);
    const activePlans = SECTOR_PLANS[sector].filter(p => !(p as any).isCustom);

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
            label: "JetKasa (POS)",
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
                            <div style={{ display: "inline-flex", background: "white", border: "1px solid rgba(120, 134, 199, 0.15)", borderRadius: "100px", padding: "0.25rem", marginBottom: "2.5rem" }}>
                                <button onClick={() => setViewMode("plans")} style={{ padding: "0.5rem 1.5rem", borderRadius: "100px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem", background: viewMode === "plans" ? "#7886C7" : "transparent", color: viewMode === "plans" ? "white" : "#6B7280" }}>Standart</button>
                                <button onClick={() => setViewMode("custom")} style={{ padding: "0.5rem 1.5rem", borderRadius: "100px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem", background: viewMode === "custom" ? "#7886C7" : "transparent", color: viewMode === "custom" ? "white" : "#6B7280" }}>Özel Paket</button>
                            </div>

                            <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, color: "#111827", marginBottom: "1rem", letterSpacing: "-0.03em" }}>
                                {viewMode === "plans" ? "Hızınıza Hız Katın" : "Sadece Gerekeni Seçin"}
                            </h1>
                            <p style={{ color: "#4B5563", fontSize: "1rem", maxWidth: "550px", margin: "0 auto 2rem" }}>
                                {viewMode === "plans"
                                    ? "Hazır paketlerimizden birini seçerek anında başlayın."
                                    : "İhtiyacın olmayan özelliklere para ödeme, kendi paketini yap."}
                            </p>

                            {viewMode === "plans" && (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                                    {/* Aylık / Yıllık toggle */}
                                    <div style={{ display: "inline-flex", alignItems: "center", background: "white", border: "1px solid rgba(120, 134, 199, 0.15)", borderRadius: "100px", padding: "0.2rem" }}>
                                        <button onClick={() => setYearly(false)} style={{ padding: "0.4rem 1.25rem", borderRadius: "100px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.75rem", background: !yearly ? "#7886C7" : "transparent", color: !yearly ? "white" : "#6B7280" }}>Aylık</button>
                                        <button onClick={() => setYearly(true)} style={{ padding: "0.4rem 1.25rem", borderRadius: "100px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.75rem", background: yearly ? "#7886C7" : "transparent", color: yearly ? "white" : "#6B7280" }}>Yıllık</button>
                                    </div>

                                    {/* Sektör seçici */}
                                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", background: "white", border: "1px solid rgba(120, 134, 199, 0.15)", borderRadius: "100px", padding: "0.25rem" }}>
                                        {SECTORS.map((s) => (
                                            <button
                                                key={s.id}
                                                onClick={() => setSector(s.id)}
                                                style={{
                                                    padding: "0.35rem 1rem",
                                                    borderRadius: "100px",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    fontWeight: 700,
                                                    fontSize: "0.78rem",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.35rem",
                                                    background: sector === s.id ? "#7886C7" : "transparent",
                                                    color: sector === s.id ? "white" : "#6B7280",
                                                    transition: "all 0.2s ease",
                                                }}
                                            >
                                                <s.Icon style={{ width: "0.85rem", height: "0.85rem" }} />
                                                <span>{s.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        <AnimatePresence mode="wait">
                            {viewMode === "plans" ? (
                                <motion.div key="plans" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "1rem" }}>
                                        {activePlans.map((p) => <PlanCard key={p.id} plan={p} yearly={yearly} onBuy={(plan, yr) => setCallModal({ plan, yearly: yr })} />)}
                                    </div>
                                    <ComparisonTable />
                                </motion.div>
                            ) : (
                                <motion.div key="custom" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}>
                                    {categories.map((cat, idx) => (
                                        <div key={cat} style={{ marginBottom: idx === categories.length - 1 ? 0 : "3rem" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                                                <div style={{ height: "1px", flex: 1, backgroundImage: "linear-gradient(to right, transparent, rgba(120, 134, 199, 0.2))" }} />
                                                <h3 style={{ fontSize: "0.9rem", fontWeight: 800, color: "rgba(120, 134, 199, 0.8)", textTransform: "uppercase", letterSpacing: "0.2em" }}>{cat}</h3>
                                                <div style={{ height: "1px", flex: 1, backgroundImage: "linear-gradient(to left, transparent, rgba(120, 134, 199, 0.2))" }} />
                                            </div>
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
                                                {FEATURES.filter(f => f.category === cat).map((f: any) => {
                                                    const active = selectedFeatures.includes(f.id);
                                                    const isExpanded = expandedDetails.includes(f.id);
                                                    return (
                                                        <motion.div key={f.id} layout style={{
                                                            background: active ? "rgba(120, 134, 199, 0.08)" : "white",
                                                            border: `1px solid ${active ? "rgba(120, 134, 199, 0.5)" : "rgba(120, 134, 199, 0.15)"}`,
                                                            borderRadius: "1.25rem", padding: "1.25rem", position: "relative", transition: "all 0.3s ease",
                                                            cursor: "pointer"
                                                        }} onClick={() => toggleFeature(f.id)}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                                                <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", background: active ? "#7886C7" : "rgba(120, 134, 199, 0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: active ? "#111827" : "#9CA3AF", transition: "all 0.3s" }}>
                                                                    <f.icon style={{ width: "1.1rem", height: "1.1rem" }} />
                                                                </div>
                                                                <div style={{ flex: 1 }}>
                                                                    <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#111827", marginBottom: "0.15rem" }}>{f.label}</h3>
                                                                    <button
                                                                        onClick={(e) => toggleDetail(f.id, e)}
                                                                        style={{
                                                                            background: "none", border: "none", padding: 0,
                                                                            color: "#7886C7", fontSize: "0.7rem", fontWeight: 700,
                                                                            cursor: "pointer", display: "flex", alignItems: "center",
                                                                            gap: "0.25rem", position: "relative", zIndex: 10
                                                                        }}
                                                                    >
                                                                        {isExpanded ? "Kapat" : "Modül Hakkında"}
                                                                    </button>
                                                                </div>
                                                                {active && (
                                                                    <div style={{ background: "#7886C7", borderRadius: "55%", padding: "0.15rem", boxShadow: "0 0 10px rgba(120, 134, 199,0.3)" }}>
                                                                        <Check style={{ width: "0.75rem", height: "0.75rem", color: "white" }} strokeWidth={3} />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <AnimatePresence>
                                                                {isExpanded && (
                                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                                                                        <div style={{ paddingTop: "1rem", marginTop: "1rem", borderTop: "1px solid rgba(120, 134, 199, 0.1)" }}>
                                                                            <p style={{ fontSize: "0.8rem", color: "#4B5563", lineHeight: 1.5, marginBottom: "0.75rem" }}>{f.detailed}</p>
                                                                            <div style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.1)", borderRadius: "0.75rem", padding: "0.75rem" }}>
                                                                                <div style={{ color: "#4ade80", fontSize: "0.65rem", fontWeight: 800, marginBottom: "0.2rem" }}>FAYDA:</div>
                                                                                <div style={{ fontSize: "0.75rem", color: "#374151", fontStyle: "italic" }}>"{f.benefit}"</div>
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
                                    background: "rgba(10, 15, 25, 0.8)", backdropFilter: "blur(24px) saturate(180%)", border: "1px solid rgba(120, 134, 199, 0.3)",
                                    padding: "1.25rem 3rem", borderRadius: "100px", display: "flex", alignItems: "center", gap: "3.5rem", zIndex: 1000, boxShadow: "0 30px 60px rgba(0,0,0,0.6)"
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                                        <div style={{ width: "3.25rem", height: "3.25rem", borderRadius: "50%", backgroundImage: "linear-gradient(135deg, #7886C7, #B0BAE6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "1.35rem", color: "white", boxShadow: "0 0 20px rgba(120, 134, 199, 0.4)" }}>{selectedFeatures.length}</div>
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            <span style={{ fontWeight: 900, fontSize: "1.1rem", color: "white" }}>Harika Bir Paket!</span>
                                            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>Sizin için en uygun teklifi hazırlayalım</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowForm(true)} style={{ background: "#7886C7", color: "white", border: "none", padding: "1rem 3.5rem", borderRadius: "100px", fontWeight: 900, fontSize: "1rem", cursor: "pointer", transition: "all 0.3s", boxShadow: "0 8px 25px rgba(120, 134, 199, 0.5)" }}>Teklifi İncele →</button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Modal Form */}
                        <AnimatePresence>
                            {showForm && (
                                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(16px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
                                    <motion.div initial={{ y: 50, scale: 0.9, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 50, scale: 0.9, opacity: 0 }} style={{ background: "white", border: "1px solid rgba(120, 134, 199, 0.15)", borderRadius: "3rem", padding: "4rem", width: "100%", maxWidth: "600px", position: "relative", boxShadow: "0 40px 100px rgba(0,0,0,0.25)" }}>
                                        <button onClick={() => setShowForm(false)} style={{ position: "absolute", top: "2rem", right: "2rem", background: "white", border: "1px solid rgba(120, 134, 199, 0.2)", borderRadius: "50%", width: "3.5rem", height: "3.5rem", color: "#111827", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X style={{ width: "1.5rem" }} /></button>

                                        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
                                            <div style={{ width: "4rem", height: "4rem", background: "rgba(120, 134, 199, 0.15)", borderRadius: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}><Zap style={{ color: "#7886C7", width: "2rem" }} /></div>
                                            <h2 style={{ fontSize: "2.5rem", fontWeight: 950, marginBottom: "0.75rem", color: "#111827", letterSpacing: "-0.04em" }}>Neredeyse Bitti!</h2>
                                            <p style={{ color: "#6B7280", fontSize: "1.1rem" }}>{selectedFeatures.length} modül içeren size özel yapılandırma için bir adım kaldı.</p>
                                        </div>

                                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                                    <label style={{ fontSize: "0.75rem", color: "#9CA3AF", fontWeight: 800, paddingLeft: "1rem" }}>AD SOYAD</label>
                                                    <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ padding: "1.25rem", borderRadius: "1.25rem", background: "white", border: "1px solid rgba(120, 134, 199, 0.25)", color: "#111827", fontSize: "1rem" }} />
                                                </div>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                                    <label style={{ fontSize: "0.75rem", color: "#9CA3AF", fontWeight: 800, paddingLeft: "1rem" }}>TELEFON NO</label>
                                                    <input required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={{ padding: "1.25rem", borderRadius: "1.25rem", background: "white", border: "1px solid rgba(120, 134, 199, 0.25)", color: "#111827", fontSize: "1rem" }} />
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                                <label style={{ fontSize: "0.75rem", color: "#9CA3AF", fontWeight: 800, paddingLeft: "1rem" }}>İŞLETME ADI</label>
                                                <input required value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} style={{ padding: "1.25rem", borderRadius: "1.25rem", background: "white", border: "1px solid rgba(120, 134, 199, 0.25)", color: "#111827", fontSize: "1rem" }} />
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                                <label style={{ fontSize: "0.75rem", color: "#9CA3AF", fontWeight: 800, paddingLeft: "1rem" }}>E-POSTA</label>
                                                <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ padding: "1.25rem", borderRadius: "1.25rem", background: "white", border: "1px solid rgba(120, 134, 199, 0.25)", color: "#111827", fontSize: "1rem" }} />
                                            </div>
                                            <button disabled={loading} style={{ marginTop: "1rem", background: "#7886C7", color: "white", border: "none", padding: "1.5rem", borderRadius: "1.5rem", fontWeight: 900, fontSize: "1.2rem", cursor: "pointer", transition: "all 0.3s", boxShadow: "0 10px 30px rgba(120, 134, 199,0.3)" }}>{loading ? "GÖNDERİLİYOR..." : "ÖZEL TEKLİFİMİ İLET"}</button>
                                        </form>
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>

                        <div style={{ marginTop: "7rem", textAlign: "center", color: "#9CA3AF", fontSize: "0.9rem", lineHeight: 2 }}>
                            © 2026 JetPOS Teknolojileri A.Ş. Tüm hakları saklıdır.
                            <br />
                            <span style={{ fontSize: "0.75rem", color: "#D1D5DB" }}>Donanım gereksinimleri ve entegrasyon detayları için lütfen kullanım koşullarını inceleyin.</span>
                        </div>
                    </div>
                </div>
                <Footer />
            </main>
            {success && <motion.div initial={{ y: -100 }} animate={{ y: 20 }} style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", background: "#10b981", color: "#111827", padding: "1.25rem 3.5rem", borderRadius: "5rem", fontWeight: 900, fontSize: "1.1rem", zIndex: 10000, boxShadow: "0 20px 50px rgba(16,185,129,0.4)" }}>🚀 Harika! Talebiniz Alındı. <button onClick={() => setSuccess(false)} style={{ background: "none", border: "none", color: "#111827", marginLeft: "1.5rem", cursor: "pointer", fontSize: "1.25rem" }}>✕</button></motion.div>}

            {/* Call Modal */}
            <AnimatePresence>
                {callModal && (
                    <CallModal
                        plan={callModal.plan}
                        yearly={callModal.yearly}
                        onClose={() => setCallModal(null)}
                    />
                )}
            </AnimatePresence>
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
