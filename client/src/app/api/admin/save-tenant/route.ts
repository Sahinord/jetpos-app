import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyTenantAccess } from '@/lib/server-tenant-auth';

// Service role key ile RLS bypass - lazy init (build sırasında env yokken hata vermesin)
function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function POST(req: NextRequest) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const body = await req.json();
        const { tenantId, updateData } = body;

        // Admin doğrulama — ESKİDEN: client'tan gönderilen 'adminPassword' body
        // alanı, NEXT_PUBLIC_ADMIN_PASSWORD'a (client JS bundle'ına gömülü,
        // gerçek bir sır değil) karşı kontrol ediliyordu — bu literal'i bundle'dan
        // okuyan HERKES, hiçbir tenant'a giriş yapmadan, herhangi bir tenant'ı
        // güncelleyebilirdi.
        //
        // ŞİMDİ: önce caller'ın GERÇEKTEN var olan bir tenant_id+license_key
        // çiftine sahip olduğu DB'ye sorularak doğrulanıyor (verifyTenantAccess —
        // bu değer kaynak kodda yok, tahmin edilemez). Sonra, doğrulanmış o
        // tenant'ın license_key'i admin tenant'ınkiyle eşleşiyor mu kontrol
        // ediliyor. Yani artık "bundle'dan bir string okudum" yetmiyor — gerçek
        // admin tenant'ın gerçek kimlik bilgilerine sahip olmak gerekiyor.
        const auth = await verifyTenantAccess(req);
        if (!auth.ok) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const licenseKey = req.headers.get('x-license-key');
        if (!process.env.ADMIN_SECRET_TOKEN || licenseKey !== process.env.ADMIN_SECRET_TOKEN) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        if (!tenantId || !updateData) {
            return NextResponse.json({ error: 'tenantId ve updateData gerekli' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('tenants')
            .update(updateData)
            .eq('id', tenantId)
            .select();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
