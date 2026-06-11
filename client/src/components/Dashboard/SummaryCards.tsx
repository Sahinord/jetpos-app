"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Package, TrendingUp, DollarSign, List, ShoppingBag, CreditCard,
    Wallet, Settings, X, Store, ChevronDown, Trash2, Plus,
    ArrowUpRight, ArrowDownRight, Minus, Weight, ToggleLeft, ToggleRight
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

interface SummaryProps {
    totalItems: number;
    totalStock: number;
    totalStockKg: number;
    totalStockValue: number;
    potentialProfit: number;
}

// Animated counter hook
function useAnimatedCounter(target: number, duration = 1200) {
    const [value, setValue] = useState(0);
    const frameRef = useRef<number>(0);

    useEffect(() => {
        const startTime = performance.now();
        const startValue = 0;

        const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(startValue + (target - startValue) * eased);

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(tick);
            }
        };
        frameRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameRef.current);
    }, [target, duration]);

    return value;
}

// Mini Sparkline SVG component
function Sparkline({ data, color, height = 32 }: { data: number[], color: string, height?: number }) {
    if (!data || data.length < 2) return null;

    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const w = 80;
    const h = height;
    const padding = 2;

    const points = data.map((v, i) => {
        const x = padding + (i / (data.length - 1)) * (w - padding * 2);
        const y = h - padding - ((v - min) / range) * (h - padding * 2);
        return `${x},${y}`;
    }).join(' ');

    const areaPoints = `${padding},${h - padding} ${points} ${w - padding},${h - padding}`;

    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-60">
            <defs>
                <linearGradient id={`spark-fill-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon
                points={areaPoints}
                fill={`url(#spark-fill-${color.replace('#', '')})`}
            />
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export default function SummaryCards({
    totalItems,
    totalStock,
    totalStockKg,
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

    // KG dahil toggle
    const [includeKgStock, setIncludeKgStock] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('dashboard_include_kg') === 'true';
        }
        return false;
    });

    const toggleKgStock = () => {
        const next = !includeKgStock;
        setIncludeKgStock(next);
        localStorage.setItem('dashboard_include_kg', String(next));
    };

    // Kutu Sistemi (KG kartı ayarlardan eklenebilir)
    const allCardIds = [
        "total_items", "total_stock", "stock_value", "potential_profit",
        "store_sales", "trendyol_sales", "expenses", "net_profit"
    ];

    const [boxAssignments, setBoxAssignments] = useState<(string | null)[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('dashboard_box_assignments');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Force max 8 slots for backward compatibility with previous 9-slot experiment
                if (Array.isArray(parsed)) {
                    return parsed.slice(0, 8);
                }
            }
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

    // Generate mock sparkline data based on card type
    const getSparkData = (id: string): number[] => {
        // Deterministic pseudo-random based on id hash
        const seed = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        return Array.from({ length: 7 }, (_, i) => {
            const base = Math.sin(seed + i * 0.8) * 30 + 50;
            return Math.max(0, base + (i * 5));
        });
    };

    const cards = [
        {
            id: "total_items", title: "Toplam Ürün Çeşidi", value: totalItems, isCurrency: false,
            icon: List,
            gradient: "from-blue-500 to-blue-600",
            glowColor: "rgba(59,130,246,0.15)",
            accentColor: "#3b82f6",
            bgRing: "rgba(59,130,246,0.1)",
            trend: "neutral" as const
        },
        {
            id: "total_stock",
            title: includeKgStock ? "Toplam Stok (Adet+KG)" : "Toplam Stok Adedi",
            value: includeKgStock ? totalStock + totalStockKg : totalStock,
            isCurrency: false,
            suffix: includeKgStock ? undefined : 'adet',
            icon: Package,
            gradient: "from-emerald-500 to-emerald-600",
            glowColor: "rgba(16,185,129,0.15)",
            accentColor: "#10b981",
            bgRing: "rgba(16,185,129,0.1)",
            trend: "neutral" as const,
            hasKgToggle: true
        },
        {
            id: "total_stock_kg",
            title: "Stok (KG Bazlı)",
            value: totalStockKg,
            isCurrency: false,
            suffix: 'kg',
            icon: Weight,
            gradient: "from-teal-500 to-emerald-500",
            glowColor: "rgba(20,184,166,0.15)",
            accentColor: "#14b8a6",
            bgRing: "rgba(20,184,166,0.1)",
            trend: "neutral" as const
        },
        {
            id: "stock_value", title: "Toplam Stok Değeri", value: totalStockValue, isCurrency: true,
            icon: DollarSign,
            gradient: "from-amber-500 to-orange-500",
            glowColor: "rgba(245,158,11,0.15)",
            accentColor: "#f59e0b",
            bgRing: "rgba(245,158,11,0.1)",
            trend: "up" as const
        },
        {
            id: "potential_profit", title: "Potansiyel Net Kar", value: potentialProfit, isCurrency: true,
            icon: TrendingUp,
            gradient: "from-purple-500 to-violet-600",
            glowColor: "rgba(168,85,247,0.15)",
            accentColor: "#a855f7",
            bgRing: "rgba(168,85,247,0.1)",
            trend: "up" as const
        },
        // YENİ FİNANSAL KARTLAR
        {
            id: "store_sales", title: `Mağaza Satışları ${timeLabel}`, value: finances.storeSales, isCurrency: true,
            icon: Store,
            gradient: "from-cyan-500 to-teal-500",
            glowColor: "rgba(34,211,238,0.15)",
            accentColor: "#22d3ee",
            bgRing: "rgba(34,211,238,0.1)",
            trend: finances.storeSales > 0 ? "up" as const : "neutral" as const
        },
        {
            id: "trendyol_sales", title: `Trendyol Geliri ${timeLabel}`, value: finances.trendyolSales, isCurrency: true,
            icon: ShoppingBag,
            gradient: "from-orange-500 to-red-500",
            glowColor: "rgba(251,146,60,0.15)",
            accentColor: "#fb923c",
            bgRing: "rgba(251,146,60,0.1)",
            trend: finances.trendyolSales > 0 ? "up" as const : "neutral" as const
        },
        {
            id: "expenses", title: `Net Giderler ${timeLabel}`, value: finances.expenses, isCurrency: true,
            icon: CreditCard,
            gradient: "from-rose-500 to-pink-600",
            glowColor: "rgba(251,113,133,0.15)",
            accentColor: "#fb7185",
            bgRing: "rgba(251,113,133,0.1)",
            trend: finances.expenses > 0 ? "down" as const : "neutral" as const
        },
        {
            id: "net_profit", title: `Gerçekleşen Kar ${timeLabel}`, value: finances.netProfit, isCurrency: true,
            icon: Wallet,
            gradient: "from-indigo-500 to-blue-600",
            glowColor: "rgba(129,140,248,0.15)",
            accentColor: "#818cf8",
            bgRing: "rgba(129,140,248,0.1)",
            trend: finances.netProfit > 0 ? "up" as const : finances.netProfit < 0 ? "down" as const : "neutral" as const
        }
    ];

    const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'neutral' }) => {
        if (trend === 'up') return <ArrowUpRight className="w-3.5 h-3.5" />;
        if (trend === 'down') return <ArrowDownRight className="w-3.5 h-3.5" />;
        return <Minus className="w-3.5 h-3.5" />;
    };

    const trendColor = (trend: 'up' | 'down' | 'neutral') => {
        if (trend === 'up') return 'text-emerald-400 bg-emerald-500/10';
        if (trend === 'down') return 'text-rose-400 bg-rose-500/10';
        return 'text-secondary/60 bg-white/5';
    };

    return (
        <div className="relative space-y-4">
            {/* ZAMAN FİLTRESİ DROPDOWN */}
            <div className="flex justify-end mb-2 relative z-50">
                <div className="relative">
                    <button
                        onClick={() => setIsTimeMenuOpen(!isTimeMenuOpen)}
                        className="flex items-center gap-2 px-4 py-2 bg-card hover:bg-[var(--color-faded)] backdrop-blur-md rounded-xl border border-[var(--color-border)] text-xs font-black text-foreground transition-all focus:outline-none"
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
                                className="absolute right-0 top-full mt-2 w-48 bg-card border border-[var(--color-border)] rounded-xl overflow-hidden shadow-2xl z-50 p-1 space-y-1"
                            >
                                {(['today', 'week', 'month'] as const).map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => handleTimeFilter(filter)}
                                        className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-between group ${timeFilter === filter ? 'bg-primary/20 text-primary' : 'text-secondary hover:text-foreground hover:bg-[var(--color-faded)]'}`}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 relative z-10">
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
                                    className="glass-card relative !p-6 flex flex-col items-center justify-center gap-3 group cursor-pointer border border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all text-secondary/30 hover:text-primary min-h-[160px]"
                                >
                                    <Plus className="w-8 h-8 opacity-20 group-hover:opacity-100 transition-opacity" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Kutu {index + 1} Boş</p>
                                </motion.div>
                            );
                        }

                        return (
                            <motion.div
                                key={`${index}-${card.id}`}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.4, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
                                layoutId={`box-${index}`}
                                className="relative group cursor-default"
                            >
                                {/* Card Container */}
                                <div
                                    className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-card/80 backdrop-blur-xl p-5 lg:p-6 transition-all duration-300 hover:border-white/[0.12] hover:translate-y-[-2px]"
                                    style={{
                                        boxShadow: `0 0 0 1px rgba(255,255,255,0.02), 0 8px 40px -12px ${card.glowColor}`
                                    }}
                                >
                                    {/* Subtle top gradient line */}
                                    <div
                                        className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${card.gradient} opacity-60`}
                                    />

                                    {/* Background glow */}
                                    <div
                                        className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity duration-500"
                                        style={{ background: card.accentColor }}
                                    />

                                    {/* Header Row */}
                                    <div className="flex items-start justify-between mb-4 relative z-10">
                                        <div className="flex items-center gap-3">
                                            {/* Icon with gradient ring */}
                                            <div
                                                className="relative w-11 h-11 rounded-xl flex items-center justify-center"
                                                style={{ background: card.bgRing }}
                                            >
                                                <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${card.gradient} opacity-[0.08]`} />
                                                <card.icon className="w-5 h-5 relative z-10" style={{ color: card.accentColor }} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-secondary/50 leading-tight line-clamp-1">{card.title}</p>
                                            </div>
                                        </div>

                                        {/* Settings button */}
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setActiveBoxIndex(index);
                                            }}
                                            className="relative z-10 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10"
                                            title="Bu Kutuyu Değiştir"
                                        >
                                            <Settings className="w-3.5 h-3.5 text-secondary/50" />
                                        </button>
                                    </div>

                                    {/* Value Row */}
                                    <div className="flex items-end justify-between relative z-10">
                                        <div className="space-y-2 flex-1 min-w-0">
                                            <AnimatedValue
                                                value={card.value}
                                                isCurrency={card.isCurrency}
                                                isNegative={card.id === 'net_profit' && finances.netProfit < 0}
                                                suffix={(card as any).suffix}
                                            />

                                            {/* Trend badge */}
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${trendColor(card.trend)}`}>
                                                    <TrendIcon trend={card.trend} />
                                                    <span>{card.trend === 'up' ? 'Artış' : card.trend === 'down' ? 'Düşüş' : 'Sabit'}</span>
                                                </div>

                                                {/* KG Toggle */}
                                                {(card as any).hasKgToggle && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleKgStock(); }}
                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${includeKgStock ? 'text-teal-400 bg-teal-500/10' : 'text-secondary/40 bg-white/[0.03] hover:text-secondary/60'}`}
                                                        title={includeKgStock ? 'KG dahil - tıkla kapat' : 'KG hariç - tıkla dahil et'}
                                                    >
                                                        {includeKgStock ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                                                        <span>KG</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Mini Sparkline */}
                                        <div className="shrink-0 ml-2 opacity-40 group-hover:opacity-70 transition-opacity">
                                            <Sparkline data={getSparkData(card.id)} color={card.accentColor} />
                                        </div>
                                    </div>
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
                                                <div className={`p-2.5 rounded-xl ${isAlreadyAssigned ? 'bg-white/5' : ''}`} style={!isAlreadyAssigned ? { background: c.bgRing } : {}}>
                                                    <c.icon className="w-4 h-4" style={{ color: isAlreadyAssigned ? 'var(--color-secondary)' : c.accentColor }} />
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className={`text-sm font-bold transition-colors ${isAlreadyAssigned ? 'text-secondary/50' : isSelected ? 'text-foreground' : 'text-secondary'}`}>{c.title}</span>
                                                    {isAlreadyAssigned && <span className="text-[9px] text-red-500/80 font-black uppercase tracking-wider">Bu Kutu Zaten Ekli</span>}
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <div className="w-2 h-2 rounded-full" style={{ background: c.accentColor, boxShadow: `0 0 8px ${c.glowColor}` }} />
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

// Sub-component for animated value display
function AnimatedValue({ value, isCurrency, isNegative, suffix }: { value: number, isCurrency: boolean, isNegative: boolean, suffix?: string }) {
    const animated = useAnimatedCounter(value, 1400);

    const formatted = isCurrency
        ? `₺${animated.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : animated.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: value % 1 !== 0 ? 2 : 0 });

    return (
        <h3 className={`text-2xl lg:text-[1.65rem] font-black tracking-tight tabular-nums ${isNegative ? 'text-red-400' : 'text-foreground'}`}>
            {formatted}
            {suffix && <span className="text-xs font-bold text-secondary/40 ml-1 uppercase">{suffix}</span>}
        </h3>
    );
}
