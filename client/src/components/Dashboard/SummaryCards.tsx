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
                    className="glass-card flex items-center space-x-4 overflow-hidden"
                >
                    <div className={`p-3 rounded-xl ${card.bg} flex-shrink-0`}>
                        <card.icon className={`w-6 h-6 ${card.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-secondary text-sm font-medium truncate">{card.title}</p>
                        <h3 className="text-xl lg:text-2xl font-bold mt-1 truncate" title={card.value}>
                            {card.value}
                        </h3>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
