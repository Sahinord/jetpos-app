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
    activeEmployee: any | null;
    setActiveEmployee: (emp: any) => void;
    logoutEmployee: () => void;
    verifyEmployeePin: (pin: string) => Promise<{ success: boolean; employee?: any; message?: string }>;
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
        try {
            console.log("🔍 Checking tenant context...");
            
            // LocalStorage'dan lisans kontrolü
            const savedLicenseKey = localStorage.getItem('licenseKey');
            const savedTenantId = localStorage.getItem('currentTenantId');

            console.log("📍 LocalStorage state:", { savedLicenseKey, savedTenantId });

            if (!savedLicenseKey || !savedTenantId) {
                console.log("ℹ️ No saved license or tenant ID found. Redirecting to license gate.");
                setLoading(false);
                return;
            }

            // UUID format kontrolü (validate_license RPC hatasını önlemek için)
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(savedTenantId)) {
                console.error("❌ Invalid Tenant ID format in localStorage:", savedTenantId);
                localStorage.removeItem('currentTenantId');
                localStorage.removeItem('licenseKey');
                setLoading(false);
                return;
            }

            // Lisans var - RPC ile güvenli doğrula (Timeout eklenmiş)
            console.log("📡 Validating license via RPC...");
            
            // Timeout promise
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Supabase RPC timeout")), 15000)
            );

            // RPC call promise
            const rpcPromise = supabase.rpc('validate_license', {
                p_tenant_id:   savedTenantId,
                p_license_key: savedLicenseKey
            });

            // Race them
            const { data, error } = await Promise.race([rpcPromise, timeoutPromise]) as any;

            if (error || !data) {
                console.error("❌ License validation failed or returned no data:", error);

                // Sadece kesin "bulunamadı" ise temizle
                if (!data && !error) {
                    console.log("🗑️ Tenant not found, clearing local state.");
                    localStorage.removeItem('licenseKey');
                    localStorage.removeItem('currentTenantId');
                }
                setLoading(false);
                return;
            }

            console.log("✅ License validated successfully for:", data.company_name);

            // Geçerli lisans - tenant'ı set et
            setCurrentTenant(data);
            setAvailableTenants([data]);

            // 🔥 RLS için tenant context'i set et
            console.log("🔐 Setting RLS tenant context...");
            await setRLSTenant(data.id);
            console.log("🚀 Tenant initialization complete.");

        } catch (error: any) {
            console.error('🔥 Critical Tenant fetch error:', error.message || error);
            // Kritik hata durumunda temizleme yapmadan önce bir kez daha düşün
            // localStorage.clear(); 
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
