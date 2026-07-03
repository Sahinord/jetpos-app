import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { adminGuard } from "@/lib/adminAuth";
import { mergeGameConfig } from "@/lib/game-config";

function getAdminSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY)!;
    if (!url || !serviceKey) throw new Error("Supabase env vars missing");
    return createClient(url, serviceKey);
}

// ── GET: mevcut oyun ayarları (varsayılanlarla birleşik) ─────────
export async function GET(req: NextRequest) {
    const guard = await adminGuard(req, "game");
    if (guard) return guard;
    try {
        const sb = getAdminSupabase();
        const { data, error } = await sb.from("game_config").select("config").eq("id", 1).maybeSingle();
        if (error) throw error;
        return NextResponse.json(mergeGameConfig(data?.config));
    } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : "Hata" }, { status: 500 });
    }
}

// ── PATCH: ayarları güncelle (doğrulanıp normalize edilerek yazılır) ──
export async function PATCH(req: NextRequest) {
    const guard = await adminGuard(req, "game");
    if (guard) return guard;
    try {
        const body = await req.json();
        const config = mergeGameConfig(body); // geçersiz alanlar varsayılana çekilir
        const sb = getAdminSupabase();
        const { error } = await sb
            .from("game_config")
            .upsert({ id: 1, config, updated_at: new Date().toISOString() });
        if (error) throw error;
        return NextResponse.json({ success: true, config });
    } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : "Hata" }, { status: 500 });
    }
}
