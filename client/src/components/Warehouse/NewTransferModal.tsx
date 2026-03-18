"use client";

import { useState, useEffect } from 'react';
import { 
    X, Plus, Trash2, Search, 
    ArrowLeftRight, Package, Save 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/lib/tenant-context';

interface NewTransferModalProps {
    warehouses: any[];
    onClose: () => void;
    onSuccess: () => void;
}

export default function NewTransferModal({ warehouses, onClose, onSuccess }: NewTransferModalProps) {
    const { currentTenant } = useTenant();
    const [formData, setFormData] = useState({
        transfer_no: `TRF-${Date.now().toString().slice(-6)}`,
        from_warehouse_id: '',
        to_warehouse_id: '',
        notes: ''
    });
    const [items, setItems] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (warehouses.length > 0) {
            setFormData(prev => ({
                ...prev,
                from_warehouse_id: warehouses[0].id,
                to_warehouse_id: warehouses[1]?.id || warehouses[0].id
            }));
        }
    }, [warehouses]);

    const searchProducts = async (term: string) => {
        if (term.length < 2) {
            setSearchResults([]);
            return;
        }
        const { data } = await supabase
            .from('products')
            .select('id, name, barcode, unit')
            .eq('tenant_id', currentTenant?.id)
            .or(`name.ilike.%${term}%,barcode.ilike.%${term}%`)
            .limit(5);
        if (data) setSearchResults(data);
    };

    const addItem = (product: any) => {
        if (items.find(i => i.product_id === product.id)) return;
        setItems([...items, {
            product_id: product.id,
            name: product.name,
            barcode: product.barcode,
            quantity: 1,
            unit: product.unit || 'ADET'
        }]);
        setSearchTerm('');
        setSearchResults([]);
    };

    const removeItem = (id: string) => {
        setItems(items.filter(i => i.product_id !== id));
    };

    const handleSave = async () => {
        if (!formData.from_warehouse_id || !formData.to_warehouse_id || items.length === 0) {
            alert('Lütfen tüm alanları doldurun ve en az bir ürün ekleyin.');
            return;
        }
        if (formData.from_warehouse_id === formData.to_warehouse_id) {
            alert('Kaynak ve hedef depo aynı olamaz!');
            return;
        }

        setLoading(true);
        try {
            // 1. Create Transfer Slip
            const { data: transfer, error: tError } = await supabase
                .from('warehouse_transfers')
                .insert([{
                    tenant_id: currentTenant?.id,
                    ...formData,
                    status: 'pending'
                }])
                .select()
                .single();

            if (tError) throw tError;

            // 2. Add Items
            const transferItems = items.map(item => ({
                transfer_id: transfer.id,
                product_id: item.product_id,
                quantity: item.quantity,
                unit: item.unit
            }));

            const { error: iError } = await supabase
                .from('warehouse_transfer_items')
                .insert(transferItems);

            if (iError) throw iError;

            onSuccess();
        } catch (err: any) {
            alert('Hata: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#0f172a] border border-white/10 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                            <ArrowLeftRight className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Yeni Stok Transferi</h3>
                            <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">{formData.transfer_no}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
                        <X className="w-6 h-6 text-secondary" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Warehouse Selectors */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-secondary uppercase tracking-widest">Kaynak Depo (Çıkış)</label>
                            <select 
                                value={formData.from_warehouse_id}
                                onChange={e => setFormData({...formData, from_warehouse_id: e.target.value})}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold outline-none focus:border-red-500/50 transition-all"
                            >
                                {warehouses.map(w => <option key={w.id} value={w.id} className="bg-[#0f172a]">{w.name}</option>)}
                            </select>
                        </div>

                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex w-8 h-8 rounded-full bg-white/10 border border-white/10 items-center justify-center z-10 backdrop-blur-md">
                            <ArrowLeftRight className="w-4 h-4 text-secondary" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-secondary uppercase tracking-widest">Hedef Depo (Giriş)</label>
                            <select 
                                value={formData.to_warehouse_id}
                                onChange={e => setFormData({...formData, to_warehouse_id: e.target.value})}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold outline-none focus:border-green-500/50 transition-all"
                            >
                                {warehouses.map(w => <option key={w.id} value={w.id} className="bg-[#0f172a]">{w.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Product Search */}
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                            <input 
                                placeholder="Ürün ara veya barkod okut..."
                                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-indigo-500 transition-all"
                                value={searchTerm}
                                onChange={e => {
                                    setSearchTerm(e.target.value);
                                    searchProducts(e.target.value);
                                }}
                            />
                            
                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl z-[110] overflow-hidden">
                                    {searchResults.map(p => (
                                        <button 
                                            key={p.id}
                                            onClick={() => addItem(p)}
                                            className="w-full text-left p-4 hover:bg-white/5 flex justify-between items-center group transition-all"
                                        >
                                            <div>
                                                <p className="font-bold text-white uppercase text-sm">{p.name}</p>
                                                <p className="text-[10px] text-secondary font-mono">{p.barcode}</p>
                                            </div>
                                            <Plus className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Items Table */}
                        <div className="border border-white/10 rounded-2xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 border-b border-white/10">
                                    <tr>
                                        <th className="p-4 text-[10px] font-black text-secondary uppercase tracking-widest">Ürün Bilgisi</th>
                                        <th className="p-4 text-[10px] font-black text-secondary uppercase tracking-widest text-center">Miktar</th>
                                        <th className="p-4 text-[10px] font-black text-secondary uppercase tracking-widest text-right">Eylem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {items.length === 0 ? (
                                        <tr><td colSpan={3} className="p-8 text-center text-secondary italic text-sm">Henüz ürün eklenmedi.</td></tr>
                                    ) : items.map((item, idx) => (
                                        <tr key={idx} className="group hover:bg-white/5 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                                                        <Package className="w-4 h-4 text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white uppercase">{item.name}</p>
                                                        <p className="text-[10px] text-secondary font-mono italic">{item.barcode}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <input 
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={e => {
                                                            const newItems = [...items];
                                                            newItems[idx].quantity = parseFloat(e.target.value);
                                                            setItems(newItems);
                                                        }}
                                                        className="w-20 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-center text-white font-bold outline-none focus:border-indigo-500"
                                                    />
                                                    <span className="text-[10px] text-secondary font-bold uppercase">{item.unit}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button 
                                                    onClick={() => removeItem(item.product_id)}
                                                    className="p-2 text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-secondary uppercase tracking-widest">Açıklama / Notlar</label>
                        <textarea 
                            rows={2}
                            placeholder="Opsiyonel açıklama girin..."
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-400 transition-all resize-none"
                            value={formData.notes}
                            onChange={e => setFormData({...formData, notes: e.target.value})}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-white/5">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl border border-white/10 text-white font-bold text-sm hover:bg-white/5 transition-all"
                    >
                        Vazgeç
                    </button>
                    <button 
                        disabled={loading || items.length === 0}
                        onClick={handleSave}
                        className="px-8 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-black text-sm transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                        TRANSFERİ OLUŞTUR
                    </button>
                </div>
            </div>
        </div>
    );
}
