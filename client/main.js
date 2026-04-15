const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const isDev = require('electron-is-dev');
const serve = require('electron-serve');

let autoUpdater;
try {
    autoUpdater = require('electron-updater').autoUpdater;
} catch (e) {
    autoUpdater = {
        logger: null,
        checkForUpdates: () => {},
        checkForUpdatesAndNotify: () => Promise.resolve(),
        on: () => {},
        quitAndInstall: () => {}
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

const loadURL = serve({ directory: 'out' });

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
                try { fs.unlinkSync(tempFile); } catch (e) {}
                console.log("RAW Kasa açma komutu gönderildi.");
            });
        } catch (err) {
            console.error("Kasa açma dosya hazırlama hatası:", err);
        }
    });

    // --- GENEL SESSİZ YAZDIRMA (ETİKET, FİŞ VB.) ---
    ipcMain.on('silent-print', (event, { html, printerName, width, height, delay = 800 }) => {
        const printWin = new BrowserWindow({
            show: false,
            width: 800,
            height: 600,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
            }
        });

        const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
        printWin.loadURL(dataUrl);

        printWin.webContents.on('did-finish-load', () => {
            // Render garantisi için ek gecikme (özellikle barkod resimleri için)
            setTimeout(() => {
                const printOptions = {
                    silent: true,
                    deviceName: printerName || "",
                    printBackground: true,
                    margins: { marginType: 'none' },
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

                printWin.webContents.print(printOptions, (success, failureReason) => {
                    if (!success) {
                        console.error('Sessiz yazdırma hatası:', failureReason);
                        event.sender.send('silent-print-result', { success: false, error: failureReason });
                    } else {
                        event.sender.send('silent-print-result', { success: true });
                    }
                    // Pencereyi hemen kapatma, yazdırma işlemi kuyruğa girsin
                    setTimeout(() => {
                        if (!printWin.isDestroyed()) printWin.close();
                    }, 1000);
                });
            }, delay);
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
        loadURL(mainWindow);
    }
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
