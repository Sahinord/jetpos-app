import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyTenantAccess } from "@/lib/server-tenant-auth";
import { getGetirCarsiSettings, resolveGetirCarsiConfig } from "@/lib/getir-carsi/creds";
import { GetirCarsiClient } from "@/lib/getir-carsi/getir-carsi-client";

// Getir Çarşı — mağazadaki ürünleri (Getir kataloğu) + mevcut JetPos eşlemelerini döndürür.
// Eşleştirme ekranı bunu kullanır: soldaki Getir ürünleri, sağdaki JetPos ürünü seçimi.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Getir ürün objesini normalize et (alan adları mağaza tipine göre değişebilir).
function normalize(p: any): { getirId: string; name: string; price: number | null; barcode: string | null; status: string | null } {
    const getirId = String(p?.getirId || p?.id || p?.productId || p?.product?.id || "");
    const name = String(p?.name || p?.productName || p?.product?.name || p?.displayName || "İsimsiz ürün");
    const priceRaw = p?.price ?? p?.sellingPrice ?? p?.product?.price ?? null;
    const price = priceRaw == null ? null : Number(priceRaw);
    const barcode = p?.barcode || p?.barcodeNumber || p?.product?.barcode || null;
    const status = p?.status || p?.state || (typeof p?.isActive === "boolean" ? (p.isActive ? "active" : "passive") : null);
    return { getirId, name, price, barcode: barcode ? String(barcode) : null, status: status ? String(status) : null };
}

export async function GET(req: NextRequest) {
    const auth = await verifyTenantAccess(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const settings = await getGetirCarsiSettings(auth.tenantId);
    const cfg = resolveGetirCarsiConfig(settings);
    if (!cfg) return NextResponse.json({ error: "Getir Çarşı ayarlı/aktif değil." }, { status: 400 });

    let getirProducts: ReturnType<typeof normalize>[] = [];
    try {
        const client = new GetirCarsiClient(cfg);
        const raw = await client.getShopProducts();
        getirProducts = (Array.isArray(raw) ? raw : []).map(normalize).filter(p => p.getirId);
    } catch (e: any) {
        return NextResponse.json({ error: `Getir ürünleri çekilemedi: ${e?.message || "hata"}` }, { status: 502 });
    }

    // Mevcut eşlemeler
    const { data: maps } = await supabaseAdmin
        .from("getir_carsi_product_map")
        .select("product_id, getir_id, max_cell_count, active")
        .eq("tenant_id", auth.tenantId);

    return NextResponse.json({
        success: true,
        getirProducts,
        maps: maps || [],
        count: getirProducts.length,
    });
}
