import Dexie, { Table } from 'dexie';

export interface OfflineProduct {
    id: string;
    name: string;
    barcode: string;
    sale_price: number;
    purchase_price: number;
    stock_quantity: number;
    category_id?: string;
    image_url?: string;
    unit?: string;
    vat_rate?: number;
    warehouse_id?: string;
    tenant_id: string;
}

export interface PendingSale {
    id?: number;
    uuid: string;
    tenant_id: string;
    warehouse_id: string;
    employee_id?: string;
    customer_id?: string;
    items: any[];
    total_amount: number;
    discount_amount: number;
    payment_type: string;
    created_at: string;
    sync_status: 'pending' | 'syncing' | 'synced';
}

export class JetPosOfflineDB extends Dexie {
    products!: Table<OfflineProduct>;
    pending_sales!: Table<PendingSale>;

    constructor() {
        super('JetPosMobileOfflineDB');
        this.version(1).stores({
            products: 'id, barcode, name, category_id, tenant_id',
            pending_sales: '++id, uuid, tenant_id, sync_status'
        });
    }
}

export const offlineDB = new JetPosOfflineDB();
