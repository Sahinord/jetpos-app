import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * LİSANSSIZ PERSONEL GİRİŞİ — garson/mutfak için.
 *
 * Personel gizli lisansı GİRMEZ. Bunun yerine:
 *   1. İşletme Kodu (staff_code)  → hangi işletme (paylaşılabilir, iptal edilebilir)
 *   2. PIN                        → hangi personel + kimlik kanıtı
 *
 * GÜVENLİK: İkisi BİRLİKTE zorunlu. Sızmış işletme kodu TEK BAŞINA cihaz
 * bağlayamaz — geçerli bir personel PIN'i de gerekir. Her ikisi de hız
 * sınırlıdır. Doğrulama sonrası cihaza tenant erişimi (RLS için) verilir
 * (device provisioning). Bkz. PATRON_PERSONEL_PLANI.md §1.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://grlwmcuxobbgubphovhd.supabase.co";

function admin() {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    return createClient(SUPA_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function ip(req: NextRequest): string {
    return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

const mem = new Map<string, { c: number; t: number }>();
function limited(k: string, max = 10, windowMs = 60_000): boolean {
    const now = Date.now();
    const h = mem.get(k);
    if (!h || now - h.t > windowMs) { mem.set(k, { c: 1, t: now }); return false; }
    h.c += 1;
    return h.c > max;
}

export async function POST(req: NextRequest) {
    if (limited(ip(req))) {
        return NextResponse.json({ error: "Çok fazla deneme. Lütfen bekleyin." }, { status: 429 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
    }

    let body: { staffCode?: string; pin?: string; tenantId?: string };
    try { body = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 }); }

    const pin = String(body.pin || "");
    if (!pin || pin.length > 12) return NextResponse.json({ error: "Geçersiz PIN." }, { status: 400 });

    const db = admin();

    // Tenant'ı çöz: cihaz zaten bağlıysa tenantId gelir; değilse işletme koduyla.
    let tenantId = String(body.tenantId || "");
    let companyName = "";
    let features: any = null;

    if (!tenantId) {
        const code = String(body.staffCode || "").trim().toUpperCase();
        if (!code) return NextResponse.json({ error: "İşletme kodu gerekli." }, { status: 400 });
        const { data: resolved } = await db.rpc("get_tenant_by_staff_code", { p_code: code });
        if (!resolved?.success) {
            return NextResponse.json({ error: "İşletme kodu geçersiz." }, { status: 403 });
        }
        tenantId = resolved.tenant_id;
        companyName = resolved.company_name || "";
        features = resolved.features;
    }

    // PIN doğrula (bcrypt + kendi kilit koruması olan RPC)
    const { data: pinRes, error } = await db.rpc("verify_employee_pin", {
        p_tenant_id: tenantId,
        p_pin_code: pin,
    });
    if (error) return NextResponse.json({ error: "Doğrulama hatası." }, { status: 500 });
    if (!pinRes?.success) {
        return NextResponse.json({ error: pinRes?.message || "Geçersiz PIN", locked: pinRes?.locked === true }, { status: 403 });
    }

    // Cihazın RLS'li sorgular yapabilmesi için tenant erişimi (device provisioning).
    // Personel bunu GÖRMEZ/GİRMEZ — arka planda cihaza yazılır.
    const { data: t } = await db.from("tenants").select("license_key, company_name, features").eq("id", tenantId).maybeSingle();
    if (!t) return NextResponse.json({ error: "İşletme bulunamadı." }, { status: 404 });

    return NextResponse.json({
        success: true,
        tenantId,
        companyName: companyName || t.company_name || "",
        features: features ?? t.features ?? null,
        // provisioningKey = license_key: cihaz RLS header'ı için saklar, personel görmez
        provisioningKey: t.license_key,
        employee: pinRes.employee,
    });
}
