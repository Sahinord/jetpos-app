"use client";

import { useState, useEffect } from 'react';
import { Check, X, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/lib/tenant-context';

interface Feature {
    id: string;
    label: string;
    description: string;
}

const AVAILABLE_FEATURES: Feature[] = [
    { id: 'pos', label: 'Hızlı Satış (POS)', description: 'Satış terminali ekranı' },
    { id: 'products', label: 'Ürün Yönetimi', description: 'Ürün ekleme, düzenleme, silme' },
    { id: 'sales_history', label: 'Satış Geçmişi', description: 'Geçmiş satış kayıtları' },
    { id: 'profit_calculator', label: 'Kâr Hesaplama', description: 'Kar-zarar hesaplama aracı' },
    { id: 'price_simulator', label: 'Fiyat Simülasyonu', description: 'Toplu fiyat güncelleme simülatörü' },
    { id: 'reports', label: 'Akıllı Raporlar', description: 'Detaylı analiz raporları' },
    { id: 'trendyol_go', label: 'Trendyol GO', description: 'Trendyol GO entegrasyonu' },
    { id: 'invoice', label: 'E-Fatura', description: 'Otomatik fatura kesme' },
];

export default function FeatureManager() {
    const { currentTenant, refreshTenants } = useTenant();
    const [features, setFeatures] = useState<Record<string, boolean>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (currentTenant?.features) {
            setFeatures(currentTenant.features);
        }
    }, [currentTenant]);

    const toggleFeature = (featureId: string) => {
        setFeatures(prev => ({
            ...prev,
            [featureId]: !prev[featureId]
        }));
    };

    const handleSave = async () => {
        if (!currentTenant) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('tenants')
                .update({ features })
                .eq('id', currentTenant.id);

            if (error) throw error;

            await refreshTenants();
            alert('Özellikler başarıyla güncellendi! Sayfa yenileniyor...');
            window.location.reload();
        } catch (err: any) {
            alert('Hata: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (!currentTenant) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white">Özellik Yönetimi</h2>
                    <p className="text-sm text-secondary mt-1">
                        Bu lisans için aktif özellikleri belirleyin
                    </p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                >
                    <Save className="w-5 h-5" />
                    {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
            </div>

            {/* Current License Info */}
            <div className="glass-card p-6 border-l-4 border-l-primary">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-secondary font-bold uppercase tracking-wider">Aktif Lisans</p>
                        <h3 className="text-xl font-black text-white mt-1">{currentTenant.company_name}</h3>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-secondary font-bold uppercase tracking-wider">Lisans Anahtarı</p>
                        <p className="text-lg font-mono font-bold text-primary mt-1">{currentTenant.license_key}</p>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {AVAILABLE_FEATURES.map((feature) => {
                    const isActive = features[feature.id] === true;

                    return (
                        <button
                            key={feature.id}
                            onClick={() => toggleFeature(feature.id)}
                            className={`glass-card p-6 border-2 transition-all text-left ${isActive
                                    ? 'border-primary bg-primary/5'
                                    : 'border-white/10 hover:border-white/20'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isActive ? 'bg-primary/20' : 'bg-white/5'
                                    }`}>
                                    {isActive ? (
                                        <Check className="w-6 h-6 text-primary" />
                                    ) : (
                                        <X className="w-6 h-6 text-secondary" />
                                    )}
                                </div>

                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${isActive
                                        ? 'bg-emerald-500/10 text-emerald-400'
                                        : 'bg-red-500/10 text-red-400'
                                    }`}>
                                    {isActive ? 'Aktif' : 'Kapalı'}
                                </div>
                            </div>

                            <h4 className="text-lg font-bold text-white mb-1">{feature.label}</h4>
                            <p className="text-sm text-secondary">{feature.description}</p>
                        </button>
                    );
                })}
            </div>

            {/* Save Button (Bottom) */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-lg transition-all disabled:opacity-50 shadow-lg shadow-primary/30"
                >
                    <Save className="w-6 h-6" />
                    {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
            </div>
        </div>
    );
}
