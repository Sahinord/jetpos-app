"use client";

import { useState, useEffect } from "react";
import { 
    History, 
    Search, 
    Filter, 
    Clock, 
    User, 
    Activity,
    ChevronDown,
    Calendar as CalendarIcon,
    AlertCircle,
    Info,
    CheckCircle2,
    Database,
    Package
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

export default function AuditLogs() {
    const { currentTenant } = useTenant();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const PAGE_SIZE = 50;

    const isUndoable = (log: any) => {
        if (!log.metadata) return false;
        if (log.event_type === 'STOCK_CHANGE') {
            return log.metadata.product_id && log.metadata.old_stock !== undefined && log.metadata.old_stock !== null;
        }
        if (log.event_type === 'PRICE_CHANGE') {
            return log.metadata.product_id && (log.metadata.old_sale_price !== undefined || log.metadata.old_purchase_price !== undefined);
        }
        return false;
    };

    const handleUndo = async (log: any) => {
        if (!currentTenant) return;
        if (log.metadata?.is_undone) return;
        if (!confirm("Bu işlemi geri almak istediğinize emin misiniz?")) return;

        try {
            const { event_type, metadata, id } = log;
            if (!metadata) return;

            if (event_type === 'STOCK_CHANGE') {
                const { product_id, old_stock, warehouse_id } = metadata;
                if (!product_id) throw new Error("Ürün ID bulunamadı");
                if (old_stock === undefined || old_stock === null) throw new Error("Eski stok değeri bulunamadı");

                if (warehouse_id) {
                    const { error } = await supabase
                        .from('warehouse_stock')
                        .update({ quantity: Number(old_stock) })
                        .eq('product_id', product_id)
                        .eq('warehouse_id', warehouse_id)
                        .eq('tenant_id', currentTenant.id);
                    if (error) throw error;
                } else {
                    const { error } = await supabase
                        .from('products')
                        .update({ stock_quantity: Number(old_stock) })
                        .eq('id', product_id)
                        .eq('tenant_id', currentTenant.id);
                    if (error) throw error;
                }

                // Mark as undone
                const updatedMetadata = { ...metadata, is_undone: true };
                await supabase
                    .from('audit_logs')
                    .update({ metadata: updatedMetadata })
                    .eq('id', id)
                    .eq('tenant_id', currentTenant.id);

                // Log revert event
                await supabase
                    .from('audit_logs')
                    .insert([{
                        tenant_id: currentTenant.id,
                        event_type: 'STOCK_CHANGE',
                        description: `Geri Alma: "${metadata.product_name || 'Ürün'}" stok değişimi geri alındı: ${metadata.new_stock} -> ${old_stock}`,
                        metadata: {
                            product_id,
                            reverted_log_id: id,
                            operator: 'Yönetici'
                        }
                    }]);
            } else if (event_type === 'PRICE_CHANGE') {
                const { product_id, old_sale_price, old_purchase_price, warehouse_id } = metadata;
                if (!product_id) throw new Error("Ürün ID bulunamadı");

                const updatePayload: any = {};
                if (old_sale_price !== undefined && old_sale_price !== null) {
                    updatePayload.sale_price = Number(old_sale_price);
                }
                if (old_purchase_price !== undefined && old_purchase_price !== null) {
                    updatePayload.purchase_price = Number(old_purchase_price);
                }

                if (Object.keys(updatePayload).length > 0) {
                    if (warehouse_id) {
                        const { error } = await supabase
                            .from('warehouse_stock')
                            .update(updatePayload)
                            .eq('product_id', product_id)
                            .eq('warehouse_id', warehouse_id)
                            .eq('tenant_id', currentTenant.id);
                        if (error) throw error;
                    } else {
                        const { error } = await supabase
                            .from('products')
                            .update(updatePayload)
                            .eq('id', product_id)
                            .eq('tenant_id', currentTenant.id);
                        if (error) throw error;
                    }
                }

                // Mark as undone
                const updatedMetadata = { ...metadata, is_undone: true };
                await supabase
                    .from('audit_logs')
                    .update({ metadata: updatedMetadata })
                    .eq('id', id)
                    .eq('tenant_id', currentTenant.id);

                // Log revert event
                await supabase
                    .from('audit_logs')
                    .insert([{
                        tenant_id: currentTenant.id,
                        event_type: 'PRICE_CHANGE',
                        description: `Geri Alma: "${metadata.product_name || 'Ürün'}" fiyat değişimi geri alındı`,
                        metadata: {
                            product_id,
                            reverted_log_id: id,
                            operator: 'Yönetici'
                        }
                    }]);
            }

            alert("İşlem başarıyla geri alındı!");
            fetchLogs(true);

        } catch (err: any) {
            console.error("Undo error:", err);
            alert("Hata: " + err.message);
        }
    };

    useEffect(() => {
        fetchLogs(true);
    }, [filterType, currentTenant]);

    const fetchLogs = async (reset = false) => {
        if (!currentTenant) return;
        setLoading(true);
        try {
            const from = reset ? 0 : page * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            let query = supabase
                .from('audit_logs')
                .select('*')
                .eq('tenant_id', currentTenant.id)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (filterType !== 'all') {
                query = query.eq('event_type', filterType);
            }

            if (search) {
                query = query.ilike('description', `%${search}%`);
            }

            const { data, error } = await query;

            if (error) throw error;

            if (reset) {
                setLogs(data || []);
                setPage(1);
            } else {
                setLogs([...logs, ...(data || [])]);
                setPage(page + 1);
            }

            if ((data?.length || 0) < PAGE_SIZE) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

        } catch (err: any) {
            console.error("Audit logs fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'STOCK_CHANGE': return <Package className="text-blue-400" size={18} />;
            case 'PRICE_CHANGE': return <Activity className="text-amber-500" size={18} />;
            case 'PRODUCT_DELETE': return <AlertCircle className="text-rose-500" size={18} />;
            case 'PRODUCT_RESTORE': return <CheckCircle2 className="text-emerald-500" size={18} />;
            case 'DATABASE_RESET': return <Database className="text-rose-600" size={18} />;
            case 'LOGIN': return <User className="text-blue-500" size={18} />;
            default: return <Info className="text-slate-400" size={18} />;
        }
    };

    const formatMetadata = (metadata: any) => {
        if (!metadata || Object.keys(metadata).length === 0) return null;
        return (
            <div className="mt-2 p-2 bg-slate-900/50 rounded-lg text-[10px] font-mono text-slate-400 overflow-x-auto">
                <pre>{JSON.stringify(metadata, null, 2)}</pre>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <History className="text-primary" />
                        Sistem İşlem Kayıtları
                    </h2>
                    <p className="text-sm text-secondary mt-1">İşletmenizde gerçekleşen tüm kritik değişikliklerin dökümü</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="İşlemlerde ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchLogs(true)}
                            className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-primary/50 transition-all text-sm"
                        />
                    </div>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none cursor-pointer hover:bg-white/10 transition-all"
                    >
                        <option value="all" className="bg-slate-900">Tüm İşlemler</option>
                        <option value="STOCK_CHANGE" className="bg-slate-900">Stok Değişimi</option>
                        <option value="PRICE_CHANGE" className="bg-slate-900">Fiyat Değişimi</option>
                        <option value="PRODUCT_DELETE" className="bg-slate-900">Ürün Silme</option>
                        <option value="PRODUCT_RESTORE" className="bg-slate-900">Ürün Geri Yükleme</option>
                        <option value="DATABASE_RESET" className="bg-slate-900">Veritabanı Sıfırlama</option>
                        <option value="LOGIN" className="bg-slate-900">Girişler</option>
                        <option value="CASH_DRAWER_OPEN" className="bg-slate-900">Çekmece Açma</option>
                    </select>
                </div>
            </div>

            <div className="glass-card !p-0 overflow-hidden border border-white/5 shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5">
                                <th className="p-4 text-[10px] font-black text-secondary uppercase tracking-widest">Tarih / Saat</th>
                                <th className="p-4 text-[10px] font-black text-secondary uppercase tracking-widest">İşlem Türü</th>
                                <th className="p-4 text-[10px] font-black text-secondary uppercase tracking-widest">Açıklama</th>
                                <th className="p-4 text-[10px] font-black text-secondary uppercase tracking-widest">Operatör</th>
                                <th className="p-4 text-[10px] font-black text-secondary uppercase tracking-widest text-right">Aksiyon</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {logs.map((log, index) => (
                                <motion.tr 
                                    key={log.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="hover:bg-white/[0.02] transition-colors group"
                                >
                                    <td className="p-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Clock size={14} />
                                            <span className="text-xs font-mono">
                                                {new Date(log.created_at).toLocaleString('tr-TR')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            {getIcon(log.event_type)}
                                            <span className="text-xs font-bold text-white uppercase tracking-tighter">
                                                {log.event_type.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm text-slate-300 font-medium">{log.description}</div>
                                        {formatMetadata(log.metadata)}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                                <User size={12} className="text-primary" />
                                            </div>
                                            <span className="text-xs font-bold text-slate-400">
                                                {log.metadata?.operator || 'Sistem'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        {isUndoable(log) && (
                                            <button
                                                onClick={() => handleUndo(log)}
                                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${
                                                    log.metadata?.is_undone
                                                        ? 'bg-white/5 text-secondary/30 cursor-not-allowed border border-white/5'
                                                        : 'bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 active:scale-95'
                                                }`}
                                                disabled={log.metadata?.is_undone}
                                            >
                                                {log.metadata?.is_undone ? 'GERİ ALINDI' : 'GERİ AL'}
                                            </button>
                                        )}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {logs.length === 0 && !loading && (
                    <div className="p-20 text-center text-secondary opacity-30 flex flex-col items-center gap-4">
                        <History size={64} strokeWidth={1} />
                        <p className="font-black uppercase tracking-widest">Kayıt Bulunamadı</p>
                    </div>
                )}

                {hasMore && (
                    <div className="p-6 border-t border-white/5 text-center">
                        <button 
                            onClick={() => fetchLogs()}
                            disabled={loading}
                            className="px-8 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50"
                        >
                            {loading ? 'Yükleniyor...' : 'Daha Fazla Göster'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
