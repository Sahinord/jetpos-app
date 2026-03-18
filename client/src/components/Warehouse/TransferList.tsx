"use client";

import { useState, useEffect } from 'react';
import { 
    Plus, ArrowLeftRight, Calendar, Search, 
    CheckCircle2, Clock, XCircle, ChevronRight,
    TrendingDown, TrendingUp
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/lib/tenant-context';
import NewTransferModal from './NewTransferModal';

interface TransferListProps {
    warehouses: any[];
}

export default function TransferList({ warehouses }: TransferListProps) {
    const { currentTenant } = useTenant();
    const [transfers, setTransfers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchTransfers();
    }, []);

    const fetchTransfers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('warehouse_transfers')
            .select(`
                *,
                from:from_warehouse_id (name),
                to:to_warehouse_id (name),
                items:warehouse_transfer_items (count)
            `)
            .eq('tenant_id', currentTenant?.id)
            .order('created_at', { ascending: false });
        
        if (data) setTransfers(data);
        setLoading(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/20';
            case 'pending': return 'bg-amber-500/20 text-amber-400 border-amber-500/20';
            case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/20';
            default: return 'bg-white/5 text-secondary border-white/10';
        }
    };

    const handleApprove = async (id: string) => {
        if (!confirm('Bu transferi onaylamak istiyor musunuz? Stoklar güncellenecektir.')) return;

        const { error } = await supabase
            .from('warehouse_transfers')
            .update({ status: 'completed' })
            .eq('id', id);
        
        if (error) alert(error.message);
        else fetchTransfers();
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                        <ArrowLeftRight className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">Transfer Fişleri</h3>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 rounded-xl font-black text-white transition-all shadow-lg active:scale-95"
                >
                    <Plus className="w-5 h-5" /> Yeni Transfer Oluştur
                </button>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="text-left py-4 px-6 text-[10px] font-bold text-secondary uppercase tracking-widest">Fiş No / Tarih</th>
                                <th className="text-left py-4 px-6 text-[10px] font-bold text-secondary uppercase tracking-widest">Kaynak Depo</th>
                                <th className="py-4 px-2 text-center text-secondary"><ArrowLeftRight className="w-3 h-3 mx-auto" /></th>
                                <th className="text-left py-4 px-6 text-[10px] font-bold text-secondary uppercase tracking-widest">Hedef Depo</th>
                                <th className="text-center py-4 px-6 text-[10px] font-bold text-secondary uppercase tracking-widest">Durum</th>
                                <th className="text-right py-4 px-6 text-[10px] font-bold text-secondary uppercase tracking-widest">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={6} className="py-20 text-center text-secondary">Yükleniyor...</td></tr>
                            ) : transfers.length === 0 ? (
                                <tr><td colSpan={6} className="py-20 text-center text-secondary">Henüz bir transfer kaydı yok.</td></tr>
                            ) : transfers.map(t => (
                                <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="py-4 px-6 text-sm font-bold text-white uppercase tracking-tight">
                                        <div className="flex flex-col">
                                            <span>{t.transfer_no}</span>
                                            <span className="text-[10px] text-secondary font-medium tracking-normal mt-0.5">
                                                {new Date(t.transfer_date).toLocaleDateString()} {new Date(t.transfer_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2">
                                            <TrendingDown className="w-3 h-3 text-red-500" />
                                            <span className="text-sm font-bold text-white uppercase">{t.from?.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-2 text-center">
                                        <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                                            <ChevronRight className="w-4 h-4 text-secondary/30" />
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="w-3 h-3 text-green-500" />
                                            <span className="text-sm font-bold text-white uppercase">{t.to?.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <span className={`text-[10px] font-black px-2 py-1 rounded-full border uppercase tracking-wider ${getStatusColor(t.status)}`}>
                                            {t.status === 'completed' ? 'Tamamlandı' : t.status === 'pending' ? 'Beklemede' : 'İptal Edildi'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        {t.status === 'pending' ? (
                                            <button 
                                                onClick={() => handleApprove(t.id)}
                                                className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white rounded-lg text-[10px] font-black transition-all border border-green-500/20"
                                            >
                                                ONAYLA
                                            </button>
                                        ) : (
                                            <button className="p-2 text-secondary hover:text-white transition-all">
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <NewTransferModal 
                    warehouses={warehouses} 
                    onClose={() => setIsModalOpen(false)} 
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchTransfers();
                    }}
                />
            )}
        </div>
    );
}
