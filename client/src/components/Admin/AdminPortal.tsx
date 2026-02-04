"use client";

import { useState, useEffect } from "react";
import {
    Key,
    Users,
    ShieldCheck,
    Plus,
    Trash2,
    Search,
    RefreshCw,
    X,
    Lock,
    Unlock,
    Activity,
    Calendar,
    ArrowRight,
    Sparkles,
    Edit3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function AdminPortal({ showToast }: any) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [licenses, setLicenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newLicense, setNewLicense] = useState({
        client_name: "",
        license_key: `KARDESLER-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${new Date().getFullYear()}`,
        expires_in_days: 365,
        gemini_api_key: "",
        gemini_quota_limit: 1500
    });
    const [editingLicense, setEditingLicense] = useState<any>(null);

    const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD; // Configured in .env.local

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
            fetchLicenses();
            showToast("Admin girişi başarılı", "success");
        } else {
            showToast("Hatalı admin şifresi!", "error");
        }
    };

    const fetchLicenses = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('licenses')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setLicenses(data || []);
        } catch (error: any) {
            showToast(error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLicense = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const expires_at = new Date();
            expires_at.setDate(expires_at.getDate() + newLicense.expires_in_days);

            const { error } = await supabase.from('licenses').insert([{
                client_name: newLicense.client_name,
                license_key: newLicense.license_key.trim().toUpperCase(),
                expires_at: expires_at.toISOString(),
                is_active: true,
                gemini_api_key: newLicense.gemini_api_key,
                gemini_quota_limit: newLicense.gemini_quota_limit
            }]);

            if (error) throw error;

            showToast("Lisans başarıyla oluşturuldu", "success");
            setIsAddModalOpen(false);
            setNewLicense({
                client_name: "",
                license_key: `KARDESLER-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${new Date().getFullYear()}`,
                expires_in_days: 365,
                gemini_api_key: "",
                gemini_quota_limit: 1500
            });
            fetchLicenses();
        } catch (error: any) {
            showToast(error.message, "error");
        }
    };

    const toggleLicense = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('licenses')
                .update({ is_active: !currentStatus })
                .eq('id', id);
            if (error) throw error;
            fetchLicenses();
            showToast("Lisans durumu güncellendi", "success");
        } catch (error: any) {
            showToast(error.message, "error");
        }
    };

    const handleUpdateGemini = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('licenses')
                .update({
                    gemini_api_key: editingLicense.gemini_api_key,
                    gemini_quota_limit: editingLicense.gemini_quota_limit
                })
                .eq('id', editingLicense.id);

            if (error) throw error;

            showToast("Gemini ayarları güncellendi", "success");
            setEditingLicense(null);
            fetchLicenses();
        } catch (error: any) {
            showToast(error.message, "error");
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card max-w-md w-full !p-12 text-center"
                >
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
                        <Lock className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight mb-4">Admin Erişimi</h2>
                    <p className="text-secondary mb-8 text-sm">Lisans yönetim panelini açmak için ana şifreyi girin.</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="password"
                            placeholder="Admin Şifresi"
                            className="w-full bg-white/5 border border-border rounded-xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary transition-all font-bold text-center tracking-[4px]"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-xl font-bold shadow-xl shadow-primary/30 transition-all uppercase tracking-widest"
                        >
                            Giriş Yap
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
                <div>
                    <div className="flex items-center space-x-2 text-primary font-semibold text-[10px] mb-3">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="tracking-[3px] uppercase">Merkezi Lisans Yönetimi</span>
                    </div>
                    <h2 className="text-4xl font-bold tracking-tight text-white">Yönetim Paneli</h2>
                    <p className="text-secondary mt-2 text-sm font-medium opacity-70">Aktif lisansları izleyin ve yeni yetkilendirmeler oluşturun.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center space-x-3 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-primary/30 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Yeni Lisans Oluştur</span>
                    </button>
                    <button
                        onClick={fetchLicenses}
                        className="p-4 bg-card border border-border rounded-2xl hover:bg-white/5 transition-all text-secondary"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-secondary uppercase tracking-widest">Toplam Lisans</p>
                            <h4 className="text-3xl font-bold text-white">{licenses.length}</h4>
                        </div>
                    </div>
                </div>
                <div className="glass-card font-semibold">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-secondary uppercase tracking-widest">Aktif Kullanıcılar</p>
                            <h4 className="text-3xl font-bold text-white">{licenses.filter(l => l.is_active).length}</h4>
                        </div>
                    </div>
                </div>
                <div className="glass-card">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400">
                            <Lock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-secondary uppercase tracking-widest">Bloklananlar</p>
                            <h4 className="text-3xl font-bold text-white">{licenses.filter(l => !l.is_active).length}</h4>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card !p-0 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-border">
                        <tr>
                            <th className="px-8 py-5 text-[10px] font-bold text-secondary uppercase tracking-[2px]">Müşteri / Firma</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-secondary uppercase tracking-[2px]">Lisans Anahtarı</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-secondary uppercase tracking-[2px]">Durum</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-secondary uppercase tracking-[2px]">Bitiş Tarihi</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-secondary uppercase tracking-[2px]">Gemini AI</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-secondary uppercase tracking-[2px] text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {licenses.map((lic) => (
                            <tr key={lic.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-8 py-5">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-white group-hover:text-primary transition-colors">{lic.client_name}</span>
                                        <span className="text-xs text-secondary opacity-50">{lic.username || 'Henüz Aktive Edilmedi'}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <code className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-xs font-mono text-primary font-bold">
                                        {lic.license_key}
                                    </code>
                                </td>
                                <td className="px-8 py-5">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${lic.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full mr-2 ${lic.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                        {lic.is_active ? 'Aktif' : 'Pasif'}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-sm text-secondary font-medium">
                                    <div className="flex items-center">
                                        <Calendar className="w-4 h-4 mr-2 opacity-30" />
                                        {new Date(lic.expires_at).toLocaleDateString('tr-TR')}
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${lic.gemini_api_key ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-secondary opacity-30'}`}>
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        {lic.gemini_api_key && (
                                            <div className="text-[10px] font-bold">
                                                <div className="text-secondary opacity-50 lowercase">{lic.gemini_quota_used}/{lic.gemini_quota_limit}</div>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => setEditingLicense(lic)}
                                            className="p-3 bg-white/5 hover:bg-white/10 text-secondary rounded-xl transition-all"
                                            title="AI Ayarlarını Düzenle"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => toggleLicense(lic.id, lic.is_active)}
                                            className={`p-3 rounded-xl transition-all active:scale-95 ${lic.is_active ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white'}`}
                                        >
                                            {lic.is_active ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create License Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg glass-card !p-10 shadow-3xl border-white/10"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-3xl font-bold tracking-tight uppercase">Yeni Lisans Tanımla</h3>
                                    <p className="text-secondary text-sm mt-1">Müşteri ve süre bilgilerini girin.</p>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl text-secondary transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateLicense} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-secondary uppercase tracking-[2px]">Firma / Müşteri Adı</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-semibold"
                                        placeholder="Örn: Kardeşler Kasap Şube-2"
                                        value={newLicense.client_name}
                                        onChange={(e) => setNewLicense({ ...newLicense, client_name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-secondary uppercase tracking-[2px]">Lisans Anahtarı (Otomatik)</label>
                                    <div className="flex gap-2">
                                        <input
                                            required
                                            type="text"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono font-bold text-primary"
                                            value={newLicense.license_key}
                                            onChange={(e) => setNewLicense({ ...newLicense, license_key: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setNewLicense({ ...newLicense, license_key: `KARDESLER-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${new Date().getFullYear()}` })}
                                            className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
                                        >
                                            <RefreshCw className="w-5 h-5 text-secondary" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-secondary uppercase tracking-[2px]">Lisans Süresi (Gün)</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-semibold appearance-none"
                                        value={newLicense.expires_in_days}
                                        onChange={(e) => setNewLicense({ ...newLicense, expires_in_days: parseInt(e.target.value) })}
                                    >
                                        <option value={30}>30 Gün (1 Ay)</option>
                                        <option value={90}>90 Gün (3 Ay)</option>
                                        <option value={180}>180 Gün (6 Ay)</option>
                                        <option value={365}>365 Gün (1 Yıl)</option>
                                        <option value={10000}>Ömür Boyu (Limitsiz)</option>
                                    </select>
                                </div>

                                <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 space-y-4">
                                    <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-wider">
                                        <Sparkles className="w-4 h-4" />
                                        Gemini AI Ayarları
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary uppercase tracking-[2px]">Gemini API Key</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono text-xs"
                                            placeholder="AIza..."
                                            value={newLicense.gemini_api_key}
                                            onChange={(e) => setNewLicense({ ...newLicense, gemini_api_key: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary uppercase tracking-[2px]">Günlük Kota</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold"
                                            value={newLicense.gemini_quota_limit}
                                            onChange={(e) => setNewLicense({ ...newLicense, gemini_quota_limit: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-primary hover:bg-primary/90 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-primary/30 transition-all active:scale-[0.98] mt-4"
                                >
                                    LİSANSI ONAYLA VE KAYDET
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit Gemini Settings Modal */}
            <AnimatePresence>
                {editingLicense && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setEditingLicense(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg glass-card !p-10 shadow-3xl border-white/10"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1">
                                        <Sparkles className="w-4 h-4" />
                                        AI AYARLARI
                                    </div>
                                    <h3 className="text-3xl font-bold tracking-tight">{editingLicense.client_name}</h3>
                                </div>
                                <button onClick={() => setEditingLicense(null)} className="p-3 hover:bg-white/10 rounded-2xl text-secondary transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateGemini} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-secondary uppercase tracking-[2px]">Gemini API Key</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono text-xs"
                                        placeholder="AIza..."
                                        value={editingLicense.gemini_api_key || ""}
                                        onChange={(e) => setEditingLicense({ ...editingLicense, gemini_api_key: e.target.value })}
                                    />
                                    <p className="text-[10px] text-secondary opacity-50 px-2">Bu lisansın AI fatura analizi yapabilmesi için gerekli olan Google Gemini API anahtarı.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-secondary uppercase tracking-[2px]">Günlük İstek Kotası</label>
                                    <input
                                        type="number"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold"
                                        value={editingLicense.gemini_quota_limit || 1500}
                                        onChange={(e) => setEditingLicense({ ...editingLicense, gemini_quota_limit: parseInt(e.target.value) })}
                                    />
                                    <p className="text-[10px] text-secondary opacity-50 px-2 text-right">Şu anki kullanım: {editingLicense.gemini_quota_used || 0} / {editingLicense.gemini_quota_limit || 1500}</p>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-primary hover:bg-primary/90 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-primary/30 transition-all mt-4"
                                >
                                    AYARLARI GÜNCELLE
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
