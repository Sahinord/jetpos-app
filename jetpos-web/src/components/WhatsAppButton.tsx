"use client";

import { useState, useEffect } from "react";

export default function WhatsAppButton() {
    const [visible, setVisible] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    // Sayfa açılınca 2 sn sonra görün, çok erken çıkmasın
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 2000);
        return () => clearTimeout(t);
    }, []);

    // İlk görününce tooltip'i 4 sn göster
    useEffect(() => {
        if (!visible) return;
        setShowTooltip(true);
        const t = setTimeout(() => setShowTooltip(false), 4000);
        return () => clearTimeout(t);
    }, [visible]);

    const phone = "905366610169";
    const message = encodeURIComponent("Merhaba! JetPOS hakkında bilgi almak istiyorum.");
    const href = `https://wa.me/${phone}?text=${message}`;

    return (
        <>
            {/* Tooltip balonu */}
            <div style={{
                position: "fixed",
                bottom: "5.75rem",
                right: "1.5rem",
                background: "rgba(3,7,18,0.95)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(37,211,102,0.25)",
                borderRadius: "0.875rem",
                padding: "0.625rem 1rem",
                zIndex: 99,
                pointerEvents: "none",
                opacity: (showTooltip || hovered) ? 1 : 0,
                transform: (showTooltip || hovered) ? "translateY(0) scale(1)" : "translateY(6px) scale(0.95)",
                transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
                whiteSpace: "nowrap",
            }}>
                {/* Arrow */}
                <div style={{
                    position: "absolute",
                    bottom: "-6px",
                    right: "1.25rem",
                    width: "12px",
                    height: "6px",
                    overflow: "hidden",
                }}>
                    <div style={{
                        width: "8px", height: "8px",
                        background: "rgba(3,7,18,0.95)",
                        border: "1px solid rgba(37,211,102,0.25)",
                        transform: "rotate(45deg)",
                        margin: "-4px auto 0",
                    }} />
                </div>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                    💬 Merhaba! Nasıl yardımcı olabilirim?
                </p>
            </div>

            {/* WhatsApp Butonu */}
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp ile iletişime geç"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    position: "fixed",
                    bottom: "1.5rem",
                    right: "1.5rem",
                    zIndex: 100,
                    width: "3.5rem",
                    height: "3.5rem",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #25d366, #128c7e)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: hovered
                        ? "0 0 0 3px rgba(37,211,102,0.3), 0 12px 32px rgba(37,211,102,0.5)"
                        : "0 0 0 2px rgba(37,211,102,0.15), 0 8px 24px rgba(37,211,102,0.35)",
                    transform: visible
                        ? (hovered ? "scale(1.12) rotate(-5deg)" : "scale(1)")
                        : "scale(0) rotate(90deg)",
                    transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                    cursor: "pointer",
                    textDecoration: "none",
                }}
            >
                {/* Ping animasyon halkası */}
                <div style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    background: "rgba(37,211,102,0.3)",
                    animation: "waPing 2s ease-out infinite",
                }} />

                {/* WhatsApp SVG ikonu */}
                <svg
                    viewBox="0 0 24 24"
                    fill="white"
                    style={{ width: "1.625rem", height: "1.625rem", position: "relative", zIndex: 1 }}
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
            </a>

            <style>{`
                @keyframes waPing {
                    0% { transform: scale(1); opacity: 0.6; }
                    100% { transform: scale(1.8); opacity: 0; }
                }
            `}</style>
        </>
    );
}
