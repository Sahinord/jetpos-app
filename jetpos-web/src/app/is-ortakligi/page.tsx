"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Handshake, Zap, BarChart3, ShieldCheck, Mail, Phone, Check, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const partnerTypes = [
    {
        title: "Bayi Kanalı",
        desc: "Kendi bölgenizde JetPOS ürünlerini pazarlayın, kurun ve her satıştan yüksek komisyon kazanın.",
        icon: Handshake,
        features: ["Yüksek Komisyon Oranları", "Bölgesel Destek Hakkı", "Özel Eğitim Paneli"]
    },
    {
        title: "Teknik Entegratör",
        desc: "Kendi yazılımınızı JetPOS API'si ile bağlayın, müşterilerimize ortak çözümler sunalım.",
        icon: Zap,
        features: ["Kapsamlı API Erişimi", "Geliştirici Portal", "Sandbox Test Ortamı"]
    },
    {
        title: "Kurumsal Çözüm Ortağı",
        desc: "Büyük ölçekli zincir işletmeler için özel geliştirme projelerimizde stratejik ortağımız olun.",
        icon: BarChart3,
        features: ["Stratejik Ortaklık", "Sektörel Know-How", "Özel SLA Destek"]
    }
];

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.875rem 1rem",
    background: "rgba(120,134,199,0.03)",
    border: "1.5px solid rgba(120,134,199,0.2)",
    borderRadius: "0.75rem",
    color: "#111827",
    fontSize: "0.95rem",
    outline: "none",
    transition: "border-color 0.2s, background 0.2s",
    fontFamily: "inherit",
    boxSizing: "border-box",
};

export default function PartnerPage() {
    const [form, setForm] = useState({ name: "", company: "", phone: "", email: "", type: "Bayi Kanalı", message: "" });
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        e.target.style.borderColor = "#7886C7";
        e.target.style.background = "#ffffff";
    };
    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        e.target.style.borderColor = "rgba(120,134,199,0.2)";
        e.target.style.background = "rgba(120,134,199,0.03)";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.company || !form.phone) {
            setStatus("error");
            setErrorMsg("Lütfen ad, firma ve telefon alanlarını doldurun.");
            return;
        }
        setStatus("loading");
        setErrorMsg("");
        try {
            const res = await fetch("/api/demo-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name,
                    company: form.company,
                    phone: form.phone,
                    email: form.email,
                    package_interest: "İş Ortaklığı",
                    message: `[İŞ ORTAKLIĞI BAŞVURUSU] Model: ${form.type}\n\n${form.message}`,
                }),
            });
            if (res.ok) {
                setStatus("success");
            } else {
                setStatus("error");
                setErrorMsg("Bir hata oluştu, lütfen tekrar deneyin.");
            }
        } catch {
            setStatus("error");
            setErrorMsg("Bağlantı hatası, lütfen tekrar deneyin.");
        }
    };

    return (
        <>
            <div className="site-bg" />
            <main style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
                <Navbar />

                {/* Hero */}
                <section style={{ paddingTop: "9rem", paddingBottom: "5rem", textAlign: "center" }}>
                    <div className="site-container">
                        <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="badge" style={{ marginBottom: "1.5rem" }}>
                            <Handshake style={{ width: "0.85rem", height: "0.85rem" }} />
                            İŞ ORTAKLIĞI
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            style={{ fontSize: "clamp(2.25rem, 6vw, 3.75rem)", fontWeight: 900, lineHeight: 1.1, color: "#111827", marginBottom: "1.25rem", letterSpacing: "-0.03em" }}
                        >
                            JetPOS ile <span className="holographic-text">Birlikte Büyüyelim</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            style={{ fontSize: "1.1rem", color: "#4B5563", maxWidth: "640px", margin: "0 auto", lineHeight: 1.65 }}
                        >
                            Türkiye&apos;nin en hızlı büyüyen teknoloji ekosisteminde yerinizi alın. Partnerlik modellerimizle hem kazanın hem de ticaretin dijitalleşmesine liderlik edin.
                        </motion.p>
                    </div>
                </section>

                {/* Partner Models */}
                <section style={{ paddingBottom: "6rem" }}>
                    <div className="site-container">
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }} className="partner-grid">
                            {partnerTypes.map((v, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.12 }}
                                    className="partner-card"
                                    style={{
                                        padding: "2.25rem",
                                        background: "white",
                                        border: "1px solid rgba(120,134,199,0.15)",
                                        borderRadius: "1.5rem",
                                        display: "flex", flexDirection: "column", gap: "1.25rem"
                                    }}
                                >
                                    <div style={{
                                        width: "3.5rem", height: "3.5rem", borderRadius: "1rem",
                                        background: "rgba(120,134,199,0.08)", border: "1px solid rgba(120,134,199,0.2)",
                                        display: "flex", alignItems: "center", justifyContent: "center"
                                    }}>
                                        <v.icon style={{ color: "#7886C7", width: "1.6rem", height: "1.6rem" }} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#111827", marginBottom: "0.5rem" }}>{v.title}</h3>
                                        <p style={{ color: "#4B5563", lineHeight: 1.6, fontSize: "0.92rem" }}>{v.desc}</p>
                                    </div>
                                    <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "0.65rem", paddingTop: "0.5rem", borderTop: "1px solid rgba(120,134,199,0.1)" }}>
                                        {v.features.map((f, j) => (
                                            <div key={j} style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.85rem", color: "#374151", fontWeight: 500 }}>
                                                <ShieldCheck style={{ width: "1rem", height: "1rem", color: "#7886C7", flexShrink: 0 }} />
                                                {f}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Application Form */}
                <section style={{ paddingBottom: "7rem" }}>
                    <div className="site-container" style={{ maxWidth: "1000px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "4rem", alignItems: "start" }} className="form-grid">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                            >
                                <h2 style={{ fontSize: "2.25rem", fontWeight: 900, color: "#111827", marginBottom: "1.25rem", lineHeight: 1.2 }}>Partnerlik Başvurusu</h2>
                                <p style={{ color: "#4B5563", marginBottom: "2rem", lineHeight: 1.7 }}>
                                    Ekibimiz başvurunuzu 48 saat içinde inceleyip sizinle iletişime geçecektir. Bir sonraki başarılı iş ortaklığımız sizinkisi olabilir.
                                </p>
                                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                    <a href="mailto:info@jetpos.shop" style={{
                                        background: "white", padding: "1.25rem", borderRadius: "1rem",
                                        border: "1px solid rgba(120,134,199,0.15)", textDecoration: "none",
                                        display: "flex", alignItems: "center", gap: "1rem",
                                    }}>
                                        <div style={{
                                            width: "2.75rem", height: "2.75rem", borderRadius: "0.75rem", flexShrink: 0,
                                            background: "rgba(120,134,199,0.08)", border: "1px solid rgba(120,134,199,0.2)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                        }}>
                                            <Mail style={{ width: "1.15rem", height: "1.15rem", color: "#7886C7" }} />
                                        </div>
                                        <div>
                                            <div style={{ color: "#6B7280", fontSize: "0.78rem", marginBottom: "0.15rem" }}>Bize Mail Atın</div>
                                            <div style={{ fontWeight: 700, color: "#111827", fontSize: "0.95rem" }}>info@jetpos.shop</div>
                                        </div>
                                    </a>
                                    <a href="tel:05366610169" style={{
                                        background: "white", padding: "1.25rem", borderRadius: "1rem",
                                        border: "1px solid rgba(120,134,199,0.15)", textDecoration: "none",
                                        display: "flex", alignItems: "center", gap: "1rem",
                                    }}>
                                        <div style={{
                                            width: "2.75rem", height: "2.75rem", borderRadius: "0.75rem", flexShrink: 0,
                                            background: "rgba(120,134,199,0.08)", border: "1px solid rgba(120,134,199,0.2)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                        }}>
                                            <Phone style={{ width: "1.15rem", height: "1.15rem", color: "#7886C7" }} />
                                        </div>
                                        <div>
                                            <div style={{ color: "#6B7280", fontSize: "0.78rem", marginBottom: "0.15rem" }}>Bizi Arayın</div>
                                            <div style={{ fontWeight: 700, color: "#111827", fontSize: "0.95rem" }}>0536 661 0169</div>
                                        </div>
                                    </a>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                style={{
                                    background: "white",
                                    border: "1px solid rgba(120,134,199,0.15)",
                                    borderRadius: "1.5rem",
                                    padding: "2.5rem",
                                    boxShadow: "0 4px 24px rgba(90,101,159,0.06)",
                                }}
                            >
                                {status === "success" ? (
                                    <div style={{ textAlign: "center", padding: "3rem 0" }}>
                                        <motion.div
                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 200 }}
                                            style={{
                                                width: "4rem", height: "4rem", borderRadius: "50%",
                                                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                margin: "0 auto 1.5rem",
                                            }}
                                        >
                                            <Check style={{ color: "white", width: "2rem", height: "2rem" }} strokeWidth={3} />
                                        </motion.div>
                                        <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#111827", marginBottom: "0.75rem" }}>Başvurunuz Alındı!</h3>
                                        <p style={{ color: "#4B5563", fontSize: "0.95rem" }}>Sizinle en kısa sürede iletişime geçeceğiz. Teşekkürler!</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                            <input
                                                type="text" placeholder="Ad Soyad" required
                                                value={form.name}
                                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                                onFocus={handleFocus} onBlur={handleBlur}
                                                style={inputStyle}
                                            />
                                            <input
                                                type="text" placeholder="Firma Adı" required
                                                value={form.company}
                                                onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                                                onFocus={handleFocus} onBlur={handleBlur}
                                                style={inputStyle}
                                            />
                                        </div>
                                        <input
                                            type="tel" placeholder="Telefon Numarası" required
                                            value={form.phone}
                                            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                            onFocus={handleFocus} onBlur={handleBlur}
                                            style={inputStyle}
                                        />
                                        <input
                                            type="email" placeholder="E-posta Adresi"
                                            value={form.email}
                                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                            onFocus={handleFocus} onBlur={handleBlur}
                                            style={inputStyle}
                                        />
                                        <select
                                            value={form.type}
                                            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                                            onFocus={handleFocus} onBlur={handleBlur}
                                            style={{ ...inputStyle, cursor: "pointer", appearance: "auto" }}
                                        >
                                            <option>Bayi Kanalı</option>
                                            <option>Teknik Entegratör</option>
                                            <option>Kurumsal Çözüm Ortağı</option>
                                        </select>
                                        <textarea
                                            placeholder="Kısaca kendinizden ve planlarınızdan bahsedin..." rows={4}
                                            value={form.message}
                                            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                                            onFocus={handleFocus} onBlur={handleBlur}
                                            style={{ ...inputStyle, resize: "none" }}
                                        />

                                        {status === "error" && (
                                            <div style={{
                                                background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)",
                                                borderRadius: "0.75rem", padding: "0.75rem 1rem",
                                                color: "#dc2626", fontSize: "0.85rem",
                                            }}>
                                                {errorMsg}
                                            </div>
                                        )}

                                        <button type="submit" disabled={status === "loading"} className="btn-primary" style={{ width: "100%", justifyContent: "center", opacity: status === "loading" ? 0.7 : 1 }}>
                                            {status === "loading" ? (
                                                <>
                                                    <Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} />
                                                    Gönderiliyor...
                                                </>
                                            ) : (
                                                "Başvuruyu Tamamla"
                                            )}
                                        </button>
                                    </form>
                                )}
                            </motion.div>
                        </div>
                    </div>
                </section>

                <style>{`
                    .partner-card {
                        transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
                        box-shadow: 0 1px 2px rgba(17,24,39,0.04);
                    }
                    .partner-card:hover {
                        transform: translateY(-4px);
                        box-shadow: 0 16px 32px rgba(90,101,159,0.16);
                        border-color: rgba(120,134,199,0.4);
                    }
                    @media (max-width: 900px) {
                        .partner-grid { grid-template-columns: 1fr !important; }
                        .form-grid { grid-template-columns: 1fr !important; gap: 2.5rem !important; }
                    }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                `}</style>

                <Footer />
            </main>
        </>
    );
}
