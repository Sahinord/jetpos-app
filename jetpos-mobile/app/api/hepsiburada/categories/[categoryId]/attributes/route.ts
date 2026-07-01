import { NextRequest, NextResponse } from 'next/server';
import { verifyTenantAccess } from '@/lib/server-tenant-auth';
import { getHepsiburadaCredentials, hbCatalogRequest } from '@/lib/hepsiburada-server';

// Kategori Özelliklerini Alma — GET /product/api/categories/{categoryId}/attributes
export async function GET(req: NextRequest, { params }: { params: Promise<{ categoryId: string }> }) {
    try {
        const auth = await verifyTenantAccess(req);
        if (!auth.ok) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const creds = await getHepsiburadaCredentials(auth.tenantId);
        if (!creds) {
            return NextResponse.json({ error: 'Hepsiburada entegrasyonu yapılandırılmamış' }, { status: 400 });
        }

        const { categoryId } = await params;
        const data = await hbCatalogRequest(creds, `/product/api/categories/${categoryId}/attributes`, { method: 'GET' });
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Hepsiburada Category Attributes Exception:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
