import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "@/lib/adminAuth";

// Ödeal LEAD gönderimi (jetpos-web admin). adminGuard ile korunur (owner/admin serbest,
// staff için 'leads' izni). Lead partner (JetPos) anahtarıyla gönderilir — env'de:
//   ODEAL_LEAD_USERNAME, ODEAL_LEAD_PASSWORD, ODEAL_LEAD_ENV (stage|prod), [ODEAL_LEAD_BASE_URL]
// Doküman: docs.odeal.com/lead/tr — Basic Auth, POST /lead.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function leadBaseUrl(): string {
    const explicit = process.env.ODEAL_LEAD_BASE_URL;
    if (explicit) return explicit.replace(/\/+$/, "");
    const prod = (process.env.ODEAL_LEAD_ENV || "stage").toLowerCase() === "prod";
    return prod
        ? "https://apigw.odeal.com/lead/v1"
        : "https://stage.odealapp.com/lead-api/v1";
}

function normalizeMobile(m: string): string {
    let d = String(m || "").replace(/\D/g, "");
    if (d.startsWith("90")) d = d.slice(2);
    if (d.startsWith("0")) d = d.slice(1);
    return d.slice(-10);
}

export async function POST(req: NextRequest) {
    const denied = await adminGuard(req, "leads");
    if (denied) return denied;

    const user = process.env.ODEAL_LEAD_USERNAME;
    const pass = process.env.ODEAL_LEAD_PASSWORD;
    if (!user || !pass) {
        return NextResponse.json({
            error: "Ödeal Lead API kimlik bilgileri sunucuda tanımlı değil (ODEAL_LEAD_USERNAME / ODEAL_LEAD_PASSWORD).",
        }, { status: 400 });
    }

    let body: any;
    try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }

    const mobile = normalizeMobile(String(body?.mobile || ""));
    if (!mobile) return NextResponse.json({ error: "Telefon (mobile) zorunludur." }, { status: 400 });

    const optionalFields: Record<string, string> = {};
    const of = (body?.optionalFields && typeof body.optionalFields === "object") ? body.optionalFields : {};
    for (const k of Object.keys(of)) {
        const v = of[k];
        if (v !== undefined && v !== null && String(v).trim() !== "") optionalFields[String(k)] = String(v).trim();
    }

    const payload: Record<string, unknown> = { mobile };
    if (body?.firstName?.trim()) payload.firstName = body.firstName.trim();
    if (body?.lastName?.trim()) payload.lastName = body.lastName.trim();
    if (body?.owner?.trim()) payload.owner = body.owner.trim();
    if (Object.keys(optionalFields).length > 0) payload.optionalFields = optionalFields;

    const authHeader = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
    try {
        const res = await fetch(`${leadBaseUrl()}/lead`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: authHeader },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(15000),
        });
        const text = await res.text();
        let json: any = null;
        try { json = text ? JSON.parse(text) : null; } catch { /* text kalır */ }
        const registerRefCode = json?.data?.registerRefCode;
        const ok = res.ok && json?.status !== false && !!registerRefCode;
        if (!ok) {
            return NextResponse.json({
                error: json?.message || "Lead gönderilemedi",
                errors: Array.isArray(json?.errors) ? json.errors : undefined,
                status: res.status,
            }, { status: 502 });
        }
        return NextResponse.json({ success: true, registerRefCode });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || "Lead gönderim hatası" }, { status: 500 });
    }
}
