"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, Package } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

interface Product {
    id: string;
    name: string;
    barcode: string;
    stock_quantity: number;
    sale_price: number;
    critical_stock_level: number;
}

export default function LowStockPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLowStockProducts();

        // Polling - Her 5 saniyede bir güncelle
        const interval = setInterval(() => {
            console.log('🔄 Low stock güncelleniyor...');
            fetchLowStockProducts();
        }, 5000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    const fetchLowStockProducts = async () => {
        try {
            const tenantId = localStorage.getItem('tenantId');
            if (!tenantId) return;

            // RLS context set et
            await supabase.rpc('set_current_tenant', { tenant_id: tenantId });

            const { data, error } = await supabase
                .from('products')
                .select('id, name, barcode, stock_quantity, sale_price, critical_stock_level')
                .lte('stock_quantity', 10)
                .order('stock_quantity', { ascending: true });

            if (data) {
                setProducts(data);
            }
        } catch (error) {
            console.error('Low stock fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStockStatus = (quantity: number) => {
        if (quantity === 0) return { label: 'Tükendi', color: 'bg-red-600' };
        if (quantity <= 5) return { label: 'Kritik', color: 'bg-orange-600' };
        return { label: 'Düşük', color: 'bg-yellow-600' };
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-24">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6 pb-8">
                <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="w-8 h-8 text-white" />
                    <h1 className="text-2xl font-black text-white">Eksik Stok</h1>
                </div>
                <p className="text-white/80 text-sm">
                    {loading ? '...' : `${products.length} ürünün stoğu düşük`}
                </p>
            </div>

            {/* Products List */}
            <div className="p-4 -mt-4 space-y-3">
                {loading ? (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                        <p className="text-gray-400 mt-2">Yükleniyor...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 text-center">
                        <Package className="w-16 h-16 text-green-600 mx-auto mb-4" />
                        <h3 className="text-white font-bold text-lg mb-2">Harika!</h3>
                        <p className="text-gray-400">Tüm ürünlerin stoğu yeterli seviyede</p>
                    </div>
                ) : (
                    products.map((product) => {
                        const status = getStockStatus(product.stock_quantity);
                        return (
                            <div
                                key={product.id}
                                className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border-l-4 border-red-600"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="text-white font-bold mb-1">{product.name}</h3>
                                        <p className="text-xs text-gray-400 font-mono">{product.barcode}</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full ${status.color}`}>
                                        <span className="text-white text-xs font-bold">{status.label}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Mevcut Stok</p>
                                        <p className="text-2xl font-black text-white">
                                            {product.stock_quantity}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400 mb-1">Satış Fiyatı</p>
                                        <p className="text-lg font-bold text-blue-400">
                                            ₺{product.sale_price.toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                <button className="w-full mt-3 py-2 bg-blue-600 text-white font-bold rounded-xl text-sm">
                                    Sipariş Ver
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            <BottomNav />
        </div>
    );
}
