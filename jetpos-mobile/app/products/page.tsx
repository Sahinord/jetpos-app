"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
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
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(20);
    const observerTarget = useRef(null);

    useEffect(() => {
        fetchProducts();

        // Polling'i 30 saniyeye çıkarıyoruz (Optimizasyon)
        const interval = setInterval(() => {
            fetchProducts();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const filteredProducts = useMemo(() => {
        let result = products;
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(lower) ||
                p.barcode?.includes(lower)
            );
        }
        return result;
    }, [products, searchTerm]);

    const displayedProducts = useMemo(() => {
        return filteredProducts.slice(0, visibleCount);
    }, [filteredProducts, visibleCount]);

    // Infinite Scroll Logic
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && visibleCount < filteredProducts.length) {
                    setVisibleCount(prev => prev + 20);
                }
            },
            { threshold: 1.0 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [visibleCount, filteredProducts.length]);

    const fetchProducts = async () => {
        try {
            const tenantId = localStorage.getItem('tenantId');
            if (!tenantId) return;

            // RLS context set et
            await supabase.rpc('set_current_tenant', { tenant_id: tenantId });

            let allProducts: Product[] = [];
            let page = 0;
            const PAGE_SIZE = 1000;
            let hasMore = true;

            while (hasMore) {
                const { data, error } = await supabase
                    .from('products')
                    .select('id, name, barcode, stock_quantity, sale_price, purchase_price, status, category_id')
                    .eq('status', 'active')
                    .order('name', { ascending: true })
                    .order('id', { ascending: true }) // Stable sorting for reliable pagination
                    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

                if (error) {
                    console.warn('❌ Ürün çekme batch hatası:', error);
                    hasMore = false;
                    break;
                }

                if (data && data.length > 0) {
                    allProducts = [...allProducts, ...data];
                    setProducts([...allProducts]); // Update UI progressively
                    console.log(`📦 Ürünler Yükleniyor: ${allProducts.length} adet çekildi...`);

                    if (data.length < PAGE_SIZE) {
                        hasMore = false;
                    }
                } else {
                    hasMore = false;
                }
                page++;

                if (page === 1) setLoading(false);
            }
            console.log(`✅ Toplam ${allProducts.length} ürün başarıyla yüklendi.`);
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
            <div className="p-4 space-y-4">
                {loading && products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
                        <p className="text-secondary font-bold animate-pulse uppercase tracking-widest text-xs">Ürünler Hazırlanıyor...</p>
                    </div>
                ) : displayedProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-40">
                        <Package className="w-20 h-20 text-secondary mb-4" />
                        <p className="text-secondary font-black uppercase tracking-widest text-xs">Sonuç Bulunamadı</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-4">
                            {displayedProducts.map((product) => (
                                <ProductItemCard
                                    key={product.id}
                                    product={product}
                                    onUpdate={fetchProducts}
                                />
                            ))}
                        </div>

                        {/* Scroll Trigger */}
                        {visibleCount < filteredProducts.length && (
                            <div ref={observerTarget} className="h-20 flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                            </div>
                        )}

                        <div className="text-center py-6 opacity-30">
                            <p className="text-[10px] font-black uppercase tracking-[3px]">
                                {filteredProducts.length} Ürün Listelendi
                            </p>
                        </div>
                    </>
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
            <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] p-5 border border-white/5 shadow-2xl relative overflow-hidden group active:scale-[0.98] transition-all">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors" />

                <div className="flex items-start justify-between relative z-10">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <h3 className="text-white font-black text-lg leading-tight truncate">{product.name}</h3>
                            <div className="flex gap-1">
                                {product.status === 'inactive' && (
                                    <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 text-[9px] font-black rounded-lg border border-rose-500/20 tracking-tighter uppercase">
                                        Pasif
                                    </span>
                                )}
                                {(product.stock_quantity || 0) < 5 && (
                                    <span className="px-2 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-lg shadow-lg shadow-rose-500/20 animate-pulse tracking-tighter uppercase">
                                        Kritik Stok
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="bg-white/5 px-2 py-0.5 rounded text-[10px] font-mono text-secondary border border-white/5">
                                {product.barcode}
                            </span>
                        </div>
                    </div>

                    <div className={`shrink-0 ml-4 px-3 py-1.5 rounded-2xl flex flex-col items-end justify-center border ${(product.stock_quantity || 0) < 10
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        : (product.stock_quantity || 0) < 50
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        }`}>
                        <span className="text-base font-black leading-none">{product.stock_quantity}</span>
                        <span className="text-[9px] font-bold uppercase opacity-60 tracking-wider">Adet</span>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-5 pt-5 border-t border-white/5 relative z-10">
                    <div className="flex gap-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-secondary tracking-widest uppercase mb-1">Maliyet</span>
                            <span className="text-sm font-bold text-white/50">₺{product.purchase_price?.toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-blue-400/60 tracking-widest uppercase mb-1">Satış Fiyatı</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-white leading-none">₺{product.sale_price?.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowEditModal(true)}
                        className="w-12 h-12 bg-white/5 hover:bg-blue-600 text-white rounded-2xl flex items-center justify-center border border-white/10 hover:border-blue-500 transition-all active:scale-90 shadow-xl"
                    >
                        <Search className="w-5 h-5 opacity-60" />
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
