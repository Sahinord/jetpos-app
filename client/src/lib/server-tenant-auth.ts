import { supabaseAdmin } from './supabase-admin';

/**
 * service-role client kullanan route'lar RLS'i tamamen bypass eder, bu yuzden
 * istekteki tenantId/tenant_id parametresine asla korkorlukle guvenilmemeli.
 * Bu fonksiyon, isteğin x-tenant-id + x-license-key header'larini gercek
 * tenants tablosuna karsi dogrular - tenant_id + license_key eslesmiyorsa
 * (veya header'lar eksikse) erisim reddedilir.
 *
 * claimedTenantId verilirse, header'daki tenant ile ayni olmasi da sart -
 * yoksa "kendi lisansinla baska bir tenantId gonder" sacmasi mumkun olurdu.
 */
export async function verifyTenantAccess(
    request: Request,
    claimedTenantId?: string | null
): Promise<{ ok: true; tenantId: string } | { ok: false; status: number; error: string }> {
    const headerTenantId = request.headers.get('x-tenant-id');
    const licenseKey = request.headers.get('x-license-key');

    if (!headerTenantId || !licenseKey) {
        return { ok: false, status: 401, error: 'Kimlik bilgileri eksik (x-tenant-id / x-license-key)' };
    }

    if (claimedTenantId && claimedTenantId !== headerTenantId) {
        return { ok: false, status: 403, error: 'Tenant uyuşmazlığı' };
    }

    // Login ile AYNI doğrulama: validate_license RPC.
    // Böylece süper admin bypass'ı (ADM257SA67 ile herhangi bir tenant üzerinde
    // çalışma) da desteklenir. Eski direkt "license_key = X" kolon eşleşmesi,
    // süper admin başka bir tenant'ta işlem yaparken "Geçersiz lisans bilgisi"
    // 403'ü veriyordu (trendyol sync, odeal save vb.).
    const { data, error } = await supabaseAdmin.rpc('validate_license', {
        p_tenant_id: headerTenantId,
        p_license_key: licenseKey,
    });

    if (error || !data) {
        return { ok: false, status: 403, error: 'Geçersiz lisans bilgisi' };
    }

    return { ok: true, tenantId: headerTenantId };
}
