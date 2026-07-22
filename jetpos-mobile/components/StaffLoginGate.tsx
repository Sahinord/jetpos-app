"use client";

import { useState } from "react";
import { useEmployee } from "@/lib/employee-context";
import { Delete, LogIn, Building2, ArrowRight } from "lucide-react";

/**
 * LİSANSSIZ personel giriş ekranı (garson/mutfak).
 *
 * İki adım:
 *   1. Cihaz bağlı değilse → İşletme Kodu iste (bir kez)
 *   2. PIN tuş takımı → giriş
 *
 * Personel gizli lisansı hiç görmez. İşletme kodu + PIN birlikte doğrulanır.
 */
export default function StaffLoginGate({ title }: { title?: string }) {
    const { staffLogin, deviceBound } = useEmployee();
    // Cihaz bağlıysa direkt PIN; değilse önce kod
    const [step, setStep] = useState<"code" | "pin">(deviceBound ? "pin" : "code");
    const [code, setCode] = useState("");
    const [pin, setPin] = useState("");
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);

    const submitPin = async (value: string) => {
        if (busy) return;
        setBusy(true);
        setErr("");
        const res = await staffLogin(value, code || undefined);
        setBusy(false);
        if (!res.ok) {
            setErr(res.error || "Geçersiz giriş");
            setPin("");
        }
        // Başarılıysa context güncellenir, sayfa kendini açar
    };

    const tapPin = (d: string) => {
        if (busy) return;
        const next = (pin + d).slice(0, 6);
        setPin(next);
        setErr("");
        if (next.length === 6) submitPin(next);
    };

    // ── Adım 1: İşletme kodu ──
    if (step === "code") {
        return (
            <div className="min-h-screen min-h-[100dvh] bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
                </div>
                <div className="w-full max-w-xs relative z-10 space-y-6">
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Building2 className="w-8 h-8 text-blue-400" />
                        </div>
                        <h1 className="text-2xl font-black text-white">İşletme Kodu</h1>
                        <p className="text-sm text-slate-400">Yöneticinizden aldığınız kodu girin (tek seferlik)</p>
                    </div>
                    <input
                        value={code}
                        onChange={e => setCode(e.target.value.toUpperCase())}
                        placeholder="ABC123"
                        autoFocus
                        autoCapitalize="characters"
                        autoCorrect="off"
                        className="w-full px-4 py-4 bg-slate-950 border border-white/10 rounded-2xl text-white text-center text-2xl font-mono tracking-[0.3em] placeholder:text-slate-700 outline-none focus:border-blue-500/50"
                    />
                    {err && <p className="text-center text-rose-400 text-sm font-bold">{err}</p>}
                    <button
                        onClick={() => code.trim() && setStep("pin")}
                        disabled={!code.trim()}
                        className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-40"
                    >
                        Devam <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    }

    // ── Adım 2: PIN ──
    return (
        <div className="min-h-screen min-h-[100dvh] bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "2s" }} />
            </div>

            <div className="w-full max-w-xs relative z-10">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-white tracking-tight mb-1">{title || "Personel Girişi"}</h1>
                    <p className="text-slate-400 text-sm">PIN kodunuzu girin</p>
                    {!deviceBound && (
                        <button onClick={() => { setStep("code"); setPin(""); setErr(""); }}
                            className="text-[11px] text-blue-400 underline mt-2">← İşletme kodunu değiştir</button>
                    )}
                </div>

                <div className="flex justify-center gap-3 mb-6">
                    {[0, 1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`w-3 h-3 rounded-full transition-all ${i < pin.length ? "bg-blue-500 scale-110" : "bg-white/15"}`} />
                    ))}
                </div>

                {err && <p className="text-center text-rose-400 text-sm font-bold mb-4 animate-shake">{err}</p>}

                <div className="grid grid-cols-3 gap-3">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(d => (
                        <button key={d} onClick={() => tapPin(d)} disabled={busy}
                            className="h-16 rounded-2xl glass-dark border border-white/10 text-2xl font-black text-white active:scale-95 transition-all disabled:opacity-40">
                            {d}
                        </button>
                    ))}
                    <button onClick={() => setPin(p => p.slice(0, -1))} disabled={busy}
                        className="h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 active:scale-95 transition-all">
                        <Delete className="w-6 h-6" />
                    </button>
                    <button onClick={() => tapPin("0")} disabled={busy}
                        className="h-16 rounded-2xl glass-dark border border-white/10 text-2xl font-black text-white active:scale-95 transition-all disabled:opacity-40">
                        0
                    </button>
                    <button onClick={() => pin.length >= 4 && submitPin(pin)} disabled={busy || pin.length < 4}
                        className="h-16 rounded-2xl bg-blue-600 border border-blue-500 flex items-center justify-center text-white active:scale-95 transition-all disabled:opacity-30">
                        {busy ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <LogIn className="w-6 h-6" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
