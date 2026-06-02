"use client";

import { useState, useEffect } from "react";
import { 
    Target, 
    Zap, 
    TrendingUp, 
    Brain, 
    ArrowRight,
    CheckCircle2,
    X,
    Coins,
    BarChart3,
    ArrowUpRight,
    Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

export default function ProfitPilot() {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState<any>({
        potentialProfit: 0,
        efficiencyScore: 0,
        hourlyIntensity: [],
        lowMarginProducts: []
    });

    // Operation State
    const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false);
    const [markupRate, setMarkupRate] = useState(5);
    const [isApplying, setIsApplying] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        if (currentTenant) fetchRealTimeAnalysis();
    }, [currentTenant]);

    const fetchRealTimeAnalysis = async () => {
        if (!currentTenant) return;
        setLoading(true);
        try {
            const { data: products } = await supabase
                .from('products')
                .select('id, sale_price, purchase_price, stock_quantity, name')
                .eq('tenant_id', currentTenant.id)
                .is('deleted_at', null);

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const { data: sales } = await supabase
                .from('sales')
                .select('created_at, total_amount, total_profit')
                .eq('tenant_id', currentTenant.id)
                .gte('created_at', thirtyDaysAgo.toISOString());

            let totalPotentialProfit = 0;
            const lowMarginProds: any[] = [];

            products?.forEach(p => {
                const sale = Number(p.sale_price || 0);
                const cost = Number(p.purchase_price || 0);
                const qty = Number(p.stock_quantity || 0);
                totalPotentialProfit += (sale - cost) * qty;

                if (sale > 0) {
                    const margin = ((sale - cost) / sale) * 100;
                    if (margin < 12 && margin > 0) {
                        lowMarginProds.push({ ...p, margin: Math.round(margin) });
                    }
                }
            });

            const hourlyData: Record<number, number> = {};
            sales?.forEach(s => {
                const hour = new Date(s.created_at).getHours();
                hourlyData[hour] = (hourlyData[hour] || 0) + 1;
            });

            const intensityArray = Array.from({ length: 24 }).map((_, i) => ({
                hour: i,
                value: hourlyData[i] || 0
            }));

            const totalRevenue = sales?.reduce((acc, s) => acc + Number(s.total_amount), 0) || 0;
            const totalProfit = sales?.reduce((acc, s) => acc + Number(s.total_profit), 0) || 0;
            const efficiency = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

            setAnalysis({
                potentialProfit: totalPotentialProfit,
                efficiencyScore: Math.round(efficiency + 60),
                hourlyIntensity: intensityArray,
                lowMarginProducts: lowMarginProds.sort((a, b) => a.margin - b.margin).slice(0, 10),
                totalRevenue
            });
        } catch (error) {
            console.error("Profit Pilot Analysis Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyOptimization = async () => {
        setIsApplying(true);
        try {
            // Apply price markup to low margin products
            const updates = analysis.lowMarginProducts.map((p: any) => {
                const newPrice = p.sale_price * (1 + markupRate / 100);
                return supabase
                    .from('products')
                    .update({ sale_price: newPrice })
                    .eq('id', p.id);
            });

            await Promise.all(updates);
            
            setSuccessMessage(`${analysis.lowMarginProducts.length} ürünün fiyatı %${markupRate} optimize edildi. Kâr marjınız yükseltildi!`);
            setTimeout(() => {
                setSuccessMessage(null);
                setIsOptimizeModalOpen(false);
                fetchRealTimeAnalysis();
            }, 3000);
        } catch (error) {
            console.error("Optimization Error:", error);
        } finally {
            setIsApplying(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6 pb-12 max-w-[1600px] mx-auto">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5">
                        <Target className="text-primary w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">Kâr Pilotu (AI)</h1>
                        <p className="text-xs text-slate-500 font-medium">İşletmenizi Otomatik Olarak Kâra Sokun</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10 text-[10px] font-bold text-emerald-500 tracking-wider uppercase">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> CANLI ANALİZ AKTİF
                </div>
            </div>

            {/* KPI Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border p-6 rounded-2xl relative overflow-hidden group hover:border-primary/30 transition-all">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">GİZLİ KÂR POTANSİYELİ</p>
                    <h2 className="text-2xl font-bold text-white tracking-tight">₺{analysis.potentialProfit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</h2>
                    <p className="text-[10px] font-medium text-slate-600 mt-2 italic">Mevcut envanterdeki kâr marjı toplamı.</p>
                </div>
                <div className="bg-card border border-border p-6 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">DÜŞÜK MARJLI ÜRÜN</p>
                    <h2 className="text-2xl font-bold text-amber-500 tracking-tight">{analysis.lowMarginProducts.length} ÜRÜN</h2>
                    <p className="text-[10px] font-medium text-slate-600 mt-2 italic">Maliyeti yüksek, kârı düşük ürün sayısı.</p>
                </div>
                <div className="bg-card border border-border p-6 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">OPTİMİZASYON ETKİSİ</p>
                    <h2 className="text-2xl font-bold text-emerald-500 tracking-tight">+₺{(analysis.totalRevenue * 0.05).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</h2>
                    <p className="text-[10px] font-medium text-slate-600 mt-2 italic">Tahmini aylık ek kâr artışı.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Strategies */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest px-1">STratejik analİZ SONUÇLARI</h3>
                    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
                        <table className="w-full text-left">
                            <thead className="bg-white/[0.02] border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ürün</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Mevcut Marj</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Stok</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Fiyat</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {analysis.lowMarginProducts.map((p: any, i: number) => (
                                    <tr key={p.id} className="hover:bg-white/[0.01] transition-all group">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-white text-sm">{p.name}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-xs font-bold text-amber-500">%{p.margin}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-xs font-bold text-slate-400">{p.stock_quantity}</td>
                                        <td className="px-6 py-4 text-right font-bold text-white text-sm">₺{p.sale_price.toLocaleString('tr-TR')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right: AI Brain & Insight */}
                <div className="space-y-6">
                    <div className="bg-primary/5 border border-primary/10 p-8 rounded-2xl relative overflow-hidden group shadow-2xl">
                        <div className="absolute -right-12 -top-12 w-32 h-32 bg-primary/10 blur-[50px] rounded-full" />
                        <div className="flex items-center gap-3 mb-6">
                            <Brain className="text-primary w-6 h-6 animate-pulse" />
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">JETPİLOT ÖNGÖRÜSÜ</h3>
                        </div>
                        <p className="text-sm text-slate-300 font-bold leading-relaxed italic border-l-2 border-primary/30 pl-4 mb-8">
                            "Dükkanındaki {analysis.lowMarginProducts.length} ürünün kâr marjı sektör ortalamasının altında. Bu ürünler için akıllı bir fiyat artışı (markup) yaparak kârını anında stabilize edebiliriz."
                        </p>
                        <button 
                            onClick={() => setIsOptimizeModalOpen(true)}
                            className="w-full py-4 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-[3px] hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95"
                        >
                            STRATEJİYİ AKTİF ET
                        </button>
                    </div>

                    <div className="bg-card border border-border p-6 rounded-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest">SATIŞ YOĞUNLUĞU</h3>
                            <Activity className="text-primary w-4 h-4" />
                        </div>
                        <div className="grid grid-cols-12 gap-1 h-12">
                            {analysis.hourlyIntensity.map((h: any, i: number) => (
                                <div
                                    key={i}
                                    className={`rounded-sm transition-all cursor-help
                                        ${h.value > 10 ? 'bg-emerald-500/60' : h.value > 5 ? 'bg-primary/50' : h.value > 0 ? 'bg-white/20' : 'bg-white/5'}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Optimization Modal */}
            <AnimatePresence>
                {isOptimizeModalOpen && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-card border border-primary/30 w-full max-w-md rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(37,99,255,0.2)]"
                        >
                            <div className="bg-primary/10 p-8 border-b border-primary/20 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                                        <TrendingUp className="text-white w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Marj Optimizasyonu</h3>
                                        <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Yapay Zeka Fiyatlama</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsOptimizeModalOpen(false)} className="p-2 hover:bg-white/5 rounded-lg text-slate-500">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fiyat Artış Oranı (Markup)</label>
                                        <span className="text-2xl font-black text-primary">%{markupRate}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="1" 
                                        max="20" 
                                        step="1"
                                        value={markupRate}
                                        onChange={(e) => setMarkupRate(parseInt(e.target.value))}
                                        className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-primary"
                                    />
                                    <div className="flex justify-between text-[10px] font-bold text-slate-600">
                                        <span>%1 (GÜVENLİ)</span>
                                        <span>%20 (AGRESİF)</span>
                                    </div>
                                </div>

                                <div className="p-6 bg-slate-950/50 rounded-2xl border border-white/5 space-y-4">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500">Hedef Ürün Sayısı:</span>
                                        <span className="text-white font-bold">{analysis.lowMarginProducts.length} Ürün</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500">Tahmini Kâr Artışı:</span>
                                        <span className="text-emerald-500 font-bold">+₺{(analysis.totalRevenue * (markupRate/100)).toLocaleString('tr-TR')} / Ay</span>
                                    </div>
                                </div>

                                {successMessage ? (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-4 text-emerald-500">
                                        <CheckCircle2 size={24} />
                                        <p className="text-xs font-bold leading-relaxed">{successMessage}</p>
                                    </motion.div>
                                ) : (
                                    <button 
                                        onClick={handleApplyOptimization}
                                        disabled={isApplying}
                                        className="w-full py-5 bg-primary text-white rounded-2xl font-bold text-xs uppercase tracking-[4px] hover:bg-primary/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {isApplying ? (
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Coins size={18} />
                                                STRATEJİYİ UYGULA
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
