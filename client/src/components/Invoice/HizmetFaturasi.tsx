"use client";

import { useState, useEffect } from 'react';
import {
    FileText, Save, Search, Plus, Trash2, Calculator,
    Layers, ArrowDownLeft, ArrowUpRight, ClipboardList
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/lib/tenant-context';
import { motion, AnimatePresence } from 'framer-motion';

export type HizmetFaturaTipi = 'alinan_hizmet' | 'yapilan_hizmet' | 'yapilan_hizmet_iadesi' | 'alinan_hizmet_iadesi';

interface HizmetItem {
    id?: string;
    service_code: string;
    service_name: string;
    quantity: number;
    unit: string;
    unit_price: number;
    vat_rate: number;
    line_total?: number;
    vat_amount?: number;
    line_total_with_vat?: number;
    masraf_yeri?: string;
}

interface HizmetFaturasiData {
    fatura_date: string;
    cari_id: string;
    cari_name: string;
    document_no: string;
    notes: string;
    items: HizmetItem[];
}

interface Props {
    type: HizmetFaturaTipi;
}

const typeConfigs = {
    alinan_hizmet: {
        label: "Alınan Hizmet Faturası",
        color: "indigo",
        icon: ArrowDownLeft,
        cari_type: "Tedarikçi"
    },
    yapilan_hizmet: {
        label: "Yapılan Hizmet Faturası",
        color: "teal",
        icon: ArrowUpRight,
        cari_type: "Müşteri"
    },
    yapilan_hizmet_iadesi: {
        label: "Yapılan Hizmet İadesi",
        color: "pink",
        icon: ArrowDownLeft,
        cari_type: "Müşteri"
    },
    alinan_hizmet_iadesi: {
        label: "Alınan Hizmet İadesi",
        color: "amber",
        icon: ArrowUpRight,
        cari_type: "Tedarikçi"
    }
};

export default function HizmetFaturasi({ type }: Props) {
    const { currentTenant } = useTenant();
    const config = typeConfigs[type];
    const [loading, setLoading] = useState(false);
    const [cariList, setCariList] = useState<any[]>([]);
    const [showCariSearch, setShowCariSearch] = useState(false);
    const [cariSearchTerm, setCariSearchTerm] = useState('');

    const [fatura, setFatura] = useState<HizmetFaturasiData>({
        fatura_date: new Date().toISOString().split('T')[0],
        cari_id: '',
        cari_name: '',
        document_no: '',
        notes: '',
        items: [{
            service_code: '',
            service_name: '',
            quantity: 1,
            unit: 'ADET',
            unit_price: 0,
            vat_rate: 20
        }]
    });

    const [totals, setTotals] = useState({
        subtotal: 0,
        vat: 0,
        grand_total: 0
    });

    useEffect(() => {
        if (currentTenant) fetchCariList();
    }, [currentTenant, type]);

    useEffect(() => {
        calculateTotals();
    }, [fatura.items]);

    const fetchCariList = async () => {
        const { data } = await supabase
            .from('cari_hesaplar')
            .select('*')
            .eq('cari_tipi', config.cari_type)
            .order('cari_unvan');
        if (data) setCariList(data);
    };

    const calculateTotals = () => {
        let subtotal = 0;
        let vat = 0;

        fatura.items.forEach(item => {
            const line = item.quantity * item.unit_price;
            const line_vat = (line * item.vat_rate) / 100;
            subtotal += line;
            vat += line_vat;
        });

        setTotals({
            subtotal: Math.round(subtotal * 100) / 100,
            vat: Math.round(vat * 100) / 100,
            grand_total: Math.round((subtotal + vat) * 100) / 100
        });
    };

    const updateItem = (index: number, field: keyof HizmetItem, value: any) => {
        const newItems = [...fatura.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setFatura(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFatura(prev => ({
            ...prev,
            items: [...prev.items, {
                service_code: '',
                service_name: '',
                quantity: 1,
                unit: 'ADET',
                unit_price: 0,
                vat_rate: 20
            }]
        }));
    };

    const removeItem = (index: number) => {
        if (fatura.items.length === 1) return;
        setFatura(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const saveFatura = async () => {
        if (!fatura.cari_id) {
            alert('Lütfen ' + config.cari_type + ' seçin!');
            return;
        }

        if (fatura.items.some(i => !i.service_name || i.unit_price <= 0)) {
            alert('Lütfen tüm kalemleri eksiksiz doldurun!');
            return;
        }

        setLoading(true);
        try {
            // 1. Fatura Başlığını Kaydet
            const { data: invoiceData, error: invoiceError } = await supabase
                .from('invoices')
                .insert({
                    tenant_id: currentTenant?.id,
                    invoice_type: type,
                    invoice_no: fatura.document_no || `HZM-${Date.now().toString().slice(-6)}`,
                    invoice_date: fatura.fatura_date,
                    cari_id: fatura.cari_id,
                    cari_name: fatura.cari_name,
                    subtotal: totals.subtotal,
                    vat_total: totals.vat,
                    total_amount: totals.grand_total,
                    notes: fatura.notes,
                    payment_status: 'pending'
                })
                .select()
                .single();

            if (invoiceError) throw invoiceError;

            // 2. Fatura Kalemlerini Kaydet
            const invoiceItems = fatura.items.map(item => ({
                tenant_id: currentTenant?.id,
                invoice_id: invoiceData.id,
                product_name: item.service_name,
                product_code: item.service_code,
                quantity: item.quantity,
                unit: item.unit,
                unit_price: item.unit_price,
                vat_rate: item.vat_rate,
                vat_amount: (item.quantity * item.unit_price * item.vat_rate) / 100,
                total_amount: (item.quantity * item.unit_price) * (1 + item.vat_rate / 100)
            }));

            const { error: itemsError } = await supabase
                .from('invoice_items')
                .insert(invoiceItems);

            if (itemsError) throw itemsError;

            // 3. Cari Hareket Oluştur
            // Alınan Hizmet / Yapılan Hizmet İadesi -> Tedarikçiyi Borçlandırır / Müşteriyi Alacaklandırır? 
            // Basitçe: Satınalma ise BORÇ (Tedarikçiye borcumuz artar), Satış ise ALACAK (Müşteriden alacağımız artar)
            // Mevcut cari_hareketler mantığına göre:
            const isPurchase = type.includes('alinan');
            const isReturn = type.includes('iadesi');

            // Karar mantığı:
            // Alınan Hizmet: Bize masraf, tedarikçiye borçlanırız.
            // Yapılan Hizmet: Bize gelir, müşteriden alacaklanırız.

            await supabase.from('cari_hareketler').insert({
                tenant_id: currentTenant?.id,
                cari_id: fatura.cari_id,
                hareket_tipi: 'fatura',
                aciklama: `${config.label} - ${invoiceData.invoice_no}`,
                borc: isPurchase ? (isReturn ? 0 : 0) : (isReturn ? 0 : totals.grand_total), // Satış ise borç (müşteri bize borçlanır)
                alacak: isPurchase ? (isReturn ? 0 : totals.grand_total) : (isReturn ? totals.grand_total : 0), // Alınan ise alacak (biz tedarikçiye borçlanırız)
                tarih: fatura.fatura_date
            });

            alert(`✅ ${config.label} başarıyla kaydedildi!`);

            // Reset form
            setFatura({
                fatura_date: new Date().toISOString().split('T')[0],
                cari_id: '',
                cari_name: '',
                document_no: '',
                notes: '',
                items: [{
                    service_code: '',
                    service_name: '',
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
        <div className="space-y-4 max-w-[1800px] mx-auto p-4 animate-in">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <div />
                <button
                    onClick={saveFatura}
                    disabled={loading}
                    className={`interactive-button bg-${config.color}-500 hover:bg-${config.color}-600 text-white px-8 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-${config.color}-500/20 disabled:opacity-50`}
                >
                    {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                    FİŞİ KAYDET
                </button>
            </div>

            {/* Fiş Bilgileri */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 glass-card p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
                                <Search className="w-3 h-3" />
                                {config.cari_type} Seçimi *
                            </label>
                            <div className="relative">
                                <button
                                    onClick={() => setShowCariSearch(true)}
                                    className={`w-full bg-background border-2 border-${config.color}-500/20 rounded-xl px-4 py-3 text-left text-sm font-bold text-foreground hover:border-${config.color}-500 transition-all flex items-center justify-between shadow-inner`}
                                >
                                    <span>{fatura.cari_name || `— ${config.cari_type} Seçin —`}</span>
                                    <Layers className={`w-4 h-4 text-${config.color}-500`} />
                                </button>

                                {showCariSearch && (
                                    <div className="absolute z-50 top-full mt-2 w-full bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden max-h-80 flex flex-col">
                                        <div className="p-3 border-b border-border bg-white/5">
                                            <input
                                                type="text"
                                                value={cariSearchTerm}
                                                onChange={(e) => setCariSearchTerm(e.target.value)}
                                                placeholder="İsim veya VKN ile ara..."
                                                className="w-full bg-background/50 border border-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="overflow-y-auto flex-1 h-60">
                                            {filteredCariList.map(cari => (
                                                <button
                                                    key={cari.id}
                                                    onClick={() => {
                                                        setFatura(prev => ({ ...prev, cari_id: cari.id, cari_name: cari.cari_unvan }));
                                                        setShowCariSearch(false);
                                                    }}
                                                    className="w-full px-4 py-3 text-left hover:bg-primary/10 transition-colors border-b border-border/50 last:border-0"
                                                >
                                                    <div className="font-bold text-sm">{cari.cari_unvan}</div>
                                                    <div className="text-[10px] text-secondary font-mono">{cari.vergi_no}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest">Fatura Tarihi</label>
                                <input
                                    type="date"
                                    value={fatura.fatura_date}
                                    onChange={(e) => setFatura(prev => ({ ...prev, fatura_date: e.target.value }))}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest">Belge/Fatura No</label>
                                <input
                                    type="text"
                                    value={fatura.document_no}
                                    onChange={(e) => setFatura(prev => ({ ...prev, document_no: e.target.value }))}
                                    placeholder="INV-2026..."
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary placeholder:opacity-30"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 bg-gradient-to-br from-primary/5 to-transparent flex flex-col justify-center">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-secondary">
                            <span className="text-[10px] font-bold uppercase tracking-widest">Ara Toplam</span>
                            <span className="font-mono text-sm font-bold">{formatCurrency(totals.subtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between text-secondary">
                            <span className="text-[10px] font-bold uppercase tracking-widest">Toplam KDV</span>
                            <span className="font-mono text-sm font-bold text-primary">+{formatCurrency(totals.vat)}</span>
                        </div>
                        <div className="pt-4 border-t border-border mt-4">
                            <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">GENEL TOPLAM</div>
                            <div className="text-3xl font-black text-foreground font-mono tracking-tighter">
                                {formatCurrency(totals.grand_total)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Kalemler */}
            <div className="glass-card p-0 overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-border bg-white/5 flex items-center justify-between">
                    <h3 className="text-xs font-black text-secondary tracking-widest uppercase flex items-center gap-2">
                        <ClipboardList className="w-4 h-4" />
                        Hizmet Kalem Bilgileri
                    </h3>
                    <button
                        onClick={addItem}
                        className={`text-${config.color}-500 hover:text-${config.color}-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all bg-${config.color}-500/10 px-4 py-2 rounded-xl`}
                    >
                        <Plus className="w-3 h-3" />
                        Yeni Satır Ekle
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="bg-background/50 text-secondary border-b border-border">
                                <th className="px-6 py-4 text-left font-bold uppercase tracking-widest text-[9px]">Sıra</th>
                                <th className="px-4 py-4 text-left font-bold uppercase tracking-widest text-[9px] min-w-[300px]">Hizmet Tanımı / Kodu</th>
                                <th className="px-3 py-4 text-center font-bold uppercase tracking-widest text-[9px] w-24">Miktar</th>
                                <th className="px-3 py-4 text-center font-bold uppercase tracking-widest text-[9px] w-24">Birim</th>
                                <th className="px-3 py-4 text-center font-bold uppercase tracking-widest text-[9px] w-32">Birim Fiyat</th>
                                <th className="px-3 py-4 text-center font-bold uppercase tracking-widest text-[9px] w-24">KDV %</th>
                                <th className="px-6 py-4 text-right font-bold uppercase tracking-widest text-[9px] w-40">Satır Toplam</th>
                                <th className="px-4 py-4 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                            {fatura.items.map((item, index) => (
                                <tr key={index} className="group hover:bg-white/[0.02] transition-all">
                                    <td className="px-6 py-4 font-mono text-secondary/30 font-bold">{String(index + 1).padStart(2, '0')}</td>
                                    <td className="px-4 py-2">
                                        <div className="space-y-1">
                                            <input
                                                type="text"
                                                value={item.service_name}
                                                onChange={(e) => updateItem(index, 'service_name', e.target.value)}
                                                placeholder="Örn: Danışmanlık Hizmeti, Nakliye Bedeli..."
                                                className="w-full bg-transparent border-none text-foreground font-bold text-sm outline-none px-0 py-1 placeholder:opacity-20 translate-x-0 group-hover:translate-x-1 transition-transform"
                                            />
                                            <input
                                                type="text"
                                                value={item.service_code}
                                                onChange={(e) => updateItem(index, 'service_code', e.target.value)}
                                                placeholder="Hizmet Kodu"
                                                className="text-[9px] bg-transparent border-none text-secondary/50 font-bold uppercase tracking-widest outline-none px-0"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                            className="w-full bg-background/50 border border-border rounded-xl px-2 py-2 text-center font-bold outline-none focus:border-primary"
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <select
                                            value={item.unit}
                                            onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                            className="w-full bg-background/50 border border-border rounded-xl px-2 py-2 text-center text-[10px] font-bold uppercase outline-none focus:border-primary"
                                        >
                                            <option>ADET</option>
                                            <option>SAAT</option>
                                            <option>GÜN</option>
                                            <option>AY</option>
                                            <option>KM</option>
                                        </select>
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="number"
                                            value={item.unit_price}
                                            onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                            className="w-full bg-background/50 border border-border rounded-xl px-2 py-2 text-center font-mono font-bold outline-none focus:border-primary"
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <select
                                            value={item.vat_rate}
                                            onChange={(e) => updateItem(index, 'vat_rate', parseInt(e.target.value))}
                                            className="w-full bg-background/50 border border-border rounded-xl px-2 py-2 text-center text-[10px] font-bold outline-none focus:border-primary"
                                        >
                                            <option value="0">%0</option>
                                            <option value="1">%1</option>
                                            <option value="10">%10</option>
                                            <option value="20">%20</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="font-mono font-black text-foreground">
                                            {formatCurrency(item.quantity * item.unit_price * (1 + item.vat_rate / 100))}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        {fatura.items.length > 1 && (
                                            <button
                                                onClick={() => removeItem(index)}
                                                className="p-2 text-rose-500/30 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
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

            {/* Footer Notes */}
            <div className="glass-card p-6 space-y-2">
                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
                    <FileText className="w-3 h-3" />
                    Belge Notları ve Açıklamalar
                </label>
                <textarea
                    value={fatura.notes}
                    onChange={(e) => setFatura(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Bu faturaya ait özel notlar, referans numaraları veya ek bilgiler..."
                    className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-sm font-medium text-foreground outline-none focus:border-primary resize-none min-h-[100px] placeholder:opacity-20"
                />
            </div>
        </div>
    );
}
