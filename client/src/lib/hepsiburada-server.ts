import { supabaseAdmin } from './supabase-admin';

/**
 * Hepsiburada Order/Package API (server-only). jetpos-mobile/lib/hepsiburada-server.ts
 * ile aynı mantık — bu app'in kendi backend'i için ayrı kopya (supabaseAdmin import
 * konvansiyonu farklı). Tek bir "Order API" hem pazaryeri siparişlerini hem de
 * kargo firması seçimini (HepsiJet dahil) ve etiket alımını kapsıyor.
 */

const ORDER_SUBDOMAIN_PROD = 'oms-external';
const ORDER_SUBDOMAIN_SIT = 'oms-external-sit';
const CATALOG_SUBDOMAIN_PROD = 'mpop';
const CATALOG_SUBDOMAIN_SIT = 'mpop-sit';

export interface HepsiburadaCredentials {
    merchantId: string;
    username: string;
    password: string;
    stage?: boolean;
}

export async function getHepsiburadaCredentials(tenantId: string): Promise<HepsiburadaCredentials | null> {
    const { data, error } = await supabaseAdmin
        .from('tenants')
        .select('settings')
        .eq('id', tenantId)
        .single();

    if (error || !data) return null;

    const cfg = (data.settings || {}).hepsiburada || {};
    if (!cfg.merchantId || !cfg.username || !cfg.password) return null;

    return {
        merchantId: cfg.merchantId,
        username: cfg.username,
        password: cfg.password,
        stage: cfg.stage === true
    };
}

function orderBaseUrl(creds: HepsiburadaCredentials) {
    const subdomain = creds.stage ? ORDER_SUBDOMAIN_SIT : ORDER_SUBDOMAIN_PROD;
    return `https://${subdomain}.hepsiburada.com`;
}

function catalogBaseUrl(creds: HepsiburadaCredentials) {
    const subdomain = creds.stage ? CATALOG_SUBDOMAIN_SIT : CATALOG_SUBDOMAIN_PROD;
    return `https://${subdomain}.hepsiburada.com`;
}

async function hbRequest(baseUrl: string, creds: HepsiburadaCredentials, path: string, init: RequestInit = {}) {
    const url = `${baseUrl}${path}`;
    const basic = Buffer.from(`${creds.username}:${creds.password}`).toString('base64');

    const res = await fetch(url, {
        ...init,
        headers: {
            'Authorization': `Basic ${basic}`,
            'User-Agent': `${creds.username} - SelfIntegration`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(init.headers || {})
        }
    });

    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }

    if (!res.ok) {
        const message = (data && (data.message || data.error)) || `Hepsiburada API hatası (${res.status})`;
        throw new Error(message);
    }

    return data;
}

export async function hbOrderRequest(creds: HepsiburadaCredentials, path: string, init: RequestInit = {}) {
    return hbRequest(orderBaseUrl(creds), creds, path, init);
}

export async function hbCatalogRequest(creds: HepsiburadaCredentials, path: string, init: RequestInit = {}) {
    return hbRequest(catalogBaseUrl(creds), creds, path, init);
}

export async function hbCatalogUpload(creds: HepsiburadaCredentials, products: any[]) {
    const url = `${catalogBaseUrl(creds)}/product/api/products/import`;
    const basic = Buffer.from(`${creds.username}:${creds.password}`).toString('base64');

    const blob = new Blob([JSON.stringify(products)], { type: 'application/json' });
    const formData = new FormData();
    formData.append('file', blob, 'products.json');

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${basic}`,
            'User-Agent': `${creds.username} - SelfIntegration`,
            'Accept': 'application/json'
        },
        body: formData
    });

    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }

    if (!res.ok) {
        const message = (data && (data.message || data.error)) || `Hepsiburada API hatası (${res.status})`;
        throw new Error(message);
    }

    return data;
}

export function qs(params: Record<string, string | number | undefined | null>) {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') usp.append(k, String(v));
    }
    const s = usp.toString();
    return s ? `?${s}` : '';
}
