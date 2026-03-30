
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PdfReader } from 'pdfreader';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
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
    try {
        const body = await request.json().catch(() => ({}));
        const { pdf_url, tenant_id } = body;

        if (!pdf_url || !tenant_id) {
            return NextResponse.json({ error: 'PDF URL ve Tenant ID gerekli' }, { status: 400 });
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

        // 🔍 API KEY LOOKUP
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

        // 📥 DOWNLOAD PDF
        const pdfResponse = await fetch(pdf_url);
        if (!pdfResponse.ok) {
            return NextResponse.json({ error: `PDF dosyası indirilemedi: ${pdfResponse.statusText}` }, { status: 400 });
        }

        const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

        // 📄 EXTRACT TEXT
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

        // 🧠 AI ANALYSIS
        const prompt = `
Bu bir alış faturası metnidir. Lütfen aşağıdaki bilgileri JSON formatında çıkar:

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

FATURA METNİ:
${pdfText.substring(0, 12000)}

Sadece saf JSON döndür.
`;

        const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openRouterKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://jetpos.app",
                "X-Title": "JetPos AI"
            },
            body: JSON.stringify({
                model: "deepseek/deepseek-chat",
                messages: [{ role: "user", content: prompt }]
            })
        });

        const aiResult = await aiResponse.json();
        const responseText = aiResult.choices?.[0]?.message?.content;

        if (!responseText) throw new Error('AI cevap vermedi.');

        // Extract JSON
        let jsonText = responseText;
        const firstBrace = responseText.indexOf('{');
        const lastBrace = responseText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonText = responseText.substring(firstBrace, lastBrace + 1);
        }

        const analyzedData = JSON.parse(jsonText);
        return NextResponse.json(analyzedData);

    } catch (error: any) {
        console.error('❌ API Error:', error);
        return NextResponse.json(
            { error: 'Analiz başarısız: ' + error.message },
            { status: 500 }
        );
    }
}
