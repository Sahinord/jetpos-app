import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyTenantAccess } from '@/lib/server-tenant-auth';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'no_key_for_build'
);

export async function GET(req: NextRequest) {
    const auth = await verifyTenantAccess(req);
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { data: tenant, error } = await supabase
        .from('tenants')
        .select('settings, features')
        .eq('id', auth.tenantId)
        .single();

    if (error || !tenant) {
        return NextResponse.json({ error: 'Tenant ayarları okunamadı' }, { status: 404 });
    }

    const settings = tenant.settings || {};
    const features = tenant.features || {};

    const t = settings.trendyol || {};
    const tg = settings.trendyolGo || {};

    // Sadece bağlantı durumu ve görüntülenebilir kimlikler döner — apiKey/apiSecret asla yok.
    return NextResponse.json({
        trendyol: {
            enabled: !!(features.trendyol_marketplace || settings.trendyol),
            connected: !!(t.apiKey && t.apiSecret && t.supplierId),
            supplierId: t.supplierId || null
        },
        trendyolGo: {
            enabled: !!(features.trendyol_go || settings.trendyolGo),
            connected: !!(tg.apiKey && tg.apiSecret && tg.sellerId),
            sellerId: tg.sellerId || null
        }
    });
}
