
import { NextRequest, NextResponse } from 'next/server';
import { createTrendyolGoClient } from '@/lib/trendyol-go-client';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic'; // Cacheleme yapılmasın

export async function GET(req: NextRequest) {
    try {
        const client = createTrendyolGoClient();

        // Son 24 saatin siparişlerini çek
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

        console.log('Fetching Trendyol GO orders...', startDate.toISOString(), endDate.toISOString());
        const orders = await client.getOrders(startDate, endDate);

        console.log(`Found ${orders.length} orders from Trendyol GO.`);

        if (orders.length === 0) {
            return NextResponse.json({ success: true, message: 'Yeni sipariş yok.', count: 0 });
        }

        // Supabase'e kaydet (Upsert)
        const upsertData = orders.map(order => ({
            id: order.id,
            order_number: order.orderNumber,
            customer_name: `${order.customer.firstName} ${order.customer.lastName}`,
            total_price: order.totalPrice,
            status: order.packageStatus, // 'Created', 'Picking', 'Invoiced' etc.
            created_at: new Date(order.orderDate).toISOString(),
            items: order.lines, // JSONB
            raw_data: order // JSONB (Fatura için tüm veri)
        }));

        const { error } = await supabase
            .from('trendyol_go_orders')
            .upsert(upsertData, { onConflict: 'id' });

        if (error) {
            throw new Error('Supabase Error: ' + error.message);
        }

        return NextResponse.json({
            success: true,
            message: `${orders.length} sipariş senkronize edildi.`,
            count: orders.length
        });

    } catch (error: any) {
        console.error('Trendyol Sync Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
