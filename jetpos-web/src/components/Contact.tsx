"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send, Check, Loader2, Phone, MapPin } from "lucide-react";

export default function Contact() {
    const [form, setForm] = useState({ name: "", email: "", message: "" });
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.message) return;

        setStatus("loading");
        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Hata oluştu.");
            setStatus("success");
            setForm({ name: "", email: "", message: "" });
        } catch (err: any) {
            setStatus("error");
            setErrorMsg(err.message);
            setTimeout(() => setStatus("idle"), 4000);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "0.75rem 1rem",
        background: "#F8FAFC",
        border: "1px solid #E5E7EB",
        borderRadius: "0.75rem",
        color: "#111827",
        fontSize: "0.95rem",
        outline: "none",
        transition: "border-color 0.2s, background 0.2s",
        fontFamily: "inherit",
        boxSizing: "border-box",
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        e.target.style.borderColor = "#7886C7";
        e.target.style.background = "#ffffff";
    };
    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        e.target.style.borderColor = "#E5E7EB";
        e.target.style.background = "#F8FAFC";
    };

    return (
        <section 
            id="contact" 
            style={{
                padding: "6.5rem 0",
                position: "relative",
                backgroundColor: "#FFFFFF",
            }}
        >
            {/* Subtle Radial Glow Spot at the top */}
            <div style={{
                position: "absolute",
                top: "-150px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "800px",
                height: "300px",
                background: "radial-gradient(circle at center, rgba(120, 134, 199, 0.04) 0%, transparent 70%)",
                pointerEvents: "none",
                zIndex: 1,
            }} />
            <div className="site-container">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    style={{ textAlign: "center", marginBottom: "4rem" }}
                >
                    <span className="badge" style={{ marginBottom: "1.25rem", display: "inline-flex" }}>
                        İletişim
                    </span>
                    <h2 style={{
                        fontSize: "clamp(2rem, 5vw, 3.25rem)",
                        fontWeight: 800,
                        color: "#111827",
                        marginBottom: "1rem",
                        lineHeight: 1.2
                    }}>
                        <span className="holographic-text">Bizimle</span> İletişime Geçin
                    </h2>
                    <p style={{ color: "#4B5563", fontSize: "1.125rem", maxWidth: "560px", margin: "0 auto" }}>
                        Sorularınız mı var? Ekibimiz size yardımcı olmak için burada.
                    </p>
                </motion.div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div style={{
                            background: "#ffffff",
                            border: "1px solid #E5E7EB",
                            borderRadius: "1.5rem",
                            padding: "2.25rem",
                            boxShadow: "0 4px 20px rgba(120, 134, 199, 0.02)"
                        }}>
                            <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", marginBottom: "1.5rem" }}>
                                Bize Ulaşın
                            </h3>

                            {status === "success" ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{
                                        textAlign: "center", padding: "3rem 1rem",
                                        display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem"
                                    }}
                                >
                                    <div style={{
                                        width: "4rem", height: "4rem", borderRadius: "50%",
                                        backgroundImage: "linear-gradient(135deg, #7886C7, #5A659F)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        boxShadow: "0 0 30px rgba(120,134,199,0.3)"
                                    }}>
                                        <Check style={{ width: "2rem", height: "2rem", color: "white" }} />
                                    </div>
                                    <h4 style={{ color: "#111827", fontWeight: 700, fontSize: "1.25rem", margin: 0 }}>Mesajınız Alındı!</h4>
                                    <p style={{ color: "#4B5563", fontSize: "0.9rem", margin: 0 }}>
                                        En kısa sürede size dönüş yapacağız.
                                    </p>
                                    <button
                                        onClick={() => setStatus("idle")}
                                        style={{
                                            marginTop: "0.5rem", padding: "0.625rem 1.5rem",
                                            background: "#F1F5F9", border: "1px solid #E5E7EB",
                                            borderRadius: "0.75rem", color: "#4B5563",
                                            cursor: "pointer", fontFamily: "inherit", fontSize: "0.875rem"
                                        }}
                                    >
                                        Yeni Mesaj Gönder
                                    </button>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                                    <div>
                                        <label htmlFor="contact-name" style={{ display: "block", color: "#4B5563", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 500 }}>
                                            Ad Soyad
                                        </label>
                                        <input
                                            type="text"
                                            id="contact-name"
                                            value={form.name}
                                            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                            style={inputStyle}
                                            placeholder="Adınız ve soyadınız"
                                            onFocus={handleFocus}
                                            onBlur={handleBlur}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="contact-email" style={{ display: "block", color: "#4B5563", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 500 }}>
                                            E-posta
                                        </label>
                                        <input
                                            type="email"
                                            id="contact-email"
                                            value={form.email}
                                            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                            style={inputStyle}
                                            placeholder="ornek@email.com"
                                            onFocus={handleFocus}
                                            onBlur={handleBlur}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="contact-message" style={{ display: "block", color: "#4B5563", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 500 }}>
                                            Mesajınız
                                        </label>
                                        <textarea
                                            id="contact-message"
                                            rows={4}
                                            value={form.message}
                                            onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                                            style={{ ...inputStyle, resize: "none" }}
                                            placeholder="Mesajınızı buraya yazın..."
                                            onFocus={handleFocus}
                                            onBlur={handleBlur}
                                            required
                                        />
                                    </div>

                                    {status === "error" && (
                                        <div style={{
                                            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                                            borderRadius: "0.75rem", padding: "0.75rem 1rem",
                                            color: "#ef4444", fontSize: "0.875rem"
                                        }}>
                                            {errorMsg}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={status === "loading"}
                                        className="btn-primary"
                                        style={{ width: "100%", justifyContent: "center", opacity: status === "loading" ? 0.7 : 1 }}
                                    >
                                        {status === "loading" ? (
                                            <>
                                                <Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} />
                                                Gönderiliyor...
                                            </>
                                        ) : (
                                            <>
                                                Gönder
                                                <Send style={{ width: "1rem", height: "1rem" }} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </motion.div>

                    {/* Contact Info */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
                    >
                        {[
                            { icon: Mail, label: "E-posta", value: "info@jetpos.shop", href: "mailto:info@jetpos.shop", color: "#7886C7" },
                            { icon: Phone, label: "Telefon", value: "0536 661 0169", href: "tel:05366610169", color: "#4F46E5" },
                            { icon: MapPin, label: "Adres", value: "Su Yolu Cad Turgut Özal Mah No 31/A", href: "#", color: "#6366F1" },
                        ].map((item, i) => (
                            <div key={i} style={{
                                background: "#ffffff",
                                border: "1px solid #E5E7EB",
                                borderRadius: "1.25rem",
                                padding: "1.5rem",
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "1rem",
                                transition: "all 0.3s"
                            }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLDivElement).style.borderColor = `${item.color}`;
                                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                                    (e.currentTarget as HTMLDivElement).style.boxShadow = `0 10px 24px rgba(120, 134, 199, 0.05)`;
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLDivElement).style.borderColor = "#E5E7EB";
                                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                                    (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                                }}
                            >
                                <div style={{
                                    width: "3rem", height: "3rem", borderRadius: "0.875rem",
                                    background: `${item.color}15`,
                                    border: `1px solid ${item.color}30`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0
                                }}>
                                    <item.icon style={{ width: "1.25rem", height: "1.25rem", color: item.color }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: "0.8rem", color: "#6B7280", fontWeight: 500, marginBottom: "0.25rem" }}>{item.label}</div>
                                    <a href={item.href} style={{ color: "#374151", fontSize: "0.95rem", fontWeight: 600, textDecoration: "none", whiteSpace: "pre-line" }}>
                                        {item.value}
                                    </a>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </section>
    );
}
