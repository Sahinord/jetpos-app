// Trendyol & Trendyol GO Hybrid Client for JetPOS Mobile
// CORS hatalarını aşmak için internal API proxy kullanır

export interface TrendyolOrder {
    orderNumber: string;
    orderDate: number;
    customerFirstName?: string;
    customerLastName?: string;
    customer?: { firstName: string; lastName: string }; // GO yapısı
    totalPrice: number;
    status: string;
    packageStatus?: string; // GO yapısı
    lines: Array<{
        barcode: string;
        productName?: string;
        product?: { name: string }; // GO yapısı
        quantity?: number;
        amount?: number; // GO yapısı
        price: number;
    }>;
}

export class TrendyolClient {
    private config: any;
    private type: 'trendyol' | 'trendyol_go';

    constructor(config: any, type: 'trendyol' | 'trendyol_go' = 'trendyol') {
        this.config = config;
        this.type = type;
    }

    /**
     * Siparişleri çek (Internal Proxy API üzerinden)
     */
    async getOrders(
        startDate: Date,
        endDate: Date,
        status?: string
    ): Promise<TrendyolOrder[]> {
        try {
            const response = await fetch('/api/trendyol/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: this.type,
                    apiKey: this.config.apiKey,
                    apiSecret: this.config.apiSecret,
                    supplierId: this.config.supplierId,
                    sellerId: this.config.sellerId,
                    storeId: this.config.storeId,
                    agentName: this.config.agentName,
                    isStage: this.config.stage,
                    startDate: startDate.getTime(),
                    endDate: endDate.getTime(),
                    status
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Bağlantı hatası (${response.status})`);
            }

            const rawData = await response.json();
            
            // Veri yapılarını normalize et
            return rawData.map((order: any) => ({
                ...order,
                customerFirstName: order.customerFirstName || order.customer?.firstName || 'Müşteri',
                customerLastName: order.customerLastName || order.customer?.lastName || '',
                status: order.status || order.packageStatus || 'Bilinmiyor',
                lines: (order.lines || []).map((line: any) => ({
                    ...line,
                    productName: line.productName || line.product?.name || 'Ürün',
                    quantity: line.quantity || line.amount || 1
                }))
            }));

        } catch (error: any) {
            console.error(`❌ ${this.type} siparişleri alınamadı (Proxy):`, error.message);
            throw error;
        }
    }

    /**
     * API bağlantısını test et
     */
    async testConnection(): Promise<boolean> {
        try {
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
            await this.getOrders(startDate, endDate);
            return true;
        } catch (error) {
            return false;
        }
    }
}
