"use client";

import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Receipt,
    FileText,
    Settings,
    ChevronLeft,
    ChevronRight,
    TrendingDown,
    Calculator,
    Zap,
    BarChart3,
    LogOut,
    ShieldCheck
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const menuItems = [
    { id: "dashboard", label: "Panel", icon: LayoutDashboard },
    { id: "pos", label: "Hızlı Satış", icon: ShoppingCart },
    { id: "products", label: "Ürünler", icon: Package },
    { id: "expenses", label: "Giderler", icon: TrendingDown },
    { id: "simulation", label: "Simülasyon", icon: Zap },
    { id: "calculator", label: "Kar Hesapla", icon: Calculator },
    { id: "reports", label: "Akıllı Rapor", icon: BarChart3 },
    { id: "history", label: "İşlem Geçmişi", icon: FileText },
];

export default function Sidebar({ activeTab, onTabChange }: any) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? "80px" : "260px" }}
            className="h-screen bg-card/30 backdrop-blur-xl border-r border-border flex flex-col sticky top-0 transition-all"
        >
            <div className="p-6 flex items-center justify-between">
                {!isCollapsed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center space-x-3"
                    >
                        <div className="w-10 h-10 relative flex-shrink-0">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="font-semibold text-lg tracking-tight">Kardeşler Kasap</span>
                    </motion.div>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                    {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all group ${activeTab === item.id
                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : "text-secondary hover:bg-white/5 hover:text-white"
                            }`}
                    >
                        <item.icon className={`w-5 h-5 ${activeTab === item.id ? "" : "group-hover:scale-110 transition-transform"}`} />
                        {!isCollapsed && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="font-medium"
                            >
                                {item.label}
                            </motion.span>
                        )}
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-border space-y-1">
                <button
                    onClick={() => onTabChange('settings')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings'
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "text-secondary hover:bg-white/5 hover:text-white"}`}
                >
                    <Settings className="w-5 h-5" />
                    {!isCollapsed && <span className="font-medium">Ayarlar</span>}
                </button>
                <button
                    onClick={() => {
                        localStorage.removeItem("app_session");
                        window.location.reload();
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all font-bold"
                >
                    <LogOut className="w-5 h-5" />
                    {!isCollapsed && <span className="font-medium">Oturumu Kapat</span>}
                </button>
            </div>
        </motion.aside>
    );
}
