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
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20"
        },
        {
            title: "Toplam Stok Adedi",
            value: totalStock.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }),
            icon: Package,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20"
        },
        {
            title: "Toplam Stok Değeri",
            value: `₺${totalStockValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: DollarSign,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20"
        },
        {
            title: "Potansiyel Net Kar",
            value: `₺${potentialProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: TrendingUp,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            border: "border-purple-500/20"
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
                    className={`glass-card !p-6 flex flex-col gap-4 group hover:scale-[1.01] transition-all border ${card.border}`}
                >
                    <div className="flex items-center justify-between">
                        <div className={`w-12 h-12 rounded-2xl ${card.bg} flex items-center justify-center shadow-md border ${card.border}`}>
                            <card.icon className={`w-6 h-6 ${card.color}`} />
                        </div>
                        <div className={`w-1.5 h-8 ${card.bg} rounded-full opacity-20 group-hover:opacity-60 transition-opacity`} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[1.5px] text-secondary/60 mb-1">{card.title}</p>
                        <h3 className="text-2xl font-black tracking-tight text-foreground">
                            {card.value}
                        </h3>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
