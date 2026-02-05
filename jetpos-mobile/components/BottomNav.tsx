"use client";

import { LayoutDashboard } from 'lucide-react';
import { Package } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';
import { ScanLine } from 'lucide-react';
import { Wallet } from 'lucide-react';
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
            icon: Wallet,
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
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#020617]/95 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-around h-20 w-full max-w-md mx-auto px-4">
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
                                    className={`w-6 h-6 transition-colors duration-300 ${isActive
                                        ? 'text-blue-400'
                                        : 'text-slate-500 group-hover:text-slate-200'
                                        }`}
                                />
                                {item.name === 'Satış' && !isActive && (
                                    <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                )}
                            </div>

                            <span className={`text-[10px] font-black uppercase tracking-widest mt-1 transition-all duration-300 ${isActive ? 'text-blue-400 opacity-100' : 'text-slate-500 opacity-0'
                                }`}>
                                {item.name}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
