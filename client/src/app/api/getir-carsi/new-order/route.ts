import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyApiKey, rateLimited, resolveTenant, clean, pick, F, toInt } from "@/lib/getir-carsi/webhook-auth";

// Getir ÇARŞI — yeni sipariş webhook'u. Getir sunucusu bu adrese POST atar.
// Getir başvuru formundaki "Yeni sipariş iletimi için Webhook":
//   https://<public-domain>/api/getir-carsi/new-order
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    // 1) Flood koruması
    if (rateLimited(req)) {
        return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    // 2) x-api-key doğrulama (DB'ye gitmeden — fail-closed)
    if (!verifyApiKey(req)) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }

    // 3) Tenant'ı YALNIZCA mağaza-kimliği (shopId) eşlemesinden çöz (body'ye güvenme)
    const shopId = pick(body, F.shopId);
    const tenantId = await resolveTenant(shopId);
    if (!tenantId) {
        console.warn(`[getir-carsi] Eşleşmeyen mağaza: ${clean(shopId, 60)}`);
        return NextResponse.json({ error: "store_not_mapped" }, { status: 404 });
    }

    // 4) Sipariş kimliği (idempotency anahtarı)
    const getirOrderId = pick(body, F.orderId);
    if (!getirOrderId) {
        return NextResponse.json({ error: "missing_order_id" }, { status: 400 });
    }

    // 5) Alanları çıkar + temizle (KDS/adisyonda gösterilecekler escape edilir)
    const customerName = clean(pick(body, F.customer), 120);
    const totalPrice = Number(pick(body, F.total)) || 0;
    const statusCode = toInt(pick(body, F.status));
    const deliveryType = toInt(pick(body, F.deliveryType));
    const rawItems = (body.products ?? body.items ?? body.basket ?? []) as unknown;
    const items = Array.isArray(rawItems) ? rawItems : [];

    // 6) Idempotent yazma: (tenant, order id) tekrar gelirse güncelle
    const { error } = await supabaseAdmin
        .from("getir_carsi_orders")
        .upsert(
            {
                tenant_id: tenantId,
                getir_order_id: getirOrderId,
                getir_shop_id: clean(shopId, 60),
                order_number: clean(pick(body, F.orderNumber), 40),
                customer_name: customerName,
                total_price: totalPrice,
                getir_status_code: statusCode,
                delivery_type: deliveryType,
                status: "new",
                is_cancelled: false,
                items,
                raw_data: body,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "tenant_id,getir_order_id" }
        );

    if (error) {
        console.error("[getir-carsi] new-order yazma hatası:", error.message);
        return NextResponse.json({ error: "persist_failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

export async function GET() {
    return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}
