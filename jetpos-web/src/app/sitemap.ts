import type { MetadataRoute } from "next";

// JetPOS pazarlama sitesi site haritası. Google'ın tüm kamuya açık sayfaları
// düzgün taraması için. Admin/portal/qr gibi özel alanlar hariç tutulur.
const BASE = "https://jetpos.shop";

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date();
    const routes: Array<{ path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
        { path: "", priority: 1.0, freq: "weekly" },
        { path: "urunler/jetpos", priority: 0.9, freq: "monthly" },
        { path: "urunler/jetkds", priority: 0.8, freq: "monthly" },
        { path: "jetqr", priority: 0.8, freq: "monthly" },
        { path: "fiyatlandirma", priority: 0.9, freq: "weekly" },
        { path: "fiyatlandirma/ozellestir", priority: 0.7, freq: "monthly" },
        { path: "satin-al", priority: 0.8, freq: "monthly" },
        { path: "demo", priority: 0.8, freq: "monthly" },
        { path: "hakkimizda", priority: 0.6, freq: "yearly" },
        { path: "kurumsal", priority: 0.6, freq: "yearly" },
        { path: "iletisim", priority: 0.6, freq: "yearly" },
        { path: "faq", priority: 0.6, freq: "monthly" },
        { path: "is-ortakligi", priority: 0.6, freq: "monthly" },
        { path: "sistem-gereksinimleri", priority: 0.5, freq: "yearly" },
        { path: "kilavuzlar", priority: 0.6, freq: "monthly" },
        { path: "kilavuzlar/entegrasyonlar", priority: 0.7, freq: "monthly" },
        { path: "blog", priority: 0.7, freq: "weekly" },
        { path: "terms", priority: 0.3, freq: "yearly" },
        { path: "gizlilik", priority: 0.3, freq: "yearly" },
    ];
    return routes.map(r => ({
        url: `${BASE}/${r.path}`.replace(/\/$/, ""),
        lastModified: now,
        changeFrequency: r.freq,
        priority: r.priority,
    }));
}
