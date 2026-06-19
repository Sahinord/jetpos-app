"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Star, Clock, MapPin, ShoppingBag, Check } from "lucide-react";

const CATEGORIES = ["Burgerler", "Pizzalar", "İçecekler", "Tatlılar"];

const MENU_DATABASE = {
    "Burgerler": [
        { id: "b1", name: "Classic Burger", desc: "200 gr dana eti, cheddar peyniri, taze marul", price: 290, img: "/images/qr/classic_burger.png" },
        { id: "b2", name: "BBQ Burger", desc: "Füme et, çıtır soğan halkaları, barbekü sos", price: 340, img: "/images/qr/bbq_burger.png" },
        { id: "b3", name: "Mushroom Burger", desc: "Sote mantar, beyaz peynir, trüf mayonez", price: 310, img: "/images/qr/mushroom_burger.png" }
    ],
    "Pizzalar": [
        { id: "p1", name: "Karışık Pizza", desc: "Sucuk, sosis, mantar, zeytin, taze biber", price: 380, img: "/images/qr/mixed_pizza.png" }
    ],
    "İçecekler": [
        { id: "d1", name: "Kutu Kola", desc: "Buz gibi ferahlatıcı kutu içecek", price: 60, img: "/images/qr/cola.png" }
    ],
    "Tatlılar": [
        { id: "t1", name: "San Sebastian", desc: "Belçika çikolatası sosu ile servis edilir", price: 180, img: "/images/qr/cheesecake.png" }
    ]
};

export default function JetQRMockup({ isVisible = true }: { isVisible?: boolean }) {
    const [activeCategory, setActiveCategory] = useState("Burgerler");
    const [cartItems, setCartItems] = useState<{ id: string, name: string, price: number, qty: number }[]>([]);
    const [animatingCategory, setAnimatingCategory] = useState(false);
    const [clickedProducts, setClickedProducts] = useState<Record<string, boolean>>({});
    
    const [toastMessage, setToastMessage] = useState("");
    const [isOrderCompleted, setIsOrderCompleted] = useState(false);
    const toastTimeout = useRef<NodeJS.Timeout | null>(null);

    const handleCategorySwitch = (cat: string) => {
        if (cat === activeCategory || animatingCategory) return;
        setAnimatingCategory(true);
        setTimeout(() => {
            setActiveCategory(cat);
            setAnimatingCategory(false);
        }, 250);
    };

    const addToCart = (product: any) => {
        setClickedProducts(prev => ({ ...prev, [product.id]: true }));
        setTimeout(() => setClickedProducts(prev => ({ ...prev, [product.id]: false })), 300);

        setToastMessage(`✓ ${product.name} sepete eklendi`);
        if (toastTimeout.current) clearTimeout(toastTimeout.current);
        toastTimeout.current = setTimeout(() => setToastMessage(""), 2000);

        setCartItems(prev => {
            const exists = prev.find(item => item.id === product.id);
            if (exists) {
                return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
            }
            return [...prev, { id: product.id, name: product.name, price: product.price, qty: 1 }];
        });
    };

    const handleCompleteOrder = () => setIsOrderCompleted(true);
    const handleResetOrder = () => {
        setIsOrderCompleted(false);
        setCartItems([]);
    };

    const totalQty = cartItems.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

    return (
        <div className={`jetqr-mockup-wrapper ${isVisible ? "fade-in-left" : ""}`}>
            <div className="mockup-glow" />
            
            <div className={`iphone-mockup ${isVisible ? "float-anim" : ""}`}>
                <div className="iphone-notch"></div>
                <div className="iphone-inner-shadow"></div>

                {/* Top Toast Notification */}
                <div className={`mockup-toast ${toastMessage ? "visible" : ""}`}>
                    {toastMessage}
                </div>
                
                {/* ── Phone Screen Content (Mini App) ── */}
                <div className="iphone-screen">
                    <div className="screen-hero">
                        <Image 
                            src="/images/burger_hero.png" 
                            alt="Restaurant Burger Hero"
                            fill
                            className="hero-img"
                            style={{ objectFit: 'cover' }}
                        />
                        <div className="hero-overlay" />
                        <div className="restaurant-info">
                            <h3 className="restaurant-name">JetPOS Kitchen</h3>
                        </div>
                    </div>

                    <div className="screen-badges">
                        <span className="screen-badge"><Star className="b-icon" /> 4.8 Puan</span>
                        <span className="screen-badge"><Clock className="b-icon" /> 20-30 dk</span>
                        <span className="screen-badge"><MapPin className="b-icon" /> İstanbul</span>
                    </div>

                    <div className="screen-categories">
                        {CATEGORIES.map(cat => (
                            <button 
                                key={cat}
                                onClick={() => handleCategorySwitch(cat)}
                                className={`cat-pill ${activeCategory === cat ? "active" : ""}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className={`screen-products ${animatingCategory ? "products-fade-out" : "products-fade-in"}`}>
                        {MENU_DATABASE[activeCategory as keyof typeof MENU_DATABASE]?.map((item, idx) => (
                            <div 
                                key={item.id} 
                                className={`product-card ${clickedProducts[item.id] ? "scale-bounce" : ""}`} 
                                style={{ transitionDelay: `${animatingCategory ? 0 : idx * 50}ms` }}
                            >
                                <div className="product-info-left">
                                    <span className="product-name">{item.name}</span>
                                    <span className="product-desc">{item.desc}</span>
                                    <span className="product-price">₺{item.price}</span>
                                </div>
                                <div className="product-action-right">
                                    <div className="product-thumbnail">
                                        <Image src={item.img} alt={item.name} fill style={{ objectFit: 'cover' }} />
                                    </div>
                                    <button 
                                        className={`add-btn ${clickedProducts[item.id] ? "added" : ""}`}
                                        onClick={() => addToCart(item)}
                                    >
                                        {clickedProducts[item.id] ? <Check size={14} /> : "+"}
                                    </button>
                                </div>
                            </div>
                        ))}
                        <div style={{ height: "100px", flexShrink: 0 }} />
                    </div>
                </div>

                {/* Sticky Cart */}
                <div className={`mockup-cart-bar ${totalQty > 0 ? "cart-visible" : ""}`}>
                    <div className="cart-bar-inner">
                        <div className="cart-left">
                            <span className="cart-title">
                                <ShoppingBag size={14} className="cart-icon" />
                                Sepetim ({totalQty} Ürün)
                            </span>
                            <span className="cart-total">₺{totalPrice}</span>
                        </div>
                        <button className="cart-complete-btn" onClick={handleCompleteOrder}>
                            Siparişi Tamamla
                        </button>
                    </div>
                </div>

                {/* Success Overlay */}
                {isOrderCompleted && (
                    <div className="order-success-overlay">
                        <div className="success-glow" />
                        <div className="success-icon-wrapper">
                            <Check size={40} strokeWidth={3} />
                        </div>
                        <h4 className="success-title">Siparişiniz Başarıyla Oluşturuldu 🎉</h4>
                        
                        <div className="success-details">
                            <div className="detail-row">
                                <span>Sipariş No:</span>
                                <strong>#JP-48291</strong>
                            </div>
                            <div className="detail-row">
                                <span>Tahmini Süre:</span>
                                <strong>15-20 Dakika</strong>
                            </div>
                        </div>

                        <button className="success-track-btn" onClick={handleResetOrder}>
                            Sipariş Durumunu Takip Et
                        </button>
                        
                        <div className="particles-container">
                            <div className="particle p1"></div>
                            <div className="particle p2"></div>
                            <div className="particle p3"></div>
                            <div className="particle p4"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Injected CSS so it works anywhere */}
            <style dangerouslySetInnerHTML={{__html: `
                .jetqr-mockup-wrapper {
                    position: relative;
                    display: flex;
                    justify-content: center;
                    opacity: 0;
                    transform: translateX(40px) scale(0.95);
                    transition: opacity 0.8s ease 0.2s, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.2s;
                }
                .jetqr-mockup-wrapper.fade-in-left {
                    opacity: 1;
                    transform: translateX(0) scale(1);
                }

                .mockup-glow {
                    position: absolute;
                    width: 140%;
                    height: 140%;
                    top: -20%;
                    left: -20%;
                    background: radial-gradient(circle at center, rgba(120, 134, 199, 0.15) 0%, rgba(248, 250, 252, 0) 65%);
                    z-index: 0;
                    pointer-events: none;
                }

                .iphone-mockup {
                    width: 300px;
                    height: 620px;
                    background: #FFFFFF;
                    border-radius: 44px;
                    border: 12px solid #111827;
                    box-shadow: 
                        inset 0 0 0 2px #4B5563, 
                        inset 0 0 20px rgba(0,0,0,0.5),
                        0 25px 50px -12px rgba(120, 134, 199, 0.3);
                    position: relative;
                    z-index: 1;
                    overflow: hidden;
                }
                
                .iphone-inner-shadow {
                    position: absolute;
                    inset: 0;
                    border-radius: 32px;
                    box-shadow: inset 0 0 10px rgba(0,0,0,0.1);
                    pointer-events: none;
                    z-index: 20;
                }

                .float-anim {
                    animation: floatDevice 6s ease-in-out infinite;
                }

                @keyframes floatDevice {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-15px); }
                    100% { transform: translateY(0px); }
                }

                .iphone-notch {
                    position: absolute;
                    top: -1px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 120px;
                    height: 25px;
                    background: #111827;
                    border-bottom-left-radius: 16px;
                    border-bottom-right-radius: 16px;
                    z-index: 25;
                }

                /* Toast */
                .mockup-toast {
                    position: absolute;
                    top: 36px;
                    left: 50%;
                    transform: translateX(-50%) translateY(-20px);
                    background: rgba(17, 24, 39, 0.85);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 99px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    z-index: 40;
                    opacity: 0;
                    pointer-events: none;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                    backdrop-filter: blur(8px);
                    white-space: nowrap;
                }
                .mockup-toast.visible {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }

                /* ── Mockup Content Area ── */
                .iphone-screen {
                    width: 100%;
                    height: 100%;
                    background: #F9FAFB;
                    overflow-y: auto;
                    scrollbar-width: none;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                }
                .iphone-screen::-webkit-scrollbar { display: none; }

                /* ── QR Menu UI Elements ── */
                .screen-hero {
                    position: relative;
                    width: 100%;
                    height: 220px;
                    flex-shrink: 0;
                }
                .hero-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, rgba(17,24,39,0.95) 0%, rgba(17,24,39,0.2) 50%, rgba(17,24,39,0.5) 100%);
                    z-index: 1;
                }
                .restaurant-info {
                    position: absolute;
                    bottom: 16px;
                    left: 16px;
                    z-index: 2;
                }
                .restaurant-name {
                    color: #FFFFFF;
                    font-size: 1.4rem;
                    font-weight: 800;
                    margin: 0;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                }

                .screen-badges {
                    display: flex;
                    gap: 8px;
                    padding: 14px 16px;
                    background: #FFFFFF;
                    border-bottom: 1px solid #F3F4F6;
                    overflow-x: auto;
                    white-space: nowrap;
                    scrollbar-width: none;
                    flex-shrink: 0;
                }
                .screen-badges::-webkit-scrollbar { display: none; }
                
                .screen-badge {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #4B5563;
                    background: #F8FAFC;
                    padding: 6px 10px;
                    border-radius: 6px;
                    border: 1px solid #E5E7EB;
                }
                .b-icon {
                    width: 12px;
                    height: 12px;
                    color: #7886C7;
                }

                .screen-categories {
                    display: flex;
                    gap: 8px;
                    padding: 14px 16px;
                    overflow-x: auto;
                    scrollbar-width: none;
                    background: rgba(249, 250, 251, 0.95);
                    backdrop-filter: blur(8px);
                    position: sticky;
                    top: 24px;
                    z-index: 5;
                    flex-shrink: 0;
                    border-bottom: 1px solid rgba(229, 231, 235, 0.5);
                }
                .screen-categories::-webkit-scrollbar { display: none; }
                
                .cat-pill {
                    font-size: 0.8rem;
                    font-weight: 600;
                    padding: 8px 16px;
                    background: #FFFFFF;
                    color: #6B7280;
                    border: 1px solid #E5E7EB;
                    border-radius: 99px;
                    white-space: nowrap;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .cat-pill.active {
                    background: #7886C7;
                    color: #FFFFFF;
                    border-color: #7886C7;
                    box-shadow: 0 4px 10px rgba(120, 134, 199, 0.3);
                }

                .screen-products {
                    padding: 8px 16px 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    transition: opacity 0.2s ease, transform 0.2s ease;
                    flex-grow: 1;
                }
                .products-fade-out { opacity: 0; transform: translateY(10px); }
                .products-fade-in { opacity: 1; transform: translateY(0); }

                .product-card {
                    display: flex;
                    justify-content: space-between;
                    background: #FFFFFF;
                    padding: 14px;
                    border-radius: 16px;
                    border: 1px solid #F3F4F6;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.02);
                    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s ease;
                }
                .product-card:hover { box-shadow: 0 6px 16px rgba(0,0,0,0.05); }
                
                .scale-bounce {
                    transform: scale(0.96);
                    box-shadow: 0 2px 4px rgba(120, 134, 199, 0.2);
                    border-color: #9AA7DF;
                }

                .product-info-left {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    flex: 1;
                    padding-right: 12px;
                }
                .product-name {
                    font-size: 0.95rem;
                    font-weight: 700;
                    color: #111827;
                    line-height: 1.2;
                }
                .product-desc {
                    font-size: 0.75rem;
                    color: #6B7280;
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .product-price {
                    font-size: 0.9rem;
                    font-weight: 700;
                    color: #7886C7;
                    margin-top: 2px;
                }

                .product-action-right {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                }
                .product-thumbnail {
                    width: 64px;
                    height: 64px;
                    background: #F3F4F6;
                    border-radius: 12px;
                    position: relative;
                    overflow: hidden;
                }
                
                .add-btn {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: #F8FAFC;
                    border: 1px solid #E5E7EB;
                    color: #7886C7;
                    font-size: 1.2rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                .add-btn:active { transform: scale(0.9); }
                .add-btn.added {
                    background: #7886C7;
                    color: #FFFFFF;
                    border-color: #7886C7;
                    transform: scale(1.1);
                }

                /* Sticky Bottom Cart */
                .mockup-cart-bar {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    padding: 16px;
                    background: linear-gradient(to top, rgba(255,255,255,1) 80%, rgba(255,255,255,0) 100%);
                    z-index: 15;
                    transform: translateY(100%);
                    opacity: 0;
                    transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease;
                }
                .mockup-cart-bar.cart-visible {
                    transform: translateY(0);
                    opacity: 1;
                }

                .cart-bar-inner {
                    background: #111827;
                    border-radius: 16px;
                    padding: 12px 16px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1);
                }
                
                .cart-left { display: flex; flex-direction: column; gap: 2px; }
                .cart-title {
                    color: #9CA3AF;
                    font-size: 0.75rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .cart-icon { color: #9AA7DF; }
                .cart-total { color: #FFFFFF; font-size: 1.1rem; font-weight: 800; }

                .cart-complete-btn {
                    background: linear-gradient(135deg, #7886C7 0%, #5A659F 100%);
                    color: #FFFFFF;
                    border: none;
                    padding: 10px 16px;
                    border-radius: 10px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                    box-shadow: 0 4px 12px rgba(120, 134, 199, 0.4);
                }
                .cart-complete-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(120, 134, 199, 0.6);
                }

                /* Order Success Overlay */
                .order-success-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(248, 250, 252, 0.85);
                    backdrop-filter: blur(12px);
                    z-index: 50;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 24px;
                    opacity: 0;
                    animation: successFadeIn 0.5s ease forwards;
                    overflow: hidden;
                }

                @keyframes successFadeIn { to { opacity: 1; } }

                .success-glow {
                    position: absolute;
                    width: 250px;
                    height: 250px;
                    background: radial-gradient(circle, rgba(120, 134, 199, 0.4) 0%, rgba(120, 134, 199, 0) 70%);
                    z-index: -1;
                    animation: glowPulse 2s infinite alternate;
                }

                @keyframes glowPulse {
                    from { transform: scale(0.8); opacity: 0.5; }
                    to { transform: scale(1.2); opacity: 1; }
                }

                .success-icon-wrapper {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: #7886C7;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    margin-bottom: 24px;
                    box-shadow: 0 10px 25px rgba(120, 134, 199, 0.5);
                    transform: scale(0);
                    animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s forwards;
                }

                @keyframes popIn { to { transform: scale(1); } }

                .success-title {
                    font-size: 1.25rem;
                    font-weight: 800;
                    color: #111827;
                    margin-bottom: 16px;
                    opacity: 0;
                    transform: translateY(10px);
                    animation: slideUpFade 0.5s ease 0.5s forwards;
                }

                .success-details {
                    background: #FFFFFF;
                    border-radius: 16px;
                    padding: 16px;
                    width: 100%;
                    border: 1px solid #E5E7EB;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
                    margin-bottom: 24px;
                    opacity: 0;
                    transform: translateY(10px);
                    animation: slideUpFade 0.5s ease 0.6s forwards;
                }

                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.9rem;
                    padding: 8px 0;
                    color: #4B5563;
                }
                .detail-row:not(:last-child) { border-bottom: 1px dashed #E5E7EB; }
                .detail-row strong { color: #111827; font-weight: 700; }

                .success-track-btn {
                    background: #111827;
                    color: #FFFFFF;
                    border: none;
                    width: 100%;
                    padding: 14px;
                    border-radius: 12px;
                    font-size: 0.95rem;
                    font-weight: 700;
                    cursor: pointer;
                    opacity: 0;
                    transform: translateY(10px);
                    animation: slideUpFade 0.5s ease 0.7s forwards;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    transition: background 0.2s;
                }
                .success-track-btn:hover { background: #1F2937; }

                @keyframes slideUpFade { to { opacity: 1; transform: translateY(0); } }

                /* Simple Particles */
                .particles-container {
                    position: absolute;
                    inset: 0;
                    z-index: 0;
                    pointer-events: none;
                }
                .particle {
                    position: absolute;
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #7886C7;
                    opacity: 0;
                }
                .p1 { top: 50%; left: 50%; animation: pExplode1 1s ease-out 0.3s forwards; }
                .p2 { top: 50%; left: 50%; animation: pExplode2 1s ease-out 0.3s forwards; background: #9AA7DF; }
                .p3 { top: 50%; left: 50%; animation: pExplode3 1s ease-out 0.3s forwards; background: #10B981; }
                .p4 { top: 50%; left: 50%; animation: pExplode4 1s ease-out 0.3s forwards; background: #F59E0B; }

                @keyframes pExplode1 { 0% { transform: translate(0, 0) scale(1); opacity: 1; } 100% { transform: translate(-80px, -100px) scale(0); opacity: 0; } }
                @keyframes pExplode2 { 0% { transform: translate(0, 0) scale(1); opacity: 1; } 100% { transform: translate(80px, -80px) scale(0); opacity: 0; } }
                @keyframes pExplode3 { 0% { transform: translate(0, 0) scale(1); opacity: 1; } 100% { transform: translate(-60px, 80px) scale(0); opacity: 0; } }
                @keyframes pExplode4 { 0% { transform: translate(0, 0) scale(1); opacity: 1; } 100% { transform: translate(60px, 100px) scale(0); opacity: 0; } }
            `}} />
        </div>
    );
}
