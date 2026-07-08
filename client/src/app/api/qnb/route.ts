import { NextRequest, NextResponse } from 'next/server';
import { isAllowedProxyTarget } from '@/lib/ssrf-guard';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { url, headers, soapEnvelope } = body;

        // SSRF koruması: bu köprü yalnızca QNB/eFinans e-Fatura sunucularına gitmeli.
        // (Kimlik doğrulama prod'da middleware katmanında zorunlu; burada hedef host
        // kısıtı, olası bir bypass durumunda bile keyfi URL'ye istek atılmasını önler.)
        if (!isAllowedProxyTarget(url, 'qnb')) {
            return NextResponse.json({
                success: false,
                message: 'Bu adrese köprü izni yok'
            }, { status: 403 });
        }

        console.log("QNB Köprüsü Çalışıyor. Hedef URL:", url);

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: soapEnvelope
        });

        const data = await response.text();

        if (!response.ok) {
            console.error("QNB Sunucu Hatası:", data);
            return NextResponse.json({
                success: false,
                message: "QNB Sunucusu hata döndürdü.",
                detail: data
            }, { status: response.status });
        }

        return new NextResponse(data, {
            status: 200,
            headers: { 'Content-Type': 'text/xml' }
        });

    } catch (error: any) {
        console.error("QNB Köprü Hatası:", error);
        return NextResponse.json({
            success: false,
            message: "Sunucu bağlantı hatası: " + error.message
        }, { status: 500 });
    }
}
