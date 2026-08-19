import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyTenantAccess } from '@/lib/server-tenant-auth';

// SüperAdmin — yeni lisans (tenant) oluşturma. Service role ile RLS bypass.
// Client'tan doğrudan INSERT RLS'e takılıyordu; oluşturma buradan yapılır.
// Yetki: save-tenant ile aynı (verifyTenantAccess + x-license-key === ADMIN_SECRET_TOKEN).
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function admin() {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function POST(req: NextRequest) {
    try {
        const auth = await verifyTenantAccess(req);
        if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
        const licenseKey = req.headers.get('x-license-key');
        if (!process.env.ADMIN_SECRET_TOKEN || licenseKey !== process.env.ADMIN_SECRET_TOKEN) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { tenant } = await req.json();
        if (!tenant || !tenant.license_key) {
            return NextResponse.json({ error: 'license_key gerekli' }, { status: 400 });
        }

        const sb = admin();

        // Aynı lisans var mı? (unique çakışması net mesaj olsun)
        const { data: existing } = await sb.from('tenants').select('id').eq('license_key', tenant.license_key).maybeSingle();
        if (existing) {
            return NextResponse.json({ error: 'Bu lisans anahtarı zaten kullanılıyor.' }, { status: 409 });
        }

        const { data, error } = await sb.from('tenants').insert([{
            license_key: tenant.license_key,
            company_name: tenant.company_name || null,
            logo_url: tenant.logo_url ?? null,
            contact_email: tenant.contact_email ?? null,
            features: tenant.features ?? { pos: true, products: true },
            openrouter_api_key: tenant.openrouter_api_key ?? null,
            max_stores: tenant.max_stores || 1,
            max_online_stores: tenant.max_online_stores || 0,
            status: tenant.status || 'active',
            fixed_warehouses: tenant.fixed_warehouses ?? [],
        }]).select().single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, tenant: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
