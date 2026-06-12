"use client";

import React from "react";
import { Mail, Phone } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer style={{ position: "relative", zIndex: 2, borderTop: "1px solid #E5E7EB" }}>
            <div className="site-container" style={{ paddingTop: "5rem", paddingBottom: "4rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "4rem" }}>
                    
                    {/* Brand */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.875rem", textDecoration: "none" }}>
                            <div style={{
                                width: "3.25rem", height: "3.25rem",
                                borderRadius: "50%",
                                border: "1px solid rgba(120, 134, 199, 0.15)",
                                background: "#ffffff",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                overflow: "hidden",
                                boxShadow: "0 2px 8px rgba(120, 134, 199, 0.05)",
                                flexShrink: 0,
                            }}>
                                <Image 
                                    src="/logo.png" 
                                    alt="JetPOS Logo" 
                                    width={64} 
                                    height={64} 
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            </div>
                            <span style={{
                                fontSize: "1.75rem", fontWeight: 900, color: "#111827",
                                letterSpacing: "-0.04em"
                            }}>
                                Jet<span style={{ color: "#7886C7" }}>POS</span>
                            </span>
                        </Link>
                        <p style={{ color: "#4B5563", fontSize: "0.95rem", lineHeight: 1.7, maxWidth: "320px" }}>
                            İşletmenizi dijital çağa taşıyan, yapay zeka destekli stok ve satış yönetim platformu.
                        </p>
                    </div>

                    {/* Platform */}
                    <div>
                        <h4 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#111827", marginBottom: "1.5rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Platform</h4>
                        <ul style={{ display: "flex", flexDirection: "column", gap: "1rem", listStyle: "none" }}>
                            {([
                                { label: "Özellikler", href: "/#features" },
                                { label: "Fiyatlandırma", href: "/fiyatlandirma" },
                                { label: "Hızlı Paket Oluştur", href: "/fiyatlandirma/ozellestir" },
                                { label: "Entegrasyonlar", href: "/#integrations" },
                                { label: "API Dokümanları", href: "/api-docs" },
                            ] as { label: string; href: string }[]).map(({ label, href }) => (
                                <li key={label}>
                                    <Link href={href} style={{ color: "#4B5563", fontSize: "0.9rem", textDecoration: "none", transition: "all 0.2s" }}
                                        onMouseEnter={e => (e.currentTarget.style.color = "#111827")}
                                        onMouseLeave={e => (e.currentTarget.style.color = "#4B5563")}
                                    >{label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Kurumsal */}
                    <div>
                        <h4 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#111827", marginBottom: "1.5rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Kurumsal</h4>
                        <ul style={{ display: "flex", flexDirection: "column", gap: "1rem", listStyle: "none" }}>
                            {([
                                { label: "Hakkımızda", href: "/hakkimizda" },
                                { label: "Sıkça Sorulan Sorular", href: "/faq" },
                                { label: "Gizlilik & KVKK", href: "/gizlilik" },
                                { label: "İş Ortaklığı", href: "/is-ortakligi" },
                                { label: "İletişim", href: "/iletisim" },
                            ] as { label: string; href: string }[]).map(({ label, href }) => (
                                <li key={label}>
                                    <Link href={href} style={{ color: "#4B5563", fontSize: "0.9rem", textDecoration: "none", transition: "all 0.2s" }}
                                        onMouseEnter={e => (e.currentTarget.style.color = "#111827")}
                                        onMouseLeave={e => (e.currentTarget.style.color = "#4B5563")}
                                    >{label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* İletişim */}
                    <div>
                        <h4 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#111827", marginBottom: "1.5rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>İletişim</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <a href="mailto:info@jetpos.shop" style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#4B5563", fontSize: "0.95rem", textDecoration: "none", transition: "all 0.2s" }}
                                onMouseEnter={e => (e.currentTarget.style.color = "#111827")}
                                onMouseLeave={e => (e.currentTarget.style.color = "#4B5563")}
                            >
                                <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", background: "rgba(120, 134, 199, 0.08)", color: "#7886C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Mail style={{ width: "1rem", height: "1rem", flexShrink: 0 }} />
                                </div>
                                info@jetpos.shop
                            </a>
                            <a href="tel:05366610169" style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#4B5563", fontSize: "0.95rem", textDecoration: "none", transition: "all 0.2s" }}
                                onMouseEnter={e => (e.currentTarget.style.color = "#111827")}
                                onMouseLeave={e => (e.currentTarget.style.color = "#4B5563")}
                            >
                                <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", background: "rgba(120, 134, 199, 0.08)", color: "#7886C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Phone style={{ width: "1rem", height: "1rem", flexShrink: 0 }} />
                                </div>
                                0536 661 0169
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div style={{ marginTop: "4rem", paddingTop: "2.5rem", borderTop: "1px solid #E5E7EB", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1.5rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <p style={{ color: "#6B7280", fontSize: "0.85rem" }}>
                            © {currentYear} JetPOS. Tüm hakları saklıdır.
                        </p>
                        <p style={{ color: "#6B7280", fontSize: "0.8rem", fontWeight: 500 }}>
                            JetPOS bir <span style={{ color: "#7886C7", fontWeight: 700 }}>Jetsoft</span> ürünüdür.
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
                        {([
                            { label: "Gizlilik Politikası", href: "/gizlilik" },
                            { label: "KVKK", href: "/gizlilik#haklariniz" },
                            { label: "Kullanım Koşulları", href: "/terms" },
                        ] as { label: string; href: string }[]).map(({ label, href }) => (
                            <Link key={label} href={href} style={{ color: "#6B7280", fontSize: "0.85rem", textDecoration: "none", transition: "all 0.2s" }}
                                onMouseEnter={e => (e.currentTarget.style.color = "#111827")}
                                onMouseLeave={e => (e.currentTarget.style.color = "#6B7280")}
                            >{label}</Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
