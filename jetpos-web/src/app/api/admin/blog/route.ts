import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ── Server-side admin auth helper ────────────────────────────────
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

// ── GET: Tüm blog yazıları (admin, yayınlanmamışlar dahil) ────────
export async function GET(req: NextRequest) {
    if (!checkAdminAuth(req)) return unauthorized();
    try {
        const sb = getAdminSupabase();
        const { data, error } = await sb
            .from("blog_posts")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) throw error;
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// ── POST: Yeni blog yazısı ────────────────────────────────────────
export async function POST(req: NextRequest) {
    if (!checkAdminAuth(req)) return unauthorized();
    try {
        const body = await req.json();
        if (!body.title || !body.slug) {
            return NextResponse.json({ error: "title ve slug zorunlu" }, { status: 400 });
        }
        const sb = getAdminSupabase();
        const { data, error } = await sb
            .from("blog_posts")
            .insert([{ ...body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }])
            .select()
            .single();
        if (error) throw error;
        return NextResponse.json(data, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// ── PATCH: Blog yazısı güncelle (id query param) ─────────────────
export async function PATCH(req: NextRequest) {
    if (!checkAdminAuth(req)) return unauthorized();
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id zorunlu" }, { status: 400 });
    try {
        const body = await req.json();
        const sb = getAdminSupabase();
        const { error } = await sb
            .from("blog_posts")
            .update({ ...body, updated_at: new Date().toISOString() })
            .eq("id", id);
        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// ── DELETE: Blog yazısı sil (id query param) ─────────────────────
export async function DELETE(req: NextRequest) {
    if (!checkAdminAuth(req)) return unauthorized();
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id zorunlu" }, { status: 400 });
    try {
        const sb = getAdminSupabase();
        const { error } = await sb.from("blog_posts").delete().eq("id", id);
        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
