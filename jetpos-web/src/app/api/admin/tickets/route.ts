import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { adminGuard } from "@/lib/adminAuth";

function getAdminSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(url, serviceKey);
}

export async function GET(req: NextRequest) {
    const guard = await adminGuard(req, "tickets");
    if (guard) return guard;
    try {
        const sb = getAdminSupabase();
        const { data, error } = await sb.from("support_tickets").select("*, tenants(company_name)").order("created_at", { ascending: false });
        if (error) throw error;
        return NextResponse.json(data);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PATCH(req: NextRequest) {
    const guard = await adminGuard(req, "tickets");
    if (guard) return guard;
    const id = req.nextUrl.searchParams.get("id");
    try {
        const body = await req.json();
        const sb = getAdminSupabase();
        const { data, error } = await sb.from("support_tickets").update(body).eq("id", id).select().single();
        if (error) throw error;
        return NextResponse.json(data);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
