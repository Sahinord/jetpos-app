"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
    Search, RefreshCw, Download, Filter, FileCheck,
    Printer, Mail, ChevronLeft, ChevronRight, Calendar, Building
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

interface MutabakatRaporuProps {
    showToast?: (message: string, type: "success" | "error" | "info" | "warning") => void;
}

interface CariMutabakat {
    id: string;
    cari_kodu: string;
    unvani: string;
    vergi_dairesi: string;
    vergi_no: string;
    email: string;
    borc_toplami: number;
    alacak_toplami: number;
    bakiye: number;
}

export default function MutabakatRaporu({ showToast }: MutabakatRaporuProps) {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(false);
    const [cariler, setCariler] = useState<CariMutabakat[]>([]);
    const [showFilters, setShowFilters] = useState(true);
    const [selectedCari, setSelectedCari] = useState<CariMutabakat | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    // Filtreler
    const [filters, setFilters] = useState({
        tarih: new Date().toISOString().split('T')[0],
        cariKodu: "",
        unvani: "",
        bakiyeTipi: "all", // all, borclu, alacakli
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
                .select('id, cari_kodu, unvani, vergi_dairesi, vergi_no, email, borc_toplami, alacak_toplami, bakiye')
                .eq('tenant_id', currentTenant.id)
                .order('unvani');

            if (filters.cariKodu) {
                query = query.ilike('cari_kodu', `%${filters.cariKodu}%`);
            }
            if (filters.unvani) {
                query = query.ilike('unvani', `%${filters.unvani}%`);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Bakiye filtresi
            let filteredData = data || [];
            if (filters.bakiyeTipi === 'borclu') {
                filteredData = filteredData.filter(c => (c.bakiye || 0) > 0);
            } else if (filters.bakiyeTipi === 'alacakli') {
                filteredData = filteredData.filter(c => (c.bakiye || 0) < 0);
            }

            setCariler(filteredData);
        } catch (err: any) {
            console.error('Mutabakat raporu yüklenemedi:', err);
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

    const updateFilter = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Mutabakat mektubu yazdır
    const handlePrint = () => {
        if (!selectedCari) {
            showToast?.("Lütfen bir cari seçin", "warning");
            return;
        }
        setShowPreview(true);
    };

    const doPrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Mutabakat Mektubu - ${selectedCari?.unvani}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                        .company { font-size: 18px; color: #666; }
                        .content { line-height: 1.8; }
                        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        .table th, .table td { border: 1px solid #333; padding: 10px; text-align: left; }
                        .table th { background: #f0f0f0; }
                        .amount { text-align: right; font-weight: bold; }
                        .signature { margin-top: 50px; display: flex; justify-content: space-between; }
                        .sig-box { width: 200px; text-align: center; }
                        .sig-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 5px; }
                        .checkbox { margin: 20px 0; }
                        .checkbox-item { margin: 10px 0; }
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    // CSV Export
    const exportToCSV = () => {
        const headers = 'Cari Kodu;Ünvanı;Vergi No;E-posta;Borç;Alacak;Bakiye';
        const rows = cariler.map(c =>
            `${c.cari_kodu};${c.unvani};${c.vergi_no || ''};${c.email || ''};${c.borc_toplami || 0};${c.alacak_toplami || 0};${c.bakiye || 0}`
        ).join('\n');

        const csv = `${headers}\n${rows}`;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `mutabakat_listesi_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        showToast?.("Excel'e aktarıldı", "success");
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    return (
        <div className="h-full flex">
            {/* Sol Filtre Paneli */}
            {showFilters && (
                <div className="w-64 glass-card p-4 mr-3 flex flex-col overflow-auto">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-teal-500" />
                            <span className="text-sm font-medium text-white">Filtreler</span>
                        </div>
                    </div>

                    <div className="space-y-4 flex-1">
                        {/* Tarih */}
                        <div className="space-y-1">
                            <label className="text-xs text-secondary flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Mutabakat Tarihi
                            </label>
                            <input
                                type="date"
                                value={filters.tarih}
                                onChange={(e) => updateFilter('tarih', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white text-sm"
                            />
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

                        {/* Bakiye Tipi */}
                        <div className="space-y-1">
                            <label className="text-xs text-secondary">Bakiye Tipi</label>
                            <select
                                value={filters.bakiyeTipi}
                                onChange={(e) => updateFilter('bakiyeTipi', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white text-sm"
                            >
                                <option value="all">Tümü</option>
                                <option value="borclu">Borçlu Cariler</option>
                                <option value="alacakli">Alacaklı Cariler</option>
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
                        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
                    >
                        <Search className="w-4 h-4" />
                        Listele
                    </button>
                </div>
            )}

            {/* Ana İçerik */}
            <div className="flex-1 flex flex-col">
                {/* Toolbar */}
                <div className="glass-card p-3 mb-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                            <FileCheck className="w-5 h-5 text-teal-500" />
                            <span className="text-lg font-bold text-white">Mutabakat Raporu</span>
                            <span className="text-xs bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded">
                                {cariler.length} cari
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm ${showFilters ? 'bg-teal-500/20 border-teal-500/30 text-teal-400' : 'bg-white/5 border-white/10 text-white'
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
                                onClick={handlePrint}
                                disabled={!selectedCari}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg text-sm"
                            >
                                <Printer className="w-4 h-4" />
                                <span>Mektup Yazdır</span>
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

                    {selectedCari && (
                        <div className="mt-3 p-3 bg-teal-500/10 border border-teal-500/30 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Building className="w-5 h-5 text-teal-400" />
                                    <div>
                                        <div className="text-white font-medium">{selectedCari.unvani}</div>
                                        <div className="text-teal-400 text-xs">{selectedCari.cari_kodu}</div>
                                    </div>
                                </div>
                                <div className={`text-lg font-bold font-mono ${(selectedCari.bakiye || 0) > 0 ? 'text-red-500' : 'text-emerald-500'
                                    }`}>
                                    {(selectedCari.bakiye || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                    <span className="text-xs ml-2 font-normal">
                                        {(selectedCari.bakiye || 0) > 0 ? 'BORÇLU' : 'ALACAKLI'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tablo */}
                <div className="glass-card flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-white/5 sticky top-0">
                                <tr className="text-left text-secondary">
                                    <th className="px-3 py-2 w-10"></th>
                                    <th className="px-3 py-2">Cari Kodu</th>
                                    <th className="px-3 py-2">Ünvanı</th>
                                    <th className="px-3 py-2">Vergi No</th>
                                    <th className="px-3 py-2">E-posta</th>
                                    <th className="px-3 py-2 text-right">Borç</th>
                                    <th className="px-3 py-2 text-right">Alacak</th>
                                    <th className="px-3 py-2 text-right">Bakiye</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {paginatedCariler.map(cari => (
                                    <tr
                                        key={cari.id}
                                        onClick={() => setSelectedCari(cari)}
                                        className={`hover:bg-white/[0.02] cursor-pointer ${selectedCari?.id === cari.id ? 'bg-teal-500/10' : ''
                                            }`}
                                    >
                                        <td className="px-3 py-2">
                                            <input
                                                type="radio"
                                                checked={selectedCari?.id === cari.id}
                                                onChange={() => setSelectedCari(cari)}
                                                className="w-4 h-4"
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-white font-medium">{cari.cari_kodu}</td>
                                        <td className="px-3 py-2 text-white">{cari.unvani}</td>
                                        <td className="px-3 py-2 text-secondary">{cari.vergi_no || '-'}</td>
                                        <td className="px-3 py-2 text-secondary">{cari.email || '-'}</td>
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
                            Cari seçin ve <span className="text-teal-400">Mektup Yazdır</span> butonuna basın
                        </div>
                    </div>
                </div>
            </div>

            {/* Mutabakat Mektubu Preview Modal */}
            {showPreview && selectedCari && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
                        <div className="p-4 border-b flex items-center justify-between">
                            <span className="font-bold text-gray-800">Mutabakat Mektubu Önizleme</span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={doPrint}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-sm"
                                >
                                    <Printer className="w-4 h-4" />
                                    Yazdır
                                </button>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm"
                                >
                                    Kapat
                                </button>
                            </div>
                        </div>
                        <div ref={printRef} className="p-8 text-gray-800">
                            <div className="text-center mb-8">
                                <div className="text-2xl font-bold mb-2">MUTABAKAT MEKTUBU</div>
                                <div className="text-gray-600">Şirket</div>
                            </div>

                            <div className="mb-6">
                                <div className="font-bold text-lg mb-2">Sayın: {selectedCari.unvani}</div>
                                <div className="text-gray-600">Tarih: {formatDate(filters.tarih)}</div>
                            </div>

                            <p className="mb-6 leading-relaxed">
                                Kayıtlarımıza göre <strong>{formatDate(filters.tarih)}</strong> tarihi itibariyle
                                hesabınızın bakiyesi aşağıdaki gibidir:
                            </p>

                            <table className="w-full border-collapse mb-6">
                                <tbody>
                                    <tr className="border-b">
                                        <td className="py-3 text-gray-600">Borç Toplamı</td>
                                        <td className="py-3 text-right font-bold text-red-600">
                                            {(selectedCari.borc_toplami || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                        </td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-3 text-gray-600">Alacak Toplamı</td>
                                        <td className="py-3 text-right font-bold text-green-600">
                                            {(selectedCari.alacak_toplami || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                        </td>
                                    </tr>
                                    <tr className="bg-gray-100">
                                        <td className="py-3 font-bold">NET BAKİYE</td>
                                        <td className={`py-3 text-right font-bold text-xl ${(selectedCari.bakiye || 0) > 0 ? 'text-red-600' : 'text-green-600'
                                            }`}>
                                            {Math.abs(selectedCari.bakiye || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                            <span className="text-sm ml-2">
                                                ({(selectedCari.bakiye || 0) > 0 ? 'Bize Borçlusunuz' : 'Size Borçluyuz'})
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <p className="mb-6">
                                Yukarıdaki bakiyenin kayıtlarınızla uyumlu olup olmadığını en geç <strong>7 gün içinde</strong> tarafımıza
                                bildirmenizi rica ederiz.
                            </p>

                            <div className="space-y-3 mb-8 bg-gray-50 p-4 rounded">
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 border-2 border-gray-400 rounded"></div>
                                    <span>Kayıtlarımızla uyumludur</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 border-2 border-gray-400 rounded"></div>
                                    <span>Kayıtlarımızla uyumlu değildir (Fark: _______________ TL)</span>
                                </div>
                            </div>

                            <div className="flex justify-between mt-12">
                                <div className="text-center">
                                    <div className="border-t border-gray-400 w-48 pt-2">İmza</div>
                                </div>
                                <div className="text-center">
                                    <div className="border-t border-gray-400 w-48 pt-2">Kaşe</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
