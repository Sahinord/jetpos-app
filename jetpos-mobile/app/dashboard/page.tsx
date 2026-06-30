"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
    TrendingUp, Package, AlertTriangle, DollarSign, LogOut, 
    SlidersHorizontal, Store, ChevronDown, Send, Users, 
    CreditCard, Calculator, Zap, ArrowUpRight, Activity,
    Globe, RefreshCcw, Bell, ClipboardCheck
} from 'lucide-react';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';
import { motion } from 'framer-motion';
import { clearOfflineTenantData } from '@/lib/offline-db';
import { SyncService } from '@/lib/sync-service';

interface DashboardStats {
    activeProducts: number;
    inactiveProducts: number;
    allProducts: number;
    activeValue: number;
    inactiveValue: number;
    allValue: number;
    totalStockCount: number;
    activeLowStock: number;
    inactiveLowStock: number;
    allLowStock: number;
    salesToday: number;
    salesYesterday: number;
    salesWeek: number;
    salesMonth: number;
}

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats>({
        activeProducts: 0, inactiveProducts: 0, allProducts: 0,
        activeValue: 0, inactiveValue: 0, allValue: 0,
        totalStockCount: 0,
        activeLowStock: 0, inactiveLowStock: 0, allLowStock: 0,
        salesToday: 0, salesYesterday: 0, salesWeek: 0, salesMonth: 0,
    });
    const [loading, setLoading] = useState(true);
    const [companyName, setCompanyName] = useState('');
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [activeWarehouseId, setActiveWarehouseId] = useState<string>('');

    useEffect(() => {
        const name = localStorage.getItem('companyName') || 'İşletmem';
        const savedWarehouseId = localStorage.getItem('activeWarehouseId');
        if (savedWarehouseId) setActiveWarehouseId(savedWarehouseId);

        setCompanyName(name);
        fetchWarehouses().then(fetchDashboardData);

        const interval = setInterval(fetchDashboardData, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchWarehouses = async () => {
        const tenantId = localStorage.getItem('tenantId');
        if (!tenantId) return;

        const { data } = await supabase
            .from('warehouses')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('is_active', true);
        
        if (data && data.length > 0) {
            setWarehouses(data);
            if (!localStorage.getItem('activeWarehouseId')) {
                const defaultWh = data.find(w => w.is_default) || data[0];
                setActiveWarehouseId(defaultWh.id);
                localStorage.setItem('activeWarehouseId', defaultWh.id);
            }
        }
    };

    const fetchDashboardData = async () => {
        try {
            const tenantId = localStorage.getItem('tenantId');
            if (!tenantId || tenantId === 'undefined') return;

            await supabase.rpc('set_current_tenant', { tenant_id: tenantId });

            const [activeCountRes, inactiveCountRes, allLowStockRes] = await Promise.all([
                supabase.from('products').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).or('status.eq.active,status.is.null'),
                supabase.from('products').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'inactive'),
                supabase.from('products').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).lte('stock_quantity', 10),
            ]);

            // Envanter değeri için tüm ürünleri çek (Maliyet üzerinden hesapla)
            const { data: productsData } = await supabase
                .from('products')
                .select('stock_quantity, purchase_price, status')
                .eq('tenant_id', tenantId);

            const products = productsData || [];
            const activeOnes = products.filter(p => (p.status || 'active') === 'active');
            
            // Envanter değeri = Stok Adedi * Alış Fiyatı (PC ile aynı mantık)
            const calculateValue = (list: any[]) => list.reduce((sum, p) => sum + ((Number(p.stock_quantity) || 0) * (Number(p.purchase_price) || 0)), 0);
            const totalStockCount = products.reduce((sum, p) => sum + (Number(p.stock_quantity) || 0), 0);

            // Satışları çek
            const startOfToday = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
            const startOfYesterday = new Date(new Date(new Date().setDate(new Date().getDate() - 1)).setHours(0, 0, 0, 0)).toISOString();
            const endOfYesterday = new Date(new Date(new Date().setDate(new Date().getDate() - 1)).setHours(23, 59, 59, 999)).toISOString();
            const startOfWeek = new Date(new Date().setDate(new Date().getDate() - 7)).toISOString();
            const startOfMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString();

            const { data: invoicesData } = await supabase
                .from('invoices')
                .select('grand_total, created_at')
                .eq('tenant_id', tenantId)
                .in('invoice_type', ['sales', 'retail']);

            const sales = invoicesData || [];
            const salesToday = sales.filter(inv => inv.created_at >= startOfToday).reduce((s, i) => s + (Number(i.grand_total) || 0), 0);
            const salesYesterday = sales.filter(inv => inv.created_at >= startOfYesterday && inv.created_at <= endOfYesterday).reduce((s, i) => s + (Number(i.grand_total) || 0), 0);
            const salesWeek = sales.filter(inv => inv.created_at >= startOfWeek).reduce((s, i) => s + (Number(i.grand_total) || 0), 0);
            const salesMonth = sales.filter(inv => inv.created_at >= startOfMonth).reduce((s, i) => s + (Number(i.grand_total) || 0), 0);

            setStats({
                activeProducts: activeCountRes.count || 0,
                inactiveProducts: inactiveCountRes.count || 0,
                allProducts: (activeCountRes.count || 0) + (inactiveCountRes.count || 0),
                activeValue: calculateValue(activeOnes),
                inactiveValue: calculateValue(products.filter(p => p.status === 'inactive')),
                allValue: calculateValue(products),
                totalStockCount: totalStockCount,
                activeLowStock: allLowStockRes.count || 0,
                inactiveLowStock: 0,
                allLowStock: allLowStockRes.count || 0,
                salesToday,
                salesYesterday,
                salesWeek,
                salesMonth
            });
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const performancePercent = useMemo(() => {
        if (stats.salesYesterday === 0) return stats.salesToday > 0 ? 100 : 0;
        return Math.min(Math.round((stats.salesToday / stats.salesYesterday) * 100), 200);
    }, [stats.salesToday, stats.salesYesterday]);

    return (
        <div className="relative min-h-screen bg-background pb-32 overflow-x-hidden container-safe">
            {/* Background Glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-[#2563FF]/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[40%] bg-[#1E90FF]/10 rounded-full blur-[120px]" />
            </div>

            {/* Innovative Header */}
            <header className="sticky top-0 z-50 glass border-b border-[#2D6BFF]/10 p-4 pt-[env(safe-area-inset-top,1.5rem)] pb-6 space-y-6">
                <div className="flex items-center justify-between gap-2 sm:gap-4">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-10 h-10 shrink-0 rounded-2xl glass-dark border border-[#2D6BFF]/20 flex items-center justify-center shadow-xl relative">
                            <Zap className="w-5 h-5 text-[#6FD3FF] fill-[#6FD3FF]/20" />
                            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#050B1A] animate-pulse" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className={`font-black text-white tracking-tight leading-none uppercase truncate ${companyName.length > 15 ? 'text-sm' : 'text-base sm:text-lg'}`}>
                                {companyName}
                            </h1>
                            <p className="text-[7px] sm:text-[8px] font-black text-[#5B8CFF] tracking-[2px] sm:tracking-[3px] uppercase mt-1.5 opacity-80">JETPOS MOBILE</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <button className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl glass-dark border border-white/5 flex items-center justify-center text-slate-400 active:scale-90 transition-all">
                            <Bell size={16} />
                        </button>
                        <button 
                            onClick={async () => {
                                if (!confirm('Çıkış yapılsın mı?')) return;
                                await SyncService.pushPendingSales().catch(() => {});
                                const { lostPendingSales } = await clearOfflineTenantData();
                                if (lostPendingSales > 0) {
                                    toast.error(`${lostPendingSales} senkronize edilmemiş satış cihazdan silindi (çevrimdışıydı).`);
                                }
                                localStorage.clear();
                                window.location.href = '/';
                            }}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 active:scale-95 transition-all"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>

                {/* Intelligent Performance Banner */}
                <div className="relative group overflow-hidden rounded-[1.75rem] sm:rounded-[2.25rem] p-5 sm:p-6 glass-dark border border-[#2D6BFF]/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-[#2563FF]/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                    
                    <div className="relative z-10 flex items-center justify-between gap-3">
                        <div className="space-y-1 min-w-0 flex-1">
                            <p className="text-[8px] sm:text-[9px] font-black text-[#5B8CFF] uppercase tracking-[3px] sm:tracking-[4px]">BUGÜNKÜ AKIŞ</p>
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                                <span className="text-2xl sm:text-3xl font-black text-white tracking-tighter truncate">
                                    ₺{stats.salesToday.toLocaleString('tr-TR')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[7px] sm:text-[8px] font-black ${performancePercent >= 100 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                                    {performancePercent >= 100 ? 'VERİMLİ' : 'DÜŞÜK'}
                                </div>
                                <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">
                                    DÜNE GÖRE %{performancePercent}
                                </span>
                            </div>
                        </div>

                        {/* Animated Progress Circle */}
                        <div className="relative w-14 h-14 sm:w-20 sm:h-20 flex items-center justify-center shrink-0">
                            <svg className="w-full h-full -rotate-90">
                                <circle cx="50%" cy="50%" r="40%" fill="transparent" stroke="rgba(45, 107, 255, 0.1)" strokeWidth="5" />
                                <circle cx="50%" cy="50%" r="40%" fill="transparent" stroke="#2563FF" strokeWidth="5" strokeDasharray="100" strokeDashoffset={100 - Math.min(performancePercent, 100)} strokeLinecap="round" className="transition-all duration-1000" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-[9px] sm:text-[xs] font-black text-white">%{performancePercent}</span>
                            </div>
                            <div className="absolute inset-0 bg-[#2563FF]/20 blur-xl rounded-full -z-10" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Grid */}
            <div className="p-4 sm:p-6 space-y-6 relative z-10">
                
                {/* Real-time Status Panel */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="glass-dark border border-white/5 rounded-2xl p-3 flex items-center justify-between min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 shrink-0 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                <Globe size={12} className="text-orange-400" />
                            </div>
                            <span className="text-[8px] sm:text-[9px] font-black text-white/60 tracking-[2px] uppercase truncate">TRENDYOL</span>
                        </div>
                        <div className="w-1.5 h-1.5 shrink-0 rounded-full bg-emerald-400 animate-pulse ml-1" />
                    </div>
                    <div className="glass-dark border border-white/5 rounded-2xl p-3 flex items-center justify-between min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 shrink-0 rounded-lg bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                                <RefreshCcw size={12} className="text-pink-400" />
                            </div>
                            <span className="text-[8px] sm:text-[9px] font-black text-white/60 tracking-[2px] uppercase truncate">SYNC</span>
                        </div>
                        <div className="w-1.5 h-1.5 shrink-0 rounded-full bg-blue-400 ml-1" />
                    </div>
                </div>

                {/* Innovative Stats Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-1">
                        <span className="text-[9px] font-black text-[#5B8CFF] uppercase tracking-[3px] shrink-0">SİSTEM ANALİZİ</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-[#2D6BFF]/20 to-transparent" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        {/* Total Stock Count Card */}
                        <div className="glass-dark border border-white/10 rounded-[1.75rem] sm:rounded-[2rem] p-4 relative group overflow-hidden min-w-0">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl" />
                            <div className="space-y-2 relative z-10">
                                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                    <Package className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest truncate">TOPLAM STOK</p>
                                    <h4 className="text-xl font-black text-white tracking-tight mt-0.5 truncate">
                                        {stats.totalStockCount.toLocaleString('tr-TR')}
                                    </h4>
                                </div>
                            </div>
                        </div>

                        {/* Critical Stock Card */}
                        <div className="glass-dark border border-white/10 rounded-[1.75rem] sm:rounded-[2rem] p-4 relative group overflow-hidden min-w-0">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-full blur-2xl" />
                            <div className="space-y-2 relative z-10">
                                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest truncate">KRİTİK STOK</p>
                                    <h4 className="text-xl font-black text-white tracking-tight mt-0.5 truncate">{stats.activeLowStock}</h4>
                                </div>
                            </div>
                        </div>

                        {/* Total Value Card (Full Width) - FIXED TO MATCH PC */}
                        <div className="col-span-2 glass-dark border border-[#2D6BFF]/20 rounded-[1.75rem] sm:rounded-[2rem] p-4 sm:p-5 relative overflow-hidden flex items-center justify-between gap-4 shadow-[0_10px_30px_rgba(37,99,255,0.1)]">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#2563FF]/5 to-transparent pointer-events-none" />
                            <div className="space-y-1 relative z-10 min-w-0 flex-1">
                                <p className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-[2px] sm:tracking-widest truncate">TOPLAM ENVANTER DEĞERİ (MALİYET)</p>
                                <div className="flex items-baseline gap-1 min-w-0">
                                    <span className="text-[9px] font-bold text-slate-400 shrink-0">₺</span>
                                    <span className="text-xl sm:text-2xl font-black text-white tracking-tighter truncate">
                                        {stats.allValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                            <div className="w-12 h-12 shrink-0 rounded-2xl glass-dark border border-[#2D6BFF]/30 flex items-center justify-center relative z-10 shadow-xl">
                                <DollarSign className="w-6 h-6 text-[#6FD3FF]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Innovative Actions Grid */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-1">
                        <span className="text-[9px] font-black text-[#5B8CFF] uppercase tracking-[3px] shrink-0">HIZLI ERİŞİM</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-[#2D6BFF]/20 to-transparent" />
                    </div>
                    
                    <div className="grid grid-cols-4 gap-3 sm:gap-4">
                        {[
                            { label: 'SATIŞ', icon: Zap, path: '/pos', color: '#2563FF' },
                            { label: 'ÜRÜN', icon: Package, path: '/products', color: '#1E90FF' },
                            { label: 'ENTEGRE', icon: Globe, path: '/entegre', color: '#F27A1A' },
                            { label: 'CARİ', icon: Users, path: '/cari', color: '#6FD3FF' },
                            { label: 'KASA', icon: Calculator, path: '/kasa', color: '#5B8CFF' },
                            { label: 'BANKA', icon: CreditCard, path: '/banka', color: '#4DA3FF' },
                            { label: 'SAYIM', icon: ClipboardCheck, path: '/inventory-count', color: '#1E90FF' },
                            { label: 'TRANS', icon: Send, path: '/warehouse-transfer', color: '#2563FF' },
                        ].map((action, idx) => (
                            <button 
                                key={idx} 
                                onClick={() => router.push(action.path)}
                                className="flex flex-col items-center gap-1.5 group active:scale-[0.85] transition-all min-w-0"
                            >
                                <div className="w-full aspect-square rounded-2xl glass-dark border border-white/10 flex items-center justify-center relative shadow-xl group-hover:border-white/30 transition-all overflow-hidden max-w-[3.5rem] sm:max-w-none">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                                    <action.icon className="w-5 h-5 sm:w-7 sm:h-7 transition-transform group-hover:scale-110" style={{ color: action.color }} />
                                </div>
                                <span className="text-[6px] sm:text-[8px] font-black text-slate-500 uppercase tracking-widest truncate w-full text-center leading-none">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Innovation Footer: Marketplace Panel */}
                <div className="glass-dark border border-white/5 rounded-[1.75rem] p-5 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 min-w-0">
                            <RefreshCcw className="w-3 h-3 text-[#5B8CFF] animate-spin [animation-duration:15s] shrink-0" />
                            <span className="text-[8px] font-black text-white/60 tracking-widest uppercase truncate">Pazaryeri Senkronu</span>
                        </div>
                        <span className="text-[6px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0 uppercase">STABİL</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: "90%" }} 
                            transition={{ duration: 1.2 }}
                            className="h-full bg-gradient-to-r from-[#2563FF] to-[#6FD3FF]" 
                        />
                    </div>
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
