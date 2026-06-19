"use client";

import React from "react";
import Image from "next/image";

export default function SupportFormSection() {
    return (
        <section className="sfs-section">
            <div className="sfs-container">
                
                {/* Left Side: Image & Text */}
                <div className="sfs-left">
                    <div className="sfs-image-wrapper">
                        <div className="sfs-ring sfs-ring-1"></div>
                        <div className="sfs-ring sfs-ring-2"></div>
                        <div className="sfs-ring sfs-ring-3"></div>
                        
                        <div className="sfs-image-inner">
                            <Image 
                                src="/jetposmüsterihizmetleri.png" 
                                alt="JetPOS Müşteri Hizmetleri" 
                                fill 
                                style={{ objectFit: 'cover', objectPosition: 'center' }} 
                                quality={95}
                            />
                        </div>

                        <div className="sfs-badge">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                            </svg>
                            7/24 Destek
                        </div>
                    </div>

                    <h2 className="sfs-title">JetPOS'a Geçmek Çok Kolay!</h2>
                    <p className="sfs-desc">
                        Aklınızdaki tüm soruları yanıtlamak ve geçiş sürecini planlamak için buradayız. Numaranızı bırakın, uzman ekibimiz size ulaşsın.
                    </p>
                </div>

                {/* Right Side: Form */}
                <div className="sfs-right">
                    <div className="sfs-form-card">
                        <h3 className="sfs-form-title">Hemen Sizi Arayalım</h3>
                        
                        <form className="sfs-form" onSubmit={(e) => e.preventDefault()}>
                            
                            <div className="sfs-input-group">
                                <span className="sfs-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </span>
                                <input type="text" placeholder="Ad Soyad" className="sfs-input" required />
                            </div>

                            <div className="sfs-input-group">
                                <span className="sfs-prefix">+90</span>
                                <input type="tel" placeholder="Telefon numaranız" className="sfs-input sfs-input-tel" required />
                            </div>

                            <button type="submit" className="sfs-submit-btn">
                                Sizi Arayalım
                            </button>

                            <p className="sfs-disclaimer">
                                Bilgileriniz gizli tutulur. Sizi hemen arayacağız.
                            </p>
                        </form>
                    </div>
                </div>

            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .sfs-section {
                    padding: 80px 0;
                    background: #FFFFFF;
                    font-family: 'Inter', sans-serif;
                }

                .sfs-container {
                    max-width: 1100px;
                    margin: 0 auto;
                    padding: 0 24px;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 60px;
                    align-items: center;
                }

                /* --- LEFT SIDE --- */
                .sfs-left {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                }

                .sfs-image-wrapper {
                    position: relative;
                    width: 260px;
                    height: 260px;
                    margin-bottom: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .sfs-image-inner {
                    position: relative;
                    width: 200px;
                    height: 200px;
                    border-radius: 50%;
                    overflow: hidden;
                    z-index: 10;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                    border: 4px solid white;
                }

                /* Concentric Rings */
                .sfs-ring {
                    position: absolute;
                    border-radius: 50%;
                    border: 1px solid rgba(120, 134, 199, 0.4);
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                }

                .sfs-ring-1 { width: 220px; height: 220px; border-width: 2px; border-color: rgba(120, 134, 199, 0.6); }
                .sfs-ring-2 { width: 260px; height: 260px; border-width: 1px; border-color: rgba(120, 134, 199, 0.3); }
                .sfs-ring-3 { width: 300px; height: 300px; border-width: 1px; border-color: rgba(120, 134, 199, 0.15); }

                .sfs-badge {
                    position: absolute;
                    bottom: 12px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 20;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    color: white;
                    font-size: 0.8rem;
                    font-weight: 600;
                    padding: 4px 12px;
                    border-radius: 99px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    white-space: nowrap;
                }

                .sfs-title {
                    font-size: 2.2rem;
                    font-weight: 800;
                    color: #111827;
                    margin-bottom: 12px;
                    letter-spacing: -0.03em;
                    line-height: 1.15;
                }

                .sfs-desc {
                    font-size: 1.05rem;
                    color: #6B7280;
                    line-height: 1.5;
                    font-weight: 500;
                    max-width: 450px;
                }

                /* --- RIGHT SIDE --- */
                .sfs-right {
                    display: flex;
                    justify-content: center;
                    width: 100%;
                }

                .sfs-form-card {
                    width: 100%;
                    max-width: 420px;
                }

                .sfs-form-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #111827;
                    margin-bottom: 16px;
                }

                .sfs-form {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .sfs-input-group {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .sfs-icon {
                    position: absolute;
                    left: 16px;
                    color: #9CA3AF;
                    display: flex;
                }

                .sfs-prefix {
                    position: absolute;
                    left: 14px;
                    color: #6B7280;
                    font-weight: 600;
                    font-size: 0.95rem;
                }

                .sfs-input {
                    width: 100%;
                    padding: 14px 14px 14px 44px;
                    border: 1px solid #E5E7EB;
                    border-radius: 12px;
                    font-size: 0.95rem;
                    color: #111827;
                    outline: none;
                    transition: border-color 0.2s ease;
                    font-family: inherit;
                }

                .sfs-input::placeholder {
                    color: #9CA3AF;
                    font-weight: 500;
                }

                .sfs-input:focus {
                    border-color: #7886C7;
                    box-shadow: 0 0 0 4px rgba(120, 134, 199, 0.1);
                }

                .sfs-input-tel {
                    padding-left: 52px;
                }

                .sfs-submit-btn {
                    background: #7886C7; /* JetPOS Blue */
                    color: white;
                    border: none;
                    border-radius: 12px;
                    padding: 14px;
                    font-size: 1.05rem;
                    font-weight: 700;
                    cursor: pointer;
                    margin-top: 8px;
                    transition: background 0.2s ease, transform 0.2s ease;
                }

                .sfs-submit-btn:hover {
                    background: #5A659F;
                    transform: translateY(-2px);
                }

                .sfs-disclaimer {
                    font-size: 0.85rem;
                    color: #6B7280;
                    margin-top: 8px;
                }

                @media (max-width: 992px) {
                    .sfs-container {
                        grid-template-columns: 1fr;
                        gap: 60px;
                    }
                    .sfs-left {
                        align-items: center;
                        text-align: center;
                    }
                    .sfs-desc {
                        max-width: 100%;
                    }
                }

                @media (max-width: 768px) {
                    .sfs-section { padding: 60px 0; }
                    .sfs-title { font-size: 2rem; }
                    .sfs-desc { font-size: 1rem; }
                }
                `
            }} />
        </section>
    );
}
