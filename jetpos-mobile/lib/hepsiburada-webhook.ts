import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'crypto';

/**
 * Hepsiburada Sipariş Webhook Modeli: güvenlik Basic Auth ile sağlanıyor —
 * resmi dokümandan birebir: "Bizimle baseurl'inizde sahip olduğunuz username
 * ve password bilgisini paylaşmanız beklenmektedir." Bu, outbound API
 * çağrılarında kullanılan Servis Anahtarı'ndan TAMAMEN AYRI bir kimlik.
 *
 * Çok-kiracılı yapı nedeniyle bu kimlik bilgisi ENV'de TEK bir global çift
 * olarak değil, her tenant'ın kendi `settings.hepsiburada.webhookUsername` /
 * `webhookPassword` alanında (SuperAdmin'den, Trendyol'daki gibi) tutuluyor.
 * Webhook isteği geldiğinde, gelen Authorization header'ındaki kullanıcı
 * adıyla eşleşen tenant aranır, sonra şifre timing-safe karşılaştırılır —
 * yani tenant kimliği doğrudan bu auth'tan çözülüyor (merchantId payload'da
 * olmasa bile, örn. shipping-address webhook'unda).
 */
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'no_key_for_build'
);

export async function authenticateHepsiburadaWebhook(request: Request): Promise<string | null> {
    const authHeader = request.headers.get('authorization') || '';
    if (!authHeader.startsWith('Basic ')) return null;

    let decoded: string;
    try {
        decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8');
    } catch {
        return null;
    }

    const sepIdx = decoded.indexOf(':');
    if (sepIdx === -1) return null;
    const user = decoded.slice(0, sepIdx);
    const pass = decoded.slice(sepIdx + 1);
    if (!user || !pass) return null;

    const { data, error } = await supabaseAdmin
        .from('tenants')
        .select('id, settings')
        .eq('settings->hepsiburada->>webhookUsername', user)
        .maybeSingle();

    if (error || !data) return null;

    const expectedPass = data.settings?.hepsiburada?.webhookPassword;
    if (!expectedPass || !safeEqual(pass, expectedPass)) return null;

    return data.id;
}

function safeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
}

export async function logHepsiburadaWebhookEvent(opts: {
    tenantId: string | null;
    eventType: 'order' | 'package' | 'cancel' | 'unpack' | 'deliver' | 'intransit' | 'shipping_address';
    merchantId?: string | null;
    externalId: string;
    payload: any;
}) {
    await supabaseAdmin
        .from('hepsiburada_webhook_events')
        .upsert({
            tenant_id: opts.tenantId,
            event_type: opts.eventType,
            merchant_id: opts.merchantId || null,
            external_id: opts.externalId,
            payload: opts.payload
        }, { onConflict: 'tenant_id,event_type,external_id' });
}
