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
            bg: "bg-blue-400/10",
        },
        {
            title: "Toplam Stok Adedi",
            value: totalStock.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 3 }),
            icon: Package,
            color: "text-emerald-400",
            bg: "bg-emerald-400/10",
        },
        {
            title: "Toplam Stok Değeri",
            value: `₺${totalStockValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: DollarSign,
            color: "text-amber-400",
            bg: "bg-amber-400/10",
        },
        {
            title: "Potansiyel Net Kar",
            value: `₺${potentialProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: TrendingUp,
            color: "text-purple-400",
            bg: "bg-purple-400/10",
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
                    className="glass-card flex items-center space-x-4"
                >
                    <div className={`p-3 rounded-xl ${card.bg}`}>
                        <card.icon className={`w-6 h-6 ${card.color}`} />
                    </div>
                    <div>
                        <p className="text-secondary text-sm font-medium">{card.title}</p>
                        <h3 className="text-2xl font-bold mt-1">{card.value}</h3>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
