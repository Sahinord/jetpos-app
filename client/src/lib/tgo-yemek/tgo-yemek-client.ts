// Uber Eats · Trendyol Go — YEMEK (restoran) API Client
// Aynı platform/aynı Basic auth: grocery client'ıyla (trendyol-go-client.ts) birebir
// paralel. Fark: path segmenti 'food' ve restoran sipariş yaşam döngüsü.
//
// ⚠️ TEYİT EDİLECEK — developers.tgoapps.com Yemek dokümanı JS-render olduğundan
//    aşağıdaki ENDPOINT path'leri ve STATUS_ACTIONS değerleri grocery deseninden
//    türetildi. Chrome/doküman erişimi olunca TGO_ENDPOINTS + STATUS_ACTIONS
//    tek yerden doğrulanıp düzeltilecek (client kullanımına dokunmadan).

export interface TgoYemekStore {
    storeId: string;          // restoran/mağaza anahtarı (bizim tarafta ayrıştırma)
    name?: string;
    // Aşağıdakiler boşsa tenant seviyesindekiler kullanılır (per-store override):
    sellerId?: string;
    apiKey?: string;
    apiSecret?: string;
    active?: boolean;
}

export interface TgoYemekConfig {
    sellerId: string;         // tedarikçi (supplier) id
    apiKey: string;
    apiSecret: string;
    agentName: string;        // entegrasyon referans kodu
    token?: string;           // hazır base64 verildiyse
    storeId?: string;         // aktif mağaza (paket filtreleme)
    isStage?: boolean;
    baseUrl?: string;
}

export interface TgoYemekPackage {
    id: string;
    orderNumber?: string;
    orderDate?: number;
    packageStatus?: string;
    storeId?: string;
    customer?: { firstName?: string; lastName?: string; name?: string; note?: string };
    lines?: Array<{
        name?: string;
        productName?: string;
        quantity?: number;
        price?: number;
        modifierProducts?: unknown[];
    }>;
    totalPrice?: number;
}

// JetPos içi aksiyon adı → TGO durum geçişi.
// (endpoint alt-path'leri sitemap'teki ymk-* uçlarından türetildi, TEYİT bekliyor)
export type TgoYemekAction = "accept" | "preparing" | "ready" | "onway" | "delivered" | "cancel";

export const STATUS_ACTIONS: Record<TgoYemekAction, { path: string; body?: Record<string, unknown> }> = {
    // siparişi kabul et (ymk-siparisi-kabul-etme)
    accept:    { path: "picked" },
    // hazırlığa başla / hazırlanıyor (mağaza içi; TGO'da ayrı statü yoksa no-op olabilir)
    preparing: { path: "preparing" },
    // hazırlığın bitmesi (ymk-siparis-hazirliginin-bitmesi)
    ready:     { path: "prepared" },
    // yola çıkması (ymk-siparisin-yola-cikmasi)
    onway:     { path: "handover" },
    // teslim edilmesi (ymk-siparisin-teslim-edilmesi)
    delivered: { path: "delivered" },
    // iptal (ymk-siparis-iptali)
    cancel:    { path: "unsupplied" },
};

// JetPos içi durum karşılığı (DB status kolonu)
export const ACTION_TO_STATUS: Record<TgoYemekAction, string> = {
    accept: "accepted",
    preparing: "preparing",
    ready: "ready",
    onway: "on_way",
    delivered: "delivered",
    cancel: "cancelled",
};

function resolveBase(cfg: TgoYemekConfig): string {
    if (cfg.baseUrl) return cfg.baseUrl.replace(/\/+$/, "");
    return cfg.isStage
        ? "https://stageapi.tgoapis.com/integrator"
        : "https://api.tgoapis.com/integrator";
}

export class TgoYemekClient {
    private cfg: TgoYemekConfig;
    private base: string;
    // ⚠️ TEYİT: yemek path segmenti
    private static readonly SEG = "food";

    constructor(cfg: TgoYemekConfig) {
        this.cfg = cfg;
        this.base = resolveBase(cfg);
    }

    private headers(): Record<string, string> {
        const apiKey = (this.cfg.apiKey || "").trim();
        const apiSecret = (this.cfg.apiSecret || "").trim();
        const h: Record<string, string> = {
            "x-agentname": this.cfg.agentName,
            "x-executor-user": String(this.cfg.sellerId),
            "User-Agent": `${this.cfg.sellerId} - ${this.cfg.agentName}`,
            "Content-Type": "application/json",
        };
        if (this.cfg.token) h["Authorization"] = `Basic ${this.cfg.token}`;
        else if (apiKey && apiSecret) {
            h["Authorization"] = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`;
        }
        return h;
    }

    private async request(url: string, method = "GET", data?: unknown, retries = 2): Promise<any> {
        let lastErr: Error | null = null;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const res = await fetch(url, {
                    method,
                    headers: this.headers(),
                    body: data ? JSON.stringify(data) : undefined,
                    signal: AbortSignal.timeout(15000),
                });
                if (!res.ok) {
                    const text = await res.text();
                    const isHtml = text.trim().startsWith("<!") || text.trim().startsWith("<html");
                    if (res.status >= 500 && attempt < retries) {
                        await new Promise(r => setTimeout(r, Math.min(2000 * 2 ** attempt, 8000)));
                        continue;
                    }
                    let msg = `TGO Yemek API hatası (HTTP ${res.status})`;
                    if (!isHtml) {
                        try { msg = JSON.parse(text)?.message || msg; } catch { msg = text.slice(0, 200) || msg; }
                    }
                    console.error(`[tgo-yemek] ${res.status} ${method} ${url.split("?")[0]}: ${msg}`);
                    throw new Error(msg);
                }
                const t = await res.text();
                return t ? JSON.parse(t) : {};
            } catch (err: any) {
                lastErr = err;
                if ((err.name === "TimeoutError" || err.name === "AbortError") && attempt < retries) {
                    await new Promise(r => setTimeout(r, Math.min(2000 * 2 ** attempt, 8000)));
                    continue;
                }
                if (attempt >= retries) break;
            }
        }
        throw lastErr || new Error("TGO Yemek isteği başarısız");
    }

    /** Sipariş paketlerini çek (ymk-siparis-paketlerini-cekme). */
    async getPackages(startDate: Date, endDate: Date, status?: string): Promise<TgoYemekPackage[]> {
        const url = `${this.base}/order/${TgoYemekClient.SEG}/suppliers/${this.cfg.sellerId}/packages`;
        const params = new URLSearchParams({
            startDate: startDate.getTime().toString(),
            endDate: endDate.getTime().toString(),
            page: "0",
            size: "200",
        });
        if (status) params.append("packageStatuses", status);
        if (this.cfg.storeId) params.append("storeId", this.cfg.storeId);
        const data = await this.request(`${url}?${params}`);
        return data.content || data.orders || [];
    }

    /** Sipariş durumunu güncelle (kabul/hazır/yola çıktı/teslim/iptal). */
    async updateStatus(packageId: string, action: TgoYemekAction): Promise<any> {
        const a = STATUS_ACTIONS[action];
        // ⚠️ TEYİT: alt-path ve HTTP metodu doc'tan doğrulanacak (çoğu geçiş PUT).
        const url = `${this.base}/order/${TgoYemekClient.SEG}/suppliers/${this.cfg.sellerId}/packages/${packageId}/${a.path}`;
        return this.request(url, "PUT", a.body);
    }

    /** Faturayı TGO'ya bildir (ymk-fatura-besleme). */
    async uploadInvoice(packageId: string, invoice: { invoiceNumber: string; invoiceLink: string; invoiceDateTime: number }): Promise<any> {
        const url = `${this.base}/order/${TgoYemekClient.SEG}/suppliers/${this.cfg.sellerId}/packages/${packageId}/invoice`;
        return this.request(url, "POST", invoice);
    }

    async testConnection(): Promise<boolean> {
        try {
            const end = new Date();
            const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
            await this.getPackages(start, end);
            return true;
        } catch (e: any) {
            console.error("[tgo-yemek] bağlantı testi hatası:", e?.message);
            return false;
        }
    }
}
