"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { X, Gift, Phone, User, CheckCircle } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   ÇARK AYARLARI — algoritmayı buradan yönetin
   - weight: kazanma ağırlığı (olasılık = weight / toplam weight)
     0 yaparsanız o dilim HİÇ çıkmaz ama çarkta görünmeye devam eder.
   - grand: true → çarkta vurgulu (mor) dilim + "büyük ödül" teaser'ı
   - maxSpins: kişi başı toplam çevirme hakkı (tarayıcı bazlı saklanır)
   ═══════════════════════════════════════════════════════════════ */
const WHEEL_CONFIG = {
    maxSpins: 3,
    dailyWinners: 47,
    footnote: "* Hediyeler yıllık paket alımlarında geçerlidir. Stoklarla sınırlıdır.",
    segments: [
        { id: "barkod", label: "Barkod", sub: "OKUYUCU", prize: "Ücretsiz Barkod Okuyucu", weight: 2, grand: true },
        { id: "indirim10", label: "%10", sub: "İNDİRİM", prize: "%10 Ek İndirim", weight: 25, grand: false },
        { id: "ay3", label: "+3 Ay", sub: "ÜCRETSİZ", prize: "+3 Ay Ücretsiz Kullanım", weight: 8, grand: false },
        { id: "indirim5", label: "%5", sub: "İNDİRİM", prize: "%5 Ek İndirim", weight: 40, grand: false },
        { id: "ay1", label: "+1 Ay", sub: "ÜCRETSİZ", prize: "+1 Ay Ücretsiz Kullanım", weight: 24, grand: false },
        { id: "yil1", label: "+1 Yıl", sub: "ÜCRETSİZ", prize: "+1 Yıl Ücretsiz Kullanım", weight: 1, grand: false },
    ],
};

const STORAGE_KEY = "jetpos-wheel-state";
const SEG_COUNT = WHEEL_CONFIG.segments.length;
const SEG_ANGLE = 360 / SEG_COUNT;
const SPIN_DURATION_MS = 4400;

type Phase = "idle" | "spinning" | "decision" | "form" | "done";

type WheelState = {
    spinsLeft: number;
    done: boolean;
    pendingPrizeId?: string | null;
};

const loadState = (): WheelState => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const s = JSON.parse(raw);
            return {
                spinsLeft: typeof s.spinsLeft === "number" ? s.spinsLeft : WHEEL_CONFIG.maxSpins,
                done: s.done === true,
                pendingPrizeId: typeof s.pendingPrizeId === "string" ? s.pendingPrizeId : null,
            };
        }
    } catch { /* yoksay */ }
    return { spinsLeft: WHEEL_CONFIG.maxSpins, done: false, pendingPrizeId: null };
};

const saveState = (s: WheelState) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* yoksay */ }
};

// Ağırlıklı rastgele dilim seçimi
const pickSegmentIndex = (): number => {
    const total = WHEEL_CONFIG.segments.reduce((sum, s) => sum + s.weight, 0);
    let r = Math.random() * (total > 0 ? total : 1);
    for (let i = 0; i < SEG_COUNT; i++) {
        r -= WHEEL_CONFIG.segments[i].weight;
        if (r < 0) return i;
    }
    return SEG_COUNT - 1;
};

// SVG dilim path'i (merkez 150,150 / yarıçap r) — 0. dilim tepeden başlar, saat yönünde
const segmentPath = (i: number, r: number): string => {
    const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
    const a0 = toRad(i * SEG_ANGLE);
    const a1 = toRad((i + 1) * SEG_ANGLE);
    const x0 = 150 + r * Math.cos(a0), y0 = 150 + r * Math.sin(a0);
    const x1 = 150 + r * Math.cos(a1), y1 = 150 + r * Math.sin(a1);
    return `M150,150 L${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 0 1 ${x1.toFixed(2)},${y1.toFixed(2)} Z`;
};

export default function SpinWheel() {
    const [open, setOpen] = useState(false);
    const [closing, setClosing] = useState(false);
    const [phase, setPhase] = useState<Phase>("idle");
    const [spinsLeft, setSpinsLeft] = useState(WHEEL_CONFIG.maxSpins);
    const [hidden, setHidden] = useState(true); // done ise launcher gizli
    const [rotation, setRotation] = useState(0);
    const [resultIdx, setResultIdx] = useState<number | null>(null);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [focused, setFocused] = useState<string | null>(null);

    useEffect(() => {
        const s = loadState();
        setSpinsLeft(s.spinsLeft);
        setHidden(s.done);
        // Yarım kalan ödül varsa (sayfa yenilendi vb.) kaldığı yerden devam et
        if (!s.done && s.pendingPrizeId) {
            const idx = WHEEL_CONFIG.segments.findIndex(seg => seg.id === s.pendingPrizeId);
            if (idx >= 0) {
                setResultIdx(idx);
                setRotation(360 - (idx * SEG_ANGLE + SEG_ANGLE / 2));
                setPhase(s.spinsLeft > 0 ? "decision" : "form");
            }
        }
    }, []);

    const close = useCallback(() => {
        if (phase === "spinning") return; // dönerken kapatma
        setClosing(true);
        setTimeout(() => { setOpen(false); setClosing(false); }, 300);
    }, [phase]);

    const spin = () => {
        if (spinsLeft <= 0 || phase === "spinning") return;
        const idx = pickSegmentIndex();
        const jitter = Math.random() * (SEG_ANGLE * 0.7) - (SEG_ANGLE * 0.35);
        const targetMod = (360 - (idx * SEG_ANGLE + SEG_ANGLE / 2) + jitter + 720) % 360;
        const currentMod = ((rotation % 360) + 360) % 360;
        const delta = (targetMod - currentMod + 360) % 360;
        const nextSpinsLeft = spinsLeft - 1;

        setResultIdx(null);
        setRotation(rotation + 5 * 360 + delta);
        setPhase("spinning");
        setSpinsLeft(nextSpinsLeft);
        saveState({ spinsLeft: nextSpinsLeft, done: false, pendingPrizeId: WHEEL_CONFIG.segments[idx].id });

        setTimeout(() => {
            setResultIdx(idx);
            // Hak kaldıysa karar aşaması; kalmadıysa direkt forma
            setPhase(nextSpinsLeft > 0 ? "decision" : "form");
        }, SPIN_DURATION_MS);
    };

    const lockPrize = () => setPhase("form");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !phone || resultIdx === null) return;
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/demo-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    phone,
                    source: "wheel",
                    message: `Çark ödülü: ${WHEEL_CONFIG.segments[resultIdx].prize}`,
                    kvkk_acknowledged: true,
                    marketing_consent: false,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Bir hata oluştu.");
            setPhase("done");
            saveState({ spinsLeft, done: true, pendingPrizeId: null });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Bir hata oluştu. Lütfen tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    };

    const finish = () => {
        setHidden(true);
        close();
    };

    const grandSegment = WHEEL_CONFIG.segments.find(s => s.grand);
    const prize = resultIdx !== null ? WHEEL_CONFIG.segments[resultIdx] : null;

    const headerByPhase: Record<Phase, { tag: string; title: string; sub: string }> = {
        idle: { tag: `${spinsLeft} HAK KALDI`, title: "Şansınızı Deneyin", sub: "Çarkı çevirin, size özel bir hediye kazanın." },
        spinning: { tag: `${spinsLeft} HAK KALDI`, title: "Dönüyor...", sub: "Bol şans! Çark yavaşlıyor..." },
        decision: { tag: `${spinsLeft} HAK KALDI`, title: "Karar sizin", sub: "Bu ödülü alabilir ya da bir hakkınızı daha kullanabilirsiniz." },
        form: { tag: "ÖDÜL KİLİTLENDİ", title: "Son bir adım", sub: "Bilgilerinizi bırakın, ödülünüzü hesabınıza tanımlayalım." },
        done: { tag: "ÖDÜL KİLİTLENDİ", title: "Tebrikler!", sub: "Ekibimiz en kısa sürede sizi arayıp ödülünüzü tanımlayacak." },
    };
    const header = headerByPhase[phase];

    if (hidden && !open) return null;

    return (
        <>
            {/* ── LAUNCHER (sol alt) ── */}
            {!open && (
                <div style={{
                    position: "fixed", bottom: "1.5rem", left: "1.5rem", zIndex: 900,
                    display: "flex", alignItems: "center", gap: "0.6rem",
                }}>
                    <button
                        onClick={() => setOpen(true)}
                        aria-label="Ücretsiz hediye çarkı"
                        style={{
                            width: "3.6rem", height: "3.6rem", borderRadius: "50%",
                            backgroundImage: "linear-gradient(145deg, #262f55, #3d4877)",
                            border: "2px solid rgba(120, 134, 199, 0.5)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 8px 24px rgba(38, 47, 85, 0.45), 0 0 0 6px rgba(120, 134, 199, 0.12)",
                            animation: "wheelPulse 2.5s ease-in-out infinite",
                            order: 1,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.07)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                    >
                        <Gift style={{ width: "1.4rem", height: "1.4rem", color: "#B0BAE6" }} />
                    </button>
                    <button
                        onClick={() => setOpen(true)}
                        style={{
                            display: "flex", alignItems: "center", gap: "0.45rem",
                            background: "#ffffff",
                            border: "1px solid rgba(17,24,39,0.08)",
                            borderRadius: "9999px",
                            padding: "0.55rem 1rem",
                            cursor: "pointer",
                            boxShadow: "0 8px 24px rgba(17,24,39,0.12)",
                            fontFamily: "inherit",
                            order: 2,
                        }}
                    >
                        <span style={{
                            width: "0.5rem", height: "0.5rem", borderRadius: "50%",
                            background: "#7886C7", flexShrink: 0,
                            boxShadow: "0 0 8px rgba(120,134,199,0.8)",
                        }} />
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#111827" }}>Ücretsiz Hediye</span>
                    </button>
                </div>
            )}

            {/* ── MODAL ── */}
            {open && (
                <>
                    <div
                        onClick={close}
                        style={{
                            position: "fixed", inset: 0,
                            background: "rgba(17,24,39,0.5)",
                            backdropFilter: "blur(10px)",
                            WebkitBackdropFilter: "blur(10px)",
                            zIndex: 1000,
                            animation: closing ? "fadeOut 0.3s ease forwards" : "fadeIn 0.3s ease both",
                        }}
                    />
                    <div style={{
                        position: "fixed", top: "50%", left: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 1001,
                        width: "100%", maxWidth: "470px",
                        padding: "1rem",
                        maxHeight: "100dvh", overflowY: "auto",
                        animation: closing ? "popOut 0.3s cubic-bezier(0.4,0,1,1) forwards" : "popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
                    }}>
                        <div style={{
                            padding: "1.5px",
                            borderRadius: "1.75rem",
                            backgroundImage: "linear-gradient(120deg, #7886C7, #8b5cf6, #06b6d4, #7886C7)",
                            backgroundSize: "300% 300%",
                            animation: "auraFlow 6s ease infinite",
                            boxShadow: "0 32px 80px rgba(17,24,39,0.3), 0 0 70px rgba(120, 134, 199, 0.3)",
                        }}>
                            <div style={{
                                background: "#ffffff",
                                borderRadius: "calc(1.75rem - 1.5px)",
                                position: "relative",
                                padding: "2rem 1.75rem 1.5rem",
                            }}>
                                {/* Kapat */}
                                <button
                                    onClick={close}
                                    aria-label="Kapat"
                                    style={{
                                        position: "absolute", top: "1.1rem", right: "1.1rem",
                                        width: "2rem", height: "2rem", borderRadius: "50%",
                                        background: "rgba(17,24,39,0.05)",
                                        border: "1px solid rgba(17,24,39,0.1)",
                                        color: "rgba(17,24,39,0.55)",
                                        cursor: phase === "spinning" ? "not-allowed" : "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        zIndex: 5,
                                    }}
                                >
                                    <X style={{ width: "0.875rem", height: "0.875rem" }} />
                                </button>

                                {/* Başlık */}
                                <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
                                    <p style={{
                                        margin: "0 0 0.5rem", fontSize: "0.72rem", fontWeight: 800,
                                        letterSpacing: "0.22em",
                                        color: phase === "form" || phase === "done" ? "#5A659F" : "rgba(17,24,39,0.45)",
                                    }}>
                                        {header.tag}
                                    </p>
                                    <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.6rem", fontWeight: 900, color: "#111827", letterSpacing: "-0.03em" }}>
                                        {header.title}
                                    </h2>
                                    <p style={{ margin: "0 auto", fontSize: "0.875rem", color: "rgba(17,24,39,0.55)", maxWidth: "320px", lineHeight: 1.55 }}>
                                        {header.sub}
                                    </p>
                                </div>

                                {/* ── ÇARK ── */}
                                <div style={{ position: "relative", width: "min(300px, 78vw)", margin: "0 auto 1.4rem" }}>
                                    {/* İbre */}
                                    <svg viewBox="0 0 30 38" style={{
                                        position: "absolute", top: "-8px", left: "50%",
                                        transform: "translateX(-50%)", width: "26px", zIndex: 3,
                                        filter: "drop-shadow(0 3px 4px rgba(17,24,39,0.3))",
                                    }}>
                                        <path d="M15 38 L2 10 Q15 0 28 10 Z" fill="#f0b429" stroke="#c88a12" strokeWidth="1.5" />
                                        <circle cx="15" cy="9" r="4.5" fill="#111827" stroke="#c88a12" strokeWidth="1.5" />
                                    </svg>

                                    {/* Dönen çark */}
                                    <div style={{
                                        transform: `rotate(${rotation}deg)`,
                                        transition: phase === "spinning" ? `transform ${SPIN_DURATION_MS / 1000}s cubic-bezier(0.15, 0.75, 0.12, 1)` : "none",
                                        filter: "drop-shadow(0 16px 24px rgba(17,24,39,0.25))",
                                    }}>
                                        <svg viewBox="0 0 300 300" style={{ display: "block", width: "100%" }}>
                                            {/* Jant */}
                                            <circle cx="150" cy="150" r="148" fill="#3d4877" />
                                            <circle cx="150" cy="150" r="148" fill="none" stroke="#262f55" strokeWidth="3" />
                                            {/* Jant vidaları */}
                                            {Array.from({ length: 12 }).map((_, i) => {
                                                const a = ((i * 30 - 90) * Math.PI) / 180;
                                                return (
                                                    <circle
                                                        key={i}
                                                        cx={150 + 138 * Math.cos(a)}
                                                        cy={150 + 138 * Math.sin(a)}
                                                        r="3.4"
                                                        fill="#161d38"
                                                        stroke="rgba(255,255,255,0.15)"
                                                        strokeWidth="0.8"
                                                    />
                                                );
                                            })}
                                            {/* Dilimler */}
                                            {WHEEL_CONFIG.segments.map((seg, i) => {
                                                const won = resultIdx === i && (phase === "decision" || phase === "form" || phase === "done");
                                                const fill = won
                                                    ? "#f0b429"
                                                    : seg.grand
                                                        ? "#7886C7"
                                                        : i % 2 === 0 ? "#171e38" : "#232c4f";
                                                return (
                                                    <path
                                                        key={seg.id}
                                                        d={segmentPath(i, 126)}
                                                        fill={fill}
                                                        stroke="#0e1428"
                                                        strokeWidth="1.5"
                                                        style={{ transition: "fill 0.4s ease" }}
                                                    />
                                                );
                                            })}
                                            {/* Dilim yazıları */}
                                            {WHEEL_CONFIG.segments.map((seg, i) => {
                                                const won = resultIdx === i && (phase === "decision" || phase === "form" || phase === "done");
                                                const dark = won; // altın zeminde koyu yazı
                                                return (
                                                    <g key={seg.id} transform={`rotate(${i * SEG_ANGLE + SEG_ANGLE / 2} 150 150)`}>
                                                        <text
                                                            x="150" y="56"
                                                            textAnchor="middle"
                                                            fontSize="17"
                                                            fontWeight="800"
                                                            fill={dark ? "#111827" : "#ffffff"}
                                                            fontFamily="inherit"
                                                        >
                                                            {seg.label}
                                                        </text>
                                                        <text
                                                            x="150" y="72"
                                                            textAnchor="middle"
                                                            fontSize="9.5"
                                                            fontWeight="700"
                                                            letterSpacing="1.5"
                                                            fill={dark ? "rgba(17,24,39,0.65)" : seg.grand ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.55)"}
                                                            fontFamily="inherit"
                                                        >
                                                            {seg.sub}
                                                        </text>
                                                    </g>
                                                );
                                            })}
                                            {/* Göbek */}
                                            <circle cx="150" cy="150" r="30" fill="#111827" stroke="#7886C7" strokeWidth="3" />
                                            <circle cx="150" cy="150" r="17" fill="#7886C7" />
                                            <circle cx="146" cy="146" r="3" fill="rgba(255,255,255,0.85)" />
                                        </svg>
                                    </div>
                                </div>

                                {/* ── AŞAMAYA GÖRE ALT BÖLÜM ── */}
                                {(phase === "idle" || phase === "spinning") && (
                                    <button
                                        onClick={spin}
                                        disabled={phase === "spinning" || spinsLeft <= 0}
                                        style={{
                                            width: "100%", padding: "0.95rem",
                                            background: phase === "spinning" ? "rgba(17,24,39,0.08)" : "linear-gradient(135deg, #5A659F, #7886C7)",
                                            color: phase === "spinning" ? "rgba(17,24,39,0.4)" : "white",
                                            fontWeight: 800, fontSize: "1rem",
                                            border: "none", borderRadius: "0.95rem",
                                            cursor: phase === "spinning" ? "not-allowed" : "pointer",
                                            fontFamily: "inherit",
                                            boxShadow: phase === "spinning" ? "none" : "0 6px 20px rgba(120, 134, 199, 0.45)",
                                        }}
                                    >
                                        {phase === "spinning" ? "Dönüyor..." : "Çarkı Çevir"}
                                    </button>
                                )}

                                {phase === "decision" && prize && (
                                    <div style={{
                                        border: "1px solid rgba(17,24,39,0.08)",
                                        borderRadius: "1.1rem",
                                        padding: "1.1rem 1.2rem",
                                        boxShadow: "0 10px 30px rgba(17,24,39,0.07)",
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                                            <div>
                                                <p style={{ margin: "0 0 0.2rem", fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.18em", color: "rgba(17,24,39,0.45)" }}>
                                                    KAZANDIĞINIZ
                                                </p>
                                                <p style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#111827" }}>
                                                    {prize.prize}
                                                </p>
                                            </div>
                                            <span style={{
                                                background: "rgba(120,134,199,0.12)", color: "#5A659F",
                                                fontWeight: 800, fontSize: "0.8rem",
                                                borderRadius: "0.6rem", padding: "0.4rem 0.7rem", flexShrink: 0,
                                            }}>
                                                {prize.label}
                                            </span>
                                        </div>
                                        <div style={{ height: "1px", background: "rgba(17,24,39,0.07)", margin: "0.9rem 0" }} />
                                        <p style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: "rgba(17,24,39,0.6)", lineHeight: 1.6 }}>
                                            {`Bu ödülü alabilir ya da bir hakkınızı daha kullanıp büyük ödül için tekrar çevirebilirsiniz: `}
                                            {grandSegment && <strong style={{ color: "#5A659F" }}>{grandSegment.prize}</strong>}
                                        </p>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                                            <button
                                                onClick={spin}
                                                style={{
                                                    width: "100%", padding: "0.85rem",
                                                    backgroundImage: "linear-gradient(135deg, #262f55, #3d4877)",
                                                    color: "white", fontWeight: 800, fontSize: "0.95rem",
                                                    border: "none", borderRadius: "0.9rem", cursor: "pointer",
                                                    fontFamily: "inherit",
                                                    boxShadow: "0 6px 18px rgba(38,47,85,0.35)",
                                                }}
                                            >
                                                Risk Al — Tekrar Çevir
                                            </button>
                                            <button
                                                onClick={lockPrize}
                                                style={{
                                                    width: "100%", padding: "0.85rem",
                                                    background: "#ffffff",
                                                    color: "#111827", fontWeight: 700, fontSize: "0.95rem",
                                                    border: "1px solid rgba(17,24,39,0.15)",
                                                    borderRadius: "0.9rem", cursor: "pointer",
                                                    fontFamily: "inherit",
                                                }}
                                            >
                                                Elindekini Al
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {phase === "form" && prize && (
                                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
                                        <div style={{
                                            display: "flex", alignItems: "center", justifyContent: "space-between",
                                            background: "rgba(240,180,41,0.1)",
                                            border: "1px solid rgba(240,180,41,0.35)",
                                            borderRadius: "0.9rem", padding: "0.8rem 1rem",
                                        }}>
                                            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "rgba(17,24,39,0.6)" }}>ÖDÜLÜNÜZ</span>
                                            <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#111827" }}>{prize.prize}</span>
                                        </div>
                                        {[
                                            { id: "wheel-name", icon: User, placeholder: "Adınız Soyadınız *", value: name, onChange: setName, type: "text" },
                                            { id: "wheel-phone", icon: Phone, placeholder: "Telefon Numaranız *", value: phone, onChange: setPhone, type: "tel" },
                                        ].map(({ id, icon: Icon, placeholder, value, onChange, type }) => (
                                            <div key={id} style={{
                                                display: "flex", alignItems: "center", gap: "0.75rem",
                                                background: focused === id ? "#ffffff" : "rgba(17,24,39,0.04)",
                                                border: `1px solid ${focused === id ? "rgba(120, 134, 199, 0.6)" : "rgba(17,24,39,0.1)"}`,
                                                boxShadow: focused === id ? "0 0 0 4px rgba(120, 134, 199, 0.15)" : "none",
                                                borderRadius: "0.875rem",
                                                padding: "0.75rem 1rem",
                                                transition: "all 0.25s",
                                            }}>
                                                <Icon style={{ width: "1rem", height: "1rem", color: focused === id ? "#5A659F" : "rgba(17,24,39,0.35)", flexShrink: 0 }} />
                                                <input
                                                    id={id} type={type} placeholder={placeholder} value={value}
                                                    onChange={e => onChange(e.target.value)}
                                                    onFocus={() => setFocused(id)}
                                                    onBlur={() => setFocused(null)}
                                                    required
                                                    className="wheel-input"
                                                    style={{ background: "none", border: "none", outline: "none", color: "#111827", fontSize: "0.9rem", width: "100%", fontFamily: "inherit" }}
                                                />
                                            </div>
                                        ))}
                                        {error && (
                                            <div style={{
                                                background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.25)",
                                                borderRadius: "0.75rem", padding: "0.7rem 0.9rem",
                                                color: "#dc2626", fontSize: "0.8rem",
                                            }}>
                                                {error}
                                            </div>
                                        )}
                                        <button type="submit" disabled={loading} style={{
                                            width: "100%", padding: "0.95rem",
                                            background: loading ? "rgba(17,24,39,0.08)" : "linear-gradient(135deg, #5A659F, #7886C7)",
                                            color: loading ? "rgba(17,24,39,0.4)" : "white",
                                            fontWeight: 800, fontSize: "0.95rem",
                                            border: "none", borderRadius: "0.95rem",
                                            cursor: loading ? "not-allowed" : "pointer",
                                            fontFamily: "inherit",
                                            boxShadow: loading ? "none" : "0 6px 20px rgba(120, 134, 199, 0.45)",
                                        }}>
                                            {loading ? "Gönderiliyor..." : "Ödülümü Kilitle"}
                                        </button>
                                        <p style={{ margin: 0, textAlign: "center", fontSize: "0.68rem", color: "rgba(17,24,39,0.45)", lineHeight: 1.5 }}>
                                            {`🔒 Spam yok. Gönderdiğinizde `}
                                            <Link href="/gizlilik" target="_blank" style={{ color: "#5A659F", textDecoration: "underline" }}>
                                                Gizlilik &amp; KVKK Politikası
                                            </Link>
                                            {`'nı okuduğunuzu kabul etmiş olursunuz.`}
                                        </p>
                                    </form>
                                )}

                                {phase === "done" && prize && (
                                    <div style={{ textAlign: "center", animation: "fadeIn 0.4s ease both" }}>
                                        <div style={{
                                            border: "1px solid rgba(16,185,129,0.3)",
                                            background: "linear-gradient(180deg, rgba(16,185,129,0.07), rgba(16,185,129,0.02))",
                                            borderRadius: "1.1rem",
                                            padding: "1.3rem 1rem",
                                            marginBottom: "1rem",
                                        }}>
                                            <div style={{
                                                width: "3rem", height: "3rem", borderRadius: "0.9rem",
                                                background: "#10b981",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                margin: "0 auto 0.75rem",
                                                boxShadow: "0 8px 20px rgba(16,185,129,0.35)",
                                            }}>
                                                <CheckCircle style={{ width: "1.5rem", height: "1.5rem", color: "white" }} />
                                            </div>
                                            <p style={{ margin: "0 0 0.3rem", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.2em", color: "#059669" }}>
                                                ÖDÜLÜNÜZ
                                            </p>
                                            <p style={{ margin: 0, fontSize: "1.3rem", fontWeight: 900, color: "#111827", letterSpacing: "-0.02em" }}>
                                                {prize.prize}
                                            </p>
                                        </div>
                                        <button onClick={finish} style={{
                                            width: "100%", padding: "0.95rem",
                                            backgroundImage: "linear-gradient(135deg, #262f55, #3d4877)",
                                            color: "white", fontWeight: 800, fontSize: "0.95rem",
                                            border: "none", borderRadius: "0.95rem", cursor: "pointer",
                                            fontFamily: "inherit",
                                        }}>
                                            Tamam, kapat
                                        </button>
                                    </div>
                                )}

                                {/* Sosyal kanıt + dipnot */}
                                {phase !== "done" && (
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem", marginTop: "1rem" }}>
                                        <span style={{
                                            width: "0.55rem", height: "0.55rem", borderRadius: "50%",
                                            background: "#10b981", boxShadow: "0 0 8px rgba(16,185,129,0.7)",
                                        }} />
                                        <span style={{ fontSize: "0.8rem", color: "rgba(17,24,39,0.6)" }}>
                                            Bugün <strong style={{ color: "#111827" }}>{WHEEL_CONFIG.dailyWinners}</strong> kişi ödül kazandı
                                        </span>
                                    </div>
                                )}
                                <p style={{ margin: "0.9rem 0 0", textAlign: "center", fontSize: "0.68rem", color: "rgba(17,24,39,0.4)" }}>
                                    {WHEEL_CONFIG.footnote}
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <style>{`
                @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
                @keyframes popIn {
                    from { opacity: 0; transform: translate(-50%, -48%) scale(0.9); }
                    to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
                @keyframes popOut {
                    from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    to   { opacity: 0; transform: translate(-50%, -52%) scale(0.9); }
                }
                @keyframes auraFlow {
                    0%   { background-position: 0% 50%; }
                    50%  { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes wheelPulse {
                    0%, 100% { box-shadow: 0 8px 24px rgba(38, 47, 85, 0.45), 0 0 0 6px rgba(120, 134, 199, 0.12); }
                    50%      { box-shadow: 0 8px 24px rgba(38, 47, 85, 0.45), 0 0 0 12px rgba(120, 134, 199, 0.06); }
                }
                .wheel-input::placeholder { color: rgba(17,24,39,0.4); }
            `}</style>
        </>
    );
}
