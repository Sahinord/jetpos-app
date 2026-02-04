"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { TrendingUp, Package, AlertTriangle, DollarSign, Plus, ClipboardList, FileText } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

interface DashboardStats {
    totalProducts: number;
    lowStockCount: number;
    totalValue: number;
    todaySales: number;
}

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
};

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats>({
        totalProducts: 0,
        lowStockCount: 0,
        totalValue: 0,
        todaySales: 0,
    });
    const [loading, setLoading] = useState(true);
    const [companyName, setCompanyName] = useState('');

    useEffect(() => {
        const name = localStorage.getItem('companyName') || 'İşletmem';
        setCompanyName(name);
        fetchDashboardData();

        const interval = setInterval(() => {
            fetchDashboardData();
        }, 10000); // 10 saniye - batarya dostu

        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            const tenantId = localStorage.getItem('tenantId');
            if (!tenantId) return;

            await supabase.rpc('set_current_tenant', { tenant_id: tenantId });

            const { count: productCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true });

            const { count: lowStockCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .lte('stock_quantity', 10);

            const { data: products } = await supabase
                .from('products')
                .select('stock_quantity, sale_price');

            const totalValue = products?.reduce(
                (sum: number, p: any) => sum + (p.stock_quantity * p.sale_price),
                0
            ) || 0;

            setStats({
                totalProducts: productCount || 0,
                lowStockCount: lowStockCount || 0,
                totalValue,
                todaySales: 0,
            });
        } catch (error) {
            console.error('Dashboard data fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: 'TOPLAM ÜRÜN',
            value: stats.totalProducts,
            unit: 'Kalem',
            icon: Package,
            accent: 'blue',
            glow: 'rgba(59, 130, 246, 0.5)',
        },
        {
            title: 'EKSİK STOK',
            value: stats.lowStockCount,
            unit: 'Kritik',
            icon: AlertTriangle,
            accent: 'rose',
            glow: 'rgba(244, 63, 94, 0.5)',
        },
        {
            title: 'STOK DEĞERİ',
            value: stats.totalValue.toLocaleString('tr-TR', { maximumFractionDigits: 0 }),
            prefix: '₺',
            icon: DollarSign,
            accent: 'emerald',
            glow: 'rgba(16, 185, 129, 0.5)',
        },
        {
            title: 'BUGÜN SATIŞ',
            value: stats.todaySales.toLocaleString('tr-TR'),
            prefix: '₺',
            icon: TrendingUp,
            accent: 'amber',
            glow: 'rgba(245, 158, 11, 0.5)',
        },
    ];


    return (
        <div className="relative min-h-screen bg-background overflow-x-hidden pb-32">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[40%] bg-accent/10 rounded-full blur-[120px]" />
            </div>

            {/* Premium Header */}
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="sticky top-0 z-50 glass border-b border-white/5 p-6 space-y-1"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-secondary uppercase tracking-[4px]">Sistem Durumu</p>
                        <h1 className="text-2xl font-black text-white tracking-tight">{companyName}</h1>
                    </div>
                    <div className="w-12 h-12 rounded-2xl glass-dark border border-white/10 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-blue-400" />
                    </div>
                </div>
            </motion.div>

            {/* Stats Section */}
            <div className="p-6 space-y-8 relative z-10">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-2 gap-4"
                >
                    {statCards.map((card, idx) => {
                        const Icon = card.icon;
                        return (
                            <motion.div
                                key={idx}
                                variants={itemVariants}
                                whileTap={{ scale: 0.95 }}
                                className="glass-dark border border-white/10 rounded-[2rem] p-5 relative overflow-hidden group"
                            >
                                <div className={`absolute top-0 right-0 w-16 h-16 bg-${card.accent}-500/5 rounded-full blur-2xl -mr-8 -mt-8`} />

                                <div className="space-y-4">
                                    <div className={`w-10 h-10 rounded-xl bg-${card.accent}-500/10 border border-${card.accent}-500/20 flex items-center justify-center`}>
                                        <Icon className={`w-5 h-5 text-${card.accent}-400`} />
                                    </div>

                                    <div>
                                        <p className="text-[9px] font-black text-secondary uppercase tracking-widest">{card.title}</p>
                                        <div className="flex items-baseline gap-1 mt-1">
                                            {card.prefix && <span className="text-xs font-bold text-white/50">{card.prefix}</span>}
                                            <span className="text-xl font-black text-white">
                                                {loading ? '...' : card.value}
                                            </span>
                                            {card.unit && <span className="text-[9px] font-bold text-secondary">{card.unit}</span>}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* Quick Actions (Next-Gen Edition) */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 px-2">
                        <span className="text-[10px] font-black text-secondary uppercase tracking-[4px]">Hızlı Erişim</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                    </div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="space-y-4"
                    >
                        {[
                            { label: 'Ürünleri Yönet', icon: Plus, path: '/products', desc: 'Stok ve fiyatları günveller' },
                            { label: 'Barkod Okut / Sayım', icon: ClipboardList, path: '/scanner', desc: 'Otomatik barkod tarama' },
                            { label: 'Kritik Stok Takibi', icon: FileText, path: '/low-stock', desc: 'Biten ürünleri kontrol et' }
                        ].map((action, idx) => (
                            <motion.button
                                key={idx}
                                variants={itemVariants}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => router.push(action.path)}
                                className="w-full glass-dark border border-white/10 rounded-3xl p-5 flex items-center gap-5 group transition-all hover:border-blue-500/30 shadow-xl"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                                    <action.icon className="w-6 h-6 text-blue-400" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-base font-black text-white tracking-tight">{action.label}</h3>
                                    <p className="text-xs text-secondary font-medium">{action.desc}</p>
                                </div>
                                <div className="ml-auto w-8 h-8 rounded-lg glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus className="w-4 h-4 text-white rotate-45" />
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
