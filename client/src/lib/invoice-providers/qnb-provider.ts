
import { QNBClient } from '../qnb/client';
import { InvoiceData, InvoiceProvider, InvoiceResult, DocumentStatus } from './types';

export class QNBProvider implements InvoiceProvider {
    name = 'qnb';
    private client: QNBClient;

    constructor(config: { qnb?: any }) {
        this.client = new QNBClient(config);
    }

    async sendInvoice(invoiceData: InvoiceData): Promise<InvoiceResult> {
        return this.client.sendInvoice(invoiceData, invoiceData.docType);
    }

    async checkStatus(docNo: string, docType: string): Promise<DocumentStatus | null> {
        const res = await this.client.checkDocumentStatus(docNo, docType);
        if (!res) return null;
        return {
            belgeNo: res.belgeNo,
            durum: res.durum,
            ettn: res.ettn,
            pdfUrl: res.pdfUrl
        };
    }
}
