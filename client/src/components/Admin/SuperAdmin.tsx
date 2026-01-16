"use client";

import { useState, useEffect } from 'react';
import { Building2, Key, Check, X, Save, Edit, Trash2, Plus, MessageSquare, Bell, LifeBuoy, Send, User, Trash, Sparkles, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Tenant {
    id: string;
    license_key: string;
    company_name: string;
    logo_url: string | null;
    status: string;
    contact_email: string | null;
    features: any;
    created_at: string;
}

const AVAILABLE_FEATURES = [
    { id: 'pos', label: 'Hızlı Satış (POS)' },
    { id: 'products', label: 'Ürün Yönetimi' },
    { id: 'sales_history', label: 'Satış Geçmişi' },
    { id: 'profit_calculator', label: 'Kâr Hesaplama' },
    { id: 'price_simulator', label: 'Fiyat Simülasyonu' },
    { id: 'reports', label: 'Akıllı Raporlar' },
    { id: 'cari_hesap', label: 'Cari Hesap Takibi' },
    { id: 'trendyol_go', label: 'Trendyol GO' },
    { id: 'invoice', label: 'E-Fatura' },
];

export default function SuperAdmin() {
    const [activeTab, setActiveTab] = useState<'tenants' | 'tickets' | 'notifications'>('tenants');
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [tickets, setTickets] = useState<any[]>([]);
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Notification states
    const [notifTitle, setNotifTitle] = useState('');
    const [notifMessage, setNotifMessage] = useState('');
    const [notifTarget, setNotifTarget] = useState<'all' | string>('all');
    const [notifType, setNotifType] = useState('info');

    // Password change states
    const [passwordModal, setPasswordModal] = useState<{ tenantId: string; tenantName: string } | null>(null);
    const [newPassword, setNewPassword] = useState('');

    // Cross-database grouping states
    const [groupModal, setGroupModal] = useState<{ tenantId: string; tenantName: string } | null>(null);
    const [selectedGroupTenants, setSelectedGroupTenants] = useState<string[]>([]);

    // AI Key states
    const [aiModal, setAiModal] = useState<{ tenantId: string; tenantName: string; currentKey: string } | null>(null);
    const [tenantAiKey, setTenantAiKey] = useState('');

    // QNB states
    const [qnbModal, setQnbModal] = useState<{ tenantId: string; tenantName: string } | null>(null);
    const [qnbSettings, setQnbSettings] = useState({ vkn: '', username: '', password: '', isTest: true });

    useEffect(() => {
        if (activeTab === 'tenants') fetchTenants();
        if (activeTab === 'tickets') fetchTickets();
    }, [activeTab]);

    const fetchTenants = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tenants')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTenants(data || []);
        } catch (err: any) {
            alert('Hata: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('support_tickets')
                .select('*, tenants(company_name, license_key)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTickets(data || []);
        } catch (err: any) {
            alert('Hata: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const sendNotification = async () => {
        if (!notifTitle || !notifMessage) return alert('Başlık ve mesaj girin!');

        setSaving(true);
        try {
            const { error } = await supabase
                .from('notifications')
                .insert([{
                    title: notifTitle,
                    message: notifMessage,
                    type: notifType,
                    tenant_id: notifTarget === 'all' ? null : notifTarget
                }]);

            if (error) throw error;

            alert('✅ Bildirim başarıyla gönderildi!');
            setNotifTitle('');
            setNotifMessage('');
        } catch (err: any) {
            alert('❌ Hata: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const deleteTicket = async (id: string) => {
        if (!confirm('Bu talebi silmek istediğinize emin misiniz?')) return;
        await supabase.from('support_tickets').delete().eq('id', id);
        setTickets(prev => prev.filter(t => t.id !== id));
    };

    const updateTicketStatus = async (id: string, status: string) => {
        await supabase.from('support_tickets').update({ status }).eq('id', id);
        setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    };

    const toggleFeature = (featureId: string) => {
        if (!editingTenant) return;

        setEditingTenant({
            ...editingTenant,
            features: {
                ...editingTenant.features,
                [featureId]: !editingTenant.features?.[featureId]
            }
        });
    };

    const handleSave = async () => {
        if (!editingTenant) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('tenants')
                .update({
                    company_name: editingTenant.company_name,
                    license_key: editingTenant.license_key,
                    contact_email: editingTenant.contact_email,
                    features: editingTenant.features,
                    status: editingTenant.status
                })
                .eq('id', editingTenant.id);

            if (error) throw error;

            alert('✅ Lisans başarıyla güncellendi!');
            setEditingTenant(null);
            await fetchTenants();
        } catch (err: any) {
            alert('❌ Hata: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`"${name}" lisansını silmek istediğinize emin misiniz?`)) return;

        try {
            const { error } = await supabase
                .from('tenants')
                .delete()
                .eq('id', id);

            if (error) throw error;

            alert('✅ Lisans silindi!');
            await fetchTenants();
        } catch (err: any) {
            alert('❌ Hata: ' + err.message);
        }
    };

    const handleAddNew = () => {
        const newLicenseKey = `JETPOS-${Date.now().toString().slice(-8)}`;

        setEditingTenant({
            id: 'new',
            license_key: newLicenseKey,
            company_name: '', // Boş bırak - müşteri dolduracak
            logo_url: null,
            status: 'active',
            contact_email: '',
            features: {
                pos: true,
                products: true
            },
            created_at: new Date().toISOString()
        });
    };

    const handleCreate = async () => {
        if (!editingTenant) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('tenants')
                .insert([{
                    license_key: editingTenant.license_key,
                    company_name: editingTenant.company_name || null,
                    contact_email: editingTenant.contact_email,
                    features: editingTenant.features,
                    status: editingTenant.status
                }]);

            if (error) throw error;

            alert(`✅ Yeni lisans oluşturuldu!\n\nLisans Anahtarı: ${editingTenant.license_key}`);
            setEditingTenant(null);
            await fetchTenants();
        } catch (err: any) {
            alert('❌ Hata: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!passwordModal || !newPassword) {
            return alert('Yeni şifre girmelisiniz!');
        }

        if (newPassword.length < 4) {
            return alert('Şifre en az 4 karakter olmalı!');
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('tenants')
                .update({ password: newPassword })
                .eq('id', passwordModal.tenantId);

            if (error) throw error;

            alert(`✅ ${passwordModal.tenantName} için şifre başarıyla değiştirildi!`);
            setPasswordModal(null);
            setNewPassword('');
        } catch (err: any) {
            alert('❌ Hata: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveGrouping = async () => {
        if (!groupModal) return;

        setSaving(true);
        try {
            // Önce mevcut grouping'leri temizle
            await supabase
                .from('tenant_groups')
                .delete()
                .or(`tenant_id.eq.${groupModal.tenantId},target_tenant_id.eq.${groupModal.tenantId}`);

            // Yeni grouping'leri ekle - karşılıklı bağlantı
            if (selectedGroupTenants.length > 0) {
                const accessRecords: any[] = [];

                selectedGroupTenants.forEach(targetTenantId => {
                    // A -> B
                    accessRecords.push({
                        tenant_id: groupModal.tenantId,
                        target_tenant_id: targetTenantId,
                        access_level: 'write'
                    });
                    // B -> A
                    accessRecords.push({
                        tenant_id: targetTenantId,
                        target_tenant_id: groupModal.tenantId,
                        access_level: 'write'
                    });
                });

                const { error } = await supabase
                    .from('tenant_groups')
                    .insert(accessRecords);

                if (error) throw error;
            }

            alert(`✅ ${groupModal.tenantName} için veritabanı gruplandırması güncellendi!`);
            setGroupModal(null);
            setSelectedGroupTenants([]);
        } catch (err: any) {
            alert('❌ Hata: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAiKey = async () => {
        if (!aiModal) return;

        setSaving(true);
        try {
            const { error } = await supabase.rpc('upsert_integration_settings', {
                p_tenant_id: aiModal.tenantId,
                p_type: 'gemini_ai',
                p_settings: { apiKey: tenantAiKey },
                p_is_active: true
            });

            if (error) throw error;

            alert(`✅ ${aiModal.tenantName} için AI Anahtarı güncellendi!`);
            setAiModal(null);
            setTenantAiKey('');
        } catch (err: any) {
            alert('❌ Hata: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveQnbSettings = async () => {
        if (!qnbModal) return;

        setSaving(true);
        try {
            const { error } = await supabase.rpc('upsert_integration_settings', {
                p_tenant_id: qnbModal.tenantId,
                p_type: 'qnb_efinans',
                p_settings: qnbSettings,
                p_is_active: true
            });

            if (error) throw error;

            alert(`✅ ${qnbModal.tenantName} için QNB Ayarları güncellendi!`);
            setQnbModal(null);
        } catch (err: any) {
            alert('❌ Hata: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Tab System */}
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-2 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('tenants')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-bold ${activeTab === 'tenants' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Building2 className="w-5 h-5" />
                    Lisanslar
                </button>
                <button
                    onClick={() => setActiveTab('tickets')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-bold ${activeTab === 'tickets' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    <LifeBuoy className="w-5 h-5" />
                    Destek Talepleri
                </button>
                <button
                    onClick={() => setActiveTab('notifications')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-bold ${activeTab === 'notifications' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Bell className="w-5 h-5" />
                    Bildirim Merkezi
                </button>
            </div>

            {loading && activeTab !== 'notifications' ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : activeTab === 'tenants' ? (
                <>
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-black text-white">Lisans Yönetimi</h2>
                            <p className="text-sm text-secondary mt-1">Müşteri lisanslarını ve paket özelliklerini yönetin</p>
                        </div>
                        <button onClick={handleAddNew} className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20">
                            <Plus className="w-5 h-5" />
                            Yeni Lisans Oluştur
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {tenants.filter(t => t.license_key !== 'ADM257SA67').map((tenant) => (
                            <div key={tenant.id} className="glass-card p-6 border-l-4 border-l-primary hover:border-l-blue-400 transition-all group">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-14 h-14 bg-gradient-to-br from-primary to-blue-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                <Building2 className="w-7 h-7 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-white">{tenant.company_name || '(Kayıt Bekleniyor...)'}</h3>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm text-primary font-mono font-bold tracking-widest">{tenant.license_key}</span>
                                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${tenant.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                                                        {tenant.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {AVAILABLE_FEATURES.map(f => tenant.features?.[f.id] && (
                                                <span key={f.id} className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-slate-400">{f.label}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPasswordModal({ tenantId: tenant.id, tenantName: tenant.company_name || tenant.license_key })}
                                            className="p-3 bg-white/5 hover:bg-amber-500/20 rounded-xl text-slate-400 hover:text-amber-500 transition-all"
                                            title="Şifreyi Değiştir"
                                        >
                                            <Key className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={async () => {
                                                setLoading(true);
                                                try {
                                                    const { data } = await supabase
                                                        .from('integration_settings')
                                                        .select('settings')
                                                        .eq('tenant_id', tenant.id)
                                                        .eq('type', 'gemini_ai')
                                                        .single();

                                                    setAiModal({
                                                        tenantId: tenant.id,
                                                        tenantName: tenant.company_name || tenant.license_key,
                                                        currentKey: data?.settings?.apiKey || ''
                                                    });
                                                    setTenantAiKey(data?.settings?.apiKey || '');
                                                } catch (err) {
                                                    setAiModal({
                                                        tenantId: tenant.id,
                                                        tenantName: tenant.company_name || tenant.license_key,
                                                        currentKey: ''
                                                    });
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            className="p-3 bg-white/5 hover:bg-purple-500/20 rounded-xl text-slate-400 hover:text-purple-500 transition-all font-bold"
                                            title="AI API Key Tanımla"
                                        >
                                            <Sparkles className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={async () => {
                                                setLoading(true);
                                                try {
                                                    const { data } = await supabase
                                                        .from('integration_settings')
                                                        .select('settings')
                                                        .eq('tenant_id', tenant.id)
                                                        .eq('type', 'qnb_efinans')
                                                        .single();

                                                    setQnbModal({
                                                        tenantId: tenant.id,
                                                        tenantName: tenant.company_name || tenant.license_key
                                                    });
                                                    setQnbSettings(data?.settings || { vkn: '', username: '', password: '', isTest: true });
                                                } catch (err) {
                                                    setQnbModal({
                                                        tenantId: tenant.id,
                                                        tenantName: tenant.company_name || tenant.license_key
                                                    });
                                                    setQnbSettings({ vkn: '', username: '', password: '', isTest: true });
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            className="p-3 bg-white/5 hover:bg-emerald-500/20 rounded-xl text-slate-400 hover:text-emerald-500 transition-all font-bold"
                                            title="QNB e-Fatura Ayarları"
                                        >
                                            <FileText className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setGroupModal({ tenantId: tenant.id, tenantName: tenant.company_name || tenant.license_key });
                                                // Mevcut grupları yükle
                                                supabase
                                                    .from('tenant_groups')
                                                    .select('target_tenant_id')
                                                    .eq('tenant_id', tenant.id)
                                                    .then(({ data }) => {
                                                        if (data) {
                                                            setSelectedGroupTenants(data.map(g => g.target_tenant_id));
                                                        }
                                                    });
                                            }}
                                            className="p-3 bg-white/5 hover:bg-blue-500/20 rounded-xl text-slate-400 hover:text-blue-500 transition-all"
                                            title="Database Gruplandır"
                                        >
                                            <User className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => setEditingTenant(tenant)} className="p-3 bg-white/5 hover:bg-primary/20 rounded-xl text-slate-400 hover:text-primary transition-all">
                                            <Edit className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDelete(tenant.id, tenant.company_name || tenant.license_key)} className="p-3 bg-white/5 hover:bg-rose-500/20 rounded-xl text-slate-400 hover:text-rose-500 transition-all">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : activeTab === 'tickets' ? (
                <>
                    <div>
                        <h2 className="text-3xl font-black text-white">Destek Talepleri</h2>
                        <p className="text-sm text-secondary mt-1">Gelen hata bildirimleri ve yardım istekleri</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {tickets.length > 0 ? tickets.map((ticket) => (
                            <div key={ticket.id} className="glass-card p-6 border-l-4 border-l-amber-500">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                                                <User className="w-6 h-6 text-slate-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white">{ticket.subject}</h3>
                                                <p className="text-sm text-slate-400">
                                                    {ticket.tenants?.company_name || 'Bilinmeyen'} ({ticket.tenants?.license_key})
                                                </p>
                                            </div>
                                            <div className={`ml-auto px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${ticket.status === 'open' ? 'bg-amber-500/10 text-amber-500' :
                                                ticket.status === 'in_progress' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'
                                                }`}>
                                                {ticket.status === 'open' ? 'Açık' : ticket.status === 'in_progress' ? 'İşlemde' : 'Kapatıldı'}
                                            </div>
                                        </div>
                                        <div className="p-4 bg-black/20 rounded-2xl text-slate-300 text-sm italic leading-relaxed">
                                            "{ticket.message}"
                                        </div>
                                        <div className="flex items-center justify-between pt-2">
                                            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
                                                GÖNDERİM: {new Date(ticket.created_at).toLocaleString('tr-TR')}
                                            </span>
                                            <div className="flex gap-2">
                                                {ticket.status === 'open' && (
                                                    <button onClick={() => updateTicketStatus(ticket.id, 'in_progress')} className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-xl text-xs font-bold transition-all">
                                                        İşleme Al
                                                    </button>
                                                )}
                                                {ticket.status !== 'closed' && (
                                                    <button onClick={() => updateTicketStatus(ticket.id, 'closed')} className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-xl text-xs font-bold transition-all">
                                                        Çözüldü Olarak İşaretle
                                                    </button>
                                                )}
                                                <button onClick={() => deleteTicket(ticket.id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all">
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                <LifeBuoy className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                                <p className="text-slate-500 font-bold">Henüz destek talebi yok.</p>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                            <Bell className="w-10 h-10 text-primary" />
                        </div>
                        <h2 className="text-4xl font-black text-white">Bildirim Merkezi</h2>
                        <p className="text-slate-400 mt-2">Duyurular, güncellemeler ve özel mesajlar gönderin</p>
                    </div>

                    <div className="glass-card p-10 space-y-8">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Hedef Müşteri</label>
                                    <select
                                        value={notifTarget}
                                        onChange={(e) => setNotifTarget(e.target.value)}
                                        className="w-full px-5 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white outline-none focus:border-primary/50 transition-all appearance-none"
                                    >
                                        <option value="all">🌐 Tüm Müşteriler (Genel)</option>
                                        {tenants.map(t => (
                                            <option key={t.id} value={t.id}>{t.company_name} ({t.license_key})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Tür</label>
                                    <div className="flex gap-3">
                                        {['info', 'success', 'warning', 'error'].map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setNotifType(t)}
                                                className={`flex-1 py-4 rounded-2xl border-2 transition-all font-bold text-xs uppercase ${notifType === t ? 'border-primary bg-primary/10 text-white' : 'border-white/5 text-slate-500 hover:border-white/10'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Bildirim Başlığı</label>
                                <input
                                    type="text"
                                    value={notifTitle}
                                    onChange={(e) => setNotifTitle(e.target.value)}
                                    placeholder="Örn: Uygulama Güncellemesi v1.2"
                                    className="w-full px-5 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white outline-none focus:border-primary/50 transition-all font-bold"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Mesaj İçeriği</label>
                                <textarea
                                    value={notifMessage}
                                    onChange={(e) => setNotifMessage(e.target.value)}
                                    placeholder="Duyuru detaylarını buraya yazın..."
                                    rows={5}
                                    className="w-full px-5 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white outline-none focus:border-primary/50 transition-all resize-none leading-relaxed"
                                />
                            </div>
                        </div>

                        <button
                            onClick={sendNotification}
                            disabled={saving}
                            className="w-full py-5 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black shadow-2xl shadow-primary/40 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                        >
                            {saving ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>
                                <Send className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                Bildirimi Şimdi Gönder
                            </>}
                        </button>
                    </div>
                </div>
            )}

            {/* Editing Modal Logic can stay the same but wrapped in conditional rendering */}
            {editingTenant && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-slate-900/80 backdrop-blur-md border-b border-white/10 p-8 flex items-center justify-between z-10">
                            <div>
                                <h3 className="text-2xl font-black text-white">
                                    {editingTenant.id === 'new' ? 'Yeni Lisans Tanımla' : 'Lisans Profilini Düzenle'}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">ID: {editingTenant.id}</p>
                            </div>
                            <button onClick={() => setEditingTenant(null)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>
                        <div className="p-8 space-y-10">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Lisans Anahtarı</label>
                                    <input type="text" value={editingTenant.license_key} onChange={(e) => setEditingTenant({ ...editingTenant, license_key: e.target.value })} className="w-full px-5 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white font-mono tracking-widest focus:border-primary/50 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Firma Adı (Opsiyonel)</label>
                                    <input type="text" value={editingTenant.company_name} onChange={(e) => setEditingTenant({ ...editingTenant, company_name: e.target.value })} className="w-full px-5 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white focus:border-primary/50 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Destek E-Posta</label>
                                    <input type="email" value={editingTenant.contact_email || ''} onChange={(e) => setEditingTenant({ ...editingTenant, contact_email: e.target.value })} className="w-full px-5 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white focus:border-primary/50 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Hesap Durumu</label>
                                    <select value={editingTenant.status} onChange={(e) => setEditingTenant({ ...editingTenant, status: e.target.value })} className="w-full px-5 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white focus:border-primary/50 outline-none appearance-none">
                                        <option value="active">Aktif</option>
                                        <option value="suspended">Askıda</option>
                                        <option value="expired">Süresi Dolmuş</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-black text-white uppercase tracking-[0.2em] ml-1">Erişim Yetkileri (Özellikler)</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {AVAILABLE_FEATURES.map(f => {
                                        const isActive = editingTenant.features?.[f.id];
                                        return (
                                            <button key={f.id} onClick={() => toggleFeature(f.id)} className={`p-4 rounded-[1.5rem] border-2 transition-all text-left group ${isActive ? 'border-primary bg-primary/10' : 'border-white/5 hover:border-white/10'}`}>
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-white/5 text-slate-700'}`}>
                                                    {isActive ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                                </div>
                                                <p className={`text-[11px] font-black leading-tight ${isActive ? 'text-white' : 'text-slate-600'}`}>{f.label}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="sticky bottom-0 bg-slate-900/80 backdrop-blur-md border-t border-white/10 p-8 flex gap-4 z-10">
                            <button onClick={() => setEditingTenant(null)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all border border-white/5">İptal</button>
                            <button onClick={editingTenant.id === 'new' ? handleCreate : handleSave} disabled={saving} className="flex-1 py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black shadow-xl shadow-primary/30 transition-all flex items-center justify-center gap-2">
                                {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-5 h-5" /> {editingTenant.id === 'new' ? 'Oluştur' : 'Değişiklikleri Kaydet'}</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Change Modal */}
            {passwordModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] max-w-md w-full shadow-2xl">
                        <div className="p-8 border-b border-white/10">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center">
                                    <Key className="w-6 h-6 text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white">Şifre Değiştir</h3>
                                    <p className="text-xs text-slate-500 mt-1">{passwordModal.tenantName}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Yeni Şifre</label>
                                <input
                                    type="text"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="En az 4 karakter"
                                    className="w-full px-5 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white outline-none focus:border-amber-500/50 transition-all font-mono tracking-widest"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setPasswordModal(null); setNewPassword(''); }}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleChangePassword}
                                    disabled={saving}
                                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black shadow-lg shadow-amber-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Key className="w-4 h-4" /> Şifreyi Güncelle</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Key Modal */}
            {aiModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] max-w-md w-full shadow-2xl">
                        <div className="p-8 border-b border-white/10">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center">
                                    <Sparkles className="w-6 h-6 text-purple-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white">AI API Anahtarı</h3>
                                    <p className="text-xs text-slate-500 mt-1">{aiModal.tenantName}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Gemini API Key</label>
                                <input
                                    type="password"
                                    value={tenantAiKey}
                                    onChange={(e) => setTenantAiKey(e.target.value)}
                                    placeholder="AIza..."
                                    className="w-full px-5 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white outline-none focus:border-purple-500/50 transition-all font-mono"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setAiModal(null); setTenantAiKey(''); }}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleSaveAiKey}
                                    disabled={saving}
                                    className="flex-1 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-black shadow-lg shadow-purple-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Anahtarı Kaydet</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* QNB Modal */}
            {qnbModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] max-w-md w-full shadow-2xl">
                        <div className="p-8 border-b border-white/10">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white">QNB e-Fatura Ayarları</h3>
                                    <p className="text-xs text-slate-500 mt-1">{qnbModal.tenantName}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">VKN / TCKN</label>
                                <input
                                    type="text"
                                    value={qnbSettings.vkn}
                                    onChange={(e) => setQnbSettings({ ...qnbSettings, vkn: e.target.value })}
                                    placeholder="1234567890"
                                    className="w-full px-5 py-3 bg-slate-950 border border-white/5 rounded-xl text-white outline-none focus:border-emerald-500/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Web Servis Kullanıcı Adı</label>
                                <input
                                    type="text"
                                    value={qnbSettings.username}
                                    onChange={(e) => setQnbSettings({ ...qnbSettings, username: e.target.value })}
                                    placeholder="webservis.xxxxx"
                                    className="w-full px-5 py-3 bg-slate-950 border border-white/5 rounded-xl text-white outline-none focus:border-emerald-500/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Web Servis Şifresi</label>
                                <input
                                    type="password"
                                    value={qnbSettings.password}
                                    onChange={(e) => setQnbSettings({ ...qnbSettings, password: e.target.value })}
                                    className="w-full px-5 py-3 bg-slate-950 border border-white/5 rounded-xl text-white outline-none focus:border-emerald-500/50"
                                />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                <span className="text-sm font-bold text-white">Test Modu</span>
                                <button
                                    onClick={() => setQnbSettings({ ...qnbSettings, isTest: !qnbSettings.isTest })}
                                    className={`w-12 h-6 rounded-full transition-all relative ${qnbSettings.isTest ? 'bg-amber-500' : 'bg-slate-700'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${qnbSettings.isTest ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setQnbModal(null)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleSaveQnbSettings}
                                    disabled={saving}
                                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Kaydet</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Database Grouping Modal */}
            {groupModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md p-8 border-b border-white/10 z-10">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                                    <User className="w-6 h-6 text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white">Database Gruplandırma</h3>
                                    <p className="text-xs text-slate-500 mt-1">{groupModal.tenantName}</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 mt-4">
                                Bu tenant hangi diğer tenantların veritabanını görebilsin?
                            </p>
                        </div>
                        <div className="p-8 space-y-4">
                            {tenants
                                .filter(t => t.id !== groupModal.tenantId && t.license_key !== 'ADM257SA67')
                                .map((tenant) => {
                                    const isSelected = selectedGroupTenants.includes(tenant.id);
                                    return (
                                        <button
                                            key={tenant.id}
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedGroupTenants(prev => prev.filter(id => id !== tenant.id));
                                                } else {
                                                    setSelectedGroupTenants(prev => [...prev, tenant.id]);
                                                }
                                            }}
                                            className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${isSelected
                                                ? 'border-blue-500 bg-blue-500/10'
                                                : 'border-white/10 bg-white/5 hover:border-white/20'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-blue-500 text-white' : 'bg-white/5 text-slate-400'
                                                        }`}>
                                                        {isSelected ? <Check className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-bold">{tenant.company_name || '(Kayıt Bekleniyor)'}</p>
                                                        <p className="text-xs text-slate-500 font-mono mt-0.5">{tenant.license_key}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${isSelected ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-slate-500'
                                                    }`}>
                                                    {isSelected ? 'Erişebilir' : 'Erişemez'}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}

                            {tenants.filter(t => t.id !== groupModal.tenantId && t.license_key !== 'ADM257SA67').length === 0 && (
                                <div className="text-center py-12 text-slate-500">
                                    <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>Başka tenant bulunmuyor</p>
                                </div>
                            )}
                        </div>
                        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-md p-8 border-t border-white/10 flex gap-3 z-10">
                            <button
                                onClick={() => { setGroupModal(null); setSelectedGroupTenants([]); }}
                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleSaveGrouping}
                                disabled={saving}
                                className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><User className="w-4 h-4" /> Gruplandırmayı Kaydet</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
