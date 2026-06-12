"use client";

import React from "react";
import { FileText, ShoppingCart, Package, CreditCard, BarChart3, User } from "lucide-react";

const leftItems = [
    { label: "JetMuhasebe", icon: FileText },
    { label: "JetKasa", icon: ShoppingCart },
    { label: "JetStok", icon: Package },
    { label: "JetAsistan", icon: CreditCard },
    { label: "JetRapor", icon: BarChart3 },
];

const W = 860;
const H = 320;
const CX = W / 2;
const CY = H / 2;
const LEFT_X = 148;
const RIGHT_X = W - 60;
const BOX_W = 136;
const BOX_H = 34;
const SPACING = 52;
const TOTAL_H = (leftItems.length - 1) * SPACING;
const TOP_Y = CY - TOTAL_H / 2;
const LOGO_R = 36;
const USER_R = 26;

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

                                @keyframes ca-draw-left {
                                    0%, 10%   { stroke-dashoffset: 1; opacity: 0; }
                                    15%       { opacity: 1; }
                                    45%, 85%  { stroke-dashoffset: 0; opacity: 1; }
                                    92%, 100% { opacity: 0; }
                                }
                                .ca-line-ani {
                                    stroke-dasharray: 1;
                                    stroke-dashoffset: 1;
                                    animation: ca-draw-left 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                                }

                                @keyframes ca-dot-left {
                                    0%, 10%   { offset-distance: 0%; opacity: 0; }
                                    15%       { opacity: 1; }
                                    45%       { offset-distance: 100%; opacity: 1; }
                                    46%, 100% { opacity: 0; offset-distance: 100%; }
                                }
                                .ca-dot-ani {
                                    animation: ca-dot-left 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                                }

                                @keyframes ca-draw-right {
                                    0%, 50%   { stroke-dashoffset: 1; opacity: 0; }
                                    55%       { opacity: 1; }
                                    85%       { stroke-dashoffset: 0; opacity: 1; }
                                    95%, 100% { opacity: 0; }
                                }
                                .ca-right-line-ani {
                                    stroke-dasharray: 1;
                                    stroke-dashoffset: 1;
                                    animation: ca-draw-right 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                                }

                                @keyframes ca-dot-right {
                                    0%, 55%   { offset-distance: 0%; opacity: 0; }
                                    60%       { opacity: 1; }
                                    85%       { offset-distance: 100%; opacity: 1; }
                                    86%, 100% { opacity: 0; }
                                }
                                .ca-dot-right-ani {
                                    animation: ca-dot-right 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
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
                                        filter="url(#ca-glow-v2)"
                                        className="ca-line-ani"
                                        style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
                                    />
                                    <circle r="3.8" fill="#7886C7" filter="url(#ca-glow-v2)" className="ca-dot-ani" style={{ offsetPath: `path('${pathData}')` }} />
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
                                        filter="url(#ca-glow-v2)"
                                        className="ca-right-line-ani"
                                        style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
                                    />
                                    <circle r="4.5" fill="#7886C7" filter="url(#ca-glow-v2)" className="ca-dot-right-ani" style={{ offsetPath: `path('${pathData}')` }} />
                                </g>
                            );
                        })()}

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

                        {/* ── Center logo ── */}
                        <g className="ca-logo-group">
                            {/* Outer Glow Ring */}
                            <circle cx={CX} cy={CY} r={LOGO_R + 12} fill="url(#ca-logo-glow)" />

                            {/* Rotating Orbit Ring */}
                            <circle
                                cx={CX} cy={CY} r={LOGO_R + 4}
                                fill="none"
                                stroke="#7886C7"
                                strokeWidth="1"
                                strokeDasharray="10 20"
                                opacity="0.3"
                                style={{ transformOrigin: "center", animation: "spin 12s linear infinite" }}
                            />

                            {/* Main Circle Body (The border ring) */}
                            <circle
                                cx={CX} cy={CY} r={LOGO_R}
                                fill="#ffffff"
                                stroke="rgba(120, 134, 199, 0.4)"
                                strokeWidth="2"
                                style={{ filter: "drop-shadow(0 4px 12px rgba(120,134,199,0.08))" }}
                            />

                            {/* The Logo Image clipped to a perfect circle */}
                            <image
                                href="/logo.png"
                                x={CX - LOGO_R + 2}
                                y={CY - LOGO_R + 2}
                                width={(LOGO_R - 2) * 2}
                                height={(LOGO_R - 2) * 2}
                                clipPath="url(#logo-circle-clip)"
                                preserveAspectRatio="xMidYMid slice"
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

                <p style={{ textAlign: "center", color: "#6B7280", fontSize: "0.85rem", marginTop: "1.5rem" }}>
                    Tüm operasyonlarınız Jetpos ekosistemi içinde senkronize ve güvenli.
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
