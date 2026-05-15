import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { 
            type, // 'trendyol' veya 'trendyol_go'
            apiKey, 
            apiSecret, 
            supplierId, 
            sellerId,
            storeId,
            agentName,
            isStage,
            startDate, 
            endDate, 
            status 
        } = body;

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

        console.log(`🚀 Proxy Request [${type}]:`, url);

        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`❌ Proxy API Error [${type}]:`, data);
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
