import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyTenantAccess } from "@/lib/server-tenant-auth";
import { getTenantOdealCreds } from "@/lib/odeal/odeal-auth";
import { getTransactionReport, statusFromReportRecord } from "@/lib/odeal/odeal-client";

// POS, ödeme sonucunu buradan poll eder.
// Önce DB'ye bakar (webhook doldurur). Hâlâ pending ise Ödeal İŞLEM RAPORU'ndan
// ÇEKEREK durumu öğrenir (callback kaçsa bile "Gönderiliyor"da takılmaz).
// GET /api/odeal/status/<referenceCode>
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ymd = (d: Date) => d.toISOString().slice(0, 10); // YYYY-MM-DD

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

    // Webhook zaten sonuçlandırmışsa direkt dön.
    if (data.status && data.status !== "pending") return NextResponse.json(data);

    // Hâlâ pending → Ödeal İşlem Raporu'ndan çek (callback kaçmış olabilir).
    try {
        const creds = await getTenantOdealCreds(auth.tenantId);
        if (creds?.active && creds.publicKey && creds.secretKey) {
            const now = new Date();
            const begin = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 gün geriye
            const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);        // yarına kadar
            const rep = await getTransactionReport(creds, { beginDate: ymd(begin), endDate: ymd(end), basketReferenceCode: reference });
            if (rep.ok) {
                const list: any[] = Array.isArray(rep.body)
                    ? rep.body
                    : ((rep.body as any)?.data || (rep.body as any)?.transactions || (rep.body as any)?.content || (rep.body as any)?.result || []);
                const rec = (Array.isArray(list) ? list : []).find((r: any) => {
                    const rc = r?.basketReferenceCode || r?.referenceCode || r?.basketRefCode;
                    return String(rc || "") === reference;
                }) || (list.length === 1 ? list[0] : null);
                if (rec) {
                    const resolved = statusFromReportRecord(rec);
                    if (resolved !== "pending") {
                        // DB'yi güncelle (idempotent) ve realtime yayınla → POS anında yakalar.
                        await supabaseAdmin.from("odeal_transactions")
                            .update({ status: resolved, result: rec, updated_at: new Date().toISOString() })
                            .eq("tenant_id", auth.tenantId).eq("reference_code", reference).eq("status", "pending");
                        try {
                            const ch = supabaseAdmin.channel(`odeal-tx-${reference}`);
                            await ch.send({ type: "broadcast", event: "status", payload: { status: resolved } });
                            supabaseAdmin.removeChannel(ch);
                        } catch { /* yayın şart değil */ }
                        return NextResponse.json({ ...data, status: resolved, source: "report" });
                    }
                }
            }
        }
    } catch { /* rapor çekilemedi → pending dön, poll tekrar dener */ }

    return NextResponse.json(data);
}
