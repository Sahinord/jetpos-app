"use client";

import { useState } from "react";
import TrendyolGOWidget from "./TrendyolGOWidget";
import ProductMapping from "./ProductMapping";
import {
    ShoppingBag, Store, Package, ShoppingCart,
    LayoutDashboard, Link as LinkIcon,
    TrendingUp, Settings, BarChart3, ClipboardList
} from "lucide-react";

export default function IntegrationsDashboard({ integrationType }: { integrationType: string }) {
    const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'finance' | 'settings' | 'mapping'>('overview');

    const getPlatformName = (type: string) => {
        if (type === 'trendyol_integration') return 'trendyol';
        if (type === 'trendyol_go_integration') return 'trendyol_go';
        if (type === 'getir_integration') return 'getir';
        if (type === 'yemeksepeti_integration') return 'yemeksepeti';
        return 'other';
    };

    // Diğer entegrasyonlar için "Yakında" ekranı
    if (integrationType !== "trendyol_integration" && integrationType !== "trendyol_go_integration") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-secondary/40">
                    {integrationType === 'yemeksepeti_integration' ? <Store className="w-12 h-12 text-rose-500/50" /> :
                        integrationType === 'getir_integration' ? <Package className="w-12 h-12 text-purple-500/50" /> :
                            <ShoppingCart className="w-12 h-12 text-orange-500/50" />
                    }
                </div>
                <div>
                    <h2 className="text-3xl font-black mb-2">Çok Yakında!</h2>
                    <p className="text-secondary font-medium max-w-md mx-auto">
                        Bu pazar yeri entegrasyonu şu anda geliştirme aşamasındadır. Çok yakında tüm sipariş ve finansal analizlerinizi buradan tek merkezden yönetebileceksiniz.
                    </p>
                </div>
            </div>
        );
    }

    // Tab tanımları
    const tabs = [
        { id: 'overview' as const, label: 'Genel Bakış', icon: LayoutDashboard },
        { id: 'orders' as const, label: 'Siparişler', icon: ClipboardList },
        { id: 'finance' as const, label: 'Finans & Analiz', icon: BarChart3 },
        { id: 'settings' as const, label: 'Ayarlar', icon: Settings },
        { id: 'mapping' as const, label: 'Ürün Eşleştirme', icon: LinkIcon },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20">
                            <Package className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-white">Trendyol GO</h1>
                            <p className="text-xs font-medium text-secondary/60">
                                Siparişler • Ciro Analizi • Stok Senkronizasyonu
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigasyon */}
            <div className="flex gap-1 bg-white/[0.02] p-1.5 rounded-2xl border border-white/5 overflow-x-auto custom-scrollbar">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                            activeTab === tab.id
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                                : 'text-secondary hover:text-foreground hover:bg-white/5'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab İçeriği */}
            <div className="min-h-[50vh]">
                {activeTab === 'mapping' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <ProductMapping platform={getPlatformName(integrationType)} />
                    </div>
                ) : (
                    <TrendyolGOWidget activeSubTab={activeTab} />
                )}
            </div>
        </div>
    );
}
