import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyTenantAccess } from "@/lib/server-tenant-auth";
import { getGetirCarsiConfig } from "@/lib/getir-carsi/creds";
import { GetirCarsiClient, GETIR_STATUS } from "@/lib/getir-carsi/getir-carsi-client";

// Getir Çarşı — sipariş aksiyonu.
// Panelden "Onayla / Hazırla / Kuryeye Teslim / Müşteriye Teslim / İptal" butonları buraya gelir.
// Getir'e bildirir, sonra getir_carsi_orders'ı günceller.
//
// Teslimat modeli (deliveryType):
//   1 (Getir Getirsin) : verify → prepare(Hazırlandı) → handover(Kuryeye)
//   2 (İşletme Getirsin): verify → prepare(Müşteriye gidiyor) → deliver(Teslim)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Action = "verify" | "prepare" | "handover" | "deliver" | "cancel" | "cancel-options";
const VALID: Action[] = ["verify", "prepare", "handover", "deliver", "cancel", "cancel-options"];

// Aksiyon sonrası Getir statü kodu (DB'ye yazılır — widget bununla renklendirir)
const ACTION_STATUS: Record<Exclude<Action, "cancel-options">, number> = {
    verify: GETIR_STATUS.PREPARING,     // 500
    prepare: GETIR_STATUS.PREPARED,     // 550
    handover: GETIR_STATUS.HANDED_COURIER, // 600 (dt1)
    deliver: GETIR_STATUS.DELIVERED,    // 900 (dt2)
    cancel: GETIR_STATUS.CANCELLED_SHOP, // 1600
};

export async function POST(req: NextRequest) {
    const auth = await verifyTenantAccess(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    let body: { orderId?: string; action?: string; cancelReasonId?: string; updatedProducts?: unknown[] };
    try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }

    const orderId = String(body.orderId || "");
    const action = String(body.action || "") as Action;
    if (!orderId) return NextResponse.json({ error: "orderId gerekli" }, { status: 400 });
    if (!VALID.includes(action)) {
        return NextResponse.json({ error: `Geçersiz aksiyon. Geçerli: ${VALID.join(", ")}` }, { status: 400 });
    }

    const cfg = await getGetirCarsiConfig(auth.tenantId);
    if (!cfg) return NextResponse.json({ error: "Getir Çarşı ayarlı/aktif değil." }, { status: 400 });

    // Siparişi bul (var mı + iç referans)
    const { data: order, error: readErr } = await supabaseAdmin
        .from("getir_carsi_orders")
        .select("id, getir_order_id, delivery_type")
        .eq("tenant_id", auth.tenantId)
        .eq("getir_order_id", orderId)
        .maybeSingle();
    if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });
    if (!order) return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });

    const client = new GetirCarsiClient(cfg);

    // İptal nedenlerini sorgula (DB'yi değiştirmez)
    if (action === "cancel-options") {
        try {
            const options = await client.cancelOptions(orderId);
            return NextResponse.json({ success: true, options });
        } catch (e: any) {
            return NextResponse.json({ error: `İptal nedenleri alınamadı: ${e?.message || "hata"}` }, { status: 502 });
        }
    }

    // Getir'e bildir
    try {
        switch (action) {
            case "verify": await client.verify(orderId); break;
            case "prepare": await client.prepare(orderId, Array.isArray(body.updatedProducts) ? body.updatedProducts : []); break;
            case "handover": await client.handover(orderId); break;
            case "deliver": await client.deliver(orderId); break;
            case "cancel": {
                const reason = String(body.cancelReasonId || "");
                if (!reason) return NextResponse.json({ error: "İptal için cancelReasonId zorunlu. Önce cancel-options ile nedenleri alın." }, { status: 400 });
                await client.cancel(orderId, reason);
                break;
            }
        }
    } catch (e: any) {
        // Getir reddederse DB'ye dokunma; net hata dön
        return NextResponse.json({ error: `Getir Çarşı aksiyonu başarısız: ${e?.message || "bilinmeyen"}` }, { status: 502 });
    }

    // DB durumunu güncelle
    const newCode = ACTION_STATUS[action];
    const { error: updErr } = await supabaseAdmin
        .from("getir_carsi_orders")
        .update({
            getir_status_code: newCode,
            is_cancelled: action === "cancel",
            status: action === "cancel" ? "cancelled" : "new",
            updated_at: new Date().toISOString(),
        })
        .eq("tenant_id", auth.tenantId)
        .eq("getir_order_id", orderId);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    return NextResponse.json({ success: true, orderId, statusCode: newCode });
}
