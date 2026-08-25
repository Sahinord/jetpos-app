import { NextRequest, NextResponse } from 'next/server';
import { createTrendyolGoClient } from '@/lib/trendyol-go-client';
import { verifyTenantAccess } from '@/lib/server-tenant-auth';

// Trendyol GO — Toplu işlem (batch) durum kontrolü.
// Ürün aktarımı / stok-fiyat gönderiminden dönen batchRequestId ile sonucu sorgular.
//   GET /api/trendyol/batch-status?tenantId=..&batchRequestId=..
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const tenantId = searchParams.get('tenantId') || '';
        const batchRequestId = searchParams.get('batchRequestId') || '';
        if (!tenantId || !batchRequestId) return NextResponse.json({ success: false, error: 'tenantId ve batchRequestId gerekli' }, { status: 400 });

        const auth = await verifyTenantAccess(req, tenantId);
        if (!auth.ok) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

        const { getTenantSettings } = await import('@/lib/tenant-settings');
        const client = createTrendyolGoClient(await getTenantSettings(tenantId));

        let raw: any;
        try { raw = await client.checkBatchStatus(batchRequestId); }
        catch (e: any) { return NextResponse.json({ success: false, error: `Durum alınamadı: ${e?.message || 'hata'}` }, { status: 502 }); }

        // Sonucu normalize et: item bazlı SUCCESS/FAILED sayısı + hata sebepleri.
        const items: any[] = raw?.items || raw?.content || raw?.data?.items || [];
        let success = 0, failed = 0;
        const failReasons: string[] = [];
        for (const it of items) {
            const st = String(it?.status || it?.itemStatus || it?.state || '').toUpperCase();
            if (st.includes('SUCCESS') || st === 'DONE' || st === 'COMPLETED') success++;
            else if (st.includes('FAIL') || st.includes('ERROR') || st.includes('INVALID')) {
                failed++;
                const reason = it?.failureReasons?.join?.(', ') || it?.reason || it?.message || it?.errorMessage;
                if (reason) failReasons.push(String(reason));
            }
        }

        return NextResponse.json({
            success: true,
            batchRequestId,
            batchStatus: raw?.status || raw?.batchRequestStatus || null,
            total: items.length,
            successCount: success,
            failedCount: failed,
            failReasons: Array.from(new Set(failReasons)).slice(0, 20),
            note: failed === 0 && success > 0
                ? 'Batch tamam. SUCCESS olsa bile ürünler İÇERİK ONAYINA düşer; onaylanınca satışa çıkar.'
                : undefined,
            raw,
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
