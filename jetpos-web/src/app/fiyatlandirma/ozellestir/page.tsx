"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Check, Zap, Info, ArrowRight, ShoppingCart,
    Barcode, Package, Wallet, CreditCard,
    Brain, Users, Building2,
    Plus, Minus, ArrowLeft, Store, Truck
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

/* ─── DATA ────────────────────────────────────────── */
const FEATURE_GROUPS = [
    {
        id: "satis",
        title: "Satış & Operasyon",
        icon: Barcode,
        features: [
            { id: "hizli_satis", name: "Hızlı Satış POS", price: 150, description: "Saniyeler içinde satış yapmanızı sağlayan dokunmatik arayüz." },
            { id: "barkodlu_satis", name: "Modern Barkod Sistemi", price: 100, description: "Tüm barkod türlerini ve el terminallerini destekler." },
            { id: "mobil_barkod", name: "Mobil Satış Paneli", price: 120, description: "Telefon kamerasını barkod okuyucu olarak kullanma." },
            { id: "magaza_takip", name: "Merkezi Yönetim", price: 200, description: "Tüm şubeleri tek panelden anlık izleme." },
        ]
    },
    {
        id: "finans",
        title: "E-Dönüşüm & Finans",
        icon: Wallet,
        features: [
            { id: "e_fatura", name: "Jet E-Fatura", price: 250, description: "Sınırsız e-fatura gönderimi ve resmi entegrasyon." },
            { id: "e_arsiv", name: "Dijital Arşivleme", price: 150, description: "Fatura arşivleme ve hızlı sorgulama." },
            { id: "gelir_gider", name: "Muhasebe & Cari", price: 100, description: "Müşteri ve tedarikçi cari hesap yönetimi." },
            { id: "kasa_gun_sonu", name: "Anlık Kasa Takibi", price: 100, description: "Günlük ciro ve nakit akış analizi." },
        ]
    },
    {
        id: "stok",
        title: "Stok & Envanter",
        icon: Package,
        features: [
            { id: "stok_takibi", name: "Akıllı Stok Takibi", price: 150, description: "Ürün giriş-çıkış ve kritik seviye SMS uyarıları." },
            { id: "uretim_takibi", name: "Üretim & Reçete", price: 300, description: "Maliyet analizi ve hammadde düşümü." },
        ]
    },
    {
        id: "ai",
        title: "Yapay Zeka (JetAI)",
        icon: Brain,
        features: [
            { id: "ai_fiyat", name: "AI Fiyat Analizi", price: 300, description: "Rakiplerle fiyat karşılaştırması yapan AI modülü." },
            { id: "ai_talep", name: "Tahminleme Algoritması", price: 250, description: "Gelecek hafta ne satacağınızı tahmin eder." },
        ]
    },
    {
        id: "pazaryeri",
        title: "Global Entegrasyonlar",
        icon: Truck,
        features: [
            { id: "getir_sync", name: "Online Sipariş Sync", price: 200, description: "Getir, Yemeksepeti ve Trendyol Yemek." },
            { id: "pazaryeri_sync", name: "E-Ticaret Köprüsü", price: 200, description: "Trendyol, Hepsiburada ve N11 stok senkronizasyonu." },
        ]
    }
];

const ADDONS = [
    { id: "ek_sube", name: "Ek Şube Lisansı", pricePerUnit: 400, unit: "Şube", icon: Building2 },
    { id: "ek_kullanici", name: "Kullanıcı Lisansı", pricePerUnit: 150, unit: "Lisans", icon: Users },
    { id: "kontor_100", name: "Fatura Kontörü", pricePerUnit: 75, unit: "Paket", icon: CreditCard },
];

const PRESETS = [
    { id: "bakkal", name: "Bakkal / Market", features: ["hizli_satis", "barkodlu_satis", "stok_takibi", "kasa_gun_sonu"], icon: Store },
    { id: "cafe", name: "Cafe & Restoran", features: ["hizli_satis", "getir_sync", "gelir_gider", "kasa_gun_sonu", "uretim_takibi"], icon: Zap },
    { id: "eticaret", name: "Mağaza & E-Ticaret", features: ["pazaryeri_sync", "e_fatura", "stok_takibi", "ai_fiyat", "magaza_takip"], icon: ShoppingCart },
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

    const applyPreset = (features: string[]) => {
        setSelectedFeatures(features);
    };

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
        FEATURE_GROUPS.forEach(group => {
            group.features.forEach(f => {
                if (selectedFeatures.includes(f.id)) monthly += f.price;
            });
        });
        ADDONS.forEach(addon => {
            monthly += (counts[addon.id] || 0) * addon.pricePerUnit;
        });

        if (isYearly) {
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
        <div style={{ background: "#02040a", color: "white", minHeight: "100vh", position: "relative" }}>
            <div className="site-bg" />
            <Navbar />

            <main style={{ position: "relative", zIndex: 1, paddingTop: "7rem", paddingBottom: "5rem" }}>
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
                        Geri Dön
                    </Link>

                    <div className="package-grid">
                        
                        {/* Main Content */}
                        <div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ marginBottom: "3rem" }}
                            >
                                <h1 style={{
                                    fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, 
                                    lineHeight: 1.1, marginBottom: "1.25rem", letterSpacing: "-0.04em"
                                }}>
                                    Kendi Planını <span className="holographic-text">Oluştur</span>
                                </h1>
                                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "1.1rem", maxWidth: "600px" }}>
                                    İşletmenizin ihtiyacı olmayan hiçbir özelliğe para ödemeyin. Sadece seçtiklerinizi kullanın.
                                </p>
                            </motion.div>

                            {/* Preset Selectors */}
                            <div style={{ marginBottom: "3.5rem" }}>
                                <p style={{ fontSize: "0.80rem", fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1.25rem" }}>
                                    Sektörel Şablonlar
                                </p>
                                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                                    {PRESETS.map((p) => (
                                        <motion.button
                                            key={p.id}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => applyPreset(p.features)}
                                            className="preset-btn"
                                            style={{
                                                background: "rgba(255,255,255,0.03)",
                                                border: "1px solid rgba(255,255,255,0.08)",
                                                padding: "0.875rem 1.5rem",
                                                borderRadius: "1.25rem",
                                                color: "white",
                                                display: "flex", alignItems: "center", gap: "0.875rem",
                                                cursor: "pointer", fontSize: "0.95rem", fontWeight: 600,
                                                transition: "all 0.3s"
                                            }}
                                        >
                                            <p.icon style={{ width: "1.15rem", height: "1.15rem", color: "#60a5fa" }} />
                                            {p.name}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Features Grid */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "4rem" }}>
                                {FEATURE_GROUPS.map((group) => (
                                    <div key={group.id}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "1.75rem" }}>
                                            <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(59,130,246,0.2)" }}>
                                                <group.icon style={{ width: "1.25rem", height: "1.25rem", color: "#60a5fa" }} />
                                            </div>
                                            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>{group.title}</h2>
                                        </div>

                                        <div className="features-grid">
                                            {group.features.map((feature) => {
                                                const isSelected = selectedFeatures.includes(feature.id);
                                                return (
                                                    <motion.div
                                                        key={feature.id}
                                                        onClick={() => toggleFeature(feature.id)}
                                                        whileHover={{ scale: 1.02 }}
                                                        className="feature-card"
                                                        style={{
                                                            background: isSelected ? "rgba(59,130,246,0.06)" : "rgba(255,255,255,0.02)",
                                                            border: `1px solid ${isSelected ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.06)"}`,
                                                            borderRadius: "1.5rem",
                                                            padding: "1.75rem",
                                                            cursor: "pointer",
                                                            transition: "all 0.3s ease",
                                                            position: "relative",
                                                            boxShadow: isSelected ? "0 10px 40px -10px rgba(59,130,246,0.15)" : "none"
                                                        }}
                                                    >
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.875rem" }}>
                                                            <span style={{ fontWeight: 800, color: isSelected ? "white" : "rgba(255,255,255,0.85)", fontSize: "1.05rem" }}>{feature.name}</span>
                                                            <div style={{
                                                                width: "1.5rem", height: "1.5rem", borderRadius: "50%",
                                                                border: `2px solid ${isSelected ? "#3b82f6" : "rgba(255,255,255,0.15)"}`,
                                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                                background: isSelected ? "#3b82f6" : "transparent",
                                                                transition: "all 0.3s"
                                                            }}>
                                                                {isSelected && <Check style={{ width: "0.9rem", height: "0.9rem", color: "white" }} />}
                                                            </div>
                                                        </div>
                                                        <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                                                            {feature.description}
                                                        </p>
                                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                            <span style={{ fontSize: "1.125rem", fontWeight: 800, color: isSelected ? "#60a5fa" : "rgba(255,255,255,0.4)" }}>
                                                                +₺{feature.price} <span style={{ fontSize: "0.75rem", fontWeight: 400 }}>/ ay</span>
                                                            </span>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                {/* Addons Section */}
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "1.75rem" }}>
                                        <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", background: "rgba(167,139,250,0.1)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(167,139,250,0.2)" }}>
                                            <Building2 style={{ width: "1.25rem", height: "1.25rem", color: "#a78bfa" }} />
                                        </div>
                                        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Ek Kapasite & Modüller</h2>
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                                        {ADDONS.map((addon) => (
                                            <div key={addon.id} className="addon-row" style={{
                                                background: "rgba(255,255,255,0.025)",
                                                border: "1px solid rgba(255,255,255,0.06)",
                                                borderRadius: "1.5rem",
                                                padding: "1.25rem 1.75rem",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "1.5rem",
                                                transition: "all 0.3s"
                                            }}>
                                                <div style={{
                                                    width: "3rem", height: "3rem", borderRadius: "1rem",
                                                    background: "rgba(167,139,250,0.08)", display: "flex", alignItems: "center", justifyContent: "center"
                                                }}>
                                                    <addon.icon style={{ width: "1.375rem", height: "1.375rem", color: "#a78bfa" }} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "white", marginBottom: "0.25rem" }}>{addon.name}</h3>
                                                    <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>
                                                        ₺{addon.pricePerUnit} <span style={{ opacity: 0.6 }}>/ her bir {addon.unit}</span>
                                                    </p>
                                                </div>
                                                <div style={{ 
                                                    display: "flex", alignItems: "center", gap: "1rem", 
                                                    background: "rgba(0,0,0,0.3)", padding: "0.5rem", borderRadius: "1rem",
                                                    border: "1px solid rgba(255,255,255,0.05)"
                                                }}>
                                                    <button
                                                        onClick={() => updateCount(addon.id, -1)}
                                                        style={{
                                                            width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", border: "none",
                                                            background: "rgba(255,255,255,0.05)", color: "white", cursor: "pointer",
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                            transition: "all 0.2s"
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                                                        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                                                    >
                                                        <Minus style={{ width: "1.1rem", height: "1.1rem" }} />
                                                    </button>
                                                    <div style={{ minWidth: "2.5rem", textAlign: "center" }}>
                                                        <span style={{ fontSize: "1.25rem", fontWeight: 900, color: counts[addon.id] > 0 ? "#60a5fa" : "white" }}>
                                                            {counts[addon.id]}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => updateCount(addon.id, 1)}
                                                        style={{
                                                            width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", border: "none",
                                                            background: "rgba(255,255,255,0.05)", color: "white", cursor: "pointer",
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                            transition: "all 0.2s"
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                                                        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                                                    >
                                                        <Plus style={{ width: "1.1rem", height: "1.1rem" }} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sticky Sidebar */}
                        <div className="sidebar-container">
                            <motion.div
                                layout
                                className="receipt-card"
                                style={{
                                    background: "rgba(10, 15, 30, 0.4)",
                                    backdropFilter: "blur(32px)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "2.5rem",
                                    padding: "2.5rem",
                                    boxShadow: "0 40px 100px -20px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.05)"
                                }}
                            >
                                <h2 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                                    <ShoppingCart style={{ width: "1.5rem", height: "1.5rem", color: "#60a5fa" }} />
                                    Paket Özeti
                                </h2>

                                {/* Toggle */}
                                <div style={{
                                    display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: "1.25rem",
                                    padding: "0.4rem", marginBottom: "2.5rem", border: "1px solid rgba(255,255,255,0.08)"
                                }}>
                                    <button
                                        onClick={() => setIsYearly(false)}
                                        style={{
                                            flex: 1, padding: "0.875rem", borderRadius: "1rem", border: "none",
                                            fontWeight: 800, fontSize: "0.95rem", cursor: "pointer",
                                            background: !isYearly ? "rgba(255,255,255,0.1)" : "transparent",
                                            color: !isYearly ? "white" : "rgba(255,255,255,0.35)",
                                            transition: "all 0.3s"
                                        }}>
                                        Aylık
                                    </button>
                                    <button
                                        onClick={() => setIsYearly(true)}
                                        style={{
                                            flex: 1, padding: "0.875rem", borderRadius: "1rem", border: "none",
                                            fontWeight: 800, fontSize: "0.95rem", cursor: "pointer",
                                            background: isYearly ? "rgba(59,130,246,0.15)" : "transparent",
                                            color: isYearly ? "#60a5fa" : "rgba(255,255,255,0.35)",
                                            transition: "all 0.3s",
                                            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem"
                                        }}>
                                        Yıllık
                                        <span style={{ fontSize: "0.7rem", background: "#3b82f6", color: "white", padding: "0.2rem 0.5rem", borderRadius: "8px", fontWeight: 900 }}>-%25</span>
                                    </button>
                                </div>

                                {/* Items */}
                                <div className="receipt-items" style={{ marginBottom: "2.5rem", display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "280px", overflowY: "auto", paddingRight: "0.75rem" }}>
                                    <AnimatePresence mode="popLayout">
                                        {selectedFeatures.length === 0 && Object.values(counts).every(v => v === 0) && (
                                            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.95rem", textAlign: "center", padding: "2rem 0" }}>Özellikleri seçmeye başlayın</p>
                                        )}
                                        {selectedFeatures.map(fId => {
                                            const feature = FEATURE_GROUPS.flatMap(g => g.features).find(f => f.id === fId);
                                            return (
                                                <motion.div
                                                    key={fId}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}
                                                >
                                                    <span style={{ color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>{feature?.name}</span>
                                                    <span style={{ fontWeight: 700 }}>₺{feature?.price}</span>
                                                </motion.div>
                                            );
                                        })}
                                        {ADDONS.map(addon => {
                                            if (counts[addon.id] > 0) {
                                                return (
                                                    <motion.div
                                                        key={addon.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}
                                                    >
                                                        <span style={{ color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>{counts[addon.id]}x {addon.name}</span>
                                                        <span style={{ fontWeight: 700 }}>₺{counts[addon.id] * addon.pricePerUnit}</span>
                                                    </motion.div>
                                                );
                                            }
                                            return null;
                                        })}
                                    </AnimatePresence>
                                </div>

                                {/* Bottom */}
                                <div style={{ borderTop: "1px dashed rgba(255,255,255,0.15)", paddingTop: "2.5rem" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.5rem" }}>AYLIK ORTALAMA</span>
                                            <AnimatePresence mode="wait">
                                                <motion.div
                                                    key={totals.displayPrice}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    style={{ fontSize: "2.75rem", fontWeight: 900, letterSpacing: "-0.04em", color: "white" }}
                                                >
                                                    ₺{totals.displayPrice}
                                                </motion.div>
                                            </AnimatePresence>
                                        </div>
                                        <span style={{ fontSize: "1rem", color: "rgba(255,255,255,0.3)", marginBottom: "0.6rem" }}>+ KDV</span>
                                    </div>

                                    {isYearly && totals.savings > 0 && (
                                        <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "1.25rem", padding: "1.25rem", marginBottom: "2rem", textAlign: "center" }}>
                                            <p style={{ fontSize: "0.9rem", color: "#4ade80", fontWeight: 800 }}>
                                                Yıllık peşin ödemede ₺{totals.savings} tasarruf edin!
                                            </p>
                                        </div>
                                    )}

                                    <button className="confirm-btn">
                                        İlerle ve Başlat <ArrowRight style={{ width: "1.375rem", height: "1.375rem" }} />
                                    </button>
                                </div>
                            </motion.div>

                            <div style={{
                                marginTop: "1.5rem", padding: "1.5rem", borderRadius: "1.75rem",
                                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                                display: "flex", gap: "1rem"
                            }}>
                                <Info style={{ width: "1.5rem", height: "1.5rem", color: "#3b82f6", flexShrink: 0 }} />
                                <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
                                    Hangi özelliklerin size uygun olduğundan emin değil misiniz? Uzmanlarımızla <b>hemen görüşün.</b>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />

            <style>{`
                .package-grid {
                    display: grid;
                    grid-template-columns: 1fr 420px;
                    gap: 4rem;
                    align-items: start;
                }

                .features-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                }

                .sidebar-container {
                    position: sticky;
                    top: 8rem;
                }

                .confirm-btn {
                    width: 100%;
                    padding: 1.25rem;
                    border-radius: 1.5rem;
                    border: none;
                    background: linear-gradient(135deg, #2563eb, #3b82f6);
                    color: white;
                    font-weight: 900;
                    font-size: 1.1rem;
                    cursor: pointer;
                    box-shadow: 0 15px 40px -10px rgba(37,99,235,0.5);
                    display: flex;
                    alignItems: center;
                    justify-content: center;
                    gap: 0.875rem;
                    transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
                }

                .confirm-btn:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 20px 50px -10px rgba(37,99,235,0.6);
                    filter: brightness(1.1);
                }

                .preset-btn:hover {
                    border-color: rgba(59,130,246,0.5) !important;
                    background: rgba(59,130,246,0.1) !important;
                }

                .receipt-items::-webkit-scrollbar {
                    width: 4px;
                }
                .receipt-items::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.1);
                    border-radius: 99px;
                }

                @media (max-width: 1100px) {
                    .package-grid {
                        grid-template-columns: 1fr;
                    }
                    .sidebar-container {
                        position: static;
                        margin-top: 4rem;
                    }
                }

                @media (max-width: 768px) {
                    .features-grid {
                        grid-template-columns: 1fr;
                    }
                    .addon-row {
                        flex-direction: column;
                        align-items: flex-start !important;
                        gap: 1.25rem !important;
                    }
                    .addon-row > div:last-child {
                        width: 100%;
                        justify-content: space-between;
                    }
                }
            `}</style>
        </div>
    );
}
