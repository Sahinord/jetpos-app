"use client";

import { motion } from "framer-motion";
import { Brain, Shield, FileBarChart2, TrendingUp, BadgeDollarSign, FileText, ArrowRight } from "lucide-react";

const digitalFeatures = [
    { icon: Brain, title: "Yapay Zeka", description: "Ürün, stok, kazanç, gider yönetiminiz hakkında yapay zekadan içgörüler elde edin", color: "#a78bfa" },
    { icon: Shield, title: "Güvenlik", description: "Tüm ticari operasyonlarınızın takibini bulut tabanlı, güvenli şekilde yapın", color: "#60a5fa" },
    { icon: FileBarChart2, title: "Raporlar", description: "Ticaretinizin her fonksiyonu için bilgilerinizi kolayca raporlayın", color: "#34d399" },
    { icon: TrendingUp, title: "Gelir-Gider", description: "İşletmenizin nakit akışını online olarak izleyin ve analiz edin", color: "#f59e0b" },
    { icon: BadgeDollarSign, title: "Kârlılık", description: "Partner çözümlerimiz ile kârınızı artırın ve büyüyün", color: "#fb7185" },
    { icon: FileText, title: "E-Fatura", description: "Sadece 3 tıkla kolayca fatura kesin, e-arşiv yönetin", color: "#06b6d4" },
];

const platforms = ["Trendyol", "Getir", "Yemeksepeti", "N11", "HepsiBurada"];

export default function Integrations() {
    return (
        <>
            {/* Entegrasyonlar */}
            <section style={{ padding: "7rem 0", position: "relative", zIndex: 2 }}>
                <div className="site-container">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        style={{ textAlign: "center", marginBottom: "3.5rem" }}
                    >
                        <span className="badge" style={{ marginBottom: "1.25rem", display: "inline-flex" }}>
                            Entegrasyonlar
                        </span>
                        <h2 style={{
                            fontSize: "clamp(2rem, 5vw, 3.25rem)",
                            fontWeight: 800,
                            color: "white",
                            marginBottom: "1rem",
                            lineHeight: 1.2
                        }}>
                            Güçlü{" "}
                            <span className="holographic-text">Platform Entegrasyonları</span>
                        </h2>
                        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "1.125rem", maxWidth: "560px", margin: "0 auto" }}>
                            Türkiye&apos;nin önde gelen e-ticaret platformlarıyla sorunsuz entegrasyon.
                        </p>
                    </motion.div>

                    {/* Platform logos */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.07)",
                            borderRadius: "1.5rem",
                            padding: "3rem 2rem",
                            display: "flex",
                            flexWrap: "wrap",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "1rem"
                        }}
                    >
                        {platforms.map((platform, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.85 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.3 + index * 0.08 }}
                                style={{
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "0.875rem",
                                    padding: "0.875rem 1.75rem",
                                    cursor: "default",
                                    transition: "all 0.3s"
                                }}
                                whileHover={{ scale: 1.05, borderColor: "rgba(59,130,246,0.4)" }}
                            >
                                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
                                    {platform}
                                </span>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Dijitalleştirin */}
            <section style={{ padding: "7rem 0", position: "relative", zIndex: 2, background: "linear-gradient(to bottom, transparent, rgba(139,92,246,0.04), transparent)" }}>
                <div className="site-container">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        style={{ textAlign: "center", marginBottom: "4rem" }}
                    >
                        <h2 style={{
                            fontSize: "clamp(2rem, 5vw, 3.25rem)",
                            fontWeight: 800,
                            color: "white",
                            marginBottom: "1rem",
                            lineHeight: 1.2
                        }}>
                            Ticaretinizi{" "}
                            <span className="holographic-text">Dijitalleştirin</span>
                        </h2>
                        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "1.125rem", maxWidth: "560px", margin: "0 auto" }}>
                            İşletmenizin tüm ihtiyaçlarını tek platformdan karşılayın.
                        </p>
                    </motion.div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
                        {digitalFeatures.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.08 }}
                            >
                                <div className="feature-card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                    <div style={{
                                        width: "3.25rem", height: "3.25rem", borderRadius: "0.875rem",
                                        background: `${feature.color}15`,
                                        border: `1px solid ${feature.color}30`,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0
                                    }}>
                                        <feature.icon style={{ width: "1.5rem", height: "1.5rem", color: feature.color }} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "white", marginBottom: "0.5rem" }}>
                                            {feature.title}
                                        </h3>
                                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", lineHeight: 1.7 }}>
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 }}
                        style={{ textAlign: "center", marginTop: "4rem" }}
                    >
                        <h3 style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700, color: "white", marginBottom: "1rem" }}>
                            Bugün Başlayın
                        </h3>
                        <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "2rem", maxWidth: "480px", margin: "0 auto 2rem" }}>
                            14 gün ücretsiz deneyin, kredi kartı gerekmez.
                        </p>
                        <button className="btn-primary" style={{ fontSize: "1.05rem", padding: "1rem 2.25rem" }}>
                            Hemen Başlayın
                            <ArrowRight style={{ width: "1.125rem", height: "1.125rem" }} />
                        </button>
                    </motion.div>
                </div>
            </section>
        </>
    );
}
