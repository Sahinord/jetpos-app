"use client";

import { useState, useEffect } from 'react';
import { KeyRound, Sparkles, AlertCircle, Building2, Upload, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LicenseGate({ onSuccess }: { onSuccess: () => void }) {
    const [step, setStep] = useState<'license' | 'password' | 'register'>('license');
    const [licenseKey, setLicenseKey] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [tenantData, setTenantData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Registration fields
    const [companyName, setCompanyName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    // Check saved license and auto-login on mount
    useEffect(() => {
        const savedLicense = localStorage.getItem('savedLicense');

        if (savedLicense) {
            // Lisans kayıtlı
            setLicenseKey(savedLicense);

            // Beni hatırla kontrolü
            const savedExpiry = localStorage.getItem('savedExpiry');
            if (savedExpiry) {
                const expiryDate = new Date(savedExpiry);
                if (expiryDate > new Date()) {
                    // Hala geçerli - otomatik giriş
                    handleAutoLogin(savedLicense);
                    return;
                }
            }

            // Beni hatırla yok veya süresi dolmuş - şifre sor
            checkLicenseAndAskPassword(savedLicense);
        } else {
            // Lisans yok - lisans sor
            setStep('license');
        }
    }, []);

    const checkLicenseAndAskPassword = async (license: string) => {
        setLoading(true);
        try {
            const { data, error: fetchError } = await supabase
                .from('tenants')
                .select('*')
                .eq('license_key', license)
                .eq('status', 'active')
                .single();

            if (fetchError || !data) {
                // Geçersiz lisans - temizle ve lisans sor
                localStorage.removeItem('savedLicense');
                setLicenseKey('');
                setStep('license');
                setLoading(false);
                return;
            }

            setTenantData(data);

            if (data.company_name && data.company_name.trim()) {
                // Kayıtlı - şifre sor
                setStep('password');
            } else {
                // Kayıt yok - kayıt yap
                setStep('register');
            }
        } catch {
            setStep('license');
        } finally {
            setLoading(false);
        }
    };
    const handleAutoLogin = async (license: string) => {
        setLoading(true);
        try {
            const { data, error: fetchError } = await supabase
                .from('tenants')
                .select('*')
                .eq('license_key', license)
                .eq('status', 'active')
                .single();

            if (!fetchError && data) {
                localStorage.setItem('licenseKey', license);
                localStorage.setItem('currentTenantId', data.id);
                onSuccess();
            } else {
                localStorage.removeItem('savedLicense');
                localStorage.removeItem('savedExpiry');
                setStep('license');
            }
        } catch {
            setStep('license');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckLicense = async () => {
        if (!licenseKey.trim()) {
            setError('Lütfen lisans anahtarınızı girin!');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { data, error: fetchError } = await supabase
                .from('tenants')
                .select('*')
                .eq('license_key', licenseKey)
                .eq('status', 'active')
                .single();

            if (fetchError || !data) {
                setError('❌ Geçersiz veya pasif lisans anahtarı!');
                setLicenseKey('');
                setLoading(false);
                return;
            }

            setTenantData(data);

            // Lisansı kalıcı olarak kaydet
            localStorage.setItem('savedLicense', licenseKey);

            // Check if registered
            if (data.company_name && data.company_name.trim()) {
                // Registered - ask password
                setStep('password');
                setLoading(false);
            } else {
                // Not registered - show registration
                setStep('register');
                setLoading(false);
            }

        } catch (err: any) {
            setError('Bir hata oluştu: ' + err.message);
            setLoading(false);
        }
    };

    const handlePasswordLogin = async () => {
        if (!password.trim()) {
            setError('Lütfen şifrenizi girin!');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Check password
            if (tenantData.password !== password) {
                setError('❌ Hatalı şifre!');
                setPassword('');
                setLoading(false);
                return;
            }

            // Password correct - login
            localStorage.setItem('licenseKey', licenseKey);
            localStorage.setItem('currentTenantId', tenantData.id);

            // Remember me
            if (rememberMe) {
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 30); // 30 gün
                localStorage.setItem('savedLicense', licenseKey);
                localStorage.setItem('savedExpiry', expiryDate.toISOString());
            }

            onSuccess();
        } catch (err: any) {
            setError('Bir hata oluştu: ' + err.message);
            setLoading(false);
        }
    };

    const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Lütfen bir resim dosyası seçin!');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('Dosya boyutu 5MB\'dan küçük olmalı!');
            return;
        }

        setLogoFile(file);
        const preview = URL.createObjectURL(file);
        setLogoPreview(preview);
    };

    const handleRegister = async () => {
        if (!companyName.trim()) {
            setError('Firma adı zorunludur!');
            return;
        }

        if (!password.trim()) {
            setError('Lütfen bir şifre belirleyin!');
            return;
        }

        setLoading(true);
        setError('');

        try {
            let logoUrl = null;

            if (logoFile) {
                try {
                    const fileExt = logoFile.name.split('.').pop();
                    const fileName = `${licenseKey}-${Date.now()}.${fileExt}`;

                    const { error: uploadError } = await supabase.storage
                        .from('tenant-logos')
                        .upload(fileName, logoFile);

                    if (!uploadError) {
                        const { data: { publicUrl } } = supabase.storage
                            .from('tenant-logos')
                            .getPublicUrl(fileName);

                        logoUrl = publicUrl;
                    }
                } catch (logoErr) {
                    console.warn('Logo upload error:', logoErr);
                }
            }

            // Update tenant
            const { error } = await supabase
                .from('tenants')
                .update({
                    company_name: companyName,
                    contact_email: contactEmail,
                    logo_url: logoUrl,
                    password: password
                })
                .eq('id', tenantData.id);

            if (error) throw error;

            // Create admin user
            await supabase.from('users').insert([{
                tenant_id: tenantData.id,
                username: 'admin',
                email: contactEmail,
                role: 'admin'
            }]);

            // Lisansı kalıcı kaydet
            localStorage.setItem('savedLicense', licenseKey);
            localStorage.setItem('licenseKey', licenseKey);
            localStorage.setItem('currentTenantId', tenantData.id);

            if (rememberMe) {
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 30);
                localStorage.setItem('savedExpiry', expiryDate.toISOString());
            }

            onSuccess();

        } catch (err: any) {
            setError('Kayıt hatası: ' + err.message);
            setLoading(false);
        }
    };

    if (loading && step === 'license' && licenseKey) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <div className="text-center space-y-6">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
                    <p className="text-white font-bold text-xl tracking-tight">Bağlanıyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Ultra Premium Gradient Background */}
            <div className="absolute inset-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)]" />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Branding Without Icon */}
                <div className="text-center mb-10">
                    <h1 className="text-6xl font-black text-white tracking-tighter mb-2">
                        Jet<span className="text-blue-500">Pos</span>
                    </h1>
                    <p className="text-blue-200/50 text-sm font-bold uppercase tracking-[0.2em]">Hızlı • Güvenilir • Akıllı</p>
                </div>

                {/* Main Card with Premium Styles */}
                <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
                    <div className="p-8">
                        {step === 'license' ? (
                            /* License Entry */
                            <div className="space-y-8">
                                <div className="text-center space-y-2">
                                    <h2 className="text-3xl font-bold text-white tracking-tight">Hoş Geldiniz</h2>
                                    <p className="text-slate-400">Lisans anahtarınızı girerek başlayın</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="relative group">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-300"></div>
                                        <input
                                            type="text"
                                            value={licenseKey}
                                            onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                                            onKeyPress={(e) => e.key === 'Enter' && handleCheckLicense()}
                                            placeholder="XXXX-XXXX-XXXX"
                                            className="relative w-full px-6 py-5 bg-slate-950 border-none rounded-2xl text-white text-center text-xl font-mono placeholder:text-slate-700 outline-none transition-all"
                                            disabled={loading}
                                            autoFocus
                                        />
                                    </div>

                                    {error && (
                                        <div className="flex items-center gap-3 px-5 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl animate-shake">
                                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                            <p className="text-sm font-medium text-red-400">{error}</p>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleCheckLicense}
                                        disabled={loading || !licenseKey.trim()}
                                        className="relative w-full group overflow-hidden rounded-2xl p-[1px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-lg disabled:opacity-50"
                                    >
                                        <div className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#3b82f6_0%,#6366f1_50%,#3b82f6_100%)]" />
                                        <div className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-2xl bg-slate-950 px-8 py-4 text-white backdrop-blur-3xl group-hover:bg-slate-900 transition-all">
                                            {loading ? 'Kontrol Ediliyor...' : 'Devam Et'}
                                        </div>
                                    </button>
                                </div>
                            </div>
                        ) : step === 'password' ? (
                            /* Password Entry */
                            <div className="space-y-8">
                                <div className="text-center space-y-2">
                                    <h2 className="text-3xl font-bold text-white tracking-tight">Doğrulama</h2>
                                    <p className="text-slate-400">{tenantData?.company_name || 'Şifrenizi girin'}</p>
                                </div>

                                <div className="space-y-6">
                                    {/* License Badge */}
                                    <div className="bg-slate-950/50 border border-white/5 rounded-2xl px-4 py-2 text-center">
                                        <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase block mb-1">✓ BU BİLGİSAYARA TANIMLI LİSANS</span>
                                        <span className="text-blue-400 font-mono text-sm tracking-wider">{licenseKey}</span>
                                    </div>

                                    {/* Password */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Şifre</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handlePasswordLogin()}
                                            placeholder="••••••••"
                                            className="w-full px-6 py-5 bg-slate-950 border border-white/5 rounded-2xl text-white text-center text-xl placeholder:text-slate-800 outline-none focus:border-blue-500/50 transition-all"
                                            disabled={loading}
                                            autoFocus
                                        />
                                    </div>

                                    {/* Remember Me */}
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={rememberMe}
                                                onChange={(e) => setRememberMe(e.target.checked)}
                                                className="peer hidden"
                                            />
                                            <div className="w-5 h-5 border-2 border-slate-700 rounded transition-all peer-checked:bg-blue-600 peer-checked:border-blue-600 group-hover:border-slate-500" />
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-0 peer-checked:scale-100 transition-all text-white">
                                                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current font-bold" stroke="currentColor" strokeWidth="4"><path d="M20 6L9 17L4 12" fill="none" /></svg>
                                            </div>
                                        </div>
                                        <span className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
                                            Bu cihazda oturumu açık tut (Otomatik Giriş)
                                        </span>
                                    </label>

                                    {error && (
                                        <div className="flex items-center gap-3 px-5 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                            <p className="text-sm font-medium text-red-400">{error}</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <button
                                            onClick={() => {
                                                setStep('license');
                                                setPassword('');
                                                setError('');
                                            }}
                                            className="px-6 py-4 bg-slate-800/50 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all border border-white/5"
                                            disabled={loading}
                                        >
                                            Geri
                                        </button>

                                        <button
                                            onClick={handlePasswordLogin}
                                            disabled={loading || !password.trim()}
                                            className="px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20"
                                        >
                                            {loading ? 'Giriş...' : 'Giriş Yap'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Registration Form - Fixed Scrolling and Layout */
                            <div className="space-y-8 max-h-[75vh] overflow-y-auto px-1 custom-scrollbar">
                                <div className="text-center space-y-2">
                                    <h2 className="text-3xl font-bold text-white tracking-tight">Tanıtım! 🎉</h2>
                                    <p className="text-slate-400">Hedeflerine ulaşman için son adım</p>
                                </div>

                                <div className="space-y-6">
                                    {/* License Note */}
                                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl px-6 py-4">
                                        <p className="text-xs font-bold text-blue-400/60 uppercase tracking-widest mb-1">Kaydedilecek Lisans</p>
                                        <p className="text-blue-400 font-mono text-lg">{licenseKey}</p>
                                    </div>

                                    {/* Company Name */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Firma Adı</label>
                                        <input
                                            type="text"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            placeholder="Örn: JetPos Mağazası"
                                            className="w-full px-6 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white placeholder:text-slate-800 outline-none focus:border-blue-500/50 transition-all"
                                            disabled={loading}
                                        />
                                    </div>

                                    {/* Password */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Pin / Şifre</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full px-6 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white placeholder:text-slate-800 outline-none focus:border-blue-500/50 transition-all"
                                            disabled={loading}
                                        />
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">E-Posta (Opsiyonel)</label>
                                        <input
                                            type="email"
                                            value={contactEmail}
                                            onChange={(e) => setContactEmail(e.target.value)}
                                            placeholder="info@jetpos.com"
                                            className="w-full px-6 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white placeholder:text-slate-800 outline-none focus:border-blue-500/50 transition-all"
                                            disabled={loading}
                                        />
                                    </div>

                                    {/* Logo */}
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Firma Logosu</label>
                                        <div className="flex items-center gap-4">
                                            {logoPreview ? (
                                                <div className="relative group/logo">
                                                    <img src={logoPreview} alt="Logo" className="w-20 h-20 rounded-2xl object-cover border border-white/10" />
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/logo:opacity-100 transition-all rounded-2xl flex items-center justify-center">
                                                        <label className="cursor-pointer font-bold text-[10px] text-white">Değiştir</label>
                                                        <input type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" disabled={loading} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <label className="w-20 h-20 bg-slate-950 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center group cursor-pointer hover:border-blue-500/50 hover:bg-slate-900 transition-all">
                                                    <Upload className="w-6 h-6 text-slate-700 group-hover:text-blue-500 transition-colors" />
                                                    <input type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" disabled={loading} />
                                                </label>
                                            )}
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm font-bold text-white">Logo Yükle</p>
                                                <p className="text-[10px] text-slate-500">Maksimum 5MB. PNG, JPG veya WEBP.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Remember Me Toggle */}
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={rememberMe}
                                                onChange={(e) => setRememberMe(e.target.checked)}
                                                className="peer hidden"
                                            />
                                            <div className="w-5 h-5 border-2 border-slate-700 rounded transition-all peer-checked:bg-blue-600 peer-checked:border-blue-600 group-hover:border-slate-500" />
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-0 peer-checked:scale-100 transition-all text-white">
                                                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current font-bold" stroke="currentColor" strokeWidth="4"><path d="M20 6L9 17L4 12" fill="none" /></svg>
                                            </div>
                                        </div>
                                        <span className="text-sm font-medium text-slate-400">Beni hatırla</span>
                                    </label>

                                    {error && (
                                        <div className="flex items-center gap-3 px-5 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                            <p className="text-sm font-medium text-red-400">{error}</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 pt-4 sticky shadow-[0_-20px_20px_-10px_rgba(15,23,42,1)]">
                                        <button
                                            onClick={() => {
                                                setStep('license');
                                                setError('');
                                            }}
                                            className="px-6 py-4 bg-slate-800/50 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all border border-white/5"
                                            disabled={loading}
                                        >
                                            Geri
                                        </button>

                                        <button
                                            onClick={handleRegister}
                                            disabled={loading || !companyName.trim() || !password.trim()}
                                            className="px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20"
                                        >
                                            {loading ? 'Kaydoluyor...' : 'Hadi Başlayalım!'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Credits */}
                <div className="text-center mt-10">
                    <p className="text-slate-600 font-bold text-[10px] uppercase tracking-[0.3em]">
                        JetPos v{process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'} — 2026
                    </p>
                </div>
            </div>

            <style jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                    20%, 40%, 60%, 80% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div>
    );
}
