"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
    Building2, User, Mail, Phone, Briefcase, Users,
    Monitor, MessageSquare, ChevronRight, Check,
    Sparkles, ArrowRight, Clock, Shield, Zap, Star
} from "lucide-react";

const SECTORS = [
    "Market / Bakkal", "Restoran / Kafe", "Fırın / Pastane",
    "Kasap / Manav", "Tekstil / Giyim", "Elektronik",
    "Eczane", "Kırtasiye", "Mobilya / Dekorasyon",
    "Otomotiv / Yedek Parça", "Kozmetik / Güzellik", "Diğer"
];

const PACKAGES = [
    { id: "aylik", label: "Aylık Paket", price: "₺985/ay", color: "#60a5fa" },
    { id: "ileri", label: "İleri Düzey", price: "₺679/ay", color: "#22c55e" },
    { id: "kurumsal", label: "2+1 Yıl Paketi", price: "₺394/ay", color: "#f59e0b" },
    { id: "ozel", label: "Özel Paket", price: "Esnek", color: "#ec4899" },
];

const EMPLOYEE_COUNTS = ["1-5", "6-15", "16-50", "51-200", "200+"];

const inputStyle = {
    width: "100%",
    padding: "0.9rem 1rem 0.9rem 3rem",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "0.875rem",
    color: "white",
    fontSize: "0.95rem",
    outline: "none",
    transition: "all 0.2s",
    fontFamily: "inherit",
    boxSizing: "border-box" as const,
};

const labelStyle = {
    display: "block",
    color: "rgba(255,255,255,0.65)",
    marginBottom: "0.5rem",
    fontSize: "0.875rem",
    fontWeight: 600,
};

const iconWrap = {
    position: "absolute" as const,
    left: "0.875rem",
    top: "50%",
    transform: "translateY(-50%)",
    color: "rgba(255,255,255,0.3)",
    pointerEvents: "none" as const,
    width: "1.1rem",
    height: "1.1rem",
};

export default function DemoPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        company: "",
        sector: "",
        employee_count: "",
        current_system: "",
        package_interest: "",
        message: "",
    });

    const updateForm = (key: string, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        e.target.style.borderColor = "rgba(59,130,246,0.5)";
        e.target.style.background = "rgba(255,255,255,0.06)";
    };
    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        e.target.style.borderColor = "rgba(255,255,255,0.1)";
        e.target.style.background = "rgba(255,255,255,0.04)";
    };

    const isStep1Valid = form.name && form.email && form.phone && form.company;
    const isStep2Valid = form.sector && form.employee_count;

    const handleSubmit = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/demo-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Bir hata oluştu.");
            setSubmitted(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div style={{ minHeight: "100vh", background: "#060914" }}>
                <Navbar />
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", padding: "2rem", textAlign: "center" }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, type: "spring" }}
                        style={{ maxWidth: "520px" }}
                    >
                        <div style={{
                            width: "5rem", height: "5rem", borderRadius: "50%",
                            background: "linear-gradient(135deg, #22c55e, #16a34a)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 auto 2rem",
                            boxShadow: "0 0 60px rgba(34,197,94,0.4)"
                        }}>
                            <Check style={{ width: "2.5rem", height: "2.5rem", color: "white" }} />
                        </div>
                        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "white", marginBottom: "1rem" }}>
                            Talebiniz Alındı! 🎉
                        </h1>
                        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.1rem", lineHeight: 1.7, marginBottom: "0.75rem" }}>
                            Merhaba <strong style={{ color: "white" }}>{form.name}</strong>, demo talebiniz başarıyla iletildi.
                        </p>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.95rem", marginBottom: "2.5rem" }}>
                            Ekibimiz <strong style={{ color: "#4ade80" }}>2 saat içinde</strong> sizi arayacak. Onay e-postası <strong style={{ color: "white" }}>{form.email}</strong> adresine gönderildi.
                        </p>
                        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                            <Link href="/" style={{
                                padding: "0.875rem 2rem", borderRadius: "0.875rem",
                                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                                color: "white", textDecoration: "none", fontWeight: 600, fontSize: "0.95rem"
                            }}>
                                Ana Sayfaya Dön
                            </Link>
                            <Link href="/fiyatlandirma" style={{
                                padding: "0.875rem 2rem", borderRadius: "0.875rem",
                                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                                color: "white", textDecoration: "none", fontWeight: 700, fontSize: "0.95rem",
                                display: "flex", alignItems: "center", gap: "0.5rem"
                            }}>
                                Fiyatları İncele <ArrowRight style={{ width: "1rem", height: "1rem" }} />
                            </Link>
                        </div>
                    </motion.div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", background: "#060914" }}>
            <Navbar />

            {/* Hero */}
            <section style={{ paddingTop: "8rem", paddingBottom: "4rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
                {/* Glow */}
                <div style={{
                    position: "absolute", top: "0", left: "50%", transform: "translateX(-50%)",
                    width: "600px", height: "400px",
                    background: "radial-gradient(ellipse at center, rgba(37,99,235,0.15) 0%, transparent 70%)",
                    pointerEvents: "none"
                }} />

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <span style={{
                        display: "inline-flex", alignItems: "center", gap: "0.5rem",
                        background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)",
                        color: "#93c5fd", padding: "0.4rem 1rem", borderRadius: "999px",
                        fontSize: "0.8rem", fontWeight: 700, marginBottom: "1.5rem"
                    }}>
                        <Sparkles style={{ width: "0.85rem", height: "0.85rem" }} />
                        ÜCRETSİZ DEMO
                    </span>

                    <h1 style={{
                        fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900, color: "white",
                        lineHeight: 1.15, marginBottom: "1.25rem"
                    }}>
                        JetPOS&apos;u Ücretsiz{" "}
                        <span style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            Demo ile
                        </span>{" "}
                        Keşfedin
                    </h1>

                    <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "1.15rem", maxWidth: "540px", margin: "0 auto 3rem", lineHeight: 1.7 }}>
                        Formu doldurun, uzmanımız sizi arasın. Kendi işletmenize özel demo gösterimi yapıyoruz.
                    </p>

                    {/* Benefits row */}
                    <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "1rem" }}>
                        {[
                            { icon: Clock, text: "2 saat içinde arama" },
                            { icon: Shield, text: "Ücretsiz kurulum" },
                            { icon: Zap, text: "Aynı gün aktivasyon" },
                            { icon: Star, text: "14 gün iade garantisi" },
                        ].map(({ icon: Icon, text }, i) => (
                            <div key={i} style={{
                                display: "flex", alignItems: "center", gap: "0.5rem",
                                color: "rgba(255,255,255,0.6)", fontSize: "0.875rem"
                            }}>
                                <Icon style={{ width: "1rem", height: "1rem", color: "#22c55e" }} />
                                {text}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* Form */}
            <section style={{ padding: "0 1rem 6rem" }}>
                <div style={{ maxWidth: "680px", margin: "0 auto" }}>

                    {/* Progress */}
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2.5rem" }}>
                        {[1, 2, 3].map(s => (
                            <div key={s} style={{
                                flex: 1, height: "4px", borderRadius: "99px", transition: "all 0.3s",
                                background: s <= step ? "linear-gradient(90deg, #2563eb, #3b82f6)" : "rgba(255,255,255,0.1)"
                            }} />
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {/* Step 1: Kişisel Bilgiler */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div style={{
                                    background: "rgba(255,255,255,0.025)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    borderRadius: "1.5rem", padding: "2.5rem"
                                }}>
                                    <div style={{ marginBottom: "2rem" }}>
                                        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Adım 1 / 3</span>
                                        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "white", marginTop: "0.5rem", marginBottom: "0.25rem" }}>Kişisel Bilgiler</h2>
                                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>Size nasıl ulaşabiliriz?</p>
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                                        {/* Name */}
                                        <div>
                                            <label style={labelStyle}>Ad Soyad *</label>
                                            <div style={{ position: "relative" }}>
                                                <User style={iconWrap} />
                                                <input type="text" value={form.name} onChange={e => updateForm("name", e.target.value)}
                                                    placeholder="Adınız ve soyadınız" style={inputStyle}
                                                    onFocus={handleFocus} onBlur={handleBlur}
                                                />
                                            </div>
                                        </div>

                                        {/* Company */}
                                        <div>
                                            <label style={labelStyle}>Firma / İşletme Adı *</label>
                                            <div style={{ position: "relative" }}>
                                                <Building2 style={iconWrap} />
                                                <input type="text" value={form.company} onChange={e => updateForm("company", e.target.value)}
                                                    placeholder="Firma veya işletme adı" style={inputStyle}
                                                    onFocus={handleFocus} onBlur={handleBlur}
                                                />
                                            </div>
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label style={labelStyle}>E-posta *</label>
                                            <div style={{ position: "relative" }}>
                                                <Mail style={iconWrap} />
                                                <input type="email" value={form.email} onChange={e => updateForm("email", e.target.value)}
                                                    placeholder="ornek@firma.com" style={inputStyle}
                                                    onFocus={handleFocus} onBlur={handleBlur}
                                                />
                                            </div>
                                        </div>

                                        {/* Phone */}
                                        <div>
                                            <label style={labelStyle}>Telefon *</label>
                                            <div style={{ position: "relative" }}>
                                                <Phone style={iconWrap} />
                                                <input type="tel" value={form.phone} onChange={e => updateForm("phone", e.target.value)}
                                                    placeholder="05XX XXX XX XX" style={inputStyle}
                                                    onFocus={handleFocus} onBlur={handleBlur}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        disabled={!isStep1Valid}
                                        onClick={() => setStep(2)}
                                        style={{
                                            width: "100%", marginTop: "2rem",
                                            padding: "1rem", borderRadius: "0.875rem", border: "none",
                                            background: isStep1Valid ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "rgba(255,255,255,0.05)",
                                            color: isStep1Valid ? "white" : "rgba(255,255,255,0.3)",
                                            fontWeight: 700, fontSize: "1rem", cursor: isStep1Valid ? "pointer" : "not-allowed",
                                            fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                                            transition: "all 0.2s",
                                            boxShadow: isStep1Valid ? "0 4px 20px rgba(37,99,235,0.4)" : "none"
                                        }}
                                    >
                                        Devam Et <ChevronRight style={{ width: "1.1rem", height: "1.1rem" }} />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: İşletme Bilgileri */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div style={{
                                    background: "rgba(255,255,255,0.025)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    borderRadius: "1.5rem", padding: "2.5rem"
                                }}>
                                    <div style={{ marginBottom: "2rem" }}>
                                        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Adım 2 / 3</span>
                                        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "white", marginTop: "0.5rem", marginBottom: "0.25rem" }}>İşletme Bilgileri</h2>
                                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>Size en uygun çözümü sunabilelim.</p>
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                                        {/* Sector */}
                                        <div>
                                            <label style={labelStyle}>Sektör *</label>
                                            <div style={{ position: "relative" }}>
                                                <Briefcase style={iconWrap} />
                                                <select value={form.sector} onChange={e => updateForm("sector", e.target.value)}
                                                    style={{ ...inputStyle, appearance: "none" as const }}
                                                    onFocus={handleFocus} onBlur={handleBlur}
                                                >
                                                    <option value="" style={{ background: "#1e293b" }}>Sektörünüzü seçin</option>
                                                    {SECTORS.map(s => <option key={s} value={s} style={{ background: "#1e293b" }}>{s}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Employee count */}
                                        <div>
                                            <label style={labelStyle}>Çalışan Sayısı *</label>
                                            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                                                {EMPLOYEE_COUNTS.map(c => (
                                                    <button key={c} onClick={() => updateForm("employee_count", c)}
                                                        style={{
                                                            padding: "0.6rem 1.25rem", borderRadius: "0.75rem", border: "1px solid",
                                                            borderColor: form.employee_count === c ? "rgba(37,99,235,0.6)" : "rgba(255,255,255,0.1)",
                                                            background: form.employee_count === c ? "rgba(37,99,235,0.15)" : "rgba(255,255,255,0.03)",
                                                            color: form.employee_count === c ? "#93c5fd" : "rgba(255,255,255,0.6)",
                                                            fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", fontFamily: "inherit",
                                                            transition: "all 0.15s"
                                                        }}
                                                    >
                                                        {c}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Current system */}
                                        <div>
                                            <label style={labelStyle}>Şu an hangi sistemi kullanıyorsunuz?</label>
                                            <div style={{ position: "relative" }}>
                                                <Monitor style={{ ...iconWrap, top: "1.25rem", transform: "none" }} />
                                                <input type="text" value={form.current_system} onChange={e => updateForm("current_system", e.target.value)}
                                                    placeholder="Örn: Excel, Logo, kağıt defter, başka yazılım..." style={inputStyle}
                                                    onFocus={handleFocus} onBlur={handleBlur}
                                                />
                                            </div>
                                        </div>

                                        {/* Package interest */}
                                        <div>
                                            <label style={labelStyle}>İlgilendiğiniz Paket</label>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                                                {PACKAGES.map(pkg => (
                                                    <button key={pkg.id} onClick={() => updateForm("package_interest", pkg.label)}
                                                        style={{
                                                            padding: "0.875rem 1.25rem", borderRadius: "0.875rem",
                                                            border: `1px solid ${form.package_interest === pkg.label ? pkg.color + "50" : "rgba(255,255,255,0.08)"}`,
                                                            background: form.package_interest === pkg.label ? `${pkg.color}12` : "rgba(255,255,255,0.02)",
                                                            color: "white", cursor: "pointer", fontFamily: "inherit",
                                                            display: "flex", alignItems: "center", justifyContent: "space-between",
                                                            transition: "all 0.15s"
                                                        }}
                                                    >
                                                        <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{pkg.label}</span>
                                                        <span style={{ fontSize: "0.85rem", color: pkg.color, fontWeight: 700 }}>{pkg.price}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
                                        <button onClick={() => setStep(1)} style={{
                                            flex: 1, padding: "1rem", borderRadius: "0.875rem",
                                            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                                            color: "rgba(255,255,255,0.7)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
                                        }}>
                                            ← Geri
                                        </button>
                                        <button disabled={!isStep2Valid} onClick={() => setStep(3)} style={{
                                            flex: 2, padding: "1rem", borderRadius: "0.875rem", border: "none",
                                            background: isStep2Valid ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "rgba(255,255,255,0.05)",
                                            color: isStep2Valid ? "white" : "rgba(255,255,255,0.3)",
                                            fontWeight: 700, fontSize: "1rem", cursor: isStep2Valid ? "pointer" : "not-allowed",
                                            fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                                            transition: "all 0.2s", boxShadow: isStep2Valid ? "0 4px 20px rgba(37,99,235,0.4)" : "none"
                                        }}>
                                            Devam Et <ChevronRight style={{ width: "1.1rem", height: "1.1rem" }} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Özet + Gönder */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div style={{
                                    background: "rgba(255,255,255,0.025)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    borderRadius: "1.5rem", padding: "2.5rem"
                                }}>
                                    <div style={{ marginBottom: "2rem" }}>
                                        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Adım 3 / 3</span>
                                        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "white", marginTop: "0.5rem", marginBottom: "0.25rem" }}>Son Adım</h2>
                                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>İsteğe bağlı notunuzu ekleyin ve gönderin.</p>
                                    </div>

                                    {/* Summary */}
                                    <div style={{
                                        background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)",
                                        borderRadius: "1rem", padding: "1.25rem", marginBottom: "1.5rem"
                                    }}>
                                        <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>Özet</p>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                            {[
                                                ["Ad Soyad", form.name],
                                                ["Firma", form.company],
                                                ["E-posta", form.email],
                                                ["Telefon", form.phone],
                                                ["Sektör", form.sector],
                                                ["Çalışan", form.employee_count],
                                                ["Paket", form.package_interest || "Belirsiz"],
                                            ].map(([k, v]) => (
                                                <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                                                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>{k}</span>
                                                    <span style={{ color: "white", fontSize: "0.875rem", fontWeight: 600, textAlign: "right" }}>{v || "-"}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Message */}
                                    <div style={{ marginBottom: "1.5rem" }}>
                                        <label style={labelStyle}>
                                            <MessageSquare style={{ display: "inline", width: "0.9rem", height: "0.9rem", marginRight: "0.4rem", verticalAlign: "middle" }} />
                                            Eklemek istediğiniz bir şey var mı? (isteğe bağlı)
                                        </label>
                                        <textarea
                                            value={form.message}
                                            onChange={e => updateForm("message", e.target.value)}
                                            rows={4}
                                            placeholder="Özel gereksinimleriniz, merak ettikleriniz..."
                                            style={{
                                                ...inputStyle,
                                                padding: "0.875rem 1rem",
                                                resize: "none",
                                            }}
                                            onFocus={handleFocus}
                                            onBlur={handleBlur}
                                        />
                                    </div>

                                    {error && (
                                        <div style={{
                                            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                                            borderRadius: "0.75rem", padding: "0.875rem 1rem",
                                            color: "#fca5a5", fontSize: "0.875rem", marginBottom: "1rem"
                                        }}>
                                            {error}
                                        </div>
                                    )}

                                    <div style={{ display: "flex", gap: "1rem" }}>
                                        <button onClick={() => setStep(2)} style={{
                                            flex: 1, padding: "1rem", borderRadius: "0.875rem",
                                            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                                            color: "rgba(255,255,255,0.7)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
                                        }}>
                                            ← Geri
                                        </button>
                                        <button onClick={handleSubmit} disabled={loading} style={{
                                            flex: 2, padding: "1rem", borderRadius: "0.875rem", border: "none",
                                            background: loading ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #22c55e, #16a34a)",
                                            color: loading ? "rgba(255,255,255,0.3)" : "white",
                                            fontWeight: 800, fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer",
                                            fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                                            transition: "all 0.2s", boxShadow: loading ? "none" : "0 4px 20px rgba(34,197,94,0.4)"
                                        }}>
                                            {loading ? (
                                                <>
                                                    <div style={{ width: "1rem", height: "1rem", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                                                    Gönderiliyor...
                                                </>
                                            ) : (
                                                <>🚀 Demo Talebi Gönder</>
                                            )}
                                        </button>
                                    </div>

                                    <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "0.8rem", marginTop: "1.25rem" }}>
                                        <Shield style={{ display: "inline", width: "0.8rem", height: "0.8rem", verticalAlign: "middle", marginRight: "0.3rem" }} />
                                        Bilgileriniz paylaşılmaz. Sadece demo için kullanılır.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Trust signals */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        style={{ display: "flex", gap: "1.5rem", justifyContent: "center", flexWrap: "wrap", marginTop: "3rem" }}
                    >
                        {[
                            { num: "500+", label: "Aktif İşletme" },
                            { num: "2 saat", label: "Ortalama Yanıt" },
                            { num: "%98", label: "Memnuniyet" },
                            { num: "14 gün", label: "İade Garantisi" },
                        ].map(({ num, label }, i) => (
                            <div key={i} style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "white" }}>{num}</div>
                                <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>{label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

            <Footer />
        </div>
    );
}
