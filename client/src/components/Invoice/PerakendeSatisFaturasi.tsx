"use client";

import { useState, useEffect } from 'react';
import {
    ShoppingBag, Plus, Save, Search, Trash2, Calculator, Receipt, X, Check
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/lib/tenant-context';

interface InvoiceItem {
    id: string;
    product_id: string;
    product_name: string;
    product_code: string;
    quantity: number;
    unit_price: number;
    vat_rate: number;
    vat_amount: number;
    total_amount: number;
    unit: string;
}

export default function PerakendeSatisFaturasi() {
    const { currentTenant } = useTenant();
    const [invoiceNo, setInvoiceNo] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [customerSearch, setCustomerSearch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);

    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [products, setProducts] = useState<any[]>([]);

    const [notes, setNotes] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
    const [isPaid, setIsPaid] = useState(true);

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
            .eq('invoice_type', 'perakende_satis')
            .order('created_at', { ascending: false })
            .limit(1);

        if (data && data.length > 0) {
            const lastNo = parseInt(data[0].invoice_no.replace('PER', ''));
            setInvoiceNo(`PER${String(lastNo + 1).padStart(8, '0')}`);
        } else {
            setInvoiceNo(`PER${String(1).padStart(8, '0')}`);
        }
    };

    const fetchCustomers = async () => {
        const { data } = await supabase
            .from('cari_hesaplar')
            .select('*')
            .eq('tenant_id', currentTenant?.id)
            .eq('hesap_tipi', 'musteri')
            .order('unvan');
        setCustomers(data || []);
    };

    const fetchProducts = async () => {
        const { data } = await supabase
            .from('products')
            .select('*')
            .eq('status', 'active')
            .order('name');
        setProducts(data || []);
    };

    const addProduct = (product: any) => {
        const existingItem = items.find(i => i.product_id === product.id);
        if (existingItem) {
            updateQuantity(existingItem.id, existingItem.quantity + 1);
        } else {
            const vatAmount = (product.sale_price * product.vat_rate) / 100;
            const newItem: InvoiceItem = {
                id: Date.now().toString(),
                product_id: product.id,
                product_name: product.name,
                product_code: product.barcode || '',
                quantity: 1,
                unit_price: product.sale_price,
                vat_rate: product.vat_rate,
                vat_amount: vatAmount,
                total_amount: product.sale_price + vatAmount,
                unit: product.unit || 'Adet'
            };
            setItems([...items, newItem]);
        }
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

        const totals = calculateTotals();

        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .insert({
                tenant_id: currentTenant?.id,
                invoice_type: 'perakende_satis',
                invoice_no: invoiceNo,
                invoice_date: invoiceDate,
                cari_id: selectedCustomer.id,
                cari_name: selectedCustomer.unvan,
                subtotal: totals.subtotal,
                vat_total: totals.totalVat,
                total_amount: totals.total,
                payment_method: paymentMethod,
                payment_status: isPaid ? 'paid' : 'pending',
                notes: notes
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
            quantity: item.quantity,
            unit_price: item.unit_price,
            vat_rate: item.vat_rate,
            vat_amount: item.vat_amount,
            total_amount: item.total_amount,
            unit: item.unit
        }));

        const { error: itemsError } = await supabase
            .from('invoice_items')
            .insert(invoiceItems);

        if (itemsError) {
            alert('Hata: ' + itemsError.message);
            return;
        }

        // Stok Güncelleme
        for (const item of items) {
            if (item.product_id) {
                await supabase.rpc('decrement_stock', {
                    product_id: item.product_id,
                    qty: item.quantity
                });
            }
        }

        // Cari hesap hareketi oluştur
        await supabase.from('cari_hareketler').insert({
            tenant_id: currentTenant?.id,
            cari_id: selectedCustomer.id,
            hareket_tipi: 'fatura',
            aciklama: `Perakende Satış Faturası - ${invoiceNo}`,
            borc: totals.total,
            alacak: 0,
            tarih: invoiceDate
        });

        alert('Perakende satış faturası kaydedildi!');
        resetForm();
    };

    const resetForm = () => {
        setItems([]);
        setSelectedCustomer(null);
        setCustomerSearch('');
        setNotes('');
        setIsPaid(true);
        generateInvoiceNo();
    };

    const totals = calculateTotals();

    return (
        <div className="space-y-4 max-w-[1800px] mx-auto p-4">
            {/* Form & Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left - Customer & Details */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                            <h3 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Fatura Bilgileri</h3>
                            <div className="text-right">
                                <span className="text-[10px] text-secondary uppercase font-bold">Fatura No:</span>
                                <div className="text-sm font-bold text-emerald-400 font-mono italic">{invoiceNo}</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Fatura Tarihi</label>
                                <input
                                    type="date"
                                    value={invoiceDate}
                                    onChange={(e) => setInvoiceDate(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Müşteri</label>
                                <button
                                    onClick={() => setShowCustomerModal(true)}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-left hover:border-emerald-500 transition-colors"
                                >
                                    {selectedCustomer ? (
                                        <span className="text-white font-medium">{selectedCustomer.unvan}</span>
                                    ) : (
                                        <span className="text-secondary text-sm">Müşteri Seç...</span>
                                    )}
                                </button>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Ödeme Yöntemi</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                                >
                                    <option value="cash">Nakit</option>
                                    <option value="card">Kredi Kartı</option>
                                    <option value="transfer">Havale/EFT</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="isPaid"
                                    checked={isPaid}
                                    onChange={(e) => setIsPaid(e.target.checked)}
                                    className="w-4 h-4 rounded border-white/10 accent-emerald-500"
                                />
                                <label htmlFor="isPaid" className="text-xs font-bold text-secondary uppercase tracking-widest cursor-pointer">
                                    Ödeme Alındı
                                </label>
                            </div>

                            <div className="pt-2">
                                <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Notlar</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 resize-none text-sm"
                                    placeholder="Fatura notu..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="glass-card p-6 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-secondary uppercase tracking-wider">Ara Toplam</span>
                                <span className="text-lg font-bold text-white font-mono">{totals.subtotal.toFixed(2)} ₺</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">KDV Toplamı</span>
                                <span className="text-lg font-bold text-emerald-400 font-mono">+{totals.totalVat.toFixed(2)} ₺</span>
                            </div>
                            <div className="h-px bg-white/10 my-2" />
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">GENEL TOPLAM</span>
                                <span className="text-3xl font-black text-emerald-400 font-mono tracking-tighter">{totals.total.toFixed(2)} <span className="text-xs ml-1">₺</span></span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        className="w-full px-6 py-4 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                        <Save className="w-5 h-5" />
                        Faturayı Kaydet
                    </button>
                </div>

                {/* Right - Products */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Product Search */}
                    <div className="glass-card p-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                            <input
                                type="text"
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                placeholder="Ürün ara (isim veya barkod)..."
                                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                            />
                        </div>

                        {productSearch && (
                            <div className="mt-2 max-h-48 overflow-y-auto bg-card border border-border rounded-xl shadow-2xl z-50">
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
                                            className="w-full px-4 py-3 hover:bg-emerald-500/10 text-left border-b border-border/50 last:border-0 transition-colors"
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-bold text-white text-sm">{product.name}</p>
                                                    <p className="text-[10px] text-secondary font-mono tracking-widest uppercase">{product.barcode || 'Barkodsuz'}</p>
                                                </div>
                                                <span className="text-emerald-400 font-black font-mono">{product.sale_price.toFixed(2)} ₺</span>
                                            </div>
                                        </button>
                                    ))
                                }
                            </div>
                        )}
                    </div>

                    {/* Items Table */}
                    <div className="glass-card p-6 min-h-[400px] flex flex-col">
                        <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Receipt className="w-4 h-4" />
                            Fatura Kalemleri (Sepet)
                        </h3>

                        <div className="overflow-x-auto flex-1">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="text-left py-3 px-2 text-[10px] font-bold text-secondary uppercase tracking-widest">Ürün Bilgisi</th>
                                        <th className="text-center py-3 px-2 text-[10px] font-bold text-secondary uppercase tracking-widest w-24">Miktar</th>
                                        <th className="text-right py-3 px-2 text-[10px] font-bold text-secondary uppercase tracking-widest w-28">Birim Fiyat</th>
                                        <th className="text-center py-3 px-2 text-[10px] font-bold text-secondary uppercase tracking-widest w-20">KDV</th>
                                        <th className="text-right py-3 px-2 text-[10px] font-bold text-secondary uppercase tracking-widest w-32">Satır Toplam</th>
                                        <th className="w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-24 text-center">
                                                <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-10 text-white" />
                                                <p className="text-sm font-bold text-secondary uppercase tracking-widest">Henüz ürün eklenmedi</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map(item => (
                                            <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] group transition-colors">
                                                <td className="py-4 px-2">
                                                    <p className="font-bold text-white text-sm">{item.product_name}</p>
                                                    <p className="text-[10px] text-secondary font-mono">{item.product_code}</p>
                                                </td>
                                                <td className="py-4 px-2">
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value) || 0)}
                                                        className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2 py-1.5 text-center text-emerald-400 font-bold focus:border-emerald-500 outline-none"
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </td>
                                                <td className="py-4 px-2 text-right text-white font-mono text-xs">{item.unit_price.toFixed(2)} ₺</td>
                                                <td className="py-4 px-2 text-center">
                                                    <span className="text-[10px] font-bold text-emerald-500/70 bg-emerald-500/5 px-2 py-1 rounded">%{item.vat_rate}</span>
                                                </td>
                                                <td className="py-4 px-2 text-right font-black text-white font-mono">{item.total_amount.toFixed(2)} ₺</td>
                                                <td className="py-4 px-2 text-center">
                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        className="p-2 text-rose-500/30 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
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

            {/* Customer Modal */}
            {showCustomerModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-card border border-border rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-xl font-black text-white tracking-tight uppercase">Müşteri Seçimi</h3>
                            <button onClick={() => setShowCustomerModal(false)} className="p-2 hover:bg-white/5 rounded-full text-secondary hover:text-white transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 overflow-hidden flex flex-col">
                            <div className="relative mb-6">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                                <input
                                    type="text"
                                    value={customerSearch}
                                    onChange={(e) => setCustomerSearch(e.target.value)}
                                    placeholder="Müşteri ara (isim, vkn, tckn)..."
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-emerald-500 font-medium"
                                    autoFocus
                                />
                            </div>
                            <div className="overflow-y-auto flex-1 space-y-2 pr-2 custom-scrollbar">
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
                                            className="w-full px-5 py-4 bg-white/[0.02] hover:bg-emerald-500/10 border border-white/5 rounded-2xl text-left transition-all group"
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-bold text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{customer.unvan}</p>
                                                    <p className="text-[10px] text-secondary font-mono mt-1 uppercase tracking-widest">{customer.vergi_no || customer.tc_no || 'Kimlik Bilgisi Yok'}</p>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                                    <Check className="w-4 h-4 text-emerald-500" />
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                }
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
