import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyTenantAccess } from "@/lib/server-tenant-auth";

/**
 * AI sohbet/analiz köprüsü — SUNUCU tarafı.
 *
 * NEDEN VAR: Eskiden tarayıcıdaki AIClient (lib/gemini.ts) DeepSeek/OpenRouter'a
 * DOĞRUDAN `Authorization: Bearer <key>` ile istek atıyordu ve anahtar
 * NEXT_PUBLIC_OPENROUTER_API_KEY olarak JS bundle'ına gömülüydü → herkes çalıp
 * kullanabiliyordu. Artık anahtar YALNIZCA burada, sunucuda çözülür; istemci
 * yalnızca `messages` gönderir, anahtarı asla görmez/göndermez.
 *
 * Anahtar çözüm sırası (istemciden gelen anahtar YOK SAYILIR):
 *   1) integration_settings (type='gemini_ai').settings.apiKey  — tenant'ın kendi anahtarı
 *   2) tenants.openrouter_api_key                                — lisansa tanımlı anahtar
 *   3) process.env.OPENROUTER_API_KEY                            — platform (sunucu) anahtarı
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";
const DEFAULT_MODEL = "deepseek-chat";

const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "no_key_for_build",
    { auth: { persistSession: false } }
);

async function resolveApiKey(tenantId: string): Promise<string> {
    // 1) tenant'a özel AI anahtarı
    try {
        const { data } = await admin
            .from("integration_settings")
            .select("settings")
            .eq("tenant_id", tenantId)
            .eq("type", "gemini_ai")
            .maybeSingle();
        const k = (data?.settings as any)?.apiKey;
        if (k && k !== "undefined" && k !== "server") return String(k).trim();
    } catch { /* yoksa devam */ }

    // 2) lisansa/tenant'a tanımlı anahtar
    try {
        const { data } = await admin
            .from("tenants")
            .select("openrouter_api_key")
            .eq("id", tenantId)
            .maybeSingle();
        if (data?.openrouter_api_key) return String(data.openrouter_api_key).trim();
    } catch { /* devam */ }

    // 3) platform anahtarı (SUNUCU env — asla NEXT_PUBLIC değil)
    return (process.env.OPENROUTER_API_KEY || "").trim();
}

export async function POST(req: NextRequest) {
    const auth = await verifyTenantAccess(req);
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let body: { messages?: any[]; model?: string };
    try { body = await req.json(); } catch {
        return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }

    const messages = Array.isArray(body.messages) ? body.messages : null;
    if (!messages || messages.length === 0) {
        return NextResponse.json({ error: "messages gerekli." }, { status: 400 });
    }
    // Basit doğrulama: her mesaj {role, content}
    for (const m of messages) {
        if (!m || typeof m.content !== "string" || typeof m.role !== "string") {
            return NextResponse.json({ error: "Geçersiz mesaj formatı." }, { status: 400 });
        }
    }

    const apiKey = await resolveApiKey(auth.tenantId!);
    if (!apiKey) {
        return NextResponse.json(
            { error: "AI anahtarı tanımlı değil. Ayarlardan API anahtarı ekleyin." },
            { status: 400 }
        );
    }

    try {
        const upstream = await fetch(DEEPSEEK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "https://jetpos.app",
                "X-Title": "JetPos AI",
            },
            body: JSON.stringify({
                model: body.model || DEFAULT_MODEL,
                messages,
                temperature: 0.7,
            }),
        });

        if (!upstream.ok) {
            let msg = `AI sağlayıcı hatası (HTTP ${upstream.status})`;
            try { const e = await upstream.json(); msg = e?.error?.message || msg; } catch { }
            // Yukarı akış anahtar/bakiye hatalarını istemciye anlaşılır ilet
            return NextResponse.json({ error: msg }, { status: 502 });
        }

        const result = await upstream.json();
        const content = result?.choices?.[0]?.message?.content ?? "";
        return NextResponse.json({ content });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || "AI isteği başarısız." }, { status: 500 });
    }
}
