import { NextRequest, NextResponse } from 'next/server';
import { verifyTenantAccess } from '@/lib/server-tenant-auth';
import { getHepsiburadaCredentials, hbCatalogRequest, qs } from '@/lib/hepsiburada-server';

// Ürün Durumu Sorgulama — GET /product/api/products/status/{trackingId}
// (endpoint path Endpoints sabitlerinden doğrulandı: "product/api/products/status/@trackingID";
// resmi doküman sayfasında kod örneği görülmedi — canlıda ilk denemede teyit edilmeli)
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
        const trackingId = searchParams.get('trackingId');
        if (!trackingId) {
            return NextResponse.json({ error: 'trackingId gerekli' }, { status: 400 });
        }

        const path = `/product/api/products/status/${trackingId}${qs({
            page: searchParams.get('page') ?? '0',
            size: searchParams.get('size') ?? '100'
        })}`;

        const data = await hbCatalogRequest(creds, path, { method: 'GET' });
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Hepsiburada Product Status Exception:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
