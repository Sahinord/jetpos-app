"use client";

import { motion } from "framer-motion";
import { HelpCircle, Search, MessageCircle, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FAQ from "@/components/FAQ";

export default function FAQPage() {
    return (
        <div style={{ minHeight: "100vh", background: "#060914", color: "white" }}>
            <Navbar />

            {/* Header / Hero */}
            <section style={{ paddingTop: "10.5rem", paddingBottom: "6rem", position: "relative", overflow: "hidden" }}>
                <div style={{
                    position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                    width: "1200px", height: "600px",
                    background: "radial-gradient(circle at center, rgba(37,99,235,0.06) 0%, transparent 70%)",
                    pointerEvents: "none"
                }} />
                
                <div className="site-container">
                    <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
                        <motion.span 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="badge" 
                            style={{ marginBottom: "1.5rem" }}
                        >
                            YARDIM MERKEZİ
                        </motion.span>
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            style={{ fontSize: "clamp(2.5rem, 7vw, 4rem)", fontWeight: 900, marginBottom: "1.5rem", letterSpacing: "-0.04em" }}
                        >
                            Size Nasıl <br />
                            <span className="holographic-text">Yardımcı Olabiliriz?</span>
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            style={{ fontSize: "1.125rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}
                        >
                            JetPOS ile ilgili merak ettiğiniz tüm soruların yanıtlarını burada bulabilirsiniz. Aradığınızı bulamazsanız destek ekibimizle iletişime geçin.
                        </motion.p>
                    </div>
                </div>
            </section>

            {/* Main FAQ Content */}
            <section style={{ paddingBottom: "8rem" }}>
                <div className="site-container" style={{ maxWidth: "1000px" }}>
                    <FAQ />
                </div>
            </section>

            {/* Support CTA */}
            <section style={{ padding: "6rem 0", background: "rgba(37, 99, 235, 0.04)", borderTop: "1px solid rgba(37, 99, 235, 0.1)" }}>
                <div className="site-container">
                    <div style={{ 
                        background: "rgba(255,255,255,0.02)", 
                        border: "1px solid rgba(255,255,255,0.08)", 
                        borderRadius: "2.5rem", 
                        padding: "3.5rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "between",
                        gap: "3rem"
                    }} className="cta-grid">
                        <div style={{ flex: 1 }}>
                            <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "1rem" }}>Aradığınız yanıtı bulamadınız mı?</h2>
                            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.1rem" }}>
                                Uzman destek ekibimiz haftanın 7 günü her türlü teknik sorunuz için yardıma hazır.
                            </p>
                        </div>
                        <div>
                            <a href="/iletisim" className="btn-primary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.75rem" }}>
                                <MessageCircle size={20} />
                                Destek Talebi Oluştur
                                <ArrowRight size={18} />
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <style>{`
                @media (max-width: 900px) {
                    .cta-grid { flex-direction: column; text-align: center; gap: 2rem !important; padding: 2.5rem !important; }
                }
            `}</style>

            <Footer />
        </div>
    );
}
