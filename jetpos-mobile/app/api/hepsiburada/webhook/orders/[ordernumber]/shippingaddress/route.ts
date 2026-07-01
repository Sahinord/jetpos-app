import { NextRequest, NextResponse } from 'next/server';
import { authenticateHepsiburadaWebhook, logHepsiburadaWebhookEvent } from '@/lib/hepsiburada-webhook';

// Hepsiburada Sipariş Webhook Modeli — Change Shipping Address Order
// PUT {merchant_api_baseUrl}/orders/{ordernumber}/shippingaddress
// Not: bu payload merchantId taşımıyor — ama artık tenant zaten webhook
// auth'undan (kullanıcı adı/şifre) doğrudan çözüldüğü için sorun değil.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ ordernumber: string }> }) {
    const tenantId = await authenticateHepsiburadaWebhook(req);
    if (!tenantId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ordernumber } = await params;
    const body = await req.json().catch(() => ({}));
    const orderNumber = body.orderNumber || ordernumber;

    await logHepsiburadaWebhookEvent({
        tenantId,
        eventType: 'shipping_address',
        merchantId: null,
        externalId: orderNumber,
        payload: body
    });

    return new NextResponse(null, { status: 204 });
}
