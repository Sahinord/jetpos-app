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

    const handleTestPrint = () => {
        setIsPrinting(true);
        const logoHtml = (s.showLogo && s.logoUrl) ? `<div style="margin-bottom:8px;"><img src="${s.logoUrl}" style="max-width:120px;max-height:60px;margin:0 auto;display:block;object-fit:contain;" /></div>` : '';
        const addressHtml = s.address ? `<div style="font-size:9px;font-weight:900;color:#000!important;">${s.address}</div>` : '';
        const phoneHtml = s.phone ? `<div style="font-size:9px;font-weight:900;color:#000!important;">TEL: ${s.phone}</div>` : '';
        const taxHtml = (s.taxOffice || s.taxNumber) ? `<div style="font-size:9px;font-weight:900;color:#000!important;">${s.taxOffice ? 'V.D: ' + s.taxOffice + ' ' : ''}${s.taxNumber ? 'V.N: ' + s.taxNumber : ''}</div>` : '';

        const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
    @page { margin: 0; size: 80mm auto; }
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Courier New', Courier, monospace; width: 80mm; padding: 2mm; color: #000 !important; background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    div, span, p { color: #000 !important; }
</style></head><body>
    <div style="text-align:center;margin-bottom:8px;">
        ${logoHtml}
        <div style="font-size:20px;font-weight:900;letter-spacing:2px;color:#000!important;">${s.storeName || 'MAĞAZA ADI'}</div>
        ${s.subtitle1 ? `<div style="font-size:10px;font-weight:900;color:#000!important;">${s.subtitle1}</div>` : ''}
        ${s.subtitle2 ? `<div style="font-size:10px;font-weight:900;color:#000!important;">${s.subtitle2}</div>` : ''}
        ${addressHtml}${phoneHtml}${taxHtml}
        <div style="margin:4px 0;font-weight:900;color:#000!important;">********************************</div>
    </div>
    <div style="font-size:12px;font-weight:900;margin-bottom:6px;color:#000!important;">
        <div style="display:flex;justify-content:space-between;"><span>TARİH: ${new Date().toLocaleDateString('tr-TR')}</span><span>SAAT: ${new Date().toLocaleTimeString('tr-TR')}</span></div>
        <div>FİŞ NO: TEST-${Date.now().toString().slice(-6)}</div>
        <div style="margin:4px 0;color:#000!important;">--------------------------------</div>
    </div>
    <div style="font-size:11px;font-weight:900;display:flex;border-bottom:2px solid #000;padding-bottom:2px;color:#000!important;"><span style="flex:1">ÜRÜN</span><span style="width:40px;text-align:center;">AD</span><span style="width:60px;text-align:right;">TUTAR</span></div>
    <div style="margin-bottom:6px;">
        <div style="padding:4px 0;border-bottom:1px dashed #000;"><div style="font-size:13px;font-weight:900;color:#000;">TEST ÜRÜN 1</div><div style="display:flex;justify-content:space-between;font-size:12px;font-weight:900;color:#000;"><span>2 AD X ₺25.00</span><span>₺50.00</span></div></div>
        <div style="padding:4px 0;border-bottom:1px dashed #000;"><div style="font-size:13px;font-weight:900;color:#000;">TEST ÜRÜN 2</div><div style="display:flex;justify-content:space-between;font-size:12px;font-weight:900;color:#000;"><span>1 AD X ₺35.00</span><span>₺35.00</span></div></div>
    </div>
    <div style="font-weight:900;color:#000!important;">********************************</div>
    <div style="font-size:16px;font-weight:900;margin:4px 0;color:#000!important;"><div style="display:flex;justify-content:space-between;"><span>TOPLAM:</span><span>₺85.00</span></div></div>
    <div style="font-size:12px;font-weight:900;margin-top:4px;color:#000!important;"><div style="display:flex;justify-content:space-between;"><span>ÖDEME TİPİ:</span><span>NAKİT</span></div></div>
    <div style="margin:8px 0;font-weight:900;color:#000!important;">--------------------------------</div>
    <div style="text-align:center;font-weight:900;color:#000!important;">
        ${s.footerMessage ? `<div style="font-size:10px;">${s.footerMessage}</div>` : ''}
        ${s.footerNote1 ? `<div style="margin-top:4px;font-size:12px;">${s.footerNote1}</div>` : ''}
        ${s.footerNote2 ? `<div style="font-size:10px;">${s.footerNote2}</div>` : ''}
    </div>
    <div style="height:20mm;"></div>
</body></html>`;

        // Electron silent print (preload köprüsü)
        const electron = (window as any).electron;
        if (electron?.isElectron) {
            const timeout = setTimeout(() => {
                setIsPrinting(false);
                showToast('Yazıcıdan yanıt alınamadı. Yazıcı bağlantısını kontrol edin.', 'error');
            }, 5000);

            try {
                electron.once('silent-print-result', (result: { success: boolean }) => {
                    clearTimeout(timeout);
                    setIsPrinting(false);
                    showToast(result.success ? 'Test fişi yazdırıldı!' : 'Yazdırma başarısız. Yazıcı bağlı mı?', result.success ? 'success' : 'error');
                });
                electron.send('silent-print-receipt', { html });
            } catch {
                clearTimeout(timeout);
                setIsPrinting(false);
                showToast('Electron yazdırma hatası', 'error');
            }
        } else if ((window as any).require) {
            // Legacy fallback
            const timeout = setTimeout(() => {
                setIsPrinting(false);
                showToast('Yazıcıdan yanıt alınamadı.', 'error');
            }, 5000);

            try {
                const { ipcRenderer } = (window as any).require('electron');
                ipcRenderer.once('silent-print-result', (_event: any, result: { success: boolean }) => {
                    clearTimeout(timeout);
                    setIsPrinting(false);
                    showToast(result.success ? 'Test fişi yazdırıldı!' : 'Yazdırma başarısız.', result.success ? 'success' : 'error');
                });
                ipcRenderer.send('silent-print-receipt', { html });
            } catch {
                clearTimeout(timeout);
                setIsPrinting(false);
                showToast('Electron yazdırma hatası', 'error');
            }
        } else {
            // Tarayıcı modu: iframe ile yazdır
            try {
                const iframe = document.createElement('iframe');
                iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;opacity:0;pointer-events:none;';
                document.body.appendChild(iframe);
                const doc = iframe.contentDocument || iframe.contentWindow?.document;
                if (doc) {
                    doc.open();
                    doc.write(html);
                    doc.close();

                    // doc.write sonrası iframe zaten yüklü, setTimeout ile yazdır
                    setTimeout(() => {
                        try {
                            iframe.contentWindow?.print();
                        } catch (e) {
                            console.error('Print error:', e);
                        }
                        setIsPrinting(false);
                        showToast('Test fişi yazdırma penceresi açıldı');
                        setTimeout(() => {
                            try { document.body.removeChild(iframe); } catch {}
                        }, 3000);
                    }, 300);
                } else {
                    setIsPrinting(false);
                    showToast('İframe oluşturulamadı', 'error');
                }
            } catch {
                setIsPrinting(false);
                showToast('Yazdırma hatası oluştu', 'error');
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
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg ${
                            isSaved
                                ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                                : 'bg-violet-500 hover:bg-violet-600 text-white shadow-violet-500/30'
                        }`}
                    >
                        {isSaved ? <><CheckCircle2 size={14} /> KAYDEDİLDİ</> : <><Save size={14} /> KAYDET</>}
                    </button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
                {/* Sol: Ayarlar (3 kolon) */}
                <div className="xl:col-span-3 space-y-6">
                    {/* Logo Yükleme */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card space-y-4">
                        <div className="flex items-center gap-3 border-b border-border pb-4">
                            <div className="p-2.5 bg-violet-500/10 rounded-xl">
                                <Image className="text-violet-500 w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-sm uppercase tracking-widest text-foreground">LOGO</h3>
                                <p className="text-[10px] text-secondary font-bold">Fişin en üstüne ortaya yerleşecek (PNG veya JPG, max 2MB)</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {s.logoUrl ? (
                                <div className="relative group">
                                    <img
                                        src={s.logoUrl}
                                        alt="Logo"
                                        className="w-24 h-24 object-contain bg-white rounded-2xl border-2 border-border p-2 shadow-md"
                                    />
                                    <button
                                        onClick={removeLogo}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-24 h-24 border-2 border-dashed border-border hover:border-violet-500/50 rounded-2xl flex flex-col items-center justify-center gap-1 text-secondary hover:text-violet-500 transition-all cursor-pointer bg-primary/5 hover:bg-violet-500/5"
                                >
                                    <Upload size={20} />
                                    <span className="text-[9px] font-bold uppercase">Yükle</span>
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/jpg"
                                className="hidden"
                                onChange={handleLogoUpload}
                            />
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-secondary tracking-widest uppercase">FİŞTE LOGO GÖSTER</span>
                                    <button
                                        onClick={() => updateField('showLogo', !s.showLogo)}
                                        className={`w-14 h-7 rounded-full relative transition-all duration-300 ${s.showLogo ? 'bg-violet-500' : 'bg-primary/10'}`}
                                    >
                                        <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-lg ${s.showLogo ? 'left-7' : 'left-0.5'}`} />
                                    </button>
                                </div>
                                <p className="text-[9px] text-secondary/60 italic font-medium leading-relaxed">
                                    {s.logoUrl ? "✅ Logo yüklendi. Toggle ile fiş üzerinde gösterilmesini kontrol edin." : "Logo yükleyerek fişlerinize profesyonel bir görünüm kazandırın."}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Mağaza Bilgileri */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card space-y-4">
                        <div className="flex items-center gap-3 border-b border-border pb-4">
                            <div className="p-2.5 bg-blue-500/10 rounded-xl">
                                <Building className="text-blue-500 w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-sm uppercase tracking-widest text-foreground">MAĞAZA BİLGİLERİ</h3>
                                <p className="text-[10px] text-secondary font-bold">Fişin başlık kısmında görünecek işletme bilgileri</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-secondary tracking-widest uppercase">MAĞAZA / İŞLETME ADI *</label>
                                <input
                                    type="text"
                                    value={s.storeName || ''}
                                    onChange={(e) => updateField('storeName', e.target.value)}
                                    placeholder="Örn: SAHINORD MARKET"
                                    className="w-full bg-primary/5 border border-border rounded-xl px-4 py-3 text-sm font-bold text-foreground outline-none focus:border-violet-500/50 transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-secondary tracking-widest uppercase">ALT BAŞLIK 1</label>
                                    <input
                                        type="text"
                                        value={s.subtitle1 || ''}
                                        onChange={(e) => updateField('subtitle1', e.target.value)}
                                        placeholder="Örn: MODERN PERAKENDE"
                                        className="w-full bg-primary/5 border border-border rounded-xl px-4 py-2.5 text-xs font-bold text-foreground outline-none focus:border-violet-500/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-secondary tracking-widest uppercase">ALT BAŞLIK 2</label>
                                    <input
                                        type="text"
                                        value={s.subtitle2 || ''}
                                        onChange={(e) => updateField('subtitle2', e.target.value)}
                                        placeholder="Örn: GÜVENLİ SATIŞ"
                                        className="w-full bg-primary/5 border border-border rounded-xl px-4 py-2.5 text-xs font-bold text-foreground outline-none focus:border-violet-500/50 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* İletişim Bilgileri */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card space-y-4">
                        <div className="flex items-center gap-3 border-b border-border pb-4">
                            <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                                <MapPin className="text-emerald-500 w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-sm uppercase tracking-widest text-foreground">İLETİŞİM & ADRES</h3>
                                <p className="text-[10px] text-secondary font-bold">Fişte görüntülenecek adres ve telefon bilgileri</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-secondary tracking-widest uppercase">ADRES</label>
                                <input
                                    type="text"
                                    value={s.address || ''}
                                    onChange={(e) => updateField('address', e.target.value)}
                                    placeholder="Örn: Atatürk Cad. No:15 Kadıköy/İstanbul"
                                    className="w-full bg-primary/5 border border-border rounded-xl px-4 py-2.5 text-xs font-bold text-foreground outline-none focus:border-violet-500/50 transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-secondary tracking-widest uppercase">TELEFON</label>
                                <input
                                    type="text"
                                    value={s.phone || ''}
                                    onChange={(e) => updateField('phone', e.target.value)}
                                    placeholder="Örn: 0212 555 1234"
                                    className="w-full bg-primary/5 border border-border rounded-xl px-4 py-2.5 text-xs font-bold text-foreground outline-none focus:border-violet-500/50 transition-all"
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Vergi Bilgileri */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card space-y-4">
                        <div className="flex items-center gap-3 border-b border-border pb-4">
                            <div className="p-2.5 bg-amber-500/10 rounded-xl">
                                <FileText className="text-amber-500 w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-sm uppercase tracking-widest text-foreground">VERGİ BİLGİLERİ</h3>
                                <p className="text-[10px] text-secondary font-bold">Vergi dairesi ve vergi numarası</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-secondary tracking-widest uppercase">VERGİ DAİRESİ</label>
                                <input
                                    type="text"
                                    value={s.taxOffice || ''}
                                    onChange={(e) => updateField('taxOffice', e.target.value)}
                                    placeholder="Örn: KADIKÖY"
                                    className="w-full bg-primary/5 border border-border rounded-xl px-4 py-2.5 text-xs font-bold text-foreground outline-none focus:border-violet-500/50 transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-secondary tracking-widest uppercase">VERGİ NUMARASI</label>
                                <input
                                    type="text"
                                    value={s.taxNumber || ''}
                                    onChange={(e) => updateField('taxNumber', e.target.value)}
                                    placeholder="Örn: 1234567890"
                                    className="w-full bg-primary/5 border border-border rounded-xl px-4 py-2.5 text-xs font-bold text-foreground outline-none focus:border-violet-500/50 transition-all"
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Footer Mesajları */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card space-y-4">
                        <div className="flex items-center gap-3 border-b border-border pb-4">
                            <div className="p-2.5 bg-rose-500/10 rounded-xl">
                                <Sparkles className="text-rose-500 w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-sm uppercase tracking-widest text-foreground">FİŞ ALT MESAJLARI</h3>
                                <p className="text-[10px] text-secondary font-bold">Fişin alt kısmında görünecek teşekkür ve bilgi mesajları</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-secondary tracking-widest uppercase">TEŞEKKÜR MESAJI</label>
                                <input
                                    type="text"
                                    value={s.footerMessage || ''}
                                    onChange={(e) => updateField('footerMessage', e.target.value)}
                                    placeholder="Örn: BİZİ TERCİH ETTİĞİNİZ İÇİN TEŞEKKÜRLER"
                                    className="w-full bg-primary/5 border border-border rounded-xl px-4 py-2.5 text-xs font-bold text-foreground outline-none focus:border-violet-500/50 transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-secondary tracking-widest uppercase">NOT 1</label>
                                    <input
                                        type="text"
                                        value={s.footerNote1 || ''}
                                        onChange={(e) => updateField('footerNote1', e.target.value)}
                                        placeholder="Örn: MALİ DEĞERİ YOKTUR"
                                        className="w-full bg-primary/5 border border-border rounded-xl px-4 py-2.5 text-xs font-bold text-foreground outline-none focus:border-violet-500/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-secondary tracking-widest uppercase">NOT 2</label>
                                    <input
                                        type="text"
                                        value={s.footerNote2 || ''}
                                        onChange={(e) => updateField('footerNote2', e.target.value)}
                                        placeholder="Örn: BİLGİ FİŞİDİR"
                                        className="w-full bg-primary/5 border border-border rounded-xl px-4 py-2.5 text-xs font-bold text-foreground outline-none focus:border-violet-500/50 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Sağ: Canlı Önizleme (2 kolon) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="xl:col-span-2"
                >
                    <div className="sticky top-6 space-y-4">
                        <div className="flex items-center justify-center gap-2 text-[10px] font-black text-secondary tracking-widest uppercase">
                            <Eye size={14} className="text-violet-500" />
                            CANLI ÖNİZLEME
                        </div>

                        <div className="bg-gradient-to-b from-gray-50 to-gray-100 rounded-3xl p-6 shadow-inner border border-border relative overflow-hidden">
                            {/* Paper shadow effect */}
                            <div className="absolute inset-x-6 top-3 h-2 bg-black/5 rounded-full blur-sm" />

                            <div className="bg-white rounded-xl shadow-2xl mx-auto overflow-hidden relative" style={{ width: '100%', maxWidth: '300px', fontFamily: '"Courier New", Courier, monospace' }}>
                                {/* Receipt Content */}
                                <div style={{ textAlign: 'center', padding: '16px 12px 10px', borderBottom: '2px dashed #333' }}>
                                    {/* Logo */}
                                    {s.showLogo && s.logoUrl && (
                                        <div style={{ marginBottom: '8px' }}>
                                            <img
                                                src={s.logoUrl}
                                                alt="Logo"
                                                style={{ maxWidth: '120px', maxHeight: '60px', margin: '0 auto', objectFit: 'contain' }}
                                            />
                                        </div>
                                    )}
                                    <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '2px', color: '#000' }}>{s.storeName || 'MAĞAZA ADI'}</div>
                                    {s.subtitle1 && <div style={{ fontSize: '9px', fontWeight: 700, color: '#333', marginTop: '2px' }}>{s.subtitle1}</div>}
                                    {s.subtitle2 && <div style={{ fontSize: '9px', fontWeight: 700, color: '#333' }}>{s.subtitle2}</div>}
                                    {s.address && <div style={{ fontSize: '8px', fontWeight: 700, color: '#555', marginTop: '4px' }}>{s.address}</div>}
                                    {s.phone && <div style={{ fontSize: '8px', fontWeight: 700, color: '#555' }}>TEL: {s.phone}</div>}
                                    {(s.taxOffice || s.taxNumber) && (
                                        <div style={{ fontSize: '8px', fontWeight: 700, color: '#555', marginTop: '2px' }}>
                                            {s.taxOffice && <span>V.D: {s.taxOffice} </span>}
                                            {s.taxNumber && <span>V.N: {s.taxNumber}</span>}
                                        </div>
                                    )}
                                </div>

                                {/* Date */}
                                <div style={{ padding: '6px 12px', fontSize: '10px', fontWeight: 800, color: '#000', borderBottom: '1px dashed #999' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>TARİH: {new Date().toLocaleDateString('tr-TR')}</span>
                                        <span>SAAT: {new Date().toLocaleTimeString('tr-TR')}</span>
                                    </div>
                                    <div>FİŞ NO: DEMO1234</div>
                                </div>

                                {/* Items Header */}
                                <div style={{ display: 'flex', padding: '5px 12px', fontSize: '9px', fontWeight: 900, color: '#000', borderBottom: '2px solid #000' }}>
                                    <span style={{ flex: 1 }}>ÜRÜN</span>
                                    <span style={{ width: '30px', textAlign: 'center' }}>AD</span>
                                    <span style={{ width: '55px', textAlign: 'right' }}>TUTAR</span>
                                </div>

                                {/* Demo Items */}
                                {[
                                    { name: 'EKMEK SOMUN', qty: 2, price: 12.50 },
                                    { name: 'SÜT 1LT', qty: 1, price: 35.00 },
                                    { name: 'PEYNİR 250GR', qty: 1, price: 89.90 },
                                ].map((item, idx) => (
                                    <div key={idx} style={{ padding: '4px 12px', borderBottom: '1px dashed #ddd' }}>
                                        <div style={{ fontSize: '10px', fontWeight: 900, color: '#000' }}>{item.name}</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 800, color: '#222' }}>
                                            <span>{item.qty} AD X ₺{item.price.toFixed(2)}</span>
                                            <span style={{ fontWeight: 900, color: '#000' }}>₺{(item.price * item.qty).toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))}

                                {/* Total */}
                                <div style={{ borderTop: '2px solid #000', margin: '4px 12px 0' }} />
                                <div style={{ padding: '8px 12px', fontSize: '16px', fontWeight: 900, color: '#000', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>TOPLAM:</span>
                                    <span>₺149.90</span>
                                </div>

                                {/* Payment */}
                                <div style={{ padding: '4px 12px', fontSize: '10px', fontWeight: 800, color: '#000', borderTop: '1px dashed #999' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>ÖDEME TİPİ:</span>
                                        <span>NAKİT</span>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div style={{ textAlign: 'center', padding: '10px 12px 16px', borderTop: '2px dashed #333', marginTop: '4px' }}>
                                    {s.footerMessage && <div style={{ fontSize: '8px', fontWeight: 800, color: '#000' }}>{s.footerMessage}</div>}
                                    {s.footerNote1 && <div style={{ fontSize: '10px', fontWeight: 900, color: '#000', marginTop: '4px' }}>{s.footerNote1}</div>}
                                    {s.footerNote2 && <div style={{ fontSize: '8px', fontWeight: 800, color: '#555' }}>{s.footerNote2}</div>}
                                </div>
                            </div>
                        </div>

                        <p className="text-[9px] text-secondary/50 italic font-medium leading-relaxed text-center px-4">
                            * Bu önizleme yaklaşık görünümdür. Gerçek fiş yazıcı modeline göre farklılık gösterebilir.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
