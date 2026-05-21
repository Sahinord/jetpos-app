// Trendyol GO ( by Uber Eats) API Client
import { apiFetch } from './api';
// Hızlı Market Entegrasyonu - Stok, Sipariş ve İade İşlemleri

interface TrendyolGoConfig {
    sellerId: string;
    storeId?: string;
    apiKey: string;
    apiSecret: string;
    agentName: string; // BU ALAN ENTEGRASYON REFERANS KODU OLMALI
    token?: string;
    baseUrl?: string;
    isStage?: boolean;
}

interface TrendyolGoOrder {
    id: string;
    orderNumber: string;
    orderDate: number;
    packageStatus: string;
    sellerId: number;
    storeId: number;
    customer: {
        firstName: string;
        lastName: string;
        note?: string;
    };
    lines: Array<{
        barcode: string;
        amount: number;
        price: number;
        product: {
            name: string;
            productSaleName: string;
            brandName: string;
            weight?: {
                typeName: string;
                defaultSaleUnitValue: string;
            };
        };
        items: Array<{
            id: string;
            isCancelled: boolean;
            price: number;
            discount: number;
            isCollected: boolean;
        }>;
    }>;
    totalPrice: number;
}

interface TrendyolGoProduct {
    id: string;
    barcode: string;
    title: string;
    quantity: number;
    originalPrice: number;
    sellingPrice: number;
    onSale: boolean;
}

interface StockUpdateItem {
    barcode: string;
    quantity: number;
    sellingPrice: number;
    originalPrice?: number;
    storeId?: string;
}

export class TrendyolGoClient {
    private config: TrendyolGoConfig;

    constructor(config: TrendyolGoConfig) {
        this.config = {
            ...config,
            baseUrl: config.baseUrl || (config.isStage ? 'https://stageapi.tgoapis.com/integrator' : 'https://api.tgoapis.com/integrator')
        };
    }

    private getHeaders(): HeadersInit {
        const apiKey = (this.config.apiKey || '').trim();
        const apiSecret = (this.config.apiSecret || '').trim();

        const headers: any = {
            'x-agentname': this.config.agentName,
            'x-executor-user': this.config.sellerId.toString(),
            'User-Agent': `${this.config.sellerId} - ${this.config.agentName}`,
            'Content-Type': 'application/json',
        };

        // Eğer kullanıcı doğrudan token (base64) vermişse onu kullan, yoksa key:secret'tan oluştur.
        if (this.config.token) {
            headers['Authorization'] = `Basic ${this.config.token}`;
        } else if (apiKey && apiSecret) {
            const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
            headers['Authorization'] = `Basic ${auth}`;
        }

        return headers;
    }

    private async request(url: string, method: string = 'GET', data?: any, retries: number = 2): Promise<any> {
        // Server-side: Doğrudan İstek
        if (typeof window === 'undefined') {
            let lastError: Error | null = null;

            for (let attempt = 0; attempt <= retries; attempt++) {
                try {
                    const response = await fetch(url, {
                        method,
                        headers: this.getHeaders() as any,
                        body: data ? JSON.stringify(data) : undefined,
                        signal: AbortSignal.timeout(15000), // 15s timeout
                    });

                    if (!response.ok) {
                        const errorText = await response.text();

                        // HTML yanıtları temizle (Cloudflare 502 gibi)
                        const isHtml = errorText.trim().startsWith('<!') || errorText.trim().startsWith('<html');
                        const statusCode = response.status;

                        if (isHtml) {
                            const cleanMsg = `Trendyol sunucusu yanıt vermiyor (HTTP ${statusCode})`;
                            
                            // 5xx hatalarında retry yap
                            if (statusCode >= 500 && attempt < retries) {
                                const delay = Math.min(2000 * Math.pow(2, attempt), 8000);
                                console.warn(`⏳ Trendyol ${statusCode} hatası, ${delay/1000}s sonra tekrar denenecek... (${attempt + 1}/${retries + 1})`);
                                await new Promise(r => setTimeout(r, delay));
                                continue;
                            }
                            
                            console.error(`❌ Trendyol API ${statusCode} [${method} ${url.split('?')[0]}]: Sunucu çökmüş/bakımda`);
                            throw new Error(cleanMsg);
                        }

                        let errorData;
                        try { errorData = JSON.parse(errorText); } catch { errorData = { message: errorText.substring(0, 200) }; }

                        // 5xx hatalarında retry
                        if (statusCode >= 500 && attempt < retries) {
                            const delay = Math.min(2000 * Math.pow(2, attempt), 8000);
                            console.warn(`⏳ Trendyol ${statusCode} hatası, ${delay/1000}s sonra tekrar denenecek... (${attempt + 1}/${retries + 1})`);
                            await new Promise(r => setTimeout(r, delay));
                            continue;
                        }

                        console.error(`❌ Trendyol API ${statusCode} [${method} ${url.split('?')[0]}]:`, errorData.message?.substring(0, 150) || 'Bilinmeyen hata');
                        throw new Error(errorData.message?.substring(0, 200) || `İşlem başarısız (${statusCode})`);
                    }

                    return await response.json();
                } catch (err: any) {
                    lastError = err;
                    
                    // Timeout veya network hatalarında retry
                    if ((err.name === 'TimeoutError' || err.name === 'AbortError' || err.code === 'ECONNRESET') && attempt < retries) {
                        const delay = Math.min(2000 * Math.pow(2, attempt), 8000);
                        console.warn(`⏳ Trendyol bağlantı zaman aşımı, ${delay/1000}s sonra tekrar denenecek... (${attempt + 1}/${retries + 1})`);
                        await new Promise(r => setTimeout(r, delay));
                        continue;
                    }
                    
                    // Zaten throw edilmiş Error ise (yukarıdaki bloktan gelen) doğrudan fırlat
                    if (err.message?.includes('Trendyol')) throw err;
                    
                    throw new Error(`Trendyol bağlantı hatası: ${err.message?.substring(0, 100) || 'Bağlantı kurulamadı'}`);
                }
            }

            throw lastError || new Error('Trendyol API isteği başarısız');
        }

        // Client-side: Proxy üzerinden istek (CORS bypass)
        const response = await apiFetch('/api/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url,
                method,
                headers: this.getHeaders(),
                data
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'API Hatası' }));
            throw new Error(error.message || `İşlem başarısız (${response.status})`);
        }

        const result = await response.json();
        return result;
    }

    async getOrders(
        startDate: Date,
        endDate: Date,
        status?: string,
        useStoreId: boolean = true
    ): Promise<TrendyolGoOrder[]> {
        const url = `${this.config.baseUrl}/order/grocery/suppliers/${this.config.sellerId}/packages`;
        const params = new URLSearchParams({
            startDate: startDate.getTime().toString(),
            endDate: endDate.getTime().toString(),
            page: '0',
            size: '200',
            sortDirection: 'DESC'
        });

        if (status) {
            params.append('status', status);
        }

        if (useStoreId && this.config.storeId) {
            params.append('storeId', this.config.storeId);
        }

        const data = await this.request(`${url}?${params}`);
        return data.content || [];
    }

    async updateStock(
        barcode: string,
        quantity: number,
        sellingPrice: number,
        originalPrice?: number,
        storeId?: string
    ): Promise<string> {
        return this.updateBulkStock([{
            barcode,
            quantity,
            sellingPrice,
            originalPrice,
            storeId
        }]);
    }

    async updateBulkStock(items: StockUpdateItem[]): Promise<string> {
        const url = `${this.config.baseUrl}/product/grocery/suppliers/${this.config.sellerId}/products/price-and-inventory`;

        const result = await this.request(url, 'POST', {
            items: items.map(item => ({
                barcode: item.barcode,
                quantity: item.quantity,
                sellingPrice: item.sellingPrice,
                originalPrice: item.originalPrice || item.sellingPrice,
                ...(item.storeId && { storeId: item.storeId })
            }))
        });

        return result.batchRequestId;
    }

    async checkBatchStatus(batchRequestId: string): Promise<any> {
        const url = `${this.config.baseUrl}/product/grocery/suppliers/${this.config.sellerId}/batch-requests/${batchRequestId}`;
        return await this.request(url);
    }

    async getProductByBarcode(barcode: string, storeId?: string): Promise<TrendyolGoProduct | null> {
        const store = storeId || this.config.storeId;
        if (!store) throw new Error('storeId gerekli!');

        const url = `${this.config.baseUrl}/product/grocery/suppliers/${this.config.sellerId}/stores/${store}/products`;
        const params = new URLSearchParams({ barcode });

        const data = await this.request(`${url}?${params}`);
        return data.content?.[0] || null;
    }

    async getProducts(
        listType: string = 'ON_SALE',
        storeId?: string,
        page: number = 0,
        size: number = 50
    ): Promise<TrendyolGoProduct[]> {
        const store = storeId || this.config.storeId;
        if (!store) throw new Error('storeId gerekli!');

        const url = `${this.config.baseUrl}/product/grocery/suppliers/${this.config.sellerId}/stores/${store}/products`;
        const params = new URLSearchParams({
            listType,
            page: page.toString(),
            size: size.toString()
        });

        const data = await this.request(`${url}?${params}`);
        return data.content || [];
    }

    async getReturns(
        startDate: Date,
        endDate: Date,
        status: string = 'Accepted'
    ): Promise<any[]> {
        const url = `${this.config.baseUrl}/claim/grocery/suppliers/${this.config.sellerId}/claims`;
        const params = new URLSearchParams({
            claimItemStatus: status,
            startDate: startDate.getTime().toString(),
            endDate: endDate.getTime().toString(),
            page: '0',
            size: '50'
        });

        const data = await this.request(`${url}?${params}`);
        return data.content || [];
    }

    /**
     * Trendyol'a fatura bildirimi gönder
     * @param packageId Trendyol Paket ID (order.id)
     * @param invoiceData Fatura bilgileri (invoiceNumber, invoiceLink, invoiceDateTime)
     */
    async uploadInvoice(packageId: string, invoiceData: {
        invoiceNumber: string;
        invoiceLink: string;
        invoiceDateTime: number;
    }) {
        const url = `${this.config.baseUrl}/order/grocery/suppliers/${this.config.sellerId}/packages/${packageId}/invoice`;

        return await this.request(url, 'POST', {
            invoiceNumber: invoiceData.invoiceNumber,
            invoiceLink: invoiceData.invoiceLink,
            invoiceDateTime: invoiceData.invoiceDateTime
        });
    }

    async getOrderByNumber(orderNumber: string): Promise<TrendyolGoOrder | null> {
        const url = `${this.config.baseUrl}/order/grocery/suppliers/${this.config.sellerId}/packages/order-number/${orderNumber}`;
        const data = await this.request(url);
        return data.content?.[0] || null;
    }

    async testConnection(): Promise<boolean> {
        try {
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
            await this.getOrders(startDate, endDate);
            return true;
        } catch (error: any) {
            console.error('❌ Trendyol GO Bağlantı Hatası:', error.message);
            return false;
        }
    }

    async closeProduct(barcode: string, storeId?: string): Promise<string> {
        return this.updateStock(barcode, 0, 0, 0, storeId);
    }

    async updateBulkStockAuto(items: StockUpdateItem[]): Promise<string[]> {
        const batchSize = 1000;
        const batchIds: string[] = [];

        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const batchId = await this.updateBulkStock(batch);
            batchIds.push(batchId);

            if (i + batchSize < items.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return batchIds;
    }
}

export function createTrendyolGoClient(settings?: { trendyolGo?: any }): TrendyolGoClient {
    const tGo = settings?.trendyolGo || {};

    const sellerId = tGo.sellerId || process.env.TRENDYOL_GO_SELLER_ID;
    const storeId = tGo.storeId || process.env.TRENDYOL_GO_STORE_ID;
    const apiKey = tGo.apiKey || process.env.TRENDYOL_GO_API_KEY;
    const apiSecret = tGo.apiSecret || process.env.TRENDYOL_GO_API_SECRET;
    const agentName = tGo.agentName || process.env.TRENDYOL_GO_AGENT_NAME || 'Self Integration';
    const token = tGo.token || process.env.TRENDYOL_GO_TOKEN;

    // allow explicitly setting stage to false in db config, otherwise fallback to env
    const stageVal = tGo.stage !== undefined ? String(tGo.stage) : process.env.TRENDYOL_GO_STAGE;
    const isStage = stageVal === 'true';

    console.log(`[Trendyol Client] Init - Stage: ${isStage} (Val: ${stageVal}), Seller: ${sellerId}, Store: ${storeId}`);

    if (!sellerId || !apiKey || !apiSecret) {
        console.error('❌ Trendyol GO credentials eksik!', { sellerId, hasApiKey: !!apiKey, hasApiSecret: !!apiSecret });
        throw new Error('❌ Trendyol GO credentials eksik!');
    }

    return new TrendyolGoClient({
        sellerId,
        storeId,
        apiKey,
        apiSecret,
        agentName,
        token,
        isStage
    });
}
