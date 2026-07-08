import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyApiKey, rateLimited, resolveTenant, clean, pick, F, toInt } from "@/lib/getir-carsi/webhook-auth";

// Getir ÇARŞI — sipariş iptali / statü değişikliği webhook'u.
// Getir başvuru formundaki "Sipariş iptallerinin bildirimi için Webhook":
//   https://<public-domain>/api/getir-carsi/cancel-order
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    if (rateLimited(req)) {
        return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    if (!verifyApiKey(req)) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }

    const shopId = pick(body, F.shopId);
    const tenantId = await resolveTenant(shopId);
    if (!tenantId) {
        console.warn(`[getir-carsi] Eşleşmeyen mağaza (cancel): ${clean(shopId, 60)}`);
        return NextResponse.json({ error: "store_not_mapped" }, { status: 404 });
    }

    const getirOrderId = pick(body, F.orderId);
    if (!getirOrderId) {
        return NextResponse.json({ error: "missing_order_id" }, { status: 400 });
    }

    const statusCode = toInt(pick(body, F.status)); // 1500=Admin iptal, 1600=İşletme iptal

    // Yalnızca bu tenant'a ait kaydı güncelle (tenant_id filtresi çapraz-tenant
    // güncellemeyi imkânsız kılar)
    const { data, error } = await supabaseAdmin
        .from("getir_carsi_orders")
        .update({
            status: "cancelled",
            getir_status_code: statusCode,
            is_cancelled: true,
            raw_data: body,
            updated_at: new Date().toISOString(),
        })
        .eq("tenant_id", tenantId)
        .eq("getir_order_id", getirOrderId)
        .select("id");

    if (error) {
        console.error("[getir-carsi] cancel-order güncelleme hatası:", error.message);
        return NextResponse.json({ error: "persist_failed" }, { status: 500 });
    }

    // Yeni-sipariş henüz gelmemişse bile iptali idempotent şekilde yaz
    // (webhook sırası karışsa dahi iptal kaybolmaz)
    if (!data || data.length === 0) {
        await supabaseAdmin.from("getir_carsi_orders").upsert(
            {
                tenant_id: tenantId,
                getir_order_id: getirOrderId,
                getir_shop_id: clean(shopId, 60),
                status: "cancelled",
                getir_status_code: statusCode,
                is_cancelled: true,
                raw_data: body,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "tenant_id,getir_order_id" }
        );
    }

    return NextResponse.json({ success: true });
}

export async function GET() {
    return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}
