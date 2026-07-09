import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyTenantAccess } from "@/lib/server-tenant-auth";

// İşletmenin KENDİ Ödeal ayarını kaydetmesi (JetEntegre > Ödeal > Ayarlar).
// verifyTenantAccess ile caller yalnızca KENDİ tenant'ını günceller; service-role
// ile yazılır (anon client RLS'e takılıp sessizce 0 satır güncelliyordu).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const str = (v: unknown, max = 300) => String(v ?? "").slice(0, max);

export async function POST(req: NextRequest) {
    const auth = await verifyTenantAccess(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

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

    // Mevcut settings'i al, odeal'i birleştir (diğer entegrasyonları ezmesin)
    const { data: t, error: readErr } = await supabaseAdmin
        .from("tenants").select("settings").eq("id", auth.tenantId).maybeSingle();
    if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });

    const current = (t?.settings as Record<string, unknown>) || {};
    const { error } = await supabaseAdmin
        .from("tenants")
        .update({ settings: { ...current, odeal } })
        .eq("id", auth.tenantId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, odeal });
}
