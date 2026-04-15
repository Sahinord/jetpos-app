import CryptoJS from 'crypto-js';

const IS_ELECTRON = typeof window !== 'undefined' && 
                   (window.process?.type === 'renderer' || 
                    navigator.userAgent.indexOf('Electron') >= 0 ||
                    (window as any).process?.versions?.electron);

// Production Vercel URL
const PROD_API_BASE = 'https://jetpos-app-71jf.vercel.app';

// Security Secret (Should match JETPOS_API_SECRET in Vercel Env)
const APP_SECRET = 'jetpos_secure_v1_2_8_gatekeeper'; 

/**
 * Gets the unique hardware ID if in Electron
 */
function getDeviceId(): string {
    if (!IS_ELECTRON) return 'web-client';
    try {
        // First try to get it from global if we pushed it from main
        if ((window as any).jetpos_device_id) return (window as any).jetpos_device_id;
        
        // Node integration fallback
        const nodeRequire = (window as any).require;
        if (nodeRequire) {
            const { machineIdSync } = nodeRequire('node-machine-id');
            return machineIdSync();
        }
        return 'electron-remote-active';
    } catch (e) {
        return 'electron-dev-id';
    }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
    let url = path;

    // Electron environment specific logic
    if (IS_ELECTRON && path.startsWith('/api/')) {
        url = `${PROD_API_BASE}${path}`;
        
        const timestamp = Date.now().toString();
        const deviceId = getDeviceId();
        
        // Digital Signature Formulation: Path + Timestamp + DeviceID + Secret
        const message = `${path}${timestamp}${deviceId}`;
        const signature = CryptoJS.HmacSHA256(message, APP_SECRET).toString();

        // Inject Security Headers
        options.headers = {
            ...options.headers,
            'Content-Type': 'application/json',
            'x-jetpos-device-id': deviceId,
            'x-jetpos-timestamp': timestamp,
            'x-jetpos-signature': signature
        };
    }

    try {
        const response = await fetch(url, options);
        return response;
    } catch (error) {
        console.error(`[API Fetch Error] ${url}:`, error);
        throw error;
    }
}
