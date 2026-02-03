"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Save, Loader } from 'lucide-react';
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
        status: product.status || 'active', // 'active', 'inactive', 'pending'
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const tenantId = localStorage.getItem('tenantId');
            if (tenantId) {
                await supabase.rpc('set_current_tenant', { tenant_id: tenantId });
            }

            const { data } = await supabase
                .from('categories')
                .select('id, name')
                .order('name');

            if (data) {
                setCategories(data);
            }
        } catch (error) {
            console.error('Categories fetch error:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const tenantId = localStorage.getItem('tenantId');
            console.log('🔑 Tenant ID:', tenantId);
            console.log('📦 Product ID:', product.id);

            if (!tenantId) {
                throw new Error('Tenant ID bulunamadı!');
            }

            if (!product.id) {
                throw new Error('Product ID bulunamadı!');
            }

            // RLS context set et
            const { error: rpcError } = await supabase.rpc('set_current_tenant', { tenant_id: tenantId });
            if (rpcError) {
                console.error('❌ RPC Error:', rpcError);
                throw new Error('Tenant ayarlanamadı: ' + rpcError.message);
            }

            const updateData = {
                stock_quantity: Number(formData.stock_quantity) || 0,
                sale_price: Number(formData.sale_price) || 0,
                purchase_price: Number(formData.purchase_price) || 0,
                category_id: formData.category_id || null,
                status: formData.status,
                updated_at: new Date().toISOString(),
            };

            console.log('📤 Güncelleniyor:', updateData);

            const { data, error, status } = await supabase
                .from('products')
                .update(updateData)
                .eq('id', product.id)
                .select();

            console.log('📊 Response Status:', status);
            console.log('📊 Response Data:', data);
            console.log('📊 Response Error:', error);

            if (error) {
                console.error('❌ Update error:', error);
                throw new Error(error.message || 'Bilinmeyen hata');
            }

            if (!data || data.length === 0) {
                throw new Error('Ürün güncellenemedi - veri döndürülmedi');
            }

            console.log('✅ Ürün başarıyla güncellendi!');
            toast.success('Ürün güncellendi!');
            onSaved();
            onClose();
        } catch (error: any) {
            console.error('❌ CATCH Error:', error);
            toast.error(error?.message || 'Güncelleme başarısız!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 w-full max-w-md border border-white/10 my-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-white">Ürün Düzenle</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-white/5 transition-all"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Product Info */}
                <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <h3 className="text-white font-bold mb-1">{product.name}</h3>
                    <p className="text-xs text-gray-400 font-mono">{product.barcode}</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Kategori */}
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-2">
                            Kategori
                        </label>
                        <select
                            value={formData.category_id}
                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="" className="bg-slate-800">Kategori Seçin</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id} className="bg-slate-800">
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Stok */}
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-2">
                            Stok Miktarı
                        </label>
                        <input
                            type="number"
                            value={formData.stock_quantity || 0}
                            onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                setFormData({ ...formData, stock_quantity: val });
                            }}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="0"
                        />
                    </div>

                    {/* Alış Fiyatı */}
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-2">
                            Alış Fiyatı (₺)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.purchase_price || 0}
                            onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                setFormData({ ...formData, purchase_price: val });
                            }}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="0"
                        />
                    </div>

                    {/* Satış Fiyatı */}
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-2">
                            Satış Fiyatı (₺)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.sale_price || 0}
                            onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                setFormData({ ...formData, sale_price: val });
                            }}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="0"
                        />
                    </div>

                    {/* Ürün Durumu */}
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-2">
                            Ürün Durumu (Tıkla Değiştir)
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, status: 'active' })}
                                className={`py-3 rounded-xl font-bold transition-all ${formData.status === 'active'
                                        ? 'bg-green-600 text-white scale-105'
                                        : 'bg-white/5 text-gray-400 border border-white/10'
                                    }`}
                            >
                                AKTİF
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, status: 'pending' })}
                                className={`py-3 rounded-xl font-bold transition-all ${formData.status === 'pending'
                                        ? 'bg-yellow-600 text-white scale-105'
                                        : 'bg-white/5 text-gray-400 border border-white/10'
                                    }`}
                            >
                                BEKLEMEDE
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, status: 'inactive' })}
                                className={`py-3 rounded-xl font-bold transition-all ${formData.status === 'inactive'
                                        ? 'bg-red-600 text-white scale-105'
                                        : 'bg-white/5 text-gray-400 border border-white/10'
                                    }`}
                            >
                                PASİF
                            </button>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="grid grid-cols-2 gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-all"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    Kaydediliyor...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Kaydet
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
