import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PdfReader } from 'pdfreader';
import { verifyTenantAccess } from '@/lib/server-tenant-auth';

export const dynamic = 'force-dynamic';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'no_key_for_build'
);

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        let text = "";
        new PdfReader({}).parseBuffer(buffer, (err, item) => {
            if (err) reject(err);
            else if (!item) resolve(text);
            else if (item.text) text += item.text + " ";
        });
    });
}

export async function POST(request: NextRequest) {
    console.log('🚀 [Mobile] AI Invoice Analysis started...');

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

        const { data: openRouterIntegration } = await supabase
            .from('integration_settings')
            .select('settings')
            .eq('tenant_id', tenant_id)
            .eq('type', 'openrouter')
            .maybeSingle();

        const openRouterKey = openRouterIntegration?.settings?.apiKey || process.env.OPENROUTER_API_KEY;

        if (!openRouterKey) {
            return NextResponse.json({ error: 'AI Analiz anahtarı (OpenRouter) bulunamadı.' }, { status: 404 });
        }

        const jsonSchemaInstruction = `Bu bir alış faturasıdır. Lütfen aşağıdaki bilgileri JSON formatında çıkar:

{
  "supplier_name": "Tedarikçi adı",
  "invoice_number": "Fatura numarası",
  "invoice_date": "YYYY-MM-DD formatında tarih",
  "total_amount": 0,
  "total_discount": 0,
  "net_amount": 0,
  "items": [
    {
      "product_name": "Ürün adı",
      "quantity": 1,
      "unit": "Birim",
      "gross_price": 0,
      "net_price": 0,
      "vat_rate": 20
    }
  ]
}

Sadece saf JSON döndür.`;

        type ChatContentBlock =
            | { type: 'text'; text: string }
            | { type: 'image_url'; image_url: { url: string } };
        type ChatMessage = { role: 'user'; content: string | ChatContentBlock[] };

        let model: string;
        let messages: ChatMessage[];

        if (image_url) {
            // 📷 FOTOĞRAF MODU: gpt-4o-mini görseli direkt okuyor.
            model = "openai/gpt-4o-mini";
            messages = [{
                role: "user",
                content: [
                    { type: "text", text: jsonSchemaInstruction },
                    { type: "image_url", image_url: { url: image_url } }
                ]
            }];
        } else {
            // 📥 PDF MODU: metni pdfreader ile çıkar, DeepSeek V4 Flash'a gönder.
            const pdfResponse = await fetch(pdf_url);
            if (!pdfResponse.ok) {
                return NextResponse.json({ error: `PDF dosyası indirilemedi: ${pdfResponse.statusText}` }, { status: 400 });
            }

            const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

            let pdfText = "";
            try {
                pdfText = await extractTextFromPdf(pdfBuffer);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
                console.error("❌ PDF Read Error:", err);
                return NextResponse.json({ error: "PDF içeriği okunurken bir hata oluştu: " + message }, { status: 500 });
            }

            if (!pdfText || !pdfText.trim()) {
                return NextResponse.json({ error: "PDF içeriği boş veya okunamadı. Manuel girişi deneyebilirsiniz." }, { status: 400 });
            }

            model = "deepseek/deepseek-v4-flash";
            messages = [{
                role: "user",
                content: `${jsonSchemaInstruction}\n\nFATURA METNİ:\n${pdfText.substring(0, 12000)}`
            }];
        }

        const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openRouterKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://jetpos.app",
                "X-Title": "JetPos Mobile AI"
            },
            body: JSON.stringify({ model, messages })
        });

        if (!aiResponse.ok) {
            const errorData = await aiResponse.json().catch(() => ({}));
            throw new Error(`AI Hatası: ${errorData.error?.message || aiResponse.statusText}`);
        }

        const aiResult = await aiResponse.json();
        const responseText = aiResult.choices?.[0]?.message?.content;

        if (!responseText) throw new Error('AI cevap vermedi.');

        let jsonText = responseText;
        const firstBrace = responseText.indexOf('{');
        const lastBrace = responseText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonText = responseText.substring(firstBrace, lastBrace + 1);
        }

        const analyzedData = JSON.parse(jsonText);
        return NextResponse.json(analyzedData);

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
        console.error('❌ [Mobile] API Error:', error);
        return NextResponse.json(
            { error: 'Analiz başarısız: ' + message },
            { status: 500 }
        );
    }
}
