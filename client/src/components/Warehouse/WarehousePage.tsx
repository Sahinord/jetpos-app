"use client";

import { useState, useEffect } from 'react';
import { 
    Package, ArrowLeftRight, ClipboardCheck, Settings, 
    Plus, Search, Store, Building2, TrendingUp, AlertCircle 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/lib/tenant-context';
import WarehouseStock from './WarehouseStock';
import WarehouseDefinitions from './WarehouseDefinitions';
import TransferList from './TransferList';
import InventoryCountList from './InventoryCountList';

export default function WarehousePage({ isPriceSyncEnabled = false }: { isPriceSyncEnabled?: boolean }) {
    const { currentTenant } = useTenant();
    const [activeTab, setActiveTab] = useState<'stock' | 'transfers' | 'counts' | 'definitions'>('stock');
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentTenant) {
            fetchWarehouses();
        }
    }, [currentTenant]);

    const fetchWarehouses = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('warehouses')
            .select('*')
            .eq('tenant_id', currentTenant?.id)
            .order('is_default', { ascending: false });
        
        if (data) setWarehouses(data);
        setLoading(false);
    };

    const tabs = [
        { id: 'stock', name: 'Depo Stokları', icon: Package },
        { id: 'transfers', name: 'Transfer Fişleri', icon: ArrowLeftRight },
        { id: 'counts', name: 'Sayım İşlemleri', icon: ClipboardCheck },
        { id: 'definitions', name: 'Depo Tanımları', icon: Settings },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header / Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Depo Yönetimi</h1>
                        <p className="text-sm text-secondary">Lokasyon bazlı stok ve fiyat yönetimi</p>
                    </div>
                </div>

                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                activeTab === tab.id 
                                ? 'bg-indigo-500 text-white shadow-lg' 
                                : 'text-secondary hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Warning if no warehouse */}
            {warehouses.length === 0 && activeTab !== 'definitions' && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    <p className="text-sm text-amber-200">
                        Henüz bir depo tanımlanmamış. İşlem yapabilmek için lütfen <strong>Depo Tanımları</strong> sekmesinden bir depo ekleyin.
                    </p>
                </div>
            )}

            {/* Content */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'stock' && <WarehouseStock warehouses={warehouses} isPriceSyncEnabled={isPriceSyncEnabled} />}
                {activeTab === 'definitions' && <WarehouseDefinitions onUpdate={fetchWarehouses} />}
                {activeTab === 'transfers' && <TransferList warehouses={warehouses} />}
                {activeTab === 'counts' && <InventoryCountList warehouses={warehouses} />}
            </div>
        </div>
    );
}
