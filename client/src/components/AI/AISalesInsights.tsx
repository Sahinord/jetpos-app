"use client";

import { useState, useEffect } from "react";
import { Sparkles, BarChart3, TrendingUp, Lightbulb, RefreshCw, AlertTriangle, Key } from "lucide-react";
import { motion } from "framer-motion";
import { GeminiAIClient } from "@/lib/gemini";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";
import ReactMarkdown from "react-markdown";

export default function AISalesInsights() {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(false);
    const [insight, setInsight] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState('');
    const [showKeyInput, setShowKeyInput] = useState(false);

    useEffect(() => {
        fetchGeminiSettings();
    }, [currentTenant]);

    const fetchGeminiSettings = async () => {
        if (!currentTenant) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('integration_settings')
                .select('settings')
                .eq('tenant_id', currentTenant.id)
                .eq('type', 'gemini_ai')
                .single();

            if (data && data.settings.apiKey) {
                setApiKey(data.settings.apiKey);
                setShowKeyInput(false);
            } else {
                setShowKeyInput(true);
            }
        } catch (err) {
            setShowKeyInput(true);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveKey = async () => {
        if (!apiKey) return;
        setLoading(true);
        try {
            const { error } = await supabase.rpc('upsert_integration_settings', {
                p_tenant_id: currentTenant?.id,
                p_type: 'gemini_ai',
                p_settings: { apiKey: apiKey },
                p_is_active: true
            });

            if (error) throw error;
            setShowKeyInput(false);
            alert("✅ AI Anahtarı başarıyla kaydedildi.");
        } catch (err: any) {
            alert("❌ Kayıt hatası: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchInsights = async () => {
        if (!apiKey) {
            alert("Lütfen önce Gemini API Key girin!");
            setShowKeyInput(true);
            return;
        }

        setLoading(true);
        try {
            // Son 30 günlük satış verilerini çek
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data: sales, error } = await supabase
                .from('sale_items')
                .select(`
                    created_at,
                    quantity,
                    unit_price,
                    products (name)
                `)
                .gte('created_at', thirtyDaysAgo.toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!sales || sales.length === 0) {
                alert("Analiz için yeterli satış verisi bulunamadı!");
                return;
            }

            // Verileri AI Formatına getir
            const formattedSales = sales.map((s: any) => ({
                date: s.created_at.split('T')[0],
                product_name: s.products?.name || 'Bilinmeyen Ürün',
                quantity: s.quantity,
                total_amount: s.quantity * s.unit_price
            }));

            const client = new GeminiAIClient(apiKey);
            const report = await client.getSalesInsights(formattedSales);
            setInsight(report);

        } catch (error: any) {
            alert("AI Analizi yapılırken bir hata oluştu: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* API settings button - Top Right */}
            <div className="flex justify-end">
                <button
                    onClick={() => setShowKeyInput(!showKeyInput)}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-secondary hover:text-white transition-all border border-white/5"
                    title="API Ayarları"
                >
                    <Key className="w-5 h-5" />
                </button>
            </div>

            {/* API Key Input */}
            {showKeyInput && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6 border-l-4 border-purple-500 space-y-4"
                >
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-purple-500/10 rounded-xl">
                            <Key className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <h3 className="font-bold text-[var(--color-foreground)]">Gemini API Key Gerekli</h3>
                            <p className="text-xs text-slate-500">Ücretsiz AI servisi için aistudio.google.com üzerinden bir anahtar almanız gerekiyor.</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="AI API Key buraya yapıştırın..."
                            className="flex-1 bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-foreground)] focus:border-purple-500/50 outline-none transition-all"
                        />
                        <button
                            onClick={handleSaveKey}
                            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-sm transition-all"
                        >
                            Kaydet
                        </button>
                    </div>
                </motion.div>
            )}

            {!insight ? (
                /* Empty State / Initial */
                <div className="glass-card p-12 text-center space-y-8">
                    <div className="relative inline-block">
                        <div className="absolute -inset-4 bg-purple-500/20 blur-2xl rounded-full" />
                        <Sparkles className="w-20 h-20 text-purple-500 relative animate-pulse" />
                    </div>
                    <div className="max-w-lg mx-auto space-y-4">
                        <h2 className="text-2xl font-bold text-[var(--color-foreground)]">Satışlarınızı AI ile Geleceğe Taşıyın</h2>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Yapay zeka, son satış verilerinizi analiz ederek hangi ürünlerin tükenebileceğini,
                            haftalık ciro tahminlerinizi ve kârınızı artıracak stratejileri size sunar.
                        </p>
                    </div>
                    <button
                        onClick={fetchInsights}
                        disabled={loading}
                        className="relative group p-[1px] rounded-2xl overflow-hidden hover:scale-105 transition-all active:scale-95"
                    >
                        <div className="absolute inset-[-1000%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#8b5cf6_0%,#c084fc_50%,#8b5cf6_100%)]" />
                        <div className="relative px-12 py-5 bg-[var(--color-input-bg)] rounded-2xl flex items-center justify-center gap-3">
                            {loading ? (
                                <RefreshCw className="w-5 h-5 text-purple-400 animate-spin" />
                            ) : (
                                <Sparkles className="w-5 h-5 text-purple-400" />
                            )}
                            <span className="text-[var(--color-foreground)] font-black">
                                {loading ? 'Veriler Analiz Ediliyor...' : 'Analizi Başlat'}
                            </span>
                        </div>
                    </button>
                </div>
            ) : (
                /* Analysis Result */
                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card p-10 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Sparkles className="w-32 h-32 text-purple-500" />
                        </div>

                        <div className="prose prose-invert max-w-none prose-p:text-secondary prose-p:leading-relaxed prose-headings:text-[var(--color-foreground)] prose-li:text-secondary prose-strong:text-purple-400">
                            <ReactMarkdown>{insight}</ReactMarkdown>
                        </div>

                        <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between">
                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">JetPos AI v1.0 • Analiz Tamamlandı</p>
                            <button
                                onClick={fetchInsights}
                                className="flex items-center gap-2 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Yeniden Analiz Et
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Features Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { icon: BarChart3, title: "Detaylı Analiz", desc: "Tüm stok ve satış hareketleriniz AI tarafından tek tek incelenir." },
                    { icon: TrendingUp, title: "Trend Takibi", desc: "Hangi ürünün hangi günlerde daha çok sattığı otomatik tespit edilir." },
                    { icon: Lightbulb, title: "Akıllı Öneriler", desc: "Sipariş listeleri ve kampanya kurguları için gerçekçi fikirler üretilir." }
                ].map((f, i) => (
                    <div key={i} className="glass-card p-6 bg-white/[0.02] border-white/5 space-y-4">
                        <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                            <f.icon className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h4 className="font-bold text-[var(--color-foreground)] text-sm">{f.title}</h4>
                            <p className="text-xs text-secondary leading-relaxed mt-1">{f.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
