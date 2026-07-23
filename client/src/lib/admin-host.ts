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

    // GERÇEK yönetici alan adı: admin.jetpos.shop
    if (host.startsWith("admin.")) return true;

    // GELİŞTİRME: localhost/127.0.0.1 VARSAYILAN olarak NORMAL app'tir
    // (yoksa localde her işletme girişi "Yetkisiz Erişim" alır — bkz. düzeltme).
    // Admin panelini localde test etmek için AÇIK opt-in gerekir:
    //   • URL'de ?admin=1   ya da
    //   • localStorage'da jp_dev_admin='1'
    if (host === "localhost" || host === "127.0.0.1") {
        try {
            if (new URLSearchParams(window.location.search).get("admin") === "1") return true;
            if (localStorage.getItem("jp_dev_admin") === "1") return true;
        } catch { /* yoksay */ }
        return false;
    }

    return false;
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
