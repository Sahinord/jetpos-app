"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Search, RefreshCw, Download, Filter, CalendarDays,
    ChevronLeft, ChevronRight, ArrowUp, ArrowDown, TrendingUp
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

interface GunlukHareketProps {
    showToast?: (message: string, type: "success" | "error" | "info" | "warning") => void;
}

interface GunlukHareket {
    tarih: string;
    borc: number;
    alacak: number;
    islem_sayisi: number;
    hareketler: {
        id: string;
        hareket_tipi: string;
        belge_no: string;
        aciklama: string;
        borc: number;
        alacak: number;
    }[];
}

export default function GunlukHareket({ showToast }: GunlukHareketProps) {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(false);
    const [gunlukVeriler, setGunlukVeriler] = useState<GunlukHareket[]>([]);
    const [showFilters, setShowFilters] = useState(true);
    const [expandedDays, setExpandedDays] = useState<string[]>([]);

    // Filtreler
    const [filters, setFilters] = useState({
        baslangicTarihi: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        bitisTarihi: new Date().toISOString().split('T')[0],
        cariKodu: "",
        hareketTipi: "all",
        grupKodu: "",
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(15);

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

            if (filters.baslangicTarihi) {
                query = query.gte('tarih', filters.baslangicTarihi);
            }
            if (filters.bitisTarihi) {
                query = query.lte('tarih', filters.bitisTarihi);
            }
            if (filters.hareketTipi !== 'all') {
                query = query.eq('hareket_tipi', filters.hareketTipi);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Günlük olarak grupla
            const gunlukMap = new Map<string, GunlukHareket>();

            (data || []).forEach(hareket => {
                const tarih = hareket.tarih;
                if (!gunlukMap.has(tarih)) {
                    gunlukMap.set(tarih, {
                        tarih,
                        borc: 0,
                        alacak: 0,
                        islem_sayisi: 0,
                        hareketler: []
                    });
                }
                const gun = gunlukMap.get(tarih)!;
                gun.borc += hareket.borc || 0;
                gun.alacak += hareket.alacak || 0;
                gun.islem_sayisi += 1;
                gun.hareketler.push({
                    id: hareket.id,
                    hareket_tipi: hareket.hareket_tipi,
                    belge_no: hareket.belge_no,
                    aciklama: hareket.aciklama,
                    borc: hareket.borc || 0,
                    alacak: hareket.alacak || 0
                });
            });

            // Tarihe göre sırala (yeniden eskiye)
            const sortedData = Array.from(gunlukMap.values()).sort((a, b) =>
                new Date(b.tarih).getTime() - new Date(a.tarih).getTime()
            );

            setGunlukVeriler(sortedData);
        } catch (err: any) {
            console.error('Günlük hareket raporu yüklenemedi:', err);
            showToast?.("Hata: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentTenant]);

    // Pagination
    const paginatedVeriler = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return gunlukVeriler.slice(start, start + pageSize);
    }, [gunlukVeriler, currentPage, pageSize]);

    const totalPages = Math.ceil(gunlukVeriler.length / pageSize);

    // Toplamlar
    const toplamlar = useMemo(() => ({
        borc: gunlukVeriler.reduce((sum, g) => sum + g.borc, 0),
        alacak: gunlukVeriler.reduce((sum, g) => sum + g.alacak, 0),
        islem: gunlukVeriler.reduce((sum, g) => sum + g.islem_sayisi, 0),
    }), [gunlukVeriler]);

    const updateFilter = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const toggleDay = (tarih: string) => {
        setExpandedDays(prev =>
            prev.includes(tarih) ? prev.filter(t => t !== tarih) : [...prev, tarih]
        );
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('tr-TR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
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
        const headers = 'Tarih;İşlem Sayısı;Borç;Alacak;Net';
        const rows = gunlukVeriler.map(g =>
            `${g.tarih};${g.islem_sayisi};${g.borc};${g.alacak};${g.borc - g.alacak}`
        ).join('\n');

        const csv = `${headers}\n${rows}`;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `gunluk_hareket_${new Date().toISOString().split('T')[0]}.csv`;
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
                            <Filter className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium text-white">Filtreler</span>
                        </div>
                    </div>

                    <div className="space-y-4 flex-1">
                        {/* Tarih Aralığı */}
                        <div className="space-y-1">
                            <label className="text-xs text-secondary flex items-center gap-1">
                                <CalendarDays className="w-3 h-3" />
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
                    </div>

                    {/* Ara Butonu */}
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
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
                            <CalendarDays className="w-5 h-5 text-blue-500" />
                            <span className="text-lg font-bold text-white">Günlük Hareket Raporu</span>
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                                {gunlukVeriler.length} gün
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm ${showFilters ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'bg-white/5 border-white/10 text-white'
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
                    <div className="grid grid-cols-3 gap-3 mt-3">
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-blue-400 text-xs mb-1">
                                <TrendingUp className="w-3.5 h-3.5" />
                                Toplam İşlem
                            </div>
                            <div className="text-lg font-bold text-white font-mono">
                                {toplamlar.islem}
                            </div>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-red-400 text-xs mb-1">
                                <ArrowUp className="w-3.5 h-3.5" />
                                Toplam Borç
                            </div>
                            <div className="text-lg font-bold text-red-500 font-mono">
                                {toplamlar.borc.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </div>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-emerald-400 text-xs mb-1">
                                <ArrowDown className="w-3.5 h-3.5" />
                                Toplam Alacak
                            </div>
                            <div className="text-lg font-bold text-emerald-500 font-mono">
                                {toplamlar.alacak.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </div>
                        </div>
                    </div>
                </div>

                {/* Günlük Liste */}
                <div className="glass-card flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-auto p-3 space-y-2">
                        {paginatedVeriler.map(gun => (
                            <div key={gun.tarih} className="border border-white/10 rounded-lg overflow-hidden">
                                {/* Gün Başlığı */}
                                <div
                                    onClick={() => toggleDay(gun.tarih)}
                                    className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/[0.08] cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <CalendarDays className="w-5 h-5 text-blue-400" />
                                        <div>
                                            <div className="text-white font-medium">{formatDate(gun.tarih)}</div>
                                            <div className="text-xs text-secondary">{gun.islem_sayisi} işlem</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-xs text-secondary">Borç</div>
                                            <div className="text-red-400 font-mono font-bold">
                                                {gun.borc.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-secondary">Alacak</div>
                                            <div className="text-emerald-400 font-mono font-bold">
                                                {gun.alacak.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                        <div className="text-right min-w-[100px]">
                                            <div className="text-xs text-secondary">Net</div>
                                            <div className={`font-mono font-bold ${gun.borc - gun.alacak > 0 ? 'text-red-500' : 'text-emerald-500'
                                                }`}>
                                                {(gun.borc - gun.alacak).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                        <div className={`transition-transform ${expandedDays.includes(gun.tarih) ? 'rotate-180' : ''}`}>
                                            <ArrowDown className="w-4 h-4 text-secondary" />
                                        </div>
                                    </div>
                                </div>

                                {/* Günün İşlemleri */}
                                {expandedDays.includes(gun.tarih) && (
                                    <div className="border-t border-white/10">
                                        <table className="w-full text-sm">
                                            <thead className="bg-white/[0.02]">
                                                <tr className="text-left text-secondary text-xs">
                                                    <th className="px-3 py-2">Tip</th>
                                                    <th className="px-3 py-2">Belge No</th>
                                                    <th className="px-3 py-2">Açıklama</th>
                                                    <th className="px-3 py-2 text-right">Borç</th>
                                                    <th className="px-3 py-2 text-right">Alacak</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {gun.hareketler.map(h => (
                                                    <tr key={h.id} className="hover:bg-white/[0.02]">
                                                        <td className="px-3 py-2">
                                                            <span className={`px-1.5 py-0.5 rounded text-xs ${h.hareket_tipi === 'BORC_DEKONTU' ? 'bg-red-500/20 text-red-400' :
                                                                    h.hareket_tipi === 'ALACAK_DEKONTU' ? 'bg-emerald-500/20 text-emerald-400' :
                                                                        h.hareket_tipi === 'VIRMAN' ? 'bg-amber-500/20 text-amber-400' :
                                                                            'bg-cyan-500/20 text-cyan-400'
                                                                }`}>
                                                                {getHareketLabel(h.hareket_tipi)}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2 text-secondary font-mono text-xs">{h.belge_no || '-'}</td>
                                                        <td className="px-3 py-2 text-white text-xs">{h.aciklama || '-'}</td>
                                                        <td className="px-3 py-2 text-right text-red-400 font-mono">
                                                            {h.borc > 0 ? h.borc.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '-'}
                                                        </td>
                                                        <td className="px-3 py-2 text-right text-emerald-400 font-mono">
                                                            {h.alacak > 0 ? h.alacak.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ))}
                        {paginatedVeriler.length === 0 && (
                            <div className="text-center py-12 text-secondary">
                                {loading ? 'Yükleniyor...' : 'Hareket bulunamadı'}
                            </div>
                        )}
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
                            <span className="text-white font-medium">{gunlukVeriler.length}</span> gün,
                            <span className="text-white font-medium ml-1">{toplamlar.islem}</span> işlem
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
