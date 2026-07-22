import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { findTenantByVendor } from "@/lib/yemeksepeti/creds";
import { getOrder } from "@/lib/yemeksepeti/client";
import { mapYsStatus } from "@/lib/yemeksepeti/status";
import { timingSafeEqual } from "crypto";

/**
 * Yemeksepeti (Delivery Hero) sipariş olayı webhook'u.
 *
 * Yemeksepeti sipariş yaşam döngüsü olaylarını buraya POST eder
 * (RECEIVED / READY_FOR_PICKUP / DISPATCHED / CANCELLED / DELIVERED).
 * Shops Integrations plugin'inde bu adres + secret tanımlanır:
 *   https://app.jetpos.shop/api/yemeksepeti/webhook
 *
 * GÜVENLİK:
 *  1. Paylaşılan webhook secret'ı sabit-zamanlı karşılaştırılır (tenant başına).
 *  2. Sipariş hangi tenant'a ait? Body'ye değil, vendor_id → tenant eşlemesine güvenilir.
 *  3. Basit IP rate limit.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeEqual(a: string, b: string): boolean {
    const ba = Buffer.from(a || "", "utf8");
    const bb = Buffer.from(b || "", "utf8");
    if (ba.length !== bb.length) { timingSafeEqual(ba, ba); return false; }
    return timingSafeEqual(ba, bb);
}

const hits = new Map<string, { c: number; t: number }>();
function rateLimited(req: Request): boolean {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const now = Date.now();
    const h = hits.get(ip);
    if (!h || now - h.t > 60_000) { hits.set(ip, { c: 1, t: now }); return false; }
    h.c += 1;
    return h.c > 120;
}

// Body içinden değeri esnek yollarla çek (Delivery Hero şeması iç içe olabilir)
function pick(obj: any, paths: string[]): string {
    for (const p of paths) {
        const val = p.split(".").reduce((o: any, k) => (o && typeof o === "object" ? o[k] : undefined), obj);
        if (val !== undefined && val !== null && String(val).length > 0) return String(val);
    }
    return "";
}

export async function POST(req: NextRequest) {
    if (rateLimited(req)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

    let body: any;
    try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }

    // vendor_id ile tenant + kimlik çöz
    const vendorId = pick(body, ["vendor_id", "vendorId", "vendor.id", "order.vendor_id", "store_id"]);
    if (!vendorId) return NextResponse.json({ error: "missing_vendor" }, { status: 400 });

    const found = await findTenantByVendor(vendorId);
    if (!found) {
        console.warn(`[yemeksepeti] bilinmeyen vendor: ${vendorId.slice(0, 12)}`);
        return NextResponse.json({ error: "vendor_not_found" }, { status: 404 });
    }
    const { tenantId, resolved } = found;

    // Webhook secret doğrula (tanımlıysa) — header adı plugin'de belirlenir
    if (resolved.webhookSecret) {
        const provided = req.headers.get("x-webhook-secret")
            || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
            || "";
        if (!safeEqual(provided, resolved.webhookSecret)) {
            return NextResponse.json({ error: "unauthorized" }, { status: 401 });
        }
    }

    const orderId = pick(body, ["order_id", "orderId", "order.id", "id"]);
    if (!orderId) return NextResponse.json({ error: "missing_order_id" }, { status: 400 });

    const eventStatus = pick(body, ["status", "event", "order.status", "order_status"]);

    // Sipariş detayını API'den çek (webhook özet olabilir; kalemler detayda gelir)
    let detail: any = null;
    try {
        const res = await getOrder(resolved.config, orderId);
        if (res.ok) detail = res.body;
    } catch { /* detay alınamazsa webhook body'siyle devam */ }

    const src = detail || body?.order || body;
    const jetStatus = mapYsStatus(eventStatus || pick(src, ["status", "order_status"]));
    const isCancelled = jetStatus === "cancelled";

    const row = {
        tenant_id: tenantId,
        vendor_id: vendorId,
        chain_id: resolved.config.chainId,
        ys_order_id: orderId,
        order_code: pick(src, ["code", "order_code", "short_code", "display_id"]) || null,
        customer_name: pick(src, ["customer.name", "customer.first_name", "customer_name"]) || null,
        total_price: Number(pick(src, ["price.total", "total_price", "grand_total", "amount"])) || 0,
        ys_status: eventStatus || pick(src, ["status"]) || null,
        status: jetStatus,
        is_cancelled: isCancelled,
        transport_type: pick(src, ["transport_type", "delivery.type"]) || null,
        expedition_type: pick(src, ["expedition_type", "expeditionType"]) || null,
        items: Array.isArray(src?.items) ? src.items : [],
        raw_data: body,
        updated_at: new Date().toISOString(),
    };

    // Idempotent upsert: (tenant_id, ys_order_id) benzersiz
    const { error } = await supabaseAdmin
        .from("yemeksepeti_orders")
        .upsert(row, { onConflict: "tenant_id,ys_order_id" });

    if (error) {
        console.error("[yemeksepeti] upsert hatası:", error.message);
        return NextResponse.json({ error: "persist_failed" }, { status: 500 });
    }

    // Delivery Hero 200 bekler; hızlı dön
    return NextResponse.json({ success: true }, { status: 200 });
}

export async function GET() {
    // Plugin bazen doğrulama için GET atar
    return NextResponse.json({ ok: true, service: "yemeksepeti-webhook" });
}
