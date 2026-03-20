"use client";

import { LayoutDashboard, Package, ScanLine, Wallet, ClipboardCheck, Menu, X, Utensils, LogOut, ArrowLeftRight } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [features, setFeatures] = useState<any>({});
    const [companyName, setCompanyName] = useState('JetPOS Mobile');

    useEffect(() => {
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
        { name: 'Panel', icon: LayoutDashboard, path: '/dashboard' },
        { name: 'Satış', icon: Wallet, path: '/pos' },
        { name: 'Ürünler', icon: Package, path: '/products' },
        { name: 'Sayım', icon: ClipboardCheck, path: '/inventory-count' },
        // Instead of Barkod on Nav, we use Menu
    ];

    const sidebarItems = [
        { name: 'Pano', icon: LayoutDashboard, path: '/dashboard', show: true },
        { name: 'Hızlı Satış (POS)', icon: Wallet, path: '/pos', show: true },
        { name: 'Ürün Yönetimi', icon: Package, path: '/products', show: true },
        { name: 'Depo & Sayım', icon: ClipboardCheck, path: '/inventory-count', show: true },
        { name: 'Barkod Okuyucu', icon: ScanLine, path: '/scanner', show: true },
        { name: 'Depo Transferi', icon: ArrowLeftRight, path: '/warehouse-transfer', show: true },
        { 
            name: 'Adisyon Sistemi', 
            icon: Utensils, 
            path: '/adisyon', 
            show: hasFeature('mobile_adisyon') || hasFeature('adisyon') 
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
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[110]"
                        />

                        {/* Sidebar (Right Drawer) */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                            className="fixed top-0 right-0 h-full w-72 bg-[#020617] border-l border-white/10 shadow-2xl z-[120] flex flex-col"
                        >
                            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-black text-white">{companyName}</h2>
                                    <p className="text-xs text-blue-400 font-bold uppercase tracking-widest mt-1">Mobil Modül</p>
                                </div>
                                <button
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-2">
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
                                            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${isActive ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                                        >
                                            <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                                            <span className="font-bold">{item.name}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="p-4 border-t border-white/10">
                                <button
                                    onClick={() => {
                                        localStorage.clear();
                                        window.location.href = '/';
                                    }}
                                    className="w-full flex items-center gap-3 p-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-2xl transition-all font-bold justify-center"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Çıkış Yap
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#020617]/95 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-around h-20 w-full max-w-md mx-auto px-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.path;

                        return (
                            <button
                                key={item.path}
                                onClick={() => router.push(item.path)}
                                className="relative flex flex-col items-center justify-center w-full h-full group"
                            >
                                <div className={`relative p-3 rounded-2xl transition-all duration-500 ${isActive ? 'bg-blue-600/20 -translate-y-2' : ''}`}>
                                    <Icon
                                        strokeWidth={isActive ? 2.5 : 2}
                                        className={`w-6 h-6 transition-colors duration-300 ${isActive ? 'text-blue-400' : 'text-slate-500'}`}
                                    />
                                    {item.name === 'Satış' && !isActive && (
                                        <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                    )}
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest mt-1 transition-all duration-300 ${isActive ? 'text-blue-400 opacity-100' : 'text-slate-500 opacity-0'}`}>
                                    {item.name}
                                </span>
                            </button>
                        );
                    })}

                    {/* Hamburger Menu Button (Replaces Barkod on bottom nav) */}
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="relative flex flex-col items-center justify-center w-full h-full group"
                    >
                        <div className={`relative p-3 rounded-2xl transition-all duration-500 ${isSidebarOpen ? 'bg-blue-600/20 -translate-y-2' : ''}`}>
                            <Menu
                                strokeWidth={isSidebarOpen ? 2.5 : 2}
                                className={`w-6 h-6 transition-colors duration-300 ${isSidebarOpen ? 'text-blue-400' : 'text-slate-500'}`}
                            />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest mt-1 transition-all duration-300 ${isSidebarOpen ? 'text-blue-400 opacity-100' : 'text-slate-500 opacity-0'}`}>
                            Menü
                        </span>
                    </button>
                </div>
            </div>
        </>
    );
}
