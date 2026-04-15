import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { url, method, headers, data } = body;

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
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
