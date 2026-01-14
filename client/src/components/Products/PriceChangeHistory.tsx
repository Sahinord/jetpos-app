"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, TrendingUp, Calendar, Package, DollarSign, Percent } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function PriceChangeHistory({ onBack }: { onBack: () => void }) {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "today" | "week" | "month">("all");

    useEffect(() => {
        fetchLogs();
    }, [filter]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('price_change_logs')
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

            const { data, error } = await query.limit(500);

            if (error) throw error;
            setLogs(data || []);
        } catch (error: any) {
            console.error("Log fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    // Group logs by date
    const groupedLogs = logs.reduce((acc: any, log: any) => {
        const date = new Date(log.created_at).toLocaleDateString('tr-TR');
        if (!acc[date]) acc[date] = [];
        acc[date].push(log);
        return acc;
    }, {});

    const totalIncrease = logs.reduce((sum, log) => sum + parseFloat(log.increase_amount || 0), 0);
    const avgRate = logs.length > 0
        ? logs.reduce((sum, log) => sum + parseFloat(log.increase_rate || 0), 0) / logs.length
        : 0;

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
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                            <TrendingUp className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white">FİYAT DEĞİŞİKLİK GEÇMİŞİ</h1>
                            <p className="text-sm text-secondary font-medium">Uygulanan toplu zam işlemleri</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {["all", "today", "week", "month"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black text-secondary uppercase tracking-widest">Toplam İşlem</p>
                            <p className="text-3xl font-black text-white mt-2">{logs.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-primary" />
                        </div>
                    </div>
                </div>
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black text-secondary uppercase tracking-widest">Toplam Zam</p>
                            <p className="text-3xl font-black text-emerald-400 mt-2">₺{totalIncrease.toFixed(2)}</p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-emerald-400" />
                        </div>
                    </div>
                </div>
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black text-secondary uppercase tracking-widest">Ortalama Oran</p>
                            <p className="text-3xl font-black text-amber-400 mt-2">%{avgRate.toFixed(1)}</p>
                        </div>
                        <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                            <Percent className="w-6 h-6 text-amber-400" />
                        </div>
                    </div>
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
                        <p className="text-lg font-bold">Henüz zam işlemi yapılmamış</p>
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
                                {groupedLogs[date].map((log: any) => (
                                    <motion.div
                                        key={log.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex items-center justify-between p-6 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                                    >
                                        <div className="flex items-center space-x-4 flex-1">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-sm">{log.product_name}</p>
                                                <p className="text-xs text-secondary font-mono">{log.product_barcode || "—"}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8">
                                            <div className="text-right">
                                                <p className="text-xs text-secondary font-bold">ESKİ FİYAT</p>
                                                <p className="text-sm text-white font-bold line-through opacity-50">₺{parseFloat(log.old_price).toFixed(2)}</p>
                                            </div>

                                            <div className="text-center">
                                                <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                                    <p className="text-xs font-black text-amber-400">+%{parseFloat(log.increase_rate).toFixed(1)}</p>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-xs text-secondary font-bold">YENİ FİYAT</p>
                                                <p className="text-base text-emerald-400 font-black">₺{parseFloat(log.new_price).toFixed(2)}</p>
                                            </div>

                                            <div className="text-right min-w-[100px]">
                                                <p className="text-xs text-secondary font-bold">ARTIŞ</p>
                                                <p className="text-sm text-emerald-400 font-black">+₺{parseFloat(log.increase_amount).toFixed(2)}</p>
                                            </div>

                                            <div className="text-right text-xs text-secondary font-medium">
                                                {new Date(log.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
