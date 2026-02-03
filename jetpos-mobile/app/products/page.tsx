"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Search, Package } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import ProductEditModal from '@/components/ProductEditModal';

interface Product {
    id: string;
    name: string;
    barcode: string;
    stock_quantity: number;
    sale_price: number;
    purchase_price: number;
    status?: string;
    category_id?: string;
}

export default function ProductsPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();

        // Polling - Her 3 saniyede bir veriyi kontrol et
        const interval = setInterval(() => {
            console.log('🔄 Polling - veri güncelleniyor...');
            fetchProducts();
        }, 3000); // 3 saniye

        return () => {
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        if (searchTerm) {
            const filtered = products.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.barcode.includes(searchTerm)
            );
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts(products);
        }
    }, [searchTerm, products]);

    const fetchProducts = async () => {
        try {
            const tenantId = localStorage.getItem('tenantId');
            if (!tenantId) return;

            // RLS context set et
            await supabase.rpc('set_current_tenant', { tenant_id: tenantId });

            const { data, error } = await supabase
                .from('products')
                .select('id, name, barcode, stock_quantity, sale_price, purchase_price, status, category_id')
                .order('name', { ascending: true });

            if (data) {
                console.log('✅ Ürünler yüklendi:', data.length);
                setProducts(data);
                setFilteredProducts(data);
            }

            if (error) {
                console.error('❌ Ürün yükleme hatası:', error);
            }
        } catch (error) {
            console.error('Products fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-24">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 p-4">
                <h1 className="text-2xl font-black text-white mb-4">Ürünler</h1>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Ürün ara..."
                        className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Products List */}
            <div className="p-4 space-y-3">
                {loading ? (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <p className="text-gray-400 mt-2">Yükleniyor...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-8">
                        <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">Ürün bulunamadı</p>
                    </div>
                ) : (
                    filteredProducts.map((product) => (
                        <ProductItemCard
                            key={product.id}
                            product={product}
                            onUpdate={fetchProducts}
                        />
                    ))
                )}
            </div>

            <BottomNav />
        </div>
    );
}

// Product Item Card Component
function ProductItemCard({ product, onUpdate }: { product: Product; onUpdate: () => void }) {
    const [showEditModal, setShowEditModal] = useState(false);

    return (
        <>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-bold">{product.name}</h3>
                            {product.status === 'inactive' && (
                                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-bold rounded-full">
                                    Pasif
                                </span>
                            )}
                            {product.status === 'pending' && (
                                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full">
                                    Beklemede
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 font-mono">{product.barcode}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${product.stock_quantity <= 10
                        ? 'bg-red-600/20 text-red-400'
                        : product.stock_quantity <= 50
                            ? 'bg-yellow-600/20 text-yellow-400'
                            : 'bg-green-600/20 text-green-400'
                        }`}>
                        {product.stock_quantity} adet
                    </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                    <div className="flex gap-4">
                        <div>
                            <p className="text-xs text-gray-400">Alış</p>
                            <p className="text-sm font-bold text-gray-300">
                                ₺{product.purchase_price?.toFixed(2)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Satış</p>
                            <p className="text-lg font-black text-blue-400">
                                ₺{product.sale_price?.toFixed(2)}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95"
                    >
                        Düzenle
                    </button>
                </div>
            </div>

            {showEditModal && (
                <ProductEditModal
                    product={product}
                    onClose={() => setShowEditModal(false)}
                    onSaved={() => {
                        setShowEditModal(false);
                        onUpdate();
                    }}
                />
            )}
        </>
    );
}
