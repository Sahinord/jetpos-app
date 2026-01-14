"use client";

import { useState, useMemo } from "react";
import { TrendingUp, AlertCircle, Save, ArrowRight, Search } from "lucide-react";

export default function PriceSimulator({ products, onApplyChanges, showToast }: any) {
    const [costIncrease, setCostIncrease] = useState(0);
    const [targetMargin, setTargetMargin] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [displayLimit, setDisplayLimit] = useState(50);

    // Optimize calculations with useMemo
    const simulatedProducts = useMemo(() => {
        return products.map((p: any) => {
            const newCost = p.purchase_price * (1 + costIncrease / 100);
            const currentMargin = p.sale_price > 0 ? ((p.sale_price - p.purchase_price) / p.sale_price) * 100 : 0;
            const effectiveTargetMargin = targetMargin > 0 ? targetMargin : currentMargin;

            // Prevent division by zero if margin is 100%
            const marginDivisor = (1 - effectiveTargetMargin / 100);
            const suggestedPrice = marginDivisor !== 0 ? newCost / marginDivisor : newCost;

            return {
                ...p,
                old_purchase_price: p.purchase_price,
                new_purchase_price: newCost,
                old_sale_price: p.sale_price,
                suggested_sale_price: Math.ceil(suggestedPrice),
                current_margin: currentMargin,
                new_margin: suggestedPrice > 0 ? ((suggestedPrice - newCost) / suggestedPrice) * 100 : 0
            };
        });
    }, [costIncrease, targetMargin, products]);

    // Filtered results for the table
    const filteredProducts = useMemo(() => {
        if (!searchQuery) return simulatedProducts;
        const lowQuery = searchQuery.toLowerCase();
        return simulatedProducts.filter((p: any) =>
            p.name.toLowerCase().includes(lowQuery) ||
            p.barcode?.toLowerCase().includes(lowQuery)
        );
    }, [simulatedProducts, searchQuery]);

    const handleApply = () => {
        const updated = simulatedProducts.map(p => ({
            ...p,
            purchase_price: p.new_purchase_price,
            sale_price: p.suggested_sale_price
        }));
        onApplyChanges(updated);
        showToast(`${updated.length} ürünün fiyatları başarıyla güncellendi!`, "success");
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Control Panel */}
            <div className="flex flex-col lg:flex-row gap-6 bg-card/20 p-6 rounded-3xl border border-border/50 backdrop-blur-xl">
                <div className="flex items-center space-x-4 flex-1">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner border border-primary/20">
                        <TrendingUp className="w-7 h-7" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Akıllı Fiyat Simülatörü</h2>
                        <p className="text-xs text-secondary font-medium">Global maliyet artışlarını tek tıkla fiyatlara yansıtın.</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                        <input
                            type="text"
                            placeholder="Ürünlerde ara..."
                            className="bg-white/5 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-primary outline-none transition-all w-[200px]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center bg-white/5 border border-border p-1.5 rounded-2xl">
                        <div className="flex flex-col px-4">
                            <span className="text-[9px] font-black text-secondary uppercase tracking-widest">Maliyet Artışı</span>
                            <div className="flex items-center group">
                                <span className="text-rose-500 font-bold text-sm mr-1">+%</span>
                                <input
                                    type="number"
                                    className="w-12 bg-transparent font-black outline-none text-white text-lg"
                                    value={costIncrease}
                                    onChange={(e) => setCostIncrease(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                        </div>

                        <div className="w-[1px] h-10 bg-border mx-2" />

                        <div className="flex flex-col px-4">
                            <span className="text-[9px] font-black text-secondary uppercase tracking-widest">Hedef Marj</span>
                            <div className="flex items-center">
                                <span className="text-primary font-bold text-sm mr-1">%</span>
                                <input
                                    type="number"
                                    className="w-12 bg-transparent font-black outline-none text-white text-lg"
                                    value={targetMargin}
                                    placeholder="Auto"
                                    onChange={(e) => setTargetMargin(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Simulated Data Table with Lazy Loading */}
            <div className="glass-card overflow-hidden !p-0 border-white/5 shadow-2xl">
                <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-20 bg-[#1e293b] text-[10px] font-black text-secondary uppercase tracking-[2px] border-b border-white/5">
                            <tr>
                                <th className="px-8 py-5">Ürün Detayı</th>
                                <th className="px-8 py-5">Mevcut Veriler</th>
                                <th className="px-8 py-5 text-rose-400">Yeni Maliyet</th>
                                <th className="px-8 py-5 text-primary">Önerilen Satış</th>
                                <th className="px-8 py-5 text-emerald-400">Kar Değişimi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredProducts.slice(0, displayLimit).map((p: any) => (
                                <tr key={p.id} className="hover:bg-white/5 transition-all group">
                                    <td className="px-8 py-5">
                                        <div className="font-bold text-white group-hover:text-primary transition-colors">{p.name}</div>
                                        <div className="text-[10px] text-secondary font-bold uppercase mt-1 tracking-wider">Mevcut Marj: %{p.current_margin.toFixed(1)}</div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="space-y-0.5">
                                            <div className="text-[10px] text-secondary line-through opacity-50 font-bold">MALIYET: ₺{p.purchase_price.toFixed(2)}</div>
                                            <div className="text-sm font-black text-white/80 tracking-tight">SATIS: ₺{p.sale_price.toFixed(2)}</div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="text-lg font-black text-rose-500 tracking-tighter">₺{p.new_purchase_price.toFixed(2)}</div>
                                        <div className="text-[9px] font-bold text-rose-500/40 uppercase">Artış: +%{costIncrease}</div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3 inline-block shadow-inner group-hover:border-primary/50 transition-all">
                                            <div className="text-xl font-black text-primary tracking-tighter">₺{p.suggested_sale_price.toFixed(2)}</div>
                                            <div className="text-[9px] font-black text-primary/60 uppercase">Yeni Marj: %{p.new_margin.toFixed(1)}</div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center text-emerald-400 font-black text-sm">
                                            <ArrowRight className="w-4 h-4 mr-2 text-secondary opacity-30" />
                                            +₺{(p.suggested_sale_price - p.sale_price).toFixed(2)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredProducts.length > displayLimit && (
                        <div className="p-8 text-center bg-white/[0.02]">
                            <button
                                onClick={() => setDisplayLimit(prev => prev + 50)}
                                className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-secondary hover:text-white transition-all border border-white/5"
                            >
                                {filteredProducts.length - displayLimit} Ürün Daha Var - Listeyi Genişlet
                            </button>
                        </div>
                    )}

                    {filteredProducts.length === 0 && (
                        <div className="p-20 text-center opacity-30">
                            <Search className="w-16 h-16 mx-auto mb-4" />
                            <p className="text-xl font-black">ÜRÜN BULUNAMADI</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-start space-x-4 bg-blue-500/5 border border-blue-500/20 p-5 rounded-3xl max-w-2xl">
                    <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest">Simülasyon Rehberi</h4>
                        <p className="text-xs text-blue-400/60 leading-relaxed mt-1">
                            Marj kutusunu boş bırakırsanız mevcut kar oranlarınız korunur.
                            "Uygula" dediğinizde tüm ürünlerin hem maliyetleri hem satış fiyatları güncellenir.
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleApply}
                    className="flex items-center space-x-4 bg-primary hover:bg-primary/90 text-white px-10 py-5 rounded-[2rem] font-black text-lg shadow-2xl shadow-primary/30 active:scale-95 transition-all relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    <Save className="w-6 h-6 relative z-10" />
                    <span className="relative z-10">TÜM DEĞİŞİKLİKLERİ KAYDET</span>
                </button>
            </div>
        </div>
    );
}
