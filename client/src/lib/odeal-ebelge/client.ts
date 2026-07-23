import type { InvoiceData, InvoiceResult, DocumentStatus } from "@/lib/invoice-providers/types";
import { generateUBL } from "@/lib/qnb/ubl-builder";

/**
 * Ödeal e-Belge (e-Fatura / e-Arşiv / e-İrsaliye) REST istemcisi.
 * POS dışı (online/cihazsız) satışlarda belge kesimi için.
 *
 * MİMARİ (Ödeal e-Belge doküman + API Bilgileri.docx'ten teyitli):
 *   1. Login  → POST {base}/api/login  → jwt token
 *   2. Fatura → POST {base}/api/ubl-restapi
 *              { jwt, method:"saveInvoiceUBL", invoice: base64(UBL-TR XML), responseObject:"1" }
 *              → { StatusCode:"200", Result:<belgeUUID>, Success:true }
 *   3. İşletme kaydı → method:"addTaxpayer" (her işletmenin VKN'sini entegratör
 *      "1997" altına açar; per-tenant e-belge için — TEST'te atlanır, test hesabı VKN kullanılır)
 *
 * UBL XML'i mevcut generateUBL(invoiceData, erpCode, vkn) ile üretilir (QNB ile ortak).
 * Kimlik ASLA koda gömülmez — env / tenant ayarından gelir.
 */

export interface OdealEbelgeConfig {
    username?: string;
    password?: string;
    vkn?: string;            // Belgeyi kesen işletmenin VKN'si (test: test hesabı VKN'si)
    erpCode?: string;
    baseUrl?: string;
    environment?: "stage" | "prod";
}

const STAGE_BASE = "https://fatura-stg.odeal.com";
const PROD_BASE = "https://fatura.odeal.com";

export class OdealEbelgeClient {
    private base: string;
    private username: string;
    private password: string;
    private vkn: string;
    private erpCode: string;
    private token: string | null = null;
    private tokenAt = 0;
    private configured: boolean;

    constructor(config?: OdealEbelgeConfig) {
        const c = config || {};
        this.username = c.username || process.env.ODEAL_EBELGE_USERNAME || "";
        this.password = c.password || process.env.ODEAL_EBELGE_PASSWORD || "";
        this.vkn = c.vkn || process.env.ODEAL_EBELGE_VKN || "";
        this.erpCode = c.erpCode || process.env.ODEAL_EBELGE_ERP_CODE || "JETPOS";
        this.base = (c.baseUrl || process.env.ODEAL_EBELGE_BASE_URL ||
            (c.environment === "prod" ? PROD_BASE : STAGE_BASE)).replace(/\/+$/, "");
        this.configured = !!(this.username && this.password);
    }

    /** Login → jwt token (1 saat cache). */
    private async getToken(): Promise<string | null> {
        const now = Date.now();
        if (this.token && now - this.tokenAt < 55 * 60 * 1000) return this.token;
        try {
            const res = await fetch(`${this.base}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: this.username, password: this.password }),
            });
            const json: any = await res.json().catch(() => null);
            // token alanı: doküman "Login'den alınan token" diyor; yaygın alanlar denenir
            const tok = json?.jwt || json?.token || json?.Result || json?.access_token || json?.data?.token;
            if (!tok) { console.error("[odeal-ebelge] login token alınamadı:", res.status); return null; }
            this.token = String(tok);
            this.tokenAt = now;
            return this.token;
        } catch (e) {
            console.error("[odeal-ebelge] login hatası:", (e as Error)?.message);
            return null;
        }
    }

    /** ubl-restapi'ye method-dispatch istek. */
    private async ublApi(method: string, extra: Record<string, unknown>): Promise<any> {
        const jwt = await this.getToken();
        if (!jwt) throw new Error("Ödeal e-Belge login başarısız (token yok).");
        const res = await fetch(`${this.base}/api/ubl-restapi`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jwt, method, ...extra }),
        });
        const text = await res.text();
        let json: any = null; try { json = text ? JSON.parse(text) : null; } catch { /* düz metin */ }
        return json ?? { StatusCode: String(res.status), Message: text };
    }

    async sendInvoice(invoiceData: InvoiceData): Promise<InvoiceResult> {
        if (!this.configured) return { success: false, error: "Ödeal e-Belge kimlik bilgileri eksik (env/ayar)." };
        try {
            // 1) UBL-TR XML üret (GİB standardı) + base64
            const ublXml = generateUBL(invoiceData, this.erpCode, this.vkn);
            const invoiceB64 = Buffer.from(ublXml, "utf8").toString("base64");

            // 2) saveInvoiceUBL
            const r = await this.ublApi("saveInvoiceUBL", { invoice: invoiceB64, responseObject: "1" });

            const ok = String(r?.StatusCode) === "200" && (r?.Success === true || r?.Success === "true");
            if (!ok) {
                return { success: false, error: r?.Message || r?.ErrorMessage || `Ödeal e-Belge hata (StatusCode ${r?.StatusCode})` };
            }
            // Result = belge UUID
            return { success: true, listId: r?.Result, ettn: r?.Result };
        } catch (e: any) {
            return { success: false, error: e?.message || "Ödeal e-Belge gönderim hatası" };
        }
    }

    async checkStatus(docNo: string, _docType: string): Promise<DocumentStatus | null> {
        if (!this.configured) return null;
        try {
            // Ödeal e-Belge durum sorgu method'u (InvoiceStatus.txt: "" kuyruk, 0 hata, 1 GİB'e gitti, 2 iletildi)
            const r = await this.ublApi("getInvoiceStatus", { uuid: docNo });
            if (!r) return null;
            return {
                belgeNo: docNo,
                durum: String(r?.Result?.status ?? r?.status ?? r?.StatusCode ?? ""),
                ettn: r?.Result?.uuid ?? docNo,
                pdfUrl: r?.Result?.pdfUrl,
            };
        } catch { return null; }
    }
}
