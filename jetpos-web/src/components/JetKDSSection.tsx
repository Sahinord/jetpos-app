"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronRight, Check } from "lucide-react";
import Link from "next/link";

export default function JetKDSSection({ hideContent = false }: { hideContent?: boolean }) {
    const [step, setStep] = useState(0);
    const [timer, setTimer] = useState(0);

    // Orchestrate the new animation sequence
    useEffect(() => {
        let t: NodeJS.Timeout;

        switch (step) {
            case 0: t = setTimeout(() => setStep(1), 1500); break; // Idle -> Tap Burger
            case 1: t = setTimeout(() => setStep(2), 500); break;  // Burger anim -> in cart
            case 2: t = setTimeout(() => setStep(3), 1000); break; // Wait -> Tap Kola
            case 3: t = setTimeout(() => setStep(4), 500); break;  // Kola anim -> in cart
            case 4: t = setTimeout(() => setStep(5), 1000); break; // Wait -> Tap Confirm
            case 5: t = setTimeout(() => setStep(6), 800); break;  // Confirm anim -> Flow
            case 6: t = setTimeout(() => setStep(7), 1200); break; // Flow -> KDS Yeni
            case 7: t = setTimeout(() => setStep(8), 2000); break; // Yeni -> Hazırlanıyor
            case 8:
                setTimer(0);
                t = setTimeout(() => setStep(9), 3000); // Hazırlanıyor -> Hazır
                break;
            case 9: t = setTimeout(() => setStep(10), 3000); break; // Hazır -> Teslim
            case 10: t = setTimeout(() => setStep(0), 1500); break; // Loop
        }

        return () => clearTimeout(t);
    }, [step]);

    // Internal timer for step 8 (Hazırlanıyor)
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (step === 8) {
            interval = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [step]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    return (
        <section className="kds-section" style={{ padding: "100px 0", position: "relative", overflow: "hidden", background: "#FFFFFF", borderTop: "1px solid rgba(120,134,199,0.1)", borderBottom: "1px solid rgba(120,134,199,0.1)" }}>
            <div className="site-container">
                <div className={`kds-layout ${hideContent ? 'hide-content' : ''}`}>

                    {/* ── LEFT: KDS MONITOR (45%) ── */}
                    <div className="kds-monitor-wrapper">
                        <div className="hardware-monitor">
                            <div className="kds-monitor">
                                {/* Monitor Header */}
                                <div className="kds-header">
                                    <div className="kds-logo">
                                        <span style={{ fontWeight: 800 }}>JET</span>
                                        <span style={{ color: "#7886C7", fontWeight: 800 }}>KDS</span>
                                    </div>
                                    <div className="kds-header-title">Mutfak Ekranı</div>
                                    <div className="kds-time">{new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>

                                {/* Monitor Columns */}
                                <div className="kds-columns">
                                    {/* Yeni Sipariş */}
                                    <div className="kds-col">
                                        <div className="kds-col-header" style={{ borderTopColor: "#10B981" }}>Yeni Sipariş</div>
                                        <div className="kds-col-body">
                                            <AnimatePresence>
                                                {step === 7 && (
                                                    <motion.div
                                                        layoutId="kds-order"
                                                        key="kds-yeni"
                                                        className="kds-card" style={{ borderLeft: "4px solid #10B981", boxShadow: "0 0 20px rgba(16,185,129,0.15)" }}
                                                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        transition={{ duration: 0.4 }}
                                                    >
                                                        <div className="kds-card-head">
                                                            <span className="kds-table">Masa 12</span>
                                                            <span className="kds-status" style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>Yeni</span>
                                                        </div>
                                                        <ul className="kds-items">
                                                            <li><strong>1x</strong> Burger</li>
                                                            <li><strong>1x</strong> Kola</li>
                                                        </ul>
                                                        <div className="kds-card-foot">
                                                            <span className="kds-timer">00:00</span>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    {/* Hazırlanıyor */}
                                    <div className="kds-col">
                                        <div className="kds-col-header" style={{ borderTopColor: "#F59E0B" }}>Hazırlanıyor</div>
                                        <div className="kds-col-body">
                                            <AnimatePresence>
                                                {step === 8 && (
                                                    <motion.div
                                                        layoutId="kds-order"
                                                        key="kds-hazirlaniyor"
                                                        className="kds-card" style={{ borderLeft: "4px solid #F59E0B", boxShadow: "0 0 20px rgba(245,158,11,0.15)" }}
                                                        transition={{ duration: 0.4 }}
                                                    >
                                                        <div className="kds-card-head">
                                                            <span className="kds-table">Masa 12</span>
                                                            <span className="kds-status" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>Hazırlanıyor</span>
                                                        </div>
                                                        <ul className="kds-items">
                                                            <li><strong>1x</strong> Burger</li>
                                                            <li><strong>1x</strong> Kola</li>
                                                        </ul>
                                                        <div className="kds-card-foot">
                                                            <span className="kds-timer" style={{ color: "#F59E0B", animation: "pulseText 1s infinite" }}>{formatTime(timer)}</span>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    {/* Hazır */}
                                    <div className="kds-col">
                                        <div className="kds-col-header" style={{ borderTopColor: "#7886C7" }}>Hazır</div>
                                        <div className="kds-col-body">
                                            <AnimatePresence>
                                                {step === 9 && (
                                                    <motion.div
                                                        layoutId="kds-order"
                                                        key="kds-hazir"
                                                        className="kds-card" style={{ borderLeft: "4px solid #7886C7", boxShadow: "0 0 20px rgba(120,134,199,0.2)" }}
                                                        transition={{ duration: 0.4 }}
                                                    >
                                                        <div className="kds-card-head">
                                                            <span className="kds-table">Masa 12</span>
                                                            <span className="kds-status" style={{ background: "rgba(120,134,199,0.1)", color: "#7886C7" }}>Hazır</span>
                                                        </div>
                                                        <ul className="kds-items" style={{ textDecoration: "line-through", color: "#9CA3AF" }}>
                                                            <li><strong>1x</strong> Burger</li>
                                                            <li><strong>1x</strong> Kola</li>
                                                        </ul>
                                                        <div className="kds-card-foot">
                                                            <span className="kds-timer" style={{ color: "#7886C7" }}>{formatTime(timer)}</span>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    {/* Teslim Edildi */}
                                    <div className="kds-col">
                                        <div className="kds-col-header" style={{ borderTopColor: "#6B7280" }}>Teslim Edildi</div>
                                        <div className="kds-col-body">
                                            <AnimatePresence>
                                                {step === 10 && (
                                                    <motion.div
                                                        layoutId="kds-order"
                                                        key="kds-teslim"
                                                        className="kds-card" style={{ borderLeft: "4px solid #6B7280", opacity: 0.6 }}
                                                        exit={{ opacity: 0, x: 30, scale: 0.95 }}
                                                        transition={{ duration: 0.4 }}
                                                    >
                                                        <div className="kds-card-head">
                                                            <span className="kds-table">Masa 12</span>
                                                            <CheckCircle2 size={16} color="#6B7280" />
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="hardware-stand"></div>
                        <div className="hardware-base"></div>

                        {/* Connection Animation / Data Flow */}
                        <AnimatePresence>
                            {step === 6 && (
                                <motion.div
                                    key="data-flow"
                                    className="data-flow-line"
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: "100%", opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 1 }}
                                >
                                    <div className="data-flow-particle" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ── MIDDLE: WAITER PHONE (20%) ── */}
                    <div className="kds-phone-wrapper">
                        <div className="kds-phone">
                            <div className="kds-phone-notch" />
                            <div className="kds-phone-screen">

                                {/* Phone Header */}
                                <div className="p-header">Masa 12</div>

                                {/* Phone Body - Split into Menu and Cart */}
                                <div className="p-body">
                                    <div className="p-menu">
                                        <div className="p-menu-item">
                                            <div className="p-m-info">
                                                <span>Classic Burger</span>
                                                <strong>₺290</strong>
                                            </div>
                                            <button className={`add-btn ${step === 1 ? "tapped" : ""}`}>+</button>
                                        </div>
                                        <div className="p-menu-item">
                                            <div className="p-m-info">
                                                <span>Kutu Kola</span>
                                                <strong>₺50</strong>
                                            </div>
                                            <button className={`add-btn ${step === 3 ? "tapped" : ""}`}>+</button>
                                        </div>
                                    </div>

                                    <div className="p-cart">
                                        <div className="p-cart-title">Sipariş Özeti</div>
                                        
                                        <AnimatePresence>
                                            {step >= 2 && (
                                                <motion.div key="cart-burger" className="p-item" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                                    <span>1x Burger</span>
                                                    <span>₺290</span>
                                                </motion.div>
                                            )}
                                            {step >= 4 && (
                                                <motion.div key="cart-kola" className="p-item" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                                    <span>1x Kola</span>
                                                    <span>₺50</span>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {step >= 4 && (
                                            <motion.div className="p-total" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                                <span>Toplam</span>
                                                <strong>₺340</strong>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>

                                {/* Phone Footer / Button */}
                                <div className="p-footer">
                                    <button className={`p-btn ${step === 5 || step === 6 ? "clicked" : ""}`}>
                                        Siparişi Onayla
                                    </button>
                                </div>

                                {/* Phone Notifications */}
                                <AnimatePresence>
                                    {step === 9 && (
                                        <motion.div
                                            className="p-notification" style={{ borderLeftColor: "#10B981" }}
                                            initial={{ y: -50, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: -20, opacity: 0 }}
                                        >
                                            <Check size={14} color="#10B981" />
                                            <span>Masa 12 Hazır!</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT: CONTENT & CTA (35%) ── */}
                    {!hideContent && (
                        <div className="kds-content-wrapper">
                            <div className="kds-badge">JetKDS</div>
                            <h2 className="kds-title">Siparişten Teslimata Kadar Tam Kontrol.</h2>
                            <p className="kds-desc">
                                JetKDS ile siparişler mutfağa anında ulaşır, hazırlık süreçleri takip edilir ve ekipler kusursuz senkronize çalışır.
                            </p>
                            <ul className="kds-features">
                                <li><CheckCircle2 size={18} color="#7886C7" /> <span>Garson Sipariş Girişi</span></li>
                                <li><CheckCircle2 size={18} color="#7886C7" /> <span>Anlık Sipariş Aktarımı</span></li>
                                <li><CheckCircle2 size={18} color="#7886C7" /> <span>Hazırlık Süresi Takibi</span></li>
                                <li><CheckCircle2 size={18} color="#7886C7" /> <span>Anlık Bildirimler</span></li>
                            </ul>
                            <Link href="/urunler/jetkds" className="kds-cta">
                                JetKDS'i Keşfet <ChevronRight size={18} />
                            </Link>
                        </div>
                    )}

                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .kds-layout {
                    display: grid;
                    grid-template-columns: 45% 20% 35%;
                    gap: 3%;
                    align-items: center;
                }
                .kds-layout.hide-content {
                    display: flex;
                    justify-content: center;
                    gap: 60px;
                }
                .kds-layout.hide-content .kds-monitor-wrapper {
                    flex: 0 0 600px;
                }
                .kds-layout.hide-content .data-flow-line {
                    width: 60px;
                    right: -30px;
                }

                /* MONITOR (LEFT) */
                .kds-monitor-wrapper { position: relative; width: 100%; padding-right: 20px; }
                .hardware-monitor { background: #111827; padding: 12px 12px 24px 12px; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.1); position: relative; z-index: 2; }
                .hardware-stand { width: 40px; height: 30px; background: linear-gradient(to right, #374151, #1F2937, #374151); margin: 0 auto; position: relative; z-index: 1; margin-top: -10px; }
                .hardware-base { width: 120px; height: 8px; background: #111827; border-radius: 6px 6px 0 0; margin: 0 auto; box-shadow: 0 10px 20px rgba(0,0,0,0.3); }
                .kds-monitor { width: 100%; height: 450px; display: flex; flex-direction: column; overflow: hidden; border-radius: 6px; background: #F8FAFC; }
                .kds-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; background: rgba(255,255,255,0.9); border-bottom: 1px solid rgba(120, 134, 199, 0.1); }
                .kds-logo { font-size: 1.1rem; }
                .kds-header-title { font-weight: 700; color: #4B5563; font-size: 0.9rem; }
                .kds-time { font-weight: 700; color: #111827; }
                
                .kds-columns { display: grid; grid-template-columns: repeat(4, 1fr); flex: 1; overflow: hidden; }
                .kds-col { border-right: 1px solid rgba(120, 134, 199, 0.1); display: flex; flex-direction: column; }
                .kds-col:last-child { border-right: none; }
                .kds-col-header { padding: 10px; text-align: center; font-size: 0.75rem; font-weight: 800; color: #4B5563; border-top: 3px solid transparent; background: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.05em; }
                .kds-col-body { padding: 12px 8px; flex: 1; display: flex; flex-direction: column; gap: 10px; }

                .kds-card { background: white; border-radius: 10px; padding: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); border: 1px solid rgba(120,134,199,0.1); will-change: transform; transform: translateZ(0); }
                .kds-card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
                .kds-table { font-weight: 800; font-size: 0.9rem; color: #111827; }
                .kds-status { font-size: 0.65rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
                .kds-items { list-style: none; margin: 0; padding: 0; font-size: 0.8rem; color: #4B5563; margin-bottom: 10px; display: flex; flex-direction: column; gap: 4px; }
                .kds-card-foot { display: flex; justify-content: flex-end; border-top: 1px dashed rgba(120,134,199,0.2); padding-top: 8px; }
                .kds-timer { font-weight: 800; font-size: 0.85rem; will-change: opacity; }

                /* DATA FLOW LINE */
                .data-flow-line { position: absolute; top: 50%; right: -25px; width: 60px; height: 3px; background: linear-gradient(90deg, transparent, #7886C7, transparent); z-index: 0; transform: translateY(-50%) translateZ(0); border-radius: 3px; will-change: opacity, width; }
                .data-flow-particle { position: absolute; width: 20px; height: 3px; background: white; box-shadow: 0 0 10px 4px rgba(120,134,199,0.6); animation: flowMove 1s linear infinite; border-radius: 3px; will-change: left, opacity; }

                @keyframes flowMove { 0% { left: 0%; opacity: 0; } 50% { opacity: 1; } 100% { left: 100%; opacity: 0; } }
                @keyframes pulseText { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

                /* PHONE (MIDDLE) */
                .kds-phone-wrapper { display: flex; justify-content: center; position: relative; z-index: 2; }
                .kds-phone { width: 200px; height: 450px; background: white; border-radius: 30px; border: 6px solid #111827; box-shadow: 0 20px 40px rgba(0,0,0,0.15); position: relative; overflow: hidden; display: flex; flex-direction: column; transform: translateY(0); transition: 0.3s; }
                .kds-phone:hover { transform: translateY(-5px); }
                .kds-phone-notch { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 80px; height: 18px; background: #111827; border-radius: 0 0 10px 10px; z-index: 10; }
                .kds-phone-screen { flex: 1; background: #F9FAFB; display: flex; flex-direction: column; position: relative; }
                
                .p-header { padding: 30px 16px 12px; background: white; font-weight: 800; text-align: center; border-bottom: 1px solid #E5E7EB; color: #111827; font-size: 0.9rem; }
                .p-body { flex: 1; display: flex; flex-direction: column; }
                
                /* Phone Menu */
                .p-menu { padding: 10px; display: flex; flex-direction: column; gap: 6px; background: #F3F4F6; }
                .p-menu-item { display: flex; justify-content: space-between; align-items: center; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
                .p-m-info { display: flex; flex-direction: column; gap: 2px; }
                .p-m-info span { font-size: 0.75rem; font-weight: 700; color: #111827; }
                .p-m-info strong { font-size: 0.7rem; color: #7886C7; }
                .add-btn { width: 24px; height: 24px; border-radius: 6px; background: #E5E7EB; color: #4B5563; border: none; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
                .add-btn.tapped { background: #7886C7; color: white; transform: scale(0.85); box-shadow: 0 0 10px rgba(120,134,199,0.5); }
                
                /* Phone Cart */
                .p-cart { flex: 1; padding: 12px; background: white; display: flex; flex-direction: column; gap: 8px; border-top: 1px solid #E5E7EB; }
                .p-cart-title { font-size: 0.7rem; font-weight: 800; color: #9CA3AF; text-transform: uppercase; margin-bottom: 2px; }
                .p-item { display: flex; justify-content: space-between; font-size: 0.8rem; color: #4B5563; font-weight: 600; overflow: hidden; }
                .p-total { display: flex; justify-content: space-between; font-size: 0.9rem; border-top: 1px dashed #D1D5DB; padding-top: 10px; margin-top: auto; }
                .p-total strong { color: #111827; font-weight: 800; }
                
                .p-footer { padding: 12px; background: white; border-top: 1px solid #E5E7EB; }
                .p-btn { width: 100%; background: #7886C7; color: white; padding: 10px; border-radius: 10px; font-weight: 700; font-size: 0.85rem; border: none; cursor: pointer; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); position: relative; overflow: hidden; will-change: transform; transform: translateZ(0); }
                .p-btn.clicked { transform: scale(0.95); background: #5A659F; box-shadow: 0 0 20px rgba(120,134,199,0.8); }
                .p-btn::after { content: ''; position: absolute; top: 50%; left: 50%; width: 150px; height: 150px; margin-top: -75px; margin-left: -75px; background: rgba(255,255,255,0.5); opacity: 0; border-radius: 50%; transform: scale(0); pointer-events: none; will-change: transform, opacity; }
                .p-btn.clicked::after { animation: ripple 0.6s ease-out; }

                @keyframes ripple { 0% { transform: scale(0); opacity: 0.5; } 100% { transform: scale(2); opacity: 0; } }

                .p-notification { position: absolute; top: 25px; left: 10px; right: 10px; background: white; padding: 10px 12px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 8px; z-index: 20; border-left: 4px solid #7886C7; will-change: transform, opacity; transform: translateZ(0); }
                .p-notification span { font-size: 0.75rem; font-weight: 700; color: #111827; }

                /* CONTENT & CTA (RIGHT) */
                .kds-content-wrapper { padding-left: 20px; }
                .kds-badge { display: inline-block; padding: 6px 12px; background: rgba(120,134,199,0.1); color: #7886C7; font-weight: 800; font-size: 0.85rem; border-radius: 99px; margin-bottom: 20px; }
                .kds-title { font-size: 2.2rem; font-weight: 800; color: #111827; line-height: 1.15; margin-bottom: 20px; letter-spacing: -0.03em; }
                .kds-desc { font-size: 1.1rem; color: #4B5563; line-height: 1.6; margin-bottom: 30px; }
                .kds-features { list-style: none; padding: 0; margin: 0 0 40px 0; display: flex; flex-direction: column; gap: 14px; }
                .kds-features li { display: flex; align-items: center; gap: 12px; }
                .kds-features li span { font-weight: 600; color: #111827; font-size: 1rem; }
                .kds-cta { display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #7886C7, #5A659F); color: white; padding: 14px 28px; border-radius: 12px; font-weight: 700; text-decoration: none; box-shadow: 0 10px 25px rgba(120,134,199,0.3); transition: 0.3s; }
                .kds-cta:hover { transform: translateY(-3px); box-shadow: 0 15px 30px rgba(120,134,199,0.4); }

                /* RESPONSIVE */
                @media (max-width: 1024px) {
                    .kds-layout { grid-template-columns: 1fr; gap: 40px; text-align: center; }
                    .kds-monitor-wrapper { padding-right: 0; order: 3; }
                    .kds-phone-wrapper { order: 2; }
                    .kds-content-wrapper { padding-left: 0; order: 1; display: flex; flex-direction: column; align-items: center; }
                    .kds-features li { justify-content: center; }
                    .data-flow-line { display: none; }
                }
                @media (max-width: 600px) {
                    .kds-columns { overflow-x: auto; scroll-snap-type: x mandatory; }
                    .kds-col { min-width: 200px; scroll-snap-align: start; }
                    .kds-title { font-size: 1.8rem; }
                }
            `}} />
        </section>
    );
}
