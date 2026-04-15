"use client";

interface TrendyolGoSettings {
    sellerId: string;
    storeId: string;
    apiKey: string;
    apiSecret: string;
    agentName: string;
    token?: string;
    isStage: boolean;
    isStockSyncActive: boolean;
}

import { useState, useEffect } from "react";
import { apiFetch } from '@/lib/api';
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
    const [isSystemLevel, setIsSystemLevel] = useState(false);
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
        isStage: false,
        isStockSyncActive: false
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

    const fetchOrders = async (days: number = syncDays) => {
        if (!currentTenant?.id) return;
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const isoStartDate = startDate.toISOString();

            // İstatistik için aynı tarih aralığındaki tüm kayıtların tam sayısına bakalım (limit olmadan)
            const { count: totalOrders } = await supabase
                .from('trendyol_go_orders')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', currentTenant.id)
                .gte('created_at', isoStartDate);

            const { count: pendingOrders } = await supabase
                .from('trendyol_go_orders')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', currentTenant.id)
                .gte('created_at', isoStartDate)
                .eq('status', 'CREATED');

            // Liste için belirlediğimiz tarih aralığından son maks 100 kaydı çekelim
            const { data, error } = await supabase
                .from('trendyol_go_orders')
                .select('*')
                .eq('tenant_id', currentTenant.id)
                .gte('created_at', isoStartDate)
                .order('created_at', { ascending: false })
                .limit(100);

            if (data) {
                setOrders(data);
                setStats(prev => ({
                    ...prev,
                    totalOrders: totalOrders || 0,
                    pendingOrders: pendingOrders || 0
                }));
            }
        } catch (err) {
            console.error("Error fetching orders:", err);
        }
    };

    const fetchSettings = async () => {
        if (!currentTenant?.id) return;
        try {
            // 1. Önce Entegrasyon Ayarları tablosundan çek
            const { data: intData } = await supabase
                .from('integration_settings')
                .select('*')
                .eq('tenant_id', currentTenant.id)
                .or('type.eq.trendyol_go,platform.eq.trendyol')
                .maybeSingle();

            if (intData) {
                const config = intData.api_config || intData.settings || {};
                setSettings({
                    sellerId: config.sellerId || "",
                    storeId: config.storeId || "",
                    apiKey: config.apiKey || "",
                    apiSecret: config.apiSecret || "",
                    agentName: config.agentName || "JetPos_Entegrasyon",
                    token: config.token || "",
                    isStage: config.isStage || config.stage || false,
                    isStockSyncActive: config.isStockSyncActive || false
                });
                setIsConfigured(intData.is_active);
                setStats(prev => ({ ...prev, lastSync: intData.last_sync_at }));
                return; // Bulunduysa devam etme
            }

            // 2. Eğer orada yoksa, Müşteri Lisans (tenants) tablosundaki ayarları kontrol et (Super Admin verisi)
            const { data: tenantData } = await supabase
                .from('tenants')
                .select('settings')
                .eq('id', currentTenant.id)
                .single();

            if (tenantData?.settings?.trendyolGo) {
                const tg = tenantData.settings.trendyolGo;
                setSettings({
                    sellerId: tg.sellerId || "",
                    storeId: tg.storeId || "",
                    apiKey: tg.apiKey || "",
                    apiSecret: tg.apiSecret || "",
                    agentName: "JetPos_Entegrasyon",
                    token: tg.token || "",
                    isStage: tg.stage || false
                });
                setIsConfigured(true);
            } else {
                // 3. Hiçbiri yoksa Sistem Ayarlarını (.env.local) kontrol et
                try {
                    const sys = await apiFetch('/api/trendyol/settings');
                    if (sys && sys.isSystemConfigured) {
                        setSettings(prev => ({
                            ...prev,
                            sellerId: sys.sellerId,
                            storeId: sys.storeId,
                            apiKey: sys.apiKey,
                            apiSecret: sys.apiSecret,
                            agentName: sys.agentName,
                            token: sys.token,
                            isStage: sys.isStage
                        }));
                        setIsConfigured(true);
                        setIsSystemLevel(true);
                    }
                } catch (settingsErr) {
                    console.log("System settings fetch failed, ignoring...");
                }
            }
        } catch (err) {
            console.log("No settings found or error fetching settings:", err);
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

    const [syncDays, setSyncDays] = useState(30);

    const handleSyncOrders = async (days: number = 30) => {
        if (!isConfigured || !currentTenant?.id) return;
        setSyncing(true);
        try {
            // Arka planda API üzerinden senkronizasyon yap (SECURE API FETCH - v1.3.2)
            const result = await apiFetch(`/api/trendyol/sync-orders?tenantId=${currentTenant.id}&days=${days}`, { 
                method: 'POST' 
            });

            if (result.success) {
                // Stats güncelle
                setStats(prev => ({
                    ...prev,
                    lastSync: new Date().toISOString() as any,
                    status: "success"
                }));

                // Sadece siparişleri sessizce çek, sayfayı yenileme kanka
                await fetchOrders(days);
            } else {
                throw new Error(result.error || 'Senkronizasyon başarısız.');
            }
        } catch (err: any) {
            console.error("Sync Error:", err);
        } finally {
            setSyncing(false);
        }
    };

    const handleSyncStock = async () => {
        if (!isConfigured || !currentTenant?.id) return;
        
        // ŞALTER KONTROLÜ (v1.3.9)
        if (!settings.isStockSyncActive) {
            alert("⚠️ Stok senkronizasyonu şu an kapalı. Lütfen ayarlardan aktif edin.");
            return;
        }

        setSyncing(true);
        try {
            // Stokları Trendyol'a gönder (SECURE API FETCH - v1.3.8)
            const result = await apiFetch(`/api/trendyol/sync-stock?tenantId=${currentTenant.id}`, { 
                method: 'POST' 
            });

            if (result.success) {
                alert(`✅ ${result.count} ürünün stoğu başarıyla Trendyol'a güncellendi.`);
            } else {
                throw new Error(result.error || 'Stok senkronizasyonu başarısız.');
            }
        } catch (err: any) {
            console.error("Stock Sync Error:", err);
            alert("❌ Stok hatası: " + err.message);
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
        <div className="glass-card !p-8 space-y-8 border-l-4 border-l-orange-500 relative overflow-hidden">
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
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                                {isSystemLevel ? 'Sistem Bazlı Aktif' : 'Aktif'}
                            </span>
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

                        {/* STOK ŞALTERİ (v1.3.9) */}
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={settings.isStockSyncActive}
                                    onChange={e => setSettings({ ...settings, isStockSyncActive: e.target.checked })}
                                    className="peer hidden"
                                />
                                <div className="w-10 h-6 bg-slate-800 rounded-full peer-checked:bg-emerald-500 transition-all after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:w-4 after:h-4 after:rounded-full after:transition-all peer-checked:after:translate-x-4"></div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">Stok Senkronizasyonu</span>
                                <span className="text-[10px] text-slate-500 font-medium">Aktif et (Stokları gönder)</span>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="glass-card relative overflow-hidden !p-5 border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-transparent group hover:scale-[1.02] transition-transform">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Package className="w-12 h-12 text-orange-500" />
                            </div>
                            <p className="text-[10px] text-orange-300 font-black uppercase mb-1 tracking-widest">Siparişler</p>
                            <p className="text-3xl font-black text-white">{stats.totalOrders}</p>
                        </div>
                        <div className="glass-card relative overflow-hidden !p-5 border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent group hover:scale-[1.02] transition-transform">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <AlertCircle className="w-12 h-12 text-amber-500" />
                            </div>
                            <p className="text-[10px] text-amber-300 font-black uppercase mb-1 tracking-widest">Bekleyen</p>
                            <p className="text-3xl font-black text-amber-400">{stats.pendingOrders}</p>
                        </div>
                        <div className="glass-card relative overflow-hidden !p-5 border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent group hover:scale-[1.02] transition-transform">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <RefreshCw className="w-12 h-12 text-emerald-500" />
                            </div>
                            <p className="text-[10px] text-emerald-300 font-black uppercase mb-1 tracking-widest">Stok Günc.</p>
                            <p className="text-3xl font-black text-emerald-400">{stats.stockUpdates}</p>
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
                            <div className="flex gap-1 p-1 bg-black/20 rounded-xl border border-white/5 backdrop-blur-md">
                                {[1, 7, 30].map(d => (
                                    <button
                                        key={d}
                                        onClick={() => {
                                            setSyncDays(d);
                                            fetchOrders(d);
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${syncDays === d ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-secondary hover:text-white hover:bg-white/5'}`}
                                    >
                                        {d === 1 ? '24S' : `${d} GÜN`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleSyncOrders(syncDays)}
                                    disabled={syncing || !isConfigured}
                                    className={`flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-orange-500 hover:bg-orange-600 rounded-2xl text-white font-black transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 shadow-xl ${isConfigured ? 'shadow-orange-500/20' : ''}`}
                                >
                                    <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                                    <span className="tracking-wide">
                                        {syncing ? 'İŞLEM YAPILIYOR...' : `${syncDays === 1 ? 'SİPARİŞLERİ ÇEK' : `SON ${syncDays} GÜNÜ ÇEK`}`}
                                    </span>
                                </button>

                                <button
                                    onClick={handleTestConnection}
                                    disabled={syncing || !isConfigured}
                                    className="p-3.5 bg-white/5 hover:bg-white/10 rounded-2xl text-secondary hover:text-emerald-400 transition-all border border-white/5 hover:border-emerald-500/30 group"
                                    title="Bağlantıyı Test Et"
                                >
                                    <CheckCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                </button>
                            </div>

                            <button
                                onClick={handleSyncStock}
                                disabled={syncing || !isConfigured}
                                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 border border-white/5 hover:border-orange-500/30 rounded-2xl text-white/80 hover:text-white font-bold transition-all disabled:opacity-50 active:scale-[0.99]"
                            >
                                <Package className={`w-4 h-4 ${syncing ? 'animate-bounce' : ''}`} />
                                <span>STOKLARI TRENDYOL'A GÜNCELLE</span>
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
                    <div className="space-y-4 pt-6 border-t border-white/5 mt-4">
                        <div className="flex items-center justify-between px-1">
                            <h4 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-orange-500" />
                                Son Siparişler
                            </h4>
                            <span className="text-[10px] text-orange-400 font-black bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                                {orders.length} Kayıt
                            </span>
                        </div>

                        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                            {orders.length > 0 ? (
                                orders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="relative overflow-hidden glass-card !p-4 group cursor-pointer hover:border-orange-500/30 border border-white/5 transition-all hover:shadow-xl hover:shadow-orange-500/5 hover:-translate-y-0.5"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-orange-500/10 transition-colors" />

                                        <div className="relative flex items-center justify-between mb-3 border-b border-white/5 pb-3">
                                            <span className="text-[11px] font-black text-orange-500 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-lg tracking-wider">
                                                #{order.order_number}
                                            </span>
                                            <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border backdrop-blur-sm shadow-sm ${order.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                order.status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
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
                                                    {order.items && Array.isArray(order.items) && order.items.map((item: any, idx: number) => {
                                                        // Debug için konsola bas
                                                        if (idx === 0) console.log('Trendyol Item Structure:', item);

                                                        const name = item.product?.productSaleName ||
                                                            item.product?.name ||
                                                            item.productName ||
                                                            item.name ||
                                                            item.itemName ||
                                                            item.label ||
                                                            'İsimsiz Ürün';

                                                        let qty = item.quantity || item.count || 1;
                                                        let price = item.price?.unitPrice || item.unitPrice || item.price || item.totalPrice || item.amount || 0;

                                                        // Hatalı eşleşme koruması (Miktar kısmına fiyatın geçmesi durumu)
                                                        if (qty === price && qty > 10) {
                                                            qty = 1;
                                                        } else if (qty > 50 && price === 0) {
                                                            price = qty;
                                                            qty = 1;
                                                        }

                                                        return (
                                                            <div key={idx} className="flex items-center gap-2 text-[11px] bg-black/20 p-2 rounded-lg border border-white/5 group-hover:bg-black/30 transition-colors">
                                                                <span className="bg-orange-500 text-white min-w-[24px] text-center py-0.5 rounded flex-shrink-0 font-black shadow-sm">
                                                                    {qty}x
                                                                </span>
                                                                <span className="text-secondary group-hover:text-white font-medium truncate flex-1 transition-colors">
                                                                    {name}
                                                                </span>
                                                                <span className="text-orange-400 font-bold whitespace-nowrap bg-orange-500/10 px-2 py-0.5 rounded">
                                                                    {price} TL
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-secondary/50" />
                                                    <p className="text-[10px] tracking-wider uppercase text-secondary/60 font-bold inline-flex items-center">
                                                        {new Date(order.created_at).toLocaleString('tr-TR', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right ml-4 flex flex-col justify-end">
                                                <p className="text-[10px] uppercase tracking-widest font-black text-secondary mb-1">Toplam</p>
                                                <div className="bg-white/5 px-3 py-2 rounded-xl border border-white/10">
                                                    <p className="text-xl font-black text-white whitespace-nowrap">
                                                        {order.total_price} <span className="text-xs font-bold text-orange-400">TL</span>
                                                    </p>
                                                </div>
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
