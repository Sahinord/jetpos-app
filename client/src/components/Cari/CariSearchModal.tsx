"use client";

import { useState, useEffect } from "react";
import { Search, X, List, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

interface CariSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (cari: any) => void;
}

export default function CariSearchModal({ isOpen, onClose, onSelect }: CariSearchModalProps) {
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-[#0d1b2e] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        <h2 className="text-white font-bold text-lg tracking-tight">Cari Seçimi</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-secondary hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-white/10 bg-white/[0.02]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Cari kodu veya ünvanı ile ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#0a1628] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-auto">
                    {loading && cariler.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-secondary">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm font-medium">Yükleniyor...</span>
                        </div>
                    ) : cariler.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-secondary">
                            <List className="w-12 h-12 opacity-10 mb-2" />
                            <span className="text-sm">Cari bulunamadı</span>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-[#0d1b2e] shadow-sm">
                                <tr className="text-left text-secondary border-b border-white/5">
                                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Cari Kodu</th>
                                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Ünvanı</th>
                                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-right">Bakiye</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {cariler.map((cari) => (
                                    <tr 
                                        key={cari.id} 
                                        className="hover:bg-primary/10 cursor-pointer transition-colors group"
                                        onClick={() => onSelect(cari)}
                                    >
                                        <td className="px-4 py-3">
                                            <span className="text-primary font-mono font-bold group-hover:text-primary-light transition-colors">{cari.cari_kodu}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="text-white font-medium">{cari.unvani}</span>
                                                <span className="text-[10px] text-secondary">{cari.vergi_no || 'Vergi No Yok'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`font-mono font-bold ${cari.bakiye >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {Number(cari.bakiye || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-white/10 bg-white/5 flex justify-between items-center text-[10px] text-secondary font-bold uppercase tracking-widest">
                    <span>{cariler.length} kayıt listeleniyor</span>
                    <span>JetPOS Cari Sistemi</span>
                </div>
            </div>
        </div>
    );
}
