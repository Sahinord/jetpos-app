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

        const interval = setInterval(() => {
            fetchLowStockProducts();
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const fetchLowStockProducts = async () => {
        try {
            const tenantId = localStorage.getItem('tenantId');
            if (!tenantId) return;

            await supabase.rpc('set_current_tenant', { tenant_id: tenantId });

            const { data } = await supabase
                .from('products')
                .select('id, name, barcode, stock_quantity, sale_price, critical_stock_level')
                .eq('tenant_id', tenantId)
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
        if (quantity === 0) return { label: 'TÜKENDİ', color: 'rose', glow: 'rgba(244, 63, 94, 0.5)' };
        if (quantity <= 5) return { label: 'KRİTİK', color: 'orange', glow: 'rgba(245, 158, 11, 0.5)' };
        return { label: 'DÜŞÜK', color: 'amber', glow: 'rgba(217, 119, 6, 0.5)' };
    };

    return (
        <div className="relative min-h-screen bg-background overflow-x-hidden pb-40">
            {/* Ambient Lights */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-5%] left-[-10%] w-[50%] h-[30%] bg-rose-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-5%] right-[-10%] w-[50%] h-[30%] bg-orange-500/10 rounded-full blur-[100px]" />
            </div>

            {/* Premium Header */}
            <div
                className="sticky top-0 z-50 glass border-b border-white/5 p-6 backdrop-blur-2xl"
            >
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                            <p className="text-[10px] font-black text-secondary uppercase tracking-[4px]">Stok Uyarıları</p>
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight leading-none">Eksik Ürünler</h1>
                    </div>
                    <div className="w-12 h-12 rounded-2xl glass-dark border border-white/10 flex items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-rose-500/10 group-hover:bg-rose-500/20 transition-colors" />
                        <AlertTriangle className="w-6 h-6 text-rose-500 relative z-10" />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-6 relative z-10">
                {loading ? (
                    <div
                        className="flex flex-col items-center justify-center py-20 space-y-4"
                    >
                        <div className="w-12 h-12 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
                        <p className="text-[10px] font-black text-secondary uppercase tracking-[3px]">Veriler Alınıyor...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div
                        className="glass-dark border border-white/10 rounded-[2.5rem] p-12 text-center space-y-6"
                    >
                        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 mb-2">
                            <Package className="w-10 h-10 text-emerald-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-white tracking-tight">Harika Haber!</h3>
                            <p className="text-sm text-secondary font-medium">Tüm ürünlerin stoğu şu an güvenli seviyede görünüyor.</p>
                        </div>
                    </div>
                ) : (
                    <div
                        className="space-y-4"
                    >
                        <p className="text-[10px] font-black text-secondary uppercase tracking-[3px] ml-2 mb-6">
                            Toplam {products.length} Kritik Kayıt
                        </p>

                        {products.map((product: Product) => {
                            const status = getStockStatus(product.stock_quantity);
                            return (
                                <div
                                    key={product.id}
                                    className="relative overflow-hidden glass-dark border border-white/10 rounded-[2rem] p-5 group active:scale-[0.98] transition-transform"
                                >
                                    {/* Status Glow Overlay */}
                                    <div className={`absolute top-0 right-0 w-32 h-32 bg-${status.color}-500/5 rounded-full blur-3xl -mr-16 -mt-16`} />

                                    <div className="flex items-start justify-between mb-6">
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-black text-white leading-tight tracking-tight uppercase group-hover:text-rose-400 transition-colors">
                                                {product.name}
                                            </h3>
                                            <p className="text-[10px] font-mono text-secondary tracking-widest">{product.barcode}</p>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-full bg-${status.color}-500/10 border border-${status.color}-500/20 shadow-lg shadow-${status.color}-500/5`}>
                                            <span className={`text-[9px] font-black text-${status.color}-500 tracking-[2px]`}>{status.label}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="glass p-4 rounded-2xl border-white/5">
                                            <p className="text-[10px] font-black text-secondary uppercase tracking-[2px] mb-1">Mevcut Stok</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-black text-white tabular-nums">{product.stock_quantity}</span>
                                                <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Adet</span>
                                            </div>
                                        </div>
                                        <div className="glass p-4 rounded-2xl border-white/5">
                                            <p className="text-[10px] font-black text-secondary uppercase tracking-[2px] mb-1">Satış Fiyatı</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-xs font-bold text-blue-500/50">₺</span>
                                                <span className="text-2xl font-black text-white tabular-nums">{product.sale_price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button className="w-full mt-4 h-14 bg-blue-500 hover:bg-blue-600 rounded-2xl text-white font-black text-[10px] uppercase tracking-[3px] shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 group-hover:bg-blue-600">
                                        <span>Hızlı Sipariş Ver</span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <BottomNav />
        </div >
    );
}
