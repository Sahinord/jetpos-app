import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { adminGuard } from "@/lib/adminAuth";

function getAdminSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!url || !serviceKey) throw new Error("Supabase env vars missing");
    return createClient(url, serviceKey);
}

// ── GET: jetpos.shop "çok yakında" sayfasından gelen erken erişim kayıtları ──
export async function GET(req: NextRequest) {
    const guard = adminGuard(req);
    if (guard) return guard;
    try {
        const sb = getAdminSupabase();
        const { data, error } = await sb
            .from("early_access_signups")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) throw error;
        return NextResponse.json(data);
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Bilinmeyen hata";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
