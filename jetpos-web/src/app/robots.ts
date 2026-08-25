import type { MetadataRoute } from "next";

// Arama motoru tarama kuralları. Özel/işlevsel alanlar taramaya kapalı.
const BASE = "https://jetpos.shop";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/admin", "/portal", "/api/", "/qr/"],
            },
        ],
        sitemap: `${BASE}/sitemap.xml`,
        host: BASE,
    };
}
