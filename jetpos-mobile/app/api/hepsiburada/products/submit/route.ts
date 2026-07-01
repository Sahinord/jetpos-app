import { NextRequest, NextResponse } from 'next/server';
import { verifyTenantAccess } from '@/lib/server-tenant-auth';
import { getHepsiburadaCredentials, hbCatalogUpload } from '@/lib/hepsiburada-server';

// Ürün Bilgisi Gönderme — body: { products: [...] } (dokümandaki JSON şeması)
export async function POST(req: NextRequest) {
    try {
        const auth = await verifyTenantAccess(req);
        if (!auth.ok) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const creds = await getHepsiburadaCredentials(auth.tenantId);
        if (!creds) {
            return NextResponse.json({ error: 'Hepsiburada entegrasyonu yapılandırılmamış' }, { status: 400 });
        }

        const body = await req.json().catch(() => ({}));
        const { products } = body;

        if (!Array.isArray(products) || products.length === 0) {
            return NextResponse.json({ error: 'products (dizi) gerekli' }, { status: 400 });
        }

        // merchant alanı kimlik bilgisinden zorunlu olarak set edilir — client'ın
        // başka bir merchantId göndermesi mümkün değil.
        const enriched = products.map((p: any) => ({ ...p, merchant: creds.merchantId }));

        const data = await hbCatalogUpload(creds, enriched);
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Hepsiburada Product Submit Exception:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
