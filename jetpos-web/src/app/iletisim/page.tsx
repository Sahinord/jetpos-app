"use client";

import React from "react";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Clock, MessageSquare, ArrowUpRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SupportFormSection from "@/components/SupportFormSection";

const CONTACT_ITEMS = [
    {
        icon: Phone,
        label: "Telefon",
        value: "0536 661 0169",
        sub: "Hafta içi 09:00 – 18:00",
        href: "tel:05366610169",
    },
    {
        icon: Mail,
        label: "E-posta",
        value: "info@jetpos.shop",
        sub: "7/24 Teknik Destek",
        href: "mailto:info@jetpos.shop",
    },
    {
        icon: MapPin,
        label: "Adres",
        value: "Turgut Özal Mah. No:31/A",
        sub: "İstanbul, Türkiye",
        href: "https://maps.google.com/?q=Su+Yolu+Cad+Turgut+%C3%96zal+Mah+No+31/A+%C4%B0stanbul",
    },
];

export default function ContactPage() {
    return (
        <>
            <div className="site-bg" />
            <main style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
                <Navbar />

                {/* Header */}
                <section style={{ paddingTop: "9rem", paddingBottom: "3.5rem", textAlign: "center" }}>
                    <div className="site-container">
                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="badge"
                            style={{ marginBottom: "1.5rem" }}
                        >
                            <MessageSquare style={{ width: "0.85rem", height: "0.85rem" }} />
                            İLETİŞİM
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            style={{
                                fontSize: "clamp(2.25rem, 6vw, 3.75rem)",
                                fontWeight: 900,
                                color: "#111827",
                                marginBottom: "1rem",
                                letterSpacing: "-0.03em",
                            }}
                        >
                            Bizimle <span className="holographic-text">İletişime Geçin</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            style={{ fontSize: "1.05rem", color: "#4B5563", maxWidth: "560px", margin: "0 auto", lineHeight: 1.6 }}
                        >
                            Sorularınız, iş ortaklığı talepleriniz veya teknik destek için ekibimiz her zaman yanınızda.
                        </motion.p>
                    </div>
                </section>

                {/* Contact Info Cards */}
                <section style={{ paddingBottom: "2rem" }}>
                    <div className="site-container">
                        <div className="contact-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }}>
                            {CONTACT_ITEMS.map((item, i) => (
                                <motion.a
                                    key={i}
                                    href={item.href}
                                    target={item.href.startsWith("http") ? "_blank" : undefined}
                                    rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.08 }}
                                    className="contact-card"
                                    style={{
                                        padding: "2rem 1.75rem",
                                        background: "white",
                                        border: "1px solid rgba(120,134,199,0.15)",
                                        borderRadius: "1.25rem",
                                        textAlign: "center",
                                        textDecoration: "none",
                                        display: "block",
                                        position: "relative",
                                    }}
                                >
                                    <ArrowUpRight
                                        className="contact-card-arrow"
                                        style={{
                                            position: "absolute", top: "1rem", right: "1rem",
                                            width: "1rem", height: "1rem", color: "#9AA7DF",
                                            opacity: 0, transition: "opacity 0.2s ease",
                                        }}
                                    />
                                    <div
                                        style={{
                                            width: "3.25rem",
                                            height: "3.25rem",
                                            borderRadius: "0.875rem",
                                            background: "rgba(120,134,199,0.08)",
                                            border: "1px solid rgba(120,134,199,0.2)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            margin: "0 auto 1.25rem",
                                        }}
                                    >
                                        <item.icon style={{ color: "#7886C7", width: "1.35rem", height: "1.35rem" }} />
                                    </div>
                                    <h3
                                        style={{
                                            fontSize: "0.75rem",
                                            fontWeight: 700,
                                            color: "#7886C7",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.1em",
                                            marginBottom: "0.5rem",
                                        }}
                                    >
                                        {item.label}
                                    </h3>
                                    <p style={{ fontSize: "1.15rem", fontWeight: 700, color: "#111827", marginBottom: "0.35rem" }}>
                                        {item.value}
                                    </p>
                                    <p style={{ color: "#6B7280", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                                        <Clock style={{ width: "0.8rem", height: "0.8rem", color: "#9AA7DF" }} />
                                        {item.sub}
                                    </p>
                                </motion.a>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Callback form */}
                <SupportFormSection />

                <style>{`
                    .contact-card {
                        transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
                        box-shadow: 0 1px 2px rgba(17,24,39,0.04);
                    }
                    .contact-card:hover {
                        transform: translateY(-4px);
                        box-shadow: 0 16px 32px rgba(90,101,159,0.16);
                        border-color: rgba(120,134,199,0.4);
                    }
                    .contact-card:hover .contact-card-arrow {
                        opacity: 1;
                    }
                    @media (max-width: 900px) {
                        .contact-grid { grid-template-columns: 1fr !important; }
                    }
                `}</style>

                <Footer />
            </main>
        </>
    );
}
