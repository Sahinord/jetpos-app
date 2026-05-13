// Trendyol API Client
// Bu client ile Trendyol API'sine bağlanıp stok, sipariş ve ürün işlemleri yapabilirsiniz

interface TrendyolConfig {
    apiKey: string;
    apiSecret: string;
    supplierId: string;
    baseUrl?: string;
}

interface TrendyolOrder {
    orderNumber: string;
    orderDate: number;
    lines: Array<{
        barcode: string;
        productName: string;
        quantity: number;
        price: number;
    }>;
}

interface TrendyolProduct {
    barcode: string;
    title: string;
    quantity: number;
    salePrice: number;
    listPrice: number;
    approved: boolean;
}

interface StockUpdateItem {
    barcode: string;
    quantity: number;
    price: number;
}

export class TrendyolClient {
    private config: TrendyolConfig;

    constructor(config: TrendyolConfig) {
        this.config = {
            ...config,
            baseUrl: config.baseUrl || 'https://api.trendyol.com/sapigw'
        };
    }

    /**
     * Basic Auth header oluştur
     * Trendyol API'si Basic Auth kullanır: base64(apiKey:apiSecret)
     */
    private getAuthHeader(): string {
        const credentials = `${this.config.apiKey}:${this.config.apiSecret}`;
        return `Basic ${Buffer.from(credentials).toString('base64')}`;
    }

    /**
     * Siparişleri çek (tarih aralığına göre)
     * @param startDate Başlangıç tarihi
     * @param endDate Bitiş tarihi
     * @param status Sipariş durumu (opsiyonel)
     */
    async getOrders(
        startDate: Date,
        endDate: Date,
        status: string = 'Created,Picking,Invoiced'
    ): Promise<TrendyolOrder[]> {
        const url = `${this.config.baseUrl}/suppliers/${this.config.supplierId}/orders`;

        const params = new URLSearchParams({
            startDate: startDate.getTime().toString(),
            endDate: endDate.getTime().toString(),
            status
        });

        try {
            const response = await fetch(`${url}?${params}`, {
                method: 'GET',
                headers: {
                    'User-Id': this.config.supplierId,
                    'Authorization': this.getAuthHeader(),
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Trendyol API Error (${response.status}): ${error}`);
            }

            const data = await response.json();
            return data.content || [];

        } catch (error: any) {
            console.error('❌ Trendyol siparişleri alınamadı:', error.message);
            throw error;
        }
    }

    /**
     * Tek bir ürünün stok ve fiyatını güncelle
     * @param barcode Ürün barkodu
     * @param quantity Yeni stok miktarı
     * @param price Satış fiyatı
     */
    async updateStock(barcode: string, quantity: number, price: number): Promise<boolean> {
        return this.updateBulkStock([{ barcode, quantity, price }]);
    }

    /**
     * Toplu stok ve fiyat güncelleme
     * @param items Güncellenecek ürünler listesi
     */
    async updateBulkStock(items: StockUpdateItem[]): Promise<boolean> {
        const url = `${this.config.baseUrl}/suppliers/${this.config.supplierId}/products/price-and-inventory`;

        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'User-Id': this.config.supplierId,
                    'Authorization': this.getAuthHeader(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    items: items.map(item => ({
                        barcode: item.barcode,
                        quantity: item.quantity,
                        salePrice: item.price,
                        listPrice: item.price
                    }))
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Trendyol API Error (${response.status}): ${error}`);
            }

            const result = await response.json();

            // Başarısızlık kontrolü
            const failedItems = result.items?.filter((item: any) => item.failureReasons?.length > 0);

            if (failedItems && failedItems.length > 0) {
                console.warn('⚠️ Bazı ürünler güncellenemedi:', failedItems);
                throw new Error(`${failedItems.length} ürün güncellenemedi: ${JSON.stringify(failedItems)}`);
            }

            console.log(`✅ ${items.length} ürün başarıyla güncellendi`);
            return true;

        } catch (error: any) {
            console.error('❌ Trendyol stok güncellenemedi:', error.message);
            throw error;
        }
    }

    /**
     * Barkoda göre ürün bilgisi al
     * @param barcode Ürün barkodu
     */
    async getProduct(barcode: string): Promise<TrendyolProduct | null> {
        const url = `${this.config.baseUrl}/suppliers/${this.config.supplierId}/products`;

        const params = new URLSearchParams({ barcode });

        try {
            const response = await fetch(`${url}?${params}`, {
                method: 'GET',
                headers: {
                    'User-Id': this.config.supplierId,
                    'Authorization': this.getAuthHeader(),
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Trendyol API Error (${response.status}): ${error}`);
            }

            const data = await response.json();
            return data.content?.[0] || null;

        } catch (error: any) {
            console.error('❌ Trendyol ürün bilgisi alınamadı:', error.message);
            throw error;
        }
    }

    /**
     * Tüm ürünleri çek (pagination ile)
     * @param page Sayfa numarası
     * @param size Sayfa başına ürün sayısı
     */
    async getAllProducts(page: number = 0, size: number = 50): Promise<TrendyolProduct[]> {
        const url = `${this.config.baseUrl}/suppliers/${this.config.supplierId}/products`;

        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString()
        });

        try {
            const response = await fetch(`${url}?${params}`, {
                method: 'GET',
                headers: {
                    'User-Id': this.config.supplierId,
                    'Authorization': this.getAuthHeader(),
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Trendyol API Error (${response.status}): ${error}`);
            }

            const data = await response.json();
            return data.content || [];

        } catch (error: any) {
            console.error('❌ Trendyol ürünleri alınamadı:', error.message);
            throw error;
        }
    }

    /**
     * API bağlantısını test et
     */
    async testConnection(): Promise<boolean> {
        try {
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // Son 24 saat

            await this.getOrders(startDate, endDate);
            console.log('✅ Trendyol API bağlantısı başarılı');
            return true;

        } catch (error: any) {
            console.error('❌ Trendyol API bağlantısı başarısız:', error.message);
            return false;
        }
    }
}

// Helper function: Environment variables veya Tenant ayarlarından client oluştur
export function createTrendyolClient(settings?: { trendyol?: any }): TrendyolClient {
    const tSettings = settings?.trendyol || {};
    const apiKey = tSettings.apiKey || process.env.TRENDYOL_API_KEY;
    const apiSecret = tSettings.apiSecret || process.env.TRENDYOL_API_SECRET;
    const supplierId = tSettings.supplierId || process.env.TRENDYOL_SUPPLIER_ID;

    if (!apiKey || !apiSecret || !supplierId) {
        throw new Error(
            'Trendyol API credentials bulunamadı! .env.local veya Tenant ayarlarını kontrol edin.'
        );
    }

    return new TrendyolClient({
        apiKey,
        apiSecret,
        supplierId
    });
}
