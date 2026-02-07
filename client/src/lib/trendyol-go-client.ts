// Trendyol GO ( by Uber Eats) API Client
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
        const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

        return {
            'Authorization': `Basic ${auth}`,
            'x-agentname': this.config.agentName,
            'x-executor-user': this.config.sellerId.toString(),
            'User-Agent': `${this.config.sellerId} - ${this.config.agentName}`,
            'Content-Type': 'application/json',
            ...(this.config.token && { 'x-token': this.config.token })
        };
    }

    private async request(url: string, method: string = 'GET', data?: any) {
        const response = await fetch('/api/proxy', {
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
        // HAM VERİ LOGU - Neden boş dönüyor burada göreceğiz
        console.log(`📦 [Trendyol Raw Response] Original:`, JSON.stringify(result).substring(0, 500));

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

export function createTrendyolGoClient(): TrendyolGoClient {
    const sellerId = process.env.TRENDYOL_GO_SELLER_ID;
    const storeId = process.env.TRENDYOL_GO_STORE_ID;
    const apiKey = process.env.TRENDYOL_GO_API_KEY;
    const apiSecret = process.env.TRENDYOL_GO_API_SECRET;
    const agentName = process.env.TRENDYOL_GO_AGENT_NAME || 'Self Integration';
    const isStage = process.env.TRENDYOL_GO_STAGE === 'true';

    if (!sellerId || !apiKey || !apiSecret) {
        throw new Error('❌ Trendyol GO credentials eksik!');
    }

    return new TrendyolGoClient({
        sellerId,
        storeId,
        apiKey,
        apiSecret,
        agentName,
        isStage
    });
}
