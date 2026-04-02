"use client";

import { motion } from "framer-motion";
import { Users, Globe, Award, ShieldCheck, Rocket, Heart } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";

const values = [
    { 
        icon: Rocket, 
        title: "Sürekli İnovasyon", 
        desc: "Perakende teknolojilerinde her gün yeni bir standart belirliyor, yapay zekayı işletmenizin kalbine yerleştiriyoruz.",
        color: "#3b82f6" 
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
        <div style={{ minHeight: "100vh", background: "#060914", color: "white" }}>
            <Navbar />

            {/* Hero Section */}
            <section style={{ paddingTop: "10rem", paddingBottom: "6rem", position: "relative", overflow: "hidden" }}>
                <div style={{
                    position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                    width: "1000px", height: "600px",
                    background: "radial-gradient(circle at center, rgba(37,99,235,0.08) 0%, transparent 70%)",
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
                            Hikayemiz
                        </motion.span>
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            style={{ fontSize: "clamp(2.5rem, 7vw, 4.5rem)", fontWeight: 900, lineHeight: 1.1, marginBottom: "1.5rem", letterSpacing: "-0.04em" }}
                        >
                            Ticaretin Geleceğini <br />
                            <span className="holographic-text">Birlikte Yazıyoruz</span>
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            style={{ fontSize: "1.25rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}
                        >
                            JetPOS, bir **Jetsoft** ürünü olarak; Türkiye&apos;deki işletmelerin dijitalleşme sürecini hızlandırmak, operasyonel karmaşayı ortadan kaldırmak ve her ölçekten işletmeye kurumsal güç katmak vizyonuyla kuruldu.
                        </motion.p>
                    </div>
                </div>
            </section>

            {/* Mission & Vision */}
            <section style={{ padding: "6rem 0", background: "rgba(255,255,255,0.01)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="site-container">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }} className="about-grid">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "1.5rem" }}>Vizyonumuz</h2>
                            <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.8, marginBottom: "2rem" }}>
                                Sadece bir POS yazılımı değil, bir işletmenin tüm sinir sistemini yöneten akıllı bir ekosistem olmayı hedefliyoruz. Bakkaldan dev restoran zincirlerine kadar her işletmenin, veriye dayalı kararlar alabilmesini sağlıyoruz.
                            </p>
                            <div style={{ display: "flex", gap: "1.5rem" }}>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: "2rem", fontWeight: 900, color: "#3b82f6" }}>2.4K+</div>
                                    <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>İşletme</div>
                                </div>
                                <div style={{ borderLeft: "1px solid rgba(255,255,255,0.1)" }}></div>
                                <div style={{ textAlign: "center", paddingLeft: "1.5rem" }}>
                                    <div style={{ fontSize: "2rem", fontWeight: 900, color: "#a78bfa" }}>1.2M+</div>
                                    <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Aylık İşlem</div>
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
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                overflow: "hidden",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}
                        >
                            <div style={{ textAlign: "center", padding: "3rem" }}>
                                <div style={{ 
                                    width: "5rem", height: "5rem", borderRadius: "50%", 
                                    background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    margin: "0 auto 1.5rem"
                                }}>
                                    <Heart style={{ color: "#3b82f6", width: "2.5rem", height: "2.5rem" }} />
                                </div>
                                <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Jetsoft Güvencesi</h3>
                                <p style={{ color: "rgba(255,255,255,0.5)" }}>
                                    Arkasındaki Jetsoft mühendislik gücüyle JetPOS, her zaman en güncel ve en güvenilir teknolojiyi sunar.
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
                        <h2 style={{ fontSize: "2.75rem", fontWeight: 800 }}>Değerlerimiz</h2>
                        <p style={{ color: "rgba(255,255,255,0.5)" }}>Bizi biz yapan, hizmet kalitemizi belirleyen sarsılmaz ilkelerimiz.</p>
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
                                    background: "rgba(255,255,255,0.02)",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    borderRadius: "2rem",
                                    transition: "all 0.3s"
                                }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)";
                                    (e.currentTarget as HTMLDivElement).style.borderColor = `${v.color}40`;
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)";
                                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)";
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
                                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.75rem" }}>{v.title}</h3>
                                <p style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.6, fontSize: "0.95rem" }}>{v.desc}</p>
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
        </div>
    );
}
