import { NextRequest, NextResponse } from "next/server";
import { verifyTenantAccess } from "@/lib/server-tenant-auth";
import { adminClient, hasServiceKey } from "@/lib/odeal";

/**
 * Ödeme sonucu sorgusu — YEDEK yol.
 *
 * Asıl yol Supabase Broadcast (webhook düşer düşmez masaüstü tarafı
 * `odeal-tx-<referans>` kanalına yayın yapar, mobil anında görür).
 * Bu uç yalnızca yayın gelmezse devreye giren güvenlik ağıdır; bu yüzden
 * mobil tarafta seyrek aralıklarla çağrılır.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: Promise<{ reference: string }> }) {
    const auth = await verifyTenantAccess(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    if (!hasServiceKey) {
        return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
    }

    const { reference } = await ctx.params;
    const { data, error } = await adminClient()
        .from("odeal_transactions")
        .select("reference_code, status, amount, payment_method, payment_ref_code, einvoice_no, updated_at")
        .eq("tenant_id", auth.tenantId)
        .eq("reference_code", reference)
        .maybeSingle();

    if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
    if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(data);
}
