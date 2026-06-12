"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Monitor, Smartphone, Tablet, Cloud, Zap, ShieldCheck } from "lucide-react";

export default function AppShowcase() {
    return (
        <section 
            style={{
                padding: "6.5rem 0",
                position: "relative",
                overflow: "hidden",
                backgroundColor: "#FFFFFF",
            }}
        >
            {/* Noise Texture Overlay */}
            <div style={{
                position: "absolute", inset: 0,
                opacity: 0.03, zIndex: 0, pointerEvents: "none",
                backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')"
            }} />

            <div className="site-container">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }} className="showcase-grid">

                    {/* Visual Side */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        style={{ position: "relative" }}
                    >
                        {/* Mesh Glow behind mockups */}
                        <div style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: "140%",
                            height: "140%",
                            background: "radial-gradient(circle, rgba(120, 134, 199, 0.25) 0%, transparent 60%)",
                            zIndex: 1,
                            pointerEvents: "none",
                            animation: "pulseGlow 6s ease-in-out infinite alternate"
                        }} />

                        {/* Desktop Mockup (Kept Dark) */}
                        <div style={{
                            position: "relative",
                            zIndex: 2,
                            background: "rgba(10, 15, 30, 0.95)",
                            borderRadius: "1.5rem",
                            border: "1px solid rgba(255, 255, 255, 0.15)",
                            padding: "0.5rem",
                            boxShadow: "0 32px 64px rgba(0,0,0,0.2), 0 0 0 1px rgba(120,134,199,0.1) inset"
                        }}>
                            <div style={{
                                width: "100%",
                                height: "24px",
                                display: "flex",
                                gap: "6px",
                                padding: "0 12px",
                                alignItems: "center",
                                background: "rgba(255,255,255,0.03)",
                                borderBottom: "1px solid rgba(255,255,255,0.08)",
                                borderTopLeftRadius: "1rem",
                                borderTopRightRadius: "1rem"
                            }}>
                                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ff5f56", border: "1px solid rgba(0,0,0,0.1)" }} />
                                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ffbd2e", border: "1px solid rgba(0,0,0,0.1)" }} />
                                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#27c93f", border: "1px solid rgba(0,0,0,0.1)" }} />
                                <div style={{ flex: 1, textAlign: "center", fontSize: "10px", color: "rgba(255,255,255,0.3)", fontWeight: 600, letterSpacing: "0.05em" }}>JETPOS DASHBOARD</div>
                            </div>
                            <div style={{ padding: "4px", background: "#0c111d", borderBottomLeftRadius: "1rem", borderBottomRightRadius: "1rem" }}>
                                <Image
                                    src="/appscreenshot.png"
                                    alt="JetPOS Dashboard Full View"
                                    width={1200}
                                    height={750}
                                    quality={100}
                                    style={{
                                        borderRadius: "0.75rem",
                                        width: "100%",
                                        height: "auto",
                                        display: "block",
                                        boxShadow: "0 4px 20px rgba(0,0,0,0.5)"
                                    }}
                                />
                            </div>
                        </div>

                        {/* Mobile Mockup Floating (Kept Dark) */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 50 }}
                            whileInView={{ opacity: 1, scale: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            style={{
                                position: "absolute",
                                bottom: "-10%",
                                right: "-5%",
                                width: "220px",
                                zIndex: 10,
                                background: "#05070a",
                                borderRadius: "2.5rem",
                                border: "8px solid #1a1f26",
                                overflow: "hidden",
                                boxShadow: "0 24px 48px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1) inset"
                            }}
                            className="mobile-mockup"
                        >
                            <Image
                                src="/mobileapp.png"
                                alt="JetPOS Mobile Dashboard"
                                width={220}
                                height={450}
                                quality={100}
                                style={{
                                    width: "100%",
                                    height: "auto",
                                    display: "block"
                                }}
                            />
                        </motion.div>
                    </motion.div>

                    {/* Content Side */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        style={{ position: "relative", zIndex: 2 }}
                    >
                        <div style={{
                            display: "inline-flex", alignItems: "center", gap: "0.5rem",
                            background: "rgba(120, 134, 199, 0.1)", border: "1px solid rgba(120, 134, 199, 0.2)",
                            color: "#7886C7", padding: "0.4rem 1rem", borderRadius: "9999px",
                            fontWeight: 600, fontSize: "0.875rem", marginBottom: "1.5rem"
                        }}>
                            Tüm Cihazlarda Tek Çözüm
                        </div>
                        
                        <h2 style={{
                            fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
                            fontWeight: 900,
                            color: "#111827",
                            marginBottom: "1.5rem",
                            lineHeight: 1.1,
                            letterSpacing: "-0.03em"
                        }}>
                            İşletmeniz Her An <br />
                            <span style={{ color: "#7886C7" }}>Yanınızda.</span>
                        </h2>
                        <p style={{ color: "#4b5563", fontSize: "1.125rem", lineHeight: 1.7, marginBottom: "2.5rem", fontWeight: 500 }}>
                            JetPOS bulut tabanlı mimarisi sayesinde verilerinize bilgisayarınızdan, tabletinizden veya akıllı telefonunuzdan anında erişin. Her cihazda aynı konforu ve hızı yaşayın.
                        </p>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.75rem" }}>
                            {[
                                {
                                    icon: Monitor,
                                    title: "Masaüstü Deneyimi",
                                    desc: "Geniş ekranlarda tam muhasebe ve depo yönetimi."
                                },
                                {
                                    icon: Smartphone,
                                    title: "Mobil Uygulama",
                                    desc: "Cebinizden barkod okutun, anlık satış raporlarını izleyin."
                                },
                                {
                                    icon: Zap,
                                    title: "Anlık Senkronizasyon",
                                    desc: "Tüm cihazlar saniyeler içinde birbiriyle güncellenir."
                                }
                            ].map((item, id) => (
                                <div key={id} style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
                                    <div style={{
                                        width: "3rem",
                                        height: "3rem",
                                        borderRadius: "0.875rem",
                                        background: "white",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.05)",
                                        border: "1px solid rgba(17,24,39,0.05)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0
                                    }}>
                                        <item.icon style={{ width: "1.25rem", height: "1.25rem", color: "#7886C7" }} />
                                    </div>
                                    <div>
                                        <h4 style={{ color: "#111827", fontWeight: 800, fontSize: "1.125rem", marginBottom: "0.3rem" }}>{item.title}</h4>
                                        <p style={{ color: "#6b7280", fontSize: "0.95rem", lineHeight: 1.5, fontWeight: 500 }}>{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                </div>
            </div>

            {/* Gradient transition to Features section (#FAFBFC) */}
            <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "180px",
                background: "linear-gradient(to bottom, rgba(248,249,252,0) 0%, rgba(248,249,252,0.6) 50%, rgba(248,249,252,1) 100%)",
                pointerEvents: "none",
                zIndex: 10,
            }} />

            <style>{`
                @keyframes pulseGlow {
                    0% { opacity: 0.6; transform: translate(-50%, -50%) scale(0.95); }
                    100% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
                }
                .mobile-mockup {
                    animation: floatMockup 6s ease-in-out infinite alternate;
                }
                @keyframes floatMockup {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-15px); }
                }
                @media (max-width: 960px) {
                    .showcase-grid {
                        grid-template-columns: 1fr !important;
                        gap: 5rem !important;
                        text-align: center;
                    }
                    .showcase-grid > div {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                    }
                    .showcase-grid h2 br {
                        display: none;
                    }
                    .mobile-mockup {
                        width: 160px !important;
                        border-width: 5px !important;
                        right: 0 !important;
                        bottom: -15% !important;
                    }
                }
            `}</style>
        </section>
    );
}
