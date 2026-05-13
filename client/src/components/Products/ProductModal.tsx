"use client";

import { useState, useEffect, useRef } from "react";
import { X, Calculator, Zap, Upload, Image as ImageIcon, RefreshCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateProfit, suggestSalePrice } from "@/lib/calculations";

export default function ProductModal({ isOpen, onClose, onSave, product, categories, isSaving }: any) {
    const [formData, setFormData] = useState({
        name: "",
        barcode: "",
        purchase_price: "" as any,
        sale_price: "" as any,
        vat_rate: 20,
        stock_quantity: "" as any,
        category_id: "",
        unit: "Adet", // Adet, kg
        status: "active", // active, passive, pending
        is_campaign: false,
        image_url: "",
        external_price: "" as any,
        sync_trendyol: false,
    });
 
    // Pricing suggestions settings
    const [pricingPrefs, setPricingPrefs] = useState({
        margin: "30" as any,
        commission: "0" as any,
        withholding: "0" as any,
        platform_commission: "0" as any,
        shipping_cost: "0" as any
    });
 
    const [showAdvancedPricing, setShowAdvancedPricing] = useState(false);
 
    useEffect(() => {
        const saved = localStorage.getItem('pricingPrefs');
        if (saved) {
            try { 
                const parsed = JSON.parse(saved);
                setPricingPrefs({
                    margin: String(parsed.margin || 30),
                    commission: String(parsed.commission || 0),
                    withholding: String(parsed.withholding || 0),
                    platform_commission: String(parsed.platform_commission || 0),
                    shipping_cost: String(parsed.shipping_cost || 0)
                });
            } catch (e) { }
        }
    }, []);
 
    useEffect(() => {
        localStorage.setItem('pricingPrefs', JSON.stringify(pricingPrefs));
    }, [pricingPrefs]);

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
            name: "",
            barcode: "",
            purchase_price: "",
            sale_price: "",
            vat_rate: 20,
            stock_quantity: "",
            category_id: "",
            unit: "Adet",
            status: "active",
            is_campaign: false,
            image_url: "",
            external_price: "",
            sync_trendyol: false,
        });
    }, [product, isOpen]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const stats = calculateProfit(
        Number(formData.purchase_price) || 0, 
        Number(formData.sale_price) || 0,
        Number(pricingPrefs.platform_commission) || 0,
        Number(pricingPrefs.shipping_cost) || 0
    );

    const handleSuggestPrice = () => {
        const suggested = suggestSalePrice(
            Number(formData.purchase_price) || 0,
            Number(pricingPrefs.margin) || 0,
            formData.vat_rate,
            Number(pricingPrefs.commission) || 0,
            Number(pricingPrefs.withholding) || 0,
            Number(pricingPrefs.platform_commission) || 0,
            Number(pricingPrefs.shipping_cost) || 0
        );
        setFormData({ ...formData, sale_price: String(suggested) });
    };

    const handleNumericInput = (field: string, value: string, isPrefs: boolean = false) => {
        // Sayıları ve sadece bir tane nokta/virgül karakterini kabul et
        let cleaned = value.replace(/[^0-9.,]/g, '');
        cleaned = cleaned.replace(',', '.'); // Virgülü noktaya çevir
        
        // Birden fazla nokta olmasını engelle
        const parts = cleaned.split('.');
        if (parts.length > 2) {
            cleaned = parts[0] + '.' + parts.slice(1).join('');
        }

        if (isPrefs) {
            setPricingPrefs(prev => ({ ...prev, [field]: cleaned }));
        } else {
            setFormData(prev => ({ ...prev, [field]: cleaned }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                alert("Dosya boyutu 2MB'den büyük olamaz!");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, image_url: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
                >
                    <div className="flex justify-between items-center p-6 border-b border-border">
                        <h2 className="text-xl font-bold text-foreground">{product ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}</h2>
                        <button onClick={onClose} className="p-2 hover:bg-primary/5 rounded-lg text-secondary">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex gap-4 items-center bg-white/5 p-4 rounded-2xl border border-border">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-24 h-24 rounded-xl border-2 border-dashed border-border overflow-hidden bg-background flex-shrink-0 relative group cursor-pointer hover:border-primary/50 transition-all"
                                >
                                    {formData.image_url ? (
                                        <>
                                            <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <RefreshCcw className="text-white w-6 h-6" />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-[10px] text-secondary text-center px-1">
                                            <Upload className="w-6 h-6 mb-1 opacity-20" />
                                            Görsel Seç
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-bold text-secondary uppercase tracking-widest">Ürün Görseli</label>
                                        {formData.image_url && (
                                            <button
                                                onClick={() => setFormData({ ...formData, image_url: "" })}
                                                className="text-[10px] text-rose-500 font-bold hover:underline"
                                            >
                                                SİL
                                            </button>
                                        )}
                                    </div>

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        className="hidden"
                                    />

                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs font-bold hover:bg-primary/5 flex items-center justify-center gap-2 transition-all"
                                    >
                                        <ImageIcon className="w-4 h-4 text-primary" />
                                        BİLGİSAYARDAN SEÇ
                                    </button>

                                    <p className="text-[10px] text-secondary leading-tight">Yüklenen görsel otomatik olarak optimize edilir. (Max 2MB)</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1.5">Ürün Adı</label>
                                <input
                                    type="text"
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none text-foreground"
                                    value={formData.name || ""}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Örn: Dana Kuşbaşı"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1.5 flex justify-between">
                                    <span>Kategori</span>
                                </label>
                                <select
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none text-foreground"
                                    value={formData.category_id || ""}
                                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                >
                                    <option value="">Kategori Seçin</option>
                                    {categories?.map((cat: any) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1.5">Barkod Numarası</label>
                                <input
                                    type="text"
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                                    value={formData.barcode || ""}
                                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                    placeholder="Barkod taratın veya yazın"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1.5">Alış Fiyatı (₺)</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none text-foreground"
                                        value={formData.purchase_price}
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => handleNumericInput('purchase_price', e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1.5">KDV Oranı (%)</label>
                                    <select
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none text-foreground"
                                        value={formData.vat_rate}
                                        onChange={(e) => setFormData({ ...formData, vat_rate: parseInt(e.target.value) })}
                                    >
                                        <option value={1}>%1</option>
                                        <option value={10}>%10</option>
                                        <option value={20}>%20</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1.5 flex justify-between">
                                    <span>Satış Fiyatı (₺)</span>
                                    <button
                                        onClick={handleSuggestPrice}
                                        className="text-xs text-primary flex items-center hover:underline"
                                    >
                                        <Zap className="w-3 h-3 mr-1" /> Öneri Al
                                    </button>
                                </label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                                    value={formData.sale_price}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => handleNumericInput('sale_price', e.target.value)}
                                    placeholder="0.00"
                                />
                                
                                <div className="mt-4">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-[11px] font-black text-orange-500 uppercase tracking-wider">Trendyol Satış Fiyatı (₺)</label>
                                        <label className="relative inline-flex items-center cursor-pointer group">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer" 
                                                checked={formData.sync_trendyol}
                                                onChange={(e) => setFormData({...formData, sync_trendyol: e.target.checked})}
                                            />
                                            <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500 border border-white/5 group-hover:border-orange-500/50"></div>
                                            <span className="ml-2 text-[10px] font-black text-orange-500 uppercase tracking-tighter">Trendyol'da Satışa Aç</span>
                                        </label>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500 font-bold text-xs">TRY</div>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            className={`w-full bg-orange-500/5 border rounded-xl pl-12 pr-4 py-2.5 outline-none transition-all ${formData.sync_trendyol ? 'border-orange-500/50 text-white font-black' : 'border-white/5 text-white/30 opacity-50 grayscale cursor-not-allowed'}`}
                                            value={formData.external_price}
                                            onFocus={(e) => e.target.select()}
                                            disabled={!formData.sync_trendyol}
                                            onChange={(e) => handleNumericInput('external_price', e.target.value)}
                                            placeholder="Trendyol'a özel fiyat girin"
                                        />
                                    </div>
                                    <p className="text-[9px] text-secondary/60 mt-1">* Bu fiyat dükkan fiyatından bağımsız sadece Trendyol'a gönderilir.</p>
                                </div>
 
                                <button 
                                    onClick={() => setShowAdvancedPricing(!showAdvancedPricing)}
                                    className="mt-2 text-[10px] font-bold text-secondary hover:text-primary flex items-center gap-1 transition-all"
                                >
                                    <Calculator className="w-3 h-3" />
                                    {showAdvancedPricing ? "GELİŞMİŞ AYARLARI GİZLE" : "GELİŞMİŞ HESAPLAMA AYARLARI"}
                                </button>
 
                                <AnimatePresence>
                                    {showAdvancedPricing && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden mt-3 space-y-3 p-3 bg-white/5 rounded-xl border border-border/50"
                                        >
                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-secondary mb-1">HEDEF KAR (%)</label>
                                                    <input 
                                                        type="text" 
                                                        inputMode="decimal"
                                                        className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs outline-none"
                                                        value={pricingPrefs.margin}
                                                        onFocus={(e) => e.target.select()}
                                                        onChange={(e) => handleNumericInput('margin', e.target.value, true)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-secondary mb-1">POS KOM. (%)</label>
                                                    <input 
                                                        type="text" 
                                                        inputMode="decimal"
                                                        className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs outline-none"
                                                        value={pricingPrefs.commission}
                                                        onFocus={(e) => e.target.select()}
                                                        onChange={(e) => handleNumericInput('commission', e.target.value, true)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-secondary mb-1">PLATFORM (%)</label>
                                                    <input 
                                                        type="text" 
                                                        inputMode="decimal"
                                                        className="w-full bg-orange-500/10 border border-orange-500/20 rounded-lg px-2 py-1.5 text-xs outline-none text-orange-500"
                                                        value={pricingPrefs.platform_commission}
                                                        onFocus={(e) => e.target.select()}
                                                        onChange={(e) => handleNumericInput('platform_commission', e.target.value, true)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-secondary mb-1">KARGO (TL)</label>
                                                    <input 
                                                        type="text" 
                                                        inputMode="decimal"
                                                        className="w-full bg-blue-500/10 border border-blue-500/20 rounded-lg px-2 py-1.5 text-xs outline-none text-blue-500"
                                                        value={pricingPrefs.shipping_cost}
                                                        onFocus={(e) => e.target.select()}
                                                        onChange={(e) => handleNumericInput('shipping_cost', e.target.value, true)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-secondary mb-1">STOPAJ (%)</label>
                                                    <input 
                                                        type="text" 
                                                        inputMode="decimal"
                                                        className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs outline-none"
                                                        value={pricingPrefs.withholding}
                                                        onFocus={(e) => e.target.select()}
                                                        onChange={(e) => handleNumericInput('withholding', e.target.value, true)}
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-[9px] text-secondary/60 leading-tight">
                                                * Öneri al dediğinizde bu oranlar maliyetin üzerine eklenerek satış fiyatı brütleştirilir. Kargo ve komisyon kardan düşülerek net kar hesaplanır.
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="bg-primary/5 rounded-xl p-4 border border-dashed border-border mt-2">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-secondary flex items-center">
                                        <Calculator className="w-4 h-4 mr-2" /> Kar Analizi
                                    </span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-xs text-secondary">Net Kar</p>
                                        <p className="text-lg font-bold text-emerald-600">₺{stats.amount}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-secondary">Kar Oranı</p>
                                        <p className="text-lg font-bold text-emerald-600">%{stats.percentage}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center justify-between text-sm font-medium text-secondary mb-1.5">
                                    <span>Stok Miktarı</span>
                                    <div className="flex bg-background border border-border rounded-lg p-0.5">
                                        {['Adet', 'KG'].map((u) => (
                                            <button
                                                key={u}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, unit: u })}
                                                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${formData.unit === u ? 'bg-primary text-white shadow-sm' : 'text-secondary opacity-50'}`}
                                            >
                                                {u}
                                            </button>
                                        ))}
                                    </div>
                                </label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none text-lg font-bold text-foreground"
                                    value={formData.stock_quantity}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => handleNumericInput('stock_quantity', e.target.value)}
                                    placeholder="0"
                                />
                            </div>

                            <div className="pt-2 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-3">Ürün Durumu (Tıkla Değiştir)</label>
                                    <div className="flex items-center gap-2">
                                        {[
                                            { id: 'active', label: 'AKTİF', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
                                            { id: 'pending', label: 'BEKLEMEDE', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
                                            { id: 'passive', label: 'PASİF', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' }
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, status: opt.id })}
                                                className={`flex-1 flex items-center justify-center py-4 px-2 rounded-2xl border-2 transition-all duration-300 font-black text-[10px] tracking-widest ${formData.status === opt.id ? `${opt.color} scale-[1.05] shadow-xl shadow-white/5 opacity-100` : 'bg-transparent border-white/5 text-secondary opacity-30 hover:opacity-100'}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <label className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/20 cursor-pointer hover:bg-primary/10 transition-all">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-primary flex items-center">
                                            <Calculator className="w-4 h-4 mr-2" /> Kampanya Ürünü
                                        </span>
                                        <span className="text-xs text-primary/70">%15 Fiyat Artışı Uygulanır</span>
                                    </div>
                                    <div className={`w-12 h-6 rounded-full transition-all duration-300 relative ${formData.is_campaign ? 'bg-primary' : 'bg-primary/10'}`}>
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${formData.is_campaign ? 'left-7' : 'left-1'}`} />
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={formData.is_campaign}
                                        onChange={(e) => setFormData({ ...formData, is_campaign: e.target.checked })}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-border flex justify-end space-x-3">

                        <button onClick={onClose} disabled={isSaving} className="px-6 py-2 rounded-xl text-secondary hover:bg-primary/5 transition-all disabled:opacity-50">
                            İptal
                        </button>
                        <button
                            onClick={() => {
                                const finalData = {
                                    ...formData,
                                    purchase_price: Number(formData.purchase_price) || 0,
                                    sale_price: Number(formData.sale_price) || 0,
                                    external_price: Number(formData.external_price) || 0,
                                    stock_quantity: Number(formData.stock_quantity) || 0
                                };
                                onSave(finalData);
                            }}
                            disabled={isSaving}
                            className="px-8 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary/20 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            <span>{isSaving ? 'Kaydediliyor...' : 'Kaydet'}</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
