
import { QNBProvider } from './qnb-provider';
import { ParasutProvider } from './parasut-provider';
import { InvoiceProvider } from './types';

export function getInvoiceProvider(tenantSettings: any): InvoiceProvider {
    const providerType = tenantSettings.invoice_provider || 'qnb'; // Varsayılan QNB

    if (providerType === 'parasut') {
        return new ParasutProvider(tenantSettings);
    }

    // Geri kalan her şey QNB (default)
    return new QNBProvider(tenantSettings);
}
