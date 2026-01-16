"use client";

import { useState, useCallback, useEffect } from "react";
import { Save, X, Trash2, Copy, Printer, FilePlus, Plus, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

interface DevirFisiProps {
    showToast?: (message: string, type: "success" | "error" | "info" | "warning") => void;
}

interface DevirKalem {
    id: string;
    cariKodu: string;
    unvani: string;
    aciklama: string;
    borcTutari: number;
    alacakTutari: number;
}

export default function DevirFisi({ showToast }: DevirFisiProps) {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(0);

    const [formData, setFormData] = useState({
        subeKodu: "1 - MERKEZ",
        fisNo: "",
        fisTarihi: new Date().toISOString().split('T')[0],
        chKodu: "",
        belgeTar: "",
        belgeTipi: "DEVİR",
        belgeNo: "",
        paraBirimi: "TRY",
        odemePlani: "",
        aciklama: "",
        muhAciklama: "",
    });

    const [kalemler, setKalemler] = useState<DevirKalem[]>([]);

    useEffect(() => {
        // Yeni fiş numarası oluştur (DEV = Devir Fişi)
        const now = new Date();
        const fisNo = `DEV-${now.getFullYear()}`;
        setFormData(prev => ({
            ...prev,
            fisNo,
            fisTarihi: `${now.getFullYear()}-01-01` // Dönem başı
        }));
    }, []);

    const updateField = useCallback((field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    // Yeni kalem ekle
    const addKalem = () => {
        const newKalem: DevirKalem = {
            id: Date.now().toString(),
            cariKodu: "",
            unvani: "",
            aciklama: "Dönem başı devir",
            borcTutari: 0,
            alacakTutari: 0,
        };
        setKalemler(prev => [...prev, newKalem]);
    };

    // Kalem güncelle
    const updateKalem = (id: string, field: keyof DevirKalem, value: string | number) => {
        setKalemler(prev => prev.map(k => k.id === id ? { ...k, [field]: value } : k));
    };

    // Kalem sil
    const removeKalem = (id: string) => {
        setKalemler(prev => prev.filter(k => k.id !== id));
    };

    // Toplamlar
    const toplamBorc = kalemler.reduce((sum, k) => sum + (k.borcTutari || 0), 0);
    const toplamAlacak = kalemler.reduce((sum, k) => sum + (k.alacakTutari || 0), 0);

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

        // En az bir tutar girilmiş olmalı
        const hasAmount = kalemler.some(k => k.borcTutari > 0 || k.alacakTutari > 0);
        if (!hasAmount) {
            showToast?.("En az bir borç veya alacak tutarı girin", "warning");
            return;
        }

        setLoading(true);
        try {
            // Her kalem için cari hareket oluştur
            const hareketler = kalemler
                .filter(k => k.borcTutari > 0 || k.alacakTutari > 0)
                .map(kalem => ({
                    tenant_id: currentTenant.id,
                    hareket_tipi: 'DEVIR',
                    tarih: formData.fisTarihi,
                    belge_no: formData.fisNo,
                    aciklama: kalem.aciklama || 'Dönem başı devir',
                    borc: kalem.borcTutari,
                    alacak: kalem.alacakTutari,
                    bakiye: kalem.borcTutari - kalem.alacakTutari,
                    para_birimi: formData.paraBirimi,
                }));

            const { error } = await supabase
                .from('cari_hareketler')
                .insert(hareketler);

            if (error) throw error;

            showToast?.("Devir fişi kaydedildi", "success");
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
        const fisNo = `DEV-${now.getFullYear()}`;
        setFormData({
            subeKodu: "1 - MERKEZ",
            fisNo,
            fisTarihi: `${now.getFullYear()}-01-01`,
            chKodu: "",
            belgeTar: "",
            belgeTipi: "DEVİR",
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
                        <FilePlus className="w-4 h-4 text-cyan-500" />
                        <span className="text-sm font-medium text-white">Devir Fişi</span>
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
                                className="w-full bg-[#0a1628] border border-white/10 rounded px-3 py-1.5 text-white text-sm"
                            >
                                <option>1 - MERKEZ</option>
                                <option>2 - ŞUBE</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-secondary text-xs font-medium">Fiş No</label>
                            <input
                                type="text"
                                value={formData.fisNo}
                                onChange={(e) => updateField("fisNo", e.target.value)}
                                className="w-full bg-[#0a1628] border border-white/10 rounded px-3 py-1.5 text-white text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-secondary text-xs font-medium">Fiş Tarihi (Dönem Başı)</label>
                            <input
                                type="date"
                                value={formData.fisTarihi}
                                onChange={(e) => updateField("fisTarihi", e.target.value)}
                                className="w-full bg-[#0a1628] border border-cyan-500/30 rounded px-3 py-1.5 text-white text-sm"
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
                                    className="flex-1 bg-[#0a1628] border border-white/10 rounded px-3 py-1.5 text-white text-sm"
                                    placeholder="Cari kodu..."
                                />
                                <button className="px-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded">
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
                                className="w-full bg-[#0a1628] border border-white/10 rounded px-3 py-1.5 text-white text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-secondary text-xs font-medium">Belge Tipi</label>
                            <input
                                type="text"
                                value={formData.belgeTipi}
                                onChange={(e) => updateField("belgeTipi", e.target.value)}
                                className="w-full bg-[#0a1628] border border-white/10 rounded px-3 py-1.5 text-white text-sm"
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
                                className="w-full bg-[#0a1628] border border-white/10 rounded px-3 py-1.5 text-white text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-secondary text-xs font-medium">Para Birimi</label>
                            <select
                                value={formData.paraBirimi}
                                onChange={(e) => updateField("paraBirimi", e.target.value)}
                                className="w-full bg-[#0a1628] border border-white/10 rounded px-3 py-1.5 text-white text-sm"
                            >
                                <option value="TRY">TRY</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
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
                                className="w-full bg-[#0a1628] border border-white/10 rounded px-3 py-1.5 text-white text-sm"
                            />
                        </div>

                        {/* Bilgi Kutusu */}
                        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                            <div className="text-cyan-500 text-xs font-medium mb-1">💡 Devir Fişi</div>
                            <div className="text-secondary text-xs">
                                Önceki dönemden kalan bakiyeleri yeni döneme aktarmak için kullanılır.
                            </div>
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
                                ? 'bg-cyan-600 text-white'
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
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-xs font-medium"
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
                                        <th className="px-3 py-2 w-32">Cari Kodu</th>
                                        <th className="px-3 py-2">Ünvanı</th>
                                        <th className="px-3 py-2">Açıklama</th>
                                        <th className="px-3 py-2 w-36 text-right bg-red-500/10">Borç Tutarı</th>
                                        <th className="px-3 py-2 w-36 text-right bg-emerald-500/10">Alacak Tutarı</th>
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
                                                    className="w-full bg-transparent border border-white/10 rounded px-2 py-1.5 text-white text-xs focus:border-cyan-500 focus:outline-none"
                                                    placeholder="Cari kodu..."
                                                />
                                            </td>
                                            <td className="px-2 py-1">
                                                <input
                                                    type="text"
                                                    value={kalem.unvani}
                                                    onChange={(e) => updateKalem(kalem.id, 'unvani', e.target.value)}
                                                    className="w-full bg-transparent border border-white/10 rounded px-2 py-1.5 text-white text-xs focus:border-cyan-500 focus:outline-none"
                                                    placeholder="Ünvan..."
                                                />
                                            </td>
                                            <td className="px-2 py-1">
                                                <input
                                                    type="text"
                                                    value={kalem.aciklama}
                                                    onChange={(e) => updateKalem(kalem.id, 'aciklama', e.target.value)}
                                                    className="w-full bg-transparent border border-white/10 rounded px-2 py-1.5 text-white text-xs focus:border-cyan-500 focus:outline-none"
                                                    placeholder="Açıklama..."
                                                />
                                            </td>
                                            <td className="px-2 py-1 bg-red-500/5">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={kalem.borcTutari}
                                                    onChange={(e) => updateKalem(kalem.id, 'borcTutari', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-transparent border border-red-500/30 rounded px-2 py-1.5 text-white text-xs text-right font-mono focus:border-red-500 focus:outline-none"
                                                    placeholder="0.00"
                                                />
                                            </td>
                                            <td className="px-2 py-1 bg-emerald-500/5">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={kalem.alacakTutari}
                                                    onChange={(e) => updateKalem(kalem.id, 'alacakTutari', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-transparent border border-emerald-500/30 rounded px-2 py-1.5 text-white text-xs text-right font-mono focus:border-emerald-500 focus:outline-none"
                                                    placeholder="0.00"
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
                                            <td colSpan={6} className="text-center py-8 text-secondary">
                                                Henüz kalem eklenmedi. <button onClick={addKalem} className="text-cyan-500 hover:underline">Kalem ekle</button>
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
                                className="w-full bg-[#0a1628] border border-white/10 rounded px-3 py-2 text-white text-sm h-24 resize-none"
                                placeholder="Devir fişi açıklaması..."
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-secondary text-xs font-medium">Muhasebe Açıklaması</label>
                            <textarea
                                value={formData.muhAciklama}
                                onChange={(e) => updateField("muhAciklama", e.target.value)}
                                className="w-full bg-[#0a1628] border border-white/10 rounded px-3 py-2 text-white text-sm h-24 resize-none"
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
                                className="bg-[#0a1628] border border-white/10 rounded px-2 py-1 text-white text-xs w-48"
                            />
                        </div>
                        <div className="space-y-0.5">
                            <div className="text-secondary text-xs">Muh. Açıklama</div>
                            <input
                                type="text"
                                value={formData.muhAciklama}
                                onChange={(e) => updateField("muhAciklama", e.target.value)}
                                className="bg-[#0a1628] border border-white/10 rounded px-2 py-1 text-white text-xs w-48"
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
