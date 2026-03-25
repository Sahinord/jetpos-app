
import { ParasutAuthResponse, ParasutContact, ParasutProduct, ParasutTrackableJob } from './types';
import { InvoiceData, InvoiceResult } from '../invoice-providers/types';

export class ParasutClient {
    private baseUrl = 'https://api.parasut.com/v4';
    private authUrl = 'https://api.parasut.com/oauth/token';
    private clientId: string;
    private clientSecret: string;
    private username?: string;
    private password?: string;
    private companyId?: string;
    private accessToken?: string;

    constructor(config: {
        clientId?: string;
        clientSecret?: string;
        username?: string;
        password?: string;
        companyId?: string;
    }) {
        this.clientId = config.clientId || 'G8n2ld8G-TE4kVnzTK0cylHRZvmjTuUHdS0Bcgep140';
        this.clientSecret = config.clientSecret || 'Ki0EAUrF6hZjXW3_V48EpE5Hxux5ULrkX0R_jQ1Ysx8';
        this.username = config.username;
        this.password = config.password;
        this.companyId = config.companyId;
    }

    private async authenticate(): Promise<string> {
        if (this.accessToken) return this.accessToken;

        const formData = new URLSearchParams();
        formData.append('grant_type', 'password');
        formData.append('client_id', this.clientId);
        formData.append('client_secret', this.clientSecret);
        formData.append('username', this.username || '');
        formData.append('password', this.password || '');
        formData.append('redirect_uri', 'urn:ietf:wg:oauth:2.0:oob');

        const response = await fetch(this.authUrl, {
            method: 'POST',
            body: formData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Paraşüt Authentication Failed: ${err}`);
        }

        const data: ParasutAuthResponse = await response.json();
        this.accessToken = data.access_token;
        return this.accessToken;
    }

    private async request(path: string, options: any = {}) {
        const token = await this.authenticate();
        const url = `${this.baseUrl}/${this.companyId}${path}`;

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/vnd.api+json',
            ...(options.headers || {})
        };

        const res = await fetch(url, { ...options, headers });
        if (!res.ok) {
            if (res.status === 204) return null;
            const err = await res.json().catch(() => ({ errors: [{ detail: 'Bilinmeyen Hata' }] }));
            throw new Error(`Paraşüt API Error: ${err.errors?.[0]?.detail || res.statusText}`);
        }

        if (res.status === 204) return null;
        return res.json();
    }

    // Müşteri bul veya oluştur
    private async getOrCreateContact(customer: { vkn: string, name: string }): Promise<string> {
        // VKN ile ara
        const searchRes = await this.request(`/contacts?filter[tax_number]=${customer.vkn}`);
        if (searchRes.data && searchRes.data.length > 0) {
            return searchRes.data[0].id;
        }

        // Yoksa oluştur
        const createRes = await this.request('/contacts', {
            method: 'POST',
            body: JSON.stringify({
                data: {
                    type: 'contacts',
                    attributes: {
                        name: customer.name,
                        tax_number: customer.vkn,
                        tax_office: 'İSTANBUL', // Default veya dinamik
                        address: 'Türkiye',
                        contact_type: customer.vkn.length === 11 ? 'person' : 'company'
                    }
                }
            })
        });

        return createRes.data.id;
    }

    // Ürün bul veya oluştur (Basitleştirilmiş: Her dükkanın ürünlerini Paraşüt'te "JetPos Satış" altına da toplayabiliriz veya tek tek açabiliriz)
    private async getOrCreateProduct(line: { name: string }): Promise<string> {
        const searchRes = await this.request(`/products?filter[name]=${encodeURIComponent(line.name)}`);
        if (searchRes.data && searchRes.data.length > 0) {
            return searchRes.data[0].id;
        }

        const createRes = await this.request('/products', {
            method: 'POST',
            body: JSON.stringify({
                data: {
                    type: 'products',
                    attributes: {
                        name: line.name,
                        vat_rate: 1 // Default, faturada ezilecek
                    }
                }
            })
        });

        return createRes.data.id;
    }

    async sendInvoice(invoiceData: InvoiceData): Promise<InvoiceResult> {
        try {
            console.log(`[Paraşüt] Starting invoice process for ${invoiceData.customer.vkn}`);

            // 1. Contact
            const contactId = await this.getOrCreateContact(invoiceData.customer);
            console.log(`[Paraşüt] Contact ready: ${contactId}`);

            // 2. Satış Faturası oluştur (Detail'lar ile birlikte)
            const detailsData = await Promise.all(invoiceData.lines.map(async (line) => {
                const productId = await this.getOrCreateProduct(line);
                return {
                    type: 'sales_invoice_details',
                    attributes: {
                        quantity: line.quantity,
                        unit_price: line.price,
                        vat_rate: line.vatRate,
                        description: line.name
                    },
                    relationships: {
                        product: { data: { id: productId, type: 'products' } }
                    }
                };
            }));

            const salesInvoicePayload = {
                data: {
                    type: 'sales_invoices',
                    attributes: {
                        description: `JetPOS: ${invoiceData.external_id || invoiceData.invoiceNumber || ''}`,
                        issue_date: new Date().toISOString().split('T')[0],
                        billing_address: invoiceData.customer.address || '',
                        billing_city: invoiceData.customer.city || '',
                        billing_town: invoiceData.customer.district || '',
                        currency: 'TRL'
                    },
                    relationships: {
                        contact: { data: { id: contactId, type: 'contacts' } },
                        details: { data: detailsData }
                    }
                }
            };

            const invoiceRes = await this.request('/sales_invoices?include=details', {
                method: 'POST',
                body: JSON.stringify(salesInvoicePayload)
            });

            if (!invoiceRes?.data?.id) {
                throw new Error('Satış faturası oluşturulamadı: API boş yanıt döndü');
            }

            const salesInvoiceId = invoiceRes.data.id;
            console.log(`[Paraşüt] Draft invoice created: ${salesInvoiceId}`);

            // 3. E-Fatura mı E-Arşiv mi?
            let isEInvoice = false;
            try {
                const inboxesRes = await this.request(`/e_invoice_inboxes?filter[vkn]=${invoiceData.customer.vkn}`);
                isEInvoice = inboxesRes?.data && inboxesRes.data.length > 0;
            } catch (inboxErr) {
                console.warn(`[Paraşüt] E-Fatura mükellef sorgusu başarısız, e-Arşiv olarak devam ediliyor:`, inboxErr);
            }

            // 4. Resmileştir (Async)
            const type = isEInvoice ? 'e_invoices' : 'e_archives';
            console.log(`[Paraşüt] Formalizing as ${type}...`);
            
            const formalizePayload = {
                data: {
                    type: type,
                    relationships: {
                        sales_invoice: { data: { id: salesInvoiceId, type: 'sales_invoices' } }
                    }
                }
            };

            // e_archives için ek attribute'lar
            if (!isEInvoice) {
                (formalizePayload.data as any).attributes = {
                    internet_sale: invoiceData.isInternetOrder ? { url: invoiceData.webAddress || '', payment_type: invoiceData.paymentType || 'KREDIKARTI/BANKAKARTI' } : undefined
                };
            }

            const formalizeRes = await this.request(`/${type}`, {
                method: 'POST',
                body: JSON.stringify(formalizePayload)
            });

            if (!formalizeRes?.data?.id) {
                throw new Error(`Fatura resmileştirme başlatılamadı: ${type} endpoint'i boş yanıt döndü`);
            }

            const jobId = formalizeRes.data.id;
            console.log(`[Paraşüt] Formalization started. Job ID: ${jobId}`);

            // 5. Job Takibi (Polling)
            let jobStatus: ParasutTrackableJob = { id: jobId, status: 'pending' };
            let retryCount = 0;
            const maxRetries = 15; // Max ~30 sn
            while (jobStatus.status === 'pending' || jobStatus.status === 'running') {
                if (retryCount > maxRetries) {
                    console.warn(`[Paraşüt] Job polling timed out after ${maxRetries} retries`);
                    break;
                }
                await new Promise(r => setTimeout(r, 2000));
                try {
                    const trackRes = await this.request(`/trackable_jobs/${jobId}`);
                    if (trackRes?.data?.attributes) {
                        jobStatus = trackRes.data.attributes;
                    }
                } catch (trackErr) {
                    console.warn(`[Paraşüt] Job tracking error (retry ${retryCount}):`, trackErr);
                }
                retryCount++;
            }

            if (jobStatus.status !== 'done') {
                throw new Error(`Fatura resmileştirilemedi: ${jobStatus.error_message || `Zaman aşımı (${retryCount} deneme)`}`);
            }

            console.log(`[Paraşüt] Job completed successfully`);

            // 6. PDF ve Detayları Al
            const finalInvoiceRes = await this.request(`/sales_invoices/${salesInvoiceId}?include=active_e_document`);
            const activeDoc = finalInvoiceRes?.included?.find((i: any) => i.type === 'e_archives' || i.type === 'e_invoices');
            
            const ettn = activeDoc?.attributes?.uuid || '';
            const invoiceNo = activeDoc?.attributes?.invoice_number || `PS-${salesInvoiceId}`;

            // PDF URL alma
            let pdfUrl = '';
            if (activeDoc?.id) {
                try {
                    const pdfRes = await this.request(`/${type}/${activeDoc.id}/pdf`);
                    pdfUrl = pdfRes?.data?.attributes?.url || '';
                } catch (pdfErr) {
                    console.warn(`[Paraşüt] PDF alınamadı, fatura başarılı ama PDF linki yok:`, pdfErr);
                }
            }

            console.log(`[Paraşüt] Invoice completed: ${invoiceNo}, ETTN: ${ettn}`);

            return {
                success: true,
                listId: invoiceNo,
                pdfUrl: pdfUrl,
                ettn: ettn
            };

        } catch (error: any) {
            console.error(`[Paraşüt] Error:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}
