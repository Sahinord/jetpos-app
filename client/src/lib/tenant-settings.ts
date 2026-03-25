import { supabaseAdmin } from './supabase-admin';

export interface TenantSettings {
    qnb?: {
        erpCode?: string;
        isTest?: boolean;
        
        // Üretim (Production) Bilgileri
        vkn?: string;
        password?: string;
        earsivUsername?: string;
        
        // Test Ortamı Bilgileri
        testVkn?: string;
        testPassword?: string;
        testEarsivUsername?: string;

        // Özel URL Tanımları (Gerekirse)
        baseUrl?: string;
        earsivBaseUrl?: string;
        connectorBaseUrl?: string;

        // Şube/Kasa Kodları
        branchCode?: string;
        counterCode?: string;
    };
    parasut?: {
        clientId?: string;
        clientSecret?: string;
        username?: string;
        email?: string;
        password?: string;
        companyId?: string;
    };
    invoice_provider?: 'qnb' | 'parasut' | null;
    trendyolGo?: {
        sellerId?: string;
        storeId?: string;
        apiKey?: string;
        apiSecret?: string;
        agentName?: string;
        token?: string;
        stage?: boolean;
    };
    trendyol?: {
        supplierId?: string;
        apiKey?: string;
        apiSecret?: string;
    };
    [key: string]: any;
}

/**
 * Veritabanından (tenants tablosundaki settings kolonundan) ilgili dökkana ait API/Entegrasyon ayarlarını okur.
 * Tüm değerlerin Admin panelinden (ön yüz JSON editörü veya formlar üzerinden) girilmesi hedeflenmiştir.
 * 
 * @param tenantId Tenant (dükkan) UUID'si
 */
export async function getTenantSettings(tenantId: string): Promise<TenantSettings> {
    if (!tenantId) return {};

    try {
        const { data, error } = await supabaseAdmin
            .from('tenants')
            .select('settings')
            .eq('id', tenantId)
            .single();

        if (error || !data || !data.settings) {
            return {};
        }

        return data.settings as TenantSettings;
    } catch (err) {
        console.error('getTenantSettings error:', err);
        return {};
    }
}
