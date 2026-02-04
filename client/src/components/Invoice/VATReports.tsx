"use client";

import { useState, useEffect } from 'react';
import {
    PieChart, FileText, Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/lib/tenant-context';

interface Props {
    type: 'list' | 'analysis' | 'invoice_list';
}

export default function VATReports({ type }: Props) {
    const { currentTenant } = useTenant();
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [filterType, setFilterType] = useState('Tümü');
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<any[]>([]);
    const [analysis, setAnalysis] = useState({
        vat1: 0,
        vat10: 0,
        vat20: 0
    });

    const fetchData = async () => {
        if (!currentTenant) return;
        setLoading(true);

        try {
            let query = supabase
                .from('invoices')
                .select(`
                    *,
                    invoice_items (*)
                `)
                .eq('tenant_id', currentTenant.id)
                .gte('invoice_date', dateRange.start)
                .lte('invoice_date', dateRange.end);

            if (filterType === 'Gelen Faturalar') {
                query = query.in('invoice_type', ['alis', 'alinan_hizmet']);
            } else if (filterType === 'Giden Faturalar') {
                query = query.in('invoice_type', ['satis', 'perakende_satis', 'yapilan_hizmet']);
            }

            const { data, error } = await query.order('invoice_date', { ascending: false });

            if (error) throw error;

            if (data) {
                setReportData(data);

                // Calculate Analysis
                let v1 = 0, v10 = 0, v20 = 0;
                data.forEach(inv => {
                    inv.invoice_items?.forEach((item: any) => {
                        if (item.vat_rate === 1) v1 += item.vat_amount || 0;
                        if (item.vat_rate === 10) v10 += item.vat_amount || 0;
                        if (item.vat_rate === 20) v20 += item.vat_amount || 0;
                    });
                });
                setAnalysis({ vat1: v1, vat10: v10, vat20: v20 });
            }
        } catch (err) {
            console.error('Report Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentTenant, type]);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0);

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div />

                <div className="flex items-center gap-3">
                    <button className="interactive-button bg-white/5 border border-border px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                        <Download className="w-4 h-4" /> EXCEL
                    </button>
                    <button className="interactive-button bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                        <Download className="w-4 h-4" /> PDF
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-secondary uppercase tracking-widest">Başlangıç</label>
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange((prev: any) => ({ ...prev, start: e.target.value }))}
                        className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-secondary uppercase tracking-widest">Bitiş</label>
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange((prev: any) => ({ ...prev, end: e.target.value }))}
                        className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-secondary uppercase tracking-widest">Filtrele</label>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary"
                    >
                        <option>Tümü</option>
                        <option>Gelen Faturalar</option>
                        <option>Giden Faturalar</option>
                    </select>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="bg-primary text-white h-10 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                >
                    {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'RAPORU GETİR'}
                </button>
            </div>

            {type === 'analysis' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-card p-8 flex flex-col items-center justify-center space-y-4">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-[10px] border-primary/20" />
                            <div className="absolute inset-0 rounded-full border-[10px] border-primary border-t-transparent -rotate-45" />
                            <span className="text-2xl font-black text-primary">%20</span>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">KDV Grubu</p>
                            <p className="text-lg font-black mt-1">{formatCurrency(analysis.vat20)}</p>
                        </div>
                    </div>
                    <div className="glass-card p-8 flex flex-col items-center justify-center space-y-4 text-emerald-500">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-[10px] border-emerald-500/20" />
                            <div className="absolute inset-0 rounded-full border-[10px] border-emerald-500 border-t-transparent rotate-12" />
                            <span className="text-2xl font-black">%10</span>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">KDV Grubu</p>
                            <p className="text-lg font-black mt-1">{formatCurrency(analysis.vat10)}</p>
                        </div>
                    </div>
                    <div className="glass-card p-8 flex flex-col items-center justify-center space-y-4 text-orange-500">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-[10px] border-orange-500/20" />
                            <div className="absolute inset-0 rounded-full border-[10px] border-orange-500 border-t-transparent -rotate-90" />
                            <span className="text-2xl font-black">%1</span>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">KDV Grubu</p>
                            <p className="text-lg font-black mt-1">{formatCurrency(analysis.vat1)}</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="glass-card p-0 overflow-hidden shadow-2xl">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-background/50 text-secondary border-b border-border">
                                <th className="px-6 py-4 text-left font-bold uppercase text-[9px]">Tarih</th>
                                <th className="px-6 py-4 text-left font-bold uppercase text-[9px]">Belge No</th>
                                <th className="px-4 py-4 text-left font-bold uppercase text-[9px]">Cari Ünvan</th>
                                <th className="px-6 py-4 text-left font-bold uppercase text-[9px]">İşlem Tipi</th>
                                <th className="px-6 py-4 text-right font-bold uppercase text-[9px]">Matrah</th>
                                {type === 'list' && <th className="px-6 py-4 text-center font-bold uppercase text-[9px]">KDV %</th>}
                                <th className="px-6 py-4 text-right font-bold uppercase text-[9px]">KDV Tutarı</th>
                                <th className="px-6 py-4 text-right font-bold uppercase text-[9px]">Genel Toplam</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20 font-medium">
                            {reportData.length === 0 ? (
                                <tr>
                                    <td colSpan={type === 'list' ? 8 : 7} className="py-20 text-center text-secondary opacity-40 uppercase tracking-widest font-black text-xs">
                                        Seçili tarihlerde fatura bulunamadı
                                    </td>
                                </tr>
                            ) : (
                                reportData.map((inv: any, i: number) => (
                                    <tr key={i} className="hover:bg-white/[0.02] transition-all">
                                        <td className="px-6 py-4 font-mono font-bold text-secondary text-[10px]">{inv.invoice_date}</td>
                                        <td className="px-6 py-4 font-bold text-foreground text-[10px] underline decoration-primary/30 underline-offset-4">{inv.invoice_no}</td>
                                        <td className="px-4 py-4">
                                            <div className="text-[10px] font-black text-foreground truncate max-w-[200px]">{inv.cari_name || 'PERAKENDE MÜŞTERİ'}</div>
                                            <div className="text-[9px] text-secondary/50 font-mono tracking-tighter lowercase">{inv.invoice_type}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${['alis', 'alinan_hizmet'].includes(inv.invoice_type)
                                                ? 'bg-blue-500/10 text-blue-500'
                                                : 'bg-emerald-500/10 text-emerald-500'
                                                }`}>
                                                {['alis', 'alinan_hizmet'].includes(inv.invoice_type) ? 'Gelen' : 'Giden'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-foreground text-[10px]">{formatCurrency(inv.subtotal)}</td>
                                        {type === 'list' && (
                                            <td className="px-6 py-4 text-center font-bold text-secondary text-[10px]">
                                                {inv.invoice_items?.[0]?.vat_rate ? `%${inv.invoice_items[0].vat_rate}` : 'Karma'}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-right font-mono font-bold text-primary text-[10px]">{formatCurrency(inv.vat_total)}</td>
                                        <td className="px-6 py-4 text-right font-mono font-black text-foreground text-[10px]">{formatCurrency(inv.total_amount)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
