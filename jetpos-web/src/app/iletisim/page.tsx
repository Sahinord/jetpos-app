"use client";

import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Send, MessageSquare, Clock, Globe } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Contact from "@/components/Contact";

export default function ContactPage() {
    return (
        <div style={{ minHeight: "100vh", background: "#060914", color: "white" }}>
            <Navbar />

            {/* Header */}
            <section style={{ paddingTop: "10rem", paddingBottom: "4rem", textAlign: "center", position: "relative" }}>
                <div style={{
                    position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                    width: "1200px", height: "600px",
                    background: "radial-gradient(circle at center, rgba(37,99,235,0.06) 0%, transparent 70%)",
                    pointerEvents: "none"
                }} />
                
                <div className="site-container">
                    <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="badge" style={{ marginBottom: "1.5rem" }}>
                        İLETİŞİM
                    </motion.span>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        style={{ fontSize: "clamp(2.5rem, 7vw, 4rem)", fontWeight: 900, marginBottom: "1rem", letterSpacing: "-0.04em" }}
                    >
                        Bizimle <span className="holographic-text">İletişime Geçin</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{ fontSize: "1.125rem", color: "rgba(255,255,255,0.5)", maxWidth: "600px", margin: "0 auto" }}
                    >
                        Sorularınız, iş ortaklığı talepleriniz veya teknik destek için ekibimiz her zaman yanınızda.
                    </motion.p>
                </div>
            </section>

            {/* Contact Info Cards */}
            <section style={{ paddingBottom: "4rem" }}>
                <div className="site-container">
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }} className="contact-grid">
                        {[
                            { icon: Phone, label: "Telefon", value: "0536 661 0169", sub: "Hafta içi 09:00 - 18:00", color: "#3b82f6" },
                            { icon: Mail, label: "E-posta", value: "info@jetpos.shop", sub: "7/24 Teknik Destek", color: "#a78bfa" },
                            { icon: MapPin, label: "Adres", value: "Turgut Özal Mah. No:31/A", sub: "İstanbul, Türkiye", color: "#10b981" }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    padding: "2rem",
                                    background: "rgba(255,255,255,0.02)",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    borderRadius: "1.5rem",
                                    textAlign: "center"
                                }}
                            >
                                <div style={{ 
                                    width: "3rem", height: "3rem", borderRadius: "0.75rem", 
                                    background: `${item.color}15`, border: `1px solid ${item.color}30`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    margin: "0 auto 1.25rem"
                                }}>
                                    <item.icon style={{ color: item.color, width: "1.25rem", height: "1.1.25rem" }} />
                                </div>
                                <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>{item.label}</h3>
                                <p style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.25rem" }}>{item.value}</p>
                                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.85rem" }}>{item.sub}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Reuse existing Contact component for the form */}
            <div style={{ paddingBottom: "8rem" }}>
                <Contact />
            </div>

            <style>{`
                @media (max-width: 900px) {
                    .contact-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
            
            <Footer />
        </div>
    );
}
