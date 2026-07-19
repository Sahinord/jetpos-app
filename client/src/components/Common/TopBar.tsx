"use client";

import {
    Bell,
    User,
    Calendar,
    Clock,
    ShieldCheck,
    Minus,
    Square,
    X,
    Menu
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import TenantSwitcher from "../Tenant/TenantSwitcher";
import { useTenant } from "@/lib/tenant-context";
import NotificationCenter from "../Notifications/NotificationCenter";
import { getSidebarPosition, type SidebarPosition } from "./Sidebar";
import { isImpersonating, IMPERSONATION_FLAG, ADMIN_URL } from "@/lib/admin-host";

export default function TopBar({ activeTab, onMenuClick }: { activeTab: string, onMenuClick?: () => void }) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const { currentTenant } = useTenant();
    const [sidebarPosition, setSidebarPosition] = useState<SidebarPosition>("left");
    // Hydration uyuşmazlığı olmasın diye localStorage istemcide okunuyor
    const [impersonating, setImpersonating] = useState(false);
    useEffect(() => { setImpersonating(isImpersonating()); }, []);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        setSidebarPosition(getSidebarPosition());
        const handlePositionChange = () => setSidebarPosition(getSidebarPosition());
        window.addEventListener('sidebar-position-changed', handlePositionChange);
        return () => window.removeEventListener('sidebar-position-changed', handlePositionChange);
    }, []);

    // Sekme değişiminde de pozisyonu yeniden oku (event kaçarsa senkron kalsın)
    useEffect(() => { setSidebarPosition(getSidebarPosition()); }, [activeTab]);

    const handleWindowAction = (action: 'window-minimize' | 'window-maximize' | 'window-close') => {
        if (typeof window !== 'undefined' && (window as any).electron) {
            try {
                (window as any).electron.send(action);
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
            "invoice": "Fatura İşlemleri",
            "alis_irsaliyesi": "Alış İrsaliyesi",
            "satis_irsaliyesi": "Satış İrsaliyesi",
            "satis_iade_irsaliyesi": "Satış İade İrsaliyesi",
            "alis_iade_irsaliyesi": "Alış İade İrsaliyesi",
            "sevk_irsaliyesi": "Sipariş Sevk İrsaliyesi",
            "alis_faturasi": "Alış Faturası",
            "satis_faturasi": "Satış Faturası",
            "perakende_satis_faturasi": "Perakende Satış Faturası",
            "iade_faturasi": "İade Faturası",
            "iade_fiyat_farki": "İade Fiyat Farkı",
            "emsaliyet_fisleri": "Proforma Fatura",
            "alinan_hizmet_faturasi": "Alınan Hizmet Faturası",
            "yapilan_hizmet_faturasi": "Yapılan Hizmet Faturası",
            "yapilan_hizmet_iadesi": "Yapılan Hizmet İadesi",
            "alinan_hizmet_iadesi": "Alınan Hizmet İadesi",
            "fatura_listesi": "Fatura Listesi",
            "fatura_kdv_listesi": "KDV Listesi",
            "kdv_analiz_raporu": "KDV Analiz Raporu",

            // Jetstok
            "products": "Ürün Listesi",
            "alerts": "Stok Uyarıları",
            "label_designer": "Ürün Etiket Tasarımı",

            // Finans
            "expenses": "Gider Yönetimi",
            "calculator": "Kâr Hesaplama",
            "mali_takvim": "Mali Takvim",

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

            // İnsan Kaynakları
            "employee_manager": "Çalışan Yönetimi",
            "shift_manager": "Vardiya Takibi",

            // Diğer
            "cfd": "Müşteri Ekranı (CFD)",
            "showcase": "Vitrin Tasarımı",
            "settings": "Ayarlar",
            "profile": "Profil",
            "support": "Destek",
            "image_converter": "Görsel Dönüştürücü",
            "currency_converter": "Döviz Çevirici",
            "universal_converter": "Akıllı Dönüştürücü",
            "qr_generator": "QR Kod Oluşturucu"
        };

        return titles[tab] || "JetPos";
    };

    const leftSection = (
        <div className="flex items-center gap-3 lg:gap-4" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <button
                onClick={onMenuClick}
                className="p-2 -ml-2 text-secondary hover:text-primary transition-colors lg:hidden rounded-lg hover:bg-primary/5"
            >
                <Menu className="w-6 h-6" />
            </button>

            <TenantSwitcher />

            <div className="hidden md:flex flex-col space-y-1">
                <div className="flex items-center space-x-2 text-primary font-bold text-[10px] uppercase tracking-[2px]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>JetPos v{process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}</span>
                </div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight leading-tight">
                    {getTitle(activeTab)}
                </h1>
            </div>

            {/* Yönetici bir işletme oturumundaysa panele dönüş butonu.
                Not: lisans anahtarı karşılaştırması kaldırıldı (anahtar artık
                istemci paketinde yok); bunun yerine impersonation bayrağı. */}
            {impersonating && (
                <button
                    onClick={() => {
                        localStorage.removeItem('currentTenantId');
                        localStorage.removeItem(IMPERSONATION_FLAG);
                        window.location.href = ADMIN_URL;
                    }}
                    className="ml-4 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-rose-500/20 transition-all flex items-center gap-2 animate-pulse"
                >
                    <ShieldCheck className="w-4 h-4" />
                    Yönetici Paneline Dön
                </button>
            )}
        </div>
    );

    const rightSection = (
        <div className={`flex items-center space-x-8 ${sidebarPosition === 'right' ? 'flex-row-reverse space-x-reverse' : ''}`} style={{ WebkitAppRegion: 'no-drag' } as any}>
            {/* Tarih & Saat — stray "çizgi"yi önlemek için ayırıcı border kaldırıldı */}
            <div className="hidden xl:flex flex-col items-end text-right space-y-1">
                <div className="flex items-center space-x-2 text-secondary text-xs font-bold">
                    <Calendar className="w-4 h-4" />
                    <span>{currentTime.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center space-x-2 text-foreground text-base font-black font-mono">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>

            <div className={`flex items-center space-x-6 ${sidebarPosition === 'right' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className="flex items-center space-x-3">
                    <NotificationCenter />
                    <button
                        onClick={() => window.location.hash = 'profile'}
                        className="p-2.5 text-secondary hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                    >
                        <User className="w-6 h-6" />
                    </button>
                </div>

                <div className="h-10 w-[1px] bg-border mx-2" />

                {/* Pencere kontrolleri */}
                <div className="flex items-center space-x-1">
                    <button
                        onClick={() => handleWindowAction('window-minimize')}
                        className="p-2 text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                        title="Küçült"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleWindowAction('window-maximize')}
                        className="p-2 text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
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
    );

    return (
        <header
            className="h-20 lg:h-24 border-b border-border bg-card/80 backdrop-blur-xl flex items-center justify-between px-4 lg:px-10 sticky top-0 z-40 select-none"
            style={{ WebkitAppRegion: 'drag' } as any}
        >
            {/* Menü SAĞDAYSA swap: pencere tuşları solda, başlık menünün yanında (sağda) */}
            {sidebarPosition === 'right'
                ? <>{rightSection}{leftSection}</>
                : <>{leftSection}{rightSection}</>}
        </header>
    );
}
