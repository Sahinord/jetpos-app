"use client";

import { Mail, Phone, Instagram, Linkedin, Twitter, Zap } from "lucide-react";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer style={{ position: "relative", zIndex: 2, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="site-container" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "3rem" }}>
                    {/* Brand */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                            <div style={{
                                width: "2.25rem", height: "2.25rem",
                                background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                                borderRadius: "0.625rem",
                                display: "flex", alignItems: "center", justifyContent: "center"
                            }}>
                                <Zap style={{ width: "1.125rem", height: "1.125rem", color: "white", fill: "white" }} />
                            </div>
                            <span style={{ fontSize: "1.375rem", fontWeight: 800, color: "white" }}>
                                Jet<span style={{ color: "#60a5fa" }}>POS</span>
                            </span>
                        </div>
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", lineHeight: 1.7 }}>
                            İşletmenizi dijital çağa taşıyan, yapay zeka destekli stok ve satış yönetim platformu.
                        </p>
                        <div style={{ display: "flex", gap: "0.625rem" }}>
                            {[
                                { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
                                { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
                                { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
                            ].map(({ icon: Icon, href, label }) => (
                                <a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={label}
                                    style={{
                                        width: "2.25rem", height: "2.25rem",
                                        background: "rgba(255,255,255,0.05)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        borderRadius: "0.5rem",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        color: "rgba(255,255,255,0.6)",
                                        transition: "all 0.2s",
                                        textDecoration: "none"
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLAnchorElement).style.color = "white";
                                        (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(59,130,246,0.4)";
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.6)";
                                        (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.1)";
                                    }}
                                >
                                    <Icon style={{ width: "1rem", height: "1rem" }} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Platform */}
                    <div>
                        <h4 style={{ fontSize: "0.875rem", fontWeight: 700, color: "white", marginBottom: "1.25rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Platform</h4>
                        <ul style={{ display: "flex", flexDirection: "column", gap: "0.75rem", listStyle: "none" }}>
                            {["Özellikler", "Fiyatlandırma", "Entegrasyonlar", "API Dokümantasyonu"].map(item => (
                                <li key={item}>
                                    <a href="#" style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", textDecoration: "none", transition: "color 0.2s" }}
                                        onMouseEnter={e => (e.currentTarget.style.color = "white")}
                                        onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
                                    >{item}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Kurumsal */}
                    <div>
                        <h4 style={{ fontSize: "0.875rem", fontWeight: 700, color: "white", marginBottom: "1.25rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Kurumsal</h4>
                        <ul style={{ display: "flex", flexDirection: "column", gap: "0.75rem", listStyle: "none" }}>
                            {["Hakkımızda", "Blog", "Kariyer", "İletişim"].map(item => (
                                <li key={item}>
                                    <a href="#" style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", textDecoration: "none", transition: "color 0.2s" }}
                                        onMouseEnter={e => (e.currentTarget.style.color = "white")}
                                        onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
                                    >{item}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* İletişim */}
                    <div>
                        <h4 style={{ fontSize: "0.875rem", fontWeight: 700, color: "white", marginBottom: "1.25rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>İletişim</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                            <a href="mailto:info@jetpos.com" style={{ display: "flex", alignItems: "center", gap: "0.625rem", color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", textDecoration: "none", transition: "color 0.2s" }}
                                onMouseEnter={e => (e.currentTarget.style.color = "white")}
                                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
                            >
                                <Mail style={{ width: "1rem", height: "1rem", flexShrink: 0 }} />
                                info@jetpos.com
                            </a>
                            <a href="tel:+905001234567" style={{ display: "flex", alignItems: "center", gap: "0.625rem", color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", textDecoration: "none", transition: "color 0.2s" }}
                                onMouseEnter={e => (e.currentTarget.style.color = "white")}
                                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
                            >
                                <Phone style={{ width: "1rem", height: "1rem", flexShrink: 0 }} />
                                +90 500 123 45 67
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.8125rem" }}>
                        © {currentYear} JetPOS. Tüm hakları saklıdır.
                    </p>
                    <div style={{ display: "flex", gap: "1.5rem" }}>
                        {["Kullanıcı Sözleşmesi", "Gizlilik Politikası", "Kullanım Koşulları"].map(item => (
                            <a key={item} href="#" style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.8125rem", textDecoration: "none", transition: "color 0.2s" }}
                                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
                            >{item}</a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
