"use client";

import { useState, useEffect } from 'react';
import {
    Package, Plus, Save, Search, Trash2, Calculator, TruckIcon
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

    useEffect(() => {
        if (currentTenant) {
            fetchCariList();
            fetchProductList();
        }
    }, [currentTenant]);

    useEffect(() => {
        calculateTotals();
    }, [waybill.items]);

    const fetchCariList = async () => {
        const { data } = await supabase
            .from('cari_hesaplar')
            .select('*')
            .eq('cari_tipi', 'Müşteri')
            .order('cari_unvan');
        if (data) setCariList(data);
    };

    const fetchProductList = async () => {
        const { data } = await supabase
            .from('products')
            .select('id, name, barcode, price')
            .order('name');
        if (data) setProductList(data);
    };

    const calculateTotals = () => {
        const items = waybill.items.map(item => {
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

        const subtotal = items.reduce((sum, item) => sum + (item.line_total || 0), 0);
        const total_vat = items.reduce((sum, item) => sum + (item.vat_amount || 0), 0);
        const grand_total = items.reduce((sum, item) => sum + (item.line_total_with_vat || 0), 0);

        setWaybill(prev => ({
            ...prev,
            items,
            subtotal: Math.round(subtotal * 100) / 100,
            total_vat: Math.round(total_vat * 100) / 100,
            grand_total: Math.round(grand_total * 100) / 100
        }));
    };

    const selectCari = (cari: any) => {
        setWaybill(prev => ({
            ...prev,
            cari_id: cari.id,
            cari_name: cari.cari_unvan,
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
            unit_price: product.price || 0
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
        if (!waybill.cari_id) {
            alert('Lütfen müşteri seçin!');
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
                    subtotal: waybill.subtotal,
                    total_vat: waybill.total_vat,
                    grand_total: waybill.grand_total
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

            await supabase.from('waybill_items').insert(itemsToInsert);

            // Cari hesaba alacak yaz
            await supabase.from('cari_hareketler').insert({
                tenant_id: currentTenant?.id,
                cari_id: waybill.cari_id,
                hareket_tipi: 'alacaklandirma',
                aciklama: `Satış İrsaliyesi: ${nextNumber}`,
                tutar: waybill.grand_total,
                islem_tarihi: waybill.waybill_date,
                belge_no: nextNumber,
                belge_tipi: 'Satış İrsaliyesi'
            });

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
        }
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0);

    const filteredCariList = cariList.filter(c =>
        c.cari_unvan.toLowerCase().includes(cariSearchTerm.toLowerCase()) ||
        (c.vergi_no || '').includes(cariSearchTerm)
    );

    return (
        <div className="space-y-4 max-w-[1800px] mx-auto p-4">
            {/* Header / Actions */}
            <div className="flex items-center justify-end">
                <button
                    onClick={saveWaybill}
                    disabled={loading}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
                >
                    {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                    KAYDET
                </button>
            </div>

            {/* Fiş Bilgileri */}
            <div className="glass-card p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-bold text-secondary uppercase">Müşteri (C/H Kodu) *</label>
                        <div className="relative">
                            <button
                                onClick={() => setShowCariSearch(true)}
                                className="w-full bg-background border-2 border-emerald-500/30 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground hover:border-emerald-500 transition-all flex items-center justify-between"
                            >
                                <span>{waybill.cari_name || '— Müşteri Seçin —'}</span>
                                <Search className="w-4 h-4 text-emerald-500" />
                            </button>

                            {showCariSearch && (
                                <div className="absolute z-50 top-full mt-2 w-full bg-card border border-border rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                                    <div className="sticky top-0 bg-card p-3 border-b border-border">
                                        <input
                                            type="text"
                                            value={cariSearchTerm}
                                            onChange={(e) => setCariSearchTerm(e.target.value)}
                                            placeholder="Müşteri ara..."
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        {filteredCariList.map(cari => (
                                            <button
                                                key={cari.id}
                                                onClick={() => selectCari(cari)}
                                                className="w-full px-4 py-3 text-left hover:(bg-emerald-500/10 transition-colors border-b border-border/50 last:border-0"
                                            >
                                                <div className="font-bold text-sm text-foreground">{cari.cari_unvan}</div>
                                                <div className="text-xs text-secondary">{cari.vergi_no}</div>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="sticky bottom-0 bg-card p-2 border-t border-border">
                                        <button
                                            onClick={() => setShowCariSearch(false)}
                                            className="w-full px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg text-xs font-bold transition-all"
                                        >
                                            Kapat
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-secondary uppercase">İrsaliye Tarihi *</label>
                        <input
                            type="date"
                            value={waybill.waybill_date}
                            onChange={(e) => setWaybill(prev => ({ ...prev, waybill_date: e.target.value }))}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-emerald-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-secondary uppercase">Depo Kodu</label>
                        <input
                            type="text"
                            value={waybill.warehouse_code}
                            onChange={(e) => setWaybill(prev => ({ ...prev, warehouse_code: e.target.value }))}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-emerald-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-secondary uppercase">Belge No</label>
                        <input
                            type="text"
                            value={waybill.document_no}
                            onChange={(e) => setWaybill(prev => ({ ...prev, document_no: e.target.value }))}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-emerald-500"
                        />
                    </div>

                    <div className="md:col-span-3 space-y-2">
                        <label className="text-xs font-bold text-secondary uppercase">Sevk Adresi</label>
                        <input
                            type="text"
                            value={waybill.delivery_address}
                            onChange={(e) => setWaybill(prev => ({ ...prev, delivery_address: e.target.value }))}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-emerald-500"
                        />
                    </div>
                </div>
            </div>

            {/* Kalemler */}
            <div className="glass-card p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                    <h2 className="text-sm font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        1 - Fiş Kalem Bilgileri
                    </h2>
                    <button
                        onClick={addItem}
                        className="text-emerald-500 hover:text-emerald-400 text-xs font-bold flex items-center gap-1 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Kalem Ekle
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                        <thead className="bg-emerald-500/10 text-secondary font-bold uppercase border-b-2 border-emerald-500/30">
                            <tr>
                                <th className="px-3 py-3 text-left min-w-[300px]">Stok Kodu / Tanımı</th>
                                <th className="px-3 py-3 text-center w-28">Miktar</th>
                                <th className="px-3 py-3 text-center w-24">Birim</th>
                                <th className="px-3 py-3 text-center w-32">Birim Fiyat</th>
                                <th className="px-3 py-3 text-center w-24">KDV %</th>
                                <th className="px-3 py-3 text-right w-36 bg-emerald-500/10">Toplam</th>
                                <th className="px-3 py-3 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {waybill.items.map((item, index) => (
                                <tr key={index} className="hover:bg-white/[0.02]">
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={item.product_name}
                                            onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                                            className="w-full bg-transparent border-none text-foreground font-medium outline-none px-2 py-1.5"
                                        />
                                        <div className="text-[10px] text-secondary px-2">{item.product_code}</div>
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            step="0.001"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                            className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-2 py-2 text-emerald-500 font-bold text-center outline-none focus:border-emerald-500"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <select
                                            value={item.unit}
                                            onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                            className="w-full bg-background border border-border rounded-lg px-2 py-2 text-foreground text-center text-xs outline-none"
                                        >
                                            <option>ADET</option>
                                            <option>KG</option>
                                            <option>LT</option>
                                        </select>
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={item.unit_price}
                                            onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                            className="w-full bg-background border border-border rounded-lg px-2 py-2 text-foreground font-mono text-center outline-none"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <select
                                            value={item.vat_rate}
                                            onChange={(e) => updateItem(index, 'vat_rate', parseFloat(e.target.value))}
                                            className="w-full bg-background border border-border rounded-lg px-2 py-2 text-foreground text-center text-xs"
                                        >
                                            <option value="1">%1</option>
                                            <option value="10">%10</option>
                                            <option value="20">%20</option>
                                        </select>
                                    </td>
                                    <td className="p-2 text-right font-black text-foreground bg-emerald-500/5 font-mono">
                                        {formatCurrency(item.line_total_with_vat || 0)}
                                    </td>
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

            {/* Toplamlar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card p-4 space-y-2">
                    <label className="text-xs font-bold text-secondary uppercase">Açıklama</label>
                    <textarea
                        value={waybill.notes}
                        onChange={(e) => setWaybill(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none resize-none"
                        rows={5}
                    />
                </div>

                <div className="glass-card p-4 space-y-3 bg-gradient-to-br from-emerald-500/5 to-transparent">
                    <h3 className="text-xs font-bold text-emerald-500 uppercase flex items-center gap-2">
                        <Calculator className="w-4 h-4" />
                        Genel Toplamlar
                    </h3>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-background/50 rounded-lg p-3 border border-border">
                                <div className="text-[10px] text-secondary uppercase font-bold mb-1">Mal Toplamı</div>
                                <div className="text-lg font-black text-foreground font-mono">{formatCurrency(waybill.subtotal || 0)}</div>
                            </div>
                            <div className="bg-background/50 rounded-lg p-3 border border-emerald-500/30">
                                <div className="text-[10px] text-emerald-500 uppercase font-bold mb-1">KDV Toplamı</div>
                                <div className="text-lg font-black text-emerald-500 font-mono">+{formatCurrency(waybill.total_vat || 0)}</div>
                            </div>
                        </div>

                        <div className="bg-emerald-500/20 rounded-xl border-2 border-emerald-500/40 p-4">
                            <div className="text-xs font-black text-emerald-500 uppercase tracking-wider mb-2">GENEL TOPLAM</div>
                            <div className="text-3xl font-black text-emerald-500 font-mono tracking-tight">
                                {formatCurrency(waybill.grand_total || 0)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
