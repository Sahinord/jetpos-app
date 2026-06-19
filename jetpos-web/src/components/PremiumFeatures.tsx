"use client";

import React from "react";
import Image from "next/image";

const features = [
    {
        id: "e-fatura",
        badge: "📄 E-Fatura",
        image: "/faturakesimi.png",
        title: "E-Fatura",
        notification: {
            title: "Ahmet Yılmaz",
            desc: "12.500₺ e-fatura başarıyla kesildi.",
            icon: "✅",
        }
    },
    {
        id: "stok",
        badge: "📦 Stok Takibi",
        image: "/stok.png",
        title: "Stok Takibi",
        notification: {
            title: "Stok Uyarısı",
            desc: "iPhone 15 Pro stok seviyesi azaldı!",
            icon: "⚠️",
        }
    },
    {
        id: "kar-zarar",
        badge: "📈 Kâr-Zarar Takibi",
        image: "/ciro.png",
        title: "Kâr-Zarar",
        notification: {
            title: "Ciro Özeti",
            desc: "Bugünkü satışlarda %15 artış yakalandı.",
            icon: "🚀",
        }
    },
    {
        id: "odeme",
        badge: "💳 Ödeme Entegrasyonu",
        image: "/odeme.png",
        title: "Ödeme",
        notification: {
            title: "Ödeme Onaylandı",
            desc: "Temassız 450₺ tahsilat tamamlandı.",
            icon: "💳",
        }
    }
];

export default function PremiumFeatures() {
    return (
        <section className="py-20 w-full relative overflow-hidden" style={{ background: "#F8FAFC", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div className="w-full px-4 md:px-0 relative z-10" style={{ maxWidth: "1400px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                
                {/* Section Header */}
                <div className="text-center mb-10 flex flex-col items-center justify-center gap-4">
                    <h2 style={{ color: "#111827", lineHeight: "1.2" }} className="text-4xl md:text-5xl font-extrabold tracking-tight">
                        Satıştan Rapora: İhtiyacınız Olan Her Şey
                    </h2>
                    <p style={{ color: "rgba(17,24,39,0.7)", lineHeight: "1.6" }} className="text-lg md:text-xl max-w-3xl mx-auto font-medium">
                        Faturadan Stoka, Tahsilattan Rapora Kadar Modüller Tek Ekranda.
                    </p>
                </div>

                {/* Stacked Full-Width Showcase Layout */}
                <div className="features-container">
                    {features.map((feature) => (
                        <div key={feature.id} className="premium-feature-card group">
                            {/* Background Image */}
                            <Image
                                src={feature.image}
                                alt={feature.title}
                                fill
                                quality={100}
                                unoptimized
                                className="object-cover transition-transform duration-[500ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                            />

                            {/* Top Left Floating Badge */}
                            <div className="absolute top-6 left-6 md:top-8 md:left-8 z-20 transition-transform duration-[500ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1">
                                <div className="feature-badge">
                                    <span className="text-white text-sm md:text-base font-semibold tracking-wide drop-shadow-md">
                                        {feature.badge}
                                    </span>
                                </div>
                            </div>

                            {/* Dynamic Pop-up Notification on Hover */}
                            <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 z-30 opacity-0 translate-y-8 transition-all duration-[500ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100 group-hover:translate-y-0">
                                <div className="glass-notification flex items-center gap-3 p-2 pr-6">
                                    <div className="flex items-center justify-center w-11 h-11 rounded-full bg-white/5 border border-white/10 text-xl shrink-0 shadow-inner">
                                        {feature.notification.icon}
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <div className="text-white font-semibold text-[15px] leading-tight tracking-wide">
                                            {feature.notification.title}
                                        </div>
                                        <div className="text-gray-300 text-[13px] mt-0.5 font-medium">
                                            {feature.notification.desc}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                /* Container Layout: Vertical Stack */
                .features-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                    max-width: 1200px;
                    margin-left: auto;
                    margin-right: auto;
                    gap: 48px;
                }

                @media (max-width: 768px) {
                    .features-container {
                        gap: 24px;
                        padding: 0 16px;
                    }
                }

                /* Premium Card Base */
                .premium-feature-card {
                    border-radius: 24px;
                    overflow: hidden;
                    position: relative;
                    width: 100%;
                    max-width: 1200px;
                    height: 640px; /* Perfect widescreen showcase height */
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
                    transition: all .5s cubic-bezier(.22,1,.36,1);
                    cursor: pointer;
                    background: #fff;
                    border: 1px solid rgba(120, 134, 199, 0.08);
                }

                @media (max-width: 1024px) {
                    .premium-feature-card {
                        height: 500px;
                    }
                }

                @media (max-width: 768px) {
                    .premium-feature-card {
                        height: 340px;
                        border-radius: 20px;
                    }
                }

                /* Premium Hover Effects */
                .premium-feature-card:hover {
                    box-shadow: 0 24px 64px rgba(120, 134, 199, 0.22);
                    border-color: rgba(120, 134, 199, 0.3);
                }

                /* Top Left Badge */
                .feature-badge {
                    background: rgba(255, 255, 255, 0.12);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 999px;
                    padding: 10px 20px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                }

                /* Hover Pop-up Notification */
                .glass-notification {
                    background: rgba(15, 23, 42, 0.85);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 24px; /* Soft rectangle */
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05);
                }
            `}</style>
        </section>
    );
}
