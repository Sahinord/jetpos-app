"use client";

import { motion } from "framer-motion";
import { Package, TrendingUp, DollarSign, List } from "lucide-react";

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
    const cards = [
        {
            title: "Toplam Ürün Çeşidi",
            value: totalItems.toLocaleString('tr-TR'),
            icon: List,
            color: "text-blue-600",
            bg: "bg-blue-500/10",
        },
        {
            title: "Toplam Stok Adedi",
            value: totalStock.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 3 }),
            icon: Package,
            color: "text-emerald-600",
            bg: "bg-emerald-500/10",
        },
        {
            title: "Toplam Stok Değeri",
            value: `₺${totalStockValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: DollarSign,
            color: "text-amber-600",
            bg: "bg-amber-500/10",
        },
        {
            title: "Potansiyel Net Kar",
            value: `₺${potentialProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: TrendingUp,
            color: "text-purple-600",
            bg: "bg-purple-500/10",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, index) => (
                <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-card flex flex-col gap-4 group hover:scale-[1.02] transition-all"
                >
                    <div className="flex items-center justify-between">
                        <div className={`w-12 h-12 rounded-2xl ${card.bg} flex items-center justify-center shadow-inner`}>
                            <card.icon className={`w-6 h-6 ${card.color}`} />
                        </div>
                        <div className="w-1.5 h-8 bg-secondary/10 rounded-full" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[2px] text-secondary opacity-70">{card.title}</p>
                        <h3 className="text-2xl font-black mt-1 tracking-tight text-[var(--color-foreground)]">
                            {card.value}
                        </h3>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
