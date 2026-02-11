"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Save, Loader, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface ProductEditModalProps {
    product: any;
    onClose: () => void;
    onSaved: () => void;
}

interface Category {
    id: string;
    name: string;
}

export default function ProductEditModal({ product, onClose, onSaved }: ProductEditModalProps) {
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [formData, setFormData] = useState({
        stock_quantity: product.stock_quantity || 0,
        sale_price: product.sale_price || 0,
        purchase_price: product.purchase_price || 0,
        category_id: product.category_id || '',
        status: product.status || 'active',
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const tenantId = localStorage.getItem('tenantId');
            if (!tenantId) return;

            await supabase.rpc('set_current_tenant', { tenant_id: tenantId });

            // RLS kuralları zaten tenant izolasyonu sağlıyor olmalı. 
            // Direkt çekmeyi dene, eğer boşsa tenant_id ile filtrele.
            const { data, error } = await supabase
                .from('categories')
                .select('id, name')
                .order('name');

            if (data && data.length > 0) {
                setCategories(data);
                // Mevcut ürünün kategorisini eşle
                if (product.category_id) {
                    setFormData(prev => ({ ...prev, category_id: product.category_id }));
                }
            } else if (error) {
                console.error('Kategoriler çekilemedi:', error.message);
            }
        } catch (error) {
            console.error('Kategori hatası:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const tenantId = localStorage.getItem('tenantId');
            if (!tenantId) throw new Error('Tenant ID bulunamadı!');
            if (!product.id) throw new Error('Product ID bulunamadı!');

            const { error: rpcError } = await supabase.rpc('set_current_tenant', { tenant_id: tenantId });
            if (rpcError) throw new Error('Tenant ayarlanamadı: ' + rpcError.message);

            const updateData = {
                stock_quantity: Number(formData.stock_quantity) || 0,
                sale_price: Number(formData.sale_price) || 0,
                purchase_price: Number(formData.purchase_price) || 0,
                category_id: formData.category_id || null,
                status: formData.status,
                updated_at: new Date().toISOString(),
            };

            const { data, error } = await supabase
                .from('products')
                .update(updateData)
                .eq('id', product.id)
                .select();

            if (error) throw new Error(error.message || 'Bilinmeyen hata');
            if (!data || data.length === 0) throw new Error('Ürün güncellenemedi');

            toast.success('Ürün güncellendi!', { id: 'product-update' });
            onSaved();
            onClose();
        } catch (error: any) {
            console.error('Update Error:', error);
            toast.error(error?.message || 'Güncelleme başarısız!', { id: 'product-update' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[999] flex items-end justify-center">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-background/60 backdrop-blur-md"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="relative w-full max-w-lg glass-dark border-t border-white/10 rounded-t-[3rem] shadow-3xl flex flex-col overflow-hidden"
                    style={{ maxHeight: '80vh', paddingBottom: 'env(safe-area-inset-bottom)' }}
                >
                    {/* Glow Effect */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

                    {/* Drag Handle */}
                    <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                        <div className="w-10 h-1 rounded-full bg-white/20" />
                    </div>

                    {/* Scrollable Content */}
                    <div className="overflow-y-auto flex-1 px-6 pt-4 pb-4">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight">Kayıt Düzenle</h2>
                                <p className="text-[10px] font-bold text-secondary uppercase tracking-[3px] mt-1">Stok & Fiyat Yönetimi</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-secondary hover:text-white transition-colors active:scale-90"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Product Summary */}
                        <div className="glass p-4 rounded-2xl border-white/5 mb-6 flex items-center gap-4">
                            <div className="w-12 h-12 glass-dark rounded-xl flex items-center justify-center shrink-0">
                                <Package className="w-6 h-6 text-blue-400" />
                            </div>
                            <div className="overflow-hidden">
                                <h3 className="text-white font-bold truncate">{product.name}</h3>
                                <p className="text-[10px] font-mono text-secondary">{product.barcode}</p>
                            </div>
                        </div>

                        <form id="edit-product-form" onSubmit={handleSubmit} className="space-y-5">
                            {/* Kategori Selector */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">
                                    Kategori {categories.length > 0 && <span className="text-blue-400">({categories.length})</span>}
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.category_id}
                                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                        className="w-full h-14 glass-dark border-white/10 rounded-2xl px-5 text-white appearance-none outline-none focus:border-blue-500/50 transition-all font-bold text-sm"
                                    >
                                        <option value="" className="bg-slate-900">Kategori Yok</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id} className="bg-slate-900">
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">
                                        <X className="w-4 h-4 rotate-45" />
                                    </div>
                                </div>
                            </div>

                            {/* Inventory & Status Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">Stok Miktarı</label>
                                    <input
                                        type="number"
                                        value={formData.stock_quantity}
                                        onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
                                        className="w-full h-14 glass-dark border-white/10 rounded-2xl px-5 text-white outline-none focus:border-blue-500/50 transition-all font-mono font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">Durum</label>
                                    <div className="flex h-14 glass-dark border-white/10 rounded-2xl p-1">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, status: formData.status === 'active' ? 'inactive' : 'active' })}
                                            className={`flex-1 rounded-xl font-black text-[10px] uppercase tracking-tighter transition-all ${formData.status === 'active' ? 'bg-emerald-500 text-white shadow-lg' : 'text-secondary'
                                                }`}
                                        >
                                            {formData.status === 'active' ? 'Aktif' : 'Pasif'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Price Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">Alış Fiyatı</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.purchase_price}
                                            onChange={(e) => setFormData({ ...formData, purchase_price: Number(e.target.value) })}
                                            className="w-full h-14 glass-dark border-white/10 rounded-2xl pl-10 pr-5 text-white outline-none focus:border-blue-500/50 transition-all font-mono font-bold"
                                        />
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-bold text-xs">₺</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">Satış Fiyatı</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.sale_price}
                                            onChange={(e) => setFormData({ ...formData, sale_price: Number(e.target.value) })}
                                            className="w-full h-14 glass-dark border border-blue-500/20 rounded-2xl pl-10 pr-5 text-white outline-none focus:border-blue-500/50 transition-all font-mono font-bold shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                                        />
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 font-bold text-xs">₺</span>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Submit Button Container */}
                    <div className="flex-shrink-0 px-6 pt-4 pb-12 border-t border-white/10 bg-[#0a0f1a]/95 backdrop-blur-xl relative z-10">
                        <button
                            type="submit"
                            form="edit-product-form"
                            disabled={loading}
                            className="w-full h-16 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-3xl text-white font-black text-xs uppercase tracking-[4px] shadow-2xl shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <Loader className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    <span>Değişiklikleri Kaydet</span>
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
