import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Çalışan PIN doğrulama — hız sınırlı sunucu ucu.
 *
 * verify_employee_pin RPC'sinin kendi kaba kuvvet koruması var (bcrypt + 5dk
 * kilit), ama doğrudan RPC'nin anon izni açık olduğu için buradan geçiriyoruz;
 * böylece lisans akışıyla aynı IP bazlı ek kilit de devrede olur ve ileride
 * anon izni kaldırılabilir.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://grlwmcuxobbgubphovhd.supabase.co";

function client() {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    return createClient(SUPA_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function ip(req: NextRequest): string {
    return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

const mem = new Map<string, { c: number; t: number }>();
function memLimited(k: string, max = 12, windowMs = 60_000): boolean {
    const now = Date.now();
    const h = mem.get(k);
    if (!h || now - h.t > windowMs) { mem.set(k, { c: 1, t: now }); return false; }
    h.c += 1;
    return h.c > max;
}

export async function POST(req: NextRequest) {
    const who = ip(req);
    if (memLimited(who)) {
        return NextResponse.json({ error: "Çok fazla deneme. Lütfen bekleyin." }, { status: 429 });
    }

    // Tenant kimliği: PIN girişi lisanslı cihazdan yapılır (x-tenant-id header'ı
    // apiFetch ile eklenir); tenant'ı body'den DEĞİL header'dan alıyoruz.
    const tenantId = req.headers.get("x-tenant-id") || "";
    const licenseKey = req.headers.get("x-license-key") || "";
    if (!tenantId || !licenseKey) {
        return NextResponse.json({ error: "Cihaz kimliği eksik." }, { status: 401 });
    }

    let body: { pin?: string };
    try { body = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 }); }
    const pin = String(body.pin || "");
    if (!pin || pin.length > 12) return NextResponse.json({ error: "Geçersiz PIN." }, { status: 400 });

    const db = client();

    // Cihaz gerçekten bu tenant'a mı ait? (header taklidini ele)
    const { data: t } = await db.from("tenants").select("id").eq("id", tenantId).eq("license_key", licenseKey).maybeSingle();
    if (!t) return NextResponse.json({ error: "Geçersiz cihaz kimliği." }, { status: 403 });

    const { data, error } = await db.rpc("verify_employee_pin", { p_tenant_id: tenantId, p_pin_code: pin });
    if (error) return NextResponse.json({ error: "Doğrulama hatası." }, { status: 500 });

    if (!data?.success) {
        return NextResponse.json({ error: data?.message || "Geçersiz PIN", locked: data?.locked === true }, { status: 403 });
    }
    // employee: { id, name, position, role, permissions }
    return NextResponse.json({ success: true, employee: data.employee });
}
