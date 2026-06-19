import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { adminGuard } from "@/lib/adminAuth";

function getAdminSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(url, serviceKey);
}

export async function GET(req: NextRequest) {
    const guard = adminGuard(req);
    if (guard) return guard;
    try {
        const sb = getAdminSupabase();
        const { data, error } = await sb.from("notifications").select("*").is("tenant_id", null).order("created_at", { ascending: false });
        if (error) throw error;
        return NextResponse.json(data);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
    const guard = adminGuard(req);
    if (guard) return guard;
    try {
        const body = await req.json();
        const sb = getAdminSupabase();
        const { data, error } = await sb.from("notifications").insert([{ ...body, tenant_id: null }]).select().single();
        if (error) throw error;
        return NextResponse.json(data);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
    const guard = adminGuard(req);
    if (guard) return guard;
    const id = req.nextUrl.searchParams.get("id");
    try {
        const sb = getAdminSupabase();
        const { error } = await sb.from("notifications").delete().eq("id", id);
        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
