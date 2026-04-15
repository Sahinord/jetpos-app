import CryptoJS from 'crypto-js';

/**
 * JetPos API Fetch Utility
 * Enhanced with HWID + HMAC Security Layer (v1.2.8)
 */

const IS_ELECTRON = typeof window !== 'undefined' && 
                   (window.process?.type === 'renderer' || 
                    navigator.userAgent.indexOf('Electron') >= 0);

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
        // Node integration is enabled in this project
        const { machineIdSync } = (window as any).require('node-machine-id');
        return machineIdSync();
    } catch (e) {
        console.warn('HWID reading failed, falling back...');
        return 'unknown-dev';
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
