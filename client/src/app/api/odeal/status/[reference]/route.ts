import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyTenantAccess } from "@/lib/server-tenant-auth";

// POS, ödeme sonucunu buradan poll eder (webhook düşene kadar).
// GET /api/odeal/status/<referenceCode>
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: Promise<{ reference: string }> }) {
    const auth = await verifyTenantAccess(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { reference } = await ctx.params;
    const { data, error } = await supabaseAdmin
        .from("odeal_transactions")
        .select("reference_code, status, amount, payment_method, payment_ref_code, einvoice_no, updated_at")
        .eq("tenant_id", auth.tenantId)
        .eq("reference_code", reference)
        .maybeSingle();

    if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
    if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(data);
}
