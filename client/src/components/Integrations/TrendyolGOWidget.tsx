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

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { apiFetch } from '@/lib/api';
import {
    Package,
    TrendingUp,
    RefreshCw,
    CheckCircle,
    AlertCircle,
    Settings,
    Save,
    X,
    Lock,
    Globe,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    DollarSign,
    ShoppingCart,
    Clock,
    BarChart3,
    Calendar,
    Percent,
    Truck,
    XCircle,
    CheckCircle2,
    Loader2,
    Zap,
    Eye,
    Bell
} from "lucide-react";
import { supabase, setCurrentTenant } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";
import { TrendyolGoClient } from "@/lib/trendyol-go-client";

// =====================================================
// ANA WIDGET — State yönetimi ve veri çekme
// =====================================================
export default function TrendyolGOWidget({ activeSubTab = 'overview' }: { activeSubTab?: string }) {
    const { currentTenant } = useTenant();
    const [isConfigured, setIsConfigured] = useState(false);
    const [isSystemLevel, setIsSystemLevel] = useState(false);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [syncDays, setSyncDays] = useState(30);

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
        lastSync: null as string | null,
        status: "idle"
    });

    const [orders, setOrders] = useState<any[]>([]);
    const [newOrderNotification, setNewOrderNotification] = useState<any | null>(null);

    // Otomatik senkronizasyon icin spam koruması: art arda/cok sik tetiklemeleri engeller
    const lastSyncAtRef = useRef<number>(0);
    const AUTO_SYNC_INTERVAL_MS = 3 * 60 * 1000; // 3 dakika

    // Bildirim sesini çal
    const playNotificationSound = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            oscillator.frequency.setValueAtTime(880, ctx.currentTime);
            oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.5);
        } catch (e) {
            console.log('Audio notification failed:', e);
        }
    }, []);

    useEffect(() => {
        if (currentTenant) {
            initWidget();
        }
    }, [currentTenant]);

    // 🔔 REALTIME: Yeni sipariş geldiğinde bildirim göster
    useEffect(() => {
        if (!currentTenant?.id) return;

        const channel = supabase
            .channel(`trendyol_orders_realtime_${currentTenant.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'trendyol_go_orders',
                filter: `tenant_id=eq.${currentTenant.id}`
            }, (payload) => {
                const newOrder = payload.new as any;
                console.log('🔔 Yeni Trendyol Siparişi:', newOrder);

                // Bildirim popup'ını göster
                setNewOrderNotification(newOrder);
                playNotificationSound();

                // Siparişleri güncelle
                setOrders(prev => [newOrder, ...prev]);
                setStats(prev => ({
                    ...prev,
                    totalOrders: prev.totalOrders + 1
                }));

                // 8 saniye sonra bildirimi kapat
                setTimeout(() => setNewOrderNotification(null), 8000);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentTenant?.id, playNotificationSound]);

    const initWidget = async () => {
        if (!currentTenant?.id) return;
        setLoading(true);
        try {
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
                .eq('status', 'Created');

            // Tüm siparişleri çek (sayfalama ile, limit yok)
            let allOrders: any[] = [];
            let from = 0;
            const pageSize = 1000;
            let hasMore = true;

            while (hasMore) {
                const { data, error } = await supabase
                    .from('trendyol_go_orders')
                    .select('*')
                    .eq('tenant_id', currentTenant.id)
                    .gte('created_at', isoStartDate)
                    .order('created_at', { ascending: false })
                    .range(from, from + pageSize - 1);

                if (error) throw error;

                if (data && data.length > 0) {
                    allOrders = [...allOrders, ...data];
                    from += pageSize;
                    if (data.length < pageSize) hasMore = false;
                } else {
                    hasMore = false;
                }
                if (from > 10000) break; // Güvenlik limiti
            }

            setOrders(allOrders);
            setStats(prev => ({
                ...prev,
                totalOrders: totalOrders || 0,
                pendingOrders: pendingOrders || 0
            }));
        } catch (err) {
            console.error("Error fetching orders:", err);
        }
    };

    const fetchSettings = async () => {
        if (!currentTenant?.id) return;
        try {
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
                return;
            }

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
                    isStage: tg.stage || false,
                    isStockSyncActive: tg.isStockSyncActive || false
                });
                setIsConfigured(true);
            } else {
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
                            isStage: sys.isStage,
                            isStockSyncActive: sys.isStockSyncActive || false
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
            alert("✅ Trendyol GO ayarları kaydedildi.");
        } catch (err: any) {
            alert("❌ Ayarlar kaydedilemedi: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSyncOrders = async (days: number = 30) => {
        if (!isConfigured || !currentTenant?.id) return;
        lastSyncAtRef.current = Date.now();
        setSyncing(true);
        try {
            const result = await apiFetch(`/api/trendyol/sync-orders?tenantId=${currentTenant.id}&days=${days}`, {
                method: 'POST'
            });
            if (result.success) {
                setStats(prev => ({
                    ...prev,
                    lastSync: new Date().toISOString() as any,
                    status: "success"
                }));
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

    // 🔄 Otomatik senkronizasyon: ekrana her girişte ve periyodik olarak Trendyol'dan
    // siparişleri ceker, boylece istatistikler manuel "Siparişleri Çek" tıklanmadan da
    // guncel kalir. lastSyncAtRef ile spam korumasi: cok sik tetiklenmeyi engeller.
    useEffect(() => {
        if (!currentTenant?.id || !isConfigured) return;

        const tick = () => {
            const elapsed = Date.now() - lastSyncAtRef.current;
            if (elapsed < AUTO_SYNC_INTERVAL_MS) return;
            handleSyncOrders(syncDays);
        };

        tick();
        const interval = setInterval(tick, AUTO_SYNC_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [currentTenant?.id, isConfigured]);

    const handleSyncStock = async () => {
        if (!isConfigured || !currentTenant?.id) return;
        if (!settings.isStockSyncActive) {
            alert("⚠️ Stok senkronizasyonu şu an kapalı. Lütfen ayarlardan aktif edin.");
            return;
        }
        setSyncing(true);
        try {
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                    <p className="text-xs font-bold text-secondary animate-pulse">Trendyol verileri yükleniyor...</p>
                </div>
            </div>
        );
    }

    // TAB ROUTING — İçeriği bildirim popup'ı ile sar
    const renderTab = () => {
        switch (activeSubTab) {
            case 'orders':
                return <OrdersTab orders={orders} syncDays={syncDays} setSyncDays={setSyncDays} fetchOrders={fetchOrders} handleSyncOrders={handleSyncOrders} syncing={syncing} isConfigured={isConfigured} />;
            case 'finance':
                return <FinanceTab orders={orders} syncDays={syncDays} />;
            case 'settings':
                return <SettingsTab settings={settings} setSettings={setSettings} handleSaveSettings={handleSaveSettings} handleTestConnection={handleTestConnection} loading={loading} syncing={syncing} isConfigured={isConfigured} isSystemLevel={isSystemLevel} handleSyncStock={handleSyncStock} />;
            default:
                return <OverviewTab stats={stats} orders={orders} isConfigured={isConfigured} isSystemLevel={isSystemLevel} settings={settings} syncing={syncing} handleSyncOrders={handleSyncOrders} handleSyncStock={handleSyncStock} syncDays={syncDays} setSyncDays={setSyncDays} fetchOrders={fetchOrders} />;
        }
    };

    return (
        <>
            {/* 🔔 YENİ SİPARİŞ BİLDİRİM POPUP */}
            {newOrderNotification && (
                <div className="fixed top-6 right-6 z-[9999] animate-in slide-in-from-right-full fade-in duration-500">
                    <div className="relative bg-gradient-to-br from-orange-600 to-orange-500 rounded-2xl shadow-2xl shadow-orange-500/30 p-5 min-w-[340px] max-w-[400px] border border-orange-400/30 overflow-hidden">
                        {/* Parlama efekti */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
                            <div className="h-full bg-white/50 animate-[shrink_8s_linear_forwards]" style={{ animation: 'shrink 8s linear forwards' }} />
                        </div>

                        {/* Kapat butonu */}
                        <button
                            onClick={() => setNewOrderNotification(null)}
                            className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/20 transition-all"
                        >
                            <X className="w-4 h-4 text-white/70" />
                        </button>

                        {/* İçerik */}
                        <div className="relative flex items-start gap-4">
                            <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm border border-white/20">
                                <Bell className="w-6 h-6 text-white animate-bounce" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest mb-1">🔔 Yeni Trendyol Siparişi</p>
                                <p className="text-white font-black text-lg mb-1 truncate">
                                    #{newOrderNotification.order_number?.toString().slice(-8)}
                                </p>
                                <p className="text-white/80 text-sm font-medium truncate">{newOrderNotification.customer_name || 'Müşteri'}</p>
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/20">
                                    <span className="text-white/60 text-xs font-bold">Toplam Tutar</span>
                                    <span className="text-white font-black text-xl">
                                        {newOrderNotification.total_price} <span className="text-sm text-white/70">₺</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {renderTab()}
        </>
    );
}

// =====================================================
// TAB 1: GENEL BAKIŞ (Overview Dashboard)
// =====================================================
function OverviewTab({ stats, orders, isConfigured, isSystemLevel, settings, syncing, handleSyncOrders, handleSyncStock, syncDays, setSyncDays, fetchOrders }: any) {
    // Hesaplamalar
    const totalRevenue = useMemo(() => orders.reduce((sum: number, o: any) => sum + (parseFloat(o.total_price) || 0), 0), [orders]);
    const deliveredOrders = useMemo(() => orders.filter((o: any) => o.status === 'Delivered'), [orders]);
    const cancelledOrders = useMemo(() => orders.filter((o: any) => o.status === 'Cancelled'), [orders]);
    const deliveredRevenue = useMemo(() => deliveredOrders.reduce((sum: number, o: any) => sum + (parseFloat(o.total_price) || 0), 0), [deliveredOrders]);

    // Basit günlük trend (son 7 gün)
    const dailyTrend = useMemo(() => {
        const days: { [key: string]: number } = {};
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
            days[key] = 0;
        }
        orders.forEach((o: any) => {
            const d = new Date(o.created_at);
            const key = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
            if (days[key] !== undefined) {
                days[key] += parseFloat(o.total_price) || 0;
            }
        });
        return Object.entries(days).map(([label, value]) => ({ label, value }));
    }, [orders]);

    const maxTrend = Math.max(...dailyTrend.map(d => d.value), 1);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Bağlantı Durumu Bar */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center border border-orange-500/20">
                        <Package className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-foreground">Trendyol GO</h3>
                        <p className="text-[10px] text-secondary/60 font-bold">
                            {settings.isStage ? 'Stage Ortamı' : 'Production'} • {isSystemLevel ? 'Sistem Bazlı' : 'Tenant Bazlı'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isConfigured ? (
                        <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Bağlı</span>
                        </div>
                    ) : (
                        <div className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-rose-500" />
                            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Bağlı Değil</span>
                        </div>
                    )}
                    {stats.lastSync && (
                        <span className="text-[10px] text-slate-600 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(stats.lastSync).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                </div>
            </div>

            {/* İstatistik Kartları */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Toplam Sipariş */}
                <div className="glass-card relative overflow-hidden !p-5 border-orange-500/10 group hover:border-orange-500/30 transition-all hover:shadow-lg hover:shadow-orange-500/5">
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ShoppingCart className="w-16 h-16 text-orange-500" />
                    </div>
                    <p className="text-[10px] text-orange-300/80 font-black uppercase mb-2 tracking-widest">Toplam Sipariş</p>
                    <p className="text-3xl font-black text-foreground mb-1">{stats.totalOrders}</p>
                    <p className="text-[10px] text-secondary/50 font-bold">Son {syncDays} gün</p>
                </div>

                {/* Bekleyen */}
                <div className="glass-card relative overflow-hidden !p-5 border-amber-500/10 group hover:border-amber-500/30 transition-all hover:shadow-lg hover:shadow-amber-500/5">
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Clock className="w-16 h-16 text-amber-500" />
                    </div>
                    <p className="text-[10px] text-amber-300/80 font-black uppercase mb-2 tracking-widest">Bekleyen</p>
                    <p className="text-3xl font-black text-amber-400 mb-1">{stats.pendingOrders}</p>
                    <p className="text-[10px] text-secondary/50 font-bold">İşlem bekliyor</p>
                </div>

                {/* Toplam Ciro */}
                <div className="glass-card relative overflow-hidden !p-5 border-emerald-500/10 group hover:border-emerald-500/30 transition-all hover:shadow-lg hover:shadow-emerald-500/5">
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <DollarSign className="w-16 h-16 text-emerald-500" />
                    </div>
                    <p className="text-[10px] text-emerald-300/80 font-black uppercase mb-2 tracking-widest">Toplam Ciro</p>
                    <p className="text-2xl font-black text-emerald-400 mb-1">
                        {totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        <span className="text-sm ml-1 text-emerald-500/60">₺</span>
                    </p>
                    <p className="text-[10px] text-secondary/50 font-bold">Brüt gelir</p>
                </div>

                {/* Teslim Edildi */}
                <div className="glass-card relative overflow-hidden !p-5 border-blue-500/10 group hover:border-blue-500/30 transition-all hover:shadow-lg hover:shadow-blue-500/5">
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Truck className="w-16 h-16 text-blue-500" />
                    </div>
                    <p className="text-[10px] text-blue-300/80 font-black uppercase mb-2 tracking-widest">Teslim Edildi</p>
                    <p className="text-3xl font-black text-blue-400 mb-1">{deliveredOrders.length}</p>
                    <p className="text-[10px] text-secondary/50 font-bold">{cancelledOrders.length} iptal</p>
                </div>
            </div>

            {/* Mini Günlük Trend Grafiği */}
            <div className="glass-card !p-6">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-orange-500" />
                        Son 7 Gün Ciro Trendi
                    </h4>
                    <span className="text-[10px] text-secondary/50 font-bold">
                        {deliveredRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 0 })} ₺ teslim edilen
                    </span>
                </div>
                <div className="flex items-end gap-2 h-32">
                    {dailyTrend.map((d, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                            <span className="text-[9px] text-orange-400/80 font-bold">
                                {d.value > 0 ? `${(d.value / 1000).toFixed(1)}k` : ''}
                            </span>
                            <div className="w-full relative group">
                                <div
                                    className="w-full bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-lg transition-all duration-500 group-hover:from-orange-500 group-hover:to-orange-300 group-hover:shadow-lg group-hover:shadow-orange-500/20 min-h-[4px]"
                                    style={{ height: `${Math.max((d.value / maxTrend) * 100, 4)}px` }}
                                />
                            </div>
                            <span className="text-[9px] text-secondary/40 font-bold">{d.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Hızlı Aksiyonlar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                    onClick={() => handleSyncOrders(syncDays)}
                    disabled={syncing || !isConfigured}
                    className="flex items-center justify-center gap-3 px-5 py-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 rounded-2xl text-primary-foreground font-black transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-orange-500/20"
                >
                    <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                    <span className="tracking-wide">{syncing ? 'SENKRONİZE EDİLİYOR...' : 'SİPARİŞLERİ ÇEK'}</span>
                </button>
                <button
                    onClick={handleSyncStock}
                    disabled={syncing || !isConfigured}
                    className="flex items-center justify-center gap-3 px-5 py-4 bg-muted/50 hover:bg-muted border border-border hover:border-orange-500/30 rounded-2xl text-foreground font-black transition-all disabled:opacity-50 active:scale-[0.99]"
                >
                    <Package className="w-5 h-5 text-orange-500" />
                    <span>STOKLARI GÜNCELLE</span>
                </button>
            </div>

            {/* Son 5 Sipariş (Quick Preview) */}
            {orders.length > 0 && (
                <div className="glass-card !p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                            <Zap className="w-4 h-4 text-orange-500" />
                            Son Siparişler
                        </h4>
                        <span className="text-[10px] text-orange-400 font-black bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                            {orders.length} Kayıt
                        </span>
                    </div>
                    <div className="space-y-2">
                        {orders.slice(0, 5).map((order: any) => (
                            <div key={order.id} className="flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl border border-white/5 transition-all group">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-orange-500 bg-orange-500/10 px-2 py-1 rounded-lg">
                                        #{order.order_number?.toString().slice(-6)}
                                    </span>
                                    <div>
                                        <p className="text-xs font-bold text-foreground group-hover:text-orange-400 transition-colors">{order.customer_name}</p>
                                        <p className="text-[10px] text-secondary/50">
                                            {new Date(order.created_at).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <OrderStatusBadge status={order.status} />
                                    <span className="text-sm font-black text-foreground">{order.total_price} ₺</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// =====================================================
// TAB 2: SİPARİŞLER (Orders)
// =====================================================
function OrdersTab({ orders, syncDays, setSyncDays, fetchOrders, handleSyncOrders, syncing, isConfigured }: any) {
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredOrders = useMemo(() => {
        let filtered = orders;
        if (statusFilter !== 'all') {
            filtered = filtered.filter((o: any) => (o.status || '').toLowerCase() === statusFilter.toLowerCase());
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter((o: any) =>
                o.customer_name?.toLowerCase().includes(q) ||
                o.order_number?.toString().includes(q)
            );
        }
        return filtered;
    }, [orders, statusFilter, searchQuery]);

    const statusCounts = useMemo(() => {
        const counts: { [key: string]: number } = { all: orders.length };
        orders.forEach((o: any) => {
            counts[o.status] = (counts[o.status] || 0) + 1;
        });
        return counts;
    }, [orders]);

    const statuses = [
        { key: 'all', label: 'Tümü', icon: Eye },
        { key: 'Delivered', label: 'Teslim', icon: CheckCircle2 },
        { key: 'Created', label: 'Bekleyen', icon: Clock },
        { key: 'Cancelled', label: 'İptal', icon: XCircle },
        { key: 'UnSupplied', label: 'Tedarik Edilemedi', icon: AlertCircle },
        { key: 'Picked', label: 'Hazır', icon: Package },
        { key: 'Shipped', label: 'Yolda', icon: Truck },
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Üst Bar: Tarih ve Senkronizasyon */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex gap-1 p-1 bg-black/20 rounded-xl border border-white/5 backdrop-blur-md">
                    {[1, 7, 30].map(d => (
                        <button
                            key={d}
                            onClick={() => {
                                setSyncDays(d);
                                fetchOrders(d);
                            }}
                            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${syncDays === d ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-secondary hover:text-foreground hover:bg-muted'}`}
                        >
                            {d === 1 ? '24 Saat' : `${d} Gün`}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => handleSyncOrders(syncDays)}
                    disabled={syncing || !isConfigured}
                    className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 rounded-xl text-xs font-black text-white transition-all disabled:opacity-50 shadow-lg shadow-orange-500/20"
                >
                    <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Çekiliyor...' : 'Siparişleri Çek'}
                </button>
            </div>

            {/* Filtre Tabları */}
            <div className="flex flex-wrap gap-2">
                {statuses.map(s => (
                    <button
                        key={s.key}
                        onClick={() => setStatusFilter(s.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${statusFilter === s.key
                            ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                            : 'bg-background border-border text-secondary hover:text-foreground hover:bg-muted'}`}
                    >
                        <s.icon className="w-3.5 h-3.5" />
                        {s.label}
                        {statusCounts[s.key] !== undefined && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${statusFilter === s.key ? 'bg-orange-500/20 text-orange-300' : 'bg-white/5 text-secondary/60'}`}>
                                {statusCounts[s.key] || 0}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Arama */}
            <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/40" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Sipariş no veya müşteri adı ile ara..."
                    className="w-full bg-background border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-secondary/30 focus:border-orange-500/30 outline-none transition-all"
                />
            </div>

            {/* Sipariş Listesi */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {filteredOrders.length > 0 ? (
                    filteredOrders.map((order: any) => (
                        <div key={order.id} className="glass-card !p-5 group hover:border-orange-500/20 border border-white/5 transition-all hover:shadow-xl hover:shadow-orange-500/5">
                            {/* Sipariş Header */}
                            <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <span className="text-[11px] font-black text-orange-500 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-lg tracking-wider">
                                        #{order.order_number}
                                    </span>
                                    <span className="text-[10px] text-secondary/50 font-bold flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(order.created_at).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <OrderStatusBadge status={order.status} />
                            </div>

                            {/* Müşteri ve Ürünler */}
                            <div className="flex items-end justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-foreground mb-2">{order.customer_name}</p>
                                    <div className="space-y-1.5">
                                        {order.items && Array.isArray(order.items) && order.items.slice(0, 4).map((item: any, idx: number) => {
                                            const name = item.product?.productSaleName || item.product?.name || item.productName || item.name || item.itemName || item.label || 'İsimsiz Ürün';
                                            let qty = item.quantity || item.count || 1;
                                            let price = item.price?.unitPrice || item.unitPrice || item.price || item.totalPrice || item.amount || 0;
                                            if (qty === price && qty > 10) { qty = 1; }
                                            else if (qty > 50 && price === 0) { price = qty; qty = 1; }

                                            return (
                                                <div key={idx} className="flex items-center gap-2 text-[11px]">
                                                    <span className="bg-orange-500 text-white min-w-[22px] text-center py-0.5 rounded font-black text-[10px]">{qty}x</span>
                                                    <span className="text-secondary/70 font-medium truncate flex-1">{name}</span>
                                                    <span className="text-orange-400/80 font-bold text-[10px]">{price} ₺</span>
                                                </div>
                                            );
                                        })}
                                        {order.items?.length > 4 && (
                                            <p className="text-[10px] text-secondary/40 font-bold">+{order.items.length - 4} ürün daha</p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right ml-4">
                                    <p className="text-[9px] uppercase tracking-widest font-black text-secondary/50 mb-1">Toplam</p>
                                    <p className="text-xl font-black text-foreground">{order.total_price} <span className="text-xs text-orange-400">₺</span></p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-16 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                            <Package className="w-8 h-8 text-secondary/30" />
                        </div>
                        <p className="text-sm font-bold text-secondary/40">Sipariş bulunamadı</p>
                        <p className="text-[10px] text-secondary/30 mt-1">Filtreleri değiştirin veya siparişleri senkronize edin</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// =====================================================
// TAB 3: FİNANS & ANALİZ
// =====================================================
function FinanceTab({ orders, syncDays }: { orders: any[]; syncDays: number }) {
    const COMMISSION_RATE = 0.18; // Trendyol GO %18 tahmini komisyon

    const analytics = useMemo(() => {
        const delivered = orders.filter((o: any) => o.status === 'Delivered');
        const cancelled = orders.filter((o: any) => o.status === 'Cancelled');

        const grossRevenue = orders.reduce((sum: number, o: any) => sum + (parseFloat(o.total_price) || 0), 0);
        const deliveredRevenue = delivered.reduce((sum: number, o: any) => sum + (parseFloat(o.total_price) || 0), 0);
        const cancelledAmount = cancelled.reduce((sum: number, o: any) => sum + (parseFloat(o.total_price) || 0), 0);
        const estimatedCommission = deliveredRevenue * COMMISSION_RATE;
        const netRevenue = deliveredRevenue - estimatedCommission;
        const avgOrderValue = delivered.length > 0 ? deliveredRevenue / delivered.length : 0;
        const cancelRate = orders.length > 0 ? (cancelled.length / orders.length * 100) : 0;

        return {
            grossRevenue, deliveredRevenue, cancelledAmount, estimatedCommission,
            netRevenue, avgOrderValue, cancelRate,
            totalOrders: orders.length, deliveredCount: delivered.length, cancelledCount: cancelled.length
        };
    }, [orders]);

    // Günlük ciro trendi (son 14 gün)
    const dailyData = useMemo(() => {
        const days: { [key: string]: { revenue: number; orders: number } } = {};
        const now = new Date();
        for (let i = 13; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
            days[key] = { revenue: 0, orders: 0 };
        }
        orders.forEach((o: any) => {
            if (o.status === 'Delivered') {
                const d = new Date(o.created_at);
                const key = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
                if (days[key]) {
                    days[key].revenue += parseFloat(o.total_price) || 0;
                    days[key].orders += 1;
                }
            }
        });
        return Object.entries(days).map(([label, data]) => ({ label, ...data }));
    }, [orders]);

    const maxRevenue = Math.max(...dailyData.map(d => d.revenue), 1);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Ana Finans Kartları */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Brüt Ciro */}
                <div className="glass-card !p-6 border-emerald-500/10 relative overflow-hidden">
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-emerald-500" />
                        </div>
                        <p className="text-[10px] text-emerald-300/80 font-black uppercase tracking-widest">Brüt Ciro</p>
                    </div>
                    <p className="text-2xl font-black text-foreground">
                        {analytics.grossRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        <span className="text-sm text-emerald-500/60 ml-1">₺</span>
                    </p>
                    <p className="text-[10px] text-secondary/40 mt-1 font-bold">{analytics.totalOrders} sipariş</p>
                </div>

                {/* Tahmini Komisyon */}
                <div className="glass-card !p-6 border-rose-500/10 relative overflow-hidden">
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl" />
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-rose-500/10 rounded-lg flex items-center justify-center">
                            <Percent className="w-4 h-4 text-rose-500" />
                        </div>
                        <p className="text-[10px] text-rose-300/80 font-black uppercase tracking-widest">Tahmini Komisyon</p>
                    </div>
                    <p className="text-2xl font-black text-rose-400">
                        -{analytics.estimatedCommission.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        <span className="text-sm text-rose-500/60 ml-1">₺</span>
                    </p>
                    <p className="text-[10px] text-secondary/40 mt-1 font-bold">%{(COMMISSION_RATE * 100).toFixed(0)} oran</p>
                </div>

                {/* Net Gelir */}
                <div className="glass-card !p-6 border-blue-500/10 relative overflow-hidden md:col-span-1 col-span-2">
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-blue-500" />
                        </div>
                        <p className="text-[10px] text-blue-300/80 font-black uppercase tracking-widest">Net Gelir (Tahmini)</p>
                    </div>
                    <p className="text-2xl font-black text-blue-400">
                        {analytics.netRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        <span className="text-sm text-blue-500/60 ml-1">₺</span>
                    </p>
                    <p className="text-[10px] text-secondary/40 mt-1 font-bold">{analytics.deliveredCount} teslim edilmiş sipariş</p>
                </div>
            </div>

            {/* Alt Metrik Kartları */}
            <div className="grid grid-cols-3 gap-4">
                <div className="glass-card !p-4 text-center">
                    <p className="text-[10px] text-secondary/50 font-black uppercase mb-1">Ortalama Sepet</p>
                    <p className="text-lg font-black text-foreground">{analytics.avgOrderValue.toFixed(0)} <span className="text-xs text-orange-400">₺</span></p>
                </div>
                <div className="glass-card !p-4 text-center">
                    <p className="text-[10px] text-secondary/50 font-black uppercase mb-1">İptal Oranı</p>
                    <p className={`text-lg font-black ${analytics.cancelRate > 10 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        %{analytics.cancelRate.toFixed(1)}
                    </p>
                </div>
                <div className="glass-card !p-4 text-center">
                    <p className="text-[10px] text-secondary/50 font-black uppercase mb-1">İptal Tutarı</p>
                    <p className="text-lg font-black text-rose-400">{analytics.cancelledAmount.toFixed(0)} <span className="text-xs text-rose-500/60">₺</span></p>
                </div>
            </div>

            {/* 14 Günlük Ciro Trendi */}
            <div className="glass-card !p-6">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-orange-500" />
                        14 Günlük Ciro Trendi
                    </h4>
                    <span className="text-[10px] text-secondary/40 font-bold">Teslim edilen siparişler</span>
                </div>
                <div className="flex items-end gap-1.5 h-40">
                    {dailyData.map((d, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                            <div className="w-full relative group cursor-pointer" title={`${d.label}: ${d.revenue.toFixed(0)} ₺ (${d.orders} sipariş)`}>
                                <div
                                    className="w-full bg-gradient-to-t from-orange-600/80 to-orange-400/80 rounded-t-md transition-all duration-500 group-hover:from-orange-500 group-hover:to-orange-300 group-hover:shadow-lg group-hover:shadow-orange-500/30 min-h-[2px]"
                                    style={{ height: `${Math.max((d.revenue / maxRevenue) * 140, 2)}px` }}
                                />
                                {/* Hover Tooltip */}
                                <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/10 rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-10 shadow-xl">
                                    <p className="text-[9px] text-foreground font-bold">{d.revenue.toFixed(0)} ₺</p>
                                    <p className="text-[8px] text-secondary/50">{d.orders} sipariş</p>
                                </div>
                            </div>
                            <span className="text-[8px] text-secondary/30 font-bold rotate-[-45deg] origin-center whitespace-nowrap">{d.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// =====================================================
// TAB 4: AYARLAR (Settings)
// =====================================================
function SettingsTab({ settings, setSettings, handleSaveSettings, handleTestConnection, loading, syncing, isConfigured, isSystemLevel, handleSyncStock }: any) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Durum Bilgisi */}
            <div className="glass-card !p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isConfigured ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-rose-500/10 border border-rose-500/20'}`}>
                        {isConfigured ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-rose-500" />}
                    </div>
                    <div>
                        <p className="text-sm font-black text-foreground">
                            {isConfigured ? 'Entegrasyon Aktif' : 'Yapılandırma Gerekli'}
                        </p>
                        <p className="text-[10px] text-secondary/50 font-bold">
                            {isSystemLevel ? 'Sistem bazlı yapılandırma' : 'Tenant bazlı yapılandırma'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-secondary/50" />
                    <span className="text-[10px] font-black text-secondary/60 uppercase">
                        {settings.isStage ? 'STAGE' : 'PRODUCTION'}
                    </span>
                </div>
            </div>

            {/* API Credentials Form */}
            <div className="glass-card !p-6 space-y-5">
                <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
                    <Lock className="w-4 h-4 text-orange-500" />
                    API Bağlantı Bilgileri
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Seller ID</label>
                        <input
                            type="text"
                            value={settings.sellerId}
                            onChange={e => setSettings({ ...settings, sellerId: e.target.value })}
                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-orange-500/50 outline-none transition-all"
                            placeholder="249371"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Store ID</label>
                        <input
                            type="text"
                            value={settings.storeId}
                            onChange={e => setSettings({ ...settings, storeId: e.target.value })}
                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-orange-500/50 outline-none transition-all"
                            placeholder="206054"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-500 ml-1">API Key</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                            <input
                                type="text"
                                value={settings.apiKey}
                                onChange={e => setSettings({ ...settings, apiKey: e.target.value })}
                                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:border-orange-500/50 outline-none transition-all"
                                placeholder="qMAPJ..."
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-500 ml-1">API Secret</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                            <input
                                type="password"
                                value={settings.apiSecret}
                                onChange={e => setSettings({ ...settings, apiSecret: e.target.value })}
                                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:border-orange-500/50 outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Entegrasyon Referans Kodu (Zorunlu)</label>
                        <input
                            type="text"
                            value={settings.agentName}
                            onChange={e => setSettings({ ...settings, agentName: e.target.value })}
                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-orange-500/50 outline-none transition-all font-mono"
                            placeholder="Trendyol panelindeki Referans Kodunu buraya yapıştırın"
                        />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Token (Opsiyonel)</label>
                        <input
                            type="text"
                            value={settings.token || ""}
                            onChange={e => setSettings({ ...settings, token: e.target.value })}
                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-orange-500/50 outline-none transition-all font-mono"
                            placeholder="Trendyol panelindeki Token bilgisini buraya yapıştırın"
                        />
                    </div>
                </div>
            </div>

            {/* Şalterler */}
            <div className="glass-card !p-6 space-y-5">
                <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
                    <Settings className="w-4 h-4 text-orange-500" />
                    Senkronizasyon Ayarları
                </h4>

                <div className="space-y-4">
                    {/* Stage Modu */}
                    <label className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5 cursor-pointer group hover:bg-white/[0.04] transition-all">
                        <div className="flex items-center gap-3">
                            <Globe className="w-5 h-5 text-amber-500" />
                            <div>
                                <span className="text-sm font-bold text-foreground group-hover:text-amber-400 transition-colors">Stage Modu</span>
                                <p className="text-[10px] text-secondary/50 font-medium">Test ortamı (stageapi.tgoapis.com)</p>
                            </div>
                        </div>
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={settings.isStage}
                                onChange={e => setSettings({ ...settings, isStage: e.target.checked })}
                                className="peer hidden"
                            />
                            <div className="w-12 h-7 bg-slate-800 rounded-full peer-checked:bg-amber-500 transition-all after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:w-5 after:h-5 after:rounded-full after:transition-all peer-checked:after:translate-x-5 after:shadow-sm" />
                        </div>
                    </label>

                    {/* Stok Senkronizasyonu */}
                    <label className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5 cursor-pointer group hover:bg-white/[0.04] transition-all">
                        <div className="flex items-center gap-3">
                            <Package className="w-5 h-5 text-emerald-500" />
                            <div>
                                <span className="text-sm font-bold text-foreground group-hover:text-emerald-400 transition-colors">Stok Senkronizasyonu</span>
                                <p className="text-[10px] text-secondary/50 font-medium">Stokları Trendyol'a gönder</p>
                            </div>
                        </div>
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={settings.isStockSyncActive}
                                onChange={e => setSettings({ ...settings, isStockSyncActive: e.target.checked })}
                                className="peer hidden"
                            />
                            <div className="w-12 h-7 bg-slate-800 rounded-full peer-checked:bg-emerald-500 transition-all after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:w-5 after:h-5 after:rounded-full after:transition-all peer-checked:after:translate-x-5 after:shadow-sm" />
                        </div>
                    </label>
                </div>
            </div>

            {/* Aksiyon Butonları */}
            <div className="flex flex-col md:flex-row gap-3">
                <button
                    onClick={handleTestConnection}
                    disabled={syncing}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-muted/50 hover:bg-muted border border-border hover:border-emerald-500/30 rounded-2xl text-sm font-bold text-foreground transition-all disabled:opacity-50"
                >
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    Bağlantıyı Test Et
                </button>

                <button
                    onClick={handleSyncStock}
                    disabled={syncing || !isConfigured}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-muted/50 hover:bg-muted border border-border hover:border-orange-500/30 rounded-2xl text-sm font-bold text-foreground transition-all disabled:opacity-50"
                >
                    <Package className="w-5 h-5 text-orange-500" />
                    Stokları Güncelle
                </button>

                <button
                    onClick={handleSaveSettings}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 rounded-2xl text-sm font-black text-foreground transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50"
                >
                    <Save className="w-5 h-5" />
                    Ayarları Kaydet
                </button>
            </div>
        </div>
    );
}

// =====================================================
// YARDIMCI BİLEŞEN: Sipariş Durum Etiketi
// =====================================================
function OrderStatusBadge({ status }: { status: string }) {
    const config: { [key: string]: { color: string; label: string } } = {
        'Delivered': { color: 'emerald', label: 'Teslim Edildi' },
        'Cancelled': { color: 'rose', label: 'İptal' },
        'Created': { color: 'amber', label: 'Yeni' },
        'Picked': { color: 'blue', label: 'Hazırlandı' },
        'Shipped': { color: 'indigo', label: 'Yolda' },
        'Accepted': { color: 'cyan', label: 'Kabul Edildi' },
        'Picking': { color: 'violet', label: 'Hazırlanıyor' },
        'UnSupplied': { color: 'orange', label: 'Tedarik Edilemedi' },
    };

    const c = config[status] || { color: 'slate', label: status };

    return (
        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border backdrop-blur-sm
            bg-${c.color}-500/10 text-${c.color}-400 border-${c.color}-500/20`}>
            {c.label}
        </span>
    );
}
