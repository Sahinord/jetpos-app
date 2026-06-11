"use client";

import { useMemo } from "react";
import { AlertTriangle, ArrowRight, Sparkles, TrendingUp, Clock, Zap, ShieldAlert } from "lucide-react";
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
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-card/80 backdrop-blur-xl h-full flex flex-col"
            style={{
                boxShadow: '0 0 0 1px rgba(255,255,255,0.02), 0 8px 40px -12px rgba(168,85,247,0.08)'
            }}
        >
            {/* Top gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

            {/* Background glow */}
            <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-purple-500/5 blur-[60px]" />

            {/* Header */}
            <div className="p-6 pb-0">
                <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="relative w-11 h-11 rounded-xl flex items-center justify-center bg-purple-500/10">
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 opacity-[0.08]" />
                            <Sparkles className="w-5 h-5 text-purple-400 relative z-10 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-foreground uppercase tracking-[0.15em] leading-tight">Stok Öngörüsü</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                <span className="text-[9px] font-bold text-secondary/40 uppercase tracking-[2px]">AI Destekli</span>
                            </div>
                        </div>
                    </div>
                    {criticalCount > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 border border-rose-500/15 rounded-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            <span className="text-[9px] font-black text-rose-400 uppercase tracking-tight">{criticalCount} Kritik</span>
                        </div>
                    )}
                </div>

                {/* Insight Summary */}
                <div className="mb-5 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] relative overflow-hidden">
                    <div className="absolute top-2 right-2 opacity-[0.06]">
                        <ShieldAlert className="w-6 h-6 text-purple-400" />
                    </div>
                    <p className="text-[11px] text-secondary/70 font-medium leading-relaxed pr-6">
                        <span className="text-foreground font-bold">{alerts.length} ürün</span> için stok tükenme riski tespit edildi. Öncelikli temin önerileri aşağıda.
                    </p>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 px-6 space-y-2.5 pb-4 scrollbar-hide overflow-y-auto">
                {alerts.slice(0, 5).map((alert, index) => (
                    <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.06 }}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-default group ${alert.riskLevel === 'high'
                                ? 'bg-rose-500/[0.04] border-rose-500/10 hover:border-rose-500/25'
                                : 'bg-white/[0.02] border-white/[0.04] hover:border-primary/20'
                            }`}
                    >
                        <div className="flex flex-col min-w-0 flex-1 pr-3">
                            <div className="flex items-center gap-2">
                                <p className="font-bold text-[13px] text-foreground tracking-tight truncate">{alert.name}</p>
                                {alert.riskLevel === 'high' && <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />}
                            </div>

                            <div className="flex items-center gap-3 mt-1.5">
                                <div className="flex items-center gap-1">
                                    <TrendingUp className="w-2.5 h-2.5 text-secondary/30" />
                                    <span className="text-[9px] font-bold text-secondary/40 uppercase tracking-wider">
                                        {alert.dailyVelocity}/gün
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5 text-secondary/30" />
                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${alert.riskLevel === 'high' ? 'text-rose-400' : 'text-primary/60'
                                        }`}>
                                        {alert.daysRemaining} gün
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border text-xs font-black transition-all ${alert.riskLevel === 'high'
                                ? 'bg-rose-500/10 border-rose-500/15 text-rose-400'
                                : 'bg-primary/10 border-primary/15 text-primary'
                            }`}>
                            {alert.stock_quantity}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/[0.04] mt-auto">
                <button
                    onClick={onViewAll}
                    className="w-full py-2.5 rounded-xl bg-white/[0.03] hover:bg-primary/10 text-secondary/60 hover:text-primary text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 border border-white/[0.04] hover:border-primary/20 group"
                >
                    Detaylı Analizi Gör
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </motion.div>
    );
}
