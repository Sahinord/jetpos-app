import { NextRequest, NextResponse } from 'next/server';
import { verifyTenantAccess } from '@/lib/server-tenant-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
    const auth = await verifyTenantAccess(req);
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { data: tenant, error } = await supabaseAdmin
        .from('tenants')
        .select('settings, features')
        .eq('id', auth.tenantId)
        .single();

    if (error || !tenant) {
        return NextResponse.json({ error: 'Tenant ayarları okunamadı' }, { status: 404 });
    }

    const settings = tenant.settings || {};
    const features = tenant.features || {};
    const hb = settings.hepsiburada || {};

    return NextResponse.json({
        enabled: !!(features.hepsiburada_marketplace || settings.hepsiburada),
        connected: !!(hb.merchantId && hb.username && hb.password),
        stage: hb.stage === true
    });
}
