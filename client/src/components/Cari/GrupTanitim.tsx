"use client";

import { useState, useCallback, useEffect } from "react";
import { Save, X, Trash2, Search, FolderOpen, MoreHorizontal } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

interface GrupTanitimProps {
    showToast?: (message: string, type: "success" | "error" | "info" | "warning") => void;
}

export default function GrupTanitim({ showToast }: GrupTanitimProps) {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [grupCount, setGrupCount] = useState(0);

    const [formData, setFormData] = useState({
        grupKodu: "",
        grupAdi: "",
        aciklama: "",
    });

    // Grup sayısını yükle
    const loadGrupCount = async () => {
        if (!currentTenant) return;
        const { count } = await supabase
            .from('cari_gruplar')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', currentTenant.id);
        setGrupCount(count || 0);
    };

    useEffect(() => {
        loadGrupCount();
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

        if (!formData.grupKodu || !formData.grupAdi) {
            showToast?.("Grup Kodu ve Grup Adı zorunludur", "warning");
            return;
        }

        setLoading(true);
        try {
            const dbData = {
                tenant_id: currentTenant.id,
                grup_kodu: formData.grupKodu,
                grup_adi: formData.grupAdi,
                aciklama: formData.aciklama,
            };

            if (editingId) {
                const { error } = await supabase
                    .from('cari_gruplar')
                    .update(dbData)
                    .eq('id', editingId);
                if (error) throw error;
                showToast?.("Grup güncellendi", "success");
            } else {
                const { error } = await supabase
                    .from('cari_gruplar')
                    .insert([dbData]);
                if (error) {
                    if (error.code === '23505') {
                        showToast?.("Bu grup kodu zaten mevcut", "error");
                    } else {
                        throw error;
                    }
                    return;
                }
                showToast?.("Grup kaydedildi", "success");
            }

            handleClear();
            loadGrupCount();
        } catch (err: any) {
            showToast?.("Hata: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    // SİL
    const handleDelete = async () => {
        if (!editingId) {
            showToast?.("Silinecek grup seçilmedi", "warning");
            return;
        }

        if (!confirm("Bu grubu silmek istediğinize emin misiniz?")) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('cari_gruplar')
                .delete()
                .eq('id', editingId);

            if (error) throw error;
            showToast?.("Grup silindi", "success");
            handleClear();
            loadGrupCount();
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
            grupKodu: "",
            grupAdi: "",
            aciklama: "",
        });
    };

    // GRUP KODU İLE ARA
    const handleSearch = async () => {
        if (!formData.grupKodu || !currentTenant) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('cari_gruplar')
                .select('*')
                .eq('tenant_id', currentTenant.id)
                .eq('grup_kodu', formData.grupKodu)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    showToast?.("Bu grup kodu bulunamadı", "info");
                } else {
                    throw error;
                }
                return;
            }

            if (data) {
                setEditingId(data.id);
                setFormData({
                    grupKodu: data.grup_kodu || "",
                    grupAdi: data.grup_adi || "",
                    aciklama: data.aciklama || "",
                });
                showToast?.("Grup yüklendi", "success");
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
                        <FolderOpen className="w-4 h-4" />
                        <span className="text-sm font-medium text-[var(--color-foreground)]">Grup Sayısı:</span>
                        <span className="text-primary font-bold">{grupCount}</span>
                        {editingId && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded ml-2">Düzenleniyor</span>}
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="glass-card p-5 space-y-4">
                {/* Grup Kodu */}
                <div className="space-y-1">
                    <label className="text-secondary text-xs font-medium">Grup Kodu</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={formData.grupKodu}
                            onChange={(e) => updateField("grupKodu", e.target.value)}
                            className="flex-1 bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-3 py-2 text-[var(--color-foreground)] text-sm focus:border-primary focus:outline-none placeholder:text-secondary/50"
                            placeholder="Grup kodu girin..."
                        />
                        <button onClick={handleSearch} disabled={loading} className="px-3 bg-white/5 hover:bg-white/10 border border-[var(--color-input-border)] rounded transition-colors">
                            <MoreHorizontal className="w-4 h-4 text-secondary" />
                        </button>
                    </div>
                </div>

                {/* Grup Adı */}
                <div className="space-y-1">
                    <label className="text-secondary text-xs font-medium">Grup Adı</label>
                    <input
                        type="text"
                        value={formData.grupAdi}
                        onChange={(e) => updateField("grupAdi", e.target.value)}
                        className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-3 py-2 text-[var(--color-foreground)] text-sm focus:border-primary focus:outline-none placeholder:text-secondary/50"
                        placeholder="Grup adı girin..."
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
