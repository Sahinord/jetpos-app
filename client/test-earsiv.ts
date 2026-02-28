import { QNBClient } from './src/lib/qnb/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env.local') });

async function run() {
    const client = new QNBClient();
    const invoiceData = {
        invoiceNumber: 'EP-' + Date.now().toString().slice(-10),
        issueDate: new Date().toISOString(),
        customer: {
            name: 'TEST MÜŞTERİ',
            vkn: '11111111111',
            taxOffice: 'TEST VD',
            address: 'Test Mah. Test Sok.',
            district: 'Kadıköy',
            city: 'İstanbul'
        },
        lines: [
            {
                name: 'Test Ürün',
                quantity: 1,
                unit: 'C62', // Adet
                price: 100,
                vatRate: 20
            }
        ],
        subtotal: 100,
        totalVat: 20,
        grandTotal: 120,
        notes: 'TEST FATURASIDIR'
    };

    console.log('Sending EARSIV...');
    const result = await client.sendInvoice(invoiceData, 'EARSIV');
    console.log(JSON.stringify(result, null, 2));
}

run().catch(console.error);
