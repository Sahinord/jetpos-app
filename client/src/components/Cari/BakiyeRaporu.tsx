"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Search, RefreshCw, Download, Filter, FileText,
    ChevronLeft, ChevronRight, DollarSign, TrendingUp, TrendingDown
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

interface BakiyeRaporuProps {
    showToast?: (message: string, type: "success" | "error" | "info" | "warning") => void;
}

interface CariBakiye {
    id: string;
    cari_kodu: string;
    unvani: string;
    vergi_dairesi: string;
    vergi_no: string;
    grup_kodu: string;
    ozel_kodu: string;
    cari_tipi: string;
    para_birimi: string;
    borc_toplami: number;
    alacak_toplami: number;
    bakiye: number;
}

export default function BakiyeRaporu({ showToast }: BakiyeRaporuProps) {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(false);
    const [cariler, setCariler] = useState<CariBakiye[]>([]);
    const [showFilters, setShowFilters] = useState(true);

    // Filtreler
    const [filters, setFilters] = useState({
        durum: "all",
        baslangicTarihi: "",
        bitisTarihi: new Date().toISOString().split('T')[0],
        cariKodu: "",
        unvani: "",
        grupKodu: "",
        ozelKodu: "",
        bakiyeDurumu: "all", // all, borclu, alacakli, sifir
        paraBirimi: "TRY",
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(25);

    // Verileri yükle
    const loadData = async () => {
        if (!currentTenant) return;

        setLoading(true);
        try {
            let query = supabase
                .from('cari_hesaplar')
                .select('id, cari_kodu, unvani, vergi_dairesi, vergi_no, grup_kodu, ozel_kodu, cari_tipi, para_birimi, borc_toplami, alacak_toplami, bakiye')
                .eq('tenant_id', currentTenant.id);

            // Filtreler
            if (filters.durum !== 'all') {
                query = query.eq('durum', filters.durum);
            }
            if (filters.cariKodu) {
                query = query.ilike('cari_kodu', `%${filters.cariKodu}%`);
            }
            if (filters.unvani) {
                query = query.ilike('unvani', `%${filters.unvani}%`);
            }
            if (filters.grupKodu) {
                query = query.eq('grup_kodu', filters.grupKodu);
            }
            if (filters.ozelKodu) {
                query = query.eq('ozel_kodu', filters.ozelKodu);
            }

            const { data, error } = await query.order('cari_kodu');

            if (error) throw error;

            // Bakiye durumu filtresi (client-side)
            let filteredData = data || [];
            if (filters.bakiyeDurumu === 'borclu') {
                filteredData = filteredData.filter(c => (c.bakiye || 0) > 0);
            } else if (filters.bakiyeDurumu === 'alacakli') {
                filteredData = filteredData.filter(c => (c.bakiye || 0) < 0);
            } else if (filters.bakiyeDurumu === 'sifir') {
                filteredData = filteredData.filter(c => Math.abs(c.bakiye || 0) < 0.01);
            }

            setCariler(filteredData);
        } catch (err: any) {
            console.error('Bakiye raporu yüklenemedi:', err);
            showToast?.("Hata: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentTenant]);

    // Pagination
    const paginatedCariler = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return cariler.slice(start, start + pageSize);
    }, [cariler, currentPage, pageSize]);

    const totalPages = Math.ceil(cariler.length / pageSize);

    // Toplamlar
    const toplamlar = useMemo(() => ({
        borc: cariler.reduce((sum, c) => sum + (c.borc_toplami || 0), 0),
        alacak: cariler.reduce((sum, c) => sum + (c.alacak_toplami || 0), 0),
        bakiye: cariler.reduce((sum, c) => sum + (c.bakiye || 0), 0),
        borcluSayisi: cariler.filter(c => (c.bakiye || 0) > 0).length,
        alacakliSayisi: cariler.filter(c => (c.bakiye || 0) < 0).length,
    }), [cariler]);

    const updateFilter = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // CSV Export
    const exportToCSV = () => {
        const headers = 'Cari Kodu;Ünvanı;Vergi Dairesi;Vergi No;Grup Kodu;Borç;Alacak;Bakiye';
        const rows = cariler.map(c =>
            `${c.cari_kodu};${c.unvani};${c.vergi_dairesi || ''};${c.vergi_no || ''};${c.grup_kodu || ''};${c.borc_toplami || 0};${c.alacak_toplami || 0};${c.bakiye || 0}`
        ).join('\n');

        const csv = `${headers}\n${rows}`;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `bakiye_raporu_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        showToast?.("Rapor Excel'e aktarıldı", "success");
    };

    return (
        <div className="h-full flex">
            {/* Sol Filtre Paneli */}
            {showFilters && (
                <div className="w-64 glass-card p-4 mr-3 flex flex-col overflow-auto">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium text-white">Filtreler</span>
                        </div>
                        <button
                            onClick={() => setFilters({
                                durum: "all",
                                baslangicTarihi: "",
                                bitisTarihi: new Date().toISOString().split('T')[0],
                                cariKodu: "",
                                unvani: "",
                                grupKodu: "",
                                ozelKodu: "",
                                bakiyeDurumu: "all",
                                paraBirimi: "TRY",
                            })}
                            className="text-xs text-secondary hover:text-white"
                        >
                            Temizle
                        </button>
                    </div>

                    <div className="space-y-4 flex-1">
                        {/* Durum */}
                        <div className="space-y-1">
                            <label className="text-xs text-secondary">Durum</label>
                            <select
                                value={filters.durum}
                                onChange={(e) => updateFilter('durum', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white text-sm"
                            >
                                <option value="all">Tümü</option>
                                <option value="Aktif">Aktif</option>
                                <option value="Pasif">Pasif</option>
                            </select>
                        </div>

                        {/* Tarih Aralığı */}
                        <div className="space-y-1">
                            <label className="text-xs text-secondary">Tarih Aralığı</label>
                            <div className="space-y-1">
                                <input
                                    type="date"
                                    value={filters.baslangicTarihi}
                                    onChange={(e) => updateFilter('baslangicTarihi', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white text-sm"
                                    placeholder="Başlangıç"
                                />
                                <input
                                    type="date"
                                    value={filters.bitisTarihi}
                                    onChange={(e) => updateFilter('bitisTarihi', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white text-sm"
                                    placeholder="Bitiş"
                                />
                            </div>
                        </div>

                        {/* Cari Kodu */}
                        <div className="space-y-1">
                            <label className="text-xs text-secondary">Cari Kodu</label>
                            <input
                                type="text"
                                value={filters.cariKodu}
                                onChange={(e) => updateFilter('cariKodu', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white text-sm"
                                placeholder="Ara..."
                            />
                        </div>

                        {/* Ünvanı */}
                        <div className="space-y-1">
                            <label className="text-xs text-secondary">Ünvanı</label>
                            <input
                                type="text"
                                value={filters.unvani}
                                onChange={(e) => updateFilter('unvani', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white text-sm"
                                placeholder="Ara..."
                            />
                        </div>

                        {/* Grup Kodu */}
                        <div className="space-y-1">
                            <label className="text-xs text-secondary">Grup Kodu</label>
                            <input
                                type="text"
                                value={filters.grupKodu}
                                onChange={(e) => updateFilter('grupKodu', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white text-sm"
                                placeholder="Ara..."
                            />
                        </div>

                        {/* Özel Kod */}
                        <div className="space-y-1">
                            <label className="text-xs text-secondary">Özel Kod</label>
                            <input
                                type="text"
                                value={filters.ozelKodu}
                                onChange={(e) => updateFilter('ozelKodu', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white text-sm"
                                placeholder="Ara..."
                            />
                        </div>

                        {/* Bakiye Durumu */}
                        <div className="space-y-1">
                            <label className="text-xs text-secondary">Bakiye Durumu</label>
                            <select
                                value={filters.bakiyeDurumu}
                                onChange={(e) => updateFilter('bakiyeDurumu', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white text-sm"
                            >
                                <option value="all">Tümü</option>
                                <option value="borclu">Borçlu</option>
                                <option value="alacakli">Alacaklı</option>
                                <option value="sifir">Sıfır Bakiye</option>
                            </select>
                        </div>

                        {/* Para Birimi */}
                        <div className="space-y-1">
                            <label className="text-xs text-secondary">Para Birimi</label>
                            <select
                                value={filters.paraBirimi}
                                onChange={(e) => updateFilter('paraBirimi', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white text-sm"
                            >
                                <option value="TRY">TRY</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                            </select>
                        </div>
                    </div>

                    {/* Ara Butonu */}
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
                    >
                        <Search className="w-4 h-4" />
                        Raporu Getir
                    </button>
                </div>
            )}

            {/* Ana İçerik */}
            <div className="flex-1 flex flex-col">
                {/* Toolbar */}
                <div className="glass-card p-3 mb-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-purple-500" />
                            <span className="text-lg font-bold text-white">Cari Bakiye Raporu</span>
                            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
                                {cariler.length} kayıt
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm ${showFilters ? 'bg-purple-500/20 border-purple-500/30 text-purple-400' : 'bg-white/5 border-white/10 text-white'
                                    }`}
                            >
                                <Filter className="w-4 h-4" />
                                <span>Filtreler</span>
                            </button>

                            <button
                                onClick={loadData}
                                disabled={loading}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>

                            <button
                                onClick={exportToCSV}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm"
                            >
                                <Download className="w-4 h-4" />
                                <span>Excel</span>
                            </button>
                        </div>
                    </div>

                    {/* Özet Kartları */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-red-400 text-xs mb-1">
                                <TrendingUp className="w-3.5 h-3.5" />
                                Toplam Borç
                            </div>
                            <div className="text-lg font-bold text-red-500 font-mono">
                                {toplamlar.borc.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </div>
                            <div className="text-xs text-red-400/60 mt-1">{toplamlar.borcluSayisi} borçlu cari</div>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-emerald-400 text-xs mb-1">
                                <TrendingDown className="w-3.5 h-3.5" />
                                Toplam Alacak
                            </div>
                            <div className="text-lg font-bold text-emerald-500 font-mono">
                                {toplamlar.alacak.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </div>
                            <div className="text-xs text-emerald-400/60 mt-1">{toplamlar.alacakliSayisi} alacaklı cari</div>
                        </div>
                        <div className={`border rounded-lg p-3 ${toplamlar.bakiye >= 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                            <div className="flex items-center gap-2 text-xs mb-1" style={{ color: toplamlar.bakiye >= 0 ? '#f87171' : '#34d399' }}>
                                <DollarSign className="w-3.5 h-3.5" />
                                Net Bakiye
                            </div>
                            <div className={`text-lg font-bold font-mono ${toplamlar.bakiye >= 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                {toplamlar.bakiye.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </div>
                        </div>
                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-purple-400 text-xs mb-1">
                                <FileText className="w-3.5 h-3.5" />
                                Toplam Cari
                            </div>
                            <div className="text-lg font-bold text-purple-500 font-mono">
                                {cariler.length}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tablo */}
                <div className="glass-card flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-white/5 sticky top-0">
                                <tr className="text-left text-secondary">
                                    <th className="px-3 py-2">Cari Kodu</th>
                                    <th className="px-3 py-2">Ünvanı</th>
                                    <th className="px-3 py-2">Vergi Dairesi</th>
                                    <th className="px-3 py-2">Vergi No</th>
                                    <th className="px-3 py-2">Grup</th>
                                    <th className="px-3 py-2 text-right">Borç</th>
                                    <th className="px-3 py-2 text-right">Alacak</th>
                                    <th className="px-3 py-2 text-right">Bakiye</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {paginatedCariler.map(cari => (
                                    <tr key={cari.id} className="hover:bg-white/[0.02]">
                                        <td className="px-3 py-2 text-white font-medium">{cari.cari_kodu}</td>
                                        <td className="px-3 py-2 text-white">{cari.unvani}</td>
                                        <td className="px-3 py-2 text-secondary">{cari.vergi_dairesi || '-'}</td>
                                        <td className="px-3 py-2 text-secondary">{cari.vergi_no || '-'}</td>
                                        <td className="px-3 py-2 text-secondary">{cari.grup_kodu || '-'}</td>
                                        <td className="px-3 py-2 text-right text-red-400 font-mono">
                                            {(cari.borc_toplami || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-3 py-2 text-right text-emerald-400 font-mono">
                                            {(cari.alacak_toplami || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className={`px-3 py-2 text-right font-mono font-bold ${(cari.bakiye || 0) > 0 ? 'text-red-500' : (cari.bakiye || 0) < 0 ? 'text-emerald-500' : 'text-secondary'
                                            }`}>
                                            {(cari.bakiye || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                                {paginatedCariler.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="text-center py-12 text-secondary">
                                            {loading ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                                    Yükleniyor...
                                                </div>
                                            ) : (
                                                'Kayıt bulunamadı'
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
                                Kayıt Sayısı: <span className="text-white font-medium">{cariler.length}</span>
                            </span>
                        </div>

                        {/* Net Bakiye */}
                        <div className="text-right">
                            <div className="text-secondary text-xs">Net Bakiye</div>
                            <div className={`text-xl font-black font-mono ${toplamlar.bakiye >= 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                {toplamlar.bakiye.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
