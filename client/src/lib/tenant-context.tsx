"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, setCurrentTenant as setRLSTenant } from './supabase';

interface Tenant {
    id: string;
    license_key: string;
    company_name: string;
    contact_email?: string;
    logo_url: string | null;
    status: string;
    features: any;
    settings?: any;
    openrouter_api_key?: string;
    expires_at?: string;
    max_stores?: number;
    fixed_warehouses?: any[];
    setup_completed?: boolean;
    module_setup?: any;
    /**
     * Süper yönetici mi? (tenants.is_super_admin kolonu)
     * Bu bayrak, lisans anahtarını koda gömmenin yerini alır — anahtar artık
     * istemci paketinde bulunmaz. Yetkinin ASIL zorlandığı yer RLS'tir
     * (politikalar x-license-key header'ı + is_super_admin üzerinden kontrol
     * eder), buradaki bayrak yalnızca hangi ekranın gösterileceğini belirler.
     */
    is_super_admin?: boolean;
}

interface Warehouse {
    id: string;
    name: string;
    type: string;
    is_default: boolean;
    address?: string;
    platform?: string | null;
}

interface TenantContextType {
    currentTenant: Tenant | null;
    availableTenants: Tenant[];
    switchTenant: (tenantId: string) => void;
    refreshTenants: () => Promise<void>;
    loading: boolean;
    activeEmployee: any | null;
    setActiveEmployee: (emp: any) => void;
    logoutEmployee: () => void;
    verifyEmployeePin: (pin: string) => Promise<{ success: boolean; employee?: any; message?: string }>;
    isAccountant: boolean;
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
    const [activeEmployee, setActiveEmployee] = useState<any | null>(null);

    const [isAccountant, setIsAccountant] = useState(false);

    const logoutEmployee = () => {
        setActiveEmployee(null);
        localStorage.removeItem('activeEmployee');
    };

    const verifyEmployeePin = async (pin: string) => {
        if (!currentTenant) return { success: false, message: 'Tenant bulunamadı' };
        
        try {
            const { data, error } = await supabase.rpc('verify_employee_pin', {
                p_tenant_id: currentTenant.id,
                p_pin_code: pin
            });

            if (error) throw error;
            if (data.success) {
                setActiveEmployee(data.employee);
                localStorage.setItem('activeEmployee', JSON.stringify(data.employee));
                return { success: true, employee: data.employee };
            } else {
                return { success: false, message: data.message };
            }
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    };

    const fetchTenants = async () => {
        setLoading(true);
        // console.log("🚀 [TenantContext] fetchTenants started...");
        
        // Failsafe: 10 saniye sonra her ne olursa olsun loading'i kapat
        const failsafeTimeout = setTimeout(() => {
            console.warn("⚠️ [TenantContext] Failsafe timeout reached. Forcing loading to false.");
            setLoading(false);
        }, 10000);

        try {
            // LocalStorage'dan lisans kontrolü
            let savedLicenseKey = localStorage.getItem('licenseKey');
            const savedTenantId = localStorage.getItem('currentTenantId');

            // console.log("📍 [TenantContext] LocalStorage state:", { savedLicenseKey, savedTenantId });

            if (!savedLicenseKey || !savedTenantId) {
                // console.log("ℹ️ [TenantContext] No saved license or tenant ID. Showing LicenseGate.");
                setLoading(false);
                clearTimeout(failsafeTimeout);
                return;
            }

            // Accountant Check
            if (savedLicenseKey.toLowerCase().startsWith('m')) {
                setIsAccountant(true);
                // Strip the 'M' prefix for the RPC call if necessary, 
                // but let's see if the RPC handles it or if we should just keep it.
                // The user said "başına m ekleyerek sisteme girip", 
                // so the actual license in DB doesn't have 'm'.
                savedLicenseKey = savedLicenseKey.substring(1);
            }

            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(savedTenantId)) {
                console.error("❌ [TenantContext] Invalid Tenant ID format:", savedTenantId);
                localStorage.removeItem('currentTenantId');
                localStorage.removeItem('licenseKey');
                setLoading(false);
                clearTimeout(failsafeTimeout);
                return;
            }

            // console.log("📡 [TenantContext] Validating license via RPC...");
            
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Supabase RPC timeout")), 8000)
            );

            const rpcPromise = supabase.rpc('validate_license', {
                p_tenant_id:   savedTenantId,
                p_license_key: savedLicenseKey
            });

            const { data, error } = await Promise.race([rpcPromise, timeoutPromise]) as any;

            if (error || !data) {
                console.error("❌ [TenantContext] License validation failed. Details:", {
                    error,
                    errorMessage: error?.message,
                    errorCode: error?.code,
                    errorDetails: error?.details,
                    errorHint: error?.hint,
                    data,
                    savedTenantId,
                    savedLicenseKey
                });
                if (!data && !error) {
                    // console.log("🗑️ [TenantContext] Tenant not found, clearing state.");
                    localStorage.removeItem('licenseKey');
                    localStorage.removeItem('currentTenantId');
                }
                setLoading(false);
                clearTimeout(failsafeTimeout);
                return;
            }

            // console.log("✅ [TenantContext] License validated for:", data.company_name);
            
            // console.log("🔐 [TenantContext] Setting RLS context...");
            await setRLSTenant(data.id);

            // RPC tüm alanları döndürmüyor (fixed_warehouses, openrouter_api_key gibi)
            // Tam tenant verisini çek (RLS set edildikten SONRA yapılmalı!)
            const { data: fullTenant } = await supabase
                .from('tenants')
                .select('fixed_warehouses, openrouter_api_key, master_pin, expires_at, is_super_admin')
                .eq('id', data.id)
                .single();

            const enrichedTenant = {
                ...data,
                fixed_warehouses: fullTenant?.fixed_warehouses || [],
                openrouter_api_key: fullTenant?.openrouter_api_key || data.openrouter_api_key,
                master_pin: fullTenant?.master_pin || data.master_pin,
                expires_at: fullTenant?.expires_at || data.expires_at,
                is_super_admin: fullTenant?.is_super_admin === true,
            };

            setCurrentTenant(enrichedTenant);
            setAvailableTenants([enrichedTenant]);

            // console.log("🚀 [TenantContext] Initialization complete. fixed_warehouses:", enrichedTenant.fixed_warehouses?.length || 0);

        } catch (error: any) {
            console.error('🔥 [TenantContext] Critical Error:', error.message || error);
        } finally {
            // console.log("🏁 [TenantContext] fetchTenants finished.");
            setLoading(false);
            clearTimeout(failsafeTimeout);
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

        // Persistence check
        const savedEmp = localStorage.getItem('activeEmployee');
        if (savedEmp) {
            try {
                setActiveEmployee(JSON.parse(savedEmp));
            } catch (e) {}
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
                activeEmployee,
                setActiveEmployee,
                logoutEmployee,
                verifyEmployeePin,
                isAccountant,
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
