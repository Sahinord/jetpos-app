"use client";

import { useState, useEffect, useRef } from 'react';
import {
    FileText, Plus, Save, X, Search, Calendar, Building2,
    Package, Trash2, Calculator, Receipt, AlertCircle, Check, Sparkles,
    Eye, EyeOff, LayoutPanelLeft, Type, RotateCcw
} from 'lucide-react';
import { useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/lib/tenant-context';
import AIPDFInvoiceAnalyzer from './AIPDFInvoiceAnalyzer';
import { useDraft } from '@/lib/useDraft';
import DraftRestoreModal from '@/components/Common/DraftRestoreModal';

interface InvoiceItem {
    id?: string;
    product_id?: string;
    item_name: string;
    item_code: string;
    quantity: number;
    unit: string;
    unit_price: number;
    discount_rate: number;
    discount_quantity?: number;
    vat_rate: number;
    line_total?: number;
    discount_amount?: number;
    vat_amount?: number;
    line_total_with_vat?: number;
    suggested_sale_price?: number;
    old_purchase_price?: number;
    old_sale_price?: number;
}

// İskonto oranı varsayılan olarak kalemin tüm miktarına uygulanır.
// discount_quantity verilirse (örn. "5 adetin sadece 1.si %15 iskontolu"),
// iskonto sadece o kadar adede uygulanır, kalan adetler tam fiyattan hesaplanır —
// böylece iskonto oranı satırdaki tüm adetlere yayılıp sulandırılmaz.
function calculateItemTotals(item: InvoiceItem) {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unit_price) || 0;
    const discount = Number(item.discount_rate) || 0;
    const vat = Number(item.vat_rate) || 0;
    const discountQty = item.discount_quantity
        ? Math.min(Number(item.discount_quantity) || 0, qty)
        : qty;

    const discountAmount = (discountQty * price * discount) / 100;
    const line_total = (qty * price) - discountAmount;
    const vat_amount = (line_total * vat) / 100;
    const line_total_with_vat = line_total + vat_amount;

    return {
        discount_amount: Math.round(discountAmount * 100) / 100,
        line_total: Math.round(line_total * 100) / 100,
        vat_amount: Math.round(vat_amount * 100) / 100,
        line_total_with_vat: Math.round(line_total_with_vat * 100) / 100
    };
}

interface Invoice {
    id?: string;
    invoice_number?: string;
    invoice_date: string;
    due_date: string;
    cari_id: string;
    cari_name: string;
    cari_vkn: string;
    cari_tax_office: string;
    cari_address: string;
    notes: string;
    items: InvoiceItem[];
    subtotal?: number;
    total_vat?: number;
    grand_total?: number;
}

// Türkçe-duyarsız normalizasyon: "yogurt" → "yoğurt" eşleşsin (İ/ı→i, ğ/ü/ş/ö/ç → g/u/s/o/c)
function normTr(s: any): string {
    return String(s ?? '').replace(/İ/g, 'i').replace(/ı/g, 'i').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function emptyInvoice(): Invoice {
    return {
        invoice_number: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        cari_id: '',
        cari_name: '',
        cari_vkn: '',
        cari_tax_office: '',
        cari_address: '',
        notes: '',
        items: [
            { item_name: '', item_code: '', quantity: 1, unit: 'ADET', unit_price: 0, discount_rate: 0, vat_rate: 20 }
        ]
    };
}

export default function AlisFaturasi() {
    const { currentTenant } = useTenant();
    const [cariList, setCariList] = useState<any[]>([]);
    const [productList, setProductList] = useState<any[]>([]);
    const [invoice, setInvoice] = useState<Invoice>(emptyInvoice);

    // Taslak + kaydetmeden çıkış koruması
    const shouldSaveDraft = (v: Invoice) =>
        !!v.cari_id || !!(v.invoice_number || '').trim() ||
        (v.items || []).some(i => (i.item_name || '').trim() !== '' || (Number(i.unit_price) || 0) > 0);
    const { draftFound, clearDraft, dismissPrompt } = useDraft('draft_alis_faturasi', invoice, shouldSaveDraft);
    const handleResetForm = () => {
        if (shouldSaveDraft(invoice) && !confirm('Formu sıfırla? Girilen tüm bilgiler silinecek.')) return;
        setInvoice(emptyInvoice());
        clearDraft();
    };
    const [loading, setLoading] = useState(false);
    const isSavingRef = useRef(false);
    const [showCariSearch, setShowCariSearch] = useState(false);
    const [cariSearchTerm, setCariSearchTerm] = useState('');
    const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [showAIAnalyzer, setShowAIAnalyzer] = useState(false);
    const [manualPdfUrl, setManualPdfUrl] = useState<string | null>(null);
    const [showManualPdf, setShowManualPdf] = useState(false);

    const handleAIAnalyzed = async (data: any) => {
        // 1. Try to find supplier
        const { data: foundCari } = await supabase
            .from('cari_hesaplar')
            .select('*')
            .ilike('cari_unvan', `%${data.supplier_name}%`)
            .limit(1)
            .single();

        if (foundCari) {
            setInvoice(prev => ({
                ...prev,
                cari_id: foundCari.id,
                cari_name: foundCari.unvani,
                cari_vkn: foundCari.vergi_no || '',
                cari_tax_office: foundCari.vergi_dairesi || '',
                cari_address: '' // adres alanı cari_hesaplar tablosunda yok
            }));
        }

        // 2. Map items
        const mappedItems = await Promise.all(data.items.map(async (aiItem: any) => {
            // Try to find product
            const { data: foundProduct } = await supabase
                .from('products')
                .select('*')
                .ilike('name', `%${aiItem.product_name}%`)
                .limit(1)
                .single();

            // Prepare item
            return {
                product_id: foundProduct?.id,
                item_name: foundProduct?.name || aiItem.product_name,
                item_code: foundProduct?.barcode || '',
                quantity: aiItem.quantity,
                unit: aiItem.unit === 'ADET' ? 'ADET' : (aiItem.unit === 'KG' ? 'KG' : 'ADET'),
                unit_price: aiItem.net_price, // Net birim fiyatı kullanıyoruz
                discount_rate: 0, // İskonto zaten fiyata yedirildi (kullanıcı isteği)
                vat_rate: aiItem.vat_rate,
                suggested_sale_price: aiItem.suggested_sale_price // UI'da göstermek için geçici tutabiliriz
            };
        }));

        setInvoice(prev => ({
            ...prev,
            invoice_date: data.invoice_date || prev.invoice_date,
            items: mappedItems
        }));

        setShowAIAnalyzer(false);
        alert('🚀 AI Analizi tamamlandı! Fatura ve fiyatlar güncellendi. Lütfen kontrol edip kaydedin.');
    };

    const handleManualPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const fileName = `manual_${Date.now()}.pdf`;
            const { data } = await supabase.storage.from('invoices').upload(fileName, file);
            if (data) {
                const { data: { publicUrl } } = supabase.storage.from('invoices').getPublicUrl(fileName);
                setManualPdfUrl(publicUrl);
                setShowManualPdf(true);
            }
        }
    };

    useEffect(() => {
        if (currentTenant) {
            fetchCariList();
            fetchProductList();
        }
    }, [currentTenant]);

    const enrichedItems = useMemo(() => {
        return invoice.items.map(item => ({ ...item, ...calculateItemTotals(item) }));
    }, [invoice.items]);

    const totals = useMemo(() => {
        const subtotal = enrichedItems.reduce((sum, item) => sum + (item.line_total || 0), 0);
        const total_vat = enrichedItems.reduce((sum, item) => sum + (item.vat_amount || 0), 0);
        const grand_total = enrichedItems.reduce((sum, item) => sum + (item.line_total_with_vat || 0), 0);

        return {
            subtotal: Math.round(subtotal * 100) / 100,
            total_vat: Math.round(total_vat * 100) / 100,
            grand_total: Math.round(grand_total * 100) / 100
        };
    }, [enrichedItems]);

    const fetchCariList = async () => {
        const query = supabase
            .from('cari_hesaplar')
            .select('*');

        if (currentTenant) {
            query.eq('tenant_id', currentTenant.id);
        }

        const { data } = await query.order('unvani');
        if (data) setCariList(data);
    };

    const fetchProductList = async () => {
        const { data } = await supabase
            .from('products')
            .select('id, name, barcode, purchase_price, sale_price')
            .order('name');
        if (data) setProductList(data);
    };


    const selectCari = (cari: any) => {
        setInvoice(prev => ({
            ...prev,
            cari_id: cari.id,
            cari_name: cari.unvani,
            cari_vkn: cari.vergi_no || '',
            cari_tax_office: cari.vergi_dairesi || '',
            cari_address: '' // adres alanı cari_hesaplar tablosunda yok
        }));
        setShowCariSearch(false);
        setCariSearchTerm('');
    };

    const selectProduct = (product: any, index: number) => {
        const newItems = [...invoice.items];
        newItems[index] = {
            ...newItems[index],
            product_id: product.id,
            item_name: product.name,
            item_code: product.barcode || '',
            unit_price: 0,
            old_purchase_price: product.purchase_price || 0,
            old_sale_price: product.sale_price || 0
        };
        setInvoice(prev => ({ ...prev, items: newItems }));
        setSelectedItemIndex(null);
        setProductSearchTerm('');
    };

    const addItem = () => {
        setInvoice(prev => ({
            ...prev,
            items: [
                ...prev.items,
                {
                    item_name: '',
                    item_code: '',
                    quantity: 1,
                    unit: 'ADET',
                    unit_price: 0,
                    discount_rate: 0,
                    vat_rate: 20
                }
            ]
        }));
    };

    const removeItem = (index: number) => {
        if (invoice.items.length === 1) return;
        setInvoice(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
        const newItems = [...invoice.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setInvoice(prev => ({ ...prev, items: newItems }));
    };

    const saveInvoice = async () => {
        // Çift tıklama / aynı anda iki kayıt denemesini engelle — yoksa get_next_invoice_number
        // ikisine de aynı "sıradaki numara"yı verip unique constraint hatası fırlatabilir.
        if (isSavingRef.current) return;
        isSavingRef.current = true;

        if (!invoice.cari_id) {
            alert('Lütfen tedarikçi seçin!');
            isSavingRef.current = false;
            return;
        }

        if (invoice.items.some(i => !i.item_name || i.quantity <= 0 || i.unit_price <= 0)) {
            alert('Lütfen tüm kalem bilgilerini doldurun!');
            isSavingRef.current = false;
            return;
        }

        setLoading(true);
        try {
            // Fatura numarası al (kullanıcı girmediyse)
            let finalInvoiceNumber = invoice.invoice_number?.trim();
            if (!finalInvoiceNumber) {
                const { data: nextNumber } = await supabase.rpc('get_next_invoice_number', {
                    p_tenant_id: currentTenant?.id,
                    p_invoice_type: 'purchase'
                });
                finalInvoiceNumber = nextNumber || `ALIS-${Date.now()}`;
            }

            // Fatura kaydet
            const { data: invoiceData, error: invoiceError } = await supabase
                .from('invoices')
                .insert({
                    tenant_id: currentTenant?.id,
                    invoice_number: finalInvoiceNumber,
                    invoice_type: 'purchase',
                    invoice_date: invoice.invoice_date,
                    due_date: invoice.due_date,
                    cari_id: invoice.cari_id,
                    cari_name: invoice.cari_name,
                    cari_vkn: invoice.cari_vkn,
                    cari_tax_office: invoice.cari_tax_office,
                    cari_address: invoice.cari_address,
                    notes: invoice.notes,
                    status: 'approved',
                    payment_status: 'unpaid',
                    subtotal: totals.subtotal,
                    total_vat: totals.total_vat,
                    grand_total: totals.grand_total
                })
                .select()
                .single();

            if (invoiceError) throw invoiceError;

            // 1. Yeni ürünleri oluştur veya isimden eşleştir
            const finalItems = [...invoice.items];
            for (let i = 0; i < finalItems.length; i++) {
                const item = finalItems[i];
                if (!item.product_id && item.item_name.trim()) {
                    // İsimle tam eşleşen var mı kontrol et
                    const { data: existingProd } = await supabase
                        .from('products')
                        .select('id, purchase_price, sale_price')
                        .ilike('name', item.item_name.trim())
                        .eq('tenant_id', currentTenant?.id)
                        .maybeSingle();

                    if (existingProd) {
                        item.product_id = existingProd.id;
                        item.old_purchase_price = existingProd.purchase_price || 0;
                        item.old_sale_price = existingProd.sale_price || 0;
                    } else {
                        // Yeni ürün oluştur
                        const { data: newProd, error: newProdErr } = await supabase
                            .from('products')
                            .insert({
                                tenant_id: currentTenant?.id,
                                name: item.item_name.trim(),
                                barcode: item.item_code || null,
                                unit: item.unit,
                                vat_rate: item.vat_rate,
                                purchase_price: Number(item.unit_price) || 0,
                                sale_price: item.suggested_sale_price || 0,
                                stock_quantity: 0, // Aşağıda increment_stock ile artacak
                                status: 'active'
                            })
                            .select()
                            .single();
                        
                        if (!newProdErr && newProd) {
                            item.product_id = newProd.id;
                        }
                    }
                }
            }

            // Kalemleri kaydet
            const itemsToInsert = finalItems.map(item => {
                const calc = calculateItemTotals(item);
                return {
                    tenant_id: currentTenant?.id,
                    invoice_id: invoiceData.id,
                    product_id: item.product_id,
                    item_name: item.item_name,
                    item_code: item.item_code,
                    quantity: Number(item.quantity) || 0,
                    unit: item.unit,
                    unit_price: Number(item.unit_price) || 0,
                    discount_rate: Number(item.discount_rate) || 0,
                    discount_amount: calc.discount_amount,
                    vat_rate: Number(item.vat_rate) || 0,
                    vat_amount: calc.vat_amount,
                    line_total: calc.line_total,
                    line_total_with_vat: calc.line_total_with_vat
                };
            });

            const { error: itemsError } = await supabase
                .from('invoice_items')
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;

            // Stok ve Fiyat Güncelleme
            for (const item of finalItems) {
                if (item.product_id) {
                    const calc = calculateItemTotals(item);
                    const qty = Number(item.quantity) || 0;
                    // İskonto sonrası gerçek birim maliyet (kısmi iskonto varsa ortalamaya yedirilir)
                    const effectivePurchasePrice = qty > 0
                        ? Math.round((calc.line_total / qty) * 100) / 100
                        : Number(item.unit_price) || 0;

                    // 1. Alış fiyatını ve (varsa) önerilen satış fiyatını güncelle
                    const updateData: any = {
                        purchase_price: effectivePurchasePrice
                    };

                    if (item.suggested_sale_price) {
                        updateData.sale_price = item.suggested_sale_price;
                    }

                    await supabase
                        .from('products')
                        .update(updateData)
                        .eq('id', item.product_id);

                    // 2. Stoğu atomik olarak artır (RPC kullanarak)
                    await supabase.rpc('increment_stock', {
                        p_product_id: item.product_id,
                        p_qty: qty
                    });

                    // 3. Fiyat değişikliğini ürünün geçmişine yaz (Ürün Detayı > Son İşlemler'de görünür)
                    const priceLogs: any[] = [];
                    if (item.old_purchase_price !== undefined && Number(item.old_purchase_price) !== effectivePurchasePrice) {
                        priceLogs.push({
                            product_id: item.product_id,
                            product_name: item.item_name,
                            product_barcode: item.item_code || null,
                            change_type: 'price',
                            field_name: 'purchase_price',
                            old_value: String(item.old_purchase_price),
                            new_value: String(effectivePurchasePrice),
                            change_source: 'invoice',
                            changed_by: `Alış Faturası: ${finalInvoiceNumber}${Number(item.discount_rate) > 0 ? ` (İsk. %${item.discount_rate})` : ''}`,
                            tenant_id: currentTenant?.id
                        });
                    }
                    if (item.suggested_sale_price && item.old_sale_price !== undefined && Number(item.old_sale_price) !== Number(item.suggested_sale_price)) {
                        priceLogs.push({
                            product_id: item.product_id,
                            product_name: item.item_name,
                            product_barcode: item.item_code || null,
                            change_type: 'price',
                            field_name: 'sale_price',
                            old_value: String(item.old_sale_price),
                            new_value: String(item.suggested_sale_price),
                            change_source: 'invoice',
                            changed_by: `Alış Faturası: ${finalInvoiceNumber}`,
                            tenant_id: currentTenant?.id
                        });
                    }
                    if (priceLogs.length > 0) {
                        await supabase.from('product_change_logs').insert(priceLogs);
                    }
                }
            }

            // Cari hesaba alacak yaz (Tedarikçi bizden alacaklı duruma geçer)
            const { error: cariError } = await supabase.from('cari_hareketler').insert({
                tenant_id: currentTenant?.id,
                cari_id: invoice.cari_id,
                hareket_tipi: 'borclandirma',
                aciklama: `Alış Faturası: ${finalInvoiceNumber}`,
                alacak: totals.grand_total,
                borc: 0,
                tarih: invoice.invoice_date,
                belge_no: finalInvoiceNumber
            });

            if (cariError) throw cariError;

            alert('✅ Alış faturası başarıyla kaydedildi!');

            // Formu sıfırla + taslağı temizle
            setInvoice(emptyInvoice());
            clearDraft();
        } catch (error: any) {
            console.error(error);
            if (error.code === '23505' && error.message?.includes('invoice_number')) {
                alert('❌ Bu fatura numarası zaten kullanılıyor. Lütfen farklı bir numara girin veya numara alanını boş bırakıp otomatik numaralandırmayı kullanın.');
            } else {
                alert('❌ Hata: ' + error.message);
            }
        } finally {
            setLoading(false);
            isSavingRef.current = false;
        }
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0);

    const filteredCariList = cariList.filter(c =>
        normTr(c.unvani).includes(normTr(cariSearchTerm)) ||
        normTr(c.vergi_no).includes(normTr(cariSearchTerm))
    );

    const filteredProductList = productList.filter(p =>
        normTr(p.name).includes(normTr(productSearchTerm)) ||
        normTr(p.barcode).includes(normTr(productSearchTerm))
    );

    return (
        <div className="space-y-4 max-w-[1600px] mx-auto p-4">
            {/* Header / Actions */}
            <div className="flex items-center justify-end gap-2 pb-2 border-b border-white/5">
                {manualPdfUrl ? (
                    <button
                        onClick={() => setShowManualPdf(!showManualPdf)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 border ${showManualPdf ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-primary/10 border-primary/30 text-primary'
                            }`}
                    >
                        {showManualPdf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {showManualPdf ? 'ÖNİZLEME KAPAT' : 'ÖNİZLEME AÇ'}
                    </button>
                ) : (
                    <div className="relative">
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={handleManualPdfUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <button className="bg-white/5 hover:bg-white/10 text-white/70 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border border-white/10">
                            <Eye className="w-4 h-4" />
                            MANUEL PDF YÜKLE
                        </button>
                    </div>
                )}
                <button
                    onClick={() => setShowAIAnalyzer(true)}
                    className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
                >
                    <Sparkles className="w-4 h-4" />
                    AI İLE ANALİZ ET
                </button>
                <button
                    onClick={handleResetForm}
                    className="bg-white/5 hover:bg-rose-500/15 text-white/70 hover:text-rose-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border border-white/10 active:scale-95"
                    title="Formu sıfırla (girilenleri temizle)"
                >
                    <RotateCcw className="w-4 h-4" />
                    SIFIRLA
                </button>
                <button
                    onClick={saveInvoice}
                    disabled={loading}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
                >
                    {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                    FİŞİ KAYDET
                </button>
            </div>

            <DraftRestoreModal
                open={!!draftFound}
                onRestore={() => { if (draftFound) setInvoice(draftFound); dismissPrompt(); }}
                onDiscard={clearDraft}
            />

            {/* Main Content Area */}
            <div className={`grid grid-cols-1 ${showManualPdf ? 'lg:grid-cols-2' : ''} gap-4`}>

                {/* PDF Viewer Pane */}
                {showManualPdf && manualPdfUrl && (
                    <div className="glass-card overflow-hidden flex flex-col h-[calc(100vh-180px)] sticky top-4 border-primary/20 bg-primary/[0.02]">
                        <div className="p-3 bg-primary/5 flex items-center justify-between border-b border-primary/10">
                            <span className="text-[10px] font-bold text-primary flex items-center gap-2 uppercase tracking-widest">
                                <Eye className="w-3.5 h-3.5" /> Belge Önizleme
                            </span>
                            <button onClick={() => setShowManualPdf(false)} className="text-secondary hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <iframe
                            src={`${manualPdfUrl}#toolbar=0`}
                            className="flex-1 w-full border-none invert brightness-90 contrast-125"
                            title="Invoice Preview"
                        />
                    </div>
                )}

                <div className="space-y-4">
                    {/* Fatura Bilgileri */}
                    <div className="glass-card p-5 space-y-5 bg-white/[0.01] relative z-50">
                        <h2 className="text-[10px] font-bold text-primary uppercase tracking-[0.25em] flex items-center gap-2 border-b border-white/5 pb-3">
                            <Receipt className="w-4 h-4" />
                            Fatura Bilgileri
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                            {/* Tedarikçi Seçimi */}
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Tedarikçi</label>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowCariSearch(true)}
                                        className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2.5 text-left text-sm font-medium text-white hover:border-primary/30 transition-all flex items-center justify-between shadow-sm"
                                    >
                                        <span className={invoice.cari_name ? 'text-white' : 'text-secondary/50'}>
                                            {invoice.cari_name || 'Tedarikçi seçin...'}
                                        </span>
                                        <Search className="w-4 h-4 text-secondary/40 group-hover:text-primary transition-colors" />
                                    </button>

                                    {showCariSearch && (
                                        <div className="absolute z-50 top-full mt-2 w-full bg-card border border-border rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                                            <div className="sticky top-0 bg-card p-3 border-b border-border">
                                                <input
                                                    type="text"
                                                    value={cariSearchTerm}
                                                    onChange={(e) => setCariSearchTerm(e.target.value)}
                                                    placeholder="Tedarikçi ara..."
                                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                                                    autoFocus
                                                />
                                            </div>
                                            <div>
                                                {filteredCariList.map(cari => (
                                                    <button
                                                        key={cari.id}
                                                        onClick={() => selectCari(cari)}
                                                        className="w-full px-4 py-3 text-left hover:bg-primary/10 transition-colors border-b border-border/50 last:border-0"
                                                    >
                                                        <div className="font-bold text-sm text-foreground">{cari.unvani}</div>
                                                        <div className="text-xs text-secondary">{cari.vergi_no} - {cari.vergi_dairesi}</div>
                                                    </button>
                                                ))}
                                                {filteredCariList.length === 0 && (
                                                    <div className="p-4 text-center text-secondary text-sm">Tedarikçi bulunamadı</div>
                                                )}
                                            </div>
                                            <div className="sticky bottom-0 bg-card p-2 border-t border-border">
                                                <button
                                                    onClick={() => setShowCariSearch(false)}
                                                    className="w-full px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-bold transition-all"
                                                >
                                                    Kapat
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {invoice.cari_vkn && (
                                    <div className="text-xs text-secondary">
                                        <div><strong>VKN:</strong> {invoice.cari_vkn}</div>
                                        <div><strong>Vergi Dairesi:</strong> {invoice.cari_tax_office}</div>
                                    </div>
                                )}
                            </div>

                            {/* Fatura Numarası */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-secondary uppercase">Fatura Numarası</label>
                                <input
                                    type="text"
                                    value={invoice.invoice_number || ''}
                                    onChange={(e) => setInvoice(prev => ({ ...prev, invoice_number: e.target.value }))}
                                    placeholder="Opsiyonel"
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                                />
                            </div>

                            {/* Fatura Tarihi */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-secondary uppercase">Fatura Tarihi *</label>
                                <input
                                    type="date"
                                    value={invoice.invoice_date}
                                    onChange={(e) => setInvoice(prev => ({ ...prev, invoice_date: e.target.value }))}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                                />
                            </div>

                            {/* Vade Tarihi */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-secondary uppercase">Vade Tarihi</label>
                                <input
                                    type="date"
                                    value={invoice.due_date}
                                    onChange={(e) => setInvoice(prev => ({ ...prev, due_date: e.target.value }))}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Kalemler */}
                    <div className="glass-card p-5 space-y-5 bg-white/[0.01]">
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                            <h2 className="text-[10px] font-bold text-primary uppercase tracking-[0.25em] flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                Fatura Kalemleri
                            </h2>
                            <button
                                onClick={addItem}
                                className="text-primary hover:text-primary/80 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Yeni Kalem Ekle
                            </button>
                        </div>

                        <div className="overflow-x-auto pb-48">
                            <table className="w-full text-xs">
                                <thead className="text-secondary/60 font-semibold uppercase tracking-wider text-[9px] border-b border-white/5">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Ürün/Hizmet Açıklaması</th>
                                        <th className="px-4 py-3 text-center w-24">Miktar</th>
                                        <th className="px-4 py-3 text-center w-24">Birim</th>
                                        <th className="px-4 py-3 text-right w-32">Birim Fiyat</th>
                                        <th className="px-4 py-3 text-right w-32">Satış Fiyatı</th>
                                        <th className="px-4 py-3 text-center w-20">İsk. %</th>
                                        <th className="px-4 py-3 text-center w-24">İsk. Adet</th>
                                        <th className="px-4 py-3 text-right w-36 bg-white/[0.02]">Toplam</th>
                                        <th className="px-4 py-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {enrichedItems.map((item, index) => (
                                        <tr key={index} className="hover:bg-white/[0.02] group">
                                            {/* Ürün Adı */}
                                            <td className="p-2 relative">
                                                <input
                                                    type="text"
                                                    value={item.item_name}
                                                    onChange={(e) => {
                                                        updateItem(index, 'item_name', e.target.value);
                                                        setProductSearchTerm(e.target.value);
                                                    }}
                                                    onFocus={() => {
                                                        setSelectedItemIndex(index);
                                                        setProductSearchTerm(item.item_name);
                                                    }}
                                                    onBlur={() => setTimeout(() => setSelectedItemIndex(null), 250)}
                                                    placeholder="Ürün/Hizmet adı..."
                                                    className="w-full bg-transparent border-none text-foreground font-medium outline-none"
                                                />
                                                {selectedItemIndex === index && (
                                                    <div className="absolute z-40 top-full left-0 mt-1 w-80 bg-card border border-border rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                                                        {filteredProductList.length === 0 ? (
                                                            <div className="p-4 text-center text-sm text-secondary">
                                                                Eşleşen ürün bulunamadı. <br/>
                                                                <span className="text-emerald-500 font-bold block mt-1">✨ Yeni ürün olarak kaydedilecek</span>
                                                            </div>
                                                        ) : (
                                                            filteredProductList.slice(0, 10).map(product => (
                                                                <button
                                                                    key={product.id}
                                                                    onClick={() => selectProduct(product, index)}
                                                                    className="w-full px-3 py-2 text-left hover:bg-primary/10 transition-colors border-b border-border/50 last:border-0"
                                                                >
                                                                    <div className="font-bold text-sm text-foreground">{product.name}</div>
                                                                    <div className="text-xs text-secondary">{product.barcode || 'Barkodsuz'} • {formatCurrency(product.purchase_price)}</div>
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Miktar */}
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(',', '.').replace(/[^0-9.]/g, '');
                                                        const parts = val.split('.');
                                                        const cleaned = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : val;
                                                        updateItem(index, 'quantity', cleaned);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        // Aşağı ok: son satırdaysa hemen yeni kalem ekle (numpad ile hızlı giriş)
                                                        if (e.key === 'ArrowDown' && index === invoice.items.length - 1) { e.preventDefault(); addItem(); }
                                                    }}
                                                    className="w-full bg-primary/10 border border-primary/20 rounded-lg px-2 py-1.5 text-primary font-bold text-center outline-none focus:border-primary"
                                                />
                                            </td>

                                            {/* Birim */}
                                            <td className="p-2">
                                                <select
                                                    value={item.unit}
                                                    onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                                    className="w-full bg-background border border-border rounded-lg px-1 py-1.5 text-foreground text-center text-xs"
                                                >
                                                    <option>ADET</option>
                                                    <option>KG</option>
                                                    <option>LT</option>
                                                    <option>M</option>
                                                    <option>M2</option>
                                                    <option>M3</option>
                                                </select>
                                            </td>

                                            {/* Birim Fiyat */}
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={item.unit_price === 0 ? '' : item.unit_price}
                                                    placeholder={item.old_purchase_price ? `Eski: ${formatCurrency(item.old_purchase_price)}` : '0,00'}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(',', '.').replace(/[^0-9.]/g, '');
                                                        const parts = val.split('.');
                                                        const cleaned = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : val;
                                                        updateItem(index, 'unit_price', cleaned);
                                                    }}
                                                    className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-foreground font-mono text-center outline-none focus:border-primary placeholder:text-secondary/50 placeholder:text-[10px]"
                                                />
                                            </td>

                                            {/* Satış Fiyatı */}
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={item.suggested_sale_price === undefined || item.suggested_sale_price === 0 ? '' : item.suggested_sale_price}
                                                    placeholder={item.old_sale_price ? `Eski: ${formatCurrency(item.old_sale_price)}` : 'Değişmesin'}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(',', '.').replace(/[^0-9.]/g, '');
                                                        const parts = val.split('.');
                                                        const cleaned = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : val;
                                                        updateItem(index, 'suggested_sale_price', cleaned === '' ? undefined : cleaned);
                                                    }}
                                                    className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-foreground font-mono text-center outline-none focus:border-primary placeholder:text-secondary/50 placeholder:text-[10px]"
                                                />
                                            </td>

                                            {/* İskonto */}
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={item.discount_rate}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(',', '.').replace(/[^0-9.]/g, '');
                                                        const parts = val.split('.');
                                                        const cleaned = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : val;
                                                        updateItem(index, 'discount_rate', cleaned);
                                                    }}
                                                    className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-foreground text-center outline-none focus:border-primary"
                                                />
                                            </td>

                                            {/* İskonto Adedi */}
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={item.discount_quantity ?? ''}
                                                    placeholder="Tümü"
                                                    title="İskonto sadece bu kadar adede uygulanır. Boş bırakılırsa tüm miktara uygulanır."
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(',', '.').replace(/[^0-9.]/g, '');
                                                        const parts = val.split('.');
                                                        const cleaned = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : val;
                                                        updateItem(index, 'discount_quantity', cleaned === '' ? undefined : cleaned);
                                                    }}
                                                    className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-foreground text-center outline-none focus:border-primary placeholder:text-secondary/50 placeholder:text-[10px]"
                                                />
                                            </td>

                                            {/* KDV */}
                                            <td className="p-2">
                                                <select
                                                    value={item.vat_rate}
                                                    onChange={(e) => updateItem(index, 'vat_rate', parseFloat(e.target.value))}
                                                    className="w-full bg-background border border-border rounded-lg px-1 py-1.5 text-foreground text-center text-xs"
                                                >
                                                    <option value="0">%0</option>
                                                    <option value="1">%1</option>
                                                    <option value="10">%10</option>
                                                    <option value="20">%20</option>
                                                </select>
                                            </td>

                                            {/* Toplam */}
                                            <td className="p-2 text-right font-black text-foreground bg-primary/5 font-mono">
                                                {formatCurrency(item.line_total_with_vat || 0)}
                                            </td>

                                            {/* Sil */}
                                            <td className="p-2 text-center">
                                                {invoice.items.length > 1 && (
                                                    <button
                                                        onClick={() => removeItem(index)}
                                                        className="text-rose-500/50 hover:text-rose-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Toplamlar ve Notlar */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Notlar */}
                        <div className="glass-card p-4 space-y-2">
                            <label className="text-xs font-bold text-secondary uppercase">Notlar</label>
                            <textarea
                                value={invoice.notes}
                                onChange={(e) => setInvoice(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Fatura ile ilgili notlarınız..."
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary resize-none"
                                rows={4}
                            />
                        </div>

                        {/* Toplamlar */}
                        <div className="glass-card p-4 space-y-3">
                            <h3 className="text-xs font-bold text-secondary uppercase flex items-center gap-2">
                                <Calculator className="w-4 h-4" />
                                Fatura Toplamları
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-secondary">Ara Toplam:</span>
                                    <span className="text-sm font-bold text-foreground font-mono">{formatCurrency(totals.subtotal || 0)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-emerald-500">KDV Toplam:</span>
                                    <span className="text-sm font-bold text-emerald-500 font-mono">+{formatCurrency(totals.total_vat || 0)}</span>
                                </div>
                                <div className="border-t border-white/5 pt-4">
                                    <div className="bg-emerald-500/10 rounded-2xl border border-emerald-500/20 p-5 flex flex-col gap-1 items-end relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.3em]">Genel Toplam (KDV DAHL)</span>
                                        <span className="text-3xl font-bold text-emerald-500 font-mono tracking-tighter">
                                            {formatCurrency(totals.grand_total || 0).replace('₺', '')} <span className="text-sm">₺</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showAIAnalyzer && (
                <AIPDFInvoiceAnalyzer
                    onAnalyzed={handleAIAnalyzed}
                    onClose={() => setShowAIAnalyzer(false)}
                />
            )}
        </div>
    );
}
