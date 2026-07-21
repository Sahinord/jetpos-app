import { createClient } from '@supabase/supabase-js';

/**
 * Ödeal Fiziki POS (D2D) — mobil taraf.
 *
 * MİMARİ — buradaki en önemli karar:
 * Ödeal, her işyeri için TEK bir callback adresi tutar. O adres masaüstü
 * uygulamaya (app.jetpos.shop) kayıtlı. Yani ödeme sonucu webhook'u DAİMA
 * masaüstü tarafına düşer; orası `odeal_transactions` satırını günceller ve
 * `odeal-tx-<referans>` kanalına Supabase Broadcast yayını yapar.
 *
 * Mobil bu yayını dinler. Bu sayede:
 *   • İki uygulama callback adresi için birbiriyle YARIŞMAZ.
 *   • Mobil, webhook ucu barındırmak zorunda kalmaz.
 *   • Sonuç mobilde de anında görünür.
 *
 * Bu yüzden burada BİLEREK `saveConfiguration` (callback kaydı) YOK.
 * Callback kaydı yalnızca masaüstü Entegrasyonlar ekranından yapılır.
 */

export type OdealCreds = {
    publicKey: string;
    secretKey: string;
    externalDeviceKey: string;
    paxId: string;
    baseUrl: string;
    environment: string;
    active: boolean;
};

export type OdealBasketItem = {
    name: string;
    quantity: number;
    grossPrice: number;      // satır toplamı (KDV dahil)
    referenceCode?: string;
    vatRatio?: number;
    unitCode?: string;       // C62 = adet, KGM = kg
};

export function adminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://grlwmcuxobbgubphovhd.supabase.co';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

/** tenants.settings->odeal altındaki kimlik bilgilerini oku */
export async function getTenantOdealCreds(tenantId: string): Promise<OdealCreds | null> {
    const { data, error } = await adminClient()
        .from('tenants').select('settings').eq('id', tenantId).maybeSingle();
    if (error || !data) return null;

    const od = (data.settings as Record<string, unknown> | null)?.odeal as Record<string, unknown> | undefined;
    if (!od) return null;

    return {
        publicKey: String(od.publicKey || ''),
        secretKey: String(od.secretKey || ''),
        externalDeviceKey: String(od.externalDeviceKey || ''),
        paxId: String(od.paxId || ''),
        baseUrl: String(od.baseUrl || ''),
        environment: String(od.environment || 'stage'),
        active: od.active !== false,
    };
}

/** Ortama göre API tabanı — masaüstüyle birebir aynı, dokümandan teyitli */
function resolveBase(creds: OdealCreds): string {
    if (creds.baseUrl) return creds.baseUrl.replace(/\/+$/, '');
    return creds.environment === 'prod'
        ? 'https://api.odeal.com/api/v1'        // CANLI
        : 'https://stage.odealapp.com/api/v1';  // STAGE
}

function headers(creds: OdealCreds): Record<string, string> {
    return {
        'Content-Type': 'application/json',
        'X-ODEAL-MERCHANT-KEY': creds.publicKey,
        'X-ODEAL-SECRET-KEY': creds.secretKey,
    };
}

/**
 * Sepet Aktar — POST /basket. Cihaz uyanır, müşteri kartla öder.
 * Ödeal'de geçici 5xx görülebildiği için aynı referenceCode ile 1 kez daha
 * denenir (referans aynı olduğu için idempotent, mükerrer sepet oluşmaz).
 */
export async function sendBasket(creds: OdealCreds, params: {
    referenceCode: string;
    total: number;
    items: OdealBasketItem[];
    siparisNo?: string;
}): Promise<{ ok: boolean; status: number; body: unknown }> {
    const base = resolveBase(creds);
    const body: Record<string, unknown> = {
        referenceCode: params.referenceCode,
        externalDeviceKey: creds.externalDeviceKey,
        receiptInfo: params.siparisNo ? { SiparisNo: params.siparisNo } : undefined,
        // Nihai tüketici varsayılanı (11 hane "1" = NİHAİ TÜKETİCİ)
        customer: {
            referenceCode: 'NIHAI',
            type: 'INDIVIDUAL',
            name: 'NİHAİ',
            surname: 'TÜKETİCİ',
            identityNumber: '11111111111',
            city: 'İstanbul',
            town: 'Merkez',
        },
        price: { grossPrice: params.total },
        items: params.items.map((it, idx) => ({
            quantity: it.quantity,
            product: {
                unitCode: it.unitCode ?? 'C62',
                name: it.name,
                referenceCode: it.referenceCode ?? `ITEM${idx + 1}`,
                price: {
                    grossPrice: it.grossPrice,
                    vatRatio: it.vatRatio ?? 10,
                    sctRatio: 0,
                },
            },
        })),
        paymentOptions: [], // boş = tüm tutar cihazda karttan tahsil edilir
    };

    let last: { ok: boolean; status: number; body: unknown } = { ok: false, status: 0, body: '' };
    for (let attempt = 0; attempt < 2; attempt++) {
        const res = await fetch(`${base}/basket`, {
            method: 'POST',
            headers: headers(creds),
            body: JSON.stringify(body),
        });
        const text = await res.text();
        let json: unknown = null;
        try { json = text ? JSON.parse(text) : null; } catch { /* düz metin kalır */ }
        last = { ok: res.ok, status: res.status, body: json ?? text };
        if (res.status >= 500 && attempt < 1) {
            await new Promise(r => setTimeout(r, 1500));
            continue;
        }
        return last;
    }
    return last;
}
