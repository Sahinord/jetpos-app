"use client";

import { AlertTriangle, ArrowRight } from "lucide-react";

export default function QuickStockAlerts({ products, onViewAll }: { products: any[], onViewAll: () => void }) {
    const criticalProducts = products.filter((p: any) => p.stock_quantity < 10);

    if (criticalProducts.length === 0) return null;

    return (
        <div className="glass-card !border-rose-500/20 bg-rose-500/5 !p-8 h-full">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3 text-rose-500">
                    <div className="p-2 bg-rose-500/20 rounded-lg">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black tracking-tight uppercase">Kritik Stok</h3>
                </div>
                {criticalProducts.length > 0 && (
                    <span className="px-2.5 py-1 bg-rose-500 text-white rounded-lg text-[10px] font-black animate-pulse">
                        {criticalProducts.length} ÜRÜN
                    </span>
                )}
            </div>

            <div className="space-y-4">
                {criticalProducts.slice(0, 4).map((product: any) => (
                    <div
                        key={product.id}
                        className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-rose-500/40 transition-all group cursor-default"
                    >
                        <div className="flex flex-col">
                            <p className="font-bold text-sm text-foreground group-hover:text-rose-400 transition-colors uppercase tracking-tight line-clamp-1">{product.name}</p>
                            <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mt-1">KALAN: <span className="text-rose-500">{product.stock_quantity} {product.unit || 'Adet'}</span></p>
                        </div>
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all">
                            <ArrowRight className="w-4 h-4" />
                        </div>
                    </div>
                ))}
            </div>

            {criticalProducts.length > 4 && (
                <button
                    onClick={onViewAll}
                    className="w-full mt-6 py-4 rounded-xl border border-white/5 bg-white/5 text-center text-[10px] text-secondary hover:text-white hover:bg-white/10 font-black uppercase tracking-[2px] transition-all active:scale-95"
                >
                    Tüm uyarıları gör ({criticalProducts.length})
                </button>
            )}
        </div>
    );
}
