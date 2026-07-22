"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, setCurrentTenant } from '@/lib/supabase';
import { Search, Package, MoreVertical, Edit3, ArrowUpRight, Store } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import ProductEditModal from '@/components/ProductEditModal';
import RequirePermission from '@/components/RequirePermission';

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

function ProductsPageInner() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(20);
    const observerTarget = useRef(null);
    const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        fetchProducts();

        const tenantId = localStorage.getItem('tenantId');
        if (!tenantId) return;

        const channel = supabase
            .channel(`products_page_${tenantId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'products',
                filter: `tenant_id=eq.${tenantId}`
            }, () => {
                // 20k üründe her değişimde full-refetch ağır → debounce'la (sel önlenir)
                if (refetchTimer.current) clearTimeout(refetchTimer.current);
                refetchTimer.current = setTimeout(() => fetchProducts(), 1500);
            })
            .subscribe();

        return () => {
            if (refetchTimer.current) clearTimeout(refetchTimer.current);
            supabase.removeChannel(channel);
        };
    }, []);

    // Aramayı debounce et (her tuşta 20k filtreleme yerine) + arama değişince başa sar
    useEffect(() => {
        const t = setTimeout(() => setSearchTerm(searchInput.trim()), 200);
        return () => clearTimeout(t);
    }, [searchInput]);
    useEffect(() => { setVisibleCount(20); }, [searchTerm]);

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
            if (!tenantId) { setLoading(false); return; }

            await setCurrentTenant(tenantId);

            const PAGE_SIZE = 1000;
            const MAX_PRODUCTS = 20000; // en fazla 20k ürün
            const cols = 'id, name, barcode, stock_quantity, sale_price, purchase_price, status, category_id';
            const all: Product[] = [];
            let firstErr: string | null = null;

            for (let page = 0; page * PAGE_SIZE < MAX_PRODUCTS; page++) {
                const from = page * PAGE_SIZE;
                const to = from + PAGE_SIZE - 1;

                let out: { data: any[] | null; error: { message: string } | null };
                out = await supabase.from('products')
                    .select(cols).eq('tenant_id', tenantId)
                    .order('name', { ascending: true }).range(from, to);
                // Sıralı sorgu hata verirse (ör. büyük tabloda statement timeout) sırasız tekrar dene
                if (out.error) {
                    out = await supabase.from('products')
                        .select(cols).eq('tenant_id', tenantId).range(from, to);
                }
                if (out.error) { firstErr = out.error.message; break; }

                const rows = out.data || [];
                if (rows.length === 0) break;

                for (const p of rows) {
                    all.push({
                        ...p,
                        sale_price: Number(p.sale_price) || 0,          // string gelirse toFixed patlamasın
                        purchase_price: Number(p.purchase_price) || 0,
                        stock_quantity: Number(p.stock_quantity) || 0,
                    });
                }
                setProducts(all.slice()); // progressive: her sayfa geldikçe göster
                setLoading(false);
                if (rows.length < PAGE_SIZE) break;
            }

            setError(all.length === 0 && firstErr ? firstErr : null);
        } catch (e: any) {
            console.error('Products fetch error:', e);
            setError(e?.message || 'Ürünler yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-32 overflow-x-hidden container-safe">
            {/* Background Glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-5%] left-[-10%] w-[70%] h-[40%] bg-[#2563FF]/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[40%] bg-[#6FD3FF]/5 rounded-full blur-[100px]" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 glass border-b border-[#2D6BFF]/10 p-4 sm:p-6 pt-[env(safe-area-inset-top,1rem)] flex flex-col gap-5">
                <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none uppercase truncate">ÜRÜNLER</h1>
                        <p className="text-[9px] sm:text-[10px] font-black text-[#5B8CFF] tracking-[3px] uppercase mt-1.5 opacity-80 truncate">Envanter Yönetimi</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl sm:rounded-2xl glass-dark border border-[#2D6BFF]/20 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,255,0.1)] text-[#6FD3FF]">
                        <Package size={20} />
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#5B8CFF] pointer-events-none group-focus-within:text-[#6FD3FF] transition-colors">
                        <Search size={16} />
                    </div>
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Ürün adı veya barkod..."
                        className="w-full h-12 sm:h-14 glass-dark border border-[#2D6BFF]/20 rounded-[1rem] sm:rounded-[1.25rem] pl-11 pr-4 text-xs sm:text-sm font-black text-white placeholder-slate-600 outline-none focus:border-[#2563FF]/50 focus:ring-4 focus:ring-[#2563FF]/5 transition-all shadow-inner"
                    />
                </div>
            </header>

            {/* Products List Content */}
            <div className="p-4 sm:p-6 relative z-10">
                {error && (
                    <div className="mb-4 px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-bold">
                        Ürünler yüklenemedi: {error}
                    </div>
                )}
                {loading && products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 border-3 border-[#2563FF]/10 border-t-[#2563FF] rounded-full animate-spin" />
                        </div>
                        <p className="text-[9px] font-black text-[#5B8CFF] animate-pulse uppercase tracking-[5px]">YÜKLENİYOR</p>
                    </div>
                ) : displayedProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 opacity-30 gap-4">
                        <Package size={48} className="text-slate-600" />
                        <p className="text-[9px] font-black uppercase tracking-[4px]">Sonuç Yok</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2 mb-2">
                            <span className="text-[9px] font-black text-[#5B8CFF] uppercase tracking-[3px] truncate">{filteredProducts.length} ÜRÜN</span>
                            <div className="h-px flex-1 mx-4 bg-gradient-to-r from-[#2D6BFF]/20 to-transparent" />
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                            {displayedProducts.map((product) => (
                                <ProductItemCard
                                    key={product.id}
                                    product={product}
                                    onUpdate={fetchProducts}
                                />
                            ))}
                        </div>

                        {/* Infinite Scroll Trigger */}
                        {visibleCount < filteredProducts.length && (
                            <div ref={observerTarget} className="h-20 flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-[#2563FF]/10 border-t-[#2563FF] rounded-full animate-spin" />
                            </div>
                        )}
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}

function ProductItemCard({ product, onUpdate }: { product: Product; onUpdate: () => void }) {
    const [showEditModal, setShowEditModal] = useState(false);

    return (
        <>
            <div 
                onClick={() => setShowEditModal(true)}
                className="glass-dark border border-[#2D6BFF]/10 rounded-[1.75rem] sm:rounded-[2.5rem] p-4 sm:p-6 relative overflow-hidden group active:scale-[0.97] transition-all shadow-xl hover:border-[#2D6BFF]/30"
            >
                {/* Accent Highlight */}
                <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-[#2563FF]/5 rounded-full blur-3xl -mr-12 -mt-12 group-active:bg-[#2563FF]/10 transition-colors" />
                
                <div className="flex items-start justify-between gap-3 relative z-10">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <h3 className="text-base sm:text-lg font-black text-white leading-tight tracking-tight truncate group-active:text-[#6FD3FF] transition-colors">
                                {product.name?.trim() || product.barcode || 'İsimsiz Ürün'}
                            </h3>
                            {product.status === 'inactive' && (
                                <div className="px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-lg shrink-0">
                                    <span className="text-[7px] font-black text-rose-400 uppercase tracking-tighter leading-none">PASİF</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-[#2563FF]/5 border border-[#2D6BFF]/10 rounded-lg">
                                <span className="text-[8px] font-black text-[#5B8CFF] uppercase tracking-widest leading-none truncate">
                                    {product.barcode || '---'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className={`shrink-0 flex flex-col items-center justify-center w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-[1.25rem] border shadow-lg ${
                        (product.stock_quantity || 0) <= 5
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse'
                            : 'bg-[#2563FF]/10 border-[#2D6BFF]/20 text-[#6FD3FF]'
                    }`}>
                        <span className="text-base sm:text-lg font-black leading-none tracking-tighter">{product.stock_quantity}</span>
                        <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-tighter mt-0.5 opacity-60">STOK</span>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-[#2D6BFF]/10 relative z-10">
                    <div className="flex gap-4 sm:gap-8 min-w-0">
                        <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">MALİYET</span>
                            <span className="text-[12px] sm:text-sm font-bold text-slate-400 leading-none tracking-tight truncate">₺{product.purchase_price?.toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-[8px] sm:text-[9px] font-black text-[#5B8CFF] uppercase tracking-widest leading-none">SATIŞ</span>
                            <span className="text-[16px] sm:text-xl font-black text-white leading-none tracking-tighter truncate">₺{product.sale_price?.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 glass border border-[#2D6BFF]/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-[#6FD3FF] shadow-inner">
                        <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
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

// Yetki koruması: çalışan girişi açıksa PIN + can_access_inventory zorunlu.
export default function ProductsPage() {
    return (
        <RequirePermission perm="can_access_inventory" title="Ürün Yönetimi">
            <ProductsPageInner />
        </RequirePermission>
    );
}
