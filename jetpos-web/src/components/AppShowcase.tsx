"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Monitor, Smartphone, Tablet, Cloud, Zap, ShieldCheck } from "lucide-react";

export default function AppShowcase() {
    return (
        <section style={{
            padding: "8rem 0",
            position: "relative",
            overflow: "hidden",
            background: "radial-gradient(circle at 50% 50%, rgba(59,130,246,0.05) 0%, transparent 70%)"
        }}>
            <div className="site-container">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }} className="showcase-grid">

                    {/* Visual Side */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        style={{ position: "relative" }}
                    >
                        {/* Desktop Mockup */}
                        <div style={{
                            position: "relative",
                            zIndex: 2,
                            background: "rgba(10, 15, 30, 0.8)",
                            borderRadius: "1.5rem",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            padding: "0.5rem",
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
                        }}>
                            <div style={{
                                width: "100%",
                                height: "24px",
                                display: "flex",
                                gap: "6px",
                                padding: "0 12px",
                                alignItems: "center",
                                background: "rgba(255,255,255,0.03)",
                                borderBottom: "1px solid rgba(255,255,255,0.05)",
                                borderTopLeftRadius: "1rem",
                                borderTopRightRadius: "1rem"
                            }}>
                                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ff5f56", border: "1px solid rgba(0,0,0,0.1)" }} />
                                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ffbd2e", border: "1px solid rgba(0,0,0,0.1)" }} />
                                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#27c93f", border: "1px solid rgba(0,0,0,0.1)" }} />
                                <div style={{ flex: 1, textAlign: "center", fontSize: "10px", color: "rgba(255,255,255,0.2)", fontWeight: 500, letterSpacing: "0.05em" }}>JETPOS DASHBOARD</div>
                            </div>
                            <div style={{ padding: "4px", background: "#0c111d", borderBottomLeftRadius: "1rem", borderBottomRightRadius: "1rem" }}>
                                <Image
                                    src="/appphoto.png"
                                    alt="JetPOS Dashboard"
                                    width={1200}
                                    height={750}
                                    style={{
                                        borderRadius: "0.75rem",
                                        width: "100%",
                                        height: "auto",
                                        display: "block",
                                        boxShadow: "0 4px 20px rgba(0,0,0,0.4)"
                                    }}
                                />
                            </div>
                        </div>

                        {/* Mobile Mockup Floating */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 50 }}
                            whileInView={{ opacity: 1, scale: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.4 }}
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
                                boxShadow: "0 20px 40px rgba(0,0,0,0.6)"
                            }}
                            className="mobile-mockup"
                        >
                            <Image
                                src="/phone.png"
                                alt="JetPOS Mobile App"
                                width={220}
                                height={450}
                                style={{
                                    width: "100%",
                                    height: "auto",
                                    display: "block"
                                }}
                            />
                        </motion.div>

                        {/* Connection Lines Decorative */}
                        <div style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: "120%",
                            height: "120%",
                            background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)",
                            zIndex: 1,
                            pointerEvents: "none"
                        }} />
                    </motion.div>

                    {/* Content Side */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="badge" style={{ marginBottom: "1.5rem" }}>Tüm Cihazlarda Tek Çözüm</span>
                        <h2 style={{
                            fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
                            fontWeight: 900,
                            color: "white",
                            marginBottom: "1.5rem",
                            lineHeight: 1.1
                        }}>
                            İşletmeniz Her An <br />
                            <span className="holographic-text">Yanınızda.</span>
                        </h2>
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.125rem", lineHeight: 1.6, marginBottom: "2.5rem" }}>
                            JetPOS bulut tabanlı mimarisi sayesinde verilerinize bilgisayarınızdan, tabletinizden veya akıllı telefonunuzdan anında erişin. Her cihazda aynı konforu ve hızı yaşayın.
                        </p>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
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
                                        width: "2.75rem",
                                        height: "2.75rem",
                                        borderRadius: "0.75rem",
                                        background: "rgba(59,130,246,0.1)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0
                                    }}>
                                        <item.icon style={{ width: "1.25rem", height: "1.25rem", color: "#3b82f6" }} />
                                    </div>
                                    <div>
                                        <h4 style={{ color: "white", fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.25rem" }}>{item.title}</h4>
                                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.95rem" }}>{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                </div>
            </div>

            <style>{`
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
                    .mobile-mockup {
                        width: 154px !important;
                        border-width: 5px !important;
                    }
                }
            `}</style>
        </section>
    );
}
