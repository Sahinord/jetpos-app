"use client";

import {
    ArrowLeft, Receipt, Building2, Calendar, FileText,
    Package, Calculator, StickyNote
} from "lucide-react";
import { motion } from "framer-motion";

interface InvoiceDetailViewProps {
    invoice: any;
    onBack: () => void;
}

export const GELEN_TYPES = ['purchase', 'purchase_return', 'service_received', 'service_received_return'];

export const TYPE_LABELS: Record<string, string> = {
    purchase: 'Alış Faturası',
    sales: 'Satış Faturası',
    sales_return: 'Satış İade Faturası',
    purchase_return: 'Alış İade Faturası',
    retail: 'Perakende Satış Faturası',
    service_received: 'Alınan Hizmet Faturası',
    service_provided: 'Yapılan Hizmet Faturası',
    service_received_return: 'Alınan Hizmet İade Faturası'
};

export default function InvoiceDetailView({ invoice, onBack }: InvoiceDetailViewProps) {
    const isGelen = GELEN_TYPES.includes(invoice.invoice_type);
    const items = invoice.invoice_items || [];

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-5 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 bg-white/[0.04] hover:bg-white/[0.08] border border-border rounded-xl flex items-center justify-center text-secondary hover:text-foreground transition-all active:scale-95"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10">
                            <Receipt className="text-primary w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-foreground tracking-tight">{invoice.invoice_number || 'Numarasız Fatura'}</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${isGelen ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                    {isGelen ? 'GELEN' : 'GİDEN'}
                                </span>
                                <span className="text-[10px] text-secondary font-mono tracking-tight">
                                    {TYPE_LABELS[invoice.invoice_type] || invoice.invoice_type}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-5 space-y-3">
                    <h3 className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar size={12} /> Tarih Bilgisi
                    </h3>
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-secondary">Fatura Tarihi</span>
                            <span className="text-xs font-bold text-foreground font-mono">{invoice.invoice_date}</span>
                        </div>
                        {invoice.due_date && (
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-secondary">Vade Tarihi</span>
                                <span className="text-xs font-bold text-foreground font-mono">{invoice.due_date}</span>
                            </div>
                        )}
                        {invoice.payment_status && (
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-secondary">Ödeme Durumu</span>
                                <span className={`text-xs font-bold ${invoice.payment_status === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                    {invoice.payment_status === 'paid' ? 'Ödendi' : 'Ödenmedi'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="glass-card p-5 space-y-3 md:col-span-2">
                    <h3 className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-1.5">
                        <Building2 size={12} /> Cari Bilgisi
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-[9px] text-secondary/60 font-bold mb-0.5">ÜNVAN</p>
                            <p className="text-sm font-bold text-foreground">{invoice.cari_name || 'PERAKENDE MÜŞTERİ'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-secondary/60 font-bold mb-0.5">VKN/TCKN</p>
                            <p className="text-sm font-bold text-foreground font-mono">{invoice.cari_vkn || '—'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-secondary/60 font-bold mb-0.5">VERGİ DAİRESİ</p>
                            <p className="text-sm font-bold text-foreground">{invoice.cari_tax_office || '—'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-secondary/60 font-bold mb-0.5">ADRES</p>
                            <p className="text-sm font-bold text-foreground truncate">{invoice.cari_address || '—'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Kalemler */}
            <div className="glass-card p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                    <Package size={14} className="text-secondary" />
                    <h3 className="text-sm font-bold text-foreground">Fatura Kalemleri</h3>
                    <span className="text-[9px] font-bold text-secondary/60 bg-white/[0.04] px-2 py-0.5 rounded-md">{items.length}</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-background/50 text-secondary border-b border-border">
                                <th className="px-4 py-3 text-left font-bold uppercase text-[9px]">Ürün/Hizmet</th>
                                <th className="px-4 py-3 text-center font-bold uppercase text-[9px]">Miktar</th>
                                <th className="px-4 py-3 text-right font-bold uppercase text-[9px]">Birim Fiyat</th>
                                <th className="px-4 py-3 text-center font-bold uppercase text-[9px]">İsk. %</th>
                                <th className="px-4 py-3 text-center font-bold uppercase text-[9px]">KDV %</th>
                                <th className="px-4 py-3 text-right font-bold uppercase text-[9px]">Toplam</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20 font-medium">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-secondary opacity-40 uppercase tracking-widest font-black text-xs">
                                        Kalem bulunamadı
                                    </td>
                                </tr>
                            ) : items.map((item: any, i: number) => (
                                <tr key={item.id || i} className="hover:bg-white/[0.02] transition-all">
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-foreground text-[11px]">{item.item_name}</div>
                                        {item.item_code && <div className="text-[9px] text-secondary/50 font-mono">{item.item_code}</div>}
                                    </td>
                                    <td className="px-4 py-3 text-center font-mono text-secondary">{item.quantity} {item.unit}</td>
                                    <td className="px-4 py-3 text-right font-mono text-foreground">{formatCurrency(item.unit_price)}</td>
                                    <td className="px-4 py-3 text-center font-mono text-secondary">{item.discount_rate ? `%${item.discount_rate}` : '—'}</td>
                                    <td className="px-4 py-3 text-center font-mono text-secondary">%{item.vat_rate ?? 0}</td>
                                    <td className="px-4 py-3 text-right font-mono font-black text-foreground">
                                        {formatCurrency(item.line_total_with_vat ?? ((item.quantity * item.unit_price) - (item.discount_amount || 0)))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Toplamlar + Notlar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {invoice.notes && (
                    <div className="glass-card p-5 space-y-2">
                        <h3 className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-1.5">
                            <StickyNote size={12} /> Notlar
                        </h3>
                        <p className="text-sm text-foreground/80 leading-relaxed">{invoice.notes}</p>
                    </div>
                )}

                <div className={`glass-card p-5 space-y-3 ${!invoice.notes ? 'md:col-span-2' : ''}`}>
                    <h3 className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-1.5">
                        <Calculator size={12} /> Fatura Toplamları
                    </h3>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-secondary">Ara Toplam (Matrah):</span>
                            <span className="text-sm font-bold text-foreground font-mono">{formatCurrency(invoice.subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-primary">KDV Toplam:</span>
                            <span className="text-sm font-bold text-primary font-mono">+{formatCurrency(invoice.total_vat)}</span>
                        </div>
                        <div className="border-t border-border pt-3 flex justify-between items-center">
                            <span className="text-sm font-black text-foreground uppercase tracking-wide flex items-center gap-1.5">
                                <FileText size={14} /> Genel Toplam
                            </span>
                            <span className="text-xl font-black text-emerald-500 font-mono">{formatCurrency(invoice.grand_total)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
