"use client";

import { useState, useEffect } from "react";
import {
    FileSearch, Scale, Filter,
    Download, Printer, Search,
    ChevronRight, ArrowUpRight,
    ArrowDownLeft, Wallet, Calendar,
    RefreshCcw, Layers, Landmark,
    MoreHorizontal, ClipboardList
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

interface KasaRaporuProps {
    mode: "Bakiye" | "Hareket";
    showToast?: (message: string, type: "success" | "error" | "info" | "warning") => void;
}

export default function KasaRaporu({ mode, showToast }: KasaRaporuProps) {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const loadData = async () => {
        if (!currentTenant) return;
        setLoading(true);

        try {
            if (mode === "Bakiye") {
                const { data: kasalar } = await supabase
                    .from('kasa_tanimlari')
                    .select('id, kasa_kodu, kasa_adi, para_birimi')
                    .eq('tenant_id', currentTenant.id);

                const { data: movements } = await supabase
                    .from('kasa_fis_satirlari')
                    .select('kasa_id, borc_tutari, alacak_tutari')
                    .eq('tenant_id', currentTenant.id);

                const reportData = kasalar?.map(k => {
                    const rowMovements = movements?.filter(m => m.kasa_id === k.id) || [];
                    const borc = rowMovements.reduce((sum, m) => sum + (Number(m.borc_tutari) || 0), 0);
                    const alacak = rowMovements.reduce((sum, m) => sum + (Number(m.alacak_tutari) || 0), 0);
                    return {
                        ...k,
                        borc,
                        alacak,
                        bakiye: borc - alacak
                    };
                });
                setData(reportData || []);
            } else {
                const { data: movements, error } = await supabase
                    .from('kasa_fis_satirlari')
                    .select(`
                        id,
                        borc_tutari,
                        alacak_tutari,
                        aciklama,
                        unvan,
                        created_at,
                        kasa_tanimlari (kasa_adi, kasa_kodu),
                        kasa_fisleri (fis_no, fis_tipi, fis_tarihi)
                    `)
                    .eq('tenant_id', currentTenant.id)
                    .gte('created_at', dateRange.start)
                    .lte('created_at', dateRange.end + 'T23:59:59')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setData(movements || []);
            }
        } catch (err: any) {
            showToast?.(err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentTenant, mode, dateRange]);

    const filteredData = data.filter(item => {
        const searchStr = searchTerm.toLowerCase();
        if (mode === "Bakiye") {
            return item.kasa_adi?.toLowerCase().includes(searchStr) || item.kasa_kodu?.toLowerCase().includes(searchStr);
        } else {
            return item.unvan?.toLowerCase().includes(searchStr) ||
                item.kasa_tanimlari?.kasa_adi?.toLowerCase().includes(searchStr) ||
                item.kasa_fisleri?.fis_no?.toLowerCase().includes(searchStr);
        }
    });

    const totals = {
        borc: filteredData.reduce((sum, item) => sum + (Number(item.borc_tutari || item.borc) || 0), 0),
        alacak: filteredData.reduce((sum, item) => sum + (Number(item.alacak_tutari || item.alacak) || 0), 0),
    };

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-32 px-4 md:px-8">
            {/* Filters Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 md:p-8 border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-8 shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16 blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-6 relative z-10">
                    <div className="flex items-center gap-3 px-5 py-3 bg-primary/10 rounded-2xl border border-primary/20 self-start group">
                        <Filter className="w-4 h-4 text-primary group-hover:rotate-180 transition-transform duration-500" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Filtreleme Paneli</span>
                    </div>

                    <div className="flex flex-col sm:flex-row flex-1 gap-4">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/40 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Ara..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-[#020617]/40 border border-white/10 rounded-xl pl-12 pr-6 py-3 text-sm text-white font-medium outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-secondary/20"
                            />
                        </div>

                        {mode === "Hareket" && (
                            <div className="flex items-center gap-3 bg-[#020617]/40 border border-white/10 rounded-xl px-4 py-2 hover:border-primary/40 transition-all">
                                <Calendar className="w-4 h-4 text-secondary/40 shrink-0" />
                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                                        className="bg-transparent text-[11px] text-white outline-none font-black uppercase tracking-wider"
                                    />
                                    <span className="text-secondary/20 font-black">-</span>
                                    <input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                                        className="bg-transparent text-[11px] text-white outline-none font-black uppercase tracking-wider"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 self-center lg:self-auto relative z-10 border-t lg:border-t-0 lg:border-l border-white/5 pt-6 lg:pt-0 lg:pl-8">
                    <button className="p-4 bg-white/[0.03] hover:bg-white/[0.08] text-secondary hover:text-white border border-white/5 rounded-2xl transition-all active:scale-95 group" title="Yazdır">
                        <Printer className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                    <button className="p-4 bg-white/[0.03] hover:bg-white/[0.08] text-secondary hover:text-white border border-white/5 rounded-2xl transition-all active:scale-95 group" title="Dışa Aktar">
                        <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                    <button
                        onClick={loadData}
                        className="px-6 py-4 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-2xl transition-all active:scale-95 font-black text-[10px] tracking-[0.2em] uppercase"
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
                    label="Net Bakiye Durumu"
                    value={totals.borc - totals.alacak}
                    icon={Scale}
                    color="primary"
                    delay={0.2}
                    showStatus
                />
                <div className="glass-card p-6 border-white/5 bg-gradient-to-br from-primary/5 to-transparent flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 opacity-[0.05] group-hover:rotate-12 transition-transform duration-700">
                        <Layers className="w-32 h-32" />
                    </div>
                    <p className="text-[10px] font-black text-secondary tracking-[0.3em] uppercase mb-4 opacity-50">Sistem Durumu</p>
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                        <span className="text-xs font-black text-white uppercase tracking-widest">VERİLER GÜNCEL</span>
                    </div>
                    <p className="text-[9px] text-secondary/40 font-bold mt-2 uppercase">Son Güncelleme: {new Date().toLocaleTimeString('tr-TR')}</p>
                </div>
            </div>

            {/* Report Table Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card border-white/5 overflow-hidden shadow-2xl relative"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0" />

                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/5">
                                {mode === "Bakiye" ? (
                                    <>
                                        <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest w-40">Kasa Kodu</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest">Kasa Tanımı & Birim</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest text-right">Giriş</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest text-right">Çıkış</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest text-right w-56">Bakiye</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest w-40">Tarih / Saat</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest w-40">Fiş No</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest w-48">Kasa</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest">Açıklama</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-secondary uppercase tracking-widest text-right w-40">Tutar</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredData.map((row, idx) => (
                                <tr key={row.id || idx} className="hover:bg-white/[0.01] transition-colors group">
                                    {mode === "Bakiye" ? (
                                        <>
                                            <td className="px-10 py-6">
                                                <span className="font-mono text-xs text-primary font-black uppercase tracking-widest bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10">
                                                    {row.kasa_kodu}
                                                </span>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-secondary group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                                        <Wallet className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-sm text-white tracking-tight uppercase">{row.kasa_adi}</p>
                                                        <p className="text-[10px] text-secondary/40 font-black uppercase tracking-widest">{row.para_birimi} HESABI</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <div className="flex items-baseline justify-end gap-2">
                                                    <span className="text-[10px] font-black text-emerald-500/30 italic">TRY</span>
                                                    <span className="font-black text-base text-emerald-400 tracking-tight">{row.borc.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <div className="flex items-baseline justify-end gap-2">
                                                    <span className="text-[10px] font-black text-rose-500/30 italic">TRY</span>
                                                    <span className="font-black text-base text-rose-400 tracking-tight">{row.alacak.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <div className="flex flex-col items-end">
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-[10px] font-black text-white/20 italic">TRY</span>
                                                        <span className={`text-lg font-black tracking-tighter ${row.bakiye >= 0 ? 'text-white' : 'text-rose-500'}`}>
                                                            {Math.abs(row.bakiye).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                    <div className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest mt-1 ${row.bakiye >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                        {row.bakiye >= 0 ? 'BORÇLUDUR' : 'ALACAKLIDIR'}
                                                    </div>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-10 py-6">
                                                <div className="space-y-1">
                                                    <p className="font-black text-xs text-white tracking-widest">{new Date(row.kasa_fisleri?.fis_tarihi || row.created_at).toLocaleDateString('tr-TR')}</p>
                                                    <p className="text-[10px] text-secondary/40 font-bold uppercase">{new Date(row.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="space-y-1">
                                                    <p className="font-mono text-xs font-black text-primary tracking-wider">{row.kasa_fisleri?.fis_no}</p>
                                                    <div className="flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all opacity-50 group-hover:opacity-100">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${row.kasa_fisleri?.fis_tipi === 'Tahsilat' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                        <p className="text-[9px] font-black text-secondary uppercase tracking-tighter">{row.kasa_fisleri?.fis_tipi}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="space-y-1">
                                                    <p className="font-black text-sm text-white tracking-tight uppercase">{row.kasa_tanimlari?.kasa_adi}</p>
                                                    <p className="text-[10px] font-mono text-secondary/30 font-black">{row.kasa_tanimlari?.kasa_kodu}</p>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="space-y-1">
                                                    <p className="font-bold text-sm text-white/90 tracking-tight uppercase truncate max-w-[300px]">{row.unvan || 'BELİRTİLMEMİŞ'}</p>
                                                    <p className="text-xs text-secondary/40 font-medium italic truncate max-w-[250px]">{row.aciklama || 'Açıklama girilmemiş...'}</p>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <div className="flex flex-col items-end">
                                                    <div className={`flex items-baseline gap-2 ${row.borc_tutari > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        <span className="text-[10px] font-black opacity-30 italic">TRY</span>
                                                        <span className="text-xl font-black tracking-tighter">
                                                            {row.borc_tutari > 0 ? '+' : '-'} {Math.abs(row.borc_tutari || row.alacak_tutari).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                    <ClipboardList className="w-3.5 h-3.5 mt-1 text-secondary/10 group-hover:text-primary/40 transition-colors" />
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredData.length === 0 && (
                    <div className="py-32 text-center space-y-8">
                        <div className="w-24 h-24 bg-white/[0.02] border border-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-inner relative group/empty">
                            <div className="absolute inset-0 bg-primary/5 rounded-[2rem] scale-0 group-hover:scale-100 transition-transform duration-500" />
                            <FileSearch className="w-10 h-10 text-secondary opacity-20 relative z-10" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-white font-black uppercase tracking-[0.3em] text-sm">Veri Havuzu Boş</h3>
                            <p className="text-secondary/40 text-[11px] font-bold italic tracking-wide max-w-[300px] mx-auto leading-relaxed">Aradığınız kriterlere uygun herhangi bir kayıt sistemde bulunamadı.</p>
                        </div>
                    </div>
                )}
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
                            <span className="text-[8px] font-black uppercase tracking-tighter opacity-40">{isNegative ? 'BORÇ BAKİYESİ' : 'ÖZ SERMAYE'}</span>
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
                {showStatus && isNegative && (
                    <div className="mt-3 flex items-center gap-2">
                        <div className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded text-[9px] font-black text-rose-500 tracking-widest uppercase">EKSİ DURUM</div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

