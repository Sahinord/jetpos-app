import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Calculator, CheckCircle2, ChevronRight, Settings } from 'lucide-react';

export default function PosSetupStep({ onNext, tenant, setupEmployeeId }: { onNext: () => void, tenant: any, setupEmployeeId: string | null }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // POS Settings State
  const [currency, setCurrency] = useState('TRY');
  const [vatRate, setVatRate] = useState(20);
  const [fastSaleEnabled, setFastSaleEnabled] = useState(true);

  const handleComplete = async () => {
    setLoading(true);
    setError('');

    try {
      // Here you would save the actual POS settings to DB
      // await supabase.from('tenants').update({ pos_settings: { currency, vatRate, fastSaleEnabled } }).eq('id', tenant.id);
      
      // Save locally for now since existing app uses localStorage for some settings
      localStorage.setItem(`pos_settings_${tenant.id}`, JSON.stringify({ currency, vatRate, fastSaleEnabled }));

      // Mark module setup as complete
      const { error: rpcError } = await supabase.rpc('set_tenant_module_setup', {
        p_tenant_id: tenant.id,
        p_employee_id: setupEmployeeId,
        p_module_name: 'pos',
        p_is_completed: true
      });

      if (rpcError) throw rpcError;

      onNext();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'POS Ayarları kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl h-full flex flex-col md:flex-row">
      
      {/* Sidebar */}
      <div className="w-full md:w-1/3 bg-slate-800/50 p-8 flex flex-col justify-center">
        <div className="space-y-6">
          <div className="w-16 h-16 bg-blue-500/20 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
            <Calculator size={32} />
          </div>
          <h3 className="font-black text-2xl text-white">JetPOS Kurulumu</h3>
          <p className="text-slate-400">Hızlı ve güvenli satış yapmak için yazar kasa (POS) ayarlarınızı yapılandırın.</p>
        </div>
      </div>

      {/* Content */}
      <div className="w-full md:w-2/3 p-8 md:p-12 flex flex-col">
        <div className="flex-1 space-y-6 animate-in fade-in">
          
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>}

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Para Birimi</label>
                <select 
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 text-white outline-none appearance-none"
                >
                  <option value="TRY">Türk Lirası (₺)</option>
                  <option value="USD">Amerikan Doları ($)</option>
                  <option value="EUR">Euro (€)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Varsayılan KDV Oranı (%)</label>
                <select 
                  value={vatRate}
                  onChange={(e) => setVatRate(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 text-white outline-none appearance-none"
                >
                  <option value={1}>%1</option>
                  <option value={10}>%10</option>
                  <option value={20}>%20</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Hızlı Satış Modu</h4>
                <p className="text-slate-500 text-sm mt-1">Barkod okutulduğunda ürünü direkt sepete ekler.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={fastSaleEnabled} 
                  onChange={(e) => setFastSaleEnabled(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
            
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between opacity-50 cursor-not-allowed">
              <div>
                <h4 className="text-white font-medium">Fiş Yazdırma Ayarları</h4>
                <p className="text-slate-500 text-sm mt-1">Donanım bağlantısı Kurulum sonrası "Ayarlar" menüsünden yapılacaktır.</p>
              </div>
              <Settings className="text-slate-500" />
            </div>

          </div>
        </div>

        <div className="pt-8 flex justify-end">
          <button 
            onClick={handleComplete}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl flex items-center gap-2 transition-all active:scale-95"
          >
            {loading ? 'Kaydediliyor...' : 'Kaydet ve Devam Et'}
            {!loading && <ChevronRight size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
