"use client";

import { useState, useEffect } from "react";
import { Search, X, List, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

interface CariSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (cari: any) => void;
    title?: string;
}

export default function CariSearchModal({ isOpen, onClose, onSelect, title = "Cari Seçimi" }: CariSearchModalProps) {
    const { currentTenant } = useTenant();
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [cariler, setCariler] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen && currentTenant) {
            loadCariler();
        }
    }, [isOpen, currentTenant]);

    const loadCariler = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('cari_hesaplar')
                .select('*')
                .eq('tenant_id', currentTenant?.id)
                .order('unvani', { ascending: true });

            if (searchTerm) {
                query = query.or(`cari_kodu.ilike.%${searchTerm}%,unvani.ilike.%${searchTerm}%`);
            }

            const { data, error } = await query.limit(50);

            if (error) throw error;
            setCariler(data || []);
        } catch (err) {
            console.error("Cari listesi yüklenemedi:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (isOpen) loadCariler();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-[10vh]" onClick={onClose}>
            <div className="bg-[#0d1b2e] border border-white/10 rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[70vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header + Search (kompakt) */}
                <div className="p-3 border-b border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" />
                            <h2 className="text-white font-semibold text-sm">{title}</h2>
                        </div>
                        <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-secondary hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Kod veya ünvan ile ara…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#0a1628] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:border-primary outline-none transition-all"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-auto p-1.5">
                    {loading && cariler.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2 text-secondary">
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs">Yükleniyor…</span>
                        </div>
                    ) : cariler.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-secondary">
                            <List className="w-9 h-9 opacity-10 mb-1.5" />
                            <span className="text-xs">Cari bulunamadı</span>
                        </div>
                    ) : (
                        cariler.map((cari) => (
                            <button
                                key={cari.id}
                                onClick={() => onSelect(cari)}
                                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/10 text-left transition-colors group"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm text-white font-medium truncate group-hover:text-primary transition-colors">{cari.unvani || "—"}</p>
                                    <p className="text-[11px] text-secondary font-mono truncate">
                                        {cari.cari_kodu}{cari.vergi_no ? ` · ${cari.vergi_no}` : ""}
                                    </p>
                                </div>
                                <span className={`text-xs font-mono font-bold flex-shrink-0 ${(cari.bakiye || 0) >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                                    {Number(cari.bakiye || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                                </span>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
