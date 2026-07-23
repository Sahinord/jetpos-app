
import { QNBProvider } from './qnb-provider';
import { ParasutProvider } from './parasut-provider';
import { OdealProvider } from './odeal-provider';
import { InvoiceProvider } from './types';

export function getInvoiceProvider(tenantSettings: any): InvoiceProvider {
    const providerType = tenantSettings.invoice_provider || 'qnb'; // Varsayılan QNB

    if (providerType === 'parasut') {
        return new ParasutProvider(tenantSettings);
    }

    // Ödeal e-Belge (e-Fatura/e-Arşiv/e-İrsaliye) — POS dışı belge kesimi
    if (providerType === 'odeal') {
        return new OdealProvider(tenantSettings);
    }

    // Geri kalan her şey QNB (default)
    return new QNBProvider(tenantSettings);
}
