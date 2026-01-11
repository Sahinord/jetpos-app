"use client";

import { useState, useMemo } from "react";
import {
    Search,
    Edit2,
    Trash2,
    Plus,
    Barcode,
    FolderTree,
    Download,
    Upload,
    FileSpreadsheet,
    Calculator,
    ArrowUpDown,
    Filter,
    MoreHorizontal,
    Package
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { exportToExcel, importFromExcel } from "@/lib/excel";

export default function ProductTable({ products, onEdit, onDelete, onAdd, onManageCategories, onBulkImport, onClearAll, onToggleAllCampaign, campaignRate, hideFilters = false, limit }: any) {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all"); // all, active, passive, campaign
    const [sortBy, setSortBy] = useState("name-asc"); // name-asc, name-desc, stock-asc, stock-desc, price-desc
    const [previewCampaign, setPreviewCampaign] = useState(false);
    const [isRateModalOpen, setIsRateModalOpen] = useState(false);
    const [tempRate, setTempRate] = useState("15");

    const anyInCampaign = useMemo(() => products.some((p: any) => p.is_campaign), [products]);

    // Optimized Search & Filter & Sort Logic
    const sortedAndFilteredProducts = useMemo(() => {
        let result = products.filter((p: any) => {
            const searchLower = search.toLocaleLowerCase('tr-TR');
            const nameMatch = p.name?.toLocaleLowerCase('tr-TR').includes(searchLower);
            const barcodeMatch = p.barcode?.toLocaleLowerCase('tr-TR').includes(searchLower);

            // Eğer tam barkod eşleşmesi varsa (okuyucu kullanıldığında) sadece o ürünleri göster
            if (search.length >= 3 && p.barcode?.toLocaleLowerCase('tr-TR') === searchLower) return true;

            const matchesSearch = nameMatch || barcodeMatch;

            const status = p.status || (p.is_active === false ? "passive" : "active");
            const matchesFilter =
                filter === "all" ? true :
                    filter === "active" ? status === "active" :
                        filter === "passive" ? status === "passive" :
                            filter === "pending" ? status === "pending" :
                                filter === "campaign" ? p.is_campaign === true : true;

            return matchesSearch && matchesFilter;
        });

        // Sorting
        const sorted = result.sort((a: any, b: any) => {
            switch (sortBy) {
                case "name-asc": return a.name.localeCompare(b.name);
                case "name-desc": return b.name.localeCompare(a.name);
                case "stock-asc": return a.stock_quantity - b.stock_quantity;
                case "stock-desc": return b.stock_quantity - a.stock_quantity;
                case "price-desc": return b.sale_price - a.sale_price;
                case "price-asc": return a.sale_price - b.sale_price;
                default: return 0;
            }
        });

        return sorted;
    }, [products, search, filter, sortBy]);

    // Pagination / Virtualization Logic
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    // Reset page on filter change
    useMemo(() => setPage(1), [search, filter, sortBy]);

    const paginatedProducts = useMemo(() => {
        return sortedAndFilteredProducts.slice(0, page * ITEMS_PER_PAGE);
    }, [sortedAndFilteredProducts, page]);

    const hasMore = paginatedProducts.length < sortedAndFilteredProducts.length;

    const handleExport = () => {
        exportToExcel(products, "KardeslerKasap_UrunListesi");
    };

    const handleCampaignExport = () => {
        const campaignProducts = products
            .filter((p: any) => p.is_campaign)
            .map((p: any) => ({
                ...p,
                original_price: p.sale_price,
                campaign_price: parseFloat((p.sale_price * campaignRate).toFixed(2))
            }));
        exportToExcel(campaignProducts, "KardeslerKasap_Kampanya_Listesi");
    };

    const handleBulkCampaign = () => {
        if (anyInCampaign) {
            if (confirm("Tüm ürünlerden kampanyayı kaldırmak istediğinize emin misiniz?")) {
                onToggleAllCampaign(false);
            }
        } else {
            setIsRateModalOpen(true);
        }
    };

    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            importFromExcel(file, (data) => {
                onBulkImport(data);
                if (e.target) e.target.value = ''; // Reset input
            });
        }
    };

    return (
        <div className="space-y-8">
            {/* Action Bar - Reorganized */}
            {!hideFilters && (
                <div className="flex flex-col space-y-6">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                        {/* Search & Sort Group */}
                        <div className="flex flex-col md:flex-row items-stretch gap-4 flex-1 w-full max-w-3xl">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                                <input
                                    type="text"
                                    placeholder="Barkod okutun veya ürün arayın..."
                                    className="w-full bg-card/50 border border-border rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-primary/50 transition-all text-lg font-medium placeholder:text-secondary/40"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center bg-card/50 border border-border rounded-2xl px-4">
                                <ArrowUpDown className="w-4 h-4 text-secondary mr-3" />
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="bg-transparent border-none outline-none text-sm font-bold text-white py-3 pr-8 cursor-pointer appearance-none"
                                >
                                    <option value="name-asc" className="bg-slate-900">İsim (A-Z)</option>
                                    <option value="name-desc" className="bg-slate-900">İsim (Z-A)</option>
                                    <option value="stock-desc" className="bg-slate-900">Stok (Yüksekten Düşüğe)</option>
                                    <option value="stock-asc" className="bg-slate-900">Stok (Kritik Stoklar)</option>
                                    <option value="price-desc" className="bg-slate-900">Fiyat (En Yüksek)</option>
                                    <option value="price-asc" className="bg-slate-900">Fiyat (En Düşük)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={onAdd}
                                className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white px-8 py-3.5 rounded-2xl font-black transition-all shadow-xl shadow-primary/20 active:scale-95"
                            >
                                <Plus className="w-5 h-5" />
                                <span>YENİ ÜRÜN EKLE</span>
                            </button>
                        </div>
                    </div>

                    {/* Filters & Tools Group */}
                    <div className="flex flex-wrap items-center justify-between gap-6 p-4 bg-white/5 rounded-2xl border border-border/50">
                        <div className="flex items-center space-x-6">
                            <div className="flex items-center space-x-2">
                                <Filter className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-black text-secondary uppercase tracking-[2px]">Filtrele:</span>
                            </div>
                            <div className="flex items-center bg-black/20 border border-border rounded-xl p-1">
                                {[
                                    { id: 'all', label: 'Tümü' },
                                    { id: 'active', label: 'Aktif' },
                                    { id: 'passive', label: 'Pasif' },
                                    { id: 'pending', label: 'Beklemede' },
                                    { id: 'campaign', label: 'Kampanya' }
                                ].map((btn) => (
                                    <button
                                        key={btn.id}
                                        onClick={() => setFilter(btn.id)}
                                        className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${filter === btn.id ? 'bg-primary text-white shadow-lg' : 'text-secondary hover:text-white'}`}
                                    >
                                        {btn.label.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={onManageCategories}
                                className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 border border-border px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                            >
                                <FolderTree className="w-4 h-4 text-primary" />
                                <span>KATEGORİLER</span>
                            </button>

                            <div className="h-6 w-[1px] bg-border mx-2" />

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleExport}
                                    className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl transition-all"
                                    title="Excel Olarak İndir"
                                >
                                    <Download className="w-4 h-4" />
                                </button>

                                <button
                                    onClick={handleCampaignExport}
                                    className="p-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl transition-all"
                                    title="Kampanya Listesini İndir (Excel)"
                                >
                                    <FileSpreadsheet className="w-4 h-4" />
                                </button>

                                <label className="p-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl transition-all cursor-pointer">
                                    <Upload className="w-4 h-4" />
                                    <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileImport} />
                                </label>

                                <div className="w-[1px] h-6 bg-border mx-1" />

                                <button
                                    onClick={handleBulkCampaign}
                                    className={`flex items-center space-x-2 border px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${anyInCampaign ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border-rose-500/20' : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/20'}`}
                                    title={anyInCampaign ? "Tüm Kampanyaları Kaldır" : "Tümüne Kampanya Uygula"}
                                >
                                    {anyInCampaign ? <Trash2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                    <span>{anyInCampaign ? 'KAMPANYA KALDIR' : 'KAMPANYA'}</span>
                                </button>

                                <button
                                    onClick={() => setPreviewCampaign(!previewCampaign)}
                                    className={`flex items-center space-x-2 border px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${previewCampaign ? 'bg-amber-500 text-white border-amber-500' : 'bg-white/5 border-border text-secondary hover:text-white'}`}
                                >
                                    <Calculator className="w-4 h-4" />
                                    <span>ÖNİZLEME</span>
                                </button>

                                {onClearAll && (
                                    <button
                                        onClick={onClearAll}
                                        className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl transition-all"
                                        title="Tümünü Temizle"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Table Area */}
            <div className="glass-card overflow-hidden !p-0 border-border/40">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 border-b border-border">
                            <tr>
                                <th className="px-6 py-5 text-[10px] font-black text-secondary tracking-[2px] uppercase">Ürün Detayı</th>
                                <th className="px-6 py-5 text-[10px] font-black text-secondary tracking-[2px] uppercase">Kategori</th>
                                <th className="px-6 py-5 text-[10px] font-black text-secondary tracking-[2px] uppercase text-center">Maliyet / Satış</th>
                                <th className="px-6 py-5 text-[10px] font-black text-secondary tracking-[2px] uppercase text-center">Net Kar</th>
                                <th className="px-6 py-5 text-[10px] font-black text-secondary tracking-[2px] uppercase text-center">Mevcut Stok</th>
                                {previewCampaign && (
                                    <th className="px-6 py-5 text-[10px] font-black text-amber-500 tracking-[2px] uppercase text-center">Kmp. Fiyat</th>
                                )}
                                <th className="px-6 py-5 text-[10px] font-black text-secondary tracking-[2px] uppercase text-right">Yönetim</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {paginatedProducts.map((product: any) => {
                                const profit = product.sale_price - product.purchase_price;
                                const profitPercent = product.purchase_price > 0 ? (profit / product.purchase_price) * 100 : 0;

                                return (
                                    <tr
                                        key={product.id}
                                        className="hover:bg-white/5 transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                                                    <Package className="w-5 h-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-white text-sm">
                                                        {product.name}
                                                        {product.is_campaign && (
                                                            <span className="ml-2 px-1.5 py-0.5 rounded-md text-[9px] bg-amber-500 text-black font-black">KAMPANYA</span>
                                                        )}
                                                    </span>
                                                    <span className="text-xs text-secondary/60 flex items-center mt-0.5 font-medium font-mono">
                                                        {product.barcode || "---"}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-bold border border-primary/20 tracking-wider">
                                                {(product.categories?.name || product.category?.name || "GENEL").toUpperCase().slice(0, 12)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-secondary text-[10px] font-bold line-through opacity-50">₺{product.purchase_price.toFixed(2)}</span>
                                                <span className="text-white font-bold text-base">₺{product.sale_price.toFixed(2)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex flex-col items-center px-3 py-1.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 min-w-[80px]">
                                                <span className={`text-xs font-black ${profitPercent < 20 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                    %{profitPercent.toFixed(0)}
                                                </span>
                                                <span className="text-[10px] text-secondary/60 font-bold tracking-tight">₺{profit.toFixed(2)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className={`text-sm font-bold ${product.stock_quantity <= 2 ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
                                                    {product.unit?.toLowerCase() === 'kg'
                                                        ? (product.stock_quantity >= 1
                                                            ? `${product.stock_quantity.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}`
                                                            : `${(product.stock_quantity * 1000).toFixed(0)} gr`)
                                                        : product.stock_quantity
                                                    }
                                                </span>
                                                <div className={`mt-1 h-1 w-12 rounded-full bg-white/10 overflow-hidden`}>
                                                    <div
                                                        className={`h-full ${product.stock_quantity <= 2 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                        style={{ width: `${Math.min(100, (product.stock_quantity / 10) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        {previewCampaign && (
                                            <td className="px-6 py-4 text-center">
                                                <div className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30">
                                                    <p className="text-sm font-black text-amber-400">₺{(product.sale_price * campaignRate).toFixed(2)}</p>
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center gap-1">
                                                <button
                                                    onClick={() => onEdit(product)}
                                                    className="p-2 hover:bg-primary/10 text-secondary hover:text-primary rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => onDelete(product.id)}
                                                    className="p-2 hover:bg-rose-500/10 text-secondary hover:text-rose-500 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {hasMore && (
                    <div className="p-4 bg-white/5 border-t border-border flex justify-center">
                        <button
                            onClick={() => setPage(p => p + 1)}
                            className="bg-primary/10 text-primary px-8 py-3 rounded-xl font-bold hover:bg-primary hover:text-white transition-all text-xs tracking-widest uppercase"
                        >
                            Daha Fazla Göster ({sortedAndFilteredProducts.length - paginatedProducts.length})
                        </button>
                    </div>
                )}

                {sortedAndFilteredProducts.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-secondary">
                        <Package className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-lg font-bold">Aranan kritere uygun ürün bulunamadı.</p>
                        <button onClick={() => { setSearch(""); setFilter("all"); }} className="mt-4 text-primary hover:underline text-sm font-bold">Tümünü Göster</button>
                    </div>
                )}
            </div>

            {/* Campaign Rate Modal - Stabilized outside the glass-card */}
            <AnimatePresence>
                {isRateModalOpen && (
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                        onClick={() => setIsRateModalOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="glass-card max-w-sm w-full p-8 space-y-8 relative shadow-2xl border border-white/10"
                        >
                            <div className="text-center space-y-3">
                                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-2 border border-primary/20">
                                    <Calculator className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-black text-white tracking-tight">KAMPANYA AYARI</h3>
                                <p className="text-secondary text-sm font-medium leading-relaxed">
                                    Tüm ürünlerin satış fiyatına eklenecek <br /> <strong className="text-primary">kâr oranını</strong> belirleyin.
                                </p>
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                <input
                                    type="number"
                                    value={tempRate}
                                    onChange={(e) => setTempRate(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-6 text-4xl font-black text-center text-white outline-none focus:border-primary/50 focus:bg-primary/5 transition-all"
                                    placeholder="15"
                                    autoFocus
                                />
                                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-2xl font-black text-secondary/40">%</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setIsRateModalOpen(false)}
                                    className="py-4 px-6 rounded-2xl font-black text-xs tracking-widest bg-white/5 hover:bg-white/10 text-secondary transition-all active:scale-95"
                                >
                                    VAZGEÇ
                                </button>
                                <button
                                    onClick={() => {
                                        const rate = parseFloat(tempRate) || 0;
                                        onToggleAllCampaign(true, rate);
                                        setIsRateModalOpen(false);
                                    }}
                                    className="py-4 px-6 rounded-2xl font-black text-xs tracking-widest bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/30 transition-all active:scale-95"
                                >
                                    UYGULA
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
