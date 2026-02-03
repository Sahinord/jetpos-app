"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { KeyRound, Loader } from 'lucide-react';
import { toast } from 'sonner';

interface LicenseGateProps {
    onSuccess: (tenantId: string, companyName: string) => void;
}

export default function LicenseGate({ onSuccess }: LicenseGateProps) {
    const [license, setLicense] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!license.trim()) {
            toast.error('Lütfen lisans anahtarını giriniz');
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('tenants')
                .select('id, company_name, status')
                .eq('license_key', license.trim())
                .eq('status', 'active')
                .single();

            if (error || !data) {
                toast.error('Geçersiz lisans anahtarı!');
                setLoading(false);
                return;
            }

            // Başarılı - localStorage'a kaydet
            localStorage.setItem('licenseKey', license.trim());
            localStorage.setItem('tenantId', data.id);
            localStorage.setItem('companyName', data.company_name);

            toast.success(`Hoş geldiniz, ${data.company_name}!`);
            onSuccess(data.id, data.company_name);

        } catch (error) {
            console.error('License validation error:', error);
            toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-block p-4 bg-blue-600/20 rounded-2xl mb-4">
                        <KeyRound className="w-16 h-16 text-blue-400" />
                    </div>
                    <h1 className="text-3xl font-black text-white mb-2">JetPOS Mobile</h1>
                    <p className="text-gray-400">Lisans anahtarınızı giriniz</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-300 mb-2">
                            Lisans Anahtarı
                        </label>
                        <input
                            type="text"
                            value={license}
                            onChange={(e) => setLicense(e.target.value.toUpperCase())}
                            placeholder="JET-2024-XXXX-XXXX"
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                Doğrulanıyor...
                            </>
                        ) : (
                            'Giriş Yap'
                        )}
                    </button>

                    {/* Help Text */}
                    <p className="text-xs text-gray-500 text-center mt-4">
                        Lisans anahtarınızı bilmiyorsanız, lütfen yöneticinizle iletişime geçin.
                    </p>
                </form>
            </div>
        </div>
    );
}
