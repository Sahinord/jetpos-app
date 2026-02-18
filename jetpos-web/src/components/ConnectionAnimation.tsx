"use client";

import Image from "next/image";
import { FileText, ShoppingCart, Package, CreditCard, BarChart3, User } from "lucide-react";

const leftItems = [
    { label: "E-Fatura", icon: FileText },
    { label: "Hızlı Satış", icon: ShoppingCart },
    { label: "Stok Takibi", icon: Package },
    { label: "Kasa Takibi", icon: CreditCard },
    { label: "Raporlama", icon: BarChart3 },
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
        <section style={{ padding: "5rem 2rem", position: "relative", overflow: "hidden" }}>
            <div style={{
                position: "absolute", top: 0, left: "20%", right: "20%", height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.3), transparent)",
            }} />

            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: "0.5rem",
                        background: "rgba(59,130,246,0.08)",
                        border: "1px solid rgba(59,130,246,0.18)",
                        borderRadius: "9999px",
                        padding: "0.35rem 1rem",
                        marginBottom: "1.25rem",
                    }}>
                        <div style={{
                            width: "0.4rem", height: "0.4rem", borderRadius: "50%",
                            background: "#3b82f6", boxShadow: "0 0 6px #3b82f6",
                        }} />
                        <span style={{ fontSize: "0.78rem", color: "#93c5fd", fontWeight: 600, letterSpacing: "0.04em" }}>
                            Özellikler
                        </span>
                    </div>
                    <h2 style={{
                        fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
                        fontWeight: 900, color: "white", margin: "0 0 0.75rem", lineHeight: 1.15,
                    }}>
                        Her şey Jetpos&apos;da
                    </h2>
                    <p style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.4)", margin: 0 }}>
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
                                <feGaussianBlur stdDeviation="2.5" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>

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
                                    0%, 42%   { transform: scale(1); filter: brightness(1) drop-shadow(0 0 0px #3b82f6); }
                                    46%       { transform: scale(1.15); filter: brightness(1.7) drop-shadow(0 0 20px #3b82f6); }
                                    54%       { transform: scale(1); filter: brightness(1); }
                                    100%      { transform: scale(1); filter: brightness(1); }
                                }
                                .ca-logo-group {
                                    transform-origin: center;
                                    animation: ca-logo-pulse-v2 2.8s ease-in-out infinite;
                                }

                                @keyframes ca-user-pulse-v2 {
                                    0%, 82%   { filter: brightness(1); transform: scale(1); }
                                    88%       { filter: brightness(1.7) drop-shadow(0 0 15px #3b82f6); transform: scale(1.12); }
                                    95%, 100% { filter: brightness(1); transform: scale(1); }
                                }
                                .ca-user-group {
                                    transform-origin: ${RIGHT_X}px ${CY}px;
                                    animation: ca-user-pulse-v2 2.8s ease-in-out infinite;
                                }
                            `}</style>
                        </defs>

                        {/* ── Left lines ── */}
                        {leftItems.map((_, i) => {
                            const y = TOP_Y + i * SPACING;
                            // Add a subtle Y offset to avoid perfectly horizontal lines (clips filters)
                            const targetY = i === 2 ? CY + 0.5 : CY;
                            const pathData = `M ${LEFT_X} ${y} L ${CX - LOGO_R} ${targetY}`;
                            return (
                                <g key={i}>
                                    <path d={pathData} stroke="rgba(59,130,246,0.12)" strokeWidth="1.2" fill="none" />
                                    <path
                                        d={pathData}
                                        pathLength="1"
                                        stroke="#3b82f6"
                                        strokeWidth="2.4"
                                        strokeLinecap="round"
                                        fill="none"
                                        filter="url(#ca-glow-v2)"
                                        className="ca-line-ani"
                                        style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
                                    />
                                    <circle r="3.8" fill="#93c5fd" filter="url(#ca-glow-v2)" className="ca-dot-ani" style={{ offsetPath: `path('${pathData}')` }} />
                                </g>
                            );
                        })}

                        {/* ── Right line ── */}
                        {(() => {
                            const pathData = `M ${CX + LOGO_R} ${CY} L ${RIGHT_X - USER_R - 4} ${CY}`;
                            return (
                                <g>
                                    <path d={pathData} stroke="rgba(59,130,246,0.12)" strokeWidth="1" fill="none" />
                                    <path
                                        d={pathData}
                                        pathLength="1"
                                        stroke="#3b82f6"
                                        strokeWidth="2.8"
                                        strokeLinecap="round"
                                        fill="none"
                                        filter="url(#ca-glow-v2)"
                                        className="ca-right-line-ani"
                                        style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
                                    />
                                    <circle r="4.5" fill="#93c5fd" filter="url(#ca-glow-v2)" className="ca-dot-right-ani" style={{ offsetPath: `path('${pathData}')` }} />
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
                                        fill="rgba(7,11,25,0.98)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" />
                                    <rect x={bx + 6} y={by + 5} width={24} height={24} rx={7} fill="rgba(59,130,246,0.12)" />
                                    <foreignObject x={bx + 10} y={by + 9} width="16" height="16">
                                        <div style={{ color: "#60a5fa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <LucideIcon size={14} strokeWidth={2.5} />
                                        </div>
                                    </foreignObject>
                                    <text x={bx + 38} y={by + 21} fill="rgba(255,255,255,0.85)" fontSize="11.5" fontWeight="600" fontFamily="Inter, system-ui, sans-serif">
                                        {item.label}
                                    </text>
                                    <circle cx={LEFT_X} cy={y} r="3.5" fill="#3b82f6" />
                                </g>
                            );
                        })}

                        {/* ── Center logo ── */}
                        <g className="ca-logo-group">
                            <circle cx={CX} cy={CY} r={LOGO_R} fill="#02040a" stroke="rgba(59,130,246,0.6)" strokeWidth="2.5" />
                            <foreignObject x={CX - 24} y={CY - 24} width="48" height="48">
                                <div style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Image src="/logo.png" alt="JetPOS" width={44} height={44} style={{ objectFit: "contain", imageRendering: "crisp-edges" }} />
                                </div>
                            </foreignObject>
                        </g>

                        {/* ── Right user circle ── */}
                        <g className="ca-user-group">
                            <circle cx={RIGHT_X} cy={CY} r={USER_R} fill="#02040a" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                            <foreignObject x={RIGHT_X - 12} y={CY - 12} width="24" height="24">
                                <div style={{ color: "#60a5fa", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
                                    <User size={20} strokeWidth={2.5} />
                                </div>
                            </foreignObject>
                            <circle cx={RIGHT_X - USER_R - 4} cy={CY} r="3.5" fill="#3b82f6" />
                        </g>
                    </svg>
                </div>

                <p style={{ textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: "0.85rem", marginTop: "1.5rem" }}>
                    Tüm operasyonlarınız Jetpos ekosistemi içinde senkronize ve güvenli.
                </p>
            </div>
        </section>
    );
}
