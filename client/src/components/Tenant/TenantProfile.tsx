"use client";

import { useState, useEffect, useMemo } from 'react';
import { Building2, Mail, Camera, Save, AlertCircle, CheckCircle2, Shield, Clock, Phone, Zap, LayoutDashboard, Ticket, Globe, MessageSquareWarning, Key, Cpu, Crown, Sparkles, ChevronRight, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    const [copiedKey, setCopiedKey] = useState(false);

    const daysLeft = currentTenant?.expires_at
        ? Math.max(0, Math.ceil((new Date(currentTenant.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 0;

    const planType = currentTenant?.features?.enterprise ? 'Enterprise' : (currentTenant?.features?.pro ? 'Pro' : 'Basic');

    const daysPercent = useMemo(() => {
        if (!currentTenant?.expires_at || !currentTenant?.created_at) return 50;
        const total = new Date(currentTenant.expires_at).getTime() - new Date(currentTenant.created_at).getTime();
        const remaining = new Date(currentTenant.expires_at).getTime() - Date.now();
        return Math.max(0, Math.min(100, (remaining / total) * 100));
    }, [currentTenant]);

    const handleCopyKey = () => {
        if (currentTenant?.license_key) {
            navigator.clipboard.writeText(currentTenant.license_key);
            setCopiedKey(true);
            setTimeout(() => setCopiedKey(false), 2000);
        }
    };

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
            await supabase.from('tenants').update({ logo_url: publicUrl }).eq('id', currentTenant?.id);
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
                .update({ company_name: companyName, contact_email: contactEmail })
                .eq('id', currentTenant?.id);
            if (updateError) throw updateError;
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            if (refreshTenants) await refreshTenants();
        } catch (err: any) {
            setError('Güncelleme hatası: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const featureList = [
        { key: 'adisyon', label: 'Adisyon & Restoran', desc: 'Masa ve sipariş yönetimi', icon: LayoutDashboard, gradient: 'from-violet-500 to-indigo-600' },
        { key: 'mobile_app', label: 'Mobil Uygulama', desc: 'iOS & Android POS', icon: Phone, gradient: 'from-cyan-500 to-blue-600' },
        { key: 'trendyol_go', label: 'Trendyol Entegrasyon', desc: 'Otomatik sipariş & stok', icon: Globe, gradient: 'from-orange-500 to-red-500' },
        { key: 'getir', label: 'Getir Yemek', desc: 'Otomatik sipariş & stok', icon: Globe, gradient: 'from-purple-500 to-pink-500' },
        { key: 'qnb_invoice', label: 'E-Fatura (QNB)', desc: 'Otomatik fatura kesimi', icon: Ticket, gradient: 'from-emerald-500 to-teal-600' },
        { key: 'ai_features', label: 'Yapay Zeka Asistan', desc: 'Akıllı tahmin & analiz', icon: Zap, gradient: 'from-amber-500 to-orange-600' },
    ];

    const activeCount = featureList.filter(f => currentTenant?.features?.[f.key]).length;

    return (
        <div className="max-w-[1300px] mx-auto space-y-10 pb-16">

            {/* ═══ HERO BANNER ═══ */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative rounded-[2rem] overflow-hidden"
            >
                {/* Background layers */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0c1222] to-slate-900" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.15),transparent)]" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] -ml-20 -mb-20" />

                {/* Mesh dots overlay */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }} />

                <div className="relative z-10 px-10 py-12 flex flex-col lg:flex-row items-center gap-10">
                    {/* Logo */}
                    <div className="relative flex-shrink-0">
                        <div className="w-32 h-32 rounded-[1.75rem] bg-gradient-to-br from-primary/30 via-blue-500/30 to-violet-500/30 p-[3px] shadow-2xl shadow-primary/20">
                            <div className="w-full h-full rounded-[calc(1.75rem-3px)] bg-[#0a0f1e] overflow-hidden flex items-center justify-center relative group cursor-pointer">
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    <Building2 className="w-14 h-14 text-slate-700" />
                                )}
                                <label className="absolute inset-0 bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer">
                                    <Camera className="w-7 h-7 text-white mb-1.5" />
                                    <span className="text-[9px] font-black tracking-[0.2em] text-white/80 uppercase">Logo Değiştir</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={loading} />
                                </label>
                            </div>
                        </div>
                        <div className="absolute -bottom-1.5 -right-1.5 w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/40 border-2 border-[#0c1222]">
                            <Crown className="w-4 h-4 text-white" />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center lg:text-left space-y-4">
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight leading-none">
                                {currentTenant?.company_name || 'Şirket Adı'}
                            </h1>
                            <p className="text-slate-400 text-sm mt-2 font-medium">{currentTenant?.contact_email || 'E-posta belirtilmemiş'}</p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 border border-primary/25 text-primary text-xs font-black uppercase tracking-widest">
                                <Sparkles className="w-3.5 h-3.5" />
                                {planType} Plan
                            </span>
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                {activeCount}/{featureList.length} Modül Aktif
                            </span>
                        </div>
                    </div>

                    {/* License Timer */}
                    <div className="flex-shrink-0 w-44">
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 backdrop-blur-sm text-center space-y-3">
                            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500">Kalan Süre</p>
                            <div className="relative">
                                <svg className="w-20 h-20 mx-auto -rotate-90" viewBox="0 0 80 80">
                                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
                                    <circle
                                        cx="40" cy="40" r="34" fill="none"
                                        stroke={daysLeft > 30 ? '#10b981' : daysLeft > 7 ? '#f59e0b' : '#ef4444'}
                                        strokeWidth="6" strokeLinecap="round"
                                        strokeDasharray={`${2 * Math.PI * 34}`}
                                        strokeDashoffset={`${2 * Math.PI * 34 * (1 - daysPercent / 100)}`}
                                        className="transition-all duration-1000"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className={`text-2xl font-black tabular-nums ${daysLeft > 30 ? 'text-emerald-400' : daysLeft > 7 ? 'text-amber-400' : 'text-rose-400'}`}>
                                        {daysLeft}
                                    </span>
                                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Gün</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ═══ MAIN GRID ═══ */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

                {/* ── LEFT: Settings Form ── */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className="xl:col-span-5 space-y-6"
                >
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] rounded-3xl overflow-hidden shadow-2xl">
                        <div className="px-8 pt-8 pb-2">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/10 flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white">Firma Bilgileri</h3>
                                    <p className="text-[11px] text-slate-500">Düzenleyip kaydedin.</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 pb-8 pt-4 space-y-5">
                            {/* Company Name */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 flex items-center gap-1.5">
                                    <Building2 className="w-3 h-3" /> Firma Adı
                                </label>
                                <input
                                    type="text"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    placeholder="Şirket adınız..."
                                    className="w-full px-5 py-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl text-white text-sm font-semibold outline-none focus:border-primary/40 focus:bg-white/[0.05] transition-all placeholder:text-slate-600"
                                />
                            </div>

                            {/* Contact Email */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 flex items-center gap-1.5">
                                    <Mail className="w-3 h-3" /> İletişim E-Posta
                                </label>
                                <input
                                    type="email"
                                    value={contactEmail}
                                    onChange={(e) => setContactEmail(e.target.value)}
                                    placeholder="ornek@sirket.com"
                                    className="w-full px-5 py-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl text-white text-sm font-semibold outline-none focus:border-primary/40 focus:bg-white/[0.05] transition-all placeholder:text-slate-600"
                                />
                            </div>

                            {/* Alerts */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                        className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/15 rounded-2xl">
                                        <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                                        <p className="text-xs text-rose-300 font-bold">{error}</p>
                                    </motion.div>
                                )}
                                {success && (
                                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                        className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/15 rounded-2xl">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                        <p className="text-xs text-emerald-300 font-bold">Başarıyla güncellendi!</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Save Button */}
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-primary to-blue-600 hover:brightness-110 text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2.5 group"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-4.5 h-4.5 group-hover:rotate-12 transition-transform" />
                                        DEĞİŞİKLİKLERİ KAYDET
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* License Key Card */}
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] rounded-3xl p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/10 flex items-center justify-center">
                                <Key className="w-5 h-5 text-violet-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white">Lisans Anahtarı</h3>
                                <p className="text-[10px] text-slate-500">Kopyalamak için tıklayın.</p>
                            </div>
                        </div>

                        <button
                            onClick={handleCopyKey}
                            className="w-full flex items-center justify-between px-5 py-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] rounded-2xl transition-all group"
                        >
                            <code className="text-sm font-mono font-bold text-slate-300 tracking-wide select-all">
                                {currentTenant?.license_key || '—'}
                            </code>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${copiedKey ? 'bg-emerald-500/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                                {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-500" />}
                            </div>
                        </button>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl px-4 py-3">
                                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Plan</p>
                                <p className="text-sm font-black text-white mt-0.5">{planType}</p>
                            </div>
                            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl px-4 py-3">
                                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Sürüm</p>
                                <p className="text-sm font-black text-white mt-0.5">v2.7.0</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── RIGHT: Modules ── */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                    className="xl:col-span-7 space-y-6"
                >
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] rounded-3xl overflow-hidden shadow-2xl">
                        <div className="px-8 pt-8 pb-2 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 border border-primary/15 flex items-center justify-center">
                                    <Cpu className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white">Sistem Modülleri</h3>
                                    <p className="text-[11px] text-slate-500">Lisansınıza tanımlı özellikler</p>
                                </div>
                            </div>
                            <div className="px-3.5 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-full">
                                <span className="text-[10px] font-black text-slate-400">{activeCount}/{featureList.length} AKTİF</span>
                            </div>
                        </div>

                        <div className="p-8 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {featureList.map((f, i) => {
                                const isActive = currentTenant?.features?.[f.key];
                                return (
                                    <motion.div
                                        key={f.key}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 + i * 0.06 }}
                                        className={`relative group rounded-2xl border p-5 transition-all duration-300 overflow-hidden
                                            ${isActive
                                                ? 'bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.04]'
                                                : 'bg-black/10 border-white/[0.03] opacity-40 hover:opacity-60'
                                            }`}
                                    >
                                        {/* Glow on hover */}
                                        {isActive && (
                                            <div className={`absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-br ${f.gradient} rounded-full blur-[60px] opacity-0 group-hover:opacity-15 transition-opacity duration-500`} />
                                        )}

                                        <div className="relative z-10 flex items-start gap-4">
                                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? `bg-gradient-to-br ${f.gradient} shadow-lg` : 'bg-white/[0.04]'}`}>
                                                <f.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-600'}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h4 className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-slate-500'}`}>
                                                        {f.label}
                                                    </h4>
                                                    {isActive && (
                                                        <span className="flex-shrink-0 w-5 h-5 rounded-md bg-emerald-500/15 flex items-center justify-center">
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={`text-[11px] mt-0.5 ${isActive ? 'text-slate-500' : 'text-slate-600'}`}>
                                                    {isActive ? f.desc : 'Pakete dahil değil'}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Support CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="relative rounded-3xl overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-violet-600/15 to-purple-600/20" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_60%)]" />
                        <div className="absolute inset-0 border border-indigo-500/15 rounded-3xl" />

                        <div className="relative z-10 px-8 py-8 flex flex-col sm:flex-row items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/30 flex-shrink-0 group-hover:scale-105 transition-transform">
                                <MessageSquareWarning className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <h3 className="text-lg font-black text-white tracking-tight">Paketinizi Yükseltin</h3>
                                <p className="text-sm text-indigo-200/60 mt-1 leading-relaxed">
                                    Modüller JetPOS yönetim ekibi tarafından kontrol edilir. Yeni özellik açtırmak veya plan yükseltmek için destek ekibimize ulaşın.
                                </p>
                            </div>
                            <div className="flex-shrink-0">
                                <div className="px-5 py-3 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-xl text-sm font-black text-white transition-all flex items-center gap-2 cursor-default">
                                    <Shield className="w-4 h-4 text-indigo-400" />
                                    Destek Merkezi
                                    <ChevronRight className="w-4 h-4 text-slate-500" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

            </div>
        </div>
    );
}
