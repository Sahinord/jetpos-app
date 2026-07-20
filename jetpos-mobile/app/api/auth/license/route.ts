import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Lisans girişi — HIZ SINIRLI sunucu ucu (jetpos-mobile kopyası).
 *
 * client/src/app/api/auth/license/route.ts ile aynı mantık; mobil ayrı bir
 * Next.js dağıtımı olduğu için kendi ucu var (cross-origin/CORS derdi olmasın).
 *
 * ÖNEMLİ: find_tenant_by_license RPC'sinin anon EXECUTE izni kaldırıldıktan
 * sonra (20260720_revoke_login_rpcs.sql) bu route'un çalışması için mobil
 * Vercel projesine SUPABASE_SERVICE_ROLE_KEY env'i eklenmiş olmalı.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPA_URL =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://grlwmcuxobbgubphovhd.supabase.co";

function rpcClient() {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const key = serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    return {
        client: createClient(SUPA_URL, key, {
            auth: { persistSession: false, autoRefreshToken: false },
        }),
        hasService: !!serviceKey,
    };
}

function clientIp(req: NextRequest): string {
    return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

// Bellek içi hızlı sayaç (katman 1)
const memHits = new Map<string, { c: number; t: number }>();
function memLimited(ip: string, max = 10, windowMs = 60_000): boolean {
    const now = Date.now();
    const h = memHits.get(ip);
    if (!h || now - h.t > windowMs) { memHits.set(ip, { c: 1, t: now }); return false; }
    h.c += 1;
    return h.c > max;
}

export async function POST(req: NextRequest) {
    const ip = clientIp(req);
    if (memLimited(ip)) {
        return NextResponse.json({ error: "Çok fazla istek. Lütfen bekleyin." }, { status: 429 });
    }

    let body: { action?: string; licenseKey?: string };
    try { body = await req.json(); } catch {
        return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }

    const { client, hasService } = rpcClient();

    // DB sayaç (katman 2) — yalnızca service key varken
    if (hasService) {
        try {
            const now = Date.now();
            const min1 = new Date(now - 60_000).toISOString();
            const h24 = new Date(now - 24 * 3600_000).toISOString();
            const [{ count: cMin }, { count: cDay }] = await Promise.all([
                client.from("login_attempts").select("id", { count: "exact", head: true })
                    .eq("ip", ip).eq("success", false).gte("attempted_at", min1),
                client.from("login_attempts").select("id", { count: "exact", head: true })
                    .eq("ip", ip).eq("success", false).gte("attempted_at", h24),
            ]);
            if ((cDay ?? 0) >= 20) {
                return NextResponse.json({ error: "Çok fazla başarısız deneme. Bu adres 24 saat engellendi." }, { status: 429 });
            }
            if ((cMin ?? 0) >= 5) {
                return NextResponse.json({ error: "Çok fazla deneme. Lütfen 1 dakika bekleyin." }, { status: 429 });
            }
        } catch (e) {
            console.warn("[auth/license] DB sayaç atlandı:", (e as Error)?.message);
        }
    }

    if (body.action === "find") {
        const key = String(body.licenseKey || "").trim();
        if (!key || key.length > 120) {
            return NextResponse.json({ error: "Geçersiz lisans anahtarı." }, { status: 400 });
        }
        const { data, error } = await client.rpc("find_tenant_by_license", { p_license_key: key });
        const ok = !error && !!data;
        if (hasService) {
            try {
                await client.from("login_attempts").insert({ ip, key_hint: key.slice(0, 4), success: ok });
            } catch { /* yut */ }
        }
        if (!ok) {
            return NextResponse.json({ error: "Geçersiz veya pasif lisans anahtarı." }, { status: 403 });
        }
        return NextResponse.json({ tenant: data });
    }

    return NextResponse.json({ error: "Bilinmeyen işlem." }, { status: 400 });
}
