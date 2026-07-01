// Hepsiburada Pazaryeri + HepsiJet Kargo Client (JetPOS Mobile)
// Kimlik bilgileri tarayıcıya hiç gelmez — sunucu /api/hepsiburada/* içinde
// tenant'ın kayıtlı ayarlarından kimliği kendisi okur (bkz. lib/hepsiburada-server.ts).

import { apiFetch } from './api';

export interface HepsiburadaOrder {
    orderNumber: string;
    orderDate: string;
    cargoCompany?: string;
    status?: string;
    customerName?: string;
    items?: any[];
    [key: string]: any;
}

export interface HepsiburadaPackage {
    packageNumber: string;
    orderNumber?: string;
    status?: string;
    cargoCompany?: string;
    [key: string]: any;
}

export interface HepsiburadaCategory {
    categoryId: number;
    name: string;
    parentCategoryId?: number;
    paths?: string;
    leaf: boolean;
    status: string;
    available: boolean;
}

export interface HepsiburadaCategoryAttribute {
    id: string;
    name: string;
    mandatory: boolean;
    type: 'string' | 'enum' | string;
    multiValue: boolean;
}

export class HepsiburadaClient {
    async getOrders(beginDate: Date, endDate: Date, page = 0, size = 50): Promise<HepsiburadaOrder[]> {
        const data = await apiFetch('/api/hepsiburada/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                beginDate: formatDate(beginDate),
                endDate: formatDate(endDate),
                page,
                size
            })
        });
        return Array.isArray(data) ? data : (data?.items || data?.data || []);
    }

    async getPackages(opts: { beginDate?: Date; endDate?: Date; onlyUnpacked?: boolean; page?: number; size?: number } = {}): Promise<HepsiburadaPackage[]> {
        const data = await apiFetch('/api/hepsiburada/packages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                beginDate: opts.beginDate ? formatDate(opts.beginDate) : undefined,
                endDate: opts.endDate ? formatDate(opts.endDate) : undefined,
                onlyUnpacked: opts.onlyUnpacked || false,
                page: opts.page ?? 0,
                size: opts.size ?? 50
            })
        });
        return Array.isArray(data) ? data : (data?.items || data?.data || []);
    }

    async getChangeableCargoCompanies(packageNumber: string): Promise<any[]> {
        const data = await apiFetch('/api/hepsiburada/cargo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'list-companies', packageNumber })
        });
        return Array.isArray(data) ? data : (data?.items || data?.data || []);
    }

    async changeCargoCompany(packageNumber: string, cargoCompanyShortCode: string) {
        return apiFetch('/api/hepsiburada/cargo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'change-company', packageNumber, cargoCompanyShortCode })
        });
    }

    async getCargoLabel(packageNumber: string) {
        return apiFetch('/api/hepsiburada/cargo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get-label', packageNumber })
        });
    }

    async markDelivered(packageNumber: string, receivedBy?: string) {
        return apiFetch('/api/hepsiburada/cargo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'mark-delivered', packageNumber, receivedBy })
        });
    }

    // --- Katalog Ürün Girişi ---

    async getCategories(opts: { leaf?: boolean; status?: string; available?: boolean; page?: number; size?: number } = {}): Promise<HepsiburadaCategory[]> {
        const params = new URLSearchParams();
        if (opts.leaf !== undefined) params.set('leaf', String(opts.leaf));
        if (opts.status) params.set('status', opts.status);
        if (opts.available !== undefined) params.set('available', String(opts.available));
        if (opts.page !== undefined) params.set('page', String(opts.page));
        if (opts.size !== undefined) params.set('size', String(opts.size));

        const data = await apiFetch(`/api/hepsiburada/categories?${params.toString()}`);
        return data?.data || [];
    }

    async getCategoryAttributes(categoryId: number | string): Promise<HepsiburadaCategoryAttribute[]> {
        const data = await apiFetch(`/api/hepsiburada/categories/${categoryId}/attributes`);
        return data?.data?.attributes || data?.data || [];
    }

    async getAttributeValues(categoryId: number | string, attributeId: string): Promise<{ id: string; value: string }[]> {
        const data = await apiFetch(`/api/hepsiburada/categories/${categoryId}/attributes/${attributeId}/values`);
        return data?.data || [];
    }

    async getMerchantProducts(opts: { barcode?: string; merchantSku?: string; hbSku?: string; page?: number; size?: number } = {}): Promise<any[]> {
        const params = new URLSearchParams();
        if (opts.barcode) params.set('barcode', opts.barcode);
        if (opts.merchantSku) params.set('merchantSku', opts.merchantSku);
        if (opts.hbSku) params.set('hbSku', opts.hbSku);
        if (opts.page !== undefined) params.set('page', String(opts.page));
        if (opts.size !== undefined) params.set('size', String(opts.size));

        const data = await apiFetch(`/api/hepsiburada/products/merchant-list?${params.toString()}`);
        return data?.data || [];
    }

    async getProductStatus(trackingId: string): Promise<any[]> {
        const data = await apiFetch(`/api/hepsiburada/products/status?trackingId=${encodeURIComponent(trackingId)}`);
        return data?.data || [];
    }

    async submitProducts(products: HepsiburadaProductPayload[]): Promise<{ trackingId: string }> {
        const data = await apiFetch('/api/hepsiburada/products/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ products })
        });
        return { trackingId: data?.data?.trackingId || data?.trackingId };
    }

    /**
     * Hızlı Ürün Yükleme — sadece HB kataloğunda barkodla ZATEN KAYITLI olan
     * ürünler için (kategori/özellik eşleştirmeye gerek yok). Kayıtlı değilse
     * bu metod ürünü yüklemez, submitProducts() (Ürün Bilgisi Gönderme) kullanılmalı.
     */
    async fastListProducts(products: HepsiburadaFastListPayload[]): Promise<any> {
        return apiFetch('/api/hepsiburada/products/fastlisting', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ products })
        });
    }
}

// "Ürün Bilgisi Gönderme" JSON dosya şeması (resmi dokümandan, birebir) —
// categoryId/merchant dışındaki TÜM alanlar (merchantSku, UrunAdi, price,
// Image1.. dahil) attributes objesinin İÇİNDE gönderilmeli.
export interface HepsiburadaProductPayload {
    categoryId: number;
    merchant?: string;
    attributes: {
        merchantSku: string;
        VaryantGroupID: string;
        UrunAdi: string;
        UrunAciklamasi: string;
        Barcode: string;
        Marka: string;
        kg?: string;
        price: string;
        stock: string;
        Image1?: string;
        Image2?: string;
        Image3?: string;
        Image4?: string;
        Image5?: string;
        [key: string]: any;
    };
}

export interface HepsiburadaFastListPayload {
    merchant?: string;
    merchantSku: string;
    productName: string;
    barcode?: string;
    hbSku?: string;
    stock?: string;
    price?: string;
    itemOrderID?: number;
}

function formatDate(d: Date): string {
    // Hepsiburada Order API "yyyy-MM-dd HH:mm" formatı bekliyor.
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
