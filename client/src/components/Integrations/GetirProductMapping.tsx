"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { RefreshCw, Link2, Zap, Save, CheckCircle2, X, Package, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";
import { apiFetch } from "@/lib/api";

interface GetirProduct { getirId: string; name: string; price: number | null; barcode: string | null; status: string | null }
interface JetProduct { id: string; name: string; barcode: string | null }

// Getir Çarşı ürün kartları ↔ JetPos ürünleri eşleştirme.
// Barkod aynıysa otomatik eşler; gerisi elle seçilir. Kaydedince stok/fiyat senkronu yapılabilir.
export default function GetirProductMapping() {
    const { currentTenant } = useTenant();
    const tid = currentTenant?.id;

    const [getirProducts, setGetirProducts] = useState<GetirProduct[]>([]);
    const [jetProducts, setJetProducts] = useState<JetProduct[]>([]);
    const [sel, setSel] = useState<Record<string, string>>({});   // getirId -> productId
    const [text, setText] = useState<Record<string, string>>({}); // getirId -> input metni
    const [filter, setFilter] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [flash, setFlash] = useState<string | null>(null);

    // JetPos ürünleri: barkod -> id ve label -> id çözümü
    const jetByBarcode = useMemo(() => {
        const m = new Map<string, JetProduct>();
        for (const p of jetProducts) if (p.barcode) m.set(String(p.barcode).replace(/\s+/g, ""), p);
        return m;
    }, [jetProducts]);
    const labelOf = (p: JetProduct) => `${p.barcode ? p.barcode + " — " : ""}${p.name}`;
    const jetByLabel = useMemo(() => {
        const m = new Map<string, string>();
        for (const p of jetProducts) m.set(labelOf(p), p.id);
        return m;
    }, [jetProducts]);
    const jetById = useMemo(() => {
        const m = new Map<string, JetProduct>();
        for (const p of jetProducts) m.set(p.id, p);
        return m;
    }, [jetProducts]);

    const load = useCallback(async () => {
        if (!tid) return;
        setLoading(true);
        setFlash(null);
        try {
            const [res, { data: jp }] = await Promise.all([
                apiFetch(`/api/getir-carsi/products?tenantId=${tid}`),
                supabase.from("products").select("id, name, barcode").eq("tenant_id", tid).is("deleted_at", null).limit(5000),
            ]);
            if (res?.error) throw new Error(res.error);
            const gp: GetirProduct[] = res?.getirProducts || [];
            const jets: JetProduct[] = (jp || []).map((p: any) => ({ id: p.id, name: p.name, barcode: p.barcode }));
            setGetirProducts(gp);
            setJetProducts(jets);

            // Mevcut eşlemeler
            const maps: Array<{ product_id: string; getir_id: string }> = res?.maps || [];
            const mapByGetir = new Map(maps.map(m => [m.getir_id, m.product_id]));
            const nextSel: Record<string, string> = {};
            const nextText: Record<string, string> = {};
            const jByBc = new Map<string, JetProduct>();
            for (const p of jets) if (p.barcode) jByBc.set(String(p.barcode).replace(/\s+/g, ""), p);
            for (const g of gp) {
                const mapped = mapByGetir.get(g.getirId);
                if (mapped) {
                    nextSel[g.getirId] = mapped;
                    const jp2 = jets.find(x => x.id === mapped);
                    if (jp2) nextText[g.getirId] = `${jp2.barcode ? jp2.barcode + " — " : ""}${jp2.name}`;
                }
            }
            setSel(nextSel);
            setText(nextText);
        } catch (e: any) {
            setFlash(`Yüklenemedi: ${e?.message || "hata"} (Getir bağlantısı aktif mi?)`);
        } finally { setLoading(false); }
    }, [tid]);

    useEffect(() => { load(); }, [load]);

    // Barkodla otomatik eşle (boş olanları doldurur)
    const autoMatch = () => {
        let matched = 0;
        const nextSel = { ...sel }; const nextText = { ...text };
        for (const g of getirProducts) {
            if (nextSel[g.getirId]) continue;
            const bc = g.barcode ? String(g.barcode).replace(/\s+/g, "") : "";
            const jp = bc ? jetByBarcode.get(bc) : undefined;
            if (jp) { nextSel[g.getirId] = jp.id; nextText[g.getirId] = labelOf(jp); matched++; }
        }
        setSel(nextSel); setText(nextText);
        setFlash(matched > 0 ? `${matched} ürün barkodla otomatik eşlendi. Kaydetmeyi unutma.` : "Barkodla eşlenecek yeni ürün bulunamadı.");
    };

    const onPick = (getirId: string, value: string) => {
        setText(t => ({ ...t, [getirId]: value }));
        const id = jetByLabel.get(value);
        setSel(s => {
            const n = { ...s };
            if (id) n[getirId] = id; else delete n[getirId];
            return n;
        });
    };

    const clearRow = (getirId: string) => {
        setSel(s => { const n = { ...s }; delete n[getirId]; return n; });
        setText(t => ({ ...t, [getirId]: "" }));
    };

    const save = async () => {
        if (!tid) return;
        const items = Object.entries(sel).filter(([, pid]) => pid).map(([getirId, productId]) => ({ getirId, productId }));
        if (items.length === 0) { setFlash("Kaydedilecek eşleme yok."); return; }
        setSaving(true);
        try {
            const res = await apiFetch("/api/getir-carsi/product-map", { method: "POST", body: JSON.stringify({ tenantId: tid, items }) });
            if (!res?.success) throw new Error(res?.error || "kaydedilemedi");
            setFlash(`✓ ${res.saved} eşleme kaydedildi.`);
        } catch (e: any) { setFlash(`Kaydetme hatası: ${e?.message || "hata"}`); }
        finally { setSaving(false); }
    };

    const pushStock = async () => {
        if (!tid) return;
        setSaving(true);
        try {
            const res = await apiFetch("/api/getir-carsi/price-quantity", { method: "POST", body: JSON.stringify({ tenantId: tid, mode: "sync" }) });
            if (!res?.success) throw new Error(res?.error || "gönderilemedi");
            setFlash(`✓ ${res.sent} ürünün stok/fiyatı Getir'e gönderildi.`);
        } catch (e: any) { setFlash(`Stok/fiyat gönderilemedi: ${e?.message || "hata"}`); }
        finally { setSaving(false); }
    };

    const shown = useMemo(() => {
        const f = filter.trim().toLocaleLowerCase("tr-TR");
        if (!f) return getirProducts;
        return getirProducts.filter(g => g.name.toLocaleLowerCase("tr-TR").includes(f) || (g.barcode || "").includes(f));
    }, [getirProducts, filter]);

    const mappedCount = Object.values(sel).filter(Boolean).length;

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            {/* Üst bar */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 mr-auto">
                    <Link2 className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-black text-white">Ürün Eşleştirme</h3>
                    <span className="text-xs text-secondary/50 font-bold">{getirProducts.length} Getir ürünü · {mappedCount} eşli</span>
                </div>
                <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-bold disabled:opacity-50">
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Yenile
                </button>
                <button onClick={autoMatch} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-black">
                    <Zap className="w-3.5 h-3.5" /> Barkodla otomatik eşle
                </button>
                <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-black disabled:opacity-50">
                    <Save className="w-3.5 h-3.5" /> Kaydet
                </button>
                <button onClick={pushStock} disabled={saving} title="Kayıtlı eşlemelerin stok/fiyatını Getir'e gönderir" className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-black disabled:opacity-50">
                    <Send className="w-3.5 h-3.5" /> Stok/Fiyat gönder
                </button>
            </div>

            {flash && <div className="px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-200 text-xs font-bold">{flash}</div>}

            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Getir ürünlerinde ara…"
                className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white text-sm outline-none focus:border-purple-500/40" />

            {/* JetPos ürünleri datalist (tüm satırlar paylaşır) */}
            <datalist id="getir-jet-products">
                {jetProducts.map(p => <option key={p.id} value={labelOf(p)} />)}
            </datalist>

            {/* Liste */}
            <div className="rounded-2xl border border-white/[0.06] divide-y divide-white/[0.04] overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-secondary/40 text-sm">Yükleniyor…</div>
                ) : shown.length === 0 ? (
                    <div className="p-8 text-center text-secondary/40 text-sm flex flex-col items-center gap-2">
                        <Package className="w-7 h-7" /> Getir ürünü bulunamadı.
                    </div>
                ) : shown.map(g => {
                    const isMapped = !!sel[g.getirId];
                    return (
                        <div key={g.getirId} className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.02]">
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-bold text-white truncate flex items-center gap-2">
                                    {isMapped && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                                    {g.name}
                                </div>
                                <div className="text-[11px] text-secondary/50 font-mono">
                                    {g.barcode || "barkodsuz"}{g.price != null ? ` · ₺${g.price}` : ""}
                                </div>
                            </div>
                            <span className="text-secondary/30 flex-shrink-0">→</span>
                            <div className="relative w-64 flex-shrink-0">
                                <input
                                    list="getir-jet-products"
                                    value={text[g.getirId] || ""}
                                    onChange={e => onPick(g.getirId, e.target.value)}
                                    placeholder="JetPos ürünü seç/ara…"
                                    className={`w-full px-3 py-2 bg-background border rounded-lg text-white text-xs outline-none focus:border-purple-500/40 ${isMapped ? "border-emerald-500/30" : "border-white/10"}`}
                                />
                                {isMapped && (
                                    <button onClick={() => clearRow(g.getirId)} title="Eşlemeyi kaldır"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary/40 hover:text-rose-400">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            <p className="text-[10px] text-secondary/40">
                İpucu: Barkodları aynı olan ürünler “Barkodla otomatik eşle” ile saniyeler içinde eşlenir. Eşledikten sonra “Kaydet”, ardından “Stok/Fiyat gönder” ile Getir’e senkron yaparsın.
            </p>
        </div>
    );
}
