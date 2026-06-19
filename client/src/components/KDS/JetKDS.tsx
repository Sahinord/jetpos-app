"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";
import { 
    ChefHat, Clock, Check, Play, CheckCheck, Filter, 
    Volume2, VolumeX, AlertCircle, RefreshCw, X, ShieldAlert 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PinVerificationModal from "../Common/PinVerificationModal";

interface KitchenOrder {
    id: string;
    table_id: string;
    table_name: string;
    waiter_id: string;
    waiter_name: string;
    station_id: string;
    station_name: string;
    status: 'new' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
    priority: number;
    notes: string;
    started_at?: string;
    ready_at?: string;
    delivered_at?: string;
    created_at: string;
    items?: KitchenOrderItem[];
}

interface KitchenOrderItem {
    id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    notes?: string;
    status: 'pending' | 'preparing' | 'ready';
    cancelled_at?: string;
    cancelled_by?: string;
}

export default function JetKDS({ showToast }: any) {
    const { currentTenant } = useTenant();
    const [orders, setOrders] = useState<KitchenOrder[]>([]);
    const [stations, setStations] = useState<any[]>([]);
    const [selectedStation, setSelectedStation] = useState<string>("all");
    const [loading, setLoading] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const prevOrdersCountRef = useRef<number>(0);

    const [pinModalOpen, setPinModalOpen] = useState(false);
    const [pinModalAction, setPinModalAction] = useState<{
        type: 'cancel_order' | 'cancel_item';
        orderId: string;
        itemId?: string;
        itemName?: string;
    } | null>(null);

    const handleCancelOrderClick = (orderId: string) => {
        setPinModalAction({ type: 'cancel_order', orderId });
        setPinModalOpen(true);
    };

    const handleCancelItemClick = (orderId: string, itemId: string, itemName: string) => {
        setPinModalAction({ type: 'cancel_item', orderId, itemId, itemName });
        setPinModalOpen(true);
    };

    const handlePinSuccess = async (employee: any) => {
        setPinModalOpen(false);
        if (!pinModalAction) return;

        const now = new Date().toISOString();

        if (pinModalAction.type === 'cancel_order') {
            try {
                // Cancel all items first
                const { error: itemsError } = await supabase
                    .from("kitchen_order_items")
                    .update({
                        cancelled_at: now,
                        cancelled_by: employee.id
                    })
                    .eq("kitchen_order_id", pinModalAction.orderId);

                if (itemsError) throw itemsError;

                // Cancel the order
                const { error: orderError } = await supabase
                    .from("kitchen_orders")
                    .update({
                        status: 'cancelled',
                        updated_at: now,
                        cancelled_at: now,
                        cancelled_by: employee.id
                    })
                    .eq("id", pinModalAction.orderId);

                if (orderError) throw orderError;

                if (showToast) {
                    showToast("Sipariş ve tüm ürünleri iptal edildi.", "info");
                }
                fetchOrders();
            } catch (e: any) {
                console.error("Error cancelling order:", e);
                alert("Sipariş iptal edilirken hata oluştu: " + e.message);
            }
        } else if (pinModalAction.type === 'cancel_item') {
            try {
                // Cancel the item
                const { error: itemError } = await supabase
                    .from("kitchen_order_items")
                    .update({
                        cancelled_at: now,
                        cancelled_by: employee.id
                    })
                    .eq("id", pinModalAction.itemId);

                if (itemError) throw itemError;

                // Check if all other items in this order are cancelled
                const currentOrder = orders.find(o => o.id === pinModalAction.orderId);
                if (currentOrder && currentOrder.items) {
                    const remainingItems = currentOrder.items.filter(i => i.id !== pinModalAction.itemId && !i.cancelled_at);
                    if (remainingItems.length === 0) {
                        // All items cancelled, so cancel the order itself
                        await supabase
                            .from("kitchen_orders")
                            .update({
                                status: 'cancelled',
                                updated_at: now,
                                cancelled_at: now,
                                cancelled_by: employee.id
                            })
                            .eq("id", pinModalAction.orderId);
                    }
                }

                if (showToast) {
                    showToast(`"${pinModalAction.itemName}" iptal edildi.`, "info");
                }
                fetchOrders();
            } catch (e: any) {
                console.error("Error cancelling item:", e);
                alert("Ürün iptal edilirken hata oluştu: " + e.message);
            }
        }
        setPinModalAction(null);
    };

    // Synthesize a premium notification sound locally using the Web Audio API
    const playOrderChime = () => {
        if (!soundEnabled) return;
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            
            // Modern, pleasant chord chime: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz)
            const notes = [523.25, 659.25, 783.99];
            notes.forEach((freq, index) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.12);
                
                gain.gain.setValueAtTime(0.12, ctx.currentTime + index * 0.12);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + index * 0.12 + 0.35);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.start(ctx.currentTime + index * 0.12);
                osc.stop(ctx.currentTime + index * 0.12 + 0.4);
            });
        } catch (e) {
            console.error("Audio Synthesis Error:", e);
        }
    };

    const fetchStations = async () => {
        if (!currentTenant) return;
        try {
            const { data, error } = await supabase
                .from("kitchen_stations")
                .select("*")
                .eq("tenant_id", currentTenant.id)
                .eq("is_active", true)
                .order("sort_order");
            if (!error && data) {
                setStations(data);
            }
        } catch (e) {
            console.error("Error fetching stations:", e);
        }
    };

    const fetchOrders = async () => {
        if (!currentTenant) return;
        setLoading(true);
        try {
            // Fetch kitchen orders not delivered or cancelled
            const { data: kOrders, error: koError } = await supabase
                .from("kitchen_orders")
                .select("*")
                .eq("tenant_id", currentTenant.id)
                .in("status", ["new", "preparing", "ready"])
                .order("created_at", { ascending: true });

            if (koError) throw koError;

            if (kOrders && kOrders.length > 0) {
                // Fetch items for these orders
                const orderIds = kOrders.map(o => o.id);
                const { data: kItems, error: kiError } = await supabase
                    .from("kitchen_order_items")
                    .select("*")
                    .in("kitchen_order_id", orderIds);

                if (kiError) throw kiError;

                const resolvedOrders = kOrders.map(o => ({
                    ...o,
                    items: kItems?.filter(i => i.kitchen_order_id === o.id) || []
                }));

                setOrders(resolvedOrders);

                // Play sound if new orders are detected
                const activeCount = resolvedOrders.filter(o => o.status === 'new').length;
                if (activeCount > prevOrdersCountRef.current) {
                    playOrderChime();
                    if (showToast) {
                        showToast("Yeni Mutfak Siparişi Alındı!", "info");
                    }
                }
                prevOrdersCountRef.current = activeCount;
            } else {
                setOrders([]);
                prevOrdersCountRef.current = 0;
            }
        } catch (error: any) {
            console.error("KDS Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    // Initialize and Realtime Subscriptions
    useEffect(() => {
        if (!currentTenant) return;

        fetchStations();
        fetchOrders();

        const ordersChannel = supabase
            .channel(`kds_orders_live_${currentTenant.id}`)
            .on("postgres_changes", {
                event: "*",
                schema: "public",
                table: "kitchen_orders",
                filter: `tenant_id=eq.${currentTenant.id}`
            }, () => {
                fetchOrders();
            })
            .on("postgres_changes", {
                event: "*",
                schema: "public",
                table: "kitchen_order_items"
            }, () => {
                fetchOrders();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(ordersChannel);
        };
    }, [currentTenant?.id]);

    const updateOrderStatus = async (orderId: string, currentStatus: string) => {
        let nextStatus: any = 'preparing';
        const now = new Date().toISOString();
        const updatePayload: any = { updated_at: now };

        if (currentStatus === 'new') {
            nextStatus = 'preparing';
            updatePayload.started_at = now;
        } else if (currentStatus === 'preparing') {
            nextStatus = 'ready';
            updatePayload.ready_at = now;
        } else if (currentStatus === 'ready') {
            nextStatus = 'delivered';
            updatePayload.delivered_at = now;
        }

        updatePayload.status = nextStatus;

        try {
            const { error } = await supabase
                .from("kitchen_orders")
                .update(updatePayload)
                .eq("id", orderId);

            if (error) throw error;
            if (showToast) {
                showToast(`Sipariş durumu güncellendi: ${
                    nextStatus === 'preparing' ? 'Hazırlanıyor' :
                    nextStatus === 'ready' ? 'Hazır' : 'Teslim Edildi'
                }`, "success");
            }
            fetchOrders();
        } catch (e: any) {
            console.error("Error updating order status:", e);
            alert("Durum güncellenirken hata oluştu.");
        }
    };

    const cancelOrder = async (orderId: string) => {
        if (!confirm("Siparişi iptal etmek istediğinize emin misiniz?")) return;
        try {
            const { error } = await supabase
                .from("kitchen_orders")
                .update({ status: 'cancelled', updated_at: new Date().toISOString() })
                .eq("id", orderId);

            if (showToast) {
                showToast("Sipariş iptal edildi.", "info");
            }
            fetchOrders();
        } catch (e: any) {
            console.error("Error cancelling order:", e);
        }
    };

    // Filter orders by station tab
    const filteredOrders = orders.filter(order => {
        if (selectedStation === "all") return true;
        return order.station_id === selectedStation;
    });

    const getElapsedTime = (createdAt: string) => {
        const diff = Date.now() - new Date(createdAt).getTime();
        const mins = Math.floor(diff / 60000);
        return `${mins} dk`;
    };

    // Grouping by state columns
    const columns = {
        new: filteredOrders.filter(o => o.status === "new"),
        preparing: filteredOrders.filter(o => o.status === "preparing"),
        ready: filteredOrders.filter(o => o.status === "ready")
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] gap-4 overflow-hidden text-foreground bg-background p-4 rounded-3xl border border-border shadow-2xl">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-card/40 p-4 rounded-2xl border border-border backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary">
                        <ChefHat size={24} />
                    </div>
                    <div>
                        <h1 className="text-lg font-black uppercase tracking-wider">JetKDS (Mutfak Ekranı)</h1>
                        <p className="text-xs text-secondary font-bold">Gerçek Zamanlı Mutfak Yönetim Paneli</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Station Tabs */}
                    <div className="flex items-center gap-1.5 bg-muted p-1.5 rounded-xl border border-border">
                        <button
                            onClick={() => setSelectedStation("all")}
                            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                                selectedStation === "all"
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                : "text-secondary hover:bg-muted/50 hover:text-foreground"
                            }`}
                        >
                            TÜMÜ
                        </button>
                        {stations.map(st => (
                            <button
                                key={st.id}
                                onClick={() => setSelectedStation(st.id)}
                                className={`px-4 py-2 rounded-lg text-xs font-black transition-all uppercase ${
                                    selectedStation === st.id
                                    ? "text-primary-foreground shadow-lg"
                                    : "text-secondary hover:bg-muted/50 hover:text-foreground"
                                }`}
                                style={{ backgroundColor: selectedStation === st.id ? st.color || '#3b82f6' : undefined }}
                            >
                                {st.name}
                            </button>
                        ))}
                    </div>

                    {/* Sound Switcher */}
                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`p-3 rounded-xl border transition-all ${
                            soundEnabled
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                        }`}
                        title={soundEnabled ? "Sesi Kapat" : "Sesi Aç"}
                    >
                        {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    </button>

                    {/* Manual Refresh */}
                    <button
                        onClick={fetchOrders}
                        className="p-3 bg-card hover:bg-muted border border-border rounded-xl text-secondary"
                        title="Yenile"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* Main process board */}
            {loading && orders.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="flex-1 grid grid-cols-3 gap-4 min-h-0">
                    
                    {/* Columns grid mapping */}
                    {[
                        { key: "new", title: "YENİ SİPARİŞLER", color: "border-blue-500/30 bg-blue-500/5 text-blue-400", list: columns.new, actionIcon: Play, actionLabel: "HAZIRLA" },
                        { key: "preparing", title: "HAZIRLANIYOR", color: "border-orange-500/30 bg-orange-500/5 text-orange-400", list: columns.preparing, actionIcon: Check, actionLabel: "TAMAMLA" },
                        { key: "ready", title: "HAZIR & SERVİS", color: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400", list: columns.ready, actionIcon: CheckCheck, actionLabel: "TESLİM ET" }
                    ].map(col => {
                        const Icon = col.actionIcon;
                        return (
                            <div key={col.key} className="flex flex-col h-full bg-card/20 border border-border rounded-2xl min-h-0 shadow-sm">
                                {/* Column Header */}
                                <div className={`px-4 py-3.5 border-b border-border flex items-center justify-between rounded-t-2xl bg-muted/30`}>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2.5 h-2.5 rounded-full ${
                                            col.key === 'new' ? 'bg-blue-500' :
                                            col.key === 'preparing' ? 'bg-orange-500' : 'bg-emerald-500'
                                        }`} />
                                        <span className="text-xs font-black tracking-widest text-secondary">{col.title}</span>
                                    </div>
                                    <span className="text-xs font-black bg-background px-2 py-0.5 rounded-md text-foreground">
                                        {col.list.length}
                                    </span>
                                </div>

                                {/* Order Cards list */}
                                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                    <AnimatePresence>
                                        {col.list.map(order => (
                                            <motion.div
                                                key={order.id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                className={`p-4 rounded-xl border border-border bg-card shadow-lg relative group ${
                                                    order.priority > 0 ? "ring-2 ring-red-500/50 bg-red-500/5" : ""
                                                }`}
                                            >
                                                {/* Card Header */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <h3 className="font-black text-sm text-foreground uppercase tracking-tight">
                                                            {order.table_name || 'MASA'}
                                                        </h3>
                                                        <p className="text-[10px] text-secondary font-bold mt-0.5">
                                                            🤵 {order.waiter_name || 'Garson'}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                                        <span className="px-2 py-0.5 rounded bg-muted text-[9px] font-black text-secondary uppercase tracking-widest">
                                                            {order.station_name}
                                                        </span>
                                                        <div className="flex items-center gap-1 text-[9px] font-bold text-secondary mt-1">
                                                            <Clock size={10} />
                                                            <span>{getElapsedTime(order.created_at)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Global order notes */}
                                                {order.notes && (
                                                    <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] font-bold text-red-400">
                                                        ⚠️ NOT: {order.notes}
                                                    </div>
                                                )}

                                                {/* Items list */}
                                                <div className="mt-3 border-t border-border pt-3 space-y-2">
                                                    {order.items?.map(item => {
                                                        const isCancelled = !!item.cancelled_at;
                                                        return (
                                                            <div key={item.id} className={`flex flex-col text-xs font-semibold ${isCancelled ? 'line-through opacity-40 text-rose-500' : 'text-foreground/80'}`}>
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span>
                                                                        <strong className={`${isCancelled ? 'text-rose-500' : 'text-primary'} font-black text-sm`}>{item.quantity}</strong> x {item.product_name}
                                                                        {isCancelled && <span className="ml-2 px-1.5 py-0.5 bg-rose-500/20 text-rose-500 text-[8px] font-black rounded uppercase">İPTAL</span>}
                                                                    </span>
                                                                    {!isCancelled && (
                                                                        <button
                                                                            onClick={() => handleCancelItemClick(order.id, item.id, item.product_name)}
                                                                            className="opacity-50 hover:opacity-100 p-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded transition-all"
                                                                            title="Ürünü İptal Et"
                                                                        >
                                                                            <X size={10} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                {item.notes && (
                                                                    <span className="text-[10px] text-orange-400 italic ml-6 font-mono">
                                                                        - {item.notes}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Card Footer Actions */}
                                                <div className="mt-4 border-t border-border pt-3 flex gap-2">
                                                    <button
                                                        onClick={() => updateOrderStatus(order.id, order.status)}
                                                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-primary text-primary-foreground text-xs font-black uppercase rounded-lg shadow-lg active:scale-95 transition-all"
                                                    >
                                                        <Icon size={12} />
                                                        <span>{col.actionLabel}</span>
                                                    </button>
                                                    
                                                    {order.status === 'new' && (
                                                        <button
                                                            onClick={() => handleCancelOrderClick(order.id)}
                                                            className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20 rounded-lg transition-all"
                                                            title="Siparişi İptal Et"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>

                                    {col.list.length === 0 && (
                                        <div className="text-center py-20 opacity-30 flex flex-col items-center">
                                            <Play className="w-10 h-10 mb-2 rotate-90" />
                                            <p className="text-[10px] font-black uppercase tracking-wider">Sipariş yok</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            <PinVerificationModal
                isOpen={pinModalOpen}
                title={pinModalAction?.type === 'cancel_order' ? "Sipariş İptal Onayı" : "Ürün İptal Onayı"}
                description={
                    pinModalAction?.type === 'cancel_order' 
                    ? "Tüm siparişi iptal etmek için yetkili PIN kodunu girin." 
                    : `"${pinModalAction?.itemName}" ürününü iptal etmek için yetkili PIN kodunu girin.`
                }
                requiredRoles={['Owner', 'Manager', 'Patron', 'Müdür']}
                onSuccess={handlePinSuccess}
                onCancel={() => {
                    setPinModalOpen(false);
                    setPinModalAction(null);
                }}
            />
        </div>
    );
}
