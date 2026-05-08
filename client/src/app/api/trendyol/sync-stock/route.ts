
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
        const hasTrendyol = tenantSettings.trendyolGo?.apiKey || tenantSettings.trendyol?.apiKey;

        if (!tenantSettings || !hasTrendyol) {
            return NextResponse.json({ success: false, error: 'Trendyol settings not found' }, { status: 404 });
        }

        const client = createTrendyolGoClient(tenantSettings);

        // 2. PRICE PROTECTION: Fetch current prices from Trendyol Store
        console.log(`[Price Protection] Fetching current prices from Trendyol for tenant ${tenantId}...`);
        const trendyolPrices = new Map<string, number>();
        let tgPage = 0;
        let hasMoreTg = true;
        
        while (hasMoreTg) {
            try {
                const tgProducts = await client.getProducts('ON_SALE', undefined, tgPage, 100);
                if (tgProducts && tgProducts.length > 0) {
                    tgProducts.forEach(p => {
                        if (p.barcode) {
                            const clean = String(p.barcode).replace(/\D/g, '').replace(/^0+/, '');
                            trendyolPrices.set(clean, p.sellingPrice);
                        }
                    });
                    tgPage++;
                    if (tgProducts.length < 100) hasMoreTg = false;
                } else {
                    hasMoreTg = false;
                }
                if (tgPage > 100) break; 
            } catch (err) {
                console.error(`[Price Protection] Error on page ${tgPage}:`, err);
                hasMoreTg = false;
            }
        }
        console.log(`[Price Protection] Successfully loaded ${trendyolPrices.size} active prices from Trendyol Store.`);

        // 3. Fetch all products from JetPos with barcodes using Pagination
        let allProducts: any[] = [];
        let from = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data: products, error: productsError } = await supabaseAdmin
                .from('products')
                .select('barcode, stock_quantity, name, sale_price, external_price')
                .eq('tenant_id', tenantId)
                .not('barcode', 'is', null)
                .neq('barcode', '')
                .range(from, from + pageSize - 1);

            if (productsError) throw productsError;

            if (products && products.length > 0) {
                allProducts = [...allProducts, ...products];
                from += pageSize;
                if (products.length < pageSize) hasMore = false;
            } else {
                hasMore = false;
            }
            if (from > 20000) break; 
        }

        if (allProducts.length === 0) {
            return NextResponse.json({ success: true, message: 'Güncellenecek ürün bulunamadı (Barkod eksik).', count: 0 });
        }

        // 4. Deduplicate AND Apply Price Protection / Custom Marketplace Price
        const uniqueProductsMap = new Map();
        let protectedPriceCount = 0;

        allProducts.forEach(p => {
            if (p.barcode) {
                const cleanBarcode = String(p.barcode).replace(/\D/g, '').replace(/^0+/, '');
                
                if (cleanBarcode && !uniqueProductsMap.has(cleanBarcode)) {
                    // PRICE PRIORITIZATION (Atomic Logic)
                    // 1. High Priority: Specific Trendyol Price from Excel/JetPos
                    if (p.external_price > 0) {
                        p.sale_price = p.external_price;
                        protectedPriceCount++;
                    } 
                    // 2. Medium Priority: Store Price (sale_price) if not zero
                    else if (p.sale_price > 0) {
                        // Already in p.sale_price
                    }
                    // 3. Low Priority: Fallback to existing Trendyol Market price (if > 0)
                    else {
                        const tpPrice = trendyolPrices.get(cleanBarcode);
                        if (tpPrice && tpPrice > 0) { // Only fallback if TG price is valid/non-zero
                            p.sale_price = tpPrice;
                            protectedPriceCount++;
                        }
                    }

                    p.barcode = String(p.barcode).trim();
                    uniqueProductsMap.set(cleanBarcode, p);
                }
            }
        });
        
        const uniqueProducts = Array.from(uniqueProductsMap.values());
        
        // 5. Prepare Batch
        const batch = uniqueProducts.map(p => ({
            barcode: p.barcode,
            quantity: Math.max(0, p.stock_quantity || 0),
            sellingPrice: p.sale_price || 0
        }));

        console.log(`[Stock Sync] Pushing ${batch.length} products to Trendyol (${protectedPriceCount} with Price Protection) for tenant ${tenantId}...`);

        // 6. Update Bulk Stock
        const batchIds = await client.updateBulkStockAuto(batch);

        return NextResponse.json({
            success: true,
            message: `${batch.length} ürün stoğu Trendyol fiyatları korunarak güncellendi.`,
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
