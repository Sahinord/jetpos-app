
export interface InvoiceLine {
    name: string;
    quantity: number;
    unit: string;
    price: number; // KDV Hariç
    vatRate: number;
}

export interface InvoiceCustomer {
    vkn: string;
    name: string;
    city?: string;
    district?: string;
    address?: string;
    postalCode?: string;
}

export interface InvoiceData {
    tenantId: string;
    invoiceNumber?: string;
    customer: InvoiceCustomer;
    lines: InvoiceLine[];
    subtotal: number;
    totalVat: number;
    grandTotal: number;
    docType: 'EFATURA' | 'EARSIV';
    external_id?: string;
    packageId?: string;
    isInternetOrder?: boolean;
    webAddress?: string;
    paymentType?: string;
    carrierVkn?: string;
    carrierName?: string;
}

export interface InvoiceResult {
    success: boolean;
    listId?: string;
    pdfUrl?: string;
    ettn?: string;
    error?: string;
}

export interface DocumentStatus {
    belgeNo: string;
    durum: string;
    ettn: string;
    pdfUrl?: string;
}

export interface InvoiceProvider {
    name: string;
    sendInvoice(invoiceData: InvoiceData): Promise<InvoiceResult>;
    checkStatus(docNo: string, docType: string): Promise<DocumentStatus | null>;
}
