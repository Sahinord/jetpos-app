"use client";

import React from "react";
import { FileText, ShoppingCart, Package, CreditCard, BarChart3, User, Wallet, ShoppingBag, Bike, UtensilsCrossed } from "lucide-react";

// Sol: bizim JetPOS modüllerimiz → logoya soldan akar
const leftItems = [
    { label: "JetMuhasebe", icon: FileText },
    { label: "JetKasa", icon: ShoppingCart },
    { label: "JetStok", icon: Package },
    { label: "JetAsistan", icon: CreditCard },
    { label: "JetRapor", icon: BarChart3 },
];

// Alt: dış entegrasyonlar → logoya ALTTAN akar
const bottomItems = [
    { label: "Ödeal", icon: Wallet },
    { label: "Trendyol GO", icon: ShoppingBag },
    { label: "Getir", icon: Bike },
    { label: "Yemeksepeti", icon: UtensilsCrossed },
];

const W = 860;
const H = 440;
const CX = W / 2;
const CY = 150;                 // logo + sol sütun + sağ kullanıcı dikey merkezi
const LEFT_X = 148;
const RIGHT_X = W - 60;
const BOX_W = 136;
const BOX_H = 32;
const SPACING = 52;
const TOTAL_H = (leftItems.length - 1) * SPACING;
const TOP_Y = CY - TOTAL_H / 2;
const LOGO_R = 36;
const USER_R = 26;

// Alt sıra geometrisi
const B_BOX_W = 128;
const B_BOX_H = 32;
const B_GAP = 20;
const B_TOTAL_W = bottomItems.length * B_BOX_W + (bottomItems.length - 1) * B_GAP;
const B_START_X = CX - B_TOTAL_W / 2;
const B_ROW_Y = 388;            // alt kutuların dikey merkezi

export default function ConnectionAnimation() {
    return (
        <section 
            style={{
                padding: "6.5rem 2rem",
                position: "relative",
                overflow: "hidden",
                backgroundColor: "#FFFFFF",
            }}
        >
            {/* Subtle Radial Glow Spot at the top */}
            <div style={{
                position: "absolute",
                top: "-150px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "800px",
                height: "300px",
                background: "radial-gradient(circle at center, rgba(120, 134, 199, 0.04) 0%, transparent 70%)",
                pointerEvents: "none",
                zIndex: 1,
            }} />

            <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 2 }}>
                <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: "0.5rem",
                        background: "rgba(120, 134, 199, 0.08)",
                        border: "1px solid rgba(120, 134, 199, 0.18)",
                        borderRadius: "9999px",
                        padding: "0.35rem 1rem",
                        marginBottom: "1.25rem",
                    }}>
                        <div style={{
                            width: "0.4rem", height: "0.4rem", borderRadius: "50%",
                            background: "#7886C7", boxShadow: "0 0 6px #7886C7",
                        }} />
                        <span style={{ fontSize: "0.78rem", color: "#7886C7", fontWeight: 600, letterSpacing: "0.04em" }}>
                            Özellikler
                        </span>
                    </div>
                    <h2 style={{
                        fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
                        fontWeight: 900, color: "#111827", margin: "0 0 0.75rem", lineHeight: 1.15,
                    }}>
                        Her şey Jetpos&apos;da
                    </h2>
                    <p style={{ fontSize: "0.95rem", color: "#4B5563", margin: 0 }}>
                        Siz sadece işinize odaklanın, tüm süreçlerinizi Jetpos otomatik yönetsin.
                    </p>
                </div>

                <div style={{ width: "100%" }}>
                    <svg
                        viewBox={`0 0 ${W} ${H}`}
                        style={{ width: "100%", display: "block", margin: "0 auto", overflow: "visible" }}
                    >
                        <defs>
                            <filter id="ca-glow-v2" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="2" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>

                            <radialGradient id="ca-logo-glow" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#7886C7" stopOpacity="0.25" />
                                <stop offset="70%" stopColor="#7886C7" stopOpacity="0.08" />
                                <stop offset="100%" stopColor="#7886C7" stopOpacity="0" />
                            </radialGradient>

                            <clipPath id="logo-circle-clip">
                                <circle cx={CX} cy={CY} r={LOGO_R - 1.5} />
                            </clipPath>

                            <style>{`
                                /* Total Cycle: 2.8s */

                                /* pathLength="1" normalize eder → tüm çizgilerde akış AYNI
                                   normalize hızda gider (uzunluk fark etmez). linear = sabit hız,
                                   ivmesiz → eşit ve senkron görünür. dasharray 0.22/0.78 = akan paket. */

                                /* GİRİŞ akışı: düğüm → logo (0%–45%), hepsi aynı anda */
                                @keyframes ca-flow-in {
                                    0%        { stroke-dashoffset: 1.22; opacity: 0; }
                                    6%        { opacity: 1; }
                                    45%       { stroke-dashoffset: 0.22; opacity: 1; }
                                    52%, 100% { stroke-dashoffset: 0.22; opacity: 0; }
                                }
                                .ca-flow-in {
                                    stroke-dasharray: 0.22 0.78;
                                    stroke-dashoffset: 1.22;
                                    animation: ca-flow-in 2.8s linear infinite;
                                }

                                /* ÇIKIŞ akışı: logo → müşteri (50%–92%) */
                                @keyframes ca-flow-out {
                                    0%, 48%   { stroke-dashoffset: 1.22; opacity: 0; }
                                    54%       { opacity: 1; }
                                    92%       { stroke-dashoffset: 0.22; opacity: 1; }
                                    98%, 100% { stroke-dashoffset: 0.22; opacity: 0; }
                                }
                                .ca-flow-out {
                                    stroke-dasharray: 0.22 0.78;
                                    stroke-dashoffset: 1.22;
                                    animation: ca-flow-out 2.8s linear infinite;
                                }

                                @keyframes ca-logo-pulse-v2 {
                                    0%, 42%   { transform: scale(1); filter: brightness(1) drop-shadow(0 0 0px #7886C7); }
                                    46%       { transform: scale(1.1); filter: brightness(1.1) drop-shadow(0 0 15px #7886C7); }
                                    54%       { transform: scale(1); filter: brightness(1); }
                                    100%      { transform: scale(1); filter: brightness(1); }
                                }
                                .ca-logo-group {
                                    transform-origin: center;
                                    animation: ca-logo-pulse-v2 2.8s ease-in-out infinite;
                                }

                                @keyframes ca-user-pulse-v2 {
                                    0%, 82%   { filter: brightness(1); transform: scale(1); }
                                    88%       { filter: brightness(1.1) drop-shadow(0 0 10px #7886C7); transform: scale(1.08); }
                                    95%, 100% { filter: brightness(1); transform: scale(1); }
                                }
                                .ca-user-group {
                                    transform-origin: ${RIGHT_X}px ${CY}px;
                                    animation: ca-user-pulse-v2 2.8s ease-in-out infinite;
                                }

                                @keyframes spin {
                                    from { transform: rotate(0deg); }
                                    to { transform: rotate(360deg); }
                                }
                            `}</style>
                        </defs>

                        {/* ── Left lines ── */}
                        {leftItems.map((_, i) => {
                            const y = TOP_Y + i * SPACING;
                            const targetY = i === 2 ? CY + 0.5 : CY;
                            const pathData = `M ${LEFT_X} ${y} L ${CX - LOGO_R} ${targetY}`;
                            return (
                                <g key={i}>
                                    <path d={pathData} stroke="rgba(120, 134, 199, 0.15)" strokeWidth="1.2" fill="none" />
                                    <path
                                        d={pathData}
                                        pathLength="1"
                                        stroke="#7886C7"
                                        strokeWidth="2.4"
                                        strokeLinecap="round"
                                        fill="none"
                                       
                                        className="ca-flow-in"
                                    />
                                </g>
                            );
                        })}

                        {/* ── Right line ── */}
                        {(() => {
                            const pathData = `M ${CX + LOGO_R} ${CY} L ${RIGHT_X - USER_R - 4} ${CY}`;
                            return (
                                <g>
                                    <path d={pathData} stroke="rgba(120, 134, 199, 0.15)" strokeWidth="1" fill="none" />
                                    <path
                                        d={pathData}
                                        pathLength="1"
                                        stroke="#7886C7"
                                        strokeWidth="2.8"
                                        strokeLinecap="round"
                                        fill="none"
                                       
                                        className="ca-flow-out"
                                    />
                                </g>
                            );
                        })()}

                        {/* ── Bottom lines (entegrasyonlar → logonun ALTI) ── */}
                        {bottomItems.map((_, i) => {
                            const bcx = B_START_X + i * (B_BOX_W + B_GAP) + B_BOX_W / 2;
                            const startY = B_ROW_Y - B_BOX_H / 2;
                            const pathData = `M ${bcx} ${startY} L ${CX} ${CY + LOGO_R}`;
                            return (
                                <g key={`bl-${i}`}>
                                    <path d={pathData} stroke="rgba(120, 134, 199, 0.15)" strokeWidth="1.2" fill="none" />
                                    <path
                                        d={pathData}
                                        pathLength="1"
                                        stroke="#7886C7"
                                        strokeWidth="2.4"
                                        strokeLinecap="round"
                                        fill="none"
                                       
                                        className="ca-flow-in"
                                    />
                                </g>
                            );
                        })}

                        {/* ── Left item boxes ── */}
                        {leftItems.map((item, i) => {
                            const y = TOP_Y + i * SPACING;
                            const bx = LEFT_X - BOX_W;
                            const by = y - BOX_H / 2;
                            const LucideIcon = item.icon;
                            return (
                                <g key={i}>
                                    <rect x={bx} y={by} width={BOX_W} height={BOX_H} rx={10}
                                        fill="#ffffff" stroke="#E5E7EB" strokeWidth="1.2" style={{ filter: "drop-shadow(0 2px 4px rgba(120,134,199,0.02))" }} />
                                    <rect x={bx + 6} y={by + 5} width={24} height={24} rx={7} fill="rgba(120, 134, 199, 0.08)" />
                                    <foreignObject x={bx + 10} y={by + 9} width="16" height="16">
                                        <div style={{ color: "#7886C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <LucideIcon size={14} strokeWidth={2.5} />
                                        </div>
                                    </foreignObject>
                                    <text x={bx + 38} y={by + 21} fill="#111827" fontSize="11.5" fontWeight="600" fontFamily="Inter, system-ui, sans-serif">
                                        {item.label}
                                    </text>
                                    <circle cx={LEFT_X} cy={y} r="3.5" fill="#7886C7" />
                                </g>
                            );
                        })}

                        {/* ── Bottom item boxes (entegrasyonlar, yatay sıra) ── */}
                        {bottomItems.map((item, i) => {
                            const bx = B_START_X + i * (B_BOX_W + B_GAP);
                            const by = B_ROW_Y - B_BOX_H / 2;
                            const bcx = bx + B_BOX_W / 2;
                            const LucideIcon = item.icon;
                            return (
                                <g key={`bb-${i}`}>
                                    <circle cx={bcx} cy={B_ROW_Y - B_BOX_H / 2} r="3.5" fill="#7886C7" />
                                    <rect x={bx} y={by} width={B_BOX_W} height={B_BOX_H} rx={10}
                                        fill="#ffffff" stroke="#E5E7EB" strokeWidth="1.2" style={{ filter: "drop-shadow(0 2px 4px rgba(120,134,199,0.02))" }} />
                                    <rect x={bx + 6} y={by + 4} width={24} height={24} rx={7} fill="rgba(120, 134, 199, 0.08)" />
                                    <foreignObject x={bx + 10} y={by + 8} width="16" height="16">
                                        <div style={{ color: "#7886C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <LucideIcon size={14} strokeWidth={2.5} />
                                        </div>
                                    </foreignObject>
                                    <text x={bx + 36} y={by + 20} fill="#111827" fontSize="11" fontWeight="600" fontFamily="Inter, system-ui, sans-serif">
                                        {item.label}
                                    </text>
                                </g>
                            );
                        })}

                        {/* ── Center logo (sade — daire/halka/glow kaldırıldı) ── */}
                        <g className="ca-logo-group">
                            {/* Logo — tam görünsün diye kırpma yok, orantılı (meet) */}
                            <image
                                href="/logo-v2.png"
                                x={CX - LOGO_R * 0.8}
                                y={CY - LOGO_R * 0.8}
                                width={LOGO_R * 1.6}
                                height={LOGO_R * 1.6}
                                preserveAspectRatio="xMidYMid meet"
                            />
                        </g>

                        {/* ── Right user circle ── */}
                        <g className="ca-user-group">
                            <circle cx={RIGHT_X} cy={CY} r={USER_R} fill="#ffffff" stroke="#E5E7EB" strokeWidth="2" style={{ filter: "drop-shadow(0 4px 12px rgba(120,134,199,0.06))" }} />
                            <foreignObject x={RIGHT_X - 12} y={CY - 12} width="24" height="24">
                                <div style={{ color: "#7886C7", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
                                    <User size={20} strokeWidth={2.5} />
                                </div>
                            </foreignObject>
                            <circle cx={RIGHT_X - USER_R - 4} cy={CY} r="3.5" fill="#7886C7" />
                        </g>
                    </svg>
                </div>

                <p style={{ textAlign: "center", color: "#111827", fontSize: "1.05rem", fontWeight: 700, marginTop: "1.5rem" }}>
                    Kısacası, işletmenizin kalbi JetPOS&apos;ta atıyor.
                </p>

                <p style={{ textAlign: "center", color: "#9CA3AF", fontSize: "0.82rem", marginTop: "0.6rem" }}>
                    Modülleriniz ve Ödeal, Trendyol GO, Getir, Yemeksepeti entegrasyonları tek çatı altında; senkronize ve güvenli.
                </p>
            </div>

            {/* Gradient transition to Integrations section (#FAFBFC) */}
            <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "180px",
                background: "linear-gradient(to bottom, rgba(248,249,252,0) 0%, rgba(248,249,252,0.6) 50%, rgba(248,249,252,1) 100%)",
                pointerEvents: "none",
                zIndex: 10,
            }} />
        </section>
    );
}
