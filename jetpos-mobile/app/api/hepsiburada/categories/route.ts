import { NextRequest, NextResponse } from 'next/server';
import { verifyTenantAccess } from '@/lib/server-tenant-auth';
import { getHepsiburadaCredentials, hbCatalogRequest, qs } from '@/lib/hepsiburada-server';

// Kategori Bilgilerini Alma — GET /product/api/categories/get-all-categories
// (resmi Hepsiburada Katalog Ürün Girişi dokümantasyonundan birebir doğrulandı)
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
        const path = `/product/api/categories/get-all-categories${qs({
            leaf: searchParams.get('leaf') ?? 'true',
            status: searchParams.get('status') ?? 'ACTIVE',
            available: searchParams.get('available') ?? 'true',
            page: searchParams.get('page') ?? '0',
            size: searchParams.get('size') ?? '1000'
        })}`;

        const data = await hbCatalogRequest(creds, path, { method: 'GET' });
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Hepsiburada Categories Exception:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
