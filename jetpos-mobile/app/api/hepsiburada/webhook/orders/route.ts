import { NextRequest, NextResponse } from 'next/server';
import { authenticateHepsiburadaWebhook, logHepsiburadaWebhookEvent } from '@/lib/hepsiburada-webhook';

// Hepsiburada Sipariş Webhook Modeli — Create Order
// POST {merchant_api_baseUrl}/orders — Hepsiburada bize yeni sipariş push eder.
export async function POST(req: NextRequest) {
    const tenantId = await authenticateHepsiburadaWebhook(req);
    if (!tenantId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body?.items?.length) {
        return NextResponse.json({ error: 'items gerekli' }, { status: 400 });
    }

    const orderNumber = body.items[0].orderNumber;
    const merchantId = body.items[0].merchantId;

    await logHepsiburadaWebhookEvent({
        tenantId,
        eventType: 'order',
        merchantId,
        externalId: orderNumber,
        payload: body
    });

    // Not: Bu aşamada sadece ham olay kaydediliyor — JetPos sipariş/fatura/stok
    // kaydına otomatik dönüştürme henüz devreye alınmadı (ayrı bir iş kuralı
    // onayı gerekiyor: ürün eşleştirme, stok düşümü, cari kaydı vb.).
    return NextResponse.json({}, { status: 201 });
}
