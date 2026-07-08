"use client";

import { LayoutDashboard, Package, ScanLine, Wallet, ClipboardCheck, Menu, X, Utensils, LogOut, ArrowLeftRight, Users, CreditCard, Calculator, Zap, Globe, ChefHat, Receipt, Settings } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { clearOfflineTenantData } from '@/lib/offline-db';
import { SyncService } from '@/lib/sync-service';
import { toast } from 'sonner';

export default function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [features, setFeatures] = useState<any>({});
    const [companyName, setCompanyName] = useState('JetPOS Mobile');

    const waiterRole = typeof window !== 'undefined' ? localStorage.getItem('activeWaiterRole') : null;
    const isKitchen = waiterRole === 'Kitchen' || waiterRole === 'Mutfak';

    useEffect(() => {
        if (isKitchen) return;
        const tenantId = localStorage.getItem('tenantId');
        setCompanyName(localStorage.getItem('companyName') || 'JetPOS Mobile');

        if (tenantId) {
            supabase
                .from('tenants')
                .select('features')
                .eq('id', tenantId)
                .single()
                .then(({ data }) => {
                    if (data?.features) {
                        setFeatures(data.features);
                    }
                });
        }
    }, []);

    // Hooks'lardan SONRA koşullu çıkış — aksi halde React hooks sırası bozulur
    if (isKitchen) {
        return null;
    }

    const hasFeature = (f: string) => {
        if (!features) return false;
        if (typeof features === 'string') {
            try { 
                const a = JSON.parse(features); 
                return a.includes(f) || a.includes('*'); 
            } catch (e) { 
                return features.includes(f); 
            }
        }
        if (Array.isArray(features)) {
            return features.includes(f) || features.includes('*');
        }
        if (typeof features === 'object') {
            return features[f] === true || features['*'] === true;
        }
        return false;
    };

    const navItems = [
        { name: 'Panel', icon: Zap, path: '/dashboard' },
        { name: 'Satış', icon: Wallet, path: '/pos' },
        { name: 'Barkod', icon: ScanLine, path: '/scanner' },
        { name: 'Ürünler', icon: Package, path: '/products' },
    ];

    const sidebarItems = [
        { name: 'Pano', icon: LayoutDashboard, path: '/dashboard', show: true },
        { name: 'JetKasa (POS)', icon: Wallet, path: '/pos', show: true },
        { name: 'Barkod Okuyucu', icon: ScanLine, path: '/scanner', show: true },
        { name: 'Ürün Yönetimi', icon: Package, path: '/products', show: true },
        { name: 'Entegrasyonlar', icon: Globe, path: '/entegre', show: true },
        { name: 'Cari Hesaplar', icon: Users, path: '/cari', show: true },
        { name: 'Banka Hesapları', icon: CreditCard, path: '/banka', show: true },
        { name: 'Kasa İşlemleri', icon: Calculator, path: '/kasa', show: true },
        { name: 'Envanter Sayımı', icon: ClipboardCheck, path: '/inventory-count', show: true },
        { name: 'Depo Transferi', icon: ArrowLeftRight, path: '/warehouse-transfer', show: true },
        { name: 'Alış Faturası (AI)', icon: Receipt, path: '/alis-faturasi', show: true },
        { name: 'Ayarlar', icon: Settings, path: '/ayarlar', show: true },
        {
            name: 'Adisyon Sistemi',
            icon: Utensils, 
            path: '/adisyon', 
            show: hasFeature('mobile_adisyon') || hasFeature('adisyon') 
        },
        { 
            name: 'Mutfak Ekranı (KDS)', 
            icon: ChefHat, 
            path: '/kds', 
            show: hasFeature('kds') 
        },
    ];

    return (
        <>
            {/* Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110]"
                        />

                        {/* Sidebar (Right Drawer) */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                            className="fixed top-0 right-0 h-full w-72 bg-background border-l border-border-glow/20 shadow-2xl z-[120] flex flex-col"
                        >
                            <div className="p-6 border-b border-border-glow/10 flex items-center justify-between bg-card/50">
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-xl font-black text-foreground truncate">{companyName}</h2>
                                    <p className="text-[10px] text-cyan-glow font-black uppercase tracking-[3px] mt-1">Mobil Modül</p>
                                </div>
                                <button
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="p-2 bg-foreground/5 hover:bg-primary/10 rounded-xl transition-colors border border-foreground/5 ml-4"
                                >
                                    <X className="w-5 h-5 text-secondary" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-2 no-scrollbar">
                                {sidebarItems.filter(i => i.show).map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.path;

                                    return (
                                        <button
                                            key={item.path}
                                            onClick={() => {
                                                setIsSidebarOpen(false);
                                                router.push(item.path);
                                            }}
                                            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${isActive ? 'bg-primary/10 text-cyan-glow border border-border-glow/30' : 'text-secondary hover:bg-foreground/5 hover:text-foreground'}`}
                                        >
                                            <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-glow' : ''}`} />
                                            <span className="font-bold tracking-tight">{item.name}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="p-4 border-t border-border-glow/10 bg-card/30">
                                <button
                                    onClick={async () => {
                                        await SyncService.pushPendingSales().catch(() => {});
                                        const { lostPendingSales } = await clearOfflineTenantData();
                                        if (lostPendingSales > 0) {
                                            toast.error(`${lostPendingSales} senkronize edilmemiş satış cihazdan silindi (çevrimdışıydı).`);
                                        }
                                        localStorage.clear();
                                        window.location.href = '/';
                                    }}
                                    className="w-full flex items-center gap-3 p-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-2xl transition-all font-black justify-center border border-rose-500/10"
                                >
                                    <LogOut className="w-5 h-5" />
                                    OTURUMU KAPAT
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 z-[100] bg-background/95 backdrop-blur-2xl border-t border-border-glow/20 pb-[env(safe-area-inset-bottom,0.5rem)] shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
                <div className="flex items-center justify-around h-20 w-full max-w-md mx-auto px-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.path;

                        return (
                            <button
                                key={item.path}
                                onClick={() => router.push(item.path)}
                                className="relative flex flex-col items-center justify-center w-full h-full group"
                            >
                                <div className={`relative p-2.5 sm:p-3 rounded-2xl transition-all duration-500 ${isActive ? 'bg-primary/20 -translate-y-2.5' : ''}`}>
                                    <Icon
                                        strokeWidth={isActive ? 3 : 2}
                                        className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-300 ${isActive ? 'text-cyan-glow' : 'text-secondary'}`}
                                    />
                                    {(item.name === 'Satış' || item.name === 'Barkod') && !isActive && (
                                        <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                                    )}
                                </div>
                                <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-[2px] mt-1.5 transition-all duration-300 ${isActive ? 'text-cyan-glow opacity-100 translate-y-0' : 'text-secondary opacity-0 translate-y-2'}`}>
                                    {item.name}
                                </span>
                            </button>
                        );
                    })}

                    {/* Hamburger Menu Button */}
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="relative flex flex-col items-center justify-center w-full h-full group"
                    >
                        <div className={`relative p-2.5 sm:p-3 rounded-2xl transition-all duration-500 ${isSidebarOpen ? 'bg-primary/20 -translate-y-2.5' : ''}`}>
                            <Menu
                                strokeWidth={isSidebarOpen ? 3 : 2}
                                className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-300 ${isSidebarOpen ? 'text-cyan-glow' : 'text-secondary'}`}
                            />
                        </div>
                        <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-[2px] mt-1.5 transition-all duration-300 ${isSidebarOpen ? 'text-cyan-glow opacity-100 translate-y-0' : 'text-secondary opacity-0 translate-y-2'}`}>
                            Menü
                        </span>
                    </button>
                </div>
            </div>
        </>
    );
}
