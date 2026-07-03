import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

// Tüm admin API route'larının ortak auth + rate limit + yetki katmanı.
//
// İki tür kimlik desteklenir:
// 1) Süper admin (owner): ADMIN_SECRET_TOKEN env değeri — her şeye erişir.
// 2) Ekip üyeleri: admin_users tablosundaki kullanıcılar. Girişte admin_sessions
//    tablosuna süreli bir oturum token'ı yazılır; client bu token'ı
//    x-admin-token header'ı ile gönderir. "staff" rolündekiler yalnızca
//    permissions jsonb'sinde açık olan bölümlere erişebilir; "admin" rolü
//    tüm bölümlere erişir ama ekip yönetimi owner + admin'e açıktır.

const attempts = new Map<string, { count: number; firstAttempt: number }>();
const WINDOW_MS = 5 * 60 * 1000; // 5 dakika
const MAX_ATTEMPTS = 60;

export const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 saat

export type AdminRole = "owner" | "admin" | "staff";
export type AdminContext = {
    role: AdminRole;
    userId: string | null; // owner (env token) için null
    name: string;
    permissions: Record<string, boolean> | null; // owner/admin için null (sınırsız)
};

export function getClientIp(req: NextRequest): string {
    return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/**
 * IP izin kontrolü. Liste boşsa her yerden izinli.
 * Girişler tam eşleşme ("85.100.1.20") veya "*" ile biten önek ("85.100.*") olabilir.
 */
export function ipAllowed(clientIp: string, allowedIps: string[] | null | undefined): boolean {
    if (!allowedIps || allowedIps.length === 0) return true;
    if (!clientIp || clientIp === "unknown") return false;
    return allowedIps.some(entry => {
        const e = entry.trim();
        if (!e) return false;
        if (e.endsWith("*")) return clientIp.startsWith(e.slice(0, -1));
        return clientIp === e;
    });
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

export function getServiceSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    if (!url || !serviceKey) throw new Error("Supabase env vars missing");
    return createClient(url, serviceKey);
}

/* ── Şifre hash'leme (scrypt, harici bağımlılık yok) ── */
export function hashPassword(password: string): string {
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const candidate = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function newSessionToken(): string {
    return randomBytes(32).toString("hex");
}

/* ── Kimlik çözümleme ── */
export async function getAdminContext(req: NextRequest): Promise<AdminContext | null> {
    const token = req.headers.get("x-admin-token");
    if (!token) return null;

    // 1) Süper admin (env token)
    const secret = process.env.ADMIN_SECRET_TOKEN;
    if (secret && token === secret) {
        return { role: "owner", userId: null, name: "Süper Admin", permissions: null };
    }

    // 2) Ekip oturumu (admin_sessions tablosu migration uygulanmadıysa sessizce reddedilir)
    try {
        const sb = getServiceSupabase();
        const { data: session } = await sb
            .from("admin_sessions")
            .select("user_id, expires_at")
            .eq("token", token)
            .maybeSingle();
        if (!session || new Date(session.expires_at).getTime() < Date.now()) return null;

        const { data: user } = await sb
            .from("admin_users")
            .select("id, name, role, permissions, active, allowed_ips")
            .eq("id", session.user_id)
            .maybeSingle();
        if (!user || user.active !== true) return null;

        // IP kısıtı: her istekte kontrol edilir (oturum açıkken IP değişirse de düşer)
        if (!ipAllowed(getClientIp(req), user.allowed_ips)) {
            console.warn(`[admin-auth] IP izni yok: ip=${getClientIp(req)} user=${user.id}`);
            return null;
        }

        const role: AdminRole = user.role === "admin" ? "admin" : "staff";
        return {
            role,
            userId: user.id,
            name: user.name || "Ekip Üyesi",
            permissions: role === "admin" ? null : (user.permissions || {}),
        };
    } catch {
        return null;
    }
}

/**
 * Rate-limit + auth + (opsiyonel) bölüm yetkisi kontrolü.
 * Dönen değer NextResponse ise hemen onu return et, null ise devam.
 * perm verilirse: owner/admin serbest, staff için permissions[perm] === true şartı aranır.
 */
export async function adminGuard(req: NextRequest, perm?: string): Promise<NextResponse | null> {
    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
        console.warn(`[admin-auth] Rate limit aşıldı: ip=${ip} path=${req.nextUrl.pathname}`);
        return NextResponse.json({ error: "Çok fazla istek, lütfen daha sonra tekrar deneyin" }, { status: 429 });
    }
    const ctx = await getAdminContext(req);
    if (!ctx) {
        console.warn(`[admin-auth] Yetkisiz erişim denemesi: ip=${ip} path=${req.nextUrl.pathname}`);
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }
    if (perm && ctx.role === "staff" && ctx.permissions?.[perm] !== true) {
        return NextResponse.json({ error: "Bu bölüm için yetkiniz yok" }, { status: 403 });
    }
    return null;
}
