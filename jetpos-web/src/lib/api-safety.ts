import { NextRequest } from "next/server";

/**
 * Public API uçları için ortak güvenlik yardımcıları:
 * - basit IP bazlı rate limit (in-memory; ciddi koruma için Upstash/KV önerilir)
 * - e-posta format doğrulaması
 * - HTML kaçırma (e-posta şablonlarına gömülen kullanıcı girdisi için)
 */

type Bucket = { count: number; firstAt: number };
const buckets = new Map<string, Bucket>();

export function getClientIp(req: NextRequest): string {
    return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/**
 * true dönerse istek engellenmeli.
 * key: uç adı (örn "contact"), windowMs pencere, max o pencerede izinli istek.
 */
export function rateLimit(req: NextRequest, key: string, max = 5, windowMs = 60_000): boolean {
    const id = `${key}:${getClientIp(req)}`;
    const now = Date.now();
    const b = buckets.get(id);
    if (!b || now - b.firstAt > windowMs) {
        buckets.set(id, { count: 1, firstAt: now });
        return false;
    }
    b.count += 1;
    return b.count > max;
}

// Basit ama sağlam e-posta doğrulaması (RFC'nin pratik alt kümesi)
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;
export function isValidEmail(v: unknown): v is string {
    return typeof v === "string" && v.length <= 254 && EMAIL_RE.test(v);
}

// E-posta/HTML şablonlarına gömülecek kullanıcı girdisini kaçırır (XSS/HTML enjeksiyonu)
export function escapeHtml(v: unknown): string {
    return String(v ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
