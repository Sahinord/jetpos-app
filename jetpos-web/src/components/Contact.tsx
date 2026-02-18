"use client";

import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send } from "lucide-react";

export default function Contact() {
    return (
        <section id="contact" style={{ padding: "7rem 0", position: "relative", zIndex: 2 }}>
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
                        color: "white",
                        marginBottom: "1rem",
                        lineHeight: 1.2
                    }}>
                        <span className="holographic-text">Bizimle</span> İletişime Geçin
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "1.125rem", maxWidth: "560px", margin: "0 auto" }}>
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
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "1.5rem",
                            padding: "2.25rem"
                        }}>
                            <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "white", marginBottom: "1.5rem" }}>
                                Bize Ulaşın
                            </h3>
                            <form style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                                <div>
                                    <label htmlFor="name" style={{ display: "block", color: "rgba(255,255,255,0.7)", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 500 }}>
                                        Ad Soyad
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        style={{
                                            width: "100%", padding: "0.75rem 1rem",
                                            background: "rgba(255,255,255,0.04)",
                                            border: "1px solid rgba(255,255,255,0.1)",
                                            borderRadius: "0.75rem",
                                            color: "white",
                                            fontSize: "0.95rem",
                                            outline: "none",
                                            transition: "border-color 0.2s"
                                        }}
                                        placeholder="Adınız ve soyadınız"
                                        onFocus={e => (e.target.style.borderColor = "rgba(59,130,246,0.5)")}
                                        onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" style={{ display: "block", color: "rgba(255,255,255,0.7)", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 500 }}>
                                        E-posta
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        style={{
                                            width: "100%", padding: "0.75rem 1rem",
                                            background: "rgba(255,255,255,0.04)",
                                            border: "1px solid rgba(255,255,255,0.1)",
                                            borderRadius: "0.75rem",
                                            color: "white",
                                            fontSize: "0.95rem",
                                            outline: "none",
                                            transition: "border-color 0.2s"
                                        }}
                                        placeholder="ornek@email.com"
                                        onFocus={e => (e.target.style.borderColor = "rgba(59,130,246,0.5)")}
                                        onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="message" style={{ display: "block", color: "rgba(255,255,255,0.7)", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 500 }}>
                                        Mesajınız
                                    </label>
                                    <textarea
                                        id="message"
                                        rows={4}
                                        style={{
                                            width: "100%", padding: "0.75rem 1rem",
                                            background: "rgba(255,255,255,0.04)",
                                            border: "1px solid rgba(255,255,255,0.1)",
                                            borderRadius: "0.75rem",
                                            color: "white",
                                            fontSize: "0.95rem",
                                            outline: "none",
                                            resize: "none",
                                            transition: "border-color 0.2s",
                                            fontFamily: "inherit"
                                        }}
                                        placeholder="Mesajınızı buraya yazın..."
                                        onFocus={e => (e.target.style.borderColor = "rgba(59,130,246,0.5)")}
                                        onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                                    />
                                </div>
                                <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                                    Gönder
                                    <Send style={{ width: "1rem", height: "1rem" }} />
                                </button>
                            </form>
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
                            { icon: Mail, label: "E-posta", value: "info@jetpos.com", href: "mailto:info@jetpos.com", color: "#60a5fa" },
                            { icon: Phone, label: "Telefon", value: "+90 500 123 45 67", href: "tel:+905001234567", color: "#a78bfa" },
                            { icon: MapPin, label: "Adres", value: "Teknoloji Caddesi No: 123\nŞişli / İstanbul", href: "#", color: "#34d399" },
                        ].map((item, i) => (
                            <div key={i} style={{
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.07)",
                                borderRadius: "1.25rem",
                                padding: "1.5rem",
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "1rem",
                                transition: "all 0.3s"
                            }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLDivElement).style.borderColor = `${item.color}40`;
                                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
                                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
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
                                    <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", fontWeight: 500, marginBottom: "0.25rem" }}>{item.label}</div>
                                    <a href={item.href} style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.95rem", fontWeight: 500, textDecoration: "none", whiteSpace: "pre-line" }}>
                                        {item.value}
                                    </a>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
