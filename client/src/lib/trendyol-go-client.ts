// Trendyol GO ( by Uber Eats) API Client
// Hızlı Market Entegrasyonu - Stok, Sipariş ve İade İşlemleri

interface TrendyolGoConfig {
    supplierId: string;
    storeId?: string;
    agentName: string;
    executorUser: string;
    baseUrl?: string;
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
            baseUrl: config.baseUrl || 'https://api.tgoapis.com/integrator'
        };
    }

    /**
     * Gerekli header'ları oluştur
     */
    private getHeaders(): HeadersInit {
        return {
            'Content-Type': 'application/json',
            'x-agentname': this.config.agentName,
            'x-executor-user': this.config.executorUser
        };
    }

    /**
     * Yeni siparişleri çek (Son X saatteki)
     * @param startDate Başlangıç tarihi
     * @param endDate Bitiş tarihi
     * @param status Sipariş durumu (Created, Picking, Invoiced, vb.)
     */
    async getOrders(
        startDate: Date,
        endDate: Date,
        status: string = 'Created'
    ): Promise<TrendyolGoOrder[]> {
        const url = `${this.config.baseUrl}/order/grocery/suppliers/${this.config.supplierId}/packages`;

        const params = new URLSearchParams({
            status,
            startDate: startDate.getTime().toString(),
            endDate: endDate.getTime().toString(),
            page: '0',
            size: '200', // Maksimum 200
            sortDirection: 'DESC'
        });

        // Şube ID varsa ekle
        if (this.config.storeId) {
            params.append('storeId', this.config.storeId);
        }

        try {
            const response = await fetch(`${url}?${params}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Trendyol GO API Error (${response.status}): ${error}`);
            }

            const data = await response.json();
            return data.content || [];

        } catch (error: any) {
            console.error('❌ Trendyol GO siparişleri alınamadı:', error.message);
            throw error;
        }
    }

    /**
     * Tek ürün stok ve fiyat güncelle
     * @param barcode Ürün barkodu
     * @param quantity Yeni stok (0 = satışa kapat)
     * @param sellingPrice Satış fiyatı
     * @param originalPrice İndirimli ise orijinal fiyat
     * @param storeId Şube ID (opsiyonel, yoksa tüm şubeler)
     */
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

    /**
     * Toplu stok ve fiyat güncelleme
     * @param items Güncellenecek ürünler (Max 1000)
     * @returns batchRequestId - İşlem durumu kontrolü için
     */
    async updateBulkStock(items: StockUpdateItem[]): Promise<string> {
        // Maksimum 1000 ürün kontrolü
        if (items.length > 1000) {
            throw new Error(
                `Maksimum 1000 ürün güncellenebilir! Şu an: ${items.length}\n` +
                'Lütfen batch'lere bölün.'
            );
        }

        const url = `${this.config.baseUrl}/product/grocery/suppliers/${this.config.supplierId}/products/price-and-inventory`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    items: items.map(item => ({
                        barcode: item.barcode,
                        quantity: item.quantity,
                        sellingPrice: item.sellingPrice,
                        originalPrice: item.originalPrice || item.sellingPrice,
                        ...(item.storeId && { storeId: item.storeId })
                    }))
                })
            });

            if (!response.ok) {
                const error = await response.text();

                // 15 dakika kuralı hatası
                if (error.includes('15 dakika')) {
                    throw new Error('15 dakika içinde aynı isteği tekrar atamazsınız!');
                }

                throw new Error(`Stok güncellenemedi (${response.status}): ${error}`);
            }

            const result = await response.json();

            console.log(
                `✅ ${items.length} ürün Trendyol GO'ya gönderildi\n` +
                `Batch ID: ${result.batchRequestId}`
            );

            return result.batchRequestId;

        } catch (error: any) {
            console.error('❌ Trendyol GO stok güncellenemedi:', error.message);
            throw error;
        }
    }

    /**
     * Batch işlem durumunu kontrol et
     * Stok güncelleme sonrası başarılı olup olmadığını kontrol eder
     * @param batchRequestId updateBulkStock'tan dönen ID
     */
    async checkBatchStatus(batchRequestId: string): Promise<{
        status: string;
        items: Array<{
            barcode: string;
            status: string;
            failureReasons: string[];
        }>;
    }> {
        const url = `${this.config.baseUrl}/product/grocery/suppliers/${this.config.supplierId}/batch-requests/${batchRequestId}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`Batch status alınamadı: ${response.status}`);
            }

            const data = await response.json();

            // Başarısız ürünleri logla
            const failed = data.items?.filter((item: any) => item.failureReasons?.length > 0);
            if (failed && failed.length > 0) {
                console.warn(`⚠️ ${failed.length} ürün güncellenemedi:`, failed);
            }

            return data;

        } catch (error: any) {
            console.error('❌ Batch status hatası:', error.message);
            throw error;
        }
    }

    /**
     * Barcode ile ürün sorgula
     * @param barcode Ürün barkodu
     * @param storeId Şube ID (zorunlu)
     */
    async getProductByBarcode(barcode: string, storeId?: string): Promise<TrendyolGoProduct | null> {
        const store = storeId || this.config.storeId;

        if (!store) {
            throw new Error('storeId gerekli! Config veya parametre olarak gönderin.');
        }

        const url = `${this.config.baseUrl}/product/grocery/suppliers/${this.config.supplierId}/stores/${store}/products`;

        const params = new URLSearchParams({ barcode });

        try {
            const response = await fetch(`${url}?${params}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                if (response.status === 404) {
                    return null; // Ürün bulunamadı
                }
                throw new Error(`Ürün sorgulanamadı: ${response.status}`);
            }

            const data = await response.json();
            return data.content?.[0] || null;

        } catch (error: any) {
            console.error(`❌ Ürün sorgulanamadı (${barcode}):`, error.message);
            throw error;
        }
    }

    /**
     * Tüm ürünleri listele (filtreli)
     * @param listType ON_SALE, OUT_OF_STOCK, ALL_PRODUCT, NOT_ON_SALE, REJECTED, LOCKED
     * @param storeId Şube ID
     * @param page Sayfa numarası
     * @param size Sayfa başına ürün sayısı
     */
    async getProducts(
        listType: string = 'ON_SALE',
        storeId?: string,
        page: number = 0,
        size: number = 50
    ): Promise<TrendyolGoProduct[]> {
        const store = storeId || this.config.storeId;

        if (!store) {
            throw new Error('storeId gerekli!');
        }

        const url = `${this.config.baseUrl}/product/grocery/suppliers/${this.config.supplierId}/stores/${store}/products`;

        const params = new URLSearchParams({
            listType,
            page: page.toString(),
            size: size.toString()
        });

        try {
            const response = await fetch(`${url}?${params}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`Ürünler alınamadı: ${response.status}`);
            }

            const data = await response.json();
            return data.content || [];

        } catch (error: any) {
            console.error('❌ Ürünler alınamadı:', error.message);
            throw error;
        }
    }

    /**
     * İade siparişlerini çek
     * @param startDate Başlangıç tarihi
     * @param endDate Bitiş tarihi
     * @param status Created, Accepted, Cancelled, Rejected, Unresolved, WaitingInAction
     */
    async getReturns(
        startDate: Date,
        endDate: Date,
        status: string = 'Accepted'
    ): Promise<any[]> {
        const url = `${this.config.baseUrl}/claim/grocery/suppliers/${this.config.supplierId}/claims`;

        const params = new URLSearchParams({
            claimItemStatus: status,
            startDate: startDate.getTime().toString(),
            endDate: endDate.getTime().toString(),
            page: '0',
            size: '50'
        });

        try {
            const response = await fetch(`${url}?${params}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`İadeler alınamadı: ${response.status}`);
            }

            const data = await response.json();
            return data.content || [];

        } catch (error: any) {
            console.error('❌ İadeler alınamadı:', error.message);
            throw error;
        }
    }

    /**
     * Sipariş numarasına göre sipariş detayı al
     * @param orderNumber Trendyol GO sipariş numarası
     */
    async getOrderByNumber(orderNumber: string): Promise<TrendyolGoOrder | null> {
        const url = `${this.config.baseUrl}/order/grocery/suppliers/${this.config.supplierId}/packages/order-number/${orderNumber}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`Sipariş alınamadı: ${response.status}`);
            }

            const data = await response.json();
            return data.content?.[0] || null;

        } catch (error: any) {
            console.error(`❌ Sipariş alınamadı (${orderNumber}):`, error.message);
            throw error;
        }
    }

    /**
     * API bağlantısını test et
     */
    async testConnection(): Promise<boolean> {
        try {
            console.log('🔄 Trendyol GO API bağlantısı test ediliyor...');

            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // Son 24 saat

            await this.getOrders(startDate, endDate);

            console.log('✅ Trendyol GO API bağlantısı başarılı!');
            return true;

        } catch (error: any) {
            console.error('❌ Trendyol GO API bağlantısı başarısız:', error.message);
            return false;
        }
    }

    /**
     * Ürünü satışa kapat (stok = 0)
     * @param barcode Ürün barkodu
     * @param storeId Şube ID (opsiyonel)
     */
    async closeProduct(barcode: string, storeId?: string): Promise<string> {
        console.log(`🔒 Ürün satışa kapatılıyor: ${barcode}`);
        return this.updateStock(barcode, 0, 0, 0, storeId);
    }

    /**
     * Toplu stok güncelleme (1000'den fazla için otomatik batch'leme)
     * @param items Tüm güncellenecek ürünler
     * @returns Tüm batch ID'leri
     */
    async updateBulkStockAuto(items: StockUpdateItem[]): Promise<string[]> {
        const batchSize = 1000;
        const batchIds: string[] = [];

        console.log(`🔄 ${items.length} ürün güncelleniyor (${Math.ceil(items.length / batchSize)} batch)...`);

        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);

            console.log(`📦 Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} ürün`);

            const batchId = await this.updateBulkStock(batch);
            batchIds.push(batchId);

            // Rate limiting için kısa bekleme
            if (i + batchSize < items.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`✅ Toplam ${items.length} ürün ${batchIds.length} batch'te gönderildi`);
        return batchIds;
    }
}

/**
 * Helper: Environment variables'dan client oluştur
 */
export function createTrendyolGoClient(): TrendyolGoClient {
    const supplierId = process.env.TRENDYOL_GO_SUPPLIER_ID;
    const storeId = process.env.TRENDYOL_GO_STORE_ID;
    const agentName = process.env.TRENDYOL_GO_AGENT_NAME;
    const executorUser = process.env.TRENDYOL_GO_EXECUTOR_USER;
    const baseUrl = process.env.TRENDYOL_GO_BASE_URL; // Opsiyonel (STAGE için)

    if (!supplierId || !agentName || !executorUser) {
        throw new Error(
            '❌ Trendyol GO credentials eksik! .env.local dosyasını kontrol edin:\n\n' +
            'TRENDYOL_GO_SUPPLIER_ID=107386\n' +
            'TRENDYOL_GO_STORE_ID=116\n' +
            'TRENDYOL_GO_AGENT_NAME=FirmaAdi_Entegrator\n' +
            'TRENDYOL_GO_EXECUTOR_USER=admin@firmaadiniz.com\n'
        );
    }

    return new TrendyolGoClient({
        supplierId,
        storeId,
        agentName,
        executorUser,
        baseUrl
    });
}

/**
 * Helper: Test ortamı (STAGE) için client oluştur
 */
export function createTrendyolGoClientStage(): TrendyolGoClient {
    const client = createTrendyolGoClient();
    (client as any).config.baseUrl = 'https://stageapi.tgoapis.com/integrator';
    return client;
}
