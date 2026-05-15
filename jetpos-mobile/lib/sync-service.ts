import { supabase } from './supabase';
import { offlineDB } from './offline-db';

export class SyncService {
    static isOnline(): boolean {
        return typeof window !== 'undefined' ? window.navigator.onLine : true;
    }

    static async pullProducts() {
        if (!this.isOnline()) return;

        const tenantId = localStorage.getItem('tenantId');
        if (!tenantId) return;

        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('tenant_id', tenantId)
                .eq('status', 'active');

            if (error) throw error;

            if (data) {
                // Use bulkPut instead of clear + bulkAdd to prevent primary key conflicts
                // and provide a more robust "Upsert" mechanism.
                await offlineDB.products.bulkPut(data.map(p => ({
                    ...p,
                    tenant_id: tenantId
                })));
                console.log('📦 Mobile: Products synced to local DB (Upsert)');
            }
        } catch (err) {
            console.error('Mobile Product Sync Error:', err);
        }
    }

    static async pushPendingSales() {
        if (!this.isOnline()) return;

        const pending = await offlineDB.pending_sales
            .where('sync_status')
            .equals('pending')
            .toArray();

        if (pending.length === 0) return;

        console.log(`📡 Mobile: Syncing ${pending.length} pending sales...`);

        for (const sale of pending) {
            try {
                await offlineDB.pending_sales.update(sale.id!, { sync_status: 'syncing' });

                // Use the POS Invoice RPC for consistency
                const invoiceData = {
                    invoice_number: `PER-OFF-${sale.uuid.slice(0,8)}`,
                    invoice_type: 'retail',
                    invoice_date: sale.created_at.split('T')[0],
                    cari_id: sale.customer_id || null,
                    cari_name: 'Offline Satış',
                    grand_total: sale.total_amount,
                    subtotal: sale.total_amount / 1.2,
                    total_vat: sale.total_amount - (sale.total_amount / 1.2),
                    payment_status: 'paid',
                    status: 'approved',
                    notes: `Mobil Offline Satış - ${sale.payment_type}`
                };

                const itemsData = sale.items.map((item: any) => ({
                    product_id: item.product_id,
                    item_name: item.item_name || 'Ürün',
                    item_code: item.item_code || '',
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    line_total: item.total_price,
                    vat_rate: 20
                }));

                const { error } = await supabase.rpc('create_pos_invoice', {
                    p_tenant_id: sale.tenant_id,
                    p_invoice_data: invoiceData,
                    p_items_data: itemsData
                });

                if (error) throw error;

                await offlineDB.pending_sales.delete(sale.id!);
                console.log(`✅ Mobile: Sale ${sale.uuid} synced.`);

            } catch (err) {
                console.error(`❌ Mobile: Sync failed for ${sale.uuid}:`, err);
                await offlineDB.pending_sales.update(sale.id!, { sync_status: 'pending' });
            }
        }
    }

    static initAutoSync() {
        if (typeof window === 'undefined') return;

        // Sync on start
        this.pushPendingSales();

        // Listen for online status
        window.addEventListener('online', () => {
            this.pushPendingSales();
        });

        // Periodic sync attempt
        setInterval(() => {
            this.pushPendingSales();
        }, 30000);
    }
}
