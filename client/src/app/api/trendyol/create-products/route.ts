import { NextRequest, NextResponse } from 'next/server';
import { createTrendyolGoClient } from '@/lib/trendyol-go-client';
import { verifyTenantAccess } from '@/lib/server-tenant-auth';

// Trendyol GO Market — ÜRÜN AKTARIMI (JetPos ürünlerini Trendyol kataloğuna oluşturur).
// Doküman: urun-entegrasyonu/hm-urun-aktarimi
// body: { tenantId, items:[{ barcode, title, brandId, categoryId, vatRate, description?, images?[] }], pushStock?:[{barcode,quantity,sellingPrice,originalPrice?}] }
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({} as any));
        const tenantId = body.tenantId || new URL(req.url).searchParams.get('tenantId') || '';
        if (!tenantId) return NextResponse.json({ success: false, error: 'tenantId gerekli' }, { status: 400 });

        const auth = await verifyTenantAccess(req, tenantId);
        if (!auth.ok) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

        const items = Array.isArray(body.items) ? body.items : [];
        if (items.length === 0) return NextResponse.json({ success: false, error: 'items boş' }, { status: 400 });

        // Zorunlu alan doğrulaması (Trendyol 400 vermeden önce net hata)
        for (const it of items) {
            if (!it.barcode || !it.title) return NextResponse.json({ success: false, error: 'Her üründe barcode ve title zorunlu.' }, { status: 400 });
            if (!it.brandId || !it.categoryId) return NextResponse.json({ success: false, error: `"${it.title}" için brandId ve categoryId zorunlu (marka/kategori seçilmeli).` }, { status: 400 });
            if (![0, 1, 10, 20].includes(Number(it.vatRate))) return NextResponse.json({ success: false, error: 'vatRate 0/1/10/20 olmalı.' }, { status: 400 });
        }

        const { getTenantSettings } = await import('@/lib/tenant-settings');
        const tenantSettings = await getTenantSettings(tenantId);
        const client = createTrendyolGoClient(tenantSettings);

        // 1) Ürünleri oluştur
        let batchRequestId: string;
        try {
            batchRequestId = await client.createProducts(items.map((it: any) => ({
                barcode: it.barcode, title: it.title, brandId: it.brandId, categoryId: it.categoryId,
                vatRate: it.vatRate, description: it.description, stockCode: it.stockCode, images: it.images,
            })));
        } catch (e: any) {
            return NextResponse.json({ success: false, error: `Ürün aktarımı başarısız: ${e?.message || 'bilinmeyen'}` }, { status: 502 });
        }

        // 2) İstenirse aynı barkodlar için stok/fiyat gönder (ürün oluştuktan sonra)
        let stockBatchIds: string[] = [];
        if (Array.isArray(body.pushStock) && body.pushStock.length) {
            try {
                stockBatchIds = await client.updateBulkStockAuto(body.pushStock.map((s: any) => ({
                    barcode: s.barcode, quantity: Number(s.quantity) || 0,
                    sellingPrice: Number(s.sellingPrice) || 0, originalPrice: s.originalPrice != null ? Number(s.originalPrice) : undefined,
                })));
            } catch { /* stok sonradan da senkronlanabilir */ }
        }

        return NextResponse.json({ success: true, batchRequestId, stockBatchIds, count: items.length });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
