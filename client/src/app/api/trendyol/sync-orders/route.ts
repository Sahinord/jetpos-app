
import { NextRequest, NextResponse } from 'next/server';
import { createTrendyolGoClient } from '@/lib/trendyol-go-client';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic'; // Cacheleme yapılmasın

export async function GET(req: NextRequest) {
    console.log('[Sync API] REQUEST RECEIVED');
    try {
        const { searchParams } = new URL(req.url);
        const tenantId = searchParams.get('tenantId');
        const daysParam = searchParams.get('days');
        const days = daysParam ? parseInt(daysParam) : 30;

        if (!tenantId) {
            return NextResponse.json({ success: false, error: 'tenantId is required' }, { status: 400 });
        }

        const { supabaseAdmin } = await import('@/lib/supabase-admin');
        const { getTenantSettings } = await import('@/lib/tenant-settings');
        const tenantSettings = await getTenantSettings(tenantId);
        const client = createTrendyolGoClient(tenantSettings);

        // Tarih aralığı
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

        console.log(`[Sync API] Scanning ${days} days for tenant ${tenantId}...`);

        // Geniş tarama (Tüm statüler)
        const statuses = [
            undefined,
            'CREATED', 'PICKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'ACCEPTED', 'PICKING',
            'Created', 'Picked', 'Shipped', 'Delivered', 'Cancelled', 'Accepted', 'Picking',
            'Packing', 'ReadyForCollection'
        ];
        let allOrders: any[] = [];

        for (const status of statuses) {
            try {
                // Mağaza bazlı çek (true)
                const statusOrders = await client.getOrders(startDate, endDate, status, true);
                console.log(`[Sync] API Response for status ${status}: ${statusOrders?.length || 0} orders`);
                if (statusOrders && statusOrders.length > 0) {
                    console.log(`[Sync] Found ${statusOrders.length} orders for status: ${status} (Store mode)`);
                    allOrders = [...allOrders, ...statusOrders];
                }

                // Eğer mağaza bazlı gelmezse global bazlı çek (false)
                const globalOrders = await client.getOrders(startDate, endDate, status, false);
                if (globalOrders && globalOrders.length > 0) {
                    console.log(`[Sync] Found ${globalOrders.length} orders for status: ${status} (Global mode)`);
                    allOrders = [...allOrders, ...globalOrders];
                }
            } catch (statusErr: any) {
                console.warn(`⚠️ [${status}] sync failed:`, statusErr.message);
            }
        }

        // Mükerrer temizliği (Order Number)
        const uniqueOrders = Array.from(new Map(allOrders.map(o => [o.orderNumber, o])).values());
        console.log(`[Sync] Total unique orders found in ${days} days: ${uniqueOrders.length}`);

        if (uniqueOrders.length === 0) {
            return NextResponse.json({ success: true, message: 'Yeni sipariş yok.', count: 0 });
        }

        // Supabase'e kaydet (Upsert) - Admin yetkisiyle RLS'yi atla
        const upsertData = uniqueOrders.map(order => ({
            tenant_id: tenantId,
            order_number: order.orderNumber,
            customer_name: `${order.customer.firstName} ${order.customer.lastName}`,
            total_price: order.totalPrice,
            status: order.packageStatus,
            created_at: new Date(order.orderDate).toISOString(),
            items: order.lines,
            raw_data: order
        }));

        const { error } = await supabaseAdmin
            .from('trendyol_go_orders')
            .upsert(upsertData, { onConflict: 'order_number' });

        if (error) {
            throw new Error('Supabase Error: ' + error.message);
        }

        return NextResponse.json({
            success: true,
            message: `${uniqueOrders.length} sipariş başarıyla senkronize edildi.`,
            count: uniqueOrders.length
        });

    } catch (error: any) {
        console.error('Trendyol Sync Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
