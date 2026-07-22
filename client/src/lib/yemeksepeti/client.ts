/**
 * Yemeksepeti (Delivery Hero) Partner API istemcisi.
 *
 * Kimlik doğrulama: OAuth2 client_credentials.
 *   POST /v2/oauth/token  (x-www-form-urlencoded: grant_type, client_id, client_secret)
 *   → access_token (2 saat geçerli). Chain'in TÜM vendor'ları için geçerli.
 *
 * Sipariş güncelleme: PUT /v2/orders/{order_id}
 *   status ∈ CANCELLED | DISPATCHED | READY_FOR_PICKUP | UPDATE_CART
 *
 * Not: Kimlik bilgileri (client_id/secret) SuperAdmin'den girilir, env yok.
 * Token bellek içi cache'lenir (instance başına), süresi dolunca yenilenir.
 */

const PROD_BASE = "https://yemeksepeti.partner.deliveryhero.io";

export interface YsConfig {
    clientId: string;
    clientSecret: string;
    chainId: string;
    baseUrl?: string; // varsayılan prod; test/bölge adresi verilirse override
}

function base(cfg: YsConfig): string {
    return (cfg.baseUrl || PROD_BASE).replace(/\/+$/, "");
}

// ── Token cache (instance başına, client_id bazında) ──
const tokenCache = new Map<string, { token: string; exp: number }>();

export async function getAccessToken(cfg: YsConfig): Promise<string | null> {
    const key = cfg.clientId;
    const now = Date.now();
    const cached = tokenCache.get(key);
    // 60 sn güvenlik payı
    if (cached && cached.exp - 60_000 > now) return cached.token;

    const form = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
    });

    try {
        const res = await fetch(`${base(cfg)}/v2/oauth/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: form.toString(),
        });
        if (!res.ok) {
            console.error("[yemeksepeti] token alınamadı:", res.status);
            return null;
        }
        const json = await res.json();
        const token = json?.access_token;
        const expiresIn = Number(json?.expires_in) || 7200; // saniye
        if (!token) return null;
        tokenCache.set(key, { token, exp: now + expiresIn * 1000 });
        return token;
    } catch (e) {
        console.error("[yemeksepeti] token hatası:", (e as Error)?.message);
        return null;
    }
}

async function authed(cfg: YsConfig, path: string, init: RequestInit): Promise<{ ok: boolean; status: number; body: unknown }> {
    const token = await getAccessToken(cfg);
    if (!token) return { ok: false, status: 401, body: "token_alınamadı" };

    const res = await fetch(`${base(cfg)}${path}`, {
        ...init,
        headers: {
            ...(init.headers || {}),
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });
    const text = await res.text();
    let json: unknown = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* düz metin */ }
    return { ok: res.ok, status: res.status, body: json ?? text };
}

/** Tek siparişin detayını çek (webhook'ta id gelir, detay buradan). */
export async function getOrder(cfg: YsConfig, orderId: string) {
    return authed(cfg, `/v2/orders/${encodeURIComponent(orderId)}`, { method: "GET" });
}

/** Bir vendor'ın son siparişlerini çek (yedek senkron; webhook kaçarsa). */
export async function getVendorOrders(cfg: YsConfig, vendorId: string, params?: { startTime?: string; endTime?: string; page?: number; pageSize?: number }) {
    const q = new URLSearchParams();
    if (params?.startTime) q.set("start_created_at_datetime", params.startTime);
    if (params?.endTime) q.set("end_created_at_datetime", params.endTime);
    if (params?.page) q.set("page", String(params.page));
    if (params?.pageSize) q.set("page_size", String(params.pageSize));
    const qs = q.toString() ? `?${q.toString()}` : "";
    return authed(cfg, `/v2/chains/${encodeURIComponent(cfg.chainId)}/vendors/${encodeURIComponent(vendorId)}/orders${qs}`, { method: "GET" });
}

export type YsUpdateStatus = "CANCELLED" | "DISPATCHED" | "READY_FOR_PICKUP" | "UPDATE_CART";

/**
 * Sipariş durumu güncelle. İptalde sebep zorunlu.
 * items: platformun beklediği kalem listesi (kabul akışında gönderilir).
 */
export async function updateOrder(cfg: YsConfig, orderId: string, payload: {
    status: YsUpdateStatus;
    items?: Array<{ id?: string; sku?: string; quantity?: number }>;
    cancellationReason?: string;
}) {
    const body: Record<string, unknown> = {
        order_id: orderId,
        status: payload.status,
        items: payload.items ?? [],
    };
    if (payload.status === "CANCELLED") {
        body.cancellation = { reason: payload.cancellationReason || "OUT_OF_STOCK" };
    }
    return authed(cfg, `/v2/orders/${encodeURIComponent(orderId)}`, {
        method: "PUT",
        body: JSON.stringify(body),
    });
}

/** İşletmeyi (vendor) aç/kapa — meşgul/kapalı durumu. */
export async function setVendorStatus(cfg: YsConfig, vendorId: string, open: boolean, minutes?: number) {
    return authed(cfg, `/v2/chains/${encodeURIComponent(cfg.chainId)}/vendors/${encodeURIComponent(vendorId)}/status`, {
        method: "PUT",
        body: JSON.stringify(open ? { status: "OPEN" } : { status: "CLOSED", ...(minutes ? { closed_for_minutes: minutes } : {}) }),
    });
}
