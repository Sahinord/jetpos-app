const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const serve = require('electron-serve');
const loadURL = serve({ directory: 'out' });

function createWindow() {
    // Remove the menu completely
    Menu.setApplicationMenu(null);

    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        frame: false, // Custom title bar
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        title: "Kardeşler Kasap Muhasebe App",
        backgroundColor: '#0f172a',
        autoHideMenuBar: true,
    });

    // IPC Handlers for custom title bar
    ipcMain.on('window-minimize', () => win.minimize());
    ipcMain.on('window-maximize', () => {
        if (win.isMaximized()) win.unmaximize();
        else win.maximize();
    });
    ipcMain.on('window-close', () => win.close());

    // In production, we load the built static files via electron-serve
    // In development, we load the localhost:3000
    if (isDev) {
        win.loadURL('http://localhost:3000');
    } else {
        loadURL(win);
    }

    // DevTools closed as requested
    // if (isDev) {
    //   win.webContents.openDevTools();
    // }
}

app.whenReady().then(createWindow);

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
