"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    Zap, Store, Globe, RefreshCcw, ArrowLeft,
    ChevronRight, CheckCircle2, AlertCircle, ShieldCheck,
    Smartphone, ExternalLink, Activity, ShoppingCart,
    TrendingUp, Package, Clock, X, ChevronDown, User,
    MapPin, CreditCard, Calendar, Truck, Tag
} from 'lucide-react';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendyolClient, TrendyolOrder } from '@/lib/trendyol-client';
import { HepsiburadaClient, HepsiburadaPackage } from '@/lib/hepsiburada-client';
import HepsiburadaCatalogFlow from '@/components/Hepsiburada/CatalogSubmitFlow';
import { apiFetch } from '@/lib/api';

interface MarketplaceStore {
    id: string;
    name: string;
    type: 'trendyol' | 'trendyol_go' | 'hepsiburada' | 'getir' | 'yemeksepeti';
    status: 'connected' | 'error' | 'pending';
    details: any;
}

interface CargoModalState {
    packageNumber: string;
    companies: any[];
    loading: boolean;
    selecting: boolean;
}

type TimeRange = '24h' | '3d' | '7d' | '30d';

function storeColor(type: MarketplaceStore['type']) {
    if (type === 'trendyol') return '#F27A1A';
    if (type === 'hepsiburada') return '#FF6000';
    return '#FF0000';
}

export default function EntegrePage() {
    const router = useRouter();
    const [stores, setStores] = useState<MarketplaceStore[]>([]);
    const [loading, setLoading] = useState(true);
    const [companyName, setCompanyName] = useState('');
    const [selectedStore, setSelectedStore] = useState<MarketplaceStore | null>(null);
    const [orders, setOrders] = useState<TrendyolOrder[]>([]);
    const [hbPackages, setHbPackages] = useState<HepsiburadaPackage[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [timeRange, setTimeRange] = useState<TimeRange>('3d');
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [cargoModal, setCargoModal] = useState<CargoModalState | null>(null);
    const [cargoActionLoading, setCargoActionLoading] = useState<string | null>(null);
    const [hbTab, setHbTab] = useState<'orders' | 'catalog'>('orders');
    const refreshInterval = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const tenantId = localStorage.getItem('tenantId');
        if (!tenantId) {
            toast.error('Oturum bilgisi bulunamadı.');
            router.push('/');
            return;
        }

        setCompanyName(localStorage.getItem('companyName') || 'İşletmem');
        
        const init = async () => {
            try {
                await supabase.rpc('set_current_tenant', { tenant_id: tenantId });
                await fetchIntegrations(tenantId);
            } catch (err) {
                console.error('Başlatma hatası:', err);
                setLoading(false);
            }
        };
        
        init();

        return () => {
            if (refreshInterval.current) clearInterval(refreshInterval.current);
        };
    }, []);

    // Canlı Yenileme Döngüsü
    useEffect(() => {
        if (selectedStore) {
            // İlk çekim
            fetchStoreDetails(selectedStore, timeRange, true);
            
            // Her 30 saniyede bir sessiz yenile (Canlı Veri)
            if (refreshInterval.current) clearInterval(refreshInterval.current);
            refreshInterval.current = setInterval(() => {
                fetchStoreDetails(selectedStore, timeRange, false);
            }, 30000); 
        } else {
            if (refreshInterval.current) clearInterval(refreshInterval.current);
        }

        return () => {
            if (refreshInterval.current) clearInterval(refreshInterval.current);
        };
    }, [selectedStore, timeRange]);

    const fetchIntegrations = async (tenantId: string) => {
        try {
            // Kimlik bilgileri (apiKey/apiSecret/username/password) bu uçtan
            // asla dönmez — sadece bağlantı durumu sunucu tarafında okunup özetlenir.
            const [trendyolStatus, hepsiburadaStatus] = await Promise.all([
                apiFetch('/api/trendyol/status'),
                apiFetch('/api/hepsiburada/status').catch(() => null)
            ]);

            const marketplaceStores: MarketplaceStore[] = [];

            if (trendyolStatus.trendyol?.enabled) {
                marketplaceStores.push({
                    id: 'trendyol_mp',
                    name: 'Trendyol Mağaza',
                    type: 'trendyol',
                    status: trendyolStatus.trendyol.connected ? 'connected' : 'pending',
                    details: { id: trendyolStatus.trendyol.supplierId || '-' }
                });
            }

            if (trendyolStatus.trendyolGo?.enabled) {
                marketplaceStores.push({
                    id: 'trendyol_go',
                    name: 'Trendyol GO / Yemek',
                    type: 'trendyol_go',
                    status: trendyolStatus.trendyolGo.connected ? 'connected' : 'pending',
                    details: { id: trendyolStatus.trendyolGo.sellerId || '-' }
                });
            }

            if (hepsiburadaStatus?.enabled) {
                marketplaceStores.push({
                    id: 'hepsiburada',
                    name: 'Hepsiburada',
                    type: 'hepsiburada',
                    status: hepsiburadaStatus.connected ? 'connected' : 'pending',
                    details: { id: hepsiburadaStatus.stage ? 'TEST ORTAMI' : 'CANLI' }
                });
            }

            setStores(marketplaceStores);
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStoreDetails = async (store: MarketplaceStore, range: TimeRange = '3d', showLoader: boolean = true) => {
        if (store.status !== 'connected') return;

        if (showLoader) setOrdersLoading(true);
        try {
            const endDate = new Date();
            let hours = 48;
            if (range === '24h') hours = 24;
            else if (range === '3d') hours = 72;
            else if (range === '7d') hours = 168;
            else if (range === '30d') hours = 720;

            const startDate = new Date(endDate.getTime() - hours * 60 * 60 * 1000);

            if (store.type === 'hepsiburada') {
                const hbClient = new HepsiburadaClient();
                const packages = await hbClient.getPackages({ beginDate: startDate, endDate, size: 100 });
                setHbPackages(packages);
            } else {
                const client = new TrendyolClient(store.type as 'trendyol' | 'trendyol_go');
                const realOrders = await client.getOrders(startDate, endDate, 'Created,Picking,Invoiced,Shipped,Delivered,Cancelled,Returned');
                const sortedOrders = realOrders.sort((a, b) => b.orderDate - a.orderDate);
                setOrders(sortedOrders);
            }
            setLastUpdated(new Date());

        } catch (error: any) {
            console.error('API Error:', error);
        } finally {
            if (showLoader) setOrdersLoading(false);
        }
    };

    const openCargoModal = async (packageNumber: string) => {
        setCargoModal({ packageNumber, companies: [], loading: true, selecting: false });
        try {
            const hbClient = new HepsiburadaClient();
            const companies = await hbClient.getChangeableCargoCompanies(packageNumber);
            setCargoModal({ packageNumber, companies, loading: false, selecting: false });
        } catch (error: any) {
            toast.error(error.message || 'Kargo firmaları alınamadı');
            setCargoModal(null);
        }
    };

    const confirmCargoCompany = async (code: string) => {
        if (!cargoModal) return;
        setCargoModal({ ...cargoModal, selecting: true });
        try {
            const hbClient = new HepsiburadaClient();
            await hbClient.changeCargoCompany(cargoModal.packageNumber, code);
            toast.success('Kargo firması güncellendi');
            setCargoModal(null);
            if (selectedStore) fetchStoreDetails(selectedStore, timeRange, true);
        } catch (error: any) {
            toast.error(error.message || 'Kargo firması değiştirilemedi');
            setCargoModal({ ...cargoModal, selecting: false });
        }
    };

    const handleGetLabel = async (packageNumber: string) => {
        setCargoActionLoading(`label-${packageNumber}`);
        try {
            const hbClient = new HepsiburadaClient();
            const data = await hbClient.getCargoLabel(packageNumber);
            const url = typeof data === 'string' ? data : (data?.labelUrl || data?.url || data?.data || data?.documentUrl);
            if (typeof url === 'string' && url.startsWith('http')) {
                window.open(url, '_blank');
            } else {
                console.log('Hepsiburada etiket yanıtı:', data);
                toast.message('Etiket verisi alındı (konsola yazıldı), görüntülenebilir link bulunamadı');
            }
        } catch (error: any) {
            toast.error(error.message || 'Etiket alınamadı');
        } finally {
            setCargoActionLoading(null);
        }
    };

    const handleMarkDelivered = async (packageNumber: string) => {
        if (!confirm('Bu paket teslim edildi olarak işaretlensin mi?')) return;
        setCargoActionLoading(`deliver-${packageNumber}`);
        try {
            const hbClient = new HepsiburadaClient();
            await hbClient.markDelivered(packageNumber);
            toast.success('Paket teslim edildi olarak işaretlendi');
            if (selectedStore) fetchStoreDetails(selectedStore, timeRange, true);
        } catch (error: any) {
            toast.error(error.message || 'İşlem başarısız');
        } finally {
            setCargoActionLoading(null);
        }
    };

    const stats = useMemo(() => {
        const total = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
        const count = orders.length;
        return { total, count };
    }, [orders]);

    return (
        <div className="relative min-h-screen bg-[#050B1A] pb-32 overflow-x-hidden container-safe">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[50%] bg-[#2563FF]/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[50%] bg-[#6FD3FF]/5 rounded-full blur-[120px]" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 glass border-b border-white/5 p-4 pt-[env(safe-area-inset-top,1.5rem)] pb-6">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => selectedStore ? setSelectedStore(null) : router.back()}
                        className="w-10 h-10 rounded-xl glass-dark border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight uppercase">
                            {selectedStore ? 'MAĞAZA KOKPİTİ' : 'JETENTEGRE'}
                        </h1>
                        <p className="text-[10px] font-black text-[#5B8CFF] tracking-[3px] uppercase mt-1">
                            {selectedStore ? selectedStore.name : 'MAĞAZA YÖNETİMİ'}
                        </p>
                    </div>
                </div>
            </header>

            <main className="p-4 sm:p-6 space-y-8 relative z-10">
                <AnimatePresence mode="wait">
                    {!selectedStore ? (
                        <motion.div 
                            key="list"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            {/* Stats Overview */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="glass-dark border border-[#2D6BFF]/20 rounded-[2rem] p-5 space-y-2">
                                    <p className="text-[9px] font-black text-slate-500 tracking-widest uppercase">AKTİF MAĞAZA</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-white">{stores.filter(s => s.status === 'connected').length}</span>
                                        <span className="text-xs font-bold text-emerald-400">ONLINE</span>
                                    </div>
                                </div>
                                <div className="glass-dark border border-white/5 rounded-[2rem] p-5 space-y-2">
                                    <p className="text-[9px] font-black text-slate-500 tracking-widest uppercase">TOPLAM KANAL</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-white">{stores.length}</span>
                                        <span className="text-xs font-bold text-[#5B8CFF]">ENTEGRE</span>
                                    </div>
                                </div>
                            </div>

                            {/* Marketplace List */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 px-2">
                                    <span className="text-[10px] font-black text-[#5B8CFF] uppercase tracking-[4px]">PAZARYERLERİ</span>
                                    <div className="h-px flex-1 bg-gradient-to-r from-[#2D6BFF]/20 to-transparent" />
                                </div>

                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                        <RefreshCcw className="w-8 h-8 text-[#2563FF] animate-spin" />
                                        <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase">Ayarlar Denetleniyor...</span>
                                    </div>
                                ) : stores.length === 0 ? (
                                    <div className="glass-dark border border-white/5 rounded-[2.5rem] p-12 flex flex-col items-center text-center space-y-4">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                            <AlertCircle size={32} className="text-slate-600" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-white font-bold">Entegrasyon Bulunamadı</h3>
                                            <p className="text-xs text-slate-500 px-4">Admin panelinden pazaryeri entegrasyon ayarlarını yapmanız gerekmektedir.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {stores.map((store) => (
                                            <motion.div
                                                key={store.id}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setSelectedStore(store)}
                                                className="group relative overflow-hidden cursor-pointer"
                                            >
                                                <div className="glass-dark border border-white/10 rounded-[2.5rem] p-6 relative z-10 transition-all hover:border-[#2D6BFF]/30 shadow-xl">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center relative shadow-2xl" style={{ backgroundColor: `${storeColor(store.type)}20`, border: `1px solid ${storeColor(store.type)}40` }}>
                                                                <Store className="w-7 h-7" style={{ color: storeColor(store.type) }} />
                                                                {store.status === 'connected' && (
                                                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#050B1A] flex items-center justify-center">
                                                                        <CheckCircle2 size={10} className="text-white" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="space-y-1">
                                                                <h3 className="text-lg font-black text-white tracking-tight uppercase">{store.name}</h3>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ID: {store.details.id}</span>
                                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${store.status === 'connected' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                                        {store.status === 'connected' ? 'BAĞLI' : 'BEKLEMEDE'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                                                            <ChevronRight size={20} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="details"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-8"
                        >
                            {/* Time Range Selector */}
                            <div className="flex items-center justify-between gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                                {[
                                    { id: '24h', label: '24 SAAT' },
                                    { id: '3d', label: '3 GÜN' },
                                    { id: '7d', label: '1 HAFTA' },
                                    { id: '30d', label: '1 AY' },
                                ].map((range) => (
                                    <button
                                        key={range.id}
                                        onClick={() => setTimeRange(range.id as TimeRange)}
                                        className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all ${
                                            timeRange === range.id ? 'bg-[#2563FF] text-white shadow-lg' : 'text-slate-500 hover:text-white'
                                        }`}
                                    >
                                        {range.label}
                                    </button>
                                ))}
                            </div>

                            {selectedStore.type === 'hepsiburada' ? (
                            <>
                            {/* Hepsiburada: Siparişler & Kargo / Ürün Kataloğu sekmeleri */}
                            <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                                {[
                                    { id: 'orders', label: 'SİPARİŞLER & KARGO' },
                                    { id: 'catalog', label: 'ÜRÜN KATALOĞU' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setHbTab(tab.id as 'orders' | 'catalog')}
                                        className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
                                            hbTab === tab.id ? 'bg-[#FF6000] text-white shadow-lg' : 'text-slate-500 hover:text-white'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {hbTab === 'catalog' ? (
                                <HepsiburadaCatalogFlow />
                            ) : (
                            <>
                            {/* Hepsiburada Paket Özeti */}
                            <div className="glass-dark border border-[#FF6000]/30 rounded-[2.5rem] p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-[#FF6000]/10 blur-3xl rounded-full" />
                                <div className="relative z-10 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-[#FF6000] uppercase tracking-[4px]">TOPLAM PAKET</p>
                                        <h2 className="text-3xl font-black text-white tracking-tighter">{hbPackages.length}</h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 rounded-full text-[9px] font-black text-emerald-400 border border-emerald-500/20">
                                                <Activity size={10} className="animate-pulse" />
                                                CANLI TAKİP
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-16 h-16 rounded-3xl glass-dark border border-white/10 flex items-center justify-center">
                                        <Truck size={28} className="text-[#FF6000]" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-[#FF6000] uppercase tracking-[4px]">PAKETLER & KARGO</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF6000] animate-pulse" />
                                    </div>
                                    <button
                                        onClick={() => fetchStoreDetails(selectedStore, timeRange, true)}
                                        className="text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2"
                                    >
                                        YENİLE <RefreshCcw size={10} className={ordersLoading ? 'animate-spin' : ''} />
                                    </button>
                                </div>

                                {ordersLoading ? (
                                    <div className="py-12 flex flex-col items-center gap-4">
                                        <RefreshCcw className="w-8 h-8 text-[#FF6000] animate-spin" />
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Paketler Çekiliyor...</span>
                                    </div>
                                ) : hbPackages.length === 0 ? (
                                    <div className="glass-dark border border-white/5 rounded-3xl p-12 flex flex-col items-center text-center space-y-4">
                                        <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-slate-600">
                                            <Calendar size={24} />
                                        </div>
                                        <p className="text-xs text-slate-500 uppercase tracking-widest font-black px-4 leading-relaxed">
                                            Paket bulunamadı.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {hbPackages.map((pkg) => (
                                            <motion.div
                                                key={pkg.packageNumber}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="glass-dark border border-white/5 rounded-3xl p-5 space-y-4"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="min-w-0">
                                                        <h4 className="text-sm font-black text-white truncate">#{pkg.packageNumber}</h4>
                                                        {pkg.orderNumber && (
                                                            <p className="text-[10px] font-bold text-slate-500 tracking-wider">Sipariş: {pkg.orderNumber}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        {pkg.status && (
                                                            <div className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                                {pkg.status}
                                                            </div>
                                                        )}
                                                        {pkg.cargoCompany && (
                                                            <div className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-[#FF6000]/10 text-[#FF6000] border border-[#FF6000]/20">
                                                                {pkg.cargoCompany}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                                                    <button
                                                        onClick={() => openCargoModal(pkg.packageNumber)}
                                                        className="flex-1 py-2.5 bg-white/5 hover:bg-[#FF6000]/20 text-slate-300 hover:text-[#FF6000] rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                                                    >
                                                        <Truck size={12} /> Kargo
                                                    </button>
                                                    <button
                                                        onClick={() => handleGetLabel(pkg.packageNumber)}
                                                        disabled={cargoActionLoading === `label-${pkg.packageNumber}`}
                                                        className="flex-1 py-2.5 bg-white/5 hover:bg-blue-500/20 text-slate-300 hover:text-blue-400 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                                    >
                                                        <Tag size={12} /> Etiket
                                                    </button>
                                                    <button
                                                        onClick={() => handleMarkDelivered(pkg.packageNumber)}
                                                        disabled={cargoActionLoading === `deliver-${pkg.packageNumber}`}
                                                        className="flex-1 py-2.5 bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                                    >
                                                        <CheckCircle2 size={12} /> Teslim
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            </>
                            )}
                            </>
                            ) : (
                            <>
                            {/* Store Performance Header */}
                            <div className="glass-dark border border-[#2D6BFF]/30 rounded-[2.5rem] p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-[#2563FF]/10 blur-3xl rounded-full" />
                                <div className="relative z-10 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-[#5B8CFF] uppercase tracking-[4px]">SEÇİLİ DÖNEM CİRO</p>
                                        <h2 className="text-3xl font-black text-white tracking-tighter">₺{stats.total.toLocaleString('tr-TR')}</h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 rounded-full text-[9px] font-black text-emerald-400 border border-emerald-500/20">
                                                <Activity size={10} className="animate-pulse" />
                                                CANLI TAKİP
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-16 h-16 rounded-3xl glass-dark border border-white/10 flex items-center justify-center">
                                        <div className="relative">
                                            <ShoppingCart size={28} className="text-[#6FD3FF]" />
                                            <div className="absolute -top-2 -right-2 bg-[#2563FF] text-white text-[10px] font-black px-1.5 py-0.5 rounded-lg shadow-lg">
                                                {stats.count}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Orders Section */}
                            <div className="space-y-5">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-[#5B8CFF] uppercase tracking-[4px]">CANLI SİPARİŞLER</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#2563FF] animate-pulse" />
                                    </div>
                                    <button 
                                        onClick={() => fetchStoreDetails(selectedStore, timeRange, true)}
                                        className="text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2"
                                    >
                                        YENİLE <RefreshCcw size={10} className={ordersLoading ? 'animate-spin' : ''} />
                                    </button>
                                </div>

                                {ordersLoading ? (
                                    <div className="py-12 flex flex-col items-center gap-4">
                                        <RefreshCcw className="w-8 h-8 text-[#2563FF] animate-spin" />
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Siparişler Çekiliyor...</span>
                                    </div>
                                ) : orders.length === 0 ? (
                                    <div className="glass-dark border border-white/5 rounded-3xl p-12 flex flex-col items-center text-center space-y-4">
                                        <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-slate-600">
                                            <Calendar size={24} />
                                        </div>
                                        <p className="text-xs text-slate-500 uppercase tracking-widest font-black px-4 leading-relaxed">
                                            Sipariş bulunamadı.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {orders.map((order, idx) => (
                                            <motion.div 
                                                key={order.orderNumber} 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="glass-dark border border-white/5 rounded-3xl p-5 space-y-4 relative group"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <div className="w-10 h-10 shrink-0 rounded-xl bg-white/5 flex items-center justify-center text-[#5B8CFF]">
                                                            <User size={18} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="text-sm font-black text-white truncate">
                                                                {order.customerFirstName} {order.customerLastName}
                                                            </h4>
                                                            <p className="text-[10px] font-bold text-slate-500 tracking-wider">#{order.orderNumber}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="text-sm font-black text-white">₺{order.totalPrice.toLocaleString('tr-TR')}</p>
                                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                                                            {new Date(order.orderDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })} {new Date(order.orderDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                                                            ['Created', 'Picking'].includes(order.status) ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                                                            ['Shipped', 'Invoiced'].includes(order.status) ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                                                            order.status === 'Cancelled' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                        }`}>
                                                            {order.status === 'Created' ? 'YENİ' : 
                                                             order.status === 'Picking' ? 'HAZIRLANIYOR' : 
                                                             order.status === 'Shipped' ? 'KARGODA' : 
                                                             order.status === 'Cancelled' ? 'İPTAL EDİLDİ' :
                                                             order.status === 'Returned' ? 'İADE' :
                                                             order.status === 'Delivered' ? 'TESLİM EDİLDİ' : order.status}
                                                        </div>
                                                    </div>
                                                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                                        {order.lines.length} ÜRÜN
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            </>
                            )}

                            {/* Store Health Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="glass-dark border border-white/5 rounded-3xl p-5 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} className="text-[#5B8CFF]" />
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">GÜNCELLEME</span>
                                    </div>
                                    <h4 className="text-[10px] font-black text-white uppercase tracking-tight">
                                        {lastUpdated.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </h4>
                                </div>
                                <div className="glass-dark border border-white/5 rounded-3xl p-5 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck size={14} className="text-emerald-400" />
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">GÜVENLİK</span>
                                    </div>
                                    <h4 className="text-[10px] font-black text-white uppercase tracking-tight">UÇTAN UCA</h4>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Hepsiburada Kargo Firması Seçim Modalı (HepsiJet dahil) */}
            <AnimatePresence>
                {cargoModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6"
                    >
                        <motion.div
                            initial={{ y: 40, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 40, opacity: 0 }}
                            className="bg-[#0B1328] border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] max-w-md w-full shadow-2xl max-h-[80vh] overflow-y-auto"
                        >
                            <div className="p-6 border-b border-white/10 sticky top-0 bg-[#0B1328] z-10 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-black text-white">Kargo Firması Seç</h3>
                                    <p className="text-[10px] text-slate-500 mt-1">Paket #{cargoModal.packageNumber}</p>
                                </div>
                                <button
                                    onClick={() => setCargoModal(null)}
                                    className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-slate-400"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="p-6 space-y-3">
                                {cargoModal.loading ? (
                                    <div className="py-8 flex flex-col items-center gap-3">
                                        <RefreshCcw className="w-7 h-7 text-[#FF6000] animate-spin" />
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Kargo Firmaları Alınıyor...</span>
                                    </div>
                                ) : cargoModal.companies.length === 0 ? (
                                    <p className="text-xs text-slate-500 text-center py-8">Bu paket için değiştirilebilir kargo firması bulunamadı.</p>
                                ) : (
                                    cargoModal.companies.map((c, idx) => {
                                        const label = typeof c === 'string' ? c : (c.cargoCompanyName || c.name || c.cargoCompanyShortCode || c.shortCode || JSON.stringify(c));
                                        const code = typeof c === 'string' ? c : (c.cargoCompanyShortCode || c.shortCode || c.code || label);
                                        const isHepsiJet = String(label).toLowerCase().includes('hepsi');
                                        return (
                                            <button
                                                key={idx}
                                                disabled={cargoModal.selecting}
                                                onClick={() => confirmCargoCompany(code)}
                                                className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-[#FF6000]/10 border border-white/5 hover:border-[#FF6000]/30 rounded-2xl transition-all disabled:opacity-50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Truck size={16} className="text-[#FF6000]" />
                                                    <span className="text-sm font-bold text-white">{label}</span>
                                                </div>
                                                {isHepsiJet && (
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                                                        Önerilen
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <BottomNav />
        </div>
    );
}
