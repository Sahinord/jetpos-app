"use client";

import { FileClock, RotateCcw, Trash2 } from "lucide-react";

// "Kaydedilmemiş taslak" geri yükleme popup'ı — kaydetmeden çıkılan formlar için.
export default function DraftRestoreModal({
    open,
    onRestore,
    onDiscard,
    title = "Kaydedilmemiş Taslak",
    description = "Önceki çalışmandan kaydedilmemiş bir taslak var. Geri yüklemek ister misin?",
}: {
    open: boolean;
    onRestore: () => void;
    onDiscard: () => void;
    title?: string;
    description?: string;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-3xl border border-amber-500/30 bg-slate-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-7 flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
                        <FileClock size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white">{title}</h3>
                        <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{description}</p>
                    </div>
                    <div className="w-full grid grid-cols-2 gap-3 mt-1">
                        <button
                            onClick={onDiscard}
                            className="py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            <Trash2 size={16} /> Sil, Yeni Başla
                        </button>
                        <button
                            onClick={onRestore}
                            className="py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            <RotateCcw size={16} /> Geri Yükle
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
