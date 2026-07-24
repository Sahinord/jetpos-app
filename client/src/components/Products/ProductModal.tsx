"use client";

import { useState, useEffect, useRef } from "react";
import { X, Calculator, Zap, Upload, Image as ImageIcon, RefreshCcw, Package, Barcode, Tag, DollarSign, Box, ChevronDown, Sparkles, AlertTriangle, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateProfit, suggestSalePrice } from "@/lib/calculations";
import AdvancedPriceCalculator from "./AdvancedPriceCalculator";

// Platform kayıt defteri — tenant'ta açık olanlar modalda gösterilir.
// key = fixed_warehouses.platform değeri.
const PLATFORM_REGISTRY: { key: string; label: string; color: string }[] = [
    { key: "trendyol",    label: "Trendyol Pazaryeri",  color: "orange" },
    { key: "trendyol_go", label: "Trendyol GO",         color: "orange" },
    { key: "getir",       label: "Getir Çarşı",         color: "violet" },
    { key: "hepsiburada", label: "Hepsiburada",         color: "orange" },
    { key: "yemeksepeti", label: "Yemeksepeti",         color: "rose" },
    { key: "tgo_yemek",   label: "Trendyol · Uber Yemek", color: "orange" },
];

export default function ProductModal({ isOpen, onClose, onSave, product, categories, isSaving, enabledPlatforms, onMinimize }: any) {
    // Tenant'ta açık platformlar (fixed_warehouses'tan gelir). Boşsa geriye
    // uyumluluk için sadece Trendyol gösterilir (eski davranış).
    const activePlatforms: string[] = (Array.isArray(enabledPlatforms) && enabledPlatforms.length)
        ? enabledPlatforms
        : ["trendyol"];
    const shownPlatforms = PLATFORM_REGISTRY.filter(p => activePlatforms.includes(p.key));

    const [formData, setFormData] = useState({
        name: "", barcode: "", purchase_price: "" as any, sale_price: "" as any,
        vat_rate: 20, stock_quantity: "" as any, category_id: "", unit: "Adet",
        status: "active", is_campaign: false, image_url: "", external_price: "" as any,
        sync_trendyol: false,
    });

    // Platform-özel fiyat/durum: { [platform]: { active, price } }
    const [platformPrices, setPlatformPrices] = useState<Record<string, { active: boolean; price: string }>>({});

    const setPlatform = (key: string, patch: Partial<{ active: boolean; price: string }>) => {
        setPlatformPrices(prev => {
            const cur = prev[key] || { active: false, price: "0" };
            return { ...prev, [key]: { ...cur, ...patch } };
        });
    };

    const [pricingPrefs, setPricingPrefs] = useState({
        margin: "30" as any, commission: "0" as any, withholding: "0" as any,
        platform_commission: "0" as any, shipping_cost: "0" as any,
        includeVat: true
    });

    const [showAdvancedPricing, setShowAdvancedPricing] = useState(false);
    // Platform Fiyatları bölümü açık/kapalı (kalabalık olmasın diye katlanabilir)
    const [showPlatformPrices, setShowPlatformPrices] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('pricingPrefs');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setPricingPrefs({
                    margin: String(parsed.margin || 30), commission: String(parsed.commission || 0),
                    withholding: String(parsed.withholding || 0), platform_commission: String(parsed.platform_commission || 0),
                    shipping_cost: String(parsed.shipping_cost || 0),
                    includeVat: parsed.includeVat !== false
                });
            } catch (e) { }
        }
    }, []);

    useEffect(() => { localStorage.setItem('pricingPrefs', JSON.stringify(pricingPrefs)); }, [pricingPrefs]);

    useEffect(() => {
        if (product) setFormData({
            ...product,
            purchase_price: String(product.purchase_price || 0),
            sale_price: String(product.sale_price || 0),
            stock_quantity: String(product.stock_quantity || 0),
            external_price: String(product.external_price || 0),
            unit: product.unit || "Adet",
            status: product.status || (product.is_active === false ? 'passive' : 'active'),
            image_url: product.image_url || "",
            category_id: product.category_id || "",
            sync_trendyol: product.sync_trendyol || false,
        });
        else setFormData({
            name: "", barcode: "", purchase_price: "", sale_price: "", vat_rate: 20,
            stock_quantity: "", category_id: "", unit: "Adet", status: "active",
            is_campaign: false, image_url: "", external_price: "", sync_trendyol: false,
        });

        // Platform fiyatlarını yükle. GERİYE UYUMLU: kayıtlı platform_prices.trendyol
        // yoksa eski external_price/sync_trendyol'dan tohumla.
        const pp: Record<string, { active: boolean; price: string }> = {};
        const stored = (product?.platform_prices && typeof product.platform_prices === "object") ? product.platform_prices : {};
        for (const p of PLATFORM_REGISTRY) {
            const s = stored[p.key];
            if (s) pp[p.key] = { active: s.active === true, price: String(s.price ?? 0) };
        }
        if (!pp.trendyol) {
            pp.trendyol = { active: product?.sync_trendyol === true, price: String(product?.external_price || 0) };
        }
        setPlatformPrices(pp);
    }, [product, isOpen]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const stats = calculateProfit(
        Number(formData.purchase_price) || 0, Number(formData.sale_price) || 0,
        Number(pricingPrefs.platform_commission) || 0, Number(pricingPrefs.shipping_cost) || 0
    );

    const handleSuggestPrice = () => {
        const suggested = suggestSalePrice(
            Number(formData.purchase_price) || 0, Number(pricingPrefs.margin) || 0,
            pricingPrefs.includeVat ? formData.vat_rate : 0, Number(pricingPrefs.commission) || 0,
            Number(pricingPrefs.withholding) || 0, Number(pricingPrefs.platform_commission) || 0,
            Number(pricingPrefs.shipping_cost) || 0
        );
        setFormData({ ...formData, sale_price: String(suggested) });
    };

    const handleNumericInput = (field: string, value: string, isPrefs: boolean = false) => {
        let cleaned = value.replace(/[^0-9.,]/g, '');
        cleaned = cleaned.replace(',', '.');
        const parts = cleaned.split('.');
        if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('');
        if (isPrefs) setPricingPrefs(prev => ({ ...prev, [field]: cleaned }));
        else setFormData(prev => ({ ...prev, [field]: cleaned }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { alert("Dosya boyutu 2MB'den büyük olamaz!"); return; }
            const reader = new FileReader();
            reader.onloadend = () => { setFormData({ ...formData, image_url: reader.result as string }); };
            reader.readAsDataURL(file);
        }
    };

    // Dirty check: has user changed anything?
    const [showDiscardModal, setShowDiscardModal] = useState(false);

    const isDirty = () => {
        if (!product) {
            // New product: dirty if any field is filled
            return !!(formData.name || formData.barcode || formData.purchase_price || formData.sale_price || formData.stock_quantity);
        }
        // Existing product: compare against original
        return (
            formData.name !== (product.name || '') ||
            formData.barcode !== (product.barcode || '') ||
            String(formData.purchase_price) !== String(product.purchase_price || 0) ||
            String(formData.sale_price) !== String(product.sale_price || 0) ||
            String(formData.stock_quantity) !== String(product.stock_quantity || 0) ||
            formData.status !== (product.status || 'active') ||
            formData.is_campaign !== (product.is_campaign || false) ||
            formData.category_id !== (product.category_id || '') ||
            formData.unit !== (product.unit || 'Adet') ||
            formData.image_url !== (product.image_url || '') ||
            String(formData.external_price) !== String(product.external_price || 0) ||
            formData.sync_trendyol !== (product.sync_trendyol || false)
        );
    };

    const handleAttemptClose = () => {
        if (isDirty()) {
            setShowDiscardModal(true);
        } else {
            onClose();
        }
    };

    // "Arka plana al" — düzenlemeyi taslak olarak dışarı verir, modalı kapatır.
    // Snapshot ürün-benzeri bir nesnedir; geri açılınca aynı init'ten yüklenir.
    const handleMinimize = () => {
        if (!onMinimize) return;
        const draftId = (formData as any).__draftId
            || (product && (product.id || (product as any).__draftId))
            || `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const snapshot = {
            ...(product || {}),
            ...formData,
            platform_prices: platformPrices,   // {key:{active,price(string)}} — init bunu okur
            __draftId: draftId,
            __draftName: (formData.name || (product && product.name) || "İsimsiz ürün"),
            __isNew: !(product && product.id),
            __savedAt: Date.now(),
        };
        onMinimize(snapshot);
    };

    // Kaydedilecek nihai veri (platform_prices dahil + Trendyol geriye uyum)
    const buildFinalData = () => {
        // platform_prices JSON'ı normalize et (yalnızca gösterilen platformlar)
        const pp: Record<string, { active: boolean; price: number }> = {};
        for (const p of shownPlatforms) {
            const v = platformPrices[p.key];
            if (v) pp[p.key] = { active: v.active === true, price: Number(v.price) || 0 };
        }
        // GERİYE UYUM: Trendyol Pazaryeri hâlâ external_price/sync_trendyol'dan
        // okunuyor (mevcut senkron). platform_prices.trendyol ile aynı anda yaz.
        const tr = pp.trendyol;
        // Taslak iç anahtarlarını (__draftId, __draftName, __isNew, __savedAt) ve
        // restore sırasında sızmış platform_prices'ı kayıt payload'ından çıkar.
        const cleanForm: any = {};
        for (const k of Object.keys(formData)) {
            if (k.startsWith("__") || k === "platform_prices") continue;
            cleanForm[k] = (formData as any)[k];
        }
        return {
            ...cleanForm,
            purchase_price: Number(formData.purchase_price) || 0,
            sale_price: Number(formData.sale_price) || 0,
            stock_quantity: Number(formData.stock_quantity) || 0,
            external_price: tr ? tr.price : (Number(formData.external_price) || 0),
            sync_trendyol: tr ? tr.active : (formData.sync_trendyol === true),
            platform_prices: pp,
        };
    };

    const handleSaveAndClose = () => {
        setShowDiscardModal(false);
        onSave(buildFinalData());
    };

    const handleDiscardAndClose = () => {
        setShowDiscardModal(false);
        onClose();
    };

    if (!isOpen) return null;

    const profitMargin = Number(formData.sale_price) > 0
        ? Math.round(((Number(formData.sale_price) - Number(formData.purchase_price)) / Number(formData.sale_price)) * 100)
        : 0;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={handleAttemptClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 10 }}
                    transition={{ duration: 0.2 }}
                    onClick={e => e.stopPropagation()}
                    className="bg-[#0c1222] border border-white/[0.06] w-full max-w-[720px] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col relative"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center px-6 py-4 border-b border-white/[0.04] flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Package size={16} className="text-primary" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-white">{product ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}</h2>
                                {product && <p className="text-[10px] text-slate-500 font-mono">{product.barcode || "—"}</p>}
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {onMinimize && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleMinimize(); }}
                                    title="Arka plana al (taslak) — kaydetmeden bırak, sonra devam et"
                                    className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 hover:bg-white/[0.06] rounded-lg text-slate-400 hover:text-white transition-all active:scale-90 text-[11px] font-medium"
                                >
                                    <Minimize2 size={14} />
                                    <span>Arka plana al</span>
                                </button>
                            )}
                            {onMinimize && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleMinimize(); }}
                                    title="Arka plana al (taslak)"
                                    className="sm:hidden w-8 h-8 hover:bg-white/[0.06] rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90"
                                >
                                    <Minimize2 size={15} />
                                </button>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); handleAttemptClose(); }} className="w-8 h-8 hover:bg-white/[0.06] rounded-lg flex items-center justify-center text-slate-500 hover:text-white transition-all active:scale-90">
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Body */}
                    <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5 custom-scrollbar">

                        {/* ─── SECTION: Temel Bilgiler ─── */}
                        <div className="space-y-3">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[2px]">Temel Bilgiler</p>

                            {/* Image + Name Row */}
                            <div className="flex gap-3">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-[72px] h-[72px] rounded-xl border border-dashed border-white/[0.08] overflow-hidden bg-white/[0.02] flex-shrink-0 relative group cursor-pointer hover:border-primary/30 transition-all"
                                >
                                    {formData.image_url ? (
                                        <>
                                            <img src={formData.image_url} alt="" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <RefreshCcw className="text-white w-4 h-4" />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center">
                                            <Upload className="w-4 h-4 text-slate-600 mb-1" />
                                            <span className="text-[8px] text-slate-600 font-bold">GÖRSEL</span>
                                        </div>
                                    )}
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

                                <div className="flex-1 space-y-2">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm font-medium text-white placeholder:text-slate-600 outline-none focus:border-primary/30 transition-all"
                                            value={formData.name || ""}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Ürün adı"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="relative">
                                            <Barcode size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                                            <input
                                                type="text"
                                                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-8 pr-3 py-2 text-xs font-medium text-white placeholder:text-slate-600 outline-none focus:border-primary/30 transition-all font-mono"
                                                value={formData.barcode || ""}
                                                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                                placeholder="Barkod"
                                            />
                                        </div>
                                        <select
                                            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 text-xs font-medium text-white outline-none focus:border-primary/30 transition-all appearance-none cursor-pointer"
                                            value={formData.category_id || ""}
                                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                        >
                                            <option value="" className="bg-[#0c1222]">Kategori seçin</option>
                                            {categories?.map((cat: any) => (
                                                <option key={cat.id} value={cat.id} className="bg-[#0c1222]">{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-white/[0.04]" />

                        {/* ─── SECTION: Fiyatlandırma ─── */}
                        <div className="space-y-3">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[2px]">Fiyatlandırma</p>

                            <div className="grid grid-cols-3 gap-2 items-end mb-1">
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 block pb-0.5">ALIŞ (₺)</label>
                                </div>
                                <div className="flex items-center justify-between pb-0.5">
                                    <label className="text-[9px] font-bold text-slate-500">SATIŞ (₺)</label>
                                    <div className="flex items-center gap-1.5">
                                        <button onClick={handleSuggestPrice} className="text-[9px] text-primary font-bold flex items-center gap-0.5 hover:underline">
                                            <Sparkles size={9} /> Öneri
                                        </button>
                                        <AdvancedPriceCalculator
                                            purchasePrice={Number(formData.purchase_price) || 0}
                                            vatRate={Number(formData.vat_rate) || 0}
                                            defaults={{ margin: Number(pricingPrefs.margin) || 30, posCommission: Number(pricingPrefs.commission) || 0, platformCommission: Number(pricingPrefs.platform_commission) || 0, shipping: Number(pricingPrefs.shipping_cost) || 0, withholding: Number(pricingPrefs.withholding) || 0, includeVat: pricingPrefs.includeVat }}
                                            onApply={(v) => setFormData((f: any) => ({ ...f, sale_price: String(v) }))}
                                            label="Gelişmiş satış fiyatı hesapla"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 block pb-0.5">KDV</label>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <input
                                        type="text" inputMode="decimal"
                                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-primary/30 transition-all tabular-nums"
                                        value={formData.purchase_price} onFocus={e => e.target.select()}
                                        onChange={e => handleNumericInput('purchase_price', e.target.value)} placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text" inputMode="decimal"
                                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-primary/30 transition-all tabular-nums"
                                        value={formData.sale_price} onFocus={e => e.target.select()}
                                        onChange={e => handleNumericInput('sale_price', e.target.value)} placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <select
                                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-primary/30 transition-all appearance-none cursor-pointer"
                                        value={formData.vat_rate}
                                        onChange={e => setFormData({ ...formData, vat_rate: parseInt(e.target.value) })}
                                    >
                                        <option value={1} className="bg-[#0c1222]">%1</option>
                                        <option value={10} className="bg-[#0c1222]">%10</option>
                                        <option value={20} className="bg-[#0c1222]">%20</option>
                                    </select>
                                </div>
                            </div>

                            {/* Profit Strip */}
                            <div className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.04] rounded-xl px-4 py-2.5">
                                <div className="flex-1 flex items-center gap-4">
                                    <div>
                                        <p className="text-[8px] text-slate-600 font-bold uppercase">Net Kâr</p>
                                        <p className={`text-sm font-black tabular-nums ${Number(stats.amount) > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>₺{stats.amount}</p>
                                    </div>
                                    <div className="h-6 w-px bg-white/[0.04]" />
                                    <div>
                                        <p className="text-[8px] text-slate-600 font-bold uppercase">Marj</p>
                                        <p className={`text-sm font-black tabular-nums ${profitMargin >= 20 ? 'text-emerald-400' : 'text-amber-400'}`}>%{profitMargin}</p>
                                    </div>
                                </div>
                                <div className="w-24 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${profitMargin >= 20 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                        style={{ width: `${Math.min(100, Math.max(0, profitMargin))}%` }} />
                                </div>
                            </div>

                            {/* Advanced Pricing Toggle */}
                            <button
                                onClick={() => setShowAdvancedPricing(!showAdvancedPricing)}
                                className="text-[9px] font-bold text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-all"
                            >
                                <Calculator size={10} />
                                {showAdvancedPricing ? "Gelişmiş ayarları gizle" : "Gelişmiş hesaplama ayarları"}
                                <ChevronDown size={10} className={`transition-transform ${showAdvancedPricing ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {showAdvancedPricing && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden">
                                        <div className="space-y-2 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                                            <div className="grid grid-cols-5 gap-2">
                                                {[
                                                    { key: 'margin', label: 'Hedef Kâr %', color: '' },
                                                    { key: 'commission', label: 'POS Kom. %', color: '' },
                                                    { key: 'platform_commission', label: 'Platform %', color: 'text-orange-400' },
                                                    { key: 'shipping_cost', label: 'Kargo ₺', color: 'text-blue-400' },
                                                    { key: 'withholding', label: 'Stopaj %', color: '' },
                                                ].map(f => (
                                                    <div key={f.key}>
                                                        <label className={`text-[8px] font-bold mb-1 block ${f.color || 'text-slate-500'}`}>{f.label}</label>
                                                        <input
                                                            type="text" inputMode="decimal"
                                                            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-2 py-1.5 text-[11px] font-bold text-white outline-none focus:border-primary/30 tabular-nums"
                                                            value={(pricingPrefs as any)[f.key]} onFocus={e => e.target.select()}
                                                            onChange={e => handleNumericInput(f.key, e.target.value, true)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            {/* KDV Toggle */}
                                            <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.04]">
                                                <div className="flex items-center gap-1.5">
                                                    <DollarSign size={10} className="text-emerald-400" />
                                                    <span className="text-[9px] font-bold text-slate-400">Öneriye KDV Ekle</span>
                                                    <span className="text-[8px] text-slate-600">(%{formData.vat_rate})</span>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" checked={pricingPrefs.includeVat}
                                                        onChange={e => setPricingPrefs({ ...pricingPrefs, includeVat: e.target.checked })} />
                                                    <div className={`w-8 h-[18px] rounded-full transition-all after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all ${pricingPrefs.includeVat ? 'bg-emerald-500 after:translate-x-[14px]' : 'bg-white/[0.06]'}`} />
                                                </label>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-white/[0.04]" />

                        {/* ─── SECTION: Platform Fiyatları (tenant'ta açık mağazalar) ─── */}
                        {shownPlatforms.length > 0 && (
                            <>
                                <div className="space-y-4">
                                    {/* Soldaki ok ile açılır/kapanır — kalabalık olmasın diye */}
                                    <button
                                        type="button"
                                        onClick={() => setShowPlatformPrices(v => !v)}
                                        className="flex items-center gap-2 w-full text-left group"
                                    >
                                        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showPlatformPrices ? '' : '-rotate-90'}`} />
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[2px] group-hover:text-slate-300 transition-colors">
                                            Platform Fiyatları
                                        </p>
                                        <span className="text-[8px] text-slate-600 ml-auto">
                                            {shownPlatforms.filter(p => platformPrices[p.key]?.active).length} aktif
                                        </span>
                                    </button>
                                    {showPlatformPrices && shownPlatforms.map((pf) => {
                                        const pv = platformPrices[pf.key] || { active: false, price: "0" };
                                        const c = pf.color; // orange | violet | rose
                                        const txt = c === 'violet' ? 'text-violet-400' : c === 'rose' ? 'text-rose-400' : 'text-orange-400';
                                        const dot = c === 'violet' ? 'peer-checked:bg-violet-500' : c === 'rose' ? 'peer-checked:bg-rose-500' : 'peer-checked:bg-orange-500';
                                        const fieldBg = c === 'violet' ? 'bg-violet-500/[0.04] border-violet-500/10 focus:border-violet-500/30'
                                            : c === 'rose' ? 'bg-rose-500/[0.04] border-rose-500/10 focus:border-rose-500/30'
                                            : 'bg-orange-500/[0.04] border-orange-500/10 focus:border-orange-500/30';
                                        return (
                                            <div key={pf.key} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <p className={`text-[9px] font-bold uppercase tracking-[2px] ${txt}`}>{pf.label}</p>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input type="checkbox" className="sr-only peer"
                                                            checked={pv.active}
                                                            onChange={e => setPlatform(pf.key, { active: e.target.checked })} />
                                                        <div className={`w-8 h-[18px] bg-white/[0.06] rounded-full peer ${dot} after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-[14px] transition-colors`} />
                                                        <span className={`ml-2 text-[9px] font-bold ${txt} opacity-70`}>Satışta</span>
                                                    </label>
                                                </div>
                                                <div className={`transition-all ${pv.active ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative flex-1">
                                                            <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold ${txt}`}>₺</span>
                                                            <input
                                                                type="text" inputMode="decimal" disabled={!pv.active}
                                                                className={`w-full ${fieldBg} border rounded-xl pl-7 pr-3 py-2.5 text-sm font-bold text-white outline-none transition-all tabular-nums`}
                                                                value={pv.price}
                                                                onFocus={e => e.target.select()}
                                                                onChange={e => setPlatform(pf.key, { price: e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.') })}
                                                                placeholder={`${pf.label} fiyatı`}
                                                            />
                                                        </div>
                                                        <AdvancedPriceCalculator
                                                            purchasePrice={Number(formData.purchase_price) || 0}
                                                            vatRate={Number(formData.vat_rate) || 0}
                                                            defaults={{ margin: Number(pricingPrefs.margin) || 30, posCommission: Number(pricingPrefs.commission) || 0, platformCommission: Number(pricingPrefs.platform_commission) || 0, shipping: Number(pricingPrefs.shipping_cost) || 0, withholding: Number(pricingPrefs.withholding) || 0, includeVat: pricingPrefs.includeVat }}
                                                            onApply={(v) => setPlatform(pf.key, { price: String(v) })}
                                                            label={`${pf.label} gelişmiş fiyat hesapla`}
                                                        />
                                                    </div>
                                                    <p className="text-[8px] text-slate-600 mt-1">Dükkan fiyatından bağımsız, sadece {pf.label}&apos;a gönderilir</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="h-px bg-white/[0.04]" />
                            </>
                        )}

                        {/* ─── SECTION: Stok & Durum ─── */}
                        <div className="space-y-3">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[2px]">Stok & Durum</p>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Stock */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-[9px] font-bold text-slate-500">MİKTAR</label>
                                        <div className="flex bg-white/[0.03] border border-white/[0.06] rounded-lg p-0.5">
                                            {['Adet', 'KG'].map(u => (
                                                <button key={u} type="button" onClick={() => setFormData({ ...formData, unit: u })}
                                                    className={`px-2.5 py-1 rounded-md text-[9px] font-bold transition-all ${formData.unit === u ? 'bg-primary text-white' : 'text-slate-500'}`}>
                                                    {u}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <input
                                        type="text" inputMode="decimal"
                                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-lg font-black text-white outline-none focus:border-primary/30 transition-all tabular-nums"
                                        value={formData.stock_quantity} onFocus={e => e.target.select()}
                                        onChange={e => handleNumericInput('stock_quantity', e.target.value)} placeholder="0"
                                    />
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 mb-1 block">DURUM</label>
                                    <div className="flex gap-1.5 h-[46px]">
                                        {[
                                            { id: 'active', label: 'Aktif', c: 'emerald' },
                                            { id: 'pending', label: 'Bekle', c: 'amber' },
                                            { id: 'passive', label: 'Pasif', c: 'rose' }
                                        ].map(opt => (
                                            <button key={opt.id} type="button" onClick={() => setFormData({ ...formData, status: opt.id })}
                                                className={`flex-1 rounded-xl text-[10px] font-bold transition-all
                                                    ${formData.status === opt.id
                                                        ? `bg-${opt.c}-500/15 text-${opt.c}-400 border border-${opt.c}-500/20 shadow-lg shadow-${opt.c}-500/5`
                                                        : 'bg-white/[0.02] text-slate-600 border border-white/[0.04] hover:text-slate-400'
                                                    }`}>
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Campaign Toggle */}
                            <label className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] cursor-pointer hover:bg-white/[0.03] transition-all">
                                <div className="flex items-center gap-2">
                                    <Tag size={13} className="text-primary" />
                                    <div>
                                        <span className="text-xs font-bold text-white">Kampanya Ürünü</span>
                                        <p className="text-[9px] text-slate-500">%15 fiyat artışı uygulanır</p>
                                    </div>
                                </div>
                                <div className={`w-9 h-5 rounded-full transition-all relative ${formData.is_campaign ? 'bg-primary' : 'bg-white/[0.06]'}`}>
                                    <div className={`absolute top-[3px] w-3.5 h-3.5 bg-white rounded-full transition-all ${formData.is_campaign ? 'left-[18px]' : 'left-[3px]'}`} />
                                </div>
                                <input type="checkbox" className="hidden" checked={formData.is_campaign}
                                    onChange={e => setFormData({ ...formData, is_campaign: e.target.checked })} />
                            </label>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-white/[0.04] flex items-center justify-between flex-shrink-0">
                        <div>
                            {isDirty() && (
                                <span className="text-[9px] font-bold text-amber-400/60 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                                    Kaydedilmemiş değişiklikler
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleAttemptClose} disabled={isSaving}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-white/[0.04] transition-all disabled:opacity-50">
                                İptal
                            </button>
                            <button
                                onClick={() => onSave(buildFinalData())}
                                disabled={isSaving}
                                className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                            >
                                {isSaving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                <span>{isSaving ? 'Kaydediliyor...' : product ? 'Güncelle' : 'Ekle'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Discard Confirmation Modal */}
                    <AnimatePresence>
                        {showDiscardModal && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-2xl"
                                onClick={(e) => { e.stopPropagation(); setShowDiscardModal(false); }}
                            >
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                    onClick={e => e.stopPropagation()}
                                    className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6 max-w-[320px] w-full shadow-2xl space-y-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                            <AlertTriangle size={20} className="text-amber-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white">Kaydedilmemiş Değişiklikler</h3>
                                            <p className="text-[11px] text-slate-400 mt-0.5">Yaptığınız değişiklikler kaybolacak.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setShowDiscardModal(false)}
                                            className="flex-1 py-2.5 rounded-xl text-[11px] font-bold text-slate-400 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all">
                                            Vazgeç
                                        </button>
                                        <button onClick={handleDiscardAndClose}
                                            className="flex-1 py-2.5 rounded-xl text-[11px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/15 hover:bg-rose-500/20 transition-all">
                                            Kaydetme
                                        </button>
                                        <button onClick={handleSaveAndClose}
                                            className="flex-1 py-2.5 rounded-xl text-[11px] font-bold text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95">
                                            Kaydet
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
