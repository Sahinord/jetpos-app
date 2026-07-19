/**
 * Süper yönetici panelinin hangi adreste açılacağını belirler.
 *
 * Panel artık uygulamanın içinde gizli bir ekran değil, kendi alt alan adında
 * yaşıyor: https://admin.jetpos.shop
 *
 * NEDEN AYRI ADRES:
 *  • POS kullanan kasiyerlerin bulunduğu uygulamada yönetici ekranı hiç
 *    yüklenmiyor — yanlışlıkla açılma ihtimali ortadan kalkıyor.
 *  • Yönetici adresine ayrı güvenlik kuralları (IP kısıtı, ek doğrulama)
 *    uygulanabilir hale geliyor.
 *
 * ÖNEMLİ: Bu dosya yalnızca HANGİ EKRANIN gösterileceğine karar verir.
 * Gerçek yetki kontrolü veritabanında RLS politikalarındadır — tarayıcıda
 * kod değiştiren biri yönetici ekranını çizdirebilir ama veriye erişemez.
 */

export const ADMIN_URL = "https://admin.jetpos.shop";

/** Şu an yönetici alan adında mıyız? */
export function isAdminHost(): boolean {
    if (typeof window === "undefined") return false;
    const host = (window.location.hostname || "").toLowerCase();

    // Geliştirme ortamı: panel localhost'ta da açılabilsin
    if (host === "localhost" || host === "127.0.0.1") return true;

    return host.startsWith("admin.");
}

/**
 * Yönetici, bir işletmenin oturumuna geçtiğinde (impersonation) işaretlenir.
 * Böylece "Yönetici Paneline Dön" butonu, lisans anahtarını koda gömmeden
 * doğru zamanda gösterilebiliyor.
 */
export const IMPERSONATION_FLAG = "jetpos_admin_impersonating";

export function isImpersonating(): boolean {
    if (typeof window === "undefined") return false;
    try { return localStorage.getItem(IMPERSONATION_FLAG) === "1"; } catch { return false; }
}
