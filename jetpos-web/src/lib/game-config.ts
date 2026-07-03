// "Sepete Yakala" oyununun paylaşılan config tipi + varsayılanlar.
// Canlı değerler Supabase'deki game_config tablosundan gelir (admin panelinden
// yönetilir); tablo boş/erişilemez ise buradaki varsayılanlar geçerlidir.

export type GameItem = { emoji: string; points: number; weight: number };
export type GameTier = { minScore: number; label: string; prize: string };

export type GameConfig = {
    enabled: boolean;
    maxPlays: number;
    durationSec: number;
    spawnEveryMs: number;
    baseFallSpeed: number;   // px/sn başlangıç düşüş hızı
    speedRampPerSec: number; // her saniye eklenen hız (px/sn)
    basketWidth: number;     // yakalama genişliği (px)
    footnote: string;
    items: GameItem[];
    tiers: GameTier[];       // minScore artan sırada
};

// ÇOK ZOR varsayılanlar: 20 sn, çok hızlı başlar ve agresif hızlanır,
// sepet dar, bomba sık ve çok acıtır, ürün puanları düşük.
// Kalibrasyon: kusursuz oyunda (tüm pozitifleri yakala, tüm bombalardan kaç)
// beklenen skor ~300-320. Yani %10 üstü ödüller kusursuza yakın oyun ister;
// Barkod (450) ancak kusursuz oyun + çok şanslı ürün dizilimiyle mümkün —
// "imkansız gibi" ama teorik olarak kazanılabilir (hiç kazanılamaz ödül
// vaat etmek aldatıcı reklam riski doğurur, o yüzden sıfır ihtimal yapmayın).
export const DEFAULT_GAME_CONFIG: GameConfig = {
    enabled: true,
    maxPlays: 3,
    durationSec: 20,
    spawnEveryMs: 450,
    baseFallSpeed: 220,
    speedRampPerSec: 14,
    basketWidth: 48,
    footnote: "* Hediyeler yıllık paket alımlarında geçerlidir. Stoklarla sınırlıdır.",
    items: [
        { emoji: "🧃", points: 5, weight: 30 },
        { emoji: "🍞", points: 5, weight: 26 },
        { emoji: "🥫", points: 10, weight: 20 },
        { emoji: "📦", points: 15, weight: 12 },
        { emoji: "💎", points: 30, weight: 4 },
        { emoji: "💣", points: -50, weight: 16 },
    ],
    tiers: [
        { minScore: 0, label: "%5", prize: "%5 Ek İndirim" },
        { minScore: 220, label: "%10", prize: "%10 Ek İndirim" },
        { minScore: 300, label: "+1 Ay", prize: "+1 Ay Ücretsiz Kullanım" },
        { minScore: 380, label: "+3 Ay", prize: "+3 Ay Ücretsiz Kullanım" },
        { minScore: 450, label: "Barkod", prize: "Ücretsiz Barkod Okuyucu" },
    ],
};

const num = (v: unknown, fallback: number, min: number, max: number): number => {
    const n = typeof v === "number" && Number.isFinite(v) ? v : fallback;
    return Math.min(max, Math.max(min, n));
};

// DB'den gelen ham JSON'u doğrulayıp varsayılanlarla birleştirir.
export function mergeGameConfig(raw: unknown): GameConfig {
    const d = DEFAULT_GAME_CONFIG;
    if (!raw || typeof raw !== "object") return d;
    const r = raw as Record<string, unknown>;

    let items: GameItem[] = d.items;
    if (Array.isArray(r.items)) {
        const parsed = (r.items as unknown[])
            .map(it => it as Record<string, unknown>)
            .filter(it => it && typeof it.emoji === "string" && it.emoji.length > 0)
            .map(it => ({
                emoji: String(it.emoji).slice(0, 8),
                points: num(it.points, 10, -500, 500),
                weight: num(it.weight, 0, 0, 1000),
            }));
        if (parsed.length > 0) items = parsed;
    }

    let tiers: GameTier[] = d.tiers;
    if (Array.isArray(r.tiers)) {
        const parsed = (r.tiers as unknown[])
            .map(t => t as Record<string, unknown>)
            .filter(t => t && typeof t.prize === "string" && t.prize.length > 0)
            .map(t => ({
                minScore: num(t.minScore, 0, 0, 1000000),
                label: typeof t.label === "string" ? t.label.slice(0, 20) : "",
                prize: String(t.prize).slice(0, 120),
            }))
            .sort((a, b) => a.minScore - b.minScore);
        if (parsed.length > 0) tiers = parsed;
    }

    return {
        enabled: typeof r.enabled === "boolean" ? r.enabled : d.enabled,
        maxPlays: Math.round(num(r.maxPlays, d.maxPlays, 1, 20)),
        durationSec: Math.round(num(r.durationSec, d.durationSec, 5, 180)),
        spawnEveryMs: Math.round(num(r.spawnEveryMs, d.spawnEveryMs, 120, 3000)),
        baseFallSpeed: num(r.baseFallSpeed, d.baseFallSpeed, 40, 1000),
        speedRampPerSec: num(r.speedRampPerSec, d.speedRampPerSec, 0, 100),
        basketWidth: num(r.basketWidth, d.basketWidth, 24, 200),
        footnote: typeof r.footnote === "string" ? r.footnote.slice(0, 300) : d.footnote,
        items,
        tiers,
    };
}

export const prizeForScore = (cfg: GameConfig, score: number): GameTier => {
    let tier = cfg.tiers[0];
    for (const t of cfg.tiers) {
        if (score >= t.minScore) tier = t;
    }
    return tier;
};
