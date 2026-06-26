"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const stories = [
    {
        id: 1,
        name: "Elif Karaca",
        type: "Butik Sahibi",
        city: "İstanbul",
        image: "/giyim.png",
        text: "Barkodlu satış sistemi sayesinde kasa işlemlerimiz çok hızlandı. Gün sonu raporlarını artık saniyeler içinde alıyoruz."
    },
    {
        id: 2,
        name: "Ahmet Yılmaz",
        type: "Market İşletmecisi",
        city: "Ankara",
        image: "/bakkal.png",
        text: "Stok takibi sayesinde hangi ürünün ne zaman biteceğini önceden görüyoruz. Sipariş planlamamız çok daha kolay hale geldi."
    },
    {
        id: 3,
        name: "Caner Polat",
        type: "Pet Shop Sahibi",
        city: "İzmir",
        image: "/petshop.png",
        text: "E-Fatura ve tahsilat süreçlerini tek panelden yönetmek ciddi zaman kazandırdı. Tüm muhasebem elimde."
    },
    {
        id: 4,
        name: "Zeynep Arslan",
        type: "Kafe Sahibi",
        city: "Antalya",
        image: "/kafe.png",
        text: "QR Menü ve mutfak ekranı entegrasyonu servis hızımızı ciddi şekilde artırdı. Müşteri memnuniyeti tavan yaptı."
    },
    {
        id: 5,
        name: "Hakan Çelik",
        type: "Teknoloji Mağazası",
        city: "Bursa",
        image: "/mediamarket.png",
        text: "Kasada yaşadığımız karışıklıklar tamamen ortadan kalktı. Personel eğitim süresi bile azaldı."
    }
];

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 50 : -50,
        opacity: 0,
        scale: 0.98
    }),
    center: {
        x: 0,
        opacity: 1,
        scale: 1,
        zIndex: 1
    },
    exit: (direction: number) => ({
        x: direction < 0 ? 50 : -50,
        opacity: 0,
        scale: 0.98,
        zIndex: 0
    })
};

export default function Testimonials() {
    const [[page, direction], setPage] = useState([0, 0]);
    const [isHovered, setIsHovered] = useState(false);
    
    const activeIndex = Math.abs(page % stories.length);
    const story = stories[activeIndex];

    const paginate = (newDirection: number) => {
        setPage([page + newDirection, newDirection]);
    };

    useEffect(() => {
        if (isHovered) return;

        const timer = setInterval(() => {
            paginate(1);
        }, 6000);

        return () => clearInterval(timer);
    }, [page, isHovered]);

    return (
        <section className="ts-section" id="testimonials">
            <div className="ts-container">
                
                <div className="ts-header">
                    <h2>JetPOS ile Büyüyen İşletmeler</h2>
                    <p>Kafeden markete, pet shop'tan eczaneye kadar yüzlerce işletme satış süreçlerini JetPOS ile yönetiyor.</p>
                </div>

                <div 
                    className="ts-card"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <div className="ts-card-clip">
                        <AnimatePresence initial={false} custom={direction}>
                            <motion.div
                                key={page}
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { type: "spring", stiffness: 300, damping: 30 },
                                    opacity: { duration: 0.4 },
                                    scale: { duration: 0.4 }
                                }}
                                className="ts-slide"
                            >
                                <div className="ts-left">
                                    <Image 
                                        src={story.image} 
                                        alt={story.name} 
                                        fill 
                                        style={{ objectFit: 'cover', objectPosition: 'center' }} 
                                        quality={95}
                                    />
                                    <div className="ts-overlay" />
                                    <div className="ts-person-info">
                                        <h4>{story.name}</h4>
                                        <div className="ts-tags">
                                            <span className="ts-tag">{story.type}</span>
                                            <span className="ts-dot">•</span>
                                            <span className="ts-tag-city">{story.city}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="ts-right">
                                    <div className="ts-quote-mark">“</div>
                                    <div className="ts-stars">
                                        {[...Array(5)].map((_, i) => (
                                            <svg key={i} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#FBBF24"/>
                                            </svg>
                                        ))}
                                    </div>
                                    <p className="ts-text">{story.text}</p>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="ts-controls">
                        <button className="ts-btn" onClick={() => paginate(-1)} aria-label="Previous">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                        </button>
                        <button className="ts-btn" onClick={() => paginate(1)} aria-label="Next">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 18l6-6-6-6" />
                            </svg>
                        </button>
                    </div>

                </div>

            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .ts-section {
                    padding: 120px 0;
                    background: #F8FAFC;
                    font-family: 'Inter', sans-serif;
                }

                .ts-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 24px;
                }

                .ts-header {
                    text-align: center;
                    margin-bottom: 60px;
                }

                .ts-header h2 {
                    font-size: 2.8rem;
                    font-weight: 800;
                    color: #111827;
                    letter-spacing: -0.03em;
                    margin-bottom: 16px;
                }

                .ts-header p {
                    font-size: 1.15rem;
                    color: #6B7280;
                    font-weight: 500;
                    max-width: 600px;
                    margin: 0 auto;
                    line-height: 1.6;
                }

                .ts-card {
                    background: #FFFFFF;
                    border: 1px solid rgba(120,134,199,0.12);
                    border-radius: 32px;
                    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.05), 0 10px 20px -5px rgba(120,134,199,0.05);
                    position: relative;
                    height: 500px;
                }

                .ts-card-clip {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    border-radius: 32px;
                    overflow: hidden;
                }

                .ts-slide {
                    position: absolute;
                    inset: 0;
                    display: flex;
                }

                .ts-left {
                    width: 45%;
                    height: 100%;
                    position: relative;
                }

                .ts-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.8) 100%);
                    z-index: 1;
                }

                .ts-person-info {
                    position: absolute;
                    bottom: 40px;
                    left: 40px;
                    z-index: 2;
                }

                .ts-person-info h4 {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 8px;
                }

                .ts-tags {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .ts-tag {
                    background: rgba(255,255,255,0.2);
                    backdrop-filter: blur(8px);
                    padding: 6px 14px;
                    border-radius: 20px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: white;
                    border: 1px solid rgba(255,255,255,0.3);
                }

                .ts-dot {
                    color: rgba(255,255,255,0.6);
                    font-size: 1.2rem;
                }

                .ts-tag-city {
                    font-size: 1rem;
                    font-weight: 500;
                    color: rgba(255,255,255,0.9);
                }

                .ts-right {
                    width: 55%;
                    padding: 60px 80px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    position: relative;
                    background: white;
                }

                .ts-quote-mark {
                    font-family: Georgia, serif;
                    font-size: 120px;
                    line-height: 1;
                    color: rgba(120,134,199,0.15); /* Primary very light */
                    position: absolute;
                    top: 40px;
                    left: 60px;
                }

                .ts-stars {
                    display: flex;
                    gap: 6px;
                    margin-bottom: 24px;
                    position: relative;
                    z-index: 2;
                }

                .ts-text {
                    font-size: 1.8rem;
                    line-height: 1.5;
                    font-weight: 600;
                    color: #111827;
                    position: relative;
                    z-index: 2;
                    letter-spacing: -0.02em;
                }

                .ts-controls {
                    position: absolute;
                    bottom: 40px;
                    right: 40px;
                    display: flex;
                    gap: 16px;
                    z-index: 10;
                }

                .ts-btn {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    border: 1px solid rgba(120,134,199,0.2);
                    background: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #5A659F;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
                }

                .ts-btn:hover {
                    background: #F8FAFC;
                    border-color: #7886C7;
                    color: #7886C7;
                    transform: scale(1.05);
                }

                @media (max-width: 992px) {
                    .ts-card { height: auto; min-height: 600px; }
                    .ts-slide { flex-direction: column; position: relative; }
                    .ts-left { width: 100%; height: 350px; }
                    .ts-right { width: 100%; padding: 40px; padding-bottom: 100px; }
                    .ts-quote-mark { top: 20px; left: 20px; font-size: 80px; }
                    .ts-text { font-size: 1.4rem; }
                }

                @media (max-width: 768px) {
                    .ts-header h2 { font-size: 2.2rem; }
                    .ts-person-info { bottom: 20px; left: 20px; }
                    .ts-person-info h4 { font-size: 1.5rem; }
                    .ts-right { padding: 30px; padding-bottom: 90px; }
                    .ts-text { font-size: 1.2rem; }
                    .ts-controls { bottom: 20px; right: 20px; }
                }
                `
            }} />
        </section>
    );
}
