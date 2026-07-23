"use client";

import { useState, useRef, useEffect } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { suggestSalePrice } from "@/lib/calculations";

/**
 * GELİŞMİŞ Fiyat Hesaplayıcı — bir fiyat inputunun yanına icon olarak konur.
 *
 * Modalın üstündeki "Öneri" sistemiyle AYNI mantık (suggestSalePrice):
 * alış fiyatı + hedef kâr + POS/platform komisyonu + kargo + stopaj + KDV
 * → önerilen satış fiyatı. Platform-özel olduğu için her platformun kendi
 * komisyon/kargosuyla ayrı hesap yapılabilir.
 *
 * Basit %/TL popover'ı DEĞİL — kullanıcı gelişmiş sistemi istedi.
 */
export default function AdvancedPriceCalculator({
    purchasePrice,
    vatRate,
    defaults,
    onApply,
    label = "Gelişmiş fiyat hesapla",
}: {
    purchasePrice: number;
    vatRate: number;
    defaults?: { margin?: number; posCommission?: number; platformCommission?: number; shipping?: number; withholding?: number; includeVat?: boolean };
    onApply: (value: number) => void;
    label?: string;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const [margin, setMargin] = useState(String(defaults?.margin ?? 30));
    const [posCom, setPosCom] = useState(String(defaults?.posCommission ?? 0));
    const [platformCom, setPlatformCom] = useState(String(defaults?.platformCommission ?? 0));
    const [shipping, setShipping] = useState(String(defaults?.shipping ?? 0));
    const [withholding, setWithholding] = useState(String(defaults?.withholding ?? 0));
    const [includeVat, setIncludeVat] = useState(defaults?.includeVat !== false);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [open]);

    const num = (s: string) => Number(String(s).replace(",", ".")) || 0;
    const base = Number(purchasePrice) || 0;

    const result = Math.max(0, Number(suggestSalePrice(
        base,
        num(margin),
        includeVat ? (Number(vatRate) || 0) : 0,
        num(posCom),
        num(withholding),
        num(platformCom),
        num(shipping),
    ).toFixed(2)));

    const apply = () => { onApply(result); setOpen(false); };

    const field = (lbl: string, val: string, set: (v: string) => void, suffix: string) => (
        <div>
            <label className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">{lbl}</label>
            <div className="relative">
                <input
                    type="text" inputMode="decimal" value={val}
                    onChange={e => set(e.target.value.replace(/[^0-9.,]/g, ""))}
                    onFocus={e => e.target.select()}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg py-1.5 px-2 text-xs font-bold text-white outline-none focus:border-primary/50 tabular-nums"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-600 font-bold">{suffix}</span>
            </div>
        </div>
    );

    return (
        <div className="relative inline-block" ref={ref}>
            <button type="button" onClick={() => setOpen(o => !o)} title={label}
                className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all active:scale-95">
                <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -6 }}
                        className="absolute right-0 top-9 z-[200] w-72 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-4 space-y-3"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-white uppercase tracking-widest">Gelişmiş Hesap</span>
                            <button type="button" onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded-lg">
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>

                        <div className="text-[11px] text-slate-500">
                            Alış: <span className="text-slate-300 font-bold">₺{base.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {field("Hedef Kâr", margin, setMargin, "%")}
                            {field("Platform Kom.", platformCom, setPlatformCom, "%")}
                            {field("POS Kom.", posCom, setPosCom, "%")}
                            {field("Kargo", shipping, setShipping, "₺")}
                            {field("Stopaj", withholding, setWithholding, "%")}
                            <div className="flex items-end">
                                <button type="button" onClick={() => setIncludeVat(v => !v)}
                                    className="w-full flex items-center justify-between bg-slate-950 border border-white/10 rounded-lg py-1.5 px-2">
                                    <span className="text-[9px] font-bold text-slate-400">KDV %{vatRate}</span>
                                    <div className={`w-7 h-4 rounded-full relative transition-all ${includeVat ? "bg-emerald-500" : "bg-slate-700"}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${includeVat ? "right-0.5" : "left-0.5"}`} />
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                            <span className="text-[11px] font-bold text-emerald-400/70">Önerilen Fiyat</span>
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
