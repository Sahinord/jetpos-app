import { NextResponse } from 'next/server';

/**
 * JetPos Smart Scanner - Vision Analysis API
 * Uses Gemini 1.5 Flash for high-speed, cost-effective visual recognition
 */

export async function POST(req: Request) {
    try {
        const { image, api_key } = await req.json();

        if (!image) {
            return NextResponse.json({ error: 'Görüntü verisi eksik!' }, { status: 400 });
        }

        const OPENROUTER_API_KEY = api_key || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://jetpos.app',
                'X-Title': 'JetPos AI Vision'
            },
            body: JSON.stringify({
                model: "google/gemini-flash-1.5",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `Analiz et ve bu görseldeki ürünü tanımla. 
                                Ayrıca, bu ürünün Türkiye pazarındaki (Trendyol, CarrefourSA, Getir, Hepsiburada gibi) ortalama fiyatlarını tahmin et.
                                
                                Çıktıyı SADECE aşağıdaki JSON formatında ver, başka hiçbir metin ekleme:
                                {
                                    "product_name": "Ürün Adı",
                                    "category": "Kategori",
                                    "barcode": "Varsa Barkod No yoksa null",
                                    "market_avg": 45.50,
                                    "suggested_price": 49.90,
                                    "market_prices": [
                                        {"source": "Trendyol", "price": 44.90},
                                        {"source": "CarrefourSA", "price": 46.50},
                                        {"source": "Getir", "price": 45.00}
                                    ]
                                }`
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${image}`
                                }
                            }
                        ]
                    }
                ],
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("OpenRouter Vision Error:", errorText);
            return NextResponse.json(getMockResult());
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        return NextResponse.json(JSON.parse(content));

    } catch (error: any) {
        console.error("Vision Analyze Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


function getMockResult() {
    return {
        product_name: "Mock Ürün (API Hatası)",
        category: "Genel",
        barcode: null,
        market_avg: 100,
        suggested_price: 110,
        market_prices: [
            { source: "Trendyol", price: 105 },
            { source: "Getir", price: 115 }
        ]
    };
}
