import { timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Ödeal (Fiziki POS / D2D) kimlik doğrulama + tenant çözümleme.
 *
 * Tüm Ödeal istekleri (outbound ve gelen webhook'lar) iki header taşır:
 *   X-ODEAL-MERCHANT-KEY  → işyeri anahtarı (publicKey)
 *   X-ODEAL-SECRET-KEY    → gizli anahtar (secretKey)
 *
 * Gelen webhook'larda: merchant key'e göre tenant bulunur, secret key
 * o tenant'ın kayıtlı secretKey'i ile SABİT-ZAMANLI karşılaştırılır.
 * Böylece sahte webhook enjeksiyonu ve çapraz-tenant engellenir.
 * Kimlik bilgileri tenants.settings->'odeal' altında (SuperAdmin'den girilir).
 */

export type OdealCreds = {
    publicKey: string;
    secretKey: string;
    externalDeviceKey: string;
    paxId: string;
    baseUrl: string;
    environment: string;
    terminalSerial: string;
    active: boolean;
};

function safeEqual(a: string, b: string): boolean {
    const ba = Buffer.from(a || "", "utf8");
    const bb = Buffer.from(b || "", "utf8");
    if (ba.length !== bb.length) { timingSafeEqual(ba, ba); return false; }
    return timingSafeEqual(ba, bb);
}

export function getClientIp(req: Request): string {
    return (req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()) || "unknown";
}

// Basit IP rate limit
const hits = new Map<string, { c: number; t: number }>();
export function rateLimited(req: Request, max = 120, windowMs = 60_000): boolean {
    const ip = getClientIp(req);
    const now = Date.now();
    const h = hits.get(ip);
    if (!h || now - h.t > windowMs) { hits.set(ip, { c: 1, t: now }); return false; }
    h.c += 1;
    return h.c > max;
}

// settings->odeal parse
function parseCreds(settings: unknown): OdealCreds | null {
    const od = (settings as Record<string, unknown> | null)?.odeal as Record<string, unknown> | undefined;
    if (!od) return null;
    return {
        publicKey: String(od.publicKey || ""),
        secretKey: String(od.secretKey || ""),
        externalDeviceKey: String(od.externalDeviceKey || ""),
        paxId: String(od.paxId || ""),
        baseUrl: String(od.baseUrl || ""),
        environment: String(od.environment || "stage"),
        terminalSerial: String(od.terminalSerial || ""),
        active: od.active !== false,
    };
}

/**
 * Gelen webhook'u doğrula: merchant key → tenant, secret key eşleşmesi.
 * Dönerse { tenantId, creds }; aksi halde null (401/403).
 */
export async function verifyWebhook(req: Request): Promise<{ tenantId: string; creds: OdealCreds } | null> {
    const merchantKey = req.headers.get("x-odeal-merchant-key") || "";
    const secretKey = req.headers.get("x-odeal-secret-key") || "";
    if (!merchantKey || !secretKey) return null;

    // Merchant key ile tenant bul
    const { data, error } = await supabaseAdmin
        .from("tenants")
        .select("id, settings")
        .eq("settings->odeal->>publicKey", merchantKey)
        .limit(1)
        .maybeSingle();
    if (error || !data) return null;

    const creds = parseCreds(data.settings);
    if (!creds || !creds.active) return null;
    // Secret key sabit-zamanlı doğrulama
    if (!safeEqual(secretKey, creds.secretKey)) return null;

    return { tenantId: data.id as string, creds };
}

/** Belirli bir tenant'ın Ödeal kimlik bilgilerini getir (outbound için). */
export async function getTenantOdealCreds(tenantId: string): Promise<OdealCreds | null> {
    const { data, error } = await supabaseAdmin
        .from("tenants")
        .select("settings")
        .eq("id", tenantId)
        .maybeSingle();
    if (error || !data) return null;
    return parseCreds(data.settings);
}

// KDS/ekranda gösterilecek metni temizle
export function clean(v: unknown, max = 200): string {
    return String(v ?? "").replace(/[<>]/g, "").slice(0, max).trim();
}

/**
 * Gelen Ödeal callback'ini işler. Ödeal webhook'ta merchant/secret header
 * göndermeyebilir; bu yüzden tenant, payload'daki basketRefCode'un BİZİM
 * oluşturduğumuz pending kayıtla eşleşmesinden çözülür (forge koruması:
 * geçerli, mevcut bir sepet referansı gerekir — o da /pay'de tenant kimliğiyle
 * üretilir). Ek katman: tenant'ta odealRequestKey tanımlıysa header/gövdede
 * eşleşme aranır.
 * status: succeeded | cancelled | failed | einvoice
 */
export async function processOdealWebhook(
    req: Request,
    status: "succeeded" | "cancelled" | "failed" | "einvoice"
): Promise<Response> {
    if (rateLimited(req)) return json({ error: "rate_limited" }, 429);

    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }

    // Ödeal callback alanları küçük harf camelCase: basketDetail.basketRefCode
    const referenceCode = pick(body, [
        "basketDetail.basketRefCode", "basketRefCode", "basketReferenceCode", "referenceCode",
    ]);
    if (!referenceCode) return json({ error: "missing_reference" }, 400);

    // Referansı, önceden oluşturduğumuz işleme göre çöz (tenant buradan gelir)
    const { data: tx } = await supabaseAdmin
        .from("odeal_transactions")
        .select("id, tenant_id")
        .eq("reference_code", referenceCode)
        .maybeSingle();
    if (!tx) {
        console.warn(`[odeal] Bilinmeyen sepet referansı: ${clean(referenceCode, 60)}`);
        return json({ error: "reference_not_found" }, 404);
    }

    const update: Record<string, unknown> = {
        result: body,
        updated_at: new Date().toISOString(),
    };

    if (status === "einvoice") {
        update.einvoice_no = clean(pick(body, ["invoiceNumber", "eInvoiceNo", "invoiceNo"]), 60) || null;
        update.einvoice_url = clean(pick(body, ["invoiceUrl", "eInvoiceUrl", "url"]), 400) || null;
        // e-fatura satış statüsünü değiştirmez, sadece bilgi ekler
    } else {
        update.status = status;
        if (status === "succeeded") {
            update.amount = Number(pick(body, ["paymentDetail.amount", "amount"])) || null;
            update.payment_ref_code = clean(pick(body, ["paymentRefCode"]), 60) || null;
            update.payment_method = clean(pick(body, ["paymentDetail.paymentMethod"]), 60) || null;
            update.installment = Number(pick(body, ["paymentDetail.installment"])) || null;
            update.bank_code = clean(pick(body, ["paymentDetail.bankCode"]), 20) || null;
            update.auth_code = clean(pick(body, ["paymentDetail.authCode"]), 20) || null;
        }
    }

    const { error } = await supabaseAdmin
        .from("odeal_transactions")
        .update(update)
        .eq("id", tx.id);
    if (error) {
        console.error("[odeal] webhook yazma hatası:", error.message);
        return json({ error: "persist_failed" }, 500);
    }
    return json({ success: true }, 200);
}

function json(obj: unknown, status: number): Response {
    return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}
export function pick(obj: Record<string, unknown>, paths: string[]): string {
    for (const p of paths) {
        const val = p.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), obj);
        if (val !== undefined && val !== null && String(val).length > 0) return String(val);
    }
    return "";
}
