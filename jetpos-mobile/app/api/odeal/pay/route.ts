import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { verifyTenantAccess } from "@/lib/server-tenant-auth";
import { getTenantOdealCreds, sendBasket, adminClient, hasServiceKey, type OdealBasketItem } from "@/lib/odeal";

/**
 * Mobil POS → "KART ile öde". Sepeti Ödeal fiziki cihazına gönderir.
 *
 * NOT: Callback (webhook) kaydı BU UÇTAN YAPILMAZ. Ödeal işyeri başına tek
 * callback adresi tutuyor ve o adres masaüstü uygulamaya kayıtlı; buradan da
 * kaydetmeye kalksak iki uygulama birbirinin adresini ezerdi. Ödeme sonucu
 * masaüstüne düşer, oradan Supabase Broadcast ile mobile ulaşır.
 * (Callback kaydı: masaüstü → Entegrasyonlar → Ödeal → "Callback'leri Kaydet")
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const auth = await verifyTenantAccess(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    if (!hasServiceKey) {
        return NextResponse.json({
            error: "Sunucu yapılandırması eksik (SUPABASE_SERVICE_ROLE_KEY). Yöneticinize bildirin.",
        }, { status: 500 });
    }

    const creds = await getTenantOdealCreds(auth.tenantId);
    if (!creds) {
        return NextResponse.json({ error: "Bu işletmede Ödeal ayarı yok." }, { status: 400 });
    }
    if (!creds.active) {
        return NextResponse.json({ error: "Ödeal entegrasyonu kapalı." }, { status: 400 });
    }
    if (!creds.publicKey || !creds.secretKey) {
        return NextResponse.json({ error: "Ödeal Public/Secret Key eksik." }, { status: 400 });
    }
    if (!creds.externalDeviceKey) {
        return NextResponse.json({ error: "Cihaz kodu tanımlı değil." }, { status: 400 });
    }

    let body: { total?: number; items?: OdealBasketItem[]; siparisNo?: string };
    try { body = await req.json(); } catch {
        return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }

    const total = Number(body.total) || 0;
    const items = Array.isArray(body.items) ? body.items : [];
    if (total <= 0 || items.length === 0) {
        return NextResponse.json({ error: "Geçerli tutar ve ürünler gerekli." }, { status: 400 });
    }
    // Ödeal 0 TL satırı reddediyor (code 1603) — baştan engelle
    if (items.some(it => !(Number(it.grossPrice) > 0))) {
        return NextResponse.json({ error: "Sepette fiyatı 0 olan ürün var." }, { status: 400 });
    }

    const db = adminClient();

    // Benzersiz referans (idempotency + webhook eşleşmesi).
    // Masaüstüyle AYNI format — webhook tarafı bu satırı referanstan bulacak.
    const referenceCode = `JP-${auth.tenantId.slice(0, 8)}-${Date.now()}-${randomBytes(3).toString("hex")}`;

    // Önce pending kaydı yaz (webhook gelince masaüstü tarafı bunu günceller)
    const { error: insErr } = await db.from("odeal_transactions").insert([{
        tenant_id: auth.tenantId,
        reference_code: referenceCode,
        status: "pending",
        amount: total,
        basket: { total, items, source: "mobile" },
    }]);
    if (insErr) {
        return NextResponse.json({ error: "İşlem kaydı oluşturulamadı." }, { status: 500 });
    }

    const result = await sendBasket(creds, { referenceCode, total, items, siparisNo: body.siparisNo });

    if (!result.ok) {
        await db.from("odeal_transactions")
            .update({ status: "failed", result: { error: result.body }, updated_at: new Date().toISOString() })
            .eq("tenant_id", auth.tenantId).eq("reference_code", referenceCode);

        const detail = typeof result.body === "string" ? result.body : JSON.stringify(result.body);
        return NextResponse.json({
            error: `Ödeal sepet gönderilemedi (HTTP ${result.status}): ${(detail || "boş yanıt").slice(0, 300)}`,
            referenceCode,
        }, { status: 502 });
    }

    return NextResponse.json({ success: true, referenceCode });
}
