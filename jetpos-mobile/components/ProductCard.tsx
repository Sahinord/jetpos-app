"use client";

import { Package, CheckCircle, AlertCircle, X, RefreshCw, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import ProductEditModal from './ProductEditModal';

interface ProductCardProps {
    product: any;
    onClose: () => void;
    onScanAgain: () => void;
    onProductUpdated?: () => Promise<void> | void;
}

export default function ProductCard({ product, onClose, onScanAgain, onProductUpdated }: ProductCardProps) {
    const [showEditModal, setShowEditModal] = useState(false);
    const isLowStock = product.stock_quantity < 10;

    const handleSaved = async () => {
        setShowEditModal(false);
        // Refresh product data from DB after modal closes
        if (onProductUpdated) {
            await onProductUpdated();
        }
    };

    return (
        <>
            <motion.div
                key={`product-card-${product.stock_quantity}-${product.sale_price}`}
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="glass-dark border border-white/10 rounded-[2.5rem] p-8 space-y-8 shadow-3xl relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16" />

                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <CheckCircle className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[3px]">Ürün Doğrulandı</p>
                            <p className="text-xs font-mono text-secondary mt-0.5">{product.barcode}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-white leading-tight tracking-tight">
                        {product.name}
                    </h2>
                    {product.categories && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 glass rounded-full border-white/5">
                            <Package className="w-3 h-3 text-blue-400" />
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">{product.categories.name}</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="glass p-5 rounded-3xl border-white/5 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-colors" />
                        <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-3">ALIŞ FİYATI</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xs font-bold text-white/50">₺</span>
                            <span className="text-2xl font-black text-white">{product.purchase_price?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-600/20 to-accent/20 p-5 rounded-3xl border border-blue-500/20 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">SATIŞ FİYATI</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xs font-bold text-blue-400/50">₺</span>
                            <span className="text-2xl font-black text-white">{product.sale_price?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>

                <div className={`p-6 rounded-[2rem] border relative overflow-hidden transition-all ${isLowStock ? 'bg-red-500/10 border-red-500/20' : 'glass border-white/5'
                    }`}>
                    {isLowStock && <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.1)_0%,transparent_70%)] animate-pulse" />}

                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <p className="text-[10px] font-black text-secondary uppercase tracking-[2px]">Mevcut Stok Durumu</p>
                        {isLowStock && <AlertCircle className="w-5 h-5 text-red-500" />}
                    </div>

                    <div className="flex items-end justify-between relative z-10">
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-white tabular-nums">{product.stock_quantity}</span>
                            <span className="text-sm font-bold text-secondary uppercase tracking-widest">{product.unit || 'ADET'}</span>
                        </div>
                        {isLowStock ? (
                            <span className="px-4 py-1.5 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-red-500/20">Kritik Seviye</span>
                        ) : (
                            <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">Stok Yeterli</span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="h-16 bg-blue-500 hover:bg-blue-600 rounded-3xl flex items-center justify-center gap-3 text-white transition-all active:scale-95 shadow-xl shadow-blue-500/20 group"
                    >
                        <Edit className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest">Kayıt Düzenle</span>
                    </button>
                    <button
                        onClick={onScanAgain}
                        className="h-16 glass hover:bg-white/10 rounded-3xl flex items-center justify-center gap-3 text-white transition-all active:scale-95 border-white/10 group"
                    >
                        <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                        <span className="text-xs font-black uppercase tracking-widest">Yeniden Tara</span>
                    </button>
                </div>
            </motion.div>

            {showEditModal && (
                <ProductEditModal
                    product={product}
                    onClose={() => setShowEditModal(false)}
                    onSaved={handleSaved}
                />
            )}
        </>
    );
}

