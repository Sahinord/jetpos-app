import { NextRequest, NextResponse } from 'next/server';
import { verifyTenantAccess } from '@/lib/server-tenant-auth';
import { getHepsiburadaCredentials, hbCatalogRequest, qs } from '@/lib/hepsiburada-server';

// Mağaza Bazlı Ürün Bilgisi Listeleme
// GET /product/api/products/all-products-of-merchant/{merchantId}
export async function GET(req: NextRequest) {
    try {
        const auth = await verifyTenantAccess(req);
        if (!auth.ok) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const creds = await getHepsiburadaCredentials(auth.tenantId);
        if (!creds) {
            return NextResponse.json({ error: 'Hepsiburada entegrasyonu yapılandırılmamış' }, { status: 400 });
        }

        const { searchParams } = new URL(req.url);
        const path = `/product/api/products/all-products-of-merchant/${creds.merchantId}${qs({
            barcode: searchParams.get('barcode'),
            merchantSku: searchParams.get('merchantSku'),
            hbSku: searchParams.get('hbSku'),
            page: searchParams.get('page') ?? '0',
            size: searchParams.get('size') ?? '1000'
        })}`;

        const data = await hbCatalogRequest(creds, path, { method: 'GET' });
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Hepsiburada Merchant Products Exception:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
