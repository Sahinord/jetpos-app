"use client";

import { useState, useEffect } from "react";
import { 
    Trash2, 
    Zap, 
    AlertTriangle, 
    ArrowRight, 
    Sparkles, 
    Package, 
    ShieldAlert,
    RefreshCcw,
    X,
    CheckCircle2,
    Coins
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

export default function StockBuster() {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(true);
    const [deadStock, setDeadStock] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalTiedCapital: 0,
        highRiskCount: 0,
        recoveryPotential: 0
    });

    // Operation State
    const [isOperationModalOpen, setIsOperationModalOpen] = useState(false);
    const [discountRate, setDiscountRate] = useState(20);
    const [isApplying, setIsApplying] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        if (currentTenant) fetchRealDeadStock();
    }, [currentTenant]);

    const fetchRealDeadStock = async () => {
        if (!currentTenant) return;
        setLoading(true);
        try {
            const { data: products } = await supabase
                .from('products')
                .select('id, name, barcode, purchase_price, sale_price, stock_quantity')
                .eq('tenant_id', currentTenant.id)
                .gt('stock_quantity', 0)
                .is('deleted_at', null);

            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            
            const { data: recentSaleItems } = await supabase
                .from('sale_items')
                .select('product_id')
                .eq('tenant_id', currentTenant.id)
                .gte('created_at', ninetyDaysAgo.toISOString());

            const soldProductIds = new Set(recentSaleItems?.map(item => item.product_id));
            const bayatStock = products?.filter(p => !soldProductIds.has(p.id)) || [];

            let totalCapital = 0;
            const deadStockList = bayatStock.map(p => {
                const capital = Number(p.purchase_price || 0) * Number(p.stock_quantity || 0);
                totalCapital += capital;
                return {
                    id: p.id,
                    name: p.name,
                    stock: p.stock_quantity,
                    days: 90,
                    capital: capital,
                    currentPrice: p.sale_price,
                    risk: capital > 1000 ? "Kritik" : "Yüksek"
                };
            }).sort((a, b) => b.capital - a.capital);

            setDeadStock(deadStockList.slice(0, 10));
            setStats({
                totalTiedCapital: totalCapital,
                highRiskCount: deadStockList.length,
                recoveryPotential: totalCapital * 0.8
            });
        } catch (error) {
            console.error("Stock Buster Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyLiquidation = async () => {
        setIsApplying(true);
        try {
            // Apply real price update to DB for dead stock items
            const updates = deadStock.map(item => {
                const newPrice = item.currentPrice * (1 - discountRate / 100);
                return supabase
                    .from('products')
                    .update({ sale_price: newPrice })
                    .eq('id', item.id);
            });

            await Promise.all(updates);
            
            setSuccessMessage(`${deadStock.length} ürün için %${discountRate} likidasyon indirimi uygulandı. Sermaye geri kazanımı başlatıldı!`);
            setTimeout(() => {
                setSuccessMessage(null);
                setIsOperationModalOpen(false);
                fetchRealDeadStock();
            }, 3000);
        } catch (error) {
            console.error("Liquidation Error:", error);
        } finally {
            setIsApplying(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="w-8 h-8 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6 pb-12 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center border border-rose-500/20 shadow-lg shadow-rose-500/5">
                        <Trash2 className="text-rose-500 w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">Stok Eritme Operasyonu</h1>
                        <p className="text-xs text-slate-500 font-medium">Sermayenizi Nakde Çeviren Akıllı Motor</p>
                    </div>
                </div>
                <div className="px-4 py-2 bg-rose-500/5 border border-rose-500/10 rounded-lg flex items-center gap-2">
                    <ShieldAlert size={14} className="text-rose-500" />
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">{stats.highRiskCount} RİSKLİ ÜRÜN TESPİTİ</span>
                </div>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card border border-border p-6 rounded-2xl flex items-center justify-between bg-gradient-to-r from-rose-500/[0.03] to-transparent">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ATIL SERMAYE</p>
                        <h2 className="text-3xl font-bold text-white tracking-tight">₺{stats.totalTiedCapital.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</h2>
                        <p className="text-[10px] font-bold text-rose-500/60 uppercase mt-1 italic">90 Gündür Hareketsiz Ürün Maliyeti</p>
                    </div>
                    <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center">
                        <AlertTriangle className="text-rose-500 animate-pulse" size={24} />
                    </div>
                </div>
                <div className="bg-card border border-border p-6 rounded-2xl flex items-center justify-between bg-gradient-to-r from-emerald-500/[0.03] to-transparent">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">KURTARMA POTANSİYELİ</p>
                        <h2 className="text-3xl font-bold text-emerald-500 tracking-tight">₺{stats.recoveryPotential.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</h2>
                        <p className="text-[10px] font-bold text-emerald-500/60 uppercase mt-1 italic">Operasyon Sonrası Tahmini Nakit</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
                        <RefreshCcw className="text-emerald-500" size={24} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">ANALİZ SONUÇLARI</h3>
                        <button onClick={fetchRealDeadStock} className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest">Analizi Yenile</button>
                    </div>
                    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
                        <table className="w-full text-left">
                            <thead className="bg-white/[0.02] border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ürün Bilgisi</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Stok</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Durum</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Maliyet</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {deadStock.map((item, i) => (
                                    <tr key={item.id} className="hover:bg-white/[0.01] transition-all group">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-white text-sm truncate max-w-[200px]">{item.name}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Fiyat: ₺{item.currentPrice.toLocaleString('tr-TR')}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-white text-sm">{item.stock}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-tighter
                                                ${item.risk === 'Kritik' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                                                {item.risk}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-bold text-slate-300 text-sm">₺{item.capital.toLocaleString('tr-TR')}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* AI Plan & Action */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest px-1">AI AKSİYON PLANI</h3>
                    <div className="bg-rose-500/5 border border-rose-500/10 p-6 rounded-2xl relative overflow-hidden">
                        <div className="absolute -right-12 -top-12 w-32 h-32 bg-rose-500/10 blur-[50px] rounded-full" />
                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <Sparkles className="text-rose-500 w-6 h-6 animate-pulse" />
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">JETPİLOT ÖNERİSİ</h3>
                        </div>
                        <p className="text-sm text-slate-300 font-bold leading-relaxed italic border-l-2 border-rose-500/30 pl-4 mb-8 relative z-10">
                            "Listenin başındaki {deadStock.length} ürün 90 gündür raflarda sermaye bağlıyor. Bu ürünler için bir indirim operasyonu başlatarak ₺{stats.recoveryPotential.toLocaleString('tr-TR')} nakit girişi sağlayabiliriz."
                        </p>
                        <button 
                            onClick={() => setIsOperationModalOpen(true)}
                            className="w-full py-4 bg-rose-600 text-white rounded-xl font-bold text-xs uppercase tracking-[3px] hover:bg-rose-500 transition-all shadow-[0_0_30px_rgba(225,29,72,0.3)] active:scale-95 relative z-10"
                        >
                            OPERASYONU BAŞLAT
                        </button>
                    </div>

                    <div className="bg-card border border-border p-6 rounded-2xl">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">SERMAYE KORUMA ÖZETİ</h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-slate-600">LİKİDASYON ETKİSİ</span>
                                <span className="text-emerald-500">+%82 GÜVENLİ</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: '82%' }} />
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium italic leading-relaxed">
                                Bu operasyon sonrasında dükkanın nakit akışı %14 oranında güçlenecektir.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Operation Modal */}
            <AnimatePresence>
                {isOperationModalOpen && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-card border border-rose-500/30 w-full max-w-md rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(225,29,72,0.2)]"
                        >
                            <div className="bg-rose-500/10 p-8 border-b border-rose-500/20 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg">
                                        <Zap className="text-white w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Likidasyon Operasyonu</h3>
                                        <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">Sermaye Kurtarma Başlatılıyor</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsOperationModalOpen(false)} className="p-2 hover:bg-white/5 rounded-lg text-slate-500">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">İndirim Oranı</label>
                                        <span className="text-2xl font-black text-rose-500">%{discountRate}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="5" 
                                        max="50" 
                                        step="5"
                                        value={discountRate}
                                        onChange={(e) => setDiscountRate(parseInt(e.target.value))}
                                        className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-rose-500"
                                    />
                                    <div className="flex justify-between text-[10px] font-bold text-slate-600">
                                        <span>%5 (HAFİF)</span>
                                        <span>%50 (AGRESİF)</span>
                                    </div>
                                </div>

                                <div className="p-6 bg-slate-950/50 rounded-2xl border border-white/5 space-y-4">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500">Etkilenecek Ürün Sayısı:</span>
                                        <span className="text-white font-bold">{deadStock.length} Adet</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500">Hedeflenen Nakit Girişi:</span>
                                        <span className="text-emerald-500 font-bold">₺{(stats.totalTiedCapital * (1 - discountRate/100)).toLocaleString('tr-TR')}</span>
                                    </div>
                                </div>

                                {successMessage ? (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-4 text-emerald-500">
                                        <CheckCircle2 size={24} />
                                        <p className="text-xs font-bold leading-relaxed">{successMessage}</p>
                                    </motion.div>
                                ) : (
                                    <button 
                                        onClick={handleApplyLiquidation}
                                        disabled={isApplying}
                                        className="w-full py-5 bg-rose-600 text-white rounded-2xl font-bold text-xs uppercase tracking-[4px] hover:bg-rose-500 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {isApplying ? (
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Coins size={18} />
                                                SATIŞI BAŞLAT
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
