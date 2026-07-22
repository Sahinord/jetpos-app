import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, hasServiceRoleKey } from "@/lib/supabase-admin";
import { verifyTenantAccess } from "@/lib/server-tenant-auth";

const SERVICE_KEY_MISSING_MSG =
    "Sunucuda SUPABASE_SERVICE_ROLE_KEY tanımlı değil (Vercel env). Bu yüzden kaydedilemiyor. Deployment ortam değişkenlerine ekleyip yeniden deploy edin.";

// İşletmenin KENDİ Ödeal ayarını kaydetmesi (JetEntegre > Ödeal > Ayarlar).
// verifyTenantAccess ile caller yalnızca KENDİ tenant'ını günceller; service-role
// ile yazılır (anon client RLS'e takılıp sessizce 0 satır güncelliyordu).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const str = (v: unknown, max = 300) => String(v ?? "").slice(0, max);

export async function POST(req: NextRequest) {

    const auth = await verifyTenantAccess(req);
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // service-role key yoksa supabaseAdmin "Invalid API key" döner → önden net hata
    if (!hasServiceRoleKey) {
        return NextResponse.json({ error: SERVICE_KEY_MISSING_MSG }, { status: 500 });
    }

    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }

    const odeal = {
        publicKey: str(body.publicKey), secretKey: str(body.secretKey),
        username: str(body.username), password: str(body.password),
        terminalSerial: str(body.terminalSerial), paxId: str(body.paxId), vkn: str(body.vkn),
        externalDeviceKey: str(body.externalDeviceKey), baseUrl: str(body.baseUrl),
        environment: body.environment === "prod" ? "prod" : "stage",
        active: body.active === true,
    };

    const mapDbError = (m: string) =>
        /invalid api key/i.test(m) ? SERVICE_KEY_MISSING_MSG : m;

    // Mevcut settings'i al, odeal'i birleştir (diğer entegrasyonları ezmesin)
    const { data: t, error: readErr } = await supabaseAdmin
        .from("tenants").select("settings").eq("id", auth.tenantId).maybeSingle();
    if (readErr) {
        return NextResponse.json({ error: mapDbError(readErr.message) }, { status: 500 });
    }

    const current = (t?.settings as Record<string, unknown>) || {};
    const { error } = await supabaseAdmin
        .from("tenants")
        .update({ settings: { ...current, odeal } })
        .eq("id", auth.tenantId);
    if (error) {
        return NextResponse.json({ error: mapDbError(error.message) }, { status: 500 });
    }

    return NextResponse.json({ success: true, odeal });
}
