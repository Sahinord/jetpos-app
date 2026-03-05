"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, TrendingUp, DollarSign, List, ShoppingBag, CreditCard, Wallet, Settings, X, Store, ChevronDown, Trash2, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

interface SummaryProps {
    totalItems: number;
    totalStock: number;
    totalStockValue: number;
    potentialProfit: number;
}

export default function SummaryCards({
    totalItems,
    totalStock,
    totalStockValue,
    potentialProfit
}: SummaryProps) {
    const { currentTenant } = useTenant();
    const [finances, setFinances] = useState({
        storeSales: 0,
        trendyolSales: 0,
        expenses: 0,
        netProfit: 0
    });

    // Zaman filtresi için state
    const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('dashboard_time_filter') as 'today' | 'week' | 'month') || 'month';
        }
        return 'month';
    });

    // 8 Sabit Kutu Sistemi
    const allCardIds = [
        "total_items", "total_stock", "stock_value", "potential_profit",
        "store_sales", "trendyol_sales", "expenses", "net_profit"
    ];

    const [boxAssignments, setBoxAssignments] = useState<(string | null)[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('dashboard_box_assignments');
            if (saved) return JSON.parse(saved);
        }
        return allCardIds;
    });

    const [activeBoxIndex, setActiveBoxIndex] = useState<number | null>(null);
    const [isTimeMenuOpen, setIsTimeMenuOpen] = useState(false);

    useEffect(() => {
        if (!currentTenant?.id) return;

        async function fetchFinances() {
            try {
                // Zaman filtresine göre başlangıç tarihini belirle
                let startDate = new Date();
                if (timeFilter === 'today') {
                    startDate.setHours(0, 0, 0, 0);
                } else if (timeFilter === 'week') {
                    // Haftanın başı (Pazartesi)
                    const day = startDate.getDay();
                    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
                    startDate.setDate(diff);
                    startDate.setHours(0, 0, 0, 0);
                } else {
                    // Bu ayın başı
                    startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
                }
                const firstDay = startDate.toISOString();

                // Giderler
                const { data: expData } = await supabase
                    .from('expenses')
                    .select('amount')
                    .eq('tenant_id', currentTenant!.id)
                    .gte('created_at', firstDay);

                const totalExpenses = (expData || []).reduce((sum, item) => sum + Number(item.amount), 0);

                // Mağaza Satışları
                const { data: salesData } = await supabase
                    .from('sales')
                    .select('total_amount, total_profit')
                    .eq('tenant_id', currentTenant!.id)
                    .gte('created_at', firstDay);

                const storeSales = (salesData || []).reduce((sum, item) => sum + Number(item.total_amount), 0);
                const storeProfit = (salesData || []).reduce((sum, item) => sum + Number(item.total_profit), 0); // Maliyet çıkmış hal

                // Trendyol
                const { data: tyData } = await supabase
                    .from('trendyol_go_orders')
                    .select('total_price')
                    .eq('tenant_id', currentTenant!.id)
                    .neq('status', 'Cancelled')
                    .gte('created_at', firstDay);

                const trendyolSales = (tyData || []).reduce((sum, item) => sum + Number(item.total_price), 0);

                // Net Kar hesaplama:
                // (Mağaza Karı + Trendyol Satış) - Giderler (Trendyol maliyetleri şu an tam hesaplanmıyorsa satış üzerinden alınabilir)
                // Basitçe: (storeProfit + trendyolSales) - totalExpenses
                const netProfit = (storeProfit + trendyolSales) - totalExpenses;

                setFinances({
                    storeSales,
                    trendyolSales,
                    expenses: totalExpenses,
                    netProfit
                });

            } catch (error) {
                console.error("Dashboard finans verisi alınamadı", error);
            }
        }
        fetchFinances();
    }, [currentTenant, timeFilter]);

    const handleBoxAssignment = (newId: string | null) => {
        if (activeBoxIndex === null) return;
        const newAssignments = [...boxAssignments];
        newAssignments[activeBoxIndex] = newId;
        setBoxAssignments(newAssignments);
        localStorage.setItem('dashboard_box_assignments', JSON.stringify(newAssignments));
        setActiveBoxIndex(null);
    };

    const handleTimeFilter = (filter: 'today' | 'week' | 'month') => {
        setTimeFilter(filter);
        localStorage.setItem('dashboard_time_filter', filter);
        setIsTimeMenuOpen(false);
    };

    const getTimeLabel = () => {
        if (timeFilter === 'today') return '(Bugün)';
        if (timeFilter === 'week') return '(Bu Hafta)';
        return '(Bu Ay)';
    };
    const timeLabel = getTimeLabel();

    const formatTL = (val: number) => `₺${val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const cards = [
        { id: "total_items", title: "Toplam Ürün Çeşidi", value: totalItems.toLocaleString('tr-TR'), icon: List, iconColor: "text-blue-400", bgClass: "bg-blue-500/10", borderClass: "border-blue-500/20", shadowClass: "shadow-[0_0_15px_rgba(59,130,246,0.2)]", dropShadowClass: "drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]" },
        { id: "total_stock", title: "Toplam Stok Adedi", value: totalStock.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }), icon: Package, iconColor: "text-emerald-400", bgClass: "bg-emerald-500/10", borderClass: "border-emerald-500/20", shadowClass: "shadow-[0_0_15px_rgba(16,185,129,0.2)]", dropShadowClass: "drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" },
        { id: "stock_value", title: "Toplam Stok Değeri", value: formatTL(totalStockValue), icon: DollarSign, iconColor: "text-amber-500", bgClass: "bg-amber-500/10", borderClass: "border-amber-500/20", shadowClass: "shadow-[0_0_15px_rgba(245,158,11,0.2)]", dropShadowClass: "drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]" },
        { id: "potential_profit", title: "Potansiyel Net Kar", value: formatTL(potentialProfit), icon: TrendingUp, iconColor: "text-purple-400", bgClass: "bg-purple-500/10", borderClass: "border-purple-500/20", shadowClass: "shadow-[0_0_15px_rgba(168,85,247,0.2)]", dropShadowClass: "drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]" },
        // YENİ FİNANSAL KARTLAR
        { id: "store_sales", title: `Mağaza Satışları ${timeLabel}`, value: formatTL(finances.storeSales), icon: Store, iconColor: "text-cyan-400", bgClass: "bg-cyan-500/10", borderClass: "border-cyan-500/20", shadowClass: "shadow-[0_0_15px_rgba(34,211,238,0.2)]", dropShadowClass: "drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" },
        { id: "trendyol_sales", title: `Trendyol Geliri ${timeLabel}`, value: formatTL(finances.trendyolSales), icon: ShoppingBag, iconColor: "text-orange-400", bgClass: "bg-orange-500/10", borderClass: "border-orange-500/20", shadowClass: "shadow-[0_0_15px_rgba(251,146,60,0.2)]", dropShadowClass: "drop-shadow-[0_0_5px_rgba(251,146,60,0.5)]" },
        { id: "expenses", title: `Net Giderler ${timeLabel}`, value: formatTL(finances.expenses), icon: CreditCard, iconColor: "text-rose-400", bgClass: "bg-rose-500/10", borderClass: "border-rose-500/20", shadowClass: "shadow-[0_0_15px_rgba(251,113,133,0.2)]", dropShadowClass: "drop-shadow-[0_0_5px_rgba(251,113,133,0.5)]" },
        { id: "net_profit", title: `Gerçekleşen Kar ${timeLabel}`, value: formatTL(finances.netProfit), icon: Wallet, iconColor: "text-indigo-400", bgClass: "bg-indigo-500/10", borderClass: "border-indigo-500/20", shadowClass: "shadow-[0_0_15px_rgba(129,140,248,0.2)]", dropShadowClass: "drop-shadow-[0_0_5px_rgba(129,140,248,0.5)]" }
    ];

    return (
        <div className="relative space-y-4">
            {/* ZAMAN FİLTRESİ DROPDOWN */}
            <div className="flex justify-end mb-2 relative z-50">
                <div className="relative">
                    <button
                        onClick={() => setIsTimeMenuOpen(!isTimeMenuOpen)}
                        className="flex items-center gap-2 px-4 py-2 bg-black/20 hover:bg-black/30 backdrop-blur-md rounded-xl border border-white/10 text-xs font-black text-white transition-all focus:outline-none"
                    >
                        <span>{timeFilter === 'today' ? 'BUGÜN' : timeFilter === 'week' ? 'BU HAFTA' : 'BU AY'}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isTimeMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {isTimeMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                className="absolute right-0 top-full mt-2 w-48 bg-[#1a1f2c]/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 p-1 space-y-1"
                            >
                                {(['today', 'week', 'month'] as const).map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => handleTimeFilter(filter)}
                                        className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-between group ${timeFilter === filter ? 'bg-primary/20 text-primary' : 'text-secondary hover:text-white hover:bg-white/5'}`}
                                    >
                                        <span>{filter === 'today' ? 'Bugün' : filter === 'week' ? 'Bu Hafta' : 'Bu Ay'}</span>
                                        {timeFilter === filter && (
                                            <motion.div layoutId="activeFilter" className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        )}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Dışarı Tıklama kapatıcısı */}
                    {isTimeMenuOpen && (
                        <div className="fixed inset-0 z-40" onClick={() => setIsTimeMenuOpen(false)}></div>
                    )}
                </div>
            </div>

            {/* KARTLAR */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 relative z-10">
                <AnimatePresence>
                    {boxAssignments.map((assignedId, index) => {
                        const card = cards.find(c => c.id === assignedId);

                        if (!card) {
                            return (
                                <motion.div
                                    key={`empty-${index}`}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    onClick={() => setActiveBoxIndex(index)}
                                    className="glass-card relative !p-6 flex flex-col items-center justify-center gap-3 group cursor-pointer border border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all text-secondary/30 hover:text-primary min-h-[140px]"
                                >
                                    <Plus className="w-8 h-8 opacity-20 group-hover:opacity-100 transition-opacity" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Kutu {index + 1} Boş</p>
                                </motion.div>
                            );
                        }

                        return (
                            <motion.div
                                key={`${index}-${card.id}`}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                layoutId={`box-${index}`}
                                className="glass-card relative !p-5 lg:!p-6 flex flex-col gap-3 group hover:scale-[1.02] transition-all border border-white/5 hover:border-white/10"
                            >
                                <div className="flex items-center justify-between">
                                    <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center border ${card.borderClass} ${card.bgClass} ${card.shadowClass}`}>
                                        <card.icon className={`w-5 h-5 lg:w-6 lg:h-6 ${card.iconColor} ${card.dropShadowClass}`} />
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setActiveBoxIndex(index);
                                        }}
                                        className={`relative z-10 w-8 h-8 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all ${card.bgClass} hover:bg-white/10`}
                                        title="Bu Kutuyu Değiştir"
                                    >
                                        <Settings className={`w-4 h-4 ${card.iconColor}`} />
                                    </button>
                                </div>
                                <div>
                                    <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-[1.5px] text-secondary/60 mb-1 line-clamp-1">{card.title}</p>
                                    <h3 className={`text-xl lg:text-2xl font-black tracking-tight ${formatTL(finances.netProfit) === card.value && finances.netProfit < 0 ? 'text-red-500' : 'text-foreground'}`}>
                                        {card.value}
                                    </h3>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* AYAR MODALI */}
            <AnimatePresence>
                {activeBoxIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-card/90 backdrop-blur-xl p-6 rounded-3xl shadow-2xl w-full max-w-sm border border-border"
                        >
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/50">
                                <div>
                                    <h3 className="text-lg font-black tracking-tight flex items-center gap-2 text-foreground">
                                        <Settings className="w-5 h-5 text-primary" />
                                        <span>Görünümü Değiştir</span>
                                    </h3>
                                    <p className="text-[10px] text-secondary/60 mt-1 uppercase tracking-widest font-bold">Kutu {activeBoxIndex + 1} İçin Seçim Yapın</p>
                                </div>
                                <button onClick={() => setActiveBoxIndex(null)} className="text-secondary hover:text-white bg-white/5 hover:bg-red-500/20 p-2 rounded-xl transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                {/* Clear Selection Option */}
                                <button
                                    onClick={() => handleBoxAssignment(null)}
                                    className="w-full flex items-center gap-3 p-3 rounded-2xl border border-red-500/10 bg-red-500/5 hover:bg-red-500/10 transition-all text-red-500 mb-2 group"
                                >
                                    <div className="p-2.5 rounded-xl bg-red-500/10 group-hover:bg-red-500/20">
                                        <Trash2 className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-bold">Kutuyu Boşalt</span>
                                </button>

                                {cards.map((c) => {
                                    const isSelected = boxAssignments[activeBoxIndex] === c.id;
                                    const isAlreadyAssigned = boxAssignments.includes(c.id) && !isSelected;

                                    return (
                                        <div
                                            key={c.id}
                                            onClick={() => !isAlreadyAssigned && handleBoxAssignment(c.id)}
                                            className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${isAlreadyAssigned ? 'opacity-50 cursor-not-allowed bg-black/20 border-white/5' : isSelected ? 'bg-white/5 border-white/20 cursor-pointer' : 'bg-white/[0.02] border-border/50 hover:bg-white/5 cursor-pointer'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2.5 rounded-xl ${isAlreadyAssigned ? 'bg-white/5' : c.bgClass}`}>
                                                    <c.icon className={`w-4 h-4 ${isAlreadyAssigned ? 'text-secondary/50' : c.iconColor}`} />
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className={`text-sm font-bold transition-colors ${isAlreadyAssigned ? 'text-secondary/50' : isSelected ? 'text-white' : 'text-secondary'}`}>{c.title}</span>
                                                    {isAlreadyAssigned && <span className="text-[9px] text-red-500/80 font-black uppercase tracking-wider">Bu Kutu Zaten Ekli</span>}
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <div className={`w-2 h-2 rounded-full bg-white ${c.shadowClass}`} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
