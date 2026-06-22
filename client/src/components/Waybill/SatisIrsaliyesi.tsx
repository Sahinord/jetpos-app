"use client";

import { useState, useEffect, useRef } from 'react';
import {
    Package, Plus, Save, Search, Trash2, Calculator, Receipt
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/lib/tenant-context';

interface WaybillItem {
    product_id?: string;
    product_name: string;
    product_code: string;
    quantity: number;
    unit: string;
    unit_price: number;
    vat_rate: number;
    line_total?: number;
    vat_amount?: number;
    line_total_with_vat?: number;
}

interface Waybill {
    waybill_date: string;
    cari_id: string;
    cari_name: string;
    cari_vkn: string;
    cari_address: string;
    warehouse_code: string;
    document_no: string;
    delivery_address: string;
    notes: string;
    items: WaybillItem[];
    subtotal?: number;
    total_vat?: number;
    grand_total?: number;
}

export default function SatisIrsaliyesi() {
    const { currentTenant } = useTenant();
    const [cariList, setCariList] = useState<any[]>([]);
    const [productList, setProductList] = useState<any[]>([]);
    const [waybill, setWaybill] = useState<Waybill>({
        waybill_date: new Date().toISOString().split('T')[0],
        cari_id: '',
        cari_name: '',
        cari_vkn: '',
        cari_address: '',
        warehouse_code: 'MERKEZ',
        document_no: '',
        delivery_address: '',
        notes: '',
        items: [{
            product_name: '',
            product_code: '',
            quantity: 1,
            unit: 'ADET',
            unit_price: 0,
            vat_rate: 20
        }]
    });
    const [loading, setLoading] = useState(false);
    const [showCariSearch, setShowCariSearch] = useState(false);
    const [cariSearchTerm, setCariSearchTerm] = useState('');
    const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const isSavingRef = useRef(false);

    useEffect(() => {
        if (currentTenant) {
            fetchCariList();
            fetchProductList();
        }
    }, [currentTenant]);

    const getItemsWithTotals = (items: WaybillItem[]) => items.map(item => {
        const line_total = item.quantity * item.unit_price;
        const vat_amount = (line_total * item.vat_rate) / 100;
        const line_total_with_vat = line_total + vat_amount;
        return {
            ...item,
            line_total: Math.round(line_total * 100) / 100,
            vat_amount: Math.round(vat_amount * 100) / 100,
            line_total_with_vat: Math.round(line_total_with_vat * 100) / 100
        };
    });

    const itemsWithTotals = getItemsWithTotals(waybill.items);
    const subtotal = Math.round(itemsWithTotals.reduce((s, i) => s + (i.line_total || 0), 0) * 100) / 100;
    const total_vat = Math.round(itemsWithTotals.reduce((s, i) => s + (i.vat_amount || 0), 0) * 100) / 100;
    const grand_total = Math.round(itemsWithTotals.reduce((s, i) => s + (i.line_total_with_vat || 0), 0) * 100) / 100;

    const fetchCariList = async () => {
        const { data } = await supabase
            .from('cari_hesaplar')
            .select('*')
            .eq('tenant_id', currentTenant?.id)
            .order('unvani');
        if (data) setCariList(data);
    };

    const fetchProductList = async () => {
        const { data } = await supabase
            .from('products')
            .select('id, name, barcode, sale_price')
            .order('name');
        if (data) setProductList(data);
    };

    const selectCari = (cari: any) => {
        setWaybill(prev => ({
            ...prev,
            cari_id: cari.id,
            cari_name: cari.unvani,
            cari_vkn: cari.vergi_no || '',
            cari_address: cari.adres || ''
        }));
        setShowCariSearch(false);
        setCariSearchTerm('');
    };

    const selectProduct = (product: any, index: number) => {
        const newItems = [...waybill.items];
        newItems[index] = {
            ...newItems[index],
            product_id: product.id,
            product_name: product.name,
            product_code: product.barcode || '',
            unit_price: product.sale_price || 0
        };
        setWaybill(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setWaybill(prev => ({
            ...prev,
            items: [...prev.items, {
                product_name: '',
                product_code: '',
                quantity: 1,
                unit: 'ADET',
                unit_price: 0,
                vat_rate: 20
            }]
        }));
    };

    const removeItem = (index: number) => {
        if (waybill.items.length === 1) return;
        setWaybill(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const updateItem = (index: number, field: keyof WaybillItem, value: any) => {
        const newItems = [...waybill.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setWaybill(prev => ({ ...prev, items: newItems }));
    };

    const saveWaybill = async () => {
        if (isSavingRef.current) return;
        isSavingRef.current = true;

        if (!waybill.cari_id) {
            alert('Lütfen müşteri seçin!');
            isSavingRef.current = false;
            return;
        }

        setLoading(true);
        try {
            const { data: nextNumber } = await supabase.rpc('get_next_waybill_number', {
                p_tenant_id: currentTenant?.id,
                p_waybill_type: 'sales'
            });

            const { data: waybillData, error } = await supabase
                .from('waybills')
                .insert({
                    tenant_id: currentTenant?.id,
                    waybill_number: nextNumber,
                    waybill_type: 'sales',
                    waybill_date: waybill.waybill_date,
                    cari_id: waybill.cari_id,
                    cari_name: waybill.cari_name,
                    cari_vkn: waybill.cari_vkn,
                    cari_address: waybill.cari_address,
                    notes: waybill.notes,
                    status: 'approved',
                    subtotal,
                    total_vat,
                    grand_total
                })
                .select()
                .single();

            if (error) throw error;

            const itemsToInsert = waybill.items.map(item => ({
                tenant_id: currentTenant?.id,
                waybill_id: waybillData.id,
                product_id: item.product_id,
                product_name: item.product_name,
                product_code: item.product_code,
                quantity: item.quantity,
                unit: item.unit,
                unit_price: item.unit_price,
                vat_rate: item.vat_rate
            }));

            const { error: itemsError } = await supabase.from('waybill_items').insert(itemsToInsert);
            if (itemsError) throw itemsError;

            // Stok Güncelleme (Satış irsaliyesi mal çıkışıdır)
            for (const item of waybill.items) {
                if (item.product_id) {
                    await supabase.rpc('decrement_stock', {
                        p_product_id: item.product_id,
                        p_qty: item.quantity
                    });
                }
            }

            // Cari hesaba borç yaz (Müşteri bize borçlu duruma geçer)
            const { error: cariError } = await supabase.from('cari_hareketler').insert({
                tenant_id: currentTenant?.id,
                cari_id: waybill.cari_id,
                hareket_tipi: 'alacaklandirma',
                aciklama: `Satış İrsaliyesi: ${nextNumber}`,
                borc: grand_total,
                alacak: 0,
                tarih: waybill.waybill_date,
                belge_no: nextNumber
            });

            if (cariError) throw cariError;

            alert('✅ Satış irsaliyesi başarıyla kaydedildi!');

            // Reset form
            setWaybill({
                waybill_date: new Date().toISOString().split('T')[0],
                cari_id: '',
                cari_name: '',
                cari_vkn: '',
                cari_address: '',
                warehouse_code: 'MERKEZ',
                document_no: '',
                delivery_address: '',
                notes: '',
                items: [{
                    product_name: '',
                    product_code: '',
                    quantity: 1,
                    unit: 'ADET',
                    unit_price: 0,
                    vat_rate: 20
                }]
            });
        } catch (error: any) {
            console.error(error);
            alert('❌ Hata: ' + error.message);
        } finally {
            setLoading(false);
            isSavingRef.current = false;
        }
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0);

    const filteredCariList = cariList.filter(c =>
        c.unvani.toLowerCase().includes(cariSearchTerm.toLowerCase()) ||
        (c.vergi_no || '').includes(cariSearchTerm)
    );

    const filteredProductList = productList.filter(p =>
        p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        (p.barcode || '').includes(productSearchTerm)
    );

    return (
        <div className="space-y-4 max-w-[1600px] mx-auto p-4">
            {/* Header / Actions */}
            <div className="flex items-center justify-end gap-2 pb-2 border-b border-white/5">
                <button
                    onClick={saveWaybill}
                    disabled={loading}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
                >
                    {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                    FİŞİ KAYDET
                </button>
            </div>

            {/* İrsaliye Bilgileri */}
            <div className="glass-card p-5 space-y-5 bg-white/[0.01] relative z-50">
                <h2 className="text-[10px] font-bold text-primary uppercase tracking-[0.25em] flex items-center gap-2 border-b border-white/5 pb-3">
                    <Receipt className="w-4 h-4" />
                    İrsaliye Bilgileri
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    {/* Müşteri Seçimi */}
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Müşteri</label>
                        <div className="relative">
                            <button
                                onClick={() => setShowCariSearch(true)}
                                className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2.5 text-left text-sm font-medium text-white hover:border-primary/30 transition-all flex items-center justify-between shadow-sm"
                            >
                                <span className={waybill.cari_name ? 'text-white' : 'text-secondary/50'}>
                                    {waybill.cari_name || 'Müşteri seçin...'}
                                </span>
                                <Search className="w-4 h-4 text-secondary/40" />
                            </button>

                            {showCariSearch && (
                                <div className="absolute z-50 top-full mt-2 w-full bg-card border border-border rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                                    <div className="sticky top-0 bg-card p-3 border-b border-border">
                                        <input
                                            type="text"
                                            value={cariSearchTerm}
                                            onChange={(e) => setCariSearchTerm(e.target.value)}
                                            placeholder="Müşteri ara..."
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
                                                <div className="text-xs text-secondary">{cari.vergi_no}</div>
                                            </button>
                                        ))}
                                        {filteredCariList.length === 0 && (
                                            <div className="p-4 text-center text-secondary text-sm">Müşteri bulunamadı</div>
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
                    </div>

                    {/* İrsaliye Tarihi */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-secondary uppercase">İrsaliye Tarihi *</label>
                        <input
                            type="date"
                            value={waybill.waybill_date}
                            onChange={(e) => setWaybill(prev => ({ ...prev, waybill_date: e.target.value }))}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                        />
                    </div>

                    {/* Depo Kodu */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-secondary uppercase">Depo Kodu</label>
                        <input
                            type="text"
                            value={waybill.warehouse_code}
                            onChange={(e) => setWaybill(prev => ({ ...prev, warehouse_code: e.target.value }))}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                        />
                    </div>

                    {/* Belge No */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-secondary uppercase">Belge No</label>
                        <input
                            type="text"
                            value={waybill.document_no}
                            onChange={(e) => setWaybill(prev => ({ ...prev, document_no: e.target.value }))}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                        />
                    </div>

                    {/* Sevk Adresi */}
                    <div className="md:col-span-3 space-y-2">
                        <label className="text-xs font-bold text-secondary uppercase">Sevk Adresi</label>
                        <input
                            type="text"
                            value={waybill.delivery_address}
                            onChange={(e) => setWaybill(prev => ({ ...prev, delivery_address: e.target.value }))}
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
                        İrsaliye Kalemleri
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
                                <th className="px-4 py-3 text-center w-20">KDV %</th>
                                <th className="px-4 py-3 text-right w-36 bg-white/[0.02]">Toplam</th>
                                <th className="px-4 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {waybill.items.map((item, index) => (
                                <tr key={index} className="hover:bg-white/[0.02] group">
                                    {/* Ürün */}
                                    <td className="p-2 relative">
                                        <input
                                            type="text"
                                            value={item.product_name}
                                            onChange={(e) => {
                                                updateItem(index, 'product_name', e.target.value);
                                                setProductSearchTerm(e.target.value);
                                            }}
                                            onFocus={() => {
                                                setSelectedItemIndex(index);
                                                setProductSearchTerm(item.product_name);
                                            }}
                                            onBlur={() => setTimeout(() => setSelectedItemIndex(null), 250)}
                                            placeholder="Ürün adı veya kodu..."
                                            className="w-full bg-transparent border-none text-foreground font-medium outline-none"
                                        />
                                        {selectedItemIndex === index && (
                                            <div className="absolute z-40 top-full left-0 mt-1 w-80 bg-card border border-border rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                                                {filteredProductList.length === 0 ? (
                                                    <div className="p-4 text-center text-sm text-secondary">
                                                        Eşleşen ürün bulunamadı.
                                                    </div>
                                                ) : (
                                                    filteredProductList.slice(0, 10).map(product => (
                                                        <button
                                                            key={product.id}
                                                            onClick={() => selectProduct(product, index)}
                                                            className="w-full px-3 py-2 text-left hover:bg-primary/10 transition-colors border-b border-border/50 last:border-0"
                                                        >
                                                            <div className="font-bold text-sm text-foreground">{product.name}</div>
                                                            <div className="text-xs text-secondary">{product.barcode || 'Barkodsuz'} • {formatCurrency(product.sale_price)}</div>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </td>

                                    {/* Miktar */}
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            step="0.001"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
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
                                        </select>
                                    </td>

                                    {/* Birim Fiyat */}
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={item.unit_price}
                                            onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                            className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-foreground font-mono text-center outline-none focus:border-primary"
                                        />
                                    </td>

                                    {/* KDV */}
                                    <td className="p-2">
                                        <select
                                            value={item.vat_rate}
                                            onChange={(e) => updateItem(index, 'vat_rate', parseFloat(e.target.value))}
                                            className="w-full bg-background border border-border rounded-lg px-1 py-1.5 text-foreground text-center text-xs"
                                        >
                                            <option value="1">%1</option>
                                            <option value="10">%10</option>
                                            <option value="20">%20</option>
                                        </select>
                                    </td>

                                    {/* Toplam */}
                                    <td className="p-2 text-right font-black text-foreground bg-primary/5 font-mono">
                                        {formatCurrency(itemsWithTotals[index]?.line_total_with_vat || 0)}
                                    </td>

                                    {/* Sil */}
                                    <td className="p-2 text-center">
                                        {waybill.items.length > 1 && (
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
                        value={waybill.notes}
                        onChange={(e) => setWaybill(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary resize-none"
                        rows={4}
                    />
                </div>

                {/* Toplamlar */}
                <div className="glass-card p-4 space-y-3">
                    <h3 className="text-xs font-bold text-secondary uppercase flex items-center gap-2">
                        <Calculator className="w-4 h-4" />
                        İrsaliye Toplamları
                    </h3>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-secondary">Ara Toplam:</span>
                            <span className="text-sm font-bold text-foreground font-mono">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-emerald-500">KDV Toplam:</span>
                            <span className="text-sm font-bold text-emerald-500 font-mono">+{formatCurrency(total_vat)}</span>
                        </div>
                        <div className="border-t border-white/5 pt-4">
                            <div className="bg-emerald-500/10 rounded-2xl border border-emerald-500/20 p-5 flex flex-col gap-1 items-end relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.3em]">Genel Toplam (KDV DAHİL)</span>
                                <span className="text-3xl font-bold text-emerald-500 font-mono tracking-tighter">
                                    {formatCurrency(grand_total).replace('₺', '')} <span className="text-sm">₺</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
