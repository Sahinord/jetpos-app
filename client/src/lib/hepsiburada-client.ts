// Hepsiburada Pazaryeri + HepsiJet Kargo Client (JetPOS Desktop)
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
}

function formatDate(d: Date): string {
    // Hepsiburada Order API "yyyy-MM-dd HH:mm" formatı bekliyor.
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
