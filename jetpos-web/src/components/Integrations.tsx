"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

// Logosu olan platformlar
const logos = [
    { name: "Trendyol", img: "/trendyol.png" },
    { name: "Getir", img: "/getir.png" },
    { name: "Yemeksepeti", img: "/yemeksepeti.png" },
    { name: "Migros", img: "/migros.png" },
    { name: "Vercel", img: "/vercel.png" },
    { name: "Windows", img: "/window.png" },
];

const marqueeItems = [...logos, ...logos, ...logos];

export default function Integrations() {
    return (
        <section 
            style={{
                padding: "6.5rem 0",
                position: "relative",
                overflow: "hidden",
                backgroundColor: "#FAFBFC",
            }}
        >
            {/* Subtle Radial Glow Spot at the top */}
            <div style={{
                position: "absolute",
                top: "-150px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "800px",
                height: "300px",
                background: "radial-gradient(circle at center, rgba(120, 134, 199, 0.04) 0%, transparent 70%)",
                pointerEvents: "none",
                zIndex: 1,
            }} />
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
                        color: "#111827",
                        marginBottom: "1rem",
                        lineHeight: 1.2
                    }}>
                        Güçlü{" "}
                        <span className="holographic-text">Platform Entegrasyonları</span>
                    </h2>
                    <p style={{ color: "#4B5563", fontSize: "1.125rem", maxWidth: "560px", margin: "0 auto" }}>
                        Türkiye&apos;nin önde gelen e-ticaret ve teslimat platformlarıyla sorunsuz entegrasyon.
                    </p>
                </motion.div>
            </div>

            {/* Marquee - full width */}
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                style={{ position: "relative" }}
            >
                {/* Left fade */}
                <div style={{
                    position: "absolute", left: 0, top: 0, bottom: 0, width: "120px", zIndex: 2,
                    backgroundImage: "linear-gradient(to right, #F8FAFC, transparent)",
                    pointerEvents: "none"
                }} />
                {/* Right fade */}
                <div style={{
                    position: "absolute", right: 0, top: 0, bottom: 0, width: "120px", zIndex: 2,
                    backgroundImage: "linear-gradient(to left, #F8FAFC, transparent)",
                    pointerEvents: "none"
                }} />

                {/* Sliding Row 1 */}
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
                                    background: "#ffffff",
                                    border: "1px solid #E5E7EB",
                                    borderRadius: "1.25rem",
                                    padding: "1rem 1.75rem",
                                    flexShrink: 0,
                                    transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                                    cursor: "default",
                                    minWidth: "200px",
                                    boxShadow: "0 8px 32px -10px rgba(120,134,199,0.08)",
                                }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(120, 134, 199, 0.4)";
                                    (e.currentTarget as HTMLDivElement).style.background = "rgba(120, 134, 199, 0.04)";
                                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 36px rgba(120,134,199,0.12)";
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLDivElement).style.borderColor = "#E5E7EB";
                                    (e.currentTarget as HTMLDivElement).style.background = "#ffffff";
                                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px -10px rgba(120,134,199,0.08)";
                                }}
                            >
                                <div style={{
                                    width: "2.75rem", height: "2.75rem", borderRadius: "50%",
                                    background: "#F8FAFC",
                                    border: "1px solid #E5E7EB",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    overflow: "hidden", flexShrink: 0,
                                    padding: "0.4rem",
                                }}>
                                    <Image
                                        src={platform.img}
                                        alt={platform.name}
                                        width={40}
                                        height={40}
                                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                    />
                                </div>
                                <span style={{
                                    fontSize: "1.1rem", fontWeight: 700, color: "#111827",
                                    whiteSpace: "nowrap",
                                    letterSpacing: "-0.01em"
                                }}>
                                    {platform.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sliding Row 2 */}
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
                                    background: "#ffffff",
                                    border: "1px solid #E5E7EB",
                                    borderRadius: "1.125rem",
                                    padding: "0.875rem 1.5rem",
                                    flexShrink: 0,
                                    minWidth: "180px",
                                    cursor: "default",
                                    transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                                }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(120, 134, 199, 0.4)";
                                    (e.currentTarget as HTMLDivElement).style.background = "rgba(120, 134, 199, 0.04)";
                                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLDivElement).style.borderColor = "#E5E7EB";
                                    (e.currentTarget as HTMLDivElement).style.background = "#ffffff";
                                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                                }}
                            >
                                <div style={{
                                    width: "2.25rem", height: "2.25rem", borderRadius: "50%",
                                    background: "#F8FAFC",
                                    border: "1px solid #E5E7EB",
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
                                    fontSize: "0.95rem", fontWeight: 600, color: "rgba(17, 24, 39, 0.7)",
                                    whiteSpace: "nowrap"
                                }}>
                                    {platform.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
            {/* Gradient transition to Testimonials section (#FFFFFF) */}
            <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "180px",
                background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,1) 100%)",
                pointerEvents: "none",
                zIndex: 10,
            }} />

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
