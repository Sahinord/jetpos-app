"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Search, RefreshCw, Download, Filter, PieChart,
    ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Users,
    ArrowUpRight, ArrowDownRight, BarChart2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

interface CariAnaliziProps {
    showToast?: (message: string, type: "success" | "error" | "info" | "warning") => void;
}

interface CariAnaliz {
    id: string;
    cari_kodu: string;
    unvani: string;
    cari_tipi: string;
    grup_kodu: string;
    bakiye: number;
    borc_toplami: number;
    alacak_toplami: number;
}

export default function CariAnalizi({ showToast }: CariAnaliziProps) {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(false);
    const [cariler, setCariler] = useState<CariAnaliz[]>([]);
    const [showFilters, setShowFilters] = useState(true);
    const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

    // Filtreler
    const [filters, setFilters] = useState({
        cariTipi: "all",
        bakiyeDurumu: "all",
        grupKodu: "",
        siralama: "bakiye_desc",
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(25);

    // Verileri yükle
    const loadData = async () => {
        if (!currentTenant) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('cari_hesaplar')
                .select('id, cari_kodu, unvani, cari_tipi, grup_kodu, bakiye, borc_toplami, alacak_toplami')
                .eq('tenant_id', currentTenant.id);

            if (error) throw error;
            setCariler(data || []);
        } catch (err: any) {
            console.error('Cari analizi yüklenemedi:', err);
            showToast?.("Hata: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentTenant]);

    // Filtrelenmiş ve sıralanmış cariler
    const filteredCariler = useMemo(() => {
        let result = [...cariler];

        // Cari tipi filtresi
        if (filters.cariTipi !== 'all') {
            result = result.filter(c => c.cari_tipi === filters.cariTipi);
        }

        // Bakiye durumu filtresi
        if (filters.bakiyeDurumu === 'borclu') {
            result = result.filter(c => (c.bakiye || 0) > 0);
        } else if (filters.bakiyeDurumu === 'alacakli') {
            result = result.filter(c => (c.bakiye || 0) < 0);
        } else if (filters.bakiyeDurumu === 'sifir') {
            result = result.filter(c => Math.abs(c.bakiye || 0) < 0.01);
        }

        // Grup filtresi
        if (filters.grupKodu) {
            result = result.filter(c => c.grup_kodu?.toLowerCase().includes(filters.grupKodu.toLowerCase()));
        }

        // Sıralama
        switch (filters.siralama) {
            case 'bakiye_desc':
                result.sort((a, b) => (b.bakiye || 0) - (a.bakiye || 0));
                break;
            case 'bakiye_asc':
                result.sort((a, b) => (a.bakiye || 0) - (b.bakiye || 0));
                break;
            case 'unvan':
                result.sort((a, b) => (a.unvani || '').localeCompare(b.unvani || ''));
                break;
            case 'kod':
                result.sort((a, b) => (a.cari_kodu || '').localeCompare(b.cari_kodu || ''));
                break;
        }

        return result;
    }, [cariler, filters]);

    // Pagination
    const paginatedCariler = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredCariler.slice(start, start + pageSize);
    }, [filteredCariler, currentPage, pageSize]);

    const totalPages = Math.ceil(filteredCariler.length / pageSize);

    // İstatistikler
    const stats = useMemo(() => {
        const toplamCari = cariler.length;
        const borcluCari = cariler.filter(c => (c.bakiye || 0) > 0);
        const alacakliCari = cariler.filter(c => (c.bakiye || 0) < 0);
        const sifirBakiye = cariler.filter(c => Math.abs(c.bakiye || 0) < 0.01);

        const toplamBorc = cariler.reduce((sum, c) => sum + Math.max(0, c.bakiye || 0), 0);
        const toplamAlacak = cariler.reduce((sum, c) => sum + Math.abs(Math.min(0, c.bakiye || 0)), 0);

        // En borçlu 5 cari
        const enBorclu = [...cariler]
            .filter(c => (c.bakiye || 0) > 0)
            .sort((a, b) => (b.bakiye || 0) - (a.bakiye || 0))
            .slice(0, 5);

        // En alacaklı 5 cari
        const enAlacakli = [...cariler]
            .filter(c => (c.bakiye || 0) < 0)
            .sort((a, b) => (a.bakiye || 0) - (b.bakiye || 0))
            .slice(0, 5);

        return {
            toplamCari,
            borcluSayisi: borcluCari.length,
            alacakliSayisi: alacakliCari.length,
            sifirSayisi: sifirBakiye.length,
            toplamBorc,
            toplamAlacak,
            netBakiye: toplamBorc - toplamAlacak,
            enBorclu,
            enAlacakli,
        };
    }, [cariler]);

    const updateFilter = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // CSV Export
    const exportToCSV = () => {
        const headers = 'Cari Kodu;Ünvanı;Tipi;Grup;Borç;Alacak;Bakiye';
        const rows = filteredCariler.map(c =>
            `${c.cari_kodu};${c.unvani};${c.cari_tipi || ''};${c.grup_kodu || ''};${c.borc_toplami || 0};${c.alacak_toplami || 0};${c.bakiye || 0}`
        ).join('\n');

        const csv = `${headers}\n${rows}`;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `cari_analizi_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        showToast?.("Excel'e aktarıldı", "success");
    };

    return (
        <div className="h-full flex">
            {/* Sol Filtre Paneli */}
            {showFilters && (
                <div className="w-64 glass-card p-4 mr-3 flex flex-col overflow-auto">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-pink-500" />
                            <span className="text-sm font-medium text-white">Filtreler</span>
                        </div>
                    </div>

                    <div className="space-y-4 flex-1">
                        {/* Cari Tipi */}
                        <div className="space-y-1">
                            <label className="text-xs text-secondary">Cari Tipi</label>
                            <select
                                value={filters.cariTipi}
                                onChange={(e) => updateFilter('cariTipi', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white text-sm"
                            >
                                <option value="all">Tümü</option>
                                <option value="Müşteri">Müşteri</option>
                                <option value="Tedarikçi">Tedarikçi</option>
                                <option value="Personel">Personel</option>
                            </select>
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

                        {/* Sıralama */}
                        <div className="space-y-1">
                            <label className="text-xs text-secondary">Sıralama</label>
                            <select
                                value={filters.siralama}
                                onChange={(e) => updateFilter('siralama', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white text-sm"
                            >
                                <option value="bakiye_desc">Bakiye (Yüksek→Düşük)</option>
                                <option value="bakiye_asc">Bakiye (Düşük→Yüksek)</option>
                                <option value="unvan">Ünvan (A-Z)</option>
                                <option value="kod">Cari Kodu</option>
                            </select>
                        </div>
                    </div>

                    {/* Ara Butonu */}
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
                    >
                        <Search className="w-4 h-4" />
                        Analiz Et
                    </button>
                </div>
            )}

            {/* Ana İçerik */}
            <div className="flex-1 flex flex-col">
                {/* Toolbar */}
                <div className="glass-card p-3 mb-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-pink-500" />
                            <span className="text-lg font-bold text-white">Cari Analizi</span>
                            <span className="text-xs bg-pink-500/20 text-pink-400 px-2 py-0.5 rounded">
                                {filteredCariler.length} cari
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`px-3 py-1.5 text-sm ${viewMode === 'table' ? 'bg-pink-600 text-white' : 'text-secondary'}`}
                                >
                                    <BarChart2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('chart')}
                                    className={`px-3 py-1.5 text-sm ${viewMode === 'chart' ? 'bg-pink-600 text-white' : 'text-secondary'}`}
                                >
                                    <PieChart className="w-4 h-4" />
                                </button>
                            </div>

                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm ${showFilters ? 'bg-pink-500/20 border-pink-500/30 text-pink-400' : 'bg-white/5 border-white/10 text-white'
                                    }`}
                            >
                                <Filter className="w-4 h-4" />
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
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-blue-400 text-xs mb-1">
                                <Users className="w-3.5 h-3.5" />
                                Toplam Cari
                            </div>
                            <div className="text-xl font-bold text-white">{stats.toplamCari}</div>
                            <div className="text-xs text-secondary mt-1">
                                {stats.borcluSayisi} borçlu, {stats.alacakliSayisi} alacaklı
                            </div>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-red-400 text-xs mb-1">
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                Toplam Alacaklarımız
                            </div>
                            <div className="text-lg font-bold text-red-500 font-mono">
                                {stats.toplamBorc.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </div>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-emerald-400 text-xs mb-1">
                                <ArrowDownRight className="w-3.5 h-3.5" />
                                Toplam Borçlarımız
                            </div>
                            <div className="text-lg font-bold text-emerald-500 font-mono">
                                {stats.toplamAlacak.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </div>
                        </div>
                        <div className={`border rounded-lg p-3 ${stats.netBakiye >= 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                            <div className={`flex items-center gap-2 text-xs mb-1 ${stats.netBakiye >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                <TrendingUp className="w-3.5 h-3.5" />
                                Net Bakiye
                            </div>
                            <div className={`text-lg font-bold font-mono ${stats.netBakiye >= 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                {stats.netBakiye.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </div>
                        </div>
                    </div>
                </div>

                {viewMode === 'chart' ? (
                    /* Chart View - En Borçlu/Alacaklı */
                    <div className="grid grid-cols-2 gap-3 flex-1">
                        {/* En Borçlu 5 */}
                        <div className="glass-card p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="w-5 h-5 text-red-500" />
                                <span className="font-bold text-white">En Borçlu 5 Cari</span>
                            </div>
                            <div className="space-y-3">
                                {stats.enBorclu.map((cari, idx) => (
                                    <div key={cari.id} className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-xs font-bold">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-white text-sm font-medium truncate">{cari.unvani}</div>
                                            <div className="text-xs text-secondary">{cari.cari_kodu}</div>
                                        </div>
                                        <div className="text-red-500 font-mono font-bold">
                                            {(cari.bakiye || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                        </div>
                                    </div>
                                ))}
                                {stats.enBorclu.length === 0 && (
                                    <div className="text-center py-4 text-secondary">Borçlu cari yok</div>
                                )}
                            </div>
                        </div>

                        {/* En Alacaklı 5 */}
                        <div className="glass-card p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingDown className="w-5 h-5 text-emerald-500" />
                                <span className="font-bold text-white">En Alacaklı 5 Cari</span>
                            </div>
                            <div className="space-y-3">
                                {stats.enAlacakli.map((cari, idx) => (
                                    <div key={cari.id} className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-white text-sm font-medium truncate">{cari.unvani}</div>
                                            <div className="text-xs text-secondary">{cari.cari_kodu}</div>
                                        </div>
                                        <div className="text-emerald-500 font-mono font-bold">
                                            {Math.abs(cari.bakiye || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                        </div>
                                    </div>
                                ))}
                                {stats.enAlacakli.length === 0 && (
                                    <div className="text-center py-4 text-secondary">Alacaklı cari yok</div>
                                )}
                            </div>
                        </div>

                        {/* Dağılım */}
                        <div className="glass-card p-4 col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <PieChart className="w-5 h-5 text-pink-500" />
                                <span className="font-bold text-white">Bakiye Dağılımı</span>
                            </div>
                            <div className="flex items-center justify-around">
                                <div className="text-center">
                                    <div className="w-24 h-24 rounded-full bg-red-500/20 border-4 border-red-500 flex items-center justify-center mb-2">
                                        <span className="text-red-500 font-bold text-xl">{stats.borcluSayisi}</span>
                                    </div>
                                    <div className="text-white font-medium">Borçlu</div>
                                    <div className="text-secondary text-sm">
                                        %{stats.toplamCari ? ((stats.borcluSayisi / stats.toplamCari) * 100).toFixed(1) : 0}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-4 border-emerald-500 flex items-center justify-center mb-2">
                                        <span className="text-emerald-500 font-bold text-xl">{stats.alacakliSayisi}</span>
                                    </div>
                                    <div className="text-white font-medium">Alacaklı</div>
                                    <div className="text-secondary text-sm">
                                        %{stats.toplamCari ? ((stats.alacakliSayisi / stats.toplamCari) * 100).toFixed(1) : 0}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="w-24 h-24 rounded-full bg-gray-500/20 border-4 border-gray-500 flex items-center justify-center mb-2">
                                        <span className="text-gray-400 font-bold text-xl">{stats.sifirSayisi}</span>
                                    </div>
                                    <div className="text-white font-medium">Sıfır Bakiye</div>
                                    <div className="text-secondary text-sm">
                                        %{stats.toplamCari ? ((stats.sifirSayisi / stats.toplamCari) * 100).toFixed(1) : 0}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Table View */
                    <>
                        <div className="glass-card flex-1 flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-white/5 sticky top-0">
                                        <tr className="text-left text-secondary">
                                            <th className="px-3 py-2 w-10">#</th>
                                            <th className="px-3 py-2">Cari Kodu</th>
                                            <th className="px-3 py-2">Ünvanı</th>
                                            <th className="px-3 py-2">Tipi</th>
                                            <th className="px-3 py-2">Grup</th>
                                            <th className="px-3 py-2 text-right">Bakiye</th>
                                            <th className="px-3 py-2 w-48">Görsel</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {paginatedCariler.map((cari, idx) => {
                                            const bakiye = cari.bakiye || 0;
                                            const maxBakiye = Math.max(...cariler.map(c => Math.abs(c.bakiye || 0)), 1);
                                            const barWidth = (Math.abs(bakiye) / maxBakiye) * 100;

                                            return (
                                                <tr key={cari.id} className="hover:bg-white/[0.02]">
                                                    <td className="px-3 py-2 text-secondary">{(currentPage - 1) * pageSize + idx + 1}</td>
                                                    <td className="px-3 py-2 text-white font-medium">{cari.cari_kodu}</td>
                                                    <td className="px-3 py-2 text-white">{cari.unvani}</td>
                                                    <td className="px-3 py-2 text-secondary">{cari.cari_tipi || '-'}</td>
                                                    <td className="px-3 py-2 text-secondary">{cari.grup_kodu || '-'}</td>
                                                    <td className={`px-3 py-2 text-right font-mono font-bold ${bakiye > 0 ? 'text-red-500' : bakiye < 0 ? 'text-emerald-500' : 'text-secondary'
                                                        }`}>
                                                        {bakiye.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="h-4 bg-white/5 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${bakiye > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                                style={{ width: `${barWidth}%` }}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {paginatedCariler.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="text-center py-12 text-secondary">
                                                    {loading ? 'Yükleniyor...' : 'Cari bulunamadı'}
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
                                </div>

                                <div className="text-sm text-secondary">
                                    Toplam: <span className="text-white font-medium">{filteredCariler.length}</span> cari
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
