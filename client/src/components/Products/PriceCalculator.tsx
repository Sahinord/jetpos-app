"use client";

import { useState, useRef, useEffect } from "react";
import { Calculator, X, Percent, Plus, Minus, Equal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Gelişmiş Fiyat Hesaplayıcı — bir fiyat inputunun yanına icon olarak konur.
 *
 * Mevcut değere göre HEM YÜZDE HEM TL bazında hesaplama:
 *   • % Zam / % İndirim  (örn. 100 → +%18 → 118)
 *   • +TL / -TL          (örn. 100 → +25 → 125)
 *   • = Sabit değer      (doğrudan yaz)
 *
 * Kullanım:
 *   <PriceCalculator baseValue={Number(formData.sale_price)} onApply={(v) => set(...)} />
 */
export default function PriceCalculator({
    baseValue,
    onApply,
    label = "Fiyat Hesapla",
}: {
    baseValue: number;
    onApply: (value: number) => void;
    label?: string;
}) {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<"pct_up" | "pct_down" | "add" | "sub" | "set">("pct_up");
    const [amount, setAmount] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    // Dışarı tıklayınca kapat
    useEffect(() => {
        if (!open) return;
        const onDoc = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [open]);

    const base = Number(baseValue) || 0;
    const n = Number(String(amount).replace(",", ".")) || 0;

    const compute = (): number => {
        switch (mode) {
            case "pct_up": return base * (1 + n / 100);
            case "pct_down": return base * (1 - n / 100);
            case "add": return base + n;
            case "sub": return base - n;
            case "set": return n;
            default: return base;
        }
    };
    const result = Math.max(0, Number(compute().toFixed(2)));

    const modes: { key: typeof mode; icon: any; label: string }[] = [
        { key: "pct_up", icon: Percent, label: "% Zam" },
        { key: "pct_down", icon: Percent, label: "% İndir" },
        { key: "add", icon: Plus, label: "+ TL" },
        { key: "sub", icon: Minus, label: "− TL" },
        { key: "set", icon: Equal, label: "= Sabit" },
    ];

    const apply = () => {
        onApply(result);
        setOpen(false);
        setAmount("");
    };

    return (
        <div className="relative inline-block" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                title={label}
                className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all active:scale-95"
            >
                <Calculator className="w-3.5 h-3.5" />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -6 }}
                        className="absolute right-0 top-9 z-[200] w-64 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-4 space-y-3"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-white uppercase tracking-widest">Hesapla</span>
                            <button type="button" onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded-lg">
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>

                        {/* Mevcut değer */}
                        <div className="text-[11px] text-slate-500">
                            Mevcut: <span className="text-slate-300 font-bold">₺{base.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                        </div>

                        {/* Mod seçimi */}
                        <div className="grid grid-cols-5 gap-1">
                            {modes.map(m => (
                                <button key={m.key} type="button" onClick={() => setMode(m.key)}
                                    className={`flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[8px] font-bold transition-all ${
                                        mode === m.key ? "bg-primary text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"
                                    }`}>
                                    <m.icon className="w-3 h-3" />
                                    {m.label}
                                </button>
                            ))}
                        </div>

                        {/* Değer girişi */}
                        <input
                            type="text"
                            inputMode="decimal"
                            value={amount}
                            onChange={e => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
                            placeholder={mode.startsWith("pct") ? "Yüzde (örn. 18)" : "Tutar (₺)"}
                            autoFocus
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-3 text-center text-lg font-black text-white outline-none focus:border-primary/50"
                            onKeyDown={e => { if (e.key === "Enter") apply(); }}
                        />

                        {/* Sonuç önizleme */}
                        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                            <span className="text-[11px] font-bold text-emerald-400/70">Sonuç</span>
                            <span className="text-lg font-black text-emerald-400">₺{result.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                        </div>

                        <button type="button" onClick={apply}
                            className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-xs tracking-widest transition-all active:scale-95">
                            UYGULA
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
