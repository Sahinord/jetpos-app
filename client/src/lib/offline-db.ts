import Dexie, { Table } from 'dexie';

export interface OfflineProduct {
    id: string;
    name: string;
    barcode: string;
    sale_price: number;
    purchase_price?: number;
    stock_quantity: number;
    category_id?: string;
    unit?: string;
    image_url?: string;
    tenant_id: string;
    warehouse_id: string;
    updated_at: string;
}

export interface OfflineSale {
    id?: number; // Auto-increment for local tracking
    uuid: string; // Original UUID to be sent to Supabase
    tenant_id: string;
    warehouse_id: string;
    employee_id: string;
    customer_id?: string;
    items: any[];
    total_amount: number;
    discount_amount: number;
    payment_type: string;
    created_at: string;
    sync_status: 'pending' | 'syncing' | 'synced' | 'error';
    error_message?: string;
}

export class JetPosOfflineDB extends Dexie {
    products!: Table<OfflineProduct>;
    pending_sales!: Table<OfflineSale>;

    constructor() {
        super('JetPosOfflineDB');
        this.version(1).stores({
            products: 'id, name, barcode, tenant_id, warehouse_id',
            pending_sales: '++id, uuid, tenant_id, sync_status'
        });
    }
}

export const offlineDB = new JetPosOfflineDB();
