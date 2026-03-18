"use client";

import { useState, useEffect } from 'react';
import { 
    Plus, Building, Edit2, Trash2, 
    Check, X, Globe, Store, Package
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/lib/tenant-context';

export default function WarehouseDefinitions({ onUpdate }: { onUpdate: () => void }) {
    const { currentTenant } = useTenant();
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newWh, setNewWh] = useState({ name: '', code: '', type: 'storage', is_default: false });

    useEffect(() => {
        fetchWarehouses();
    }, []);

    const fetchWarehouses = async () => {
        const { data } = await supabase
            .from('warehouses')
            .select('*')
            .eq('tenant_id', currentTenant?.id)
            .order('created_at');
        if (data) setWarehouses(data);
    };

    const handleSave = async () => {
        if (!newWh.name) return;
        
        const { error } = await supabase
            .from('warehouses')
            .insert([{
                tenant_id: currentTenant?.id,
                ...newWh
            }]);
        
        if (error) {
            alert(error.message);
        } else {
            setIsAdding(false);
            setNewWh({ name: '', code: '', type: 'storage', is_default: false });
            fetchWarehouses();
            onUpdate();
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Bu depoyu silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) {
            const { error } = await supabase.from('warehouses').delete().eq('id', id);
            if (error) alert(error.message);
            else {
                fetchWarehouses();
                onUpdate();
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Depo ve Şube Tanımları</h3>
                {!isAdding && (
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-sm font-bold text-white transition-all shadow-lg"
                    >
                        <Plus className="w-4 h-4" /> Yeni Depo Ekle
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isAdding && (
                    <div className="glass-card p-6 border-2 border-dashed border-indigo-500/50 bg-indigo-500/5">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-secondary uppercase mb-2">Depo Adı</label>
                                <input 
                                    autoFocus
                                    placeholder="Örn: Trendyol Mağazası"
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-indigo-500"
                                    value={newWh.name}
                                    onChange={e => setNewWh({...newWh, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-secondary uppercase mb-2">Kod</label>
                                <input 
                                    placeholder="Örn: TR-01"
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-indigo-500 uppercase"
                                    value={newWh.code}
                                    onChange={e => setNewWh({...newWh, code: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-secondary uppercase mb-2">Tip</label>
                                <select 
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-indigo-500"
                                    value={newWh.type}
                                    onChange={e => setNewWh({...newWh, type: e.target.value})}
                                >
                                    <option value="storage">Depo (Storage)</option>
                                    <option value="shelf">Raf / Şube (Shelf)</option>
                                    <option value="virtual">Sanal Mağaza (Trendyol/Getir vb.)</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleSave} className="flex-1 py-2 bg-green-500 hover:bg-green-600 rounded-xl text-white font-bold text-sm">Kaydet</button>
                                <button onClick={() => setIsAdding(false)} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white font-bold text-sm">Vazgeç</button>
                            </div>
                        </div>
                    </div>
                )}

                {warehouses.map(wh => (
                    <div key={wh.id} className="glass-card p-6 flex flex-col justify-between group">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                    wh.type === 'virtual' ? 'bg-purple-500/20 text-purple-400' : 
                                    wh.type === 'shelf' ? 'bg-blue-500/20 text-blue-400' : 'bg-indigo-500/20 text-indigo-400'
                                }`}>
                                    {wh.type === 'virtual' ? <Globe className="w-6 h-6" /> : 
                                     wh.type === 'shelf' ? <Store className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                                </div>
                                <button 
                                    onClick={() => handleDelete(wh.id)}
                                    className="p-2 opacity-0 group-hover:opacity-100 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <h4 className="text-xl font-black text-white uppercase tracking-tighter">{wh.name}</h4>
                            <p className="text-xs text-secondary font-mono mb-4">{wh.code || 'KODSUZ'}</p>
                            
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
                                    wh.type === 'virtual' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/20' : 
                                    wh.type === 'shelf' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' : 
                                    'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20'
                                }`}>
                                    {wh.type === 'virtual' ? 'Sanal Mağaza' : wh.type === 'shelf' ? 'Raf / Şube' : 'Ana Depo'}
                                </span>
                                {wh.is_default && (
                                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/20">
                                        Varsayılan
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
