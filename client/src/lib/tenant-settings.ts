import { supabaseAdmin } from './supabase-admin';

export interface TenantSettings {
    qnb?: {
        erpCode?: string;
        testVkn?: string;
        earsivUsername?: string;
        testPassword?: string;
        baseUrl?: string;
        earsivBaseUrl?: string;
        connectorTestUrl?: string;
    };
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
