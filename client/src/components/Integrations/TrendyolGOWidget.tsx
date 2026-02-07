"use client";

interface TrendyolGoSettings {
    sellerId: string;
    storeId: string;
    apiKey: string;
    apiSecret: string;
    agentName: string;
    token?: string;
    isStage: boolean;
}

import { useState, useEffect } from "react";
import {
    Package,
    TrendingUp,
    RefreshCw,
    CheckCircle,
    AlertCircle,
    ExternalLink,
    Settings,
    Save,
    X,
    Lock,
    Globe
} from "lucide-react";
import { supabase, setCurrentTenant } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";
import { TrendyolGoClient } from "@/lib/trendyol-go-client";

export default function TrendyolGOWidget() {
    const { currentTenant } = useTenant();
    const [isConfigured, setIsConfigured] = useState(false);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Form States
    const [settings, setSettings] = useState<TrendyolGoSettings>({
        sellerId: "",
        storeId: "",
        apiKey: "",
        apiSecret: "",
        agentName: "JetPos_Entegrasyon",
        token: "",
        isStage: false
    });

    const [stats, setStats] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        stockUpdates: 0,
        lastSync: null,
        status: "idle" // "idle" | "success" | "error"
    });

    const [orders, setOrders] = useState<any[]>([]);

    useEffect(() => {
        if (currentTenant) {
            initWidget();
        }
    }, [currentTenant]);

    const initWidget = async () => {
        if (!currentTenant?.id) return;
        setLoading(true);
        try {
            // RLS için tenant set et
            await setCurrentTenant(currentTenant.id);

            await Promise.all([
                fetchSettings(),
                fetchOrders()
            ]);
        } catch (err) {
            console.error("Widget init error:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        if (!currentTenant?.id) return;
        try {
            const { data, error } = await supabase
                .from('trendyol_go_orders')
                .select('*')
                .eq('tenant_id', currentTenant.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (data) {
                setOrders(data);
                setStats(prev => ({
                    ...prev,
                    totalOrders: data.length,
                    pendingOrders: data.filter(o => o.status === 'CREATED').length
                }));
            }
        } catch (err) {
            console.error("Error fetching orders:", err);
        }
    };

    const fetchSettings = async () => {
        if (!currentTenant?.id) return;
        try {
            const { data, error } = await supabase
                .from('integration_settings')
                .select('*')
                .eq('tenant_id', currentTenant.id)
                .eq('type', 'trendyol_go')
                .single();

            if (data) {
                setSettings({
                    ...data.settings,
                    token: data.settings.token || "" // Token varsa doldur
                });
                setIsConfigured(data.is_active);
                setStats(prev => ({ ...prev, lastSync: data.last_sync_at }));
            }
        } catch (err) {
            console.log("No settings found or error fetching settings");
        }
    };

    const handleSaveSettings = async () => {
        setLoading(true);
        try {
            // RLS için tenant set et
            if (currentTenant?.id) {
                await setCurrentTenant(currentTenant.id);
            }

            const { error } = await supabase.rpc('upsert_integration_settings', {
                p_tenant_id: currentTenant?.id,
                p_type: 'trendyol_go',
                p_settings: settings,
                p_is_active: true
            });

            if (error) throw error;
            setIsConfigured(true);
            setShowSettings(false);
            alert("✅ Trendyol GO ayarları kaydedildi.");
        } catch (err: any) {
            alert("❌ Ayarlar kaydedilemedi: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const [syncDays, setSyncDays] = useState(1);

    const handleSyncOrders = async (days: number = 1) => {
        if (!isConfigured || !currentTenant?.id) return;
        setSyncing(true);
        try {
            // RLS için tenant'ı database session'ına bildir
            await setCurrentTenant(currentTenant.id);

            const client = new TrendyolGoClient(settings);

            // Belirlenen gün aralığındaki siparişleri çek
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

            console.log(`🔎 Trendyol GO: ${days} günlük tarama başlatıldı...`);

            // Tüm durumdaki siparişleri çekmek için statüleri sırayla tara (UPPERCASE zorunlu olabilir)
            const statuses = [undefined, 'CREATED', 'PICKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'ACCEPTED', 'PICKING'];
            let allOrders: any[] = [];

            console.log("🚀 Agresif tarama başlatılıyor...");

            for (const status of statuses) {
                try {
                    // 1. Alternatif: Mağaza ID'si ile dene
                    const statusOrders = await client.getOrders(startDate, endDate, status, true);
                    if (statusOrders && statusOrders.length > 0) {
                        console.log(`✅ [${status || 'ALL'}] durumu için ${statusOrders.length} sipariş bulundu (Mağaza Bazlı).`);
                        allOrders = [...allOrders, ...statusOrders];
                    }

                    // 2. Alternatif: Mağaza ID'si olmadan dene (Mağaza bazlı gelmediyse)
                    if (settings.storeId) {
                        const globalOrders = await client.getOrders(startDate, endDate, status, false);
                        if (globalOrders && globalOrders.length > 0) {
                            console.log(`✅ [${status || 'ALL'}] durumu için ${globalOrders.length} sipariş bulundu (Global Bazlı).`);
                            allOrders = [...allOrders, ...globalOrders];
                        }
                    }
                } catch (statusErr: any) {
                    console.warn(`⚠️ [${status}] sorgusu başarısız:`, statusErr.message);
                }
            }

            // Mükerrer kayıtları temizle (orderNumber bazında)
            const uniqueOrders = Array.from(new Map(allOrders.map(o => [o.orderNumber, o])).values());

            if (uniqueOrders.length > 0) {
                // 1. Mevcut sipariş numaralarını çek (hangileri yeni görelim)
                const { data: existingOrders } = await supabase
                    .from('trendyol_go_orders')
                    .select('order_number')
                    .eq('tenant_id', currentTenant.id)
                    .in('order_number', uniqueOrders.map(o => o.orderNumber));

                const existingOrderNumbers = new Set(existingOrders?.map(o => o.order_number) || []);
                const newOrders = uniqueOrders.filter(o => !existingOrderNumbers.has(o.orderNumber));

                let stockUpdatesCount = 0;

                // 2. Sadece YENİ siparişler için stok düş
                if (newOrders.length > 0) {
                    console.log(`📦 ${newOrders.length} adet yeni sipariş için stok düşümü başlatılıyor...`);

                    for (const order of newOrders) {
                        for (const item of order.lines) {
                            const barcode = item.barcode;
                            if (!barcode) continue;

                            // Ürünü barkoddan bul
                            const { data: product } = await supabase
                                .from('products')
                                .select('id, name, stock_quantity')
                                .eq('tenant_id', currentTenant.id)
                                .eq('barcode', barcode)
                                .single();

                            if (product) {
                                // Stoğu düşür
                                const qty = item.amount || item.quantity || 1;
                                const { error: stockErr } = await supabase.rpc('decrement_stock', {
                                    product_id: product.id,
                                    qty: qty
                                });

                                if (!stockErr) {
                                    stockUpdatesCount++;
                                    console.log(`✅ Stoktan düşüldü: ${product.name} (-${qty})`);
                                }
                            }
                        }
                    }
                }

                // 3. Veritabanına kaydet
                const { error } = await supabase
                    .from('trendyol_go_orders')
                    .upsert(
                        uniqueOrders.map(order => ({
                            tenant_id: currentTenant?.id,
                            order_number: order.orderNumber,
                            customer_name: `${order.customer.firstName} ${order.customer.lastName}`,
                            total_price: order.totalPrice,
                            status: order.packageStatus,
                            items: order.lines,
                            raw_data: order
                        })),
                        { onConflict: 'order_number' }
                    );

                if (error) throw error;

                // Stats güncelle
                setStats(prev => ({
                    ...prev,
                    totalOrders: prev.totalOrders + newOrders.length,
                    pendingOrders: uniqueOrders.filter(o => o.packageStatus === 'CREATED').length,
                    stockUpdates: prev.stockUpdates + stockUpdatesCount,
                    lastSync: new Date().toISOString() as any,
                    status: "success"
                }));

                await supabase
                    .from('integration_settings')
                    .update({ last_sync_at: new Date().toISOString() })
                    .eq('tenant_id', currentTenant?.id)
                    .eq('type', 'trendyol_go');

                await fetchOrders();

                if (newOrders.length > 0) {
                    alert(`✅ ${newOrders.length} yeni sipariş alındı ve ${stockUpdatesCount} ürün stoktan düşüldü.`);
                } else {
                    alert(`ℹ️ Yeni sipariş bulunamadı, mevcut ${uniqueOrders.length} sipariş güncellendi.`);
                }
            } else {
                alert(`ℹ️ Son ${days} gün içinde herhangi bir sipariş (Yeni/Hazır/Teslim) bulunamadı.`);
            }
        } catch (err: any) {
            console.error("Sync Error:", err);
            alert("❌ Senkronizasyon hatası: " + err.message);
        } finally {
            setSyncing(false);
        }
    };

    const handleTestConnection = async () => {
        setSyncing(true);
        try {
            const client = new TrendyolGoClient(settings);
            const success = await client.testConnection();

            if (success) {
                setStats(prev => ({ ...prev, status: "success" }));
                alert("✅ Bağlantı başarılı!");
                // Başarılıysa siparişleri de çekelim
                handleSyncOrders();
            } else {
                setStats(prev => ({ ...prev, status: "error" }));
                alert("❌ Bağlantı başarısız! Bilgileri kontrol edin.");
            }
        } catch (err: any) {
            setStats(prev => ({ ...prev, status: "error" }));
            alert("❌ Hata: " + err.message);
        } finally {
            setSyncing(false);
        }
    };

    if (loading && !showSettings) {
        return (
            <div className="glass-card p-6 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="glass-card !p-8 space-y-8 border-l-4 border-l-orange-500 relative overflow-hidden h-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20">
                        <Package className="w-7 h-7 text-orange-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight">Trendyol GO</h3>
                        <p className="text-xs text-secondary/60 font-bold">Market Entegrasyonu</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isConfigured ? (
                        <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Aktif</span>
                        </div>
                    ) : (
                        <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Yapılandırılmadı</span>
                        </div>
                    )}

                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-2 hover:bg-white/5 rounded-xl text-secondary hover:text-white transition-all"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {showSettings ? (
                /* Settings Form */
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Seller ID</label>
                            <input
                                type="text"
                                value={settings.sellerId}
                                onChange={e => setSettings({ ...settings, sellerId: e.target.value })}
                                className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:border-orange-500/50 outline-none transition-all"
                                placeholder="249371"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Store ID</label>
                            <input
                                type="text"
                                value={settings.storeId}
                                onChange={e => setSettings({ ...settings, storeId: e.target.value })}
                                className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:border-orange-500/50 outline-none transition-all"
                                placeholder="206054"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 ml-1">API Key</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                <input
                                    type="text"
                                    value={settings.apiKey}
                                    onChange={e => setSettings({ ...settings, apiKey: e.target.value })}
                                    className="w-full bg-slate-950/50 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-orange-500/50 outline-none transition-all"
                                    placeholder="qMAPJ..."
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 ml-1">API Secret</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                <input
                                    type="password"
                                    value={settings.apiSecret}
                                    onChange={e => setSettings({ ...settings, apiSecret: e.target.value })}
                                    className="w-full bg-slate-950/50 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-orange-500/50 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Entegrasyon Referans Kodu (Zorunlu)</label>
                            <input
                                type="text"
                                value={settings.agentName}
                                onChange={e => setSettings({ ...settings, agentName: e.target.value })}
                                className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:border-orange-500/50 outline-none transition-all font-mono"
                                placeholder="Trendyol panelindeki Referans Kodunu buraya yapıştırın"
                            />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Token (Opsiyonel)</label>
                            <input
                                type="text"
                                value={(settings as any).token || ""}
                                onChange={e => setSettings({ ...settings, token: e.target.value } as any)}
                                className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:border-orange-500/50 outline-none transition-all font-mono"
                                placeholder="Trendyol panelindeki Token bilgisini buraya yapıştırın"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={settings.isStage}
                                    onChange={e => setSettings({ ...settings, isStage: e.target.checked })}
                                    className="peer hidden"
                                />
                                <div className="w-10 h-6 bg-slate-800 rounded-full peer-checked:bg-orange-500 transition-all after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:w-4 after:h-4 after:rounded-full after:transition-all peer-checked:after:translate-x-4"></div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">Stage Modu</span>
                                <span className="text-[10px] text-slate-500 font-medium">Test ortamı (stageapi.tgoapis.com)</span>
                            </div>
                        </label>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowSettings(false)}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleSaveSettings}
                                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-xl text-xs font-bold text-white transition-all shadow-lg shadow-orange-500/20"
                            >
                                <Save className="w-4 h-4" />
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* Main Widget Content */
                <>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                            <p className="text-[10px] text-secondary font-black uppercase mb-1 tracking-wider">Siparişler</p>
                            <p className="text-2xl font-black text-white">{stats.totalOrders}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                            <p className="text-[10px] text-secondary font-black uppercase mb-1 tracking-wider">Bekleyen</p>
                            <p className="text-2xl font-black text-amber-400">{stats.pendingOrders}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                            <p className="text-[10px] text-secondary font-black uppercase mb-1 tracking-wider">Stok Günc.</p>
                            <p className="text-2xl font-black text-primary">{stats.stockUpdates}</p>
                        </div>
                    </div>

                    {!isConfigured && (
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="text-sm font-black text-amber-400 mb-1">Yapılandırma Gerekli</h4>
                                    <p className="text-[11px] text-amber-400/60 leading-relaxed mb-3">
                                        Trendyol GO Marketplace API ile stok ve siparişlerinizi senkronize edin.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSettings(true)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-orange-500 rounded-xl text-xs font-bold text-white transition-all"
                            >
                                <Settings className="w-4 h-4" />
                                Credentials Ayarla
                            </button>
                        </div>
                    )}

                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] text-secondary font-black uppercase tracking-wider">Senkronizasyon Aralığı</span>
                            <div className="flex gap-1.5 bg-white/5 p-1 rounded-lg border border-white/5">
                                {[1, 7, 30].map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setSyncDays(d)}
                                        className={`px-2 py-1 rounded-md text-[9px] font-black transition-all ${syncDays === d ? 'bg-orange-500 text-white shadow-sm' : 'text-secondary hover:text-white'}`}
                                    >
                                        {d === 1 ? '24S' : `${d} GÜN`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => handleSyncOrders(syncDays)}
                                disabled={syncing || !isConfigured}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-black transition-all disabled:opacity-30 shadow-lg ${isConfigured ? 'shadow-orange-500/20' : ''}`}
                            >
                                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                                {syncing ? 'Senkronize Ediliyor...' : `${syncDays === 1 ? 'Siparişleri Çek' : `Son ${syncDays} Günü Çek`}`}
                            </button>

                            <button
                                onClick={handleTestConnection}
                                disabled={syncing || !isConfigured}
                                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-secondary hover:text-white transition-all border border-white/5"
                                title="Bağlantıyı Test Et"
                            >
                                <CheckCircle className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-secondary" />
                            <span className="text-[10px] text-secondary font-bold uppercase tracking-widest">
                                {settings.isStage ? 'STAGE ORTAMI' : 'PRODUCTION'}
                            </span>
                        </div>
                        {stats.lastSync && (
                            <span className="text-[10px] text-slate-600 font-medium">
                                Son senkr: {new Date(stats.lastSync).toLocaleTimeString('tr-TR')}
                            </span>
                        )}
                    </div>

                    {/* Orders List Area */}
                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between px-1">
                            <h4 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
                                Son Siparişler
                            </h4>
                            <span className="text-[10px] text-secondary font-bold bg-white/5 px-2 py-0.5 rounded-full">
                                {orders.length} Kayıt
                            </span>
                        </div>

                        <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                            {orders.length > 0 ? (
                                orders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="bg-white/5 hover:bg-white/[0.08] border border-white/5 rounded-xl p-3 transition-all group cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-black text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-md">
                                                #{order.order_number}
                                            </span>
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${order.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-500' :
                                                order.status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-500' :
                                                    'bg-amber-500/10 text-amber-500'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>

                                        <div className="flex items-end justify-between">
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors uppercase mb-1">
                                                    {order.customer_name}
                                                </p>

                                                {/* Ürün Listesi */}
                                                <div className="space-y-1 mb-2">
                                                    {order.items && Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                                                        <div key={idx} className="flex items-center gap-1.5 text-[10px]">
                                                            <span className="bg-white/10 px-1.5 py-0.5 rounded text-orange-400 font-bold shrink-0">
                                                                {item.quantity || item.amount}x
                                                            </span>
                                                            <span className="text-secondary/80 font-medium truncate">
                                                                {item.productName || item.name}
                                                            </span>
                                                            <span className="text-slate-600 ml-auto font-bold line-clamp-1">
                                                                {item.price?.unitPrice || item.unitPrice} TL
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <p className="text-[10px] text-secondary/60 font-medium">
                                                    {new Date(order.created_at).toLocaleString('tr-TR', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            <div className="text-right ml-4">
                                                <p className="text-sm font-black text-white whitespace-nowrap">
                                                    {order.total_price} <span className="text-[10px] font-bold text-secondary">TL</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-3">
                                        <Package className="w-6 h-6" />
                                    </div>
                                    <p className="text-xs font-bold text-secondary">Henüz sipariş senkronize edilmedi</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
