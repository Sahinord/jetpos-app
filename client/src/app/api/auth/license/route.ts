import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin, hasServiceRoleKey } from "@/lib/supabase-admin";

/**
 * Lisans girişi — HIZ SINIRLI sunucu ucu.
 *
 * NEDEN VAR: LicenseGate daha önce find_tenant_by_license /
 * verify_tenant_password RPC'lerini DOĞRUDAN tarayıcıdan çağırıyordu.
 * Deneme sınırı olmadığı için saniyede yüzlerce anahtar denenebiliyordu
 * (kaba kuvvet). Artık giriş bu route'tan geçer ve IP başına sınırlanır.
 *
 * Politika:
 *   • 60 sn içinde 5+ başarısız deneme  → 429, 1 dk bekletme
 *   • 24 saat içinde 20+ başarısız deneme → 429, 24 saat blok
 *
 * Sayaç iki katmanlı:
 *   1. Bellek içi (ucuz, aynı instance'a hızlı flood'u anında keser)
 *   2. login_attempts tablosu (kalıcı; serverless instance'ları arasında ortak)
 * Tablo yoksa/DB hatasında 2. katman SESSİZCE atlanır (fail-open) —
 * kimse "migration çalışmadı" diye POS'a girememezlik yaşamaz.
 *
 * Not: Bu uç kimliksiz çağrılabilir (login öncesi) — client middleware'inde
 * PUBLIC_API_PATHS listesine ekli. Kendini hız sınırıyla korur.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function anonClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
    );
}

function clientIp(req: NextRequest): string {
    // Vercel'de x-forwarded-for platform tarafından set edilir (taklit edilemez)
    return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

// ── Katman 1: bellek içi hızlı sayaç ──
const memHits = new Map<string, { c: number; t: number }>();
function memLimited(ip: string, max = 10, windowMs = 60_000): boolean {
    const now = Date.now();
    const h = memHits.get(ip);
    if (!h || now - h.t > windowMs) { memHits.set(ip, { c: 1, t: now }); return false; }
    h.c += 1;
    return h.c > max;
}

// ── Katman 2: DB sayaç (yalnızca BAŞARISIZ denemeler sayılır) ──
async function dbLimited(ip: string): Promise<{ limited: boolean; message?: string }> {
    if (!hasServiceRoleKey) return { limited: false };
    try {
        const now = Date.now();
        const min1 = new Date(now - 60_000).toISOString();
        const h24 = new Date(now - 24 * 3600_000).toISOString();

        const [{ count: cMin }, { count: cDay }] = await Promise.all([
            supabaseAdmin.from("login_attempts")
                .select("id", { count: "exact", head: true })
                .eq("ip", ip).eq("success", false).gte("attempted_at", min1),
            supabaseAdmin.from("login_attempts")
                .select("id", { count: "exact", head: true })
                .eq("ip", ip).eq("success", false).gte("attempted_at", h24),
        ]);

        if ((cDay ?? 0) >= 20) {
            return { limited: true, message: "Çok fazla başarısız deneme. Bu adres 24 saat engellendi." };
        }
        if ((cMin ?? 0) >= 5) {
            return { limited: true, message: "Çok fazla deneme. Lütfen 1 dakika bekleyin." };
        }
        return { limited: false };
    } catch (e) {
        // Tablo henüz oluşturulmadıysa girişi KIRMA — bellek katmanı yine devrede
        console.warn("[auth/license] DB sayaç atlandı:", (e as Error)?.message);
        return { limited: false };
    }
}

async function logAttempt(ip: string, keyHint: string, success: boolean): Promise<void> {
    if (!hasServiceRoleKey) return;
    try {
        await supabaseAdmin.from("login_attempts").insert({
            ip,
            key_hint: keyHint.slice(0, 4), // ASLA tam anahtar yazılmaz
            success,
        });
    } catch { /* log hatası girişi etkilemesin */ }
}

export async function POST(req: NextRequest) {
    const ip = clientIp(req);

    // Katman 1 — bariz flood'u ucuza kes
    if (memLimited(ip)) {
        return NextResponse.json({ error: "Çok fazla istek. Lütfen bekleyin." }, { status: 429 });
    }

    let body: { action?: string; licenseKey?: string; tenantId?: string; password?: string };
    try { body = await req.json(); } catch {
        return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }

    // Katman 2 — kalıcı sayaç
    const rl = await dbLimited(ip);
    if (rl.limited) {
        return NextResponse.json({ error: rl.message }, { status: 429 });
    }

    // RPC'ler service-role ile çağrılır: find_tenant_by_license /
    // verify_tenant_password'un anon EXECUTE izni kaldırılınca (bkz.
    // 20260720_revoke_login_rpcs.sql) doğrudan-RPC bypass'ı kapanır ve bu
    // route TEK giriş kapısı olur. Service key yoksa anon'a düşer (revoke
    // uygulanana kadar çalışır; sonrasında env şart).
    const anon = hasServiceRoleKey ? supabaseAdmin : anonClient();

    // ── action: find — lisans anahtarından tenant bul (login 1. adım) ──
    if (body.action === "find") {
        const key = String(body.licenseKey || "").trim();
        if (!key || key.length > 120) {
            return NextResponse.json({ error: "Geçersiz lisans anahtarı." }, { status: 400 });
        }
        const { data, error } = await anon.rpc("find_tenant_by_license", { p_license_key: key });
        const ok = !error && !!data;
        await logAttempt(ip, key, ok);
        if (!ok) {
            // "Anahtar mı yanlış, hesap mı yok" ayrımı verilmez (hesap keşfini önler)
            return NextResponse.json({ error: "Geçersiz veya pasif lisans anahtarı." }, { status: 403 });
        }
        return NextResponse.json({ tenant: data });
    }

    // ── action: verify — şifre doğrula (login 2. adım) ──
    if (body.action === "verify") {
        const tenantId = String(body.tenantId || "");
        const password = String(body.password || "");
        if (!tenantId || !password || password.length > 200) {
            return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
        }
        const { data, error } = await anon.rpc("verify_tenant_password", {
            p_tenant_id: tenantId,
            p_password: password,
        });
        const ok = !error && data?.success === true;
        await logAttempt(ip, tenantId, ok);
        if (!ok) {
            return NextResponse.json({ error: data?.message || "Hatalı şifre." }, { status: 403 });
        }
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Bilinmeyen işlem." }, { status: 400 });
}
