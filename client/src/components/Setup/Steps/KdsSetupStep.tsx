import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MonitorPlay, ChevronRight, Check } from 'lucide-react';

export default function KdsSetupStep({ onNext, tenant, setupEmployeeId }: { onNext: () => void, tenant: any, setupEmployeeId: string | null }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [stations, setStations] = useState([
    { id: 1, name: 'Sıcak Mutfak', active: true },
    { id: 2, name: 'Soğuk & Salata', active: true },
    { id: 3, name: 'İçecek & Bar', active: false },
    { id: 4, name: 'Tatlı', active: false }
  ]);

  const toggleStation = (id: number) => {
    setStations(stations.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const handleComplete = async () => {
    const activeStations = stations.filter(s => s.active);
    if (activeStations.length === 0) {
      setError('Lütfen en az bir adet KDS istasyonu seçiniz.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Mark module setup as complete
      const { error: rpcError } = await supabase.rpc('set_tenant_module_setup', {
        p_tenant_id: tenant.id,
        p_employee_id: setupEmployeeId,
        p_module_name: 'kds',
        p_is_completed: true
      });

      if (rpcError) throw rpcError;

      onNext();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'KDS ayarları kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl h-full flex flex-col md:flex-row">
      <div className="w-full md:w-1/3 bg-slate-800/50 p-8 flex flex-col justify-center">
        <div className="space-y-6">
          <div className="w-16 h-16 bg-orange-500/20 text-orange-500 rounded-2xl flex items-center justify-center mb-6">
            <MonitorPlay size={32} />
          </div>
          <h3 className="font-black text-2xl text-white">JetKDS Kurulumu</h3>
          <p className="text-slate-400">Mutfak sipariş yönetimini hızlandırın. Hangi istasyonlar için ekran kullanacağınızı belirleyin.</p>
        </div>
      </div>

      <div className="w-full md:w-2/3 p-8 md:p-12 flex flex-col">
        <div className="flex-1 space-y-6 animate-in fade-in">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-4">Mutfak Ekranı (KDS) İstasyonları</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stations.map(station => (
                <div 
                  key={station.id}
                  onClick={() => toggleStation(station.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    station.active 
                      ? 'border-orange-500 bg-orange-500/10' 
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                  }`}
                >
                  <span className={`font-medium ${station.active ? 'text-white' : 'text-slate-400'}`}>
                    {station.name}
                  </span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    station.active ? 'bg-orange-500 text-white' : 'bg-slate-800'
                  }`}>
                    {station.active && <Check size={14} />}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-4">Daha sonra Ayarlar > JetKDS menüsünden yeni istasyonlar ekleyebilir veya kategorileri bağlayabilirsiniz.</p>
          </div>
        </div>

        <div className="pt-8 flex justify-end">
          <button 
            onClick={handleComplete}
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl flex items-center gap-2 transition-all active:scale-95"
          >
            {loading ? 'Kaydediliyor...' : 'Kaydet ve Devam Et'}
            {!loading && <ChevronRight size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
