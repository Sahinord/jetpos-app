"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { X, ShoppingCart, Phone, User, CheckCircle, Timer, Trophy } from "lucide-react";
import { DEFAULT_GAME_CONFIG, mergeGameConfig, prizeForScore, type GameConfig, type GameItem } from "@/lib/game-config";

/* ═══════════════════════════════════════════════════════════════
   OYUN AYARLARI artık admin panelinden yönetiliyor:
   Admin → "Oyun Ayarları" sekmesi → Supabase game_config tablosu.
   Buradaki DEFAULT_GAME_CONFIG (src/lib/game-config.ts) yalnızca
   DB'ye ulaşılamazsa devreye giren yedektir.
   ═══════════════════════════════════════════════════════════════ */

const STORAGE_KEY = "jetpos-game-state";

type Phase = "intro" | "playing" | "result" | "form" | "done";
type GameState = { playsLeft: number; bestScore: number; done: boolean };

const loadState = (defaultPlays: number): GameState => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const s = JSON.parse(raw);
            return {
                playsLeft: typeof s.playsLeft === "number" ? s.playsLeft : defaultPlays,
                bestScore: typeof s.bestScore === "number" ? s.bestScore : 0,
                done: s.done === true,
            };
        }
    } catch { /* yoksay */ }
    return { playsLeft: defaultPlays, bestScore: 0, done: false };
};

const saveState = (s: GameState) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* yoksay */ }
};

const pickItem = (items: GameItem[]): GameItem => {
    const total = items.reduce((sum, it) => sum + it.weight, 0);
    let r = Math.random() * (total > 0 ? total : 1);
    for (const it of items) {
        r -= it.weight;
        if (r < 0) return it;
    }
    return items[0];
};

export default function CatchGame() {
    const [open, setOpen] = useState(false);
    const [closing, setClosing] = useState(false);
    const [phase, setPhase] = useState<Phase>("intro");
    const [cfg, setCfg] = useState<GameConfig>(DEFAULT_GAME_CONFIG);
    const [playsLeft, setPlaysLeft] = useState(DEFAULT_GAME_CONFIG.maxPlays);
    const [bestScore, setBestScore] = useState(0);
    const [lastScore, setLastScore] = useState(0);
    const [hidden, setHidden] = useState(true);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [focused, setFocused] = useState<string | null>(null);

    /* Oyun tamamen DOM üzerinden çizilir (React re-render YOK → akıcı) */
    const areaRef = useRef<HTMLDivElement>(null);
    const itemsLayerRef = useRef<HTMLDivElement>(null);
    const basketElRef = useRef<HTMLSpanElement>(null);
    const scoreElRef = useRef<HTMLSpanElement>(null);
    const timeElRef = useRef<HTMLSpanElement>(null);
    const barElRef = useRef<HTMLDivElement>(null);
    const basketXRef = useRef(0.5); // 0..1 normalize konum

    useEffect(() => {
        const hasSaved = localStorage.getItem(STORAGE_KEY) !== null;
        const s = loadState(DEFAULT_GAME_CONFIG.maxPlays);
        setPlaysLeft(s.playsLeft);
        setBestScore(s.bestScore);
        setHidden(s.done);

        // Canlı ayarları çek (admin panelinden yönetilir)
        let cancelled = false;
        fetch("/api/game-config")
            .then(r => (r.ok ? r.json() : null))
            .then(j => {
                if (cancelled || !j) return;
                const merged = mergeGameConfig(j);
                setCfg(merged);
                // Daha önce hiç oynamadıysa hak sayısını canlı ayardan al
                if (!hasSaved) setPlaysLeft(merged.maxPlays);
            })
            .catch(() => { /* varsayılanlarla devam */ });
        return () => { cancelled = true; };
    }, []);

    const close = useCallback(() => {
        setClosing(true);
        setTimeout(() => { setOpen(false); setClosing(false); }, 300);
    }, []);

    const startGame = () => {
        if (playsLeft <= 0) return;
        const next = playsLeft - 1;
        setPlaysLeft(next);
        saveState({ playsLeft: next, bestScore, done: false });
        basketXRef.current = 0.5;
        setPhase("playing");
    };

    const endGame = useCallback((finalScore: number) => {
        setLastScore(finalScore);
        setBestScore(prev => {
            const newBest = Math.max(prev, finalScore);
            saveState({ playsLeft: loadState(DEFAULT_GAME_CONFIG.maxPlays).playsLeft, bestScore: newBest, done: false });
            return newBest;
        });
        setPhase("result");
    }, []);

    /* ── OYUN DÖNGÜSÜ (imperatif, 0 React render) ── */
    useEffect(() => {
        if (phase !== "playing") return;
        const area = areaRef.current;
        const layer = itemsLayerRef.current;
        const basketEl = basketElRef.current;
        if (!area || !layer || !basketEl) return;

        type Live = { el: HTMLSpanElement; x: number; y: number; points: number };
        let items: Live[] = [];
        let raf = 0;
        let last = performance.now();
        let spawnAcc = 400; // ilk ürün hızlı gelsin
        let elapsed = 0;
        let score = 0;
        let flashTimeout: ReturnType<typeof setTimeout> | null = null;

        // Boyutları bir kez oku (her karede clientWidth okumak forced reflow yaratır)
        const W = area.clientWidth;
        const H = area.clientHeight;
        // HUD'ı yalnızca değer değişince güncelle (her karede text layout'u önle)
        let lastScoreShown = -1;
        let lastSecShown = -1;

        const spawn = () => {
            const def = pickItem(cfg.items);
            const x = 0.08 + Math.random() * 0.84;
            const el = document.createElement("span");
            el.textContent = def.emoji;
            el.style.cssText = `position:absolute;left:${(x * 100).toFixed(2)}%;top:0;font-size:1.6rem;line-height:1;pointer-events:none;will-change:transform;transform:translate(-50%,-34px);`;
            layer.appendChild(el);
            items.push({ el, x, y: -34, points: def.points });
        };

        const floaty = (xPct: number, y: number, points: number) => {
            const el = document.createElement("span");
            el.textContent = `${points > 0 ? "+" : ""}${points}`;
            // floatUp yalnızca transform+opacity anime eder (layout tetiklemez)
            el.style.cssText = `position:absolute;left:${xPct.toFixed(2)}%;top:${y.toFixed(0)}px;font-size:0.85rem;font-weight:900;color:${points < 0 ? "#dc2626" : "#059669"};pointer-events:none;will-change:transform,opacity;animation:floatUp 0.8s ease-out forwards;`;
            layer.appendChild(el);
            setTimeout(() => el.remove(), 850);
        };

        const loop = (now: number) => {
            const dt = Math.min((now - last) / 1000, 0.05);
            last = now;
            elapsed += dt;
            const timeLeft = Math.max(0, cfg.durationSec - elapsed);

            // Yeni ürün doğur
            spawnAcc += dt * 1000;
            if (spawnAcc >= cfg.spawnEveryMs) {
                spawnAcc = 0;
                spawn();
            }

            // Düşür + çarpışma
            const speed = cfg.baseFallSpeed + elapsed * cfg.speedRampPerSec;
            const basketPx = basketXRef.current * W;
            const catchY = H - 52;

            items = items.filter(it => {
                it.y += speed * dt;
                if (it.y >= catchY && it.y <= catchY + 34 && Math.abs(it.x * W - basketPx) < cfg.basketWidth / 2 + 14) {
                    score = Math.max(0, score + it.points);
                    if (it.points < 0) {
                        area.classList.add("cg-flash");
                        if (flashTimeout) clearTimeout(flashTimeout);
                        flashTimeout = setTimeout(() => area.classList.remove("cg-flash"), 220);
                    }
                    floaty(it.x * 100, it.y, it.points);
                    it.el.remove();
                    return false;
                }
                if (it.y >= H + 40) {
                    it.el.remove();
                    return false;
                }
                it.el.style.transform = `translate(-50%,${it.y.toFixed(1)}px)`;
                return true;
            });

            // Sepet: transform ile taşı (left yerine — layout tetiklemez)
            basketEl.style.transform = `translateX(${(basketXRef.current * W).toFixed(1)}px) translateX(-50%)`;
            // HUD: yalnızca değişince yaz
            if (score !== lastScoreShown && scoreElRef.current) {
                scoreElRef.current.textContent = String(score);
                lastScoreShown = score;
            }
            const sec = Math.ceil(timeLeft);
            if (sec !== lastSecShown && timeElRef.current) {
                timeElRef.current.textContent = `${sec} sn`;
                lastSecShown = sec;
            }
            // Süre çubuğu: width yerine scaleX (compositor-only)
            if (barElRef.current) barElRef.current.style.transform = `scaleX(${(timeLeft / cfg.durationSec).toFixed(4)})`;

            if (timeLeft <= 0) {
                endGame(score);
                return;
            }
            raf = requestAnimationFrame(loop);
        };

        raf = requestAnimationFrame(loop);
        return () => {
            cancelAnimationFrame(raf);
            if (flashTimeout) clearTimeout(flashTimeout);
            layer.replaceChildren(); // ürünler + skor uçuşmaları temizle
            area.classList.remove("cg-flash");
        };
    }, [phase, endGame, cfg]);

    /* ── KLAVYE ── */
    useEffect(() => {
        if (phase !== "playing") return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") basketXRef.current = Math.max(0.05, basketXRef.current - 0.07);
            if (e.key === "ArrowRight") basketXRef.current = Math.min(0.95, basketXRef.current + 0.07);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [phase]);

    const movePointer = (clientX: number) => {
        const area = areaRef.current;
        if (!area) return;
        const rect = area.getBoundingClientRect();
        basketXRef.current = Math.min(0.95, Math.max(0.05, (clientX - rect.left) / rect.width));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !phone) return;
        setLoading(true);
        setError("");
        const tier = prizeForScore(cfg, bestScore);
        try {
            const res = await fetch("/api/demo-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    phone,
                    source: "game",
                    message: `Oyun ödülü: ${tier.prize} (en iyi skor: ${bestScore})`,
                    kvkk_acknowledged: true,
                    marketing_consent: false,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Bir hata oluştu.");
            setPhase("done");
            saveState({ playsLeft, bestScore, done: true });
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

    const tier = prizeForScore(cfg, bestScore);
    const bonusItem = cfg.items.reduce((a, b) => (b.points > a.points ? b : a), cfg.items[0]);
    const bombItem = cfg.items.reduce((a, b) => (b.points < a.points ? b : a), cfg.items[0]);

    const headerByPhase: Record<Phase, { tag: string; title: string; sub: string }> = {
        intro: { tag: `${playsLeft} HAK KALDI`, title: "Sepete Yakala", sub: "Düşen ürünleri sepetle yakala, bombalardan kaç. Skoruna göre ödül kazan!" },
        playing: { tag: `${playsLeft} HAK KALDI`, title: "Yakala!", sub: "Sepeti sürükle ya da ok tuşlarını kullan." },
        result: { tag: playsLeft > 0 ? `${playsLeft} HAK KALDI` : "SON SKOR", title: "Süre doldu!", sub: playsLeft > 0 ? "Ödülünü alabilir ya da skorunu geliştirmek için tekrar oynayabilirsin." : "Hakların bitti — ödülünü kilitle." },
        form: { tag: "ÖDÜL KİLİTLENDİ", title: "Son bir adım", sub: "Bilgilerini bırak, ödülünü hesabına tanımlayalım." },
        done: { tag: "ÖDÜL KİLİTLENDİ", title: "Tebrikler!", sub: "Ekibimiz en kısa sürede seni arayıp ödülünü tanımlayacak." },
    };
    const header = headerByPhase[phase];

    if (!cfg.enabled || (hidden && !open)) return null;

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
                        aria-label="Oyna ve kazan"
                        style={{
                            width: "3.6rem", height: "3.6rem", borderRadius: "50%",
                            background: "linear-gradient(145deg, #262f55, #3d4877)",
                            border: "2px solid rgba(120, 134, 199, 0.5)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 8px 24px rgba(38, 47, 85, 0.45), 0 0 0 6px rgba(120, 134, 199, 0.12)",
                            animation: "gamePulse 2.5s ease-in-out infinite",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.07)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                    >
                        <ShoppingCart style={{ width: "1.4rem", height: "1.4rem", color: "#B0BAE6" }} />
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
                        }}
                    >
                        <span style={{
                            width: "0.5rem", height: "0.5rem", borderRadius: "50%",
                            background: "#7886C7", flexShrink: 0,
                            boxShadow: "0 0 8px rgba(120,134,199,0.8)",
                        }} />
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#111827" }}>Oyna &amp; Kazan</span>
                    </button>
                </div>
            )}

            {/* ── MODAL ── */}
            {open && (
                <>
                    <div
                        onClick={phase === "playing" ? undefined : close}
                        style={{
                            position: "fixed", inset: 0,
                            // Oyun sırasında blur kapalı (GPU yükünü azaltır, takılmayı önler)
                            background: phase === "playing" ? "rgba(17,24,39,0.62)" : "rgba(17,24,39,0.5)",
                            backdropFilter: phase === "playing" ? "none" : "blur(10px)",
                            WebkitBackdropFilter: phase === "playing" ? "none" : "blur(10px)",
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
                            background: "linear-gradient(120deg, #7886C7, #8b5cf6, #06b6d4, #7886C7)",
                            backgroundSize: "300% 300%",
                            animation: "auraFlow 6s ease infinite",
                            // Gradient animasyonu CPU repaint'i tetikler — oyun sırasında durdur
                            animationPlayState: phase === "playing" ? "paused" : "running",
                            boxShadow: "0 32px 80px rgba(17,24,39,0.3), 0 0 70px rgba(120, 134, 199, 0.3)",
                        }}>
                            <div style={{
                                background: "#ffffff",
                                borderRadius: "calc(1.75rem - 1.5px)",
                                position: "relative",
                                padding: "1.9rem 1.6rem 1.4rem",
                            }}>
                                {/* Kapat */}
                                <button
                                    onClick={close}
                                    aria-label="Kapat"
                                    style={{
                                        position: "absolute", top: "1.05rem", right: "1.05rem",
                                        width: "2rem", height: "2rem", borderRadius: "50%",
                                        background: "rgba(17,24,39,0.05)",
                                        border: "1px solid rgba(17,24,39,0.1)",
                                        color: "rgba(17,24,39,0.55)",
                                        cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        zIndex: 5,
                                    }}
                                >
                                    <X style={{ width: "0.875rem", height: "0.875rem" }} />
                                </button>

                                {/* Başlık */}
                                <div style={{ textAlign: "center", marginBottom: "1.1rem" }}>
                                    <p style={{
                                        margin: "0 0 0.45rem", fontSize: "0.72rem", fontWeight: 800,
                                        letterSpacing: "0.22em",
                                        color: phase === "form" || phase === "done" ? "#5A659F" : "rgba(17,24,39,0.45)",
                                    }}>
                                        {header.tag}
                                    </p>
                                    <h2 style={{ margin: "0 0 0.4rem", fontSize: "1.55rem", fontWeight: 900, color: "#111827", letterSpacing: "-0.03em" }}>
                                        {header.title}
                                    </h2>
                                    <p style={{ margin: "0 auto", fontSize: "0.85rem", color: "rgba(17,24,39,0.55)", maxWidth: "330px", lineHeight: 1.55 }}>
                                        {header.sub}
                                    </p>
                                </div>

                                {/* ── INTRO ── */}
                                {phase === "intro" && (
                                    <>
                                        {/* Ödül tablosu */}
                                        <div style={{
                                            border: "1px solid rgba(17,24,39,0.08)",
                                            borderRadius: "1rem", overflow: "hidden", marginBottom: "1rem",
                                        }}>
                                            {cfg.tiers.map((t, i) => (
                                                <div key={t.minScore} style={{
                                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                                    padding: "0.6rem 0.9rem",
                                                    background: i % 2 === 0 ? "rgba(17,24,39,0.02)" : "transparent",
                                                    borderBottom: i < cfg.tiers.length - 1 ? "1px solid rgba(17,24,39,0.05)" : "none",
                                                }}>
                                                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "rgba(17,24,39,0.55)" }}>
                                                        {t.minScore}+ puan
                                                    </span>
                                                    <span style={{ fontSize: "0.82rem", fontWeight: 800, color: i === cfg.tiers.length - 1 ? "#5A659F" : "#111827" }}>
                                                        {t.prize}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Nasıl oynanır */}
                                        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "1.1rem", flexWrap: "wrap" }}>
                                            {[
                                                { e: "🧃📦", t: "Yakala: puan" },
                                                { e: bonusItem.emoji, t: `Bonus: +${bonusItem.points}` },
                                                { e: bombItem.emoji, t: `Kaç: ${bombItem.points}` },
                                            ].map((b, i) => (
                                                <div key={i} style={{
                                                    display: "flex", alignItems: "center", gap: "0.4rem",
                                                    background: "rgba(120,134,199,0.08)",
                                                    border: "1px solid rgba(120,134,199,0.2)",
                                                    borderRadius: "9999px", padding: "0.3rem 0.75rem",
                                                }}>
                                                    <span style={{ fontSize: "0.8rem" }}>{b.e}</span>
                                                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(17,24,39,0.7)" }}>{b.t}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            onClick={startGame}
                                            disabled={playsLeft <= 0}
                                            style={{
                                                width: "100%", padding: "0.95rem",
                                                background: playsLeft <= 0 ? "rgba(17,24,39,0.08)" : "linear-gradient(135deg, #5A659F, #7886C7)",
                                                color: playsLeft <= 0 ? "rgba(17,24,39,0.4)" : "white",
                                                fontWeight: 800, fontSize: "1rem",
                                                border: "none", borderRadius: "0.95rem",
                                                cursor: playsLeft <= 0 ? "not-allowed" : "pointer",
                                                fontFamily: "inherit",
                                                boxShadow: playsLeft <= 0 ? "none" : "0 6px 20px rgba(120, 134, 199, 0.45)",
                                            }}
                                        >
                                            {playsLeft <= 0 ? "Hakların bitti" : `Başlat (${cfg.durationSec} sn)`}
                                        </button>
                                        {bestScore > 0 && (
                                            <p style={{ margin: "0.7rem 0 0", textAlign: "center", fontSize: "0.8rem", color: "rgba(17,24,39,0.55)" }}>
                                                En iyi skorun: <strong style={{ color: "#111827" }}>{bestScore}</strong> → {tier.prize}
                                            </p>
                                        )}
                                    </>
                                )}

                                {/* ── OYUN ── */}
                                {phase === "playing" && (
                                    <>
                                        {/* Üst bilgi */}
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                                <Trophy style={{ width: "0.95rem", height: "0.95rem", color: "#f0b429" }} />
                                                <span ref={scoreElRef} style={{ fontSize: "1.05rem", fontWeight: 900, color: "#111827", fontVariantNumeric: "tabular-nums" }}>
                                                    0
                                                </span>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                                <Timer style={{ width: "0.95rem", height: "0.95rem", color: "#5A659F" }} />
                                                <span ref={timeElRef} style={{ fontSize: "0.95rem", fontWeight: 800, color: "rgba(17,24,39,0.7)", fontVariantNumeric: "tabular-nums" }}>
                                                    {cfg.durationSec} sn
                                                </span>
                                            </div>
                                        </div>
                                        {/* Süre çubuğu */}
                                        <div style={{ height: "5px", background: "rgba(17,24,39,0.07)", borderRadius: "9999px", marginBottom: "0.7rem", overflow: "hidden" }}>
                                            <div ref={barElRef} style={{
                                                height: "100%", width: "100%",
                                                background: "linear-gradient(90deg, #5A659F, #7886C7)",
                                                borderRadius: "9999px",
                                                transformOrigin: "left center",
                                                willChange: "transform",
                                            }} />
                                        </div>

                                        {/* Oyun alanı */}
                                        <div
                                            ref={areaRef}
                                            className="cg-area"
                                            onMouseMove={e => movePointer(e.clientX)}
                                            onTouchMove={e => { if (e.touches[0]) movePointer(e.touches[0].clientX); }}
                                        >
                                            <div ref={itemsLayerRef} style={{ position: "absolute", inset: 0 }} />
                                            <span ref={basketElRef} style={{
                                                position: "absolute",
                                                bottom: "6px",
                                                left: 0,
                                                transform: "translateX(-9999px)",
                                                fontSize: "2.3rem",
                                                lineHeight: 1,
                                                pointerEvents: "none",
                                                willChange: "transform",
                                                filter: "drop-shadow(0 4px 6px rgba(17,24,39,0.25))",
                                            }}>
                                                🛒
                                            </span>
                                        </div>
                                    </>
                                )}

                                {/* ── SONUÇ ── */}
                                {phase === "result" && (
                                    <div style={{
                                        border: "1px solid rgba(17,24,39,0.08)",
                                        borderRadius: "1.1rem",
                                        padding: "1.1rem 1.2rem",
                                        boxShadow: "0 10px 30px rgba(17,24,39,0.07)",
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                                            <div>
                                                <p style={{ margin: "0 0 0.2rem", fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.18em", color: "rgba(17,24,39,0.45)" }}>
                                                    SKORUN
                                                </p>
                                                <p style={{ margin: 0, fontSize: "1.6rem", fontWeight: 900, color: "#111827", fontVariantNumeric: "tabular-nums" }}>
                                                    {lastScore}
                                                    {bestScore > lastScore && (
                                                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "rgba(17,24,39,0.5)", marginLeft: "0.5rem" }}>
                                                            (en iyi: {bestScore})
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <span style={{
                                                background: "rgba(240,180,41,0.12)", color: "#b07d0a",
                                                border: "1px solid rgba(240,180,41,0.35)",
                                                fontWeight: 800, fontSize: "0.8rem",
                                                borderRadius: "0.6rem", padding: "0.4rem 0.7rem", flexShrink: 0,
                                            }}>
                                                {tier.label}
                                            </span>
                                        </div>
                                        <div style={{ height: "1px", background: "rgba(17,24,39,0.07)", margin: "0.9rem 0" }} />
                                        <p style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: "rgba(17,24,39,0.6)", lineHeight: 1.6 }}>
                                            {`Kazandığın ödül: `}<strong style={{ color: "#5A659F" }}>{tier.prize}</strong>
                                            {playsLeft > 0 && ` — tekrar oynarsan en iyi skorun geçerli olur, ödülün asla düşmez.`}
                                        </p>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                                            {playsLeft > 0 && (
                                                <button
                                                    onClick={startGame}
                                                    style={{
                                                        width: "100%", padding: "0.85rem",
                                                        background: "linear-gradient(135deg, #262f55, #3d4877)",
                                                        color: "white", fontWeight: 800, fontSize: "0.95rem",
                                                        border: "none", borderRadius: "0.9rem", cursor: "pointer",
                                                        fontFamily: "inherit",
                                                        boxShadow: "0 6px 18px rgba(38,47,85,0.35)",
                                                    }}
                                                >
                                                    {`Tekrar Oyna (${playsLeft} hak)`}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setPhase("form")}
                                                style={{
                                                    width: "100%", padding: "0.85rem",
                                                    background: playsLeft > 0 ? "#ffffff" : "linear-gradient(135deg, #5A659F, #7886C7)",
                                                    color: playsLeft > 0 ? "#111827" : "white",
                                                    fontWeight: playsLeft > 0 ? 700 : 800, fontSize: "0.95rem",
                                                    border: playsLeft > 0 ? "1px solid rgba(17,24,39,0.15)" : "none",
                                                    borderRadius: "0.9rem", cursor: "pointer",
                                                    fontFamily: "inherit",
                                                    boxShadow: playsLeft > 0 ? "none" : "0 6px 20px rgba(120, 134, 199, 0.45)",
                                                }}
                                            >
                                                Ödülü Al
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ── FORM ── */}
                                {phase === "form" && (
                                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
                                        <div style={{
                                            display: "flex", alignItems: "center", justifyContent: "space-between",
                                            background: "rgba(240,180,41,0.1)",
                                            border: "1px solid rgba(240,180,41,0.35)",
                                            borderRadius: "0.9rem", padding: "0.8rem 1rem",
                                        }}>
                                            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "rgba(17,24,39,0.6)" }}>ÖDÜLÜN</span>
                                            <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#111827" }}>{tier.prize}</span>
                                        </div>
                                        {[
                                            { id: "game-name", icon: User, placeholder: "Adınız Soyadınız *", value: name, onChange: setName, type: "text" },
                                            { id: "game-phone", icon: Phone, placeholder: "Telefon Numaranız *", value: phone, onChange: setPhone, type: "tel" },
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
                                                    className="game-input"
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

                                {/* ── TEBRİKLER ── */}
                                {phase === "done" && (
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
                                                {tier.prize}
                                            </p>
                                            <p style={{ margin: "0.4rem 0 0", fontSize: "0.8rem", color: "rgba(17,24,39,0.55)" }}>
                                                En iyi skor: <strong>{bestScore}</strong>
                                            </p>
                                        </div>
                                        <button onClick={finish} style={{
                                            width: "100%", padding: "0.95rem",
                                            background: "linear-gradient(135deg, #262f55, #3d4877)",
                                            color: "white", fontWeight: 800, fontSize: "0.95rem",
                                            border: "none", borderRadius: "0.95rem", cursor: "pointer",
                                            fontFamily: "inherit",
                                        }}>
                                            Tamam, kapat
                                        </button>
                                    </div>
                                )}

                                <p style={{ margin: "0.9rem 0 0", textAlign: "center", fontSize: "0.68rem", color: "rgba(17,24,39,0.4)" }}>
                                    {cfg.footnote}
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <style>{`
                .cg-area {
                    position: relative;
                    height: 300px;
                    border-radius: 1rem;
                    border: 1px solid rgba(17,24,39,0.1);
                    background-color: rgba(120,134,199,0.04);
                    background-image: radial-gradient(rgba(120,134,199,0.18) 1px, transparent 1px);
                    background-size: 18px 18px;
                    overflow: hidden;
                    cursor: none;
                    touch-action: none;
                    transition: background-color 0.15s;
                    contain: layout paint; /* repaint'i oyun alanıyla sınırla */
                }
                .cg-area.cg-flash { background-color: rgba(239,68,68,0.12); }
                .game-input::placeholder { color: rgba(17,24,39,0.4); }

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
                @keyframes gamePulse {
                    0%, 100% { box-shadow: 0 8px 24px rgba(38, 47, 85, 0.45), 0 0 0 6px rgba(120, 134, 199, 0.12); }
                    50%      { box-shadow: 0 8px 24px rgba(38, 47, 85, 0.45), 0 0 0 12px rgba(120, 134, 199, 0.06); }
                }
                @keyframes floatUp {
                    from { opacity: 1; transform: translate(-50%, 0); }
                    to   { opacity: 0; transform: translate(-50%, -34px); }
                }
            `}</style>
        </>
    );
}
