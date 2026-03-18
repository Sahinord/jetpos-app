"use client";

import { useState, useEffect } from 'react';
import { 
    Search, Filter, Edit2, Check, X, 
    TrendingUp, TrendingDown, Tag, Package, Store, Globe
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/lib/tenant-context';

interface WarehouseStockProps {
    warehouses: any[];
    isPriceSyncEnabled?: boolean;
}

export default function WarehouseStock({ warehouses, isPriceSyncEnabled = false }: WarehouseStockProps) {
    const { currentTenant, activeWarehouse } = useTenant();
    const [selectedWarehouse, setSelectedWarehouse] = useState<string>(activeWarehouse?.id || warehouses[0]?.id || 'all');
    const [searchTerm, setSearchTerm] = useState('');
    const [stockData, setStockData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPrice, setEditingPrice] = useState<{id: string, type: 'sale' | 'purchase', value: string} | null>(null);

    useEffect(() => {
        if (activeWarehouse) {
            setSelectedWarehouse(activeWarehouse.id);
        }
    }, [activeWarehouse]);

    useEffect(() => {
        fetchStock();
    }, [selectedWarehouse, searchTerm]);

    const fetchStock = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('products')
                .select(`
                    id, 
                    name, 
                    barcode, 
                    sale_price,
                    purchase_price,
                    warehouse_stock (
                        id,
                        warehouse_id,
                        quantity,
                        sale_price,
                        purchase_price
                    )
                `)
                .eq('tenant_id', currentTenant?.id);

            if (searchTerm) {
                query = query.or(`name.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
            }

            const { data, error } = await query;

            if (data) {
                // Flatten and filter based on selected warehouse
                const processed = data.map(product => {
                    const warehouseEntries = product.warehouse_stock || [];
                    const specific = selectedWarehouse === 'all' 
                        ? null 
                        : warehouseEntries.find((ws: any) => ws.warehouse_id === selectedWarehouse);

                    return {
                        ...product,
                        current_ws: specific,
                        // If specific warehouse selected, use its price, otherwise use product default
                        display_sale: specific?.sale_price || product.sale_price,
                        display_purchase: specific?.purchase_price || product.purchase_price,
                        display_qty: selectedWarehouse === 'all' 
                            ? warehouseEntries.reduce((sum: number, ws: any) => sum + (ws.quantity || 0), 0)
                            : (specific?.quantity || 0)
                    };
                });
                setStockData(processed);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePrice = async (productId: string, wsId: string | null, type: 'sale' | 'purchase', newValue: number) => {
        if (selectedWarehouse === 'all' && !isPriceSyncEnabled) {
            alert('Lütfen fiyat güncellemek için spesifik bir mağaza/depo seçin.');
            return;
        }

        try {
            if (isPriceSyncEnabled) {
                // Update MASTER product price
                const { error } = await supabase
                    .from('products')
                    .update({ [type === 'sale' ? 'sale_price' : 'purchase_price']: newValue })
                    .eq('id', productId);
                if (error) throw error;
                
                // Also clear warehouse specific price to use master
                if (wsId) {
                    await supabase
                        .from('warehouse_stock')
                        .update({ [type === 'sale' ? 'sale_price' : 'purchase_price']: null })
                        .eq('id', wsId);
                }
            } else if (wsId) {
                // Update existing warehouse stock record
                const { error } = await supabase
                    .from('warehouse_stock')
                    .update({ [type === 'sale' ? 'sale_price' : 'purchase_price']: newValue })
                    .eq('id', wsId);
                if (error) throw error;
            } else {
                // Create new record for this warehouse
                const { error } = await supabase
                    .from('warehouse_stock')
                    .insert([{
                        tenant_id: currentTenant?.id,
                        warehouse_id: selectedWarehouse,
                        product_id: productId,
                        [type === 'sale' ? 'sale_price' : 'purchase_price']: newValue,
                        quantity: 0
                    }]);
                if (error) throw error;
            }
            setEditingPrice(null);
            fetchStock();
        } catch (err: any) {
            alert('Hata: ' + err.message);
        }
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="glass-card p-4 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Ürün adı veya barkod ile ara..."
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                </div>
                
                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                    <button
                        onClick={() => setSelectedWarehouse('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                            selectedWarehouse === 'all' ? 'bg-white/10 text-white' : 'text-secondary hover:text-white'
                        }`}
                    >
                        Tüm Depolar
                    </button>
                    {warehouses.map(wh => (
                        <button
                            key={wh.id}
                            onClick={() => setSelectedWarehouse(wh.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                selectedWarehouse === wh.id ? 'bg-indigo-500 text-white' : 'text-secondary hover:text-white'
                            }`}
                        >
                            {wh.type === 'virtual' ? <Globe className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                            {wh.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Hint */}
            <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-400" />
                <p className="text-xs text-indigo-200">
                    {selectedWarehouse === 'all' 
                        ? 'Tüm depoların toplam stoğunu görüntülüyorsunuz. Fiyat güncellemek için yukarıdan bir mağaza seçin.' 
                        : `Şu an seçili mağazaya (${warehouses.find(w => w.id === selectedWarehouse)?.name}) özel fiyatları yönetiyorsunuz.`}
                </p>
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="text-left py-4 px-6 text-[10px] font-bold text-secondary uppercase tracking-widest">Ürün Bilgisi</th>
                                <th className="text-right py-4 px-6 text-[10px] font-bold text-secondary uppercase tracking-widest">Alış Fiyatı</th>
                                <th className="text-right py-4 px-6 text-[10px] font-bold text-secondary uppercase tracking-widest">Satış Fiyatı</th>
                                <th className="text-right py-4 px-6 text-[10px] font-bold text-secondary uppercase tracking-widest">Stok Miktarı</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center">
                                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : stockData.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center text-secondary">Ürün bulunamadı.</td>
                                </tr>
                            ) : stockData.map(product => (
                                <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                                                <Package className="w-5 h-5 text-indigo-400/50" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white group-hover:text-indigo-400 transition-colors uppercase text-sm">{product.name}</p>
                                                <p className="text-xs text-secondary font-mono italic">{product.barcode || 'Barkodsuz'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    
                                    {/* Alış Fiyatı */}
                                    <td className="py-4 px-6 text-right">
                                        {editingPrice?.id === product.id && editingPrice?.type === 'purchase' ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <input 
                                                    autoFocus
                                                    type="number"
                                                    value={editingPrice?.value || ''}
                                                    onChange={e => setEditingPrice(prev => prev ? {...prev, value: e.target.value} : null)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter' && editingPrice?.value) {
                                                            handleUpdatePrice(product.id, product.current_ws?.id, 'purchase', parseFloat(editingPrice.value));
                                                        }
                                                    }}
                                                    className="w-24 px-2 py-1 bg-white/10 border border-indigo-500 rounded text-right text-white text-sm"
                                                />
                                                <button onClick={() => setEditingPrice(null)}><X className="w-4 h-4 text-red-500" /></button>
                                            </div>
                                        ) : (
                                            <button 
                                                disabled={selectedWarehouse === 'all'}
                                                onClick={() => setEditingPrice({ id: product.id, type: 'purchase', value: product.display_purchase?.toString() || '0' })}
                                                className={`text-sm font-bold flex items-center justify-end gap-2 ml-auto ${selectedWarehouse === 'all' ? 'text-secondary' : 'text-indigo-300 hover:text-white'}`}
                                            >
                                                {product.display_purchase?.toFixed(2)} ₺
                                                {selectedWarehouse !== 'all' && <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100" />}
                                                {product.current_ws?.purchase_price && <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 rounded ml-1">Özel</span>}
                                            </button>
                                        )}
                                    </td>

                                    {/* Satış Fiyatı */}
                                    <td className="py-4 px-6 text-right">
                                        {editingPrice?.id === product.id && editingPrice?.type === 'sale' ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <input 
                                                    autoFocus
                                                    type="number"
                                                    value={editingPrice?.value || ''}
                                                    onChange={e => setEditingPrice(prev => prev ? {...prev, value: e.target.value} : null)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter' && editingPrice?.value) {
                                                            handleUpdatePrice(product.id, product.current_ws?.id, 'sale', parseFloat(editingPrice.value));
                                                        }
                                                    }}
                                                    className="w-24 px-2 py-1 bg-white/10 border border-indigo-500 rounded text-right text-white text-sm"
                                                />
                                                <button onClick={() => setEditingPrice(null)}><X className="w-4 h-4 text-red-500" /></button>
                                            </div>
                                        ) : (
                                            <button 
                                                disabled={selectedWarehouse === 'all'}
                                                onClick={() => setEditingPrice({ id: product.id, type: 'sale', value: product.display_sale?.toString() || '0' })}
                                                className={`text-lg font-black flex items-center justify-end gap-2 ml-auto ${selectedWarehouse === 'all' ? 'text-secondary' : 'text-white hover:text-indigo-400'}`}
                                            >
                                                {product.display_sale?.toFixed(2)} ₺
                                                {selectedWarehouse !== 'all' && <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100" />}
                                                {product.current_ws?.sale_price && <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 rounded ml-1">Özel</span>}
                                            </button>
                                        )}
                                    </td>
                                    
                                    <td className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className={`text-sm font-bold ${product.display_qty <= 0 ? 'text-red-400' : 'text-indigo-400'}`}>
                                                {product.display_qty}
                                            </span>
                                            <span className="text-[10px] text-secondary font-bold uppercase">{product.unit || 'ADET'}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
