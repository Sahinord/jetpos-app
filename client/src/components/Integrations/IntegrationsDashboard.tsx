"use client";

import { useState } from "react";
import TrendyolGOWidget from "./TrendyolGOWidget";
import ProductMapping from "./ProductMapping";
import {
    ShoppingBag, Store, Package, ShoppingCart,
    LayoutDashboard, Link as LinkIcon
} from "lucide-react";

export default function IntegrationsDashboard({ integrationType }: { integrationType: string }) {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'mapping'>('dashboard');

    const getPlatformName = (type: string) => {
        if (type === 'trendyol_integration') return 'trendyol';
        if (type === 'getir_integration') return 'getir';
        if (type === 'yemeksepeti_integration') return 'yemeksepeti';
        return 'other';
    };

    // Geçici olarak diğer entegrasyonlar için "Yakında" ekranı
    if (integrationType !== "trendyol_integration") {
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

    // Trendyol ekranı
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-1">Pazar Yeri Yönetimi</h1>
                    <p className="text-sm font-medium text-secondary">
                        Siparişlerinizi, stoklarınızı ve eşleştirmelerinizi tek merkezden takip edin.
                    </p>
                </div>

                {/* Sub-navigation Tabs */}
                <div className="flex gap-1 bg-white/5 p-1 rounded-2xl border border-white/5 w-fit">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-secondary hover:text-foreground hover:bg-white/5'}`}
                    >
                        <LayoutDashboard className="w-4 h-4" /> GENEL BAKIŞ
                    </button>
                    <button
                        onClick={() => setActiveTab('mapping')}
                        className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'mapping' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-secondary hover:text-foreground hover:bg-white/5'}`}
                    >
                        <LinkIcon className="w-4 h-4" /> ÜRÜN EŞLEŞTİRME
                    </button>
                </div>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'dashboard' ? (
                    <div className="grid grid-cols-1 gap-6">
                        <TrendyolGOWidget />
                    </div>
                ) : (
                    <ProductMapping platform={getPlatformName(integrationType)} />
                )}
            </div>
        </div>
    );
}
