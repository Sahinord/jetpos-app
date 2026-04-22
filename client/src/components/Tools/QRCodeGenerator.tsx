"use client";

import { useState, useRef, useEffect } from 'react';
import { 
    QrCode, 
    Wifi, 
    Globe, 
    Link as LinkIcon, 
    User, 
    Settings, 
    Download, 
    RefreshCw, 
    Palette,
    Text,
    Share2,
    Shield,
    Save,
    Trash2,
    History,
    Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTenant } from '@/lib/tenant-context';

declare const kjua: any;

type QRType = 'url' | 'wifi' | 'text' | 'vcard';

interface SavedQR {
    id: string;
    name: string;
    type: QRType;
    value: string;
    wifiName?: string;
    wifiPass?: string;
    wifiType?: string;
    backColor: string;
    frontColor: string;
    rounded: number;
    createdAt: string;
}

export default function QRCodeGenerator() {
    const { currentTenant } = useTenant();
    const [type, setType] = useState<QRType>('url');
    const [value, setValue] = useState('https://jetpos.com.tr');
    const [qrName, setQrName] = useState('');
    const [wifiName, setWifiName] = useState('');
    const [wifiPass, setWifiPass] = useState('');
    const [wifiType, setWifiType] = useState('WPA');
    const [backColor, setBackColor] = useState('#FFFFFF');
    const [frontColor, setFrontColor] = useState('#0F172A');
    const [size, setSize] = useState(400);
    const [rounded, setRounded] = useState(100);
    const [preview, setPreview] = useState<string | null>(null);
    const [savedQRs, setSavedQRs] = useState<SavedQR[]>([]);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

    // Load saved QRs for the current tenant
    useEffect(() => {
        if (currentTenant?.id) {
            const storageKey = `jetpos_qrs_${currentTenant.id}`;
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                try {
                    setSavedQRs(JSON.parse(saved));
                } catch (e) {
                    console.error("Kayıtlı QR'lar yüklenemedi");
                }
            }
        }
    }, [currentTenant?.id]);

    useEffect(() => {
        if (typeof window !== 'undefined' && !document.getElementById('kjua-script')) {
            const script = document.createElement('script');
            script.id = 'kjua-script';
            script.src = 'https://cdn.jsdelivr.net/npm/kjua@0.9.0/dist/kjua.min.js';
            script.async = true;
            script.onload = () => generateQR();
            document.head.appendChild(script);
        } else {
            generateQR();
        }
    }, [type, value, wifiName, wifiPass, wifiType, backColor, frontColor, size, rounded]);

    const generateQR = () => {
        if (typeof kjua === 'undefined') return;

        let qrText = value;
        if (type === 'wifi') {
            qrText = `WIFI:S:${wifiName};T:${wifiType};P:${wifiPass};;`;
        }

        const el = kjua({
            text: qrText,
            render: 'image',
            size: size,
            back: backColor,
            fill: frontColor,
            rounded: rounded,
            quiet: 1,
            mident: true,
        });

        if (el instanceof HTMLImageElement) {
            setPreview(el.src);
        }
    };

    const saveQR = () => {
        if (!currentTenant?.id) return;
        
        const newQR: SavedQR = {
            id: Date.now().toString(),
            name: qrName || (type === 'wifi' ? wifiName : value).substring(0, 20) || 'İsimsiz QR',
            type,
            value,
            wifiName,
            wifiPass,
            wifiType,
            backColor,
            frontColor,
            rounded,
            createdAt: new Date().toISOString()
        };

        const updated = [newQR, ...savedQRs];
        setSavedQRs(updated);
        localStorage.setItem(`jetpos_qrs_${currentTenant.id}`, JSON.stringify(updated));
        
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 2000);
        setQrName('');
    };

    const deleteQR = (id: string) => {
        if (!currentTenant?.id) return;
        const updated = savedQRs.filter(q => q.id !== id);
        setSavedQRs(updated);
        localStorage.setItem(`jetpos_qrs_${currentTenant.id}`, JSON.stringify(updated));
    };

    const loadQR = (qr: SavedQR) => {
        setType(qr.type);
        setValue(qr.value);
        if (qr.wifiName) setWifiName(qr.wifiName);
        if (qr.wifiPass) setWifiPass(qr.wifiPass);
        if (qr.wifiType) setWifiType(qr.wifiType);
        setBackColor(qr.backColor);
        setFrontColor(qr.frontColor);
        setRounded(qr.rounded);
    };

    const downloadQR = () => {
        if (!preview) return;
        const link = document.createElement('a');
        link.download = `jetpos_qr_${type}_${Date.now()}.png`;
        link.href = preview;
        link.click();
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight">QR Kod Merkezi</h1>
                    <p className="text-slate-400 mt-2">Tasarlayın, Kaydedin ve Paylaşın</p>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
                    <History className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">{savedQRs.length} Kayıtlı Kod</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Configuration Panel */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="glass-card p-8 space-y-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">KOD TİPİ</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['url', 'wifi', 'text'] as QRType[]).map(t => (
                                    <button 
                                        key={t}
                                        onClick={() => setType(t)}
                                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${type === t ? 'border-primary bg-primary/10 text-white shadow-lg' : 'border-white/5 text-slate-500 hover:border-white/10'}`}
                                    >
                                        {t === 'url' && <Globe size={18} />}
                                        {t === 'wifi' && <Wifi size={18} />}
                                        {t === 'text' && <Text size={18} />}
                                        <span className="text-[8px] font-black uppercase tracking-tight">{t === 'url' ? 'URL' : t === 'wifi' ? 'WiFi' : 'Metin'}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6 pt-4 border-t border-white/5">
                            {type === 'url' && (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">WEB SİTESİ</label>
                                    <input type="url" value={value} onChange={(e) => setValue(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm font-bold outline-none" />
                                </div>
                            )}
                            {type === 'wifi' && (
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">WiFi Adı</label>
                                        <input type="text" value={wifiName} onChange={(e) => setWifiName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm font-bold outline-none" />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Şifre</label>
                                        <input type="password" value={wifiPass} onChange={(e) => setWifiPass(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm font-bold outline-none" />
                                    </div>
                                </div>
                            )}
                            {type === 'text' && (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Mesaj</label>
                                    <textarea value={value} onChange={(e) => setValue(e.target.value)} rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm font-bold outline-none resize-none" />
                                </div>
                            )}
                        </div>

                        <div className="space-y-6 pt-4 border-t border-white/5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">KOD</label>
                                    <input type="color" value={frontColor} onChange={(e) => setFrontColor(e.target.value)} className="w-full h-10 rounded-xl bg-transparent border-none cursor-pointer" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">ZEMİN</label>
                                    <input type="color" value={backColor} onChange={(e) => setBackColor(e.target.value)} className="w-full h-10 rounded-xl bg-transparent border-none cursor-pointer" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[8px] font-black text-slate-600"><span>KESKİN</span><span>OVAL</span></div>
                                <input type="range" min="0" max="100" value={rounded} onChange={(e) => setRounded(Number(e.target.value))} className="w-full h-1 bg-white/5 rounded-lg appearance-none accent-primary" />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/5 space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">KAYIT ADI</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={qrName} 
                                    onChange={(e) => setQrName(e.target.value)} 
                                    placeholder="Bu tasarımı kaydet..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs outline-none"
                                />
                                <button 
                                    onClick={saveQR}
                                    className={`p-3 rounded-xl transition-all ${showSaveSuccess ? 'bg-emerald-500 text-white' : 'bg-primary text-white hover:opacity-90'}`}
                                >
                                    {showSaveSuccess ? <Check size={20} /> : <Save size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview & Saved List */}
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Live Preview */}
                    <div className="glass-card p-10 flex flex-col items-center justify-center text-center space-y-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <QrCode size={120} />
                        </div>

                        <div className="relative group p-6 bg-white rounded-[2rem] shadow-2xl transition-all hover:scale-105">
                            {preview ? (
                                <img src={preview} alt="QR" className="w-[240px] h-[240px] object-contain" />
                            ) : (
                                <div className="w-[240px] h-[240px] animate-pulse bg-slate-100 rounded-xl" />
                            )}
                        </div>

                        <div className="w-full space-y-4">
                            <button onClick={downloadQR} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs shadow-xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-95 transition-all">
                                <Download size={18} /> PNG OLARAK İNDİR
                            </button>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                                <Shield size={12} className="text-emerald-500" /> Optimize Edilmiş Tasarım
                            </p>
                        </div>
                    </div>

                    {/* Saved History */}
                    <div className="glass-card p-8 flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <History className="w-4 h-4 text-primary" />
                                KAYITLI QR'LAR
                            </h3>
                            <span className="text-[10px] font-black text-slate-600 uppercase italic">Tenant: {currentTenant?.company_name || 'JetPos'}</span>
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                            <AnimatePresence>
                                {savedQRs.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20">
                                        <QrCode size={48} className="mb-4 text-slate-500" />
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Henüz kayıt yok</p>
                                    </div>
                                ) : (
                                    savedQRs.map((qr) => (
                                        <motion.div 
                                            key={qr.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-2xl p-4 flex items-center gap-4 transition-all cursor-pointer"
                                            onClick={() => loadQR(qr)}
                                        >
                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-lg group-hover:scale-110 transition-transform">
                                                <img src={kjua({ text: qr.type === 'wifi' ? `WIFI:S:${qr.wifiName};T:${qr.wifiType};P:${qr.wifiPass};;` : qr.value, render: 'image', size: 100, quiet: 0, fill: qr.frontColor, back: qr.backColor, rounded: qr.rounded }).src} alt="Mini" className="w-full h-full object-contain" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-white truncate">{qr.name}</p>
                                                <p className="text-[10px] text-slate-500 truncate uppercase mt-0.5">{qr.type === 'wifi' ? 'WiFi' : 'URL'}</p>
                                            </div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); deleteQR(qr.id); }}
                                                className="p-2 text-slate-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="mt-8 pt-4 border-t border-white/5 text-center">
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter italic">Bu liste sadece bu dükkan ({currentTenant?.license_key}) için geçerlidir.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
