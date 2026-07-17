import { NextRequest, NextResponse } from "next/server";
import { verifyTenantAccess } from "@/lib/server-tenant-auth";
import { submitLead, hasLeadCreds } from "@/lib/odeal/odeal-lead-client";

// Ödeal LEAD gönderimi — YALNIZCA admin (save-tenant ile aynı guard):
// geçerli tenant kimliği + x-license-key === ADMIN_SECRET_TOKEN.
// Lead partner (JetPos) anahtarıyla gönderilir; per-tenant değildir.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const auth = await verifyTenantAccess(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const licenseKey = req.headers.get("x-license-key");
    if (!process.env.ADMIN_SECRET_TOKEN || licenseKey !== process.env.ADMIN_SECRET_TOKEN) {
        return NextResponse.json({ error: "Yetkisiz erişim (yalnızca süper admin)" }, { status: 403 });
    }

    if (!hasLeadCreds()) {
        return NextResponse.json({
            error: "Ödeal Lead API kimlik bilgileri sunucuda tanımlı değil. Vercel env: ODEAL_LEAD_USERNAME, ODEAL_LEAD_PASSWORD (+ ODEAL_LEAD_ENV=stage|prod).",
        }, { status: 400 });
    }

    let body: any;
    try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }

    const mobile = String(body?.mobile || "").trim();
    if (!mobile) return NextResponse.json({ error: "Telefon (mobile) zorunludur." }, { status: 400 });

    // optionalFields: yalnızca dolu string değerleri geç
    const optionalFields: Record<string, string> = {};
    const of = (body?.optionalFields && typeof body.optionalFields === "object") ? body.optionalFields : {};
    for (const k of Object.keys(of)) {
        const v = of[k];
        if (v !== undefined && v !== null && String(v).trim() !== "") optionalFields[String(k)] = String(v).trim();
    }

    try {
        const r = await submitLead({
            mobile,
            firstName: body?.firstName?.trim() || undefined,
            lastName: body?.lastName?.trim() || undefined,
            tcNumber: body?.tcNumber?.trim() || undefined,
            taxNumber: body?.taxNumber?.trim() || undefined,
            owner: body?.owner?.trim() || undefined,
            optionalFields,
        });
        if (!r.ok) {
            return NextResponse.json({
                error: r.message || "Lead gönderilemedi",
                errors: r.errors,
                status: r.status,
            }, { status: 502 });
        }
        return NextResponse.json({ success: true, registerRefCode: r.registerRefCode });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || "Lead gönderim hatası" }, { status: 500 });
    }
}
