import { NextRequest, NextResponse } from 'next/server';
import { verifyTenantAccess } from '@/lib/server-tenant-auth';
import { getHepsiburadaCredentials, hbCatalogRequest, qs } from '@/lib/hepsiburada-server';

// Özellik Değerini Alma — GET /product/api/categories/{categoryId}/attribute/{attributeId}/values
export async function GET(req: NextRequest, { params }: { params: Promise<{ categoryId: string; attributeId: string }> }) {
    try {
        const auth = await verifyTenantAccess(req);
        if (!auth.ok) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const creds = await getHepsiburadaCredentials(auth.tenantId);
        if (!creds) {
            return NextResponse.json({ error: 'Hepsiburada entegrasyonu yapılandırılmamış' }, { status: 400 });
        }

        const { categoryId, attributeId } = await params;
        const { searchParams } = new URL(req.url);
        const path = `/product/api/categories/${categoryId}/attribute/${attributeId}/values${qs({
            page: searchParams.get('page') ?? '0',
            size: searchParams.get('size') ?? '1000'
        })}`;

        const data = await hbCatalogRequest(creds, path, { method: 'GET' });
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Hepsiburada Attribute Values Exception:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
