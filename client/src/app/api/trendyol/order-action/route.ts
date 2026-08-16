import { NextRequest, NextResponse } from 'next/server';
import { createTrendyolGoClient, TGO_PACKAGE_STATUS, type TgoOrderAction } from '@/lib/trendyol-go-client';
import { verifyTenantAccess } from '@/lib/server-tenant-auth';

// Trendyol GO Market — sipariş yönetimi (paket statü aksiyonu).
// Widget'tan "Onayla / Faturala / Kargola / Stok Yok" butonları buraya gelir.
// Trendyol'a bildirir, sonra trendyol_go_orders.status'u günceller.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID: TgoOrderAction[] = ['accept', 'invoiced', 'shipped', 'unsupply', 'status'];

// Aksiyon → lokal DB'ye yazılacak yeni statü
const ACTION_STATUS: Record<string, string> = {
    accept: TGO_PACKAGE_STATUS.PICKING,
    invoiced: TGO_PACKAGE_STATUS.INVOICED,
    shipped: TGO_PACKAGE_STATUS.SHIPPED,
};

export async function POST(req: NextRequest) {
    try {
        let body: { tenantId?: string; orderNumber?: string; packageId?: string; action?: string; payload?: any };
        try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: 'invalid_json' }, { status: 400 }); }

        const tenantId = body.tenantId || new URL(req.url).searchParams.get('tenantId') || '';
        if (!tenantId) return NextResponse.json({ success: false, error: 'tenantId gerekli' }, { status: 400 });

        const auth = await verifyTenantAccess(req, tenantId);
        if (!auth.ok) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

        const action = String(body.action || '') as TgoOrderAction;
        if (!VALID.includes(action)) {
            return NextResponse.json({ success: false, error: `Geçersiz aksiyon. Geçerli: ${VALID.join(', ')}` }, { status: 400 });
        }

        const orderNumber = String(body.orderNumber || '');
        if (!orderNumber && !body.packageId) {
            return NextResponse.json({ success: false, error: 'orderNumber veya packageId gerekli' }, { status: 400 });
        }

        const { supabaseAdmin } = await import('@/lib/supabase-admin');

        // Paket ID'yi bul (Trendyol aksiyonları package id ile çalışır)
        let packageId = String(body.packageId || '');
        let dbRow: any = null;
        if (orderNumber) {
            const { data } = await supabaseAdmin
                .from('trendyol_go_orders')
                .select('id, order_number, raw_data, status')
                .eq('tenant_id', tenantId)
                .eq('order_number', orderNumber)
                .maybeSingle();
            dbRow = data;
            if (!packageId) packageId = String(data?.raw_data?.id || '');
        }
        if (!packageId) return NextResponse.json({ success: false, error: 'Paket ID bulunamadı (sipariş senkron edilmemiş olabilir).' }, { status: 404 });

        // Trendyol'a bildir
        const { getTenantSettings } = await import('@/lib/tenant-settings');
        const tenantSettings = await getTenantSettings(tenantId);
        const client = createTrendyolGoClient(tenantSettings);

        try {
            await client.orderAction(packageId, action, body.payload);
        } catch (e: any) {
            return NextResponse.json({ success: false, error: `Trendyol aksiyonu başarısız: ${e?.message || 'bilinmeyen'}` }, { status: 502 });
        }

        // Lokal statüyü güncelle (bilinen geçişlerde)
        const newStatus = ACTION_STATUS[action] || body.payload?.status;
        if (newStatus && orderNumber) {
            await supabaseAdmin
                .from('trendyol_go_orders')
                .update({ status: newStatus })
                .eq('tenant_id', tenantId)
                .eq('order_number', orderNumber);
        }

        return NextResponse.json({ success: true, orderNumber, packageId, status: newStatus || null });
    } catch (error: any) {
        console.error('Trendyol order-action error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
