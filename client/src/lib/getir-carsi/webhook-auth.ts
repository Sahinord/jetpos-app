import { timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Getir ÇARŞI webhook güvenlik katmanı (market/bakkal dikeyi — Getir Yemek'ten ayrı).
 *
 * Getir sunucusu kimliğini YALNIZCA paylaşılan tek bir x-api-key ile kanıtlar.
 * Bu yüzden:
 *  1. x-api-key her istekte sabit-zamanlı (timing-safe) karşılaştırılır.
 *  2. Sipariş hangi tenant'a ait? Body'ye GÜVENİLMEZ; tenant yalnızca
 *     getir_carsi_integrations tablosundaki mağaza-kimliği eşlemesinden çözülür.
 *  3. Basit IP bazlı rate limit ile flood engellenir.
 *
 * x-api-key, GETIR_CARSI_WEBHOOK_API_KEY env değişkeninde tutulur
 * (server-only, asla NEXT_PUBLIC_, asla log'a yazılmaz).
 */

const API_KEY = process.env.GETIR_CARSI_WEBHOOK_API_KEY || "";

// ── Sabit-zamanlı string karşılaştırma (uzunluk sızıntısını da engeller) ──
export function safeEqual(a: string, b: string): boolean {
    const ba = Buffer.from(a, "utf8");
    const bb = Buffer.from(b, "utf8");
    if (ba.length !== bb.length) {
        timingSafeEqual(ba, ba); // sabit-zamanlı davran, sonra false
        return false;
    }
    return timingSafeEqual(ba, bb);
}

// ── x-api-key doğrulama (fail-closed) ──
export function verifyApiKey(req: Request): boolean {
    if (!API_KEY) {
        console.error("[getir-carsi] GETIR_CARSI_WEBHOOK_API_KEY tanımlı değil — webhook'lar reddediliyor");
        return false;
    }
    const provided = req.headers.get("x-api-key") || "";
    if (!provided) return false;
    return safeEqual(provided, API_KEY);
}

// ── Basit in-memory rate limit (IP başına) ──
const hits = new Map<string, { c: number; t: number }>();
export function rateLimited(req: Request, max = 120, windowMs = 60_000): boolean {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const now = Date.now();
    const h = hits.get(ip);
    if (!h || now - h.t > windowMs) {
        hits.set(ip, { c: 1, t: now });
        return false;
    }
    h.c += 1;
    return h.c > max;
}

// ── Getir Çarşı shopId'sinden tenant çöz ──
// Per-tenant Getir verisi SuperAdmin'den tenants.settings->'getirCarsi' altına
// girilir (env yok). Eşleme YALNIZCA shopId üzerinden; body'ye güvenilmez.
export async function resolveTenant(getirShopId: string): Promise<string | null> {
    if (!getirShopId) return null;
    const { data, error } = await supabaseAdmin
        .from("tenants")
        .select("id, settings")
        .eq("settings->getirCarsi->>shopId", getirShopId)
        .limit(1)
        .maybeSingle();
    if (error || !data) return null;
    const gc = (data.settings as Record<string, unknown> | null)?.getirCarsi as
        | Record<string, unknown>
        | undefined;
    // active açıkça false ise reddet (tanımsız/true ise kabul)
    if (gc && gc.active === false) return null;
    return data.id as string;
}

// Bu tenant'ın Getir çıkış (outbound) kimlik bilgilerini getir
// (token/onay/iptal çağrıları için — outbound entegrasyon aşamasında kullanılacak).
export async function getTenantGetirCreds(
    tenantId: string
): Promise<{ username: string; password: string; shopId: string } | null> {
    const { data, error } = await supabaseAdmin
        .from("tenants")
        .select("settings")
        .eq("id", tenantId)
        .maybeSingle();
    if (error || !data) return null;
    const gc = (data.settings as Record<string, unknown> | null)?.getirCarsi as
        | Record<string, unknown>
        | undefined;
    if (!gc) return null;
    return {
        username: String(gc.username || ""),
        password: String(gc.password || ""),
        shopId: String(gc.shopId || ""),
    };
}

// ── KDS/adisyonda gösterilecek metni temizle (stored XSS önlemi) ──
export function clean(v: unknown, max = 500): string {
    return String(v ?? "").replace(/[<>]/g, "").slice(0, max).trim();
}

// Payload'daki muhtemel alan yollarından ilk dolu olanı getir
// (Getir Çarşı şema sürümüne göre değişebildiği için toleranslı okuyoruz)
export function pick(obj: Record<string, unknown>, paths: string[]): string {
    for (const p of paths) {
        const val = p.split(".").reduce<unknown>(
            (o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined),
            obj
        );
        if (val !== undefined && val !== null && String(val).length > 0) return String(val);
    }
    return "";
}

// ── Getir Çarşı API dökümanına göre standart alan yolları ──
// Sipariş akışı endpoint'leri: /v1/orders/{orderId}/shop/{shopId}/...
export const F = {
    shopId: ["shopId", "shop.id", "shop.shopId", "chainId", "vendorId"],
    orderId: ["id", "orderId", "order.id", "_id"],
    orderNumber: ["confirmationId", "orderNumber", "shortCode", "id"],
    customer: ["client.name", "client.contactName", "customer.name", "customer.firstName"],
    // maxTotalPrice: /unapproved içinde revizyon üst sınırı; totalPrice da olabilir
    total: ["totalPrice", "maxTotalPrice", "basketPrice", "totalAmount"],
    status: ["status", "orderStatus"],           // sayısal kod (400, 1500, 1600, ...)
    deliveryType: ["deliveryType", "delivery.type"],
};

export const toInt = (v: string): number | null => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
};

// Getir statü kodları (API dökümanı): 1500=Admin iptal, 1600=İşletme iptal
export const CANCELLED_CODES = new Set([1500, 1600]);
