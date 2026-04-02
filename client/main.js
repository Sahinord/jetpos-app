const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const { exec } = require('child_process');
const path = require('path');
const isDev = require('electron-is-dev');
const serve = require('electron-serve');
const { autoUpdater } = require('electron-updater');

const loadURL = serve({ directory: 'out' });

// Auto-updater configuration
autoUpdater.autoDownload = true;
autoUpdater.allowPrerelease = false;

function checkUpdates() {
    if (!isDev) {
        autoUpdater.checkForUpdatesAndNotify();
    }
}

autoUpdater.on('update-available', () => {
    // Optionally notify user
});

autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
        type: 'info',
        title: 'Güncelleme Hazır',
        message: 'Yeni bir sürüm indirildi. Uygulamanın güncellenmesi için yeniden başlatılması gerekiyor.',
        buttons: ['Şimdi Yeniden Başlat', 'Sonra']
    }).then((result) => {
        if (result.response === 0) {
            autoUpdater.quitAndInstall();
        }
    });
});

function createWindow() {
    // Remove the menu completely
    Menu.setApplicationMenu(null);

    const win = new BrowserWindow({
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

    win.once('ready-to-show', () => {
        win.show();
        win.focus();
    });

    // Fix for focus issues on some Windows versions
    win.on('focus', () => {
        win.webContents.send('window-focused', true);
    });

    // IPC Handlers for custom title bar
    ipcMain.on('window-minimize', () => win.minimize());
    ipcMain.on('window-maximize', () => {
        if (win.isMaximized()) win.unmaximize();
        else win.maximize();
    });
    ipcMain.on('window-close', () => win.close());

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

            // Get-Content -Encoding Byte: Ham baytları PowerShell içinde dizeye dönüştürmeden okur.
            const command = `powershell -Command "Get-Content -Path '${tempFile}' -Raw -Encoding Byte | Out-Printer -Name '${printerName}'"`;

            exec(command, (error) => {
                if (error) {
                    console.error(`Kasa açma hatası: ${error.message}`);
                }
                // Geçici dosyayı sil
                try { fs.unlinkSync(tempFile); } catch (e) {}
                console.log("RAW Kasa açma komutu gönderildi.");
            });
        } catch (err) {
            console.error("Kasa açma dosya hazırlama hatası:", err);
        }
    });

    // --- SESSİZ FİŞ YAZDIRMA (SILENT PRINT - DIŞ PENCERE AÇMAZ) ---
    ipcMain.on('silent-print-receipt', (event, { html }) => {
        const printWin = new BrowserWindow({
            show: false,
            width: 302, // 80mm ≈ 302px @ 96dpi
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
                printBackground: true,
                margins: { marginType: 'none' },
                pageSize: { width: 80000, height: 297000 }, // 80mm x ~300mm in microns
            }, (success, failureReason) => {
                event.sender.send('silent-print-result', { success });
                if (!success) {
                    console.error('Fiş yazdırma hatası:', failureReason);
                }
                printWin.close();
            });
        });
    });

    // In production, we load the built static files via electron-serve
    // In development, we load the localhost:3000
    if (isDev) {
        win.loadURL('http://127.0.0.1:3005');
    } else {
        loadURL(win);
    }
}

app.whenReady().then(() => {
    createWindow();
    checkUpdates();
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
