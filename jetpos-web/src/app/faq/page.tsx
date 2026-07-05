"use client";

import React from "react";
import { motion } from "framer-motion";
import { HelpCircle, MessageCircle, ArrowRight, Phone } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FAQ from "@/components/FAQ";

export default function FAQPage() {
    return (
        <>
            <div className="site-bg" />
            <main style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
                <Navbar />

                {/* Header / Hero */}
                <section style={{ paddingTop: "9rem", paddingBottom: "3.5rem", textAlign: "center" }}>
                    <div className="site-container">
                        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
                            <motion.span
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="badge"
                                style={{ marginBottom: "1.5rem" }}
                            >
                                <HelpCircle style={{ width: "0.85rem", height: "0.85rem" }} />
                                YARDIM MERKEZİ
                            </motion.span>
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                style={{
                                    fontSize: "clamp(2.25rem, 6vw, 3.75rem)",
                                    fontWeight: 900,
                                    color: "#111827",
                                    marginBottom: "1.25rem",
                                    letterSpacing: "-0.03em",
                                    lineHeight: 1.1,
                                }}
                            >
                                Size Nasıl <br />
                                <span className="holographic-text">Yardımcı Olabiliriz?</span>
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                style={{ fontSize: "1.05rem", color: "#4B5563", lineHeight: 1.65, maxWidth: "560px", margin: "0 auto" }}
                            >
                                JetPOS ile ilgili merak ettiğiniz tüm soruların yanıtlarını burada bulabilirsiniz. Aradığınızı bulamazsanız destek ekibimizle iletişime geçin.
                            </motion.p>
                        </div>
                    </div>
                </section>

                {/* Main FAQ Content */}
                <section style={{ paddingBottom: "5rem" }}>
                    <div className="site-container" style={{ maxWidth: "800px" }}>
                        <FAQ />
                    </div>
                </section>

                {/* Support CTA */}
                <section style={{ paddingBottom: "7rem" }}>
                    <div className="site-container" style={{ maxWidth: "1000px" }}>
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="cta-grid"
                            style={{
                                background: "linear-gradient(135deg, rgba(120,134,199,0.08), rgba(120,134,199,0.03))",
                                border: "1px solid rgba(120,134,199,0.2)",
                                borderRadius: "1.5rem",
                                padding: "3rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "3rem",
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#111827", marginBottom: "0.75rem" }}>
                                    Aradığınız yanıtı bulamadınız mı?
                                </h2>
                                <p style={{ color: "#4B5563", fontSize: "1rem", lineHeight: 1.6 }}>
                                    Uzman destek ekibimiz haftanın 7 günü her türlü teknik sorunuz için yardıma hazır.
                                </p>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "stretch" }}>
                                <a href="/iletisim" className="btn-primary" style={{ textDecoration: "none", justifyContent: "center", gap: "0.6rem" }}>
                                    <MessageCircle size={18} />
                                    Destek Talebi Oluştur
                                    <ArrowRight size={16} />
                                </a>
                                <a href="tel:05366610169" className="btn-outline" style={{ textDecoration: "none", justifyContent: "center", gap: "0.6rem" }}>
                                    <Phone size={16} />
                                    0536 661 0169
                                </a>
                            </div>
                        </motion.div>
                    </div>
                </section>

                <style>{`
                    @media (max-width: 900px) {
                        .cta-grid { flex-direction: column; text-align: center; gap: 2rem !important; padding: 2rem !important; }
                    }
                `}</style>

                <Footer />
            </main>
        </>
    );
}
