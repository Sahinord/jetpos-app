import type { InvoiceData, InvoiceResult, DocumentStatus } from "@/lib/invoice-providers/types";

/**
 * Ödeal e-Belge (e-Fatura / e-Arşiv / e-İrsaliye) REST istemcisi.
 * POS dışı (online/cihazsız) satışlarda belge kesimi için.
 *
 * Kimlik: Basic auth (kullanıcı adı + şifre → base64).
 * Kimlik bilgileri ASLA koda gömülmez — env / tenant ayarından gelir:
 *   ODEAL_EBELGE_USERNAME, ODEAL_EBELGE_PASSWORD, ODEAL_EBELGE_BASE_URL
 * (ya da tenants.settings.odealEbelge.{username,password,baseUrl,environment})
 *
 * ⚠️⚠️ ENDPOINT YOLLARI + PAYLOAD ŞEMASI DOLDURULACAK ⚠️⚠️
 * Ödeal e-Belge API doküman/RAR'ı elimize geçince (fatura.odeal.com/api/document)
 * aşağıdaki EP.* yolları ve buildInvoicePayload() gerçek şemaya göre yazılacak.
 * Şu an TAHMİN YOK — endpoint tanımsızsa açık hata döner (yanlış belge kesilmesin).
 */

export interface OdealEbelgeConfig {
    username?: string;
    password?: string;
    baseUrl?: string;
    environment?: "stage" | "prod";
}

// Stage portal: https://fatura-stg.odeal.com/  → API adresleri RAR'dan teyit edilecek.
const STAGE_BASE = "https://fatura-stg.odeal.com/api";
const PROD_BASE = "https://fatura.odeal.com/api";

// ⚠️ RAR/Swagger'dan doldurulacak gerçek yollar:
const EP = {
    sendInvoice: "",   // örn. "/v1/invoice" — TEYİT BEKLİYOR
    status: "",        // örn. "/v1/invoice/{id}/status" — TEYİT BEKLİYOR
};

export class OdealEbelgeClient {
    private base: string;
    private authHeader: string;
    private configured: boolean;

    constructor(config?: OdealEbelgeConfig) {
        const c = config || {};
        const username = c.username || process.env.ODEAL_EBELGE_USERNAME || "";
        const password = c.password || process.env.ODEAL_EBELGE_PASSWORD || "";
        this.base = (c.baseUrl || process.env.ODEAL_EBELGE_BASE_URL ||
            (c.environment === "prod" ? PROD_BASE : STAGE_BASE)).replace(/\/+$/, "");
        this.configured = !!(username && password);
        this.authHeader = this.configured
            ? "Basic " + Buffer.from(`${username}:${password}`).toString("base64")
            : "";
    }

    private headers(): Record<string, string> {
        return { "Content-Type": "application/json", Authorization: this.authHeader };
    }

    /** ⚠️ Gerçek şema RAR'dan gelince yazılacak (UBL/JSON alan eşlemesi). */
    private buildInvoicePayload(_data: InvoiceData): Record<string, unknown> {
        // TODO: Ödeal e-Belge şemasına göre eşle (müşteri VKN, satırlar, KDV, docType…)
        throw new Error("Ödeal e-Belge payload şeması henüz tanımlı değil (RAR bekleniyor).");
    }

    async sendInvoice(data: InvoiceData): Promise<InvoiceResult> {
        if (!this.configured) return { success: false, error: "Ödeal e-Belge kimlik bilgileri eksik (env/ayar)." };
        if (!EP.sendInvoice) return { success: false, error: "Ödeal e-Belge endpoint'i tanımlı değil (RAR bekleniyor)." };
        try {
            const body = this.buildInvoicePayload(data);
            const res = await fetch(`${this.base}${EP.sendInvoice}`, {
                method: "POST", headers: this.headers(), body: JSON.stringify(body),
            });
            const text = await res.text();
            let json: any = null; try { json = text ? JSON.parse(text) : null; } catch { /* düz metin */ }
            if (!res.ok) return { success: false, error: `Ödeal e-Belge HTTP ${res.status}: ${String(text).slice(0, 200)}` };
            // ⚠️ Alan adları (ettn/pdfUrl/listId) yanıt şemasına göre eşlenecek
            return { success: true, ettn: json?.ettn, pdfUrl: json?.pdfUrl, listId: json?.id };
        } catch (e: any) {
            return { success: false, error: e?.message || "Ödeal e-Belge gönderim hatası" };
        }
    }

    async checkStatus(docNo: string, _docType: string): Promise<DocumentStatus | null> {
        if (!this.configured || !EP.status) return null;
        try {
            const res = await fetch(`${this.base}${EP.status.replace("{id}", encodeURIComponent(docNo))}`, {
                method: "GET", headers: this.headers(),
            });
            if (!res.ok) return null;
            const json: any = await res.json().catch(() => null);
            if (!json) return null;
            return { belgeNo: docNo, durum: json?.status ?? "", ettn: json?.ettn ?? "", pdfUrl: json?.pdfUrl };
        } catch { return null; }
    }
}
