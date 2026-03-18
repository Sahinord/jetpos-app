"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ClipboardCheck, ArrowRight, Building2, Plus, ArrowLeft } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import InventoryCounter from '@/components/InventoryCounter';
import { toast } from 'sonner';

export default function InventoryCountPage() {
    const router = useRouter();
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [counts, setCounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
    const [activeCount, setActiveCount] = useState<any>(null);

    useEffect(() => {
        const tenantId = localStorage.getItem('tenantId');
        if (!tenantId) {
            router.push('/');
            return;
        }
        supabase.rpc('set_current_tenant', { tenant_id: tenantId }).then(() => {
            fetchWarehouses();
            fetchCounts();
        });
    }, []);

    const fetchWarehouses = async () => {
        const tenantId = localStorage.getItem('tenantId');
        const { data } = await supabase
            .from('warehouses')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('is_default', { ascending: false });
        if (data) {
            setWarehouses(data);
            if (data.length > 0) setSelectedWarehouseId(data[0].id);
        }
    };

    const fetchCounts = async () => {
        const tenantId = localStorage.getItem('tenantId');
        const { data } = await supabase
            .from('inventory_counts')
            .select(`*, warehouses(name)`)
            .eq('tenant_id', tenantId)
            .eq('status', 'draft')
            .order('created_at', { ascending: false });
        if (data) setCounts(data);
        setLoading(false);
    };

    const startNewCount = async () => {
        if (!selectedWarehouseId) return;
        
        const tenantId = localStorage.getItem('tenantId');
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const countNo = `MOB-${date}-${random}`;

        try {
            const { data, error } = await supabase
                .from('inventory_counts')
                .insert([{
                    tenant_id: tenantId,
                    warehouse_id: selectedWarehouseId,
                    count_no: countNo,
                    status: 'draft',
                    notes: 'Mobil cihazdan başlatıldı'
                }])
                .select()
                .single();
            
            if (error) throw error;
            setActiveCount(data);
        } catch (error: any) {
            toast.error('Sayım başlatılamadı: ' + error.message);
        }
    };

    if (activeCount) {
        return (
            <InventoryCounter 
                countId={activeCount.id} 
                warehouseId={activeCount.warehouse_id} 
                onClose={() => { setActiveCount(null); fetchCounts(); }}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-24">
            {/* Header */}
            <header className="sticky top-0 z-50 glass border-b border-white/5 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 glass-dark rounded-xl border border-white/5">
                        <ArrowLeft size={20} className="text-secondary" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight leading-none uppercase">Envanter Sayımı</h1>
                        <p className="text-[10px] font-black text-secondary tracking-[2.5px] uppercase mt-1">Stok Kontrolü</p>
                    </div>
                </div>
                <div className="w-11 h-11 rounded-2xl glass border border-white/10 flex items-center justify-center">
                    <ClipboardCheck className="w-6 h-6 text-blue-400" />
                </div>
            </header>

            <div className="p-6 space-y-8">
                {/* New Count Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-4 px-2">
                        <span className="text-[10px] font-black text-secondary uppercase tracking-[4px]">Yeni Sayım Başlat</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                    </div>
                    
                    <div className="glass-dark border border-white/10 rounded-[2.5rem] p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-secondary tracking-widest ml-1">DEPO / MAĞAZA SEÇİN</label>
                            <div className="relative">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                                <select 
                                    value={selectedWarehouseId}
                                    onChange={(e) => setSelectedWarehouseId(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white font-bold appearance-none outline-none focus:border-blue-500/50"
                                >
                                    {warehouses.map(w => (
                                        <option key={w.id} value={w.id} className="bg-slate-900">{w.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button 
                            onClick={startNewCount}
                            className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                        >
                            <Plus size={18} />
                            Hızlı Sayım Başlat
                        </button>
                    </div>
                </div>

                {/* Draft Counts Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-4 px-2">
                        <span className="text-[10px] font-black text-secondary uppercase tracking-[4px]">Devam Eden Sayımlar</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="py-10 text-center opacity-20">
                                <div className="w-8 h-8 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                            </div>
                        ) : counts.length === 0 ? (
                            <div className="glass-dark border border-white/5 rounded-3xl p-10 text-center opacity-30">
                                <ClipboardCheck className="w-12 h-12 mx-auto mb-4" />
                                <p className="text-xs font-bold uppercase tracking-widest">Açık sayım bulunamadı</p>
                            </div>
                        ) : (
                            counts.map(count => (
                                <button 
                                    key={count.id}
                                    onClick={() => setActiveCount(count)}
                                    className="w-full glass-dark border border-white/5 p-5 rounded-3xl flex items-center justify-between group active:scale-[0.98] transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                            <ClipboardCheck className="w-6 h-6 text-amber-500" />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-white font-black text-sm">{count.count_no}</h3>
                                            <p className="text-[10px] text-secondary font-bold uppercase tracking-wider">{count.warehouses?.name}</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-secondary group-hover:translate-x-1 transition-transform" />
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
