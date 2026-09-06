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

/**
 * Kullanıcının verdiği rastgele bir URL'nin (örn. /api/analyze-invoice'daki
 * pdf_url / image_url) güvenle fetch edilip edilemeyeceğini döner. Belirli bir
 * domain allowlist'i yoktur (kullanıcı görselini herhangi bir depoda tutabilir),
 * ancak iç-ağ / bulut metadata SSRF'ini engeller:
 *   • Yalnızca https
 *   • localhost / *.local / düz IP literalleri (özel & link-local aralıklar) reddedilir
 *   • Özellikle 169.254.169.254 (bulut metadata) reddedilir
 * Not: DNS-rebinding'e karşı tam koruma çözümleme gerektirir; bu app-düzeyi
 * kontrol literal-IP ve localhost kandırmalarını keser.
 */
export function isSafePublicHttpUrl(rawUrl: unknown): boolean {
    if (typeof rawUrl !== 'string' || !rawUrl) return false;

    let parsed: URL;
    try {
        parsed = new URL(rawUrl);
    } catch {
        return false;
    }

    if (parsed.protocol !== 'https:') return false;

    let host = parsed.hostname.toLowerCase();
    // IPv6 köşeli parantezleri temizle
    if (host.startsWith('[') && host.endsWith(']')) host = host.slice(1, -1);

    // localhost / iç hostname'ler
    if (host === 'localhost' || host === '0.0.0.0' || host.endsWith('.local') || host.endsWith('.internal')) {
        return false;
    }

    // IPv6 loopback / unique-local / link-local
    if (host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80')) {
        return false;
    }

    // IPv4 literal ise özel/iç aralıkları reddet
    const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (m) {
        const [a, b] = [parseInt(m[1], 10), parseInt(m[2], 10)];
        if (
            a === 10 ||                             // 10.0.0.0/8
            a === 127 ||                            // loopback
            (a === 172 && b >= 16 && b <= 31) ||    // 172.16.0.0/12
            (a === 192 && b === 168) ||             // 192.168.0.0/16
            (a === 169 && b === 254) ||             // link-local + 169.254.169.254 metadata
            a === 0 || a >= 224                      // 0.0.0.0/8, multicast/reserved
        ) {
            return false;
        }
    }

    return true;
}
