"use client";

import { useState } from 'react';
import { Upload, Sparkles, X, FileText, Loader2, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/lib/tenant-context';

interface AnalyzedInvoiceItem {
    product_name: string;
    quantity: number;
    unit: string;
    gross_price: number; // Brüt birim fiyat (İskonto öncesi)
    discount_amount: number; // İskonto tutarı
    net_price: number; // Net birim fiyat (İskonto sonrası)
    vat_rate: number;
    profit_margin: number; // Kar marjı %
    suggested_sale_price: number; // Önerilen satış fiyatı
}

interface AnalyzedInvoice {
    supplier_name: string;
    invoice_number: string;
    invoice_date: string;
    total_amount: number;
    total_discount: number;
    net_amount: number;
    items: AnalyzedInvoiceItem[];
}

interface Props {
    onAnalyzed: (data: AnalyzedInvoice) => void;
    onClose: () => void;
}

export default function AIPDFInvoiceAnalyzer({ onAnalyzed, onClose }: Props) {
    const { currentTenant } = useTenant();
    const [file, setFile] = useState<File | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [progress, setProgress] = useState({ stage: '', percent: 0 });
    const [analyzedData, setAnalyzedData] = useState<AnalyzedInvoice | null>(null);
    const [showProfitMargins, setShowProfitMargins] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type === 'application/pdf') {
                setFile(selectedFile);
            } else {
                alert('Lütfen PDF dosyası seçin!');
            }
        }
    };

    const updateProfitMargin = (index: number, newMargin: number) => {
        if (!analyzedData) return;

        const updatedItems = [...analyzedData.items];
        updatedItems[index] = {
            ...updatedItems[index],
            profit_margin: newMargin,
            suggested_sale_price: Math.round(updatedItems[index].net_price * (1 + (newMargin / 100)) * 100) / 100
        };

        setAnalyzedData({
            ...analyzedData,
            items: updatedItems
        });
    };

    const confirmAndApply = () => {
        if (analyzedData) {
            onAnalyzed(analyzedData);
        }
    };

    const analyzePDF = async () => {
        if (!file) {
            alert('Lütfen bir PDF dosyası seçin!');
            return;
        }

        setAnalyzing(true);
        try {
            // Step 1: Upload PDF to Supabase Storage
            setProgress({ stage: 'PDF yükleniyor...', percent: 20 });
            const fileName = `invoice_${Date.now()}.pdf`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('invoices')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('invoices')
                .getPublicUrl(fileName);

            // Step 2: Send to Gemini AI for analysis
            setProgress({ stage: 'AI ile analiz ediliyor...', percent: 50 });

            const response = await fetch('/api/analyze-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pdf_url: publicUrl,
                    tenant_id: currentTenant?.id
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'AI analizi başarısız oldu');
            }

            const aiResult: AnalyzedInvoice = await response.json();

            // Step 3: Calculate profit margins and sale prices
            setProgress({ stage: 'Kar marjleri hesaplanıyor...', percent: 75 });

            // Get historical profit margins for similar products
            const enhancedItems = await Promise.all(
                aiResult.items.map(async (item) => {
                    // Check if product exists in database
                    const { data: existingProduct } = await supabase
                        .from('products')
                        .select('sale_price, purchase_price')
                        .ilike('name', `%${item.product_name}%`)
                        .limit(1)
                        .single();

                    let profitMargin = 35; // Default 35%

                    if (existingProduct && existingProduct.purchase_price > 0) {
                        // Calculate historical profit margin
                        profitMargin = ((existingProduct.sale_price - existingProduct.purchase_price) / existingProduct.purchase_price) * 100;
                    }

                    const suggestedSalePrice = item.net_price * (1 + (profitMargin / 100));

                    return {
                        ...item,
                        profit_margin: Math.round(profitMargin * 100) / 100,
                        suggested_sale_price: Math.round(suggestedSalePrice * 100) / 100
                    };
                })
            );

            setProgress({ stage: 'Tamamlandı!', percent: 100 });

            // Show profit margin confirmation
            setAnalyzedData({
                ...aiResult,
                items: enhancedItems
            });
            setShowProfitMargins(true);

        } catch (error: any) {
            console.error('PDF Analiz Hatası:', error);
            alert('Hata: ' + error.message);
        } finally {
            setAnalyzing(false);
        }
    };

    // Profit Margin Confirmation Screen
    if (showProfitMargins && analyzedData) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-card border border-border rounded-2xl max-w-5xl w-full max-h-[90vh] shadow-2xl flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-border">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <Check className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-white">Kar Marjlarını Onayla</h2>
                                <p className="text-[10px] text-secondary uppercase tracking-wider">Fiyat optimizasyonu için kontrol edin</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center transition-colors"
                        >
                            <X className="w-5 h-5 text-secondary hover:text-white" />
                        </button>
                    </div>

                    {/* Invoice Info */}
                    <div className="px-6 py-4 bg-emerald-500/[0.02] border-b border-border">
                        <div className="grid grid-cols-4 gap-6 text-[11px]">
                            <div>
                                <span className="text-secondary block mb-1">Tedarikçi:</span>
                                <p className="font-semibold text-white truncate">{analyzedData.supplier_name}</p>
                            </div>
                            <div>
                                <span className="text-secondary block mb-1">Fatura No:</span>
                                <p className="font-semibold text-white">{analyzedData.invoice_number}</p>
                            </div>
                            <div>
                                <span className="text-secondary block mb-1">Net Tutar:</span>
                                <p className="font-semibold text-emerald-400">{analyzedData.net_amount.toFixed(2)} ₺</p>
                            </div>
                            <div>
                                <span className="text-secondary block mb-1">Ürün Sayısı:</span>
                                <p className="font-semibold text-white">{analyzedData.items.length} Kalem</p>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="flex-1 overflow-auto p-4">
                        <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-card border-b border-border/50">
                                <tr className="text-[10px] text-secondary uppercase tracking-tight">
                                    <th className="text-left py-3 px-3">Ürün Adı</th>
                                    <th className="text-center py-3 px-3 w-20">Miktar</th>
                                    <th className="text-right py-3 px-3 w-24">Net Alış</th>
                                    <th className="text-center py-3 px-3 w-28 bg-amber-500/5">Kar Marjı %</th>
                                    <th className="text-right py-3 px-3 w-32 bg-emerald-500/5">Satış Fiyatı</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {analyzedData.items.map((item, index) => (
                                    <tr key={index} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="py-2.5 px-3">
                                            <p className="font-medium text-white text-sm">{item.product_name}</p>
                                            {item.discount_amount > 0 && (
                                                <p className="text-[10px] text-amber-500/70">
                                                    İskonto: {item.discount_amount.toFixed(2)} ₺
                                                </p>
                                            )}
                                        </td>
                                        <td className="text-center py-2.5 px-3 text-secondary">
                                            {item.quantity} {item.unit}
                                        </td>
                                        <td className="text-right py-2.5 px-3 font-medium text-white/90">
                                            {item.net_price.toFixed(2)} ₺
                                        </td>
                                        <td className="py-2.5 px-3 bg-amber-500/[0.02]">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <input
                                                    type="number"
                                                    value={item.profit_margin}
                                                    onChange={(e) => updateProfitMargin(index, parseFloat(e.target.value) || 0)}
                                                    step="0.1"
                                                    className="w-16 px-2 py-1 bg-amber-500/5 border border-amber-500/20 rounded-lg text-amber-500 font-semibold text-center focus:outline-none focus:border-amber-500/50 text-xs"
                                                />
                                                <span className="text-amber-500/50 text-[10px]">%</span>
                                            </div>
                                        </td>
                                        <td className="text-right py-2.5 px-3 font-semibold text-emerald-400 bg-emerald-500/[0.02] text-sm">
                                            {item.suggested_sale_price.toFixed(2)} ₺
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 p-4 border-t border-border bg-emerald-500/[0.02]">
                        <button
                            onClick={() => setShowProfitMargins(false)}
                            className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl font-medium text-white transition-all text-sm border border-white/10"
                        >
                            Geri Dön
                        </button>
                        <button
                            onClick={confirmAndApply}
                            className="flex-[2] px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 text-sm"
                        >
                            <Check className="w-4 h-4" />
                            Onayla ve Faturaya Aktar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Upload Screen
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-2xl max-w-2xl w-full shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white">JetPos AI Analiz</h2>
                            <p className="text-[10px] text-secondary uppercase tracking-widest font-medium">DeepSeek-V3 Engine</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center transition-colors group"
                    >
                        <X className="w-5 h-5 text-secondary group-hover:text-white transition-colors" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-5">
                    {/* File Upload */}
                    <div className="space-y-2">
                        <label className="block text-[11px] font-semibold text-secondary uppercase tracking-wider">Fatura PDF'i</label>

                        {!file ? (
                            <label className="group relative block w-full h-32 border-2 border-dashed border-white/5 hover:border-primary/50 rounded-xl cursor-pointer transition-all overflow-hidden bg-white/[0.02]">
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 group-hover:bg-primary/5 transition-colors">
                                    <Upload className="w-8 h-8 text-secondary group-hover:text-primary transition-colors" />
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-white">Faturayı buraya yükle</p>
                                        <p className="text-[10px] text-secondary">PDF formatında dosya seçin</p>
                                    </div>
                                </div>
                            </label>
                        ) : (
                            <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white truncate max-w-[200px]">{file.name}</p>
                                        <p className="text-[10px] text-secondary">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setFile(null)}
                                    className="w-7 h-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center transition-colors group"
                                >
                                    <X className="w-4 h-4 text-secondary group-hover:text-destructive transition-colors" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* AI Analysis Info */}
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                        <h3 className="text-[11px] font-semibold text-primary mb-3 flex items-center gap-2 uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5" />
                            İşlem Adımları
                        </h3>
                        <ul className="grid grid-cols-2 gap-3 text-[10px] text-secondary font-medium">
                            <li className="flex items-start gap-2">
                                <Check className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                                <span>Tedarikçi ve fatura bilgilerini ayıklar</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                                <span>Ürün kalemlerini ve miktarları tespit eder</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                                <span>Net alış fiyatlarını hesaplar</span>
                            </li>
                            <li className="flex items-start gap-2 border-l border-amber-500/30 pl-2">
                                <Check className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                                <span className="text-amber-500/80">Kar marjlarını sizin onayınıza sunar</span>
                            </li>
                        </ul>
                    </div>

                    {/* Progress */}
                    {analyzing && (
                        <div className="space-y-2.5 pt-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                                    <span className="text-xs font-semibold text-white/90">{progress.stage}</span>
                                </div>
                                <span className="text-[10px] font-bold text-primary">{progress.percent}%</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <div
                                    className="h-full bg-primary transition-all duration-500 relative"
                                    style={{ width: `${progress.percent}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-5 border-t border-border bg-white/[0.01]">
                    <button
                        onClick={onClose}
                        disabled={analyzing}
                        className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl font-medium text-white transition-all disabled:opacity-50 text-xs border border-white/5"
                    >
                        İptal
                    </button>
                    <button
                        onClick={analyzePDF}
                        disabled={!file || analyzing}
                        className="flex-[2] px-4 py-2 bg-primary hover:bg-primary/90 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/10 disabled:opacity-50 text-xs"
                    >
                        {analyzing ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Analiz Ediliyor...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-3.5 h-3.5" />
                                Analizi Başlat
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
