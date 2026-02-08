"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { TrendingUp, Package, AlertTriangle, DollarSign, Plus, ClipboardList, FileText, LogOut, SlidersHorizontal } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

interface DashboardStats {
    activeProducts: number;
    inactiveProducts: number;
    allProducts: number;
    activeValue: number;
    inactiveValue: number;
    allValue: number;
    activeLowStock: number;
    inactiveLowStock: number;
    allLowStock: number;
    salesToday: number;
    salesWeek: number;
    salesMonth: number;
}

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
};

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats>({
        activeProducts: 0, inactiveProducts: 0, allProducts: 0,
        activeValue: 0, inactiveValue: 0, allValue: 0,
        activeLowStock: 0, inactiveLowStock: 0, allLowStock: 0,
        salesToday: 0, salesWeek: 0, salesMonth: 0,
    });
    const [loading, setLoading] = useState(true);
    const [companyName, setCompanyName] = useState('');

    // States
    const [productFilter, setProductFilter] = useState<'active' | 'inactive' | 'all'>('active');
    const [stockFilter, setStockFilter] = useState<'active' | 'inactive' | 'all'>('active');
    const [valueFilter, setValueFilter] = useState<'active' | 'inactive' | 'all'>('active');
    const [salesPeriod, setSalesPeriod] = useState<'today' | 'week' | 'month'>('today');

    // Mobile-friendly menu state
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    const handleLogout = () => {
        if (confirm('Oturumu kapatmak istediğinize emin misiniz?')) {
            localStorage.clear();
            window.location.href = '/';
        }
    };

    useEffect(() => {
        const name = localStorage.getItem('companyName') || 'İşletmem';
        setCompanyName(name);
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            const tenantId = localStorage.getItem('tenantId');
            if (!tenantId || tenantId === 'undefined') return;

            // Step 0: Ensure session context
            await supabase.rpc('set_current_tenant', { tenant_id: tenantId });

            // 1. Fetch General Product Counts
            const { count: allCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenantId);

            const { count: activeCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenantId)
                .or('status.eq.active,status.is.null');

            const { count: inactiveCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenantId)
                .eq('status', 'inactive');

            // 2. Fetch Low Stock Counts Directly (Bypasses 1000 limit)
            const { count: allLowStockCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenantId)
                .lte('stock_quantity', 10);

            const { count: activeLowStockCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenantId)
                .or('status.eq.active,status.is.null')
                .lte('stock_quantity', 10);

            const { count: inactiveLowStockCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenantId)
                .eq('status', 'inactive')
                .lte('stock_quantity', 10);

            // 3. Fetch Data for Value (Requires actual data fetching)
            const { data: productsData } = await supabase
                .from('products')
                .select('stock_quantity, sale_price, status')
                .eq('tenant_id', tenantId)
                .limit(10000);

            const products = productsData || [];
            const activeOnes = products.filter(p => (p.status || 'active') === 'active');
            const inactiveOnes = products.filter(p => p.status === 'inactive');

            const calculateSum = (list: any[]) => list.reduce((sum, p) => sum + ((Number(p.stock_quantity) || 0) * (Number(p.sale_price) || 0)), 0);

            // 4. Sales Data (Filtered by tenant)
            const startOfToday = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
            const startOfWeek = new Date(new Date().setDate(new Date().getDate() - 7)).toISOString();
            const startOfMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString();

            const { data: invoices } = await supabase
                .from('invoices')
                .select('grand_total, created_at, invoice_type')
                .eq('tenant_id', tenantId)
                .in('invoice_type', ['sales', 'retail']);

            const sales = invoices || [];
            const salesToday = sales.filter(inv => inv.created_at >= startOfToday).reduce((s, i) => s + (Number(i.grand_total) || 0), 0);
            const salesWeek = sales.filter(inv => inv.created_at >= startOfWeek).reduce((s, i) => s + (Number(i.grand_total) || 0), 0);
            const salesMonth = sales.filter(inv => inv.created_at >= startOfMonth).reduce((s, i) => s + (Number(i.grand_total) || 0), 0);

            setStats({
                activeProducts: activeCount || 0,
                inactiveProducts: inactiveCount || 0,
                allProducts: allCount || 0,
                activeValue: calculateSum(activeOnes),
                inactiveValue: calculateSum(inactiveOnes),
                allValue: calculateSum(products),
                activeLowStock: activeLowStockCount || 0,
                inactiveLowStock: inactiveLowStockCount || 0,
                allLowStock: allLowStockCount || 0,
                salesToday,
                salesWeek,
                salesMonth
            });
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            id: 'products',
            title: productFilter === 'all' ? 'TÜM ÜRÜNLER' : productFilter === 'active' ? 'AKTİF ÜRÜNLER' : 'PASİF ÜRÜNLER',
            value: productFilter === 'all' ? stats.allProducts : productFilter === 'active' ? stats.activeProducts : stats.inactiveProducts,
            unit: 'Kalem', icon: Package, accent: 'blue',
            filter: productFilter, setFilter: setProductFilter,
            options: [{ v: 'active', l: 'Aktif' }, { v: 'inactive', l: 'Pasif' }, { v: 'all', l: 'Tümü' }]
        },
        {
            id: 'stock',
            title: stockFilter === 'all' ? 'KRİTİK STOK (Tümü)' : stockFilter === 'active' ? 'KRİTİK STOK (Aktif)' : 'KRİTİK STOK (Pasif)',
            value: stockFilter === 'all' ? stats.allLowStock : stockFilter === 'active' ? stats.activeLowStock : stats.inactiveLowStock,
            unit: 'Kritik', icon: AlertTriangle, accent: 'rose',
            filter: stockFilter, setFilter: setStockFilter,
            options: [{ v: 'active', l: 'Aktif' }, { v: 'inactive', l: 'Pasif' }, { v: 'all', l: 'Tümü' }]
        },
        {
            id: 'value',
            title: valueFilter === 'all' ? 'STOK DEĞERİ (Tümü)' : valueFilter === 'active' ? 'STOK DEĞERİ (Aktif)' : 'STOK DEĞERİ (Pasif)',
            value: (valueFilter === 'all' ? stats.allValue : valueFilter === 'active' ? stats.activeValue : stats.inactiveValue).toLocaleString('tr-TR', { maximumFractionDigits: 0 }),
            prefix: '₺', icon: DollarSign, accent: 'emerald',
            filter: valueFilter, setFilter: setValueFilter,
            options: [{ v: 'active', l: 'Aktif' }, { v: 'inactive', l: 'Pasif' }, { v: 'all', l: 'Tümü' }]
        },
        {
            id: 'sales',
            title: salesPeriod === 'today' ? 'BUGÜN SATIŞ' : salesPeriod === 'week' ? 'BU HAFTA SATIŞ' : 'BU AY SATIŞ',
            value: (salesPeriod === 'today' ? stats.salesToday : salesPeriod === 'week' ? stats.salesWeek : stats.salesMonth).toLocaleString('tr-TR'),
            prefix: '₺', icon: TrendingUp, accent: 'amber',
            filter: salesPeriod, setFilter: setSalesPeriod,
            options: [{ v: 'today', l: 'Bugün' }, { v: 'week', l: 'Hafta' }, { v: 'month', l: 'Ay' }]
        },
    ];

    return (
        <div className="relative min-h-screen bg-background pb-32 overflow-x-hidden" onClick={() => setActiveMenu(null)}>
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[40%] bg-accent/10 rounded-full blur-[120px]" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 glass border-b border-white/5 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl glass-dark border border-white/10 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-secondary tracking-[4px] uppercase">Sistem Durumu</p>
                        <h1 className="text-xl font-black text-white tracking-tight leading-none">{companyName}</h1>
                    </div>
                </div>
                <button onClick={handleLogout} className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 active:scale-95 transition-all">
                    <LogOut size={20} />
                </button>
            </header>

            <div className="p-6 space-y-8 relative z-10">
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 gap-4">
                    {statCards.map((card) => (
                        <motion.div key={card.id} variants={itemVariants} className="glass-dark border border-white/10 rounded-[2rem] p-5 relative">
                            <div className="absolute top-4 right-4 z-40">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === card.id ? null : card.id); }}
                                    className={`w-9 h-9 rounded-xl border transition-all flex items-center justify-center active:scale-90 shadow-lg ${activeMenu === card.id ? 'bg-blue-500 border-blue-400 text-white' : 'glass border-white/10 text-secondary'}`}
                                >
                                    <SlidersHorizontal size={14} />
                                </button>

                                <AnimatePresence>
                                    {activeMenu === card.id && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                            className="absolute right-0 top-full mt-2 w-36 glass-dark border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl p-1.5 space-y-1"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {card.options.map((opt) => (
                                                <button
                                                    key={opt.v}
                                                    onClick={() => { card.setFilter(opt.v as any); setActiveMenu(null); }}
                                                    className={`w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${card.filter === opt.v ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 hover:bg-white/5'}`}
                                                >
                                                    {opt.l}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="space-y-4">
                                <div className={`w-11 h-11 rounded-2xl bg-${card.accent}-500/10 border border-${card.accent}-500/20 flex items-center justify-center shadow-inner`}>
                                    <card.icon className={`w-5 h-5 text-${card.accent}-400`} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-secondary uppercase tracking-widest opacity-70">{card.title}</p>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        {card.prefix && <span className="text-xs font-bold text-white/40">{card.prefix}</span>}
                                        <span className="text-2xl font-black text-white leading-none tracking-tight">
                                            {loading ? '...' : card.value}
                                        </span>
                                        {card.unit && <span className="text-[9px] font-bold text-secondary ml-1">{card.unit}</span>}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                <div className="space-y-6">
                    <div className="flex items-center gap-4 px-2">
                        <span className="text-[10px] font-black text-secondary uppercase tracking-[4px]">Hızlı Erişim</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                    </div>
                    <div className="space-y-4">
                        {[
                            { label: 'Ürünleri Yönet', icon: Plus, path: '/products', desc: 'Stok ve fiyatları güncelle' },
                            { label: 'Barkod Okut / Sayım', icon: ClipboardList, path: '/scanner', desc: 'Otomatik barkod tarama' },
                            { label: 'Kritik Stok Takibi', icon: FileText, path: '/low-stock', desc: 'Biten ürünleri kontrol et' }
                        ].map((action, idx) => (
                            <button key={idx} onClick={() => router.push(action.path)} className="w-full glass-dark border border-white/10 rounded-3xl p-5 flex items-center gap-5 group active:scale-[0.98] transition-all shadow-xl text-left">
                                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                    <action.icon className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-white tracking-tight">{action.label}</h3>
                                    <p className="text-xs text-secondary font-medium">{action.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <BottomNav />
        </div>
    );
}
