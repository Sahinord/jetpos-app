"use client";

import { useState, useEffect } from 'react';
import { 
    Plus, Search, Filter, ClipboardCheck, 
    Calendar, User, ChevronRight, AlertCircle,
    CheckCircle2, Clock, Trash2, Edit2, Eye
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/lib/tenant-context';
import InventoryCountModal from './InventoryCountModal';

export default function InventoryCountList({ warehouses }: { warehouses: any[] }) {
    const { currentTenant } = useTenant();
    const [counts, setCounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCount, setSelectedCount] = useState<any>(null);
    const [viewOnly, setViewOnly] = useState(false);

    useEffect(() => {
        if (currentTenant) {
            fetchCounts();
        }
    }, [currentTenant]);

    const fetchCounts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('inventory_counts')
            .select(`
                *,
                warehouses(name)
            `)
            .eq('tenant_id', currentTenant?.id)
            .order('created_at', { ascending: false });
        
        if (data) setCounts(data);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu sayım kaydını silmek istediğinize emin misiniz?')) return;
        
        const { error } = await supabase
            .from('inventory_counts')
            .delete()
            .eq('id', id);
        
        if (!error) {
            fetchCounts();
        } else {
            alert('Hata: ' + error.message);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase">
                        <CheckCircle2 className="w-3 h-3" />
                        Tamamlandı
                    </div>
                );
            case 'draft':
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase">
                        <Clock className="w-3 h-3" />
                        Taslak
                    </div>
                );
            default:
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 text-secondary rounded-full text-[10px] font-black uppercase">
                        {status}
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex items-center justify-between">
                <div className="relative w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                    <input 
                        type="text" 
                        placeholder="Sayım no veya depo ara..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50"
                    />
                </div>
                
                <button 
                    onClick={() => { setSelectedCount(null); setViewOnly(false); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-500/20 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Sayım Başlat
                </button>
            </div>

            {/* List Table */}
            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : counts.length === 0 ? (
                    <div className="glass-card p-20 text-center text-secondary">
                        <ClipboardCheck className="w-16 h-16 mx-auto mb-4 opacity-10" />
                        <p className="text-xl font-bold">Henüz sayım kaydı bulunmuyor</p>
                        <p className="text-sm mt-2">Yeni bir sayım başlatarak stoklarınızı düzenleyebilirsiniz.</p>
                    </div>
                ) : (
                    counts.map((count) => (
                        <div 
                            key={count.id}
                            className="glass-card group hover:border-white/20 transition-all p-5 flex flex-col md:flex-row md:items-center justify-between gap-6"
                        >
                            <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                                    count.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                }`}>
                                    <ClipboardCheck className="w-7 h-7" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-black text-white">{count.count_no}</h3>
                                        {getStatusBadge(count.status)}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-secondary font-bold">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(count.created_at).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            {count.warehouses?.name || 'Bilinmeyen Depo'}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <User className="w-3.5 h-3.5" />
                                            {count.total_items} Kalem Ürün
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right hidden sm:block">
                                    <p className={`text-lg font-black ${
                                        count.total_difference === 0 ? 'text-white' : 
                                        count.total_difference > 0 ? 'text-blue-400' : 'text-rose-400'
                                    }`}>
                                        {count.total_difference > 0 ? '+' : ''}{count.total_difference}
                                    </p>
                                    <p className="text-[10px] text-secondary font-black uppercase tracking-widest">Toplam Fark</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {count.status === 'draft' ? (
                                        <button 
                                            onClick={() => { setSelectedCount(count); setViewOnly(false); setIsModalOpen(true); }}
                                            className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
                                            title="Düzenle"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => { setSelectedCount(count); setViewOnly(true); setIsModalOpen(true); }}
                                            className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
                                            title="Görüntüle"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleDelete(count.id)}
                                        className="p-3 bg-white/5 hover:bg-rose-500/20 text-secondary hover:text-rose-500 rounded-xl transition-all"
                                        title="Sil"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination placeholder */}
            <div className="flex items-center justify-between text-secondary pt-6">
                <p className="text-xs font-bold">Toplam {counts.length} sayım kaydı</p>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold opacity-50 cursor-not-allowed">Önceki</button>
                    <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold opacity-50 cursor-not-allowed">Sonraki</button>
                </div>
            </div>

            {/* Inventory Count Modal */}
            <InventoryCountModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchCounts}
                warehouses={warehouses}
                existingCount={selectedCount}
            />
        </div>
    );
}
