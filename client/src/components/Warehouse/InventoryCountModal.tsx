"use client";

import { useState, useEffect, useRef } from 'react';
import { 
    X, Search, Plus, Save, Check, 
    Trash2, AlertCircle, ClipboardCheck, 
    ChevronRight, Scan, Package, 
    ArrowRightLeft, History
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/lib/tenant-context';
import { motion, AnimatePresence } from 'framer-motion';

interface InventoryCountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    warehouses: any[];
    existingCount?: any; // If editing a draft
}

export default function InventoryCountModal({ 
    isOpen, 
    onClose, 
    onSuccess, 
    warehouses,
    existingCount 
}: InventoryCountModalProps) {
    const { currentTenant, activeWarehouse } = useTenant();
    const [selectedWarehouseId, setSelectedWarehouseId] = useState(existingCount?.warehouse_id || activeWarehouse?.id || warehouses[0]?.id);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [notes, setNotes] = useState(existingCount?.notes || '');
    const [countNo, setCountNo] = useState(existingCount?.count_no || '');

    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            if (!existingCount) {
                const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                setCountNo(`SYM-${date}-${random}`);
                setItems([]);
                setNotes('');
            } else {
                setCountNo(existingCount.count_no);
                setNotes(existingCount.notes || '');
                fetchItems(existingCount.id);
            }
            setSelectedWarehouseId(existingCount?.warehouse_id || activeWarehouse?.id || warehouses[0]?.id);
        }
    }, [isOpen, existingCount, activeWarehouse, warehouses]);

    const fetchItems = async (countId: string) => {
        setLoading(true);
        const { data, error } = await supabase
            .from('inventory_count_items')
            .select('*, products(name, barcode, unit)')
            .eq('count_id', countId);
        
        if (data) {
            setItems(data.map(item => ({
                id: item.id,
                product_id: item.product_id,
                name: item.products.name,
                barcode: item.products.barcode,
                unit: item.products.unit,
                system_quantity: item.system_quantity,
                counted_quantity: item.counted_quantity,
                difference: item.difference
            })));
        }
        setLoading(false);
    };

    const handleSearch = async (term: string) => {
        setSearchTerm(term);
        if (term.length < 2) {
            setSearchResults([]);
            return;
        }

        const { data } = await supabase
            .from('products')
            .select(`
                id, name, barcode, unit,
                warehouse_stock(quantity, warehouse_id)
            `)
            .or(`name.ilike.%${term}%,barcode.eq.${term}`)
            .eq('tenant_id', currentTenant?.id)
            .limit(10);

        if (data) {
            const results = data.map(p => {
                const ws = p.warehouse_stock?.find((w: any) => w.warehouse_id === selectedWarehouseId);
                return {
                    id: p.id,
                    name: p.name,
                    barcode: p.barcode,
                    unit: p.unit,
                    system_quantity: ws?.quantity || 0
                };
            });
            setSearchResults(results);

            // If exact barcode match, add it immediately
            const exactMatch = results.find(r => r.barcode === term);
            if (exactMatch) {
                addItem(exactMatch);
                setSearchTerm('');
                setSearchResults([]);
            }
        }
    };

    const addItem = (product: any) => {
        const existingIdx = items.findIndex(item => item.product_id === product.id);
        if (existingIdx > -1) {
            const newItems = [...items];
            newItems[existingIdx].counted_quantity += 1;
            newItems[existingIdx].difference = newItems[existingIdx].counted_quantity - newItems[existingIdx].system_quantity;
            setItems(newItems);
        } else {
            setItems([...items, {
                product_id: product.id,
                name: product.name,
                barcode: product.barcode,
                unit: product.unit || 'Adet',
                system_quantity: product.system_quantity,
                counted_quantity: 1,
                difference: 1 - product.system_quantity
            }]);
        }
    };

    const updateItemQty = (idx: number, qty: number) => {
        const newItems = [...items];
        newItems[idx].counted_quantity = qty;
        newItems[idx].difference = qty - newItems[idx].system_quantity;
        setItems(newItems);
    };

    const removeItem = (idx: number) => {
        setItems(items.filter((_, i) => i !== idx));
    };

    const handleSave = async (status: 'draft' | 'completed') => {
        if (!selectedWarehouseId) {
            alert('Lütfen bir depo seçin.');
            return;
        }

        if (items.length === 0) {
            alert('Lütfen sayılacak ürün ekleyin.');
            return;
        }

        if (status === 'completed' && !confirm('Bu sayımı tamamlayıp stokları güncellemek istediğinize emin misiniz?')) {
            return;
        }

        setSaving(true);
        try {
            let countId = existingCount?.id;

            if (!countId) {
                // Create head
                const { data, error } = await supabase
                    .from('inventory_counts')
                    .insert([{
                        tenant_id: currentTenant?.id,
                        warehouse_id: selectedWarehouseId,
                        count_no: countNo,
                        status: status,
                        notes: notes,
                        total_items: items.length,
                        total_difference: items.reduce((sum, i) => sum + i.difference, 0)
                    }])
                    .select()
                    .single();
                
                if (error) throw error;
                countId = data.id;
            } else {
                // Update head
                const { error } = await supabase
                    .from('inventory_counts')
                    .update({
                        status: status,
                        notes: notes,
                        total_items: items.length,
                        total_difference: items.reduce((sum, i) => sum + i.difference, 0),
                        completed_at: status === 'completed' ? new Date().toISOString() : null
                    })
                    .eq('id', countId);
                
                if (error) throw error;
            }

            // Sync Items
            // Delete old items if updating
            if (existingCount) {
                await supabase.from('inventory_count_items').delete().eq('count_id', countId);
            }

            const { error: itemsError } = await supabase
                .from('inventory_count_items')
                .insert(items.map(item => ({
                    count_id: countId,
                    product_id: item.product_id,
                    system_quantity: item.system_quantity,
                    counted_quantity: item.counted_quantity,
                    difference: item.difference
                })));
            
            if (itemsError) throw itemsError;

            // IF COMPLETED -> UPDATE ACTUAL STOCK
            if (status === 'completed') {
                for (const item of items) {
                    await supabase
                        .from('warehouse_stock')
                        .upsert([{
                            tenant_id: currentTenant?.id,
                            warehouse_id: selectedWarehouseId,
                            product_id: item.product_id,
                            quantity: item.counted_quantity,
                            updated_at: new Date().toISOString()
                        }], { onConflict: 'warehouse_id,product_id' });
                }
            }

            alert(status === 'completed' ? '✅ Sayım başarıyla tamamlandı ve stoklar güncellendi.' : '💾 Sayım taslak olarak kaydedildi.');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            alert('Hata: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
                {/* Header */}
                <div className="p-8 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center">
                            <ClipboardCheck className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white">{existingCount ? 'Sayımı Düzenle' : 'Yeni Envanter Sayımı'}</h2>
                            <p className="text-secondary text-sm font-mono">{countNo}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                        <X className="w-6 h-6 text-secondary" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    {/* Left: Product Selection & Controls */}
                    <div className="w-full lg:w-1/3 p-6 border-r border-white/10 flex flex-col gap-6 overflow-y-auto">
                        {/* Warehouse Select */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-secondary tracking-widest ml-1">DEPO / MAĞAZA</label>
                            <select 
                                value={selectedWarehouseId}
                                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                                disabled={items.length > 0}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50 transition-all font-bold"
                            >
                                {warehouses.map(w => (
                                    <option key={w.id} value={w.id} className="bg-slate-900">{w.name}</option>
                                ))}
                            </select>
                            {items.length > 0 && <p className="text-[10px] text-amber-500 italic ml-1">Ürün varken depo değiştirilemez.</p>}
                        </div>

                        {/* Search */}
                        <div className="space-y-2 relative">
                            <label className="text-[10px] font-black uppercase text-secondary tracking-widest ml-1">ÜRÜN ARA / BARKOD OKUT</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                                <input 
                                    ref={searchRef}
                                    type="text"
                                    placeholder="Ürün adı veya barkod..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white outline-none focus:border-indigo-500/50 transition-all"
                                />
                            </div>

                            {/* Search Results Dropdown */}
                            <AnimatePresence>
                                {searchResults.length > 0 && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-2xl p-2 z-50 shadow-2xl space-y-1"
                                    >
                                        {searchResults.map(res => (
                                            <button 
                                                key={res.id}
                                                onClick={() => { addItem(res); setSearchTerm(''); setSearchResults([]); }}
                                                className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-all group"
                                            >
                                                <div className="text-left">
                                                    <p className="text-sm font-bold text-white group-hover:text-indigo-400">{res.name}</p>
                                                    <p className="text-[10px] text-secondary font-mono">{res.barcode}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-black text-white">{res.system_quantity} {res.unit}</p>
                                                    <p className="text-[10px] text-secondary uppercase">Mevcut</p>
                                                </div>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-secondary tracking-widest ml-1">NOTLAR</label>
                            <textarea 
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50 transition-all resize-none h-32 text-sm"
                                placeholder="Sayım hakkında not ekleyin..."
                            />
                        </div>
                    </div>

                    {/* Right: Items Table */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
                        <div className="p-4 bg-white/5 border-b border-white/10 grid grid-cols-12 gap-2 md:gap-4 text-[10px] font-black uppercase tracking-widest text-secondary">
                            <div className="col-span-4 md:col-span-5">Ürün</div>
                            <div className="col-span-2 text-center">Sistem</div>
                            <div className="col-span-3 md:col-span-2 text-center">Sayılan</div>
                            <div className="col-span-2 text-center">Fark</div>
                            <div className="col-span-1"></div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {items.map((item, idx) => (
                                <motion.div 
                                    layout
                                    key={item.product_id}
                                    className="grid grid-cols-12 gap-2 md:gap-4 items-center p-3 md:p-4 bg-white/5 border border-white/10 rounded-2xl group hover:border-white/20 transition-all"
                                >
                                    <div className="col-span-4 md:col-span-5 min-w-0">
                                        <p className="text-xs md:text-sm font-bold text-white truncate">{item.name}</p>
                                        <p className="text-[9px] md:text-[10px] text-secondary font-mono truncate">{item.barcode}</p>
                                    </div>
                                    <div className="col-span-2 text-center">
                                        <p className="text-xs md:text-sm font-black text-white/50">{item.system_quantity}</p>
                                        <p className="text-[9px] md:text-[10px] text-secondary uppercase">{item.unit}</p>
                                    </div>
                                    <div className="col-span-3 md:col-span-2 px-1">
                                        <input 
                                            type="number"
                                            value={item.counted_quantity}
                                            onChange={(e) => updateItemQty(idx, parseFloat(e.target.value) || 0)}
                                            className="w-full bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-center text-xs md:text-sm font-black text-white outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div className="col-span-2 text-center">
                                        <div className={`inline-flex items-center gap-1 px-2 md:px-3 py-1 rounded-full ${
                                            item.difference === 0 ? 'bg-emerald-500/10 text-emerald-500' : 
                                            item.difference > 0 ? 'bg-blue-500/10 text-blue-500' : 'bg-rose-500/10 text-rose-500'
                                        }`}>
                                            <span className="text-[10px] md:text-xs font-black">{item.difference > 0 ? '+' : ''}{item.difference}</span>
                                        </div>
                                    </div>
                                    <div className="col-span-1 text-right">
                                        <button 
                                            onClick={() => removeItem(idx)}
                                            className="p-1.5 md:p-2 text-secondary hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-3 md:w-4 h-3 md:h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}

                            {items.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 p-12">
                                    <Scan className="w-16 h-16 mb-4" />
                                    <p className="text-lg font-bold">Barkod okutun veya ürün arayın</p>
                                    <p className="text-sm">Henüz listeye ürün eklenmedi</p>
                                </div>
                            )}
                        </div>

                        {/* Summary Footer */}
                        <div className="p-4 md:p-6 bg-white/5 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex flex-col sm:flex-row gap-3 md:gap-6">
                                <div className="bg-black/40 p-3 md:px-5 md:py-3 rounded-2xl border border-white/5 min-w-[140px]">
                                    <p className="text-[9px] md:text-[10px] font-black uppercase text-secondary tracking-widest mb-1">TOPLAM ÜRÜN</p>
                                    <p className="text-lg md:text-xl font-black text-white">{items.length}</p>
                                </div>
                                <div className="bg-black/40 p-3 md:px-5 md:py-3 rounded-2xl border border-white/5 min-w-[140px]">
                                    <p className="text-[9px] md:text-[10px] font-black uppercase text-secondary tracking-widest mb-1">TOPLAM FARK</p>
                                    <p className={`text-lg md:text-xl font-black ${
                                        items.reduce((sum, i) => sum + i.difference, 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                    }`}>
                                        {items.reduce((sum, i) => sum + i.difference, 0) > 0 ? '+' : ''}
                                        {items.reduce((sum, i) => sum + i.difference, 0)}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex gap-3 md:min-w-[320px]">
                                <button 
                                    onClick={() => handleSave('draft')}
                                    disabled={saving || items.length === 0}
                                    className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all border border-white/10 flex items-center justify-center gap-2 text-xs md:text-sm"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>Taslak</span>
                                </button>
                                <button 
                                    onClick={() => handleSave('completed')}
                                    disabled={saving || items.length === 0}
                                    className="flex-[1.5] px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 text-xs md:text-sm whitespace-nowrap"
                                >
                                    {saving ? <Plus className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    <span>Onayla ve Bitir</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
