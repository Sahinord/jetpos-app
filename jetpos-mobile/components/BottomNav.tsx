"use client";

import { LayoutDashboard, Package, AlertTriangle, ScanLine } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export default function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();

    const navItems = [
        {
            name: 'Dashboard',
            icon: LayoutDashboard,
            path: '/dashboard',
        },
        {
            name: 'Ürünler',
            icon: Package,
            path: '/products',
        },
        {
            name: 'Eksik Stok',
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
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 z-50">
            <div className="grid grid-cols-4 gap-1 p-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.path;

                    return (
                        <button
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            className={`flex flex-col items-center justify-center py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-400 hover:bg-white/5'
                                }`}
                        >
                            <Icon className={`w-6 h-6 mb-1 ${isActive ? 'animate-pulse' : ''}`} />
                            <span className="text-xs font-bold">{item.name}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
