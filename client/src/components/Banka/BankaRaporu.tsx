"use client";

import { useState, useEffect } from "react";
import {
    PieChart, Search, FileBarChart,
    Download, Printer, Filter,
    Calendar, ArrowUpRight, ArrowDownLeft,
    Landmark, ClipboardList, Scale,
    FileSearch, MoreHorizontal, ArrowLeftRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

interface BankaRaporuProps {
    type: "Liste" | "Bakiye" | "Hareket";
    showToast?: (message: string, type: "success" | "error" | "info" | "warning") => void;
}

export default function BankaRaporu({ type, showToast }: BankaRaporuProps) {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
        bankaId: "",
        search: ""
    });
    const [banks, setBanks] = useState<any[]>([]);

    useEffect(() => {
        loadBanks();
    }, [currentTenant]);

    useEffect(() => {
        fetchReport();
    }, [currentTenant, filters, type]);

    const loadBanks = async () => {
        if (!currentTenant) return;
        const { data } = await supabase.from('bankalar').select('*').eq('tenant_id', currentTenant.id);
        if (data) setBanks(data);
    };

    const fetchReport = async () => {
        if (!currentTenant) return;
        setLoading(true);
        try {
            if (type === "Liste") {
                const { data, error } = await supabase
                    .from('bankalar')
                    .select('*')
                    .eq('tenant_id', currentTenant.id)
                    .ilike('tanimi', `%${filters.search}%`);
                if (error) throw error;
                setData(data || []);
            } else if (type === "Bakiye") {
                const { data: hareketler, error } = await supabase
                    .from('banka_fis_satirlari')
                    .select('banka_id, borc, alacak, bankalar(tanimi, banka_adi)')
                    .eq('tenant_id', currentTenant.id);

                if (error) throw error;

                const balances: any = {};
                hareketler?.forEach((h: any) => {
                    const bId = h.banka_id;
                    if (!balances[bId]) {
                        const bankData = Array.isArray(h.bankalar) ? h.bankalar[0] : h.bankalar;
                        balances[bId] = {
                            tanimi: bankData?.tanimi || 'N/A',
                            banka_adi: bankData?.banka_adi || '',
                            borc: 0,
                            alacak: 0
                        };
                    }
                    balances[bId].borc += parseFloat(h.borc) || 0;
                    balances[bId].alacak += parseFloat(h.alacak) || 0;
                });

                setData(Object.values(balances));
            } else if (type === "Hareket") {
                let query = supabase
                    .from('banka_fis_satirlari')
                    .select(`
                        id, 
                        created_at, 
                        aciklama, 
                        borc, 
                        alacak, 
                        banka_id,
                        bankalar(tanimi),
                        fis_id,
                        banka_fisleri(fis_no, fis_tipi, fis_tarihi)
                    `)
                    .eq('tenant_id', currentTenant.id)
                    .order('created_at', { ascending: false });

                if (filters.bankaId) query = query.eq('banka_id', filters.bankaId);
                const { data, error } = await query;
                if (error) throw error;
                setData(data || []);
            }
        } catch (err: any) {
            showToast?.(err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const totals = {
        borc: (type === "Bakiye" || type === "Hareket") ? data.reduce((sum, item) => sum + (Number(item.borc) || 0), 0) : 0,
        alacak: (type === "Bakiye" || type === "Hareket") ? data.reduce((sum, item) => sum + (Number(item.alacak) || 0), 0) : 0,
    };

    const getChartData = () => {
        if (type === "Bakiye") {
            return data.map(b => ({
                name: b.tanimi,
                bakiye: (Number(b.borc) || 0) - (Number(b.alacak) || 0)
            }));
        } else if (type === "Hareket") {
            const grouped = data.reduce((acc: any, item) => {
                const date = new Date(item.banka_fisleri?.fis_tarihi || item.created_at).toLocaleDateString('tr-TR');
                if (!acc[date]) acc[date] = { date, giriş: 0, çıkış: 0 };
                acc[date].giriş += Number(item.borc) || 0;
                acc[date].çıkış += Number(item.alacak) || 0;
                return acc;
            }, {});
            return Object.values(grouped).reverse();
        }
        return [];
    };

    const chartData = getChartData();
    const pieData = [
        { name: 'Giriş', value: totals.borc, color: '#10b981' },
        { name: 'Çıkış', value: totals.alacak, color: '#f43f5e' }
    ];

    return (
        <div className="space-y-8 max-w-[1400px] mx-auto pb-32 px-4 md:px-8">
            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 md:p-8 border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-8 shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16 blur-3xl" />

                <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-6 relative z-10">
                    <div className="flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-xl border border-primary/20 self-start group">
                        <Filter className="w-4 h-4 text-primary group-hover:rotate-180 transition-transform duration-500" />
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Filtreleme Paneli</span>
                    </div>

                    <div className="flex flex-col sm:flex-row flex-1 gap-4">
                        {type === "Hareket" && (
                            <>
                                <div className="flex items-center gap-3 bg-[#020617]/40 border border-white/10 rounded-2xl px-4 py-2 hover:border-primary/40 transition-all flex-1">
                                    <Calendar className="w-4 h-4 text-secondary/40 shrink-0" />
                                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                        <input
                                            type="date"
                                            value={filters.startDate}
                                            onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                                            className="w-full bg-transparent text-xs text-white outline-none font-bold placeholder:text-secondary/20"
                                        />
                                        <span className="text-secondary/20 font-black">-</span>
                                        <input
                                            type="date"
                                            value={filters.endDate}
                                            onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                                            className="w-full bg-transparent text-xs text-white outline-none font-bold placeholder:text-secondary/20"
                                        />
                                    </div>
                                </div>
                                <div className="relative flex-1 min-w-[200px]">
                                    <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/40 pointer-events-none" />
                                    <select
                                        value={filters.bankaId}
                                        onChange={e => setFilters({ ...filters, bankaId: e.target.value })}
                                        className="w-full bg-[#020617] border border-white/10 rounded-xl pl-12 pr-10 py-3 text-xs text-secondary font-bold outline-none focus:border-primary/50 transition-all cursor-pointer appearance-none uppercase tracking-wider hover:border-primary/40"
                                    >
                                        <option value="">TÜM BANKA HESAPLARI</option>
                                        {banks.map(b => <option key={b.id} value={b.id}>{b.tanimi}</option>)}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary/30">
                                        <MoreHorizontal className="w-4 h-4 rotate-90" />
                                    </div>
                                </div>
                            </>
                        )}

                        {(type === "Liste" || type === "Bakiye") && (
                            <div className="flex-1 relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/40 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Hesap adı, kodu veya tanımı ile ara..."
                                    value={filters.search}
                                    onChange={e => setFilters({ ...filters, search: e.target.value })}
                                    className="w-full bg-[#020617]/40 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-sm text-white font-medium outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-secondary/30"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 self-center lg:self-auto relative z-10 border-t lg:border-t-0 lg:border-l border-white/5 pt-6 lg:pt-0 lg:pl-8">
                    <button className="p-3.5 bg-white/[0.03] hover:bg-white/[0.08] text-secondary hover:text-white border border-white/5 rounded-xl transition-all active:scale-95 group" title="Yazdır">
                        <Printer className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                    <button className="p-3.5 bg-white/[0.03] hover:bg-white/[0.08] text-secondary hover:text-white border border-white/5 rounded-xl transition-all active:scale-95 group" title="Dışa Aktar">
                        <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                    <button
                        onClick={() => fetchReport()}
                        className="px-6 py-3.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl transition-all active:scale-95 font-bold text-[10px] tracking-widest uppercase"
                    >
                        YENİLE
                    </button>
                </div>
            </motion.div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <SummaryStat
                    label="Toplam Tahsilat"
                    value={totals.borc}
                    icon={ArrowUpRight}
                    color="emerald"
                    delay={0}
                />
                <SummaryStat
                    label="Toplam Tediye"
                    value={totals.alacak}
                    icon={ArrowDownLeft}
                    color="rose"
                    delay={0.1}
                />
                <SummaryStat
                    label="Net Banka Mevcudu"
                    value={totals.borc - totals.alacak}
                    icon={Scale}
                    color="primary"
                    delay={0.2}
                    showStatus
                />
                <div className="glass-card p-6 border-white/5 bg-gradient-to-br from-primary/5 to-transparent flex flex-wrap items-center justify-between relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 opacity-[0.05] group-hover:rotate-12 transition-transform duration-700">
                        <ArrowLeftRight className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-secondary tracking-[0.3em] uppercase mb-4 opacity-50">Sistem Durumu</p>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                            <span className="text-xs font-black text-white uppercase tracking-widest">BANKA ENTEGRASYONU AKTİF</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            {(type === "Bakiye" || type === "Hareket") && chartData.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="lg:col-span-2 glass-card p-6 border-white/5 bg-white/[0.01] min-h-[350px] flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Banka Akış Analizi</h3>
                                <p className="text-[10px] text-secondary/40 font-bold uppercase mt-1">Zaman Bazlı Finansal Hareketler</p>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Giriş</div>
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500" /> Çıkış</div>
                            </div>
                        </div>
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height={280}>
                                {type === "Hareket" ? (
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorGirisB" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorCikisB" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }} />
                                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }} tickFormatter={(val) => `₺${val.toLocaleString()}`} />
                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }} itemStyle={{ fontWeight: 'bold' }} />
                                        <Area type="monotone" dataKey="giriş" stroke="#10b981" fillOpacity={1} fill="url(#colorGirisB)" strokeWidth={3} />
                                        <Area type="monotone" dataKey="çıkış" stroke="#f43f5e" fillOpacity={1} fill="url(#colorCikisB)" strokeWidth={3} />
                                    </AreaChart>
                                ) : (
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }} />
                                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }} />
                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }} />
                                        <Bar dataKey="bakiye" radius={[6, 6, 0, 0]}>
                                            {chartData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.bakiye >= 0 ? '#10b981' : '#f43f5e'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card p-6 border-white/5 bg-white/[0.01] flex flex-col justify-center items-center relative"
                    >
                        <div className="absolute top-6 left-6">
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Hesap Dağılımı</h3>
                            <p className="text-[10px] text-secondary/40 font-bold uppercase mt-1">Giriş / Çıkış Oranı</p>
                        </div>
                        <ResponsiveContainer width="100%" height={250}>
                            <RePieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={10}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }} />
                                <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-[10px] font-black uppercase text-secondary/60 tracking-widest">{value}</span>} />
                            </RePieChart>
                        </ResponsiveContainer>
                    </motion.div>
                </div>
            )}

            {/* Report Content */}
            <motion.div
                key={type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card border-white/5 overflow-hidden shadow-2xl relative"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0" />

                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {type === "Liste" && (
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-white/[0.02] border-b border-white/5">
                                    <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest w-40">Hesap Kodu</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest">Hesap Detayı</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest">IBAN</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest w-32 text-right">Durum</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {data.map(item => (
                                    <tr key={item.id} className="hover:bg-white/[0.01] transition-colors group">
                                        <td className="px-10 py-5">
                                            <span className="font-mono text-xs text-primary font-black uppercase tracking-widest bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10">
                                                {item.banka_kodu}
                                            </span>
                                        </td>
                                        <td className="px-10 py-5">
                                            <div className="space-y-1">
                                                <p className="font-black text-sm text-white tracking-tight uppercase">{item.tanimi}</p>
                                                <div className="flex items-center gap-2 opacity-40">
                                                    <Landmark className="w-3 h-3 text-secondary" />
                                                    <p className="text-[10px] text-secondary font-bold uppercase">{item.banka_adi || 'Banka Belirtilmemiş'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-5">
                                            <div className="flex items-center gap-3 group/iban">
                                                <p className="font-mono text-xs text-secondary font-bold tracking-widest select-all">{item.iban_no || 'IBAN KAYDI TANIMSIZ'}</p>
                                                {item.iban_no && (
                                                    <button className="opacity-0 group-hover/iban:opacity-100 p-1.5 hover:bg-white/5 rounded-md transition-all">
                                                        <ClipboardList className="w-3.5 h-3.5 text-primary" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-10 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">AKTİF</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {type === "Bakiye" && (
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-white/[0.02] border-b border-white/5">
                                    <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest">Banka Hesabı</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest text-right w-48">Borç</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest text-right w-48">Alacak</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest text-right w-56">Net Bakiye</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {data.map((item, idx) => {
                                    const bakiye = (Number(item.borc) || 0) - (Number(item.alacak) || 0);
                                    return (
                                        <tr key={idx} className="hover:bg-white/[0.01] transition-colors group">
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-center shrink-0">
                                                        <Scale className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-sm text-white tracking-tight uppercase">{item.tanimi}</p>
                                                        <p className="text-[10px] text-secondary/40 font-bold uppercase tracking-widest">{item.banka_adi}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <div className="flex items-baseline justify-end gap-2">
                                                    <span className="text-[10px] font-black text-emerald-500/30 italic">TRY</span>
                                                    <span className="font-black text-lg text-emerald-400 tracking-tighter">{Number(item.borc).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <div className="flex items-baseline justify-end gap-2">
                                                    <span className="text-[10px] font-black text-rose-500/30 italic">TRY</span>
                                                    <span className="font-black text-lg text-rose-400 tracking-tighter">{Number(item.alacak).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-xs font-black text-secondary/30 italic tracking-tighter">TRY</span>
                                                        <span className={`font-black text-xl tracking-tighter ${bakiye >= 0 ? 'text-primary' : 'text-rose-500'}`}>
                                                            {Math.abs(bakiye).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                    <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${bakiye >= 0 ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                                                        {bakiye >= 0 ? 'BORÇ BAKİYESİ' : 'ALACAK BAKİYESİ'}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}

                    {type === "Hareket" && (
                        <table className="w-full text-left border-collapse min-w-[1200px]">
                            <thead>
                                <tr className="bg-white/[0.02] border-b border-white/5">
                                    <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest w-40">Tarih & Saat</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest w-40">Referans</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest w-48">Banka</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest">Açıklama</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest text-right w-40">Borç</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest text-right w-40">Alacak</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {data.map(item => (
                                    <tr key={item.id} className="hover:bg-white/[0.01] transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3 h-3 text-primary opacity-40" />
                                                    <p className="text-xs text-white font-black">{new Date(item.banka_fisleri?.fis_tarihi || item.created_at).toLocaleDateString('tr-TR')}</p>
                                                </div>
                                                <p className="text-[10px] text-secondary/40 font-bold uppercase tracking-widest pl-5">{new Date(item.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="space-y-1.5">
                                                <div className="font-mono text-xs text-primary font-black tracking-widest group-hover:underline cursor-pointer">{item.banka_fisleri?.fis_no}</div>
                                                <div className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-black text-secondary uppercase tracking-[0.2em] inline-block group-hover:bg-primary/10 group-hover:border-primary/20 group-hover:text-primary transition-all">
                                                    {item.banka_fisleri?.fis_tipi}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                                                <p className="font-black text-sm text-white tracking-tight uppercase truncate max-w-[200px]">{item.bankalar?.tanimi}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-xs text-secondary/60 font-medium italic max-w-[250px] truncate leading-relaxed">
                                                {item.aciklama || <span className="opacity-20">NOT GİRİLMEMİŞ</span>}
                                            </p>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            {parseFloat(item.borc) > 0 ? (
                                                <div className="flex items-baseline justify-end gap-1.5">
                                                    <span className="text-[10px] font-black text-emerald-500/30">₺</span>
                                                    <span className="font-black text-base text-emerald-400 tracking-tighter">{parseFloat(item.borc).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            ) : <span className="text-secondary/10 font-bold">—</span>}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            {parseFloat(item.alacak) > 0 ? (
                                                <div className="flex items-baseline justify-end gap-1.5">
                                                    <span className="text-[10px] font-black text-rose-500/30">₺</span>
                                                    <span className="font-black text-base text-rose-400 tracking-tighter">{parseFloat(item.alacak).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            ) : <span className="text-secondary/10 font-bold">—</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {data.length === 0 && !loading && (
                        <div className="py-32 text-center space-y-8 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
                                <FileSearch className="w-96 h-96 mx-auto -rotate-12 translate-y-12" />
                            </div>
                            <div className="w-28 h-28 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl relative z-10">
                                <Search className="w-12 h-12 text-secondary opacity-20" />
                                <div className="absolute inset-0 bg-primary/5 rounded-[2.5rem] animate-pulse" />
                            </div>
                            <div className="space-y-3 relative z-10 px-6">
                                <h3 className="text-white text-xl font-black uppercase tracking-[0.3em]">Sonuç Bulunamadı</h3>
                                <p className="text-secondary/40 text-sm font-bold italic tracking-wide max-w-md mx-auto leading-relaxed">Seçilen kriterlere uygun veri kaydı sistemde mevcut değil. Lütfen filtrelerinizi kontrol ederek tekrar deneyiniz.</p>
                            </div>
                            <button
                                onClick={() => setFilters({ ...filters, search: "", bankaId: "" })}
                                className="relative z-10 px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all border border-white/5 active:scale-95"
                            >
                                FİLTRELERİ TEMİZLE
                            </button>
                        </div>
                    )}

                    {loading && (
                        <div className="py-40 text-center space-y-8 relative overflow-hidden">
                            <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto shadow-xl shadow-primary/10" />
                            <div className="space-y-2">
                                <p className="text-white font-black tracking-[0.4em] uppercase text-xs">Veriler Alınıyor</p>
                                <p className="text-secondary/40 text-[10px] font-black italic tracking-widest">LÜTFEN BEKLEYİN...</p>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

// Helper Components
function SummaryStat({ label, value, icon: Icon, color, delay, showStatus }: any) {
    const isNegative = value < 0;
    const colors: any = {
        emerald: "border-emerald-500/10 bg-emerald-500/[0.03] text-emerald-400 shadow-emerald-500/5",
        rose: "border-rose-500/10 bg-rose-500/[0.03] text-rose-400 shadow-rose-500/5",
        primary: "border-primary/10 bg-primary/[0.03] text-primary shadow-primary/5"
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            className={`glass-card p-6 md:p-8 border-white/5 relative overflow-hidden group shadow-xl ${colors[color]}`}
        >
            <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700 pointer-events-none">
                <Icon className="w-40 h-40" />
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110 ${color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20' :
                    color === 'rose' ? 'bg-rose-500/10 border-rose-500/20' :
                        'bg-primary/10 border-primary/20'
                    }`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 leading-none">{label}</p>
                    {showStatus && (
                        <div className="flex items-center gap-1.5 mt-1">
                            <div className={`w-1 h-1 rounded-full ${isNegative ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                            <span className="text-[8px] font-black uppercase tracking-tighter opacity-40">{isNegative ? 'BORÇLU DURUM' : 'NET VARLIK'}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col relative z-10">
                <div className="flex items-baseline gap-3">
                    <span className="text-sm font-black opacity-20 italic">TRY</span>
                    <p className={`text-3xl font-black tracking-tighter leading-none ${isNegative ? 'text-rose-500' : 'text-current'}`}>
                        {Math.abs(value).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
