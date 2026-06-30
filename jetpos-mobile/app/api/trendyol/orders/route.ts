import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyTenantAccess } from '@/lib/server-tenant-auth';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'no_key_for_build'
);

export async function POST(req: NextRequest) {
    try {
        const auth = await verifyTenantAccess(req);
        if (!auth.ok) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const body = await req.json();
        const { type, startDate, endDate, status } = body; // 'trendyol' veya 'trendyol_go'

        // Kimlik bilgileri ASLA client'tan alınmaz — tenant'ın kendi ayarlarından
        // sunucu tarafında okunur, tarayıcıya hiç gönderilmez.
        const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .select('settings')
            .eq('id', auth.tenantId)
            .single();

        if (tenantError || !tenant) {
            return NextResponse.json({ error: 'Tenant ayarları okunamadı' }, { status: 404 });
        }

        const settings = tenant.settings || {};
        const cfg = type === 'trendyol_go' ? (settings.trendyolGo || {}) : (settings.trendyol || {});
        const { apiKey, apiSecret, supplierId, sellerId, storeId, agentName, stage: isStage } = cfg;

        if (!apiKey || !apiSecret || (!supplierId && !sellerId)) {
            return NextResponse.json({ error: 'Bu pazaryeri entegrasyonu yapılandırılmamış' }, { status: 400 });
        }

        const credentials = btoa(`${apiKey}:${apiSecret}`);
        const authHeader = `Basic ${credentials}`;

        let url = '';
        let headers: any = {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
        };

        if (type === 'trendyol_go') {
            // Trendyol GO (Hızlı Market/Yemek) API Yapısı
            const baseUrl = isStage ? 'https://stageapi.tgoapis.com/integrator' : 'https://api.tgoapis.com/integrator';
            const sId = sellerId || supplierId;
            url = `${baseUrl}/order/grocery/suppliers/${sId}/packages`;

            headers['x-agentname'] = agentName || 'Self Integration';
            headers['x-executor-user'] = sId.toString();
            headers['User-Agent'] = `${sId} - ${headers['x-agentname']}`;

            const params = new URLSearchParams({
                startDate: startDate.toString(),
                endDate: endDate.toString(),
                page: '0',
                size: '200',
                sortDirection: 'DESC'
            });
            if (status) params.append('status', status);
            if (storeId) params.append('storeId', storeId);

            url = `${url}?${params}`;
        } else {
            // Standart Trendyol Marketplace API Yapısı
            url = `https://api.trendyol.com/sapigw/suppliers/${supplierId}/orders`;
            const params = new URLSearchParams({
                startDate: startDate.toString(),
                endDate: endDate.toString(),
                status: status || 'Created,Picking,Invoiced,Shipped,Delivered'
            });
            url = `${url}?${params}`;
            headers['User-Id'] = supplierId.toString();
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`❌ Trendyol API Error [${type}]:`, data);
            return NextResponse.json({ error: data.message || 'API hatası oluştu' }, { status: response.status });
        }

        // GO ve Marketplace veri yapılarını standardize et
        const content = data.content || [];
        return NextResponse.json(content);

    } catch (error: any) {
        console.error('Trendyol Proxy Exception:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
