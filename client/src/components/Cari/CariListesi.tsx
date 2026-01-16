"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Search, RefreshCw, Download, Plus, Eye, Edit, Trash2,
    Filter, SortAsc, SortDesc, ClipboardList, ChevronLeft, ChevronRight
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

interface CariListesiProps {
    showToast?: (message: string, type: "success" | "error" | "info" | "warning") => void;
}

interface CariHesap {
    id: string;
    cari_kodu: string;
    unvani: string;
    vergi_dairesi: string;
    vergi_no: string;
    durum: string;
    cari_tipi: string;
    grup_kodu: string;
    para_birimi: string;
    borc_toplami: number;
    alacak_toplami: number;
    bakiye: number;
    email: string;
    created_at: string;
}

// Gösterilebilir kolonlar
const KOLONLAR = [
    { id: 'cari_kodu', label: 'Cari Kodu', visible: true },
    { id: 'unvani', label: 'Ünvanı', visible: true },
    { id: 'vergi_no', label: 'Vergi No', visible: true },
    { id: 'vergi_dairesi', label: 'Vergi Dairesi', visible: true },
    { id: 'durum', label: 'Durum', visible: true },
    { id: 'cari_tipi', label: 'Cari Tipi', visible: false },
    { id: 'grup_kodu', label: 'Grup Kodu', visible: false },
    { id: 'para_birimi', label: 'Para Birimi', visible: false },
    { id: 'borc_toplami', label: 'Borç', visible: true },
    { id: 'alacak_toplami', label: 'Alacak', visible: true },
    { id: 'bakiye', label: 'Bakiye', visible: true },
    { id: 'email', label: 'E-posta', visible: false },
];

export default function CariListesi({ showToast }: CariListesiProps) {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(false);
    const [cariler, setCariler] = useState<CariHesap[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortColumn, setSortColumn] = useState("cari_kodu");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [visibleColumns, setVisibleColumns] = useState(KOLONLAR);
    const [showColumnSelector, setShowColumnSelector] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(25);

    // Carileri yükle
    const loadCariler = async () => {
        if (!currentTenant) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('cari_hesaplar')
                .select('*')
                .eq('tenant_id', currentTenant.id)
                .order(sortColumn, { ascending: sortDirection === 'asc' });

            if (error) throw error;
            setCariler(data || []);
        } catch (err: any) {
            console.error('Cari listesi yüklenemedi:', err);
            showToast?.("Hata: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCariler();
    }, [currentTenant, sortColumn, sortDirection]);

    // Filtrelenmiş cariler
    const filteredCariler = useMemo(() => {
        if (!searchTerm) return cariler;

        const term = searchTerm.toLowerCase();
        return cariler.filter(c =>
            c.cari_kodu?.toLowerCase().includes(term) ||
            c.unvani?.toLowerCase().includes(term) ||
            c.vergi_no?.toLowerCase().includes(term) ||
            c.email?.toLowerCase().includes(term)
        );
    }, [cariler, searchTerm]);

    // Pagination
    const paginatedCariler = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredCariler.slice(start, start + pageSize);
    }, [filteredCariler, currentPage, pageSize]);

    const totalPages = Math.ceil(filteredCariler.length / pageSize);

    // Toplamlar
    const toplamlar = useMemo(() => ({
        borc: filteredCariler.reduce((sum, c) => sum + (c.borc_toplami || 0), 0),
        alacak: filteredCariler.reduce((sum, c) => sum + (c.alacak_toplami || 0), 0),
        bakiye: filteredCariler.reduce((sum, c) => sum + (c.bakiye || 0), 0),
    }), [filteredCariler]);

    // Sıralama
    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    // Seçim
    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleAllSelection = () => {
        if (selectedIds.length === paginatedCariler.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(paginatedCariler.map(c => c.id));
        }
    };

    // Kolon görünürlük
    const toggleColumn = (id: string) => {
        setVisibleColumns(prev =>
            prev.map(col => col.id === id ? { ...col, visible: !col.visible } : col)
        );
    };

    // Silme
    const handleDelete = async (id: string) => {
        if (!confirm("Bu cariyi silmek istediğinize emin misiniz?")) return;

        try {
            const { error } = await supabase
                .from('cari_hesaplar')
                .delete()
                .eq('id', id);

            if (error) throw error;
            showToast?.("Cari silindi", "success");
            loadCariler();
        } catch (err: any) {
            showToast?.("Hata: " + err.message, "error");
        }
    };

    // CSV Export
    const exportToCSV = () => {
        const visibleCols = visibleColumns.filter(c => c.visible);
        const headers = visibleCols.map(c => c.label).join(';');
        const rows = filteredCariler.map(cari =>
            visibleCols.map(col => {
                const value = (cari as any)[col.id];
                return typeof value === 'number' ? value.toString() : (value || '');
            }).join(';')
        ).join('\n');

        const csv = `${headers}\n${rows}`;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `cari_listesi_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        showToast?.("Excel'e aktarıldı", "success");
    };

    return (
        <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="glass-card p-3 mb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-indigo-500" />
                        <span className="text-lg font-bold text-white">Cari Kartı Listesi</span>
                        <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded">
                            {filteredCariler.length} kayıt
                        </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Arama */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Ara..."
                                className="pl-9 pr-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm w-48 focus:border-indigo-500 focus:outline-none"
                            />
                        </div>

                        <button
                            onClick={() => setShowColumnSelector(!showColumnSelector)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm"
                        >
                            <Filter className="w-4 h-4" />
                            <span>Kolonlar</span>
                        </button>

                        <button
                            onClick={loadCariler}
                            disabled={loading}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            <span>Yenile</span>
                        </button>

                        <button
                            onClick={exportToCSV}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm"
                        >
                            <Download className="w-4 h-4" />
                            <span>Excel</span>
                        </button>

                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm">
                            <Plus className="w-4 h-4" />
                            <span>Yeni Cari</span>
                        </button>
                    </div>
                </div>

                {/* Kolon Seçici */}
                {showColumnSelector && (
                    <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-xs text-secondary mb-2">Görünür Kolonlar</div>
                        <div className="flex flex-wrap gap-2">
                            {visibleColumns.map(col => (
                                <label key={col.id} className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={col.visible}
                                        onChange={() => toggleColumn(col.id)}
                                        className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-indigo-600"
                                    />
                                    <span className="text-xs text-white">{col.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Tablo */}
            <div className="glass-card flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-white/5 sticky top-0">
                            <tr className="text-left">
                                <th className="px-3 py-2 w-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === paginatedCariler.length && paginatedCariler.length > 0}
                                        onChange={toggleAllSelection}
                                        className="w-4 h-4 rounded border-white/20 bg-white/5"
                                    />
                                </th>
                                {visibleColumns.filter(c => c.visible).map(col => (
                                    <th
                                        key={col.id}
                                        onClick={() => handleSort(col.id)}
                                        className="px-3 py-2 text-secondary font-medium cursor-pointer hover:text-white transition-colors"
                                    >
                                        <div className="flex items-center gap-1">
                                            {col.label}
                                            {sortColumn === col.id && (
                                                sortDirection === 'asc'
                                                    ? <SortAsc className="w-3.5 h-3.5" />
                                                    : <SortDesc className="w-3.5 h-3.5" />
                                            )}
                                        </div>
                                    </th>
                                ))}
                                <th className="px-3 py-2 w-24 text-secondary font-medium">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {paginatedCariler.map(cari => (
                                <tr
                                    key={cari.id}
                                    className={`hover:bg-white/[0.02] ${selectedIds.includes(cari.id) ? 'bg-indigo-500/10' : ''}`}
                                >
                                    <td className="px-3 py-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(cari.id)}
                                            onChange={() => toggleSelection(cari.id)}
                                            className="w-4 h-4 rounded border-white/20 bg-white/5"
                                        />
                                    </td>
                                    {visibleColumns.filter(c => c.visible).map(col => (
                                        <td key={col.id} className="px-3 py-2 text-white">
                                            {col.id === 'borc_toplami' || col.id === 'alacak_toplami' || col.id === 'bakiye' ? (
                                                <span className={`font-mono ${col.id === 'borc_toplami' ? 'text-red-400' :
                                                        col.id === 'alacak_toplami' ? 'text-emerald-400' :
                                                            (cari.bakiye || 0) >= 0 ? 'text-red-400' : 'text-emerald-400'
                                                    }`}>
                                                    {((cari as any)[col.id] || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                                </span>
                                            ) : col.id === 'durum' ? (
                                                <span className={`px-2 py-0.5 rounded text-xs ${cari.durum === 'Aktif' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {cari.durum || 'Aktif'}
                                                </span>
                                            ) : (
                                                (cari as any)[col.id] || '-'
                                            )}
                                        </td>
                                    ))}
                                    <td className="px-3 py-2">
                                        <div className="flex items-center gap-1">
                                            <button className="p-1 hover:bg-white/10 rounded text-secondary hover:text-white">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button className="p-1 hover:bg-white/10 rounded text-secondary hover:text-blue-400">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cari.id)}
                                                className="p-1 hover:bg-white/10 rounded text-secondary hover:text-red-400"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {paginatedCariler.length === 0 && (
                                <tr>
                                    <td colSpan={visibleColumns.filter(c => c.visible).length + 2} className="text-center py-12 text-secondary">
                                        {loading ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <RefreshCw className="w-5 h-5 animate-spin" />
                                                Yükleniyor...
                                            </div>
                                        ) : searchTerm ? (
                                            'Arama sonucu bulunamadı'
                                        ) : (
                                            'Henüz cari hesap eklenmemiş'
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer */}
            <div className="glass-card p-3 mt-3">
                <div className="flex items-center justify-between">
                    {/* Pagination */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-50 rounded"
                        >
                            <ChevronLeft className="w-4 h-4 text-white" />
                        </button>
                        <span className="text-sm text-secondary">
                            Sayfa <span className="text-white font-medium">{currentPage}</span> / {totalPages || 1}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-50 rounded"
                        >
                            <ChevronRight className="w-4 h-4 text-white" />
                        </button>
                        <span className="text-xs text-secondary ml-2">
                            Kayıt Sayısı: <span className="text-white font-medium">{filteredCariler.length}</span>
                        </span>
                    </div>

                    {/* Toplamlar */}
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <div className="text-secondary text-xs">Toplam Borç</div>
                            <div className="text-lg font-black text-red-500 font-mono">
                                {toplamlar.borc.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-secondary text-xs">Toplam Alacak</div>
                            <div className="text-lg font-black text-emerald-500 font-mono">
                                {toplamlar.alacak.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-secondary text-xs">Net Bakiye</div>
                            <div className={`text-lg font-black font-mono ${toplamlar.bakiye >= 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                {toplamlar.bakiye.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
