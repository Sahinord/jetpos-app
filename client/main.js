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

    // --- KASA ÇEKMECESİ AÇMA (ELECTRON) ---
    ipcMain.on('open-cash-drawer', (event, { printerName }) => {
        if (!printerName) {
            console.log("Kasa çekmecesi hatası: Yazıcı adı belirtilmemiş.");
            return;
        }

        console.log(`🚀 Kasa çekmecesi açılıyor: ${printerName}`);

        // ESC/POS standard drawer open command: ESC p m t1 t2
        // ESC = 27, p = 112, m = 0 (Pin 2), t1 = 25, t2 = 250
        const command = `powershell -Command "Out-Printer -Name '${printerName}' -InputObject ([char]27 + [char]112 + [char]0 + [char]25 + [char]250)"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Kasa açma hatası: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`Kasa açma uyarısı: ${stderr}`);
                return;
            }
            console.log("Kasa başarıyla açıldı.");
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
