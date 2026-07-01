import { NextRequest, NextResponse } from 'next/server';
import { authenticateHepsiburadaWebhook, logHepsiburadaWebhookEvent } from '@/lib/hepsiburada-webhook';

// Hepsiburada Sipariş Webhook Modeli — Order Cancel
// PUT {merchant_api_baseUrl}/lineitems/{lineitemid}/cancel
export async function PUT(req: NextRequest, { params }: { params: Promise<{ lineitemid: string }> }) {
    const tenantId = await authenticateHepsiburadaWebhook(req);
    if (!tenantId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lineitemid } = await params;
    const body = await req.json().catch(() => ({}));

    await logHepsiburadaWebhookEvent({
        tenantId,
        eventType: 'cancel',
        merchantId: body.merchantId,
        externalId: body.id || lineitemid,
        payload: body
    });

    return new NextResponse(null, { status: 204 });
}
