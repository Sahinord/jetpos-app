import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyTenantAccess } from "@/lib/server-tenant-auth";
import { getGetirCarsiSettings, resolveGetirCarsiConfig, stockBufferOf } from "@/lib/getir-carsi/creds";
import { GetirCarsiClient, type GetirPriceQtyItem } from "@/lib/getir-carsi/getir-carsi-client";

// Getir Çarşı — Stok / Fiyat / Max satış adedi güncelleme.
// İki mod:
//   mode="manual" : body.products = [{ getirId, price, oldPrice?, quantity, maxCellCount? }]
//   mode="sync"   : getir_carsi_product_map + products'tan otomatik üretir
//                   (quantity = stok - stockBuffer, floor 0; price = sale_price)
// Bir istekte max 1000 ürün; fazlasında 1000'lik parçalara böler.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// oldPrice, price'tan BÜYÜK olmalı; değilse gösterme (null).
function sanitizeItem(it: GetirPriceQtyItem): GetirPriceQtyItem {
    const price = Math.max(0, Number(it.price) || 0);
    let oldPrice: number | null = it.oldPrice == null ? null : Number(it.oldPrice);
    if (oldPrice == null || !Number.isFinite(oldPrice) || oldPrice <= price) oldPrice = null;
    const quantity = Math.max(0, Math.floor(Number(it.quantity) || 0));
    // maxCellCount: integer, 0 gönderilmez → undefined bırak
    let maxCellCount: number | undefined = it.maxCellCount == null ? undefined : Math.floor(Number(it.maxCellCount));
    if (!maxCellCount || maxCellCount <= 0) maxCellCount = undefined;
    return { getirId: String(it.getirId), price, oldPrice, quantity, maxCellCount };
}

async function buildFromMap(tenantId: string, buffer: number): Promise<GetirPriceQtyItem[]> {
    // Aktif eşlemeleri çek
    const maps: Array<{ product_id: string; getir_id: string; max_cell_count: number | null }> = [];
    let from = 0;
    while (true) {
        const { data } = await supabaseAdmin
            .from("getir_carsi_product_map")
            .select("product_id, getir_id, max_cell_count")
            .eq("tenant_id", tenantId)
            .eq("active", true)
            .range(from, from + 999);
        if (!data || data.length === 0) break;
        maps.push(...data);
        if (data.length < 1000) break;
        from += 1000;
    }
    if (maps.length === 0) return [];

    // İlgili ürünleri çek (master stok = fiziksel ana mağaza)
    const pids = maps.map(m => m.product_id);
    const products = new Map<string, { stock_quantity: number; sale_price: number }>();
    for (let i = 0; i < pids.length; i += 500) {
        const slice = pids.slice(i, i + 500);
        const { data } = await supabaseAdmin
            .from("products")
            .select("id, stock_quantity, sale_price")
            .eq("tenant_id", tenantId)
            .in("id", slice);
        for (const p of data || []) products.set(p.id, { stock_quantity: Number(p.stock_quantity) || 0, sale_price: Number(p.sale_price) || 0 });
    }

    return maps
        .map(m => {
            const p = products.get(m.product_id);
            if (!p) return null;
            const qty = Math.max(0, Math.floor(p.stock_quantity - buffer)); // tampon uygula
            return sanitizeItem({
                getirId: m.getir_id,
                price: p.sale_price,
                oldPrice: null,
                quantity: qty,
                maxCellCount: m.max_cell_count || undefined,
            });
        })
        .filter((x): x is GetirPriceQtyItem => !!x && !!x.getirId);
}

export async function POST(req: NextRequest) {
    const auth = await verifyTenantAccess(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    let body: { mode?: string; products?: GetirPriceQtyItem[] };
    try { body = await req.json(); } catch { body = {}; }
    const mode = body.mode === "sync" ? "sync" : "manual";

    const settings = await getGetirCarsiSettings(auth.tenantId);
    const cfg = resolveGetirCarsiConfig(settings);
    if (!cfg) return NextResponse.json({ error: "Getir Çarşı ayarlı/aktif değil." }, { status: 400 });

    let items: GetirPriceQtyItem[] = [];
    if (mode === "sync") {
        items = await buildFromMap(auth.tenantId, stockBufferOf(settings));
        if (items.length === 0) {
            return NextResponse.json({ error: "Eşlenmiş ürün yok. Önce Ürün Eşleştirme'den JetPos ürünlerini getirId ile eşleyin." }, { status: 400 });
        }
    } else {
        const raw = Array.isArray(body.products) ? body.products : [];
        items = raw.map(sanitizeItem).filter(x => x.getirId);
        if (items.length === 0) return NextResponse.json({ error: "Gönderilecek ürün yok (products boş)." }, { status: 400 });
    }

    const client = new GetirCarsiClient(cfg);
    const batches: string[] = [];
    const errors: string[] = [];
    for (let i = 0; i < items.length; i += 1000) {
        const chunk = items.slice(i, i + 1000);
        try {
            const res = await client.pushPriceAndQuantity(chunk);
            const bId = res?.data?.batchRequestId || res?.batchRequestId;
            if (bId) batches.push(String(bId));
        } catch (e: any) {
            errors.push(e?.message || "hata");
        }
    }

    if (errors.length > 0 && batches.length === 0) {
        return NextResponse.json({ error: `Stok/fiyat gönderilemedi: ${errors[0]}`, errors }, { status: 502 });
    }
    return NextResponse.json({ success: true, sent: items.length, batchRequestIds: batches, errors });
}
