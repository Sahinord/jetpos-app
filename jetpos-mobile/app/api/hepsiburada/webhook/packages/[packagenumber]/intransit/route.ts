import { NextRequest, NextResponse } from 'next/server';
import { authenticateHepsiburadaWebhook, logHepsiburadaWebhookEvent } from '@/lib/hepsiburada-webhook';

// Hepsiburada Sipariş Webhook Modeli — Intransit
// PUT {merchant_api_baseUrl}/packages/{packagenumber}/intransit
export async function PUT(req: NextRequest, { params }: { params: Promise<{ packagenumber: string }> }) {
    const tenantId = await authenticateHepsiburadaWebhook(req);
    if (!tenantId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { packagenumber } = await params;
    const body = await req.json().catch(() => ({}));

    await logHepsiburadaWebhookEvent({
        tenantId,
        eventType: 'intransit',
        merchantId: body.merchantId,
        externalId: body.packageNumber || packagenumber,
        payload: body
    });

    return new NextResponse(null, { status: 204 });
}
