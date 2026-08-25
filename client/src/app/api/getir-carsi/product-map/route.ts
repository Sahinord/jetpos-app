import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyTenantAccess } from "@/lib/server-tenant-auth";

// Getir Çarşı — JetPos ürünü ↔ Getir getirId eşlemesi yönetimi.
//   POST   { getirId, productId, maxCellCount? }  → tek eşleme upsert
//   POST   { items: [{ getirId, productId, maxCellCount? }] } → toplu upsert
//   DELETE ?getirId=..  veya  ?productId=..  → eşlemeyi sil
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const auth = await verifyTenantAccess(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    let body: any;
    try { body = await req.json(); } catch { body = {}; }

    const raw: any[] = Array.isArray(body.items) ? body.items : [body];
    const rows = raw
        .filter(it => it && it.getirId && it.productId)
        .map(it => ({
            tenant_id: auth.tenantId,
            product_id: String(it.productId),
            getir_id: String(it.getirId),
            max_cell_count: it.maxCellCount != null && Number(it.maxCellCount) > 0 ? Math.floor(Number(it.maxCellCount)) : null,
            active: it.active === false ? false : true,
            updated_at: new Date().toISOString(),
        }));

    if (rows.length === 0) return NextResponse.json({ error: "getirId ve productId zorunlu." }, { status: 400 });

    // Aynı getir_id başka ürüne bağlıysa çakışmayı önlemek için önce o getir_id'leri temizle.
    const getirIds = rows.map(r => r.getir_id);
    await supabaseAdmin.from("getir_carsi_product_map")
        .delete().eq("tenant_id", auth.tenantId).in("getir_id", getirIds);

    const { error } = await supabaseAdmin
        .from("getir_carsi_product_map")
        .upsert(rows, { onConflict: "tenant_id,product_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, saved: rows.length });
}

export async function DELETE(req: NextRequest) {
    const auth = await verifyTenantAccess(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(req.url);
    const getirId = searchParams.get("getirId");
    const productId = searchParams.get("productId");
    if (!getirId && !productId) return NextResponse.json({ error: "getirId veya productId gerekli." }, { status: 400 });

    let q = supabaseAdmin.from("getir_carsi_product_map").delete().eq("tenant_id", auth.tenantId);
    q = getirId ? q.eq("getir_id", getirId) : q.eq("product_id", productId!);
    const { error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
}
