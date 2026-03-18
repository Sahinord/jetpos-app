import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!url || !serviceKey) throw new Error("Supabase env vars missing");
    return createClient(url, serviceKey);
}

function checkAdminAuth(req: NextRequest): boolean {
    const token = req.headers.get("x-admin-token");
    const expected = process.env.ADMIN_SECRET_TOKEN || process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    return !!token && token === expected;
}

function unauthorized() {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
}

// ── GET: Hakkımızda içeriği ───────────────────────────────────────
export async function GET(req: NextRequest) {
    if (!checkAdminAuth(req)) return unauthorized();
    try {
        const sb = getAdminSupabase();
        const { data, error } = await sb.from("about_content").select("section,content");
        if (error) throw error;
        const map = Object.fromEntries((data || []).map((r: any) => [r.section, r.content]));
        return NextResponse.json(map);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// ── PATCH: Section güncelle ───────────────────────────────────────
export async function PATCH(req: NextRequest) {
    if (!checkAdminAuth(req)) return unauthorized();
    const section = req.nextUrl.searchParams.get("section");
    if (!section) return NextResponse.json({ error: "section zorunlu" }, { status: 400 });
    try {
        const content = await req.json();
        const sb = getAdminSupabase();
        const { error } = await sb
            .from("about_content")
            .update({ content, updated_at: new Date().toISOString() })
            .eq("section", section);
        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
