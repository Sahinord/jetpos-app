"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Search, RefreshCw, Download, Filter, Activity,
    ChevronLeft, ChevronRight, Calendar
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

interface HareketRaporuProps {
    showToast?: (message: string, type: "success" | "error" | "info" | "warning") => void;
}

interface CariHareket {
    id: string;
    hareket_tipi: string;
    tarih: string;
    vade_tarihi: string;
    belge_no: string;
    aciklama: string;
    borc: number;
    alacak: number;
    bakiye: number;
    para_birimi: string;
    created_at: string;
}

export default function HareketRaporu({ showToast }: HareketRaporuProps) {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(false);
    const [hareketler, setHareketler] = useState<CariHareket[]>([]);
    const [showFilters, setShowFilters] = useState(true);

    // Filtreler
    const [filters, setFilters] = useState({
        baslangicTarihi: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        bitisTarihi: new Date().toISOString().split('T')[0],
        cariKodu: "",
        hareketTipi: "all",
        belgeNo: "",
        paraBirimi: "TRY",
        vadeDurumu: "all",
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(50);

    // Verileri yükle
    const loadData = async () => {
        if (!currentTenant) return;

        setLoading(true);
        try {
            let query = supabase
                .from('cari_hareketler')
                .select('*')
                .eq('tenant_id', currentTenant.id)
                .order('tarih', { ascending: false });

            // Filtreler
            if (filters.baslangicTarihi) {
                query = query.gte('tarih', filters.baslangicTarihi);
            }
            if (filters.bitisTarihi) {
                query = query.lte('tarih', filters.bitisTarihi);
            }
            if (filters.hareketTipi !== 'all') {
                query = query.eq('hareket_tipi', filters.hareketTipi);
            }
            if (filters.belgeNo) {
                query = query.ilike('belge_no', `%${filters.belgeNo}%`);
            }

            const { data, error } = await query;

            if (error) throw error;
            setHareketler(data || []);
        } catch (err: any) {
            console.error('Hareket raporu yüklenemedi:', err);
            showToast?.("Hata: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentTenant]);

    // Pagination
    const paginatedHareketler = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return hareketler.slice(start, start + pageSize);
    }, [hareketler, currentPage, pageSize]);

    const totalPages = Math.ceil(hareketler.length / pageSize);

    // Toplamlar
    const toplamlar = useMemo(() => {
        let cumulativeBakiye = 0;
        const hareketlerWithBakiye = hareketler.map(h => {
            cumulativeBakiye += (h.borc || 0) - (h.alacak || 0);
            return { ...h, cumulativeBakiye };
        });

        return {
            borc: hareketler.reduce((sum, h) => sum + (h.borc || 0), 0),
            alacak: hareketler.reduce((sum, h) => sum + (h.alacak || 0), 0),
            bakiye: hareketler.reduce((sum, h) => sum + (h.borc || 0) - (h.alacak || 0), 0),
        };
    }, [hareketler]);

    const updateFilter = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Hareket tipi renkleri
    const getHareketColor = (tip: string) => {
        switch (tip) {
            case 'BORC_DEKONTU': return 'text-red-400';
            case 'ALACAK_DEKONTU': return 'text-emerald-400';
            case 'VIRMAN': return 'text-amber-400';
            case 'DEVIR': return 'text-cyan-400';
            default: return 'text-white';
        }
    };

    const getHareketLabel = (tip: string) => {
        switch (tip) {
            case 'BORC_DEKONTU': return 'Borç';
            case 'ALACAK_DEKONTU': return 'Alacak';
            case 'VIRMAN': return 'Virman';
            case 'DEVIR': return 'Devir';
            default: return tip;
        }
    };

    // CSV Export
    const exportToCSV = () => {
        const headers = 'Tarih;Belge No;Hareket Tipi;Açıklama;Borç;Alacak;Bakiye';
        const rows = hareketler.map(h =>
            `${h.tarih};${h.belge_no || ''};${getHareketLabel(h.hareket_tipi)};${h.aciklama || ''};${h.borc || 0};${h.alacak || 0};${h.bakiye || 0}`
        ).join('\n');

        const csv = `${headers}\n${rows}`;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `hareket_raporu_${new Date().toISOString().split('T')[0]}.csv`;
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
                            <Filter className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-medium text-white">Filtreler</span>
                        </div>
                        <button
                            onClick={() => setFilters({
                                baslangicTarihi: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
                                bitisTarihi: new Date().toISOString().split('T')[0],
                                cariKodu: "",
                                hareketTipi: "all",
                                belgeNo: "",
                                paraBirimi: "TRY",
                                vadeDurumu: "all",
                            })}
                            className="text-xs text-secondary hover:text-white"
                        >
                            Temizle
                        </button>
                    </div>

                    <div className="space-y-4 flex-1">
                        {/* Tarih Aralığı */}
                        <div className="space-y-1">
                            <label className="text-xs text-secondary flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Tarih Aralığı
                            </label>
                            <div className="space-y-1">
                                <input
                                    type="date"
                                    value={filters.baslangicTarihi}
                                    onChange={(e) => updateFilter('baslangicTarihi', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white text-sm"
                                />
                                <input
                                    type="date"
                                    value={filters.bitisTarihi}
                                    onChange={(e) => updateFilter('bitisTarihi', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white text-sm"
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

                        {/* Hareket Tipi */}
                        <div className="space-y-1">
                            <label className="text-xs text-secondary">Hareket Tipi</label>
                            <select
                                value={filters.hareketTipi}
                                onChange={(e) => updateFilter('hareketTipi', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white text-sm"
                            >
                                <option value="all">Tümü</option>
                                <option value="BORC_DEKONTU">Borç Dekontu</option>
                                <option value="ALACAK_DEKONTU">Alacak Dekontu</option>
                                <option value="VIRMAN">Virman</option>
                                <option value="DEVIR">Devir</option>
                            </select>
                        </div>

                        {/* Belge No */}
                        <div className="space-y-1">
                            <label className="text-xs text-secondary">Belge No</label>
                            <input
                                type="text"
                                value={filters.belgeNo}
                                onChange={(e) => updateFilter('belgeNo', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white text-sm"
                                placeholder="Ara..."
                            />
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

                        {/* Vade Durumu */}
                        <div className="space-y-1">
                            <label className="text-xs text-secondary">Vade Durumu</label>
                            <select
                                value={filters.vadeDurumu}
                                onChange={(e) => updateFilter('vadeDurumu', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white text-sm"
                            >
                                <option value="all">Tümü</option>
                                <option value="gecmis">Vadesi Geçmiş</option>
                                <option value="bugun">Bugün</option>
                                <option value="gelecek">Gelecek</option>
                            </select>
                        </div>
                    </div>

                    {/* Ara Butonu */}
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
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
                            <Activity className="w-5 h-5 text-orange-500" />
                            <span className="text-lg font-bold text-white">Cari Hareket Raporu</span>
                            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">
                                {hareketler.length} hareket
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm ${showFilters ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' : 'bg-white/5 border-white/10 text-white'
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
                </div>

                {/* Tablo */}
                <div className="glass-card flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-white/5 sticky top-0">
                                <tr className="text-left text-secondary">
                                    <th className="px-3 py-2 w-28">Tarih</th>
                                    <th className="px-3 py-2 w-32">Belge No</th>
                                    <th className="px-3 py-2 w-24">Tip</th>
                                    <th className="px-3 py-2">Açıklama</th>
                                    <th className="px-3 py-2 w-28 text-right bg-red-500/10">Borç</th>
                                    <th className="px-3 py-2 w-28 text-right bg-emerald-500/10">Alacak</th>
                                    <th className="px-3 py-2 w-32 text-right">Bakiye</th>
                                    <th className="px-3 py-2 w-28">Vade Tarihi</th>
                                    <th className="px-3 py-2 w-16">P.B.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {paginatedHareketler.map((hareket, idx) => (
                                    <tr key={hareket.id} className="hover:bg-white/[0.02]">
                                        <td className="px-3 py-2 text-white font-medium">
                                            {new Date(hareket.tarih).toLocaleDateString('tr-TR')}
                                        </td>
                                        <td className="px-3 py-2 text-secondary font-mono text-xs">
                                            {hareket.belge_no || '-'}
                                        </td>
                                        <td className="px-3 py-2">
                                            <span className={`px-2 py-0.5 rounded text-xs ${hareket.hareket_tipi === 'BORC_DEKONTU' ? 'bg-red-500/20 text-red-400' :
                                                    hareket.hareket_tipi === 'ALACAK_DEKONTU' ? 'bg-emerald-500/20 text-emerald-400' :
                                                        hareket.hareket_tipi === 'VIRMAN' ? 'bg-amber-500/20 text-amber-400' :
                                                            'bg-cyan-500/20 text-cyan-400'
                                                }`}>
                                                {getHareketLabel(hareket.hareket_tipi)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-secondary text-sm truncate max-w-xs">
                                            {hareket.aciklama || '-'}
                                        </td>
                                        <td className="px-3 py-2 text-right text-red-400 font-mono bg-red-500/5">
                                            {hareket.borc > 0 ? hareket.borc.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '-'}
                                        </td>
                                        <td className="px-3 py-2 text-right text-emerald-400 font-mono bg-emerald-500/5">
                                            {hareket.alacak > 0 ? hareket.alacak.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '-'}
                                        </td>
                                        <td className={`px-3 py-2 text-right font-mono font-bold ${hareket.bakiye > 0 ? 'text-red-500' : hareket.bakiye < 0 ? 'text-emerald-500' : 'text-secondary'
                                            }`}>
                                            {(hareket.bakiye || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-3 py-2 text-secondary">
                                            {hareket.vade_tarihi ? new Date(hareket.vade_tarihi).toLocaleDateString('tr-TR') : '-'}
                                        </td>
                                        <td className="px-3 py-2 text-secondary text-xs">
                                            {hareket.para_birimi || 'TRY'}
                                        </td>
                                    </tr>
                                ))}
                                {paginatedHareketler.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="text-center py-12 text-secondary">
                                            {loading ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                                    Yükleniyor...
                                                </div>
                                            ) : (
                                                'Hareket bulunamadı'
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
                                Kayıt Sayısı: <span className="text-white font-medium">{hareketler.length}</span>
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
                                <div className="text-secondary text-xs">Bakiye</div>
                                <div className={`text-lg font-black font-mono ${toplamlar.bakiye >= 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {toplamlar.bakiye.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
