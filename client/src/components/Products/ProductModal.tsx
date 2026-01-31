"use client";

import { useState, useEffect, useRef } from "react";
import { X, Calculator, Zap, Upload, Image as ImageIcon, RefreshCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateProfit, suggestSalePrice } from "@/lib/calculations";

export default function ProductModal({ isOpen, onClose, onSave, product, categories, isSaving }: any) {
    const [formData, setFormData] = useState({
        name: "",
        barcode: "",
        purchase_price: 0,
        sale_price: 0,
        vat_rate: 20,
        stock_quantity: 0,
        category_id: "",
        unit: "Adet", // Adet, kg
        status: "active", // active, passive, pending
        is_campaign: false,
        image_url: "",
    });

    useEffect(() => {
        if (product) setFormData({
            ...product,
            unit: product.unit || "Adet",
            status: product.status || (product.is_active === false ? 'passive' : 'active'),
            image_url: product.image_url || ""
        });
        else setFormData({
            name: "",
            barcode: "",
            purchase_price: 0,
            sale_price: 0,
            vat_rate: 20,
            stock_quantity: 0,
            category_id: "",
            unit: "Adet",
            status: "active",
            is_campaign: false,
            image_url: "",
        });
    }, [product, isOpen]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const stats = calculateProfit(formData.purchase_price, formData.sale_price);

    const handleSuggestPrice = () => {
        const suggested = suggestSalePrice(formData.purchase_price, 30, formData.vat_rate);
        setFormData({ ...formData, sale_price: suggested });
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
                                    value={formData.name}
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
                                    value={formData.category_id}
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
                                    value={formData.barcode}
                                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                    placeholder="Barkod taratın veya yazın"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1.5">Alış Fiyatı (₺)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none text-foreground"
                                        value={formData.purchase_price === 0 ? "" : formData.purchase_price}
                                        onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value === "" ? 0 : parseFloat(e.target.value) })}
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
                                    type="number"
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                                    value={formData.sale_price === 0 ? "" : formData.sale_price}
                                    onChange={(e) => setFormData({ ...formData, sale_price: e.target.value === "" ? 0 : parseFloat(e.target.value) })}
                                />
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
                                    type="number"
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none text-lg font-bold text-foreground"
                                    value={formData.stock_quantity === 0 ? "" : formData.stock_quantity}
                                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value === "" ? 0 : parseFloat(e.target.value) })}
                                    step="0.001"
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
                            onClick={() => onSave(formData)}
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
