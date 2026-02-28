
import { NextRequest, NextResponse } from 'next/server';
import { QNBClient } from '@/lib/qnb/client';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getTenantSettings } from '@/lib/tenant-settings';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 1. Veritabanından faturayı çek
        const { data: invoice, error: fetchErr } = await supabaseAdmin
            .from('invoices')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchErr || !invoice) {
            return NextResponse.json({ success: false, error: 'Fatura bulunamadı' }, { status: 404 });
        }

        const tenantSettings = await getTenantSettings(invoice.tenant_id);
        const client = new QNBClient(tenantSettings);

        // E-Arşiv tespiti: service_oid EP- veya EARSIV ile başlıyorsa ya da is_e_invoice=true ise EARSIV
        const serviceOid = invoice.service_oid || invoice.invoice_number || '';
        const isEArsiv = invoice.is_e_invoice ||
            serviceOid.startsWith('EP-') ||
            serviceOid.startsWith('EARSIV') ||
            serviceOid.startsWith('EAA') ||  // QNB E-Arşiv numarası EAA ile başlar
            serviceOid.length > 15; // E-Arşiv numaraları genellikle uzundur (EAA20260000000001 gibi)
        const docType = isEArsiv ? 'EARSIV' : 'EFATURA';

        // 2. QNB'den durum sorgula
        // Not: checkDocumentStatus daha önce sadece EFATURA için yazılmış olabilir, 
        // QNBClient içinde e-Arşiv desteğini kontrol etmeliyiz.
        const status = await client.checkDocumentStatus(invoice.service_oid || invoice.invoice_number, docType);

        if (status) {
            // 3. Veritabanını güncelle
            const updates: any = {
                status: status.durum === 'HATA' || status.durum.includes('GEÇERSİZ') ? 'failed' : 'sent',
                pdf_url: status.pdfUrl || invoice.pdf_url
            };

            // Eğer QNB yeni bir BelgeNo vermişse (EP- faturasının gerçek numarasını bulmuşsa)
            if (status.belgeNo && !status.belgeNo.startsWith('EP-') && !status.belgeNo.startsWith('EARSIV_PENDING')) {
                updates.invoice_number = status.belgeNo;
            }

            const { error: updateErr } = await supabaseAdmin
                .from('invoices')
                .update(updates)
                .eq('id', id);

            return NextResponse.json({
                success: true,
                status,
                message: 'Durum güncellendi ve PDF linki kontrol edildi.'
            });
        }

        return NextResponse.json({ success: false, error: 'Durum bilgisi alınamadı' });

    } catch (error: any) {
        console.error('Invoice Status Logic Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
