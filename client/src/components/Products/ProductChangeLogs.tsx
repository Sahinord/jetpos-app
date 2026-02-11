"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, History, Calendar, Package, Undo2, Box, Type, Barcode, DollarSign, ToggleLeft, Loader, Search, Monitor, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, setCurrentTenant } from "@/lib/supabase";

interface ChangeLog {
    id: string;
    product_id: string;
    product_name: string;
    product_barcode: string;
    change_type: string;
    field_name: string;
    old_value: string;
    new_value: string;
    change_source: string;
    changed_by: string;
    is_reverted: boolean;
    reverted_at: string | null;
    tenant_id: string;
    created_at: string;
}

const CHANGE_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
    stock: { label: "Stok", icon: Box, color: "text-blue-400", bgColor: "bg-blue-500/10 border-blue-500/20" },
    name: { label: "İsim", icon: Type, color: "text-purple-400", bgColor: "bg-purple-500/10 border-purple-500/20" },
    barcode: { label: "Barkod", icon: Barcode, color: "text-amber-400", bgColor: "bg-amber-500/10 border-amber-500/20" },
    price: { label: "Fiyat", icon: DollarSign, color: "text-emerald-400", bgColor: "bg-emerald-500/10 border-emerald-500/20" },
    status: { label: "Durum", icon: ToggleLeft, color: "text-rose-400", bgColor: "bg-rose-500/10 border-rose-500/20" },
};

export default function ProductChangeLogs({ onBack }: { onBack: () => void }) {
    const [logs, setLogs] = useState<ChangeLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [reverting, setReverting] = useState<string | null>(null);
    const [filter, setFilter] = useState<"all" | "today" | "week" | "month">("all");
    const [typeFilter, setTypeFilter] = useState<"all" | "stock" | "name" | "barcode" | "price" | "status">("all");
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchLogs();
    }, [filter, typeFilter]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const savedTenantId = localStorage.getItem('currentTenantId');
            if (savedTenantId) await setCurrentTenant(savedTenantId);

            let query = supabase
                .from('product_change_logs')
                .select('*')
                .order('created_at', { ascending: false });

            // Date filtering
            const now = new Date();
            if (filter === "today") {
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                query = query.gte('created_at', todayStart.toISOString());
            } else if (filter === "week") {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                query = query.gte('created_at', weekAgo.toISOString());
            } else if (filter === "month") {
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                query = query.gte('created_at', monthAgo.toISOString());
            }

            // Type filtering
            if (typeFilter !== "all") {
                query = query.eq('change_type', typeFilter);
            }

            const { data, error } = await query.limit(500);

            if (error) throw error;
            setLogs(data || []);
        } catch (error: any) {
            console.error("Log fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRevert = async (log: ChangeLog) => {
        if (log.is_reverted) return;
        if (!confirm(`"${log.product_name}" ürününün ${CHANGE_TYPE_CONFIG[log.change_type]?.label || log.change_type} değerini "${log.old_value}" olarak geri almak istediğinize emin misiniz?`)) return;

        setReverting(log.id);
        try {
            const savedTenantId = localStorage.getItem('currentTenantId');
            if (savedTenantId) await setCurrentTenant(savedTenantId);

            // Build update object based on field
            const updateData: any = {};
            if (log.field_name === 'stock_quantity') {
                updateData.stock_quantity = Number(log.old_value);
            } else if (log.field_name === 'name') {
                updateData.name = log.old_value;
            } else if (log.field_name === 'barcode') {
                updateData.barcode = log.old_value;
            } else if (log.field_name === 'sale_price') {
                updateData.sale_price = Number(log.old_value);
            } else if (log.field_name === 'purchase_price') {
                updateData.purchase_price = Number(log.old_value);
            } else if (log.field_name === 'status') {
                updateData.status = log.old_value;
            }

            // Revert the product value
            const { error: updateError } = await supabase
                .from('products')
                .update(updateData)
                .eq('id', log.product_id);

            if (updateError) throw updateError;

            // Mark log as reverted
            await supabase
                .from('product_change_logs')
                .update({ is_reverted: true, reverted_at: new Date().toISOString() })
                .eq('id', log.id);

            // Insert a new revert log
            await supabase.from('product_change_logs').insert({
                product_id: log.product_id,
                product_name: log.product_name,
                product_barcode: log.product_barcode,
                change_type: log.change_type,
                field_name: log.field_name,
                old_value: log.new_value,
                new_value: log.old_value,
                change_source: 'desktop',
                changed_by: 'admin (geri alma)',
                tenant_id: log.tenant_id,
            });

            await fetchLogs();
        } catch (error: any) {
            console.error("Revert error:", error);
            alert("Geri alma hatası: " + error.message);
        } finally {
            setReverting(null);
        }
    };

    // Filter by search
    const filteredLogs = logs.filter(log => {
        if (!search) return true;
        const s = search.toLocaleLowerCase('tr-TR');
        return (
            log.product_name?.toLocaleLowerCase('tr-TR').includes(s) ||
            log.product_barcode?.toLocaleLowerCase('tr-TR').includes(s)
        );
    });

    // Group logs by date
    const groupedLogs = filteredLogs.reduce((acc: Record<string, ChangeLog[]>, log) => {
        const date = new Date(log.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
        if (!acc[date]) acc[date] = [];
        acc[date].push(log);
        return acc;
    }, {});

    // Stats
    const stats = {
        total: logs.length,
        stock: logs.filter(l => l.change_type === 'stock').length,
        price: logs.filter(l => l.change_type === 'price').length,
        name: logs.filter(l => l.change_type === 'name').length,
        reverted: logs.filter(l => l.is_reverted).length,
    };

    const formatValue = (log: ChangeLog, value: string) => {
        if (log.field_name === 'stock_quantity') return `${value} adet`;
        if (log.field_name === 'sale_price' || log.field_name === 'purchase_price') return `₺${Number(value).toFixed(2)}`;
        if (log.field_name === 'status') return value === 'active' ? 'Aktif' : 'Pasif';
        return value;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-secondary hover:text-white" />
                    </button>
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                            <History className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white">ÜRÜN DEĞİŞİKLİK GEÇMİŞİ</h1>
                            <p className="text-sm text-secondary font-medium">Stok, fiyat, isim ve diğer değişiklikler</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {(["all", "today", "week", "month"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === f
                                ? "bg-primary text-white shadow-lg"
                                : "bg-white/5 text-secondary hover:text-white"
                                }`}
                        >
                            {f === "all" && "TÜMÜ"}
                            {f === "today" && "BUGÜN"}
                            {f === "week" && "SON 7 GÜN"}
                            {f === "month" && "SON 30 GÜN"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                    { label: "Toplam İşlem", value: stats.total, icon: History, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
                    { label: "Stok Değişikliği", value: stats.stock, icon: Box, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
                    { label: "Fiyat Değişikliği", value: stats.price, icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
                    { label: "İsim Değişikliği", value: stats.name, icon: Type, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
                    { label: "Geri Alınan", value: stats.reverted, icon: Undo2, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
                ].map((stat) => (
                    <div key={stat.label} className="glass-card p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[9px] font-black text-secondary uppercase tracking-widest">{stat.label}</p>
                                <p className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
                            </div>
                            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center border`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search & Type Filters */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-primary/5 rounded-2xl border border-border/50">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                    <input
                        type="text"
                        placeholder="Ürün adı veya barkod ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-border rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-primary/50 transition-all text-sm font-medium placeholder:text-secondary/40 text-foreground"
                    />
                </div>

                <div className="flex items-center bg-black/20 border border-border rounded-xl p-1">
                    {(["all", "stock", "name", "barcode", "price", "status"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTypeFilter(t)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${typeFilter === t
                                ? "bg-primary text-white shadow-lg"
                                : "text-secondary hover:text-foreground"
                                }`}
                        >
                            {t === "all" ? "TÜMÜ" : (CHANGE_TYPE_CONFIG[t]?.label || t).toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Logs Table */}
            <div className="glass-card overflow-hidden !p-0">
                {loading ? (
                    <div className="p-20 flex items-center justify-center">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                ) : Object.keys(groupedLogs).length === 0 ? (
                    <div className="p-20 flex flex-col items-center justify-center text-secondary">
                        <Package className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-lg font-bold">Henüz değişiklik kaydı bulunamadı</p>
                        <p className="text-sm text-secondary/60 mt-1">Ürünlerde yapılan değişiklikler burada görünecek</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                        {Object.keys(groupedLogs).map((date) => (
                            <div key={date} className="border-b border-border/50 last:border-0">
                                {/* Date Header */}
                                <div className="bg-white/5 px-6 py-3 sticky top-0 z-10 border-b border-border/50">
                                    <div className="flex items-center gap-2 text-sm font-black text-white">
                                        <Calendar className="w-4 h-4 text-primary" />
                                        {date}
                                        <span className="ml-auto text-xs font-bold text-secondary">
                                            {groupedLogs[date].length} işlem
                                        </span>
                                    </div>
                                </div>

                                {/* Logs for this date */}
                                {groupedLogs[date].map((log) => {
                                    const config = CHANGE_TYPE_CONFIG[log.change_type] || CHANGE_TYPE_CONFIG.stock;
                                    const IconComponent = config.icon;

                                    return (
                                        <motion.div
                                            key={log.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className={`flex items-center justify-between p-5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 ${log.is_reverted ? 'opacity-40' : ''}`}
                                        >
                                            <div className="flex items-center space-x-4 flex-1">
                                                <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center border`}>
                                                    <IconComponent className={`w-5 h-5 ${config.color}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-white text-sm truncate">{log.product_name}</p>
                                                        {log.is_reverted && (
                                                            <span className="px-2 py-0.5 rounded-md text-[8px] bg-amber-500/20 text-amber-400 font-black border border-amber-500/30">
                                                                GERİ ALINDI
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] font-mono text-secondary/50">{log.product_barcode || "—"}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                {/* Change Type Badge */}
                                                <div className={`px-3 py-1.5 rounded-lg border ${config.bgColor}`}>
                                                    <p className={`text-[10px] font-black ${config.color} uppercase tracking-wider`}>
                                                        {config.label}
                                                        {log.field_name === 'purchase_price' && ' (Alış)'}
                                                        {log.field_name === 'sale_price' && ' (Satış)'}
                                                    </p>
                                                </div>

                                                {/* Old → New */}
                                                <div className="flex items-center gap-3 min-w-[200px]">
                                                    <div className="text-right">
                                                        <p className="text-[9px] text-secondary font-bold uppercase">Eski</p>
                                                        <p className="text-sm text-white/50 font-bold line-through">
                                                            {formatValue(log, log.old_value)}
                                                        </p>
                                                    </div>
                                                    <span className="text-secondary/30">→</span>
                                                    <div className="text-left">
                                                        <p className="text-[9px] text-secondary font-bold uppercase">Yeni</p>
                                                        <p className={`text-sm font-black ${config.color}`}>
                                                            {formatValue(log, log.new_value)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Source */}
                                                <div className="flex items-center gap-1.5 min-w-[80px]">
                                                    {log.change_source === 'mobile' ? (
                                                        <Smartphone className="w-3.5 h-3.5 text-secondary/40" />
                                                    ) : (
                                                        <Monitor className="w-3.5 h-3.5 text-secondary/40" />
                                                    )}
                                                    <span className="text-[10px] text-secondary/40 font-bold uppercase">
                                                        {log.change_source === 'mobile' ? 'Mobil' : 'Masaüstü'}
                                                    </span>
                                                </div>

                                                {/* Time */}
                                                <div className="text-right text-xs text-secondary font-medium min-w-[50px]">
                                                    {new Date(log.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>

                                                {/* Undo button */}
                                                <button
                                                    onClick={() => handleRevert(log)}
                                                    disabled={log.is_reverted || reverting === log.id}
                                                    className={`p-2 rounded-lg transition-all ${log.is_reverted
                                                        ? 'text-secondary/20 cursor-not-allowed'
                                                        : 'text-secondary hover:text-amber-400 hover:bg-amber-500/10 active:scale-90'
                                                        }`}
                                                    title={log.is_reverted ? "Zaten geri alındı" : "Bu değişikliği geri al"}
                                                >
                                                    {reverting === log.id ? (
                                                        <Loader className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Undo2 className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
