"use client";

import { useState, useEffect } from "react";
import { 
    Users, 
    Target, 
    Star, 
    Zap, 
    TrendingUp, 
    AlertTriangle,
    RefreshCw,
    Search,
    Filter,
    ChevronRight,
    Sparkles
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";
import { motion, AnimatePresence } from "framer-motion";

interface Segment {
    id: string;
    name: string;
    description: string;
    count: number;
    color_code: string;
    icon?: any;
}

export default function Segments({ onTabChange, showToast }: { onTabChange?: any, showToast?: any }) {
    const { currentTenant } = useTenant();
    const [segments, setSegments] = useState<Segment[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchSegments = async () => {
        if (!currentTenant) return;
        setLoading(true);
        try {
            // Fetch RFM analysis result directly
            const { data: rfmData, error: rfmError } = await supabase
                .rpc('get_customer_rfm_analysis', { target_tenant_id: currentTenant.id });

            if (rfmError) {
                console.warn('RFM analysis fetch error:', rfmError);
                // Fallback to empty if RPC is missing
                setSegments([]);
                return;
            }

            if (rfmData) {
                const segmentCounts = rfmData.reduce((acc: any, curr: any) => {
                    acc[curr.segment] = (acc[curr.segment] || 0) + 1;
                    return acc;
                }, {});

                const mappedSegments: Segment[] = [
                    { id: 'vip', name: 'VIP Müşteriler', count: segmentCounts['VIP'] || 0, color_code: 'text-amber-400', description: 'En değerli %5 - Sık gelirler ve çok harcarlar.' },
                    { id: 'loyal', name: 'Sadık Müşteriler', count: segmentCounts['Sadık Müşteri'] || 0, color_code: 'text-blue-400', description: 'Güvenilir kitle - Düzenli alışveriş yaparlar.' },
                    { id: 'potential', name: 'Potansiyel Sadıklar', count: segmentCounts['Potansiyel Sadıklar'] || 0, color_code: 'text-emerald-400', description: 'Yeni ama umut verici - Sık gelmeye başladılar.' },
                    { id: 'risk', name: 'Kaybetme Riski', count: segmentCounts['Riskli (Kaybedilmek Üzere)'] || 0, color_code: 'text-rose-400', description: 'Sizi unutmak üzereler - Uzun süredir gelmediler.' },
                    { id: 'new', name: 'Yeni Müşteriler', count: segmentCounts['Yeni Müşteri'] || 0, color_code: 'text-teal-400', description: 'Taze kan - Son 30 gün içinde ilk alışverişlerini yaptılar.' },
                    { id: 'dormant', name: 'Uyuyan Müşteriler', count: segmentCounts['Uyuyan'] || 0, color_code: 'text-slate-400', description: 'Eski dostlar - En az 6 aydır uğramadılar.' },
                ].filter(s => s.count > 0 || ['vip', 'risk', 'new'].includes(s.id)); // Show empty core segments

                setSegments(mappedSegments);
            }
        } catch (err: any) {
            console.error('Fetch segments error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSegments();

        if (currentTenant) {
            // Re-fetch segments when customers or their points change
            const channel = supabase
                .channel(`segments_realtime_${currentTenant.id}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'cari_hesaplar',
                    filter: `tenant_id=eq.${currentTenant.id}`
                }, () => fetchSegments())
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'loyalty_points',
                    filter: `tenant_id=eq.${currentTenant.id}`
                }, () => fetchSegments())
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [currentTenant]);

    const getIcon = (id: string) => {
        switch(id) {
            case 'vip': return Star;
            case 'loyal': return TrendingUp;
            case 'potential': return Target;
            case 'risk': return AlertTriangle;
            case 'new': return Zap;
            default: return Users;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-amber-400" />
                        AI Segment Analizi
                    </h2>
                    <p className="text-secondary text-sm">Müşteri davranışlarını RFM (Recency, Frequency, Monetary) algoritmasıyla otomatik gruplandırın.</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative group">
                        <input 
                            type="text" 
                            placeholder="Müşteri ara..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-pink-500/50 outline-none w-64 transition-all"
                        />
                        <Search className="absolute right-3 top-2.5 w-4 h-4 text-secondary group-focus-within:text-pink-400 transition-colors" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {segments.map((segment) => {
                    const Icon = getIcon(segment.id);
                    return (
                        <motion.div 
                            key={segment.id}
                            whileHover={{ scale: 1.02 }}
                            className="glass-card p-5 group cursor-pointer border-white/5 hover:border-pink-500/30 transition-all shadow-xl shadow-black/20"
                        >
                            <div className="flex items-start justify-between">
                                <div className={`p-3 rounded-2xl bg-white/5 ${segment.color_code}`}>
                                    <Icon className="w-8 h-8" />
                                </div>
                                <div className="text-right">
                                    <span className="text-4xl font-black text-white">{segment.count}</span>
                                    <p className="text-xs text-secondary font-bold uppercase tracking-wider">Müşteri</p>
                                </div>
                            </div>

                            <div className="mt-6">
                                <h3 className="text-lg font-bold text-white">{segment.name}</h3>
                                <p className="text-sm text-secondary line-clamp-2 mt-1">{segment.description}</p>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-2">
                                <button 
                                    onClick={() => onTabChange?.('crm_campaigns')}
                                    className="flex-1 py-2 bg-pink-600/20 hover:bg-pink-600/40 text-pink-400 text-xs font-bold rounded-xl border border-pink-500/30 transition-all"
                                >
                                    Kampanya Hazırla
                                </button>
                                <button 
                                    onClick={() => onTabChange?.('crm_segments')}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl border border-white/10 transition-all group-hover:gap-3 flex items-center"
                                >
                                    Listele <ChevronRight className="w-3 h-3 ml-1" />
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <div className="glass-card p-6 border-white/5">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        Segment Bazlı Dönüşüm / Gelir
                    </h3>
                    <button onClick={fetchSegments} className="p-2 hover:bg-white/5 rounded-lg transition-all">
                        <RefreshCw className={`w-4 h-4 text-secondary ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <SegmentStat label="VIP Gelir" value="₺42.500" trend="+15%" icon={Star} color="text-amber-400" />
                    <SegmentStat label="Yeni Getiri" value="₺12.300" trend="+8%" icon={Zap} color="text-emerald-400" />
                    <SegmentStat label="Riskli Kurtarılan" value="₺4.800" trend="-2%" icon={AlertTriangle} color="text-rose-400" />
                    <SegmentStat label="Ort. Sadakat" value="4.2 / 5" trend="+0.3" icon={Target} color="text-blue-400" />
                </div>
            </div>
        </div>
    );
}

function SegmentStat({ label, value, trend, icon: Icon, color }: any) {
    return (
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all">
            <div className="flex items-center gap-2 mb-2 text-secondary">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-xs font-bold">{label}</span>
            </div>
            <div className="flex items-end justify-between">
                <span className="text-xl font-black text-white">{value}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {trend}
                </span>
            </div>
        </div>
    );
}
