import { NextRequest, NextResponse } from 'next/server';
import { verifyTenantAccess } from '@/lib/server-tenant-auth';
import { getHepsiburadaCredentials, hbCatalogRequest } from '@/lib/hepsiburada-server';

// Hızlı Ürün Yükleme — POST /product/api/products/fastlisting (düz JSON, multipart DEĞİL)
// Sadece HB kataloğunda barkodla zaten kayıtlı ürünler için çalışır.
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

        const enriched = products.map((p: any) => ({ ...p, merchant: creds.merchantId }));

        const data = await hbCatalogRequest(creds, '/product/api/products/fastlisting', {
            method: 'POST',
            body: JSON.stringify(enriched)
        });
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Hepsiburada Fast Listing Exception:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
