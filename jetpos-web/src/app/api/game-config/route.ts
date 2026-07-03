import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_GAME_CONFIG, mergeGameConfig } from "@/lib/game-config";

export const dynamic = "force-dynamic";

// Public: oyunun kullandığı ayarlar (hassas veri içermez).
// DB yoksa/boşsa koddaki varsayılanlar döner.
export async function GET() {
    try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
        if (!url || !serviceKey) return NextResponse.json(DEFAULT_GAME_CONFIG);

        const sb = createClient(url, serviceKey);
        const { data, error } = await sb.from("game_config").select("config").eq("id", 1).maybeSingle();
        if (error) throw error;
        return NextResponse.json(mergeGameConfig(data?.config));
    } catch {
        return NextResponse.json(DEFAULT_GAME_CONFIG);
    }
}
