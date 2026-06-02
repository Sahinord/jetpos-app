"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { 
    ChefHat, Clock, Check, Play, CheckCheck, Volume2, 
    VolumeX, RefreshCw, X, ShieldAlert, ArrowLeft, LogOut 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";

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

export default function MobileKDS() {
    const router = useRouter();
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [waiterRole, setWaiterRole] = useState<string | null>(null);
    const [orders, setOrders] = useState<KitchenOrder[]>([]);
    const [stations, setStations] = useState<any[]>([]);
    const [selectedStation, setSelectedStation] = useState<string>("all");
    const [loading, setLoading] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [activeCol, setActiveCol] = useState<'new' | 'preparing' | 'ready'>('new');
    const prevOrdersCountRef = useRef<number>(0);

    useEffect(() => {
        const tid = localStorage.getItem('tenantId');
        if (tid) {
            setTenantId(tid);
        } else {
            toast.error("Oturum bulunamadı, lütfen giriş yapın.");
            router.push('/');
        }
        setWaiterRole(localStorage.getItem('activeWaiterRole'));
    }, []);

    // Synthesize chime locally using Web Audio API
    const playOrderChime = () => {
        if (!soundEnabled) return;
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            
            // Pleasant C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz) chord chime
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

    const fetchStations = async (tid: string) => {
        try {
            const { data, error } = await supabase
                .from("kitchen_stations")
                .select("*")
                .eq("tenant_id", tid)
                .eq("is_active", true)
                .order("sort_order");
            if (!error && data) {
                setStations(data);
            }
        } catch (e) {
            console.error("Error fetching stations:", e);
        }
    };

    const fetchOrders = async (tid: string) => {
        setLoading(true);
        try {
            const { data: kOrders, error: koError } = await supabase
                .from("kitchen_orders")
                .select("*")
                .eq("tenant_id", tid)
                .in("status", ["new", "preparing", "ready"])
                .order("created_at", { ascending: true });

            if (koError) throw koError;

            if (kOrders && kOrders.length > 0) {
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
                    toast.info("Yeni sipariş alındı!");
                }
                prevOrdersCountRef.current = activeCount;
            } else {
                setOrders([]);
                prevOrdersCountRef.current = 0;
            }
        } catch (error: any) {
            console.error("Mobile KDS Fetch Error:", error);
            toast.error("Siparişler yüklenirken hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    // Subscriptions on mount/tenant load
    useEffect(() => {
        if (!tenantId) return;

        fetchStations(tenantId);
        fetchOrders(tenantId);

        const ordersChannel = supabase
            .channel(`kds_orders_mobile_live_${tenantId}`)
            .on("postgres_changes", {
                event: "*",
                schema: "public",
                table: "kitchen_orders",
                filter: `tenant_id=eq.${tenantId}`
            }, () => {
                fetchOrders(tenantId);
            })
            .on("postgres_changes", {
                event: "*",
                schema: "public",
                table: "kitchen_order_items"
            }, () => {
                fetchOrders(tenantId);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(ordersChannel);
        };
    }, [tenantId]);

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
            toast.success(`Sipariş durumu güncellendi: ${
                nextStatus === 'preparing' ? 'Hazırlanıyor' :
                nextStatus === 'ready' ? 'Hazır' : 'Teslim Edildi'
            }`);
            if (tenantId) fetchOrders(tenantId);
        } catch (e: any) {
            console.error("Error updating order status:", e);
            toast.error("Durum güncellenirken hata oluştu.");
        }
    };

    const cancelOrder = async (orderId: string) => {
        if (!confirm("Siparişi iptal etmek istediğinize emin misiniz?")) return;
        try {
            const { error } = await supabase
                .from("kitchen_orders")
                .update({ status: 'cancelled', updated_at: new Date().toISOString() })
                .eq("id", orderId);

            if (error) throw error;
            toast.info("Sipariş iptal edildi.");
            if (tenantId) fetchOrders(tenantId);
        } catch (e: any) {
            console.error("Error cancelling order:", e);
            toast.error("Sipariş iptal edilemedi.");
        }
    };

    // Filters
    const filteredOrders = orders.filter(order => {
        const matchesStation = selectedStation === "all" ? true : order.station_id === selectedStation;
        const matchesCol = order.status === activeCol;
        return matchesStation && matchesCol;
    });

    const getElapsedTime = (createdAt: string) => {
        const diff = Date.now() - new Date(createdAt).getTime();
        const mins = Math.floor(diff / 60000);
        return `${mins} dk`;
    };

    // Columns counts
    const colCounts = {
        new: orders.filter(o => (selectedStation === "all" ? true : o.station_id === selectedStation) && o.status === "new").length,
        preparing: orders.filter(o => (selectedStation === "all" ? true : o.station_id === selectedStation) && o.status === "preparing").length,
        ready: orders.filter(o => (selectedStation === "all" ? true : o.station_id === selectedStation) && o.status === "ready").length
    };

    return (
        <div className="min-h-screen bg-[#050B1A] text-white flex flex-col pb-24">
            {/* Topbar */}
            <div className="bg-[#0B1328]/80 backdrop-blur-xl border-b border-[#2D6BFF]/10 sticky top-0 z-[50] px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={async () => {
                            const wRole = localStorage.getItem('activeWaiterRole');
                            if (wRole === 'Kitchen' || wRole === 'Mutfak') {
                                const wId = localStorage.getItem('activeWaiterId');
                                if (wId) {
                                    await supabase
                                        .from('employees')
                                        .update({ is_online: false, last_seen: new Date().toISOString() })
                                        .eq('id', wId);
                                }
                                localStorage.removeItem('activeWaiterId');
                                localStorage.removeItem('activeWaiterName');
                                localStorage.removeItem('activeWaiterRole');
                                window.location.href = '/adisyon';
                            } else {
                                router.push('/dashboard');
                            }
                        }} 
                        className="p-2 hover:bg-white/5 rounded-xl"
                        title={waiterRole === 'Kitchen' || waiterRole === 'Mutfak' ? "Çıkış Yap" : "Geri Dön"}
                    >
                        {waiterRole === 'Kitchen' || waiterRole === 'Mutfak' ? <LogOut className="w-5 h-5 text-rose-500 animate-pulse" /> : <ArrowLeft className="w-5 h-5 text-slate-400" />}
                    </button>
                    <div>
                        <h1 className="text-md font-black tracking-wider uppercase text-white">MUTFAK EKRANI (KDS)</h1>
                        <p className="text-[9px] text-[#6FD3FF] font-black tracking-widest uppercase">Mobil Sipariş Takibi</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Sound */}
                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`p-2.5 rounded-xl border transition-all ${
                            soundEnabled
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                        }`}
                    >
                        {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    </button>

                    {/* Refresh */}
                    <button
                        onClick={() => tenantId && fetchOrders(tenantId)}
                        className="p-2.5 bg-slate-900 border border-white/5 rounded-xl text-slate-300"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* Station Horizontal Tabs */}
            <div className="bg-[#070F22] border-b border-white/5 p-3 flex gap-2 overflow-x-auto no-scrollbar">
                <button
                    onClick={() => setSelectedStation("all")}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all shrink-0 uppercase border ${
                        selectedStation === "all"
                        ? "bg-[#2563FF] border-[#2D6BFF] text-white shadow-lg shadow-[#2563FF]/20"
                        : "bg-[#0B1328] border-white/5 text-slate-400"
                    }`}
                >
                    TÜM İSTASYONLAR
                </button>
                {stations.map(st => (
                    <button
                        key={st.id}
                        onClick={() => setSelectedStation(st.id)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all shrink-0 uppercase border`}
                        style={{ 
                            backgroundColor: selectedStation === st.id ? st.color || '#3b82f6' : '#0B1328',
                            borderColor: selectedStation === st.id ? st.color || '#3b82f6' : 'rgba(255,255,255,0.05)',
                            color: selectedStation === st.id ? '#ffffff' : '#94a3b8'
                        }}
                    >
                        {st.name}
                    </button>
                ))}
            </div>

            {/* Column Selector (Mobile optimized Tab bar) */}
            <div className="grid grid-cols-3 bg-[#0B1328]/60 border-b border-white/5">
                {[
                    { key: 'new', label: 'YENİ', color: 'bg-blue-500', count: colCounts.new },
                    { key: 'preparing', label: 'HAZIRLANIYOR', color: 'bg-orange-500', count: colCounts.preparing },
                    { key: 'ready', label: 'HAZIR', color: 'bg-emerald-500', count: colCounts.ready }
                ].map(col => (
                    <button
                        key={col.key}
                        onClick={() => setActiveCol(col.key as any)}
                        className={`py-3 flex flex-col items-center justify-center gap-1 border-b-2 transition-all relative ${
                            activeCol === col.key
                            ? 'border-[#2563FF] bg-white/[0.02]'
                            : 'border-transparent text-slate-500'
                        }`}
                    >
                        <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${col.color}`} />
                            <span className="text-[10px] font-black tracking-widest">{col.label}</span>
                        </div>
                        <span className={`text-[11px] font-black px-1.5 py-0.2 rounded-md ${
                            activeCol === col.key ? 'bg-[#2563FF]/20 text-[#6FD3FF]' : 'bg-white/5 text-slate-400'
                        }`}>
                            {col.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Orders List */}
            <div className="flex-1 p-4 space-y-4">
                {loading ? (
                    <div className="py-20 flex items-center justify-center">
                        <div className="w-10 h-10 border-4 border-[#2563FF] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredOrders.length > 0 ? (
                    <AnimatePresence mode="popLayout">
                        {filteredOrders.map(order => (
                            <motion.div
                                key={order.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, x: -50 }}
                                className={`p-4 rounded-2xl border border-white/5 bg-[#0B1328]/80 backdrop-blur-xl shadow-lg relative ${
                                    order.priority > 0 ? "ring-2 ring-red-500/40 bg-red-500/[0.03]" : ""
                                }`}
                            >
                                {/* Card Header */}
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="font-black text-sm text-white uppercase tracking-tight">
                                            {order.table_name || 'MASA'}
                                        </h3>
                                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                            🤵 {order.waiter_name || 'Garson'}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <span className="px-2 py-0.5 rounded bg-white/5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            {order.station_name}
                                        </span>
                                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 mt-1">
                                            <Clock size={10} />
                                            <span>{getElapsedTime(order.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                                        {/* Order Notes */}
                                {order.notes && (
                                    <div className="mt-2.5 p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-bold text-red-400">
                                        ⚠️ NOT: {order.notes}
                                    </div>
                                )}

                                {/* Items List */}
                                <div className="mt-3 border-t border-white/5 pt-3 space-y-2.5">
                                    {order.items?.map(item => {
                                        const isCancelled = !!item.cancelled_at;
                                        return (
                                            <div key={item.id} className={`flex flex-col text-xs font-semibold ${isCancelled ? 'line-through opacity-40 text-rose-400' : 'text-slate-200'}`}>
                                                <div className="flex items-start justify-between gap-2">
                                                    <span>
                                                        <strong className={`${isCancelled ? 'text-rose-500' : 'text-[#6FD3FF]'} font-black text-sm`}>{item.quantity}</strong> x {item.product_name}
                                                        {isCancelled && <span className="ml-2 px-1.5 py-0.5 bg-rose-500/20 text-rose-500 text-[8px] font-black rounded uppercase">İPTAL</span>}
                                                    </span>
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

                                {/* Actions */}
                                <div className="mt-4 border-t border-white/5 pt-3 flex gap-2">
                                    <button
                                        onClick={() => updateOrderStatus(order.id, order.status)}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#2563FF] hover:bg-[#1E90FF] text-white text-xs font-black uppercase rounded-xl shadow-lg active:scale-95 transition-all"
                                    >
                                        {order.status === 'new' && <Play size={12} />}
                                        {order.status === 'preparing' && <Check size={12} />}
                                        {order.status === 'ready' && <CheckCheck size={12} />}
                                        <span>
                                            {order.status === 'new' ? 'HAZIRLA' : ''}
                                            {order.status === 'preparing' ? 'HAZIR' : ''}
                                            {order.status === 'ready' ? 'TESLİM ET' : ''}
                                        </span>
                                    </button>
                                    
                                    {order.status === 'new' && (
                                        <button
                                            onClick={() => cancelOrder(order.id)}
                                            className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20 rounded-xl transition-all"
                                            title="İptal Et"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                ) : (
                    <div className="text-center py-24 opacity-30 flex flex-col items-center">
                        <ChefHat className="w-12 h-12 mb-3 text-slate-500" />
                        <p className="text-xs font-black uppercase tracking-wider text-slate-400">Bu bölümde sipariş yok</p>
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}
