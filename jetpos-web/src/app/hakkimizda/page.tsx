"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, ShieldCheck, Rocket } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";

const values = [
    {
        icon: Rocket,
        title: "Sürekli İnovasyon",
        desc: "Perakende teknolojilerinde her gün yeni bir standart belirliyor, yapay zekayı işletmenizin kalbine yerleştiriyoruz.",
        color: "#7886C7"
    },
    {
        icon: Users,
        title: "Kullanıcı Odaklılık",
        desc: "Binlerce işletme sahibinden aldığımız geri bildirimlerle, karmaşık süreçleri en basit hale getiriyoruz.",
        color: "#a78bfa"
    },
    {
        icon: ShieldCheck,
        title: "Güvenlik ve İstikrar",
        desc: "Verileriniz bizim için kutsaldır. En üst düzey şifreleme ve %99.9 çalışma süresiyle işinizi asla yarıda bırakmayız.",
        color: "#10b981"
    },
];

export default function AboutPage() {
    return (
        <>
            <div className="site-bg" />
            <main className="main-canvas" style={{ position: "relative", zIndex: 1, minHeight: "100vh", overflowX: "hidden", color: "#111827" }}>
                <Navbar />

                {/* Hero Section */}
                <section style={{ paddingTop: "10rem", paddingBottom: "6rem", position: "relative", overflow: "hidden" }}>
                    <div className="site-container">
                        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
                            <motion.span
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="badge"
                                style={{ marginBottom: "1.5rem" }}
                            >
                                Hikayemiz
                            </motion.span>
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                style={{ fontSize: "clamp(2.5rem, 7vw, 4.5rem)", fontWeight: 900, lineHeight: 1.1, marginBottom: "1.5rem", letterSpacing: "-0.04em", color: "#111827" }}
                            >
                                Ticaretin Geleceğini <br />
                                <span className="holographic-text">Birlikte Yazıyoruz</span>
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                style={{ fontSize: "1.25rem", color: "#4B5563", lineHeight: 1.7 }}
                            >
                                JetPOS, bir <strong style={{ color: "#7886C7", fontWeight: 700 }}>Jetsoft</strong> ürünüdür.
                                Türkiye&apos;deki işletmelerin dijitalleşmesini hızlandırmak, operasyonel
                                karmaşayı ortadan kaldırmak ve bakkaldan zincir mağazaya her ölçekten işletmeye
                                kurumsal güç katmak için kurduk.
                            </motion.p>
                        </div>
                    </div>
                </section>

                {/* Mission & Vision */}
                <section style={{ padding: "6rem 0", background: "rgba(120, 134, 199, 0.03)", borderTop: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB" }}>
                    <div className="site-container">
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }} className="about-grid">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                            >
                                <h2 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "1.5rem", color: "#111827" }}>Vizyonumuz</h2>
                                <p style={{ fontSize: "1.1rem", color: "#4B5563", lineHeight: 1.8, marginBottom: "2rem" }}>
                                    Sadece bir POS yazılımı değil, bir işletmenin tüm sinir sistemini yöneten akıllı bir ekosistem olmayı hedefliyoruz. Bakkaldan dev restoran zincirlerine kadar her işletmenin, veriye dayalı kararlar alabilmesini sağlıyoruz.
                                </p>
                                <div style={{ display: "flex", gap: "1.5rem" }}>
                                    <div style={{ textAlign: "center" }}>
                                        <div style={{ fontSize: "2rem", fontWeight: 900, color: "#7886C7" }}>2.4K+</div>
                                        <div style={{ fontSize: "0.8rem", color: "#9CA3AF", textTransform: "uppercase" }}>İşletme</div>
                                    </div>
                                    <div style={{ borderLeft: "1px solid #E5E7EB" }}></div>
                                    <div style={{ textAlign: "center", paddingLeft: "1.5rem" }}>
                                        <div style={{ fontSize: "2rem", fontWeight: 900, color: "#a78bfa" }}>1.2M+</div>
                                        <div style={{ fontSize: "0.8rem", color: "#9CA3AF", textTransform: "uppercase" }}>Aylık İşlem</div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                style={{
                                    position: "relative",
                                    height: "400px",
                                    borderRadius: "2.5rem",
                                    background: "#FFFFFF",
                                    border: "1px solid #E5E7EB",
                                    boxShadow: "0 10px 40px rgba(120,134,199,0.08)",
                                    overflow: "hidden",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}
                            >
                                <div style={{ textAlign: "center", padding: "3rem" }}>
                                    <div style={{
                                        width: "5.5rem", height: "5.5rem",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        margin: "0 auto 1.5rem"
                                    }}>
                                        <Image src="/logo-v2.png" alt="JetPOS" width={88} height={88}
                                            style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                    </div>
                                    <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem", color: "#111827" }}>Jetsoft Güvencesi</h3>
                                    <p style={{ color: "#6B7280", lineHeight: 1.7 }}>
                                        Arkasındaki Jetsoft mühendislik gücüyle JetPOS, her zaman en güncel ve
                                        en güvenilir teknolojiyi sunar.
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Values */}
                <section style={{ padding: "8rem 0" }}>
                    <div className="site-container">
                        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
                            <h2 style={{ fontSize: "2.75rem", fontWeight: 800, color: "#111827" }}>Değerlerimiz</h2>
                            <p style={{ color: "#6B7280" }}>Bizi biz yapan, hizmet kalitemizi belirleyen sarsılmaz ilkelerimiz.</p>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem" }} className="values-grid">
                            {values.map((v, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.15 }}
                                    style={{
                                        padding: "2.5rem",
                                        background: "#FFFFFF",
                                        border: "1px solid #E5E7EB",
                                        borderRadius: "2rem",
                                        boxShadow: "0 4px 20px rgba(120,134,199,0.05)",
                                        transition: "all 0.3s"
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLDivElement).style.background = "#F8FAFC";
                                        (e.currentTarget as HTMLDivElement).style.borderColor = `${v.color}55`;
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLDivElement).style.background = "#FFFFFF";
                                        (e.currentTarget as HTMLDivElement).style.borderColor = "#E5E7EB";
                                    }}
                                >
                                    <div style={{
                                        width: "3.5rem", height: "3.5rem", borderRadius: "1rem",
                                        background: `${v.color}15`, border: `1px solid ${v.color}30`,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        marginBottom: "1.5rem"
                                    }}>
                                        <v.icon style={{ color: v.color, width: "1.5rem", height: "1.5rem" }} />
                                    </div>
                                    <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.75rem", color: "#111827" }}>{v.title}</h3>
                                    <p style={{ color: "#6B7280", lineHeight: 1.6, fontSize: "0.95rem" }}>{v.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                <style>{`
                    @media (max-width: 900px) {
                        .about-grid { grid-template-columns: 1fr !important; gap: 3rem !important; }
                        .values-grid { grid-template-columns: 1fr !important; }
                    }
                `}</style>

                <Footer />
            </main>
        </>
    );
}
