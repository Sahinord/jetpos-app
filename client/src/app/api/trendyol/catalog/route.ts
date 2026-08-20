import { NextRequest, NextResponse } from 'next/server';
import { createTrendyolGoClient } from '@/lib/trendyol-go-client';
import { verifyTenantAccess } from '@/lib/server-tenant-auth';

// Trendyol GO Market — marka/kategori listeleme (ürün aktarımında brandId/categoryId seçmek için).
//   GET /api/trendyol/catalog?tenantId=..&type=brands[&q=isim]
//   GET /api/trendyol/catalog?tenantId=..&type=categories&leaf=true
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const tenantId = searchParams.get('tenantId') || '';
        const type = searchParams.get('type') || 'categories';
        if (!tenantId) return NextResponse.json({ error: 'tenantId gerekli' }, { status: 400 });

        const auth = await verifyTenantAccess(req, tenantId);
        if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

        const { getTenantSettings } = await import('@/lib/tenant-settings');
        const tenantSettings = await getTenantSettings(tenantId);
        const client = createTrendyolGoClient(tenantSettings);

        if (type === 'brands') {
            const q = searchParams.get('q');
            const data = q ? await client.findBrandByName(q) : await client.getBrands(1, 200);
            return NextResponse.json({ success: true, brands: data });
        }
        // categories
        const leaf = searchParams.get('leaf') === 'true';
        const cats = await client.getCategories(0, 500, leaf);
        // Sadece leaf (en alt) kategoriler ürün oluşturmada kullanılabilir
        const usable = cats.filter((c: any) => c.leaf);
        return NextResponse.json({ success: true, categories: leaf ? usable : cats });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
