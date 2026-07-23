import CryptoJS from 'crypto-js';

const IS_ELECTRON = typeof window !== 'undefined' && 
                   ((window as any).process?.type === 'renderer' || 
                    navigator.userAgent.indexOf('Electron') >= 0 ||
                    (window as any).process?.versions?.electron);

// Production yedek adres — SADECE sayfanın origin'i okunamazsa kullanılır.
// (Normalde buraya hiç düşmeyiz; aşağıdaki resolveApiBase aynı origin'i seçer.)
const PROD_API_BASE = 'https://app.jetpos.shop';

/**
 * API taban adresi.
 *
 * NEDEN SABİT DEĞİL: Electron penceresi uygulamayı bir URL'den yüklüyor
 * (main.js → localhost:3005 ya da PROD_URL). API'yi hep AYNI ORIGIN'den
 * çağırırsak:
 *   • CORS hiç devreye girmez,
 *   • domain değişince (örn. app.jetpos.shop) burayı güncellemek gerekmez,
 *   • eski kurulumlar eski adresten, yeniler yeni adresten sorunsuz çalışır.
 * Domain geçişindeki en büyük kırılma riski bu şekilde ortadan kalkıyor.
 */
function resolveApiBase(): string {
    if (process.env.NODE_ENV === 'development') return '';
    if (typeof window !== 'undefined') {
        const origin = window.location?.origin || '';
        if (origin.startsWith('http')) return ''; // aynı origin → göreli yol
    }
    return PROD_API_BASE; // file:// gibi beklenmedik durumlar için yedek
}

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

    // Tenant kimliği: backend route'ları (service-role key ile RLS bypass eden
    // /api/invoices/archive, /api/trendyol/* vb.) bu header'lar olmadan body/query
    // içindeki tenantId'ye asla güvenmemeli — bkz. lib/server-tenant-auth.ts.
    if (typeof window !== 'undefined' && path.startsWith('/api/')) {
        const tenantId = localStorage.getItem('currentTenantId');
        const licenseKey = localStorage.getItem('licenseKey');
        if (tenantId && licenseKey) {
            options.headers = {
                ...options.headers,
                'x-tenant-id': tenantId,
                'x-license-key': licenseKey
            };
        }
    }

    // Electron environment specific logic
    if (IS_ELECTRON && path.startsWith('/api/')) {
        url = `${resolveApiBase()}${path}`;

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
        const contentType = response.headers.get('content-type');
        
        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            // HTML veya başka bir şey geldi (Muhtemelen 404 veya 500 hatası)
            const text = await response.text();
            throw new Error(`API returned non-JSON response (${response.status}): ${text.substring(0, 50)}...`);
        }
        
        if (!response.ok) {
            throw new Error(data.error || `HTTP Error: ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error(`[API Fetch Error] ${url}:`, error);
        throw error;
    }
}
