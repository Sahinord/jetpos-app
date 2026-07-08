import { NextRequest, NextResponse } from 'next/server';
import { verifyTenantAccess } from '@/lib/server-tenant-auth';
import { isAllowedProxyTarget } from '@/lib/ssrf-guard';

export async function POST(req: NextRequest) {
    try {
        // Kimlik: bu route herkese açık Vercel'de çalışıyor. Çağıran (Trendyol GO
        // istemcisi → apiFetch) geçerli x-tenant-id/x-license-key gönderir; header'ı
        // olmayan/geçersiz isteklerin köprüyü kullanmasını engelle.
        const auth = await verifyTenantAccess(req);
        if (!auth.ok) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const body = await req.json();
        const { url, method, headers, data } = body;

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // SSRF koruması: yalnızca Trendyol domain'lerine izin ver.
        if (!isAllowedProxyTarget(url, 'trendyol')) {
            return NextResponse.json({ error: 'Bu adrese proxy izni yok' }, { status: 403 });
        }

        console.log(`🚀 Proxying ${method} -> ${url}`);

        // Clean up headers (remove undefined/null)
        const cleanHeaders: any = {};
        Object.keys(headers || {}).forEach(key => {
            if (headers[key]) {
                // GET isteklerinde Content-Type gönderilmesi bazı API'lerde 400 hatasına yol açar
                if (method === 'GET' && key.toLowerCase() === 'content-type') return;
                cleanHeaders[key] = headers[key];
            }
        });

        // MASKELEYEREK LOGLA
        const logHeaders = { ...cleanHeaders };
        if (logHeaders['Authorization']) logHeaders['Authorization'] = 'Basic ****';
        console.log(`📋 Outgoing Headers:`, JSON.stringify(logHeaders, null, 2));

        const fetchOptions: any = {
            method: method || 'GET',
            headers: {
                ...cleanHeaders,
                'Cache-Control': 'no-cache',
            }
        };

        if (method !== 'GET' && data) {
            fetchOptions.body = JSON.stringify(data);
        }

        const response = await fetch(url, fetchOptions);

        const result = await response.json().catch(async () => {
            const text = await response.text().catch(() => 'No body');
            return { message: text };
        });

        if (!response.ok) {
            console.error(`❌ Trendyol API Error (${response.status}):`, result);
            return NextResponse.json(result, { status: response.status });
        }

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('❌ Proxy error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
