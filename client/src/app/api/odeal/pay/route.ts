import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyTenantAccess } from "@/lib/server-tenant-auth";
import { getTenantOdealCreds } from "@/lib/odeal/odeal-auth";
import { sendBasket, saveConfiguration, type OdealBasketItem } from "@/lib/odeal/odeal-client";

// Sunucu instance başına, tenant başına callback kaydını bir kez yap (idempotent).
const registeredTenants = new Set<string>();

// POS → "Ödeal ile Öde". Tenant kimliği x-tenant-id + x-license-key ile doğrulanır.
// Sunucu, tenant'ın Ödeal kimlik bilgisini yükleyip sepeti cihaza gönderir.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    // ═══ [ODEAL DEBUG] geçici hata ayıklama logları (şimdilik) ═══
    console.log("[ODEAL DEBUG] /pay çağrıldı", {
        tenant: req.headers.get("x-tenant-id"),
        keyLen: (req.headers.get("x-license-key") || "").length,
        origin: req.nextUrl.origin,
    });

    const auth = await verifyTenantAccess(req);
    if (!auth.ok) {
        console.warn("[ODEAL DEBUG] /pay auth REDDEDİLDİ", { status: auth.status, error: auth.error });
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    console.log("[ODEAL DEBUG] /pay auth OK", { tenantId: auth.tenantId });

    const creds = await getTenantOdealCreds(auth.tenantId);
    console.log("[ODEAL DEBUG] /pay creds", creds ? {
        found: true,
        active: creds.active,
        hasPublic: !!creds.publicKey,
        hasSecret: !!creds.secretKey,
        externalDeviceKey: creds.externalDeviceKey || "(yok)",
        paxId: creds.paxId || "(yok)",
        environment: creds.environment,
        baseUrl: creds.baseUrl || "(default)",
    } : { found: false });
    if (!creds) {
        return NextResponse.json({
            error: `Bu işletmede Ödeal ayarı yok. SuperAdmin'de ÖDEAL bilgilerini bu işletmeye (tenant: ${auth.tenantId.slice(0, 8)}…) girip kaydettiğinden emin ol.`,
        }, { status: 400 });
    }
    if (!creds.active) {
        return NextResponse.json({ error: "Ödeal kayıtlı ama 'Entegrasyon Aktif' kapalı. SuperAdmin'den aç." }, { status: 400 });
    }
    if (!creds.publicKey || !creds.secretKey) {
        return NextResponse.json({ error: "Ödeal Public/Secret Key eksik. SuperAdmin'den gir." }, { status: 400 });
    }
    if (!creds.externalDeviceKey) {
        return NextResponse.json({ error: "Cihaz kodu (externalDeviceKey) tanımlı değil. SuperAdmin > Ödeal'den girin." }, { status: 400 });
    }

    let body: { total?: number; items?: OdealBasketItem[]; siparisNo?: string };
    try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }

    const total = Number(body.total) || 0;
    const items = Array.isArray(body.items) ? body.items : [];
    if (total <= 0 || items.length === 0) {
        return NextResponse.json({ error: "Geçerli tutar ve ürünler gerekli." }, { status: 400 });
    }

    // Callback URL'lerini Ödeal'e kaydet (bu tenant için ilk sefer; sonuçların
    // webhook'la gelmesi için gerekir). Ödeme akışını bloklamaması için await'siz.
    const base = (process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin).replace(/\/+$/, "");
    const isLocal = /localhost|127\.0\.0\.1/.test(base);
    // Local'de callback kaydını ATLA — Ödeal localhost'a ulaşamaz ve merchant'ın
    // gerçek (public) callback URL'lerini localhost'la ezmesin.
    if (!isLocal && !registeredTenants.has(auth.tenantId)) {
        registeredTenants.add(auth.tenantId);
        saveConfiguration(creds, {
            paymentSucceededUrl: `${base}/api/odeal/payment-succeeded`,
            paymentFailedUrl: `${base}/api/odeal/payment-failed`,
            paymentCancelledUrl: `${base}/api/odeal/payment-cancelled`,
            eInvoiceCreatedUrl: `${base}/api/odeal/e-invoice-created`,
        }).catch(() => registeredTenants.delete(auth.tenantId)); // hata olursa tekrar denesin
    }

    // Benzersiz referans (idempotency + webhook eşleşmesi)
    const referenceCode = `JP-${auth.tenantId.slice(0, 8)}-${Date.now()}-${randomBytes(3).toString("hex")}`;

    // Önce pending kaydı yaz (webhook gelince güncellenecek)
    await supabaseAdmin.from("odeal_transactions").insert([{
        tenant_id: auth.tenantId,
        reference_code: referenceCode,
        status: "pending",
        amount: total,
        basket: { total, items },
    }]);

    console.log("[ODEAL DEBUG] /pay sendBasket gönderiliyor", { referenceCode, total, itemCount: items.length });
    const result = await sendBasket(creds, {
        referenceCode,
        total,
        items,
        receiptInfo: body.siparisNo ? { siparisNo: body.siparisNo } : undefined,
    });
    console.log("[ODEAL DEBUG] /pay sendBasket sonucu", { ok: result.ok, status: result.status, body: result.body });

    if (!result.ok) {
        console.warn("[ODEAL DEBUG] /pay sendBasket BAŞARISIZ", { referenceCode, status: result.status, body: result.body });
        await supabaseAdmin.from("odeal_transactions")
            .update({ status: "failed", result: { error: result.body }, updated_at: new Date().toISOString() })
            .eq("tenant_id", auth.tenantId).eq("reference_code", referenceCode);
        // [ODEAL DEBUG] Ödeal'in gerçek red sebebini mesaja koy (şimdilik) — tarayıcı konsolunda görünsün
        const detailStr = typeof result.body === "string" ? result.body : JSON.stringify(result.body);
        return NextResponse.json({
            error: `Ödeal sepet gönderilemedi (HTTP ${result.status}): ${(detailStr || "boş yanıt").slice(0, 400)}`,
            detail: result.body,
            status: result.status,
            referenceCode,
        }, { status: 502 });
    }

    console.log("[ODEAL DEBUG] /pay BAŞARILI — cihaza gönderildi", { referenceCode });
    // Cihaz uyanacak; POS sonuç için status'u poll eder ya da webhook düşer
    return NextResponse.json({ success: true, referenceCode });
}
