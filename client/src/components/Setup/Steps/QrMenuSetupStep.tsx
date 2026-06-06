import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { QrCode, ChevronRight, Palette, Globe } from 'lucide-react';

export default function QrMenuSetupStep({ onNext, tenant, setupEmployeeId }: { onNext: () => void, tenant: any, setupEmployeeId: string | null }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [themeColor, setThemeColor] = useState('#3b82f6'); // default blue
  const [subdomain, setSubdomain] = useState('');

  const handleComplete = async () => {
    setLoading(true);
    setError('');

    try {
      // Create a default qr_settings entry if we want, or just mark the module as complete
      
      const { error: rpcError } = await supabase.rpc('set_tenant_module_setup', {
        p_tenant_id: tenant.id,
        p_employee_id: setupEmployeeId,
        p_module_name: 'qr_menu',
        p_is_completed: true
      });

      if (rpcError) throw rpcError;

      onNext();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'QR Menü ayarları kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl h-full flex flex-col md:flex-row">
      <div className="w-full md:w-1/3 bg-slate-800/50 p-8 flex flex-col justify-center">
        <div className="space-y-6">
          <div className="w-16 h-16 bg-purple-500/20 text-purple-500 rounded-2xl flex items-center justify-center mb-6">
            <QrCode size={32} />
          </div>
          <h3 className="font-black text-2xl text-white">JetQR Kurulumu</h3>
          <p className="text-slate-400">Müşterilerinize modern ve temassız bir menü deneyimi sunmak için dijital menünüzü yapılandırın.</p>
        </div>
      </div>

      <div className="w-full md:w-2/3 p-8 md:p-12 flex flex-col">
        <div className="flex-1 space-y-6 animate-in fade-in">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">QR Menü Linki (Subdomain)</label>
              <div className="flex items-center">
                <input 
                  type="text" 
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-l-xl focus:ring-2 focus:ring-purple-500 text-white outline-none"
                  placeholder="isletme-adi"
                />
                <div className="bg-slate-800 border-y border-r border-slate-800 text-slate-400 px-4 py-3 rounded-r-xl font-medium">
                  .jetpos.shop
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Tema Rengi</label>
              <div className="flex items-center gap-4">
                <input 
                  type="color" 
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-12 h-12 rounded bg-slate-950 border border-slate-800 cursor-pointer"
                />
                <div className="flex-1 text-slate-400 text-sm">
                  Markanıza uygun ana rengi seçin. Butonlar ve başlıklar bu renkte görünecektir.
                </div>
              </div>
            </div>
            
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 flex gap-4">
              <Globe className="text-purple-400 shrink-0" />
              <p className="text-sm text-purple-200">
                Özel Alan Adı (örn: menu.firmaniz.com) bağlantısını kurulum sonrasında JetQR yönetim panelinden yapabilirsiniz.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 flex justify-end">
          <button 
            onClick={handleComplete}
            disabled={loading}
            className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl flex items-center gap-2 transition-all active:scale-95"
          >
            {loading ? 'Kaydediliyor...' : 'Kaydet ve Devam Et'}
            {!loading && <ChevronRight size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
