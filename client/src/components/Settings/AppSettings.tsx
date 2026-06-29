"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation, Language } from "@/lib/i18n";
import {
    Monitor, Palette, CheckCircle2,
    Shield, Database, HelpCircle, Volume2, VolumeX,
    Info, ExternalLink, Users, Tag, AlertTriangle,
    BookOpen, PlayCircle, Zap, Printer, Banknote, Receipt,
    RefreshCw, Layers, DownloadCloud, Utensils, CalendarClock,
    PanelLeft, PanelRight, type LucideIcon
} from "lucide-react";
import { getSidebarPosition, setSidebarPosition as persistSidebarPosition, type SidebarPosition } from "@/components/Common/Sidebar";

function SettingCard({ icon: Icon, title, children, delay = 0, className = "" }: { icon: LucideIcon; title: string; children: React.ReactNode; delay?: number; className?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className={`glass-card p-5 space-y-4 bg-white/[0.01] ${className}`}
        >
            <h2 className="text-[10px] font-bold text-primary uppercase tracking-[0.25em] flex items-center gap-2 border-b border-white/5 pb-3">
                <Icon className="w-4 h-4" />
                {title}
            </h2>
            <div className="space-y-3">{children}</div>
        </motion.div>
    );
}

function SettingToggle({ icon: Icon, iconClass, title, description, checked, onChange }: { icon: LucideIcon; iconClass: string; title: string; description: string; checked: boolean; onChange: () => void }) {
    return (
        <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-border bg-background/40">
            <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconClass}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{title}</p>
                    <p className="text-xs text-secondary/60 truncate">{description}</p>
                </div>
            </div>
            <button
                onClick={onChange}
                className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${checked ? 'bg-primary' : 'bg-border'}`}
            >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow ${checked ? 'left-6' : 'left-1'}`} />
            </button>
        </div>
    );
}

function PrinterRow({ icon: Icon, iconClass, title, description, value, onChange, printers, placeholder, onTest, testChannel }: any) {
    return (
        <div className="p-3.5 rounded-xl border border-border bg-background/40 space-y-3">
            <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconClass}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{title}</p>
                    <p className="text-xs text-secondary/60 truncate">{description}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <select
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs font-medium text-foreground outline-none focus:border-primary"
                >
                    <option value="">{placeholder}</option>
                    {printers.map((p: any) => (
                        <option key={p.name} value={p.name}>{p.name}{p.isDefault ? ' ★' : ''}</option>
                    ))}
                </select>
                {onTest && (
                    <button
                        onClick={() => onTest(value, testChannel)}
                        className="px-3 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg text-[10px] font-bold text-primary transition-all active:scale-95 flex-shrink-0"
                    >
                        Test Et
                    </button>
                )}
            </div>
        </div>
    );
}

export default function AppSettings({
    theme, setTheme,
    isBeepEnabled, setIsBeepEnabled,
    showHelpIcons, setShowHelpIcons,
    isEmployeeModuleEnabled, setIsEmployeeModuleEnabled,
    isPriceSyncEnabled, setIsPriceSyncEnabled,
    isStockSyncEnabled, setIsStockSyncEnabled,
    isWarehouseStockDeductionEnabled, setIsWarehouseStockDeductionEnabled,
    isCashDrawerEnabled, setIsCashDrawerEnabled,
    cashDrawerPrinterName, setCashDrawerPrinterName,
    receiptPrinterName, setReceiptPrinterName,
    labelPrinterName, setLabelPrinterName,
    isAdisyonStoreSpecificEnabled, setIsAdisyonStoreSpecificEnabled,
    isAdisyonAutoOpenReservationEnabled, setIsAdisyonAutoOpenReservationEnabled,
    currentTenant,
    showToast,
    lowStockThreshold,
    setLowStockThreshold,
    receiptSettings,
    setReceiptSettings,
    cfdSettings,
    setCfdSettings
}: any) {
    const { language, setLanguage } = useTranslation();
    const [systemPrinters, setSystemPrinters] = useState<{ name: string; isDefault: boolean; status: number }[]>([]);
    const [sidebarPos, setSidebarPos] = useState<SidebarPosition>('left');

    useEffect(() => {
        const electron = (window as any).electron;
        if (electron?.invoke) {
            electron.invoke('get-printers').then((printers: any[]) => {
                setSystemPrinters(printers || []);
            }).catch(() => { });
        }
        setSidebarPos(getSidebarPosition());
    }, []);

    const handleSidebarPositionChange = (pos: SidebarPosition) => {
        persistSidebarPosition(pos);
        setSidebarPos(pos);
        showToast?.(pos === 'left' ? "Menü sola alındı" : "Menü sağa alındı");
    };

    const testPrinter = (printerName: string, channel: string) => {
        if (!printerName) return showToast("Önce yazıcı seçiniz", "error");
        const electron = (window as any).electron;
        if (electron?.send) {
            electron.send(channel, { printerName });
            showToast("Test gönderildi: " + printerName, "info");
        }
    };

    const themes = [
        { id: 'modern', name: 'Modern Dark', color: 'bg-primary', desc: 'Sleek ve modern bir arayüz' },
        { id: 'light', name: 'Güneş Işığı', color: 'bg-white', desc: 'Aydınlık ve ferah çalışma alanı' },
        { id: 'wood', name: 'Klasik Ahşap', color: 'bg-[#8b4513]', desc: 'Sıcak ve nostaljik hesap makinesi' },
        { id: 'glass', name: 'Cam Kabarcık', color: 'bg-blue-400', desc: 'Yüksek derinlikli modern cam' },
        { id: 'mavi', name: 'Main Mavi Test Tema', color: 'bg-gradient-to-br from-[#7886C7] to-[#00D4FF]', desc: 'Soft mavi zemin, neon cyan vurgularla yeni nesil görünüm' }
    ];

    const languageLabels: Record<Language, { flag: string; native: string; name: string }> = {
        tr: { flag: '🇹🇷', native: 'Türkçe', name: 'Türkçe' },
        en: { flag: '🇬🇧', native: 'English', name: 'English' },
        ar: { flag: '🇸🇦', native: 'العربية', name: 'Arabic' },
    };

    const hasAdisyonAccess = (() => {
        if (!currentTenant?.features) return false;
        try {
            if (typeof currentTenant.features === 'string') {
                const arr = JSON.parse(currentTenant.features);
                return arr.includes('adisyon') || arr.includes('*');
            }
            if (Array.isArray(currentTenant.features)) {
                return currentTenant.features.includes('adisyon') || currentTenant.features.includes('*');
            }
            if (typeof currentTenant.features === 'object') {
                return currentTenant.features['adisyon'] === true || currentTenant.features['*'] === true;
            }
        } catch (e) {
            return String(currentTenant.features).includes('adisyon');
        }
        return false;
    })();

    return (
        <div className="space-y-4 pb-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">

                {/* Görünüm, Dil & Menü */}
                <SettingCard icon={Palette} title="Görünüm, Dil ve Menü">
                    <div>
                        <p className="text-[10px] font-semibold text-secondary uppercase tracking-widest mb-2">Tema</p>
                        <div className="grid grid-cols-1 gap-2">
                            {themes.map((th) => (
                                <button
                                    key={th.id}
                                    onClick={() => { setTheme(th.id); showToast(`${th.name} teması uygulandı`); }}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${theme === th.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-lg ${th.color} flex items-center justify-center shadow-sm`}>
                                            <Monitor className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-semibold text-foreground">{th.name}</p>
                                            <p className="text-xs text-secondary/60">{th.desc}</p>
                                        </div>
                                    </div>
                                    {theme === th.id && <CheckCircle2 className="text-primary w-5 h-5 flex-shrink-0" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="text-[10px] font-semibold text-secondary uppercase tracking-widest mb-2">Dil</p>
                        <div className="grid grid-cols-3 gap-2">
                            {(['tr', 'en', 'ar'] as Language[]).map((lang) => {
                                const l = languageLabels[lang];
                                const isActive = language === lang;
                                return (
                                    <button
                                        key={lang}
                                        onClick={() => { setLanguage(lang); showToast(l.native + (lang === 'tr' ? ' dili seçildi' : lang === 'en' ? ' selected' : ' تم اختيار اللغة')); }}
                                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${isActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
                                    >
                                        <span className="text-xl">{l.flag}</span>
                                        <span className="text-xs font-semibold text-foreground">{l.native}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <p className="text-[10px] font-semibold text-secondary uppercase tracking-widest mb-2">Menü Konumu</p>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => handleSidebarPositionChange('left')}
                                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all text-xs font-semibold ${sidebarPos === 'left' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-secondary hover:border-primary/30'}`}
                            >
                                <PanelLeft className="w-4 h-4" /> Sol
                            </button>
                            <button
                                onClick={() => handleSidebarPositionChange('right')}
                                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all text-xs font-semibold ${sidebarPos === 'right' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-secondary hover:border-primary/30'}`}
                            >
                                <PanelRight className="w-4 h-4" /> Sağ
                            </button>
                        </div>
                    </div>
                </SettingCard>

                {/* Genel Tercihler */}
                <SettingCard icon={Volume2} title="Genel Tercihler" delay={0.05}>
                    <SettingToggle
                        icon={isBeepEnabled ? Volume2 : VolumeX}
                        iconClass="bg-amber-500/10 text-amber-500"
                        title="Kasa bip sesi"
                        description="Barkod okutulduğunda çıkan dijital ses"
                        checked={isBeepEnabled}
                        onChange={() => setIsBeepEnabled(!isBeepEnabled)}
                    />
                    <SettingToggle
                        icon={HelpCircle}
                        iconClass="bg-blue-500/10 text-blue-500"
                        title="Yardım ikonları"
                        description="Menü öğelerindeki (?) yardım butonlarını göster"
                        checked={showHelpIcons}
                        onChange={() => setShowHelpIcons(!showHelpIcons)}
                    />
                    <SettingToggle
                        icon={Users}
                        iconClass="bg-emerald-500/10 text-emerald-500"
                        title="Çalışan modülü"
                        description="Vardiya takibi ve çalışan yönetimi"
                        checked={isEmployeeModuleEnabled}
                        onChange={() => setIsEmployeeModuleEnabled(!isEmployeeModuleEnabled)}
                    />
                </SettingCard>

                {/* POS Donanımı / Yazıcılar */}
                <SettingCard icon={Printer} title="POS Donanımı" delay={0.1}>
                    <SettingToggle
                        icon={Banknote}
                        iconClass="bg-violet-500/10 text-violet-500"
                        title="Nakit çekmecesi"
                        description="Nakit satışlarda kasayı otomatik aç"
                        checked={isCashDrawerEnabled}
                        onChange={() => setIsCashDrawerEnabled(!isCashDrawerEnabled)}
                    />
                    {isCashDrawerEnabled && (
                        <PrinterRow
                            icon={Banknote}
                            iconClass="bg-violet-500/10 text-violet-500"
                            title="Çekmece yazıcısı"
                            description="Çekmeceyi tetikleyen termal yazıcı"
                            value={cashDrawerPrinterName}
                            onChange={setCashDrawerPrinterName}
                            printers={systemPrinters}
                            placeholder="Yazıcı seçin..."
                            onTest={(name: string) => testPrinter(name, 'open-cash-drawer')}
                        />
                    )}
                    <PrinterRow
                        icon={Receipt}
                        iconClass="bg-emerald-500/10 text-emerald-500"
                        title="Fiş yazıcısı"
                        description="Satış fişleri için kullanılacak yazıcı"
                        value={receiptPrinterName}
                        onChange={setReceiptPrinterName}
                        printers={systemPrinters}
                        placeholder="Yazıcı seçin..."
                        onTest={(name: string) => testPrinter(name, 'test-receipt-printer')}
                    />
                    <PrinterRow
                        icon={Tag}
                        iconClass="bg-amber-500/10 text-amber-500"
                        title="Etiket yazıcısı"
                        description="Boş bırakılırsa fiş yazıcısıyla aynı kabul edilir"
                        value={labelPrinterName}
                        onChange={setLabelPrinterName}
                        printers={systemPrinters}
                        placeholder="Fiş yazıcısıyla aynı (boş bırak)"
                        onTest={(name: string) => testPrinter(name, 'test-receipt-printer')}
                    />
                </SettingCard>

                {/* Mağaza ve Envanter */}
                <SettingCard icon={Database} title="Mağaza ve Envanter" delay={0.15}>
                    <SettingToggle
                        icon={RefreshCw}
                        iconClass="bg-indigo-500/10 text-indigo-500"
                        title="Fiyat senkronizasyonu"
                        description="Tüm mağazalarda fiyatları aynı tut"
                        checked={isPriceSyncEnabled}
                        onChange={() => { setIsPriceSyncEnabled(!isPriceSyncEnabled); showToast(isPriceSyncEnabled ? "Fiyat izolasyonu aktif" : "Fiyat eşitleme aktif"); }}
                    />
                    <SettingToggle
                        icon={Layers}
                        iconClass="bg-amber-500/10 text-amber-500"
                        title="Aktif mağaza stok düşümü"
                        description="Satışları seçili mağazanın stoğundan düş"
                        checked={isWarehouseStockDeductionEnabled}
                        onChange={() => { setIsWarehouseStockDeductionEnabled(!isWarehouseStockDeductionEnabled); showToast(isWarehouseStockDeductionEnabled ? "Global stok düşümü aktif" : "Mağaza bazlı stok düşümü aktif"); }}
                    />
                    <SettingToggle
                        icon={RefreshCw}
                        iconClass="bg-rose-500/10 text-rose-500"
                        title="Stok senkronizasyonu"
                        description="Tüm mağazalarda tek bir stok havuzu kullan"
                        checked={isStockSyncEnabled}
                        onChange={() => { setIsStockSyncEnabled(!isStockSyncEnabled); showToast(isStockSyncEnabled ? "Stoklar ayrıştırıldı" : "Stoklar eşitlendi"); }}
                    />
                    <div className="p-3.5 rounded-xl border border-border bg-background/40 space-y-2">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-rose-500/10 text-rose-500">
                                    <AlertTriangle className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-foreground">Stok uyarı sınırı</p>
                                    <p className="text-xs text-secondary/60">Bu sayının altı &quot;kritik&quot; sayılır</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <input
                                    type="number"
                                    value={lowStockThreshold ?? 0}
                                    onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 0)}
                                    className="w-16 bg-background border border-border rounded-lg px-2 py-1.5 text-center text-sm font-semibold text-primary outline-none focus:border-primary"
                                />
                                <span className="text-xs text-secondary/60">adet</span>
                            </div>
                        </div>
                    </div>
                </SettingCard>

                {/* Adisyon Sistemi */}
                {hasAdisyonAccess && (
                    <SettingCard icon={Utensils} title="Adisyon Sistemi" delay={0.2}>
                        <SettingToggle
                            icon={Database}
                            iconClass="bg-purple-500/10 text-purple-500"
                            title="Şubeye özel masalar"
                            description="Masaları bulunduğun şubeye göre izole et"
                            checked={isAdisyonStoreSpecificEnabled}
                            onChange={() => { setIsAdisyonStoreSpecificEnabled(!isAdisyonStoreSpecificEnabled); showToast(!isAdisyonStoreSpecificEnabled ? "Masalar şubelere ayrıldı" : "Tüm masalar ortak yapıldı"); }}
                        />
                        <SettingToggle
                            icon={CalendarClock}
                            iconClass="bg-emerald-500/10 text-emerald-500"
                            title="Otomatik rezervasyon açılışı"
                            description="Saati gelen rezervasyonlarda masayı otomatik aç"
                            checked={isAdisyonAutoOpenReservationEnabled}
                            onChange={() => { setIsAdisyonAutoOpenReservationEnabled(!isAdisyonAutoOpenReservationEnabled); showToast(!isAdisyonAutoOpenReservationEnabled ? "Otomatik açılış aktif" : "Otomatik açılış kapalı"); }}
                        />
                    </SettingCard>
                )}

                {/* Sistem ve Güvenlik */}
                <SettingCard icon={Shield} title="Sistem ve Güvenlik" delay={0.25}>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between px-1 py-2 text-sm">
                            <span className="text-secondary/60">Versiyon</span>
                            <span className="font-mono font-semibold text-foreground">v{process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'} Pro</span>
                        </div>
                        <div className="flex items-center justify-between px-1 py-2 text-sm border-t border-white/5">
                            <span className="text-secondary/60">Veritabanı durumu</span>
                            <span className="flex items-center gap-2 text-emerald-500 font-semibold">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                Bağlı (Supabase)
                            </span>
                        </div>
                        <div className="flex items-center justify-between px-1 py-2 text-sm border-t border-white/5">
                            <span className="text-secondary/60">Terminal kimliği</span>
                            <span className="text-secondary font-mono text-xs">TR-KASAP-01-AF82</span>
                        </div>
                    </div>
                    <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary/5 hover:bg-primary/10 rounded-xl text-xs font-semibold transition-all text-foreground border border-border">
                        <DownloadCloud className="w-4 h-4 text-primary" /> Yedekleme ve Dışa Aktar
                    </button>
                </SettingCard>

                {/* Destek ve Akademi */}
                <SettingCard icon={Info} title="Destek ve Akademi" delay={0.3}>
                    <p className="text-xs text-secondary/60 leading-relaxed">
                        JetPOS&apos;u en verimli şekilde kullanmanız için hazırladığımız kılavuzlar ve eğitim materyallerine buradan ulaşabilirsiniz.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <a href="https://jetpos.pro/kilavuzlar" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-background/40 border border-border rounded-xl group hover:border-primary/40 transition-all">
                            <div className="flex items-center gap-2.5">
                                <BookOpen className="w-4 h-4 text-primary" />
                                <span className="text-xs font-semibold text-foreground">Kullanım Kılavuzları</span>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-secondary/40 group-hover:text-primary transition-colors" />
                        </a>
                        <a href="https://jetpos.pro/kilavuzlar#video" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-background/40 border border-border rounded-xl group hover:border-purple-500/40 transition-all">
                            <div className="flex items-center gap-2.5">
                                <PlayCircle className="w-4 h-4 text-purple-500" />
                                <span className="text-xs font-semibold text-foreground">Video Eğitimler</span>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-secondary/40 group-hover:text-purple-500 transition-colors" />
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); showToast("Destek bileti modülü açılıyor..."); }} className="flex items-center justify-between p-3 bg-background/40 border border-border rounded-xl group hover:border-rose-500/40 transition-all">
                            <div className="flex items-center gap-2.5">
                                <AlertTriangle className="w-4 h-4 text-rose-500" />
                                <span className="text-xs font-semibold text-foreground">Hata Bildirimi</span>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-secondary/40 group-hover:text-rose-500 transition-colors" />
                        </a>
                        <a href="https://jetpos.pro/blog" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-background/40 border border-border rounded-xl group hover:border-indigo-500/40 transition-all">
                            <div className="flex items-center gap-2.5">
                                <Zap className="w-4 h-4 text-indigo-500" />
                                <span className="text-xs font-semibold text-foreground">Yenilikler (v1.5)</span>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-secondary/40 group-hover:text-indigo-500 transition-colors" />
                        </a>
                    </div>
                </SettingCard>
            </div>
        </div>
    );
}
