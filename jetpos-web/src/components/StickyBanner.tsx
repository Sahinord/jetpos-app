"use client";

import { useState, useEffect } from "react";
import { X, Zap, Clock } from "lucide-react";

// ─── Kampanya ayarları – buradan güncelle ───────────────
const CAMPAIGN = {
    label: "ÖZEL TEKLİF",
    text: "%30 İndirim",
    subtext: "Tüm planlarda geçerli, sınırlı süre!",
    cta: "Hemen Teklif Al →",
    href: "/#contact",
    // Kampanya bitiş tarihi: null ise süresiz göster
    endsAt: null as Date | null,
    // Kullanım: endsAt: new Date("2026-04-30"),
};
// ────────────────────────────────────────────────────────

export default function StickyBanner() {
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Kampanya süresi bittiyse gösterme
        if (CAMPAIGN.endsAt && new Date() > CAMPAIGN.endsAt) return;

        const wasDismissed = localStorage.getItem("jetpos-banner-dismissed");
        if (wasDismissed) return;

        const handleScroll = () => {
            if (window.scrollY > 300) setVisible(true);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const dismiss = () => {
        setDismissed(true);
        localStorage.setItem("jetpos-banner-dismissed", "1");
    };

    if (dismissed || !visible) return null;

    return (
        <div style={{
            position: "fixed",
            top: 0, left: 0, right: 0,
            zIndex: 200,
            animation: "bannerSlideDown 0.5s cubic-bezier(0.22,1,0.36,1) both",
        }}>
            <div style={{
                background: "linear-gradient(90deg, #1d4ed8 0%, #2563eb 35%, #7c3aed 65%, #1d4ed8 100%)",
                backgroundSize: "200% 100%",
                animation: "bannerGrad 4s linear infinite",
                padding: "0.6rem 1.5rem",
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: "1.5rem", position: "relative", minHeight: "2.75rem",
            }}>
                {/* Shimmer */}
                <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)",
                    backgroundSize: "200% 100%",
                    animation: "bannerShimmer 2.5s linear infinite",
                    pointerEvents: "none",
                }} />

                {/* Text */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{
                        display: "flex", alignItems: "center", gap: "0.35rem",
                        background: "rgba(255,255,255,0.15)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "9999px", padding: "0.2rem 0.625rem", flexShrink: 0,
                    }}>
                        <Zap style={{ width: "0.7rem", height: "0.7rem", color: "#fbbf24", fill: "#fbbf24" }} />
                        <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "white", letterSpacing: "0.06em" }}>
                            {CAMPAIGN.label}
                        </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "white" }}>
                        <strong style={{ color: "#fbbf24" }}>{CAMPAIGN.text}</strong>
                        {" "}— {CAMPAIGN.subtext}
                    </p>
                </div>

                {/* CTA */}
                <a href={CAMPAIGN.href} style={{
                    display: "inline-flex", alignItems: "center", gap: "0.4rem",
                    padding: "0.4rem 1rem", background: "white", color: "#1d4ed8",
                    borderRadius: "9999px", fontWeight: 800, fontSize: "0.8rem",
                    textDecoration: "none", flexShrink: 0, transition: "all 0.2s",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.04)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)"; }}
                >
                    {CAMPAIGN.cta}
                </a>

                {/* Countdown – sadece endsAt varsa göster */}
                {CAMPAIGN.endsAt && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "rgba(255,255,255,0.65)", fontSize: "0.75rem" }} className="banner-countdown">
                        <Clock style={{ width: "0.75rem", height: "0.75rem" }} />
                        <span>Kampanya sona eriyor</span>
                    </div>
                )}

                {/* Close */}
                <button onClick={dismiss} aria-label="Kapat" style={{
                    position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)",
                    background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "50%", width: "1.625rem", height: "1.625rem",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "rgba(255,255,255,0.7)", transition: "all 0.2s", padding: 0,
                }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.2)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)"; }}
                >
                    <X style={{ width: "0.75rem", height: "0.75rem" }} />
                </button>
            </div>

            <style>{`
                @keyframes bannerSlideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes bannerGrad { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
                @keyframes bannerShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
                @media (max-width: 640px) { .banner-countdown { display: none !important; } }
            `}</style>
        </div>
    );
}
