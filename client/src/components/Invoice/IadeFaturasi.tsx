"use client";

import { useState, useEffect } from 'react';
import {
    RotateCcw, Plus, Save, Search, Trash2, AlertCircle
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
            .select('invoice_no')
            .eq('tenant_id', currentTenant?.id)
            .eq('invoice_type', 'iade')
            .order('created_at', { ascending: false })
            .limit(1);

        if (data && data.length > 0) {
            const lastNo = parseInt(data[0].invoice_no.replace('IF', ''));
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
            .order('unvan');
        setCustomers(data || []);
    };

    const fetchProducts = async () => {
        const { data } = await supabase
            .from('products')
            .select('*')
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
        if (!selectedCustomer) {
            alert('Lütfen müşteri seçin!');
            return;
        }
        if (items.length === 0) {
            alert('Lütfen en az bir ürün ekleyin!');
            return;
        }
        if (!originalInvoiceNo) {
            alert('Lütfen orijinal fatura numarasını girin!');
            return;
        }

        const totals = calculateTotals();

        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .insert({
                tenant_id: currentTenant?.id,
                invoice_type: 'iade',
                invoice_no: invoiceNo,
                invoice_date: invoiceDate,
                cari_id: selectedCustomer.id,
                cari_name: selectedCustomer.unvan,
                subtotal: -totals.subtotal, // Negatif (İade)
                vat_total: -totals.totalVat,
                total_amount: -totals.total,
                payment_status: 'refunded',
                notes: `İade - Orijinal Fatura: ${originalInvoiceNo}\n${notes}`,
                original_invoice_no: originalInvoiceNo
            })
            .select()
            .single();

        if (invoiceError) {
            alert('Hata: ' + invoiceError.message);
            return;
        }

        const invoiceItems = items.map(item => ({
            tenant_id: currentTenant?.id,
            invoice_id: invoice.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: -item.quantity, // Negatif miktar
            unit_price: item.unit_price,
            vat_rate: item.vat_rate,
            vat_amount: -item.vat_amount,
            total_amount: -item.total_amount,
            notes: item.return_reason
        }));

        const { error: itemsError } = await supabase
            .from('invoice_items')
            .insert(invoiceItems);

        if (itemsError) {
            alert('Hata: ' + itemsError.message);
            return;
        }

        // Cariye alacak kaydı (iade alıyoruz, borcunu azaltıyoruz)
        await supabase.from('cari_hareketler').insert({
            tenant_id: currentTenant?.id,
            cari_id: selectedCustomer.id,
            hareket_tipi: 'iade_faturasi',
            aciklama: `İade Faturası - ${invoiceNo} (Org: ${originalInvoiceNo})`,
            borc: 0,
            alacak: totals.total, // Müşterinin borcunu azalt
            tarih: invoiceDate
        });

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

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left - Customer & Details */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Fatura Bilgileri</h3>
                            <div className="text-right">
                                <span className="text-[10px] text-secondary uppercase font-bold">Fatura No:</span>
                                <span className="ml-2 text-xs font-bold text-orange-400 font-mono italic">{invoiceNo}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-secondary mb-2">İade Tarihi</label>
                                <input
                                    type="date"
                                    value={invoiceDate}
                                    onChange={(e) => setInvoiceDate(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-secondary mb-2">Orijinal Fatura No*</label>
                                <input
                                    type="text"
                                    value={originalInvoiceNo}
                                    onChange={(e) => setOriginalInvoiceNo(e.target.value)}
                                    placeholder="SF00000001"
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-secondary mb-2">Müşteri</label>
                                <button
                                    onClick={() => setShowCustomerModal(true)}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-left hover:border-orange-500 transition-colors"
                                >
                                    {selectedCustomer ? (
                                        <span className="text-white font-medium">{selectedCustomer.unvan}</span>
                                    ) : (
                                        <span className="text-secondary">Müşteri Seç...</span>
                                    )}
                                </button>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-secondary mb-2">Notlar</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500 resize-none"
                                    placeholder="İade sebebi veya notlar..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="glass-card p-4 bg-orange-500/10 border border-orange-500/20">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                            <div className="text-xs text-orange-200">
                                <p className="font-bold mb-1">Dikkat!</p>
                                <p>İade faturası, müşterinin borcunu azaltır ve stoku artırır.</p>
                            </div>
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="glass-card p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-secondary">İade Tutarı</span>
                                <span className="text-lg font-bold text-white">-{totals.subtotal.toFixed(2)} ₺</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-secondary">KDV</span>
                                <span className="text-lg font-bold text-orange-400">-{totals.totalVat.toFixed(2)} ₺</span>
                            </div>
                            <div className="h-px bg-white/10" />
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-white">TOPLAM İADE</span>
                                <span className="text-2xl font-black text-orange-400">-{totals.total.toFixed(2)} ₺</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        className="w-full px-6 py-3.5 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Save className="w-5 h-5" />
                        İade Faturasını Kaydet
                    </button>
                </div >

                {/* Right - Products */}
                < div className="lg:col-span-2 space-y-4" >
                    {/* Product Search */}
                    < div className="glass-card p-4" >
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                            <input
                                type="text"
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                placeholder="İade edilecek ürünü ara..."
                                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500"
                            />
                        </div>

                        {
                            productSearch && (
                                <div className="mt-2 max-h-48 overflow-y-auto bg-card border border-border rounded-xl">
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
                                                className="w-full px-4 py-3 hover:bg-white/5 text-left border-b border-border last:border-0 transition-colors"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-medium text-white">{product.name}</p>
                                                        <p className="text-xs text-secondary">{product.barcode}</p>
                                                    </div>
                                                    <span className="text-orange-400 font-bold">{product.sale_price} ₺</span>
                                                </div>
                                            </button>
                                        ))
                                    }
                                </div>
                            )
                        }
                    </div >

                    {/* Items Table */}
                    < div className="glass-card p-6" >
                        <h3 className="text-sm font-bold text-white mb-4">İade Edilecek Ürünler</h3>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left py-3 px-2 text-xs font-bold text-secondary">Ürün</th>
                                        <th className="text-center py-3 px-2 text-xs font-bold text-secondary">Miktar</th>
                                        <th className="text-right py-3 px-2 text-xs font-bold text-secondary">Fiyat</th>
                                        <th className="text-right py-3 px-2 text-xs font-bold text-secondary">Toplam</th>
                                        <th className="text-left py-3 px-2 text-xs font-bold text-secondary">İade Sebebi</th>
                                        <th className="w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-secondary">
                                                <RotateCcw className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                                <p className="text-sm">Henüz iade ürünü eklenmedi</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map(item => (
                                            <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                                                <td className="py-3 px-2">
                                                    <p className="font-medium text-white text-sm">{item.product_name}</p>
                                                    <p className="text-xs text-secondary">{item.product_code}</p>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value) || 0)}
                                                        className="w-20 px-2 py-1 bg-white/5 border border-white/10 rounded text-center text-white"
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </td>
                                                <td className="py-3 px-2 text-right text-white">{item.unit_price.toFixed(2)} ₺</td>
                                                <td className="py-3 px-2 text-right font-bold text-orange-400">-{item.total_amount.toFixed(2)} ₺</td>
                                                <td className="py-3 px-2">
                                                    <input
                                                        type="text"
                                                        value={item.return_reason}
                                                        onChange={(e) => updateReturnReason(item.id, e.target.value)}
                                                        placeholder="Sebep..."
                                                        className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-white"
                                                    />
                                                </td>
                                                <td className="py-3 px-2">
                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-400" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div >
                </div >
            </div >

            {/* Customer Modal */}
            {
                showCustomerModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                            <div className="p-6 border-b border-border">
                                <h3 className="text-xl font-bold text-white">Müşteri Seç</h3>
                            </div>
                            <div className="p-4">
                                <input
                                    type="text"
                                    value={customerSearch}
                                    onChange={(e) => setCustomerSearch(e.target.value)}
                                    placeholder="Müşteri ara..."
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white mb-4"
                                />
                                <div className="max-h-96 overflow-y-auto">
                                    {customers
                                        .filter(c => c.unvan.toLowerCase().includes(customerSearch.toLowerCase()))
                                        .map(customer => (
                                            <button
                                                key={customer.id}
                                                onClick={() => {
                                                    setSelectedCustomer(customer);
                                                    setShowCustomerModal(false);
                                                    setCustomerSearch('');
                                                }}
                                                className="w-full px-4 py-3 hover:bg-white/5 text-left border-b border-border last:border-0"
                                            >
                                                <p className="font-medium text-white">{customer.unvan}</p>
                                                <p className="text-xs text-secondary">{customer.vergi_no || customer.tc_no}</p>
                                            </button>
                                        ))
                                    }
                                </div>
                            </div>
                            <div className="p-4 border-t border-border">
                                <button
                                    onClick={() => setShowCustomerModal(false)}
                                    className="w-full px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors"
                                >
                                    Kapat
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
