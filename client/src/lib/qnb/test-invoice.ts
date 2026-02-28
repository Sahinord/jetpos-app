
import { QNBClient } from './client';
import dotenv from 'dotenv';
import path from 'path';

// .env.local'ı yükle
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testInvoice() {
    console.log('--- QNB e-Arşiv Fatura Kesme Testi ---');
    const client = new QNBClient();

    // Gerçekçi test verisi
    const testData = {
        invoiceNumber: 'JET' + Date.now().toString().slice(-9),
        note: 'JetPOS e-Arşiv Test Faturası',
        docType: 'EARSIV',
        supplier: {
            vkn: process.env.QNB_TEST_VKN || '7910101045',
            name: 'JetPOS Teknoloji A.Ş.',
            city: 'İSTANBUL'
        },
        customer: {
            vkn: '11111111111', // Nihai Tüketici TCKN
            name: 'JetPOS Test Müşterisi',
            city: 'ANKARA'
        },
        lines: [
            {
                name: 'Test Ürünü 1',
                quantity: 1,
                unit: 'ADET',
                price: 100.00,
                vatRate: 20
            }
        ],
        subtotal: 100.00,
        totalVat: 20.00,
        grandTotal: 120.00
    };

    try {
        const result = await client.sendInvoice(testData, 'EARSIV');

        if (result.success) {
            console.log('✅ Fatura Başarıyla Kesildi!');
            console.log('Fatura No:', result.listId);
            if (result.pdfUrl) console.log('PDF URL:', result.pdfUrl);
        } else {
            console.log('❌ Fatura Kesilemedi!');
            console.log('Hata:', result.error);
        }
    } catch (error: any) {
        console.log('🔥 Beklenmedik Hata:', error.message);
    }
}

testInvoice();
