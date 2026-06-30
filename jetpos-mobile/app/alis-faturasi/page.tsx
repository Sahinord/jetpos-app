"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { apiFetch } from '@/lib/api';
import {
    ArrowLeft, Sparkles, Upload, Camera,
    Search, Plus, Trash2, Check, Loader2, Building2, X, Receipt
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';

interface InvoiceItem {
    product_id?: string;
    item_name: string;
    item_code: string;
    quantity: number;
    unit: string;
    unit_price: number;
    discount_rate: number;
    vat_rate: number;
    old_purchase_price?: number;
    old_sale_price?: number;
    suggested_sale_price?: number;
}

interface Cari {
    id: string;
    unvani: string;
    vergi_no?: string;
    vergi_dairesi?: string;
}

// İskonto/KDV hesaplaması — desktop AlisFaturasi.tsx ile aynı mantık.
function calculateItemTotals(item: InvoiceItem) {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unit_price) || 0;
    const discount = Number(item.discount_rate) || 0;
    const vat = Number(item.vat_rate) || 0;

    const discountAmount = (qty * price * discount) / 100;
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

const emptyItem = (): InvoiceItem => ({
    item_name: '', item_code: '', quantity: 1, unit: 'ADET', unit_price: 0, discount_rate: 0, vat_rate: 20
});

type Step = 'upload' | 'analyzing' | 'review' | 'done';

export default function AlisFaturasiPage() {
    const router = useRouter();
    const isSavingRef = useRef(false);

    const [step, setStep] = useState<Step>('upload');
    const [progressText, setProgressText] = useState('');
    const [tenantId, setTenantId] = useState('');

    const [cariList, setCariList] = useState<Cari[]>([]);
    const [cariSearch, setCariSearch] = useState('');
    const [showCariSearch, setShowCariSearch] = useState(false);

    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [cariId, setCariId] = useState('');
    const [cariName, setCariName] = useState('');
    const [cariVkn, setCariVkn] = useState('');
    const [cariTaxOffice, setCariTaxOffice] = useState('');
    const [items, setItems] = useState<InvoiceItem[]>([emptyItem()]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const tid = localStorage.getItem('tenantId');
        if (!tid) {
            router.push('/');
            return;
        }
        setTenantId(tid);
        supabase.rpc('set_current_tenant', { tenant_id: tid }).then(() => {
            fetchCariList(tid);
        });
    }, []);

    const fetchCariList = async (tid: string) => {
        const { data } = await supabase
            .from('cari_hesaplar')
            .select('id, unvani, vergi_no, vergi_dairesi')
            .eq('tenant_id', tid)
            .order('unvani');
        if (data) setCariList(data);
    };

    const filteredCari = useMemo(() => {
        const term = cariSearch.toLowerCase();
        return cariList.filter(c =>
            c.unvani.toLowerCase().includes(term) || (c.vergi_no || '').includes(cariSearch)
        );
    }, [cariList, cariSearch]);

    const selectCari = (c: Cari) => {
        setCariId(c.id);
        setCariName(c.unvani);
        setCariVkn(c.vergi_no || '');
        setCariTaxOffice(c.vergi_dairesi || '');
        setShowCariSearch(false);
    };

    const enrichedItems = useMemo(() => items.map(i => ({ ...i, ...calculateItemTotals(i) })), [items]);
    const totals = useMemo(() => {
        const subtotal = enrichedItems.reduce((s, i) => s + (i.line_total || 0), 0);
        const total_vat = enrichedItems.reduce((s, i) => s + (i.vat_amount || 0), 0);
        const grand_total = enrichedItems.reduce((s, i) => s + (i.line_total_with_vat || 0), 0);
        return {
            subtotal: Math.round(subtotal * 100) / 100,
            total_vat: Math.round(total_vat * 100) / 100,
            grand_total: Math.round(grand_total * 100) / 100
        };
    }, [enrichedItems]);

    const handleFile = async (file: File) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage && file.type !== 'application/pdf') {
            toast.error('Lütfen PDF veya fotoğraf seçin');
            return;
        }

        setStep('analyzing');
        try {
            setProgressText(isImage ? 'Fotoğraf yükleniyor...' : 'PDF yükleniyor...');
            const ext = isImage ? (file.name.split('.').pop() || 'jpg') : 'pdf';
            const fileName = `invoice_${Date.now()}.${ext}`;
            const { error: uploadError } = await supabase.storage.from('invoices').upload(fileName, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('invoices').getPublicUrl(fileName);

            setProgressText('AI ile analiz ediliyor...');
            const aiResult = await apiFetch('/api/analyze-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...(isImage ? { image_url: publicUrl } : { pdf_url: publicUrl }),
                    tenant_id: tenantId
                })
            });

            // AI'nin bulduğu tedarikçi ismini arama kutusuna öneri olarak koy.
            setCariSearch(aiResult.supplier_name || '');
            setInvoiceNumber(aiResult.invoice_number || '');
            if (aiResult.invoice_date) setInvoiceDate(aiResult.invoice_date);

            const aiItems: InvoiceItem[] = (aiResult.items || []).map((it: any) => ({
                item_name: it.product_name || '',
                item_code: '',
                quantity: Number(it.quantity) || 1,
                unit: it.unit || 'ADET',
                unit_price: Number(it.net_price || it.gross_price) || 0,
                discount_rate: 0,
                vat_rate: Number(it.vat_rate) || 20
            }));
            setItems(aiItems.length > 0 ? aiItems : [emptyItem()]);

            setStep('review');
            toast.success('Fatura okundu — kontrol edip kaydet');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
            toast.error('Analiz başarısız: ' + message);
            setStep('upload');
        }
    };

    const updateItem = (index: number, patch: Partial<InvoiceItem>) => {
        setItems(prev => prev.map((it, i) => i === index ? { ...it, ...patch } : it));
    };

    const removeItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (isSavingRef.current) return;
        if (!cariId) {
            toast.error('Lütfen tedarikçi seçin!');
            return;
        }
        if (items.some(i => !i.item_name || i.quantity <= 0 || i.unit_price <= 0)) {
            toast.error('Lütfen tüm kalem bilgilerini doldurun!');
            return;
        }

        isSavingRef.current = true;
        setSaving(true);
        try {
            let finalInvoiceNumber = invoiceNumber.trim();
            if (!finalInvoiceNumber) {
                const { data: nextNumber } = await supabase.rpc('get_next_invoice_number', {
                    p_tenant_id: tenantId,
                    p_invoice_type: 'purchase'
                });
                finalInvoiceNumber = nextNumber || `ALIS-${Date.now()}`;
            }

            const { data: invoiceData, error: invoiceError } = await supabase
                .from('invoices')
                .insert({
                    tenant_id: tenantId,
                    invoice_number: finalInvoiceNumber,
                    invoice_type: 'purchase',
                    invoice_date: invoiceDate,
                    due_date: invoiceDate,
                    cari_id: cariId,
                    cari_name: cariName,
                    cari_vkn: cariVkn,
                    cari_tax_office: cariTaxOffice,
                    status: 'approved',
                    payment_status: 'unpaid',
                    subtotal: totals.subtotal,
                    total_vat: totals.total_vat,
                    grand_total: totals.grand_total
                })
                .select()
                .single();

            if (invoiceError) throw invoiceError;

            const finalItems = [...items];
            for (let i = 0; i < finalItems.length; i++) {
                const item = finalItems[i];
                if (!item.product_id && item.item_name.trim()) {
                    const { data: existingProd } = await supabase
                        .from('products')
                        .select('id, purchase_price, sale_price')
                        .ilike('name', item.item_name.trim())
                        .eq('tenant_id', tenantId)
                        .maybeSingle();

                    if (existingProd) {
                        item.product_id = existingProd.id;
                        item.old_purchase_price = existingProd.purchase_price || 0;
                        item.old_sale_price = existingProd.sale_price || 0;
                    } else {
                        const { data: newProd } = await supabase
                            .from('products')
                            .insert({
                                tenant_id: tenantId,
                                name: item.item_name.trim(),
                                unit: item.unit,
                                vat_rate: item.vat_rate,
                                purchase_price: Number(item.unit_price) || 0,
                                sale_price: 0,
                                stock_quantity: 0,
                                status: 'active'
                            })
                            .select()
                            .single();
                        if (newProd) item.product_id = newProd.id;
                    }
                }
            }

            const itemsToInsert = finalItems.map(item => {
                const calc = calculateItemTotals(item);
                return {
                    tenant_id: tenantId,
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

            const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert);
            if (itemsError) throw itemsError;

            // Stok artışı + fiyat güncelleme (desktop AlisFaturasi.tsx ile aynı mantık)
            for (const item of finalItems) {
                if (!item.product_id) continue;
                const calc = calculateItemTotals(item);
                const qty = Number(item.quantity) || 0;
                const effectivePurchasePrice = qty > 0
                    ? Math.round((calc.line_total / qty) * 100) / 100
                    : Number(item.unit_price) || 0;

                await supabase.from('products').update({ purchase_price: effectivePurchasePrice }).eq('id', item.product_id);
                await supabase.rpc('increment_stock', { p_product_id: item.product_id, p_qty: qty });

                if (item.old_purchase_price !== undefined && Number(item.old_purchase_price) !== effectivePurchasePrice) {
                    await supabase.from('product_change_logs').insert({
                        product_id: item.product_id,
                        product_name: item.item_name,
                        change_type: 'price',
                        field_name: 'purchase_price',
                        old_value: String(item.old_purchase_price),
                        new_value: String(effectivePurchasePrice),
                        change_source: 'invoice',
                        changed_by: `Alış Faturası (Mobil): ${finalInvoiceNumber}`,
                        tenant_id: tenantId
                    });
                }
            }

            // Cari hesaba alacak yaz (tedarikçi bizden alacaklı duruma geçer)
            const { error: cariError } = await supabase.from('cari_hareketler').insert({
                tenant_id: tenantId,
                cari_id: cariId,
                hareket_tipi: 'borclandirma',
                aciklama: `Alış Faturası (Mobil): ${finalInvoiceNumber}`,
                alacak: totals.grand_total,
                borc: 0,
                tarih: invoiceDate,
                belge_no: finalInvoiceNumber
            });
            if (cariError) throw cariError;

            toast.success('Alış faturası kaydedildi, stoklar güncellendi!');
            setStep('done');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
            if ((err as { code?: string })?.code === '23505') {
                toast.error('Bu fatura numarası zaten kullanılıyor.');
            } else {
                toast.error('Hata: ' + message);
            }
        } finally {
            setSaving(false);
            isSavingRef.current = false;
        }
    };

    const resetFlow = () => {
        setCariId(''); setCariName(''); setCariVkn(''); setCariTaxOffice(''); setCariSearch('');
        setInvoiceNumber('');
        setInvoiceDate(new Date().toISOString().split('T')[0]);
        setItems([emptyItem()]);
        setStep('upload');
    };

    return (
        <div className="min-h-screen bg-background pb-24">
            <header className="sticky top-0 z-50 glass border-b border-white/5 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 glass-dark rounded-xl border border-white/5">
                        <ArrowLeft size={20} className="text-secondary" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight leading-none uppercase">Alış Faturası</h1>
                        <p className="text-[10px] font-black text-cyan-glow tracking-[2px] uppercase mt-1">AI ile Oku</p>
                    </div>
                </div>
                <div className="w-11 h-11 rounded-2xl glass border border-white/10 flex items-center justify-center">
                    <Receipt className="w-6 h-6 text-cyan-glow" />
                </div>
            </header>

            <div className="p-6 space-y-6">
                {step === 'upload' && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="group relative block w-full h-36 border-2 border-dashed border-white/10 active:border-primary/60 rounded-3xl cursor-pointer transition-all overflow-hidden glass-dark">
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                                />
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                    <Upload className="w-8 h-8 text-cyan-glow" />
                                    <p className="text-sm font-black text-white">PDF Yükle</p>
                                    <p className="text-[10px] text-secondary">Dosyadan seç</p>
                                </div>
                            </label>

                            <label className="group relative block w-full h-36 border-2 border-dashed border-white/10 active:border-primary/60 rounded-3xl cursor-pointer transition-all overflow-hidden glass-dark">
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                                />
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                    <Camera className="w-8 h-8 text-cyan-glow" />
                                    <p className="text-sm font-black text-white">Fotoğraf Çek</p>
                                    <p className="text-[10px] text-secondary">Kamera / galeri</p>
                                </div>
                            </label>
                        </div>

                        <div className="glass-dark border border-white/10 rounded-3xl p-5">
                            <h3 className="text-[10px] font-black text-cyan-glow mb-3 flex items-center gap-2 uppercase tracking-[2px]">
                                <Sparkles className="w-3.5 h-3.5" />
                                JetPos AI Ne Yapar?
                            </h3>
                            <ul className="space-y-2 text-[11px] text-secondary font-bold">
                                <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" /> Tedarikçi, fatura no ve tarih bilgisini bulur</li>
                                <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" /> Ürün kalemlerini ve fiyatları çıkarır</li>
                                <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" /> Onayladığında stoklar otomatik artar</li>
                            </ul>
                        </div>
                    </>
                )}

                {step === 'analyzing' && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 className="w-10 h-10 text-cyan-glow animate-spin" />
                        <p className="text-sm font-black text-white">{progressText}</p>
                    </div>
                )}

                {step === 'review' && (
                    <>
                        {/* Tedarikçi Seç */}
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-secondary tracking-[3px] uppercase px-2">Tedarikçi</p>
                            <button
                                onClick={() => setShowCariSearch(true)}
                                className="w-full glass-dark border border-white/10 rounded-2xl p-4 flex items-center gap-3 text-left"
                            >
                                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                    <Building2 className="w-4 h-4 text-cyan-glow" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-white truncate">{cariName || 'Tedarikçi seçin'}</p>
                                    {cariVkn && <p className="text-[10px] text-secondary">VKN: {cariVkn}</p>}
                                </div>
                                <Search className="w-4 h-4 text-secondary shrink-0" />
                            </button>
                        </div>

                        {/* Fatura Bilgileri */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="glass-dark border border-white/10 rounded-2xl p-3">
                                <label className="text-[9px] font-black text-secondary uppercase tracking-wider">Fatura No</label>
                                <input
                                    value={invoiceNumber}
                                    onChange={(e) => setInvoiceNumber(e.target.value)}
                                    placeholder="Otomatik"
                                    className="w-full bg-transparent text-sm font-bold text-white outline-none mt-1"
                                />
                            </div>
                            <div className="glass-dark border border-white/10 rounded-2xl p-3">
                                <label className="text-[9px] font-black text-secondary uppercase tracking-wider">Tarih</label>
                                <input
                                    type="date"
                                    value={invoiceDate}
                                    onChange={(e) => setInvoiceDate(e.target.value)}
                                    className="w-full bg-transparent text-sm font-bold text-white outline-none mt-1"
                                />
                            </div>
                        </div>

                        {/* Kalemler */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-2">
                                <p className="text-[10px] font-black text-secondary tracking-[3px] uppercase">Ürün Kalemleri</p>
                                <button
                                    onClick={() => setItems(prev => [...prev, emptyItem()])}
                                    className="flex items-center gap-1 text-[10px] font-black text-cyan-glow uppercase"
                                >
                                    <Plus size={14} /> Ekle
                                </button>
                            </div>

                            {enrichedItems.map((item, idx) => (
                                <div key={idx} className="glass-dark border border-white/10 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <input
                                            value={item.item_name}
                                            onChange={(e) => updateItem(idx, { item_name: e.target.value })}
                                            placeholder="Ürün adı"
                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-white outline-none"
                                        />
                                        <button onClick={() => removeItem(idx)} className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 shrink-0">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        <div>
                                            <label className="text-[8px] font-black text-secondary uppercase">Adet</label>
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(idx, { quantity: parseFloat(e.target.value) || 0 })}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-bold text-white outline-none mt-0.5"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[8px] font-black text-secondary uppercase">Fiyat</label>
                                            <input
                                                type="number"
                                                value={item.unit_price}
                                                onChange={(e) => updateItem(idx, { unit_price: parseFloat(e.target.value) || 0 })}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-bold text-white outline-none mt-0.5"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[8px] font-black text-secondary uppercase">İsk %</label>
                                            <input
                                                type="number"
                                                value={item.discount_rate}
                                                onChange={(e) => updateItem(idx, { discount_rate: parseFloat(e.target.value) || 0 })}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-bold text-white outline-none mt-0.5"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[8px] font-black text-secondary uppercase">KDV %</label>
                                            <input
                                                type="number"
                                                value={item.vat_rate}
                                                onChange={(e) => updateItem(idx, { vat_rate: parseFloat(e.target.value) || 0 })}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-bold text-white outline-none mt-0.5"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <span className="text-xs font-black text-emerald-400">
                                            {item.line_total_with_vat?.toFixed(2)} ₺
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Toplamlar */}
                        <div className="glass-dark border border-border-glow/20 rounded-2xl p-5 space-y-2">
                            <div className="flex justify-between text-xs"><span className="text-secondary font-bold">Ara Toplam</span><span className="text-white font-bold">{totals.subtotal.toFixed(2)} ₺</span></div>
                            <div className="flex justify-between text-xs"><span className="text-secondary font-bold">KDV</span><span className="text-white font-bold">{totals.total_vat.toFixed(2)} ₺</span></div>
                            <div className="flex justify-between text-base pt-2 border-t border-white/10"><span className="text-cyan-glow font-black uppercase">Genel Toplam</span><span className="text-emerald-400 font-black">{totals.grand_total.toFixed(2)} ₺</span></div>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                            {saving ? 'Kaydediliyor...' : 'Faturayı Kaydet ve Stoğu Güncelle'}
                        </button>
                    </>
                )}

                {step === 'done' && (
                    <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
                        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <Check className="w-10 h-10 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white">Fatura Kaydedildi!</h2>
                            <p className="text-xs text-secondary font-bold mt-1">Stoklar otomatik güncellendi.</p>
                        </div>
                        <div className="flex gap-3 w-full pt-4">
                            <button onClick={resetFlow} className="flex-1 py-3.5 glass-dark border border-white/10 rounded-2xl font-black text-white text-xs">
                                Yeni Fatura
                            </button>
                            <button onClick={() => router.push('/dashboard')} className="flex-1 py-3.5 bg-primary rounded-2xl font-black text-white text-xs">
                                Panele Dön
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Cari Search Modal */}
            {showCariSearch && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-end">
                    <div className="w-full bg-background border-t border-border-glow/20 rounded-t-[2rem] max-h-[80vh] flex flex-col">
                        <div className="p-5 border-b border-white/5 flex items-center gap-3">
                            <Search className="w-4 h-4 text-secondary shrink-0" />
                            <input
                                autoFocus
                                value={cariSearch}
                                onChange={(e) => setCariSearch(e.target.value)}
                                placeholder="Tedarikçi ara..."
                                className="flex-1 bg-transparent text-sm font-bold text-white outline-none"
                            />
                            <button onClick={() => setShowCariSearch(false)}>
                                <X className="w-5 h-5 text-secondary" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
                            {filteredCari.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => selectCari(c)}
                                    className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-white/5 active:bg-white/10 transition-all text-left"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                        <Building2 className="w-4 h-4 text-cyan-glow" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{c.unvani}</p>
                                        {c.vergi_no && <p className="text-[10px] text-secondary">VKN: {c.vergi_no}</p>}
                                    </div>
                                </button>
                            ))}
                            {filteredCari.length === 0 && (
                                <p className="text-center text-secondary text-xs font-bold py-10">Tedarikçi bulunamadı</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}
