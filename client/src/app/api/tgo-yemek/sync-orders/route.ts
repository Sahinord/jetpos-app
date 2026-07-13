import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyTenantAccess } from "@/lib/server-tenant-auth";
import { getTgoYemekSettings, resolveConnections, type YemekChannel } from "@/lib/tgo-yemek/creds";
import { TgoYemekClient, type TgoYemekPackage } from "@/lib/tgo-yemek/tgo-yemek-client";

// Yemek — sipariş çekme (polling). Trendyol Go · Uber Eats tek bağlantıdan gelir;
// marka (Uber Eats / Trendyol Yemek) sipariş kaynağından etiketlenir. Getir ayrı bağlantı.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const clean = (v: unknown, max = 200) => String(v ?? "").replace(/[<>]/g, "").slice(0, max).trim();

function customerName(p: TgoYemekPackage): string {
    const c = p.customer || {};
    return clean(c.name || `${c.firstName || ""} ${c.lastName || ""}`.trim() || "Müşteri", 120);
}

// ⚠️ TEYİT EDİLECEK — sipariş kaynağı alan adı doc'tan doğrulanacak (JS-render).
// TGO bağlantısında Uber Eats mi Trendyol Yemek mi olduğunu siparişten okumaya çalışırız.
function brandLabel(p: TgoYemekPackage, channel: YemekChannel): string {
    if (channel === "getir") return "Getir Yemek";
    const raw = String(
        (p as any).source ?? (p as any).channel ?? (p as any).marketPlace ??
        (p as any).orderSource ?? (p as any).deliveryProvider ?? ""
    ).toLowerCase();
    if (raw.includes("uber")) return "Uber Eats";
    if (raw.includes("trendyol") || raw.includes("tgo")) return "Trendyol Yemek";
    return "Trendyol · Uber Eats";
}

export async function POST(req: NextRequest) {
    const auth = await verifyTenantAccess(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const settings = await getTgoYemekSettings(auth.tenantId);
    if (!settings || settings.active === false) {
        return NextResponse.json({ error: "Yemek entegrasyonu ayarlı/aktif değil." }, { status: 400 });
    }
    const conns = resolveConnections(settings);
    if (conns.length === 0) {
        return NextResponse.json({ error: "Aktif bağlantı yok. SuperAdmin > YEMEK'ten Trendyol Go·Uber Eats ve/veya Getir bilgilerini girin." }, { status: 400 });
    }

    const end = new Date();
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);

    const newOrders: Array<{ id: string; brand: string; orderNumber: string; customer: string; total: number }> = [];
    const errors: Array<{ channel: string; error: string }> = [];
    let fetched = 0;

    for (const conn of conns) {
        try {
            const client = new TgoYemekClient(conn.config);
            const packages = await client.getPackages(start, end);
            fetched += packages.length;
            if (packages.length === 0) continue;

            const ids = packages.map(p => String(p.id)).filter(Boolean);
            const { data: existing } = await supabaseAdmin
                .from("tgo_yemek_orders")
                .select("tgo_order_id")
                .eq("tenant_id", auth.tenantId)
                .in("tgo_order_id", ids);
            const known = new Set((existing || []).map(r => r.tgo_order_id));

            const rows = packages
                .filter(p => !known.has(String(p.id)))
                .map(p => {
                    const oid = String(p.id);
                    const total = Number(p.totalPrice) || 0;
                    const orderNumber = clean(p.orderNumber || oid, 40);
                    const brand = brandLabel(p, conn.channel);
                    newOrders.push({ id: oid, brand, orderNumber, customer: customerName(p), total });
                    return {
                        tenant_id: auth.tenantId,
                        channel: conn.channel,
                        store_id: conn.config.storeId || conn.channel,
                        store_name: brand,           // marka etiketi (widget bununla gruplar/filtreler)
                        tgo_order_id: oid,
                        package_id: oid,
                        order_number: orderNumber,
                        customer_name: customerName(p),
                        total_price: total,
                        tgo_status: clean(p.packageStatus, 40),
                        delivery_type: clean((p as any).deliveryType, 40),
                        items: (p.lines as unknown) ?? [],
                        raw_data: p as any,
                        status: "new",
                        is_cancelled: false,
                        updated_at: new Date().toISOString(),
                    };
                });

            if (rows.length > 0) {
                const { error } = await supabaseAdmin
                    .from("tgo_yemek_orders")
                    .upsert(rows, { onConflict: "tenant_id,tgo_order_id", ignoreDuplicates: true });
                if (error) errors.push({ channel: conn.channel, error: error.message });
            }
        } catch (e: any) {
            errors.push({ channel: conn.channel, error: e?.message || "bilinmeyen hata" });
        }
    }

    return NextResponse.json({
        success: true,
        fetched,
        newCount: newOrders.length,
        newOrders,
        errors,
    });
}
