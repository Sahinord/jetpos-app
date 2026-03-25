
import { NextRequest, NextResponse } from 'next/server';
import { getInvoiceProvider } from '@/lib/invoice-providers';
import { getTenantSettings } from '@/lib/tenant-settings';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    try {
        console.log(`[Invoice API] --- NEW REQUEST RECEIVED ---`);
        const invoiceData = await req.json();

        if (!invoiceData.customer || !invoiceData.lines || invoiceData.lines.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Eksik fatura verisi (Müşteri veya kalemler yok)' },
                { status: 400 }
            );
        }

        const { tenantId } = invoiceData;
        const tenantSettings = await getTenantSettings(tenantId);
        
        console.log(`[Invoice API] Tenant: ${tenantId}`);
        
        // Güvenlik için log maskeleme
        const maskedSettings = JSON.parse(JSON.stringify(tenantSettings));
        if (maskedSettings.qnb) {
            if (maskedSettings.qnb.password) maskedSettings.qnb.password = '***';
            if (maskedSettings.qnb.testPassword) maskedSettings.qnb.testPassword = '***';
        }
        if (maskedSettings.parasut) {
            if (maskedSettings.parasut.password) maskedSettings.parasut.password = '***';
            if (maskedSettings.parasut.clientSecret) maskedSettings.parasut.clientSecret = '***';
        }
        console.log(`[Invoice API] Provider: ${tenantSettings.invoice_provider || 'qnb'}, Settings:`, JSON.stringify(maskedSettings, null, 2));

        const provider = getInvoiceProvider(tenantSettings);
        const docType = invoiceData.docType || 'EFATURA';

        console.log(`[Invoice API] Sending invoice to ${provider.name} (${docType})...`);
        const result = await provider.sendInvoice(invoiceData);
        
        console.log(`[Invoice API] ${provider.name} Response received:`, JSON.stringify(result));

        if (result.success && tenantId) {
            try {
                const { supabaseAdmin } = await import('@/lib/supabase-admin');
                let finalPdfUrl = result.pdfUrl;

                if (finalPdfUrl && finalPdfUrl.startsWith('data:application/pdf;base64,')) {
                    console.log(`[Invoice API] Uploading PDF to Storage...`);
                    try {
                        const base64Data = finalPdfUrl.split(',')[1];
                        const buffer = Buffer.from(base64Data, 'base64');
                        const hashedTenant = crypto.createHash('sha256').update(tenantId).digest('hex').slice(0, 16);
                        const fileGuid = crypto.randomUUID();
                        const fileName = `invoices/${hashedTenant}/${fileGuid}.pdf`;

                        const { error: uploadErr } = await supabaseAdmin.storage
                            .from('invoices')
                            .upload(fileName, buffer, {
                                contentType: 'application/pdf',
                                upsert: true,
                                cacheControl: '3600',
                                metadata: { tenant_id: tenantId }
                            });

                        if (!uploadErr) {
                            const { data: { publicUrl } } = supabaseAdmin.storage
                                .from('invoices')
                                .getPublicUrl(fileName);
                            finalPdfUrl = publicUrl;
                            console.log(`[Invoice API] PDF Uploaded: ${finalPdfUrl}`);
                        }
                    } catch (storageErr) {
                        console.error('Storage processing error:', storageErr);
                    }
                }

                console.log(`[Invoice API] Saving to Database...`);
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

                if (inv && invoiceData.lines) {
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

                if (invoiceData.packageId && finalPdfUrl) {
                    console.log(`[Invoice API] Notifying Trendyol...`);
                    try {
                        const { createTrendyolGoClient } = await import('@/lib/trendyol-go-client');
                        const trendyolClient = createTrendyolGoClient(tenantSettings);

                        await trendyolClient.uploadInvoice(invoiceData.packageId, {
                            invoiceNumber: result.listId || invoiceData.invoiceNumber,
                            invoiceLink: finalPdfUrl,
                            invoiceDateTime: Date.now()
                        });
                    } catch (tErr) {
                        console.error('Trendyol Invoice Upload Error:', tErr);
                    }
                }

            } catch (dbErr) {
                console.error('DB/Storage/Trendyol Operation failed but invoice was sent:', dbErr);
            }

            return NextResponse.json({
                success: true,
                message: 'Fatura başarıyla gönderildi.',
                listId: result.listId,
                pdfUrl: result.pdfUrl,
                ettn: (result as any).ettn
            });
        } else {
            console.error(`[Invoice API] ${provider.name} Error:`, result.error);
            return NextResponse.json({
                success: false,
                error: result.error || 'Fatura gönderimi başarısız oldu.'
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
