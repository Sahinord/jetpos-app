"use client";

import { useState } from "react";
import { useEmployee } from "@/lib/employee-context";
import { Delete, LogIn } from "lucide-react";

/**
 * Çalışan PIN ekranı. Yetki gerektiren bir sayfa açıldığında, çalışan
 * oturumu yoksa bu ekran gösterilir. Giriş ekranıyla aynı görsel dil.
 *
 * onSuccess verilirse (örn. adisyonda modal), giriş sonrası çağrılır;
 * verilmezse bileşen kendini gizler (context güncellenir, sayfa açılır).
 */
export default function EmployeePinGate({ onSuccess, title }: { onSuccess?: () => void; title?: string }) {
    const { loginWithPin } = useEmployee();
    const [pin, setPin] = useState("");
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = async (value: string) => {
        if (busy) return;
        setBusy(true);
        setErr("");
        const res = await loginWithPin(value);
        setBusy(false);
        if (res.ok) {
            setPin("");
            onSuccess?.();
        } else {
            setErr(res.error || "Geçersiz PIN");
            setPin("");
        }
    };

    const tap = (d: string) => {
        if (busy) return;
        const next = (pin + d).slice(0, 6);
        setPin(next);
        setErr("");
        if (next.length >= 4) {
            // 4-6 hane; kullanıcı bitirince otomatik denemek yerine 6'da ya da
            // enter'da dene. 6 haneye ulaşınca otomatik gönder.
            if (next.length === 6) submit(next);
        }
    };

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
                </div>

                {/* PIN göstergesi */}
                <div className="flex justify-center gap-3 mb-6">
                    {[0, 1, 2, 3, 4, 5].map(i => (
                        <div key={i}
                            className={`w-3 h-3 rounded-full transition-all ${i < pin.length ? "bg-blue-500 scale-110" : "bg-white/15"} ${i === 3 && pin.length <= 4 ? "" : ""}`} />
                    ))}
                </div>

                {err && (
                    <p className="text-center text-rose-400 text-sm font-bold mb-4 animate-shake">{err}</p>
                )}

                {/* Tuş takımı */}
                <div className="grid grid-cols-3 gap-3">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(d => (
                        <button key={d} onClick={() => tap(d)} disabled={busy}
                            className="h-16 rounded-2xl glass-dark border border-white/10 text-2xl font-black text-white active:scale-95 transition-all disabled:opacity-40">
                            {d}
                        </button>
                    ))}
                    <button onClick={() => setPin(p => p.slice(0, -1))} disabled={busy}
                        className="h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 active:scale-95 transition-all">
                        <Delete className="w-6 h-6" />
                    </button>
                    <button onClick={() => tap("0")} disabled={busy}
                        className="h-16 rounded-2xl glass-dark border border-white/10 text-2xl font-black text-white active:scale-95 transition-all disabled:opacity-40">
                        0
                    </button>
                    <button onClick={() => pin.length >= 4 && submit(pin)} disabled={busy || pin.length < 4}
                        className="h-16 rounded-2xl bg-blue-600 border border-blue-500 flex items-center justify-center text-white active:scale-95 transition-all disabled:opacity-30">
                        {busy ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <LogIn className="w-6 h-6" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
