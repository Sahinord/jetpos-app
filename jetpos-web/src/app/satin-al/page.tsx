"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
    Check, ChevronDown, ShieldCheck, Lock, CreditCard,
    Zap, Star, Building2, ArrowRight, Info
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

/* ─── PLAN CONFIG ─────────────────────────────────────── */
const PLAN_DATA: Record<string, {
    name: string;
    color: string;
    monthlyPrice: number;
    yearlyPrice: number;
    twoYearPrice: number;
    description: string;
    features: string[];
}> = {
    baslangic: {
        name: "JetStart",
        color: "#7886C7",
        monthlyPrice: 1149,
        yearlyPrice: 1149,
        twoYearPrice: 1149,
        description: "Aylık taahhütsüz başlangıç paketi",
        features: ["JetKasa Satış Sistemi", "Barkodlu Satış", "Stok Takibi", "Temel Raporlama", "7/24 Teknik Destek"],
    },
    buyume: {
        name: "JetPro",
        color: "#8b5cf6",
        monthlyPrice: 1149,
        yearlyPrice: 799,
        twoYearPrice: 799,
        description: "E-Fatura ve AI analizleri dahil",
        features: ["Tüm JetStart özellikleri", "E-Fatura & E-Arşiv", "Yapay Zeka Analizleri", "Depo Yönetimi", "Cari Hesap", "Personel Takibi"],
    },
    pro: {
        name: "JetMax",
        color: "#5A659F",
        monthlyPrice: 549,
        yearlyPrice: 549,
        twoYearPrice: 549,
        description: "2 yıl öde, 3 yıl kullan",
        features: ["Tüm JetPro özellikleri", "Çoklu Şube (3'e kadar)", "Sınırsız Kullanıcı", "Trendyol GO", "Barkod Okuyucu Hediye", "+1 Yıl Kullanım Hediye"],
    },
};

const TAKSIT_OPTIONS = [
    { value: 1, label: "Tek Çekim", discount: null, fee: null },
    { value: 3, label: "3 Taksit", discount: "Vade Farksız", fee: null },
    { value: 6, label: "6 Taksit", discount: null, fee: 0.125 },
];

function iyzicoDemoCard() {
    return (
        <div style={{
            background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: "0.75rem", padding: "0.875rem 1rem",
            display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "1.25rem",
        }}>
            <Info style={{ width: "1rem", height: "1rem", color: "#f59e0b", flexShrink: 0, marginTop: "0.15rem" }} />
            <p style={{ fontSize: "0.8rem", color: "#92400e", margin: 0, lineHeight: 1.5 }}>
                <strong>Demo Mod:</strong> Bu sayfa gerçek bir ödeme almaz. iyzico entegrasyonu yakında aktif olacak. Şimdilik talebi gönderin, ekibimiz sizinle iletişime geçsin.
            </p>
        </div>
    );
}

/* ─── MAIN CONTENT ─────────────────────────────────────── */
function SatinAlContent() {
    const searchParams = useSearchParams();
    const planId = searchParams.get("plan") || "buyume";
    const periodParam = searchParams.get("period") || "yıllık";

    const plan = PLAN_DATA[planId] || PLAN_DATA["buyume"];
    const isYearly = periodParam !== "aylık";
    const isTwoYear = planId === "pro";

    const basePrice = isTwoYear ? plan.twoYearPrice : isYearly ? plan.yearlyPrice : plan.monthlyPrice;

    const [taksit, setTaksit] = useState(1);
    const [form, setForm] = useState({
        name: "", email: "", phone: "", company: "", sector: "", note: "",
    });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const totalMonthly = taksit > 3 ? basePrice * (1 + 0.125) : basePrice;
    const totalYearly = isTwoYear ? totalMonthly * 24 : isYearly ? totalMonthly * 12 : totalMonthly;
    const iyzicoFee = taksit > 3 ? basePrice * 0.125 : 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Demo: submit as a demo request for now
            await fetch("/api/demo-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    package_interest: `${plan.name} - ${isTwoYear ? "2 Yıllık" : isYearly ? "Yıllık" : "Aylık"} - ${taksit} Taksit`,
                    message: `[SATIN AL FORMU] ${taksit} taksit seçildi. Tahmini: ₺${Math.round(totalMonthly).toLocaleString("tr-TR")}/ay\n\nNot: ${form.note}`,
                    current_system: "Satın Al Sayfası",
                }),
            });
            setSubmitted(true);
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ textAlign: "center", maxWidth: "480px" }}
                >
                    <div style={{ width: "5rem", height: "5rem", borderRadius: "50%", background: "rgba(34,197,94,0.1)", border: "2px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                        <Check style={{ width: "2.5rem", height: "2.5rem", color: "#22c55e" }} />
                    </div>
                    <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "#111827", marginBottom: "1rem" }}>Talebiniz Alındı!</h1>
                    <p style={{ color: "#4B5563", fontSize: "1rem", lineHeight: 1.7, marginBottom: "2rem" }}>
                        <strong>{plan.name}</strong> paketi için talebinizi aldık. Ekibimiz en geç <strong>1 iş günü</strong> içinde sizi arayacak ve ödeme linkini iletecek.
                    </p>
                    <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "#7886C7", color: "white", padding: "0.875rem 2rem", borderRadius: "0.875rem", fontWeight: 700, textDecoration: "none" }}>
                        Ana Sayfaya Dön <ArrowRight style={{ width: "1rem" }} />
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <>
            <div className="site-bg" style={{ background: "#F8FAFC" }} />
            <main style={{ position: "relative", zIndex: 1, minHeight: "100vh", background: "#F8FAFC" }}>
                <Navbar />
                <div style={{ paddingTop: "7rem", paddingBottom: "5rem" }}>
                    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 1.5rem" }}>

                        {/* Back */}
                        <Link href="/fiyatlandirma" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", color: "#6B7280", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none", marginBottom: "2rem" }}>
                            ← Fiyatlandırmaya Dön
                        </Link>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "2rem", alignItems: "flex-start" }}>

                            {/* LEFT — Form */}
                            <div>
                                <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#111827", marginBottom: "0.5rem" }}>
                                    {plan.name} Paketi
                                </h1>
                                <p style={{ color: "#6B7280", marginBottom: "2rem" }}>{plan.description}</p>

                                {iyzicoDemoCard()}

                                {/* Taksit seçimi */}
                                <div style={{ background: "white", borderRadius: "1rem", padding: "1.5rem", border: "1px solid #E5E7EB", marginBottom: "1.5rem" }}>
                                    <h3 style={{ fontWeight: 800, color: "#111827", fontSize: "0.95rem", marginBottom: "1rem" }}>Ödeme Seçeneği</h3>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                                        {TAKSIT_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setTaksit(opt.value)}
                                                style={{
                                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                                    padding: "0.875rem 1rem", borderRadius: "0.75rem", cursor: "pointer",
                                                    border: taksit === opt.value ? `2px solid ${plan.color}` : "2px solid #E5E7EB",
                                                    background: taksit === opt.value ? `${plan.color}08` : "white",
                                                    transition: "all 0.15s",
                                                }}
                                            >
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                    <div style={{
                                                        width: "1.1rem", height: "1.1rem", borderRadius: "50%",
                                                        border: taksit === opt.value ? `5px solid ${plan.color}` : "2px solid #D1D5DB",
                                                        flexShrink: 0,
                                                    }} />
                                                    <span style={{ fontWeight: 700, color: "#111827", fontSize: "0.9rem" }}>{opt.label}</span>
                                                    {opt.discount && (
                                                        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#22c55e", background: "rgba(34,197,94,0.1)", padding: "0.1rem 0.5rem", borderRadius: "9999px", border: "1px solid rgba(34,197,94,0.3)" }}>
                                                            {opt.discount}
                                                        </span>
                                                    )}
                                                </div>
                                                <span style={{ fontWeight: 800, color: taksit === opt.value ? plan.color : "#374151", fontSize: "0.9rem" }}>
                                                    ₺{Math.round(opt.fee ? basePrice * (1 + opt.fee) : basePrice).toLocaleString("tr-TR")}/ay
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                    {taksit > 3 && (
                                        <p style={{ fontSize: "0.72rem", color: "#9CA3AF", marginTop: "0.5rem" }}>
                                            * 6 taksitte %12,5 taksit farkı uygulanır (iyzico komisyonu)
                                        </p>
                                    )}
                                </div>

                                {/* Bilgi formu */}
                                <form onSubmit={handleSubmit}>
                                    <div style={{ background: "white", borderRadius: "1rem", padding: "1.5rem", border: "1px solid #E5E7EB", marginBottom: "1.5rem" }}>
                                        <h3 style={{ fontWeight: 800, color: "#111827", fontSize: "0.95rem", marginBottom: "1rem" }}>İletişim Bilgileri</h3>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                                            {[
                                                { key: "name", label: "Ad Soyad", placeholder: "Ahmet Yılmaz", required: true },
                                                { key: "email", label: "E-posta", placeholder: "ahmet@firma.com", required: true, type: "email" },
                                                { key: "phone", label: "Telefon", placeholder: "0532 000 00 00", required: true },
                                                { key: "company", label: "İşletme Adı", placeholder: "Firma / Mağaza adı", required: false },
                                            ].map(({ key, label, placeholder, required, type }) => (
                                                <div key={key} style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                                                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#374151" }}>{label}{required && " *"}</label>
                                                    <input
                                                        type={type || "text"}
                                                        required={required}
                                                        placeholder={placeholder}
                                                        value={(form as Record<string, string>)[key]}
                                                        onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                                                        style={{
                                                            padding: "0.625rem 0.875rem", borderRadius: "0.5rem",
                                                            border: "1px solid #E5E7EB", fontSize: "0.875rem",
                                                            outline: "none", fontFamily: "inherit",
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", gridColumn: "1 / -1" }}>
                                                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#374151" }}>Sektör</label>
                                                <select
                                                    value={form.sector}
                                                    onChange={(e) => setForm(f => ({ ...f, sector: e.target.value }))}
                                                    style={{ padding: "0.625rem 0.875rem", borderRadius: "0.5rem", border: "1px solid #E5E7EB", fontSize: "0.875rem", fontFamily: "inherit", background: "white" }}
                                                >
                                                    <option value="">Sektör Seçin</option>
                                                    <option>Restoran / Kafe</option>
                                                    <option>Market / Bakkal</option>
                                                    <option>Perakende Mağaza</option>
                                                    <option>Hızlı Servis (Fast Food)</option>
                                                    <option>Diğer</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Güven ikonları */}
                                    <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
                                        {[
                                            { icon: ShieldCheck, text: "256-bit SSL Şifreleme" },
                                            { icon: Lock, text: "iyzico Güvencesi" },
                                            { icon: CreditCard, text: "14 Gün İade Garantisi" },
                                        ].map(({ icon: Icon, text }) => (
                                            <div key={text} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                                                <Icon style={{ width: "0.875rem", height: "0.875rem", color: "#22c55e" }} />
                                                <span style={{ fontSize: "0.75rem", color: "#6B7280", fontWeight: 600 }}>{text}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        style={{
                                            width: "100%", padding: "1rem", borderRadius: "0.875rem",
                                            background: plan.color, color: "white", border: "none",
                                            fontWeight: 800, fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer",
                                            opacity: loading ? 0.7 : 1,
                                            boxShadow: `0 4px 16px ${plan.color}40`,
                                        }}
                                    >
                                        {loading ? "Gönderiliyor..." : "Talebimi Gönder →"}
                                    </button>
                                </form>
                            </div>

                            {/* RIGHT — Sipariş Özeti */}
                            <div style={{ position: "sticky", top: "7rem" }}>
                                <div style={{ background: "white", borderRadius: "1rem", padding: "1.5rem", border: "1px solid #E5E7EB", marginBottom: "1rem" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                                        <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", background: `${plan.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            {planId === "pro" ? <Building2 style={{ width: "1.1rem", color: plan.color }} /> : planId === "buyume" ? <Star style={{ width: "1.1rem", color: plan.color }} /> : <Zap style={{ width: "1.1rem", color: plan.color }} />}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 800, color: "#111827", margin: 0 }}>{plan.name}</p>
                                            <p style={{ fontSize: "0.75rem", color: "#6B7280", margin: 0 }}>
                                                {isTwoYear ? "2 Yıllık" : isYearly ? "Yıllık" : "Aylık"} · {taksit} Taksit
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
                                        {plan.features.map((f, i) => (
                                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                <Check style={{ width: "0.8rem", height: "0.8rem", color: plan.color, flexShrink: 0 }} />
                                                <span style={{ fontSize: "0.8rem", color: "#374151" }}>{f}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "1rem" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                                            <span style={{ fontSize: "0.82rem", color: "#6B7280" }}>Plan tutarı</span>
                                            <span style={{ fontSize: "0.82rem", color: "#374151", fontWeight: 700 }}>₺{basePrice.toLocaleString("tr-TR")}/ay</span>
                                        </div>
                                        {iyzicoFee > 0 && (
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                                                <span style={{ fontSize: "0.82rem", color: "#6B7280" }}>Taksit farkı (%12,5)</span>
                                                <span style={{ fontSize: "0.82rem", color: "#f59e0b", fontWeight: 700 }}>+₺{Math.round(iyzicoFee).toLocaleString("tr-TR")}</span>
                                            </div>
                                        )}
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.75rem", borderTop: "1px solid #E5E7EB" }}>
                                            <span style={{ fontWeight: 800, color: "#111827" }}>Aylık tutar</span>
                                            <div style={{ textAlign: "right" }}>
                                                <span style={{ fontSize: "1.5rem", fontWeight: 900, color: plan.color }}>₺{Math.round(totalMonthly).toLocaleString("tr-TR")}</span>
                                                <span style={{ fontSize: "0.75rem", color: "#9CA3AF" }}> +KDV</span>
                                            </div>
                                        </div>
                                        {(isYearly || isTwoYear) && (
                                            <p style={{ fontSize: "0.75rem", color: "#6B7280", marginTop: "0.375rem", textAlign: "right" }}>
                                                Toplam: ₺{Math.round(totalYearly).toLocaleString("tr-TR")} +KDV / {isTwoYear ? "2 yıl" : "yıl"}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "0.875rem", padding: "1rem", textAlign: "center" }}>
                                    <ShieldCheck style={{ width: "1.25rem", height: "1.25rem", color: "#22c55e", margin: "0 auto 0.5rem" }} />
                                    <p style={{ fontSize: "0.78rem", color: "#374151", fontWeight: 600, margin: 0 }}>14 gün içinde memnun kalmazsanız tam iade.</p>
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

export default function SatinAlPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: "100vh", background: "#F8FAFC" }} />}>
            <SatinAlContent />
        </Suspense>
    );
}
