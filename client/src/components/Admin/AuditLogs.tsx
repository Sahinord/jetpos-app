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
    Database
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
