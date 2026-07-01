import { NextRequest, NextResponse } from 'next/server';
import { authenticateHepsiburadaWebhook, logHepsiburadaWebhookEvent } from '@/lib/hepsiburada-webhook';

// Hepsiburada Sipariş Webhook Modeli — Create Packages
// POST {merchant_api_baseUrl}/packages
export async function POST(req: NextRequest) {
    const tenantId = await authenticateHepsiburadaWebhook(req);
    if (!tenantId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body?.packageNumber) {
        return NextResponse.json({ error: 'packageNumber gerekli' }, { status: 400 });
    }

    await logHepsiburadaWebhookEvent({
        tenantId,
        eventType: 'package',
        merchantId: body.merchantId,
        externalId: body.packageNumber,
        payload: body
    });

    return NextResponse.json({}, { status: 201 });
}
