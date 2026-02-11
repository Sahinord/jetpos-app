"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Save, Loader, Package, Plus, Minus, Pencil, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface ProductEditModalProps {
    product: any;
    onClose: () => void;
    onSaved: () => Promise<void> | void;
}

interface Category {
    id: string;
    name: string;
}

export default function ProductEditModal({ product, onClose, onSaved }: ProductEditModalProps) {
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [addAmount, setAddAmount] = useState<string>('');
    const [removeAmount, setRemoveAmount] = useState<string>('');
    const [editingInfo, setEditingInfo] = useState(false);
    const [productName, setProductName] = useState(product.name || '');
    const [productBarcode, setProductBarcode] = useState(product.barcode || '');
    const [formData, setFormData] = useState({
        stock_quantity: product.stock_quantity || 0,
        sale_price: product.sale_price || 0,
        purchase_price: product.purchase_price || 0,
        category_id: product.category_id || '',
        status: product.status || 'active',
    });

    // Calculate the final stock based on +/- inputs (live preview)
    const addNum = Number(addAmount) || 0;
    const removeNum = Number(removeAmount) || 0;
    const previewStock = formData.stock_quantity + addNum - removeNum;

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

            const finalStock = previewStock < 0 ? 0 : previewStock;

            const updateData: any = {
                stock_quantity: finalStock,
                sale_price: Number(formData.sale_price) || 0,
                purchase_price: Number(formData.purchase_price) || 0,
                category_id: formData.category_id || null,
                status: formData.status,
                updated_at: new Date().toISOString(),
            };

            // Include name/barcode if changed
            if (productName.trim() && productName !== product.name) {
                updateData.name = productName.trim();
            }
            if (productBarcode.trim() && productBarcode !== product.barcode) {
                updateData.barcode = productBarcode.trim();
            }

            const { data, error } = await supabase
                .from('products')
                .update(updateData)
                .eq('id', product.id)
                .select();

            if (error) throw new Error(error.message || 'Bilinmeyen hata');
            if (!data || data.length === 0) throw new Error('Ürün güncellenemedi');

            // Log changes to product_change_logs
            try {
                const changeLogs: any[] = [];
                const baseLog = {
                    product_id: product.id,
                    product_name: productName.trim() || product.name,
                    product_barcode: productBarcode.trim() || product.barcode,
                    change_source: 'mobile',
                    changed_by: 'admin',
                    tenant_id: tenantId,
                };

                if (finalStock !== product.stock_quantity) {
                    changeLogs.push({ ...baseLog, change_type: 'stock', field_name: 'stock_quantity', old_value: String(product.stock_quantity), new_value: String(finalStock) });
                }
                if (productName.trim() && productName.trim() !== product.name) {
                    changeLogs.push({ ...baseLog, change_type: 'name', field_name: 'name', old_value: product.name, new_value: productName.trim() });
                }
                if (productBarcode.trim() && productBarcode.trim() !== product.barcode) {
                    changeLogs.push({ ...baseLog, change_type: 'barcode', field_name: 'barcode', old_value: product.barcode, new_value: productBarcode.trim() });
                }
                if (Number(formData.sale_price) !== product.sale_price) {
                    changeLogs.push({ ...baseLog, change_type: 'price', field_name: 'sale_price', old_value: String(product.sale_price), new_value: String(formData.sale_price) });
                }
                if (Number(formData.purchase_price) !== product.purchase_price) {
                    changeLogs.push({ ...baseLog, change_type: 'price', field_name: 'purchase_price', old_value: String(product.purchase_price), new_value: String(formData.purchase_price) });
                }
                if (formData.status !== product.status) {
                    changeLogs.push({ ...baseLog, change_type: 'status', field_name: 'status', old_value: product.status, new_value: formData.status });
                }

                if (changeLogs.length > 0) {
                    await supabase.from('product_change_logs').insert(changeLogs);
                }
            } catch (logError) {
                console.warn('Log kaydetme hatası (göz ardı edildi):', logError);
            }

            toast.success('Ürün güncellendi!', { id: 'product-update' });
            await onSaved();
        } catch (error: any) {
            console.error('Update Error:', error);
            toast.error(error?.message || 'Güncelleme başarısız!', { id: 'product-update' });
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAdd = () => {
        const amount = Number(addAmount) || 1; // Default 1 if empty
        setFormData({ ...formData, stock_quantity: formData.stock_quantity + amount });
        setAddAmount('');
    };

    const handleQuickRemove = () => {
        const amount = Number(removeAmount) || 1; // Default 1 if empty
        const newStock = formData.stock_quantity - amount;
        setFormData({ ...formData, stock_quantity: newStock < 0 ? 0 : newStock });
        setRemoveAmount('');
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
<<<<<<< HEAD
                    className="relative w-full max-w-lg glass-dark border-t border-white/10 rounded-t-[1.5rem] shadow-3xl overflow-hidden flex flex-col"
                    style={{ maxHeight: '90vh' }}
=======
                    className="relative w-full max-w-lg glass-dark border-t border-white/10 rounded-t-[3rem] shadow-3xl flex flex-col overflow-hidden"
                    style={{ maxHeight: '80vh', paddingBottom: 'env(safe-area-inset-bottom)' }}
>>>>>>> defbedb51ff1ca68df1120905dac238cf8406634
                >
                    {/* Glow Effect */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

                    {/* Drag Handle */}
                    <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                        <div className="w-10 h-1 rounded-full bg-white/20" />
                    </div>

                    {/* Scrollable Content */}
<<<<<<< HEAD
                    <div className="overflow-y-auto flex-1 px-4 pb-4 pt-2">
=======
                    <div className="overflow-y-auto flex-1 px-6 pt-4 pb-4">
>>>>>>> defbedb51ff1ca68df1120905dac238cf8406634
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-white tracking-tight">Kayıt Düzenle</h2>
                                <p className="text-[9px] font-bold text-secondary uppercase tracking-[2px] mt-0.5">Stok & Fiyat Yönetimi</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-9 h-9 glass rounded-xl flex items-center justify-center text-secondary hover:text-white transition-colors active:scale-90"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Product Summary */}
                        <div className="glass p-3 rounded-xl border-white/5 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 glass-dark rounded-lg flex items-center justify-center shrink-0">
                                    <Package className="w-5 h-5 text-blue-400" />
                                </div>
                                <div className="overflow-hidden flex-1 min-w-0">
                                    {!editingInfo ? (
                                        <>
                                            <h3 className="text-white font-bold text-sm truncate">{productName}</h3>
                                            <p className="text-[9px] font-mono text-secondary">{productBarcode}</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-white font-bold text-sm truncate">Düzenleniyor...</p>
                                            <p className="text-[9px] font-mono text-blue-400">İsim & Barkod</p>
                                        </>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEditingInfo(!editingInfo)}
                                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all active:scale-90 touch-manipulation ${editingInfo
                                        ? 'bg-blue-500 text-white'
                                        : 'glass-dark text-secondary hover:text-white'
                                        }`}
                                >
                                    {editingInfo ? <Check className="w-4 h-4" /> : <Pencil className="w-3.5 h-3.5" />}
                                </button>
                            </div>

                            {/* Inline Edit Fields */}
                            {editingInfo && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-3 pt-3 border-t border-white/5 space-y-2"
                                >
                                    <div>
                                        <label className="text-[8px] font-bold text-secondary uppercase tracking-widest ml-1">Ürün Adı</label>
                                        <input
                                            type="text"
                                            value={productName}
                                            onChange={(e) => setProductName(e.target.value)}
                                            className="w-full h-10 glass-dark border-white/10 rounded-lg px-3 text-white outline-none focus:border-blue-500/50 transition-all font-semibold text-sm mt-1"
                                            placeholder="Ürün adı..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[8px] font-bold text-secondary uppercase tracking-widest ml-1">Barkod</label>
                                        <input
                                            type="text"
                                            value={productBarcode}
                                            onChange={(e) => setProductBarcode(e.target.value)}
                                            className="w-full h-10 glass-dark border-white/10 rounded-lg px-3 text-white outline-none focus:border-blue-500/50 transition-all font-mono text-sm mt-1"
                                            placeholder="Barkod numarası..."
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </div>

<<<<<<< HEAD
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Category Selector */}
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-secondary uppercase tracking-widest ml-1">Kategori</label>
=======
                        <form id="edit-product-form" onSubmit={handleSubmit} className="space-y-5">
                            {/* Kategori Selector */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-1">
                                    Kategori {categories.length > 0 && <span className="text-blue-400">({categories.length})</span>}
                                </label>
>>>>>>> defbedb51ff1ca68df1120905dac238cf8406634
                                <div className="relative">
                                    <select
                                        value={formData.category_id}
                                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                        className="w-full h-11 glass-dark border-white/10 rounded-xl px-4 text-white appearance-none outline-none focus:border-blue-500/50 transition-all font-semibold text-sm"
                                    >
                                        <option value="" className="bg-slate-900">Kategori Yok</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id} className="bg-slate-900">
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">
                                        <X className="w-3 h-3 rotate-45" />
                                    </div>
                                </div>
                            </div>

                            {/* Stock Section */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-secondary uppercase tracking-widest ml-1">Stok Yönetimi</label>

                                {/* Current Stock Display */}
                                <div className="glass p-3 rounded-xl border-white/5">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[9px] font-bold text-secondary uppercase tracking-wider">Mevcut Stok</span>
                                        <span className="text-white font-mono font-bold text-base">{formData.stock_quantity}</span>
                                    </div>

                                    {/* Quick +/- Buttons */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {/* ADD Box */}
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                placeholder="0"
                                                value={addAmount}
                                                onChange={(e) => setAddAmount(e.target.value)}
                                                className="flex-1 min-w-0 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 text-emerald-400 outline-none focus:border-emerald-500/40 transition-all font-mono font-bold text-sm placeholder:text-emerald-500/30"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleQuickAdd}
                                                className="shrink-0 flex items-center gap-1 bg-emerald-500/20 hover:bg-emerald-500/30 active:scale-95 h-10 px-3 rounded-lg transition-all touch-manipulation"
                                            >
                                                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                                                <span className="text-[8px] font-bold text-emerald-400/80 uppercase">Ekle</span>
                                            </button>
                                        </div>

                                        {/* REMOVE Box */}
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                placeholder="0"
                                                value={removeAmount}
                                                onChange={(e) => setRemoveAmount(e.target.value)}
                                                className="flex-1 min-w-0 h-10 bg-red-500/10 border border-red-500/20 rounded-lg px-3 text-red-400 outline-none focus:border-red-500/40 transition-all font-mono font-bold text-sm placeholder:text-red-500/30"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleQuickRemove}
                                                className="shrink-0 flex items-center gap-1 bg-red-500/20 hover:bg-red-500/30 active:scale-95 h-10 px-3 rounded-lg transition-all touch-manipulation"
                                            >
                                                <Minus className="w-3.5 h-3.5 text-red-400" />
                                                <span className="text-[8px] font-bold text-red-400/80 uppercase">Çıkar</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Preview: New Stock */}
                                    {(addNum > 0 || removeNum > 0) && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="mt-3 pt-3 border-t border-white/5"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">Yeni Stok</span>
                                                <div className="flex items-center gap-2">
                                                    {addNum > 0 && (
                                                        <span className="text-[9px] font-mono text-emerald-400">+{addNum}</span>
                                                    )}
                                                    {removeNum > 0 && (
                                                        <span className="text-[9px] font-mono text-red-400">-{removeNum}</span>
                                                    )}
                                                    <span className="text-white font-mono font-bold text-base">
                                                        → {previewStock < 0 ? 0 : previewStock}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {/* Status */}
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-secondary uppercase tracking-widest ml-1">Durum</label>
                                <div className="flex h-10 glass-dark border-white/10 rounded-xl p-1">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, status: 'active' })}
                                        className={`flex-1 rounded-lg font-bold text-[10px] uppercase tracking-tight transition-all ${formData.status === 'active' ? 'bg-emerald-500 text-white shadow-lg' : 'text-secondary'
                                            }`}
                                    >
                                        Aktif
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, status: 'inactive' })}
                                        className={`flex-1 rounded-lg font-bold text-[10px] uppercase tracking-tight transition-all ${formData.status === 'inactive' ? 'bg-red-500 text-white shadow-lg' : 'text-secondary'
                                            }`}
                                    >
                                        Pasif
                                    </button>
                                </div>
                            </div>

                            {/* Price Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-secondary uppercase tracking-widest ml-1">Alış Fiyatı</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            inputMode="decimal"
                                            value={formData.purchase_price}
                                            onChange={(e) => setFormData({ ...formData, purchase_price: Number(e.target.value) })}
                                            className="w-full h-11 glass-dark border-white/10 rounded-xl pl-8 pr-3 text-white outline-none focus:border-blue-500/50 transition-all font-mono font-bold text-sm"
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary font-bold text-[10px]">₺</span>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-blue-400 uppercase tracking-widest ml-1">Satış Fiyatı</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            inputMode="decimal"
                                            value={formData.sale_price}
                                            onChange={(e) => setFormData({ ...formData, sale_price: Number(e.target.value) })}
                                            className="w-full h-11 glass-dark border border-blue-500/20 rounded-xl pl-8 pr-3 text-white outline-none focus:border-blue-500/50 transition-all font-mono font-bold text-sm shadow-[0_0_10px_rgba(59,130,246,0.08)]"
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 font-bold text-[10px]">₺</span>
                                    </div>
                                </div>
                            </div>
<<<<<<< HEAD
                            {/* Save Button - inside scroll area */}
                            <div className="pt-4 pb-24">
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="w-full h-12 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-xl text-white font-bold text-xs uppercase tracking-[3px] shadow-xl shadow-blue-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 touch-manipulation"
                                >
                                    {loading ? (
                                        <Loader className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <span>Değişiklikleri Kaydet</span>
                                        </>
                                    )}
                                </button>
                            </div>
=======
>>>>>>> defbedb51ff1ca68df1120905dac238cf8406634
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
