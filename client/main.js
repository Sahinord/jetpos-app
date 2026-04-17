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
            nodeIntegration: true,
            contextIsolation: false,
        },
        title: "JetPos",
        backgroundColor: '#0f172a',
        autoHideMenuBar: true,
        acceptFirstMouse: true, // Focus on first click
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
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

    // --- KASA ÇEKMECESİ AÇMA (ELECTRON - RAW BYTES) ---
    ipcMain.on('open-cash-drawer', (event, { printerName }) => {
        if (!printerName) {
            console.log("Kasa çekmecesi hatası: Yazıcı adı belirtilmemiş.");
            return;
        }

        console.log(`🚀 Kasa çekmecesi ham veri (RAW) ile açılıyor: ${printerName}`);

        const fs = require('fs');
        const tempFile = path.join(app.getPath('temp'), 'jetpos_drawer.bin');

        try {
            // BEL(7) + ESC p 0 25 250 + ESC p 48 25 250 (Geniş Uyumluluk)
            const buffer = Buffer.from([7, 27, 112, 0, 25, 250, 27, 112, 48, 25, 250]);
            fs.writeFileSync(tempFile, buffer);

            const command = `powershell -Command "Get-Content -Path '${tempFile}' -Raw -Encoding Byte | Out-Printer -Name '${printerName}'"`;

            exec(command, (error) => {
                if (error) {
                    console.error(`Kasa açma hatası: ${error.message}`);
                }
                try { fs.unlinkSync(tempFile); } catch (e) { }
                console.log("RAW Kasa açma komutu gönderildi.");
            });
        } catch (err) {
            console.error("Kasa açma dosya hazırlama hatası:", err);
        }
    });

    // --- RONGTA RP80 SESSİZ FİŞ YAZDIRMA ---
    ipcMain.on('print-label-tspl', (event, { printerName, product, width = 80, height = 40, html }) => {
        if (!printerName || !product) return;

        // Görünmez bir pencere oluşturuyoruz
        const printWin = new BrowserWindow({
            show: false,
            webPreferences: { nodeIntegration: true, contextIsolation: false }
        });

        const pName = (product.name || "").toUpperCase();
        const pBarcode = product.barcode || "";
        const pPrice = `${Number(product.sale_price || 0).toFixed(2)} TL`;

        // Eğer dışarıdan HTML gelmişse onu kullan, yoksa varsayılan basit şablonu kullan
        const finalHtml = html || `
            <html>
            <style>
                body { 
                    width: ${width}mm; 
                    margin: 0; padding: 5px; 
                    font-family: 'Courier New', Courier, monospace; 
                    text-align: center;
                }
                .title { font-size: 14px; font-weight: bold; margin-bottom: 5px; }
                .barcode { font-size: 30px; font-family: 'Libre Barcode 128', cursive; margin: 10px 0; }
                .price { font-size: 18px; font-weight: bold; border-top: 1px dashed #000; padding-top: 5px; }
            </style>
            <body>
                <div class="title">${pName}</div>
                <div style="font-size: 12px;">${pBarcode}</div>
                <div class="price">${pPrice}</div>
            </body>
            </html>
        `;

        printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(finalHtml)}`);

        printWin.webContents.on('did-finish-load', () => {
            const options = {
                silent: true,
                deviceName: printerName,
                printBackground: true,
                margins: { marginType: 'none' },
                pageSize: { 
                    width: Math.round((width || 80) * 1000), 
                    height: Math.round((height || 40) * 1000) 
                }
            };

            printWin.webContents.print(options, (success, errorType) => {
                if (!success) console.error('Yazdırma Hatası:', errorType);
                printWin.close(); 
                event.sender.send('silent-print-result', { success });
            });
        });
    });

    // --- DIRECT TSPL/RAW PRINTING (HARDWARE NATIVE) ---
    ipcMain.on('print-raw-tspl', (event, { printerName, commands }) => {
        if (!printerName || !commands) return;

        const fs = require('fs');
        const tempFile = path.join(app.getPath('temp'), `jetpos_tspl_${Date.now()}.bin`);

        try {
            // TSPL commands are usually ASCII/UTF-8
            fs.writeFileSync(tempFile, commands, 'utf8');

            const command = `powershell -Command "Get-Content -Path '${tempFile}' -Raw | Out-Printer -Name '${printerName}'"`;

            exec(command, (error) => {
                if (error) console.error(`TSPL Yazdırma hatası: ${error.message}`);
                try { fs.unlinkSync(tempFile); } catch (e) { }
                event.sender.send('silent-print-result', { success: !error });
            });
        } catch (err) {
            console.error("TSPL Hazırlama hatası:", err);
            event.sender.send('silent-print-result', { success: false, error: err.message });
        }
    });

    // --- GENEL SESSİZ YAZDIRMA (ETİKET, FİŞ VB.) ---
    ipcMain.on('silent-print', (event, { html, printerName, width, height, delay = 800 }) => {
        const fs = require('fs');
        const tempFile = path.join(app.getPath('temp'), `jetpos_print_${Date.now()}.html`);
        
        try {
            // HTML'i temp dosyaya yaz (data URL boyut limitini aşmamak için)
            fs.writeFileSync(tempFile, html, 'utf8');
            log.info(`[PRINT] Temp dosya yazıldı: ${tempFile} (${html.length} byte)`);
            log.info(`[PRINT] Yazıcı: ${printerName}, Boyut: ${width}mm x ${height}mm`);
        } catch (writeErr) {
            log.error('[PRINT] Temp dosya yazma hatası:', writeErr);
            event.sender.send('silent-print-result', { success: false, error: writeErr.message });
            return;
        }

        const printWin = new BrowserWindow({
            show: false,
            width: Math.max(400, Math.round((width || 80) * 4)),
            height: Math.max(300, Math.round((height || 40) * 4)),
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
            }
        });

        // Temp dosyadan yükle (data URL yerine - çok daha güvenilir)
        printWin.loadFile(tempFile);

        printWin.webContents.on('did-finish-load', () => {
            log.info('[PRINT] Sayfa yüklendi, render bekleniyor...');
            // Render garantisi için ek gecikme (özellikle barkod resimleri için)
            setTimeout(() => {
                const printOptions = {
                    silent: true,
                    deviceName: printerName || "",
                    printBackground: true,
                    margins: { marginType: 'none' },
                    scaleFactor: 100,
                };

                // Eğer genişlik ve yükseklik mm cinsinden geldiyse microns'a çevir
                if (width && height) {
                    Object.assign(printOptions, {
                        pageSize: {
                            width: Math.round(width * 1000),
                            height: Math.round(height * 1000)
                        }
                    });
                } else {
                    Object.assign(printOptions, { pageSize: 'A4' });
                }

                log.info('[PRINT] Yazdırma başlatılıyor:', JSON.stringify(printOptions));

                printWin.webContents.print(printOptions, (success, failureReason) => {
                    if (!success) {
                        log.error('[PRINT] Yazdırma hatası:', failureReason);
                        event.sender.send('silent-print-result', { success: false, error: failureReason });
                    } else {
                        log.info('[PRINT] Yazdırma başarılı!');
                        event.sender.send('silent-print-result', { success: true });
                    }
                    // Pencereyi ve temp dosyayı temizle
                    setTimeout(() => {
                        if (!printWin.isDestroyed()) printWin.close();
                        try { fs.unlinkSync(tempFile); } catch (e) { }
                    }, 2000);
                });
            }, delay);
        });

        printWin.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
            log.error(`[PRINT] Sayfa yükleme hatası: ${errorCode} - ${errorDescription}`);
        });
    });

    // --- SESSİZ FİŞ YAZDIRMA (ESKİ - UYUMLULUK İÇİN) ---
    ipcMain.on('silent-print-receipt', (event, { html, printerName }) => {
        const printWin = new BrowserWindow({
            show: false,
            width: 302,
            height: 800,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
            }
        });

        printWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));

        printWin.webContents.on('did-finish-load', () => {
            printWin.webContents.print({
                silent: true,
                deviceName: printerName || "",
                printBackground: true,
                margins: { marginType: 'none' },
                pageSize: { width: 80000, height: 2000000 }, // 2 metreye kadar uzun fiş desteği
            }, (success) => {
                event.sender.send('silent-print-result', { success });
                printWin.close();
            });
        });
    });

    // --- TEST YAZDIRMASI ---
    ipcMain.on('test-receipt-printer', (event, { printerName }) => {
        const testWin = new BrowserWindow({ show: false });
        const testHtml = `<html><body style="font-family:monospace;padding:10px;text-align:center;">
            <h3>JetPOS Yazıcı Testi</h3>
            <p>Tarih: ${new Date().toLocaleString()}</p>
            <p>Yazıcı: ${printerName}</p>
            <p>------------------------</p>
            <p>BAGLANTI BASARILI</p>
            <p>------------------------</p>
        </body></html>`;
        testWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(testHtml));
        testWin.webContents.on('did-finish-load', () => {
            testWin.webContents.print({
                silent: true,
                deviceName: printerName,
                printBackground: true
            }, () => testWin.close());
        });
    });

    if (isDev) {
        mainWindow.loadURL('http://127.0.0.1:3005');
    } else {
        // PRODUCTION: Load from live Vercel
        mainWindow.loadURL(PROD_URL);
    }

    // Inject Device ID for security headers
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.executeJavaScript(`window.jetpos_device_id = "${deviceId}";`);
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
