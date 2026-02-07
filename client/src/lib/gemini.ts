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
    private baseUrl: string = "https://openrouter.ai/api/v1/chat/completions";
    private defaultModel: string = "google/gemini-2.0-flash-exp:free";

    constructor(apiKey?: string) {
        // Eğer özel bir key gelmezse sistem genelindeki key'i kullan (Admin Panel gibi)
        this.apiKey = apiKey || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || "";
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
        if (!this.apiKey) {
            throw new Error("AI API Key eksik!");
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
            const response = await fetch(this.baseUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.apiKey}`,
                    "HTTP-Referer": "https://jetpos.app",
                    "X-Title": "JetPos AI"
                },
                body: JSON.stringify({
                    model: this.defaultModel,
                    messages: messages,
                    temperature: 0.7,
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || "OpenRouter API hatası");
            }

            const result = await response.json();
            return result.choices[0].message.content;

        } catch (error: any) {
            console.error("OpenRouter AI Error:", error);
            throw error;
        }
    }
}
