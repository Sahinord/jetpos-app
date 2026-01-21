"use client";

import {
    Bell,
    User,
    Calendar,
    Clock,
    ShieldCheck,
    Minus,
    Square,
    X
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import TenantSwitcher from "../Tenant/TenantSwitcher";
import { useTenant } from "@/lib/tenant-context";
import NotificationCenter from "../Notifications/NotificationCenter";

export default function TopBar({ activeTab }: { activeTab: string }) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const { currentTenant } = useTenant();

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleWindowAction = (action: 'window-minimize' | 'window-maximize' | 'window-close') => {
        if (typeof window !== 'undefined' && (window as any).require) {
            try {
                const { ipcRenderer } = (window as any).require('electron');
                ipcRenderer.send(action);
            } catch (e) {
                console.error("Electron IPC Error:", e);
            }
        }
    };

    const getTitle = (tab: string) => {
        const titles: Record<string, string> = {
            // Ana Menü
            "home": "Ana Ekran",
            "dashboard": "Yönetim Paneli",

            // Satış & POS
            "pos": "Satış Terminali",
            "history": "Satış Geçmişi",
            "invoice": "E-Fatura",

            // Ürün Yönetimi
            "products": "Ürün Listesi",
            "alerts": "Stok Uyarıları",

            // Finans
            "expenses": "Gider Yönetimi",
            "calculator": "Kâr Hesaplama",

            // Raporlar & Analiz
            "reports": "Satış Raporları",
            "simulation": "Fiyat Simülasyonu",
            "ai_insights": "AI Öngörüleri",

            // Cari Hesap
            "cari_tanim": "Cari Tanıtımı",
            "cari_grup": "Grup Tanıtımı",
            "cari_ozelkod": "Özel Kod Tanıtımı",
            "cari_borc": "Borç Dekontu",
            "cari_alacak": "Alacak Dekontu",
            "cari_virman": "Virman Dekontu",
            "cari_devir": "Devir Fişi",
            "cari_liste": "Cari Kartı Listesi",
            "cari_bakiye": "Bakiye Raporu",
            "cari_hareket": "Hareket Raporu",
            "cari_mutabakat": "Mutabakat Raporu",
            "cari_gunluk": "Günlük Hareket",
            "cari_analiz": "Cari Analizi",

            // Kasa İşlemleri
            "cash_define": "Kasa Tanıtımı",
            "cash_room": "Oda Tanıtımı",
            "cash_in": "Kasa Tahsil Fişi",
            "cash_out": "Kasa Tediye Fişi",
            "cash_transfer": "Kasa Virman Fişi",
            "cash_opening": "Kasa Devir Fişi",
            "cash_balance": "Kasa Bakiye Raporu",
            "cash_history": "Kasa Hareket Raporu",

            // Banka İşlemleri
            "bank_define": "Banka Tanıtımı",
            "bank_withdraw": "Bankadan Para Çekme",
            "bank_deposit": "Bankaya Para Yatırma",
            "bank_transfer_in": "Gelen Havaleler",
            "bank_transfer_out": "Yapılan Havaleler",
            "bank_transfer": "Banka Virman Fişi",
            "bank_opening": "Banka Devir Fişi",
            "bank_list": "Banka Listesi",
            "bank_balance": "Hesap Bakiye Raporu",
            "bank_history": "Banka Hareket Raporu",

            // Diğer
            "settings": "Ayarlar",
            "profile": "Profil",
            "support": "Destek"
        };

        return titles[tab] || "JetPos";
    };

    return (
        <header
            className="h-24 border-b border-border bg-card/10 backdrop-blur-md flex items-center justify-between px-10 sticky top-0 z-40 select-none"
            style={{ WebkitAppRegion: 'drag' } as any}
        >
            {/* Left Section: Tenant Switcher + Title */}
            <div className="flex items-center gap-4" style={{ WebkitAppRegion: 'no-drag' } as any}>
                <TenantSwitcher />

                <div className="hidden md:flex flex-col space-y-1">
                    <div className="flex items-center space-x-2 text-primary font-bold text-[10px] uppercase tracking-[2px]">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>JetPos v{process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight leading-tight">
                        {getTitle(activeTab)}
                    </h1>
                </div>
            </div>

            {/* Right Section: Actions & Info */}
            <div className="flex items-center space-x-8" style={{ WebkitAppRegion: 'no-drag' } as any}>
                {/* Date & Time */}
                <div className="hidden xl:flex flex-col items-end text-right border-r border-border pr-8 space-y-1">
                    <div className="flex items-center space-x-2 text-secondary text-xs font-bold">
                        <Calendar className="w-4 h-4" />
                        <span>{currentTime.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-white text-base font-black font-mono">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>{currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>

                {/* System Status & Windows Style Controls */}
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-3">
                        <NotificationCenter />

                        <button
                            onClick={() => window.location.hash = 'profile'}
                            className="p-2.5 text-secondary hover:text-white hover:bg-white/5 rounded-xl transition-all"
                        >
                            <User className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="h-10 w-[1px] bg-border mx-2" />

                    {/* Classic Window Controls */}
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={() => handleWindowAction('window-minimize')}
                            className="p-2 text-secondary hover:text-white hover:bg-white/10 rounded-lg transition-all"
                            title="Küçült"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleWindowAction('window-maximize')}
                            className="p-2 text-secondary hover:text-white hover:bg-white/10 rounded-lg transition-all"
                            title="Büyült"
                        >
                            <Square className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => handleWindowAction('window-close')}
                            className="p-2 text-secondary hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                            title="Kapat"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
