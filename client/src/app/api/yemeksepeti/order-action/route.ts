import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyTenantAccess } from "@/lib/server-tenant-auth";
import { getYemeksepetiSettings, resolveYs } from "@/lib/yemeksepeti/creds";
import { updateOrder } from "@/lib/yemeksepeti/client";
import { actionToYsStatus, mapYsStatus } from "@/lib/yemeksepeti/status";

/**
 * POS/mobil → Yemeksepeti sipariş aksiyonu (hazır / kargoda / iptal).
 * Tenant kimliği x-tenant-id + x-license-key ile doğrulanır.
 *
 * Body: { orderId: <ys_order_id>, action: "ready"|"dispatch"|"cancel", reason? }
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const auth = await verifyTenantAccess(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    let body: { orderId?: string; action?: string; reason?: string };
    try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }

    const orderId = String(body.orderId || "");
    const action = String(body.action || "");
    if (!orderId || !action) return NextResponse.json({ error: "orderId ve action gerekli" }, { status: 400 });

    const ysStatus = actionToYsStatus(action);
    if (!ysStatus) return NextResponse.json({ error: "Geçersiz aksiyon" }, { status: 400 });

    // Bu tenant'ın kaydı mı? (başka tenant'ın siparişine dokunma)
    const { data: order } = await supabaseAdmin
        .from("yemeksepeti_orders")
        .select("id, ys_order_id, items")
        .eq("tenant_id", auth.tenantId)
        .eq("ys_order_id", orderId)
        .maybeSingle();
    if (!order) return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });

    const settings = await getYemeksepetiSettings(auth.tenantId);
    const resolved = resolveYs(settings);
    if (!resolved) return NextResponse.json({ error: "Yemeksepeti ayarı eksik/kapalı." }, { status: 400 });

    // Kabul akışında platform kalem listesi ister; elimizdeki kalemleri sadeleştir
    const items = Array.isArray(order.items)
        ? (order.items as any[]).map((it) => ({ id: it.id, sku: it.sku, quantity: it.quantity })).filter(x => x.id || x.sku)
        : [];

    const res = await updateOrder(resolved.config, orderId, {
        status: ysStatus,
        items,
        cancellationReason: body.reason,
    });

    if (!res.ok) {
        const detail = typeof res.body === "string" ? res.body : JSON.stringify(res.body);
        return NextResponse.json({
            error: `Yemeksepeti güncellenemedi (HTTP ${res.status}): ${(detail || "").slice(0, 200)}`,
        }, { status: 502 });
    }

    // Yerel statüyü de güncelle (webhook zaten güncelleyecek ama anında yansısın)
    await supabaseAdmin
        .from("yemeksepeti_orders")
        .update({ status: mapYsStatus(ysStatus), updated_at: new Date().toISOString() })
        .eq("tenant_id", auth.tenantId)
        .eq("ys_order_id", orderId);

    return NextResponse.json({ success: true });
}
