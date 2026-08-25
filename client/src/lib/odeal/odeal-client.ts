import type { OdealCreds } from "@/lib/odeal/odeal-auth";

/**
 * Ödeal Fiziki POS (D2D) outbound servis çağrıları.
 * Tüm istekler X-ODEAL-MERCHANT-KEY + X-ODEAL-SECRET-KEY header'ıyla imzalanır.
 * baseUrl tenant ayarından gelir (stage/prod). Endpoint'ler: /basket, /configuration.
 */

// Fiziki POS base URL'leri — Ödeal resmi dokümanından doğrulandı:
// docs.odeal.com/entegrasyon/tr/guide/welcome → API Endpoint'leri.
// SuperAdmin'de baseUrl doluysa onu kullan (özel/geçiş adresleri için override).
function resolveBase(creds: OdealCreds): string {
    if (creds.baseUrl) return creds.baseUrl.replace(/\/+$/, "");
    return creds.environment === "prod"
        ? "https://api.odeal.com/api/v1"       // CANLI (prod) — dokümandan teyitli
        : "https://stage.odealapp.com/api/v1"; // STAGE (test) — dokümandan teyitli
}

function headers(creds: OdealCreds): Record<string, string> {
    return {
        "Content-Type": "application/json",
        "X-ODEAL-MERCHANT-KEY": creds.publicKey,
        "X-ODEAL-SECRET-KEY": creds.secretKey,
    };
}

async function post(url: string, creds: OdealCreds, body: unknown) {
    // GÜVENLİK: Giden istek gövdesi ve Ödeal yanıtı ARTIK LOGLANMIYOR.
    // Canlı ortamda body kart/tutar/işyeri verisi, header'lar da secret key
    // içerdiği için bunları Vercel loglarına yazmak sızıntıydı.
    let last: { ok: boolean; status: number; body: unknown } = { ok: false, status: 0, body: "" };
    // Ödeal stage 5xx sık ve geçici (Ödeal doğruladı) → aynı referenceCode ile 1 kez daha dene (idempotent)
    for (let attempt = 0; attempt < 2; attempt++) {
        const res = await fetch(url, { method: "POST", headers: headers(creds), body: JSON.stringify(body) });
        const text = await res.text();
        let json: unknown = null;
        try { json = text ? JSON.parse(text) : null; } catch { /* text kalır */ }
        last = { ok: res.ok, status: res.status, body: json ?? text };
        if (res.status >= 500 && attempt < 1) {
            await new Promise(r => setTimeout(r, 1500));
            continue;
        }
        return last;
    }
    return last;
}

async function get(url: string, creds: OdealCreds) {
    const res = await fetch(url, { method: "GET", headers: headers(creds) });
    const text = await res.text();
    let json: unknown = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* text kalır */ }
    return { ok: res.ok, status: res.status, body: json ?? text };
}

/**
 * İşlem Raporu — GET /report/transactions
 * Callback kaçarsa ödeme sonucunu ÇEKEREK öğrenmek için (poll fallback).
 * Zorunlu: beginDate, endDate (YYYY-MM-DD). Opsiyonel: basketReferenceCode.
 * Doküman: docs.odeal.com/entegrasyon/tr/api/ortak-servisler/islem-rapor
 */
export async function getTransactionReport(
    creds: OdealCreds,
    params: { beginDate: string; endDate: string; basketReferenceCode?: string }
): Promise<{ ok: boolean; status: number; body: unknown }> {
    const base = resolveBase(creds);
    const q = new URLSearchParams({ beginDate: params.beginDate, endDate: params.endDate });
    if (params.basketReferenceCode) q.append("basketReferenceCode", params.basketReferenceCode);
    return get(`${base}/report/transactions?${q.toString()}`, creds);
}

// Rapor kaydından tekil işlem durumunu çıkar: succeeded | failed | cancelled | pending
export function statusFromReportRecord(rec: any): "succeeded" | "failed" | "cancelled" | "pending" {
    const raw = String(
        rec?.status ?? rec?.paymentStatus ?? rec?.transactionStatus ?? rec?.result ?? rec?.state ?? ""
    ).toUpperCase();
    if (/SUCCE|SUCCESS|PAID|COMPLET|APPROVE|OK|BASARILI/.test(raw)) return "succeeded";
    if (/CANCEL|IPTAL|REFUND/.test(raw)) return "cancelled";
    if (/FAIL|ERROR|DECLINE|REJECT|HATA|BASARISIZ/.test(raw)) return "failed";
    return "pending";
}

export type OdealBasketItem = {
    name: string;
    quantity: number;
    grossPrice: number;         // satır toplamı (KDV dahil)
    referenceCode?: string;     // ürün referansı (stok/ürün id)
    vatRatio?: number;          // KDV oranı: 0, 1, 10, 20
    unitCode?: string;          // C62 = adet, KGM = kg
};

// paymentOptions: split ödeme (GIFT/CASH vb.) için; saf kart satışında boş bırakılır
export type OdealPaymentOption = { type: string; amount: number };

/**
 * Sepet Aktar — POST /api/v1/basket. Cihaz uyanır, müşteri kartla öder.
 * Gövde Postman D2D Stage koleksiyonundaki gerçek şemaya göredir.
 * referenceCode benzersiz olmalı (idempotency + webhook eşleşmesi).
 */
export async function sendBasket(creds: OdealCreds, params: {
    referenceCode: string;
    total: number;
    items: OdealBasketItem[];
    receiptInfo?: { siparisNo?: string; garson?: string };
    paymentOptions?: OdealPaymentOption[];
}) {
    const base = resolveBase(creds);
    const body: Record<string, unknown> = {
        referenceCode: params.referenceCode,
        externalDeviceKey: creds.externalDeviceKey,
        receiptInfo: params.receiptInfo?.siparisNo || params.receiptInfo?.garson
            ? { SiparisNo: params.receiptInfo?.siparisNo, Garson: params.receiptInfo?.garson }
            : undefined,
        // Nihai tüketici varsayılanı (identityNumber 11 hane "1" → NİHAİ TÜKETİCİ)
        customer: {
            referenceCode: "NIHAI",
            type: "INDIVIDUAL",
            name: "NİHAİ",
            surname: "TÜKETİCİ",
            identityNumber: "11111111111",
            city: "İstanbul",
            town: "Merkez",
        },
        price: { grossPrice: params.total },
        items: params.items.map((it, idx) => ({
            quantity: it.quantity,
            product: {
                unitCode: it.unitCode ?? "C62",
                name: it.name,
                referenceCode: it.referenceCode ?? `ITEM${idx + 1}`,
                price: {
                    grossPrice: it.grossPrice,
                    vatRatio: it.vatRatio ?? 10,
                    sctRatio: 0,
                },
            },
        })),
        // Boş = tüm tutar cihazda (karttan) tahsil edilir
        paymentOptions: params.paymentOptions ?? [],
    };
    return post(`${base}/basket`, creds, body);
}

/**
 * Konfigürasyon — POST /configuration. Callback URL'lerini Ödeal'e kaydeder.
 * Bir kere (kurulumda) çağrılır.
 */
export async function saveConfiguration(creds: OdealCreds, urls: {
    paymentSucceededUrl: string;
    paymentFailedUrl: string;
    paymentCancelledUrl: string;
    eInvoiceCreatedUrl?: string;
    basketUrl?: string;
    odealRequestKey?: string;
}) {
    const base = resolveBase(creds);
    // Konfigürasyon gövdesi Postman D2D Stage'deki tam alan setine göre
    return post(`${base}/configuration`, creds, {
        eCommerceUrl: null,
        basketUrl: urls.basketUrl ?? null,
        customerGetUrl: null,
        customerPostUrl: null,
        paymentSucceededUrl: urls.paymentSucceededUrl,
        callbackPayoutUrl: null,
        paymentCancelledUrl: urls.paymentCancelledUrl,
        paymentFailedUrl: urls.paymentFailedUrl,
        eInvoiceCreatedUrl: urls.eInvoiceCreatedUrl ?? null,
        eInvoiceCancelledUrl: null,
        intentUrl: null,
        eInvoiceIntegrator: "ODEAL",
        odealRequestKey: urls.odealRequestKey ?? null,
        basketCancelledUrl: null,
    });
}

/**
 * Ödeme İptali — DELETE /api/v1/payment/cancel/{paxId}/{referenceCode}
 * (Tamamlanmış ödeme iptali; Postman D2D Stage'den doğrulandı.)
 */
export async function cancelPayment(creds: OdealCreds, referenceCode: string) {
    const base = resolveBase(creds);
    const res = await fetch(
        `${base}/payment/cancel/${encodeURIComponent(creds.paxId)}/${encodeURIComponent(referenceCode)}`,
        { method: "DELETE", headers: headers(creds) }
    );
    return { ok: res.ok, status: res.status };
}
