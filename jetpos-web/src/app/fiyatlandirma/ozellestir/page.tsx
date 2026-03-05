"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Check, Zap, Info, Star, ArrowRight, ShoppingCart,
    Barcode, FileText, Package, Wallet, CreditCard,
    Brain, Shield, Users, Building2, TrendingUp,
    Clock, Smartphone, Store, Truck, BarChart3,
    Plus, Minus, X, ArrowLeft
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

/* ─── DATA ────────────────────────────────────────── */
const FEATURE_GROUPS = [
    {
        id: "satis",
        title: "Satış & POS",
        icon: Barcode,
        features: [
            { id: "hizli_satis", name: "Hızlı Satış Sistemi", price: 150, description: "Saniyeler içinde satış yapmanızı sağlayan arayüz." },
            { id: "barkodlu_satis", name: "Barkodlu Satış", price: 100, description: "Tüm barkod türlerini destekleyen satış modülü." },
            { id: "mobil_barkod", name: "Mobil Barkod Okuma", price: 120, description: "Telefon kamerasını barkod okuyucu olarak kullanma." },
            { id: "kasiyer_takip", name: "Kasiyer Takip", price: 80, description: "Kasiyer bazlı satış ve performans takibi." },
            { id: "magaza_takip", name: "Mağaza Takip", price: 200, description: "Birden fazla mağazayı tek merkezden yönetin." },
        ]
    },
    {
        id: "finans",
        title: "Finans & Muhasebe",
        icon: Wallet,
        features: [
            { id: "e_fatura", name: "E-Fatura Entegrasyonu", price: 250, description: "Resmi e-fatura gönderimi ve alımı." },
            { id: "e_arsiv", name: "E-Arşiv Fatura", price: 150, description: "Kağıt fatura yerine dijital arşiv faturası." },
            { id: "gelir_gider", name: "Gelir-Gider Takibi", price: 100, description: "İşletme masraflarını ve gelirlerini kaydedin." },
            { id: "kasa_gun_sonu", name: "Kasa & Gün Sonu", price: 100, description: "Günlük ciro ve kasa devir işlemleri." },
            { id: "masraf_takibi", name: "Masraf Takibi", price: 80, description: "Kira, fatura gibi rutin masrafların takibi." },
        ]
    },
    {
        id: "stok",
        title: "Stok & Depo",
        icon: Package,
        features: [
            { id: "stok_takibi", name: "Stok Takibi", price: 150, description: "Ürün giriş-çıkış ve kritik seviye uyarıları." },
            { id: "depo_yonetimi", name: "Depo Yönetimi", price: 180, description: "Mağaza ve depo arası transfer yönetimi." },
            { id: "uretim_takibi", name: "Üretim Takibi", price: 300, description: "Reçete bazlı üretim ve hammadde düşümü." },
            { id: "teklif_olusturma", name: "Teklif Oluşturma", price: 120, description: "Müşterilere profesyonel teklifler hazırlayın." },
        ]
    },
    {
        id: "ekstralar",
        title: "Destek & Kapasite",
        icon: Shield,
        features: [
            { id: "teknik_destek", name: "7/24 VIP Teknik Destek", price: 200, description: "Öncelikli telefon ve uzak masaüstü desteği." },
        ]
    },
    {
        id: "ai",
        title: "Yapay Zeka & Analiz",
        icon: Brain,
        features: [
            { id: "ai_fiyat", name: "AI Fiyat Analizi", price: 300, description: "Piyasa fiyatlarını takip eden ve öneri sunan AI modülü." },
            { id: "ai_talep", name: "Talep Tahminleme", price: 250, description: "Geçmiş verilere dayanarak stok ihtiyacını tahmin eder." },
            { id: "akilli_rapor", name: "Akıllı Raporlama", price: 150, description: "Verilerinizi analiz edip özet sunan AI asistanı." },
        ]
    },
    {
        id: "pazaryeri",
        title: "Pazaryeri Entegrasyonları",
        icon: Truck,
        features: [
            { id: "getir_sync", name: "Getir & Yemeksepeti", price: 200, description: "Online siparişleri direkt POS ekranına düşürün." },
            { id: "trendyol_sync", name: "Trendyol & HepsiBurada", price: 200, description: "E-ticaret stoklarını ve siparişlerini senkronize edin." },
            { id: "kurye_takip", name: "Kurye Takip Sistemi", price: 180, description: "Kendi kuryelerinizi harita üzerinden canlı takip edin." },
        ]
    }
];

const ADDONS = [
    { id: "ek_sube", name: "Ek Şube Lisansı", pricePerUnit: 400, unit: "Şube", icon: Building2 },
    { id: "ek_kullanici", name: "Ek Kullanıcı Lisansı", pricePerUnit: 150, unit: "Kullanıcı", icon: Users },
    { id: "kontor_100", name: "100 Adet Kontör Paketi", pricePerUnit: 75, unit: "Paket", icon: CreditCard },
];

/* ─── PAGE ────────────────────────────────────────── */
export default function CustomPackagePage() {
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>(["hizli_satis", "stok_takibi"]);
    const [counts, setCounts] = useState<{ [key: string]: number }>({
        ek_sube: 0,
        ek_kullanici: 1,
        kontor_100: 0
    });
    const [isYearly, setIsYearly] = useState(true);

    const toggleFeature = (id: string) => {
        if (selectedFeatures.includes(id)) {
            setSelectedFeatures(selectedFeatures.filter(f => f !== id));
        } else {
            setSelectedFeatures([...selectedFeatures, id]);
        }
    };

    const updateCount = (id: string, delta: number) => {
        setCounts(prev => ({
            ...prev,
            [id]: Math.max(0, (prev[id] || 0) + delta)
        }));
    };

    const totals = useMemo(() => {
        let monthly = 0;

        // Features
        FEATURE_GROUPS.forEach(group => {
            group.features.forEach(f => {
                if (selectedFeatures.includes(f.id)) {
                    monthly += f.price;
                }
            });
        });

        // Addons
        ADDONS.forEach(addon => {
            monthly += (counts[addon.id] || 0) * addon.pricePerUnit;
        });

        if (isYearly) {
            // Apply 25% discount for yearly
            const yearlyTotal = (monthly * 12) * 0.75;
            return {
                monthly: monthly,
                displayPrice: Math.round(yearlyTotal / 12),
                actualTotal: Math.round(yearlyTotal),
                savings: (monthly * 12) - Math.round(yearlyTotal)
            };
        }

        return {
            monthly: monthly,
            displayPrice: monthly,
            actualTotal: monthly,
            savings: 0
        };
    }, [selectedFeatures, counts, isYearly]);

    return (
        <>
            <div className="site-bg" />
            <main style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
                <Navbar />

                <div style={{ paddingTop: "7rem", paddingBottom: "5rem" }}>
                    <div className="site-container">

                        {/* Back Link */}
                        <Link href="/fiyatlandirma" style={{
                            display: "inline-flex", alignItems: "center", gap: "0.5rem",
                            color: "rgba(255,255,255,0.4)", textDecoration: "none",
                            fontSize: "0.9rem", marginBottom: "2rem", transition: "color 0.2s"
                        }}
                            onMouseEnter={e => e.currentTarget.style.color = "white"}
                            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
                        >
                            <ArrowLeft style={{ width: "1rem", height: "1rem" }} />
                            Fiyatlandırmaya Geri Dön
                        </Link>

                        {/* Header */}
                        <div style={{ marginBottom: "3rem" }}>
                            <h1 style={{
                                fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800, color: "white",
                                marginBottom: "1rem", letterSpacing: "-0.02em"
                            }}>
                                Kendi Paketini <span className="holographic-text">Tasarla</span>
                            </h1>
                            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.1rem" }}>
                                İşletmenizin türüne ve ihtiyacınıza göre özellikleri seçin, fazla ödemekten kurtulun.
                            </p>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "2.5rem", alignItems: "start" }}>

                            {/* Selection Area */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>

                                {FEATURE_GROUPS.map((group) => (
                                    <div key={group.id}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                                            <group.icon style={{ width: "1.25rem", height: "1.25rem", color: "#60a5fa" }} />
                                            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "white" }}>{group.title}</h2>
                                        </div>

                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                            {group.features.map((feature) => {
                                                const isSelected = selectedFeatures.includes(feature.id);
                                                return (
                                                    <motion.div
                                                        key={feature.id}
                                                        onClick={() => toggleFeature(feature.id)}
                                                        style={{
                                                            background: isSelected ? "rgba(96,165,250,0.1)" : "rgba(255,255,255,0.03)",
                                                            border: `1px solid ${isSelected ? "rgba(96,165,250,0.5)" : "rgba(255,255,255,0.07)"}`,
                                                            borderRadius: "1rem",
                                                            padding: "1.25rem",
                                                            cursor: "pointer",
                                                            transition: "all 0.2s ease",
                                                            position: "relative"
                                                        }}
                                                        whileHover={{ scale: 1.02, background: isSelected ? "rgba(96,165,250,0.15)" : "rgba(255,255,255,0.05)" }}
                                                    >
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                                                            <span style={{ fontWeight: 700, color: "white", fontSize: "0.95rem" }}>{feature.name}</span>
                                                            <div style={{
                                                                width: "1.25rem", height: "1.25rem", borderRadius: "50%",
                                                                border: `2px solid ${isSelected ? "#60a5fa" : "rgba(255,255,255,0.2)"}`,
                                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                                background: isSelected ? "#60a5fa" : "transparent"
                                                            }}>
                                                                {isSelected && <Check style={{ width: "0.8rem", height: "0.8rem", color: "white" }} />}
                                                            </div>
                                                        </div>
                                                        <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.4, marginBottom: "1rem" }}>
                                                            {feature.description}
                                                        </p>
                                                        <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#60a5fa" }}>
                                                            +₺{feature.price} <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>/ay</span>
                                                        </span>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                {/* Addons Section */}
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                                        <Building2 style={{ width: "1.25rem", height: "1.25rem", color: "#a78bfa" }} />
                                        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "white" }}>Ek Modül & Kapasite</h2>
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                        {ADDONS.map((addon) => (
                                            <div key={addon.id} style={{
                                                background: "rgba(255,255,255,0.03)",
                                                border: "1px solid rgba(255,255,255,0.07)",
                                                borderRadius: "1rem",
                                                padding: "1rem 1.5rem",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "1.5rem"
                                            }}>
                                                <div style={{
                                                    width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem",
                                                    background: "rgba(167,139,250,0.1)", display: "flex", alignItems: "center", justifyContent: "center"
                                                }}>
                                                    <addon.icon style={{ width: "1.25rem", height: "1.25rem", color: "#a78bfa" }} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "white" }}>{addon.name}</h3>
                                                    <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>
                                                        ₺{addon.pricePerUnit} / her bir {addon.unit} için
                                                    </p>
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "1rem", background: "rgba(0,0,0,0.2)", padding: "0.4rem", borderRadius: "0.75rem" }}>
                                                    <button
                                                        onClick={() => updateCount(addon.id, -1)}
                                                        style={{
                                                            width: "2rem", height: "2rem", borderRadius: "0.5rem", border: "none",
                                                            background: "rgba(255,255,255,0.05)", color: "white", cursor: "pointer"
                                                        }}>
                                                        <Minus style={{ width: "1rem", height: "1rem" }} />
                                                    </button>
                                                    <span style={{ minWidth: "1.5rem", textAlign: "center", fontWeight: 700, color: "white" }}>
                                                        {counts[addon.id]}
                                                    </span>
                                                    <button
                                                        onClick={() => updateCount(addon.id, 1)}
                                                        style={{
                                                            width: "2rem", height: "2rem", borderRadius: "0.5rem", border: "none",
                                                            background: "rgba(255,255,255,0.05)", color: "white", cursor: "pointer"
                                                        }}>
                                                        <Plus style={{ width: "1rem", height: "1rem" }} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>

                            {/* Summary Sidebar */}
                            <div style={{ position: "sticky", top: "7rem" }}>
                                <div style={{
                                    background: "rgba(255,255,255,0.04)",
                                    backdropFilter: "blur(20px)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "1.5rem",
                                    padding: "2rem",
                                    boxShadow: "0 20px 50px rgba(0,0,0,0.3)"
                                }}>
                                    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "white", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <ShoppingCart style={{ width: "1.25rem", height: "1.25rem", color: "#4ade80" }} />
                                        Paket Özeti
                                    </h2>

                                    {/* Billing Toggle */}
                                    <div style={{
                                        display: "flex", background: "rgba(0,0,0,0.3)", borderRadius: "0.75rem",
                                        padding: "0.25rem", marginBottom: "2rem"
                                    }}>
                                        <button
                                            onClick={() => setIsYearly(false)}
                                            style={{
                                                flex: 1, padding: "0.6rem", borderRadius: "0.6rem", border: "none",
                                                fontFamily: "inherit", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer",
                                                background: !isYearly ? "rgba(255,255,255,0.1)" : "transparent",
                                                color: !isYearly ? "white" : "rgba(255,255,255,0.4)",
                                                transition: "all 0.2s"
                                            }}>
                                            Aylık
                                        </button>
                                        <button
                                            onClick={() => setIsYearly(true)}
                                            style={{
                                                flex: 1, padding: "0.6rem", borderRadius: "0.6rem", border: "none",
                                                fontFamily: "inherit", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer",
                                                background: isYearly ? "rgba(34,197,94,0.2)" : "transparent",
                                                color: isYearly ? "#4ade80" : "rgba(255,255,255,0.4)",
                                                transition: "all 0.2s",
                                                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem"
                                            }}>
                                            Yıllık
                                            <span style={{ fontSize: "0.65rem", background: "#22c55e", color: "white", padding: "0.1rem 0.3rem", borderRadius: "4px" }}>-%25</span>
                                        </button>
                                    </div>

                                    {/* Selection List */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem", maxHeight: "300px", overflowY: "auto", paddingRight: "0.5rem" }}>
                                        {selectedFeatures.length === 0 && Object.values(counts).every(c => c === 0) && (
                                            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.9rem", textAlign: "center", padding: "1rem 0" }}>
                                                Henüz özellik seçilmedi
                                            </p>
                                        )}

                                        {selectedFeatures.map(fId => {
                                            const feature = FEATURE_GROUPS.flatMap(g => g.features).find(f => f.id === fId);
                                            return (
                                                <div key={fId} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                                                    <span style={{ color: "rgba(255,255,255,0.6)" }}>{feature?.name}</span>
                                                    <span style={{ color: "white", fontWeight: 600 }}>₺{feature?.price}</span>
                                                </div>
                                            );
                                        })}

                                        {ADDONS.map(addon => {
                                            if (counts[addon.id] > 0) {
                                                return (
                                                    <div key={addon.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                                                        <span style={{ color: "rgba(255,255,255,0.6)" }}>{counts[addon.id]}x {addon.name}</span>
                                                        <span style={{ color: "white", fontWeight: 600 }}>₺{counts[addon.id] * addon.pricePerUnit}</span>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>

                                    {/* Total */}
                                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "1.5rem" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
                                            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>Ortalama Aylık</span>
                                            <div style={{ textAlign: "right" }}>
                                                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "white" }}>₺{totals.displayPrice}<span style={{ fontSize: "0.9rem", fontWeight: 400, color: "rgba(255,255,255,0.3)" }}>/ay</span></div>
                                            </div>
                                        </div>

                                        {isYearly && (
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#4ade80", marginBottom: "1rem" }}>
                                                <span>Yıllık Toplam</span>
                                                <span>₺{totals.actualTotal}</span>
                                            </div>
                                        )}

                                        <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginBottom: "1.5rem", textAlign: "right" }}>
                                            * Fiyatlara KDV dahil değildir
                                        </p>

                                        <button style={{
                                            width: "100%", padding: "1rem", borderRadius: "1rem", border: "none",
                                            background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                                            color: "white", fontWeight: 700, fontSize: "1rem", cursor: "pointer",
                                            boxShadow: "0 10px 20px rgba(37,99,235,0.3)",
                                            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem"
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                                            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                                        >
                                            Paketi Sepete Ekle
                                            <ArrowRight style={{ width: "1.25rem", height: "1.25rem" }} />
                                        </button>
                                    </div>
                                </div>

                                {/* Help Note */}
                                <div style={{
                                    marginTop: "1.5rem", padding: "1rem", borderRadius: "1rem",
                                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                                    display: "flex", gap: "0.75rem"
                                }}>
                                    <Info style={{ width: "1.25rem", height: "1.25rem", color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
                                    <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>
                                        Profesyonel bir desteğe mi ihtiyacınız var? Sizin için en uygun paketi birlikte tasarlayalım. <b>Hemen Bize Ulaşın.</b>
                                    </p>
                                </div>
                            </div>

                        </div>

                    </div>
                </div>

                <Footer />
            </main>
        </>
    );
}
