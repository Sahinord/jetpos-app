// Role göre installer üretir (JetPatron.exe / JetMutfak.exe / JetGarson.exe).
// Aktif rol .role.json'dan (set-role.js) ya da ROLE env'inden gelir.
const { resolveRole } = require("./roles");
const R = resolveRole();

module.exports = {
    appId: R.appId,
    productName: R.productName,
    directories: { output: `dist/${R.role}` },
    files: ["main.js", "preload.js", "roles.js", ".role.json", "build/**/*", "package.json"],
    win: {
        target: [{ target: "nsis", arch: ["x64"] }],
        icon: "build/icon.png",
        // Her rol ayrı isimli installer üretsin
        artifactName: `${R.productName}-Setup-${"${version}"}.${"${ext}"}`,
    },
    nsis: {
        oneClick: false,
        perMachine: false,
        allowToChangeInstallationDirectory: true,
        createDesktopShortcut: true,
        createStartMenuShortcut: true,
        shortcutName: R.productName,
    },
    // Kabuk sadece canlı URL yüklediği için imza/otomatik güncelleme zorunlu değil.
    // (İçerik web'den geldiği için kendini günceller.)
};
