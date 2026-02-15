
import { NextRequest, NextResponse } from 'next/server';
import { QNBClient } from '@/lib/qnb/client';

export async function POST(req: NextRequest) {
    try {
        const invoiceData = await req.json();

        // Validasyon: Fatura numarası, müşteri vb. kontrol edilebilir
        if (!invoiceData.customer || !invoiceData.lines || invoiceData.lines.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Eksik fatura verisi (Müşteri veya kalemler yok)' },
                { status: 400 }
            );
        }

        const client = new QNBClient();

        // 1. Önce Login (Client içinde zaten handle ediliyor ama garanti olsun)
        // 2. Fatura Gönder
        // docType client tarafından belirlensin veya request'ten gelsin
        const docType = invoiceData.docType || 'EFATURA';

        // UBL Builder için fatura tipi gerekebilir, şimdilik client.sendInvoice hallediyor.

        const result = await client.sendInvoice(invoiceData, docType);

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: 'Fatura başarıyla kuyruğa alındı ve gönderildi.',
                listId: result.listId
            });
        } else {
            return NextResponse.json({
                success: false,
                error: result.error || 'Bilinmeyen bir hata oluştu.'
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Invoice Send API Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
