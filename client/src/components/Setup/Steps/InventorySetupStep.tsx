import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Package, ChevronRight, Barcode, Warehouse } from 'lucide-react';

export default function InventorySetupStep({ onNext, tenant, setupEmployeeId }: { onNext: () => void, tenant: any, setupEmployeeId: string | null }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [warehouseName, setWarehouseName] = useState('Ana Depo');
  const [lowStockAlert, setLowStockAlert] = useState(10);
  const [barcodeSystem, setBarcodeSystem] = useState(true);

  const handleComplete = async () => {
    if (!warehouseName) {
      setError('Lütfen bir depo adı giriniz.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // 1. Mark module setup as complete
      const { error: rpcError } = await supabase.rpc('set_tenant_module_setup', {
        p_tenant_id: tenant.id,
        p_employee_id: setupEmployeeId,
        p_module_name: 'inventory',
        p_is_completed: true
      });

      if (rpcError) throw rpcError;

      onNext();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Stok ayarları kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl h-full flex flex-col md:flex-row">
      <div className="w-full md:w-1/3 bg-slate-800/50 p-8 flex flex-col justify-center">
        <div className="space-y-6">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-2xl flex items-center justify-center mb-6">
            <Package size={32} />
          </div>
          <h3 className="font-black text-2xl text-white">JetStok Kurulumu</h3>
          <p className="text-slate-400">Ürünlerinizi takip etmek, maliyetleri yönetmek ve kayıpları önlemek için stok altyapınızı hazırlayın.</p>
        </div>
      </div>

      <div className="w-full md:w-2/3 p-8 md:p-12 flex flex-col">
        <div className="flex-1 space-y-6 animate-in fade-in">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Varsayılan Depo Adı</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Warehouse size={18} className="text-slate-500" />
                </div>
                <input 
                  type="text" 
                  value={warehouseName}
                  onChange={(e) => setWarehouseName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 text-white outline-none"
                  placeholder="Ana Depo"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Kritik Stok Uyarısı (Adet/Kg)</label>
              <input 
                type="number" 
                value={lowStockAlert}
                onChange={(e) => setLowStockAlert(Number(e.target.value))}
                min={0}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 text-white outline-none"
              />
              <p className="text-xs text-slate-500 mt-2">Stok bu seviyenin altına düştüğünde sistem uyarı verir.</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Barcode className="text-slate-400" />
                <div>
                  <h4 className="text-white font-medium">Barkod Sistemi Kullanımı</h4>
                  <p className="text-slate-500 text-sm mt-1">Ürün giriş çıkışlarında barkod okuyucu desteklenir.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={barcodeSystem} 
                  onChange={(e) => setBarcodeSystem(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="pt-8 flex justify-end">
          <button 
            onClick={handleComplete}
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl flex items-center gap-2 transition-all active:scale-95"
          >
            {loading ? 'Kaydediliyor...' : 'Kaydet ve Devam Et'}
            {!loading && <ChevronRight size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
