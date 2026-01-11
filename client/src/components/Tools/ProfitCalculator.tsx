"use client";

import { useState, useEffect, useRef } from "react";
import { X, Calculator, TrendingUp, AlertCircle, Percent, Coins, Truck, Megaphone, Tag, Save, History, Trash2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const InputField = ({ label, icon: Icon, value, onChange, placeholder = "0.00", suffix = "₺" }: any) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-black text-secondary uppercase tracking-[2px] flex items-center">
            <Icon className="w-3 h-3 mr-1.5 text-primary" /> {label}
        </label>
        <div className="relative group">
            <input
                type="number"
                className="w-full bg-white/5 border border-border group-hover:border-white/20 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-semibold text-white placeholder:text-white/10 pr-10"
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

export default function ProfitCalculatorPage() {
    const [values, setValues] = useState({
        title: "",
        cost: 0,
        shipping: 0,
        commission: 0,
        ads: 0,
        salePrice: 0,
        vat: 1,
        withholding: 1, // %1 Stopaj sabit
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Form */}
                <div className="lg:col-span-2 glass-card !p-8 space-y-8">
                    <div className="space-y-4 pb-6 border-b border-border">
                        <label className="text-xs font-black text-primary uppercase tracking-[2px] flex items-center">
                            Hesaplama İsmi (Opsiyonel)
                        </label>
                        <input
                            type="text"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-semibold text-xl placeholder:text-white/10"
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
                                    className="w-full bg-emerald-500/10 border-2 border-emerald-500/30 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-all font-black text-xl text-emerald-400"
                                    value={values.salePrice === 0 ? "" : values.salePrice}
                                    onChange={(e) => setValues({ ...values, salePrice: parseFloat(e.target.value) || 0 })}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={saveToHistory}
                        className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-xl font-black text-lg flex items-center justify-center space-x-3 transition-all active:scale-[0.98] shadow-xl shadow-primary/20"
                    >
                        <Save className="w-6 h-6" />
                        <span>HESAPLAMAYI KAYDET</span>
                    </button>
                </div>

                {/* Right Results */}
                <div className="glass-card bg-primary/5 !p-8 flex flex-col justify-between border-primary/20">
                    <h3 className="text-xs font-black text-secondary uppercase tracking-[2px] mb-8 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2" /> Canlı Analiz
                    </h3>

                    <div className="space-y-6 flex-1">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-border">
                            <span className="text-secondary font-semibold text-sm">TOPLAM MALİYET</span>
                            <span className="text-xl font-semibold">₺{results.totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-border">
                            <span className="text-secondary font-semibold text-sm">STOPAJ (%1)</span>
                            <span className="text-xl font-semibold text-rose-400">₺{(values.salePrice * 0.01).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>

                        <div className="flex items-center justify-between p-6 rounded-2xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/20">
                            <span className="font-semibold">NET KAR</span>
                            <span className="text-3xl font-black">₺{results.netProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-white/5 border border-border">
                                <p className="text-[10px] text-secondary font-black uppercase mb-1">MARJ</p>
                                <p className={`text-2xl font-black ${results.margin < 0 ? 'text-rose-500' : 'text-emerald-400'}`}>%{results.margin.toFixed(1)}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-border">
                                <p className="text-[10px] text-secondary font-black uppercase mb-1">ROI</p>
                                <p className={`text-2xl font-black ${results.roi < 0 ? 'text-rose-500' : 'text-blue-400'}`}>%{results.roi.toFixed(1)}</p>
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
                                    className="w-full bg-white/5 border border-border rounded-lg px-2 py-2 outline-none text-sm"
                                    value={dimensions.width === 0 ? "" : dimensions.width}
                                    onChange={(e) => setDimensions({ ...dimensions, width: e.target.value === "" ? 0 : parseFloat(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-secondary uppercase block mb-1">Boy (cm)</label>
                                <input
                                    type="number"
                                    className="w-full bg-white/5 border border-border rounded-lg px-2 py-2 outline-none text-sm"
                                    value={dimensions.height === 0 ? "" : dimensions.height}
                                    onChange={(e) => setDimensions({ ...dimensions, height: e.target.value === "" ? 0 : parseFloat(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-secondary uppercase block mb-1">Yük. (cm)</label>
                                <input
                                    type="number"
                                    className="w-full bg-white/5 border border-border rounded-lg px-2 py-2 outline-none text-sm"
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
                                className="glass-card !p-6 border-white/5 hover:border-white/10 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-semibold text-lg text-white group-hover:text-primary transition-colors">{item.title}</h4>
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
                                        <p className={`font-black text-lg ${item.netProfit < 0 ? 'text-rose-500' : 'text-emerald-400'}`}>
                                            ₺{item.netProfit.toLocaleString('tr-TR', { minimumFractionDigits: 1 })}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-secondary">MARJ: <span className={item.margin < 15 ? 'text-amber-500' : 'text-emerald-500'}>%{item.margin.toFixed(1)}</span></span>
                                    <span className="text-secondary">ROI: <span className="text-blue-400">%{item.roi.toFixed(1)}</span></span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {history.length === 0 && (
                        <div className="col-span-full py-20 glass-card text-center border-dashed border-white/10 opacity-30">
                            <History className="w-12 h-12 mx-auto mb-4" />
                            <p className="text-lg font-bold">Henüz kaydedilmiş hesaplama yok.</p>
                            <p className="text-sm">Yukarıdaki formdan hesaplama yapıp kaydedebilirsiniz.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
