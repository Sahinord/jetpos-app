"use client";

import { Menu, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navLinks = [
    { href: "/", label: "Anasayfa" },
    {
        label: "Ürünler",
        items: [
            { href: "/urunler/jetpos", label: "JetPOS", desc: "Satış & Ön Muhasebe Sistemi" },
            { href: "/urunler/jetkds", label: "JetKDS", desc: "Akıllı Mutfak Ekranı (KDS)" },
            { href: "/urunler/jetqr", label: "JetQR", desc: "Dijital QR Menü & Sipariş" },
        ]
    },
    { href: "/fiyatlandirma", label: "Fiyatlandırma" },
    { href: "/fiyatlandirma/ozellestir", label: "Paketini Oluştur" },
    { href: "/demo", label: "Ücretsiz Demo" },
    { href: "/iletisim", label: "İletişim" },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <>
            {/* Wrapper - tam genişlik, fixed */}
            <div style={{
                position: "fixed",
                top: 0, left: 0, right: 0,
                zIndex: 50,
                display: "flex",
                justifyContent: "center",
                padding: "0.75rem 1.5rem",
                pointerEvents: "none",
            }}>
                <nav style={{
                    width: "100%",
                    maxWidth: "1100px",
                    borderRadius: "9999px",
                    background: scrolled
                        ? "rgba(17, 24, 39, 0.95)"
                        : "rgba(17, 24, 39, 0.45)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: scrolled
                        ? "1px solid rgba(120, 134, 199, 0.28)"
                        : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: scrolled
                        ? "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(120, 134, 199, 0.08) inset"
                        : "0 2px 16px rgba(0,0,0,0.2)",
                    transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
                    pointerEvents: "auto",
                }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        height: "3.5rem",
                        padding: "0 1.5rem",
                        transition: "height 0.4s cubic-bezier(0.4,0,0.2,1), padding 0.4s",
                    }}>

                        {/* Logo */}
                        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}>
                            <div style={{
                                width: "2.5rem", height: "2.5rem",
                                borderRadius: "50%",
                                border: scrolled ? "1px solid rgba(120, 134, 199, 0.3)" : "1px solid rgba(255,255,255,0.15)",
                                background: "rgba(255,255,255,0.03)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                overflow: "hidden",
                                boxShadow: "0 0 15px rgba(120, 134, 199, 0.25)",
                                flexShrink: 0,
                                transition: "all 0.4s"
                            }}>
                                <Image 
                                    src="/logo.png" 
                                    alt="JetPOS Logo" 
                                    width={40} 
                                    height={40} 
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            </div>
                            <span style={{
                                fontSize: "1.3rem", fontWeight: 800, color: scrolled ? "white" : "white",
                                letterSpacing: "-0.04em"
                            }}>
                                Jet<span style={{ color: "#7886C7" }}>POS</span>
                            </span>
                        </Link>

                        {/* Desktop Nav Links */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }} className="nav-desktop">
                            {navLinks.map((link) => {
                                if (link.items) {
                                    const isActive = pathname.startsWith("/urunler");
                                    return (
                                        <div
                                            key={link.label}
                                            style={{ position: "relative" }}
                                            onMouseEnter={() => setActiveDropdown(link.label)}
                                            onMouseLeave={() => setActiveDropdown(null)}
                                        >
                                            <button
                                                style={{
                                                    fontSize: "0.875rem",
                                                    fontWeight: isActive ? 600 : 500,
                                                    color: isActive ? "white" : "rgba(255,255,255,0.6)",
                                                    padding: "0.5rem 0.875rem",
                                                    borderRadius: "9999px",
                                                    background: isActive ? "rgba(120, 134, 199, 0.12)" : "transparent",
                                                    border: isActive ? "1px solid rgba(120, 134, 199, 0.25)" : "1px solid transparent",
                                                    cursor: "pointer",
                                                    fontFamily: "inherit",
                                                    transition: "all 0.2s ease",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.25rem"
                                                }}
                                                onMouseEnter={e => {
                                                    if (!isActive) {
                                                        e.currentTarget.style.color = "white";
                                                        e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                                                    }
                                                }}
                                                onMouseLeave={e => {
                                                    if (!isActive) {
                                                        e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                                                        e.currentTarget.style.background = "transparent";
                                                    }
                                                }}
                                            >
                                                {link.label}
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: activeDropdown === link.label ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}><path d="m6 9 6 6 6-6"/></svg>
                                            </button>
                                            
                                            {activeDropdown === link.label && (
                                                <div style={{
                                                    position: "absolute",
                                                    top: "100%",
                                                    left: "50%",
                                                    transform: "translateX(-50%)",
                                                    paddingTop: "0.5rem",
                                                    width: "280px"
                                                }}>
                                                    <div style={{
                                                        background: "rgba(17, 24, 39, 0.95)",
                                                        backdropFilter: "blur(20px)",
                                                        border: "1px solid rgba(120, 134, 199, 0.2)",
                                                        borderRadius: "1rem",
                                                        padding: "0.5rem",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: "0.25rem",
                                                        boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
                                                    }}>
                                                        {link.items.map((subItem) => (
                                                            <Link
                                                                key={subItem.href}
                                                                href={subItem.href}
                                                                style={{
                                                                    display: "flex",
                                                                    flexDirection: "column",
                                                                    padding: "0.75rem 1rem",
                                                                    borderRadius: "0.75rem",
                                                                    textDecoration: "none",
                                                                    transition: "background 0.2s"
                                                                }}
                                                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                                                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                                            >
                                                                <span style={{ color: "white", fontSize: "0.9rem", fontWeight: 600 }}>{subItem.label}</span>
                                                                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", marginTop: "0.125rem" }}>{subItem.desc}</span>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                const isActive = pathname === link.href || (link.href !== undefined && link.href !== "/" && pathname.startsWith(link.href));
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href as string}
                                        style={{
                                            fontSize: "0.875rem",
                                            fontWeight: isActive ? 600 : 500,
                                            color: isActive ? "white" : "rgba(255,255,255,0.6)",
                                            textDecoration: "none",
                                            padding: "0.5rem 0.875rem",
                                            borderRadius: "9999px",
                                            background: isActive ? "rgba(120, 134, 199, 0.12)" : "transparent",
                                            border: isActive ? "1px solid rgba(120, 134, 199, 0.25)" : "1px solid transparent",
                                            transition: "all 0.2s ease",
                                        }}
                                        onMouseEnter={e => {
                                            if (!isActive) {
                                                e.currentTarget.style.color = "white";
                                                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (!isActive) {
                                                e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                                                e.currentTarget.style.background = "transparent";
                                            }
                                        }}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Right side */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }} className="nav-desktop">
                            <Link href="/portal/login" style={{
                                padding: "0.5rem 1.125rem",
                                borderRadius: "9999px",
                                border: "1px solid rgba(255,255,255,0.18)",
                                background: "transparent",
                                color: "rgba(255,255,255,0.85)",
                                fontWeight: 600, fontSize: "0.875rem",
                                cursor: "pointer", fontFamily: "inherit",
                                transition: "all 0.2s",
                                textDecoration: "none"
                            }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
                                    e.currentTarget.style.color = "white";
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
                                    e.currentTarget.style.color = "rgba(255,255,255,0.85)";
                                }}
                            >
                                Giriş Yap
                            </Link>
                            <Link href="/demo" style={{
                                padding: "0.5rem 1.125rem",
                                borderRadius: "9999px",
                                border: "none",
                                background: "linear-gradient(135deg, #7886C7, #5A659F)",
                                color: "white",
                                fontWeight: 600, fontSize: "0.875rem",
                                cursor: "pointer", fontFamily: "inherit",
                                transition: "all 0.2s",
                                boxShadow: "0 2px 12px rgba(120, 134, 199, 0.4)",
                                textDecoration: "none",
                                display: "inline-flex", alignItems: "center"
                            }}
                                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(120, 134, 199, 0.6)")}
                                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.boxShadow = "0 2px 12px rgba(120, 134, 199, 0.4)")}
                            >
                                Ücretsiz Demo →
                            </Link>
                        </div>

                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="nav-mobile"
                            style={{
                                background: "none", border: "none", cursor: "pointer",
                                color: "white", padding: "0.5rem", display: "none"
                            }}
                            aria-label="Menü"
                        >
                            {mobileMenuOpen
                                ? <X style={{ width: "1.375rem", height: "1.375rem" }} />
                                : <Menu style={{ width: "1.375rem", height: "1.375rem" }} />
                            }
                        </button>
                    </div>
                </nav>
            </div>

            {/* Mobile Dropdown */}
            {mobileMenuOpen && (
                <div style={{ position: "fixed", inset: 0, zIndex: 40 }}>
                    <div
                        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <div style={{
                        position: "absolute", top: "5rem", left: "1rem", right: "1rem",
                        background: "rgba(17, 24, 39, 0.97)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(120, 134, 199, 0.2)",
                        borderRadius: "1.25rem",
                        padding: "1.25rem"
                    }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {navLinks.map((link) => (
                                link.items ? (
                                    <div key={link.label} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                        <div style={{ padding: "0.5rem 1rem", color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{link.label}</div>
                                        {link.items.map(subItem => (
                                            <Link
                                                key={subItem.href}
                                                href={subItem.href}
                                                style={{
                                                    color: "rgba(255,255,255,0.9)", fontWeight: 500,
                                                    textDecoration: "none", padding: "0.75rem 1rem 0.75rem 1.5rem",
                                                    borderRadius: "0.75rem",
                                                    background: "rgba(255,255,255,0.02)"
                                                }}
                                                onClick={() => setMobileMenuOpen(false)}
                                            >
                                                <div style={{ fontSize: "0.95rem" }}>{subItem.label}</div>
                                                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: "0.125rem" }}>{subItem.desc}</div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <Link
                                        key={link.href}
                                        href={link.href as string}
                                        style={{
                                            color: "rgba(255,255,255,0.8)", fontWeight: 500,
                                            textDecoration: "none", padding: "0.75rem 1rem",
                                            borderRadius: "0.75rem",
                                            background: "rgba(255,255,255,0.04)"
                                        }}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {link.label}
                                    </Link>
                                )
                            ))}
                            <Link href="/portal/login" style={{
                                color: "rgba(255,255,255,0.8)", fontWeight: 500,
                                textDecoration: "none", padding: "0.75rem 1rem",
                                borderRadius: "0.75rem",
                                background: "rgba(255,255,255,0.04)"
                            }} onClick={() => setMobileMenuOpen(false)}>
                                Müşteri Paneli
                            </Link>
                            <div style={{ height: "1px", background: "rgba(255,255,255,0.07)", margin: "0.25rem 0" }} />
                            <Link href="/demo"
                                style={{
                                    display: "block", textAlign: "center",
                                    padding: "0.875rem", borderRadius: "0.75rem",
                                    background: "linear-gradient(135deg, #7886C7, #5A659F)",
                                    color: "white", fontWeight: 700, textDecoration: "none"
                                }}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                🚀 Ücretsiz Demo Talep Et
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @media (max-width: 768px) {
                    .nav-desktop { display: none !important; }
                    .nav-mobile { display: block !important; }
                }
            `}</style>
        </>
    );
}
