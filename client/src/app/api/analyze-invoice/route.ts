import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PdfReader } from 'pdfreader';
import { verifyTenantAccess } from '@/lib/server-tenant-auth';

export const dynamic = 'force-dynamic';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'no_key_for_build'
);

// Helper function to extract text from PDF buffer using pdfreader
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        let text = "";
        new PdfReader({}).parseBuffer(buffer, (err, item) => {
            if (err) reject(err);
            else if (!item) resolve(text); // End of file
            else if (item.text) text += item.text + " ";
        });
    });
}

export async function POST(request: NextRequest) {
    console.log('🚀 AI Invoice Analysis started (v2)...');

    try {
        const body = await request.json().catch(() => ({}));
        const { pdf_url, image_url, tenant_id } = body;

        if ((!pdf_url && !image_url) || !tenant_id) {
            return NextResponse.json({ error: 'PDF/Fotoğraf URL ve Tenant ID gerekli' }, { status: 400 });
        }

        const auth = await verifyTenantAccess(request, tenant_id);
        if (!auth.ok) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        // Get tenant information
        const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', tenant_id)
            .single();

        if (tenantError || !tenant) {
            return NextResponse.json({ error: 'Mağaza bilgisi bulunamadı' }, { status: 404 });
        }

        // 🔍 API KEY + MODEL LOOKUP
        const { data: openRouterIntegration } = await supabase
            .from('integration_settings')
            .select('settings')
            .eq('tenant_id', tenant_id)
            .eq('type', 'openrouter')
            .maybeSingle();

        const orSettings = (openRouterIntegration?.settings || {}) as any;
        // ANAHTAR GİZLİ: önce JetPos'un server-only anahtarı kullanılır (tenant'a sızmaz).
        // Tenant kendi anahtarını girmişse (kurumsal) o override edebilir.
        const openRouterKey = process.env.OPENROUTER_API_KEY || orSettings.apiKey;

        if (!openRouterKey) {
            return NextResponse.json({ error: 'AI anahtarı sunucuda tanımlı değil (OPENROUTER_API_KEY).' }, { status: 503 });
        }

        // Modeller ayarlardan override edilebilir; varsayılanlar güncel + geçerli slug'lar.
        // Görsel için vision-yetenekli, PDF metni için ucuz text modeli.
        const VISION_MODEL = orSettings.visionModel || orSettings.model || 'openai/gpt-4o-mini';
        const TEXT_MODEL = orSettings.textModel || orSettings.model || 'openai/gpt-4o-mini';

        // Her iki modda da istenen JSON şeması ortak.
        const jsonSchemaInstruction = `Bu bir Türkçe ALIŞ FATURASI (ya da fiş). Görüntüdeki/metindeki bilgileri OKU ve SADECE aşağıdaki JSON şemasına göre döndür. Uydurma; okunamayan alanı boş/0 bırak. Para değerlerini nokta ile ondalık ver (1234.56). Tarihi YYYY-MM-DD yap.

{
  "supplier_name": "Tedarikçi/satıcı unvanı",
  "invoice_number": "Fatura/fiş numarası",
  "invoice_date": "YYYY-MM-DD",
  "total_amount": 0,          // KDV dahil genel toplam
  "total_discount": 0,        // toplam iskonto
  "net_amount": 0,            // ödenecek net tutar
  "items": [
    {
      "product_name": "Ürün adı",
      "quantity": 1,
      "unit": "Adet/Kg/Lt vb.",
      "gross_price": 0,       // iskonto ÖNCESİ birim fiyat (KDV hariç)
      "discount_amount": 0,   // bu kaleme ait iskonto tutarı
      "net_price": 0,         // iskonto SONRASI birim alış fiyatı (KDV hariç)
      "vat_rate": 20          // KDV oranı (%)
    }
  ]
}

Yalnızca geçerli JSON döndür, markdown/kod bloğu veya açıklama EKLEME.`;

        type ChatContentBlock =
            | { type: 'text'; text: string }
            | { type: 'image_url'; image_url: { url: string } };
        type ChatMessage = { role: 'user'; content: string | ChatContentBlock[] };

        let model: string;
        let messages: ChatMessage[];

        if (image_url) {
            // 📷 FOTOĞRAF MODU: vision-yetenekli model görseli direkt okur (ayrı OCR gerekmez).
            model = VISION_MODEL;
            messages = [{
                role: "user",
                content: [
                    { type: "text", text: jsonSchemaInstruction },
                    { type: "image_url", image_url: { url: image_url } }
                ]
            }];
        } else {
            // 📥 PDF MODU: metni pdfreader ile çıkar, ucuz/hızlı bir metin
            // modeline (DeepSeek V4 Flash) gönder.
            const pdfResponse = await fetch(pdf_url);
            if (!pdfResponse.ok) {
                return NextResponse.json({ error: `PDF dosyası indirilemedi: ${pdfResponse.statusText}` }, { status: 400 });
            }

            const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

            let pdfText = "";
            try {
                pdfText = await extractTextFromPdf(pdfBuffer);
            } catch (err: any) {
                console.error("❌ PDF Read Error:", err);
                return NextResponse.json({ error: "PDF içeriği okunurken bir hata oluştu: " + err.message }, { status: 500 });
            }

            if (!pdfText || !pdfText.trim()) {
                return NextResponse.json({ error: "PDF içeriği boş veya okunamadı. Manuel girişi deneyebilirsiniz." }, { status: 400 });
            }

            model = TEXT_MODEL;
            messages = [{
                role: "user",
                content: `${jsonSchemaInstruction}\n\nFATURA METNİ:\n${pdfText.substring(0, 12000)}`
            }];
        }

        // 💳 KREDİ TÜKET (günlük limit + ekstra kredi kontrolü). AI çağrısından hemen önce.
        const { data: credit, error: creditErr } = await supabase.rpc('consume_ai_credit', { p_tenant: tenant_id });
        if (creditErr) {
            return NextResponse.json({ error: 'AI kredi sistemi hazır değil (migration uygulanmamış olabilir).' }, { status: 500 });
        }
        const c = (credit || {}) as any;
        if (!c.allowed) {
            const msg = c.reason === 'disabled'
                ? 'AI analiz bu işletme için kapalı. SüperAdmin\'den etkinleştirin.'
                : `Günlük AI limitiniz doldu (${c.daily_limit ?? ''}/gün). Ekstra kredi ile devam edebilirsiniz.`;
            return NextResponse.json({ error: msg, reason: c.reason || 'limit' }, { status: 429 });
        }
        const creditSource = c.source || 'daily';
        const refund = async () => { try { await supabase.rpc('refund_ai_credit', { p_tenant: tenant_id, p_source: creditSource }); } catch { /* yut */ } };

        // 🧠 AI ANALYSIS (JSON zorlanır, timeout + 5xx retry)
        let aiResponse: Response | null = null;
        let lastErr = '';
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${openRouterKey}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://jetpos.app",
                        "X-Title": "JetPos AI"
                    },
                    body: JSON.stringify({ model, messages, response_format: { type: "json_object" }, temperature: 0.1 }),
                    signal: AbortSignal.timeout(45000),
                });
            } catch (e: any) {
                lastErr = e?.name === 'TimeoutError' ? 'AI zaman aşımı (45s).' : (e?.message || 'AI bağlantı hatası');
                if (attempt === 0) { await new Promise(r => setTimeout(r, 1500)); continue; }
            }
            if (aiResponse && aiResponse.status >= 500 && attempt === 0) { await new Promise(r => setTimeout(r, 1500)); continue; }
            break;
        }

        if (!aiResponse) {
            await refund();
            return NextResponse.json({ error: lastErr || 'AI servisine ulaşılamadı.' }, { status: 502 });
        }

        if (!aiResponse.ok) {
            await refund(); // altyapı hatası → krediyi geri ver
            const errorData = await aiResponse.json().catch(() => ({} as any));
            const msg = errorData?.error?.message || aiResponse.statusText;
            if (aiResponse.status === 402) {
                return NextResponse.json({ error: 'OpenRouter bakiyesi yetersiz. Krediyi yükleyince analiz çalışacaktır.' }, { status: 402 });
            }
            if (aiResponse.status === 401) {
                return NextResponse.json({ error: 'OpenRouter anahtarı geçersiz (sunucu).' }, { status: 401 });
            }
            if (aiResponse.status === 404 || /not a valid model|no endpoints/i.test(String(msg))) {
                return NextResponse.json({ error: `Seçili AI modeli (${model}) geçersiz. Ayarlardan modeli güncelleyin.` }, { status: 400 });
            }
            return NextResponse.json({ error: `AI hatası: ${msg}` }, { status: 502 });
        }

        const aiResult = await aiResponse.json();
        const responseText = aiResult.choices?.[0]?.message?.content;
        if (!responseText) { await refund(); return NextResponse.json({ error: 'AI boş cevap döndürdü, tekrar deneyin.' }, { status: 502 }); }

        // Sağlam JSON çıkarımı (markdown ```json çitlerini ve baş/son metni temizle)
        let jsonText = String(responseText).trim().replace(/^```(?:json)?/i, '').replace(/```$/,'').trim();
        const firstBrace = jsonText.indexOf('{');
        const lastBrace = jsonText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) jsonText = jsonText.substring(firstBrace, lastBrace + 1);

        let analyzedData: any;
        try { analyzedData = JSON.parse(jsonText); }
        catch { await refund(); return NextResponse.json({ error: 'AI çıktısı JSON olarak ayrıştırılamadı, tekrar deneyin.' }, { status: 502 }); }

        // Güvenli varsayılanlar (UI'ın beklediği alanlar)
        analyzedData.items = Array.isArray(analyzedData.items) ? analyzedData.items.map((it: any) => ({
            product_name: it.product_name || 'İsimsiz',
            quantity: Number(it.quantity) || 1,
            unit: it.unit || 'Adet',
            gross_price: Number(it.gross_price) || Number(it.net_price) || 0,
            discount_amount: Number(it.discount_amount) || 0,
            net_price: Number(it.net_price) || Number(it.gross_price) || 0,
            vat_rate: Number(it.vat_rate) || 20,
        })) : [];

        return NextResponse.json(analyzedData);

    } catch (error: any) {
        console.error('❌ API Error:', error);
        return NextResponse.json(
            { error: 'Analiz başarısız: ' + error.message },
            { status: 500 }
        );
    }
}
