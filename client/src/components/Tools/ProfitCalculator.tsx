import { useState, useEffect, useMemo } from "react";
import { 
    X, Calculator, TrendingUp, AlertCircle, Percent, Coins, 
    Truck, Megaphone, Tag, Save, History, Trash2, Clock, 
    Search, CheckCircle2, Globe, ShoppingCart, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

const INITIAL_PLATFORMS = [
    { id: 'trendyol', name: 'Trendyol', commission: 21, shipping: 48, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { id: 'hepsiburada', name: 'Hepsiburada', commission: 19.5, shipping: 42, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { id: 'amazon', name: 'Amazon', commission: 14.5, shipping: 55, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { id: 'trendyol_go', name: 'Trendyol Go (Yemek)', commission: 28, shipping: 0, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
];

const InputField = ({ label, icon: Icon, value, onChange, placeholder = "0.00", suffix = "₺" }: any) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-black text-secondary uppercase tracking-[2px] flex items-center">
            <Icon className="w-3 h-3 mr-1.5 text-primary" /> {label}
        </label>
        <div className="relative group">
            <input
                type="number"
                className="w-full bg-background border border-border group-hover:border-primary/50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-semibold text-foreground placeholder:text-muted-foreground pr-10"
                value={value === 0 ? "" : value}
                onChange={(e) => {
                    const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                    onChange(val);
                }}
                placeholder={placeholder}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary font-bold pointer-events-none opacity-40">
                {suffix}
            </div>
        </div>
    </div>
);

export default function ProfitCalculatorPage({ products = [], onRefresh, showToast }: any) {
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [productSearch, setProductSearch] = useState("");
    const [activePlatforms, setActivePlatforms] = useState(INITIAL_PLATFORMS);
    const [editingPlatform, setEditingPlatform] = useState<any>(null);
    
    const [values, setValues] = useState({
        title: "",
        cost: 0,
        shipping: 0,
        commission: 0,
        ads: 0,
        salePrice: 0,
        vat: 1,
        withholding: 0, // %1 Stopaj opsiyonel
    });

    const [dimensions, setDimensions] = useState({
        width: 0,
        height: 0,
        length: 0,
        desi: 0
    });

    const [results, setResults] = useState({
        totalCost: 0,
        netProfit: 0,
        margin: 0,
        roi: 0,
    });

    const [history, setHistory] = useState<any[]>([]);

    // Filter products for search
    const filteredProducts = useMemo(() => {
        if (!productSearch) return [];
        const lowQuery = productSearch.toLowerCase();
        return products.filter((p: any) => 
            p.name.toLowerCase().includes(lowQuery) || 
            p.barcode?.includes(lowQuery)
        ).slice(0, 5);
    }, [products, productSearch]);

    const handleSelectProduct = (p: any) => {
        setSelectedProductId(p.id);
        setValues({
            ...values,
            title: p.name,
            cost: p.purchase_price || 0,
            salePrice: p.sale_price || 0
        });
        setProductSearch("");
        if (showToast) showToast(`${p.name} verileri çekildi.`, "info");
    };

    const applyPlatformPreset = (platform: any) => {
        setValues({
            ...values,
            commission: platform.commission,
            shipping: platform.shipping
        });
        if (showToast) showToast(`${platform.name} ayarları uygulandı.`, "info");
    };

    const handleApplyToProduct = async () => {
        if (!selectedProductId) return;
        
        try {
            const { error } = await supabase
                .from('products')
                .update({
                    purchase_price: values.cost,
                    sale_price: values.salePrice
                })
                .eq('id', selectedProductId);

            if (error) throw error;
            
            if (showToast) showToast("Ürün fiyatları başarıyla güncellendi!", "success");
            if (onRefresh) onRefresh();
        } catch (error: any) {
            if (showToast) showToast("Güncelleme hatası: " + error.message, "error");
        }
    };

    const handleSavePlatformEdit = () => {
        if (!editingPlatform) return;
        const updated = activePlatforms.map(p => p.id === editingPlatform.id ? editingPlatform : p);
        setActivePlatforms(updated);
        setEditingPlatform(null);
        if (showToast) showToast(`${editingPlatform.name} oranları güncellendi.`, "success");
    };

    useEffect(() => {
        // 1. Gelir (KDV Hariç)
        const vatRate = values.vat || 0;
        const netRevenue = values.salePrice / (1 + vatRate / 100);
        const vatAmount = values.salePrice - netRevenue;

        // 2. Giderler
        const commissionAmount = values.salePrice * (values.commission / 100);
        const adsAmount = values.salePrice * (values.ads / 100);
        const withholdingAmount = values.salePrice * (values.withholding / 100);

        // Operasyonel Giderler (Maliyet + Kargo + Komisyon + Reklam + Stopaj)
        const totalExpenses = values.cost + values.shipping + commissionAmount + adsAmount + withholdingAmount;

        // 3. Kar (Net Gelir - Toplam Giderler)
        const netProfit = netRevenue - totalExpenses;
        const totalCostIncludingVat = totalExpenses + vatAmount;

        const margin = values.salePrice > 0 ? (netProfit / values.salePrice) * 100 : 0;
        const roi = totalExpenses > 0 ? (netProfit / (values.cost + values.shipping + 0.01)) * 100 : 0;

        setResults({
            totalCost: totalCostIncludingVat,
            netProfit,
            margin,
            roi,
        });
    }, [values]);

    const calculateDesi = () => {
        const desi = (dimensions.width * dimensions.height * dimensions.length) / 3000;
        setDimensions({ ...dimensions, desi: parseFloat(desi.toFixed(2)) });
    };

    const saveToHistory = () => {
        if (results.netProfit === 0 && values.salePrice === 0) return;

        const newEntry = {
            id: Date.now(),
            date: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            ...values,
            ...results,
            title: values.title || "İsimsiz Hesaplama",
        };

        setHistory([newEntry, ...history]);
        setValues({ ...values, title: "" }); // Reset title for next one
    };

    const deleteFromHistory = (id: number) => {
        setHistory(history.filter(item => item.id !== id));
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Upper Tools */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Connection */}
                <div className="glass-card p-6 border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-primary rounded-lg text-white">
                            <ShoppingCart size={18} />
                        </div>
                        <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Ürün Bağlantısı</h3>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Bir ürünü isminden veya barkodundan seçin..."
                            className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-4 text-sm focus:border-primary outline-none transition-all"
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                        />
                        <AnimatePresence>
                            {filteredProducts.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
                                >
                                    {filteredProducts.map((p: any) => (
                                        <button
                                            key={p.id}
                                            onClick={() => handleSelectProduct(p)}
                                            className="w-full p-4 flex items-center justify-between hover:bg-primary/5 transition-all text-left border-b border-border/50 last:border-0"
                                        >
                                            <div>
                                                <p className="font-bold text-sm text-foreground">{p.name}</p>
                                                <p className="text-[10px] text-secondary font-bold uppercase">{p.barcode || 'Barksodsuz'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-secondary font-black uppercase">Mevcut</p>
                                                <p className="text-xs font-black text-primary">₺{p.sale_price?.toFixed(2)}</p>
                                            </div>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    {selectedProductId && (
                        <div className="mt-4 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="text-emerald-500" size={16} />
                                <span className="text-xs font-bold text-emerald-600">Ürün Başarıyla Bağlandı</span>
                            </div>
                            <button onClick={() => setSelectedProductId(null)} className="text-[10px] font-black underline text-secondary hover:text-rose-500 uppercase tracking-widest">Bağlantıyı Kes</button>
                        </div>
                    )}
                </div>

                {/* Platform Presets */}
                <div className="glass-card p-6 border-indigo-500/20 bg-indigo-500/5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-500 rounded-lg text-white">
                            <Globe size={18} />
                        </div>
                        <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Platform Presetleri</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {activePlatforms.map((plat) => (
                            <button
                                key={plat.id}
                                onClick={() => applyPlatformPreset(plat)}
                                onDoubleClick={() => setEditingPlatform({ ...plat })}
                                className={`flex flex-col items-center justify-center p-3 rounded-2xl border ${plat.bg} ${plat.border} hover:scale-[1.05] transition-all group relative active:scale-95`}
                                title="Çift tıkla oranları düzenle"
                            >
                                <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${plat.color}`}>{plat.name}</span>
                                <span className="text-[8px] font-bold text-secondary/60 uppercase">%{plat.commission} Kom.</span>
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Zap size={8} className={plat.color} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Form */}
                <div className="lg:col-span-2 glass-card !p-8 space-y-8">
                    <div className="space-y-4 pb-6 border-b border-border">
                        <label className="text-xs font-black text-primary uppercase tracking-[2px] flex items-center">
                            Hesaplama İsmi (Opsiyonel)
                        </label>
                        <input
                            type="text"
                            className="w-full bg-background border border-border rounded-xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-semibold text-xl placeholder:text-muted-foreground text-foreground"
                            placeholder="Örn: Dana Kuşbaşı Kampanyası"
                            value={values.title}
                            onChange={(e) => setValues({ ...values, title: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <InputField label="Ürün Maliyeti" icon={Coins} value={values.cost} onChange={(v: number) => setValues({ ...values, cost: v })} />
                            <InputField label="Kargo Maliyeti (Opsiyonel)" icon={Truck} value={values.shipping} onChange={(v: number) => setValues({ ...values, shipping: v })} />
                            <InputField label="Platform Komisyonu" icon={Percent} value={values.commission} suffix="%" onChange={(v: number) => setValues({ ...values, commission: v })} />
                        </div>
                        <div className="space-y-6">
                            <InputField label="Reklam Maliyeti (Opsiyonel)" icon={Megaphone} value={values.ads} suffix="%" onChange={(v: number) => setValues({ ...values, ads: v })} />
                            <InputField label="KDV Oranı" icon={Tag} value={values.vat} suffix="%" onChange={(v: number) => setValues({ ...values, vat: v })} />

                            <div className="pt-2">
                                <label className="text-[10px] font-black text-emerald-400 uppercase tracking-[2px] flex items-center mb-1.5">
                                    <TrendingUp className="w-3 h-3 mr-1.5" /> Satış Fiyatı (₺)
                                </label>
                                <input
                                    type="number"
                                    className="w-full bg-emerald-500/10 border-2 border-emerald-500/30 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-all font-black text-xl text-emerald-600"
                                    value={values.salePrice === 0 ? "" : values.salePrice}
                                    onChange={(e) => setValues({ ...values, salePrice: parseFloat(e.target.value) || 0 })}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={saveToHistory}
                            className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary py-4 rounded-xl font-black text-lg flex items-center justify-center space-x-3 transition-all active:scale-[0.98] border border-primary/20"
                        >
                            <Save className="w-6 h-6" />
                            <span>KAYDET</span>
                        </button>
                        
                        {selectedProductId && (
                            <button
                                onClick={handleApplyToProduct}
                                className="flex-[1.5] bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-black text-lg flex items-center justify-center space-x-3 transition-all active:scale-[0.98] shadow-xl shadow-emerald-500/20"
                            >
                                <Zap className="w-6 h-6" />
                                <span>ÜRÜNE UYGULA</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Right Results */}
                <div className="glass-card bg-primary/5 !p-8 flex flex-col justify-between border-primary/20">
                    <h3 className="text-xs font-black text-secondary uppercase tracking-[2px] mb-8 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2" /> Canlı Analiz
                    </h3>

                    <div className="space-y-6 flex-1">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-border">
                            <span className="text-secondary font-semibold text-sm">TOPLAM MALİYET</span>
                            <span className="text-xl font-semibold text-foreground">₺{results.totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-border">
                            <span className="text-secondary font-semibold text-sm">STOPAJ (%1)</span>
                            <span className="text-xl font-semibold text-rose-500">₺{(values.salePrice * 0.01).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>

                        <div className="flex items-center justify-between p-6 rounded-2xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/20">
                            <span className="font-semibold">NET KAR</span>
                            <span className="text-3xl font-black">₺{results.netProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-background border border-border">
                                <p className="text-[10px] text-secondary font-black uppercase mb-1">MARJ</p>
                                <p className={`text-2xl font-black ${results.margin < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>%{results.margin.toFixed(1)}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-background border border-border">
                                <p className="text-[10px] text-secondary font-black uppercase mb-1">ROI</p>
                                <p className={`text-2xl font-black ${results.roi < 0 ? 'text-rose-500' : 'text-blue-500'}`}>%{results.roi.toFixed(1)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Desi Calculator Box */}
                    <div className="mt-8 pt-8 border-t border-border space-y-4">
                        <h3 className="text-xs font-black text-secondary uppercase tracking-[2px] mb-4 flex items-center">
                            <Truck className="w-4 h-4 mr-2" /> Desi Hesaplama
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-[8px] font-black text-secondary uppercase block mb-1">En (cm)</label>
                                <input
                                    type="number"
                                    className="w-full bg-background border border-border rounded-lg px-2 py-2 outline-none text-sm text-foreground"
                                    value={dimensions.width === 0 ? "" : dimensions.width}
                                    onChange={(e) => setDimensions({ ...dimensions, width: e.target.value === "" ? 0 : parseFloat(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-secondary uppercase block mb-1">Boy (cm)</label>
                                <input
                                    type="number"
                                    className="w-full bg-background border border-border rounded-lg px-2 py-2 outline-none text-sm text-foreground"
                                    value={dimensions.height === 0 ? "" : dimensions.height}
                                    onChange={(e) => setDimensions({ ...dimensions, height: e.target.value === "" ? 0 : parseFloat(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-secondary uppercase block mb-1">Yük. (cm)</label>
                                <input
                                    type="number"
                                    className="w-full bg-background border border-border rounded-lg px-2 py-2 outline-none text-sm text-foreground"
                                    value={dimensions.length === 0 ? "" : dimensions.length}
                                    onChange={(e) => setDimensions({ ...dimensions, length: e.target.value === "" ? 0 : parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>
                        <button
                            onClick={calculateDesi}
                            className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2 rounded-lg font-bold text-xs transition-all"
                        >
                            HESAPLA
                        </button>
                        {dimensions.desi > 0 && (
                            <div className="flex justify-between items-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <span className="text-xs font-bold text-blue-400">SONUÇ:</span>
                                <span className="text-xl font-black text-blue-400">{dimensions.desi} Desi</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* History Section */}
            <div className="space-y-6 pt-12">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <History className="w-6 h-6 text-secondary" />
                        <h3 className="text-2xl font-black tracking-tight">Hesaplama Geçmişi</h3>
                    </div>
                    {history.length > 0 && (
                        <button
                            onClick={() => setHistory([])}
                            className="text-xs font-semibold text-rose-500 hover:text-rose-400 flex items-center uppercase tracking-widest"
                        >
                            <Trash2 className="w-3 h-3 mr-1" /> Tümünü Temizle
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {history.map((item) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                key={item.id}
                                className="glass-card !p-6 border-border hover:border-primary/20 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">{item.title}</h4>
                                        <span className="text-[10px] text-secondary flex items-center font-semibold">
                                            <Clock className="w-3 h-3 mr-1" /> {item.date}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => deleteFromHistory(item.id)}
                                        className="p-1.5 text-secondary hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <div>
                                        <p className="text-[10px] text-secondary font-black uppercase">SATIŞ</p>
                                        <p className="font-semibold">₺{item.salePrice}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-secondary font-black uppercase">KAR</p>
                                        <p className={`font-black text-lg ${item.netProfit < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                            ₺{item.netProfit.toLocaleString('tr-TR', { minimumFractionDigits: 1 })}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-secondary">MARJ: <span className={item.margin < 15 ? 'text-amber-500' : 'text-emerald-500'}>%{item.margin.toFixed(1)}</span></span>
                                    <span className="text-secondary">ROI: <span className="text-blue-400">%{item.roi.toFixed(1)}</span></span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {history.length === 0 && (
                        <div className="col-span-full py-20 glass-card text-center border-dashed border-border py-opacity-30">
                            <History className="w-12 h-12 mx-auto mb-4 text-secondary/40" />
                            <p className="text-lg font-bold text-foreground">Henüz kaydedilmiş hesaplama yok.</p>
                            <p className="text-sm text-secondary">Yukarıdaki formdan hesaplama yapıp kaydedebilirsiniz.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Platform Edit Modal */}
            <AnimatePresence>
                {editingPlatform && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setEditingPlatform(null)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-sm bg-card border border-border rounded-3xl shadow-2xl overflow-hidden relative z-10 p-8"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight">{editingPlatform.name}</h3>
                                    <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mt-1">Varsayılan Oranları Düzenle</p>
                                </div>
                                <button onClick={() => setEditingPlatform(null)} className="p-2 hover:bg-secondary/10 rounded-xl transition-all">
                                    <X size={20} className="text-secondary" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-secondary tracking-widest uppercase ml-1">KOMİSYON (%)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-secondary/5 border border-border rounded-xl px-4 py-3 font-bold text-lg focus:border-primary outline-none transition-all"
                                        value={editingPlatform.commission}
                                        onChange={(e) => setEditingPlatform({ ...editingPlatform, commission: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-secondary tracking-widest uppercase ml-1">KARGO MALİYETİ (₺)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-secondary/5 border border-border rounded-xl px-4 py-3 font-bold text-lg focus:border-primary outline-none transition-all"
                                        value={editingPlatform.shipping}
                                        onChange={(e) => setEditingPlatform({ ...editingPlatform, shipping: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button
                                        onClick={() => setEditingPlatform(null)}
                                        className="flex-1 px-6 py-4 rounded-xl border border-border font-black text-sm hover:bg-secondary/5 transition-all uppercase"
                                    >
                                        İPTAL
                                    </button>
                                    <button
                                        onClick={handleSavePlatformEdit}
                                        className="flex-1 px-6 py-4 rounded-xl bg-primary text-white font-black text-sm shadow-xl shadow-primary/20 hover:opacity-90 transition-all uppercase"
                                    >
                                        GÜNCELLE
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
