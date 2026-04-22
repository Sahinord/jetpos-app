"use client";

import { useState } from 'react';
import { Building2, Mail, Camera, Save, AlertCircle, CheckCircle2, Shield, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/lib/tenant-context';

export default function TenantProfile() {
    const { currentTenant, refreshTenants } = useTenant();
    const [companyName, setCompanyName] = useState(currentTenant?.company_name || '');
    const [contactEmail, setContactEmail] = useState(currentTenant?.contact_email || '');
    const [logoUrl, setLogoUrl] = useState(currentTenant?.logo_url || '');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${currentTenant?.id}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('tenant-logos')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('tenant-logos')
                .getPublicUrl(fileName);

            setLogoUrl(publicUrl);

            // Auto update in DB
            await supabase
                .from('tenants')
                .update({ logo_url: publicUrl })
                .eq('id', currentTenant?.id);

        } catch (err: any) {
            setError('Logo yükleme hatası: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const { error: updateError } = await supabase
                .from('tenants')
                .update({
                    company_name: companyName,
                    contact_email: contactEmail
                })
                .eq('id', currentTenant?.id);

            if (updateError) throw updateError;

            setSuccess(true);
            // Refresh context if needed (handled by refresh in tenant context)
        } catch (err: any) {
            setError('Güncelleme hatası: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Şirket Profili</h1>
                    <p className="text-slate-400 mt-2">Kimlik bilgilerinizi ve ayarlarınızı yönetin</p>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Aktif Lisans</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Logo Section */}
                <div className="lg:col-span-1">
                    <div className="glass-card p-8 text-center space-y-6">
                        <div className="relative inline-block group">
                            <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-2 border-primary/20 bg-slate-950 relative">
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Building2 className="w-12 h-12 text-slate-800" />
                                    </div>
                                )}

                                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer">
                                    <Camera className="w-8 h-8 text-white mb-1" />
                                    <span className="text-[10px] font-bold text-white uppercase">Değiştir</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={loading} />
                                </label>
                            </div>

                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                                <Save className="w-4 h-4 text-white" />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-white">Logo Ayarları</h3>
                            <p className="text-xs text-slate-500 mt-1">PNG, JPG veya WEBP (Max 5MB)</p>
                        </div>
                    </div>
                </div>

                {/* Form Section */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass-card p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Firma Adı</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-700 group-focus-within:text-primary transition-colors">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        className="w-full pl-12 pr-5 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white outline-none focus:border-primary/50 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">İletişim E-Posta</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-700 group-focus-within:text-primary transition-colors">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="email"
                                        value={contactEmail}
                                        onChange={(e) => setContactEmail(e.target.value)}
                                        className="w-full pl-12 pr-5 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white outline-none focus:border-primary/50 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                                <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                                <p className="text-xs text-rose-500 font-bold">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                <p className="text-xs text-emerald-500 font-bold">Ayarlar başarıyla kaydedildi.</p>
                            </div>
                        )}

                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="w-full py-5 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black shadow-xl shadow-primary/40 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Değişiklikleri Kaydet
                                </>
                            )}
                        </button>
                    </div>

                    {/* License Details Section */}
                    <div className="glass-card p-8 space-y-6">
                        <div className="flex items-center justify-between border-b border-white/5 pb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Lisans & Özellikler</h3>
                                    <p className="text-xs text-slate-500 tracking-wide uppercase font-black uppercase">Plan: <span className="text-primary">{currentTenant?.features?.enterprise ? 'ENTERPRISE' : (currentTenant?.features?.pro ? 'PRO' : 'BASIC')}</span></p>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span className="text-xs font-black">
                                        {currentTenant?.expires_at ? 
                                            Math.max(0, Math.ceil((new Date(currentTenant.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0
                                        } GÜN KALDI
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {[
                                { key: 'adisyon', label: 'Adisyon Sistemi' },
                                { key: 'mobile_app', label: 'Mobil Uygulama' },
                                { key: 'trendyol_go', label: 'Trendyol Entegr.' },
                                { key: 'getir', label: 'Getir Yemek' },
                                { key: 'qnb_invoice', label: 'Fatura İşlemleri (QNB)' },
                                { key: 'ai_features', label: 'AI Asistan' },
                            ].map((f) => (
                                <div key={f.key} className={`p-4 rounded-2xl border transition-all ${currentTenant?.features?.[f.key] ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/5 bg-slate-950/50 opacity-40'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        {currentTenant?.features?.[f.key] ? (
                                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                        ) : (
                                            <AlertCircle className="w-3 h-3 text-slate-600" />
                                        )}
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${currentTenant?.features?.[f.key] ? 'text-emerald-500' : 'text-slate-600'}`}>
                                            {currentTenant?.features?.[f.key] ? 'Aktif' : 'Pasif'}
                                        </span>
                                    </div>
                                    <div className="text-xs font-bold text-slate-300">{f.label}</div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl space-y-2">
                             <div className="flex items-center gap-2 text-primary">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Lisans Bilgisi</span>
                             </div>
                             <p className="text-xs text-slate-400 font-medium">Bu özellikler JetPOS Super Admin personeli tarafından yönetilmektedir. Ekstra özellik talepleriniz için <span className="text-primary font-bold">@FiveredSupport</span> ile iletişime geçebilirsiniz.</p>
                             <div className="pt-2 font-mono text-[10px] text-slate-600 flex justify-between">
                                <span>Lisans Anahtarı: {currentTenant?.license_key}</span>
                                <span>Sürüm: v2.5.0-Enterprise</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
