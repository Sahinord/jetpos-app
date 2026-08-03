import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyTenantAccess } from "@/lib/server-tenant-auth";
import { getGetirCarsiConfig } from "@/lib/getir-carsi/creds";
import { GetirCarsiClient, CANCELLED_CODES, type GetirCarsiOrder } from "@/lib/getir-carsi/getir-carsi-client";
import { pick, clean, toInt, F } from "@/lib/getir-carsi/webhook-auth";

// Getir Çarşı — sipariş çekme (poll). Test ortamında tek yol budur (Getir'in
// public webhook'umuza ulaşamadığı durumda). /unapproved + /cancelled çekilir,
// (tenant_id, getir_order_id) tekil kısıtıyla idempotent yazılır.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function rowFrom(order: GetirCarsiOrder, tenantId: string, cancelled: boolean) {
    const o = order as unknown as Record<string, unknown>;
    const oid = pick(o, F.orderId);
    const statusCode = toInt(pick(o, F.status));
    const isCancelled = cancelled || (statusCode !== null && CANCELLED_CODES.has(statusCode));
    return {
        tenant_id: tenantId,
        getir_order_id: oid,
        getir_shop_id: pick(o, F.shopId) || null,
        order_number: clean(pick(o, F.orderNumber), 40) || null,
        customer_name: clean(pick(o, F.customer), 120) || null,
        total_price: Number(pick(o, F.total)) || 0,
        getir_status_code: statusCode,
        delivery_type: toInt(pick(o, F.deliveryType)),
        status: isCancelled ? "cancelled" : "new",
        is_cancelled: isCancelled,
        items: ((o as any).products ?? (o as any).items ?? []) as unknown,
        raw_data: order as any,
        updated_at: new Date().toISOString(),
    };
}

export async function POST(req: NextRequest) {
    const auth = await verifyTenantAccess(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const cfg = await getGetirCarsiConfig(auth.tenantId);
    if (!cfg) {
        return NextResponse.json(
            { error: "Getir Çarşı ayarlı/aktif değil. SuperAdmin > Getir Çarşı'dan kullanıcı adı/şifre/shopId girin." },
            { status: 400 }
        );
    }

    const client = new GetirCarsiClient(cfg);

    // İki uç rate-limit muaf; paralel çek.
    let unapproved: GetirCarsiOrder[] = [];
    let cancelled: GetirCarsiOrder[] = [];
    const errors: Array<{ source: string; error: string }> = [];
    const [uRes, cRes] = await Promise.allSettled([client.getUnapproved(), client.getCancelled()]);
    if (uRes.status === "fulfilled") unapproved = uRes.value; else errors.push({ source: "unapproved", error: uRes.reason?.message || "hata" });
    if (cRes.status === "fulfilled") cancelled = cRes.value; else errors.push({ source: "cancelled", error: cRes.reason?.message || "hata" });

    // Token bile alınamadıysa (ikisi de hata) net dön.
    if (uRes.status === "rejected" && cRes.status === "rejected") {
        return NextResponse.json({ error: errors[0]?.error || "Getir Çarşı bağlantısı başarısız", errors }, { status: 502 });
    }

    // Yeni onay bekleyen siparişleri belirlemek için mevcutları oku
    const allRows = [
        ...unapproved.map(o => rowFrom(o, auth.tenantId, false)),
        ...cancelled.map(o => rowFrom(o, auth.tenantId, true)),
    ].filter(r => r.getir_order_id);

    const ids = allRows.map(r => r.getir_order_id);
    const known = new Set<string>();
    if (ids.length > 0) {
        const { data: existing } = await supabaseAdmin
            .from("getir_carsi_orders")
            .select("getir_order_id")
            .eq("tenant_id", auth.tenantId)
            .in("getir_order_id", ids);
        for (const r of existing || []) known.add(r.getir_order_id);
    }

    // Yeni (daha önce görülmemiş) onay bekleyenler → bildirim listesine
    const newOrders = allRows
        .filter(r => !r.is_cancelled && !known.has(r.getir_order_id))
        .map(r => ({ id: r.getir_order_id, orderNumber: r.order_number || r.getir_order_id, customer: r.customer_name || "Müşteri", total: r.total_price }));

    // Upsert (idempotent). İptaller de güncellenir (statü/is_cancelled değişebilir).
    let upserted = 0;
    if (allRows.length > 0) {
        const { error } = await supabaseAdmin
            .from("getir_carsi_orders")
            .upsert(allRows, { onConflict: "tenant_id,getir_order_id" });
        if (error) errors.push({ source: "db", error: error.message });
        else upserted = allRows.length;
    }

    return NextResponse.json({
        success: true,
        fetched: unapproved.length + cancelled.length,
        upserted,
        newCount: newOrders.length,
        newOrders,
        errors,
    });
}
