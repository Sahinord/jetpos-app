"use client";

import React from "react";
import Image from "next/image";

export default function CallToAction() {
    return (
        <section className="cta-section">
            <div className="cta-bg-wrapper">
                <Image 
                    src="/bakkal.png" 
                    alt="JetPOS Store Background" 
                    fill 
                    style={{ objectFit: 'cover', objectPosition: 'center 20%' }} 
                    quality={90}
                />
                <div className="cta-overlay" />
            </div>

            <div className="cta-content">
                <div className="cta-badge">
                    1 Yıllık Alımlarda İlk 1 Ay Ücretsiz!
                </div>
                
                <h2 className="cta-title">Ticaretinizi Dijitalleştirin</h2>
                <p className="cta-subtitle">JetPOS ile bugün başlayın</p>
                
                <div className="cta-actions">
                    <button className="cta-btn-primary">
                        Ücretsiz Deneyin 
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                    </button>
                    <button className="cta-btn-secondary">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                        </svg>
                        Bizi Arayın
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .cta-section {
                    position: relative;
                    width: 100%;
                    padding: 80px 24px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    overflow: hidden;
                    font-family: 'Inter', sans-serif;
                }

                .cta-bg-wrapper {
                    position: absolute;
                    inset: 0;
                    z-index: 0;
                }

                .cta-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.75); /* Dark overlay to make text pop */
                    z-index: 1;
                }

                .cta-content {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    max-width: 800px;
                }

                .cta-badge {
                    background: #7886C7; /* JetPOS Blue */
                    color: #FFFFFF;
                    font-weight: 700;
                    font-size: 0.9rem;
                    padding: 6px 16px;
                    border-radius: 99px;
                    margin-bottom: 20px;
                    box-shadow: 0 4px 14px rgba(120, 134, 199, 0.4);
                }

                .cta-title {
                    font-size: 2.8rem;
                    font-weight: 800;
                    color: white;
                    margin-bottom: 12px;
                    letter-spacing: -0.02em;
                    line-height: 1.15;
                }

                .cta-subtitle {
                    font-size: 1.1rem;
                    color: rgba(255, 255, 255, 0.85);
                    margin-bottom: 32px;
                    font-weight: 500;
                }

                .cta-actions {
                    display: flex;
                    gap: 16px;
                }

                .cta-btn-primary {
                    background: #7886C7; /* JetPOS Blue */
                    color: white;
                    font-size: 1.05rem;
                    font-weight: 700;
                    padding: 14px 28px;
                    border-radius: 99px;
                    border: none;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .cta-btn-primary:hover {
                    background: #5A659F;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(120, 134, 199, 0.5);
                }

                .cta-btn-secondary {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(8px);
                    color: white;
                    font-size: 1.05rem;
                    font-weight: 600;
                    padding: 14px 28px;
                    border-radius: 99px;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .cta-btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.15);
                    border-color: rgba(255, 255, 255, 0.5);
                    transform: translateY(-2px);
                }

                @media (max-width: 768px) {
                    .cta-section { padding: 80px 20px; }
                    .cta-title { font-size: 2.2rem; }
                    .cta-actions { flex-direction: column; width: 100%; max-width: 300px; }
                    .cta-btn-primary, .cta-btn-secondary { width: 100%; justify-content: center; }
                }
                `
            }} />
        </section>
    );
}
