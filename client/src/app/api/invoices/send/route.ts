
import { NextRequest, NextResponse } from 'next/server';
import { QNBClient } from '@/lib/qnb/client';
import { getTenantSettings } from '@/lib/tenant-settings';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const invoiceData = await req.json();

        // Validasyon: Fatura numarası, müşteri vb. kontrol edilebilir
        if (!invoiceData.customer || !invoiceData.lines || invoiceData.lines.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Eksik fatura verisi (Müşteri veya kalemler yok)' },
                { status: 400 }
            );
        }

        const { tenantId } = invoiceData;
        const tenantSettings = await getTenantSettings(tenantId);
        const client = new QNBClient(tenantSettings);

        // 1. Önce Login (Client içinde zaten handle ediliyor ama garanti olsun)
        // 2. Fatura Gönder
        // docType client tarafından belirlensin veya request'ten gelsin
        const docType = invoiceData.docType || 'EFATURA';

        // UBL Builder için fatura tipi gerekebilir, şimdilik client.sendInvoice hallediyor.

        const result = await client.sendInvoice(invoiceData, docType);

        if (result.success && tenantId) {
            try {
                const { supabaseAdmin } = await import('@/lib/supabase-admin');

                let finalPdfUrl = result.pdfUrl;

                // Trendyol'a gönderilecekse ve base64 ise Supabase Storage'a yükle (Trendyol public link ister)
                if (invoiceData.packageId && finalPdfUrl && finalPdfUrl.startsWith('data:application/pdf;base64,')) {
                    try {
                        const base64Data = finalPdfUrl.split(',')[1];
                        const buffer = Buffer.from(base64Data, 'base64');

                        // Güvenlik için: Tenant ID'sini URL'de açıkça göstermemek için hash'liyoruz 
                        // ve dosya adını tahmin edilemez bir UUID yapıyoruz.
                        const hashedTenant = crypto.createHash('sha256').update(tenantId).digest('hex').slice(0, 16);
                        const fileGuid = crypto.randomUUID();
                        const fileName = `invoices/${hashedTenant}/${fileGuid}.pdf`;

                        const { error: uploadErr } = await supabaseAdmin.storage
                            .from('invoices')
                            .upload(fileName, buffer, {
                                contentType: 'application/pdf',
                                upsert: true,
                                cacheControl: '3600',
                                metadata: { tenant_id: tenantId } // Metadata sadece admin panelden görülebilir
                            });

                        if (!uploadErr) {
                            const { data: { publicUrl } } = supabaseAdmin.storage
                                .from('invoices')
                                .getPublicUrl(fileName);
                            finalPdfUrl = publicUrl;
                        } else {
                            console.error('Supabase Storage Upload Error:', uploadErr);
                        }
                    } catch (storageErr) {
                        console.error('Storage processing error:', storageErr);
                    }
                }

                const { data: inv, error: invErr } = await supabaseAdmin
                    .from('invoices')
                    .insert({
                        tenant_id: tenantId,
                        invoice_number: result.listId || invoiceData.invoiceNumber || `EP-${Date.now().toString().slice(-10)}`,
                        invoice_type: 'sales',
                        cari_name: invoiceData.customer.name,
                        cari_vkn: invoiceData.customer.vkn,
                        cari_address: `${invoiceData.customer.district || ''} / ${invoiceData.customer.city || ''}`,
                        subtotal: invoiceData.subtotal,
                        total_vat: invoiceData.totalVat,
                        grand_total: invoiceData.grandTotal,
                        pdf_url: finalPdfUrl,
                        service_oid: result.listId,
                        status: 'sent',
                        is_e_invoice: true,
                        external_id: invoiceData.external_id
                    })
                    .select()
                    .single();

                if (invErr) {
                    console.error('Database Invoice Insert Error:', invErr);
                } else if (inv && invoiceData.lines) {
                    const lineInserts = invoiceData.lines.map((line: any) => ({
                        invoice_id: inv.id,
                        tenant_id: tenantId,
                        item_name: line.name,
                        quantity: line.quantity,
                        unit: line.unit,
                        unit_price: line.price,
                        vat_rate: line.vatRate,
                        vat_amount: (line.quantity * line.price * (line.vatRate / 100)),
                        line_total: (line.quantity * line.price),
                        line_total_with_vat: (line.quantity * line.price) * (1 + (line.vatRate / 100))
                    }));
                    await supabaseAdmin.from('invoice_items').insert(lineInserts);
                }

                // 3. Trendyol'a bildir (Eğer packageId varsa)
                if (invoiceData.packageId && finalPdfUrl) {
                    try {
                        const { createTrendyolGoClient } = await import('@/lib/trendyol-go-client');
                        const trendyolClient = createTrendyolGoClient(tenantSettings);

                        await trendyolClient.uploadInvoice(invoiceData.packageId, {
                            invoiceNumber: result.listId || invoiceData.invoiceNumber,
                            invoiceLink: finalPdfUrl,
                            invoiceDateTime: Date.now()
                        });
                        console.log(`[Trendyol] Invoice notified for package ${invoiceData.packageId}`);
                    } catch (tErr) {
                        console.error('Trendyol Invoice Upload Error:', tErr);
                        // Fatura kesildiği için bu hatayı kullanıcıya kritik olarak yansıtmayabiliriz 
                        // ama loglamak önemli.
                    }
                }

            } catch (dbErr) {
                console.error('DB/Storage/Trendyol Operation failed but invoice was sent:', dbErr);
            }

            return NextResponse.json({
                success: true,
                message: 'Fatura başarıyla kuyruğa alındı ve Trendyol\'a iletildi.',
                listId: result.listId,
                pdfUrl: result.pdfUrl,
                ettn: (result as any).ettn
            });
        } else {
            return NextResponse.json({
                success: false,
                error: result.error || 'QNB Fatura gönderimi başarısız oldu (Hata detayı alınamadı).'
            }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Invoice Send API Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
