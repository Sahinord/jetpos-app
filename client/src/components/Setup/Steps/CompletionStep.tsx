import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CompletionStep({ onNext, tenant, setupEmployeeId }: { onNext: () => void, tenant: any, setupEmployeeId: string | null }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFinish = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Mark setup as completed in DB
      const { error: rpcError } = await supabase.rpc('complete_setup_wizard', {
        p_tenant_id: tenant.id,
        p_employee_id: setupEmployeeId
      });

      if (rpcError) throw rpcError;

      // 2. Trigger the final Next
      onNext();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Kurulum tamamlanırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const features = tenant?.features || {};
  const activeModules = Object.keys(features).filter(k => features[k] === true);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl h-full flex flex-col items-center justify-center p-8 md:p-16 text-center">
      
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-8"
      >
        <CheckCircle2 size={48} />
      </motion.div>

      <h2 className="text-3xl font-black text-white mb-4">Kurulum Tamamlandı!</h2>
      <p className="text-slate-400 text-lg mb-8 max-w-xl">
        {tenant?.name || 'İşletme'} için gerekli tüm altyapı ve satın alınan lisanslı modüller başarıyla yapılandırıldı. Artık sistemi kullanmaya hazırsınız.
      </p>

      {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm mb-6">{error}</div>}

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 w-full max-w-md mb-8 text-left">
        <h3 className="font-bold text-white mb-4 border-b border-slate-800 pb-2">Aktif Edilen Modüller</h3>
        <ul className="space-y-3">
          {activeModules.map(mod => (
            <li key={mod} className="flex items-center gap-3 text-slate-300">
              <CheckCircle2 size={16} className="text-green-500" />
              <span className="capitalize">{mod.replace('_', ' ')} Modülü</span>
            </li>
          ))}
        </ul>
      </div>

      <button 
        onClick={handleFinish}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-4 px-12 rounded-xl flex items-center gap-3 transition-all active:scale-95 text-lg"
      >
        {loading ? 'Sistem Hazırlanıyor...' : 'JetPOS\'u Başlat'}
        {!loading && <Rocket size={24} />}
      </button>

    </div>
  );
}
