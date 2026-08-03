// ══════════════════════════════════════════════════════════════════════
//  Getir Çarşı (market/bakkal dikeyi) — OUTBOUND API Client
//  Doküman: "Getir Çarşı API Dokümanı" V1.05
//
//  Akış:
//   1) POST /v1/auth/token  (Basic Auth: username:password) → token (1 saat)
//   2) Diğer tüm çağrılarda  Authorization: Bearer <token>
//   3) User-Agent = entegratör firma adı (agentName)
//
//  Sipariş yaşam döngüsü (endpointler /v1/orders/{orderId}/shop/{shopId}/...):
//   - GET  /v1/orders/unapproved                → onay bekleyen (status 400)
//   - GET  /v1/orders/cancelled                 → iptaller (24 saatte silinir)
//   - POST .../verify                           → onayla (400 → 500 Hazırlanıyor)
//   - POST .../prepare  (body {updatedProducts})→ dt1: Hazırlandı · dt2: Müşteriye gidiyor
//   - POST .../handover                         → dt1: Müşteriye gidiyor
//   - POST .../deliver                          → dt2: Başarılı sipariş
//   - GET  .../cancel-options                   → geçerli iptal nedenleri
//   - POST .../cancel   (body {cancelReasonId}) → iptal
//
//  Stok/Fiyat (bireysel işletme, getirId ile):
//   - POST /v1/products/price-and-quantity      → max 1000 ürün/istek
//   - GET  /v1/products/price-and-quantity/batch-requests/{id}
//   - GET  /v1/shops/{shopId}/products          → ürün kartlarını çek (eşleme)
//   - POST /v1/shops/{shopId}/working-status    → işletme aç/kapat
//
//  Güvenlik: username/password YALNIZCA token almak için kullanılır, hiçbir
//  yere loglanmaz. Kimlik env/DB'den gelir (creds.ts).
// ══════════════════════════════════════════════════════════════════════

const TEST_BASE = "https://locals-integration-api-gateway.artisandev.getirapi.com";
const PROD_BASE = "https://locals-integration-api-gateway.artisan.getirapi.com";

export interface GetirCarsiConfig {
    username: string;
    password: string;
    shopId: string;
    agentName?: string;   // User-Agent (entegratör firma adı)
    isStage?: boolean;    // true → test ortamı (artisandev)
    baseUrl?: string;     // override
}

// Sipariş teslimat modeli
export type DeliveryType = 1 | 2; // 1=Getir Getirsin, 2=İşletme Getirsin

// JetPos içi aksiyon → Getir endpoint segmenti
export type GetirCarsiAction = "verify" | "prepare" | "handover" | "deliver" | "cancel";

// Getir sipariş statü kodları (doküman "Sipariş Statüleri")
export const GETIR_STATUS = {
    PENDING: 400,      // İşletme Onayı Bekliyor
    PREPARING: 500,    // Hazırlanıyor
    PREPARED: 550,     // Hazırlandı / Yola Çıktı
    HANDED_RUNNER: 560,
    AT_RUNNER: 570,
    HANDED_COURIER: 600,
    COURIER_ONWAY: 700,
    COURIER_ARRIVED: 800,
    DELIVERED: 900,
    CANCELLED_ADMIN: 1500,
    CANCELLED_SHOP: 1600,
} as const;

export const CANCELLED_CODES = new Set<number>([1500, 1600]);

// price-and-quantity ürün satırı
export interface GetirPriceQtyItem {
    getirId: string;
    price: number;            // güncel satış fiyatı
    oldPrice?: number | null; // üzeri çizili fiyat; boşsa gösterilmez. price'tan BÜYÜK olmalı
    quantity: number;         // 0 = ürünü kapat (stokta yok)
    maxCellCount?: number;    // sepette max satılabilir adet (integer, 0 gönderilmez)
}

// Getir siparişi (toleranslı — şema sürümüne göre alanlar değişebilir)
export interface GetirCarsiOrder {
    id?: string;
    orderId?: string;
    confirmationId?: string;
    shopId?: string;
    status?: number;
    deliveryType?: number;
    totalPrice?: number;
    maxTotalPrice?: number;
    client?: { name?: string; contactName?: string };
    products?: unknown[];
    [k: string]: unknown;
}

function resolveBase(cfg: GetirCarsiConfig): string {
    if (cfg.baseUrl) return cfg.baseUrl.replace(/\/+$/, "");
    return cfg.isStage ? TEST_BASE : PROD_BASE;
}

export class GetirCarsiClient {
    private cfg: GetirCarsiConfig;
    private base: string;
    private token: string | null = null;
    private tokenExpiry = 0; // epoch ms

    constructor(cfg: GetirCarsiConfig) {
        this.cfg = cfg;
        this.base = resolveBase(cfg);
    }

    private ua(): string {
        return this.cfg.agentName || "JetPos";
    }

    // ── Token al (Basic Auth). 1 saat geçerli; 5 dk marjla cache. ──
    private async ensureToken(): Promise<string> {
        const now = Date.now();
        if (this.token && now < this.tokenExpiry) return this.token;

        const user = (this.cfg.username || "").trim();
        const pass = (this.cfg.password || "").trim();
        if (!user || !pass) throw new Error("Getir Çarşı kullanıcı adı/şifre eksik.");

        const basic = Buffer.from(`${user}:${pass}`).toString("base64");
        const res = await fetch(`${this.base}/v1/auth/token`, {
            method: "POST",
            headers: {
                Authorization: `Basic ${basic}`,
                "User-Agent": this.ua(),
                "Content-Type": "application/json",
            },
            signal: AbortSignal.timeout(15000),
        });

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            // Kimlik değerlerini ASLA loglama
            console.error(`[getir-carsi] token HTTP ${res.status}`);
            let msg = `Getir Çarşı token alınamadı (HTTP ${res.status})`;
            if (res.status === 401) msg += " — kullanıcı adı/şifre hatalı ya da şifre henüz /v1/suppliers/password/reset ile yenilenmedi.";
            else if (text && !text.trim().startsWith("<")) { try { msg = JSON.parse(text)?.message || msg; } catch { /* yut */ } }
            throw new Error(msg);
        }

        const data = await res.json().catch(() => ({} as any));
        // Şema toleransı: token birçok yerden gelebilir
        const token =
            data?.token || data?.accessToken || data?.access_token ||
            data?.data?.token || data?.data?.accessToken || data?.jwt;
        if (!token) throw new Error("Getir Çarşı token yanıtı beklenmeyen formatta.");
        this.token = String(token);
        // Doküman: 1 saat. 5 dk marj bırak.
        this.tokenExpiry = now + 55 * 60 * 1000;
        return this.token;
    }

    // ── Genel istek (token'lı, retry'lı) ──
    private async request(path: string, method = "GET", body?: unknown, retries = 2): Promise<any> {
        let lastErr: Error | null = null;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const token = await this.ensureToken();
                const res = await fetch(`${this.base}${path}`, {
                    method,
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "User-Agent": this.ua(),
                        "Content-Type": "application/json",
                    },
                    body: body !== undefined ? JSON.stringify(body) : undefined,
                    signal: AbortSignal.timeout(20000),
                });

                if (res.status === 401) {
                    // token düşmüş olabilir — bir kez tazele
                    this.token = null;
                    if (attempt < retries) continue;
                }
                if (!res.ok) {
                    const text = await res.text().catch(() => "");
                    const isHtml = text.trim().startsWith("<");
                    if (res.status >= 500 && attempt < retries) {
                        await new Promise(r => setTimeout(r, Math.min(2000 * 2 ** attempt, 8000)));
                        continue;
                    }
                    let msg = `Getir Çarşı API hatası (HTTP ${res.status})`;
                    if (!isHtml && text) { try { msg = JSON.parse(text)?.meta?.["return-message"] || JSON.parse(text)?.message || msg; } catch { msg = text.slice(0, 200) || msg; } }
                    console.error(`[getir-carsi] ${res.status} ${method} ${path.split("?")[0]}`);
                    throw new Error(msg);
                }
                const t = await res.text();
                return t ? JSON.parse(t) : {};
            } catch (err: any) {
                lastErr = err;
                if ((err?.name === "TimeoutError" || err?.name === "AbortError") && attempt < retries) {
                    await new Promise(r => setTimeout(r, Math.min(2000 * 2 ** attempt, 8000)));
                    continue;
                }
                if (attempt >= retries) break;
            }
        }
        throw lastErr || new Error("Getir Çarşı isteği başarısız");
    }

    // Yanıt gövdesinden sipariş listesini toleranslı çıkar
    private extractOrders(data: any): GetirCarsiOrder[] {
        if (Array.isArray(data)) return data;
        return data?.data?.orders || data?.orders || data?.data || data?.content || [];
    }

    // ── Onay bekleyen siparişler (rate-limit muaf) ──
    async getUnapproved(): Promise<GetirCarsiOrder[]> {
        const data = await this.request(`/v1/orders/unapproved`);
        return this.extractOrders(data);
    }

    // ── İptal edilen siparişler (rate-limit muaf) ──
    async getCancelled(): Promise<GetirCarsiOrder[]> {
        const data = await this.request(`/v1/orders/cancelled`);
        return this.extractOrders(data);
    }

    // ── Tek sipariş detayı ──
    async getOrder(orderId: string): Promise<GetirCarsiOrder | null> {
        const data = await this.request(`/v1/orders/${encodeURIComponent(orderId)}`);
        return (data?.data || data) as GetirCarsiOrder;
    }

    private orderPath(orderId: string, seg: string): string {
        const shop = encodeURIComponent(this.cfg.shopId);
        return `/v1/orders/${encodeURIComponent(orderId)}/shop/${shop}/${seg}`;
    }

    // ── Onayla (400 → 500 Hazırlanıyor) ──
    async verify(orderId: string): Promise<any> {
        return this.request(this.orderPath(orderId, "verify"), "POST");
    }

    // ── Hazırla (dt1: Hazırlandı · dt2: Müşteriye gidiyor).
    //    updatedProducts boş [] → revizyon yok. Doluysa adet/fiyat revizyonu. ──
    async prepare(orderId: string, updatedProducts: unknown[] = []): Promise<any> {
        return this.request(this.orderPath(orderId, "prepare"), "POST", { updatedProducts });
    }

    // ── Kuryeye teslim (dt1) ──
    async handover(orderId: string): Promise<any> {
        return this.request(this.orderPath(orderId, "handover"), "POST");
    }

    // ── Müşteriye teslim (dt2) ──
    async deliver(orderId: string): Promise<any> {
        return this.request(this.orderPath(orderId, "deliver"), "POST");
    }

    // ── İptal nedenleri (statüye göre değişir; iptalden önce sorgulanmalı) ──
    async cancelOptions(orderId: string): Promise<any[]> {
        const data = await this.request(this.orderPath(orderId, "cancel-options"));
        return data?.data || data?.options || data || [];
    }

    // ── İptal (cancelReasonId zorunlu) ──
    async cancel(orderId: string, cancelReasonId: string): Promise<any> {
        return this.request(this.orderPath(orderId, "cancel"), "POST", { cancelReasonId });
    }

    // ── Fatura linki bildir ──
    async invoiceLink(orderId: string, invoiceLink: string): Promise<any> {
        return this.request(`/v1/orders/${encodeURIComponent(orderId)}/invoice-link`, "POST", { invoiceLink });
    }

    // ── Ürün kartlarını çek (eşleme için, bireysel işletme) ──
    async getShopProducts(): Promise<any[]> {
        const data = await this.request(`/v1/shops/${encodeURIComponent(this.cfg.shopId)}/products`);
        return data?.data?.products || data?.products || data?.data || data?.content || [];
    }

    // ── Stok/Fiyat/Max satış adedi güncelle (bireysel işletme, getirId; max 1000) ──
    async pushPriceAndQuantity(products: GetirPriceQtyItem[]): Promise<any> {
        if (products.length === 0) return { skipped: true };
        if (products.length > 1000) throw new Error("Tek istekte en fazla 1000 ürün gönderilebilir.");
        return this.request(`/v1/products/price-and-quantity`, "POST", { products });
    }

    // ── Batch güncelleme durumunu sorgula ──
    async batchStatus(batchRequestId: string): Promise<any> {
        return this.request(`/v1/products/price-and-quantity/batch-requests/${encodeURIComponent(batchRequestId)}`);
    }

    // ── İşletmeyi aç/kapat (working=true/false) ──
    async setWorkingStatus(isOpen: boolean): Promise<any> {
        return this.request(`/v1/shops/${encodeURIComponent(this.cfg.shopId)}/working-status`, "PUT", { workingStatus: isOpen });
    }

    // ── Bağlantı testi (token alabiliyor muyuz) ──
    async testConnection(): Promise<{ ok: boolean; error?: string }> {
        try {
            await this.ensureToken();
            return { ok: true };
        } catch (e: any) {
            return { ok: false, error: e?.message || "bilinmeyen hata" };
        }
    }
}
