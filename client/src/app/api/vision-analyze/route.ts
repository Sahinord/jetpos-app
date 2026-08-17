import { NextRequest, NextResponse } from 'next/server';
import { verifyTenantAccess } from '@/lib/server-tenant-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * JetPos Smart Scanner - Vision Analysis API
 * Anahtar SUNUCUDA gizli (OPENROUTER_API_KEY). İşletme başına AI kredisi tüketir.
 */
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const { image, tenant_id } = await req.json();

        if (!image) {
            return NextResponse.json({ error: 'Görüntü verisi eksik!' }, { status: 400 });
        }
        if (!tenant_id) {
            return NextResponse.json({ error: 'tenant_id gerekli' }, { status: 400 });
        }

        const auth = await verifyTenantAccess(req, tenant_id);
        if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

        // ANAHTAR GİZLİ: yalnızca server-only env. Client anahtar gönderemez.
        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
        if (!OPENROUTER_API_KEY) {
            return NextResponse.json({ error: 'AI anahtarı sunucuda tanımlı değil.' }, { status: 503 });
        }

        // 💳 Kredi tüket
        const { data: credit, error: creditErr } = await supabaseAdmin.rpc('consume_ai_credit', { p_tenant: tenant_id });
        if (creditErr) return NextResponse.json({ error: 'AI kredi sistemi hazır değil.' }, { status: 500 });
        const c = (credit || {}) as any;
        if (!c.allowed) {
            const msg = c.reason === 'disabled' ? 'AI bu işletme için kapalı.' : `Günlük AI limitiniz doldu (${c.daily_limit ?? ''}/gün). Ekstra kredi ile devam edebilirsiniz.`;
            return NextResponse.json({ error: msg, reason: c.reason || 'limit' }, { status: 429 });
        }
        const creditSource = c.source || 'daily';
        const refund = async () => { try { await supabaseAdmin.rpc('refund_ai_credit', { p_tenant: tenant_id, p_source: creditSource }); } catch { /* yut */ } };

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
            await refund(); // altyapı hatası → krediyi geri ver
            const errorText = await response.text().catch(() => '');
            console.error("OpenRouter Vision Error status:", response.status);
            if (response.status === 402) return NextResponse.json({ error: 'OpenRouter bakiyesi yetersiz. Kredi yükleyince çalışır.' }, { status: 402 });
            if (response.status === 401) return NextResponse.json({ error: 'OpenRouter anahtarı geçersiz (sunucu).' }, { status: 401 });
            let msg = 'AI görsel analizi başarısız.';
            try { msg = JSON.parse(errorText)?.error?.message || msg; } catch { /* yut */ }
            return NextResponse.json({ error: msg }, { status: 502 });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) { await refund(); return NextResponse.json({ error: 'AI boş cevap döndürdü.' }, { status: 502 }); }
        try {
            return NextResponse.json(JSON.parse(content));
        } catch {
            await refund();
            return NextResponse.json({ error: 'AI çıktısı ayrıştırılamadı.' }, { status: 502 });
        }

    } catch (error: any) {
        console.error("Vision Analyze Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
