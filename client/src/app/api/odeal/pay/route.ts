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

    const auth = await verifyTenantAccess(req);
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const creds = await getTenantOdealCreds(auth.tenantId);
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

    let body: { total?: number; items?: OdealBasketItem[]; siparisNo?: string; paymentType?: string };
    try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }

    const items = Array.isArray(body.items) ? body.items : [];
    // Sepet toplamını KALEMLERİN grossPrice toplamından hesapla — Ödeal, kalem
    // toplamı ile sepet toplamı birebir tutmazsa "Geçersiz satış fiyatı" (2044) döner.
    // (body.total'a güvenmiyoruz; yuvarlama farkı bile hata verdiriyordu.)
    const total = Number(items.reduce((s, it) => s + (Number((it as any).grossPrice) || 0), 0).toFixed(2));
    if (total <= 0 || items.length === 0) {
        return NextResponse.json({ error: "Geçerli tutar ve ürünler gerekli." }, { status: 400 });
    }
    // Her kalemin fiyatı > 0 ve en fazla 2 ondalık olmalı (Ödeal 2044 önlemi).
    if (items.some(it => !(Number((it as any).grossPrice) > 0))) {
        return NextResponse.json({ error: "Kalem fiyatı 0 veya geçersiz. Ödeal'e gönderilemez." }, { status: 400 });
    }

    // Ödeme tipi: CASH → tutarın tamamı cihaza NAKİT olarak bildirilir; cihaz
    // karttan çekmeden fişi (belgeyi) basar. Varsayılan CARD → paymentOptions boş,
    // tüm tutar cihazda karttan tahsil edilir (mevcut davranış).
    const paymentType = String(body.paymentType || "CARD").toUpperCase() === "CASH" ? "CASH" : "CARD";
    const paymentOptions = paymentType === "CASH" ? [{ type: "CASH", amount: total }] : undefined;

    // Callback URL'lerini Ödeal'e kaydet. Sonuç (succeeded/failed) SADECE bu
    // webhook'larla geliyor; kayıt olmazsa POS "Gönderiliyor"da takılır. Bu yüzden
    // ilk seferde AWAIT ederek sepeti göndermeden ÖNCE kaydı garanti ediyoruz.
    const base = (process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin).replace(/\/+$/, "");
    const isLocal = /localhost|127\.0\.0\.1/.test(base);
    let callbackWarning: string | undefined;
    // Local'de callback kaydını ATLA — Ödeal localhost'a ulaşamaz.
    if (!isLocal && !registeredTenants.has(auth.tenantId)) {
        try {
            const cfg = await saveConfiguration(creds, {
                paymentSucceededUrl: `${base}/api/odeal/payment-succeeded`,
                paymentFailedUrl: `${base}/api/odeal/payment-failed`,
                paymentCancelledUrl: `${base}/api/odeal/payment-cancelled`,
                eInvoiceCreatedUrl: `${base}/api/odeal/e-invoice-created`,
            });
            if (cfg.ok) registeredTenants.add(auth.tenantId);
            else callbackWarning = `Ödeal callback kaydı başarısız (HTTP ${cfg.status}). Ödeme sonucu ekrana düşmeyebilir; SuperAdmin > Ödeal'den callback URL'lerini yeniden kaydedin.`;
        } catch (e: any) {
            callbackWarning = `Ödeal callback kaydı hatası: ${e?.message || "bilinmeyen"}`;
        }
    }

    // Benzersiz referans (idempotency + webhook eşleşmesi)
    const referenceCode = `JP-${auth.tenantId.slice(0, 8)}-${Date.now()}-${randomBytes(3).toString("hex")}`;

    // Önce pending kaydı yaz (webhook gelince güncellenecek)
    await supabaseAdmin.from("odeal_transactions").insert([{
        tenant_id: auth.tenantId,
        reference_code: referenceCode,
        status: "pending",
        amount: total,
        basket: { total, items, paymentType },
    }]);

    const result = await sendBasket(creds, {
        referenceCode,
        total,
        items,
        receiptInfo: body.siparisNo ? { siparisNo: body.siparisNo } : undefined,
        paymentOptions,
    });

    if (!result.ok) {
        await supabaseAdmin.from("odeal_transactions")
            .update({ status: "failed", result: { error: result.body }, updated_at: new Date().toISOString() })
            .eq("tenant_id", auth.tenantId).eq("reference_code", referenceCode);
        const detailStr = typeof result.body === "string" ? result.body : JSON.stringify(result.body);
        return NextResponse.json({
            error: `Ödeal sepet gönderilemedi (HTTP ${result.status}): ${(detailStr || "boş yanıt").slice(0, 400)}`,
            detail: result.body,
            status: result.status,
            referenceCode,
        }, { status: 502 });
    }

    // Cihaz uyanacak; POS sonuç için status'u poll eder ya da webhook düşer
    return NextResponse.json({ success: true, referenceCode, callbackWarning });
}
