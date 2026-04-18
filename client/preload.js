const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    send: (channel, data) => {
        const validChannels = [
            'window-minimize', 
            'window-maximize', 
            'window-close', 
            'print-label-tspl', 
            'print-label-image',
            'print-raw-tspl',
            'open-cash-drawer',
            'silent-print',
            'silent-print-receipt',
            'test-receipt-printer',
            'clear-app-storage',
            'install-update'
        ];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    invoke: (channel, data) => {
        const validChannels = [
            'get-printers'
        ];
        if (validChannels.includes(channel)) {
            return ipcRenderer.invoke(channel, data);
        }
        return Promise.reject(new Error('Invalid channel: ' + channel));
    },
    receive: (channel, func) => {
        const validChannels = [
            'silent-print-result', 
            'update-available', 
            'update-ready',
            'update-download-progress',
            'window-focused'
        ];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    },
    once: (channel, func) => {
        const validChannels = [
            'silent-print-result', 
            'update-available', 
            'update-ready'
        ];
        if (validChannels.includes(channel)) {
            ipcRenderer.once(channel, (event, ...args) => func(...args));
        }
    },
    isElectron: true
});
