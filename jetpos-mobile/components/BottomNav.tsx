"use client";

import { LayoutDashboard, Package, AlertTriangle, ScanLine, CreditCard } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();

    const navItems = [
        {
            name: 'Panel',
            icon: LayoutDashboard,
            path: '/dashboard',
        },
        {
            name: 'Satış',
            icon: CreditCard,
            path: '/pos',
        },
        {
            name: 'Ürünler',
            icon: Package,
            path: '/products',
        },
        {
            name: 'Stok',
            icon: AlertTriangle,
            path: '/low-stock',
        },
        {
            name: 'Barkod',
            icon: ScanLine,
            path: '/scanner',
        },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#020617]/95 backdrop-blur-xl border-t border-white/5 pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-around h-16 w-full max-w-md mx-auto px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.path;

                    return (
                        <button
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            className="relative flex flex-col items-center justify-center w-full h-full group"
                        >
                            <div className={`relative transition-all duration-300 ${isActive ? '-translate-y-1' : ''}`}>
                                <Icon
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className={`w-6 h-6 transition-colors duration-300 ${isActive
                                        ? 'text-white'
                                        : 'text-slate-500 group-hover:text-slate-400'
                                        }`}
                                />
                                {item.name === 'Satış' && (
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                )}
                            </div>

                            {/* Text Label - Optional, fades in when active */}
                            {isActive && (
                                <span className="absolute -bottom-2 text-[10px] font-bold text-white tracking-tight scale-75 opacity-100 transition-all">
                                    {item.name}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
