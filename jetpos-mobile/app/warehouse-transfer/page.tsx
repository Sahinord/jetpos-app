"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Send, Building2, Plus, ArrowRight, PackageCheck, History } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import TransferPortal from '@/components/TransferPortal';
import { toast } from 'sonner';

export default function TransfersPage() {
    const router = useRouter();
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [activeTransfers, setActiveTransfers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedToId, setSelectedToId] = useState('');
    const [activeTransfer, setActiveTransfer] = useState<any>(null);

    const [fromWhName, setFromWhName] = useState('');

    useEffect(() => {
        const tenantId = localStorage.getItem('tenantId');
        if (!tenantId) {
            router.push('/');
            return;
        }
        setFromWhName(localStorage.getItem('activeWarehouseName') || '');
        supabase.rpc('set_current_tenant', { tenant_id: tenantId }).then(() => {
            fetchWarehouses();
            fetchTransfers();
        });

        // REALTIME: Listen for new transfers or status updates
        const channel = supabase
            .channel(`warehouse_transfers_${tenantId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'warehouse_transfers',
                filter: `tenant_id=eq.${tenantId}`
            }, () => {
                fetchTransfers();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchWarehouses = async () => {
        const tenantId = localStorage.getItem('tenantId');
        const activeWhId = localStorage.getItem('activeWarehouseId');
        const { data } = await supabase
            .from('warehouses')
            .select('*')
            .eq('tenant_id', tenantId)
            .neq('id', activeWhId)
            .eq('is_active', true);
        if (data) {
            setWarehouses(data);
            if (data.length > 0) setSelectedToId(data[0].id);
        }
    };

    const fetchTransfers = async () => {
        const tenantId = localStorage.getItem('tenantId');
        const activeWhId = localStorage.getItem('activeWarehouseId');
        const { data } = await supabase
            .from('warehouse_transfers')
            .select('*, from:from_warehouse_id(name), to:to_warehouse_id(name)')
            .eq('tenant_id', tenantId)
            .eq('status', 'pending')
            .or(`from_warehouse_id.eq.${activeWhId},to_warehouse_id.eq.${activeWhId}`)
            .order('created_at', { ascending: false });
        if (data) setActiveTransfers(data);
        setLoading(false);
    };

    const startNewTransfer = async () => {
        const fromWhId = localStorage.getItem('activeWarehouseId');
        if (!fromWhId || !selectedToId) {
            toast.error('Lütfen hedef mağaza seçin.');
            return;
        }

        const tenantId = localStorage.getItem('tenantId');
        const transferNo = `TRF-MOB-${Date.now().toString().slice(-6)}`;

        try {
            const { data, error } = await supabase
                .from('warehouse_transfers')
                .insert([{
                    tenant_id: tenantId,
                    from_warehouse_id: fromWhId,
                    to_warehouse_id: selectedToId,
                    transfer_no: transferNo,
                    status: 'pending',
                    notes: 'Mobil transfer başlatıldı'
                }])
                .select()
                .single();
            
            if (error) throw error;
            setActiveTransfer(data);
        } catch (error: any) {
            toast.error('Transfer başlatılamadı: ' + error.message);
        }
    };

    if (activeTransfer) {
        return (
            <TransferPortal 
                transferId={activeTransfer.id}
                fromWarehouseId={activeTransfer.from_warehouse_id}
                toWarehouseId={activeTransfer.to_warehouse_id}
                onClose={() => { setActiveTransfer(null); fetchTransfers(); }}
            />
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 pb-24">
            <header className="sticky top-0 z-50 glass border-b border-white/5 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 glass-dark rounded-xl border border-white/5">
                        <ArrowLeft size={20} className="text-secondary" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight leading-none uppercase">Stok Transferi</h1>
                        <p className="text-[10px] font-black text-emerald-400 tracking-[2px] uppercase mt-1">Mağazalar Arası</p>
                    </div>
                </div>
                <div className="w-11 h-11 rounded-2xl glass border border-white/10 flex items-center justify-center">
                    <Send className="w-6 h-6 text-emerald-400" />
                </div>
            </header>

            <div className="p-6 space-y-8">
                {/* Create Section */}
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-secondary tracking-[3px] uppercase px-2">Yeni Transfer Gönder</p>
                    <div className="glass-dark border border-white/10 rounded-[2.5rem] p-6 space-y-5">
                        <div className="flex items-center justify-between px-2">
                            <div className="text-center">
                                <p className="text-[9px] font-bold text-secondary uppercase mb-1">NEREDEN</p>
                                <p className="text-sm font-black text-white">{fromWhName || 'Mağaza Seçilmedi'}</p>
                            </div>
                            <ArrowRight className="text-emerald-500" />
                            <div className="text-center">
                                <p className="text-[9px] font-bold text-secondary uppercase mb-1">NEREYE</p>
                                <select 
                                    value={selectedToId}
                                    onChange={(e) => setSelectedToId(e.target.value)}
                                    className="bg-transparent text-sm font-black text-emerald-400 text-center outline-none"
                                >
                                    {warehouses.map(w => <option key={w.id} value={w.id} className="bg-slate-900">{w.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <button 
                            onClick={startNewTransfer}
                            className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 text-xs"
                        >
                            <Plus size={18} />
                            TRANSFERİ BAŞLAT
                        </button>
                    </div>
                </div>

                {/* List Section */}
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-secondary tracking-[3px] uppercase px-2">Bekleyen İşlemler</p>
                    {activeTransfers.map(trf => (
                        <button 
                            key={trf.id}
                            onClick={() => setActiveTransfer(trf)}
                            className="w-full glass-dark border border-white/5 p-5 rounded-3xl flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                    <PackageCheck size={24} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-white font-black text-sm">{trf.transfer_no}</h3>
                                    <p className="text-[10px] text-secondary font-bold uppercase tracking-wider">
                                        {trf.from?.name} <ArrowRight size={8} className="inline mx-1" /> {trf.to?.name}
                                    </p>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-lg glass flex items-center justify-center text-white/20 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                <Plus size={18} />
                            </div>
                        </button>
                    ))}
                    {activeTransfers.length === 0 && (
                        <div className="py-10 text-center opacity-20">
                            <History size={40} className="mx-auto mb-2" />
                            <p className="text-[10px] font-bold uppercase">Bekleyen transfer yok</p>
                        </div>
                    )}
                </div>
            </div>
            <BottomNav />
        </div>
    );
}
