"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Monitor, Smartphone, LayoutGrid, Zap, CheckCircle2 } from "lucide-react";

const solutions = [
    {
        id: "jetkasa",
        title: "JetKasa",
        subtitle: "Hepsi-Bir-Arada POS Terminali",
        description: "Modern restoran ve perakende işletmeleri için tasarlanmış tam entegre satış terminali. Dokunmatik ekranı ve şık tasarımıyla dükkanınıza değer katar.",
        features: ["15.6\" HD Dokunmatik Ekran", "Entegre Müşteri Ekranı", "Fansız Sessiz Çalışma", "Tüm Çevresel Birimlerle Uyumlu"],
        image: "/jetkasa.png",
        color: "#3b82f6"
    },
    {
        id: "jetmatik",
        title: "JetMatik",
        subtitle: "Self-Servis Sipariş Kiosku",
        description: "Müşterilerinizin kendi siparişlerini vermesini sağlayarak iş yükünüzü azaltın. Akışkan arayüzü ve güvenilir donanımı ile kuyrukları eritin.",
        features: ["Devasa Dikey Dokunmatik Panel", "Entegre Ödeme Terminali", "Hızlı Fiş Yazıcısı", "Göz Alıcı LED Aydınlatma"],
        image: "/jetmatik.png",
        color: "#06b6d4"
    },
    {
        id: "jetosk",
        title: "JetOSK",
        subtitle: "Kompakt Self-Check-Out",
        description: "Dar alanlar için ideal, masaüstü veya duvara monte edilebilen hızlı ödeme noktası. Market ve unlu mamul işletmelerinin favorisi.",
        features: ["Kompakt Minimalist Tasarım", "Hızlı Barkod Okuyucu", "Temassız Ödeme Entegrasyonu", "Kolay Kurulum ve Montaj"],
        image: "/jetosk.png",
        color: "#8b5cf6"
    }
];

export default function HardwareSolutions() {
    return (
        <section id="hardware" style={{ padding: "8rem 0", position: "relative", overflow: "hidden" }}>
            <div className="site-container">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    style={{ textAlign: "center", marginBottom: "5rem" }}
                >
                    <span className="badge">Donanım Çözümlerimiz</span>
                    <h2 style={{
                        marginTop: "1.5rem",
                        fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
                        fontWeight: 900,
                        color: "white",
                        lineHeight: 1.1
                    }}>
                        Güçlü Donanım, <br />
                        <span className="holographic-text">Akıllı Yazılım.</span>
                    </h2>
                    <p style={{
                        marginTop: "1.5rem",
                        fontSize: "1.125rem",
                        color: "rgba(255,255,255,0.45)",
                        maxWidth: "600px",
                        margin: "1.5rem auto 0"
                    }}>
                        İhtiyacınıza en uygun cihazı seçin, JetPOS yazılımıyla tam uyumlu çalışmanın keyfini sürün.
                    </p>
                </motion.div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "6rem" }}>
                    {solutions.map((item, idx) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8, delay: idx * 0.1 }}
                            style={{
                                display: "grid",
                                gridTemplateColumns: idx % 2 === 0 ? "1fr 1.2fr" : "1.2fr 1fr",
                                gap: "4rem",
                                alignItems: "center"
                            }}
                            className="solution-grid"
                        >
                            {/* Visual Part */}
                            <div style={{ order: idx % 2 === 0 ? 1 : 2, position: "relative" }}>
                                <div style={{
                                    position: "relative",
                                    zIndex: 2,
                                    borderRadius: "2.5rem",
                                    overflow: "hidden",
                                    boxShadow: `0 30px 60px -12px rgba(0,0,0,0.6), 0 0 0 1px ${item.color}22`,
                                    background: "rgba(10, 15, 30, 0.4)",
                                    backdropFilter: "blur(20px)"
                                }}>
                                    <Image
                                        src={item.image}
                                        alt={item.title}
                                        width={800}
                                        height={800}
                                        style={{
                                            width: "100%",
                                            height: "auto",
                                            display: "block",
                                            transition: "transform 0.5s ease"
                                        }}
                                        className="hover-zoom"
                                    />
                                </div>
                                {/* Background Glow */}
                                <div style={{
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    transform: "translate(-50%, -50%)",
                                    width: "120%",
                                    height: "120%",
                                    background: `radial-gradient(circle, ${item.color}15 0%, transparent 70%)`,
                                    zIndex: 1,
                                    pointerEvents: "none"
                                }} />
                            </div>

                            {/* Content Part */}
                            <div style={{ order: idx % 2 === 0 ? 2 : 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                                    <div style={{
                                        padding: "0.5rem 1rem",
                                        borderRadius: "9999px",
                                        background: `${item.color}15`,
                                        border: `1px solid ${item.color}33`,
                                        color: item.color,
                                        fontWeight: 800,
                                        fontSize: "0.75rem",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.1em"
                                    }}>
                                        {item.id.toUpperCase()}
                                    </div>
                                    <div style={{ height: "1px", flex: 1, background: `linear-gradient(90deg, ${item.color}33, transparent)` }} />
                                </div>
                                <h3 style={{
                                    fontSize: "clamp(2rem, 4vw, 3rem)",
                                    fontWeight: 900,
                                    color: "white",
                                    marginBottom: "0.5rem"
                                }}>
                                    {item.title}
                                </h3>
                                <p style={{
                                    fontSize: "1.25rem",
                                    fontWeight: 600,
                                    color: item.color,
                                    marginBottom: "1.5rem"
                                }}>
                                    {item.subtitle}
                                </p>
                                <p style={{
                                    color: "rgba(255,255,255,0.5)",
                                    fontSize: "1.1rem",
                                    lineHeight: 1.7,
                                    marginBottom: "2rem"
                                }}>
                                    {item.description}
                                </p>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                                    {item.features.map((feature, fIdx) => (
                                        <div key={fIdx} style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                                            <div style={{
                                                width: "1.5rem",
                                                height: "1.5rem",
                                                borderRadius: "50%",
                                                background: `${item.color}15`,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0
                                            }}>
                                                <CheckCircle2 size={14} color={item.color} />
                                            </div>
                                            <span style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{
                                        marginTop: "3rem",
                                        padding: "1rem 2rem",
                                        borderRadius: "1rem",
                                        background: "white",
                                        color: "black",
                                        fontWeight: 800,
                                        border: "none",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.75rem",
                                        boxShadow: "0 10px 20px rgba(255,255,255,0.15)"
                                    }}
                                >
                                    Teklif Al <Zap size={18} fill="black" />
                                </motion.button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <style>{`
                @media (max-width: 960px) {
                    .solution-grid {
                        grid-template-columns: 1fr !important;
                        gap: 2.5rem !important;
                        text-align: center;
                    }
                    .solution-grid > div {
                        order: unset !important;
                    }
                    .solution-grid div[style*="display: grid; grid-template-columns: 1fr 1fr"] {
                        grid-template-columns: 1fr !important;
                        text-align: left;
                    }
                    .solution-grid button {
                        margin: 2.5rem auto 0 !important;
                    }
                    .solution-grid div[style*="align-items: center; gap: 1rem"] {
                        justify-content: center;
                    }
                }
                .hover-zoom:hover {
                    transform: scale(1.05);
                }
            `}</style>
        </section>
    );
}
