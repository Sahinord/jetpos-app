"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { TrendingUp, Package, AlertTriangle, DollarSign, Plus, ClipboardList, FileText } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

interface DashboardStats {
    totalProducts: number;
    lowStockCount: number;
    totalValue: number;
    todaySales: number;
}

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

        // Polling - Her 5 saniyede bir güncelle
        const interval = setInterval(() => {
            console.log('🔄 Dashboard güncelleniyor...');
            fetchDashboardData();
        }, 5000); // 5 saniye

        return () => {
            clearInterval(interval);
        };
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
                (sum, p) => sum + (p.stock_quantity * p.sale_price),
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
            title: 'Toplam Ürün',
            value: stats.totalProducts,
            icon: Package,
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-500/20',
        },
        {
            title: 'Eksik Stok',
            value: stats.lowStockCount,
            icon: AlertTriangle,
            color: 'from-red-500 to-red-600',
            bgColor: 'bg-red-500/20',
        },
        {
            title: 'Stok Değeri',
            value: `₺${stats.totalValue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`,
            icon: DollarSign,
            color: 'from-green-500 to-green-600',
            bgColor: 'bg-green-500/20',
        },
        {
            title: 'Bugün Satış',
            value: `₺${stats.todaySales.toLocaleString('tr-TR')}`,
            icon: TrendingUp,
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-500/20',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-24">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 pb-8">
                <p className="text-blue-200 text-sm font-bold mb-1">Hoş Geldiniz</p>
                <h1 className="text-2xl font-black text-white">{companyName}</h1>
            </div>

            {/* Stats Grid */}
            <div className="p-4 -mt-4">
                <div className="grid grid-cols-2 gap-4">
                    {statCards.map((card, index) => {
                        const Icon = card.icon;
                        return (
                            <div
                                key={index}
                                className={`bg-gradient-to-br ${card.color} rounded-3xl p-4 shadow-2xl`}
                            >
                                <div className={`inline-block p-3 ${card.bgColor} rounded-2xl mb-3`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <p className="text-white/80 text-xs font-bold mb-1">{card.title}</p>
                                <p className="text-2xl font-black text-white">
                                    {loading ? '...' : card.value}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Quick Actions */}
                <div className="mt-6">
                    <h2 className="text-white font-bold mb-3 px-2">Hızlı İşlemler</h2>
                    <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-4 border border-white/10 space-y-3">
                        <button
                            onClick={() => router.push('/products')}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            Ürünleri Görüntüle
                        </button>
                        <button
                            onClick={() => router.push('/scanner')}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                        >
                            <ClipboardList className="w-5 h-5" />
                            Barkod ile Sayım
                        </button>
                        <button
                            onClick={() => router.push('/low-stock')}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                        >
                            <FileText className="w-5 h-5" />
                            Eksik Ürünler
                        </button>
                    </div>
                </div>
            </div>

            <BottomNav />
        </div>
    );
}

