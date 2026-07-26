import { NextRequest, NextResponse } from "next/server";

// Host'a göre dinamik PWA manifest'i. Aynı kod, farklı alan adı → farklı
// uygulama kimliği (ikon/isim/başlangıç ekranı). Telefona "Ana ekrana ekle"
// dediğinde garson.jetpos.shop "JetGarson", mutfak "JetMutfak" olarak kurulur.
export const dynamic = "force-dynamic";

type RoleManifest = {
    name: string;
    short_name: string;
    start_url: string;
    id: string;
    theme_color: string;
};

function resolveRole(host: string): RoleManifest {
    const h = (host || "").toLowerCase();
    if (h.startsWith("garson."))
        return { name: "JetGarson — Adisyon", short_name: "JetGarson", start_url: "/adisyon", id: "/?app=garson", theme_color: "#f59e0b" };
    if (h.startsWith("mutfak."))
        return { name: "JetMutfak — Mutfak Ekranı", short_name: "JetMutfak", start_url: "/kds", id: "/?app=mutfak", theme_color: "#fb923c" };
    if (h.startsWith("patron."))
        return { name: "JetPatron — Patron Paneli", short_name: "JetPatron", start_url: "/patron", id: "/?app=patron", theme_color: "#f59e0b" };
    return { name: "JetPos Mobile", short_name: "JetPos", start_url: "/", id: "/?app=mobile", theme_color: "#2563eb" };
}

export async function GET(req: NextRequest) {
    const host = req.headers.get("host") || "";
    const r = resolveRole(host);

    const manifest = {
        name: r.name,
        short_name: r.short_name,
        id: r.id,
        description: "JetPos — İşiniz jet hızında",
        start_url: r.start_url,
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0f172a",
        theme_color: r.theme_color,
        icons: [
            { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
            { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
    };

    return NextResponse.json(manifest, {
        headers: {
            "Content-Type": "application/manifest+json",
            "Cache-Control": "no-store",
        },
    });
}
