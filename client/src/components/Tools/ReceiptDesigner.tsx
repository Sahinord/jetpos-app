"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
    Printer, Building, FileText, MapPin, Phone, Image, Upload, Trash2,
    Eye, Save, RotateCcw, Sparkles, CheckCircle2, TestTube
} from "lucide-react";
import { useTenant } from "@/lib/tenant-context";

interface ReceiptDesignerProps {
    receiptSettings: any;
    setReceiptSettings: (settings: any) => void;
    showToast: (message: string, type?: any) => void;
}

export default function ReceiptDesigner({ receiptSettings, setReceiptSettings, showToast }: ReceiptDesignerProps) {
    const { currentTenant } = useTenant();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);

    const updateField = (field: string, value: any) => {
        setReceiptSettings({ ...receiptSettings, [field]: value });
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            showToast("Logo boyutu 2MB'dan küçük olmalıdır", "error");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            updateField('logoUrl', base64);
            showToast("Logo başarıyla yüklendi");
        };
        reader.readAsDataURL(file);
    };

    const removeLogo = () => {
        updateField('logoUrl', '');
        showToast("Logo kaldırıldı", "info");
    };

    const resetToDefaults = () => {
        setReceiptSettings({
            storeName: currentTenant?.company_name?.toUpperCase() || 'JETPOS MARKET',
            subtitle1: '',
            subtitle2: '',
            footerMessage: 'BİZİ TERCİH ETTİĞİNİZ İÇİN TEŞEKKÜRLER',
            footerNote1: 'MALİ DEĞERİ YOKTUR',
            footerNote2: 'BİLGİ FİŞİDİR',
            showLogo: false,
            logoUrl: '',
            phone: '',
            address: '',
            taxOffice: '',
            taxNumber: '',
        });
        showToast("Varsayılan ayarlar geri yüklendi", "info");
    };

    const turkishToAscii = (str: string) => {
        if (!str) return '';
        const map: any = {
            'ş': 's', 'Ş': 'S', 'ğ': 'g', 'Ğ': 'G',
            'ü': 'u', 'Ü': 'U', 'ö': 'o', 'Ö': 'O',
            'ç': 'c', 'Ç': 'C', 'ı': 'i', 'İ': 'I',
            '₺': 'TL'
        };
        return str.replace(/[şŞğĞüÜöÖçÇıİ₺]/g, c => map[c] || c);
    };

    const handleTestPrint = () => {
        const s = receiptSettings || {};
        setIsPrinting(true);
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { 
            background-color: #ffffff !important; 
            color: #000000 !important; 
            margin: 0; 
            padding: 0; 
            width: 100%; 
            font-family: monospace;
            font-weight: bold;
            letter-spacing: 0.5px;
        }
        .wrapper { width: 72mm; margin: 0 auto; padding: 0; }
        .center { text-align: center; }
        .table { width: 100%; border-collapse: collapse; }
        .bold { font-weight: 900; }
        .font-lg { font-size: 22px; }
        .font-md { font-size: 14px; }
        .font-sm { font-size: 11px; }
        .font-xs { font-size: 10px; }
        .dashed-hr { border-bottom: 2px dashed #000; margin: 5px 0; }
        .solid-hr { border-bottom: 3px solid #000; margin: 5px 0; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="center font-lg bold" style="margin-top:10px; letter-spacing: 2px;">${(s.storeName || 'JETPOS MARKET').toUpperCase()}</div>
        <div class="center font-xs" style="margin: 5px 0;">
            ${s.subtitle1 ? `<div>${s.subtitle1.toUpperCase()}</div>` : 'MODERN PERAKENDE SİSTEMLERİ'}
            ${s.subtitle2 ? `<div>${s.subtitle2.toUpperCase()}</div>` : 'GÜVENLİ VE HIZLI SATIŞ SİSTEMİ'}
        </div>
        
        <div class="dashed-hr"></div>
        
        <table class="table font-sm">
            <tr>
                <td align="left">TARİH: ${new Date().toLocaleDateString('tr-TR')}</td>
                <td align="right">SAAT: ${new Date().toLocaleTimeString('tr-TR')}</td>
            </tr>
            <tr>
                <td colspan="2" align="left">FİŞ NO: DEMO1234</td>
            </tr>
        </table>
        
        <div class="dashed-hr"></div>
        
        <table class="table font-xs">
            <tr>
                <td align="left" width="60%">ÜRÜN</td>
                <td align="center" width="20%">AD</td>
                <td align="right" width="20%">TUTAR</td>
            </tr>
        </table>
        <div style="border-bottom: 2px dashed #000; margin: 2px 0;"></div>
        
        <div class="font-sm" style="margin-top: 5px;">
            <div style="margin-bottom: 8px;">
                <div>EKMEK SOMUN</div>
                <table class="table">
                    <tr>
                        <td align="left">2 AD X ₺12.50</td>
                        <td align="right">₺25.00</td>
                    </tr>
                </table>
            </div>
            <div style="margin-bottom: 8px;">
                <div>SÜT 1LT</div>
                <table class="table">
                    <tr>
                        <td align="left">1 AD X ₺35.00</td>
                        <td align="right">₺35.00</td>
                    </tr>
                </table>
            </div>
            <div style="margin-bottom: 8px;">
                <div>PEYNİR 250GR</div>
                <table class="table">
                    <tr>
                        <td align="left">1 AD X ₺89.90</td>
                        <td align="right">₺89.90</td>
                    </tr>
                </table>
            </div>
        </div>
        
        <div class="solid-hr" style="margin-top: 10px;"></div>
        
        <table class="table" style="margin: 5px 0;">
            <tr>
                <td align="left" class="font-lg bold">TOPLAM:</td>
                <td align="right" class="font-lg bold">₺149.90</td>
            </tr>
        </table>
        
        <div class="dashed-hr"></div>
        
        <table class="table font-sm">
            <tr>
                <td align="left">ÖDEME TİPİ:</td>
                <td align="right">NAKİT</td>
            </tr>
        </table>
        
        <div class="dashed-hr"></div>
        
        <div class="center font-xs" style="margin-top:10px;">
            <div>BİZİ TERCİH ETTİĞİNİZ İÇİN TEŞEKKÜRLER</div>
            <div style="margin: 3px 0;">MALİ DEĞERİ YOKTUR</div>
            <div>BİLGİ FİŞİDİR</div>
        </div>
        
        <div style="height:40mm; text-align:center; font-size: 8px;">.</div>
    </div>
</body>
</html>`;

        const electron = (window as any).electron;
        if (electron?.isElectron) {
            const timeout = setTimeout(() => {
                setIsPrinting(false);
                showToast('Yazıcı yanıt vermedi.', 'error');
            }, 5000);

            try {
                const pName = localStorage.getItem('jetpos_receipt_printer') ||
                    localStorage.getItem('receiptPrinterName') ||
                    localStorage.getItem('jetpos_label_printer');

                electron.once('silent-print-result', (result: any) => {
                    clearTimeout(timeout);
                    setIsPrinting(false);
                    if (result.success) showToast('Test fişi gönderildi!', 'success');
                    else showToast(`Hata: ${result.error || 'Kontrol edin'}`, 'error');
                });
                electron.send('silent-print-receipt', { html, printerName: pName });
            } catch {
                clearTimeout(timeout);
                setIsPrinting(false);
                showToast('Electron yazdırma hatası', 'error');
            }
        } else {
            // Browser fallback
            try {
                const iframe = document.createElement('iframe');
                iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;opacity:0;';
                document.body.appendChild(iframe);
                const doc = iframe.contentDocument || iframe.contentWindow?.document;
                if (doc) {
                    doc.open();
                    doc.write(html);
                    doc.close();
                    setTimeout(() => {
                        iframe.contentWindow?.print();
                        setIsPrinting(false);
                        setTimeout(() => document.body.removeChild(iframe), 3000);
                    }, 500);
                }
            } catch {
                setIsPrinting(false);
            }
        }
    };

    const handleSave = () => {
        setIsSaved(true);
        showToast("Fiş ayarları kaydedildi!");
        setTimeout(() => setIsSaved(false), 2000);
    };

    const s = receiptSettings || {};

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/20 p-6 rounded-2xl border border-border"
            >
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                        <Printer className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-foreground tracking-tight">Fiş Düzenleyicisi</h2>
                        <p className="text-sm text-secondary font-medium">Bilgi fişlerinizi markanıza göre özelleştirin</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={resetToDefaults}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 hover:bg-primary/10 text-secondary hover:text-foreground border border-border rounded-xl text-xs font-bold transition-all"
                    >
                        <RotateCcw size={14} /> Varsayılana Dön
                    </button>
                    <button
                        onClick={handleTestPrint}
                        disabled={isPrinting}
                        className="flex items-center gap-2 px-5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded-xl text-xs font-black transition-all disabled:opacity-50"
                    >
                        <TestTube size={14} /> {isPrinting ? 'YAZDIRILIYOR...' : 'TEST YAZDIR'}
                    </button>
                    <button
                        onClick={handleSave}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg ${isSaved
                            ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                            : 'bg-violet-500 hover:bg-violet-600 text-white shadow-violet-500/30'
                            }`}
                    >
                        {isSaved ? <><CheckCircle2 size={14} /> KAYDEDİLDİ</> : <><Save size={14} /> KAYDET</>}
                    </button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
                {/* Left: Settings */}
                <div className="xl:col-span-3 space-y-6">
                    {/* Logo Section */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card space-y-4">
                        <div className="flex items-center gap-3 border-b border-border pb-4">
                            <div className="p-2.5 bg-violet-500/10 rounded-xl">
                                <Image className="text-violet-500 w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-sm uppercase tracking-widest text-foreground">LOGO</h3>
                                <p className="text-[10px] text-secondary font-bold">Fişin en üstüne yerleşecek logo</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {s.logoUrl ? (
                                <div className="relative group">
                                    <img src={s.logoUrl} alt="Logo" className="w-24 h-24 object-contain bg-white rounded-2xl border-2 border-border p-2" />
                                    <button onClick={removeLogo} className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ) : (
                                <button onClick={() => fileInputRef.current?.click()} className="w-24 h-24 border-2 border-dashed border-border hover:border-violet-500 rounded-2xl flex flex-col items-center justify-center gap-1 text-secondary cursor-pointer bg-primary/5 hover:bg-violet-500/5 transition-all">
                                    <Upload size={20} />
                                    <span className="text-[9px] font-bold uppercase tracking-widest">Yükle</span>
                                </button>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-secondary tracking-widest uppercase">FİŞTE LOGO GÖSTER</span>
                                    <button onClick={() => updateField('showLogo', !s.showLogo)} className={`w-14 h-7 rounded-full relative transition-all duration-300 ${s.showLogo ? 'bg-violet-500' : 'bg-primary/10'}`}>
                                        <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-md ${s.showLogo ? 'left-7' : 'left-0.5'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Store Info */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card space-y-4">
                        <div className="flex items-center gap-3 border-b border-border pb-4">
                            <div className="p-2.5 bg-blue-500/10 rounded-xl">
                                <Building className="text-blue-500 w-5 h-5" />
                            </div>
                            <h3 className="font-black text-sm uppercase tracking-widest text-foreground">MAĞAZA BİLGİLERİ</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-secondary uppercase tracking-widest">İŞLETME ADI</label>
                                <input type="text" value={s.storeName || ''} onChange={(e) => updateField('storeName', e.target.value)} className="w-full bg-primary/5 border border-border rounded-xl px-4 py-3 text-sm font-bold text-foreground outline-none focus:border-violet-500 transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest">ALT BAŞLIK 1</label>
                                    <input type="text" value={s.subtitle1 || ''} onChange={(e) => updateField('subtitle1', e.target.value)} className="w-full bg-primary/5 border border-border rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-violet-500 transition-all" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest">ALT BAŞLIK 2</label>
                                    <input type="text" value={s.subtitle2 || ''} onChange={(e) => updateField('subtitle2', e.target.value)} className="w-full bg-primary/5 border border-border rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-violet-500 transition-all" />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Contact Info */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card space-y-4">
                        <div className="flex items-center gap-3 border-b border-border pb-4">
                            <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                                <MapPin className="text-emerald-500 w-5 h-5" />
                            </div>
                            <h3 className="font-black text-sm uppercase tracking-widest text-foreground">İLETİŞİM & ADRES</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-secondary uppercase tracking-widest">ADRES</label>
                                <input type="text" value={s.address || ''} onChange={(e) => updateField('address', e.target.value)} className="w-full bg-primary/5 border border-border rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-violet-500 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-secondary uppercase tracking-widest">TELEFON</label>
                                <input type="text" value={s.phone || ''} onChange={(e) => updateField('phone', e.target.value)} className="w-full bg-primary/5 border border-border rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-violet-500 transition-all" />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Right: Live Preview */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="xl:col-span-2">
                    <div className="sticky top-6 space-y-4">
                        <div className="flex items-center justify-center gap-2 text-[10px] font-black text-secondary tracking-widest uppercase">
                            <Eye size={14} className="text-violet-500" /> CANLI ÖNİZLEME
                        </div>
                        <div className="bg-gradient-to-b from-gray-50 to-gray-100 rounded-3xl p-6 shadow-inner border border-border relative">
                            <div className="bg-white rounded-xl shadow-2xl mx-auto overflow-hidden" style={{ width: '100%', maxWidth: '300px', fontFamily: '"Courier New", Courier, monospace' }}>
                                {/* Receipt Designer Content matches POS Receipt.tsx exactly */}
                                <div style={{ textAlign: 'center', padding: '16px 12px 10px', borderBottom: '2px dashed #000' }}>
                                    {s.showLogo && s.logoUrl && (
                                        <div style={{ marginBottom: '8px' }}>
                                            <img src={s.logoUrl} style={{ maxWidth: '120px', maxHeight: '60px', margin: '0 auto', display: 'block', objectFit: 'contain' }} />
                                        </div>
                                    )}
                                    <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '2px', color: '#000' }}>{s.storeName || 'JETPOS MARKET'}</div>
                                    <div style={{ fontSize: '9px', fontWeight: 700, color: '#000', marginTop: '4px' }}>
                                        {s.subtitle1 && <div>{s.subtitle1.toUpperCase()}</div>}
                                        {s.subtitle2 && <div>{s.subtitle2.toUpperCase()}</div>}
                                        {s.address && <div style={{ marginTop: '2px' }}>{s.address.toUpperCase()}</div>}
                                    </div>
                                </div>

                                <div style={{ padding: '6px 12px', fontSize: '10px', fontWeight: 800, color: '#000', borderBottom: '1px dashed #000' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>TARİH: {new Date().toLocaleDateString('tr-TR')}</span>
                                        <span>SAAT: {new Date().toLocaleTimeString('tr-TR')}</span>
                                    </div>
                                    <div>FİŞ NO: DEMO-2024-001</div>
                                </div>

                                <div style={{ padding: '8px 12px' }}>
                                    {[
                                        { name: 'ÖRNEK ÜRÜN 1', qty: 2, price: 45.00 },
                                        { name: 'ÖRNEK ÜRÜN 2', qty: 1, price: 125.50 }
                                    ].map((item, i) => (
                                        <div key={i} style={{ marginBottom: '8px' }}>
                                            <div style={{ fontSize: '11px', fontWeight: 900, color: '#000' }}>{item.name}</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, color: '#000' }}>
                                                <span>{item.qty} AD X ₺{item.price.toFixed(2)}</span>
                                                <span style={{ fontWeight: 900 }}>₺{(item.qty * item.price).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ borderTop: '2px solid #000', margin: '0 12px' }} />
                                <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 900, color: '#000' }}>
                                    <span>TOPLAM:</span>
                                    <span>₺215.50</span>
                                </div>

                                <div style={{ textAlign: 'center', padding: '12px 12px 20px', borderTop: '2px dashed #000', marginTop: '10px' }}>
                                    <div style={{ fontSize: '9px', fontWeight: 900, color: '#000' }}>{s.footerMessage || 'TEŞEKKÜRLER'}</div>
                                    <div style={{ fontSize: '10px', fontWeight: 900, color: '#000', marginTop: '4px' }}>MALİ DEĞERİ YOKTUR</div>
                                    <div style={{ fontSize: '8px', fontWeight: 700, color: '#000' }}>BİLGİ FİŞİDİR</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
