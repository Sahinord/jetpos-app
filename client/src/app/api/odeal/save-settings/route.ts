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
    // ═══ [ODEAL DEBUG] geçici hata ayıklama logları (şimdilik) ═══
    console.log("[ODEAL DEBUG] /save-settings çağrıldı", {
        tenant: req.headers.get("x-tenant-id"),
        keyLen: (req.headers.get("x-license-key") || "").length,
    });

    const auth = await verifyTenantAccess(req);
    if (!auth.ok) {
        console.warn("[ODEAL DEBUG] /save-settings auth REDDEDİLDİ", { status: auth.status, error: auth.error });
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    console.log("[ODEAL DEBUG] /save-settings auth OK", { tenantId: auth.tenantId });

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
    if (error) {
        console.warn("[ODEAL DEBUG] /save-settings DB güncelleme HATASI", { error: error.message });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("[ODEAL DEBUG] /save-settings KAYDEDİLDİ", {
        tenantId: auth.tenantId,
        active: odeal.active,
        hasPublic: !!odeal.publicKey,
        hasSecret: !!odeal.secretKey,
        externalDeviceKey: odeal.externalDeviceKey || "(yok)",
        paxId: odeal.paxId || "(yok)",
        environment: odeal.environment,
    });
    return NextResponse.json({ success: true, odeal });
}
