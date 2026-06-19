"use client";

import React, { useState } from "react";
import Image from "next/image";

// ─── Data ────────────────────────────────────────────────────────────────────

const cards = [
    {
        id: "butcher",
        tag: "KASAP",
        title: "İşletmenizi Oluşturun",
        desc: "İşletme bilgilerinizi girin ve JetPOS hesabınızı dakikalar içinde aktif edin.",
        image: "/butcher.png"
    },
    {
        id: "market",
        tag: "MARKET",
        title: "Ürünlerinizi Ekleyin",
        desc: "Stoklarınızı, kategorilerinizi ve fiyatlarınızı kolayca sisteme aktarın.",
        image: "/market.png"
    },
    {
        id: "manav",
        tag: "MANAV",
        title: "Tüm Süreçleri Bağlayın",
        desc: "Ödeme, e-Fatura, stok ve raporlama modüllerini tek merkezde birleştirin.",
        image: "/manav.png"
    },
    {
        id: "giyim",
        tag: "GİYİM",
        title: "JetPOS ile Yönetin",
        desc: "Kasadan telefona kadar işletmenizin tüm operasyonlarını anlık olarak kontrol edin.",
        image: "/giyim.png"
    }
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function SetupSteps() {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <section className="setup-section">
            <div className="setup-container">
                
                {/* ── Header ──────────────────────────────────────────── */}
                <div className="setup-header">
                    <h2 className="setup-title">
                        İşletmenizi Dakikalar İçinde Dijitalleştirin
                    </h2>
                    <p className="setup-subtitle">
                        Satış, stok, ödeme, e-fatura ve raporlama süreçlerinizi tek ekranda yönetin. Kurulumu tamamlayın ve hemen satışa başlayın.
                    </p>
                </div>

                {/* ── Grid Wrapper ────────────────────────────────────── */}
                <div className="setup-grid">
                    {cards.map((card, idx) => {
                        const isHovered = hoveredIndex === idx;

                        return (
                            <div
                                key={card.id}
                                className={`setup-card ${isHovered ? "hovered" : ""}`}
                                onMouseEnter={() => setHoveredIndex(idx)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            >
                                {/* 1) Background Image */}
                                <div className="card-image-wrapper">
                                    <Image
                                        src={card.image}
                                        alt={card.title}
                                        fill
                                        quality={100}
                                        unoptimized
                                        className="card-bg-image"
                                    />
                                    {/* Soft Vignette Overlay for Depth & Contrast */}
                                    <div className="card-vignette" />
                                </div>

                                {/* 2) Top-Left Pill Badge */}
                                <div className="card-badge">
                                    {card.tag}
                                </div>

                                {/* 3) Bottom Info Panel (Exactly 100px height glassmorphism docked at bottom edge) */}
                                <div className="card-info-panel">
                                    <div className="panel-left">
                                        <h3 className="panel-title">{card.title}</h3>
                                        <p className="panel-desc">{card.desc}</p>
                                    </div>
                                    <div className="panel-right">
                                        <span className="panel-large-step">0{idx + 1}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>

            {/* ── Styling ─────────────────────────────────────────── */}
            <style>{`
                /* Section wrapper styles */
                .setup-section {
                    background-color: #F8FAFC;
                    padding: 120px 24px;
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    position: relative;
                }

                .setup-container {
                    width: 100%;
                    max-width: 1400px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                /* Header styles */
                .setup-header {
                    text-align: center;
                    margin-bottom: 40px; /* Gap from header to cards: exactly 40px */
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                }

                .setup-title {
                    font-size: clamp(2rem, 3.5vw, 2.75rem);
                    font-weight: 850;
                    color: #111827;
                    margin: 0;
                    line-height: 1.2;
                    letter-spacing: -0.02em;
                }

                .setup-subtitle {
                    font-size: clamp(1rem, 1.5vw, 1.125rem);
                    color: #4B5563;
                    margin: 0;
                    line-height: 1.6;
                    font-weight: 500;
                    max-width: 600px;
                }

                /* Grid layout */
                .setup-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr); /* 4 cards side-by-side on desktop */
                    gap: 24px; /* Gap between cards: 24px */
                    width: 100%;
                }

                /* Card base styling */
                .setup-card {
                    position: relative;
                    height: 400px; /* Height: exactly 400px */
                    border-radius: 28px; /* Corners: 28px radius */
                    overflow: hidden;
                    background-color: #FFFFFF;
                    border: 1px solid rgba(120, 134, 199, 0.1);
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
                    cursor: pointer;
                    transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1),
                                box-shadow 0.4s cubic-bezier(0.22, 1, 0.36, 1),
                                border-color 0.4s ease;
                    isolation: isolate; /* Create new stacking context for backdrop-filter rendering inside rounded cards */
                }

                /* Hover card scale */
                .setup-card.hovered {
                    transform: scale(1.03); /* Hover scale: 1.03 */
                    box-shadow: 0 24px 64px rgba(120, 134, 199, 0.16), 0 4px 12px rgba(0, 0, 0, 0.03);
                    border-color: rgba(120, 134, 199, 0.35);
                }

                /* Image container with scale transition */
                .card-image-wrapper {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 1;
                    overflow: hidden;
                }

                .card-bg-image {
                    object-fit: cover;
                    object-position: center;
                    transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
                }

                .setup-card.hovered .card-bg-image {
                    transform: scale(1.03); /* Zoom on hover */
                }

                /* Soft Vignette Overlay for Depth & Contrast */
                .card-vignette {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(180deg, rgba(0, 0, 0, 0.02) 0%, rgba(0, 0, 0, 0.22) 100%);
                    pointer-events: none;
                    z-index: 2;
                }

                /* Top Left Badge */
                .card-badge {
                    position: absolute;
                    top: 24px;
                    left: 24px;
                    z-index: 10;
                    background-color: rgba(120, 134, 199, 0.12); /* Badge BG: rgba(120,134,199,0.15) */
                    color: #7886C7; /* Badge text color: #7886C7 */
                    font-size: 0.72rem;
                    font-weight: 750;
                    letter-spacing: 0.08em;
                    padding: 6px 14px;
                    border-radius: 9999px;
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    border: 1px solid rgba(120, 134, 199, 0.25);
                }

                /* Bottom Info Panel (Exactly 100px height glassmorphism docked at bottom edge) */
                .card-info-panel {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 100px; /* Floating height: exactly 100px */
                    z-index: 10;
                    background-color: rgba(255, 255, 255, 0.12); /* White overlay: rgba(255, 255, 255, 0.12) */
                    backdrop-filter: blur(24px) saturate(140%);
                    -webkit-backdrop-filter: blur(24px) saturate(140%);
                    border-top: 1px solid rgba(255, 255, 255, 0.2); /* Ince border */
                    border-left: none;
                    border-right: none;
                    border-bottom: none;
                    border-radius: 0 0 28px 28px; /* Perfectly docks into bottom radius */
                    padding: 14px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.04),
                                inset 0 1px 0 rgba(255, 255, 255, 0.15);
                    pointer-events: none;
                }

                .panel-left {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                    max-width: 76%;
                    text-align: left;
                }

                .panel-title {
                    font-size: 1.05rem; /* More compact font size */
                    font-weight: 800;
                    color: #FFFFFF; /* High-contrast white text */
                    margin: 0;
                    letter-spacing: -0.015em;
                }

                .panel-desc {
                    font-size: 0.8rem; /* More compact font size */
                    font-weight: 500;
                    color: rgba(255, 255, 255, 0.75); /* Clean translucent description */
                    margin: 0;
                    line-height: 1.4;
                }

                .panel-right {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .panel-large-step {
                    font-size: 2.25rem; /* More compact step number */
                    font-weight: 900;
                    color: rgba(255, 255, 255, 0.25); /* Large number display */
                    font-family: ui-sans-serif, system-ui, sans-serif;
                    line-height: 1;
                }

                /* Responsive design */
                @media (max-width: 1024px) {
                    .setup-grid {
                        grid-template-columns: repeat(2, 1fr); /* 2x2 grid on tablet */
                    }
                    .setup-card {
                        height: 400px;
                    }
                }

                @media (max-width: 768px) {
                    .setup-section {
                        padding: 80px 16px; /* 16px padding on mobile */
                    }
                    .setup-grid {
                        grid-template-columns: 1fr; /* Single column on mobile */
                        gap: 20px;
                    }
                    .setup-card {
                        height: 400px; /* Keep height consistent at 400px on mobile */
                    }
                    .card-badge {
                        top: 16px;
                        left: 16px;
                    }
                    .card-info-panel {
                        padding: 12px 16px;
                        height: 100px;
                    }
                    .panel-large-step {
                        font-size: 2rem;
                    }
                }
            `}</style>
        </section>
    );
}
