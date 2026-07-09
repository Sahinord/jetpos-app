import { NextRequest, NextResponse } from "next/server";
import { verifyTenantAccess } from "@/lib/server-tenant-auth";
import { getTenantOdealCreds } from "@/lib/odeal/odeal-auth";
import { saveConfiguration } from "@/lib/odeal/odeal-client";

// Kurulumda BİR KERE çağrılır: Ödeal'e callback URL'lerini kaydeder.
// Callback URL'leri bu uygulamanın public adresine (Vercel) işaret eder.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const auth = await verifyTenantAccess(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const creds = await getTenantOdealCreds(auth.tenantId);
    if (!creds || !creds.active) {
        return NextResponse.json({ error: "Ödeal entegrasyonu tanımlı/aktif değil." }, { status: 400 });
    }

    // Public taban: env varsa onu, yoksa isteğin origin'ini kullan
    const base = (process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin).replace(/\/+$/, "");

    const result = await saveConfiguration(creds, {
        paymentSucceededUrl: `${base}/api/odeal/payment-succeeded`,
        paymentFailedUrl: `${base}/api/odeal/payment-failed`,
        paymentCancelledUrl: `${base}/api/odeal/payment-cancelled`,
        eInvoiceCreatedUrl: `${base}/api/odeal/e-invoice-created`,
    });

    if (!result.ok) {
        return NextResponse.json({ error: "Konfigürasyon kaydedilemedi.", detail: result.body }, { status: 502 });
    }
    return NextResponse.json({ success: true, registeredBase: base });
}
