"use client";

import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronRight } from "lucide-react";
import Link from "next/link";
import JetQRMockup from "./JetQRMockup";

export default function JetQRSection() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.2 }
        );
        observer.observe(el);

        return () => observer.disconnect();
    }, []);

    const features = [
        "Sınırsız Menü Kategorisi",
        "Anlık Fiyat Güncelleme",
        "QR Kod Oluşturma",
        "Mobil Uyumlu Tasarım"
    ];

    return (
        <section ref={sectionRef} className="jetqr-section">
            <div className="jetqr-container">
                
                {/* ── Left Content (45%) ── */}
                <div className={`jetqr-content ${visible ? "fade-in-right" : ""}`}>
                    <div className="jetqr-badge">JetQR</div>
                    <h2 className="jetqr-title">Müşterileriniz Menünüze Saniyeler İçinde Ulaşsın.</h2>
                    <p className="jetqr-subtitle">
                        JetQR ile dijital menünüzü oluşturun, QR kodunuzu paylaşın ve tüm içeriklerinizi tek panelden yönetin.
                    </p>

                    <div className="jetqr-features">
                        {features.map((feat, idx) => (
                            <div key={idx} className="jetqr-feature-item" style={{ transitionDelay: `${200 + idx * 100}ms` }}>
                                <CheckCircle2 className="feat-icon" />
                                <span>{feat}</span>
                            </div>
                        ))}
                    </div>

                    <Link href="/jetqr" className="jetqr-cta group">
                        JetQR'ı Keşfet
                        <ChevronRight className="cta-icon group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* ── Right Mockup (55%) ── */}
                <div className="jetqr-mockup-container">
                    <JetQRMockup isVisible={visible} />
                </div>

            </div>

            <style dangerouslySetInnerHTML={{__html: `
                .jetqr-section {
                    padding: 100px 0;
                    background-color: #F8FAFC;
                    overflow: hidden;
                    position: relative;
                }
                .jetqr-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 60px;
                }

                .jetqr-content {
                    flex: 0 0 45%;
                    opacity: 0;
                    transform: translateX(-40px);
                    transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
                }
                .jetqr-content.fade-in-right {
                    opacity: 1;
                    transform: translateX(0);
                }

                .jetqr-badge {
                    display: inline-block;
                    background: rgba(120, 134, 199, 0.1);
                    color: #7886C7;
                    font-size: 0.875rem;
                    font-weight: 700;
                    padding: 6px 14px;
                    border-radius: 999px;
                    margin-bottom: 20px;
                    border: 1px solid rgba(120, 134, 199, 0.2);
                }

                .jetqr-title {
                    font-size: 2.75rem;
                    font-weight: 800;
                    color: #111827;
                    line-height: 1.15;
                    margin-bottom: 20px;
                    letter-spacing: -0.02em;
                }

                .jetqr-subtitle {
                    font-size: 1.125rem;
                    color: #4B5563;
                    line-height: 1.6;
                    margin-bottom: 32px;
                }

                .jetqr-features {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    margin-bottom: 40px;
                }

                .jetqr-feature-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 1.05rem;
                    color: #1F2937;
                    font-weight: 500;
                    padding: 12px 16px;
                    background: #FFFFFF;
                    border-radius: 12px;
                    border: 1px solid #E5E7EB;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                    transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
                }
                .jetqr-feature-item:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 16px rgba(120, 134, 199, 0.08);
                    border-color: #9AA7DF;
                }

                .feat-icon {
                    color: #7886C7;
                    width: 22px;
                    height: 22px;
                }

                .jetqr-cta {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: linear-gradient(135deg, #7886C7 0%, #5A659F 100%);
                    color: #FFFFFF;
                    font-size: 1.125rem;
                    font-weight: 600;
                    padding: 16px 32px;
                    border-radius: 999px;
                    border: none;
                    cursor: pointer;
                    box-shadow: 0 10px 25px rgba(120, 134, 199, 0.4);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    text-decoration: none;
                }
                .jetqr-cta:hover {
                    transform: translateY(-3px) scale(1.02);
                    box-shadow: 0 15px 35px rgba(120, 134, 199, 0.5);
                }

                .jetqr-mockup-container {
                    flex: 0 0 50%;
                }

                /* ── Responsive ── */
                @media (max-width: 992px) {
                    .jetqr-container {
                        flex-direction: column;
                        text-align: center;
                        gap: 40px;
                    }
                    .jetqr-title {
                        font-size: 2.25rem;
                    }
                    .jetqr-features {
                        align-items: center;
                    }
                    .jetqr-feature-item {
                        width: 100%;
                        max-width: 320px;
                        text-align: left;
                    }
                    .jetqr-content {
                        flex: 1;
                    }
                    .jetqr-mockup-container {
                        flex: 1;
                        width: 100%;
                    }
                }
            `}} />
        </section>
    );
}
