"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { HepsiburadaClient, HepsiburadaCategory, HepsiburadaCategoryAttribute, HepsiburadaProductPayload } from '@/lib/hepsiburada-client';
import { Search, ChevronRight, ArrowLeft, CheckCircle2, RefreshCcw, Package, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface JetProduct {
    id: string;
    name: string;
    barcode: string | null;
    sale_price: number;
    stock_quantity: number;
    image_url: string | null;
}

type Step = 'product' | 'category' | 'form' | 'done';

const hbClient = new HepsiburadaClient();

export default function HepsiburadaCatalogFlow() {
    const [step, setStep] = useState<Step>('product');

    const [productQuery, setProductQuery] = useState('');
    const [products, setProducts] = useState<JetProduct[]>([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [quickListingId, setQuickListingId] = useState<string | null>(null);

    const [categoryQuery, setCategoryQuery] = useState('');
    const [categories, setCategories] = useState<HepsiburadaCategory[]>([]);
    const [allCategories, setAllCategories] = useState<HepsiburadaCategory[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<HepsiburadaCategory | null>(null);

    const [attributes, setAttributes] = useState<HepsiburadaCategoryAttribute[]>([]);
    const [attributesLoading, setAttributesLoading] = useState(false);
    const [enumValues, setEnumValues] = useState<Record<string, { id: string; value: string }[]>>({});

    const [form, setForm] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [trackingId, setTrackingId] = useState<string | null>(null);
    const [statusChecking, setStatusChecking] = useState(false);
    const [statusResult, setStatusResult] = useState<any[]>([]);

    const searchProducts = async () => {
        setProductsLoading(true);
        try {
            const tenantId = localStorage.getItem('tenantId');
            let query = supabase
                .from('products')
                .select('id, name, barcode, sale_price, stock_quantity, image_url')
                .eq('tenant_id', tenantId)
                .limit(20);
            if (productQuery.trim()) query = query.ilike('name', `%${productQuery.trim()}%`);
            const { data, error } = await query;
            if (error) throw error;
            setProducts(data || []);
        } catch (e: any) {
            toast.error(e.message || 'Ürünler alınamadı');
        } finally {
            setProductsLoading(false);
        }
    };

    const pickProduct = (p: JetProduct) => {
        setForm({
            merchantSku: (p.barcode || p.id).toUpperCase().replace(/\s+/g, ''),
            UrunAdi: p.name,
            UrunAciklamasi: p.name,
            Barcode: p.barcode || '',
            Marka: '',
            price: String(p.sale_price || 0).replace('.', ','),
            stock: String(Math.max(0, Math.floor(p.stock_quantity || 0))),
            Image1: p.image_url || ''
        });
        setStep('category');
        if (allCategories.length === 0) loadCategories();
    };

    const quickList = async (p: JetProduct) => {
        if (!p.barcode) {
            toast.error('Hızlı listeleme için ürünün barkodu olmalı');
            return;
        }
        setQuickListingId(p.id);
        try {
            await hbClient.fastListProducts([{
                merchantSku: p.barcode.toUpperCase().replace(/\s+/g, ''),
                productName: p.name,
                barcode: p.barcode,
                price: String(p.sale_price || 0).replace('.', ','),
                stock: String(Math.max(0, Math.floor(p.stock_quantity || 0)))
            }]);
            toast.success('Hızlı listeleme isteği gönderildi (sadece HB kataloğunda barkodla zaten kayıtlıysa listelenir)');
        } catch (e: any) {
            toast.error(e.message || 'Hızlı listeleme başarısız');
        } finally {
            setQuickListingId(null);
        }
    };

    const loadCategories = async () => {
        setCategoriesLoading(true);
        try {
            const all = await hbClient.getCategories({ leaf: true, status: 'ACTIVE', available: true, size: 2000 });
            setAllCategories(all);
            setCategories(all.slice(0, 50));
        } catch (e: any) {
            toast.error(e.message || 'Kategoriler alınamadı');
        } finally {
            setCategoriesLoading(false);
        }
    };

    const runCategorySearch = () => {
        const q = categoryQuery.trim().toLowerCase();
        if (!q) {
            setCategories(allCategories.slice(0, 50));
            return;
        }
        setCategories(allCategories.filter(c => c.name.toLowerCase().includes(q) || (c.paths || '').toLowerCase().includes(q)).slice(0, 50));
    };

    const pickCategory = async (c: HepsiburadaCategory) => {
        setSelectedCategory(c);
        setAttributesLoading(true);
        setEnumValues({});
        try {
            const attrs = await hbClient.getCategoryAttributes(c.categoryId);
            setAttributes(attrs);
            setStep('form');
        } catch (e: any) {
            toast.error(e.message || 'Kategori özellikleri alınamadı');
        } finally {
            setAttributesLoading(false);
        }
    };

    const loadEnumValues = async (attr: HepsiburadaCategoryAttribute) => {
        if (enumValues[attr.id] || !selectedCategory) return;
        try {
            const values = await hbClient.getAttributeValues(selectedCategory.categoryId, attr.id);
            setEnumValues(prev => ({ ...prev, [attr.id]: values }));
        } catch (e: any) {
            toast.error(e.message || 'Özellik değerleri alınamadı');
        }
    };

    const handleSubmit = async () => {
        if (!selectedCategory) return;

        const missing = attributes.filter(a => a.mandatory && !form[`attr_${a.id}`]);
        if (missing.length > 0) {
            toast.error(`Zorunlu alan(lar) boş: ${missing.map(a => a.name).join(', ')}`);
            return;
        }

        setSubmitting(true);
        try {
            const attributeFields: Record<string, any> = {};
            attributes.forEach(a => {
                if (form[`attr_${a.id}`]) attributeFields[a.name] = form[`attr_${a.id}`];
            });

            const payload: HepsiburadaProductPayload = {
                categoryId: selectedCategory.categoryId,
                attributes: {
                    merchantSku: form.merchantSku,
                    VaryantGroupID: form.merchantSku,
                    UrunAdi: form.UrunAdi,
                    UrunAciklamasi: form.UrunAciklamasi,
                    Barcode: form.Barcode,
                    Marka: form.Marka,
                    price: form.price,
                    stock: form.stock,
                    ...(form.Image1 ? { Image1: form.Image1 } : {}),
                    ...attributeFields
                }
            };

            const result = await hbClient.submitProducts([payload]);
            setTrackingId(result.trackingId || null);
            setStep('done');
            toast.success('Ürün Hepsiburada\'ya gönderildi');
        } catch (e: any) {
            toast.error(e.message || 'Gönderim başarısız');
        } finally {
            setSubmitting(false);
        }
    };

    const checkStatus = async () => {
        if (!trackingId) return;
        setStatusChecking(true);
        try {
            const data = await hbClient.getProductStatus(trackingId);
            setStatusResult(data);
        } catch (e: any) {
            toast.error(e.message || 'Durum sorgulanamadı');
        } finally {
            setStatusChecking(false);
        }
    };

    const reset = () => {
        setStep('product');
        setSelectedCategory(null);
        setAttributes([]);
        setForm({});
        setTrackingId(null);
        setStatusResult([]);
    };

    return (
        <div className="space-y-5">
            {/* Adım göstergesi */}
            <div className="flex items-center gap-2 px-1">
                {(['product', 'category', 'form', 'done'] as Step[]).map((s, i) => (
                    <div key={s} className={`h-1 flex-1 rounded-full ${(['product', 'category', 'form', 'done'] as Step[]).indexOf(step) >= i ? 'bg-[#FF6000]' : 'bg-white/10'}`} />
                ))}
            </div>

            <AnimatePresence mode="wait">
                {step === 'product' && (
                    <motion.div key="product" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">1. JetPos Ürünü Seç</p>
                        <div className="flex gap-2">
                            <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                                <Search size={14} className="text-slate-500" />
                                <input
                                    value={productQuery}
                                    onChange={(e) => setProductQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && searchProducts()}
                                    placeholder="Ürün adı ara..."
                                    className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                                />
                            </div>
                            <button onClick={searchProducts} className="px-4 bg-[#FF6000]/20 text-[#FF6000] rounded-2xl font-black text-xs">Ara</button>
                        </div>
                        {productsLoading ? (
                            <div className="py-8 flex justify-center"><RefreshCcw className="w-6 h-6 text-[#FF6000] animate-spin" /></div>
                        ) : (
                            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                                {products.map(p => (
                                    <div key={p.id} className="w-full flex items-center gap-2 p-4 bg-white/5 hover:bg-white/[0.07] border border-white/5 rounded-2xl transition-all">
                                        <button onClick={() => pickProduct(p)} className="flex-1 flex items-center justify-between gap-3 min-w-0 text-left">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Package size={16} className="text-slate-500 shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-white truncate">{p.name}</p>
                                                    <p className="text-[10px] text-slate-500">₺{p.sale_price} · Stok: {p.stock_quantity}</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-slate-600 shrink-0" />
                                        </button>
                                        <button
                                            onClick={() => quickList(p)}
                                            disabled={quickListingId === p.id}
                                            title="Hızlı Listele (HB kataloğunda barkodla zaten kayıtlıysa)"
                                            className="shrink-0 p-2.5 bg-[#FF6000]/10 hover:bg-[#FF6000]/20 text-[#FF6000] rounded-xl transition-all disabled:opacity-50"
                                        >
                                            {quickListingId === p.id ? <RefreshCcw size={14} className="animate-spin" /> : <Zap size={14} />}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {step === 'category' && (
                    <motion.div key="category" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                        <button onClick={() => setStep('product')} className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <ArrowLeft size={12} /> Ürüne Dön
                        </button>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">2. Hepsiburada Kategorisi Seç</p>
                        <div className="flex gap-2">
                            <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                                <Search size={14} className="text-slate-500" />
                                <input
                                    value={categoryQuery}
                                    onChange={(e) => setCategoryQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && runCategorySearch()}
                                    placeholder="Kategori ara..."
                                    className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                                />
                            </div>
                            <button onClick={runCategorySearch} className="px-4 bg-[#FF6000]/20 text-[#FF6000] rounded-2xl font-black text-xs">Ara</button>
                        </div>
                        {categoriesLoading ? (
                            <div className="py-8 flex justify-center"><RefreshCcw className="w-6 h-6 text-[#FF6000] animate-spin" /></div>
                        ) : (
                            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                                {categories.map(c => (
                                    <button key={c.categoryId} onClick={() => pickCategory(c)} className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-[#FF6000]/10 border border-white/5 rounded-2xl transition-all text-left">
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-white truncate">{c.name}</p>
                                            {c.paths && <p className="text-[9px] text-slate-500 truncate">{c.paths}</p>}
                                        </div>
                                        <ChevronRight size={16} className="text-slate-600 shrink-0" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {step === 'form' && selectedCategory && (
                    <motion.div key="form" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                        <button onClick={() => setStep('category')} className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <ArrowLeft size={12} /> Kategoriye Dön
                        </button>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">3. Ürün Bilgilerini Doldur — {selectedCategory.name}</p>

                        <div className="space-y-3">
                            {[
                                { key: 'UrunAdi', label: 'Ürün Adı' },
                                { key: 'UrunAciklamasi', label: 'Ürün Açıklaması' },
                                { key: 'merchantSku', label: 'Satıcı Stok Kodu (SKU)' },
                                { key: 'Barcode', label: 'Barkod' },
                                { key: 'Marka', label: 'Marka' },
                                { key: 'price', label: 'Fiyat (₺) — örn: 149,90' },
                                { key: 'stock', label: 'Stok' }
                            ].map(f => (
                                <div key={f.key} className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{f.label}</label>
                                    <input
                                        value={form[f.key] || ''}
                                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#FF6000]/50"
                                    />
                                </div>
                            ))}

                            {attributesLoading ? (
                                <div className="py-6 flex justify-center"><RefreshCcw className="w-5 h-5 text-[#FF6000] animate-spin" /></div>
                            ) : attributes.length > 0 && (
                                <div className="pt-3 border-t border-white/5 space-y-3">
                                    <p className="text-[9px] font-black text-[#FF6000] uppercase tracking-widest ml-1">Kategoriye Özel Alanlar</p>
                                    {attributes.map(attr => (
                                        <div key={attr.id} className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                                {attr.name} {attr.mandatory && <span className="text-rose-400">*</span>}
                                            </label>
                                            {attr.type === 'enum' ? (
                                                <select
                                                    value={form[`attr_${attr.id}`] || ''}
                                                    onFocus={() => loadEnumValues(attr)}
                                                    onChange={(e) => setForm({ ...form, [`attr_${attr.id}`]: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none appearance-none"
                                                >
                                                    <option value="">Seçiniz</option>
                                                    {(enumValues[attr.id] || []).map(v => (
                                                        <option key={v.id} value={v.value}>{v.value}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    value={form[`attr_${attr.id}`] || ''}
                                                    onChange={(e) => setForm({ ...form, [`attr_${attr.id}`]: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#FF6000]/50"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full py-4 bg-[#FF6000] hover:bg-[#E55400] text-white rounded-2xl font-black shadow-lg shadow-[#FF6000]/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Hepsiburada\'ya Gönder'}
                        </button>
                    </motion.div>
                )}

                {step === 'done' && (
                    <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5 text-center py-6">
                        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 size={32} className="text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-white font-black">Gönderildi</h3>
                            <p className="text-[10px] text-slate-500 mt-1">Takip Kodu (trackingId): {trackingId || '-'}</p>
                        </div>

                        {trackingId && (
                            <button onClick={checkStatus} disabled={statusChecking} className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                                {statusChecking ? <RefreshCcw size={14} className="animate-spin" /> : 'Durumu Sorgula'}
                            </button>
                        )}

                        {statusResult.length > 0 && (
                            <div className="text-left space-y-2">
                                {statusResult.map((s, i) => (
                                    <div key={i} className="p-3 bg-white/5 rounded-xl text-xs text-slate-300">
                                        <p className="font-bold text-white">{s.productName || s.merchantSku}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">Durum: {s.productStatus}</p>
                                        {s.importMessages?.map((m: any, j: number) => (
                                            <p key={j} className="text-[10px] text-amber-400 mt-0.5">{m.message}</p>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}

                        <button onClick={reset} className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Yeni Ürün Gönder</button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
