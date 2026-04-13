"use client";

import { useState, useEffect } from 'react';
import { Building2, Key, Check, X, Save, Edit, Trash2, Plus, MessageSquare, Bell, LifeBuoy, Send, User, Users, Trash, Sparkles, FileText, Home, MapPin, Store, Heart, Search, Globe, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Tenant {
    id: string;
    license_key: string;
    company_name: string;
    logo_url: string | null;
    status: string;
    contact_email: string | null;
    features: any;
    settings?: any;
    openrouter_api_key?: string;
    max_stores?: number;
    master_pin?: string;
    created_at: string;
}

const AVAILABLE_FEATURES = [
    { id: "pos", label: "JetKasa (POS)" },
    { id: 'products', label: 'Ürün Yönetimi' },
    { id: 'sales_history', label: 'Satış Geçmişi' },
    { id: 'profit_calculator', label: 'Kâr Hesaplama' },
    { id: 'price_simulator', label: 'Fiyat Simülasyonu' },
    { id: 'reports', label: 'Akıllı Raporlar' },
    { id: 'cari_hesap', label: 'Cari Hesap Takibi' },
    { id: 'bank_management', label: 'Banka İşlemleri' },
    { id: 'cash_management', label: 'Kasa İşlemleri' },
    { id: 'employee_module', label: 'Çalışan Yönetimi & Vardiya' },
    { id: 'employee_login', label: 'Çalışan Giriş Sistemi (PIN)' },
    { id: 'employee_permissions', label: 'Gelişmiş Yetkilendirme Sistemi' },
    { id: 'master_pin_enabled', label: 'Master PIN (Patron Master Kodu)' },
    { id: 'label_designer', label: 'Ürün Etiket Tasarımı' },
    { id: 'trendyol_go', label: 'Trendyol GO' },
    { id: 'invoice', label: 'E-Fatura Entegrasyonu' },
    { id: 'invoice_management', label: 'Fatura ve İrsaliye Yönetimi' },
    { id: 'ai_features', label: 'JetPos AI (Öngörüler & Asistan)' },
    { id: 'adisyon', label: 'Adisyon (Masa Yönetimi)' },
    { id: 'qrmenu', label: 'QR Menü Yönetimi' },
    { id: 'showcase', label: 'Vitrin Web Sitesi' },
    { id: 'cfd', label: 'Müşteri Ekranı (CFD)' },
];

const MOBILE_FEATURES = [
    { id: 'mobile_adisyon', label: 'Mobil Adisyon (Garson Ekranı)' },
    { id: 'mobile_pos', label: 'Mobil POS (Satış Yapma)' },
    { id: 'mobile_inventory', label: 'Mobil Depo & Sayım' },
    { id: 'mobile_reports', label: 'Mobil Raporlar & Ciro' },
];

export default function SuperAdmin() {
    const [activeTab, setActiveTab] = useState<'tenants' | 'tickets' | 'notifications' | 'crm'>('tenants');
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [tickets, setTickets] = useState<any[]>([]);
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'expired'>('all');
    
    // Employee Management State for SuperAdmin
    const [employeeModal, setEmployeeModal] = useState<{ tenantId: string, tenantName: string } | null>(null);
    const [employeesList, setEmployeesList] = useState<any[]>([]);
    const [editingStaff, setEditingStaff] = useState<any | null>(null);

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

    // Invoice Provider states
    const [invoiceModal, setInvoiceModal] = useState<{ tenantId: string; tenantName: string } | null>(null);
    const [invoiceProvider, setInvoiceProvider] = useState<'qnb' | 'parasut'>('qnb');
    const [qnbSettings, setQnbSettings] = useState({ vkn: '', username: '', password: '', erpCode: 'JET31270', isTest: true, branchCode: '', counterCode: '' });
    const [parasutSettings, setParasutSettings] = useState({ email: '', password: '', companyId: '', clientId: '', clientSecret: '', baseUrl: '', authUrl: '', isTest: false });

    // Trendyol GO states
    const [trendyolModal, setTrendyolModal] = useState<{ tenantId: string; tenantName: string } | null>(null);
    const [trendyolSettings, setTrendyolSettings] = useState({ sellerId: '', storeId: '', apiKey: '', apiSecret: '', token: '', stage: false });
    
    // Warehouse management states
    const [warehouseModal, setWarehouseModal] = useState<{ tenantId: string; tenantName: string } | null>(null);
    const [warehousesList, setWarehousesList] = useState<any[]>([]);
    const [editingWarehouse, setEditingWarehouse] = useState<any | null>(null);


    useEffect(() => {
        if (activeTab === 'tenants') fetchTenants();
        if (activeTab === 'tickets') fetchTickets();
        if (activeTab === 'crm') fetchCRMStats();
    }, [activeTab]);

    const [crmStats, setCrmStats] = useState<any[]>([]);
    const fetchCRMStats = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tenants')
                .select(`
                    id, 
                    company_name, 
                    license_key,
                    cari_hesaplar(count),
                    loyalty_points(count)
                `)
                .order('company_name');

            if (error) throw error;
            setCrmStats(data || []);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

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
                    logo_url: editingTenant.logo_url,
                    features: editingTenant.features,
                    openrouter_api_key: editingTenant.openrouter_api_key,
                    max_stores: editingTenant.max_stores || 1,
                    max_online_stores: editingTenant.max_online_stores || 0,
                    status: editingTenant.status,
                    master_pin: editingTenant.master_pin
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
            max_stores: 1,
            max_online_stores: 0,
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
                    logo_url: editingTenant.logo_url,
                    contact_email: editingTenant.contact_email,
                    features: editingTenant.features,
                    openrouter_api_key: editingTenant.openrouter_api_key,
                    max_stores: editingTenant.max_stores || 1,
                    max_online_stores: editingTenant.max_online_stores || 0,
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
            // ✅ Güvenli RPC'yi çağır (Bcrypt hashleme yapar)
            const { data, error } = await supabase.rpc('reset_tenant_password', {
                p_tenant_id: passwordModal.tenantId,
                p_new_password: newPassword
            });

            if (error) throw error;

            alert(`✅ ${passwordModal.tenantName} için şifre başarıyla sıfırlandı ve hash'lendi!`);
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
            // 1. Integration Settings'e kaydet (Cache)
            const { error: rpcError } = await supabase.rpc('upsert_integration_settings', {
                p_tenant_id: aiModal.tenantId,
                p_type: 'gemini_ai',
                p_settings: { apiKey: tenantAiKey },
                p_is_active: true
            });

            if (rpcError) throw rpcError;

            // 2. Tenants tablosuna doğrudan kaydet (Lisansa özel kolon)
            // settings içindeki gemini_ai da güncelleyelim.
            const tenantObj = tenants.find(t => t.id === aiModal.tenantId);
            const currentSettings = tenantObj?.settings || {};

            const { error: updateError } = await supabase
                .from('tenants')
                .update({
                    openrouter_api_key: tenantAiKey,
                    settings: {
                        ...currentSettings,
                        gemini_ai: { apiKey: tenantAiKey }
                    }
                })
                .eq('id', aiModal.tenantId);

            if (updateError) throw updateError;

            alert(`✅ ${aiModal.tenantName} için AI Anahtarı hem entegrasyonlara hem de lisansa kaydedildi!`);
            setAiModal(null);
            setTenantAiKey('');
            await fetchTenants();
        } catch (err: any) {
            alert('❌ Hata: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveInvoiceSettings = async () => {
        if (!invoiceModal) return;

        setSaving(true);
        try {
            const tenantObj = tenants.find(t => t.id === invoiceModal.tenantId);
            const currentSettings = tenantObj?.settings || {};

            const updatedSettings = {
                ...currentSettings,
                invoice_provider: invoiceProvider,
                qnb: {
                    ...currentSettings.qnb,
                    vkn: !qnbSettings.isTest ? qnbSettings.vkn : (currentSettings.qnb?.vkn || ''),
                    password: !qnbSettings.isTest ? qnbSettings.password : (currentSettings.qnb?.password || ''),
                    testVkn: qnbSettings.isTest ? qnbSettings.vkn : (currentSettings.qnb?.testVkn || qnbSettings.vkn),
                    testPassword: qnbSettings.isTest ? qnbSettings.password : (currentSettings.qnb?.testPassword || qnbSettings.password),
                    earsivUsername: qnbSettings.username,
                    erpCode: qnbSettings.erpCode,
                    isTest: qnbSettings.isTest,
                    branchCode: qnbSettings.branchCode,
                    counterCode: qnbSettings.counterCode
                },
                parasut: {
                    ...currentSettings.parasut,
                    email: parasutSettings.email,
                    password: parasutSettings.password,
                    companyId: parasutSettings.companyId,
                    clientId: parasutSettings.clientId,
                    clientSecret: parasutSettings.clientSecret,
                    baseUrl: parasutSettings.baseUrl,
                    authUrl: parasutSettings.authUrl,
                    isTest: parasutSettings.isTest
                }
            };

            const { error } = await supabase
                .from('tenants')
                .update({ settings: updatedSettings })
                .eq('id', invoiceModal.tenantId);

            if (error) throw error;

            alert(`✅ ${invoiceModal.tenantName} için E-Fatura Ayarları güncellendi!`);
            setInvoiceModal(null);
            await fetchTenants();
        } catch (err: any) {
            alert('❌ Hata: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveTrendyolSettings = async () => {
        if (!trendyolModal) return;

        setSaving(true);
        try {
            const tenantObj = tenants.find(t => t.id === trendyolModal.tenantId);
            const currentSettings = tenantObj?.settings || {};

            const updatedSettings = {
                ...currentSettings,
                trendyolGo: {
                    sellerId: trendyolSettings.sellerId,
                    storeId: trendyolSettings.storeId,
                    apiKey: trendyolSettings.apiKey,
                    apiSecret: trendyolSettings.apiSecret,
                    token: trendyolSettings.token,
                    stage: trendyolSettings.stage
                }
            };

            const { error } = await supabase
                .from('tenants')
                .update({ settings: updatedSettings })
                .eq('id', trendyolModal.tenantId);

            if (error) throw error;

            alert(`✅ ${trendyolModal.tenantName} için Trendyol GO Ayarları güncellendi!`);
            setTrendyolModal(null);
            await fetchTenants();
        } catch (err: any) {
            alert('❌ Hata: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const fetchWarehouses = async (tenantId: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('warehouses')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setWarehousesList(data || []);
        } catch (err: any) {
            alert('Hata: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveWarehouse = async (data: any) => {
        if (!warehouseModal) return;
        setSaving(true);
        try {
            if (data.id) {
                const { error } = await supabase
                    .from('warehouses')
                    .update({
                        name: data.name,
                        code: data.code,
                        type: data.type,
                        address: data.address,
                        is_active: data.is_active,
                        is_default: data.is_default
                    })
                    .eq('id', data.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('warehouses')
                    .insert([{
                        tenant_id: warehouseModal.tenantId,
                        name: data.name,
                        code: data.code,
                        type: data.type,
                        address: data.address,
                        is_active: true,
                        is_default: data.is_default || false
                    }]);
                if (error) throw error;
            }
            alert('✅ Mağaza kaydedildi!');
            setEditingWarehouse(null);
            await fetchWarehouses(warehouseModal.tenantId);
        } catch (err: any) {
            alert('❌ Hata: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteWarehouse = async (id: string) => {
        if (!warehouseModal || !confirm('Bu mağazayı silmek istediğinize emin misiniz?')) return;
        try {
            const { error } = await supabase.from('warehouses').delete().eq('id', id);
            if (error) throw error;
            await fetchWarehouses(warehouseModal.tenantId);
        } catch (err: any) {
            alert('❌ Hata: ' + err.message);
        }
    };
    const fetchEmployees = async (tenantId: string) => {
        try {
            const { data, error } = await supabase.rpc('admin_get_employees', {
                p_tenant_id: tenantId
            });
            if (error) throw error;
            setEmployeesList(data || []);
        } catch (error: any) {
            alert('❌ Çalışanlar yüklenemedi: ' + error.message);
        }
    };

    const handleSaveStaff = async (staffData: any) => {
        if (!employeeModal) return;
        setSaving(true);
        try {
            const { data, error } = await supabase.rpc('admin_upsert_employee', {
                p_employee: {
                    ...staffData,
                    tenant_id: employeeModal.tenantId
                }
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.message);

            alert('✅ Çalışan bilgileri kaydedildi.');
            setEditingStaff(null);
            fetchEmployees(employeeModal.tenantId);
        } catch (error: any) {
            alert('❌ Hata: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteStaff = async (id: string) => {
        if (!employeeModal || !confirm('Bu çalışanı silmek istediğinize emin misiniz?')) return;
        try {
            const { data, error } = await supabase.rpc('admin_delete_employee', {
                p_id: id
            });
            if (error) throw error;
            if (!data.success) throw new Error(data.message);

            alert('✅ Çalışan silindi.');
            fetchEmployees(employeeModal.tenantId);
        } catch (error: any) {
            alert('❌ Hata: ' + error.message);
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
                <button
                    onClick={() => setActiveTab('crm')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-bold ${activeTab === 'crm' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Heart className="w-5 h-5" />
                    CRM Takip
                </button>
            </div>

            {loading && activeTab !== 'notifications' ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : activeTab === 'tenants' ? (
                <>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-black text-white">Lisans Yönetimi</h2>
                            <p className="text-sm text-secondary mt-1">
                                {tenants.length} Lisans Kayıtlı — {tenants.filter(t => t.status === 'active').length} Aktif
                            </p>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input 
                                    type="text"
                                    placeholder="Firma veya Anahtar Ara..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-primary/50 transition-all text-sm"
                                />
                            </div>
                            <button onClick={handleAddNew} className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20 whitespace-nowrap">
                                <Plus className="w-5 h-5" />
                                Yeni Lisans
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        {(['all', 'active', 'suspended', 'expired'] as const).map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${statusFilter === status 
                                    ? 'bg-primary border-primary text-white' 
                                    : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}
                            >
                                {status === 'all' ? 'Tümü' : status === 'active' ? 'Aktif' : status === 'suspended' ? 'Askıda' : 'Süresi Dolmuş'}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {tenants
                            .filter(t => t.license_key !== 'ADM257SA67')
                            .filter(t => statusFilter === 'all' || t.status === statusFilter)
                            .filter(t => 
                                !searchTerm || 
                                (t.company_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                (t.license_key?.toLowerCase().includes(searchTerm.toLowerCase()))
                            )
                            .map((tenant) => (
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
                                            onClick={() => {
                                                const settings = tenant.settings || {};
                                                const currentQnb = settings.qnb || {};
                                                const currentParasut = settings.parasut || {};
                                                
                                                setInvoiceModal({
                                                    tenantId: tenant.id,
                                                    tenantName: tenant.company_name || tenant.license_key
                                                });
                                                setInvoiceProvider(settings.invoice_provider || 'qnb');
                                                setQnbSettings({
                                                    vkn: currentQnb.vkn || currentQnb.testVkn || '',
                                                    username: currentQnb.earsivUsername || '',
                                                    password: currentQnb.password || currentQnb.testPassword || '',
                                                    erpCode: currentQnb.erpCode || 'JET31270',
                                                    isTest: currentQnb.isTest !== false,
                                                    branchCode: currentQnb.branchCode || '',
                                                    counterCode: currentQnb.counterCode || ''
                                                });
                                                setParasutSettings({
                                                    email: currentParasut.email || currentParasut.username || '',
                                                    password: currentParasut.password || '',
                                                    companyId: currentParasut.companyId || '',
                                                    clientId: currentParasut.clientId || '',
                                                    clientSecret: currentParasut.clientSecret || '',
                                                    baseUrl: currentParasut.baseUrl || '',
                                                    authUrl: currentParasut.authUrl || '',
                                                    isTest: currentParasut.isTest === true
                                                });
                                            }}
                                            className="p-3 bg-white/5 hover:bg-emerald-500/20 rounded-xl text-slate-400 hover:text-emerald-500 transition-all font-bold"
                                            title="E-Fatura Sağlayıcı Ayarları"
                                        >
                                            <FileText className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                const currentTg = tenant.settings?.trendyolGo || {};
                                                setTrendyolModal({
                                                    tenantId: tenant.id,
                                                    tenantName: tenant.company_name || tenant.license_key
                                                });
                                                setTrendyolSettings({
                                                    sellerId: currentTg.sellerId || '',
                                                    storeId: currentTg.storeId || '',
                                                    apiKey: currentTg.apiKey || '',
                                                    apiSecret: currentTg.apiSecret || '',
                                                    token: currentTg.token || '',
                                                    stage: currentTg.stage === true
                                                });
                                            }}
                                            className="p-3 bg-white/5 hover:bg-orange-500/20 rounded-xl text-slate-400 hover:text-orange-500 transition-all font-bold"
                                            title="Trendyol GO Ayarları"
                                        >
                                            <span className="font-black text-xs">TY</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setWarehouseModal({ tenantId: tenant.id, tenantName: tenant.company_name || tenant.license_key });
                                                fetchWarehouses(tenant.id);
                                            }}
                                            className="p-3 bg-white/5 hover:bg-indigo-500/20 rounded-xl text-slate-400 hover:text-indigo-500 transition-all"
                                            title="Mağazaları Yönet"
                                        >
                                            <Home className="w-5 h-5" />
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
                                         <button 
                                            onClick={() => {
                                                if(confirm(`${tenant.company_name || tenant.license_key} oturumuna geçmek istiyor musunuz?`)) {
                                                    // RLS bypass ile lisans doğrulama için ADM257SA67 anahtarını koru, tenant ID'yi değiştir.
                                                    localStorage.setItem('currentTenantId', tenant.id);
                                                    localStorage.setItem('licenseKey', 'ADM257SA67');
                                                    window.location.reload();
                                                }
                                            }}
                                            className="px-4 py-3 bg-primary/10 hover:bg-primary/20 rounded-xl text-primary font-black text-xs uppercase transition-all flex items-center gap-2"
                                            title="Yönetim Paneline Git"
                                        >
                                            <Globe className="w-4 h-4" />
                                            Giriş Yap
                                        </button>
                                         <button
                                            onClick={() => {
                                                setEmployeeModal({ tenantId: tenant.id, tenantName: tenant.company_name || tenant.license_key });
                                                fetchEmployees(tenant.id);
                                            }}
                                            className="p-3 bg-white/5 hover:bg-emerald-500/20 rounded-xl text-slate-400 hover:text-emerald-500 transition-all font-bold"
                                            title="Personel ve Yetki Yönetimi"
                                        >
                                            <Users className="w-5 h-5" />
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
            ) : activeTab === 'crm' ? (
                <>
                    <div>
                        <h2 className="text-3xl font-black text-white">Global CRM Analizi</h2>
                        <p className="text-sm text-secondary mt-1">Tüm mağazaların sadakat programı performansı</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {crmStats.filter(t => t.license_key !== 'ADM257SA67').map((t) => (
                            <div key={t.id} className="glass-card p-6 border-l-4 border-l-pink-500">
                                <h3 className="text-xl font-bold text-white mb-4">{t.company_name || t.license_key}</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/5 rounded-2xl">
                                        <div className="text-2xl font-black text-white mb-1">{t.cari_hesaplar?.[0]?.count || 0}</div>
                                        <div className="text-[10px] text-secondary font-black uppercase tracking-widest">Müşteri</div>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-2xl">
                                        <div className="text-2xl font-black text-pink-400 mb-1">{t.loyalty_points?.[0]?.count || 0}</div>
                                        <div className="text-[10px] text-secondary font-black uppercase tracking-widest">Puan İşlemi</div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-[10px] text-secondary font-bold uppercase tracking-widest">Aktiflik Durumu</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${t.loyalty_points?.[0]?.count > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                                        {t.loyalty_points?.[0]?.count > 0 ? 'KULLANILIYOR' : 'BOŞ'}
                                    </span>
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
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Logo URL</label>
                                    <input type="text" value={editingTenant.logo_url || ''} onChange={(e) => setEditingTenant({ ...editingTenant, logo_url: e.target.value })} className="w-full px-5 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white focus:border-primary/50 outline-none" placeholder="https://..." />
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
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Fiziksel Mağaza Limiti</label>
                                        <input 
                                            type="number" 
                                            value={editingTenant.max_stores || 1} 
                                            onChange={(e) => setEditingTenant({ ...editingTenant, max_stores: parseInt(e.target.value) || 1 })} 
                                            className="w-full px-5 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white focus:border-primary/50 outline-none" 
                                            min="1"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Online Mağaza Limiti</label>
                                        <input 
                                            type="number" 
                                            value={editingTenant.max_online_stores || 0} 
                                            onChange={(e) => setEditingTenant({ ...editingTenant, max_online_stores: parseInt(e.target.value) || 0 })} 
                                            className="w-full px-5 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white focus:border-indigo-500/50 outline-none" 
                                            min="0"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2">
                                        <Sparkles className="w-3 h-3 text-purple-400" />
                                        DeepSeek API Key (Lisansa Özel)
                                    </label>
                                    <input
                                        type="password"
                                        value={editingTenant.openrouter_api_key || ''}
                                        onChange={(e) => setEditingTenant({ ...editingTenant, openrouter_api_key: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white focus:border-purple-500/50 outline-none font-mono text-xs"
                                        placeholder="sk-..."
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2 p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 ml-1 flex items-center gap-2">
                                        <Shield className="w-4 h-4" />
                                        Patron Master PIN (Özel Sistem)
                                    </label>
                                    <div className="flex gap-4 mt-2">
                                        <input
                                            type="text"
                                            value={editingTenant.master_pin || ''}
                                            onChange={(e) => setEditingTenant({ ...editingTenant, master_pin: e.target.value.replace(/\D/g, '') })}
                                            className="flex-1 px-5 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white focus:border-emerald-500/50 outline-none font-mono tracking-[0.5em] text-lg text-center"
                                            placeholder="----"
                                            maxLength={6}
                                        />
                                        <div className="flex flex-col justify-center">
                                            <p className="text-[9px] text-slate-500 italic max-w-[200px]">Bu PIN girildiğinde sistemdeki tüm yetki kısıtlamaları otomatik devre dışı kalır.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <h4 className="text-xl font-black text-white uppercase tracking-[0.2em] ml-1 pt-8 border-t border-white/5">Yazılım Modülleri ve Özellikler</h4>
                                
                                {[
                                    { label: 'SATIŞ & POS', features: ['pos', 'sales_history', 'adisyon', 'invoice'] },
                                    { label: 'ÜRÜN & STOK', features: ['products', 'label_designer', 'invoice_management'] },
                                    { label: 'DİJİTAL & WEB', features: ['qrmenu', 'showcase', 'cfd'] },
                                    { label: 'FİNANS & YÖNETİM', features: ['profit_calculator', 'price_simulator', 'reports', 'cari_hesap', 'bank_management', 'cash_management', 'employee_module', 'employee_login', 'employee_permissions', 'master_pin_enabled'] },
                                    { label: 'YAPAY ZEKA & ENTEGRASYON', features: ['ai_features', 'trendyol_go'] },
                                ].map((cat) => (
                                    <div key={cat.label} className="space-y-4">
                                        <div className="flex items-center gap-3 ml-2">
                                            <div className="w-1.5 h-6 bg-primary rounded-full" />
                                            <h5 className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase">{cat.label}</h5>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {AVAILABLE_FEATURES.filter(f => cat.features.includes(f.id)).map(f => {
                                                const isActive = editingTenant.features?.[f.id];
                                                return (
                                                    <button key={f.id} onClick={() => toggleFeature(f.id)} className={`p-4 rounded-[1.5rem] border-2 transition-all text-left ${isActive ? 'border-primary bg-primary/10' : 'border-white/5 hover:border-white/10'}`}>
                                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-white/5 text-slate-700'}`}>
                                                            {isActive ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                                        </div>
                                                        <p className={`text-[11px] font-black px-1 leading-tight ${isActive ? 'text-white' : 'text-slate-600'}`}>{f.label}</p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                <h4 className="text-sm font-black text-white uppercase tracking-[0.2em] ml-1 mt-8 pt-4 border-t border-white/5">JetPOS Mobile Yetkileri (Telefon/Tablet)</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {MOBILE_FEATURES.map(f => {
                                        const isActive = editingTenant.features?.[f.id];
                                        return (
                                            <button key={f.id} onClick={() => toggleFeature(f.id)} className={`p-4 rounded-[1.5rem] border-2 transition-all text-left group ${isActive ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 hover:border-white/10'}`}>
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${isActive ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-white/5 text-slate-700'}`}>
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
                                    <h3 className="text-xl font-black text-white">OpenRouter API Anahtarı</h3>
                                    <p className="text-xs text-slate-500 mt-1">{aiModal.tenantName}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">OpenRouter API Key (sk-or-...)</label>
                                <input
                                    type="password"
                                    value={tenantAiKey}
                                    onChange={(e) => setTenantAiKey(e.target.value)}
                                    placeholder="sk-or-v1-..."
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

            {/* Invoice Provider Modal */}
            {invoiceModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-8 border-b border-white/10 sticky top-0 bg-slate-900 z-10">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white">E-Fatura Ayarları</h3>
                                    <p className="text-xs text-slate-500 mt-1">{invoiceModal.tenantName}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Fatura Sağlayıcı</label>
                                <select 
                                    value={invoiceProvider} 
                                    onChange={(e) => setInvoiceProvider(e.target.value as any)}
                                    className="w-full px-5 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white focus:border-emerald-500/50 outline-none appearance-none font-bold"
                                >
                                    <option value="qnb">QNB eFinans</option>
                                    <option value="parasut">Paraşüt</option>
                                </select>
                            </div>

                            {invoiceProvider === 'qnb' ? (
                                <div className="space-y-4 pt-2 border-t border-white/5">
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
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">ERP Kodu</label>
                                        <input
                                            type="text"
                                            value={qnbSettings.erpCode}
                                            onChange={(e) => setQnbSettings({ ...qnbSettings, erpCode: e.target.value })}
                                            placeholder="JET31270"
                                            className="w-full px-5 py-3 bg-slate-950 border border-white/5 rounded-xl text-white outline-none focus:border-emerald-500/50"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Şube Kodu</label>
                                            <input
                                                type="text"
                                                value={qnbSettings.branchCode}
                                                onChange={(e) => setQnbSettings({ ...qnbSettings, branchCode: e.target.value })}
                                                placeholder="DFLT veya Merkez"
                                                className="w-full px-5 py-3 bg-slate-950 border border-white/5 rounded-xl text-white outline-none focus:border-emerald-500/50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Kasa Kodu</label>
                                            <input
                                                type="text"
                                                value={qnbSettings.counterCode}
                                                onChange={(e) => setQnbSettings({ ...qnbSettings, counterCode: e.target.value })}
                                                placeholder="DFLT veya Form"
                                                className="w-full px-5 py-3 bg-slate-950 border border-white/5 rounded-xl text-white outline-none focus:border-emerald-500/50"
                                            />
                                        </div>
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
                                </div>
                            ) : (
                                <div className="space-y-4 pt-2 border-t border-white/5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">E-Posta (Paraşüt Giriş)</label>
                                        <input
                                            type="email"
                                            value={parasutSettings.email}
                                            onChange={(e) => setParasutSettings({ ...parasutSettings, email: e.target.value })}
                                            placeholder="ornek@firma.com"
                                            className="w-full px-5 py-3 bg-slate-950 border border-white/5 rounded-xl text-white outline-none focus:border-emerald-500/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Şifre</label>
                                        <input
                                            type="password"
                                            value={parasutSettings.password}
                                            onChange={(e) => setParasutSettings({ ...parasutSettings, password: e.target.value })}
                                            className="w-full px-5 py-3 bg-slate-950 border border-white/5 rounded-xl text-white outline-none focus:border-emerald-500/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Firma ID (Company ID)</label>
                                        <input
                                            type="text"
                                            value={parasutSettings.companyId}
                                            onChange={(e) => setParasutSettings({ ...parasutSettings, companyId: e.target.value })}
                                            placeholder="123456"
                                            className="w-full px-5 py-3 bg-slate-950 border border-white/5 rounded-xl text-white outline-none focus:border-emerald-500/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Client ID (Opsiyonel)</label>
                                        <input
                                            type="password"
                                            value={parasutSettings.clientId}
                                            onChange={(e) => setParasutSettings({ ...parasutSettings, clientId: e.target.value })}
                                            placeholder="Varsayılan kullanılacak"
                                            className="w-full px-5 py-3 bg-slate-950 border border-white/5 rounded-xl text-white outline-none focus:border-emerald-500/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Client Secret (Opsiyonel)</label>
                                        <input
                                            type="password"
                                            value={parasutSettings.clientSecret}
                                            onChange={(e) => setParasutSettings({ ...parasutSettings, clientSecret: e.target.value })}
                                            placeholder="Varsayılan kullanılacak"
                                            className="w-full px-5 py-3 bg-slate-950 border border-white/5 rounded-xl text-white outline-none focus:border-emerald-500/50"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Paraşüt API Base URL</label>
                                            <input
                                                type="text"
                                                value={parasutSettings.baseUrl}
                                                onChange={(e) => setParasutSettings({ ...parasutSettings, baseUrl: e.target.value })}
                                                placeholder="https://api.parasut.com/v4"
                                                className="w-full px-5 py-3 bg-slate-950 border border-white/5 rounded-xl text-white outline-none focus:border-emerald-500/50 text-xs"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                            <span className="text-xs font-bold text-white">Test Modu</span>
                                            <button
                                                onClick={() => setParasutSettings({ ...parasutSettings, isTest: !parasutSettings.isTest })}
                                                className={`w-10 h-5 rounded-full transition-all relative ${parasutSettings.isTest ? 'bg-amber-500' : 'bg-slate-700'}`}
                                            >
                                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${parasutSettings.isTest ? 'right-0.5' : 'left-0.5'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setInvoiceModal(null)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleSaveInvoiceSettings}
                                    disabled={saving}
                                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Ayarları Kaydet</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Trendyol GO Modal */}
            {trendyolModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-8 border-b border-white/10 sticky top-0 bg-slate-900 z-10">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center">
                                    <span className="font-black text-xl text-orange-500">TY</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white">Trendyol GO Ayarları</h3>
                                    <p className="text-xs text-slate-500 mt-1">{trendyolModal.tenantName}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Satıcı / Seller ID</label>
                                    <input
                                        type="text"
                                        value={trendyolSettings.sellerId}
                                        onChange={(e) => setTrendyolSettings({ ...trendyolSettings, sellerId: e.target.value })}
                                        className="w-full px-5 py-3 bg-slate-950 border border-white/5 rounded-xl text-white outline-none focus:border-orange-500/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Mağaza / Store ID</label>
                                    <input
                                        type="text"
                                        value={trendyolSettings.storeId}
                                        onChange={(e) => setTrendyolSettings({ ...trendyolSettings, storeId: e.target.value })}
                                        className="w-full px-5 py-3 bg-slate-950 border border-white/5 rounded-xl text-white outline-none focus:border-orange-500/50"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">API Key</label>
                                <input
                                    type="text"
                                    value={trendyolSettings.apiKey}
                                    onChange={(e) => setTrendyolSettings({ ...trendyolSettings, apiKey: e.target.value })}
                                    className="w-full px-5 py-3 bg-slate-950 border border-white/5 rounded-xl text-white outline-none focus:border-orange-500/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">API Secret</label>
                                <input
                                    type="password"
                                    value={trendyolSettings.apiSecret}
                                    onChange={(e) => setTrendyolSettings({ ...trendyolSettings, apiSecret: e.target.value })}
                                    className="w-full px-5 py-3 bg-slate-950 border border-white/5 rounded-xl text-white outline-none focus:border-orange-500/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Self Integration Token (Opsiyonel)</label>
                                <input
                                    type="password"
                                    value={trendyolSettings.token}
                                    onChange={(e) => setTrendyolSettings({ ...trendyolSettings, token: e.target.value })}
                                    className="w-full px-5 py-3 bg-slate-950 border border-white/5 rounded-xl text-white outline-none focus:border-orange-500/50"
                                />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                <div>
                                    <span className="text-sm font-bold text-white block">Test Modu (Stage)</span>
                                    <span className="text-[10px] text-slate-500">Gerçek sipariş/kurye kullanılmaz</span>
                                </div>
                                <button
                                    onClick={() => setTrendyolSettings({ ...trendyolSettings, stage: !trendyolSettings.stage })}
                                    className={`w-12 h-6 rounded-full transition-all relative ${trendyolSettings.stage ? 'bg-orange-500' : 'bg-slate-700'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${trendyolSettings.stage ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setTrendyolModal(null)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleSaveTrendyolSettings}
                                    disabled={saving}
                                    className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black shadow-lg shadow-orange-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
            {/* Warehouse Management Modal */}
            {warehouseModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
                        <div className="sticky top-0 bg-slate-900/80 backdrop-blur-md border-b border-white/10 p-8 flex items-center justify-between z-10">
                            <div>
                                <h3 className="text-2xl font-black text-white">{warehouseModal.tenantName} - Mağaza/Depo Yönetimi</h3>
                                <div className="flex items-center gap-4 mt-1">
                                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold font-mono">ID: {warehouseModal.tenantId}</p>
                                    <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                    <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">
                                        Limit: {warehousesList.length} / {tenants.find(t => t.id === warehouseModal.tenantId)?.max_stores || 1}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setWarehouseModal(null)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-8 flex-1">
                            {/* Fiziksel Mağazalar Bölümü */}
                            <div className="mb-10">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Building2 className="w-4 h-4" /> Fiziksel Mağazalar & Depolar
                                    </h4>
                                    <span className="text-[10px] font-black px-2 py-1 bg-white/5 rounded-lg text-slate-500">
                                        {warehousesList.filter(w => w.type !== 'virtual').length} / {tenants.find(t => t.id === warehouseModal.tenantId)?.max_stores || 1}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {warehousesList.filter(w => w.type !== 'virtual').map(w => (
                                        <div key={w.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                                                    <Home className="w-5 h-5 text-indigo-400" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-white font-bold">{w.name}</span>
                                                        {w.is_default && <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[8px] uppercase font-black">Varsayılan</span>}
                                                    </div>
                                                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">{w.type === 'store' ? 'Mağaza' : 'Depo'} | {w.code || 'Kodsuz'}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => setEditingWarehouse(w)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteWarehouse(w.id)} className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-500 transition-all">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Online Mağazalar Bölümü */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                        <Globe className="w-4 h-4" /> Online Mağazalar (Trendyol vb.)
                                    </h4>
                                    <span className="text-[10px] font-black px-2 py-1 bg-indigo-500/10 rounded-lg text-indigo-400">
                                        {warehousesList.filter(w => w.type === 'virtual').length} / {tenants.find(t => t.id === warehouseModal.tenantId)?.max_online_stores || 0}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {warehousesList.filter(w => w.type === 'virtual').map(w => (
                                        <div key={w.id} className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                                                    <Globe className="w-5 h-5 text-indigo-400" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-white font-bold">{w.name}</span>
                                                    </div>
                                                    <p className="text-[9px] text-indigo-400/50 uppercase tracking-widest font-bold">Virtual Store | {w.code || 'KODSUZ'}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => setEditingWarehouse(w)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteWarehouse(w.id)} className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-500 transition-all">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setEditingWarehouse({ name: '', code: '', type: 'virtual', address: '', is_default: false })}
                                        className="flex items-center justify-center gap-2 p-4 bg-white/5 border border-dashed border-white/10 hover:bg-white/10 text-slate-400 rounded-2xl font-bold transition-all"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Yeni Online Mağaza Ekle
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => setEditingWarehouse({ name: '', code: '', type: 'store', address: '', is_default: false })}
                                className="w-full flex items-center justify-center gap-2 p-4 bg-primary text-white rounded-2xl font-black transition-all shadow-lg shadow-primary/20 hover:scale-[1.01]"
                            >
                                <Plus className="w-5 h-5" />
                                Yeni Fiziksel Mağaza / Depo Ekle
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Warehouse Edit/Add Sub-Modal */}
            {editingWarehouse && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
                    <div className="bg-slate-900 border border-white/20 rounded-[2rem] max-w-lg w-full p-8 space-y-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xl font-black text-white">{editingWarehouse.id ? 'Mağazayı Düzenle' : 'Yeni Mağaza'}</h4>
                            <button onClick={() => setEditingWarehouse(null)} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Mağaza Adı</label>
                                <input
                                    type="text"
                                    value={editingWarehouse.name}
                                    onChange={e => setEditingWarehouse({ ...editingWarehouse, name: e.target.value })}
                                    className="w-full px-5 py-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-primary/50"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Tür</label>
                                    <select
                                        value={editingWarehouse.type}
                                        onChange={e => setEditingWarehouse({ ...editingWarehouse, type: e.target.value })}
                                        className="w-full px-5 py-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-primary/50"
                                    >
                                        <option value="store">Fiziksel Mağaza</option>
                                        <option value="warehouse">Depo</option>
                                        <option value="virtual">Online Mağaza (Trendyol vb.)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Mağaza Kodu</label>
                                    <input
                                        type="text"
                                        value={editingWarehouse.code}
                                        onChange={e => setEditingWarehouse({ ...editingWarehouse, code: e.target.value })}
                                        className="w-full px-5 py-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-primary/50"
                                        placeholder="Örn: M01"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                                <input
                                    type="checkbox"
                                    id="is_default"
                                    checked={editingWarehouse.is_default}
                                    onChange={e => setEditingWarehouse({ ...editingWarehouse, is_default: e.target.checked })}
                                    className="w-5 h-5 accent-primary"
                                />
                                <label htmlFor="is_default" className="text-sm text-slate-300 font-bold cursor-pointer">Varsayılan (Ana) Mağaza</label>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setEditingWarehouse(null)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all">İptal</button>
                            <button
                                onClick={() => handleSaveWarehouse(editingWarehouse)}
                                disabled={saving}
                                className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-black shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                            >
                                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Kaydet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Employee Management Modal */}
            {employeeModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                        <div className="sticky top-0 bg-slate-900/80 backdrop-blur-md border-b border-white/10 p-8 flex items-center justify-between z-10">
                            <div>
                                <h3 className="text-2xl font-black text-white">{employeeModal.tenantName} - Personel Yönetimi</h3>
                                <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Personel listesi, PIN kodları ve yetkilendirmeler</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setEditingStaff({ 
                                        first_name: '', last_name: '', position: '', pin_code: '', 
                                        status: 'active', monthly_salary: 0, 
                                        permissions: {
                                            can_access_pos: true, can_access_adisyon: true, can_access_reports: false,
                                            can_access_settings: false, can_access_inventory: true, can_access_expenses: false,
                                            can_access_crm: false, can_manage_employees: false, can_apply_discount: false, can_delete_sales: false
                                        } 
                                    })}
                                    className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all"
                                >
                                    <Plus className="w-4 h-4" /> Yeni Personel
                                </button>
                                <button onClick={() => setEmployeeModal(null)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>
                        </div>

                        <div className="p-8 flex-1 overflow-y-auto">
                            <div className="grid grid-cols-1 gap-3">
                                {employeesList.length === 0 ? (
                                    <div className="text-center py-20 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                                        <Users className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                                        <p className="text-slate-500 font-bold">Henüz personel tanımlanmamış.</p>
                                    </div>
                                ) : (
                                    employeesList.map(emp => (
                                        <div key={emp.id} className="p-5 bg-white/5 border border-white/10 rounded-[1.5rem] flex items-center justify-between group hover:bg-white/10 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                                                    <span className="text-emerald-500 font-black">{emp.first_name[0]}{emp.last_name[0]}</span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-white font-bold">{emp.first_name} {emp.last_name}</span>
                                                        <span className="px-2 py-0.5 bg-white/5 text-slate-500 rounded text-[8px] uppercase font-black">{emp.position}</span>
                                                        {emp.position?.toLowerCase() === 'patron' && <Sparkles className="w-3 h-3 text-amber-500" />}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">PIN: {emp.pin_code || '---'}</p>
                                                        <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                                        <p className={`text-[10px] font-black uppercase ${emp.status === 'active' ? 'text-emerald-400' : 'text-rose-400'}`}>{emp.status}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => setEditingStaff(emp)} className="p-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white rounded-lg transition-all" title="Düzenle">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteStaff(emp.id)} className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg transition-all" title="Sil">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Staff Edit Sub-Modal */}
            {editingStaff && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-6">
                    <div className="bg-slate-900 border border-white/20 rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
                        <div className="p-8 border-b border-white/10 flex items-center justify-between">
                            <h4 className="text-xl font-black text-white">{editingStaff.id ? 'Personel Düzenle' : 'Yeni Personel Ekle'}</h4>
                            <button onClick={() => setEditingStaff(null)} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Ad</label>
                                    <input type="text" value={editingStaff.first_name} onChange={e => setEditingStaff({ ...editingStaff, first_name: e.target.value })} className="w-full px-5 py-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-emerald-500/50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Soyad</label>
                                    <input type="text" value={editingStaff.last_name} onChange={e => setEditingStaff({ ...editingStaff, last_name: e.target.value })} className="w-full px-5 py-3 bg-black/40 border border-white/20 rounded-xl text-white outline-none focus:border-emerald-500/50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Pozisyon</label>
                                    <input type="text" value={editingStaff.position} onChange={e => setEditingStaff({ ...editingStaff, position: e.target.value })} className="w-full px-5 py-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-emerald-500/50" placeholder="Kasiyer, Garson, Patron vb." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">PIN Kodu (Sadece Sayı)</label>
                                    <input type="text" maxLength={6} value={editingStaff.pin_code} onChange={e => setEditingStaff({ ...editingStaff, pin_code: e.target.value.replace(/\D/g, '') })} className="w-full px-5 py-3 bg-black/40 border border-white/10 rounded-xl text-white font-mono tracking-widest outline-none focus:border-emerald-500/50" placeholder="1234" />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <h5 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                    <Shield className="w-3 h-3" /> Gelişmiş Yetkilendirme (RBAC)
                                </h5>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { id: 'can_access_pos', label: 'POS Ekranı' },
                                        { id: 'can_access_adisyon', label: 'Adisyonlar' },
                                        { id: 'can_access_reports', label: 'Raporlar' },
                                        { id: 'can_manage_employees', label: 'Personel Yön.' },
                                        { id: 'can_apply_discount', label: 'İskonto Yetkisi' },
                                        { id: 'can_delete_sales', label: 'İptal/Silme' },
                                        { id: 'can_manage_invoices', label: 'Fatura/İrsaliye' }
                                    ].map(perm => (
                                        <button 
                                            key={perm.id} 
                                            onClick={() => setEditingStaff({
                                                ...editingStaff,
                                                permissions: { ...editingStaff.permissions, [perm.id]: !editingStaff.permissions?.[perm.id] }
                                            })}
                                            className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${editingStaff.permissions?.[perm.id] ? 'bg-emerald-500/10 border-emerald-500/50 text-white' : 'bg-white/5 border-white/5 text-slate-500'}`}
                                        >
                                            <span className="text-[10px] font-black uppercase">{perm.label}</span>
                                            {editingStaff.permissions?.[perm.id] ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[9px] text-slate-500 italic">* Patron pozisyonundaki çalışanlar tüm yetkilere koşulsuz sahiptir.</p>
                            </div>
                        </div>

                        <div className="p-8 border-t border-white/10 flex gap-4">
                            <button onClick={() => setEditingStaff(null)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all">İptal</button>
                            <button 
                                onClick={() => handleSaveStaff(editingStaff)} 
                                disabled={saving}
                                className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-2"
                            >
                                {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-5 h-5" /> Kaydet</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
