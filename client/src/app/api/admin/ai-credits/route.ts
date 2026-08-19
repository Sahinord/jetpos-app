import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyTenantAccess } from '@/lib/server-tenant-auth';

// SüperAdmin — işletme AI kredi yönetimi (service role, RLS bypass).
// Yetki: save-tenant ile aynı model (verifyTenantAccess + x-license-key === ADMIN_SECRET_TOKEN).
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function admin() {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function POST(req: NextRequest) {
    try {
        const auth = await verifyTenantAccess(req);
        if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
        const sb = admin();
        // Yetki: env token VEYA DB'de is_super_admin=true aktif lisans (login ile aynı).
        const licenseKey = req.headers.get('x-license-key') || '';
        const isEnvAdmin = !!process.env.ADMIN_SECRET_TOKEN && licenseKey === process.env.ADMIN_SECRET_TOKEN;
        let isDbAdmin = false;
        if (!isEnvAdmin && licenseKey) {
            const { data: sa } = await sb.from('tenants').select('id').eq('license_key', licenseKey).eq('is_super_admin', true).eq('status', 'active').maybeSingle();
            isDbAdmin = !!sa;
        }
        if (!isEnvAdmin && !isDbAdmin) {
            return NextResponse.json({ error: 'Yetkisiz erişim (süperadmin değil)' }, { status: 403 });
        }

        const { action, tenantId, enabled, dailyLimit, addCredits } = await req.json();
        if (!tenantId) return NextResponse.json({ error: 'tenantId gerekli' }, { status: 400 });

        // Durum getir
        if (action === 'get') {
            const { data, error } = await sb.rpc('ai_credit_status', { p_tenant: tenantId });
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            return NextResponse.json({ success: true, status: data });
        }

        // Ekstra kredi ekle (satın alma / hediye)
        if (action === 'addCredits') {
            const amount = Math.max(1, Math.floor(Number(addCredits) || 0));
            // mevcut ayarı garantiye al
            await sb.from('ai_settings').upsert({ tenant_id: tenantId }, { onConflict: 'tenant_id', ignoreDuplicates: true });
            const { data: cur } = await sb.from('ai_settings').select('extra_credits').eq('tenant_id', tenantId).maybeSingle();
            const next = (Number(cur?.extra_credits) || 0) + amount;
            const { error } = await sb.from('ai_settings').update({ extra_credits: next, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId);
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            return NextResponse.json({ success: true, extra_credits: next });
        }

        // Ayarları güncelle (aç/kapa + günlük limit)
        if (action === 'set') {
            const payload: Record<string, any> = { tenant_id: tenantId, updated_at: new Date().toISOString() };
            if (typeof enabled === 'boolean') payload.enabled = enabled;
            if (dailyLimit !== undefined) payload.daily_limit = Math.max(0, Math.floor(Number(dailyLimit) || 0));
            const { error } = await sb.from('ai_settings').upsert(payload, { onConflict: 'tenant_id' });
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Geçersiz action (get|set|addCredits)' }, { status: 400 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
