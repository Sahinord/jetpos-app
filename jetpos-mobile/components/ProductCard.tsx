"use client";

import { Package, CheckCircle, AlertCircle, X, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProductCardProps {
    product: any;
    onClose: () => void;
    onScanAgain: () => void;
}

export default function ProductCard({ product, onClose, onScanAgain }: ProductCardProps) {
    const isLowStock = product.stock_quantity < 10;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-6 shadow-2xl"
        >
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-emerald-500 uppercase">Ürün Bulundu</p>
                        <p className="text-sm text-gray-400">{product.barcode}</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-xl hover:bg-white/5 transition-all"
                >
                    <X className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            {/* Product Name */}
            <div>
                <h2 className="text-2xl font-black text-white mb-1">{product.name}</h2>
                {product.categories && (
                    <p className="text-sm text-gray-400">📁 {product.categories.name}</p>
                )}
            </div>

            {/* Price Info */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <p className="text-xs text-gray-400 mb-1">Alış Fiyatı</p>
                    <p className="text-xl font-black text-white">
                        ₺{product.purchase_price?.toFixed(2)}
                    </p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 rounded-2xl p-4 border border-emerald-500/20">
                    <p className="text-xs text-emerald-500 mb-1">Satış Fiyatı</p>
                    <p className="text-xl font-black text-white">
                        ₺{product.sale_price?.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Stock Info */}
            <div className={`rounded-2xl p-4 border ${isLowStock
                    ? 'bg-red-500/10 border-red-500/20'
                    : 'bg-white/5 border-white/10'
                }`}>
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-gray-400 uppercase">Stok Durumu</p>
                    {isLowStock && <AlertCircle className="w-4 h-4 text-red-500" />}
                </div>
                <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black text-white">{product.stock_quantity}</p>
                    <p className="text-sm text-gray-400">{product.unit || 'Adet'}</p>
                </div>
                {isLowStock && (
                    <p className="text-xs text-red-400 mt-2">⚠️ Kritik Seviye!</p>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={onScanAgain}
                    className="py-3 bg-blue-600 hover:bg-blue-700 rounded-2xl text-white font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    Tekrar Okut
                </button>
                <button
                    onClick={onClose}
                    className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-bold transition-all active:scale-95"
                >
                    Kapat
                </button>
            </div>
        </motion.div>
    );
}
