import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase, verifyPassword, newSessionToken, ipAllowed, SESSION_TTL_MS } from "@/lib/adminAuth";

// İki giriş modu:
// 1) Kullanıcı adı BOŞ + şifre = ADMIN_SECRET_TOKEN → Süper Admin (owner).
//    Token olarak secret'ın kendisi kullanılır (eski davranışla uyumlu).
// 2) Kullanıcı adı + şifre → admin_users doğrulaması, admin_sessions'a süreli token yazılır.

const ADMIN_SECRET = process.env.ADMIN_SECRET_TOKEN;

const attempts = new Map<string, { count: number; firstAttempt: number }>();
const WINDOW_MS = 10 * 60 * 1000; // 10 dakika
const MAX_ATTEMPTS = 10;

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

export async function POST(req: NextRequest) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
        return NextResponse.json({ error: "Çok fazla deneme, lütfen daha sonra tekrar deneyin" }, { status: 429 });
    }

    try {
        const { username, password } = await req.json();
        if (typeof password !== "string" || password.length === 0) {
            return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
        }

        // ── Mod 1: Süper Admin ──
        if (!username) {
            if (!ADMIN_SECRET) {
                return NextResponse.json({ error: "Sunucu yapılandırma hatası" }, { status: 500 });
            }
            if (password !== ADMIN_SECRET) {
                return NextResponse.json({ error: "Geçersiz şifre" }, { status: 401 });
            }
            return NextResponse.json({
                success: true,
                token: ADMIN_SECRET,
                user: { name: "Süper Admin", role: "owner", permissions: null },
            });
        }

        // ── Mod 2: Ekip üyesi ──
        const sb = getServiceSupabase();
        const { data: user, error } = await sb
            .from("admin_users")
            .select("id, username, name, password_hash, role, permissions, active, allowed_ips")
            .eq("username", String(username).trim().toLowerCase())
            .maybeSingle();
        if (error) throw error;

        if (!user || user.active !== true || !verifyPassword(password, user.password_hash)) {
            return NextResponse.json({ error: "Kullanıcı adı veya şifre hatalı" }, { status: 401 });
        }

        // IP kısıtı: tanımlıysa yalnızca izinli IP'lerden giriş yapılabilir
        if (!ipAllowed(ip, user.allowed_ips)) {
            console.warn(`[admin-login] IP izni yok: ip=${ip} user=${user.username}`);
            return NextResponse.json({ error: `Bu IP adresinden giriş izniniz yok (${ip})` }, { status: 403 });
        }

        const token = newSessionToken();
        const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
        const { error: sessErr } = await sb.from("admin_sessions").insert([{ token, user_id: user.id, expires_at: expiresAt }]);
        if (sessErr) throw sessErr;

        // Süresi geçmiş oturumları temizle + son giriş zamanını yaz (best-effort)
        await sb.from("admin_sessions").delete().lt("expires_at", new Date().toISOString());
        await sb.from("admin_users").update({ last_login_at: new Date().toISOString() }).eq("id", user.id);

        return NextResponse.json({
            success: true,
            token,
            user: {
                name: user.name || user.username,
                role: user.role === "admin" ? "admin" : "staff",
                permissions: user.role === "admin" ? null : (user.permissions || {}),
            },
        });
    } catch (e) {
        console.error("[admin-login]", e);
        return NextResponse.json({ error: "Giriş yapılamadı. Ekip girişi için veritabanı migration'ının uygulanmış olması gerekir." }, { status: 500 });
    }
}
