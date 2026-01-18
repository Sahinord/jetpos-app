"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabase';

interface Tenant {
    id: string;
    license_key: string;
    company_name: string;
    contact_email?: string;
    password?: string;
    logo_url: string | null;
    status: string;
    features: any;
}

interface TenantContextType {
    currentTenant: Tenant | null;
    availableTenants: Tenant[];
    switchTenant: (tenantId: string) => void;
    refreshTenants: () => Promise<void>;
    loading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
    const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
    const [availableTenants, setAvailableTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTenants = async () => {
        try {
            // LocalStorage'dan lisans kontrolü
            const savedLicenseKey = localStorage.getItem('licenseKey');
            const savedTenantId = localStorage.getItem('currentTenantId');

            if (!savedLicenseKey || !savedTenantId) {
                // Lisans yok - direkt loading false yap
                setLoading(false);
                return;
            }

            // Lisans var - kontrol et
            const { data, error } = await supabase
                .from('tenants')
                .select('*')
                .eq('id', savedTenantId)
                .eq('license_key', savedLicenseKey)
                .eq('status', 'active')
                .single();

            if (error || !data) {
                // Geçersiz lisans olabilir ama bağlantı hatası da olabilir.
                // Hemen silmek yerine loglayıp devam etmiyoruz, kullanıcı manuel çıkış yapmalı.
                console.error("License validation failed:", error);

                // Sadece veritabanından açıkça "bulunamadı" geldiyse sil
                if (!data && !error) {
                    localStorage.removeItem('licenseKey');
                    localStorage.removeItem('currentTenantId');
                }
                setLoading(false);
                return;
            }

            // Geçerli lisans - tenant'ı set et
            setCurrentTenant(data);
            setAvailableTenants([data]);

            // 🔥 RLS için tenant context'i set et
            const { setCurrentTenant: setRLSTenant } = await import('./supabase');
            await setRLSTenant(data.id);

        } catch (error: any) {
            console.error('Tenant fetch error:', error.message);
            localStorage.clear();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    const switchTenant = (tenantId: string) => {
        const tenant = availableTenants.find(t => t.id === tenantId);
        if (tenant) {
            setCurrentTenant(tenant);
            localStorage.setItem('currentTenantId', tenantId);
            // Sayfa yenileme - tüm veri tenant'a göre değişecek
            window.location.reload();
        }
    };

    const refreshTenants = async () => {
        await fetchTenants();
    };

    return (
        <TenantContext.Provider
            value={{
                currentTenant,
                availableTenants,
                switchTenant,
                refreshTenants,
                loading
            }}
        >
            {children}
        </TenantContext.Provider>
    );
}

export function useTenant() {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
}
