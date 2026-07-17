import { NextRequest, NextResponse } from "next/server";
import { verifyTenantAccess } from "@/lib/server-tenant-auth";
import { getTenantSettings } from "@/lib/tenant-settings";
import { TrendyolClient } from "@/lib/trendyol-client";

// Trendyol PAZARYERI (marketplace) siparişleri — GO'dan AYRI.
// api.trendyol.com/sapigw üzerinden, tenant'ın settings.trendyol creds'i ile.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const auth = await verifyTenantAccess(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    let body: { days?: number } = {};
    try { body = await req.json(); } catch { /* boş */ }
    const days = Math.min(Math.max(Number(body.days) || 14, 1), 90);

    const settings = await getTenantSettings(auth.tenantId);
    const t = (settings as any)?.trendyol || {};
    if (!t.supplierId || !t.apiKey || !t.apiSecret) {
        return NextResponse.json({
            error: "Trendyol Pazaryeri ayarı yok. SuperAdmin > işletme > Trendyol Pazaryeri'den Supplier ID / API Key / Secret girin.",
        }, { status: 400 });
    }

    try {
        const client = new TrendyolClient({ supplierId: String(t.supplierId), apiKey: String(t.apiKey), apiSecret: String(t.apiSecret) });
        const end = new Date();
        const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
        const orders = await client.getOrders(start, end, "Created,Picking,Invoiced,Shipped,Delivered,Cancelled");

        const revenue = orders.reduce(
            (s, o) => s + (o.lines || []).reduce((ls, l) => ls + (Number(l.price) || 0) * (Number(l.quantity) || 0), 0),
            0
        );
        return NextResponse.json({ success: true, count: orders.length, revenue, orders: orders.slice(0, 200) });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || "Trendyol Pazaryeri siparişleri alınamadı" }, { status: 502 });
    }
}
