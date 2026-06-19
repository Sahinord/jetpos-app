"use client";

import React from "react";
import Image from "next/image";

// --- Data ---
const trustItems = [
    { value: "1.550+",   label: "İşletme" },
    { value: "50.000+",  label: "Günlük İşlem" },
    { value: "%99,9",    label: "Uptime" },
];

const partners = [
    "/yemeksepeti.png",
    "/getir.png",
    "/trendyol.png",
    "/migros.png",
    "/odeal_logo.png",
    "/hugin.png",
    "/qnb.png",
    "/fatura.png"
];

// Create a large enough set so that one block easily exceeds any monitor width.
const singleSet = Array.from({ length: 4 }).flatMap(() => partners);

export default function TrustBar() {
    return (
        <section style={{
            position: "relative",
            backgroundColor: "transparent",
            borderTop: "1px solid rgba(120,134,199,0.08)",
            borderBottom: "1px solid rgba(120,134,199,0.08)",
            padding: "2rem 0",
            overflow: "hidden",
        }}>
            {/* Social Proof Fixed Row */}
            <div style={{
                maxWidth: "1400px",
                margin: "0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "2.5rem",
                flexWrap: "wrap",
                marginBottom: "2rem",
                padding: "0 2rem",
                position: "relative",
                zIndex: 2,
            }}>
                {trustItems.map((t, i) => (
                    <div key={i} style={{
                        display: "flex", alignItems: "center", gap: "0.55rem",
                        animation: `fadeUp 0.6s ${i * 0.1}s cubic-bezier(0.22,1,0.36,1) both`,
                    }}>
                        <div style={{
                            width: "20px", height: "20px", borderRadius: "50%",
                            background: "linear-gradient(135deg, #7886C7, #5A659F)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                            boxShadow: "0 2px 8px rgba(120,134,199,0.3)",
                        }}>
                            <span style={{ color: "white", fontSize: "0.6rem", fontWeight: 900, lineHeight: 1 }}>✓</span>
                        </div>
                        <span style={{ fontSize: "0.9rem", color: "#111827", fontWeight: 800 }}>
                            {t.value}{" "}
                            <span style={{ color: "#6b7280", fontWeight: 500 }}>{t.label}</span>
                        </span>
                    </div>
                ))}
            </div>

            {/* Marquee Row */}
            <div className="premium-marquee-container">
                <div className="premium-marquee-track">
                    {/* Render exact 2 sets to animate -50% to 0% smoothly */}
                    {[1, 2].map((setIndex) => (
                        <div key={setIndex} className="premium-marquee-set">
                            {singleSet.map((logoPath, i) => {
                                return (
                                    <React.Fragment key={i}>
                                        <div className="marquee-logo-item">
                                            <div style={{ position: "relative", height: "40px", width: "120px" }}>
                                                <Image 
                                                    src={logoPath} 
                                                    alt="Partner Logo" 
                                                    fill 
                                                    style={{ objectFit: "contain" }}
                                                />
                                            </div>
                                        </div>
                                        <div className="marquee-separator"></div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                .premium-marquee-container {
                    width: 100vw;
                    overflow: hidden;
                    position: relative;
                    /* Fade mask on left and right edges */
                    -webkit-mask-image: linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%);
                    mask-image: linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%);
                }

                .premium-marquee-track {
                    display: flex;
                    width: max-content;
                    /* Moving LEFT TO RIGHT: from -50% to 0% */
                    animation: marqueeLeftToRight 40s linear infinite;
                }

                .premium-marquee-set {
                    display: flex;
                    align-items: center;
                }

                @media (max-width: 768px) {
                    .premium-marquee-track {
                        animation-duration: 55s;
                    }
                }

                @keyframes marqueeLeftToRight {
                    0% { transform: translateX(-50%); }
                    100% { transform: translateX(0%); }
                }

                /* Base state for image logos: Grayscale & slightly dim */
                .marquee-logo-item {
                    opacity: 0.6;
                    filter: grayscale(100%);
                    mix-blend-mode: multiply;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .marquee-separator {
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                    background-color: rgba(156, 163, 175, 0.4); /* subtle dot */
                    margin: 0 48px; /* gap on each side */
                    flex-shrink: 0;
                }
            `}</style>
        </section>
    );
}
