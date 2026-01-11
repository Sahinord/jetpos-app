"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Percent, AlertCircle, CheckCircle2, RefreshCw, Save, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PriceSimulator({ products, onApplyChanges, showToast }: any) {
    const [costIncrease, setCostIncrease] = useState(0);
    const [targetMargin, setTargetMargin] = useState(0);
    const [simulatedProducts, setSimulatedProducts] = useState<any[]>([]);

    useEffect(() => {
        const simulated = products.map((p: any) => {
            const newCost = p.purchase_price * (1 + costIncrease / 100);
            // current margin: (sale - purchase) / sale
            // to maintain same margin or target margin
            // Target Price = New Cost / (1 - Target Margin / 100)

            const currentMargin = p.sale_price > 0 ? ((p.sale_price - p.purchase_price) / p.sale_price) * 100 : 0;
            const effectiveTargetMargin = targetMargin > 0 ? targetMargin : currentMargin;

            const suggestedPrice = newCost / (1 - effectiveTargetMargin / 100);

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
        setSimulatedProducts(simulated);
    }, [costIncrease, targetMargin, products]);

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
        <div className="space-y-8">
            <div className="flex items-center justify-between bg-card/20 p-6 rounded-2xl border border-border">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-[3px]">Fiyat Simülasyonu</p>
                        <p className="text-sm text-secondary font-medium">Maliyet artışlarını simüle edin.</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Maliyet Artışı</span>
                        <div className="flex items-center bg-white/5 border border-border px-4 py-2 rounded-xl focus-within:border-rose-500/50 transition-colors">
                            <span className="text-rose-500 font-bold mr-1">+%</span>
                            <input
                                type="number"
                                className="w-12 bg-transparent font-bold outline-none text-white"
                                value={costIncrease}
                                onChange={(e) => setCostIncrease(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Hedef Marj</span>
                        <div className="flex items-center bg-white/5 border border-border px-4 py-2 rounded-xl focus-within:border-primary/50 transition-colors">
                            <span className="text-primary font-bold mr-1">%</span>
                            <input
                                type="number"
                                className="w-12 bg-transparent font-bold outline-none text-white"
                                value={targetMargin}
                                placeholder="Auto"
                                onChange={(e) => setTargetMargin(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card overflow-hidden !p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 border-b border-border">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-widest">Ürün</th>
                                <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-widest">Mevcut Durum</th>
                                <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-widest">Yeni Maliyet</th>
                                <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-widest text-primary">Önerilen Fiyat</th>
                                <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-widest">Fark</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {simulatedProducts.map((p) => (
                                <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold">{p.name}</p>
                                        <p className="text-xs text-secondary">Mevcut Marj: %{p.current_margin.toFixed(1)}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm">
                                            <p className="text-secondary line-through">M: ₺{p.purchase_price}</p>
                                            <p className="font-semibold">S: ₺{p.sale_price}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-rose-500 font-semibold">₺{p.new_purchase_price.toFixed(2)}</p>
                                        <p className="text-[10px] text-rose-500/50">+{costIncrease}% Artış</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="bg-primary/10 border border-primary/20 rounded-xl px-3 py-2 inline-block">
                                            <p className="text-primary font-bold text-lg">₺{p.suggested_sale_price}</p>
                                            <p className="text-[10px] text-primary/70">Marj: %{p.new_margin.toFixed(1)}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center text-emerald-400 font-semibold">
                                            <ArrowRight className="w-4 h-4 mr-1 text-secondary" />
                                            +₺{(p.suggested_sale_price - p.sale_price).toFixed(2)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={handleApply}
                    className="flex items-center space-x-3 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary/30 active:scale-[0.98] transition-all"
                >
                    <Save className="w-6 h-6" />
                    <span>SİMÜLASYONU TÜM ÜRÜNLERE UYGULA</span>
                </button>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl flex items-start space-x-4">
                <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0" />
                <div>
                    <h4 className="font-semibold text-blue-400">Önemli Not</h4>
                    <p className="text-sm text-blue-400/80 leading-relaxed mt-1">
                        Hedef kar marjını boş bırakırsanız, sistem her ürünün mevcut kar marjını koruyacak şekilde yeni fiyat hesaplar.
                        "Uygula" butonuna bastığınızda, ürünlerin alış ve satış fiyatları kalıcı olarak güncellenecektir.
                    </p>
                </div>
            </div>
        </div>
    );
}
