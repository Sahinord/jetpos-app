import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyTenantAccess } from "@/lib/server-tenant-auth";
import { getTgoYemekSettings, resolveConnection, type YemekChannel } from "@/lib/tgo-yemek/creds";
import { TgoYemekClient, STATUS_ACTIONS, ACTION_TO_STATUS, type TgoYemekAction } from "@/lib/tgo-yemek/tgo-yemek-client";

// Uber Eats · Trendyol Go YEMEK — sipariş durum aksiyonu.
// Panelden "Hazırla / Hazırlandı / Yola çıktı / Teslim / İptal" butonları buraya gelir.
// Durumu hem TGO'ya bildirir hem tgo_yemek_orders.status'u günceller.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID: TgoYemekAction[] = ["accept", "preparing", "ready", "onway", "delivered", "cancel"];

// 'preparing' TGO'da ayrı bir statü olmayabilir → sadece JetPos içi durum güncellemesi.
const LOCAL_ONLY: Set<TgoYemekAction> = new Set(["preparing"]);

export async function POST(req: NextRequest) {
    const auth = await verifyTenantAccess(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    let body: { orderId?: string; action?: string };
    try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }

    const orderId = String(body.orderId || "");
    const action = String(body.action || "") as TgoYemekAction;
    if (!orderId) return NextResponse.json({ error: "orderId gerekli" }, { status: 400 });
    if (!VALID.includes(action)) {
        return NextResponse.json({ error: `Geçersiz aksiyon. Geçerli: ${VALID.join(", ")}` }, { status: 400 });
    }

    // Siparişi bul (mağazasını öğrenmek için)
    const { data: order, error: readErr } = await supabaseAdmin
        .from("tgo_yemek_orders")
        .select("id, channel, store_id, package_id, tgo_order_id, status")
        .eq("tenant_id", auth.tenantId)
        .eq("tgo_order_id", orderId)
        .maybeSingle();
    if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });
    if (!order) return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });

    const newStatus = ACTION_TO_STATUS[action];

    // TGO'ya bildir (yalnızca platform statüsü olan aksiyonlar)
    if (!LOCAL_ONLY.has(action)) {
        const settings = await getTgoYemekSettings(auth.tenantId);
        const conn = settings ? resolveConnection(settings, (order.channel as YemekChannel) || "tgo") : null;
        if (!conn) {
            return NextResponse.json({ error: `Bağlantı (${order.channel}) kimlik bilgisi çözülemedi.` }, { status: 400 });
        }
        try {
            const client = new TgoYemekClient(conn.config);
            await client.updateStatus(order.package_id || order.tgo_order_id, action);
        } catch (e: any) {
            // TGO reddederse DB'yi değiştirme; net hata dön
            return NextResponse.json({
                error: `TGO durum güncellenemedi: ${e?.message || "bilinmeyen"}`,
                tgoAction: STATUS_ACTIONS[action]?.path,
            }, { status: 502 });
        }
    }

    // DB durumunu güncelle
    const { error: updErr } = await supabaseAdmin
        .from("tgo_yemek_orders")
        .update({
            status: newStatus,
            is_cancelled: action === "cancel",
            updated_at: new Date().toISOString(),
        })
        .eq("tenant_id", auth.tenantId)
        .eq("tgo_order_id", orderId);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    return NextResponse.json({ success: true, orderId, status: newStatus });
}
