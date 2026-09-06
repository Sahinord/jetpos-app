/**
 * JetPos AI - OpenRouter Integration
 * OpenAI Compatible API Client
 *
 * GÜVENLİK: Bu istemci ARTIK AI sağlayıcısına doğrudan istek ATMAZ ve anahtar
 * TAŞIMAZ. Tüm çağrılar /api/ai/chat sunucu route'una gider; anahtar orada,
 * sunucuda çözülür (bkz. app/api/ai/chat/route.ts). Böylece NEXT_PUBLIC anahtar
 * bundle'a gömülmez ve tarayıcıdan sızmaz.
 */
import { apiFetch } from "@/lib/api";

export interface SalesDataPoint {
    date: string;
    product_name: string;
    quantity: number;
    total_amount: number;
}

export class AIClient {
    private apiKey: string;
    private baseUrl: string = "https://api.deepseek.com/v1/chat/completions";
    private defaultModel: string = "deepseek-chat";

    constructor(apiKey?: string) {
        // NOT: apiKey artık yalnızca "AI yapılandırılmış mı?" bilgisini taşıyan bir
        // işarettir; SUNUCUYA GÖNDERİLMEZ. Gerçek anahtar /api/ai/chat içinde çözülür.
        // Boş bırakılırsa bile sunucu platform anahtarına düşebilir.
        this.apiKey = (apiKey || "server").trim();
    }

    async getSalesInsights(salesData: SalesDataPoint[]): Promise<string> {
        const prompt = `
            Sen JetPos POS sisteminin akıllı analiz asistanısın. Aşağıdaki son satış verilerini analiz et.
            
            Veriler:
            ${JSON.stringify(salesData)}

            Lütfen şu formatta (Markdown kullanarak) bir analiz raporu sun:
            1. 📈 Satış Trendi: (Genel gidişat nasıl?)
            2. 🔮 Önümüzdeki Hafta Tahmini: (Hangi ürünlere talep artacak?)
            3. 💡 Esnafa Öneriler: (Stok yönetimi, kampanya veya fiyatlandırma önerileri - madde madde yaz)
            
            Cevabı samimi, profesyonel bir esnaf danışmanı gibi ve Türkçe ver.
        `;

        return this.getChatResponse(prompt, [], "Sen akıllı bir satış analiz asistanısın.");
    }

    async getChatResponse(message: string, history: { role: 'user' | 'assistant' | 'system', content: string }[], systemContext: string = ""): Promise<string> {
        if (!this.apiKey || this.apiKey === "" || this.apiKey === "undefined") {
            throw new Error("AI API Key eksik veya hatalı! Lütfen ayarlardan API anahtarını kontrol edin.");
        }

        const messages = [];

        if (systemContext) {
            messages.push({ role: "system", content: systemContext });
        }

        // Add history
        history.forEach(h => {
            messages.push({ role: h.role, content: h.content });
        });

        // Add current message
        messages.push({ role: "user", content: message });

        try {
            return await this.executeRequest(messages);
        } catch (error: any) {
            const msg = error.message.toLowerCase();
            if (msg.includes("insufficient_balance") || msg.includes("insufficient balance")) {
                throw new Error("DeepSeek bakiye yetersiz! Lütfen DeepSeek panelinden bakiye yükleyin.");
            }
            if (msg.includes("invalid_api_key") || msg.includes("invalid api key")) {
                throw new Error("DeepSeek API Anahtarı geçersiz! Lütfen anahtarınızı kontrol edin.");
            }
            throw error;
        }
    }

    private async executeRequest(messages: any[], modelOverride?: string): Promise<string> {
        // Anahtarı SUNUCU çözer; istemci yalnızca mesajları gönderir. apiFetch
        // tenant header'larını (x-tenant-id / x-license-key) ve Electron imzasını ekler.
        const data = await apiFetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: modelOverride || this.defaultModel,
                messages,
            }),
        });
        return data?.content ?? "";
    }
}
