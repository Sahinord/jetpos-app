"use client";

import { AlertTriangle, ArrowRight } from "lucide-react";

export default function QuickStockAlerts({ products, onViewAll }: { products: any[], onViewAll: () => void }) {
    const criticalProducts = products.filter((p: any) => p.stock_quantity < 10);

    if (criticalProducts.length === 0) return null;

    return (
        <div className="glass-card !border-amber-500/20 bg-amber-500/5">
            <div className="flex items-center space-x-2 text-amber-500 mb-4">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold">Kritik Stok Uyarıları</h3>
            </div>

            <div className="space-y-3">
                {criticalProducts.slice(0, 4).map((product: any) => (
                    <div
                        key={product.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-card border border-border hover:border-amber-500/30 transition-all"
                    >
                        <div>
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-secondary">Kalan: {product.stock_quantity} Adet</p>
                        </div>
                        <div className="flex items-center text-amber-500 text-xs font-bold">
                            Stok Az
                            <ArrowRight className="w-3 h-3 ml-1" />
                        </div>
                    </div>
                ))}
            </div>

            {criticalProducts.length > 4 && (
                <button 
                    onClick={onViewAll}
                    className="w-full mt-4 text-center text-xs text-secondary hover:text-white transition-colors"
                >
                    Tüm uyarıları gör ({criticalProducts.length})
                </button>
            )}
        </div>
    );
}
