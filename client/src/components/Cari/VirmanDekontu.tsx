"use client";

import { useState, useCallback, useEffect } from "react";
import { Save, X, Trash2, Copy, Printer, ArrowLeftRight, Plus, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

interface VirmanDekontuProps {
    showToast?: (message: string, type: "success" | "error" | "info" | "warning") => void;
}

interface VirmanKalem {
    id: string;
    cariKodu: string;
    unvani: string;
    aciklama: string;
    borcTutari: number;
    alacakTutari: number;
    hizAdi: string;
    bankaKodu: string;
    bankaAdi: string;
    kasaKodu: string;
    kasaAdi: string;
}

export default function VirmanDekontu({ showToast }: VirmanDekontuProps) {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(0);

    const [formData, setFormData] = useState({
        subeKodu: "1 - MERKEZ",
        fisNo: "",
        fisTarihi: new Date().toISOString().split('T')[0],
        chKodu: "",
        belgeTar: "",
        belgeTipi: "",
        belgeNo: "",
        paraBirimi: "TRY",
        odemePlani: "",
        islik1: "",
        islik2: "",
        aciklama: "",
        muhAciklama: "",
    });

    const [kalemler, setKalemler] = useState<VirmanKalem[]>([]);

    useEffect(() => {
        // Yeni fiş numarası oluştur (VD = Virman Dekontu)
        const now = new Date();
        const fisNo = `VD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
        setFormData(prev => ({ ...prev, fisNo }));
    }, []);

    const updateField = useCallback((field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    // Yeni kalem ekle
    const addKalem = () => {
        const newKalem: VirmanKalem = {
            id: Date.now().toString(),
            cariKodu: "",
            unvani: "",
            aciklama: "",
            borcTutari: 0,
            alacakTutari: 0,
            hizAdi: "",
            bankaKodu: "",
            bankaAdi: "",
            kasaKodu: "",
            kasaAdi: "",
        };
        setKalemler(prev => [...prev, newKalem]);
    };

    // Kalem güncelle
    const updateKalem = (id: string, field: keyof VirmanKalem, value: string | number) => {
        setKalemler(prev => prev.map(k => k.id === id ? { ...k, [field]: value } : k));
    };

    // Kalem sil
    const removeKalem = (id: string) => {
        setKalemler(prev => prev.filter(k => k.id !== id));
    };

    // Toplamlar
    const toplamBorc = kalemler.reduce((sum, k) => sum + (k.borcTutari || 0), 0);
    const toplamAlacak = kalemler.reduce((sum, k) => sum + (k.alacakTutari || 0), 0);
    const fark = toplamBorc - toplamAlacak;

    // KAYDET
    const handleSave = async () => {
        if (!currentTenant) {
            showToast?.("Tenant bulunamadı", "error");
            return;
        }

        if (kalemler.length < 2) {
            showToast?.("Virman için en az 2 kalem gerekli", "warning");
            return;
        }

        if (Math.abs(fark) > 0.01) {
            showToast?.("Borç ve Alacak toplamları eşit olmalı!", "warning");
            return;
        }

        setLoading(true);
        try {
            // Her kalem için cari hareket oluştur
            const hareketler = kalemler.flatMap(kalem => {
                const result = [];

                // Borç hareketi
                if (kalem.borcTutari > 0) {
                    result.push({
                        tenant_id: currentTenant.id,
                        hareket_tipi: 'VIRMAN',
                        tarih: formData.fisTarihi,
                        belge_no: formData.fisNo,
                        aciklama: kalem.aciklama || `Virman - ${formData.aciklama}`,
                        borc: kalem.borcTutari,
                        alacak: 0,
                        bakiye: kalem.borcTutari,
                        para_birimi: formData.paraBirimi,
                    });
                }

                // Alacak hareketi
                if (kalem.alacakTutari > 0) {
                    result.push({
                        tenant_id: currentTenant.id,
                        hareket_tipi: 'VIRMAN',
                        tarih: formData.fisTarihi,
                        belge_no: formData.fisNo,
                        aciklama: kalem.aciklama || `Virman - ${formData.aciklama}`,
                        borc: 0,
                        alacak: kalem.alacakTutari,
                        bakiye: -kalem.alacakTutari,
                        para_birimi: formData.paraBirimi,
                    });
                }

                return result;
            });

            const { error } = await supabase
                .from('cari_hareketler')
                .insert(hareketler);

            if (error) throw error;

            showToast?.("Virman dekontu kaydedildi", "success");
            handleClear();
        } catch (err: any) {
            console.error('Kayıt hatası:', err);
            showToast?.("Hata: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    // TEMİZLE
    const handleClear = () => {
        const now = new Date();
        const fisNo = `VD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
        setFormData({
            subeKodu: "1 - MERKEZ",
            fisNo,
            fisTarihi: new Date().toISOString().split('T')[0],
            chKodu: "",
            belgeTar: "",
            belgeTipi: "",
            belgeNo: "",
            paraBirimi: "TRY",
            odemePlani: "",
            islik1: "",
            islik2: "",
            aciklama: "",
            muhAciklama: "",
        });
        setKalemler([]);
    };

    const tabs = [
        { id: 0, label: "1 - Fiş Kalem Bilgileri" },
        { id: 1, label: "2 - Diğer Bilgiler" },
    ];

    return (
        <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="glass-card p-2 mb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1 flex-wrap">
                        <button onClick={handleSave} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded text-sm font-medium transition-all">
                            <Save className="w-4 h-4" />
                            <span>Kaydet</span>
                        </button>
                        <button onClick={handleClear} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-sm font-medium transition-all">
                            <X className="w-4 h-4" />
                            <span>Vazgeç</span>
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-all">
                            <Trash2 className="w-4 h-4" />
                            <span>Sil</span>
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-all">
                            <Copy className="w-4 h-4" />
                            <span>Kopyala</span>
                        </button>
                        <div className="w-px h-6 bg-white/20 mx-1" />
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-sm font-medium transition-all">
                            <Printer className="w-4 h-4" />
                            <span>Yazdır</span>
                        </button>
                    </div>
                    <div className="flex items-center gap-2 text-secondary">
                        {loading && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
                        <ArrowLeftRight className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-medium text-[var(--color-foreground)]">Virman Dekontu</span>
                    </div>
                </div>
            </div>

            {/* Header Form */}
            <div className="glass-card p-4 mb-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Sol Grup */}
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-secondary text-xs font-medium">Şube Kodu</label>
                            <select
                                value={formData.subeKodu}
                                onChange={(e) => updateField("subeKodu", e.target.value)}
                                className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-3 py-1.5 text-[var(--color-foreground)] text-sm"
                            >
                                <option className="bg-[var(--color-input-bg)]">1 - MERKEZ</option>
                                <option className="bg-[var(--color-input-bg)]">2 - ŞUBE</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-secondary text-xs font-medium">Fiş No</label>
                            <input
                                type="text"
                                value={formData.fisNo}
                                className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-3 py-1.5 text-[var(--color-foreground)] text-sm opacity-70"
                                readOnly
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-secondary text-xs font-medium">Fiş Tarihi</label>
                            <input
                                type="date"
                                value={formData.fisTarihi}
                                onChange={(e) => updateField("fisTarihi", e.target.value)}
                                className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-3 py-1.5 text-[var(--color-foreground)] text-sm"
                            />
                        </div>
                    </div>

                    {/* Orta Grup 1 */}
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-secondary text-xs font-medium">C/H Kodu</label>
                            <div className="flex gap-1">
                                <input
                                    type="text"
                                    value={formData.chKodu}
                                    onChange={(e) => updateField("chKodu", e.target.value)}
                                    className="flex-1 bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-3 py-1.5 text-[var(--color-foreground)] text-sm"
                                    placeholder="Cari kodu..."
                                />
                                <button className="px-2 bg-white/5 hover:bg-white/10 border border-[var(--color-input-border)] rounded">
                                    <Search className="w-4 h-4 text-secondary" />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-secondary text-xs font-medium">Belge Tarihi</label>
                            <input
                                type="date"
                                value={formData.belgeTar}
                                onChange={(e) => updateField("belgeTar", e.target.value)}
                                className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-3 py-1.5 text-[var(--color-foreground)] text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-secondary text-xs font-medium">Belge Tipi</label>
                            <input
                                type="text"
                                value={formData.belgeTipi}
                                onChange={(e) => updateField("belgeTipi", e.target.value)}
                                className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-3 py-1.5 text-[var(--color-foreground)] text-sm"
                            />
                        </div>
                    </div>

                    {/* Orta Grup 2 */}
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-secondary text-xs font-medium">Belge No</label>
                            <input
                                type="text"
                                value={formData.belgeNo}
                                onChange={(e) => updateField("belgeNo", e.target.value)}
                                className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-3 py-1.5 text-[var(--color-foreground)] text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-secondary text-xs font-medium">Para Birimi</label>
                            <select
                                value={formData.paraBirimi}
                                onChange={(e) => updateField("paraBirimi", e.target.value)}
                                className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-3 py-1.5 text-[var(--color-foreground)] text-sm"
                            >
                                <option className="bg-[var(--color-input-bg)]" value="TRY">TRY</option>
                                <option className="bg-[var(--color-input-bg)]" value="USD">USD</option>
                                <option className="bg-[var(--color-input-bg)]" value="EUR">EUR</option>
                            </select>
                        </div>
                    </div>

                    {/* Sağ Grup */}
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-secondary text-xs font-medium">Ödeme Planı</label>
                            <input
                                type="text"
                                value={formData.odemePlani}
                                onChange={(e) => updateField("odemePlani", e.target.value)}
                                className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-3 py-1.5 text-[var(--color-foreground)] text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-secondary text-xs font-medium">İşlik 1</label>
                            <input
                                type="text"
                                value={formData.islik1}
                                onChange={(e) => updateField("islik1", e.target.value)}
                                className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-3 py-1.5 text-[var(--color-foreground)] text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-secondary text-xs font-medium">İşlik 2</label>
                            <input
                                type="text"
                                value={formData.islik2}
                                onChange={(e) => updateField("islik2", e.target.value)}
                                className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-3 py-1.5 text-[var(--color-foreground)] text-sm"
                            />
                        </div>
                    </div>

                    {/* Fark Göstergesi */}
                    <div className="flex items-center justify-center">
                        <div className={`text-center p-4 rounded-xl ${Math.abs(fark) < 0.01 ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                            <div className="text-xs text-secondary mb-1">Fark</div>
                            <div className={`text-2xl font-black font-mono ${Math.abs(fark) < 0.01 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {fark.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </div>
                            {Math.abs(fark) < 0.01 && <div className="text-xs text-emerald-500 mt-1">✓ Dengeli</div>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${activeTab === tab.id
                            ? 'bg-amber-600 text-white'
                            : 'bg-white/5 text-secondary hover:bg-white/10'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="glass-card flex-1 flex flex-col overflow-hidden">
                {activeTab === 0 && (
                    <div className="flex-1 flex flex-col">
                        {/* Kalem Ekle Butonu */}
                        <div className="p-2 border-b border-white/10">
                            <button
                                onClick={addKalem}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-medium"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Kalem Ekle
                            </button>
                        </div>

                        {/* Tablo */}
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-white/5 sticky top-0">
                                    <tr className="text-left text-secondary">
                                        <th className="px-3 py-2 w-24">Cari Kodu</th>
                                        <th className="px-3 py-2 w-32">Ünvanı</th>
                                        <th className="px-3 py-2">Açıklama</th>
                                        <th className="px-3 py-2 w-28 text-right bg-red-500/10">Borç Tutarı</th>
                                        <th className="px-3 py-2 w-28 text-right bg-emerald-500/10">Alacak Tutarı</th>
                                        <th className="px-3 py-2 w-20">Banka Kodu</th>
                                        <th className="px-3 py-2 w-28">Banka Adı</th>
                                        <th className="px-3 py-2 w-20">Kasa Kodu</th>
                                        <th className="px-3 py-2 w-28">Kasa Adı</th>
                                        <th className="px-3 py-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {kalemler.map((kalem) => (
                                        <tr key={kalem.id} className="hover:bg-white/[0.02]">
                                            <td className="px-2 py-1">
                                                <input
                                                    type="text"
                                                    value={kalem.cariKodu}
                                                    onChange={(e) => updateKalem(kalem.id, 'cariKodu', e.target.value)}
                                                    className="w-full bg-transparent border border-[var(--color-input-border)] rounded px-2 py-1 text-[var(--color-foreground)] text-xs focus:border-amber-500 focus:outline-none"
                                                />
                                            </td>
                                            <td className="px-2 py-1">
                                                <input
                                                    type="text"
                                                    value={kalem.unvani}
                                                    onChange={(e) => updateKalem(kalem.id, 'unvani', e.target.value)}
                                                    className="w-full bg-transparent border border-[var(--color-input-border)] rounded px-2 py-1 text-[var(--color-foreground)] text-xs focus:border-amber-500 focus:outline-none"
                                                />
                                            </td>
                                            <td className="px-2 py-1">
                                                <input
                                                    type="text"
                                                    value={kalem.aciklama}
                                                    onChange={(e) => updateKalem(kalem.id, 'aciklama', e.target.value)}
                                                    className="w-full bg-transparent border border-[var(--color-input-border)] rounded px-2 py-1 text-[var(--color-foreground)] text-xs focus:border-amber-500 focus:outline-none"
                                                />
                                            </td>
                                            <td className="px-2 py-1 bg-red-500/5">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={kalem.borcTutari}
                                                    onChange={(e) => updateKalem(kalem.id, 'borcTutari', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-transparent border border-red-500/30 rounded px-2 py-1 text-[var(--color-foreground)] text-xs text-right font-mono focus:border-red-500 focus:outline-none"
                                                />
                                            </td>
                                            <td className="px-2 py-1 bg-emerald-500/5">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={kalem.alacakTutari}
                                                    onChange={(e) => updateKalem(kalem.id, 'alacakTutari', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-transparent border border-emerald-500/30 rounded px-2 py-1 text-[var(--color-foreground)] text-xs text-right font-mono focus:border-emerald-500 focus:outline-none"
                                                />
                                            </td>
                                            <td className="px-2 py-1">
                                                <input
                                                    type="text"
                                                    value={kalem.bankaKodu}
                                                    onChange={(e) => updateKalem(kalem.id, 'bankaKodu', e.target.value)}
                                                    className="w-full bg-transparent border border-[var(--color-input-border)] rounded px-2 py-1 text-[var(--color-foreground)] text-xs focus:border-amber-500 focus:outline-none"
                                                />
                                            </td>
                                            <td className="px-2 py-1">
                                                <input
                                                    type="text"
                                                    value={kalem.bankaAdi}
                                                    onChange={(e) => updateKalem(kalem.id, 'bankaAdi', e.target.value)}
                                                    className="w-full bg-transparent border border-[var(--color-input-border)] rounded px-2 py-1 text-[var(--color-foreground)] text-xs focus:border-amber-500 focus:outline-none"
                                                />
                                            </td>
                                            <td className="px-2 py-1">
                                                <input
                                                    type="text"
                                                    value={kalem.kasaKodu}
                                                    onChange={(e) => updateKalem(kalem.id, 'kasaKodu', e.target.value)}
                                                    className="w-full bg-transparent border border-[var(--color-input-border)] rounded px-2 py-1 text-[var(--color-foreground)] text-xs focus:border-amber-500 focus:outline-none"
                                                />
                                            </td>
                                            <td className="px-2 py-1">
                                                <input
                                                    type="text"
                                                    value={kalem.kasaAdi}
                                                    onChange={(e) => updateKalem(kalem.id, 'kasaAdi', e.target.value)}
                                                    className="w-full bg-transparent border border-[var(--color-input-border)] rounded px-2 py-1 text-[var(--color-foreground)] text-xs focus:border-amber-500 focus:outline-none"
                                                />
                                            </td>
                                            <td className="px-2 py-1">
                                                <button
                                                    onClick={() => removeKalem(kalem.id)}
                                                    className="text-red-500/50 hover:text-red-500 p-1"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {kalemler.length === 0 && (
                                        <tr>
                                            <td colSpan={10} className="text-center py-8 text-secondary">
                                                Henüz kalem eklenmedi. <button onClick={addKalem} className="text-amber-500 hover:underline">Kalem ekle</button>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 1 && (
                    <div className="p-4 space-y-4">
                        <div className="space-y-1">
                            <label className="text-secondary text-xs font-medium">Genel Açıklama</label>
                            <textarea
                                value={formData.aciklama}
                                onChange={(e) => updateField("aciklama", e.target.value)}
                                className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-3 py-2 text-[var(--color-foreground)] text-sm h-24 resize-none"
                                placeholder="Virman açıklaması..."
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-secondary text-xs font-medium">Muhasebe Açıklaması</label>
                            <textarea
                                value={formData.muhAciklama}
                                onChange={(e) => updateField("muhAciklama", e.target.value)}
                                className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-3 py-2 text-[var(--color-foreground)] text-sm h-24 resize-none"
                                placeholder="Muhasebe notu..."
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="glass-card p-3 mt-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="space-y-0.5">
                            <div className="text-secondary text-xs">Açıklama</div>
                            <input
                                type="text"
                                value={formData.aciklama}
                                onChange={(e) => updateField("aciklama", e.target.value)}
                                className="bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-2 py-1 text-[var(--color-foreground)] text-xs w-48"
                            />
                        </div>
                        <div className="space-y-0.5">
                            <div className="text-secondary text-xs">Muh. Açıklama</div>
                            <input
                                type="text"
                                value={formData.muhAciklama}
                                onChange={(e) => updateField("muhAciklama", e.target.value)}
                                className="bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-2 py-1 text-[var(--color-foreground)] text-xs w-48"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <div className="text-secondary text-xs">Toplam Borç</div>
                            <div className="text-lg font-black text-red-500 font-mono">
                                {toplamBorc.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-secondary text-xs">Toplam Alacak</div>
                            <div className="text-lg font-black text-emerald-500 font-mono">
                                {toplamAlacak.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
