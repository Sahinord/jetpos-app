import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Building2, User, Phone, MapPin, CheckCircle2, ChevronRight, Lock } from 'lucide-react';

export default function BusinessInfoStep({ onNext, tenant }: { onNext: (empId?: string) => void, tenant: any }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Business State
  const [businessName, setBusinessName] = useState(tenant?.name || '');
  const [phone, setPhone] = useState(tenant?.phone || '');
  const [address, setAddress] = useState(tenant?.address || '');

  // Admin State
  const [adminName, setAdminName] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [masterPassword, setMasterPassword] = useState('');

  const handleNextPart = () => {
    console.log("BusinessInfoStep: Validating business info part 1");
    if (!businessName) {
      setError('İşletme adı zorunludur.');
      return;
    }
    setError('');
    setStep(2);
    console.log("BusinessInfoStep: Proceeding to part 2 (Admin Account)");
  };

  const handleComplete = async () => {
    console.log("BusinessInfoStep: Initiating handleComplete");
    if (!adminName || !adminPin || !masterPassword) {
      setError('Lütfen yönetici adı, PIN kodu ve Ana Şifreyi giriniz.');
      return;
    }
    if (adminPin.length < 4) {
      setError('PIN kodu en az 4 haneli olmalıdır.');
      return;
    }
    if (masterPassword.length < 6) {
      setError('Ana şifre (Master Password) en az 6 karakter olmalıdır.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log("BusinessInfoStep: Calling complete_tenant_initial_setup RPC", {
        tenant_id: tenant.id,
        business_name: businessName,
        phone,
        address,
        owner_name: adminName
      });
      
      const { data, error: rpcError } = await supabase.rpc('complete_tenant_initial_setup', {
        p_tenant_id: tenant.id,
        p_business_name: businessName,
        p_phone: phone,
        p_email: '', // Optional for now
        p_address: address,
        p_owner_name: adminName,
        p_owner_pin: adminPin,
        p_tenant_password: masterPassword
      });

      if (rpcError) {
        console.error("BusinessInfoStep RPC Error:", rpcError);
        throw rpcError;
      }

      console.log("BusinessInfoStep: RPC successful. Returned employee_id:", data);
      onNext(data); // data contains the UUID of the newly created owner employee
    } catch (err: any) {
      console.error("BusinessInfoStep Exception caught:", err);
      const exactError = err.message || err.details || err.hint || JSON.stringify(err);
      setError(`Kurulum kaydedilirken hata: ${exactError}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl h-full flex flex-col md:flex-row">
      
      {/* Sidebar */}
      <div className="w-full md:w-1/3 bg-slate-800/50 p-8 flex flex-col justify-center">
        <div className="space-y-8 relative">
          <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-slate-700/50 -z-10"></div>
          
          <div className={`flex items-start gap-4 ${step === 1 ? 'opacity-100' : 'opacity-50'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${step === 1 ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'bg-green-500 text-white'}`}>
              {step > 1 ? <CheckCircle2 size={24} /> : <Building2 size={24} />}
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">İşletme Bilgileri</h3>
              <p className="text-slate-400 text-sm">Temel restoran ayarlarınız</p>
            </div>
          </div>

          <div className={`flex items-start gap-4 ${step === 2 ? 'opacity-100' : 'opacity-40'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${step === 2 ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'bg-slate-700 text-slate-400'}`}>
              <User size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Yönetici Hesabı</h3>
              <p className="text-slate-400 text-sm">İlk kullanıcı oluşturma</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full md:w-2/3 p-8 md:p-12">
        {step === 1 ? (
          <div className="space-y-6 max-w-md animate-in fade-in">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">İşletmenizi Tanıyalım</h2>
              <p className="text-slate-400">Fiş ve raporlarda görünecek temel işletme bilgilerinizi giriniz.</p>
            </div>
            
            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">İşletme Adı *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 size={18} className="text-slate-500" />
                  </div>
                  <input 
                    type="text" 
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white outline-none transition-all"
                    placeholder="Örn: Kardeşler Kasap & Izgara"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Telefon</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone size={18} className="text-slate-500" />
                  </div>
                  <input 
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white outline-none transition-all"
                    placeholder="05XX XXX XX XX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Açık Adres</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
                    <MapPin size={18} className="text-slate-500" />
                  </div>
                  <textarea 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white outline-none transition-all resize-none"
                    placeholder="Fatura ve fiş adresi..."
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                onClick={handleNextPart}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl flex items-center gap-2 transition-all active:scale-95"
              >
                Devam Et <ChevronRight size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-md animate-in slide-in-from-right-4 fade-in">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Yönetici Hesabı</h2>
              <p className="text-slate-400">Tüm yetkilere sahip olacak ilk yönetici (Owner) hesabını oluşturun.</p>
            </div>
            
            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Ad Soyad *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-slate-500" />
                  </div>
                  <input 
                    type="text" 
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white outline-none transition-all"
                    placeholder="Ad Soyad"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Giriş PIN Kodu *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-slate-500" />
                  </div>
                  <input 
                    type="password" 
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value.replace(/[^0-9]/g, ''))}
                    maxLength={6}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white outline-none transition-all font-mono tracking-[0.5em] text-lg"
                    placeholder="••••"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">PIN kodunuz günlük POS işlemlerinde kullanılır.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Sistem Ana Şifresi (Master) *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-orange-500/70" />
                  </div>
                  <input 
                    type="password" 
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white outline-none transition-all font-mono tracking-[0.2em] text-lg"
                    placeholder="••••••••"
                  />
                </div>
                <p className="text-xs text-orange-500/80 mt-2">Bu şifre sisteme "Yönetici (Patron)" olarak her yerden girmek içindir. Kesinlikle unutmayın!</p>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button 
                onClick={() => setStep(1)}
                className="text-slate-400 hover:text-white font-medium py-3 px-4 transition-colors"
                disabled={loading}
              >
                Geri Dön
              </button>
              <button 
                onClick={handleComplete}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl flex items-center gap-2 transition-all active:scale-95"
              >
                {loading ? 'Kaydediliyor...' : 'Kurulumu Tamamla'}
                {!loading && <CheckCircle2 size={18} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
