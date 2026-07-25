// Host-bazlı uygulama modu — tek kod tabanı, çok alan adı.
// admin-host.ts deseninin kardeşi (client tarafındaki gibi).
//
//   garson.jetpos.shop → 'garson'  → sadece adisyon paneli (garson girişi/PIN)
//   mutfak.jetpos.shop → 'mutfak'  → sadece KDS (mutfak ekranı)
//   patron.jetpos.shop → 'patron'  → patron paneli (gözetim + personel + performans)
//   diğer (mobile.jetpos.shop / localhost) → 'full' → tam mobil uygulama
//
// NEDEN: Normal mobil uygulama (full) açılışta PIN İSTEMEZ. PIN'li garson/patron
// girişi yalnızca kendi alan adına aittir. İkisi karışmasın diye mod host'tan
// çözülür. Yerel test için ?mode=patron veya localStorage override.

export type AppMode = "garson" | "mutfak" | "patron" | "full";

export function getAppMode(): AppMode {
    if (typeof window === "undefined") return "full";
    const host = (window.location.hostname || "").toLowerCase();

    if (host.startsWith("garson.")) return "garson";
    if (host.startsWith("mutfak.")) return "mutfak";
    if (host.startsWith("patron.")) return "patron";

    // Yerel geliştirme override'ları (subdomain olmayan ortamlar için)
    try {
        const q = new URLSearchParams(window.location.search).get("mode");
        if (q === "garson" || q === "mutfak" || q === "patron" || q === "full") {
            localStorage.setItem("jp_app_mode", q); // sonraki sayfalara taşınsın
            return q;
        }
        const ls = localStorage.getItem("jp_app_mode");
        if (ls === "garson" || ls === "mutfak" || ls === "patron") return ls;
    } catch { /* yok say */ }

    return "full";
}

export const isGarsonHost = () => getAppMode() === "garson";
export const isMutfakHost = () => getAppMode() === "mutfak";
export const isPatronHost = () => getAppMode() === "patron";
export const isFullHost = () => getAppMode() === "full";

/** Rol modlarında (garson/mutfak/patron) alt menü gizlenir — kiosk/rol netliği. */
export const isRoleLockedHost = () => {
    const m = getAppMode();
    return m === "garson" || m === "mutfak" || m === "patron";
};

/** Moda göre giriş rotası. */
export function modeHomePath(mode: AppMode = getAppMode()): string {
    if (mode === "garson") return "/adisyon";
    if (mode === "mutfak") return "/kds";
    if (mode === "patron") return "/patron";
    return "/dashboard";
}
