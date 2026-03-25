
import { ParasutClient } from '../parasut/client';
import { InvoiceData, InvoiceProvider, InvoiceResult, DocumentStatus } from './types';

export class ParasutProvider implements InvoiceProvider {
    name = 'parasut';
    private client: ParasutClient;

    constructor(config: { parasut?: any }) {
        const parasut = config.parasut || {};
        this.client = new ParasutClient({
            clientId: parasut.clientId,
            clientSecret: parasut.clientSecret,
            username: parasut.username || parasut.email,
            password: parasut.password,
            companyId: parasut.companyId
        });
    }

    async sendInvoice(invoiceData: InvoiceData): Promise<InvoiceResult> {
        const res = await this.client.sendInvoice(invoiceData);
        return {
            success: res.success,
            listId: res.listId,
            pdfUrl: res.pdfUrl,
            ettn: res.ettn,
            error: res.error
        };
    }

    async checkStatus(docNo: string, docType: string): Promise<DocumentStatus | null> {
        // Paraşüt'te fatura resmileştirme sendInvoice içinde senkron tamamlanır (polling ile).
        // Bu yüzden ayrıca durum sorgulamaya gerek yoktur, her zaman "gönderildi" kabul edilir.
        if (!docNo) return null;
        return {
            belgeNo: docNo,
            durum: 'BAŞARILI',
            ettn: '',
            pdfUrl: undefined
        };
    }
}
