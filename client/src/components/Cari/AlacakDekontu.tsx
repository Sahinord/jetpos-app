"use client";

import { useState, useCallback, useEffect } from "react";
import { Save, X, Trash2, Copy, Printer, FileText, Plus, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

interface AlacakDekontuProps {
    showToast?: (message: string, type: "success" | "error" | "info" | "warning") => void;
}

interface DekontuKalem {
    id: string;
    cariKodu: string;
    unvani: string;
    belgeTarihi: string;
    aciklama: string;
    tutar: number;
    paraBirimi: string;
    hizKodu: string;
    hizAdi: string;
}

export default function AlacakDekontu({ showToast }: AlacakDekontuProps) {
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
        aciklama: "",
        muhAciklama: "",
    });

    const [kalemler, setKalemler] = useState<DekontuKalem[]>([]);

    useEffect(() => {
        // Yeni fiş numarası oluştur (AD = Alacak Dekontu)
        const now = new Date();
        const fisNo = `AD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
        setFormData(prev => ({ ...prev, fisNo }));
    }, []);

    const updateField = useCallback((field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    // Yeni kalem ekle
    const addKalem = () => {
        const newKalem: DekontuKalem = {
            id: Date.now().toString(),
            cariKodu: "",
            unvani: "",
            belgeTarihi: formData.fisTarihi,
            aciklama: "",
            tutar: 0,
            paraBirimi: "TRY",
            hizKodu: "",
            hizAdi: "",
        };
        setKalemler(prev => [...prev, newKalem]);
    };

    // Kalem güncelle
    const updateKalem = (id: string, field: keyof DekontuKalem, value: string | number) => {
        setKalemler(prev => prev.map(k => k.id === id ? { ...k, [field]: value } : k));
    };

    // Kalem sil
    const removeKalem = (id: string) => {
        setKalemler(prev => prev.filter(k => k.id !== id));
    };

    // Toplam tutar
    const toplamTutar = kalemler.reduce((sum, k) => sum + (k.tutar || 0), 0);

    // KAYDET
    const handleSave = async () => {
        if (!currentTenant) {
            showToast?.("Tenant bulunamadı", "error");
            return;
        }

        if (kalemler.length === 0) {
            showToast?.("En az bir kalem ekleyin", "warning");
            return;
        }

        setLoading(true);
        try {
            // Her kalem için cari hareket oluştur - ALACAK tarafa yazılır
            const hareketler = kalemler.map(kalem => ({
                tenant_id: currentTenant.id,
                hareket_tipi: 'ALACAK_DEKONTU',
                tarih: formData.fisTarihi,
                vade_tarihi: kalem.belgeTarihi || formData.fisTarihi,
                belge_no: formData.fisNo,
                aciklama: kalem.aciklama || formData.aciklama,
                borc: 0,
                alacak: kalem.tutar, // Alacak tarafa yazılır
                bakiye: -kalem.tutar, // Negatif bakiye (müşteriden alacaklıyız)
                para_birimi: kalem.paraBirimi,
            }));

            const { error } = await supabase
                .from('cari_hareketler')
                .insert(hareketler);

            if (error) throw error;

            showToast?.("Alacak dekontu kaydedildi", "success");
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
        const fisNo = `AD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
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
                        <FileText className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-medium text-[var(--color-foreground)]">Alacak Dekontu</span>
                    </div>
                </div>
            </div>

            {/* Header Form */}
            <div className="glass-card p-4 mb-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                onChange={(e) => updateField("fisNo", e.target.value)}
                                className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-3 py-1.5 text-[var(--color-foreground)] text-sm placeholder:text-secondary/50"
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

                    {/* Orta Grup */}
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-secondary text-xs font-medium">C/H Kodu</label>
                            <div className="flex gap-1">
                                <input
                                    type="text"
                                    value={formData.chKodu}
                                    onChange={(e) => updateField("chKodu", e.target.value)}
                                    className="flex-1 bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-3 py-1.5 text-[var(--color-foreground)] text-sm placeholder:text-secondary/50"
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
                                className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-3 py-1.5 text-[var(--color-foreground)] text-sm placeholder:text-secondary/50"
                            />
                        </div>
                    </div>

                    {/* Sağ Grup 1 */}
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-secondary text-xs font-medium">Belge No</label>
                            <input
                                type="text"
                                value={formData.belgeNo}
                                onChange={(e) => updateField("belgeNo", e.target.value)}
                                className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-3 py-1.5 text-[var(--color-foreground)] text-sm placeholder:text-secondary/50"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-secondary text-xs font-medium">Para Birimi</label>
                            <select
                                value={formData.paraBirimi}
                                onChange={(e) => updateField("paraBirimi", e.target.value)}
                                className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-3 py-1.5 text-[var(--color-foreground)] text-sm"
                            >
                                <option value="TRY" className="bg-[var(--color-input-bg)]">TRY</option>
                                <option value="USD" className="bg-[var(--color-input-bg)]">USD</option>
                                <option value="EUR" className="bg-[var(--color-input-bg)]">EUR</option>
                            </select>
                        </div>
                    </div>

                    {/* Sağ Grup 2 */}
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-secondary text-xs font-medium">Ödeme Planı</label>
                            <input
                                type="text"
                                value={formData.odemePlani}
                                onChange={(e) => updateField("odemePlani", e.target.value)}
                                className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-3 py-1.5 text-[var(--color-foreground)] text-sm placeholder:text-secondary/50"
                            />
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
                            ? 'bg-emerald-600 text-white'
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
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium"
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
                                        <th className="px-3 py-2 w-28">Cari Kodu</th>
                                        <th className="px-3 py-2 w-40">Ünvanı</th>
                                        <th className="px-3 py-2 w-28">Belge Tarihi</th>
                                        <th className="px-3 py-2">Açıklama</th>
                                        <th className="px-3 py-2 w-28 text-right">Tutarı</th>
                                        <th className="px-3 py-2 w-20">Para Birimi</th>
                                        <th className="px-3 py-2 w-24">Hiz. Kodu</th>
                                        <th className="px-3 py-2 w-32">Hiz. Adı</th>
                                        <th className="px-3 py-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {kalemler.map((kalem, idx) => (
                                        <tr key={kalem.id} className="hover:bg-white/[0.02]">
                                            <td className="px-2 py-1">
                                                <input
                                                    type="text"
                                                    value={kalem.cariKodu}
                                                    onChange={(e) => updateKalem(kalem.id, 'cariKodu', e.target.value)}
                                                    className="w-full bg-transparent border border-[var(--color-input-border)] rounded px-2 py-1 text-[var(--color-foreground)] text-xs focus:border-emerald-500 focus:outline-none"
                                                />
                                            </td>
                                            <td className="px-2 py-1">
                                                <input
                                                    type="text"
                                                    value={kalem.unvani}
                                                    onChange={(e) => updateKalem(kalem.id, 'unvani', e.target.value)}
                                                    className="w-full bg-transparent border border-[var(--color-input-border)] rounded px-2 py-1 text-[var(--color-foreground)] text-xs focus:border-emerald-500 focus:outline-none"
                                                />
                                            </td>
                                            <td className="px-2 py-1">
                                                <input
                                                    type="date"
                                                    value={kalem.belgeTarihi}
                                                    onChange={(e) => updateKalem(kalem.id, 'belgeTarihi', e.target.value)}
                                                    className="w-full bg-transparent border border-[var(--color-input-border)] rounded px-2 py-1 text-[var(--color-foreground)] text-xs focus:border-emerald-500 focus:outline-none"
                                                />
                                            </td>
                                            <td className="px-2 py-1">
                                                <input
                                                    type="text"
                                                    value={kalem.aciklama}
                                                    onChange={(e) => updateKalem(kalem.id, 'aciklama', e.target.value)}
                                                    className="w-full bg-transparent border border-[var(--color-input-border)] rounded px-2 py-1 text-[var(--color-foreground)] text-xs focus:border-emerald-500 focus:outline-none"
                                                />
                                            </td>
                                            <td className="px-2 py-1">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={kalem.tutar}
                                                    onChange={(e) => updateKalem(kalem.id, 'tutar', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-transparent border border-emerald-500/30 rounded px-2 py-1 text-[var(--color-foreground)] text-xs text-right font-mono focus:border-emerald-500 focus:outline-none"
                                                />
                                            </td>
                                            <td className="px-2 py-1">
                                                <select
                                                    value={kalem.paraBirimi}
                                                    onChange={(e) => updateKalem(kalem.id, 'paraBirimi', e.target.value)}
                                                    className="w-full bg-transparent border border-[var(--color-input-border)] rounded px-1 py-1 text-[var(--color-foreground)] text-xs"
                                                >
                                                    <option value="TRY" className="bg-[var(--color-input-bg)]">TRY</option>
                                                    <option value="USD" className="bg-[var(--color-input-bg)]">USD</option>
                                                    <option value="EUR" className="bg-[var(--color-input-bg)]">EUR</option>
                                                </select>
                                            </td>
                                            <td className="px-2 py-1">
                                                <input
                                                    type="text"
                                                    value={kalem.hizKodu}
                                                    onChange={(e) => updateKalem(kalem.id, 'hizKodu', e.target.value)}
                                                    className="w-full bg-transparent border border-[var(--color-input-border)] rounded px-2 py-1 text-[var(--color-foreground)] text-xs focus:border-emerald-500 focus:outline-none"
                                                />
                                            </td>
                                            <td className="px-2 py-1">
                                                <input
                                                    type="text"
                                                    value={kalem.hizAdi}
                                                    onChange={(e) => updateKalem(kalem.id, 'hizAdi', e.target.value)}
                                                    className="w-full bg-transparent border border-[var(--color-input-border)] rounded px-2 py-1 text-[var(--color-foreground)] text-xs focus:border-emerald-500 focus:outline-none"
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
                                            <td colSpan={9} className="text-center py-8 text-secondary">
                                                Henüz kalem eklenmedi. <button onClick={addKalem} className="text-emerald-500 hover:underline">Kalem ekle</button>
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
                                className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-3 py-2 text-[var(--color-foreground)] text-sm h-24 resize-none placeholder:text-secondary/50"
                                placeholder="Dekont açıklaması..."
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-secondary text-xs font-medium">Muhasebe Açıklaması</label>
                            <textarea
                                value={formData.muhAciklama}
                                onChange={(e) => updateField("muhAciklama", e.target.value)}
                                className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-3 py-2 text-[var(--color-foreground)] text-sm h-24 resize-none placeholder:text-secondary/50"
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
                                className="bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-2 py-1 text-[var(--color-foreground)] text-xs w-48 placeholder:text-secondary/50"
                            />
                        </div>
                        <div className="space-y-0.5">
                            <div className="text-secondary text-xs">Muh. Açıklama</div>
                            <input
                                type="text"
                                value={formData.muhAciklama}
                                onChange={(e) => updateField("muhAciklama", e.target.value)}
                                className="bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-2 py-1 text-[var(--color-foreground)] text-xs w-48 placeholder:text-secondary/50"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-secondary text-xs">Toplam Tutar</div>
                            <div className="text-xl font-black text-emerald-500 font-mono">
                                {toplamTutar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
