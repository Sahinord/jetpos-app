import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(url, serviceKey);
}

function checkAdminAuth(req: NextRequest) {
    const token = req.headers.get("x-admin-token");
    return token === (process.env.ADMIN_SECRET_TOKEN || process.env.NEXT_PUBLIC_ADMIN_PASSWORD);
}

export async function GET(req: NextRequest) {
    if (!checkAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        const sb = getAdminSupabase();
        const { data, error } = await sb.from("support_tickets").select("*, tenants(company_name)").order("created_at", { ascending: false });
        if (error) throw error;
        return NextResponse.json(data);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PATCH(req: NextRequest) {
    if (!checkAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = req.nextUrl.searchParams.get("id");
    try {
        const body = await req.json();
        const sb = getAdminSupabase();
        const { data, error } = await sb.from("support_tickets").update(body).eq("id", id).select().single();
        if (error) throw error;
        return NextResponse.json(data);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
