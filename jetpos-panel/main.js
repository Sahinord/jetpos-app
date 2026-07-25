// JetPos Panel — ince Electron kabuğu.
// Canlı rol subdomain'ini (patron/mutfak/garson) native pencere gibi açar.
// İçerik canlı URL'den geldiği için OTOMATİK güncellenir (kabuğu güncellemeye gerek yok).
const { app, BrowserWindow, shell, Menu, powerSaveBlocker } = require("electron");
const path = require("path");
const { resolveRole } = require("./roles");

const ROLE = resolveRole();
let win = null;
let psbId = -1;

// Tek örnek (aynı panelin iki kopyası açılmasın)
if (!app.requestSingleInstanceLock()) {
    app.quit();
} else {
    app.on("second-instance", () => {
        if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
    });
}

function offlineHtml() {
    const html = `<!doctype html><html><head><meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <style>
      html,body{height:100%;margin:0;background:#020617;color:#e2e8f0;
        font-family:system-ui,Segoe UI,Roboto,sans-serif;display:flex;
        align-items:center;justify-content:center;text-align:center}
      .box{max-width:380px;padding:32px}
      h1{font-size:20px;margin:0 0 8px} p{color:#94a3b8;font-size:14px;line-height:1.5}
      button{margin-top:20px;padding:12px 24px;border:0;border-radius:14px;
        background:#f59e0b;color:#000;font-weight:800;font-size:14px;cursor:pointer}
    </style></head><body><div class="box">
      <h1>Bağlantı yok</h1>
      <p>${ROLE.productName} sunucuya ulaşamadı. İnternet bağlantını kontrol edip tekrar dene.</p>
      <button onclick="location.reload()">Tekrar Dene</button>
    </div>
    <script>setTimeout(()=>location.href=${JSON.stringify(ROLE.url)},4000)</script>
    </body></html>`;
    return "data:text/html;charset=utf-8," + encodeURIComponent(html);
}

function createWindow() {
    win = new BrowserWindow({
        width: 1280,
        height: 820,
        minWidth: 360,
        minHeight: 560,
        backgroundColor: "#020617",
        autoHideMenuBar: true,
        fullscreen: !!ROLE.kiosk,
        icon: path.join(__dirname, "build", "icon.png"),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: false,
        },
    });

    // Mutfak/garson ekranı: ekran uyumasın
    if (ROLE.keepAwake) {
        try { psbId = powerSaveBlocker.start("prevent-display-sleep"); } catch { /* yok say */ }
    }

    // Sade uygulama menüsü (Yenile / Tam Ekran / Çıkış)
    const menu = Menu.buildFromTemplate([
        {
            label: ROLE.productName,
            submenu: [
                { label: "Yenile", accelerator: "F5", click: () => win && win.reload() },
                { label: "Tam Ekran", accelerator: "F11", click: () => win && win.setFullScreen(!win.isFullScreen()) },
                { type: "separator" },
                { role: "quit", label: "Çıkış" },
            ],
        },
        { label: "Düzen", submenu: [{ role: "copy" }, { role: "paste" }, { role: "selectAll" }] },
    ]);
    Menu.setApplicationMenu(menu);

    win.loadURL(ROLE.url).catch(() => win.loadURL(offlineHtml()));

    // Yükleme başarısızsa (offline) çevrimdışı ekranı göster
    win.webContents.on("did-fail-load", (_e, code) => {
        // -3 = kullanıcı iptali; onu yok say
        if (code === -3) return;
        win.loadURL(offlineHtml());
    });

    // Dış linkler varsayılan tarayıcıda açılsın (kabuk kendi origin'inde kalsın)
    win.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: "deny" };
    });

    // Rol origin'i DIŞINA gitme girişimini engelle (kiosk güvenliği)
    win.webContents.on("will-navigate", (e, url) => {
        try {
            const target = new URL(url);
            const home = new URL(ROLE.url);
            if (target.host !== home.host) { e.preventDefault(); shell.openExternal(url); }
        } catch { /* yok say */ }
    });

    win.on("closed", () => { win = null; });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    if (psbId !== -1 && powerSaveBlocker.isStarted(psbId)) powerSaveBlocker.stop(psbId);
    if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
