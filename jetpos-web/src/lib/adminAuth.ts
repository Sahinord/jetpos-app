import { NextRequest, NextResponse } from "next/server";

// Tüm admin API route'larının ortak auth + rate limit + log katmanı.
// Önceden her route kendi checkAdminAuth'unu tanımlıyordu ve bazılarında
// NEXT_PUBLIC_ADMIN_PASSWORD'a fallback vardı (client bundle'ına gömülen,
// dolayısıyla herkesin okuyabildiği bir secret). Artık tek noktadan,
// sadece server-only ADMIN_SECRET_TOKEN ile kontrol ediliyor.

const attempts = new Map<string, { count: number; firstAttempt: number }>();
const WINDOW_MS = 5 * 60 * 1000; // 5 dakika
const MAX_ATTEMPTS = 60; // CRUD işlemleri login'den daha sık olabilir, login'den daha gevşek limit

function getClientIp(req: NextRequest): string {
    return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = attempts.get(ip);
    if (!entry || now - entry.firstAttempt > WINDOW_MS) {
        attempts.set(ip, { count: 1, firstAttempt: now });
        return false;
    }
    entry.count += 1;
    return entry.count > MAX_ATTEMPTS;
}

export function checkAdminAuth(req: NextRequest): boolean {
    const token = req.headers.get("x-admin-token");
    const expected = process.env.ADMIN_SECRET_TOKEN;
    const ok = !!token && !!expected && token === expected;
    if (!ok) {
        console.warn(`[admin-auth] Yetkisiz erişim denemesi: ip=${getClientIp(req)} path=${req.nextUrl.pathname}`);
    }
    return ok;
}

/**
 * Tek çağrıda rate-limit + auth kontrolü yapar.
 * Dönen değer NextResponse ise hemen onu return et, null ise işleme devam et.
 */
export function adminGuard(req: NextRequest): NextResponse | null {
    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
        console.warn(`[admin-auth] Rate limit aşıldı: ip=${ip} path=${req.nextUrl.pathname}`);
        return NextResponse.json({ error: "Çok fazla istek, lütfen daha sonra tekrar deneyin" }, { status: 429 });
    }
    if (!checkAdminAuth(req)) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }
    return null;
}
