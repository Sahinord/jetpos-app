"use client";

import React, { useEffect, useRef, useState } from "react";
import { TrendingUp, Target, ShieldAlert } from "lucide-react";

// ─── Data Maps ───────────────────────────────────────────────────────────────

const ciroData = {
    "Bugün": {
        value: 12840,
        trend: "+8%",
        labels: ["9", "11", "13", "15", "17", "19", "21"],
        heights: [30, 60, 20, 75, 45, 110, 30],
        activeIndex: 5,
        linePath: "M 20 110 C 35 110, 45 80, 60 80 C 75 80, 85 120, 100 120 C 115 120, 125 65, 140 65 C 155 65, 165 95, 180 95 C 195 95, 205 30, 220 30 C 235 30, 245 110, 260 110"
    },
    "Hafta": {
        value: 84500,
        trend: "+14%",
        labels: ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"],
        heights: [50, 70, 60, 90, 80, 120, 100],
        activeIndex: 5,
        linePath: "M 20 90 C 35 90, 45 70, 60 70 C 75 70, 85 80, 100 80 C 115 80, 125 50, 140 50 C 155 50, 165 60, 180 60 C 195 60, 205 20, 220 20 C 235 20, 245 40, 260 40"
    },
    "Ay": {
        value: 342000,
        trend: "+22%",
        labels: ["1-5", "6-10", "11-15", "16-20", "21-25", "26-30", "31"],
        heights: [40, 50, 80, 70, 100, 110, 90],
        activeIndex: 5,
        linePath: "M 20 100 C 35 100, 45 90, 60 90 C 75 90, 85 60, 100 60 C 115 60, 125 70, 140 70 C 155 70, 165 40, 180 40 C 195 40, 205 30, 220 30 C 235 30, 245 50, 260 50"
    }
};

const targetData = {
    "Günlük": {
        value: 3200,
        totalTarget: 5000,
        percent: 64,
        label: "GÜNLÜK HEDEF"
    },
    "Haftalık": {
        value: 48000,
        totalTarget: 380000,
        percent: 84,
        label: "HAFTALIK HEDEF"
    },
    "Aylık": {
        value: 192000,
        totalTarget: 1500000,
        percent: 92,
        label: "AYLIK HEDEF"
    }
};

const categoryList = ["Kasap", "Market", "Manav", "Giyim"] as const;
type CategoryType = typeof categoryList[number];

const categoryData: Record<CategoryType, { share: number, trend: string }> = {
    "Kasap": { share: 45, trend: "+12%" },
    "Market": { share: 30, trend: "+8%" },
    "Manav": { share: 10, trend: "+5%" },
    "Giyim": { share: 15, trend: "+3%" }
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AnalyticsCenter() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    // Filter selections
    const [ciroPeriod, setCiroPeriod] = useState<"Bugün" | "Hafta" | "Ay">("Bugün");
    const [targetPeriod, setTargetPeriod] = useState<"Günlük" | "Haftalık" | "Aylık">("Haftalık");
    const [activeCategory, setActiveCategory] = useState<CategoryType>("Kasap");

    // Display values to animate
    const [ciro, setCiro] = useState(0);
    const [targetVal, setTargetVal] = useState(0);
    const [categoryShare, setCategoryShare] = useState(0);

    // Track visibility in viewport
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
            { threshold: 0.15 }
        );
        observer.observe(el);

        return () => observer.disconnect();
    }, []);

    // Auto-rotate stats every 2.5 seconds to make the dashboard feel alive
    useEffect(() => {
        if (!visible) return;

        const intervalId = setInterval(() => {
            setCiroPeriod(prev => {
                if (prev === "Bugün") return "Hafta";
                if (prev === "Hafta") return "Ay";
                return "Bugün";
            });

            setTargetPeriod(prev => {
                if (prev === "Günlük") return "Haftalık";
                if (prev === "Haftalık") return "Aylık";
                return "Günlük";
            });

            setActiveCategory(prev => {
                if (prev === "Kasap") return "Market";
                if (prev === "Market") return "Manav";
                if (prev === "Manav") return "Giyim";
                return "Kasap";
            });
        }, 2500);

        return () => clearInterval(intervalId);
    }, [visible]);

    // Card 1: Count-up / Transition logic on ciroPeriod change
    const prevCiro = useRef(0);
    useEffect(() => {
        if (!visible) return;
        const target = ciroData[ciroPeriod].value;
        const start = prevCiro.current;
        const duration = 800;
        const startTime = performance.now();

        const anim = (time: number) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
            const currentVal = Math.floor(start + ease * (target - start));
            setCiro(currentVal);

            if (progress < 1) {
                requestAnimationFrame(anim);
            } else {
                prevCiro.current = target;
            }
        };
        requestAnimationFrame(anim);
    }, [ciroPeriod, visible]);

    // Card 2: Count-up / Transition logic on targetPeriod change
    const prevTargetVal = useRef(0);
    useEffect(() => {
        if (!visible) return;
        const target = targetData[targetPeriod].value;
        const start = prevTargetVal.current;
        const duration = 800;
        const startTime = performance.now();

        const anim = (time: number) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            const currentVal = Math.floor(start + ease * (target - start));
            setTargetVal(currentVal);

            if (progress < 1) {
                requestAnimationFrame(anim);
            } else {
                prevTargetVal.current = target;
            }
        };
        requestAnimationFrame(anim);
    }, [targetPeriod, visible]);

    // Card 3: Count-up / Transition logic on activeCategory change
    const prevShare = useRef(0);
    useEffect(() => {
        if (!visible) return;
        const target = categoryData[activeCategory].share;
        const start = prevShare.current;
        const duration = 800;
        const startTime = performance.now();

        const anim = (time: number) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            const currentVal = Math.floor(start + ease * (target - start));
            setCategoryShare(currentVal);

            if (progress < 1) {
                requestAnimationFrame(anim);
            } else {
                prevShare.current = target;
            }
        };
        requestAnimationFrame(anim);
    }, [activeCategory, visible]);

    // Rings/Gauges calculation
    const activeCiroSet = ciroData[ciroPeriod];
    const activeTargetSet = targetData[targetPeriod];

    // SVG arc details: Length = Math.PI * 80 * (240/360) * 2 = 335.1
    const arcDashoffset = 335.1 * (1 - activeTargetSet.percent / 100);

    return (
        <section ref={sectionRef} className="analytics-section">
            {/* Ambient Background Glow Spot */}
            <div className="analytics-bg-glow" />

            <div className="analytics-container">
                
                {/* ── Header ──────────────────────────────────────────── */}
                <div className={`analytics-header ${visible ? "fade-in-up" : ""}`}>
                    <h2 className="analytics-title">
                        İşletmenizde Tek Bir Ürün Bile Gözden Kaçmasın.
                    </h2>
                    <p className="analytics-subtitle">
                        JetPOS; stok, satış ve kârlılık verilerinizi analiz ederek daha kontrollü ve daha kazançlı bir işletme yönetmenizi sağlar.
                    </p>
                </div>

                {/* ── Cards Grid ──────────────────────────────────────── */}
                <div className="analytics-grid">
                    
                    {/* Card 1: Otomatik Ciro Takibi */}
                    <div className={`analytics-card ${visible ? "fade-in-up delay-1" : ""}`}>
                        <div className="card-top-text-only">
                            <h3 className="card-main-title">Gelir Akışınızı İzleyin</h3>
                            <p className="card-main-subtitle">Anlık satış verileriyle işletmenizin nabzını tutun.</p>
                        </div>

                        <div className="card-value-display-ciro">
                            <div className="ciro-label">{ciroPeriod === "Bugün" ? "Bugün" : ciroPeriod === "Hafta" ? "Bu Hafta" : "Bu Ay"} Ciro</div>
                            <div className="ciro-val-row">
                                <span className="card-number">₺{ciro.toLocaleString("tr-TR")}</span>
                                <span className="card-badge-trend-blue">{activeCiroSet.trend}</span>
                            </div>
                        </div>

                        {/* Combined Bar + Line Chart */}
                        <div className="combined-chart-wrapper">
                            <svg viewBox="0 0 280 160" className="combined-chart-svg">
                                {/* Background Bars */}
                                {activeCiroSet.heights.map((h, i) => {
                                    const cx = 20 + i * 40;
                                    const isTarget = i === activeCiroSet.activeIndex;
                                    const barPath = h < 4 
                                        ? `M ${cx - 12} 140 L ${cx - 12} ${140 - h} L ${cx + 12} ${140 - h} L ${cx + 12} 140 Z`
                                        : `M ${cx - 12} 140 L ${cx - 12} ${140 - h + 4} Q ${cx - 12} ${140 - h} ${cx - 8} ${140 - h} L ${cx + 8} ${140 - h} Q ${cx + 12} ${140 - h} ${cx + 12} ${140 - h + 4} L ${cx + 12} 140 Z`;
                                    
                                    return (
                                        <path
                                            key={`bar-${i}`}
                                            d={barPath}
                                            fill={isTarget ? "#7886C7" : "#F3F4F6"}
                                            className="chart-bar-path"
                                            style={{ transition: "d 0.8s cubic-bezier(0.22, 1, 0.36, 1), fill 0.3s" }}
                                        />
                                    );
                                })}

                                {/* Line Path */}
                                <path
                                    d={activeCiroSet.linePath}
                                    fill="none"
                                    stroke="#7886C7"
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    className="chart-line-path"
                                    style={{ transition: "d 0.8s cubic-bezier(0.22, 1, 0.36, 1)" }}
                                />

                                {/* Dots */}
                                {activeCiroSet.heights.map((h, i) => {
                                    const cx = 20 + i * 40;
                                    const cy = 140 - h;
                                    return (
                                        <circle
                                            key={`dot-${i}`}
                                            cx={cx}
                                            cy={cy}
                                            r="4.5"
                                            fill="#FFFFFF"
                                            stroke="#7886C7"
                                            strokeWidth="2.5"
                                            className="chart-dot-blue"
                                            style={{ transition: "cx 0.8s cubic-bezier(0.22, 1, 0.36, 1), cy 0.8s cubic-bezier(0.22, 1, 0.36, 1)" }}
                                        />
                                    );
                                })}
                            </svg>
                            
                            {/* X Axis Labels */}
                            <div className="chart-x-axis">
                                {activeCiroSet.labels.map((lbl, i) => (
                                    <span key={i} className="chart-x-label">{lbl}</span>
                                ))}
                            </div>
                        </div>

                        {/* Timeframe selector pills at the bottom */}
                        <div className="card-selector-wrapper" style={{ maxWidth: "100%" }}>
                            {(["Bugün", "Hafta", "Ay"] as const).map((period) => (
                                <button
                                    key={period}
                                    className={`selector-pill ${ciroPeriod === period ? "active" : ""}`}
                                    onClick={() => setCiroPeriod(period)}
                                >
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Card 2: Dönemsel Satış Hedefleri (Visual Arc Gauge) */}
                    <div className={`analytics-card ${visible ? "fade-in-up delay-2" : ""}`}>
                        <div className="card-top-text-only">
                            <h3 className="card-main-title">Stok Kaybını Önleyin</h3>
                            <p className="card-main-subtitle">Kritik seviyeleri görün, raflarınız hiçbir zaman boş kalmasın.</p>
                        </div>

                        {/* Custom SVG 240-Degree Arc Gauge */}
                        <div className="gauge-chart-container">
                            <svg viewBox="0 0 220 160" className="gauge-svg">
                                <defs>
                                    <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#7886C7" />
                                        <stop offset="100%" stopColor="#9AA7DF" />
                                    </linearGradient>
                                </defs>

                                {/* Base Track Arc (240 deg) */}
                                <path
                                    d="M 40.7 140 A 80 80 0 1 1 179.3 140"
                                    fill="none"
                                    stroke="#F3F4F6"
                                    strokeWidth="14"
                                    strokeLinecap="round"
                                />

                                {/* Active Progress Arc */}
                                <path
                                    d="M 40.7 140 A 80 80 0 1 1 179.3 140"
                                    fill="none"
                                    stroke="url(#gaugeGrad)"
                                    strokeWidth="14"
                                    strokeLinecap="round"
                                    strokeDasharray="335.1"
                                    strokeDashoffset={visible ? arcDashoffset : 335.1}
                                    className="gauge-progress-circle"
                                />
                            </svg>
                            
                            {/* Inner Gauge Labels */}
                            <div className="gauge-inner-label">
                                <span className="gauge-percent">%{activeTargetSet.percent}</span>
                                <span className="gauge-sub-label">{activeTargetSet.label}</span>
                            </div>
                        </div>

                        {/* Value display underneath the gauge */}
                        <div className="card-value-display-gauge">
                            <span className="gauge-number">₺{targetVal.toLocaleString("tr-TR")}</span>
                            <span className="gauge-target-text">Toplam hedef: ₺{activeTargetSet.totalTarget.toLocaleString("tr-TR")}</span>
                        </div>

                        {/* Timeframe selector pills at the bottom */}
                        <div className="card-selector-wrapper">
                            {(["Günlük", "Haftalık", "Aylık"] as const).map((period) => (
                                <button
                                    key={period}
                                    className={`selector-pill ${targetPeriod === period ? "active" : ""}`}
                                    onClick={() => setTargetPeriod(period)}
                                >
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Card 3: Karşılaştırmalı Analiz */}
                    <div className={`analytics-card ${visible ? "fade-in-up delay-3" : ""}`}>
                        <div className="card-top-text-only">
                            <h3 className="card-main-title">Daha Karlı Kararlar Alın</h3>
                            <p className="card-main-subtitle">Kategori ve ürün bazlı analizlerle işletmenizi büyütün.</p>
                        </div>

                        <div className="comparison-content">
                            {/* Left: Circular Ring Gauge */}
                            <div className="comp-ring-container">
                                <svg viewBox="0 0 100 100" className="comp-ring-svg">
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="#F3F4F6" strokeWidth="10" />
                                    <circle
                                        cx="50" cy="50" r="40"
                                        fill="none" stroke="url(#gaugeGrad)" strokeWidth="10"
                                        strokeLinecap="round"
                                        strokeDasharray="251.2"
                                        strokeDashoffset={visible ? 251.2 * (1 - categoryData[activeCategory].share / 100) : 251.2}
                                        className="comp-progress-circle"
                                        transform="rotate(-90 50 50)"
                                    />
                                </svg>
                                <div className="comp-ring-label">
                                    <span className="comp-ring-percent">{categoryShare}%</span>
                                    <span className="comp-ring-sub">{activeCategory.toUpperCase()}</span>
                                </div>
                            </div>

                            {/* Right: Horizontal Bars */}
                            <div className="comp-bars-container">
                                {categoryList.map((cat, idx) => {
                                    const isSelected = activeCategory === cat;
                                    const catData = categoryData[cat];
                                    return (
                                        <div key={cat} className="comp-bar-item">
                                            <div className="comp-bar-header">
                                                <span className={`comp-bar-name ${isSelected ? "active" : ""}`}>{cat}</span>
                                                <span className={`comp-bar-trend ${isSelected ? "active" : ""}`}>{catData.trend}</span>
                                            </div>
                                            <div className="comp-bar-track">
                                                <div 
                                                    className={`comp-bar-fill ${isSelected ? "active" : ""}`}
                                                    style={{ 
                                                        width: visible ? `${catData.share}%` : "0%",
                                                        transitionDelay: `${idx * 50}ms`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Category selector pills at the bottom */}
                        <div className="card-selector-wrapper" style={{ maxWidth: "100%" }}>
                            {categoryList.map((cat) => (
                                <button
                                    key={cat}
                                    className={`selector-pill ${activeCategory === cat ? "active" : ""}`}
                                    onClick={() => setActiveCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>

            </div>

            {/* ── Styling ─────────────────────────────────────────── */}
            <style>{`
                /* Section Base Styles */
                .analytics-section {
                    background-color: #F8FAFC;
                    padding: 120px 24px;
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    position: relative;
                    overflow: hidden;
                }

                .analytics-bg-glow {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 900px;
                    height: 500px;
                    background: radial-gradient(circle, rgba(120, 134, 199, 0.04) 0%, transparent 70%);
                    pointer-events: none;
                    z-index: 1;
                }

                .analytics-container {
                    width: 100%;
                    max-width: 1400px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    position: relative;
                    z-index: 2;
                }

                /* Header Styling */
                .analytics-header {
                    text-align: center;
                    margin-bottom: 56px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    opacity: 0;
                    transform: translateY(20px);
                }

                .analytics-title {
                    font-size: clamp(2rem, 3.5vw, 2.75rem);
                    font-weight: 850;
                    color: #111827;
                    margin: 0;
                    line-height: 1.2;
                    letter-spacing: -0.02em;
                }

                .analytics-subtitle {
                    font-size: clamp(1rem, 1.5vw, 1.125rem);
                    color: #4B5563;
                    margin: 0;
                    line-height: 1.6;
                    font-weight: 500;
                    max-width: 720px;
                }

                /* Cards Grid (3 columns on desktop) */
                .analytics-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 24px;
                    width: 100%;
                }

                /* Glassmorphic Analytics Card */
                .analytics-card {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(20px) saturate(180%);
                    -webkit-backdrop-filter: blur(20px) saturate(180%);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    border-radius: 24px;
                    padding: 28px;
                    min-height: 440px; /* Spaced perfectly to host bottom controls */
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02),
                                inset 0 1px 0 rgba(255, 255, 255, 0.8);
                    cursor: pointer;
                    opacity: 0;
                    transform: translateY(28px);
                    transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
                                box-shadow 0.45s cubic-bezier(0.22, 1, 0.36, 1),
                                border-color 0.45s ease;
                }

                .analytics-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 24px 64px rgba(120, 134, 199, 0.16),
                                0 0 0 1px rgba(120, 134, 199, 0.12);
                    border-color: rgba(120, 134, 199, 0.3);
                }

                /* Card Header Info */
                .card-top-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    width: 100%;
                }

                .card-icon-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .card-icon-box {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .card-label {
                    font-size: 0.875rem;
                    font-weight: 700;
                    color: #4B5563;
                }

                .card-badge-trend {
                    font-size: 0.72rem;
                    font-weight: 750;
                    color: #10B981;
                    background: rgba(16, 185, 129, 0.08);
                    padding: 4px 10px;
                    border-radius: 9999px;
                    border: 1px solid rgba(16, 185, 129, 0.15);
                }

                /* Number display styling */
                .card-value-display {
                    margin-top: 14px;
                    display: flex;
                    align-items: baseline;
                    gap: 4px;
                    color: #111827;
                    text-align: left;
                }

                .card-currency {
                    font-size: 1.5rem;
                    font-weight: 850;
                    color: #111827;
                    align-self: flex-start;
                    line-height: 1;
                }

                .card-number {
                    font-size: 2.25rem;
                    font-weight: 900;
                    letter-spacing: -0.03em;
                    line-height: 1;
                }

                .card-unit-label {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #4B5563;
                    margin-left: 6px;
                }

                /* Card 2 Specific Text Styling */
                .card-top-text-only {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-bottom: 4px;
                }

                .card-main-title {
                    font-size: 1.35rem;
                    font-weight: 850;
                    color: #111827;
                    margin: 0;
                    line-height: 1.2;
                    letter-spacing: -0.01em;
                }

                .card-main-subtitle {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #6B7280;
                    margin: 0;
                    line-height: 1.5;
                }

                /* Gauge value underneath text */
                .card-value-display-gauge {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    margin-top: 14px;
                }

                .gauge-number {
                    font-size: 1.85rem;
                    font-weight: 900;
                    color: #111827;
                    line-height: 1.2;
                    letter-spacing: -0.02em;
                }

                .gauge-target-text {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #6B7280;
                }

                /* Custom Selector Pill styles */
                .card-selector-wrapper {
                    display: flex;
                    background: rgba(120, 134, 199, 0.05);
                    border: 1px solid rgba(120, 134, 199, 0.08);
                    border-radius: 999px;
                    padding: 4px;
                    gap: 2px;
                    align-self: center;
                    margin-top: 24px;
                    width: 100%;
                    max-width: 280px;
                    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.02);
                }

                .selector-pill {
                    border: none;
                    background: transparent;
                    border-radius: 999px;
                    padding: 6px 12px;
                    font-size: 0.75rem;
                    font-weight: 750;
                    color: #4B5563;
                    cursor: pointer;
                    flex: 1;
                    text-align: center;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .selector-pill:hover {
                    color: #111827;
                }

                .selector-pill.active {
                    background-color: #FFFFFF;
                    color: #7886C7;
                    box-shadow: 0 2px 8px rgba(120, 134, 199, 0.12), 0 1px 3px rgba(0, 0, 0, 0.04);
                }

                /* Custom Chart Components */

                /* 1) Combined Bar/Line Chart styling */
                .card-value-display-ciro {
                    margin-top: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .ciro-label {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #9CA3AF;
                }

                .ciro-val-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .card-badge-trend-blue {
                    font-size: 0.75rem;
                    font-weight: 800;
                    color: #7886C7;
                    background: rgba(120, 134, 199, 0.08);
                    padding: 4px 10px;
                    border-radius: 9999px;
                }

                .combined-chart-wrapper {
                    width: 100%;
                    margin-top: 24px;
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                }

                .combined-chart-svg {
                    width: 100%;
                    height: 140px;
                    overflow: visible;
                }

                .chart-x-axis {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 12px;
                    padding: 0 8px;
                }

                .chart-x-label {
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #9CA3AF;
                    width: 32px;
                    text-align: center;
                    white-space: nowrap;
                }

                .chart-dot-blue {
                    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    transform-box: fill-box;
                    transform-origin: center;
                }
                .analytics-card:hover .chart-dot-blue {
                    transform: scale(1.3);
                    filter: drop-shadow(0 2px 4px rgba(120, 134, 199, 0.4));
                }

                /* 2) Gauge Arc Chart styling */
                .gauge-chart-container {
                    width: 220px;
                    height: 160px;
                    margin: 10px auto 0;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .gauge-svg {
                    width: 100%;
                    height: 100%;
                    overflow: visible;
                }

                .gauge-progress-circle {
                    transition: stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1),
                                stroke-width 0.3s ease,
                                filter 0.3s ease;
                }

                .analytics-card:hover .gauge-progress-circle {
                    stroke-width: 15.5;
                    filter: drop-shadow(0 4px 10px rgba(120, 134, 199, 0.3));
                }

                .gauge-inner-label {
                    position: absolute;
                    bottom: 30px;
                    left: 0;
                    right: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }

                .gauge-percent {
                    font-size: 2.25rem;
                    font-weight: 950;
                    color: #111827;
                    line-height: 1;
                    letter-spacing: -0.02em;
                }

                .gauge-sub-label {
                    font-size: 0.72rem;
                    font-weight: 850;
                    color: #6B7280;
                    margin-top: 6px;
                    letter-spacing: 0.06em;
                }

                /* 3) Comparison Chart styling */
                .comparison-content {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 16px;
                    margin-top: 20px;
                    flex: 1;
                }

                .comp-ring-container {
                    position: relative;
                    width: 120px;
                    height: 120px;
                    flex-shrink: 0;
                }

                .comp-ring-svg {
                    width: 100%;
                    height: 100%;
                    overflow: visible;
                }

                .comp-progress-circle {
                    transition: stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1), stroke 0.3s ease;
                }

                .comp-ring-label {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }

                .comp-ring-percent {
                    font-size: 1.5rem;
                    font-weight: 850;
                    color: #111827;
                    line-height: 1;
                }

                .comp-ring-sub {
                    font-size: 0.55rem;
                    font-weight: 800;
                    color: #9CA3AF;
                    margin-top: 4px;
                    letter-spacing: 0.05em;
                }

                .comp-bars-container {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    flex: 1;
                }

                .comp-bar-item {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .comp-bar-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .comp-bar-name {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #9CA3AF;
                    transition: color 0.3s ease;
                }

                .comp-bar-name.active {
                    color: #111827;
                    font-weight: 700;
                }

                .comp-bar-trend {
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #D1D5DB;
                    transition: color 0.3s ease;
                }

                .comp-bar-trend.active {
                    color: #7886C7;
                }

                .comp-bar-track {
                    width: 100%;
                    height: 6px;
                    background-color: #F3F4F6;
                    border-radius: 999px;
                    overflow: hidden;
                }

                .comp-bar-fill {
                    height: 100%;
                    background-color: #E5E7EB;
                    border-radius: 999px;
                    transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.3s ease;
                }

                .comp-bar-fill.active {
                    background-color: #7886C7;
                }

                /* Entrance Animations */
                .fade-in-up {
                    animation: sectionFadeInUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
                }

                .delay-1 { animation-delay: 0.15s; }
                .delay-2 { animation-delay: 0.3s; }
                .delay-3 { animation-delay: 0.45s; }

                @keyframes sectionFadeInUp {
                    from { opacity: 0; transform: translateY(28px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                /* Responsive design */
                @media (max-width: 1024px) {
                    .analytics-grid {
                        grid-template-columns: repeat(2, 1fr); /* 2x2 on tablets */
                    }
                    .analytics-grid > div:nth-child(2) {
                        /* Force gauge card to adjust centered on tablet */
                    }
                    .analytics-grid > div:nth-child(3) {
                        grid-column: span 2;
                        min-height: auto;
                    }
                    .bar-chart-container {
                        max-width: 60%;
                        margin-left: auto;
                        margin-right: auto;
                    }
                }

                @media (max-width: 768px) {
                    .analytics-section {
                        padding: 80px 16px;
                    }
                    .analytics-grid {
                        grid-template-columns: 1fr; /* Single column on mobile */
                    }
                    .analytics-grid > div:nth-child(3) {
                        grid-column: span 1;
                    }
                    .bar-chart-container {
                        max-width: 100%;
                    }
                }
            `}</style>
        </section>
    );
}
