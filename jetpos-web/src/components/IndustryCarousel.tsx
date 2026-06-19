"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import Image from "next/image";

const industries = [
    { 
        id: 0, 
        name: "Market", 
        title: "Market Yönetimi", 
        desc: "Geniş SKU çeşidine rağmen satış ve tahsilatı net görün; tedarik ve günlük kapanışı hızlandırın.", 
        image: "/bakkal.png", 
        bottomTitle: "Market",
        bottomSub: "Ürün: 2.487"
    },
    { 
        id: 1, 
        name: "Kırtasiye", 
        title: "Kırtasiye Takibi", 
        desc: "Binlerce farklı barkodlu ürünü saniyeler içinde okutun, raf ve stok karışıklığına son verin.", 
        image: "/kirtasiye.png", 
        bottomTitle: "Kırtasiye",
        bottomSub: "Aktif SKU: 1.127"
    },
    { 
        id: 2, 
        name: "Hazır Giyim", 
        title: "Giyim & Butik", 
        desc: "Renk, beden ve varyant takibini kolaylaştırın. Sezonluk satışlarınızı anlık kontrol edin.", 
        image: "/giyim.png", 
        bottomTitle: "Giyim",
        bottomSub: "Stok: S/M/L"
    },
    { 
        id: 3, 
        name: "Kafe", 
        title: "Kafe Otomasyonu", 
        desc: "Hızlı sipariş alın, mutfak fişi yazdırın ve paket servis süreçlerinizi kusursuz yönetin.", 
        image: "/kafe.png", 
        bottomTitle: "Kafe",
        bottomSub: "Sipariş: 342"
    },
    { 
        id: 4, 
        name: "Kasap", 
        title: "Kasap Çözümü", 
        desc: "Terazi entegrasyonu ile gramajlı ürünleri hızlıca satın, fire oranlarınızı anlık izleyin.", 
        image: "/kasap.png", 
        bottomTitle: "Kasap",
        bottomSub: "Fire: %2.4"
    },
    { 
        id: 5, 
        name: "Elektronik", 
        title: "Teknoloji Mağazası", 
        desc: "Seri no takibi ve garanti yönetimi ile teknoloji ürünlerini güvenle kayıt altında tutun.", 
        image: "/mediamarket.png", 
        bottomTitle: "Elektronik",
        bottomSub: "Seri No: 4.5K"
    },
    { 
        id: 6, 
        name: "Eczane", 
        title: "Eczane POS", 
        desc: "OTC ve dermokozmetik ürünlerinizi hızlı kasadan geçirip operasyonu hızlandırın.", 
        image: "/eczane.png", 
        bottomTitle: "Eczane",
        bottomSub: "OTC: 850"
    },
    { 
        id: 7, 
        name: "Nalbur", 
        title: "Nalbur Çözümü", 
        desc: "On binlerce ufak parçayı barkodlayın, ustalarla açık hesaplarınızı takip edin.", 
        image: "/nalbur.png", 
        bottomTitle: "Nalbur",
        bottomSub: "Ürün: 15K+"
    },
    { 
        id: 8, 
        name: "Oto Yedek", 
        title: "Oto Parça Takibi", 
        desc: "Araç modeline göre OEM parçaları saniyeler içinde bulun, atölye carilerini yönetin.", 
        image: "/yedekparca.png", 
        bottomTitle: "Oto Parça",
        bottomSub: "OEM: 12K+"
    },
    { 
        id: 9, 
        name: "Pet Shop", 
        title: "Pet Shop Yönetimi", 
        desc: "Mama, oyuncak satışlarınızı yönetin, sadık müşteri programları (puan/indirim) oluşturun.", 
        image: "/petshop.png", 
        bottomTitle: "Pet Shop",
        bottomSub: "Sadakat: 450"
    },
    { 
        id: 10, 
        name: "Kozmetik", 
        title: "Kozmetik & Güzellik", 
        desc: "Raf ömrü ve lot takibi yapın, çok al az öde gibi dinamik kampanyalar kurgulayın.", 
        image: "/kozmetik.png", 
        bottomTitle: "Kozmetik",
        bottomSub: "Kampanya: 3 aktif"
    },
    { 
        id: 11, 
        name: "Spor", 
        title: "Spor Malzemeleri", 
        desc: "Sporcu supplementleri ve giyim satışlarınızı hızlıca yönetip kârlılığınızı izleyin.", 
        image: "/spor.png", 
        bottomTitle: "Spor Malzemeleri",
        bottomSub: "Kategori: 12"
    }
];

export default function IndustryCarousel() {
    const [activeIndex, setActiveIndex] = useState(4); // Default to a middle one
    const [isHovered, setIsHovered] = useState(false);
    const [windowWidth, setWindowWidth] = useState(1440);
    const [isMobile, setIsMobile] = useState(false);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const autoplayRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
            setIsMobile(window.innerWidth <= 768);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Auto-play logic
    useEffect(() => {
        if (isHovered) {
            if (autoplayRef.current) clearInterval(autoplayRef.current);
            return;
        }

        autoplayRef.current = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % industries.length);
        }, 3000);

        return () => {
            if (autoplayRef.current) clearInterval(autoplayRef.current);
        };
    }, [isHovered]);

    // Keyboard and Wheel navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') {
                setActiveIndex((prev) => (prev + 1) % industries.length);
            } else if (e.key === 'ArrowLeft') {
                setActiveIndex((prev) => (prev - 1 + industries.length) % industries.length);
            }
        };

        const handleWheel = (e: WheelEvent) => {
            if (isHovered && Math.abs(e.deltaX) > 20) {
                if (e.deltaX > 0) {
                    setActiveIndex((prev) => (prev + 1) % industries.length);
                } else {
                    setActiveIndex((prev) => (prev - 1 + industries.length) % industries.length);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        const el = containerRef.current;
        if (el) {
            el.addEventListener('wheel', handleWheel, { passive: true });
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (el) el.removeEventListener('wheel', handleWheel);
        };
    }, [isHovered]);

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.x < -50) {
            setActiveIndex((prev) => (prev + 1) % industries.length);
        } else if (info.offset.x > 50) {
            setActiveIndex((prev) => (prev - 1 + industries.length) % industries.length);
        }
    };

    // Card widths (Accordion effect)
    // Active card expands to a wide view, inactive ones shrink.
    const cardW = isMobile ? 80 : 220;
    const activeW = isMobile ? windowWidth * 0.8 : 650;
    const gap = isMobile ? 12 : 24;
    
    // Auto-center the active card on the screen
    const trackX = (windowWidth / 2) - ((activeIndex * (cardW + gap)) + (activeW / 2));

    return (
        <section className="ic-section">
            <div className="ic-header">
                <h2>Her Sektöre Kusursuz Uyum</h2>
                <p>Marketten mağazaya, işletmenizin tüm ihtiyaçları tek bir platformda.</p>
            </div>

            <div 
                className="ic-carousel-container" 
                ref={containerRef}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onTouchStart={() => setIsHovered(true)}
                onTouchEnd={() => setIsHovered(false)}
            >
                <motion.div 
                    className="ic-track"
                    drag="x"
                    dragConstraints={{ left: trackX, right: trackX }}
                    dragElastic={0.1}
                    onDragEnd={handleDragEnd}
                    animate={{ x: trackX }}
                    transition={{ type: "spring", stiffness: 200, damping: 25, mass: 0.8 }}
                >
                    {industries.map((ind, i) => {
                        const isActive = activeIndex === i;

                        return (
                            <motion.div
                                layout
                                key={ind.id}
                                className={`ic-card ${isActive ? 'active' : ''}`}
                                onClick={() => setActiveIndex(i)}
                                animate={{
                                    width: isActive ? activeW : cardW,
                                }}
                                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                            >
                                <div className="ic-card-bg">
                                    <Image src={ind.image} alt={ind.name} fill style={{ objectFit: 'cover', objectPosition: 'center' }} quality={90} />
                                    {isActive ? (
                                        <div className="ic-overlay-active" />
                                    ) : (
                                        <div className="ic-overlay-inactive" />
                                    )}
                                </div>
                                
                                <div className="ic-card-content">
                                    <AnimatePresence>
                                        {isActive && (
                                            <motion.div 
                                                className="active-content"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <div className="ic-top">
                                                    <h3>{ind.title}</h3>
                                                    <p>{ind.desc}</p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <AnimatePresence>
                                        {!isActive && (
                                            <motion.div 
                                                className="inactive-content"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <div className="ic-bottom-inactive">
                                                    <span className="inactive-title">{ind.bottomTitle}</span>
                                                    <span className="inactive-sub">{ind.bottomSub}</span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .ic-section {
                    padding: 100px 0;
                    background: #F8FAFC;
                    overflow: hidden;
                    font-family: 'Inter', sans-serif;
                }
                .ic-header {
                    text-align: center;
                    margin-bottom: 50px;
                }
                .ic-header h2 {
                    font-size: 2.8rem;
                    font-weight: 800;
                    color: #111827;
                    letter-spacing: -0.03em;
                    margin-bottom: 12px;
                }
                .ic-header p {
                    font-size: 1.1rem;
                    color: #6B7280;
                    font-weight: 500;
                }

                .ic-carousel-container {
                    position: relative;
                    width: 100%;
                    height: 550px;
                    display: flex;
                    align-items: center;
                    touch-action: pan-y;
                }

                .ic-track {
                    display: flex;
                    align-items: center;
                    gap: 24px;
                    height: 100%;
                    cursor: grab;
                    will-change: transform;
                }
                .ic-track:active {
                    cursor: grabbing;
                }

                .ic-card {
                    height: 550px;
                    border-radius: 20px;
                    overflow: hidden;
                    position: relative;
                    cursor: pointer;
                    transform: translateZ(0); /* hardware acceleration */
                    will-change: width;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                    flex-shrink: 0;
                }

                .ic-card-bg {
                    position: absolute;
                    inset: 0;
                    z-index: 0;
                }
                
                .ic-overlay-active {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.4) 100%);
                    z-index: 1;
                }

                .ic-overlay-inactive {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.8) 100%);
                    z-index: 1;
                }

                .ic-card-content {
                    position: relative;
                    z-index: 2;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                .active-content {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    padding: 24px;
                }

                .inactive-content {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                    padding: 24px;
                    text-align: center;
                    align-items: center;
                }

                .ic-top h3 {
                    font-size: 2.2rem;
                    font-weight: 800;
                    color: white;
                    margin-bottom: 4px;
                    text-shadow: 0 2px 10px rgba(0,0,0,0.5);
                    white-space: nowrap;
                }

                .ic-top p {
                    font-size: 1.05rem;
                    line-height: 1.4;
                    color: rgba(255,255,255,0.95);
                    max-width: 400px;
                    text-shadow: 0 1px 5px rgba(0,0,0,0.5);
                }

                .ic-bottom-inactive {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                }

                .inactive-title {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: rgba(255,255,255,0.9);
                    margin-bottom: 4px;
                    white-space: nowrap;
                }

                .inactive-sub {
                    font-size: 1.2rem;
                    color: rgba(255,255,255,0.7);
                    font-weight: 600;
                    white-space: nowrap;
                }

                .inactive-sub strong {
                    color: white;
                }

                @media (max-width: 1024px) {
                    .ic-card { height: 480px; }
                    .ic-carousel-container { height: 480px; }
                    .ic-top h3 { font-size: 1.8rem; }
                }

                @media (max-width: 768px) {
                    .ic-card { height: 400px; border-radius: 16px; }
                    .ic-carousel-container { height: 400px; }
                    .active-content { padding: 24px; }
                    .ic-top h3 { font-size: 1.4rem; }
                    .ic-top p { font-size: 0.95rem; white-space: normal; }
                    .ic-header h2 { font-size: 2rem; }
                    .ic-header p { font-size: 1rem; }
                    .ic-track { gap: 12px; }
                }
                `
            }} />
        </section>
    );
}
