"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/lib/tenant-context';
import {
    RefreshCw, Search, Link as LinkIcon, Link2Off,
    Settings, Play, Pause, AlertCircle, CheckCircle2,
    Package, ShoppingBag, Terminal, X, ExternalLink,
    Building2, Save, XCircle, Info, ArrowLeft, Settings2, Power, Globe, Zap, Link
} from 'lucide-react';
import { createTrendyolGoClient } from '@/lib/trendyol-go-client';

export default function ProductMapping({ platform }: { platform: string }) {
    const { currentTenant } = useTenant();
    const [products, setProducts] = useState<any[]>([]);
    const [mappings, setMappings] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [mappingLoading, setMappingLoading] = useState(false); // New state for auto-mapping loading

    // Modal & Picking States
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [externalProducts, setExternalProducts] = useState<any[]>([]);
    const [pickingLoading, setPickingLoading] = useState(false);
    const [pickerSearch, setPickerSearch] = useState('');

    useEffect(() => {
        if (currentTenant) {
            fetchData();
        }
    }, [currentTenant, platform]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Ayarları çek (platform veya type üzerinden - Veri kaybını önlemek için)
            let { data: settingsData } = await supabase
                .from('integration_settings')
                .select('*')
                .eq('tenant_id', currentTenant?.id)
                .or(`platform.eq.${platform},type.eq.trendyol_go`)
                .maybeSingle();

            // Fallback: Eğer integration_settings'te yoksa tenants tablosuna bak
            if (!settingsData) {
                const { data: tenantData } = await supabase
                    .from('tenants')
                    .select('settings')
                    .eq('id', currentTenant?.id)
                    .single();

                if (tenantData?.settings?.trendyolGo) {
                    settingsData = {
                        is_active: true,
                        settings: tenantData.settings.trendyolGo,
                        api_config: tenantData.settings.trendyolGo,
                        mode: 'test'
                    } as any;
                }
            }

            setSettings(settingsData);

            // 2. Ürünleri ve Mevcut Eşleşmeleri çek
            const [productsRes, mappingsRes] = await Promise.all([
                supabase.from('products').select('id, name, barcode, stock_quantity').eq('tenant_id', currentTenant?.id).limit(100),
                supabase.from('external_mappings').select('*').eq('tenant_id', currentTenant?.id).eq('platform', platform)
            ]);

            setProducts(productsRes.data || []);
            setMappings(mappingsRes.data || []);
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleMasterSync = async () => {
        if (!settings) {
            alert("⚠️ Lütfen önce 'Genel Bakış' sekmesinden Trendyol API bilgilerini girin.");
            return;
        }

        const isNew = !settings.id;

        if (isNew) {
            // İlk defa integration_settings tablosuna kaydediyoruz
            const { data, error } = await supabase
                .from('integration_settings')
                .upsert([{
                    tenant_id: currentTenant?.id,
                    platform: platform,
                    type: platform === 'trendyol' ? 'trendyol_go' : platform,
                    is_active: true,
                    mode: 'test',
                    settings: settings.settings || settings.api_config || {},
                    api_config: settings.api_config || settings.settings || {}
                }], { onConflict: 'tenant_id,platform' })
                .select()
                .single();

            if (!error) setSettings(data);
        } else {
            const { data, error } = await supabase
                .from('integration_settings')
                .update({ is_active: !settings.is_active })
                .eq('id', settings.id)
                .select()
                .single();

            if (!error) setSettings(data);
        }
    };

    const toggleMode = async () => {
        if (!settings) return;
        const newMode = settings.mode === 'test' ? 'live' : 'test';

        if (!settings.id) {
            // Eğer id yoksa (fallback durumu), önce kaydı oluşturup modu öyle set ediyoruz
            const { data, error } = await supabase
                .from('integration_settings')
                .upsert([{
                    tenant_id: currentTenant?.id,
                    platform: platform,
                    type: platform === 'trendyol' ? 'trendyol_go' : platform,
                    is_active: settings.is_active,
                    mode: newMode,
                    settings: settings.settings || settings.api_config || {},
                    api_config: settings.api_config || settings.settings || {}
                }], { onConflict: 'tenant_id,platform' })
                .select()
                .single();
            if (!error) setSettings(data);
        } else {
            const { data, error } = await supabase
                .from('integration_settings')
                .update({ mode: newMode })
                .eq('id', settings.id)
                .select()
                .single();
            if (!error) setSettings(data);
        }
    };

    const toggleStockSync = async () => {
        if (!settings) return;
        const currentConfig = settings.api_config || settings.settings || {};
        const newSyncStatus = !currentConfig.auto_stock_sync;

        const updatedConfig = {
            ...currentConfig,
            auto_stock_sync: newSyncStatus
        };

        const { data, error } = await supabase
            .from('integration_settings')
            .update({
                api_config: updatedConfig,
                settings: updatedConfig
            })
            .eq('id', settings.id)
            .select()
            .single();

        if (!error) setSettings(data);
    };

    const autoMapByBarcode = async () => {
        if (!settings || !currentTenant) return;
        setMappingLoading(true);
        try {
            const client = createTrendyolGoClient({
                trendyolGo: settings.api_config || settings.settings
            });

            // 1. Trendyol'daki tüm aktif ürünleri çek
            const externalProducts = await client.getProducts('ON_SALE', undefined, 0, 500);

            if (!externalProducts.length) {
                alert("❌ Trendyol'da aktif ürün bulunamadı.");
                return;
            }

            // 2. Barkodları bir sete alalım (Hız için)
            const trendyolBarcodes = new Map(externalProducts.map(p => [p.barcode.toLowerCase(), p]));

            // 3. JetPOS'taki barkodu olan ürünlerle karşılaştır
            const matches: any[] = [];
            products.forEach(p => {
                if (p.barcode) {
                    const extProduct = trendyolBarcodes.get(p.barcode.toLowerCase());
                    if (extProduct) {
                        matches.push({
                            tenant_id: currentTenant.id,
                            platform: platform,
                            product_id: p.id,
                            external_product_id: extProduct.barcode, // Trendyol GO için barcode genelde id yerine geçer
                            external_sku: extProduct.barcode,
                            sync_enabled: true
                        });
                    }
                }
            });

            if (matches.length === 0) {
                alert("🤷 Barkodu aynı olan hiçbir ürün bulunamadı.");
                return;
            }

            // 4. Veritabanına topluca (Upsert) kaydet
            const { error } = await supabase
                .from('external_mappings')
                .upsert(matches, { onConflict: 'tenant_id,platform,product_id' });

            if (error) throw error;

            alert(`✅ ${matches.length} ürün barkod üzerinden otomatik olarak eşleştirildi!`);
            fetchData();
        } catch (err: any) {
            alert("Hata: " + err.message);
        } finally {
            setMappingLoading(false);
        }
    };
    const toggleProductSync = async (mapping: any) => {
        const { error } = await supabase
            .from('external_mappings')
            .update({ sync_enabled: !mapping.sync_enabled })
            .eq('id', mapping.id);

        if (!error) {
            setMappings(prev => prev.map(m => m.id === mapping.id ? { ...m, sync_enabled: !m.sync_enabled } : m));
        }
    };

    const openPicker = async (product: any) => {
        setSelectedProduct(product);
        setIsPickerOpen(true);
        setPickingLoading(true);

        try {
            // Trendyol API'den ürünleri çek
            if (platform === 'trendyol' && settings?.api_config || settings?.settings) {
                const config = settings.api_config || settings.settings;
                const client = createTrendyolGoClient({ trendyolGo: config });
                const results = await client.getProducts('ON_SALE', config.storeId, 0, 50);
                setExternalProducts(results);
            }
        } catch (error) {
            console.error('External products error:', error);
        } finally {
            setPickingLoading(false);
        }
    };

    const handleMapProduct = async (externalProd: any) => {
        if (!selectedProduct) return;

        try {
            const newMapping = {
                tenant_id: currentTenant?.id,
                product_id: selectedProduct.id,
                platform: platform,
                external_product_id: externalProd.barcode, // Trendyol GO barkod üzerinden eşleşiyor
                external_sku: externalProd.barcode,
                sync_enabled: false
            };

            const { data, error } = await supabase
                .from('external_mappings')
                .upsert([newMapping], { onConflict: 'tenant_id,product_id,platform' })
                .select()
                .single();

            if (!error) {
                setMappings(prev => {
                    const filtered = prev.filter(m => m.product_id !== selectedProduct.id);
                    return [...filtered, data];
                });
                setIsPickerOpen(false);
            }
        } catch (error) {
            console.error('Mapping save error:', error);
        }
    };

    const removeMapping = async (mappingId: string) => {
        if (!confirm('Bu eşleştirmeyi kaldırmak istediğinize emin misiniz?')) return;
        const { error } = await supabase.from('external_mappings').delete().eq('id', mappingId);
        if (!error) {
            setMappings(prev => prev.filter(m => m.id !== mappingId));
        }
    };

    return (
        <div className="space-y-6">
            {/* Header / Master Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-5 border-border/50 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${settings?.is_active ? 'bg-primary/20 text-primary shadow-lg shadow-primary/20' : 'bg-slate-500/10 text-slate-500'}`}>
                            {settings?.is_active ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Genel Sistem</p>
                            <h3 className="font-bold text-lg">{settings?.is_active ? 'AKTİF' : 'DURDURULDU'}</h3>
                        </div>
                    </div>
                    {settings ? (
                        <button
                            onClick={toggleMasterSync}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${settings?.is_active ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-primary text-white hover:scale-105'}`}
                        >
                            {settings?.is_active ? 'DURDUR' : 'BAŞLAT'}
                        </button>
                    ) : (
                        <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg">AYAR YAPILMADI</span>
                    )}
                </div>

                <div className="glass-card p-5 border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${settings?.mode === 'live' ? 'bg-orange-500/20 text-orange-500 shadow-lg shadow-orange-500/20' : 'bg-indigo-500/20 text-indigo-500 shadow-lg shadow-indigo-500/20'}`}>
                            {settings?.mode === 'live' ? <ShoppingBag className="w-6 h-6" /> : <Terminal className="w-6 h-6" />}
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Çalışma Modu</p>
                            <h3 className="font-bold text-lg">{settings?.mode === 'live' ? 'LIVE (CANLI)' : 'TEST MODU'}</h3>
                        </div>
                    </div>
                    <button
                        onClick={toggleMode}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-secondary hover:text-foreground border border-border/50 rounded-xl text-xs font-black transition-all"
                    >
                        DEĞİŞTİR
                    </button>
                </div>

                <div className="glass-card p-5 border-border/50 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Eşleşme Durumu</p>
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">%{Math.round((mappings.length / products.length) * 100) || 0}</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div
                            className="bg-primary h-full transition-all duration-1000"
                            style={{ width: `${(mappings.length / products.length) * 100 || 0}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3">
                    <Zap className={`w-5 h-5 ${settings?.api_config?.auto_stock_sync ? 'text-emerald-500 animate-pulse' : 'text-slate-500'}`} />
                    <div>
                        <h4 className="text-sm font-bold">Stok Senkronizasyonu</h4>
                        <p className="text-[10px] text-secondary uppercase font-bold tracking-widest">Satış anında otomatik stok gönderimi</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={autoMapByBarcode}
                        disabled={mappingLoading || !settings?.is_active}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-xl font-bold transition-all border border-blue-500/20 disabled:opacity-50"
                    >
                        {mappingLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
                        Barkodu Tutarsa Bağla
                    </button>
                    <button
                        onClick={toggleStockSync}
                        disabled={!settings?.id}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all border ${settings?.api_config?.auto_stock_sync
                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                                : 'bg-white/5 border-white/10 text-slate-400'
                            } disabled:opacity-50`}
                    >
                        <Power className="w-4 h-4" />
                        Stok Güncelleme: {settings?.api_config?.auto_stock_sync ? 'AÇIK' : 'KAPALI'}
                    </button>
                </div>
            </div>

            {settings?.mode === 'test' && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-indigo-400">Şu an Test Modundasınız</p>
                        <p className="text-xs text-secondary leading-relaxed">Stok değişimleri pazaryerine bildirilmez, sadece sistem günlüğüne kaydedilir. Canlıya geçmeden önce eşleştirmelerinizi kontrol edebilirsiniz.</p>
                    </div>
                </div>
            )}

            {/* Ürün Listesi */}
            <div className="glass-card border-border/50 overflow-hidden !rounded-2xl">
                <div className="p-4 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-primary/5">
                    <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-primary" />
                        <h2 className="font-bold text-sm uppercase tracking-tighter">Ürün Senkronizasyon Listesi</h2>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                        <input
                            type="text"
                            placeholder="Ürün adı veya barkod ile ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-background/50 border border-border/50 rounded-xl pl-10 pr-4 py-2 text-xs w-full md:w-80 outline-none focus:border-primary transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-primary/5 text-secondary text-[10px] font-bold uppercase tracking-widest border-b border-border/50">
                            <tr>
                                <th className="px-6 py-4">Sistem Ürünü</th>
                                <th className="px-6 py-4">Mevcut Stok</th>
                                <th className="px-6 py-4">Pazaryeri Eşleşmesi</th>
                                <th className="px-6 py-4 text-center">Sync Durumu</th>
                                <th className="px-6 py-4 text-right">Aksiyon</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {products
                                .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode?.includes(searchQuery))
                                .map(product => {
                                    const mapping = mappings.find(m => m.product_id === product.id);
                                    return (
                                        <tr key={product.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-foreground text-sm">{product.name}</span>
                                                    <span className="text-secondary font-mono text-[10px]">{product.barcode || 'Barkodsuz'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`font-black font-mono ${product.stock_quantity <= 5 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                    {product.stock_quantity} Adet
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {mapping ? (
                                                    <div className={`flex flex-col p-2 rounded-lg border ${mapping.last_sync_status === 'failed'
                                                        ? 'bg-rose-500/10 border-rose-500/20'
                                                        : 'bg-white/5 border-border/50'
                                                        }`}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[10px] text-secondary uppercase font-bold">Platform ID</span>
                                                            {mapping.last_sync_status === 'failed' && (
                                                                <span title={mapping.last_sync_error}>
                                                                    <AlertCircle className="w-3 h-3 text-rose-500" />
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className={`font-mono font-bold ${mapping.last_sync_status === 'failed' ? 'text-rose-400' : 'text-primary'}`}>
                                                            {mapping.external_product_id}
                                                        </span>
                                                        {mapping.last_sync_status === 'failed' && (
                                                            <span className="text-[9px] text-rose-500 mt-1 font-medium leading-tight text-wrap max-w-[200px]">
                                                                {mapping.last_sync_error?.includes('not found') ? '⚠️ Ürün platformda bulunamadı veya silinmiş.' : mapping.last_sync_error}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-secondary italic opacity-50">Henüz eşleşmemiş</span>
                                                        <span className="text-[9px] text-amber-500/70 font-bold uppercase tracking-tighter">Sync Pasif</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {mapping ? (
                                                    <button
                                                        onClick={() => toggleProductSync(mapping)}
                                                        className={`p-2 rounded-xl transition-all ${mapping.sync_enabled
                                                            ? (mapping.last_sync_status === 'failed' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500')
                                                            : 'bg-slate-500/20 text-slate-500'
                                                            }`}
                                                        title={mapping.sync_enabled ? 'Kapat' : 'Aç'}
                                                    >
                                                        {mapping.sync_enabled ? (mapping.last_sync_status === 'failed' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />) : <Pause className="w-5 h-5" />}
                                                    </button>
                                                ) : <X className="w-5 h-5 text-slate-500/30 mx-auto" />}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => mapping ? removeMapping(mapping.id) : openPicker(product)}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 ml-auto ${mapping ? 'bg-white/5 text-secondary hover:text-foreground border border-border/50' : 'bg-primary text-white hover:scale-105'}`}
                                                >
                                                    {mapping ? <Link2Off className="w-3.5 h-3.5" /> : <LinkIcon className="w-3.5 h-3.5" />}
                                                    {mapping ? 'BAĞLANTIYI KOPAR' : 'EŞLEŞTİR'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>

                {products.length === 0 && (
                    <div className="py-20 text-center flex flex-col items-center gap-4 text-secondary opacity-50">
                        <Package className="w-12 h-12" />
                        <p className="font-bold text-sm">Hiç ürün bulunamadı.</p>
                    </div>
                )}
            </div>

            {/* PRODUCT PICKER MODAL */}
            {isPickerOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="glass-card w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border-primary/20 animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-border/50 flex items-center justify-between bg-primary/5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
                                    <ShoppingBag className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white">Ürün Seçici (Trendyol)</h3>
                                    <p className="text-xs text-secondary mt-1">{selectedProduct?.name} ile eşleştirin</p>
                                </div>
                            </div>
                            <button onClick={() => setIsPickerOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        {/* Modal Search */}
                        <div className="p-4 bg-black/20">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                                <input
                                    type="text"
                                    placeholder="Pazaryeri ürünlerinde ara..."
                                    value={pickerSearch}
                                    onChange={(e) => setPickerSearch(e.target.value)}
                                    className="w-full bg-background/50 border border-border/50 rounded-2xl pl-12 pr-4 py-3 text-sm outline-none focus:border-primary transition-all"
                                />
                            </div>
                        </div>

                        {/* Modal Content - Product List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {pickingLoading ? (
                                <div className="py-20 flex flex-col items-center justify-center gap-4 text-secondary">
                                    <RefreshCw className="w-10 h-10 animate-spin text-primary" />
                                    <p className="font-bold text-sm animate-pulse uppercase tracking-widest">Pazaryeri Ürünleri Yükleniyor...</p>
                                </div>
                            ) : externalProducts.length > 0 ? (
                                externalProducts
                                    .filter(p => p.title.toLowerCase().includes(pickerSearch.toLowerCase()) || p.barcode.includes(pickerSearch))
                                    .map((ep, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => handleMapProduct(ep)}
                                            className="group p-4 bg-white/5 hover:bg-primary/10 border border-border/50 hover:border-primary/30 rounded-2xl cursor-pointer transition-all flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-black/40 rounded-xl flex items-center justify-center text-secondary group-hover:text-primary transition-colors">
                                                    <Package className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{ep.title}</h4>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] text-secondary font-mono tracking-tighter">Barkod: {ep.barcode}</span>
                                                        <span className="text-[10px] text-emerald-500 font-black">Stok: {ep.quantity}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-black text-white">{ep.sellingPrice} TL</span>
                                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:bg-primary text-white">
                                                    <LinkIcon className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                            ) : (
                                <div className="py-20 text-center text-secondary">
                                    <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p className="font-bold text-sm">Ürün bulunamadı.</p>
                                    <p className="text-[10px] uppercase font-bold mt-2">Trendyol Ayarlarınızı kontrol edin.</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-border/50 flex items-center justify-between bg-black/40">
                            <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">
                                Toplam <span className="text-white">{externalProducts.length}</span> Kayıt Listelendi
                            </p>
                            <button
                                onClick={() => setIsPickerOpen(false)}
                                className="px-6 py-2 bg-white/5 hover:bg-white/10 text-secondary border border-border/50 rounded-xl text-xs font-black transition-all"
                            >
                                VAZGEÇ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
