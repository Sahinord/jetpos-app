"use client";

import { useState, useEffect, useRef } from 'react';
import {
    RotateCcw, Save, Search, Trash2, AlertCircle, Receipt, Package
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/lib/tenant-context';

interface ReturnItem {
    id: string;
    product_id: string;
    product_name: string;
    product_code: string;
    quantity: number;
    unit_price: number;
    vat_rate: number;
    vat_amount: number;
    total_amount: number;
    return_reason: string;
}

export default function IadeFaturasi() {
    const { currentTenant } = useTenant();
    const [invoiceNo, setInvoiceNo] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [originalInvoiceNo, setOriginalInvoiceNo] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);

    const [items, setItems] = useState<ReturnItem[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [products, setProducts] = useState<any[]>([]);

    const [notes, setNotes] = useState('');
    const isSavingRef = useRef(false);

    useEffect(() => {
        if (currentTenant) {
            fetchCustomers();
            fetchProducts();
            generateInvoiceNo();
        }
    }, [currentTenant]);

    const generateInvoiceNo = async () => {
        const { data } = await supabase
            .from('invoices')
            .select('invoice_number')
            .eq('tenant_id', currentTenant?.id)
            .eq('invoice_type', 'sales_return')
            .order('created_at', { ascending: false })
            .limit(1);

        if (data && data.length > 0) {
            const lastNo = parseInt(data[0].invoice_number.replace('IF', '')) || 0;
            setInvoiceNo(`IF${String(lastNo + 1).padStart(8, '0')}`);
        } else {
            setInvoiceNo(`IF${String(1).padStart(8, '0')}`);
        }
    };

    const fetchCustomers = async () => {
        const { data } = await supabase
            .from('cari_hesaplar')
            .select('*')
            .eq('tenant_id', currentTenant?.id)
            .order('unvani');
        setCustomers(data || []);
    };

    const fetchProducts = async () => {
        const { data } = await supabase
            .from('products')
            .select('*')
            .eq('tenant_id', currentTenant?.id)
            .order('name');
        setProducts(data || []);
    };

    const addProduct = (product: any) => {
        const vatAmount = (product.sale_price * product.vat_rate) / 100;
        const newItem: ReturnItem = {
            id: Date.now().toString(),
            product_id: product.id,
            product_name: product.name,
            product_code: product.barcode || '',
            quantity: 1,
            unit_price: product.sale_price,
            vat_rate: product.vat_rate,
            vat_amount: vatAmount,
            total_amount: product.sale_price + vatAmount,
            return_reason: ''
        };
        setItems([...items, newItem]);
        setProductSearch('');
    };

    const updateQuantity = (itemId: string, newQuantity: number) => {
        setItems(items.map(item => {
            if (item.id === itemId) {
                const vatAmount = (item.unit_price * newQuantity * item.vat_rate) / 100;
                return {
                    ...item,
                    quantity: newQuantity,
                    vat_amount: vatAmount,
                    total_amount: (item.unit_price * newQuantity) + vatAmount
                };
            }
            return item;
        }));
    };

    const updateReturnReason = (itemId: string, reason: string) => {
        setItems(items.map(item =>
            item.id === itemId ? { ...item, return_reason: reason } : item
        ));
    };

    const removeItem = (itemId: string) => {
        setItems(items.filter(i => i.id !== itemId));
    };

    const calculateTotals = () => {
        const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
        const totalVat = items.reduce((sum, item) => sum + item.vat_amount, 0);
        const total = subtotal + totalVat;
        return { subtotal, totalVat, total };
    };

    const handleSave = async () => {
        if (isSavingRef.current) return;
        isSavingRef.current = true;

        if (!selectedCustomer) {
            alert('Lütfen müşteri seçin!');
            isSavingRef.current = false;
            return;
        }
        if (items.length === 0) {
            alert('Lütfen en az bir ürün ekleyin!');
            isSavingRef.current = false;
            return;
        }
        if (!originalInvoiceNo) {
            alert('Lütfen orijinal fatura numarasını girin!');
            isSavingRef.current = false;
            return;
        }

        const totals = calculateTotals();

        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .insert({
                tenant_id: currentTenant?.id,
                invoice_type: 'sales_return',
                invoice_number: invoiceNo,
                invoice_date: invoiceDate,
                cari_id: selectedCustomer.id,
                cari_name: selectedCustomer.unvani,
                subtotal: -totals.subtotal, // Negatif (İade)
                total_vat: -totals.totalVat,
                grand_total: -totals.total,
                payment_status: 'refunded',
                notes: `İade - Orijinal Fatura: ${originalInvoiceNo}\n${notes}`
            })
            .select()
            .single();

        if (invoiceError) {
            alert('Hata: ' + invoiceError.message);
            isSavingRef.current = false;
            return;
        }

        const invoiceItems = items.map(item => {
            const qty = Number(item.quantity) || 0;
            const lineTotal = item.unit_price * qty;
            return {
                tenant_id: currentTenant?.id,
                invoice_id: invoice.id,
                product_id: item.product_id,
                item_name: item.product_name,
                item_code: item.product_code || null,
                quantity: -qty, // Negatif miktar
                unit_price: item.unit_price,
                discount_rate: 0,
                discount_amount: 0,
                vat_rate: item.vat_rate,
                vat_amount: -item.vat_amount,
                line_total: -(Math.round(lineTotal * 100) / 100),
                line_total_with_vat: -item.total_amount,
                description: item.return_reason
            };
        });

        const { error: itemsError } = await supabase
            .from('invoice_items')
            .insert(invoiceItems);

        if (itemsError) {
            alert('Hata: ' + itemsError.message);
            isSavingRef.current = false;
            return;
        }

        // Stok Güncelleme (iade alınan mal stoğa geri döner)
        for (const item of items) {
            if (item.product_id) {
                await supabase.rpc('increment_stock', {
                    p_product_id: item.product_id,
                    p_qty: Number(item.quantity) || 0
                });
            }
        }

        // Cariye alacak kaydı (iade alıyoruz, borcunu azaltıyoruz)
        const { error: cariError } = await supabase.from('cari_hareketler').insert({
            tenant_id: currentTenant?.id,
            cari_id: selectedCustomer.id,
            hareket_tipi: 'iade_faturasi',
            aciklama: `İade Faturası - ${invoiceNo} (Org: ${originalInvoiceNo})`,
            borc: 0,
            alacak: totals.total, // Müşterinin borcunu azalt
            tarih: invoiceDate,
            belge_no: invoiceNo
        });

        if (cariError) {
            alert('İade kaydedildi ama cari hesaba işlenemedi: ' + cariError.message);
            isSavingRef.current = false;
            return;
        }

        isSavingRef.current = false;
        alert('İade faturası kaydedildi!');
        resetForm();
    };

    const resetForm = () => {
        setItems([]);
        setSelectedCustomer(null);
        setCustomerSearch('');
        setOriginalInvoiceNo('');
        setNotes('');
        generateInvoiceNo();
    };

    const totals = calculateTotals();

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0);

    return (
        <div className="space-y-4 max-w-[1600px] mx-auto p-4">
            {/* Header / Actions */}
            <div className="flex items-center justify-end gap-2 pb-2 border-b border-white/5">
                <button
                    onClick={handleSave}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
                >
                    <Save className="w-4 h-4" />
                    İADE FATURASINI KAYDET
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left - Fatura Bilgileri */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="glass-card p-5 space-y-5 bg-white/[0.01] relative z-50">
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                            <h2 className="text-[10px] font-bold text-orange-500 uppercase tracking-[0.25em] flex items-center gap-2">
                                <Receipt className="w-4 h-4" />
                                Fatura Bilgileri
                            </h2>
                            <span className="text-xs font-bold text-orange-500 font-mono">{invoiceNo}</span>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest">İade Tarihi</label>
                                <input
                                    type="date"
                                    value={invoiceDate}
                                    onChange={(e) => setInvoiceDate(e.target.value)}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-orange-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Orijinal Fatura No *</label>
                                <input
                                    type="text"
                                    value={originalInvoiceNo}
                                    onChange={(e) => setOriginalInvoiceNo(e.target.value)}
                                    placeholder="SF00000001"
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-orange-500"
                                />
                            </div>

                            <div className="space-y-2 relative">
                                <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Müşteri</label>
                                <button
                                    onClick={() => setShowCustomerModal(!showCustomerModal)}
                                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2.5 text-left text-sm font-medium text-white hover:border-orange-500/30 transition-all flex items-center justify-between shadow-sm"
                                >
                                    <span className={selectedCustomer ? 'text-white' : 'text-secondary/50'}>
                                        {selectedCustomer?.unvani || 'Müşteri seçin...'}
                                    </span>
                                    <Search className="w-4 h-4 text-secondary/40" />
                                </button>

                                {showCustomerModal && (
                                    <div className="absolute z-50 top-full mt-2 w-full bg-card border border-border rounded-xl shadow-2xl max-h-72 overflow-y-auto">
                                        <div className="sticky top-0 bg-card p-3 border-b border-border">
                                            <input
                                                type="text"
                                                value={customerSearch}
                                                onChange={(e) => setCustomerSearch(e.target.value)}
                                                placeholder="Müşteri ara..."
                                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500"
                                                autoFocus
                                            />
                                        </div>
                                        <div>
                                            {customers
                                                .filter(c => (c.unvani || '').toLowerCase().includes(customerSearch.toLowerCase()))
                                                .map(customer => (
                                                    <button
                                                        key={customer.id}
                                                        onClick={() => {
                                                            setSelectedCustomer(customer);
                                                            setShowCustomerModal(false);
                                                            setCustomerSearch('');
                                                        }}
                                                        className="w-full px-4 py-3 text-left hover:bg-orange-500/10 transition-colors border-b border-border/50 last:border-0"
                                                    >
                                                        <div className="font-bold text-sm text-foreground">{customer.unvani}</div>
                                                        <div className="text-xs text-secondary">{customer.vergi_no || customer.tc_no || 'Kimlik bilgisi yok'}</div>
                                                    </button>
                                                ))
                                            }
                                            {customers.filter(c => (c.unvani || '').toLowerCase().includes(customerSearch.toLowerCase())).length === 0 && (
                                                <div className="p-4 text-center text-secondary text-sm">Müşteri bulunamadı</div>
                                            )}
                                        </div>
                                        <div className="sticky bottom-0 bg-card p-2 border-t border-border">
                                            <button
                                                onClick={() => setShowCustomerModal(false)}
                                                className="w-full px-3 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 rounded-lg text-xs font-bold transition-all"
                                            >
                                                Kapat
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Notlar</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-orange-500 resize-none"
                                    placeholder="İade sebebi veya notlar..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Uyarı */}
                    <div className="glass-card p-4 bg-orange-500/[0.04] border-orange-500/10">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-secondary">
                                İade faturası müşterinin borcunu azaltır ve iade alınan ürünleri stoğa geri ekler.
                            </p>
                        </div>
                    </div>

                    {/* Toplamlar */}
                    <div className="glass-card p-4 space-y-3">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-secondary">İade Tutarı:</span>
                                <span className="text-sm font-bold text-foreground font-mono">-{formatCurrency(totals.subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-orange-500">KDV:</span>
                                <span className="text-sm font-bold text-orange-500 font-mono">-{formatCurrency(totals.totalVat)}</span>
                            </div>
                            <div className="border-t border-white/5 pt-4">
                                <div className="bg-orange-500/10 rounded-2xl border border-orange-500/20 p-5 flex flex-col gap-1 items-end relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-[0.3em]">Toplam İade</span>
                                    <span className="text-3xl font-bold text-orange-500 font-mono tracking-tighter">
                                        -{formatCurrency(totals.total).replace('₺', '')} <span className="text-sm">₺</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right - Ürünler / İade Listesi */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Ürün Arama */}
                    <div className="glass-card p-4 relative z-40">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/40" />
                            <input
                                type="text"
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                placeholder="İade edilecek ürünü ara..."
                                className="w-full bg-background border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-foreground outline-none focus:border-orange-500"
                            />
                        </div>

                        {productSearch && (
                            <div className="mt-2 max-h-48 overflow-y-auto bg-card border border-border rounded-xl shadow-2xl">
                                {products
                                    .filter(p =>
                                        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                                        p.barcode?.includes(productSearch)
                                    )
                                    .slice(0, 10)
                                    .map(product => (
                                        <button
                                            key={product.id}
                                            onClick={() => addProduct(product)}
                                            className="w-full px-4 py-2.5 hover:bg-orange-500/10 text-left border-b border-border/50 last:border-0 transition-colors"
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-bold text-foreground text-sm">{product.name}</p>
                                                    <p className="text-[10px] text-secondary font-mono uppercase">{product.barcode || 'Barkodsuz'}</p>
                                                </div>
                                                <span className="text-orange-500 font-bold font-mono text-sm">{formatCurrency(product.sale_price)}</span>
                                            </div>
                                        </button>
                                    ))
                                }
                                {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.barcode?.includes(productSearch)).length === 0 && (
                                    <div className="p-4 text-center text-secondary text-sm">Ürün bulunamadı</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Kalemler */}
                    <div className="glass-card p-5 space-y-5 bg-white/[0.01]">
                        <h2 className="text-[10px] font-bold text-orange-500 uppercase tracking-[0.25em] flex items-center gap-2 border-b border-white/5 pb-3">
                            <Package className="w-4 h-4" />
                            İade Edilecek Ürünler
                        </h2>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="text-secondary/60 font-semibold uppercase tracking-wider text-[9px] border-b border-white/5">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Ürün</th>
                                        <th className="px-4 py-3 text-center w-24">Miktar</th>
                                        <th className="px-4 py-3 text-right w-28">Fiyat</th>
                                        <th className="px-4 py-3 text-right w-32 bg-white/[0.02]">Toplam</th>
                                        <th className="px-4 py-3 text-left w-48">İade Sebebi</th>
                                        <th className="px-4 py-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-20 text-center">
                                                <RotateCcw className="w-10 h-10 mx-auto mb-3 opacity-10 text-foreground" />
                                                <p className="text-xs font-bold text-secondary/40 uppercase tracking-widest">Henüz iade ürünü eklenmedi</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map(item => (
                                            <tr key={item.id} className="hover:bg-white/[0.02] group">
                                                <td className="p-2">
                                                    <p className="font-medium text-foreground">{item.product_name}</p>
                                                    <p className="text-[10px] text-secondary/50 font-mono">{item.product_code}</p>
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value) || 0)}
                                                        className="w-full bg-orange-500/10 border border-orange-500/20 rounded-lg px-2 py-1.5 text-orange-500 font-bold text-center outline-none focus:border-orange-500"
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </td>
                                                <td className="p-2 text-right font-mono text-foreground">{formatCurrency(item.unit_price)}</td>
                                                <td className="p-2 text-right font-black text-orange-500 bg-orange-500/5 font-mono">-{formatCurrency(item.total_amount)}</td>
                                                <td className="p-2">
                                                    <input
                                                        type="text"
                                                        value={item.return_reason}
                                                        onChange={(e) => updateReturnReason(item.id, e.target.value)}
                                                        placeholder="Sebep..."
                                                        className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-foreground text-xs outline-none focus:border-orange-500"
                                                    />
                                                </td>
                                                <td className="p-2 text-center">
                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        className="text-rose-500/50 hover:text-rose-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
