/**
 * /api/* route'larına tenant kimliğini otomatik ekleyen fetch sarmalayıcısı.
 * Server tarafında (server-tenant-auth.ts) bu header'lar gerçek tenants
 * tablosuna karşı doğrulanıyor — service-role key kullanan route'lar
 * (örn. analyze-invoice) bu header'lar olmadan caller'ın gönderdiği
 * tenant_id'ye asla güvenmemeli.
 */
export async function apiFetch(path: string, options: RequestInit = {}) {
    if (typeof window !== 'undefined') {
        const tenantId = localStorage.getItem('tenantId');
        const licenseKey = localStorage.getItem('licenseKey');
        if (tenantId && licenseKey) {
            options.headers = {
                ...options.headers,
                'x-tenant-id': tenantId,
                'x-license-key': licenseKey
            };
        }
    }

    const response = await fetch(path, options);
    const contentType = response.headers.get('content-type');

    let data;
    if (contentType && contentType.includes('application/json')) {
        data = await response.json();
    } else {
        const text = await response.text();
        throw new Error(`API beklenmeyen yanıt döndü (${response.status}): ${text.substring(0, 80)}`);
    }

    if (!response.ok) {
        throw new Error(data.error || `HTTP Hatası: ${response.status}`);
    }

    return data;
}
