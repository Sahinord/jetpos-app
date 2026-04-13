"use client";

import React from "react";

import Link from "next/link";
import { Zap, ArrowLeft, Home, PhoneCall } from "lucide-react";

export default function NotFound() {
    return (
        <>
            <div className="site-bg" />
            <main style={{
                position: "relative", zIndex: 1,
                minHeight: "100vh",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "2rem",
            }}>
                {/* Glow */}
                <div style={{
                    position: "absolute", top: "50%", left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "600px", height: "400px",
                    background: "radial-gradient(ellipse, rgba(37,99,235,0.08) 0%, transparent 70%)",
                    pointerEvents: "none",
                }} />

                <div style={{ textAlign: "center", maxWidth: "500px", position: "relative" }}>
                    {/* Logo */}
                    <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.625rem", textDecoration: "none", marginBottom: "3rem" }}>
                        <div style={{
                            width: "2.5rem", height: "2.5rem",
                            background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                            borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 0 20px rgba(37,99,235,0.4)",
                        }}>
                            <Zap style={{ width: "1.25rem", height: "1.25rem", color: "white", fill: "white" }} />
                        </div>
                        <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "white" }}>
                            Jet<span style={{ color: "#60a5fa" }}>POS</span>
                        </span>
                    </Link>

                    {/* 404 */}
                    <div style={{
                        fontSize: "clamp(6rem, 20vw, 10rem)",
                        fontWeight: 900,
                        lineHeight: 1,
                        background: "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.04))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        marginBottom: "1.5rem",
                        letterSpacing: "-0.05em",
                    }}>
                        404
                    </div>

                    <h1 style={{
                        fontSize: "1.75rem", fontWeight: 800, color: "white",
                        marginBottom: "1rem", lineHeight: 1.2,
                    }}>
                        Sayfa Bulunamadı
                    </h1>
                    <p style={{
                        color: "rgba(255,255,255,0.5)", fontSize: "1rem",
                        lineHeight: 1.7, marginBottom: "2.5rem",
                    }}>
                        Aradığınız sayfa taşınmış, silinmiş ya da hiç oluşturulmamış olabilir. Ana sayfaya dönüp devam edebilirsiniz.
                    </p>

                    <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                        <Link href="/" style={{
                            display: "inline-flex", alignItems: "center", gap: "0.5rem",
                            padding: "0.875rem 1.75rem", borderRadius: "9999px",
                            background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                            color: "white", fontWeight: 700, fontSize: "0.95rem",
                            textDecoration: "none", boxShadow: "0 4px 16px rgba(37,99,235,0.4)",
                            transition: "all 0.2s",
                        }}>
                            <Home style={{ width: "1rem", height: "1rem" }} />
                            Ana Sayfa
                        </Link>
                        <Link href="/#contact" style={{
                            display: "inline-flex", alignItems: "center", gap: "0.5rem",
                            padding: "0.875rem 1.75rem", borderRadius: "9999px",
                            border: "1px solid rgba(255,255,255,0.15)",
                            background: "rgba(255,255,255,0.04)",
                            color: "rgba(255,255,255,0.8)", fontWeight: 600, fontSize: "0.95rem",
                            textDecoration: "none", transition: "all 0.2s",
                        }}>
                            <PhoneCall style={{ width: "1rem", height: "1rem" }} />
                            İletişim
                        </Link>
                    </div>

                    <div style={{ marginTop: "3rem", display: "flex", gap: "2rem", justifyContent: "center", flexWrap: "wrap" }}>
                        {[
                            { label: "Fiyatlandırma", href: "/fiyatlandirma" },
                            { label: "Demo Talebi", href: "/demo" },
                            { label: "Gizlilik", href: "/gizlilik" },
                        ].map(({ label, href }) => (
                            <Link key={href} href={href} style={{
                                color: "rgba(255,255,255,0.35)", fontSize: "0.875rem",
                                textDecoration: "none", transition: "color 0.2s",
                            }}
                                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
                            >
                                {label}
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
        </>
    );
}
