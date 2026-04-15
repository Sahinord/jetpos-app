
import { NextRequest, NextResponse } from 'next/server';
import { createTrendyolGoClient } from '@/lib/trendyol-go-client';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getTenantSettings } from '@/lib/tenant-settings';

/**
 * Trendyol GO Stock Sync API (v1.3.8)
 * Pushes local product stock levels to Trendyol GO
 */
export async function POST(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const tenantId = searchParams.get('tenantId');

        if (!tenantId) {
            return NextResponse.json({ success: false, error: 'tenantId is required' }, { status: 400 });
        }

        // 1. Get Tenant Trendyol Settings
        const tenantSettings = await getTenantSettings(tenantId);
        if (!tenantSettings || !tenantSettings.apiKey) {
            return NextResponse.json({ success: false, error: 'Trendyol settings not found' }, { status: 404 });
        }

        const client = createTrendyolGoClient(tenantSettings);

        // 2. Fetch all products from JetPos with barcodes
        const { data: products, error: productsError } = await supabaseAdmin
            .from('products')
            .select('barcode, stock_quantity, name')
            .eq('tenant_id', tenantId)
            .not('barcode', 'is', null)
            .neq('barcode', '');

        if (productsError) throw productsError;

        if (!products || products.length === 0) {
            return NextResponse.json({ success: true, message: 'Güncellenecek ürün bulunamadı (Barkod eksik).', count: 0 });
        }

        // 3. Prepare Batch for Trendyol
        const batch = products.map(p => ({
            barcode: p.barcode,
            quantity: Math.max(0, p.stock_quantity || 0) // Minimum 0
        }));

        console.log(`[Stock Sync] Pushing ${batch.length} products to Trendyol for tenant ${tenantId}...`);

        // 4. Update Bulk Stock (Using our lib function)
        // Note: Trendyol GO API updates via batches. Our lib handles batching.
        const batchIds = await client.updateBulkStockAuto(batch);

        return NextResponse.json({
            success: true,
            message: `${batch.length} ürün stoğu Trendyol'a gönderildi.`,
            count: batch.length,
            batchIds
        });

    } catch (error: any) {
        console.error('Trendyol Stock Sync Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    return POST(req);
}
