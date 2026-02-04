"use client";

import { useState, useEffect } from 'react';
import {
    TrendingDown, Save, Search, AlertTriangle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/lib/tenant-context';

export default function IadeFiyatFarkiFisi() {
    const { currentTenant } = useTenant();
    const [documentNo, setDocumentNo] = useState('');
    const [documentDate, setDocumentDate] = useState(new Date().toISOString().split('T')[0]);
    const [originalInvoiceNo, setOriginalInvoiceNo] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);

    const [priceDifference, setPriceDifference] = useState(0);
    const [diffReason, setDiffReason] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (currentTenant) {
            fetchCustomers();
            generateDocumentNo();
        }
    }, [currentTenant]);

    const generateDocumentNo = async () => {
        const { data } = await supabase
            .from('invoices')
            .select('invoice_no')
            .eq('tenant_id', currentTenant?.id)
            .eq('invoice_type', 'iade_fiyat_farki')
            .order('created_at', { ascending: false })
            .limit(1);

        if (data && data.length > 0) {
            const lastNo = parseInt(data[0].invoice_no.replace('IFF', ''));
            setDocumentNo(`IFF${String(lastNo + 1).padStart(8, '0')}`);
        } else {
            setDocumentNo(`IFF${String(1).padStart(8, '0')}`);
        }
    };

    const fetchCustomers = async () => {
        const { data } = await supabase
            .from('cari_hesaplar')
            .select('*')
            .eq('tenant_id', currentTenant?.id)
            .order('unvan');
        setCustomers(data || []);
    };

    const handleSave = async () => {
        if (!selectedCustomer) {
            alert('Lütfen müşteri seçin!');
            return;
        }
        if (!originalInvoiceNo) {
            alert('Lütfen orijinal fatura numarasını girin!');
            return;
        }
        if (priceDifference === 0) {
            alert('Lütfen fiyat farkı tutarını girin!');
            return;
        }

        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .insert({
                tenant_id: currentTenant?.id,
                invoice_type: 'iade_fiyat_farki',
                invoice_no: documentNo,
                invoice_date: documentDate,
                cari_id: selectedCustomer.id,
                cari_name: selectedCustomer.unvan,
                subtotal: -priceDifference,
                vat_total: 0,
                total_amount: -priceDifference,
                payment_status: 'adjusted',
                notes: `Fiyat Farkı İadesi - Org: ${originalInvoiceNo}\nSebep: ${diffReason}\n${notes}`,
                original_invoice_no: originalInvoiceNo
            })
            .select()
            .single();

        if (invoiceError) {
            alert('Hata: ' + invoiceError.message);
            return;
        }

        // Cari hesaba düzeltme kaydı
        await supabase.from('cari_hareketler').insert({
            tenant_id: currentTenant?.id,
            cari_id: selectedCustomer.id,
            hareket_tipi: 'fiyat_farki_iadesi',
            aciklama: `Fiyat Farkı İadesi - ${documentNo} (Org: ${originalInvoiceNo})`,
            borc: 0,
            alacak: priceDifference, // Müşterinin alacağı artır
            tarih: documentDate
        });

        alert('Fiyat farkı fişi kaydedildi!');
        resetForm();
    };

    const resetForm = () => {
        setSelectedCustomer(null);
        setCustomerSearch('');
        setOriginalInvoiceNo('');
        setPriceDifference(0);
        setDiffReason('');
        setNotes('');
        generateDocumentNo();
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Form */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Fiş Bilgileri</h3>
                    <div className="text-right">
                        <span className="text-[10px] text-secondary uppercase font-bold">Fiş No:</span>
                        <span className="ml-2 text-xs font-bold text-amber-400 font-mono italic">{documentNo}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-medium text-secondary mb-2">Fiş Tarihi</label>
                        <input
                            type="date"
                            value={documentDate}
                            onChange={(e) => setDocumentDate(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-secondary mb-2">Orijinal Fatura No*</label>
                        <input
                            type="text"
                            value={originalInvoiceNo}
                            onChange={(e) => setOriginalInvoiceNo(e.target.value)}
                            placeholder="SF00000001"
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-secondary mb-2">Müşteri/Tedarikçi*</label>
                        <button
                            onClick={() => setShowCustomerModal(true)}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-left hover:border-amber-500 transition-colors"
                        >
                            {selectedCustomer ? (
                                <span className="text-white font-medium">{selectedCustomer.unvan}</span>
                            ) : (
                                <span className="text-secondary">Cari Seç...</span>
                            )}
                        </button>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-secondary mb-2">Fiyat Farkı Tutarı (₺)*</label>
                        <input
                            type="number"
                            value={priceDifference}
                            onChange={(e) => setPriceDifference(parseFloat(e.target.value) || 0)}
                            step="0.01"
                            min="0"
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500"
                            placeholder="0.00"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-secondary mb-2">Fark Sebebi</label>
                        <select
                            value={diffReason}
                            onChange={(e) => setDiffReason(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500"
                        >
                            <option value="">Seçiniz...</option>
                            <option value="Yanlış fiyat faturalandırma">Yanlış fiyat faturalandırma</option>
                            <option value="Kampanya farkı">Kampanya farkı</option>
                            <option value="İskonto farkı">İskonto farkı</option>
                            <option value="KDV düzeltmesi">KDV düzeltmesi</option>
                            <option value="Diğer">Diğer</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-secondary mb-2">Açıklama</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500 resize-none"
                            placeholder="Detaylı açıklama..."
                        />
                    </div>
                </div>

                {/* Warning */}
                <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-200">
                            <p className="font-bold mb-1">Dikkat!</p>
                            <p>Bu fiş, müşteri ile aranızdaki fiyat farkından kaynaklanan düzeltmeleri kaydetmek için kullanılır. Pozitif tutar müşterinin alacağını artırır (iade), negatif tutar borcunu artırır.</p>
                        </div>
                    </div>
                </div>

                {/* Summary */}
                {priceDifference > 0 && (
                    <div className="mt-6 glass-card p-6 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-secondary">İade Edilecek Tutar</span>
                                <span className="text-3xl font-black text-amber-400">-{priceDifference.toFixed(2)} ₺</span>
                            </div>
                            <p className="text-xs text-secondary">Müşterinin {selectedCustomer?.unvan || 'seçilen cari'} alacağı artacak</p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                    <button
                        onClick={resetForm}
                        className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-semibold text-white transition-all"
                    >
                        Temizle
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Save className="w-5 h-5" />
                        Fişi Kaydet
                    </button>
                </div>
            </div>

            {/* Customer Modal */}
            {showCustomerModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-border">
                            <h3 className="text-xl font-bold text-white">Cari Seç</h3>
                        </div>
                        <div className="p-4">
                            <input
                                type="text"
                                value={customerSearch}
                                onChange={(e) => setCustomerSearch(e.target.value)}
                                placeholder="Cari ara..."
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white mb-4"
                            />
                            <div className="max-h-96 overflow-y-auto">
                                {customers
                                    .filter(c => c.unvan.toLowerCase().includes(customerSearch.toLowerCase()))
                                    .map(customer => (
                                        <button
                                            key={customer.id}
                                            onClick={() => {
                                                setSelectedCustomer(customer);
                                                setShowCustomerModal(false);
                                                setCustomerSearch('');
                                            }}
                                            className="w-full px-4 py-3 hover:bg-white/5 text-left border-b border-border last:border-0"
                                        >
                                            <p className="font-medium text-white">{customer.unvan}</p>
                                            <p className="text-xs text-secondary">{customer.hesap_tipi?.toUpperCase()}</p>
                                        </button>
                                    ))
                                }
                            </div>
                        </div>
                        <div className="p-4 border-t border-border">
                            <button
                                onClick={() => setShowCustomerModal(false)}
                                className="w-full px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors"
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
