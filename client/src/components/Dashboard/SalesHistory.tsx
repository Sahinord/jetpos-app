"use client";

import { useState, useEffect } from "react";
import {
    Clock,
    Search,
    ArrowRight,
    Printer,
    Calendar,
    ChevronDown,
    Filter,
    CreditCard,
    Banknote,
    FileText,
    Trash2,
    AlertTriangle,
    RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { triggerManualPrint } from "@/components/POS/Receipt";
import { useTenant } from "@/lib/tenant-context";

export default function SalesHistory() {
    const { currentTenant } = useTenant();
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFilter, setDateFilter] = useState("today"); // today, week, month, all
    const [selectedSale, setSelectedSale] = useState<any>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    useEffect(() => {
        if (currentTenant) {
            fetchSales();
        }
    }, [dateFilter, currentTenant?.id]);

    const fetchSales = async () => {
        setLoading(true);
        try {
            console.log("Satış geçmişi çekiliyor...");
            if (!currentTenant) return;

            let query = supabase
                .from('sales')
                .select(`
                    id, 
                    total_amount, 
                    total_profit,
                    payment_method, 
                    status,
                    notes,
                    created_at,
                    sale_items (
                        quantity,
                        unit_price,
                        product_id,
                        products ( name, barcode )
                    )
                `)
                .eq('tenant_id', currentTenant.id)
                .order('created_at', { ascending: false });

            const now = new Date();
            if (dateFilter === 'today') {
                now.setHours(0, 0, 0, 0);
                query = query.gte('created_at', now.toISOString());
            } else if (dateFilter === 'week') {
                const lastWeek = new Date();
                lastWeek.setDate(now.getDate() - 7);
                query = query.gte('created_at', lastWeek.toISOString());
            } else if (dateFilter === 'month') {
                const lastMonth = new Date();
                lastMonth.setMonth(now.getMonth() - 1);
                query = query.gte('created_at', lastMonth.toISOString());
            }

            const { data, error } = await query;
            if (error) {
                console.error("Supabase Error Details:", error);
                throw error;
            }
            setSales(data || []);
        } catch (error: any) {
            console.error("Fetch Data Error:", error);
            alert("Veri çekme hatası: " + (error?.message || "Bilinmeyen hata"));
        } finally {
            setLoading(false);
        }
    };

    const handleCancelRestore = async (sale: any, action: 'cancel' | 'restore') => {
        if (!currentTenant) return;
        try {
            setLoading(true);
            const { error: updateError } = await supabase
                .from('sales')
                .update({
                    status: action === 'cancel' ? 'cancelled' : 'completed',
                    notes: action === 'cancel' ? 'İADE/İPTAL' : 'GERİ ALINDI'
                })
                .eq('id', sale.id)
                .eq('tenant_id', currentTenant.id);

            if (updateError) throw updateError;

            for (const item of sale.sale_items) {
                const rpcName = action === 'cancel' ? 'increment_stock' : 'decrement_stock';
                const { error: stockError } = await supabase.rpc(rpcName, {
                    p_product_id: item.product_id,
                    p_qty: item.quantity
                });
                if (stockError) throw stockError;
            }

            alert(action === 'cancel' ? "Satış iptal edildi." : "İşlem geri alındı.");
            setIsDetailModalOpen(false);
            fetchSales();
        } catch (error: any) {
            console.error("Cancel/Restore Error:", error);
            alert("İşlem hatası: " + (error?.message || "Bilinmeyen hata"));
        } finally {
            setLoading(false);
        }
    };

    const filteredSales = sales.filter(s => {
        const searchLower = searchTerm.toLowerCase();
        if (s.id.toLowerCase().includes(searchLower)) return true;
        const hasProduct = s.sale_items?.some((item: any) =>
            item.products?.name.toLowerCase().includes(searchLower) ||
            item.products?.barcode?.includes(searchLower)
        );
        return hasProduct;
    });

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/20 p-6 rounded-2xl border border-border">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 shadow-inner">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground tracking-tight">İşlem Geçmişi</h2>
                        <p className="text-sm text-secondary font-medium">Geçmiş satışları görüntüle ve yönet</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary w-4 h-4" />
                        <input
                            type="text"
                            placeholder="İşlem No veya Ürün Ara..."
                            className="w-full bg-primary/5 border border-border rounded-xl py-3 pl-10 pr-4 text-sm font-bold focus:outline-none focus:border-blue-500/50 transition-all placeholder:font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center bg-primary/5 border border-border rounded-xl p-1">
                        {[
                            { id: 'today', label: 'Bugün' },
                            { id: 'week', label: 'Bu Hafta' },
                            { id: 'month', label: 'Bu Ay' },
                            { id: 'all', label: 'Tümü' }
                        ].map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setDateFilter(filter.id)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${dateFilter === filter.id ? 'bg-blue-600 text-white shadow-lg' : 'text-secondary hover:text-foreground'}`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="glass-card !p-0 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-primary/5 border-b border-border">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-[2px]">İşlem No</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-[2px]">Tarih / Saat</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-[2px]">Ödeme</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-[2px]">Ürün Sayısı</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-[2px] text-right">Tutar</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-[2px] text-right">Detay</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {loading ? (
                            <tr><td colSpan={6} className="p-10 text-center text-secondary font-bold">Yükleniyor...</td></tr>
                        ) : filteredSales.length === 0 ? (
                            <tr><td colSpan={6} className="p-10 text-center text-secondary font-bold">Kayıt bulunamadı.</td></tr>
                        ) : (
                            filteredSales.map((sale) => (
                                <tr key={sale.id} className={`hover:bg-primary/5 transition-colors group cursor-pointer ${sale.status === 'cancelled' ? 'opacity-50' : ''}`} onClick={() => { setSelectedSale(sale); setIsDetailModalOpen(true); }}>
                                    <td className="px-6 py-4">
                                        <div className="font-mono text-xs text-secondary group-hover:text-blue-400 transition-colors flex items-center gap-2">
                                            #{sale.id.slice(0, 8).toUpperCase()}
                                            {sale.status === 'cancelled' && <span className="text-[10px] text-rose-500 font-black px-1.5 py-0.5 bg-rose-500/10 rounded">İPTAL</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-foreground">{new Date(sale.created_at).toLocaleDateString('tr-TR')}</span>
                                            <span className="text-xs text-secondary">{new Date(sale.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${sale.payment_method === 'NAKİT'
                                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                            : 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
                                            }`}>
                                            {sale.payment_method === 'NAKİT' ? <Banknote className="w-3 h-3 mr-1.5" /> : <CreditCard className="w-3 h-3 mr-1.5" />}
                                            {sale.payment_method || 'NAKİT'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-secondary">
                                            {sale.sale_items?.length || 0} Kalem
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-lg font-black text-foreground">₺{sale.total_amount.toFixed(2)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 bg-primary/5 rounded-lg text-secondary group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <AnimatePresence>
                {isDetailModalOpen && selectedSale && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsDetailModalOpen(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-2xl glass-card !p-0 overflow-hidden shadow-2xl border-white/10 flex flex-col max-h-[85vh]"
                        >
                            <div className="p-6 border-b border-border bg-primary/5 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-secondary uppercase tracking-[2px]">İşlem Detayı</p>
                                    <h3 className="text-xl font-bold text-foreground mt-1">#{selectedSale.id.slice(0, 8).toUpperCase()}</h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-foreground">{new Date(selectedSale.created_at).toLocaleDateString('tr-TR')}</p>
                                    <p className="text-xs text-secondary">{new Date(selectedSale.created_at).toLocaleTimeString('tr-TR')}</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-secondary uppercase tracking-widest mb-4">Satılan Ürünler</h4>
                                    {selectedSale.sale_items?.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-primary/5 rounded-xl border border-border">
                                            <div>
                                                <p className="font-bold text-sm text-foreground">{item.products?.name || "Silinmiş Ürün"}</p>
                                                <p className="text-[10px] text-secondary font-mono">{item.products?.barcode || "-"}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-foreground">₺{(item.unit_price * item.quantity).toFixed(2)}</p>
                                                <p className="text-xs text-secondary">{item.quantity} x ₺{item.unit_price}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-border pt-6 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-secondary font-bold text-sm">Ödeme Yöntemi</span>
                                        <span className="text-foreground font-bold">{selectedSale.payment_method}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-foreground font-black text-lg">TOPLAM TUTAR</span>
                                        <span className="text-emerald-600 font-black text-2xl">₺{selectedSale.total_amount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-border bg-primary/5 flex flex-wrap gap-4">
                                {selectedSale.status !== 'cancelled' ? (
                                    <button
                                        onClick={async () => {
                                            if (!confirm("BU SATIŞI İPTAL ETMEK İSTEDİĞİNİZDEN EMİN MİSİNİZ? \n\n* Tüm ürünler stoğa geri eklenecek.")) return;
                                            try {
                                                const { error } = await supabase.from('sales').update({ status: 'cancelled', notes: (selectedSale.notes || '') + ' [İPTAL EDİLDİ]' }).eq('id', selectedSale.id).eq('tenant_id', currentTenant?.id);
                                                if (error) throw error;
                                                for (const item of selectedSale.sale_items) {
                                                    await supabase.rpc('increment_stock', { p_product_id: item.product_id, p_qty: item.quantity });
                                                }
                                                alert("Satış iptal edildi.");
                                                setIsDetailModalOpen(false);
                                                fetchSales();
                                            } catch (err: any) { alert(err.message); }
                                        }}
                                        className="py-4 px-6 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-rose-500/20"
                                    >
                                        <Trash2 className="w-4 h-4" /> SATIŞI İPTAL ET
                                    </button>
                                ) : (
                                    <button
                                        onClick={async () => {
                                            if (!confirm("BU İPTALİ GERİ ALMAK İSTEDİĞİNİZDEN EMİN MİSİNİZ? \n\n* Stoklar tekrar düşülecek.")) return;
                                            try {
                                                const { error } = await supabase.from('sales').update({ status: 'completed', notes: selectedSale.notes?.replace(' [İPTAL EDİLDİ]', '') || '' }).eq('id', selectedSale.id).eq('tenant_id', currentTenant?.id);
                                                if (error) throw error;
                                                for (const item of selectedSale.sale_items) {
                                                    await supabase.rpc('decrement_stock', { p_product_id: item.product_id, p_qty: item.quantity });
                                                }
                                                alert("İşlem geri alındı.");
                                                setIsDetailModalOpen(false);
                                                fetchSales();
                                            } catch (err: any) { alert(err.message); }
                                        }}
                                        className="py-4 px-6 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-emerald-500/20"
                                    >
                                        <RotateCcw className="w-4 h-4" /> İŞLEMİ GERİ AL
                                    </button>
                                )}

                                <button
                                    onClick={async () => {
                                        const receiptData = {
                                            saleId: selectedSale.id.slice(0, 8).toUpperCase(),
                                            date: new Date(selectedSale.created_at),
                                            items: selectedSale.sale_items.map((i: any) => ({ name: i.products?.name || "Ürün", barcode: i.products?.barcode, quantity: i.quantity, sale_price: i.unit_price })),
                                            total: selectedSale.total_amount,
                                            paymentMethod: selectedSale.payment_method
                                        };
                                        await triggerManualPrint(receiptData);
                                    }}
                                    className="flex-1 py-4 bg-primary/5 hover:bg-primary/10 text-foreground font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <Printer className="w-4 h-4" /> TEKRAR YAZDIR
                                </button>
                                <button onClick={() => setIsDetailModalOpen(false)} className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20">KAPAT</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
