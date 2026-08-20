"use client";

import { useState, useEffect, useCallback } from "react";
import { UploadCloud, RefreshCw, CheckCircle2, Package, Zap, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";
import { apiFetch } from "@/lib/api";

// Trendyol GO Market — JetPos ürünlerini Trendyol kataloğuna AKTAR (createProducts).
// brandId + categoryId (en alt/leaf) seçilir, sonra seçili ürünler gönderilir.
// Ayrıca "otomatik gönderim" açıksa yeni eklenen ürünler varsayılan kategori/markayla
// Trendyol'a kendiliğinden gider (bkz. lib/trendyol-auto-push.ts).
export default function TrendyolProductPush({ settings, setSettings, handleSaveSettings, savingSettings }: any) {
    const { currentTenant } = useTenant();
    const [cats, setCats] = useState<Array<{ id: number; name: string }>>([]);
    const [brands, setBrands] = useState<Array<{ id: number; name: string }>>([]);
    const [catId, setCatId] = useState<number | "">("");
    const [brandId, setBrandId] = useState<number | "">("");
    const [brandSearch, setBrandSearch] = useState("");
    const [products, setProducts] = useState<any[]>([]);
    const [jetCats, setJetCats] = useState<Array<{ id: string; name: string }>>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [loadingCat, setLoadingCat] = useState(false);
    const [pushing, setPushing] = useState(false);
    const [flash, setFlash] = useState<string | null>(null);

    const tid = currentTenant?.id;

    // Kategori + marka yükle
    const loadCatalog = useCallback(async () => {
        if (!tid) return;
        setLoadingCat(true);
        try {
            const [c, b] = await Promise.all([
                apiFetch(`/api/trendyol/catalog?tenantId=${tid}&type=categories&leaf=true`),
                apiFetch(`/api/trendyol/catalog?tenantId=${tid}&type=brands`),
            ]);
            setCats(c?.categories || []);
            setBrands(b?.brands || []);
        } catch (e: any) {
            setFlash(`Katalog yüklenemedi: ${e?.message || "hata"} (Trendyol bilgileri/kredi doğru mu?)`);
        } finally { setLoadingCat(false); }
    }, [tid]);

    // JetPos ürünleri (barkodu olanlar) + JetPos kategorileri
    const loadProducts = useCallback(async () => {
        if (!tid) return;
        const [{ data: prods }, { data: jc }] = await Promise.all([
            supabase.from("products")
                .select("id, name, barcode, sale_price, vat_rate, stock_quantity")
                .eq("tenant_id", tid).is("deleted_at", null)
                .not("barcode", "is", null).limit(300),
            supabase.from("categories").select("id, name").eq("tenant_id", tid).order("name"),
        ]);
        setProducts(prods || []);
        setJetCats((jc || []).map((c: any) => ({ id: String(c.id), name: c.name })));
    }, [tid]);

    useEffect(() => { loadCatalog(); loadProducts(); }, [loadCatalog, loadProducts]);

    const brandFiltered = brands.filter(b => !brandSearch.trim() || b.name.toLowerCase().includes(brandSearch.toLowerCase())).slice(0, 50);

    const toggle = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

    const push = async () => {
        if (!tid) return;
        if (!catId || !brandId) { setFlash("Önce kategori ve marka seç."); return; }
        const chosen = products.filter(p => selected.has(p.id) && p.barcode);
        if (chosen.length === 0) { setFlash("En az bir ürün seç."); return; }
        setPushing(true);
        try {
            const vatOk = (v: any) => ([0, 1, 10, 20].includes(Number(v)) ? Number(v) : 20);
            const items = chosen.map(p => ({
                barcode: String(p.barcode).replace(/\s+/g, ""),
                title: String(p.name || "Ürün").slice(0, 100),
                brandId: Number(brandId), categoryId: Number(catId), vatRate: vatOk(p.vat_rate),
            }));
            const pushStock = chosen.map(p => ({
                barcode: String(p.barcode).replace(/\s+/g, ""),
                quantity: Number(p.stock_quantity) || 0, sellingPrice: Number(p.sale_price) || 0,
            }));
            const res = await apiFetch("/api/trendyol/create-products", {
                method: "POST", body: JSON.stringify({ tenantId: tid, items, pushStock }),
            });
            if (!res?.success) throw new Error(res?.error || "gönderilemedi");
            setFlash(`✓ ${res.count} ürün Trendyol'a gönderildi (batch: ${res.batchRequestId}). Onay için birkaç dk sonra Trendyol panelini kontrol et.`);
            setSelected(new Set());
        } catch (e: any) {
            setFlash(`Gönderim hatası: ${e?.message || "bilinmeyen"}`);
        } finally { setPushing(false); }
    };

    return (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
            <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-orange-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wide">Trendyol'a Ürün Gönder</h3>
                <button onClick={() => { loadCatalog(); loadProducts(); }} className="ml-auto text-secondary hover:text-white" title="Yenile">
                    <RefreshCw className={`w-4 h-4 ${loadingCat ? "animate-spin" : ""}`} />
                </button>
            </div>

            {flash && <div className="px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/25 text-orange-200 text-xs font-bold">{flash}</div>}

            {/* Otomatik gönderim — yeni eklenen ürün Trendyol'a kendiliğinden gitsin */}
            {settings && setSettings && (
                <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.04] p-4 space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={!!settings.autoPushProducts}
                            onChange={e => setSettings({ ...settings, autoPushProducts: e.target.checked })} className="w-4 h-4" />
                        <Zap className="w-4 h-4 text-orange-400" />
                        <div>
                            <p className="text-sm font-bold text-white">Yeni ürünü otomatik Trendyol'a gönder</p>
                            <p className="text-[10px] text-secondary/50">Açıkken JetPos'ta eklenen barkodlu ürün, JetPos kategorisine karşılık gelen Trendyol kategorisine anında aktarılır.</p>
                        </div>
                    </label>
                    {settings.autoPushProducts && (
                        <div className="space-y-3 pl-1">
                            {/* Marka + fallback kategori */}
                            <div className="grid md:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Varsayılan marka (zorunlu)</label>
                                    <select value={settings.defaultBrandId || ""}
                                        onChange={e => { const id = e.target.value ? Number(e.target.value) : undefined; const nm = brands.find(b => b.id === id)?.name; setSettings({ ...settings, defaultBrandId: id, defaultBrandName: nm }); }}
                                        className="w-full mt-1 px-3 py-2 bg-background border border-white/10 rounded-xl text-white text-sm outline-none focus:border-orange-500/40">
                                        <option value="">Seçin…</option>
                                        {brands.slice(0, 200).map(b => <option key={b.id} value={b.id}>{b.name} (#{b.id})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Eşlenmemişler için varsayılan kategori</label>
                                    <select value={settings.defaultCategoryId || ""}
                                        onChange={e => { const id = e.target.value ? Number(e.target.value) : undefined; const nm = cats.find(c => c.id === id)?.name; setSettings({ ...settings, defaultCategoryId: id, defaultCategoryName: nm }); }}
                                        className="w-full mt-1 px-3 py-2 bg-background border border-white/10 rounded-xl text-white text-sm outline-none focus:border-orange-500/40">
                                        <option value="">Seçin…</option>
                                        {cats.map(c => <option key={c.id} value={c.id}>{c.name} (#{c.id})</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* JetPos kategorisi -> Trendyol kategorisi eşlemesi */}
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Kategori eşleştirme (JetPos → Trendyol)</label>
                                <div className="mt-1 max-h-52 overflow-y-auto rounded-xl border border-white/5 divide-y divide-white/5">
                                    {jetCats.length === 0 ? (
                                        <div className="p-4 text-center text-secondary/40 text-xs">JetPos kategorisi yok.</div>
                                    ) : jetCats.map(jc => {
                                        const map = settings.categoryMap || {};
                                        const cur = map[jc.id]?.id || "";
                                        return (
                                            <div key={jc.id} className="flex items-center gap-3 px-3 py-2">
                                                <span className="flex-1 text-sm text-white truncate">{jc.name}</span>
                                                <span className="text-secondary/30">→</span>
                                                <select value={cur}
                                                    onChange={e => {
                                                        const id = e.target.value ? Number(e.target.value) : undefined;
                                                        const nm = cats.find(c => c.id === id)?.name;
                                                        const next = { ...(settings.categoryMap || {}) };
                                                        if (id) next[jc.id] = { id, name: nm }; else delete next[jc.id];
                                                        setSettings({ ...settings, categoryMap: next });
                                                    }}
                                                    className="w-52 px-2 py-1.5 bg-background border border-white/10 rounded-lg text-white text-xs outline-none focus:border-orange-500/40">
                                                    <option value="">(varsayılan)</option>
                                                    {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                    {handleSaveSettings && (
                        <button onClick={handleSaveSettings} disabled={savingSettings || (settings.autoPushProducts && !settings.defaultBrandId)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-bold disabled:opacity-40">
                            <Save className="w-3.5 h-3.5" /> Otomatik gönderim ayarını kaydet
                        </button>
                    )}
                </div>
            )}

            {/* Kategori + Marka */}
            <div className="grid md:grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Kategori (en alt)</label>
                    <select value={catId} onChange={e => setCatId(e.target.value ? Number(e.target.value) : "")}
                        className="w-full mt-1 px-3 py-2.5 bg-background border border-white/10 rounded-xl text-white text-sm outline-none focus:border-orange-500/40">
                        <option value="">Seçin…</option>
                        {cats.map(c => <option key={c.id} value={c.id}>{c.name} (#{c.id})</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Marka</label>
                    <input value={brandSearch} onChange={e => setBrandSearch(e.target.value)} placeholder="Marka ara…"
                        className="w-full mt-1 px-3 py-2 bg-background border border-white/10 rounded-xl text-white text-sm outline-none focus:border-orange-500/40" />
                    <select value={brandId} onChange={e => setBrandId(e.target.value ? Number(e.target.value) : "")}
                        className="w-full mt-1 px-3 py-2 bg-background border border-white/10 rounded-xl text-white text-sm outline-none focus:border-orange-500/40">
                        <option value="">Seçin…</option>
                        {brandFiltered.map(b => <option key={b.id} value={b.id}>{b.name} (#{b.id})</option>)}
                    </select>
                </div>
            </div>

            {/* Ürün seçimi */}
            <div>
                <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary/60">Gönderilecek Ürünler ({selected.size} seçili)</label>
                    <button onClick={() => setSelected(new Set(products.map(p => p.id)))} className="text-[10px] font-black text-orange-400">Tümünü seç</button>
                </div>
                <div className="max-h-56 overflow-y-auto rounded-xl border border-white/5 divide-y divide-white/5">
                    {products.length === 0 ? (
                        <div className="p-6 text-center text-secondary/40 text-xs flex flex-col items-center gap-2"><Package className="w-6 h-6" /> Barkodlu ürün yok.</div>
                    ) : products.map(p => (
                        <label key={p.id} className="flex items-center gap-3 px-3 py-2 hover:bg-white/[0.03] cursor-pointer">
                            <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} className="w-4 h-4" />
                            <span className="flex-1 text-sm text-white truncate">{p.name}</span>
                            <span className="text-[11px] font-mono text-secondary/50">{p.barcode}</span>
                            <span className="text-[11px] font-bold text-orange-400">₺{Number(p.sale_price) || 0}</span>
                        </label>
                    ))}
                </div>
            </div>

            <button onClick={push} disabled={pushing || !catId || !brandId || selected.size === 0}
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
                {pushing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Seçili Ürünleri Trendyol'a Gönder
            </button>
            <p className="text-[10px] text-secondary/40">Ürün oluşturulduktan sonra stok/fiyat da gönderilir. Onay Trendyol tarafında birkaç dk sürebilir (Toplu İşlem Kontrolü).</p>
        </div>
    );
}
