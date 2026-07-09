import { createClient } from '@supabase/supabase-js';

// Login ile AYNI doğrulama için anon key + validate_license RPC kullanılır.
// (validate_license RPC anon'a EXECUTE izinli; service-role key eksik/izinsiz
//  olsa bile çalışır. Ayrıca RPC SECURITY DEFINER olduğu için RLS'i bypass eder.)
function getAnonSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
    );
}

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

    // ═══ [ODEAL DEBUG] geçici hata ayıklama logları (şimdilik) ═══
    console.log('[ODEAL DEBUG] verifyTenantAccess giriş', {
        tenant: headerTenantId || '(yok)',
        keyLen: (licenseKey || '').length,
        hasAnonUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });

    if (!headerTenantId || !licenseKey) {
        console.warn('[ODEAL DEBUG] verifyTenantAccess: header EKSİK', { hasTenant: !!headerTenantId, hasKey: !!licenseKey });
        return { ok: false, status: 401, error: 'Kimlik bilgileri eksik (x-tenant-id / x-license-key)' };
    }

    if (claimedTenantId && claimedTenantId !== headerTenantId) {
        console.warn('[ODEAL DEBUG] verifyTenantAccess: tenant uyuşmazlığı', { claimedTenantId, headerTenantId });
        return { ok: false, status: 403, error: 'Tenant uyuşmazlığı' };
    }

    // 1) Süper admin kısa devre (ADM257SA67 / ADMIN_SECRET_TOKEN) — her tenant'ta işlem
    const SUPER_ADMIN_KEY = 'ADM257SA67';
    if (licenseKey === SUPER_ADMIN_KEY ||
        (process.env.ADMIN_SECRET_TOKEN && licenseKey === process.env.ADMIN_SECRET_TOKEN)) {
        console.log('[ODEAL DEBUG] verifyTenantAccess: SÜPER ADMIN bypass', { tenantId: headerTenantId });
        return { ok: true, tenantId: headerTenantId };
    }

    // 2) Normal tenant: LOGIN İLE AYNI RPC (anon key). validate_license, id+license
    //    eşleşen aktif tenant'ı döner; süper admin bypass'ı da içerir.
    try {
        const anon = getAnonSupabase();
        const { data, error } = await anon.rpc('validate_license', {
            p_tenant_id: headerTenantId,
            p_license_key: licenseKey,
        });
        console.log('[ODEAL DEBUG] verifyTenantAccess: validate_license sonucu', {
            hasData: !!data,
            data: data ?? null,
            error: error?.message || null,
        });
        if (error || !data) {
            console.warn(`[ODEAL DEBUG] verifyTenantAccess: Geçersiz lisans tenant=${headerTenantId} keyLen=${licenseKey.length} err=${error?.message || 'null'}`);
            return { ok: false, status: 403, error: 'Geçersiz lisans bilgisi' };
        }
        console.log('[ODEAL DEBUG] verifyTenantAccess: OK', { tenantId: headerTenantId });
        return { ok: true, tenantId: headerTenantId };
    } catch (e) {
        console.error('[ODEAL DEBUG] verifyTenantAccess: validate_license çağrısı HATASI:', e);
        return { ok: false, status: 403, error: 'Geçersiz lisans bilgisi' };
    }
}
