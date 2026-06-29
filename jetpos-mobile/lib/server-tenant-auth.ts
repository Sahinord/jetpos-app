import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'no_key_for_build'
);

/**
 * Service-role key kullanan route'lar RLS'i tamamen bypass eder, bu yuzden
 * istekteki tenantId/tenant_id parametresine asla korkorlukle guvenilmemeli.
 * Bu fonksiyon, isteğin x-tenant-id + x-license-key header'larini gercek
 * tenants tablosuna karsi dogrular (bkz. client/src/lib/server-tenant-auth.ts —
 * ayni mimari, bu app'in kendi backend'i icin ayri kopya).
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

    const { data, error } = await supabaseAdmin
        .from('tenants')
        .select('id')
        .eq('id', headerTenantId)
        .eq('license_key', licenseKey)
        .maybeSingle();

    if (error || !data) {
        return { ok: false, status: 403, error: 'Geçersiz lisans bilgisi' };
    }

    return { ok: true, tenantId: headerTenantId };
}
