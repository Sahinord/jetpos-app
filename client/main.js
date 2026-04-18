const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const isDev = require('electron-is-dev');
const CryptoJS = require('crypto-js');

let autoUpdater;
try {
    autoUpdater = require('electron-updater').autoUpdater;
} catch (e) {
    autoUpdater = {
        logger: null,
        checkForUpdates: () => { },
        checkForUpdatesAndNotify: () => Promise.resolve(),
        on: () => { },
        quitAndInstall: () => { }
    };
}

let log;
try {
    log = require('electron-log');
} catch (e) {
    log = { info: console.log, error: console.error, warn: console.warn, transports: { file: { level: 'info' } } };
}

let machineIdSync;
try {
    machineIdSync = require('node-machine-id').machineIdSync;
} catch (e) {
    machineIdSync = () => 'unknown';
}

// Get Machine ID for security
let deviceId = 'unknown';
try {
    deviceId = machineIdSync();
} catch (e) {
    log.error('Failed to capture machine id', e);
}

// Loglama ayarları
autoUpdater.logger = log;
if (autoUpdater.logger && autoUpdater.logger.transports && autoUpdater.logger.transports.file) {
    autoUpdater.logger.transports.file.level = 'info';
}
log.info('App starting...');

const PROD_URL = 'https://jetpos-app-71jf.vercel.app';

let mainWindow;

// Periyodik güncelleme kontrolü (Her 1 saatte bir)
setInterval(() => {
    if (!isDev) autoUpdater.checkForUpdates();
}, 60 * 60 * 1000);

autoUpdater.on('update-available', (info) => {
    if (mainWindow) {
        mainWindow.webContents.send('update-available', info);
    }
});

autoUpdater.on('download-progress', (progressObj) => {
    if (mainWindow) {
        mainWindow.webContents.send('update-download-progress', progressObj);
    }
});

autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow) {
        mainWindow.webContents.send('update-ready', info);
    }
});

ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall();
});

function checkUpdates() {
    if (!isDev) {
        log.info('Checking for updates...');
        autoUpdater.checkForUpdatesAndNotify().catch(err => {
            log.error('Update check error:', err);
        });
    }
}

autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
});
autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info.version);
    if (mainWindow) {
        mainWindow.webContents.send('update-available', info);
    }
});
autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available.');
});
autoUpdater.on('error', (err) => {
    log.error('Error in auto-updater:', err);
});

function createWindow() {
    // Remove the menu completely
    Menu.setApplicationMenu(null);

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        frame: false, // Custom title bar
        show: false, // Don't show until ready to prevent focus issues
        webPreferences: {
            nodeIntegration: false, // React ile çakışmaması için kapatıyoruz
            contextIsolation: true, // Güvenlik ve stabilite için açıyoruz
            webSecurity: false,
            sandbox: false,
            preload: path.join(__dirname, 'preload.js') // Gerekli IPC'ler için köprü
        },
        title: "JetPos",
        backgroundColor: '#0f172a',
        autoHideMenuBar: true,
        acceptFirstMouse: true, // Focus on first click
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
        // Geliştirme aşamasında hataları görmek için DevTools'u açalım
        if (isDev) mainWindow.webContents.openDevTools();
    });

    // Fix for focus issues on some Windows versions
    mainWindow.on('focus', () => {
        mainWindow.webContents.send('window-focused', true);
    });

    // IPC Handlers for custom title bar
    ipcMain.on('window-minimize', () => mainWindow.minimize());
    ipcMain.on('window-maximize', () => {
        if (mainWindow.isMaximized()) mainWindow.unmaximize();
        else mainWindow.maximize();
    });
    ipcMain.on('window-close', () => mainWindow.close());
    // ═══════════════════════════════════════════════════════
    // RAW YAZICI YARDIMCISI - Tüm yazdırma buradan geçer
    // winspool.drv ile doğrudan yazıcıya binary gönderir
    // Hiçbir pencere, dialog veya UI açılmaz
    // ═══════════════════════════════════════════════════════
    const fs = require('fs');
    const rawPrintScript = path.join(__dirname, 'rawprint.ps1');

    function sendRawToPrinter(printerName, buffer, callback) {
        const tempFile = path.join(app.getPath('temp'), `jetpos_raw_${Date.now()}.bin`);
        log.info(`[RAW PRINT] ═══════════════════════════════════════`);
        log.info(`[RAW PRINT] Yazıcı Adı: "${printerName}"`);
        log.info(`[RAW PRINT] Script Yolu: "${rawPrintScript}"`);
        log.info(`[RAW PRINT] Script Mevcut: ${fs.existsSync(rawPrintScript)}`);
        log.info(`[RAW PRINT] Buffer Boyutu: ${buffer.length} byte`);
        log.info(`[RAW PRINT] Temp Dosya: "${tempFile}"`);
        try {
            fs.writeFileSync(tempFile, buffer);
            log.info(`[RAW PRINT] Temp dosya yazıldı: ${fs.existsSync(tempFile)}`);
            const cmd = `powershell -ExecutionPolicy Bypass -File "${rawPrintScript}" -PrinterName "${printerName}" -FilePath "${tempFile}"`;
            log.info(`[RAW PRINT] Komut: ${cmd}`);
            exec(cmd, (error, stdout, stderr) => {
                log.info(`[RAW PRINT] ─── SONUÇ ───`);
                log.info(`[RAW PRINT] stdout: "${stdout?.trim()}"`);
                if (stderr) log.error(`[RAW PRINT] stderr: "${stderr.trim()}"`);
                if (error) log.error(`[RAW PRINT] error: ${error.message}`);
                const success = !error && stdout.trim() === 'OK';
                log.info(`[RAW PRINT] Başarılı: ${success}`);
                log.info(`[RAW PRINT] ═══════════════════════════════════════`);
                try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch (e) { }
                if (callback) callback(success, error ? error.message : (stderr || null));
            });
        } catch (err) {
            log.error('[RAW PRINT] Dosya hazırlama hatası:', err);
            if (callback) callback(false, err.message);
        }
    }

    // --- SİSTEM YAZICILARINI LİSTELE ---
    ipcMain.handle('get-printers', async () => {
        try {
            const printers = await mainWindow.webContents.getPrintersAsync();
            log.info(`[PRINTERS] ${printers.length} yazıcı bulundu:`, printers.map(p => p.name));
            return printers.map(p => ({
                name: p.name,
                isDefault: p.isDefault,
                status: p.status
            }));
        } catch (err) {
            log.error('[PRINTERS] Yazıcı listesi alınamadı:', err);
            return [];
        }
    });

    // --- KASA ÇEKMECESİ AÇMA (RAW BYTES) ---
    ipcMain.on('open-cash-drawer', (event, { printerName }) => {
        if (!printerName) return;
        log.info(`Kasa çekmecesi açılıyor: ${printerName}`);
        const buffer = Buffer.from([7, 27, 112, 0, 25, 250, 27, 112, 48, 25, 250]);
        sendRawToPrinter(printerName, buffer);
    });

    // ═══════════════════════════════════════════════════════
    // TÜRKÇE KARAKTER → ASCII DÖNÜŞTÜRÜCÜ
    // ESC/POS yazıcılar UTF-8 desteklemez, latin1'de
    // Türkçe karakterler bozuk çıkar. Bu fonksiyon
    // tüm Türkçe özel harfleri ASCII karşılığına çevirir.
    // ═══════════════════════════════════════════════════════
    function turkishToAscii(str) {
        const map = {
            'ş': 's', 'Ş': 'S', 'ğ': 'g', 'Ğ': 'G',
            'ü': 'u', 'Ü': 'U', 'ö': 'o', 'Ö': 'O',
            'ç': 'c', 'Ç': 'C', 'ı': 'i', 'İ': 'I',
            'â': 'a', 'Â': 'A', 'î': 'i', 'Î': 'I',
            'û': 'u', 'Û': 'U', 'é': 'e', 'É': 'E',
            '₺': 'TL'
        };
        return str.replace(/[şŞğĞüÜöÖçÇıİâÂîÎûÛéÉ₺]/g, c => map[c] || c);
    }

    // ═══════════════════════════════════════════════════════
    // RONGTA RP326-USE – ESC/POS SABİT ETİKET ŞABLONU (80mm)
    // Tamamen ESC/POS RAW binary, sıfır HTML, sıfır TSPL
    //
    //  ┌──────────────────────────────────────────────────┐
    //  │         SIRMA 6X200ML MANDALINA                  │  ← Double Height + Bold, Centered
    //  │                AROMALI                           │  ← (2. satır, akıllı bölme)
    //  │──────────────────────────────────────────────────│
    //  │        |||||||||||||||||||||||||||                │  ← Code128 Barkod (GS k 73)
    //  │           8690673800711                          │  ← HRI numara (barkod altı)
    //  │──────────────────────────────────────────────────│
    //  │  48.95                                   TL     │  ← DW+DH+Bold, Sol-Sağ hizalı
    //  │──────────────────────────────────────────────────│
    //  │          KARDESLER KASAP                         │  ← Küçük, Bold, Centered
    //  │         ET&TAVUK DUNYASI                         │
    //  └──────────────────────────────────────────────────┘
    //
    ipcMain.on('print-label-tspl', (event, { printerName, product }) => {
        if (!printerName || !product) return;

        // ── Veriyi hazırla (Türkçe temizle) ──
        const pName = turkishToAscii((product.name || '').toUpperCase().trim());
        const pBarcode = String(product.barcode || '').trim();
        const rawPrice = Number(product.sale_price || 0).toFixed(2);
        const FIRMA1 = 'KARDESLER KASAP';
        const FIRMA2 = 'ET&TAVUK DUNYASI';

        log.info('[ESC/POS] ═══════════════════════════════════════');
        log.info(`[ESC/POS] Urun  : ${pName}`);
        log.info(`[ESC/POS] Barkod: ${pBarcode}`);
        log.info(`[ESC/POS] Fiyat : ${rawPrice} TL`);
        log.info(`[ESC/POS] Yazici: ${printerName}`);

        let bin = [];

        // ══════════ 1. INIT ══════════
        bin.push(0x1B, 0x40);          // ESC @ — Yazıcıyı sıfırla (tüm ayarlar default)

        // ══════════ 2. ÜRÜN ADI (Ortala + Double Height + Bold) ══════════
        bin.push(0x1B, 0x61, 0x01);    // ESC a 1 — Ortala
        // ESC ! n → bit 3=Bold(8), bit 4=DoubleH(16) → 24
        bin.push(0x1B, 0x21, 24);      // ESC ! 24 — Double Height + Bold

        // Ürün adı 24 char'dan uzunsa boşlukta böl (max 2 satır)
        const MAX_CHARS = 24;
        if (pName.length > MAX_CHARS) {
            let breakIdx = pName.lastIndexOf(' ', MAX_CHARS);
            if (breakIdx <= 0) breakIdx = MAX_CHARS;
            const line1 = pName.substring(0, breakIdx).trim();
            const line2 = pName.substring(breakIdx).trim();
            bin.push(...Buffer.from(line1 + '\n', 'ascii'));
            bin.push(...Buffer.from(line2 + '\n', 'ascii'));
        } else {
            bin.push(...Buffer.from(pName + '\n', 'ascii'));
        }

        // ══════════ 3. İNCE ÇİZGİ ══════════
        bin.push(0x1B, 0x21, 0x00);    // ESC ! 0 — Normal font
        bin.push(0x1B, 0x61, 0x01);    // ESC a 1 — Ortala
        bin.push(...Buffer.from('------------------------------------------------\n', 'ascii'));

        // ══════════ 4. BARKOD (Code128 – Donanımsal, Jilet Gibi) ══════════
        if (pBarcode.length > 0) {
            bin.push(0x1B, 0x61, 0x01);    // ESC a 1 — Ortala
            bin.push(0x1D, 0x77, 0x02);    // GS w 2  — Modül genişliği: 2 (ince → keskin çizgi)
            bin.push(0x1D, 0x68, 80);      // GS h 80 — Yükseklik: 80 dot (tarayıcı rahat okur)
            bin.push(0x1D, 0x48, 0x02);    // GS H 2  — HRI numaraları barkod ALTINDA
            bin.push(0x1D, 0x66, 0x00);    // GS f 0  — HRI font: Font A

            // GS k 73 n d1...dn — Code128 (m=73)
            const barcodeData = Buffer.from('{B' + pBarcode, 'ascii'); // {B = Subset B
            bin.push(0x1D, 0x6B, 73, barcodeData.length, ...barcodeData);

            bin.push(0x0A);                // LF — Boşluk
        }

        // ══════════ 5. İNCE ÇİZGİ ══════════
        bin.push(0x1B, 0x21, 0x00);    // ESC ! 0 — Normal font
        bin.push(0x1B, 0x61, 0x01);    // ESC a 1 — Ortala
        bin.push(...Buffer.from('------------------------------------------------\n', 'ascii'));

        // ══════════ 6. FİYAT (DW + DH + Bold – Sol Fiyat / Sağ TL) ══════════
        // ESC ! n → bit 3=Bold(8), bit 4=DoubleH(16), bit 5=DoubleW(32) → 56
        bin.push(0x1B, 0x61, 0x00);    // ESC a 0 — Sola yasla

        // DW+DH modda satır ~24 char, fiyat + TL arasına boşluk koy
        bin.push(0x1B, 0x21, 56);      // ESC ! 56 — DW + DH + Bold (EN BÜYÜK)
        const priceStr = rawPrice;
        const tlStr = 'TL';
        // DW modda ~24 char sığar, boşluklarla sağa yasla
        const padding = Math.max(1, 24 - priceStr.length - tlStr.length);
        const priceLine = priceStr + ' '.repeat(padding) + tlStr;
        bin.push(...Buffer.from(priceLine + '\n', 'ascii'));

        // ══════════ 7. İNCE ÇİZGİ ══════════
        bin.push(0x1B, 0x21, 0x00);    // ESC ! 0 — Normal font
        bin.push(0x1B, 0x61, 0x01);    // ESC a 1 — Ortala
        bin.push(...Buffer.from('------------------------------------------------\n', 'ascii'));

        // ══════════ 8. FİRMA İSMİ (Küçük, Bold, Ortala) ══════════
        bin.push(0x1B, 0x61, 0x01);    // ESC a 1 — Ortala
        bin.push(0x1B, 0x21, 0x08);    // ESC ! 8 — Bold (normal boyut)
        bin.push(...Buffer.from(FIRMA1 + '\n', 'ascii'));
        bin.push(...Buffer.from(FIRMA2 + '\n', 'ascii'));

        // ══════════ 9. BİTİŞ: Feed + Kesme ══════════
        bin.push(0x1B, 0x21, 0x00);    // ESC ! 0 — Font sıfırla
        bin.push(0x1B, 0x64, 0x02);    // ESC d 2 — 2 satır ileri (minimal kağıt)
        bin.push(0x1D, 0x56, 0x42, 0x00); // GS V 66 0 — Kısmi kesme (partial cut)

        // ── Buffer oluştur ve yazıcıya gönder ──
        const buffer = Buffer.from(bin);
        log.info(`[ESC/POS] Buffer: ${buffer.length} byte`);
        log.info(`[ESC/POS] İlk 20: [${bin.slice(0, 20).join(',')}...]`);

        sendRawToPrinter(printerName, buffer, (success, error) => {
            log.info(`[ESC/POS] Sonuc: ${success ? 'BASARILI ✅' : 'HATA ❌'} ${error || ''}`);
            event.sender.send('silent-print-result', { success, error });
        });

        log.info('[ESC/POS] ═══════════════════════════════════════');
    });

    // ═══════════════════════════════════════════════════════
    // RASTER (BITMAP) ETİKET YAZDIRMA – WYSIWYG
    // Ön izlemedeki tasarımı birebir resim olarak basar.
    // ESC @ → ESC a 0 → GS v 0 → bitmap → HEMEN KES
    // Kağıt israfı sıfır: 210mm beklemeden etiket bitince keser.
    // ═══════════════════════════════════════════════════════
    ipcMain.on('print-label-image', (event, { printerName, bitmap, widthBytes, heightDots }) => {
        if (!printerName || !bitmap || !widthBytes || !heightDots) {
            log.error('[RASTER] Eksik parametre!');
            return;
        }

        log.info('[RASTER] ═══════════════════════════════════════');
        log.info(`[RASTER] Yazıcı: ${printerName}`);
        log.info(`[RASTER] Boyut: ${widthBytes * 8}×${heightDots} dot (${widthBytes} byte/satır)`);
        log.info(`[RASTER] Bitmap: ${bitmap.length} byte`);
        log.info(`[RASTER] Etiket yüksekliği: ${Math.round(heightDots / 8)}mm`);

        const m = 0;
        const xL = widthBytes & 0xFF;
        const xH = (widthBytes >> 8) & 0xFF;
        const yL = heightDots & 0xFF;
        const yH = (heightDots >> 8) & 0xFF;

        // ── Header: Reset + Line Spacing 0 + Sola Yasla + GS v 0 ──
        const header = Buffer.from([
            0x1B, 0x40,                             // ESC @   — Reset
            0x1B, 0x33, 0x00,                       // ESC 3 0 — Satır aralığı: 0
            0x1B, 0x61, 0x00,                       // ESC a 0 — Sola yasla (Kağıdın solundan başlat, ortalama yapma!)
            0x1D, 0x76, 0x30, m, xL, xH, yL, yH    // GS v 0  — Raster image başlat
        ]);

        // ── Footer: Feed + Feed-and-Cut ──
        // Etiketi tam bıçak ağzına (dışına) çıkarmak için 8 satır sür ve otomatik kes.
        const footer = Buffer.from([
            0x1B, 0x64, 0x08,           // ESC d 8 — 8 satır ileri sür (Tam çıkış için)
            0x1D, 0x56, 0x42, 0x00      // GS V 66 0 — Besle ve Tam KES
        ]);

        // ── Birleştir ve gönder ──
        const bitmapBuf = Buffer.from(bitmap);
        const buffer = Buffer.concat([header, bitmapBuf, footer]);

        log.info(`[RASTER] Final: ${buffer.length} byte (header:${header.length} + bitmap:${bitmapBuf.length} + footer:${footer.length})`);

        sendRawToPrinter(printerName, buffer, (success, error) => {
            log.info(`[RASTER] ${success ? '✅ BAŞARILI' : '❌ HATA'} ${error || ''}`);
            event.sender.send('silent-print-result', { success, error });
        });

        log.info('[RASTER] ═══════════════════════════════════════');
    });

    // --- DIRECT TSPL/RAW PRINTING ---
    ipcMain.on('print-raw-tspl', (event, { printerName, commands }) => {
        if (!printerName || !commands) return;
        const buffer = Buffer.from(commands, 'utf8');
        sendRawToPrinter(printerName, buffer, (success, error) => {
            event.sender.send('silent-print-result', { success, error });
        });
    });

    // --- GENEL SESSİZ YAZDIRMA (HTML → PDF → RAW) ---
    ipcMain.on('silent-print', (event, { html, printerName, width, height }) => {
        const tempHtml = path.join(app.getPath('temp'), `jetpos_print_${Date.now()}.html`);
        try {
            fs.writeFileSync(tempHtml, html, 'utf8');

            const printWin = new BrowserWindow({
                show: false,
                width: Math.max(400, Math.round((width || 80) * 4)),
                height: Math.max(300, Math.round((height || 40) * 4)),
                webPreferences: { nodeIntegration: false, contextIsolation: true }
            });
            printWin.loadFile(tempHtml);

            printWin.webContents.on('did-finish-load', () => {
                setTimeout(() => {
                    const pdfOpts = { marginsType: 1, printBackground: true };
                    if (width && height) {
                        pdfOpts.pageSize = { width: width / 25.4, height: height / 25.4 };
                    }
                    printWin.webContents.printToPDF(pdfOpts).then(data => {
                        if (!printWin.isDestroyed()) printWin.close();
                        try { fs.unlinkSync(tempHtml); } catch (e) { }
                        // PDF'i RAW olarak yazıcıya gönder
                        sendRawToPrinter(printerName, Buffer.from(data), (success, error) => {
                            event.sender.send('silent-print-result', { success, error });
                        });
                    }).catch(err => {
                        if (!printWin.isDestroyed()) printWin.close();
                        try { fs.unlinkSync(tempHtml); } catch (e) { }
                        event.sender.send('silent-print-result', { success: false, error: err.message });
                    });
                }, 800);
            });
        } catch (err) {
            event.sender.send('silent-print-result', { success: false, error: err.message });
        }
    });

    // --- SESSİZ FİŞ YAZDIRMA (HTML → PDF → RAW) ---
    ipcMain.on('silent-print-receipt', (event, { html, printerName }) => {
        const tempHtml = path.join(app.getPath('temp'), `jetpos_rcpt_${Date.now()}.html`);
        try {
            fs.writeFileSync(tempHtml, html, 'utf8');

            const printWin = new BrowserWindow({
                show: false, width: 302, height: 800,
                webPreferences: { nodeIntegration: false, contextIsolation: true }
            });
            printWin.loadFile(tempHtml);

            printWin.webContents.on('did-finish-load', () => {
                setTimeout(() => {
                    printWin.webContents.printToPDF({
                        pageSize: { width: 3.15, height: 78.74 },
                        marginsType: 1, printBackground: true
                    }).then(data => {
                        if (!printWin.isDestroyed()) printWin.close();
                        try { fs.unlinkSync(tempHtml); } catch (e) { }
                        sendRawToPrinter(printerName, Buffer.from(data), (success, error) => {
                            event.sender.send('silent-print-result', { success, error });
                        });
                    }).catch(err => {
                        if (!printWin.isDestroyed()) printWin.close();
                        try { fs.unlinkSync(tempHtml); } catch (e) { }
                        event.sender.send('silent-print-result', { success: false, error: err.message });
                    });
                }, 800);
            });
        } catch (err) {
            event.sender.send('silent-print-result', { success: false, error: err.message });
        }
    });

    // --- TEST YAZDIRMASI (ESC/POS RAW) ---
    ipcMain.on('test-receipt-printer', (event, { printerName }) => {
        let bin = [];
        bin.push(...[27, 64]);
        bin.push(...[27, 97, 1]);
        bin.push(...[27, 33, 48]);
        bin.push(...Buffer.from('JetPOS Yazici Testi\n', 'ascii'));
        bin.push(...[27, 33, 0]);
        bin.push(...Buffer.from('------------------------\n', 'ascii'));
        bin.push(...Buffer.from('Tarih: ' + new Date().toLocaleString('tr-TR') + '\n', 'latin1'));
        bin.push(...Buffer.from('Yazici: ' + printerName + '\n', 'latin1'));
        bin.push(...Buffer.from('------------------------\n', 'ascii'));
        bin.push(...[27, 33, 8]);
        bin.push(...Buffer.from('BAGLANTI BASARILI\n', 'ascii'));
        bin.push(...[27, 33, 0]);
        bin.push(...Buffer.from('------------------------\n', 'ascii'));
        bin.push(...[27, 100, 4]);
        bin.push(...[29, 86, 66, 0]);

        sendRawToPrinter(printerName, Buffer.from(bin));
    });

    // Geliştirme aşamasında her zaman yerel sunucuyu yükle
    mainWindow.loadURL('http://127.0.0.1:3005').catch(err => {
        console.error("Failed to load local URL, falling back to production:", err);
        mainWindow.loadURL(PROD_URL);
    });

    // Inject Device ID and check for stuck state
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.executeJavaScript(`
            window.jetpos_device_id = "${deviceId}";
            console.log("🔍 App Loaded. License Key:", localStorage.getItem('licenseKey'));
            // Eğer 15 saniye sonra hala yükleniyorsa, otomatik temizlik mekanizması
            if (window.location.href.includes('3005')) {
                setTimeout(() => {
                    if (document.body.innerText.includes('Yükleniyor')) {
                        console.warn('⚠️ [STUCK-FIX] App stuck on loading. Auto-clearing storage and reloading...');
                        localStorage.clear();
                        window.location.reload();
                    }
                }, 8000);
            }
        `);
    });

    ipcMain.on('clear-app-storage', () => {
        if (mainWindow) {
            mainWindow.webContents.session.clearStorageData();
            mainWindow.reload();
        }
    });
}

app.whenReady().then(() => {
    createWindow();
    // Renderer'ın hazır olması için 5 saniye bekleyip sonra kontrol et
    setTimeout(checkUpdates, 5000);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
