"use client";

import { useState } from "react";
import TrendyolGOWidget from "./TrendyolGOWidget";
import { ShoppingBag, Store, Package, ShoppingCart } from "lucide-react";

export default function IntegrationsDashboard({ integrationType }: { integrationType: string }) {

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
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-1">Pazar Yeri Yönetimi</h1>
                    <p className="text-sm font-medium text-secondary">
                        Siparişlerinizi, gelirlerinizi ve karlılık analizlerinizi tek merkezden takip edin.
                    </p>
                </div>
            </div>

            {/* Trendyol Bileşeni - Bunu tam ekran entegrasyon için genişletebiliriz */}
            <div className="grid grid-cols-1 gap-6">
                <TrendyolGOWidget />
            </div>
        </div>
    );
}
