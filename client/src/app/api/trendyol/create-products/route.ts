import { NextRequest, NextResponse } from 'next/server';
import { createTrendyolGoClient } from '@/lib/trendyol-go-client';
import { verifyTenantAccess } from '@/lib/server-tenant-auth';

// Trendyol GO Market — ÜRÜN AKTARIMI (JetPos ürünlerini Trendyol kataloğuna oluşturur).
// Doküman: urun-entegrasyonu/hm-urun-aktarimi
// body: { tenantId, items:[{ barcode, title, brandId, categoryId, vatRate, description?, images?[] }], pushStock?:[{barcode,quantity,sellingPrice,originalPrice?}] }
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Trendyol GO kısıtları (resmi doküman): barcode/title'da şu karakterler YASAK:
//   ? / & % + ^ ' * _  ve boşluk.  barcode ≤ 40, title ≤ 100.
const FORBIDDEN = /[?/&%+^'*_]/g;
function cleanBarcode(v: string): string {
    return String(v || '').replace(FORBIDDEN, '').replace(/\s+/g, '').slice(0, 40);
}
function cleanTitle(v: string): string {
    return String(v || '').replace(FORBIDDEN, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({} as any));
        const tenantId = body.tenantId || new URL(req.url).searchParams.get('tenantId') || '';
        if (!tenantId) return NextResponse.json({ success: false, error: 'tenantId gerekli' }, { status: 400 });

        const auth = await verifyTenantAccess(req, tenantId);
        if (!auth.ok) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

        const items = Array.isArray(body.items) ? body.items : [];
        if (items.length === 0) return NextResponse.json({ success: false, error: 'items boş' }, { status: 400 });

        // Zorunlu alan doğrulaması + karakter/uzunluk temizliği (Trendyol reddetmeden önce)
        const clean = [];
        for (const it of items) {
            const barcode = cleanBarcode(it.barcode);
            const title = cleanTitle(it.title);
            if (!barcode || !title) return NextResponse.json({ success: false, error: 'Her üründe geçerli barcode ve title zorunlu (yasak karakterler temizlenince boş kalıyor).' }, { status: 400 });
            if (!it.brandId || !it.categoryId) return NextResponse.json({ success: false, error: `"${title}" için brandId ve categoryId zorunlu (marka/kategori seçilmeli).` }, { status: 400 });
            if (![0, 1, 10, 20].includes(Number(it.vatRate))) return NextResponse.json({ success: false, error: 'vatRate 0/1/10/20 olmalı.' }, { status: 400 });
            // Görseller yalnızca https URL olmalı (base64/data: kabul edilmez); en fazla 8.
            const images = Array.isArray(it.images)
                ? it.images.filter((u: any) => typeof u === 'string' && u.startsWith('https://')).slice(0, 8)
                : undefined;
            clean.push({
                barcode, title, brandId: Number(it.brandId), categoryId: Number(it.categoryId),
                vatRate: Number(it.vatRate),
                description: it.description ? String(it.description).slice(0, 3000) : undefined,
                stockCode: it.stockCode ? String(it.stockCode) : undefined,
                images: images && images.length ? images : undefined,
            });
        }

        const { getTenantSettings } = await import('@/lib/tenant-settings');
        const tenantSettings = await getTenantSettings(tenantId);
        const client = createTrendyolGoClient(tenantSettings);

        // 1) Ürünleri oluştur
        let batchRequestId: string;
        try {
            batchRequestId = await client.createProducts(clean);
        } catch (e: any) {
            return NextResponse.json({ success: false, error: `Ürün aktarımı başarısız: ${e?.message || 'bilinmeyen'}` }, { status: 502 });
        }

        // 2) İstenirse aynı barkodlar için stok/fiyat gönder (ürün oluştuktan sonra)
        let stockBatchIds: string[] = [];
        if (Array.isArray(body.pushStock) && body.pushStock.length) {
            try {
                stockBatchIds = await client.updateBulkStockAuto(body.pushStock.map((s: any) => ({
                    barcode: cleanBarcode(s.barcode), quantity: Number(s.quantity) || 0,
                    sellingPrice: Number(s.sellingPrice) || 0, originalPrice: s.originalPrice != null ? Number(s.originalPrice) : undefined,
                })));
            } catch { /* stok sonradan da senkronlanabilir */ }
        }

        return NextResponse.json({
            success: true,
            batchRequestId,
            stockBatchIds,
            count: clean.length,
            // Trendyol akışı: batch SUCCESS → İÇERİK ONAYI → fiyat/stok → satış.
            note: 'Ürünler Trendyol\'a gönderildi ve İÇERİK ONAYI sürecine düştü. Onaylanıp geçerli fiyat/stok beslenince satışa çıkar. Görseli olmayan ürünler onaydan geçmeyebilir.',
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
