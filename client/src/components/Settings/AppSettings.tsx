"use client";

import { motion } from "framer-motion";
import {
    Volume2, VolumeX, Monitor,
    Palette, CheckCircle2,
    Shield, Bell, Database,
    Info, ExternalLink, Users
} from "lucide-react";

export default function AppSettings({ theme, setTheme, isBeepEnabled, setIsBeepEnabled, showHelpIcons, setShowHelpIcons, isEmployeeModuleEnabled, setIsEmployeeModuleEnabled, showToast }: any) {
    const themes = [
        { id: 'modern', name: 'MODERN DARK', color: 'bg-primary', desc: 'Sleek ve modern bir arayüz' },
        { id: 'light', name: 'GÜNEŞ IŞIĞI', color: 'bg-white', desc: 'Aydınlık ve ferah çalışma alanı' },
        { id: 'wood', name: 'KLASİK AHŞAP', color: 'bg-[#8b4513]', desc: 'Sıcak ve nostaljik hesap makinesi' },
        { id: 'glass', name: 'CAM KABARCIK', color: 'bg-blue-400', desc: 'Yüksek derinlikli modern cam' }
    ];


    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black tracking-widest uppercase mb-2 text-foreground">UYGULAMA AYARLARI</h1>
                <p className="text-secondary font-bold text-sm uppercase tracking-wider">Terminal ve kullanıcı tercihlerinizi yönetin</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                        <h2 className="font-black tracking-widest uppercase text-primary">DESTEK VE BİLGİ</h2>
                    </div>

                    <p className="text-sm font-bold text-secondary leading-relaxed uppercase tracking-wider">
                        Kardeşler Kasap Muhasebe ve POS terminali, yerel işletmeler için özel olarak geliştirilmiştir. Teknik destek için bizimle iletişime geçebilirsiniz.
                    </p>

                    <div className="flex flex-col gap-3">
                        <a href="#" className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-border group hover:border-primary/50 transition-all">
                            <span className="text-xs font-black uppercase tracking-widest text-foreground">Kullanım Klavuzu</span>
                            <ExternalLink size={14} className="group-hover:text-primary transition-colors" />
                        </a>
                        <a href="#" className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-border group hover:border-primary/50 transition-all">
                            <span className="text-xs font-black uppercase tracking-widest text-foreground">Hata Bildirimi</span>
                            <ExternalLink size={14} className="group-hover:text-primary transition-colors" />
                        </a>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
