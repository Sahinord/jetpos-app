"use client";

import { useState, useCallback, useEffect } from "react";
import { Save, X, Trash2, Tag, MoreHorizontal } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

interface OzelKodTanitimProps {
    showToast?: (message: string, type: "success" | "error" | "info" | "warning") => void;
}

export default function OzelKodTanitim({ showToast }: OzelKodTanitimProps) {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [kodCount, setKodCount] = useState(0);

    const [formData, setFormData] = useState({
        ozelKodu: "",
        ozelAdi: "",
        aciklama: "",
    });

    // Özel kod sayısını yükle
    const loadKodCount = async () => {
        if (!currentTenant) return;
        const { count } = await supabase
            .from('cari_ozel_kodlar')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', currentTenant.id);
        setKodCount(count || 0);
    };

    useEffect(() => {
        loadKodCount();
    }, [currentTenant]);

    const updateField = useCallback((field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    // KAYDET
    const handleSave = async () => {
        if (!currentTenant) {
            showToast?.("Tenant bulunamadı", "error");
            return;
        }

        if (!formData.ozelKodu || !formData.ozelAdi) {
            showToast?.("Özel Kodu ve Özel Adı zorunludur", "warning");
            return;
        }

        setLoading(true);
        try {
            const dbData = {
                tenant_id: currentTenant.id,
                kod_tipi: 'ozel', // Varsayılan tip
                kod: formData.ozelKodu,
                aciklama: formData.aciklama || formData.ozelAdi,
            };

            if (editingId) {
                const { error } = await supabase
                    .from('cari_ozel_kodlar')
                    .update(dbData)
                    .eq('id', editingId);
                if (error) throw error;
                showToast?.("Özel kod güncellendi", "success");
            } else {
                const { error } = await supabase
                    .from('cari_ozel_kodlar')
                    .insert([dbData]);
                if (error) {
                    if (error.code === '23505') {
                        showToast?.("Bu özel kod zaten mevcut", "error");
                    } else {
                        throw error;
                    }
                    return;
                }
                showToast?.("Özel kod kaydedildi", "success");
            }

            handleClear();
            loadKodCount();
        } catch (err: any) {
            showToast?.("Hata: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    // SİL
    const handleDelete = async () => {
        if (!editingId) {
            showToast?.("Silinecek özel kod seçilmedi", "warning");
            return;
        }

        if (!confirm("Bu özel kodu silmek istediğinize emin misiniz?")) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('cari_ozel_kodlar')
                .delete()
                .eq('id', editingId);

            if (error) throw error;
            showToast?.("Özel kod silindi", "success");
            handleClear();
            loadKodCount();
        } catch (err: any) {
            showToast?.("Hata: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    // TEMİZLE
    const handleClear = () => {
        setEditingId(null);
        setFormData({
            ozelKodu: "",
            ozelAdi: "",
            aciklama: "",
        });
    };

    // ÖZEL KOD İLE ARA
    const handleSearch = async () => {
        if (!formData.ozelKodu || !currentTenant) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('cari_ozel_kodlar')
                .select('*')
                .eq('tenant_id', currentTenant.id)
                .eq('kod', formData.ozelKodu)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    showToast?.("Bu özel kod bulunamadı", "info");
                } else {
                    throw error;
                }
                return;
            }

            if (data) {
                setEditingId(data.id);
                setFormData({
                    ozelKodu: data.kod || "",
                    ozelAdi: data.aciklama || "",
                    aciklama: data.aciklama || "",
                });
                showToast?.("Özel kod yüklendi", "success");
            }
        } catch (err: any) {
            showToast?.("Hata: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col max-w-2xl">
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
                        <button onClick={handleDelete} disabled={!editingId || loading} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-all">
                            <Trash2 className="w-4 h-4" />
                            <span>Sil</span>
                        </button>
                    </div>
                    <div className="flex items-center gap-2 text-secondary">
                        {loading && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
                        <Tag className="w-4 h-4" />
                        <span className="text-sm font-medium text-[var(--color-foreground)]">Özel Kod Sayısı:</span>
                        <span className="text-primary font-bold">{kodCount}</span>
                        {editingId && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded ml-2">Düzenleniyor</span>}
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="glass-card p-5 space-y-4">
                {/* Özel Kodu */}
                <div className="space-y-1">
                    <label className="text-secondary text-xs font-medium">Özel Kodu</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={formData.ozelKodu}
                            onChange={(e) => updateField("ozelKodu", e.target.value)}
                            className="flex-1 bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-3 py-2 text-[var(--color-foreground)] text-sm focus:border-primary focus:outline-none placeholder:text-secondary/50"
                            placeholder="Özel kod girin..."
                        />
                        <button onClick={handleSearch} disabled={loading} className="px-3 bg-white/5 hover:bg-white/10 border border-[var(--color-input-border)] rounded transition-colors">
                            <MoreHorizontal className="w-4 h-4 text-secondary" />
                        </button>
                    </div>
                </div>

                {/* Özel Adı */}
                <div className="space-y-1">
                    <label className="text-secondary text-xs font-medium">Özel Adı</label>
                    <input
                        type="text"
                        value={formData.ozelAdi}
                        onChange={(e) => updateField("ozelAdi", e.target.value)}
                        className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-3 py-2 text-[var(--color-foreground)] text-sm focus:border-primary focus:outline-none placeholder:text-secondary/50"
                        placeholder="Özel adı girin..."
                    />
                </div>

                {/* Açıklama */}
                <div className="space-y-1">
                    <label className="text-secondary text-xs font-medium">Açıklama</label>
                    <input
                        type="text"
                        value={formData.aciklama}
                        onChange={(e) => updateField("aciklama", e.target.value)}
                        className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-3 py-2 text-[var(--color-foreground)] text-sm focus:border-primary focus:outline-none placeholder:text-secondary/50"
                        placeholder="Açıklama girin..."
                    />
                </div>
            </div>
        </div>
    );
}
