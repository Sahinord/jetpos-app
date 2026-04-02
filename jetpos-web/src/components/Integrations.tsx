"use client";

import { motion } from "framer-motion";
import Image from "next/image";

// Logosu olan platformlar + sadece metin olanlar
const logos = [
    { name: "Trendyol", img: "/trendyol.png" },
    { name: "Getir", img: "/getir.png" },
    { name: "Yemeksepeti", img: "/yemeksepeti.png" },
    { name: "Migros", img: "/migros.png" },
    { name: "Vercel", img: "/vercel.png" },
    { name: "Windows", img: "/window.png" },
];

// Marquee için iki kat ekliyoruz (sonsuz döngü efekti)
const marqueeItems = [...logos, ...logos, ...logos];

export default function Integrations() {
    return (
        <section style={{ padding: "7rem 0", position: "relative", zIndex: 2, overflow: "hidden" }}>
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
                        Türkiye&apos;nin önde gelen e-ticaret ve teslimat platformlarıyla sorunsuz entegrasyon.
                    </p>
                </motion.div>
            </div>

            {/* Marquee - tam genişlik, container dışına taşıyor */}
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                style={{ position: "relative" }}
            >
                {/* Sol fade */}
                <div style={{
                    position: "absolute", left: 0, top: 0, bottom: 0, width: "120px", zIndex: 2,
                    background: "linear-gradient(to right, #060914, transparent)",
                    pointerEvents: "none"
                }} />
                {/* Sağ fade */}
                <div style={{
                    position: "absolute", right: 0, top: 0, bottom: 0, width: "120px", zIndex: 2,
                    background: "linear-gradient(to left, #060914, transparent)",
                    pointerEvents: "none"
                }} />

                {/* Kayan satır */}
                <div style={{ overflow: "hidden", padding: "1rem 0" }}>
                    <div style={{
                        display: "flex",
                        gap: "1.5rem",
                        width: "max-content",
                        animation: "marquee 22s linear infinite",
                    }}>
                        {marqueeItems.map((platform, index) => (
                            <div
                                key={index}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.875rem",
                                    background: "rgba(10, 15, 30, 0.4)",
                                    border: "1px solid rgba(255, 255, 255, 0.08)",
                                    borderRadius: "1.25rem",
                                    padding: "1rem 1.75rem",
                                    flexShrink: 0,
                                    transition: "all 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
                                    cursor: "default",
                                    minWidth: "200px",
                                    backdropFilter: "blur(12px)",
                                    boxShadow: "0 8px 32px -10px rgba(0,0,0,0.5)",
                                }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(59,130,246,0.3)";
                                    (e.currentTarget as HTMLDivElement).style.background = "rgba(59,130,246,0.08)";
                                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)";
                                    (e.currentTarget as HTMLDivElement).style.background = "rgba(10, 15, 30, 0.4)";
                                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                                }}
                            >
                                <div style={{
                                    width: "2.75rem", height: "2.75rem", borderRadius: "50%",
                                    background: "rgba(255, 255, 255, 0.03)",
                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    overflow: "hidden", flexShrink: 0,
                                    padding: "0.4rem",
                                    boxShadow: "inset 0 0 10px rgba(255,255,255,0.02)"
                                }}>
                                    <Image
                                        src={platform.img}
                                        alt={platform.name}
                                        width={40}
                                        height={40}
                                        style={{ width: "100%", height: "100%", objectFit: "contain", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))" }}
                                    />
                                </div>
                                <span style={{
                                    fontSize: "1.1rem", fontWeight: 700, color: "white",
                                    whiteSpace: "nowrap",
                                    letterSpacing: "-0.01em"
                                }}>
                                    {platform.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* İkinci satır — ters yönde */}
                <div style={{ overflow: "hidden", padding: "1rem 0" }}>
                    <div style={{
                        display: "flex",
                        gap: "1.5rem",
                        width: "max-content",
                        animation: "marquee-reverse 28s linear infinite",
                    }}>
                        {[...marqueeItems].reverse().map((platform, index) => (
                            <div
                                key={index}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.875rem",
                                    background: "rgba(10, 15, 30, 0.25)",
                                    border: "1px solid rgba(255, 255, 255, 0.05)",
                                    borderRadius: "1.125rem",
                                    padding: "0.875rem 1.5rem",
                                    flexShrink: 0,
                                    minWidth: "180px",
                                    cursor: "default",
                                    backdropFilter: "blur(8px)",
                                }}
                            >
                                <div style={{
                                    width: "2.25rem", height: "2.25rem", borderRadius: "50%",
                                    background: "rgba(255, 255, 255, 0.03)",
                                    border: "1px solid rgba(255, 255, 255, 0.08)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    overflow: "hidden", flexShrink: 0,
                                    padding: "0.35rem"
                                }}>
                                    <Image
                                        src={platform.img}
                                        alt={platform.name}
                                        width={32}
                                        height={32}
                                        style={{ width: "100%", height: "100%", objectFit: "contain", opacity: 0.8 }}
                                    />
                                </div>
                                <span style={{
                                    fontSize: "0.95rem", fontWeight: 600, color: "rgba(255,255,255,0.6)",
                                    whiteSpace: "nowrap"
                                }}>
                                    {platform.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-33.333%); }
                }
                @keyframes marquee-reverse {
                    0% { transform: translateX(-33.333%); }
                    100% { transform: translateX(0); }
                }
            `}</style>
        </section>
    );
}
