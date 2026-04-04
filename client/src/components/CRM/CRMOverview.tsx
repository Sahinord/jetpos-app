"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Users, Target, Gift, TrendingUp, AlertTriangle, 
    Zap, Star, Clock, ArrowRight, Sparkles, 
    Filter, RefreshCw, Send, Mail, MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

interface CRMOverviewProps {
    showToast?: (message: string, type: "success" | "error" | "info" | "warning") => void;
}

interface Segment {
    id: string;
    name: string;
    count: number;
    color: string;
    icon: any;
    description: string;
}

export default function CRMOverview({ showToast }: CRMOverviewProps) {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        totalCustomers: 0,
        activeLoyaltyUsers: 0,
        totalPointsIssued: 0,
        activeCampaigns: 0
    });

    const [segments, setSegments] = useState<Segment[]>([
        { id: '1', name: 'VIP Müşteriler', count: 0, color: 'text-amber-400', icon: Star, description: 'En çok alışveriş yapan ilk %5' },
        { id: '2', name: 'Kaybetme Riski', count: 0, color: 'text-red-400', icon: AlertTriangle, description: 'Son 30 gündür alışveriş yapmayanlar' },
        { id: '3', name: 'Yeni Üyeler', count: 0, color: 'text-emerald-400', icon: Zap, description: 'Son 7 gün içinde eklenenler' },
        { id: '4', name: 'Potansiyel Sadıklar', count: 0, color: 'text-blue-400', icon: Target, description: 'Sık ziyaret eden ama harcaması düşük olanlar' },
    ]);

    const loadData = async () => {
        if (!currentTenant) return;
        setLoading(true);
        try {
            // 1. Fetch Summary Stats
            const { data: customers, error: cError } = await supabase
                .from('cari_hesaplar')
                .select('id, loyalty_points_total, created_at')
                .eq('tenant_id', currentTenant.id);

            if (cError) throw cError;

            // 2. Fetch AI Segmentation (RFM Analysis)
            const { data: rfmData, error: rfmError } = await supabase
                .rpc('get_customer_rfm_analysis', { target_tenant_id: currentTenant.id });

            if (rfmError) {
                console.warn('RFM RPC Error (falling back):', rfmError);
            }

            const total = customers?.length || 0;
            const withPoints = customers?.filter(c => (c.loyalty_points_total || 0) > 0).length || 0;
            const totalPoints = customers?.reduce((sum, c) => sum + (c.loyalty_points_total || 0), 0) || 0;

            setStats({
                totalCustomers: total,
                activeLoyaltyUsers: withPoints,
                totalPointsIssued: totalPoints,
                activeCampaigns: 3
            });

            // 3. Update Segments from RFM Data
            if (rfmData) {
                const segmentCounts = rfmData.reduce((acc: any, curr: any) => {
                    acc[curr.segment] = (acc[curr.segment] || 0) + 1;
                    return acc;
                }, {});

                setSegments([
                    { id: 'vip', name: 'VIP Müşteriler', count: segmentCounts['VIP'] || 0, color: 'text-amber-400', icon: Star, description: 'Yüksek frekans ve yüksek harcama.' },
                    { id: 'risk', name: 'Kaybetme Riski', count: segmentCounts['Riskli (Kaybedilmek Üzere)'] || 0, color: 'text-red-400', icon: AlertTriangle, description: 'Son 90 gündür gelmeyenler.' },
                    { id: 'new', name: 'Yeni Müşteriler', count: segmentCounts['Yeni Müşteri'] || 0, color: 'text-emerald-400', icon: Zap, description: 'Yeni katılan ve aktif olanlar.' },
                    { id: 'loyal', name: 'Sadık Müşteriler', count: segmentCounts['Sadık Müşteri'] || 0, color: 'text-blue-400', icon: Target, description: 'Sık ziyaret eden güvenilir kitle.' },
                ]);
            }

        } catch (err: any) {
            console.error('CRM verileri yüklenemedi:', err);
            if (showToast) showToast("Veriler yüklenirken bir hata oluştu", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentTenant]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard 
                    title="Toplam Müşteri" 
                    value={stats.totalCustomers} 
                    icon={Users} 
                    color="blue" 
                    trend="+12%" 
                />
                <StatCard 
                    title="Sadakat Programı" 
                    value={stats.activeLoyaltyUsers} 
                    icon={Star} 
                    color="amber" 
                    trend="+5%" 
                />
                <StatCard 
                    title="Dağıtılan Puanlar" 
                    value={stats.totalPointsIssued.toLocaleString()} 
                    icon={Gift} 
                    color="pink" 
                />
                <StatCard 
                    title="Aktif Kampanya" 
                    value={stats.activeCampaigns} 
                    icon={Target} 
                    color="emerald" 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* AI Segments Section */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-amber-400" />
                            AI Segment Analizi
                        </h2>
                        <button onClick={loadData} className="text-secondary hover:text-white transition-colors">
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {segments.map((segment) => (
                            <motion.div 
                                key={segment.id}
                                whileHover={{ scale: 1.02 }}
                                className="glass-card p-4 hover:border-pink-500/50 cursor-pointer transition-all duration-300"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg bg-white/5 ${segment.color}`}>
                                            <segment.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium">{segment.name}</h3>
                                            <p className="text-xs text-secondary">{segment.description}</p>
                                        </div>
                                    </div>
                                    <span className="text-2xl font-bold text-white">{segment.count}</span>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <button className="flex-1 py-1.5 bg-pink-600/20 hover:bg-pink-600/40 text-pink-400 text-xs rounded-md border border-pink-500/30 transition-all">
                                        Kampanya Hazırla
                                    </button>
                                    <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs rounded-md border border-white/10">
                                        Listele
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* AI Recommendations / Feed */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Zap className="w-5 h-5 text-pink-500" />
                        AI Önerileri
                    </h2>
                    
                    <div className="space-y-3">
                        <RecommendationItem 
                            icon={Mail} 
                            title="VIP Geri Dönüş" 
                            desc="En çok harcama yapan 5 VIP müşterin 15 gündür gelmiyor." 
                            action="SMS Gönder"
                        />
                        <RecommendationItem 
                            icon={TrendingUp} 
                            title="Çapraz Satış Fırsatı" 
                            desc="Et alan müşterilerin %40'ı sos almıyor. Soslarda kampanya yap!" 
                            action="Kampanya Kur"
                        />
                        <RecommendationItem 
                            icon={Clock} 
                            title="Puan Hatırlatma" 
                            desc="120 müşterinin puanları önümüzdeki hafta siliniyor." 
                            action="Bildirim At"
                        />
                    </div>
                </div>
            </div>

            {/* Recent Marketing Actions */}
            <div className="glass-card p-5">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                    Son Pazarlama Faaliyetleri
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-secondary border-b border-white/10">
                            <tr>
                                <th className="text-left pb-3">Kampanya</th>
                                <th className="text-left pb-3">Kanal</th>
                                <th className="text-left pb-3">Erişim</th>
                                <th className="text-left pb-3">Dönüşüm</th>
                                <th className="text-right pb-3">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="text-white">
                            <tr className="border-b border-white/5">
                                <td className="py-3">Haftasonu İndirimi</td>
                                <td className="py-3">SMS</td>
                                <td className="py-3 font-mono text-blue-400">1,240</td>
                                <td className="py-3 font-mono text-emerald-400">%8.2</td>
                                <td className="py-3 text-right">
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px]">Tamamlandı</span>
                                </td>
                            </tr>
                            <tr>
                                <td className="py-3">Sadık Müşteri Puanı</td>
                                <td className="py-3">Uygulama İçi</td>
                                <td className="py-3 font-mono text-blue-400">450</td>
                                <td className="py-3 font-mono text-emerald-400">%12.4</td>
                                <td className="py-3 text-right">
                                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px]">Devam Ediyor</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, trend }: any) {
    const colors: any = {
        blue: "text-blue-400 bg-blue-500/10 border-blue-500/30",
        amber: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        pink: "text-pink-400 bg-pink-500/10 border-pink-500/30",
        emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    };

    return (
        <div className={`glass-card p-4 border ${colors[color]}`}>
            <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5" />
                {trend && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded font-mono">{trend}</span>}
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-secondary/80 font-medium">{title}</div>
        </div>
    );
}

function RecommendationItem({ icon: Icon, title, desc, action }: any) {
    return (
        <div className="glass-card p-3 bg-white/[0.02] border-white/5 hover:bg-white/[0.05] group transition-all">
            <div className="flex gap-3">
                <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 flex-shrink-0">
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{title}</h4>
                    <p className="text-xs text-secondary line-clamp-2 mt-0.5">{desc}</p>
                    <button className="mt-2 flex items-center gap-1 text-[11px] text-pink-400 font-bold group-hover:gap-2 transition-all">
                        {action} <ArrowRight className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
}
