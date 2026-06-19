import { NextRequest, NextResponse } from "next/server";

// Şifre artık client bundle'ına gömülmüyor — sadece server-only env'den okunuyor.
// .env.local'da NEXT_PUBLIC_ADMIN_PASSWORD yerine ADMIN_SECRET_TOKEN kullan.
const ADMIN_SECRET = process.env.ADMIN_SECRET_TOKEN;

// Basit in-memory rate limit: aynı IP için kısa sürede çok deneme olursa engelle.
// Not: Bu sunucu yeniden başladığında sıfırlanır ve tek instance içinde geçerlidir;
// ciddi bir brute-force koruması için Vercel KV / Upstash gibi paylaşımlı bir store önerilir.
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
    if (entry.count > MAX_ATTEMPTS) return true;
    return false;
}

export async function POST(req: NextRequest) {
    if (!ADMIN_SECRET) {
        return NextResponse.json({ error: "Sunucu yapılandırma hatası" }, { status: 500 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
        return NextResponse.json({ error: "Çok fazla deneme, lütfen daha sonra tekrar deneyin" }, { status: 429 });
    }

    try {
        const { password } = await req.json();
        if (typeof password !== "string" || password !== ADMIN_SECRET) {
            return NextResponse.json({ error: "Geçersiz şifre" }, { status: 401 });
        }
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
    }
}
