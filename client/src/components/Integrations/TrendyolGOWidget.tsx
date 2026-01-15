"use client";

interface TrendyolGoSettings {
    sellerId: string;
    storeId: string;
    apiKey: string;
    apiSecret: string;
    agentName: string;
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
import { supabase } from "@/lib/supabase";
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
        isStage: true
    });

    const [stats, setStats] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        stockUpdates: 0,
        lastSync: null,
        status: "idle" // "idle" | "success" | "error"
    });

    useEffect(() => {
        if (currentTenant) {
            fetchSettings();
        }
    }, [currentTenant]);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('integration_settings')
                .select('*')
                .eq('type', 'trendyol_go')
                .single();

            if (data) {
                setSettings(data.settings);
                setIsConfigured(data.is_active);
                setStats(prev => ({ ...prev, lastSync: data.last_sync_at }));
            }
        } catch (err) {
            console.log("No settings found or error fetching settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        setLoading(true);
        try {
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

    const handleSyncOrders = async () => {
        if (!isConfigured) return;
        setSyncing(true);
        try {
            const client = new TrendyolGoClient(settings);

            // Son 24 saatteki siparişleri çek
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

            const orders = await client.getOrders(startDate, endDate);

            if (orders && orders.length > 0) {
                // Supabase'e kaydet (upsert by orderNumber)
                const { error } = await supabase
                    .from('trendyol_go_orders')
                    .upsert(
                        orders.map(order => ({
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
                    totalOrders: prev.totalOrders + orders.length,
                    pendingOrders: orders.filter(o => o.packageStatus === 'Created').length,
                    lastSync: new Date().toISOString() as any,
                    status: "success"
                }));

                // integration_settings tablosundaki last_sync_at'i güncelle
                await supabase
                    .from('integration_settings')
                    .update({ last_sync_at: new Date().toISOString() })
                    .eq('tenant_id', currentTenant?.id)
                    .eq('type', 'trendyol_go');

                alert(`✅ ${orders.length} sipariş başarıyla senkronize edildi.`);
            } else {
                alert("ℹ️ Yeni sipariş bulunamadı.");
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
        <div className="glass-card p-6 space-y-6 border-l-4 border-l-orange-500 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center">
                        <Package className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white">Trendyol GO</h3>
                        <p className="text-xs text-secondary">Hızlı Market Entegrasyonu</p>
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

                    <div className="flex gap-3">
                        <button
                            onClick={handleTestConnection}
                            disabled={syncing || !isConfigured}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-black transition-all disabled:opacity-30 shadow-lg ${isConfigured ? 'shadow-orange-500/20' : ''}`}
                        >
                            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                            {syncing ? 'Test Ediliyor...' : 'Bağlantıyı Test Et'}
                        </button>

                        <button
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all border border-white/5"
                            onClick={() => window.open('https://developers.tgoapps.com/docs/category/7-trendyol-go-by-uber-eats---market-entegrasyonu', '_blank')}
                            title="Dokümantasyon"
                        >
                            <ExternalLink className="w-5 h-5" />
                        </button>
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
                </>
            )}
        </div>
    );
}
