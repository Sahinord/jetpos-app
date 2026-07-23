import { OdealEbelgeClient } from "@/lib/odeal-ebelge/client";
import { InvoiceData, InvoiceProvider, InvoiceResult, DocumentStatus } from "./types";

/**
 * Ödeal e-Belge sağlayıcısı — QNB/Paraşüt ile aynı arayüz.
 * tenants.settings.invoice_provider === 'odeal' seçilince devreye girer.
 * Kimlik: tenants.settings.odealEbelge (ya da env ODEAL_EBELGE_*).
 */
export class OdealProvider implements InvoiceProvider {
    name = "odeal";
    private client: OdealEbelgeClient;

    constructor(config: { odealEbelge?: any }) {
        this.client = new OdealEbelgeClient(config?.odealEbelge);
    }

    async sendInvoice(invoiceData: InvoiceData): Promise<InvoiceResult> {
        return this.client.sendInvoice(invoiceData);
    }

    async checkStatus(docNo: string, docType: string): Promise<DocumentStatus | null> {
        return this.client.checkStatus(docNo, docType);
    }
}
