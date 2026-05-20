import { supabase } from './supabase';
import { offlineDB, OfflineSale } from './offline-db';

export class SyncService {
    private static isSyncing = false;

    /**
     * İnternet durumunu kontrol et
     */
    static isOnline(): boolean {
        return typeof window !== 'undefined' ? window.navigator.onLine : true;
    }

    /**
     * Tüm ürünleri yerel veritabanına indir
     */
    static async pullProducts(tenantId: string, warehouseId: string) {
        if (!this.isOnline()) return;

        try {
            console.log('🔄 Ürünler yerel hafızaya çekiliyor...');
            
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('tenant_id', tenantId);

            if (error) throw error;

            if (data) {
                // Mevcutları temizle veya güncelle
                await offlineDB.products.clear();
                await offlineDB.products.bulkPut(data);
                console.log(`✅ ${data.length} ürün yerel hafızaya kaydedildi.`);
            }
        } catch (err) {
            console.error('❌ Ürün çekme hatası:', err);
        }
    }

    /**
     * Bekleyen satışları Supabase'e gönder
     */
    static async pushPendingSales() {
        if (this.isSyncing || !this.isOnline()) return;

        const pending = await offlineDB.pending_sales
            .where('sync_status')
            .equals('pending')
            .toArray();

        if (pending.length === 0) return;

        this.isSyncing = true;
        console.log(`📤 ${pending.length} bekleyen satış senkronize ediliyor...`);

        for (const sale of pending) {
            try {
                await offlineDB.pending_sales.update(sale.id!, { sync_status: 'syncing' });

                // Calculate profit for the sale (online calculation)
                const totalCost = sale.items.reduce((sum: number, item: any) => sum + (item.purchase_price || 0) * item.quantity, 0);

                // Satışı ana tabloya ekle
                const { data: saleData, error: saleError } = await supabase
                    .from('sales')
                    .insert([{
                        id: sale.uuid,
                        tenant_id: sale.tenant_id,
                        warehouse_id: sale.warehouse_id,
                        employee_id: sale.employee_id,
                        customer_id: sale.customer_id,
                        total_amount: sale.total_amount,
                        total_profit: sale.total_amount - totalCost,
                        payment_method: sale.payment_type,
                        created_at: sale.created_at
                    }])
                    .select()
                    .single();

                if (saleError) throw saleError;

                // Satış kalemlerini ekle
                const { error: itemsError } = await supabase
                    .from('sale_items')
                    .insert(sale.items.map(item => ({
                        sale_id: sale.uuid,
                        product_id: item.product_id,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        total_price: item.total_price,
                        tenant_id: sale.tenant_id
                    })));

                if (itemsError) throw itemsError;

                // CRM Entegrasyonu (Veresiye ise)
                if (sale.payment_type === 'VERESİYE' && sale.customer_id) {
                    await supabase.from('cari_hareketler').insert([{
                        tenant_id: sale.tenant_id,
                        cari_id: sale.customer_id,
                        hareket_tipi: 'SATIS',
                        tarih: sale.created_at,
                        belge_no: `POS-${sale.uuid.slice(0,8)}`,
                        aciklama: `Offline Satış (Senkronize edildi)`,
                        borc: sale.total_amount,
                        alacak: 0
                    }]);
                }

                // Başarılı ise yerelden temizle
                await offlineDB.pending_sales.delete(sale.id!);

            } catch (err: any) {
                console.error(`❌ Satış senkronize edilemedi (${sale.uuid}):`, err.message);
                await offlineDB.pending_sales.update(sale.id!, { 
                    sync_status: 'error',
                    error_message: err.message 
                });
            }
        }

        this.isSyncing = false;
        console.log('✅ Senkronizasyon tamamlandı.');
    }

    /**
     * Otomatik senkronizasyon dinleyicisi
     */
    static initAutoSync() {
        if (typeof window === 'undefined') return;

        window.addEventListener('online', () => {
            console.log('🌐 İnternet geldi, senkronizasyon başlıyor...');
            this.pushPendingSales();
        });

        // Periyodik kontrol (isteğe bağlı)
        setInterval(() => {
            if (this.isOnline()) this.pushPendingSales();
        }, 30000); // 30 saniyede bir
    }
}
