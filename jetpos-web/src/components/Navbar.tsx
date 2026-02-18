"use client";

import { Zap, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
    { href: "/", label: "Anasayfa" },
    { href: "/fiyatlandirma", label: "Fiyatlandırma" },
    { href: "/#contact", label: "İletişim" },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
                        ? "rgba(4, 12, 30, 0.95)"
                        : "rgba(4, 12, 30, 0.45)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: scrolled
                        ? "1px solid rgba(59, 130, 246, 0.28)"
                        : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: scrolled
                        ? "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.08) inset"
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
                        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none" }}>
                            <div style={{
                                width: "2rem", height: "2rem",
                                background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                                borderRadius: "50%",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: "0 0 12px rgba(37,99,235,0.5)",
                                flexShrink: 0,
                            }}>
                                <Zap style={{ width: "1rem", height: "1rem", color: "white", fill: "white" }} />
                            </div>
                            <span style={{
                                fontSize: "1.2rem", fontWeight: 800, color: "white",
                                letterSpacing: "-0.02em"
                            }}>
                                Jet<span style={{ color: "#60a5fa" }}>POS</span>
                            </span>
                        </Link>

                        {/* Desktop Nav Links */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }} className="nav-desktop">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        style={{
                                            fontSize: "0.875rem",
                                            fontWeight: isActive ? 600 : 500,
                                            color: isActive ? "white" : "rgba(255,255,255,0.6)",
                                            textDecoration: "none",
                                            padding: "0.5rem 0.875rem",
                                            borderRadius: "9999px",
                                            background: isActive ? "rgba(59,130,246,0.12)" : "transparent",
                                            border: isActive ? "1px solid rgba(59,130,246,0.25)" : "1px solid transparent",
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
                            <button style={{
                                padding: "0.5rem 1.125rem",
                                borderRadius: "9999px",
                                border: "1px solid rgba(255,255,255,0.18)",
                                background: "transparent",
                                color: "rgba(255,255,255,0.85)",
                                fontWeight: 600, fontSize: "0.875rem",
                                cursor: "pointer", fontFamily: "inherit",
                                transition: "all 0.2s",
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
                            </button>
                            <button style={{
                                padding: "0.5rem 1.125rem",
                                borderRadius: "9999px",
                                border: "none",
                                background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                                color: "white",
                                fontWeight: 600, fontSize: "0.875rem",
                                cursor: "pointer", fontFamily: "inherit",
                                transition: "all 0.2s",
                                boxShadow: "0 2px 12px rgba(37,99,235,0.4)",
                            }}
                                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(37,99,235,0.6)")}
                                onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 2px 12px rgba(37,99,235,0.4)")}
                            >
                                Ücretsiz Başla →
                            </button>
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
                        background: "rgba(4,12,30,0.97)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(59,130,246,0.2)",
                        borderRadius: "1.25rem",
                        padding: "1.25rem"
                    }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
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
                            ))}
                            <div style={{ height: "1px", background: "rgba(255,255,255,0.07)", margin: "0.25rem 0" }} />
                            <button className="btn-primary" style={{ width: "100%", borderRadius: "0.75rem" }}>
                                Ücretsiz Başla →
                            </button>
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
