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
    openrouter_api_key?: string;
}

interface Warehouse {
    id: string;
    name: string;
    type: string;
    is_default: boolean;
    address?: string;
}

interface TenantContextType {
    currentTenant: Tenant | null;
    availableTenants: Tenant[];
    switchTenant: (tenantId: string) => void;
    refreshTenants: () => Promise<void>;
    loading: boolean;
    activeWarehouse: Warehouse | null;
    setActiveWarehouse: (warehouse: Warehouse | null) => void;
    warehouses: Warehouse[];
    refreshWarehouses: () => Promise<void>;
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

    const [activeWarehouse, setActiveWarehouse] = useState<Warehouse | null>(null);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

    useEffect(() => {
        if (currentTenant) {
            fetchWarehouses();
        }
    }, [currentTenant]);

    const fetchWarehouses = async () => {
        const { data } = await supabase
            .from('warehouses')
            .select('*')
            .eq('tenant_id', currentTenant?.id)
            .eq('is_active', true);
        
        if (data) {
            setWarehouses(data);
            // If we have saved warehouse but it's not in the list (deleted/disabled), clear it
            const saved = localStorage.getItem('activeWarehouse');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    const found = data.find(w => w.id === parsed.id);
                    if (found) {
                        setActiveWarehouse(found);
                    } else {
                        localStorage.removeItem('activeWarehouse');
                        setActiveWarehouse(null);
                    }
                } catch (e) {
                    localStorage.removeItem('activeWarehouse');
                    setActiveWarehouse(null);
                }
            }
        }
    };

    const handleSetActiveWarehouse = (w: Warehouse | null) => {
        setActiveWarehouse(w);
        if (w) localStorage.setItem('activeWarehouse', JSON.stringify(w));
        else localStorage.removeItem('activeWarehouse');
    };

    return (
        <TenantContext.Provider
            value={{
                currentTenant,
                availableTenants,
                switchTenant,
                refreshTenants,
                loading,
                activeWarehouse,
                setActiveWarehouse: handleSetActiveWarehouse,
                warehouses,
                refreshWarehouses: fetchWarehouses
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
