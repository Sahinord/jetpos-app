const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const isDev = require('electron-is-dev');
const CryptoJS = require('crypto-js');
const fs = require('fs');

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

let deviceId = 'unknown';
try {
    deviceId = machineIdSync();
} catch (e) {
    log.error('Failed to capture machine id', e);
}

autoUpdater.logger = log;
if (autoUpdater.logger && autoUpdater.logger.transports && autoUpdater.logger.transports.file) {
    autoUpdater.logger.transports.file.level = 'info';
}
log.info('--- [CORE-v2.7] FINAL STABILITY ENGINE ---');

const PROD_URL = 'https://jetpos-app-71jf.vercel.app';
let mainWindow;

setInterval(() => {
    if (!isDev) autoUpdater.checkForUpdates();
}, 60 * 60 * 1000);

autoUpdater.on('update-available', (info) => {
    if (mainWindow) mainWindow.webContents.send('update-available', info);
});

autoUpdater.on('download-progress', (progressObj) => {
    if (mainWindow) mainWindow.webContents.send('update-download-progress', progressObj);
});

autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow) mainWindow.webContents.send('update-ready', info);
});

ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall();
});

function checkUpdates() {
    if (!isDev) {
        autoUpdater.checkForUpdatesAndNotify().catch(err => {
            log.error('Update check error:', err);
        });
    }
}

// ═══════════════════════════════════════════════════════
// SHARED UTILS
// ═══════════════════════════════════════════════════════

let rawPrintScript = path.join(__dirname, 'rawprint.ps1');
if (!isDev) {
    rawPrintScript = rawPrintScript.replace('app.asar', 'app.asar.unpacked');
}

function sendRawToPrinter(printerName, buffer, callback) {
    const tempFile = path.join(app.getPath('temp'), `jetpos_raw_${Date.now()}.bin`);
    try {
        fs.writeFileSync(tempFile, buffer);
        const cmd = `powershell -ExecutionPolicy Bypass -File "${rawPrintScript}" -PrinterName "${printerName}" -FilePath "${tempFile}"`;
        exec(cmd, (error, stdout, stderr) => {
            const success = !error && stdout.trim() === 'OK';
            try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch (e) { }
            if (callback) callback(success, error ? error.message : (stderr || null));
        });
    } catch (err) {
        if (callback) callback(false, err.message);
    }
}

async function getFinePrinterName(requestedName) {
    if (!requestedName) return undefined;
    try {
        const list = await mainWindow.webContents.getPrintersAsync();
        const cleanReq = requestedName.trim().toLowerCase().replace(/[^\w]/g, '');
        const exact = list.find(p => p.name === requestedName);
        if (exact) return exact.name;
        const fuzzy = list.find(p => {
            const cleanP = p.name.toLowerCase().replace(/[^\w]/g, '');
            return cleanP.includes(cleanReq) || cleanReq.includes(cleanP);
        });
        if (fuzzy) return fuzzy.name;
        return requestedName;
    } catch (e) {
        return requestedName;
    }
}

function turkishToAscii(str) {
    if (!str) return '';
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
// MAIN WINDOW & IPC
// ═══════════════════════════════════════════════════════

function createWindow() {
    Menu.setApplicationMenu(null);
    mainWindow = new BrowserWindow({
        width: 1280, height: 800, frame: false, show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false,
            sandbox: false,
            preload: path.join(__dirname, 'preload.js')
        },
        backgroundColor: '#0f172a'
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        // mainWindow.webContents.openDevTools();
    });

    ipcMain.on('window-minimize', () => mainWindow.minimize());
    ipcMain.on('window-maximize', () => {
        if (mainWindow.isMaximized()) mainWindow.unmaximize();
        else mainWindow.maximize();
    });
    ipcMain.on('window-close', () => mainWindow.close());

    ipcMain.handle('get-printers', async () => {
        try {
            const printers = await mainWindow.webContents.getPrintersAsync();
            return printers.map(p => ({ name: p.name, isDefault: p.isDefault, status: p.status }));
        } catch (err) { return []; }
    });

    ipcMain.on('open-cash-drawer', (event, { printerName }) => {
        if (!printerName) return;
        const buffer = Buffer.from([7, 27, 112, 0, 25, 250, 27, 112, 48, 25, 250]);
        sendRawToPrinter(printerName, buffer);
    });

    ipcMain.on('print-label-image', (event, { printerName, bitmap, widthBytes, heightDots }) => {
        if (!printerName || !bitmap || !widthBytes || !heightDots) return;
        const m = 0;
        const xL = widthBytes & 0xFF;
        const xH = (widthBytes >> 8) & 0xFF;
        const yL = heightDots & 0xFF;
        const yH = (heightDots >> 8) & 0xFF;

        const header = Buffer.from([0x1B, 0x40, 0x1B, 0x33, 0x00, 0x1B, 0x61, 0x00, 0x1D, 0x76, 0x30, m, xL, xH, yL, yH]);
        const footer = Buffer.from([0x1B, 0x64, 0x08, 0x1D, 0x56, 0x42, 0x00]);
        const buffer = Buffer.concat([header, Buffer.from(bitmap), footer]);

        sendRawToPrinter(printerName, buffer, (success, error) => {
            event.sender.send('silent-print-result', { success, error });
        });
    });

    const handleNativePrint = async (event, { html, printerName, width, height }) => {
        const type = width ? 'PRINT' : 'RECEIPT';
        const finalDeviceName = await getFinePrinterName(printerName);
        const tempHtml = path.join(app.getPath('temp'), `jetpos_${type.toLowerCase()}_${Date.now()}.html`);
        
        try {
            fs.writeFileSync(tempHtml, html, 'utf8');
            log.info(`[${type}] Printing | Printer: ${finalDeviceName || 'DEFAULT'} | Len: ${html.length}`);

            const printWin = new BrowserWindow({
                show: true, x: -2500, y: -2500,
                width: 302, height: 800,
                webPreferences: { backgroundThrottling: false }
            });

            printWin.loadFile(tempHtml);
            printWin.webContents.on('did-finish-load', () => {
                setTimeout(() => {
                    const options = {
                        silent: true,
                        deviceName: finalDeviceName,
                        printBackground: true,
                        color: true,
                        margin: { marginType: 'none' }
                    };
                    if (width && height) {
                        options.pageSize = { width: width * 1000, height: height * 1000 };
                    }

                    printWin.webContents.print(options, (success, failureReason) => {
                        log.info(`[${type}] Result: ${success ? 'OK' : 'FAIL'} | Reason: ${failureReason || 'None'}`);
                        
                        // Fiş yazdırıldıysa kağıdı otomatik kes
                        if (success && type === 'RECEIPT' && finalDeviceName) {
                            const cutBuffer = Buffer.from([0x1B, 0x64, 0x05, 0x1D, 0x56, 0x42, 0x00]); // 5 satır besle ve kes
                            sendRawToPrinter(finalDeviceName, cutBuffer);
                        }

                        if (!printWin.isDestroyed()) printWin.close();
                        try { fs.unlinkSync(tempHtml); } catch (e) { }
                        event.sender.send('silent-print-result', { success, error: failureReason });
                    });
                }, 1500);
            });
        } catch (err) {
            log.error(`[${type}] Error:`, err);
            event.sender.send('silent-print-result', { success: false, error: err.message });
        }
    };

    ipcMain.on('silent-print', handleNativePrint);
    ipcMain.on('silent-print-receipt', handleNativePrint);

    ipcMain.on('test-receipt-printer', async (event, { printerName }) => {
        const html = `
            <!DOCTYPE html><html><head><meta charset="utf-8">
            <style>body{font-family:monospace;width:80mm;padding:0 0 0 4mm;background:#fff;color:#000;text-align:center;font-weight:bold;}.w{width:72mm;}</style>
            </head><body><div class="w">
                <h2 style="margin:20px 0;">JetPOS TEST</h2>
                <p>--------------------------</p>
                <p>Yazici: ${printerName}</p>
                <p>Tarih: ${new Date().toLocaleString('tr-TR')}</p>
                <p>--------------------------</p>
                <h3 style="margin:20px 0;">BAGLANTI BASARILI</h3>
                <p>--------------------------</p>
                <div style="height:40mm;">.</div>
            </div></body></html>
        `;
        handleNativePrint(event, { html, printerName });
    });

    mainWindow.loadURL('http://127.0.0.1:3005').catch(() => mainWindow.loadURL(PROD_URL));

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.executeJavaScript(`
            window.jetpos_device_id = "${deviceId}";
        `);
    });
}

app.whenReady().then(() => {
    createWindow();
    setTimeout(checkUpdates, 5000);
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
