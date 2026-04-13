"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Handshake, Zap, BarChart3, ShieldCheck, Mail, Send, Check, Loader2, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const partnerTypes = [
    {
        title: "Bayi Kanalı",
        desc: "Kendi bölgenizde JetPOS ürünlerini pazarlayın, kurun ve her satıştan yüksek komisyon kazanın.",
        icon: Handshake,
        color: "#3b82f6",
        features: ["Yüksek Komisyon Oranları", "Bölgesel Destek Hakkı", "Özel Eğitim Paneli"]
    },
    {
        title: "Teknik Entegratör",
        desc: "Kendi yazılımınızı JetPOS API'si ile bağlayın, müşterilerimize ortak çözümler sunalım.",
        icon: Zap,
        color: "#a78bfa",
        features: ["Kapsamlı API Erişimi", "Geliştirici Portal", "Sandbox Test Ortamı"]
    },
    {
        title: "Kurumsal Çözüm Ortağı",
        desc: "Büyük ölçekli zincir işletmeler için özel geliştirme projelerimizde stratejik ortağımız olun.",
        icon: BarChart3,
        color: "#10b981",
        features: ["Stratejik Ortaklık", "Sektörel Know-How", "Özel SLA Destek"]
    }
];

export default function PartnerPage() {
    const [form, setForm] = useState({ name: "", company: "", email: "", type: "Bayi Kanalı", message: "" });
    const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        // Simulate API
        setTimeout(() => setStatus("success"), 1500);
    };

    return (
        <div style={{ minHeight: "100vh", background: "#060914", color: "white" }}>
            <Navbar />

            {/* Hero */}
            <section style={{ paddingTop: "10.5rem", paddingBottom: "7rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
                <div style={{
                    position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                    width: "1200px", height: "600px",
                    background: "radial-gradient(circle at center, rgba(37,99,235,0.06) 0%, transparent 65%)",
                    pointerEvents: "none"
                }} />
                
                <div className="site-container">
                    <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="badge" style={{ marginBottom: "1.5rem" }}>
                        İş Ortaklığı
                    </motion.span>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        style={{ fontSize: "clamp(2.5rem, 7vw, 4rem)", fontWeight: 900, lineHeight: 1.1, marginBottom: "1.5rem", letterSpacing: "-0.04em" }}
                    >
                        JetPOS ile <span className="holographic-text">Birlikte Büyüyelim</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{ fontSize: "1.25rem", color: "rgba(255,255,255,0.5)", maxWidth: "700px", margin: "0 auto", lineHeight: 1.6 }}
                    >
                        Türkiye&apos;nin en hızlı büyüyen teknoloji ekosisteminde yerinizi alın. Partnerlik modellerimizle hem kazanın hem de ticaretin dijitalleşmesine liderlik edin.
                    </motion.p>
                </div>
            </section>

            {/* Partner Models */}
            <section style={{ paddingBottom: "8rem" }}>
                <div className="site-container">
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem" }} className="partner-grid">
                        {partnerTypes.map((v, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15 }}
                                style={{
                                    padding: "2.5rem",
                                    background: "rgba(255,255,255,0.02)",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    borderRadius: "2.5rem",
                                    display: "flex", flexDirection: "column", gap: "1.5rem"
                                }}
                            >
                                <div style={{ 
                                    width: "3.5rem", height: "3.5rem", borderRadius: "1.125rem", 
                                    background: `${v.color}15`, border: `1px solid ${v.color}30`,
                                    display: "flex", alignItems: "center", justifyContent: "center"
                                }}>
                                    <v.icon style={{ color: v.color, width: "1.75rem", height: "1.75rem" }} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>{v.title}</h3>
                                    <p style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.6, fontSize: "0.95rem" }}>{v.desc}</p>
                                </div>
                                <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                    {v.features.map((f, j) => (
                                        <div key={j} style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>
                                            <ShieldCheck style={{ width: "1rem", height: "1rem", color: v.color }} />
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
            <section style={{ padding: "8rem 0", background: "rgba(37, 99, 235, 0.03)", position: "relative" }}>
                <div className="site-container" style={{ maxWidth: "1000px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "5rem", alignItems: "start" }} className="form-grid">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 style={{ fontSize: "2.5rem", fontWeight: 900, marginBottom: "1.5rem", lineHeight: 1.2 }}>Partnerlik Başvurusu</h2>
                            <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "2rem", lineHeight: 1.7 }}>
                                Ekibimiz başvurunuzu 48 saat içinde inceleyip sizinle iletişime geçecektir. Bir sonraki başarılı iş ortaklığımız sizinkisi olabilir.
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <div style={{ background: "rgba(255,255,255,0.03)", padding: "1.25rem", borderRadius: "1.25rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", marginBottom: "0.25rem" }}>Bize Mail Atın</div>
                                    <div style={{ fontWeight: 600 }}>info@jetpos.shop</div>
                                </div>
                                <div style={{ background: "rgba(255,255,255,0.03)", padding: "1.25rem", borderRadius: "1.25rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", marginBottom: "0.25rem" }}>Bizi Arayın</div>
                                    <div style={{ fontWeight: 600 }}>0536 661 0169</div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "2.5rem", padding: "3rem" }}
                        >
                            {status === "success" ? (
                                <div style={{ textAlign: "center", padding: "3rem 0" }}>
                                    <div style={{ width: "4rem", height: "4rem", borderRadius: "50%", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                                        <Check style={{ color: "white", width: "2rem", height: "2rem" }} />
                                    </div>
                                    <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Başvurunuz Alındı!</h3>
                                    <p style={{ color: "rgba(255,255,255,0.5)" }}>Sizinle en kısa sürede iletişime geçeceğiz. Teşekkürler!</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                                        <div>
                                            <input 
                                                type="text" placeholder="Ad Soyad" required
                                                style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.875rem", padding: "1rem", color: "white" }} 
                                            />
                                        </div>
                                        <div>
                                            <input 
                                                type="text" placeholder="Firma Adı" required
                                                style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.875rem", padding: "1rem", color: "white" }} 
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <input 
                                            type="email" placeholder="E-posta Adresi" required
                                            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.875rem", padding: "1rem", color: "white" }} 
                                        />
                                    </div>
                                    <div>
                                        <select 
                                            style={{ width: "100%", background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.875rem", padding: "1rem", color: "white" }}
                                        >
                                            <option>Bayi Kanalı</option>
                                            <option>Teknik Entegratör</option>
                                            <option>Kurumsal Çözüm Ortağı</option>
                                        </select>
                                    </div>
                                    <div>
                                        <textarea 
                                            placeholder="Kısaca kendinizden ve planlarınızdan bahsedin..." rows={4}
                                            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.875rem", padding: "1rem", color: "white", resize: "none" }} 
                                        />
                                    </div>
                                    <button type="submit" disabled={status === "loading"} className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                                        {status === "loading" ? <Loader2 style={{ animation: "spin 2s linear infinite" }} /> : "Başvuruyu Tamamla"}
                                    </button>
                                </form>
                            )}
                        </motion.div>
                    </div>
                </div>
            </section>

            <style>{`
                @media (max-width: 900px) {
                    .partner-grid { grid-template-columns: 1fr !important; }
                    .form-grid { grid-template-columns: 1fr !important; gap: 3rem !important; }
                }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
            
            <Footer />
        </div>
    );
}
