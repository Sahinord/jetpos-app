// Rol tanımları — tek kaynak. Hem main.js (URL) hem electron-builder.config.js
// (isim/appId/artifact) buradan okur. Yeni bir rol eklemek = buraya satır eklemek.
const ROLES = {
    patron: {
        role: "patron",
        url: "https://patron.jetpos.shop",
        productName: "JetPatron",
        appId: "com.jetpos.patron",
        kiosk: false,
        keepAwake: false,
    },
    mutfak: {
        role: "mutfak",
        url: "https://mutfak.jetpos.shop",
        productName: "JetMutfak",
        appId: "com.jetpos.mutfak",
        kiosk: true,        // mutfak ekranı: tam ekran / kiosk
        keepAwake: true,    // ekran uyumasın
    },
    garson: {
        role: "garson",
        url: "https://garson.jetpos.shop",
        productName: "JetGarson",
        appId: "com.jetpos.garson",
        kiosk: false,
        keepAwake: true,
    },
};

// Aktif rolü çöz: önce env (ROLE), sonra .role.json, yoksa 'patron'.
function resolveRole() {
    const envRole = (process.env.ROLE || "").toLowerCase();
    if (ROLES[envRole]) return ROLES[envRole];
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const saved = require("./.role.json");
        if (saved && ROLES[saved.role]) return ROLES[saved.role];
    } catch { /* .role.json yok — ilk kurulum */ }
    return ROLES.patron;
}

module.exports = { ROLES, resolveRole };
