/**
 * SSRF koruması — "köprü" route'ları (/api/proxy, /api/qnb) istek gövdesinden
 * gelen keyfi bir URL'ye fetch atıyor. Bu route'lar herkese açık Vercel'de
 * serverless olarak çalıştığı için, hedef host bilinen entegrasyon domain'leriyle
 * sınırlanmazsa açık-proxy / iç-ağ SSRF açığı doğar (saldırgan host + protokol
 * kontrol eder). Bu yardımcı, hedefi yalnızca izinli domain'lere kısıtlar.
 */

// Her köprünün meşru olarak eriştiği domain kökleri (exact host veya alt-domain).
const ALLOWED_HOST_SUFFIXES = {
    // /api/proxy — Trendyol GO Entegratör API
    trendyol: ['tgoapis.com', 'trendyol.com'],
    // /api/qnb — QNB eFinans e-Fatura/e-Arşiv köprüsü
    qnb: ['efinans.com', 'qnbesolutions.com.tr'],
} as const;

export type ProxyGroup = keyof typeof ALLOWED_HOST_SUFFIXES;

/**
 * Verilen URL'nin, ilgili köprü için izin verilen bir HTTPS hedefine işaret
 * edip etmediğini döner. Alt-domain eşleşmesi "." öneki ile yapılır; böylece
 * "evil-efinans.com" veya "efinans.com.attacker.net" gibi kandırmalar engellenir.
 */
export function isAllowedProxyTarget(rawUrl: unknown, group: ProxyGroup): boolean {
    if (typeof rawUrl !== 'string' || !rawUrl) return false;

    let parsed: URL;
    try {
        parsed = new URL(rawUrl);
    } catch {
        return false;
    }

    // Yalnızca HTTPS — http/file/gopher vb. iç-ağ SSRF yüzeyini açar; tüm meşru
    // entegrasyon endpoint'leri zaten HTTPS.
    if (parsed.protocol !== 'https:') return false;

    const host = parsed.hostname.toLowerCase();
    return ALLOWED_HOST_SUFFIXES[group].some(
        (domain) => host === domain || host.endsWith('.' + domain)
    );
}
