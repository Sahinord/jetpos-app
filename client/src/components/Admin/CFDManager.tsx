"use client";

import { motion } from "framer-motion";
import { Monitor, ExternalLink, Sparkles, Layout, Image as ImageIcon, Eye, Settings, Info, Palette, ShoppingBag, Store, CreditCard, Clock, CloudSun, QrCode } from "lucide-react";
import { useState, useEffect } from "react";

export default function CFDManager({ settings, onUpdate, showToast, currentTenant }: any) {
    const [localSettings, setLocalSettings] = useState(settings || {
        welcomeTitle: currentTenant?.company_name?.toUpperCase() || 'HOŞGELDİNİZ',
        welcomeSubtitle: 'KEYİFLİ ALIŞVERİŞLER',
        showImages: true,
        primaryColor: '#3b82f6',
        backgroundColor: '#020617',
        accentColor: '#10b981',
        showCustomerName: false,
        theme: 'modern'
    });

    const colors = [
        '#020617', '#0f172a', '#1e293b', '#2d1b69', '#4c1d95', '#701a75',
        '#881337', '#7c2d12', '#431407', '#064e3b', '#065f46', '#14532d'
    ];

    const accentColors = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6',
        '#06b6d4', '#f97316', '#22c55e', '#6366f1', '#d946ef', '#a855f7'
    ];

    const handleUpdate = (newS: any) => {
        setLocalSettings(newS);
        onUpdate(newS);
        const channel = new BroadcastChannel("jetpos-display-sync");
        channel.postMessage({ type: 'SETTINGS_UPDATE', settings: newS });
        channel.close();
    };

    return (
        <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-2 px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                {/* Configuration Panel */}
                <div className="lg:col-span-4 xl:col-span-3 space-y-6">
                    <div className="glass-card !p-6 md:!p-8 space-y-8 h-full min-h-[calc(100vh-180px)] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center gap-3">
                            <Settings className="text-primary w-5 h-5" />
                            <h2 className="text-sm font-black uppercase tracking-widest text-white">TASARIM & AYARLAR</h2>
                        </div>

                        <button
                            onClick={() => window.open('/display', 'JetPosDisplay', 'width=1200,height=800')}
                            className="w-full flex items-center justify-center gap-3 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-xs"
                        >
                            <ExternalLink size={18} /> EKRANI AYRI PENCEREDE AÇ
                        </button>

                        <div className="space-y-6">
                            {/* Inputs */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-secondary tracking-widest uppercase pl-1">ÜST BAŞLIK (MARKA)</label>
                                <input
                                    type="text"
                                    value={localSettings.welcomeTitle}
                                    placeholder={currentTenant?.company_name || "HOŞGELDİNİZ"}
                                    onChange={(e) => handleUpdate({ ...localSettings, welcomeTitle: e.target.value.toUpperCase() })}
                                    className="w-full bg-black/40 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none transition-all shadow-inner"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-secondary tracking-widest uppercase pl-1">ALT MESAJ (SLOGAN)</label>
                                <input
                                    type="text"
                                    value={localSettings.welcomeSubtitle}
                                    onChange={(e) => handleUpdate({ ...localSettings, welcomeSubtitle: e.target.value.toUpperCase() })}
                                    className="w-full bg-black/40 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none transition-all shadow-inner"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-secondary tracking-widest uppercase pl-1">KAYAN YAZI (TICKER)</label>
                                <textarea
                                    rows={2}
                                    value={localSettings.marqueeText || "JETPOS İŞİNİZ JET HIZINDA • BU MAĞAZADA GÜVENLİ ÖDEME GEÇERLİDİR • KEYİFLİ ALIŞVERİŞLER DİLERİZ •"}
                                    onChange={(e) => handleUpdate({ ...localSettings, marqueeText: e.target.value.toUpperCase() })}
                                    className="w-full bg-black/40 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none transition-all shadow-inner resize-none"
                                />
                                <p className="text-[8px] text-secondary font-bold tracking-widest uppercase opacity-50 px-1">Örn: JET HIZINDA SATIŞ • GÜVENLİ ÖDEME •</p>
                            </div>

                            {/* Background Color selector (Canva style) */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-secondary tracking-widest uppercase pl-1 flex items-center gap-2">
                                    <Palette size={12} className="text-primary" /> ARKA PLAN RENGİ
                                </label>
                                <div className="grid grid-cols-6 gap-2">
                                    {colors.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => handleUpdate({ ...localSettings, backgroundColor: color })}
                                            className={`aspect-square rounded-lg border-2 transition-all ${localSettings.backgroundColor === color ? 'border-primary scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                    <div className="relative aspect-square">
                                        <input
                                            type="color"
                                            value={localSettings.backgroundColor}
                                            onChange={(e) => handleUpdate({ ...localSettings, backgroundColor: e.target.value })}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="w-full h-full rounded-lg border border-white/10 flex items-center justify-center bg-white/5 text-[10px] font-black" style={{ background: 'conic-gradient(red, yellow, green, cyan, blue, magenta, red)' }}>+</div>
                                    </div>
                                </div>
                            </div>

                            {/* Accent Color selector */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-secondary tracking-widest uppercase pl-1 flex items-center gap-2">
                                    <Sparkles size={12} className="text-amber-400" /> VURGU RENGİ
                                </label>
                                <div className="grid grid-cols-6 gap-2">
                                    {accentColors.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => handleUpdate({ ...localSettings, accentColor: color, primaryColor: color })}
                                            className={`aspect-square rounded-lg border-2 transition-all ${localSettings.accentColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="pt-2 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-secondary tracking-widest uppercase pl-1">TANITIM BAŞLIĞI (BOŞKEN)</label>
                                    <input
                                        type="text"
                                        value={localSettings.promoTitle || "JETPOS"}
                                        onChange={(e) => handleUpdate({ ...localSettings, promoTitle: e.target.value.toUpperCase() })}
                                        className="w-full bg-black/40 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none transition-all shadow-inner"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-secondary tracking-widest uppercase pl-1">TANITIM SLOGANI</label>
                                    <input
                                        type="text"
                                        value={localSettings.promoSubtitle || "İŞİNİZ JET HIZINDA"}
                                        onChange={(e) => handleUpdate({ ...localSettings, promoSubtitle: e.target.value.toUpperCase() })}
                                        className="w-full bg-black/40 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none transition-all shadow-inner"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-primary/5 transition-all cursor-pointer"
                                    onClick={() => handleUpdate({ ...localSettings, showImages: !localSettings.showImages })}>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                                            <ImageIcon size={16} className="text-indigo-400" />
                                        </div>
                                        <span className="text-xs font-bold text-white uppercase tracking-wider">ÜRÜN GÖRSELLERİ</span>
                                    </div>
                                    <div className={`w-10 h-5 rounded-full relative transition-all ${localSettings.showImages ? 'bg-indigo-500' : 'bg-white/10'}`}>
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${localSettings.showImages ? 'left-6' : 'left-1'}`} />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-primary/5 transition-all">
                                    <div className="flex items-center justify-between cursor-pointer" onClick={() => handleUpdate({ ...localSettings, showMarquee: !localSettings.showMarquee })}>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                                <Layout size={16} className="text-amber-400" />
                                            </div>
                                            <span className="text-xs font-bold text-white uppercase tracking-wider">KAYAN YAZI GÖSTER</span>
                                        </div>
                                        <div className={`w-10 h-5 rounded-full relative transition-all ${localSettings.showMarquee !== false ? 'bg-amber-500' : 'bg-white/10'}`}>
                                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${localSettings.showMarquee !== false ? 'left-6' : 'left-1'}`} />
                                        </div>
                                    </div>

                                    {localSettings.showMarquee !== false && (
                                        <div className="space-y-4 pt-2 border-t border-white/5">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[10px] font-black text-secondary tracking-widest uppercase">AKINŞ HIZI</label>
                                                <span className="text-[10px] font-black text-white">{localSettings.marqueeSpeed || 30}sn</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="5"
                                                max="60"
                                                step="5"
                                                value={localSettings.marqueeSpeed || 30}
                                                onChange={(e) => handleUpdate({ ...localSettings, marqueeSpeed: parseInt(e.target.value) })}
                                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Widgets Section */}
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                                    <label className="text-[10px] font-black text-secondary tracking-widest uppercase pl-1">EKRAN ARAÇLARI (WIDGETS)</label>

                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => handleUpdate({ ...localSettings, showClock: !localSettings.showClock })}
                                            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${localSettings.showClock ? 'bg-primary/20 border-primary/50 text-white' : 'bg-black/20 border-white/10 text-white/40'}`}>
                                            <Clock size={20} />
                                            <span className="text-[10px] font-bold">SAAT</span>
                                        </button>
                                        <button onClick={() => handleUpdate({ ...localSettings, showWeather: !localSettings.showWeather })}
                                            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${localSettings.showWeather ? 'bg-indigo-500/20 border-indigo-500/50 text-white' : 'bg-black/20 border-white/10 text-white/40'}`}>
                                            <CloudSun size={20} />
                                            <span className="text-[10px] font-bold">HAVA DURUMU</span>
                                        </button>
                                    </div>

                                    <div className="pt-2 space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-2">
                                                <QrCode size={16} className="text-secondary" />
                                                <span className="text-[10px] font-bold text-white uppercase">KAMPANYA QR</span>
                                            </div>
                                            <div onClick={() => handleUpdate({ ...localSettings, showQR: !localSettings.showQR })}
                                                className={`w-8 h-4 rounded-full relative transition-all cursor-pointer ${localSettings.showQR ? 'bg-emerald-500' : 'bg-white/10'}`}>
                                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${localSettings.showQR ? 'left-4.5' : 'left-0.5'}`} />
                                            </div>
                                        </div>

                                        {localSettings.showQR && (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                <input
                                                    type="text"
                                                    placeholder="KAMPANYA METNİ (ÖRN: %10 İNDİRİM)"
                                                    value={localSettings.qrText || ""}
                                                    onChange={(e) => handleUpdate({ ...localSettings, qrText: e.target.value.toUpperCase() })}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] font-bold text-white outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="LİNK VEYA MESAJ"
                                                    value={localSettings.qrLink || ""}
                                                    onChange={(e) => handleUpdate({ ...localSettings, qrLink: e.target.value })}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] font-bold text-white outline-none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 space-y-3">
                            <div className="flex items-center gap-2">
                                <Info size={14} className="text-primary" />
                                <span className="text-[10px] font-black text-primary tracking-widest uppercase">PRO İPUCU</span>
                            </div>
                            <p className="text-[9px] text-white/60 font-bold leading-relaxed uppercase">
                                Arka plan rengini seçerken koyu tonlar (Siyah/Lacivert) göz yorgunluğunu azaltır ve şıklığı artırır.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Preview Panel */}
                <div className="lg:col-span-8 space-y-6 flex flex-col">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <Eye className="text-primary w-4 h-4" />
                            <h2 className="text-[10px] font-black uppercase tracking-widest text-secondary">CANLI ÖNİZLEME</h2>
                        </div>
                        <div className="flex gap-2">
                            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-white/40 tracking-widest uppercase">
                                {localSettings.backgroundColor}
                            </div>
                            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-black text-emerald-500 tracking-widest">
                                CANLI
                            </div>
                        </div>
                    </div>

                    <div className="relative flex-1 min-h-[500px] rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden transition-all duration-500 box-content" style={{ backgroundColor: localSettings.backgroundColor }}>
                        {/* Simulation of display/page content */}
                        <div className="absolute inset-0 p-12 flex flex-col pointer-events-none origin-center space-y-8">
                            <div className="flex items-center justify-between bg-white/5 backdrop-blur-3xl border border-white/10 p-6 rounded-[2rem]">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: localSettings.accentColor }}>
                                        <ShoppingBag size={28} className="text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-black text-white tracking-tighter">{localSettings.welcomeTitle || currentTenant?.company_name?.toUpperCase() || 'HOŞGELDİNİZ'}</h1>
                                        <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">JETPOS MÜŞTERİ PANELİ</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">DURUM</div>
                                    <div className="text-sm font-black flex items-center gap-2 text-white">
                                        <Sparkles size={14} style={{ color: localSettings.accentColor }} />
                                        {localSettings.welcomeSubtitle}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 flex gap-8">
                                <div className="w-[45%] bg-white/5 border border-white/10 rounded-[3rem] p-10 flex flex-col items-center justify-center text-center space-y-6">
                                    {localSettings.showImages ? (
                                        <div className="w-40 h-40 bg-white/5 rounded-[2.5rem] border border-white/10 flex items-center justify-center shadow-2xl">
                                            <ImageIcon className="text-white/5" size={64} />
                                        </div>
                                    ) : (
                                        <div className="w-32 h-32 rounded-full flex items-center justify-center bg-white/5">
                                            <Store size={64} className="text-white/10" />
                                        </div>
                                    )}
                                    <div className="space-y-4">
                                        <div className="text-3xl font-black text-white tracking-tight uppercase">Örnek Ürün</div>
                                        <div className="text-5xl font-black" style={{ color: localSettings.accentColor }}>₺145.00</div>
                                    </div>
                                </div>

                                <div className="flex-1 bg-white/5 border border-white/5 rounded-[3rem] p-10 flex flex-col">
                                    <div className="flex justify-between text-[10px] font-black text-white/20 px-2 mb-6 tracking-widest uppercase">
                                        <span>SEPETTEKİ ÜRÜNLER (2)</span>
                                        <span>TUTAR</span>
                                    </div>
                                    <div className="space-y-4 flex-1">
                                        <div className="flex justify-between items-center text-white font-bold p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black">1</div>
                                                <span className="text-sm">Filtre Kahve (S)</span>
                                            </div>
                                            <span className="font-black">₺85.00</span>
                                        </div>
                                        <div className="flex justify-between items-center text-white/40 font-bold p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-transparent border border-white/5 flex items-center justify-center text-[10px] font-black text-white/10">1</div>
                                                <span className="text-sm">Donut Karamel</span>
                                            </div>
                                            <span className="font-black">₺60.00</span>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-8 border-t-2 border-white/5 flex justify-between items-end">
                                        <div className="space-y-2">
                                            <div className="text-[11px] font-black text-white/20 tracking-widest uppercase">TOPLAM ÖDENECEK</div>
                                            <div className="text-7xl font-black text-white tracking-tighter shadow-sm">₺145.00</div>
                                        </div>
                                        <div className="flex flex-col items-center gap-2 mb-4">
                                            <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: localSettings.accentColor }} />
                                            <CreditCard size={20} className="text-white/20" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
