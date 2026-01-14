"use client";

import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Calculator,
    TrendingUp,
    BarChart3,
    Settings,
    History,
    Clock,
    Lock,
    LogOut
} from "lucide-react";
import { motion } from "framer-motion";
import { useTenant } from "@/lib/tenant-context";

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
    const { currentTenant } = useTenant();

    const allMenuItems = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, feature: null },
        { id: "pos", label: "Hızlı Satış", icon: ShoppingCart, feature: "pos" },
        { id: "products", label: "Ürünler", icon: Package, feature: "products" },
        { id: "history", label: "Satış Geçmişi", icon: History, feature: "sales_history" },
        { id: "calculator", label: "Kâr Hesapla", icon: Calculator, feature: "profit_calculator" },
        { id: "simulation", label: "Fiyat Simülasyonu", icon: TrendingUp, feature: "price_simulator" },
        { id: "reports", label: "Raporlar", icon: BarChart3, feature: "reports" },
        { id: "alerts", label: "Stok Uyarıları", icon: Clock, feature: null },
    ];

    const menuItems = allMenuItems.filter(item => {
        if (!item.feature) return true;
        if (!currentTenant?.features) return false;
        return currentTenant.features[item.feature] === true;
    });

    const lockedItems = allMenuItems.filter(item => {
        if (!item.feature) return false;
        if (!currentTenant?.features) return true;
        return currentTenant.features[item.feature] !== true;
    });

    return (
        <aside className="w-72 border-r border-border bg-card/50 backdrop-blur-sm flex flex-col h-screen sticky top-0 overflow-hidden">
            <div className="p-6 border-b border-border">
                <div className="flex items-center space-x-3">
                    {currentTenant?.logo_url ? (
                        <img
                            src={currentTenant.logo_url}
                            alt={currentTenant.company_name}
                            className="w-12 h-12 rounded-xl object-cover shadow-lg"
                        />
                    ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">
                                {currentTenant?.company_name?.substring(0, 2).toUpperCase() || 'JP'}
                            </span>
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-black text-white truncate">
                            {currentTenant?.company_name || 'JetPos'}
                        </h1>
                        <p className="text-xs text-secondary truncate">Yönetim Paneli</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <nav className="px-4 py-6 space-y-2">
                    {menuItems.map((item) => (
                        <motion.button
                            key={item.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onTabChange(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                                ? 'bg-primary text-white shadow-lg'
                                : 'text-secondary hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-semibold">{item.label}</span>
                        </motion.button>
                    ))}
                </nav>

                {lockedItems.length > 0 && (
                    <div className="px-6 pb-4">
                        <p className="text-xs font-bold text-secondary/50 uppercase tracking-wider mb-3">
                            Kilitli Özellikler
                        </p>
                        <div className="space-y-1">
                            {lockedItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 opacity-50 cursor-not-allowed"
                                >
                                    <item.icon className="w-5 h-5 text-secondary" />
                                    <span className="text-sm font-semibold text-secondary flex-1">{item.label}</span>
                                    <Lock className="w-4 h-4 text-secondary" />
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-secondary/50 mt-3 text-center">
                            Yükseltme için iletişime geçin
                        </p>
                    </div>
                )}
            </div>

            <div className="p-6 border-t border-border mt-auto bg-card/30">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-sm">
                            {currentTenant?.company_name?.substring(0, 2).toUpperCase() || 'JP'}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                            {currentTenant?.company_name || 'JetPos'}
                        </p>
                        <p className="text-xs text-secondary">Admin</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <button
                        onClick={() => onTabChange('settings')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${activeTab === 'settings'
                            ? 'bg-primary text-white'
                            : 'text-secondary hover:bg-white/5'
                            }`}
                    >
                        <Settings className="w-5 h-5" />
                        <span className="font-semibold">Ayarlar</span>
                    </button>

                    <button
                        onClick={() => {
                            localStorage.clear();
                            window.location.reload();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-semibold">Çıkış Yap</span>
                    </button>
                </div>

                <div className="flex items-center justify-between text-xs text-secondary mt-4 pt-4 border-t border-white/10">
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        Çevrimiçi
                    </span>
                    <span className="font-mono">v1.0</span>
                </div>
            </div>
        </aside>
    );
}
