"use client";

import { useMemo } from "react";
import { AlertTriangle, ArrowRight, Sparkles, TrendingUp, Clock, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateStockPredictions } from "@/lib/calculations";

interface QuickStockAlertsProps {
    products: any[];
    saleItems: any[];
    onViewAll: () => void;
    lowStockThreshold?: number;
}

export default function QuickStockAlerts({ products, saleItems, onViewAll, lowStockThreshold = 10 }: QuickStockAlertsProps) {
    const alerts = useMemo(() => {
        return calculateStockPredictions(products, saleItems, lowStockThreshold);
    }, [products, saleItems, lowStockThreshold]);

    if (alerts.length === 0) return null;

    const criticalCount = alerts.filter(a => a.riskLevel === 'high').length;

    return (
        <div className="glass-card !p-0 overflow-hidden relative group h-full flex flex-col">
            {/* AI Banner / Header */}
            <div className="p-6 pb-0">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-focus flex items-center justify-center shadow-lg shadow-primary/20">
                            <Sparkles className="w-5 h-5 text-white animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-foreground uppercase tracking-[0.2em] leading-tight">Akıllı Stok Öngörüsü</h3>
                            <div className="flex items-center gap-1.5 mt-1">
                                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-black text-secondary/60 uppercase tracking-widest">AI Destekli Analiz</span>
                            </div>
                        </div>
                    </div>
                    {criticalCount > 0 && (
                        <div className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">{criticalCount} KRİTİK</span>
                        </div>
                    )}
                </div>

                {/* Insight Summary */}
                <div className="mb-6 p-4 rounded-2xl bg-primary/5 border border-primary/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <Zap className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-[11px] text-secondary/80 font-medium leading-relaxed italic">
                        "{alerts.length} ürün için stok tükenme riski tespit edildi. Satış hızına göre aşağıdaki ürünler öncelikli temin edilmelidir."
                    </p>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 px-6 space-y-3 pb-6 scrollbar-hide overflow-y-auto">
                {alerts.slice(0, 5).map((alert, index) => (
                    <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-default ${alert.riskLevel === 'high'
                                ? 'bg-rose-500/5 border-rose-500/10 hover:border-rose-500/30'
                                : 'bg-white/[0.02] border-white/5 hover:border-primary/30'
                            }`}
                    >
                        <div className="flex flex-col min-w-0 flex-1 pr-4">
                            <div className="flex items-center gap-2">
                                <p className="font-bold text-sm text-foreground uppercase tracking-tight truncate">{alert.name}</p>
                                {alert.riskLevel === 'high' && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                                <div className="flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3 text-secondary/30" />
                                    <span className="text-[9px] font-black text-secondary/40 uppercase tracking-widest">
                                        HIZ: <span className="text-secondary/60">{alert.dailyVelocity}/GÜN</span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-secondary/30" />
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${alert.riskLevel === 'high' ? 'text-rose-400' : 'text-primary/60'
                                        }`}>
                                        KALAN: {alert.daysRemaining} GÜN
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${alert.riskLevel === 'high'
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                                : 'bg-primary/10 border-primary/20 text-primary'
                            }`}>
                            <span className="text-xs font-black">{alert.stock_quantity}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 mt-auto bg-white/[0.01]">
                <button
                    onClick={onViewAll}
                    className="w-full py-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 border border-primary/10 group"
                >
                    DETAYLI ANALİZİ GÖR
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
}
