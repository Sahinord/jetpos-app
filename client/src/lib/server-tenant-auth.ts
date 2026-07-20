import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin, hasServiceRoleKey } from '@/lib/supabase-admin';

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

    // 1) Süper admin kısa devre — ortam değişkeniyle (ADMIN_SECRET_TOKEN).
    //    GÜVENLİK: Eski sabit anahtar ('ADM257SA67') KALDIRILDI — istemci
    //    paketinde yayınlandığı için ele geçmiş sayılıyor ve artık hiçbir
    //    yerde geçerli olmamalı. Yeni anahtar koda değil env'e yazılır;
    //    rotasyon Vercel panelinden, dağıtımsız yapılır.
    if (process.env.ADMIN_SECRET_TOKEN && licenseKey === process.env.ADMIN_SECRET_TOKEN) {
        return { ok: true, tenantId: headerTenantId };
    }

    // 2) Normal tenant: LOGIN İLE AYNI RPC (anon key). validate_license, id+license
    //    eşleşen aktif tenant'ı döner.
    try {
        const anon = getAnonSupabase();
        const { data, error } = await anon.rpc('validate_license', {
            p_tenant_id: headerTenantId,
            p_license_key: licenseKey,
        });
        if (!error && data) {
            return { ok: true, tenantId: headerTenantId };
        }
    } catch (e) {
        console.error('[auth] validate_license çağrısı hatası:', e);
    }

    // 3) Süper admin (DB kontrollü): gönderilen anahtar, is_super_admin=true olan
    //    aktif kayda aitse her tenant'ta işlem yapabilir (impersonation dahil —
    //    o durumda headerTenantId hedef işletmedir, validate_license eşleşmez ve
    //    buraya düşer). Anahtar rotasyonu DB'de yapıldığı an burada da geçerli olur.
    if (hasServiceRoleKey) {
        try {
            const { data: adminRow } = await supabaseAdmin
                .from('tenants')
                .select('id')
                .eq('license_key', licenseKey)
                .eq('is_super_admin', true)
                .eq('status', 'active')
                .maybeSingle();
            if (adminRow) {
                return { ok: true, tenantId: headerTenantId };
            }
        } catch (e) {
            console.error('[auth] süper admin DB kontrolü hatası:', e);
        }
    }

    console.warn(`[auth] Geçersiz lisans: tenant=${headerTenantId} keyLen=${licenseKey.length}`);
    return { ok: false, status: 403, error: 'Geçersiz lisans bilgisi' };
}
