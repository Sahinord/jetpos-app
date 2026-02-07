/**
 * JetPos AI - OpenRouter Integration
 * OpenAI Compatible API Client
 */

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
        // Eğer özel bir key gelmezse sistem genelindeki key'i kullan (Admin Panel gibi)
        this.apiKey = (apiKey || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || "").trim();
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
        const response = await fetch(this.baseUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`,
                "HTTP-Referer": "https://jetpos.app",
                "X-Title": "JetPos AI"
            },
            body: JSON.stringify({
                model: modelOverride || this.defaultModel,
                messages: messages,
                temperature: 0.7,
            })
        });

        if (!response.ok) {
            let errorMsg = "DeepSeek API hatası";
            try {
                const error = await response.json();
                errorMsg = error.error?.message || errorMsg;
            } catch (e) {
                errorMsg = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMsg);
        }

        const result = await response.json();
        return result.choices[0].message.content;
    }
}
