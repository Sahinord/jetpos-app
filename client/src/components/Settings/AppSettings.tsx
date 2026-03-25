"use client";

import { motion } from "framer-motion";
import {
    Volume2, VolumeX, Monitor,
    Palette, CheckCircle2,
    Shield, Bell, Database,
    Info, ExternalLink, Users, Tag, AlertTriangle,
    BookOpen, PlayCircle, Zap
} from "lucide-react";

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
    isAdisyonStoreSpecificEnabled, setIsAdisyonStoreSpecificEnabled,
    isAdisyonAutoOpenReservationEnabled, setIsAdisyonAutoOpenReservationEnabled,
    currentTenant,
    showToast,
    lowStockThreshold,
    setLowStockThreshold
}: any) {
    const themes = [
        { id: 'modern', name: 'MODERN DARK', color: 'bg-primary', desc: 'Sleek ve modern bir arayüz' },
        { id: 'light', name: 'GÜNEŞ IŞIĞI', color: 'bg-white', desc: 'Aydınlık ve ferah çalışma alanı' },
        { id: 'wood', name: 'KLASİK AHŞAP', color: 'bg-[#8b4513]', desc: 'Sıcak ve nostaljik hesap makinesi' },
        { id: 'glass', name: 'CAM KABARCIK', color: 'bg-blue-400', desc: 'Yüksek derinlikli modern cam' }
    ];


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
        <div className="space-y-8 pb-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                {/* Visual Settings */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card space-y-6">
                    <div className="flex items-center gap-3 border-b border-border pb-4">
                        <Palette className="text-primary" />
                        <h2 className="font-black tracking-widest uppercase text-foreground">GÖRÜNÜM TEMA SEÇİMİ</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {themes.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => {
                                    setTheme(t.id);
                                    showToast(`${t.name} teması uygulandı`);
                                }}
                                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${theme === t.id ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl ${t.color} flex items-center justify-center shadow-lg`}>
                                        <Monitor className="text-white" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-black text-sm uppercase tracking-wider text-foreground">{t.name}</div>
                                        <div className="text-[10px] text-secondary font-bold">{t.desc}</div>
                                    </div>
                                </div>
                                {theme === t.id && <CheckCircle2 className="text-primary w-6 h-6" />}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* System Settings */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card space-y-6">
                    <div className="flex items-center gap-3 border-b border-border pb-4">
                        <Volume2 className="text-primary" />
                        <h2 className="font-black tracking-widest uppercase text-foreground">SES VE BİLDİRİMLER</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-border">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-amber-500/10 rounded-xl">
                                    {isBeepEnabled ? <Volume2 className="text-amber-500" /> : <VolumeX className="text-secondary" />}
                                </div>
                                <div>
                                    <div className="font-black text-sm uppercase tracking-wider text-foreground">KASA BİP SESİ</div>
                                    <div className="text-[10px] text-secondary font-bold">Barkod okutulduğunda çıkan dijital ses</div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsBeepEnabled(!isBeepEnabled)}
                                className={`w-16 h-8 rounded-full relative transition-all duration-300 ${isBeepEnabled ? 'bg-primary' : 'bg-primary/10'}`}
                            >
                                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-lg ${isBeepEnabled ? 'left-9' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-border">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-xl">
                                    <Info className="text-primary" />
                                </div>
                                <div>
                                    <div className="font-black text-sm uppercase tracking-wider text-foreground">YARDIM İKONLARI</div>
                                    <div className="text-[10px] text-secondary font-bold">Menü öğelerindeki (?) yardım butonlarını göster</div>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowHelpIcons(!showHelpIcons)}
                                className={`w-16 h-8 rounded-full relative transition-all duration-300 ${showHelpIcons ? 'bg-primary' : 'bg-primary/10'}`}
                            >
                                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-lg ${showHelpIcons ? 'left-9' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-border">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-500/10 rounded-xl">
                                    <Users className="text-emerald-500" />
                                </div>
                                <div>
                                    <div className="font-black text-sm uppercase tracking-wider text-foreground">ÇALIŞAN MODÜLÜ</div>
                                    <div className="text-[10px] text-secondary font-bold">Vardiya takibi ve çalışan yönetimi</div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsEmployeeModuleEnabled(!isEmployeeModuleEnabled)}
                                className={`w-16 h-8 rounded-full relative transition-all duration-300 ${isEmployeeModuleEnabled ? 'bg-emerald-500' : 'bg-primary/10'}`}
                            >
                                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-lg ${isEmployeeModuleEnabled ? 'left-9' : 'left-1'}`} />
                            </button>
                        </div>

                        {/* Nakit Çekmece Ayarı */}
                        <div className="space-y-4 pt-4 border-t border-border/20">
                            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-border">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-500/10 rounded-xl">
                                        <Database className="text-blue-500" />
                                    </div>
                                    <div>
                                        <div className="font-black text-sm uppercase tracking-wider text-foreground">NAKİT ÇEKMECESİ</div>
                                        <div className="text-[10px] text-secondary font-bold">Nakit satışlarda kasayı otomatik aç</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsCashDrawerEnabled(!isCashDrawerEnabled)}
                                    className={`w-16 h-8 rounded-full relative transition-all duration-300 ${isCashDrawerEnabled ? 'bg-blue-500' : 'bg-primary/10'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-lg ${isCashDrawerEnabled ? 'left-9' : 'left-1'}`} />
                                </button>
                            </div>

                            {isCashDrawerEnabled && (
                                <div className="p-4 bg-primary/5 rounded-2xl border border-border space-y-2">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1 space-y-2">
                                            <label className="text-[10px] font-black text-secondary tracking-widest uppercase">YAZICI ADI (SİSTEMDEKİ ADI)</label>
                                            <input 
                                                type="text"
                                                value={cashDrawerPrinterName}
                                                onChange={(e) => setCashDrawerPrinterName(e.target.value)}
                                                placeholder="Örn: Rongta RP80"
                                                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-xs font-bold text-foreground outline-none focus:border-primary transition-all"
                                            />
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (!cashDrawerPrinterName) return showToast("Önce yazıcı adını giriniz", "error");
                                                if (window.require) {
                                                    try {
                                                        const { ipcRenderer } = window.require('electron');
                                                        ipcRenderer.send('open-cash-drawer', { printerName: cashDrawerPrinterName });
                                                        showToast("Kasa açma komutu gönderildi (Rongta)", "info");
                                                    } catch (err) {
                                                        console.error("Test hatası:", err);
                                                        showToast("Test işlemi başarısız", "error");
                                                    }
                                                }
                                            }}
                                            className="px-6 py-3 self-end bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-xl text-[10px] font-black text-primary transition-all active:scale-95"
                                        >
                                            TEST ET
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-secondary/60 italic mt-1 font-medium leading-relaxed uppercase">
                                        * Kasayı açmak için ESC/POS destekli bir termal yazıcı gereklidir.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Adisyon Ayarları */}
                {hasAdisyonAccess && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="glass-card space-y-6">
                        <div className="flex items-center gap-3 border-b border-border pb-4">
                            <span className="text-primary text-xl">🍽️</span>
                            <h2 className="font-black tracking-widest uppercase text-foreground">ADİSYON SİSTEMİ</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-border">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-purple-500/10 rounded-xl">
                                        <Database className="text-purple-500" />
                                    </div>
                                    <div>
                                        <div className="font-black text-sm uppercase tracking-wider text-foreground">ŞUBEYE ÖZEL MASALAR</div>
                                        <div className="text-[10px] text-secondary font-bold">Masaları bulunduğun şubeye göre izole et</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsAdisyonStoreSpecificEnabled(!isAdisyonStoreSpecificEnabled);
                                        showToast(!isAdisyonStoreSpecificEnabled ? "Masalar şubelere ayrıldı" : "Tüm masalar ortak yapıldı");
                                    }}
                                    className={`w-16 h-8 rounded-full relative transition-all duration-300 ${isAdisyonStoreSpecificEnabled ? 'bg-purple-500' : 'bg-primary/10'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-lg ${isAdisyonStoreSpecificEnabled ? 'left-9' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-border">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-500/10 rounded-xl">
                                        <CheckCircle2 className="text-emerald-500" />
                                    </div>
                                    <div>
                                        <div className="font-black text-sm uppercase tracking-wider text-foreground">OTOMATİK REZERVASYON AÇILIŞI</div>
                                        <div className="text-[10px] text-secondary font-bold">Saati gelen rezervasyonlarda masayı otomatik aç</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsAdisyonAutoOpenReservationEnabled(!isAdisyonAutoOpenReservationEnabled);
                                        showToast(!isAdisyonAutoOpenReservationEnabled ? "Otomatik açılış aktif" : "Otomatik açılış kapalı");
                                    }}
                                    className={`w-16 h-8 rounded-full relative transition-all duration-300 ${isAdisyonAutoOpenReservationEnabled ? 'bg-emerald-500' : 'bg-primary/10'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-lg ${isAdisyonAutoOpenReservationEnabled ? 'left-9' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Store Management Settings */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card space-y-6">
                    <div className="flex items-center gap-3 border-b border-border pb-4">
                        <Database className="text-primary" />
                        <h2 className="font-black tracking-widest uppercase text-foreground">MAĞAZA VE ENVANTER</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-border">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-500/10 rounded-xl">
                                    <Tag className="text-indigo-500" />
                                </div>
                                <div>
                                    <div className="font-black text-sm uppercase tracking-wider text-foreground">FİYAT SENKRONİZASYONU</div>
                                    <div className="text-[10px] text-secondary font-bold">Tüm mağazalarda fiyatları aynı tut</div>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setIsPriceSyncEnabled(!isPriceSyncEnabled);
                                    showToast(isPriceSyncEnabled ? "Fiyat izolasyonu aktif" : "Fiyat eşitleme aktif");
                                }}
                                className={`w-16 h-8 rounded-full relative transition-all duration-300 ${isPriceSyncEnabled ? 'bg-indigo-500' : 'bg-primary/10'}`}
                            >
                                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-lg ${isPriceSyncEnabled ? 'left-9' : 'left-1'}`} />
                            </button>
                        </div>

                        {/* Stok Düşüm Ayarı */}
                        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-border">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-amber-500/10 rounded-xl">
                                    <Database className="text-amber-500" />
                                </div>
                                <div>
                                    <div className="font-black text-sm uppercase tracking-wider text-foreground">AKTİF MAĞAZA STOK DÜŞÜMÜ</div>
                                    <div className="text-[10px] text-secondary font-bold">Satışları seçili mağazanın stoğundan düş</div>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setIsWarehouseStockDeductionEnabled(!isWarehouseStockDeductionEnabled);
                                    showToast(isWarehouseStockDeductionEnabled ? "Global stok düşümü aktif" : "Mağaza bazlı stok düşümü aktif");
                                }}
                                className={`w-16 h-8 rounded-full relative transition-all duration-300 ${isWarehouseStockDeductionEnabled ? 'bg-amber-500' : 'bg-primary/10'}`}
                            >
                                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-lg ${isWarehouseStockDeductionEnabled ? 'left-9' : 'left-1'}`} />
                            </button>
                        </div>

                        {/* Stok Senkronizasyon Ayarı */}
                        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-border">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-rose-500/10 rounded-xl">
                                    <Database className="text-rose-500" />
                                </div>
                                <div>
                                    <div className="font-black text-sm uppercase tracking-wider text-foreground">STOK SENKRONİZASYONU</div>
                                    <div className="text-[10px] text-secondary font-bold">Tüm mağazalarda tek bir stok havuzu kullan</div>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setIsStockSyncEnabled(!isStockSyncEnabled);
                                    showToast(isStockSyncEnabled ? "Stoklar ayrıştırıldı" : "Stoklar eşitlendi");
                                }}
                                className={`w-16 h-8 rounded-full relative transition-all duration-300 ${isStockSyncEnabled ? 'bg-rose-500' : 'bg-primary/10'}`}
                            >
                                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-lg ${isStockSyncEnabled ? 'left-9' : 'left-1'}`} />
                            </button>
                        </div>

                        {/* Stok Uyarı Sınırı */}
                        <div className="p-4 bg-primary/5 rounded-2xl border border-border space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-rose-500/10 rounded-xl">
                                        <AlertTriangle className="text-rose-500" />
                                    </div>
                                    <div>
                                        <div className="font-black text-sm uppercase tracking-wider text-foreground">STOK UYARI SINIRI</div>
                                        <div className="text-[10px] text-secondary font-bold text-rose-500/70">Ürün bu sayının altına düşünce "tehlikeli" alanı yanar</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="number"
                                        value={lowStockThreshold}
                                        onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 0)}
                                        className="w-20 bg-card border border-border rounded-xl px-3 py-2 text-center font-black text-primary outline-none focus:border-primary transition-all"
                                    />
                                    <span className="text-[10px] font-black text-secondary tracking-widest uppercase">ADET</span>
                                </div>
                            </div>
                            <p className="text-[9px] text-secondary/60 italic font-medium leading-relaxed uppercase">
                                * Bu ayar, ana ekrandaki "Kritik Stok" listesini ve ürün tablosundaki renkli uyarıları dinamik olarak değiştirir.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Security & System Info */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card space-y-6">
                    <div className="flex items-center gap-3 border-b border-border pb-4">
                        <Shield className="text-primary" />
                        <h2 className="font-black tracking-widest uppercase text-foreground">SİSTEM VE GÜVENLİK</h2>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 text-xs">
                            <span className="text-secondary font-bold uppercase">Versiyon</span>
                            <span className="font-black text-foreground px-3 py-1 bg-primary/5 rounded-lg border border-border">v{process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'} PRO</span>
                        </div>
                        <div className="flex items-center justify-between p-3 text-xs">
                            <span className="text-secondary font-bold uppercase">Veritabanı Durumu</span>
                            <span className="flex items-center gap-2 text-emerald-600 font-black">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                BAĞLI (SUPABASE)
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 text-xs">
                            <span className="text-secondary font-bold uppercase">Terminal Kimliği</span>
                            <span className="text-secondary font-mono">TR-KASAP-01-AF82</span>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border flex flex-col gap-2">
                        <button className="flex items-center justify-center gap-2 py-3 bg-primary/5 hover:bg-primary/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-foreground border border-border">
                            <Database size={14} className="text-primary" /> YEDEKLEME VE DIŞA AKTAR
                        </button>
                    </div>
                </motion.div>

                {/* Support/Info */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card space-y-6 bg-primary/5 border-primary/20">
                    <div className="flex items-center gap-3 border-b border-primary/10 pb-4">
                        <Info className="text-primary" />
                        <h2 className="font-black tracking-widest uppercase text-primary">DESTEK VE AKADEMİ</h2>
                    </div>

                    <p className="text-[10px] font-black text-secondary leading-relaxed uppercase tracking-[0.2em]">
                        JetPOS'u en verimli şekilde kullanmanız için hazırladığımız kılavuzlar ve eğitim materyallerine buradan ulaşabilirsiniz.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <a href="https://jetpos.pro/kilavuzlar" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl group hover:border-primary/50 transition-all">
                            <div className="flex items-center gap-3">
                                <BookOpen size={18} className="text-primary" />
                                <span className="text-xs font-black uppercase tracking-widest text-foreground">Kullanım Kılavuzları</span>
                            </div>
                            <ExternalLink size={14} className="group-hover:text-primary transition-colors" />
                        </a>
                        <a href="https://jetpos.pro/kilavuzlar#video" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl group hover:border-primary/50 transition-all text-purple-500">
                            <div className="flex items-center gap-3">
                                <PlayCircle size={18} />
                                <span className="text-xs font-black uppercase tracking-widest">Video Eğitimler</span>
                            </div>
                            <ExternalLink size={14} className="group-hover:text-primary transition-colors" />
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); showToast("Destek bileti modülü açılıyor..."); }} className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl group hover:border-rose-500/50 transition-all text-rose-500">
                            <div className="flex items-center gap-3">
                                <AlertTriangle size={18} />
                                <span className="text-xs font-black uppercase tracking-widest">Hata Bildirimi</span>
                            </div>
                            <ExternalLink size={14} className="group-hover:text-primary transition-colors" />
                        </a>
                        <a href="https://jetpos.pro/blog" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl group hover:border-indigo-500/50 transition-all text-indigo-500">
                            <div className="flex items-center gap-3">
                                <Zap size={18} />
                                <span className="text-xs font-black uppercase tracking-widest">Yenilikler (v1.5)</span>
                            </div>
                            <ExternalLink size={14} className="group-hover:text-primary transition-colors" />
                        </a>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
