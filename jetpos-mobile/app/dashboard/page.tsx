"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { TrendingUp, Package, AlertTriangle, DollarSign, Plus, ClipboardList, FileText, LogOut, SlidersHorizontal, ClipboardCheck, Store, ChevronDown, Send } from 'lucide-react';
import { toast } from 'sonner';
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
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [activeWarehouseId, setActiveWarehouseId] = useState<string>('');

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
                localStorage.setItem('activeWarehouseName', defaultWh.name);
            }
        }
    };

    const handleWarehouseChange = (id: string) => {
        const wh = warehouses.find(w => w.id === id);
        if (wh) {
            setActiveWarehouseId(id);
            localStorage.setItem('activeWarehouseId', id);
            localStorage.setItem('activeWarehouseName', wh.name);
            toast.success(`${wh.name} mağazasına geçiş yapıldı`);
            fetchDashboardData();
        }
    };

    const fetchDashboardData = async () => {
        try {
            const tenantId = localStorage.getItem('tenantId');
            if (!tenantId || tenantId === 'undefined') return;

            await supabase.rpc('set_current_tenant', { tenant_id: tenantId });

            // Parallel batch 1: All count queries at once
            const [allCountRes, activeCountRes, inactiveCountRes, allLowStockRes, activeLowStockRes, inactiveLowStockRes] = await Promise.all([
                supabase.from('products').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
                supabase.from('products').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).or('status.eq.active,status.is.null'),
                supabase.from('products').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'inactive'),
                supabase.from('products').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).lte('stock_quantity', 10),
                supabase.from('products').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).or('status.eq.active,status.is.null').lte('stock_quantity', 10),
                supabase.from('products').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'inactive').lte('stock_quantity', 10),
            ]);

            // Parallel batch 2: Data queries
            const [productsRes, invoicesRes] = await Promise.all([
                supabase.from('products').select('stock_quantity, sale_price, status').eq('tenant_id', tenantId).limit(10000),
                supabase.from('invoices').select('grand_total, created_at, invoice_type').eq('tenant_id', tenantId).in('invoice_type', ['sales', 'retail']),
            ]);

            const products = productsRes.data || [];
            const activeOnes = products.filter(p => (p.status || 'active') === 'active');
            const inactiveOnes = products.filter(p => p.status === 'inactive');

            const calculateSum = (list: any[]) => list.reduce((sum, p) => sum + ((Number(p.stock_quantity) || 0) * (Number(p.sale_price) || 0)), 0);

            const startOfToday = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
            const startOfWeek = new Date(new Date().setDate(new Date().getDate() - 7)).toISOString();
            const startOfMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString();

            const sales = invoicesRes.data || [];
            const salesToday = sales.filter(inv => inv.created_at >= startOfToday).reduce((s, i) => s + (Number(i.grand_total) || 0), 0);
            const salesWeek = sales.filter(inv => inv.created_at >= startOfWeek).reduce((s, i) => s + (Number(i.grand_total) || 0), 0);
            const salesMonth = sales.filter(inv => inv.created_at >= startOfMonth).reduce((s, i) => s + (Number(i.grand_total) || 0), 0);

            setStats({
                activeProducts: activeCountRes.count || 0,
                inactiveProducts: inactiveCountRes.count || 0,
                allProducts: allCountRes.count || 0,
                activeValue: calculateSum(activeOnes),
                inactiveValue: calculateSum(inactiveOnes),
                allValue: calculateSum(products),
                activeLowStock: activeLowStockRes.count || 0,
                inactiveLowStock: inactiveLowStockRes.count || 0,
                allLowStock: allLowStockRes.count || 0,
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
            <header className="sticky top-0 z-50 glass border-b border-white/5 p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl glass-dark border border-white/10 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-secondary tracking-[3px] uppercase">JETPOS MOBILE</p>
                            <h1 className="text-lg font-black text-white tracking-tight leading-none">{companyName}</h1>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 active:scale-95 transition-all">
                        <LogOut size={18} />
                    </button>
                </div>

                {/* Warehouse Selector */}
                {warehouses.length > 0 && (
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                            <Store className="w-4 h-4 text-emerald-400" />
                        </div>
                        <select 
                            value={activeWarehouseId}
                            onChange={(e) => handleWarehouseChange(e.target.value)}
                            className="w-full h-12 glass-dark border border-white/10 rounded-2xl pl-11 pr-10 text-xs font-black text-white appearance-none outline-none focus:border-blue-500/50 transition-all uppercase tracking-widest"
                        >
                            {warehouses.map(wh => (
                                <option key={wh.id} value={wh.id} className="bg-slate-900">{wh.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <ChevronDown className="w-4 h-4 text-secondary" />
                        </div>
                    </div>
                )}
            </header>

            <div className="p-6 space-y-8 relative z-10">
                <div className="grid grid-cols-2 gap-4">
                    {statCards.map((card) => (
                        <div key={card.id} className="glass-dark border border-white/10 rounded-[2rem] p-5 relative">
                            <div className="absolute top-4 right-4 z-40">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === card.id ? null : card.id); }}
                                    className={`w-9 h-9 rounded-xl border transition-all flex items-center justify-center active:scale-90 shadow-lg ${activeMenu === card.id ? 'bg-blue-500 border-blue-400 text-white' : 'glass border-white/10 text-secondary'}`}
                                >
                                    <SlidersHorizontal size={14} />
                                </button>

                                {activeMenu === card.id && (
                                    <div
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
                                    </div>
                                )}
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
                        </div>
                    ))}
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-4 px-2">
                        <span className="text-[10px] font-black text-secondary uppercase tracking-[4px]">Hızlı Erişim</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                    </div>
                    <div className="space-y-4">
                        {[
                            { label: 'Ürünleri Yönet', icon: Package, path: '/products', desc: 'Stok ve fiyatları güncelle' },
                            { label: 'Mağazalar Arası Transfer', icon: Send, path: '/warehouse-transfer', desc: 'Diğer mağazalara stok gönder' },
                            { label: 'Envanter Sayımı', icon: ClipboardCheck, path: '/inventory-count', desc: 'Barkod ile hızlı sayım yap' },
                            { label: 'Barkod Okut', icon: ClipboardList, path: '/scanner', desc: 'Ürün bul veya yeni ekle' }
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
