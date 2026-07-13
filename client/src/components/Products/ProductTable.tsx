"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
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
    Package,
    X,
    Eye,
    EyeOff,
    RefreshCw,
    Hash,
    History as HistoryIcon,
    RotateCcw,
    Archive,
    ArchiveRestore,
    ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { exportToExcel, importFromExcel } from "@/lib/excel";
import { supabase, setCurrentTenant } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";
import ProductDetailView from "./ProductDetailView";
import BulkImportPage from "./BulkImportPage";


export default function ProductTable({ products, categories = [], onEdit, onDelete, onAdd, onManageCategories, onBulkImport, onClearAll, onToggleAllCampaign, campaignRate, hideFilters = false, limit, onRefresh, showToast, onViewChangeLogs, isPriceSyncEnabled = false, isStockSyncEnabled = false, lowStockThreshold = 10, isTrashMode = false, onRestore, isArchiveMode = false, onArchive, onUnarchive, onBulkArchive, onBulkArchiveByBarcode, allProducts }: any) {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all"); // all, active, passive, campaign
    const [selectedCategoryId, setSelectedCategoryId] = useState("all");
    const [sortBy, setSortBy] = useState("name-asc"); // name-asc, name-desc, stock-asc, stock-desc, price-desc
    const [previewCampaign, setPreviewCampaign] = useState(false);
    const [isRateModalOpen, setIsRateModalOpen] = useState(false);
    const [tempRate, setTempRate] = useState("15");

    // NEW: Selective Price Increase States
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [isSelectivePriceModalOpen, setIsSelectivePriceModalOpen] = useState(false);
    const [selectivePriceRate, setSelectivePriceRate] = useState("10");

    // NEW: Bulk Stock States
    const [isBulkStockModalOpen, setIsBulkStockModalOpen] = useState(false);
    const [bulkStockValue, setBulkStockValue] = useState("0");
    const [isRandomStock, setIsRandomStock] = useState(false);
    const [viewingProduct, setViewingProduct] = useState<any>(null);
    const [showBulkImport, setShowBulkImport] = useState(false);

    // Archive States
    const [isBulkArchiveModalOpen, setIsBulkArchiveModalOpen] = useState(false);
    const [archiveExcelData, setArchiveExcelData] = useState<string[]>([]);
    const [archiveMatchedProducts, setArchiveMatchedProducts] = useState<any[]>([]);


    const { currentTenant, activeWarehouse, activeEmployee } = useTenant();

    // NEW: Processing state for bulk actions

    const [processing, setProcessing] = useState<{ active: boolean; current: number; total: number; label: string }>({
        active: false, current: 0, total: 0, label: ""
    });
    const isCancelledRef = useRef(false);

    const anyInCampaign = useMemo(() => products.some((p: any) => p.is_campaign), [products]);

    // 1. Filter Logic
    const filteredProducts = useMemo(() => {
        return products.filter((p: any) => {
            const searchLower = search.toLocaleLowerCase('tr-TR');
            const nameMatch = p.name?.toLocaleLowerCase('tr-TR').includes(searchLower);
            const barcodeMatch = p.barcode?.toLocaleLowerCase('tr-TR').includes(searchLower);

            if (search.length >= 3 && p.barcode?.toLocaleLowerCase('tr-TR') === searchLower) return true;

            const matchesSearch = nameMatch || barcodeMatch;

            const isDeleted = p.status === 'deleted' || (p.deleted_at !== undefined && p.deleted_at !== null);
            const isArchived = p.status === 'archived' || (p.archived_at !== undefined && p.archived_at !== null);
            const isPassive = (p.status === 'passive' || p.is_active === false) && !isDeleted && !isArchived;
            const isPending = p.status === 'pending' && !isDeleted && !isArchived;
            const isActive = !isPassive && !isPending && !isDeleted;

            const matchesFilter =
                filter === "all" ? true :
                    filter === "active" ? isActive :
                        filter === "passive" ? isPassive :
                            filter === "pending" ? isPending :
                                filter === "campaign" ? p.is_campaign === true :
                                    filter === "trendyol" ? p.sync_trendyol === true : true;

            const matchesCategory =
                selectedCategoryId === "all" ? true : p.category_id === selectedCategoryId;

            return matchesSearch && matchesFilter && matchesCategory;
        });
    }, [products, search, filter, selectedCategoryId, activeWarehouse, isPriceSyncEnabled]);

    // 2. Count Logic
    const counts = useMemo(() => {
        return {
            all: products.length,
            active: products.filter((p: any) => {
                const isDeleted = p.status === 'deleted' || (p.deleted_at !== undefined && p.deleted_at !== null);
                const isPassive = (p.status === 'passive' || p.is_active === false) && !isDeleted;
                const isPending = p.status === 'pending' && !isDeleted;
                return !isPassive && !isPending && !isDeleted;
            }).length,
            passive: products.filter((p: any) => (p.status === 'passive' || p.is_active === false) && p.status !== 'deleted' && (p.deleted_at === undefined || p.deleted_at === null)).length,
            pending: products.filter((p: any) => p.status === 'pending' && p.status !== 'deleted' && (p.deleted_at === undefined || p.deleted_at === null)).length,
            campaign: products.filter((p: any) => p.is_campaign && p.status !== 'deleted' && (p.deleted_at === undefined || p.deleted_at === null)).length,
            trendyol: products.filter((p: any) => p.sync_trendyol && p.status !== 'deleted' && (p.deleted_at === undefined || p.deleted_at === null)).length
        }
    }, [products]);

    // 3. Sorting Logic
    const sortedAndFilteredProducts = useMemo(() => {
        return [...filteredProducts].sort((a: any, b: any) => {
            const getEffectiveStock = (product: any) => {
                const wsData = product.warehouse_stock?.find((ws: any) => ws.warehouse_id === activeWarehouse?.id);
                return (isStockSyncEnabled || !activeWarehouse) ? (Number(product.stock_quantity) || 0) : (Number(wsData?.quantity) || 0);
            };

            const getEffectiveSalePrice = (product: any) => {
                const wsData = product.warehouse_stock?.find((ws: any) => ws.warehouse_id === activeWarehouse?.id);
                return Number(((!isPriceSyncEnabled && wsData?.sale_price) ? wsData.sale_price : product.sale_price) || product.external_price || 0);
            };

            switch (sortBy) {
                case "name-asc": return (a.name || "").localeCompare(b.name || "");
                case "name-desc": return (b.name || "").localeCompare(a.name || "");
                case "stock-asc": return getEffectiveStock(a) - getEffectiveStock(b);
                case "stock-desc": return getEffectiveStock(b) - getEffectiveStock(a);
                case "price-desc": return getEffectiveSalePrice(b) - getEffectiveSalePrice(a);
                case "price-asc": return getEffectiveSalePrice(a) - getEffectiveSalePrice(b);
                default: return 0;
            }
        });
    }, [filteredProducts, sortBy, activeWarehouse, isStockSyncEnabled, isPriceSyncEnabled]);

    // Pagination / Virtualization Logic
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
        setSelectedProducts([]); // Clear selections when filter/search changes
    }, [search, filter, sortBy, selectedCategoryId]);

    const paginatedProducts = useMemo(() => {
        return sortedAndFilteredProducts.slice(0, page * ITEMS_PER_PAGE);
    }, [sortedAndFilteredProducts, page]);

    const hasMore = paginatedProducts.length < sortedAndFilteredProducts.length;

    const handleExport = () => {
        const exportedData = products.map((p: any) => ({
            "Ürün Adı": p.name || "",
            "Barkod": p.barcode || "",
            "Kategori": p.categories?.name || p.category?.name || "Genel",
            "Birim": p.unit || "Adet",
            "Alış Fiyatı": Number((p.purchase_price || 0).toFixed(2)),
            "Satış Fiyatı": p.is_campaign
                ? Number((p.sale_price * campaignRate).toFixed(2))
                : Number((p.sale_price || 0).toFixed(2)),
            "Stok": p.stock_quantity || 0,
            "KDV": p.vat_rate || 1,
            "Kampanya": p.is_campaign ? "EVET" : "HAYIR",
            "Durum": (p.status === 'passive' || p.is_active === false) ? "PASİF" : "AKTİF"
        }));
        exportToExcel(exportedData, "KardeslerKasap_UrunListesi");
    };

    const handleCampaignExport = () => {
        const campaignProducts = products
            .filter((p: any) => p.is_campaign)
            .map((p: any) => ({
                "Ürün Adı": p.name || "",
                "Barkod": p.barcode || "",
                "Kategori": p.categories?.name || p.category?.name || "Genel",
                "Normal Fiyat": Number((p.sale_price || 0).toFixed(2)),
                "Kampanyalı Fiyat": Number((p.sale_price * campaignRate).toFixed(2)),
                "Stok": p.stock_quantity || 0,
                "Birim": p.unit || "Adet"
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

    // NEW: Selective Price Increase Functions
    const handleToggleSelectProduct = (productId: string) => {
        setSelectedProducts((prev: string[]) =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const handleToggleSelectAll = () => {
        if (selectedProducts.length === sortedAndFilteredProducts.length) {
            setSelectedProducts([]);
        } else {
            setSelectedProducts(sortedAndFilteredProducts.map((p: any) => p.id));
        }
    };

    const handleApplySelectivePriceIncrease = async () => {
        const rate = parseFloat(selectivePriceRate) || 0;
        if (rate === 0 || selectedProducts.length === 0) return;

        try {
            const savedTenantId = localStorage.getItem('currentTenantId');
            if (savedTenantId) await setCurrentTenant(savedTenantId);

            let successCount = 0;
            const total = selectedProducts.length;
            const BATCH_SIZE = 50;

            isCancelledRef.current = false;
            setProcessing({ active: true, current: 0, total, label: "Fiyatlar güncelleniyor (Sıralı)..." });

            // Sequential processing in small batches to ensure stability
            for (let i = 0; i < selectedProducts.length; i += BATCH_SIZE) {
                if (isCancelledRef.current) break;

                const batchIds = selectedProducts.slice(i, i + BATCH_SIZE);
                setProcessing(prev => ({ ...prev, current: Math.min(i + BATCH_SIZE, total) }));

                const logs: any[] = [];
                for (const productId of batchIds) {
                    const product = products.find((p: any) => p.id === productId);
                    if (!product) continue;

                    const oldPrice = product.sale_price;
                    const newPrice = parseFloat((product.sale_price * (1 + rate / 100)).toFixed(2));
                    const increaseAmount = newPrice - oldPrice;

                    // Update single product price
                    const { error } = await supabase.from('products').update({ sale_price: newPrice }).eq('id', productId).eq('tenant_id', savedTenantId);

                    if (error) {
                        console.error(`Error updating product ${productId}:`, error.message);
                    } else {
                        successCount++;
                        try {
                            const q = JSON.parse(localStorage.getItem('jetpos_label_queue') || '[]');
                            if (!q.includes(productId)) {
                                q.push(productId);
                                localStorage.setItem('jetpos_label_queue', JSON.stringify(q));
                            }
                        } catch (e) { }

                        logs.push({
                            product_id: productId,
                            product_name: product.name,
                            product_barcode: product.barcode || null,
                            old_price: oldPrice,
                            new_price: newPrice,
                            increase_rate: rate,
                            increase_amount: increaseAmount,
                            changed_by: 'admin',
                            tenant_id: savedTenantId
                        });
                    }
                }

                if (logs.length > 0) {
                    await supabase.from('price_change_logs').insert(logs);
                }

                // Breathing space
                await new Promise(r => setTimeout(r, 100));
            }

            setIsSelectivePriceModalOpen(false);
            setSelectedProducts([]);
            if (showToast) {
                const msg = isCancelledRef.current ? `İşlem durduruldu. ${successCount} ürün güncellendi.` : `${successCount} ürünün fiyatı güncellendi.`;
                showToast(msg, successCount > 0 ? "success" : "error");
            }
            if (onRefresh) await onRefresh();
        } catch (error: any) {
            console.error("Selective price increase error:", error);
            alert("Hata oluştu: " + error.message);
        } finally {
            setProcessing({ active: false, current: 0, total: 0, label: "" });
            isCancelledRef.current = false;
        }
    };

    const handleBulkStatusChange = async (status: 'active' | 'passive') => {
        if (selectedProducts.length === 0) return;
        if (!confirm(`${selectedProducts.length} ürünü ${status === 'active' ? 'AKTİF' : 'PASİF'} duruma getirmek istediğinize emin misiniz?`)) return;

        try {
            // Re-authenticate to ensure tenant RLS is active
            const { supabase: sb, setCurrentTenant: setTenant } = await import("@/lib/supabase");
            const savedTenantId = localStorage.getItem('currentTenantId');
            if (savedTenantId) await setTenant(savedTenantId);

            let successCount = 0;
            const total = selectedProducts.length;
            const BATCH_SIZE = 50;

            isCancelledRef.current = false;
            setProcessing({ active: true, current: 0, total, label: `Ürünler ${status === 'active' ? 'aktif' : 'pasif'} ediliyor...` });

            // Using BATCHES with .in() for maximum efficiency and stability
            for (let i = 0; i < total; i += BATCH_SIZE) {
                if (isCancelledRef.current) break;

                const batchIds = selectedProducts.slice(i, i + BATCH_SIZE);
                setProcessing(prev => ({ ...prev, current: Math.min(i + BATCH_SIZE, total) }));

                // Update call without .select() to avoid RLS empty returns
                // Removed non-existent 'is_active' column
                const { error, count } = await sb
                    .from('products')
                    .update({
                        status: status
                    })
                    .in('id', batchIds)
                    .eq('tenant_id', savedTenantId);
                // .select() removed explicitly as it caused "0 updated" on RLS hidden rows

                if (error) {
                    console.error(`Batch update error:`, error.message);
                    // If we have an error, store it to show user
                    throw new Error(error.message);
                } else {
                    // Assume success if no error, even if we can't see the rows anymore
                    successCount += batchIds.length;
                }

                await new Promise(r => setTimeout(r, 100));
            }

            setSelectedProducts([]);
            if (showToast) {
                const msg = isCancelledRef.current
                    ? `İşlem durduruldu. ${successCount} ürün güncellendi.`
                    : `${successCount} ürün başarıyla güncellendi.`;
                showToast(msg, "success");
            }
            if (onRefresh) await onRefresh();
        } catch (error: any) {
            console.error("Bulk status change error:", error);
            alert("Hata: " + error.message);
        } finally {
            setProcessing({ active: false, current: 0, total: 0, label: "" });
            isCancelledRef.current = false;
        }
    };

    const handleAutoPassiveZeroStock = async () => {
        const zeroStockProducts = products.filter((p: any) => p.stock_quantity <= 0 && (p.is_active !== false || p.status !== 'passive'));
        if (zeroStockProducts.length === 0) {
            if (showToast) showToast("Stoku sıfır olan ve aktif görünen ürün bulunamadı.", "info");
            return;
        }

        if (!confirm(`Stoku sıfır olan ${zeroStockProducts.length} ürünü pasife almak üzeresiniz. Onaylıyor musunuz?`)) return;

        try {
            const { supabase: sb, setCurrentTenant: setTenant } = await import("@/lib/supabase");
            const savedTenantId = localStorage.getItem('currentTenantId');
            if (savedTenantId) await setTenant(savedTenantId);

            let successCount = 0;
            const total = zeroStockProducts.length;
            const BATCH_SIZE = 50;

            setProcessing({ active: true, current: 0, total, label: "Stoksuz ürünler pasife alınıyor..." });

            for (let i = 0; i < total; i += BATCH_SIZE) {
                const batchIds = zeroStockProducts.slice(i, i + BATCH_SIZE).map((p: any) => p.id);
                setProcessing(prev => ({ ...prev, current: Math.min(i + BATCH_SIZE, total) }));

                // No .select()
                // Removed non-existent 'is_active' column
                const { error } = await sb.from('products').update({ status: 'passive' }).in('id', batchIds).eq('tenant_id', savedTenantId);

                if (error) {
                    console.error("Batch auto passive error:", error.message);
                    throw new Error(error.message);
                } else {
                    successCount += batchIds.length;
                }

                await new Promise(r => setTimeout(r, 50));
            }

            if (showToast) showToast(`${successCount} adet stoksuz ürün pasife alındı!`, "success");
            if (onRefresh) await onRefresh();
        } catch (error: any) {
            console.error("Auto passive error:", error);
            alert("Hata: " + error.message);
        } finally {
            setProcessing({ active: false, current: 0, total: 0, label: "" });
        }
    };

    const handleBulkStockUpdate = async () => {
        if (selectedProducts.length === 0) return;
        const value = parseFloat(bulkStockValue) || 0;

        if (!confirm(`${selectedProducts.length} ürünün stoklarını ${isRandomStock ? 'RASTGELE' : value} olarak güncellemek üzeresiniz. Emin misiniz?`)) return;

        try {
            const { supabase: sb, setCurrentTenant: setTenant, auditLog } = await import("@/lib/supabase");
            const savedTenantId = localStorage.getItem('currentTenantId') || '';
            if (savedTenantId) await setTenant(savedTenantId);

            let successCount = 0;
            const total = selectedProducts.length;
            const BATCH_SIZE = 50;

            isCancelledRef.current = false;
            setProcessing({ active: true, current: 0, total, label: "Stoklar güncelleniyor..." });

            if (isRandomStock) {
                // Random stock must be one by one to have different values
                for (let i = 0; i < total; i++) {
                    if (isCancelledRef.current) break;
                    const id = selectedProducts[i];
                    setProcessing(prev => ({ ...prev, current: i + 1 }));

                    const finalStock = Math.floor(Math.random() * 100) + 1;
                    const product = products.find((p: any) => p.id === id);
                    const oldStock = product ? (Number(product.stock_quantity) || 0) : 0;
                    const productName = product ? product.name : 'Bilinmeyen Ürün';

                    const { error } = await sb.from('products').update({ stock_quantity: finalStock }).eq('id', id).eq('tenant_id', savedTenantId);
                    if (error) {
                        console.error(`Error updating product ${id}:`, error.message);
                        throw new Error(error.message);
                    } else {
                        successCount++;
                        auditLog(savedTenantId, 'STOCK_CHANGE', `"${productName}" stok miktarı toplu işlemle rastgele ${finalStock} olarak güncellendi (Önceki: ${oldStock})`, {
                            product_id: id,
                            product_name: productName,
                            old_stock: oldStock,
                            new_stock: finalStock,
                            operator: activeEmployee ? `${activeEmployee.first_name} ${activeEmployee.last_name}` : 'Yönetici',
                            warehouse_id: activeWarehouse?.id || null,
                            warehouse_name: activeWarehouse?.name || 'Genel'
                        });
                    }

                    if (i % 10 === 0) await new Promise(r => setTimeout(r, 20));
                }
            } else {
                // Fixed stock can be batch using .in()
                for (let i = 0; i < total; i += BATCH_SIZE) {
                    if (isCancelledRef.current) break;
                    const batchIds = selectedProducts.slice(i, i + BATCH_SIZE);
                    setProcessing(prev => ({ ...prev, current: Math.min(i + BATCH_SIZE, total) }));

                    const { error } = await sb.from('products').update({ stock_quantity: value }).in('id', batchIds).eq('tenant_id', savedTenantId);

                    if (error) {
                        console.error("Batch stock error:", error.message);
                        throw new Error(error.message);
                    } else {
                        successCount += batchIds.length;
                        // Log each item's stock change
                        batchIds.forEach(id => {
                            const product = products.find((p: any) => p.id === id);
                            const oldStock = product ? (Number(product.stock_quantity) || 0) : 0;
                            const productName = product ? product.name : 'Bilinmeyen Ürün';
                            auditLog(savedTenantId, 'STOCK_CHANGE', `"${productName}" stok miktarı toplu işlemle sabit ${value} olarak güncellendi (Önceki: ${oldStock})`, {
                                product_id: id,
                                product_name: productName,
                                old_stock: oldStock,
                                new_stock: value,
                                operator: activeEmployee ? `${activeEmployee.first_name} ${activeEmployee.last_name}` : 'Yönetici',
                                warehouse_id: activeWarehouse?.id || null,
                                warehouse_name: activeWarehouse?.name || 'Genel'
                            });
                        });
                    }

                    await new Promise(r => setTimeout(r, 100));
                }
            }

            setIsBulkStockModalOpen(false);
            setSelectedProducts([]);
            if (showToast) {
                const msg = isCancelledRef.current ? `İşlem durduruldu. ${successCount} ürün güncellendi.` : `${successCount} ürünün stoku güncellendi.`;
                showToast(msg, "success");
            }
            if (onRefresh) await onRefresh();
        } catch (error: any) {
            console.error("Bulk stock update error:", error);
            alert("Hata: " + error.message);
        } finally {
            setProcessing({ active: false, current: 0, total: 0, label: "" });
            isCancelledRef.current = false;
        }
    };

    const handleSendToLabel = () => {
        try {
            const q = JSON.parse(localStorage.getItem('jetpos_label_queue') || '[]');
            const newQ = [...new Set([...q, ...selectedProducts])];
            localStorage.setItem('jetpos_label_queue', JSON.stringify(newQ));
            if (showToast) showToast(`${selectedProducts.length} ürün etikete gönderildi!`, "success");
            setSelectedProducts([]);
        } catch (e) { }
    };

    // Archive Excel Functions
    const handleExportArchiveTemplate = () => {
        const templateData = [
            { "Barkod": "8690000000001" },
            { "Barkod": "8690000000002" },
            { "Barkod": "8690000000003" },
        ];
        exportToExcel(templateData, "Arsiv_Barkod_Sablonu");
        if (showToast) showToast("Örnek Excel şablonu indirildi!", "success");
    };

    const handleArchiveExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        importFromExcel(file, (data) => {
            const barcodes: string[] = [];
            data.forEach((row: any) => {
                const barcode = row["Barkod"] || row["barkod"] || row["BARKOD"] || row["Barcode"] || row["barcode"] || Object.values(row)[0];
                if (barcode && String(barcode).trim() !== "") {
                    barcodes.push(String(barcode).trim());
                }
            });

            if (barcodes.length === 0) {
                if (showToast) showToast("Excel'de barkod bulunamadı!", "error");
                return;
            }

            setArchiveExcelData(barcodes);

            // Find matching products from allProducts (active list) or current products
            const sourceProducts = allProducts || products;
            const matched = sourceProducts.filter((p: any) =>
                barcodes.some(b => b === p.barcode?.trim())
            );

            setArchiveMatchedProducts(matched);
            if (e.target) e.target.value = '';
        });
    };

    const handleConfirmBulkArchiveByExcel = () => {
        if (archiveMatchedProducts.length === 0) return;
        const barcodes = archiveMatchedProducts.map((p: any) => p.barcode);
        if (onBulkArchiveByBarcode) {
            onBulkArchiveByBarcode(barcodes);
        }
        setIsBulkArchiveModalOpen(false);
        setArchiveExcelData([]);
        setArchiveMatchedProducts([]);
    };

    if (showBulkImport) {
        return (
            <BulkImportPage
                onBack={() => setShowBulkImport(false)}
                onImport={(data) => {
                    onBulkImport(data);
                }}
            />
        );
    }

    if (viewingProduct) {
        return (
            <ProductDetailView
                product={viewingProduct}
                onBack={() => setViewingProduct(null)}
                onEdit={(p) => {
                    setViewingProduct(null);
                    onEdit(p);
                }}
            />
        );
    }

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
                                    className="w-full bg-primary/5 border border-border rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-primary/50 transition-all text-lg font-medium placeholder:text-secondary/40 text-foreground"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && search.trim() !== '') {
                                            const exactMatch = products.find((p: any) => p.barcode?.toLowerCase() === search.trim().toLowerCase());
                                            if (exactMatch) {
                                                onEdit(exactMatch);
                                            }
                                        }
                                    }}
                                    onPaste={(e) => {
                                        e.preventDefault();
                                        const pastedText = e.clipboardData.getData('text').trim();
                                        setSearch(pastedText);
                                        const exactMatch = products.find((p: any) => p.barcode?.toLowerCase() === pastedText.toLowerCase());
                                        if (exactMatch) {
                                            onEdit(exactMatch);
                                        }
                                    }}
                                />
                            </div>

                            <div className="flex items-center bg-card/50 border border-border rounded-2xl px-4">
                                <ArrowUpDown className="w-4 h-4 text-secondary mr-3" />
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="bg-transparent border-none outline-none text-sm font-bold text-foreground py-3 pr-8 cursor-pointer appearance-none"
                                >
                                    <option value="name-asc" className="bg-background text-foreground">İsim (A-Z)</option>
                                    <option value="name-desc" className="bg-background text-foreground">İsim (Z-A)</option>
                                    <option value="stock-desc" className="bg-background text-foreground">Stok (Yüksekten Düşüğe)</option>
                                    <option value="stock-asc" className="bg-background text-foreground">Stok (Kritik Stoklar)</option>
                                    <option value="price-desc" className="bg-background text-foreground">Fiyat (En Yüksek)</option>
                                    <option value="price-asc" className="bg-background text-foreground">Fiyat (En Düşük)</option>
                                </select>
                            </div>
                            <button
                                onClick={() => onAdd()}
                                className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white px-8 py-3.5 rounded-2xl font-black transition-all shadow-xl shadow-primary/20 active:scale-95"
                            >
                                <Plus className="w-5 h-5" />
                                <span>YENİ ÜRÜN EKLE</span>
                            </button>
                        </div>
                    </div>

                    {/* Filters & Tools Group */}
                    <div className="flex flex-col gap-4">
                        {/* Main Toolbar: Filters and Global Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-6 p-4 bg-primary/5 rounded-2xl border border-border/50">
                            {!isTrashMode && (
                                <div className="flex flex-wrap items-center gap-6">
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
                                                { id: 'campaign', label: 'Kampanya' },
                                                { id: 'trendyol', label: 'Trendyol' }
                                            ].map((btn) => (
                                                <button
                                                    key={btn.id}
                                                    onClick={() => setFilter(btn.id)}
                                                    className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${filter === btn.id ? 'bg-primary text-white shadow-lg' : 'text-secondary hover:text-foreground'}`}
                                                >
                                                    <span>{btn.label.toUpperCase()}</span>
                                                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${filter === btn.id ? 'bg-white/20 text-white' : 'bg-white/5 text-secondary'}`}>
                                                        {(counts as any)[btn.id]}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {categories && categories.length > 0 && (
                                        <div className="flex items-center bg-black/25 border border-border rounded-xl p-1 shadow-inner">
                                            <div className="flex items-center space-x-2 px-3 border-r border-border/40 py-1">
                                                <FolderTree className="w-3.5 h-3.5 text-primary" />
                                                <span className="text-[10px] font-black text-secondary uppercase tracking-[2.5px] select-none">Kategori</span>
                                            </div>
                                            <div className="relative flex items-center">
                                                <select
                                                    value={selectedCategoryId}
                                                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                                                    className="appearance-none bg-transparent hover:bg-white/[0.02] text-xs font-black text-white px-4 py-2 pr-9 rounded-r-xl outline-none cursor-pointer transition-all uppercase"
                                                >
                                                    <option value="all" className="bg-[#0c1222]">TÜM KATEGORİLER</option>
                                                    {categories.map((cat: any) => (
                                                        <option key={cat.id} value={cat.id} className="bg-[#0c1222]">
                                                            {cat.name.toUpperCase()}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="w-3.5 h-3.5 text-secondary absolute right-3 pointer-events-none transition-transform group-hover:text-white" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                {!isTrashMode && (
                                    <button
                                        onClick={handleAutoPassiveZeroStock}
                                        className="flex items-center space-x-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-4 py-2.5 rounded-xl text-xs font-bold text-amber-500 transition-all"
                                        title="Stoku sıfır olanları otomatik pasife alır"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        <span>STOKSUZLARI PASİFE AL</span>
                                    </button>
                                )}

                                <button
                                    onClick={onManageCategories}
                                    className="flex items-center space-x-2 bg-primary/5 hover:bg-primary/10 border border-border px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                                >
                                    <FolderTree className="w-4 h-4 text-primary" />
                                    <span>KATEGORİLER</span>
                                </button>
                                {!isTrashMode && onViewChangeLogs && (
                                    <button
                                        onClick={onViewChangeLogs}
                                        className="flex items-center space-x-2 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 px-4 py-2.5 rounded-xl text-xs font-bold text-blue-400 transition-all"
                                    >
                                        <HistoryIcon className="w-4 h-4" />
                                        <span>DEĞİŞİKLİK KAYITLARI</span>
                                    </button>
                                )}
                                {!isTrashMode && !isArchiveMode && onBulkArchiveByBarcode && (
                                    <button
                                        onClick={() => setIsBulkArchiveModalOpen(true)}
                                        className="flex items-center space-x-2 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/20 px-4 py-2.5 rounded-xl text-xs font-bold text-indigo-400 transition-all"
                                    >
                                        <Archive className="w-4 h-4" />
                                        <span>TOPLU ARŞİV (EXCEL)</span>
                                    </button>
                                )}
                                <div className="h-6 w-[1px] bg-border mx-2" />

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleExport}
                                        className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/20 rounded-xl transition-all"
                                        title="Excel Olarak İndir"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>

                                    <button
                                        onClick={handleCampaignExport}
                                        className="p-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/20 rounded-xl transition-all"
                                        title="Kampanya Listesini İndir (Excel)"
                                    >
                                        <FileSpreadsheet className="w-4 h-4" />
                                    </button>

                                    <button
                                        onClick={() => setShowBulkImport(true)}
                                        className="p-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 border border-blue-500/20 rounded-xl transition-all cursor-pointer"
                                        title="Toplu Ürün İçe Aktar"
                                    >
                                        <Upload className="w-4 h-4" />
                                    </button>

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
                                        className={`flex items-center space-x-2 border px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${previewCampaign ? 'bg-amber-500 text-white border-amber-500' : 'bg-primary/5 border-border text-secondary hover:text-foreground'}`}
                                    >
                                        <Calculator className="w-4 h-4" />
                                        <span>ÖNİZLEME</span>
                                    </button>

                                    {onClearAll && (
                                        <button
                                            onClick={onClearAll}
                                            className="flex items-center space-x-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 rounded-xl transition-all font-bold text-xs group"
                                            title="Tüm Veritabanını Sıfırla"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span>TÜMÜNÜ TEMİZLE</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Animated Selection Bar */}
                        <AnimatePresence>
                            {selectedProducts.length > 0 && !isTrashMode && !isArchiveMode && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0, y: -10 }}
                                    animate={{ height: "auto", opacity: 1, y: 0 }}
                                    exit={{ height: 0, opacity: 0, y: -10 }}
                                    className="overflow-hidden"
                                >
                                    <div className="flex flex-wrap items-center gap-3 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
                                        <div className="flex items-center space-x-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl px-4 py-2.5">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">
                                                {selectedProducts.length} ÜRÜN SEÇİLİ
                                            </span>
                                        </div>
                                        <div className="h-6 w-[1px] bg-emerald-500/20 mx-2" />
                                        <button
                                            onClick={() => setIsSelectivePriceModalOpen(true)}
                                            className="flex items-center space-x-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-600 transition-all hover:scale-105"
                                        >
                                            <Calculator className="w-4 h-4" />
                                            <span>ZAM UYGULA</span>
                                        </button>
                                        <button
                                            onClick={() => handleBulkStatusChange('active')}
                                            className="flex items-center space-x-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-600 transition-all hover:scale-105"
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span>AKTİFE AL</span>
                                        </button>
                                        <button
                                            onClick={() => handleBulkStatusChange('passive')}
                                            className="flex items-center space-x-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-500 transition-all hover:scale-105"
                                        >
                                            <EyeOff className="w-4 h-4" />
                                            <span>PASİFE AL</span>
                                        </button>
                                        <button
                                            onClick={() => setIsBulkStockModalOpen(true)}
                                            className="flex items-center space-x-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 px-4 py-2.5 rounded-xl text-xs font-bold text-blue-600 transition-all hover:scale-105"
                                        >
                                            <Hash className="w-4 h-4" />
                                            <span>STOK GÜNCELLE</span>
                                        </button>
                                        <button
                                            onClick={handleSendToLabel}
                                            className="flex items-center space-x-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-4 py-2.5 rounded-xl text-xs font-bold text-amber-500 transition-all hover:scale-105"
                                        >
                                            <Barcode className="w-4 h-4" />
                                            <span>ETİKET ÇIKAR</span>
                                        </button>
                                        {onBulkArchive && (
                                            <button
                                                onClick={() => onBulkArchive(selectedProducts)}
                                                className="flex items-center space-x-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-4 py-2.5 rounded-xl text-xs font-bold text-indigo-500 transition-all hover:scale-105"
                                            >
                                                <Archive className="w-4 h-4" />
                                                <span>ARŞİVLE</span>
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Archive Mode Selection Bar */}
                        <AnimatePresence>
                            {selectedProducts.length > 0 && isArchiveMode && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0, y: -10 }}
                                    animate={{ height: "auto", opacity: 1, y: 0 }}
                                    exit={{ height: 0, opacity: 0, y: -10 }}
                                    className="overflow-hidden"
                                >
                                    <div className="flex flex-wrap items-center gap-3 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/20">
                                        <div className="flex items-center space-x-2 bg-indigo-500/20 border border-indigo-500/30 rounded-xl px-4 py-2.5">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                            <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">
                                                {selectedProducts.length} ÜRÜN SEÇİLİ
                                            </span>
                                        </div>
                                        <div className="h-6 w-[1px] bg-indigo-500/20 mx-2" />
                                        <button
                                            onClick={() => {
                                                selectedProducts.forEach((id: string) => {
                                                    if (onUnarchive) onUnarchive(id);
                                                });
                                                setSelectedProducts([]);
                                            }}
                                            className="flex items-center space-x-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-500 transition-all hover:scale-105"
                                        >
                                            <ArchiveRestore className="w-4 h-4" />
                                            <span>ARŞİVDEN ÇIKAR</span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Table Area */}
            <div className="glass-card overflow-hidden !p-0 border-border/40">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-primary/5 border-b border-border">
                            <tr>
                                <th className="px-6 py-5 text-center w-12">
                                    <input
                                        type="checkbox"
                                        checked={selectedProducts.length === sortedAndFilteredProducts.length && sortedAndFilteredProducts.length > 0}
                                        onChange={handleToggleSelectAll}
                                        className="w-5 h-5 rounded bg-primary/5 border-2 border-primary/50 cursor-pointer accent-primary"
                                        title="Tümünü Seç/Kaldır"
                                    />
                                </th>
                                <th className="px-6 py-5 text-[10px] font-black text-secondary tracking-[2px] uppercase">Ürün Detayı</th>
                                <th className="px-6 py-5 text-[10px] font-black text-secondary tracking-[2px] uppercase">Kategori</th>
                                <th className="px-6 py-5 text-[10px] font-black text-secondary tracking-[2px] uppercase text-center">Maliyet / Satış</th>
                                <th className="px-6 py-5 text-[10px] font-black text-secondary tracking-[2px] uppercase text-center">Net Kar</th>
                                <th className="px-6 py-5 text-[10px] font-black text-secondary tracking-[2px] uppercase text-center">{isTrashMode ? 'Silinme Tarihi' : isArchiveMode ? 'Arşivlenme Tarihi' : 'Mevcut Stok'}</th>
                                {previewCampaign && (
                                    <th className="px-6 py-5 text-[10px] font-black text-amber-500 tracking-[2px] uppercase text-center">Kmp. Fiyat</th>
                                )}
                                <th className="px-6 py-5 text-[10px] font-black text-secondary tracking-[2px] uppercase text-right">Yönetim</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {paginatedProducts.map((product: any) => {
                                const wsData = product.warehouse_stock?.find((ws: any) => ws.warehouse_id === activeWarehouse?.id);
                                const currentSalePrice = ((!isPriceSyncEnabled && wsData?.sale_price) ? wsData.sale_price : product.sale_price) || product.external_price || 0;
                                const currentPurchasePrice = (!isPriceSyncEnabled && wsData?.purchase_price) ? wsData.purchase_price : product.purchase_price;
                                const currentStock = (isStockSyncEnabled || !activeWarehouse) ? (product.stock_quantity || 0) : (wsData?.quantity || 0);

                                const profit = currentSalePrice - currentPurchasePrice;
                                const profitPercent = currentPurchasePrice > 0 ? (profit / currentPurchasePrice) * 100 : 0;

                                return (
                                    <tr
                                        key={product.id}
                                        className={`hover:bg-white/5 transition-colors group ${product.status === 'passive' || product.is_active === false ? 'opacity-50' : ''}`}
                                    >
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedProducts.includes(product.id)}
                                                onChange={() => handleToggleSelectProduct(product.id)}
                                                className="w-5 h-5 rounded bg-primary/5 border-2 border-primary/50 cursor-pointer accent-primary"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setViewingProduct(product)}>
                                                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                                                    <Package className="w-5 h-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-foreground text-[15px] tracking-tight flex items-center gap-2">
                                                        {product.name}
                                                        {product.sync_trendyol && (
                                                            <span className="w-5 h-5 rounded-md bg-orange-500 text-white flex items-center justify-center text-[10px] font-black shadow-sm" title="Trendyol'da Satışta">T</span>
                                                        )}
                                                        {product.is_campaign && (
                                                            <span className="px-2 py-0.5 rounded-md text-[9px] bg-amber-500 text-black font-black shadow-sm">KAMPANYA</span>
                                                        )}
                                                        {(product.status === 'passive' || product.is_active === false) && (
                                                            <span className="px-2 py-0.5 rounded-md text-[9px] bg-slate-700 text-slate-300 font-black shadow-sm">PASİF</span>
                                                        )}
                                                    </span>
                                                    <span className="text-[11px] text-secondary/40 flex items-center mt-0.5 font-bold font-mono tracking-widest">
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
                                        <td className="px-6 py-4 text-center border-x border-border/10">
                                            <div className="flex flex-col items-center">
                                                <span className="text-secondary/40 text-[10px] font-bold line-through">₺{currentPurchasePrice.toFixed(2)}</span>
                                                <span className="text-primary font-black text-lg tracking-tight">₺{currentSalePrice.toFixed(2)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex flex-col items-center px-3 py-1.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 min-w-[80px]">
                                                <span className={`text-xs font-black ${profitPercent < 20 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                    %{profitPercent.toFixed(0)}
                                                </span>
                                                <span className="text-[10px] text-secondary/60 font-bold tracking-tight">₺{profit.toFixed(2)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {isTrashMode ? (
                                                <div className="flex flex-col items-center">
                                                    <span className="text-sm font-black text-rose-500">
                                                        {product.deleted_at ? new Date(product.deleted_at).toLocaleDateString('tr-TR') : '---'}
                                                    </span>
                                                    <span className="text-[10px] text-secondary/40 font-bold uppercase">
                                                        {product.deleted_at ? new Date(product.deleted_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </span>
                                                </div>
                                            ) : isArchiveMode ? (
                                                <div className="flex flex-col items-center">
                                                    <span className="text-sm font-black text-indigo-500">
                                                        {product.archived_at ? new Date(product.archived_at).toLocaleDateString('tr-TR') : '---'}
                                                    </span>
                                                    <span className="text-[10px] text-secondary/40 font-bold uppercase">
                                                        {product.archived_at ? new Date(product.archived_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center">
                                                    <span className={`text-base font-black tracking-tight ${currentStock <= lowStockThreshold ? 'text-rose-500 animate-pulse' : 'text-foreground'}`}>
                                                        {product.unit?.toLowerCase() === 'kg'
                                                            ? (currentStock >= 1
                                                                ? `${currentStock.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                                                                : `${(currentStock * 1000).toFixed(0)} gr`)
                                                            : currentStock
                                                        }
                                                    </span>
                                                    <div className={`mt-1 h-1 w-12 rounded-full bg-primary/10 overflow-hidden`}>
                                                        <div
                                                            className={`h-full ${currentStock <= lowStockThreshold ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                            style={{ width: `${Math.min(100, (currentStock / (lowStockThreshold * 2)) * 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        {previewCampaign && (
                                            <td className="px-6 py-4 text-center">
                                                <div className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30">
                                                    <p className="text-sm font-black text-amber-600">₺{(currentSalePrice * campaignRate).toFixed(2)}</p>
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center gap-1">
                                                {isTrashMode ? (
                                                    <>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); if (onRestore) onRestore(product.id); }}
                                                            className="p-2 hover:bg-emerald-500/10 text-emerald-500 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-black uppercase"
                                                            title="Geri Yükle"
                                                        >
                                                            <RotateCcw className="w-4 h-4" />
                                                            <span>Geri Al</span>
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); if (onDelete) onDelete(product.id); }}
                                                            className="p-2 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-black uppercase"
                                                            title="Kalıcı Olarak Sil"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            <span>Yok Et</span>
                                                        </button>
                                                    </>
                                                ) : isArchiveMode ? (
                                                    <>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); if (onUnarchive) onUnarchive(product.id); }}
                                                            className="p-2 hover:bg-emerald-500/10 text-emerald-500 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-black uppercase"
                                                            title="Arşivden Çıkar"
                                                        >
                                                            <ArchiveRestore className="w-4 h-4" />
                                                            <span>Geri Al</span>
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setViewingProduct(product); }}
                                                            className="p-2 hover:bg-primary/10 text-secondary hover:text-primary rounded-lg transition-colors"
                                                            title="Detayları Gör"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setViewingProduct(product); }}
                                                            className="p-2 hover:bg-primary/10 text-secondary hover:text-primary rounded-lg transition-colors"
                                                            title="Detayları Gör"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onEdit(product); }}
                                                            className="p-2 hover:bg-primary/10 text-secondary hover:text-primary rounded-lg transition-colors"
                                                            title="Düzenle"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        {onArchive && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); onArchive(product.id); }}
                                                                className="p-2 hover:bg-indigo-500/10 text-secondary hover:text-indigo-500 rounded-lg transition-colors"
                                                                title="Arşive Taşı"
                                                            >
                                                                <Archive className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {filter === 'trendyol' ? (
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    if (confirm(`"${product.name}" ürününü Trendyol satışından kaldırmak istediğinize emin misiniz? (Fiziksel mağazadan SİLİNMEZ)`)) {
                                                                        const { error } = await supabase
                                                                            .from('products')
                                                                            .update({ sync_trendyol: false })
                                                                            .eq('id', product.id)
                                                                            .eq('tenant_id', currentTenant?.id);

                                                                        if (error) {
                                                                            showToast("Hata oluştu: " + error.message, "error");
                                                                        } else {
                                                                            showToast("Ürün Trendyol'dan kaldırıldı", "success");
                                                                            if (onRefresh) onRefresh();
                                                                        }
                                                                    }
                                                                }}
                                                                className="p-2 hover:bg-orange-500/10 text-secondary hover:text-orange-500 rounded-lg transition-colors"
                                                                title="Trendyol'dan Kaldır (Dükkanda Kalır)"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); onDelete(product.id); }}
                                                                className="p-2 hover:bg-rose-500/10 text-secondary hover:text-rose-500 rounded-lg transition-colors"
                                                                title="Sil"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {hasMore && (
                    <div className="p-4 bg-primary/5 border-t border-border flex justify-center">
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
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 border border-border/50 ${isTrashMode ? 'bg-emerald-500/5' : isArchiveMode ? 'bg-indigo-500/5' : 'bg-primary/5'}`}>
                            {isTrashMode ? <RotateCcw className="w-10 h-10 text-emerald-500/30" /> : isArchiveMode ? <Archive className="w-10 h-10 text-indigo-500/30" /> : <Package className="w-10 h-10 opacity-20" />}
                        </div>
                        <p className="text-lg font-black tracking-tight">{isTrashMode ? 'Çöp kutun tertemiz!' : isArchiveMode ? 'Arşivde ürün yok!' : 'Aranan kritere uygun ürün bulunamadı.'}</p>
                        <p className="text-xs font-bold text-secondary/40 mt-1 uppercase tracking-widest">{isTrashMode ? 'Silinen ürünlerin burada 7 gün boyunca saklanır.' : isArchiveMode ? 'Ürün listesinden arşive taşıdığınız ürünler burada görünecek.' : 'Farklı bir arama yapmayı deneyin.'}</p>
                        {!isTrashMode && !isArchiveMode && (
                            <button onClick={() => { setSearch(""); setFilter("all"); }} className="mt-6 px-6 py-2.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl transition-all text-xs font-black tracking-widest uppercase">TÜMÜNÜ GÖSTER</button>
                        )}
                    </div>
                )}
            </div>

            {/* Selective Price Increase Modal */}
            <AnimatePresence>
                {isSelectivePriceModalOpen && (
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                        onClick={() => setIsSelectivePriceModalOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="glass-card max-w-sm w-full p-8 space-y-8 relative shadow-2xl border border-emerald-500/20"
                        >
                            <div className="text-center space-y-3">
                                <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-400 mx-auto mb-2 border border-emerald-500/20">
                                    <Calculator className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-black text-white tracking-tight">SEÇİLİLERE ZAM</h3>
                                <p className="text-secondary text-sm font-medium leading-relaxed">
                                    Seçilen <strong className="text-emerald-600">{selectedProducts.length} ürünün</strong> satış fiyatına <br /> <strong className="text-emerald-600">% zam oranı</strong> belirleyin.
                                </p>
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                <input
                                    type="number"
                                    value={selectivePriceRate}
                                    onChange={(e) => setSelectivePriceRate(e.target.value)}
                                    className="w-full bg-primary/5 border border-border rounded-2xl py-6 px-6 text-4xl font-black text-center text-foreground outline-none focus:border-emerald-500/50 focus:bg-emerald-500/5 transition-all"
                                    placeholder="10"
                                    autoFocus
                                />
                                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-2xl font-black text-secondary/40">%</span>
                            </div>

                            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-xs text-secondary space-y-1">
                                <p><strong className="text-foreground font-bold">Örnek:</strong> 100₺ olan ürün → %{selectivePriceRate || "10"} zam → {(100 * (1 + parseFloat(selectivePriceRate || "10") / 100)).toFixed(2)}₺</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setIsSelectivePriceModalOpen(false)}
                                    className="py-4 px-6 rounded-2xl font-black text-xs tracking-widest bg-primary/5 hover:bg-primary/10 text-secondary transition-all active:scale-95"
                                >
                                    VAZGEÇ
                                </button>
                                <button
                                    onClick={handleApplySelectivePriceIncrease}
                                    className="py-4 px-6 rounded-2xl font-black text-xs tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/30 transition-all active:scale-95"
                                >
                                    UYGULA
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Bulk Stock Update Modal */}
            <AnimatePresence>
                {isBulkStockModalOpen && (
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                        onClick={() => setIsBulkStockModalOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="glass-card max-w-sm w-full p-8 space-y-8 relative shadow-2xl border border-blue-500/20"
                        >
                            <div className="text-center space-y-3">
                                <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center text-blue-400 mx-auto mb-2 border border-blue-500/20">
                                    <Hash className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-black text-white tracking-tight text-center">TOPLU STOK GÜNCELLE</h3>
                                <p className="text-secondary text-sm font-medium leading-relaxed text-center">
                                    Seçilen <strong className="text-blue-600">{selectedProducts.length} ürün</strong> için yeni stok değeri belirleyin.
                                </p>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                                    <span className="text-xs font-bold text-foreground">Rastgele Sayı Ata</span>
                                    <button
                                        onClick={() => setIsRandomStock(!isRandomStock)}
                                        className={`w-12 h-6 rounded-full transition-all relative ${isRandomStock ? 'bg-blue-500' : 'bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isRandomStock ? 'right-1' : 'left-1'}`} />
                                    </button>
                                </div>

                                {!isRandomStock && (
                                    <div className="relative z-10 group">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={bulkStockValue}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                // Only allow numbers
                                                if (val === '' || /^\d+$/.test(val)) {
                                                    setBulkStockValue(val);
                                                }
                                            }}
                                            className="w-full bg-primary/5 border border-border rounded-2xl py-6 px-6 text-4xl font-black text-center text-foreground outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all"
                                            placeholder="0"
                                            autoFocus
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setIsBulkStockModalOpen(false)}
                                    className="py-4 px-6 rounded-2xl font-black text-xs tracking-widest bg-primary/5 hover:bg-primary/10 text-secondary transition-all active:scale-95"
                                >
                                    VAZGEÇ
                                </button>
                                <button
                                    onClick={handleBulkStockUpdate}
                                    className="py-4 px-6 rounded-2xl font-black text-xs tracking-widest bg-blue-500 hover:bg-blue-600 text-white shadow-xl shadow-blue-500/30 transition-all active:scale-95"
                                >
                                    UYGULA
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
                                    className="w-full bg-primary/5 border border-border rounded-2xl py-6 px-6 text-4xl font-black text-center text-foreground outline-none focus:border-primary/50 focus:bg-primary/5 transition-all"
                                    placeholder="15"
                                    autoFocus
                                />
                                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-2xl font-black text-secondary/40">%</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setIsRateModalOpen(false)}
                                    className="py-4 px-6 rounded-2xl font-black text-xs tracking-widest bg-primary/5 hover:bg-primary/10 text-secondary transition-all active:scale-95"
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

            {/* Bulk Archive Excel Modal */}
            <AnimatePresence>
                {isBulkArchiveModalOpen && (
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                        onClick={() => { setIsBulkArchiveModalOpen(false); setArchiveExcelData([]); setArchiveMatchedProducts([]); }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="glass-card max-w-lg w-full p-8 space-y-6 relative shadow-2xl border border-indigo-500/20"
                        >
                            <div className="text-center space-y-3">
                                <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-400 mx-auto mb-2 border border-indigo-500/20">
                                    <Archive className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-black text-white tracking-tight">TOPLU ARŞİV (EXCEL)</h3>
                                <p className="text-secondary text-sm font-medium leading-relaxed">
                                    Barkod listesiyle ürünleri toplu arşive alın.
                                </p>
                            </div>

                            {/* Step 1: Download Template */}
                            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 space-y-3">
                                <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest">1. ÖRNEK EXCEL ŞABLONU</h4>
                                <p className="text-xs text-secondary">Barkod sütunu olan bir Excel şablonu indirin, arşivlemek istediğiniz barkodları yazın.</p>
                                <button
                                    onClick={handleExportArchiveTemplate}
                                    className="flex items-center space-x-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-4 py-2.5 rounded-xl text-xs font-bold text-indigo-400 transition-all w-full justify-center"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>ÖRNEK EXCEL İNDİR</span>
                                </button>
                            </div>

                            {/* Step 2: Upload */}
                            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 space-y-3">
                                <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest">2. BARKOD LİSTESİ YÜKLE</h4>
                                <p className="text-xs text-secondary">Barkodlarınızı içeren Excel dosyasını yükleyin.</p>
                                <label className="flex items-center space-x-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-4 py-2.5 rounded-xl text-xs font-bold text-indigo-400 transition-all w-full justify-center cursor-pointer">
                                    <Upload className="w-4 h-4" />
                                    <span>EXCEL DOSYASI SEÇ</span>
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleArchiveExcelImport}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {/* Step 3: Preview matches */}
                            {archiveExcelData.length > 0 && (
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                                    <h4 className="text-xs font-black text-foreground uppercase tracking-widest">3. EŞLEŞTİRME SONUCU</h4>
                                    <div className="flex items-center gap-4 text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                            <span className="text-secondary">Yüklenen barkod: <strong className="text-foreground">{archiveExcelData.length}</strong></span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span className="text-secondary">Eşleşen ürün: <strong className="text-emerald-400">{archiveMatchedProducts.length}</strong></span>
                                        </div>
                                        {archiveExcelData.length - archiveMatchedProducts.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-rose-500" />
                                                <span className="text-secondary">Eşleşmeyen: <strong className="text-rose-400">{archiveExcelData.length - archiveMatchedProducts.length}</strong></span>
                                            </div>
                                        )}
                                    </div>

                                    {archiveMatchedProducts.length > 0 && (
                                        <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1 mt-2">
                                            {archiveMatchedProducts.map((p: any) => (
                                                <div key={p.id} className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-3 py-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-foreground">{p.name}</span>
                                                        <span className="text-[10px] text-secondary font-mono">{p.barcode}</span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-emerald-500">✓</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => { setIsBulkArchiveModalOpen(false); setArchiveExcelData([]); setArchiveMatchedProducts([]); }}
                                    className="py-4 px-6 rounded-2xl font-black text-xs tracking-widest bg-primary/5 hover:bg-primary/10 text-secondary transition-all active:scale-95"
                                >
                                    VAZGEÇ
                                </button>
                                <button
                                    onClick={handleConfirmBulkArchiveByExcel}
                                    disabled={archiveMatchedProducts.length === 0}
                                    className={`py-4 px-6 rounded-2xl font-black text-xs tracking-widest transition-all active:scale-95 ${archiveMatchedProducts.length > 0
                                        ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-xl shadow-indigo-500/30'
                                        : 'bg-white/5 text-secondary/30 cursor-not-allowed'
                                        }`}
                                >
                                    {archiveMatchedProducts.length > 0 ? `${archiveMatchedProducts.length} ÜRÜNÜ ARŞİVLE` : 'EXCEL YÜKLE'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Processing Overlay */}
            <AnimatePresence>
                {processing.active && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-slate-900 border border-white/10 p-10 rounded-[40px] shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full relative"
                        >
                            {/* Cancel Button */}
                            <button
                                onClick={() => {
                                    if (confirm("İşlemi durdurmak istediğinize emin misiniz?")) {
                                        isCancelledRef.current = true;
                                    }
                                }}
                                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-rose-500 hover:bg-rose-500/10 transition-all active:scale-90"
                            >
                                <X size={16} />
                            </button>

                            <div className="relative w-24 h-24">
                                <svg className="w-full h-full -rotate-90">
                                    <circle cx="48" cy="48" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-white/5" />
                                    <circle
                                        cx="48" cy="48" r="40" fill="transparent" stroke="currentColor" strokeWidth="8"
                                        strokeDasharray={251.2}
                                        strokeDashoffset={251.2 * (1 - processing.current / (processing.total || 1))}
                                        className="text-primary transition-all duration-300 stroke-round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xl font-black text-white">%{Math.round((processing.current / (processing.total || 1)) * 100)}</span>
                                </div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-white font-black text-xl mb-2">{processing.label}</h3>
                                <p className="text-secondary text-sm font-bold">{processing.current} / {processing.total} ürün işleniyor...</p>
                                <p className="text-rose-500/60 text-[10px] font-black tracking-widest uppercase mt-4">DURDURMAK İÇİN SAĞ ÜSTTEKİ ÇARPIYA BASIN</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

