/**
 * JetPos AI - Sales Forecasting & Insights
 * Powered by Google Gemini 1.5 Flash (Free Tier)
 */

export interface SalesDataPoint {
    date: string;
    product_name: string;
    quantity: number;
    total_amount: number;
}

export interface AIInsight {
    trend: string;
    prediction: string;
    recommendations: string[];
}

export class GeminiAIClient {
    private apiKey: string;
    private baseUrl: string = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async getSalesInsights(salesData: SalesDataPoint[]): Promise<string> {
        if (!this.apiKey) {
            throw new Error("Gemini API Key eksik!");
        }

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

        try {
            const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || "Gemini API hatası");
            }

            const result = await response.json();
            return result.candidates[0].content.parts[0].text;

        } catch (error: any) {
            console.error("Gemini AI Error:", error);
            throw error;
        }
    }
}
