"use client";

import { useState, useCallback, memo, useEffect } from "react";
import {
    Save,
    X,
    Trash2,
    Copy,
    List,
    FileText,
    FolderOpen,
    Printer,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Search,
    Users,
    MoreHorizontal,
} from "lucide-react";

interface CariTanitimProps {
    showToast?: (message: string, type: "success" | "error" | "info" | "warning") => void;
}

// Form input component - dışarıda tanımlı, memo ile optimize
const FormInput = memo(({ label, value, onChange, type = "text", placeholder = "" }: {
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
}) => (
    <div className="space-y-1">
        <label className="text-secondary text-xs font-medium">{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-3 py-1.5 text-[var(--color-foreground)] text-sm focus:border-primary focus:outline-none transition-colors placeholder:text-secondary/50"
            placeholder={placeholder}
        />
    </div>
));
FormInput.displayName = 'FormInput';

// Form input with search button
const FormInputWithSearch = memo(({ label, value, onChange }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) => (
    <div className="space-y-1">
        <label className="text-secondary text-xs font-medium">{label}</label>
        <div className="flex gap-1">
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-3 py-1.5 text-[var(--color-foreground)] text-sm focus:border-primary focus:outline-none transition-colors"
            />
            <button type="button" className="px-2 bg-white/5 hover:bg-white/10 border border-[var(--color-input-border)] rounded transition-colors text-secondary hover:text-[var(--color-foreground)]">
                <MoreHorizontal className="w-4 h-4" />
            </button>
        </div>
    </div>
));
FormInputWithSearch.displayName = 'FormInputWithSearch';

// Form select component
const FormSelect = memo(({ label, value, onChange, options }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
}) => (
    <div className="space-y-1">
        <label className="text-secondary text-xs font-medium">{label}</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-3 py-1.5 text-[var(--color-foreground)] text-sm focus:border-primary focus:outline-none transition-colors appearance-none cursor-pointer"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
                backgroundSize: '16px',
                paddingRight: '32px'
            }}
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-[var(--color-input-bg)] text-[var(--color-foreground)]">{opt.label}</option>
            ))}
        </select>
    </div>
));
FormSelect.displayName = 'FormSelect';

// Form number input
const FormNumber = memo(({ label, value, onChange, suffix = "" }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    suffix?: string;
}) => (
    <div className="space-y-1">
        <label className="text-secondary text-xs font-medium">{label}</label>
        <div className="flex">
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                className="flex-1 bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-l px-3 py-1.5 text-[var(--color-foreground)] text-sm text-right focus:border-primary focus:outline-none transition-colors"
            />
            {suffix && (
                <span className="bg-white/5 border border-l-0 border-[var(--color-input-border)] rounded-r px-2 py-1.5 text-secondary text-sm">
                    {suffix}
                </span>
            )}
        </div>
    </div>
));
FormNumber.displayName = 'FormNumber';

// Supabase ve Tenant Context
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

export default function CariTanitim({ showToast }: CariTanitimProps) {
    const { currentTenant } = useTenant();
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [cariCount, setCariCount] = useState(0);

    const [formData, setFormData] = useState({
        cariKodu: "",
        unvani: "",
        unvani2: "",
        vergiDairesi: "",
        vergiNo: "",
        durum: "Aktif",
        cariTipi: "",
        grupKodu: "",
        ozelKodu: "",
        yetkiKodu: "",
        sektorKodu: "",
        bolgeKodu: "",
        paraBirimi: "TRY",
        hesapTipi: "",
        mutabakat: false,
        kurHesaplama: "",
        kdvTipiAS: "",
        kdvKapsami: "",
        fiyatTipi: "",
        iskontoOrani: 0,
        vadeOrani: 0,
        vadeGunTarih: "",
        odemePlanNo: "",
        krediLimiti: 0,
        riskLimiti: 0,
        musteriKodu: "",
        personelKodu: "",
        firmaSirkNo: "",
        saticiKodu1: "",
        saticiKodu2: "",
        anaCariKodu: "",
        uretimKonusu: "",
        calismaAlani: "",
        odemeBilgisi: "",
        digerIskOrn: 0,
        eoIskOrn: 0,
        brmIskOrn: "",
        vadeTarihi2: "",
        depoNo: "",
        sprsTarihGun: "",
        sirkular: false,
        hKesimTipi: "",
        hkGunTar: "",
        saTipi: "",
        saGunTar: "",
        acikTeminat: 0,
        bankaTeminati: 0,
        ipotekTeminati: 0,
        teminatCeki: 0,
        teminatSenedi: 0,
        digerTeminat: 0,
        teminatTutari: 0,
        subeKoduAdi: "",
        webSitesi: "",
        email: "",
        referanslar: "",
    });

    const tabs = [
        { id: 0, label: "1 - Genel" },
        { id: 1, label: "2 - Adres ve İlgililer" },
        { id: 2, label: "3 - Bankalar ve Notlar" },
        { id: 3, label: "4 - Kimlik Bilgileri" },
    ];

    // Cari sayısını yükle
    const loadCariCount = async () => {
        if (!currentTenant) return;
        const { count } = await supabase
            .from('cari_hesaplar')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', currentTenant.id);
        setCariCount(count || 0);
    };

    // Sayfa yüklendiğinde cari sayısını al
    useEffect(() => {
        loadCariCount();
    }, [currentTenant]);

    // Optimize edilmiş handler
    const updateField = useCallback((field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    // Form verilerini database formatına çevir
    const mapFormToDatabase = () => ({
        tenant_id: currentTenant?.id,
        cari_kodu: formData.cariKodu,
        unvani: formData.unvani,
        unvani_2: formData.unvani2,
        vergi_dairesi: formData.vergiDairesi,
        vergi_no: formData.vergiNo,
        durum: formData.durum,
        cari_tipi: formData.cariTipi,
        grup_kodu: formData.grupKodu,
        ozel_kodu: formData.ozelKodu,
        yetki_kodu: formData.yetkiKodu,
        sektor_kodu: formData.sektorKodu,
        bolge_kodu: formData.bolgeKodu,
        para_birimi: formData.paraBirimi,
        hesap_tipi: formData.hesapTipi,
        mutabakat: formData.mutabakat,
        kur_hesaplama: formData.kurHesaplama,
        kdv_tipi_as: formData.kdvTipiAS,
        kdv_kapsami: formData.kdvKapsami,
        fiyat_tipi: formData.fiyatTipi,
        iskonto_orani: formData.iskontoOrani,
        vade_orani: formData.vadeOrani,
        vade_gun_tarih: formData.vadeGunTarih || null,
        odeme_plan_no: formData.odemePlanNo,
        kredi_limiti: formData.krediLimiti,
        risk_limiti: formData.riskLimiti,
        musteri_kodu: formData.musteriKodu,
        personel_kodu: formData.personelKodu,
        firma_sirk_no: formData.firmaSirkNo,
        satici_kodu_1: formData.saticiKodu1,
        satici_kodu_2: formData.saticiKodu2,
        ana_cari_kodu: formData.anaCariKodu,
        uretim_konusu: formData.uretimKonusu,
        calisma_alani: formData.calismaAlani,
        odeme_bilgisi: formData.odemeBilgisi,
        diger_isk_orn: formData.digerIskOrn,
        eo_isk_orn: formData.eoIskOrn,
        brm_isk_orn: formData.brmIskOrn,
        vade_tarihi_2: formData.vadeTarihi2 || null,
        depo_no: formData.depoNo,
        sprs_tarih_gun: formData.sprsTarihGun || null,
        h_kesim_tipi: formData.hKesimTipi,
        hk_gun_tar: formData.hkGunTar || null,
        sa_tipi: formData.saTipi,
        sa_gun_tar: formData.saGunTar || null,
        acik_teminat: formData.acikTeminat,
        banka_teminati: formData.bankaTeminati,
        ipotek_teminati: formData.ipotekTeminati,
        teminat_ceki: formData.teminatCeki,
        teminat_senedi: formData.teminatSenedi,
        diger_teminat: formData.digerTeminat,
        teminat_tutari: formData.teminatTutari,
        sube_kodu_adi: formData.subeKoduAdi,
        web_sitesi: formData.webSitesi,
        email: formData.email,
        referanslar: formData.referanslar,
    });

    // KAYDET
    const handleSave = async () => {
        console.log('handleSave çalışıyor...', { currentTenant, formData });

        if (!currentTenant) {
            console.error('Tenant bulunamadı!');
            showToast?.("Tenant bulunamadı", "error");
            alert("Tenant bulunamadı!");
            return;
        }

        if (!formData.cariKodu || !formData.unvani) {
            console.warn('Zorunlu alanlar eksik:', { cariKodu: formData.cariKodu, unvani: formData.unvani });
            showToast?.("Cari Kodu ve Ünvanı zorunludur", "warning");
            alert("Cari Kodu ve Ünvanı zorunludur!");
            return;
        }

        setLoading(true);
        try {
            const dbData = mapFormToDatabase();

            if (editingId) {
                // Güncelle
                const { error } = await supabase
                    .from('cari_hesaplar')
                    .update(dbData)
                    .eq('id', editingId);

                if (error) throw error;
                showToast?.("Cari hesap güncellendi", "success");
            } else {
                // Yeni kayıt
                const { error } = await supabase
                    .from('cari_hesaplar')
                    .insert([dbData]);

                if (error) {
                    console.error('Supabase insert hatası:', error);
                    if (error.code === '23505') {
                        showToast?.("Bu cari kodu zaten mevcut", "error");
                        alert("Bu cari kodu zaten mevcut!");
                    } else {
                        alert("Kayıt hatası: " + error.message);
                        throw error;
                    }
                    return;
                }
                console.log('Kayıt başarılı!');
                showToast?.("Cari hesap kaydedildi", "success");
            }

            handleClear();
            loadCariCount();
        } catch (err: any) {
            showToast?.("Hata: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    // SİL
    const handleDelete = async () => {
        if (!editingId) {
            showToast?.("Silinecek cari seçilmedi", "warning");
            return;
        }

        if (!confirm("Bu cari hesabı silmek istediğinize emin misiniz?")) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('cari_hesaplar')
                .delete()
                .eq('id', editingId);

            if (error) throw error;
            showToast?.("Cari hesap silindi", "success");
            handleClear();
            loadCariCount();
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
            cariKodu: "",
            unvani: "",
            unvani2: "",
            vergiDairesi: "",
            vergiNo: "",
            durum: "Aktif",
            cariTipi: "",
            grupKodu: "",
            ozelKodu: "",
            yetkiKodu: "",
            sektorKodu: "",
            bolgeKodu: "",
            paraBirimi: "TRY",
            hesapTipi: "",
            mutabakat: false,
            kurHesaplama: "",
            kdvTipiAS: "",
            kdvKapsami: "",
            fiyatTipi: "",
            iskontoOrani: 0,
            vadeOrani: 0,
            vadeGunTarih: "",
            odemePlanNo: "",
            krediLimiti: 0,
            riskLimiti: 0,
            musteriKodu: "",
            personelKodu: "",
            firmaSirkNo: "",
            saticiKodu1: "",
            saticiKodu2: "",
            anaCariKodu: "",
            uretimKonusu: "",
            calismaAlani: "",
            odemeBilgisi: "",
            digerIskOrn: 0,
            eoIskOrn: 0,
            brmIskOrn: "",
            vadeTarihi2: "",
            depoNo: "",
            sprsTarihGun: "",
            sirkular: false,
            hKesimTipi: "",
            hkGunTar: "",
            saTipi: "",
            saGunTar: "",
            acikTeminat: 0,
            bankaTeminati: 0,
            ipotekTeminati: 0,
            teminatCeki: 0,
            teminatSenedi: 0,
            digerTeminat: 0,
            teminatTutari: 0,
            subeKoduAdi: "",
            webSitesi: "",
            email: "",
            referanslar: "",
        });
    };

    // CARİ KODU İLE ARA
    const handleSearch = async () => {
        if (!formData.cariKodu || !currentTenant) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('cari_hesaplar')
                .select('*')
                .eq('tenant_id', currentTenant.id)
                .eq('cari_kodu', formData.cariKodu)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    showToast?.("Bu cari kodu bulunamadı", "info");
                } else {
                    throw error;
                }
                return;
            }

            if (data) {
                // Veritabanından gelen veriyi forma yükle
                setEditingId(data.id);
                setFormData({
                    cariKodu: data.cari_kodu || "",
                    unvani: data.unvani || "",
                    unvani2: data.unvani_2 || "",
                    vergiDairesi: data.vergi_dairesi || "",
                    vergiNo: data.vergi_no || "",
                    durum: data.durum || "Aktif",
                    cariTipi: data.cari_tipi || "",
                    grupKodu: data.grup_kodu || "",
                    ozelKodu: data.ozel_kodu || "",
                    yetkiKodu: data.yetki_kodu || "",
                    sektorKodu: data.sektor_kodu || "",
                    bolgeKodu: data.bolge_kodu || "",
                    paraBirimi: data.para_birimi || "TRY",
                    hesapTipi: data.hesap_tipi || "",
                    mutabakat: data.mutabakat || false,
                    kurHesaplama: data.kur_hesaplama || "",
                    kdvTipiAS: data.kdv_tipi_as || "",
                    kdvKapsami: data.kdv_kapsami || "",
                    fiyatTipi: data.fiyat_tipi || "",
                    iskontoOrani: data.iskonto_orani || 0,
                    vadeOrani: data.vade_orani || 0,
                    vadeGunTarih: data.vade_gun_tarih || "",
                    odemePlanNo: data.odeme_plan_no || "",
                    krediLimiti: data.kredi_limiti || 0,
                    riskLimiti: data.risk_limiti || 0,
                    musteriKodu: data.musteri_kodu || "",
                    personelKodu: data.personel_kodu || "",
                    firmaSirkNo: data.firma_sirk_no || "",
                    saticiKodu1: data.satici_kodu_1 || "",
                    saticiKodu2: data.satici_kodu_2 || "",
                    anaCariKodu: data.ana_cari_kodu || "",
                    uretimKonusu: data.uretim_konusu || "",
                    calismaAlani: data.calisma_alani || "",
                    odemeBilgisi: data.odeme_bilgisi || "",
                    digerIskOrn: data.diger_isk_orn || 0,
                    eoIskOrn: data.eo_isk_orn || 0,
                    brmIskOrn: data.brm_isk_orn || "",
                    vadeTarihi2: data.vade_tarihi_2 || "",
                    depoNo: data.depo_no || "",
                    sprsTarihGun: data.sprs_tarih_gun || "",
                    sirkular: data.sirkular || false,
                    hKesimTipi: data.h_kesim_tipi || "",
                    hkGunTar: data.hk_gun_tar || "",
                    saTipi: data.sa_tipi || "",
                    saGunTar: data.sa_gun_tar || "",
                    acikTeminat: data.acik_teminat || 0,
                    bankaTeminati: data.banka_teminati || 0,
                    ipotekTeminati: data.ipotek_teminati || 0,
                    teminatCeki: data.teminat_ceki || 0,
                    teminatSenedi: data.teminat_senedi || 0,
                    digerTeminat: data.diger_teminat || 0,
                    teminatTutari: data.teminat_tutari || 0,
                    subeKoduAdi: data.sube_kodu_adi || "",
                    webSitesi: data.web_sitesi || "",
                    email: data.email || "",
                    referanslar: data.referanslar || "",
                });
                showToast?.("Cari yüklendi", "success");
            }
        } catch (err: any) {
            showToast?.("Hata: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="glass-card p-2 mb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1 flex-wrap">
                        <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm font-medium transition-all">
                            <Save className="w-4 h-4" />
                            <span className="hidden sm:inline">Kaydet</span>
                        </button>
                        <button onClick={handleClear} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-sm font-medium transition-all">
                            <X className="w-4 h-4" />
                            <span className="hidden sm:inline">Vazgeç</span>
                        </button>
                        <button onClick={handleDelete} disabled={!editingId || loading} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-all">
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Sil</span>
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-all">
                            <Copy className="w-4 h-4" />
                            <span className="hidden sm:inline">Kopyala</span>
                        </button>
                        <div className="hidden md:block w-px h-6 bg-white/20 mx-1" />
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-sm font-medium transition-all">
                            <List className="w-4 h-4" />
                            <span className="hidden lg:inline">Fihrist</span>
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-sm font-medium transition-all">
                            <FileText className="w-4 h-4" />
                            <span className="hidden lg:inline">Hareket</span>
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-sm font-medium transition-all">
                            <FolderOpen className="w-4 h-4" />
                            <span className="hidden lg:inline">Dosya</span>
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-sm font-medium transition-all">
                            <Printer className="w-4 h-4" />
                            <span className="hidden lg:inline">Yazdır</span>
                        </button>
                    </div>
                    <div className="flex items-center gap-2 text-secondary">
                        {loading && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
                        <Users className="w-4 h-4" />
                        <span className="text-sm font-medium text-[var(--color-foreground)]">Cari Sayısı:</span>
                        <span className="text-primary font-bold">{cariCount}</span>
                        {editingId && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded ml-2">Düzenleniyor</span>}
                    </div>
                </div>
            </div>

            {/* Cari Kodu Header */}
            <div className="glass-card p-3 mb-3">
                <div className="flex items-center gap-3 flex-wrap">
                    <label className="text-secondary font-medium text-sm whitespace-nowrap">Cari Kodu</label>
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <input
                            type="text"
                            value={formData.cariKodu}
                            onChange={(e) => updateField("cariKodu", e.target.value)}
                            className="flex-1 bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-3 py-1.5 text-[var(--color-foreground)] text-sm focus:border-primary focus:outline-none"
                            placeholder="Cari kodu girin..."
                        />
                        <button onClick={handleSearch} disabled={loading} className="p-1.5 bg-white/5 hover:bg-white/10 border border-[var(--color-input-border)] rounded transition-colors disabled:opacity-50">
                            <Search className="w-4 h-4 text-secondary" />
                        </button>
                    </div>
                    <div className="flex items-center gap-0.5">
                        <button className="p-1.5 bg-white/5 hover:bg-white/10 rounded transition-colors">
                            <ChevronsLeft className="w-4 h-4 text-secondary" />
                        </button>
                        <button className="p-1.5 bg-white/5 hover:bg-white/10 rounded transition-colors">
                            <ChevronLeft className="w-4 h-4 text-secondary" />
                        </button>
                        <button className="p-1.5 bg-white/5 hover:bg-white/10 rounded transition-colors">
                            <ChevronRight className="w-4 h-4 text-secondary" />
                        </button>
                        <button className="p-1.5 bg-white/5 hover:bg-white/10 rounded transition-colors">
                            <ChevronsRight className="w-4 h-4 text-secondary" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-0.5 mb-3 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-t text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                            ? "bg-primary text-white"
                            : "bg-white/5 text-secondary hover:bg-white/10 hover:text-white"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="glass-card p-4 flex-1 overflow-y-auto">
                {activeTab === 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3">
                        {/* Kolon 1 */}
                        <div className="space-y-3">
                            <FormInput label="Ünvanı" value={formData.unvani} onChange={(v) => updateField("unvani", v)} />
                            <FormInput label="Ünvanı - 2" value={formData.unvani2} onChange={(v) => updateField("unvani2", v)} />
                            <FormInput label="Vergi Dairesi" value={formData.vergiDairesi} onChange={(v) => updateField("vergiDairesi", v)} />
                            <FormInput label="Vergi No" value={formData.vergiNo} onChange={(v) => updateField("vergiNo", v)} />
                            <FormSelect label="Durum" value={formData.durum} onChange={(v) => updateField("durum", v)} options={[
                                { value: "Aktif", label: "Aktif" },
                                { value: "Pasif", label: "Pasif" },
                            ]} />
                            <FormSelect label="Cari Tipi" value={formData.cariTipi} onChange={(v) => updateField("cariTipi", v)} options={[
                                { value: "", label: "Seçiniz..." },
                                { value: "Müşteri", label: "Müşteri" },
                                { value: "Tedarikçi", label: "Tedarikçi" },
                                { value: "Her İkisi", label: "Her İkisi" },
                            ]} />
                            <FormInputWithSearch label="Grup Kodu" value={formData.grupKodu} onChange={(v) => updateField("grupKodu", v)} />
                            <FormInputWithSearch label="Özel Kodu" value={formData.ozelKodu} onChange={(v) => updateField("ozelKodu", v)} />
                            <FormInputWithSearch label="Yetki Kodu" value={formData.yetkiKodu} onChange={(v) => updateField("yetkiKodu", v)} />
                            <FormInputWithSearch label="Sektör Kodu" value={formData.sektorKodu} onChange={(v) => updateField("sektorKodu", v)} />
                            <FormInputWithSearch label="Bölge Kodu" value={formData.bolgeKodu} onChange={(v) => updateField("bolgeKodu", v)} />
                            <FormSelect label="Para Birimi" value={formData.paraBirimi} onChange={(v) => updateField("paraBirimi", v)} options={[
                                { value: "TRY", label: "TRY - Türk Lirası" },
                                { value: "USD", label: "USD - Amerikan Doları" },
                                { value: "EUR", label: "EUR - Euro" },
                                { value: "GBP", label: "GBP - İngiliz Sterlini" },
                            ]} />
                            <FormSelect label="Hesap Tipi" value={formData.hesapTipi} onChange={(v) => updateField("hesapTipi", v)} options={[
                                { value: "", label: "Seçiniz..." },
                                { value: "Peşin", label: "Peşin" },
                                { value: "Vadeli", label: "Vadeli" },
                            ]} />
                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="mutabakat"
                                    checked={formData.mutabakat}
                                    onChange={(e) => updateField("mutabakat", e.target.checked)}
                                    className="w-4 h-4 rounded border-[var(--color-input-border)] bg-[var(--color-input-bg)] text-primary focus:ring-primary"
                                />
                                <label htmlFor="mutabakat" className="text-[var(--color-foreground)] text-sm">Mutabakat</label>
                            </div>
                        </div>

                        {/* Kolon 2 */}
                        <div className="space-y-3">
                            <FormSelect label="Kur Hesaplama" value={formData.kurHesaplama} onChange={(v) => updateField("kurHesaplama", v)} options={[
                                { value: "", label: "Seçiniz..." },
                                { value: "Alış", label: "Alış" },
                                { value: "Satış", label: "Satış" },
                                { value: "Efektif Alış", label: "Efektif Alış" },
                                { value: "Efektif Satış", label: "Efektif Satış" },
                            ]} />
                            <FormSelect label="Kdv Tipi A/S" value={formData.kdvTipiAS} onChange={(v) => updateField("kdvTipiAS", v)} options={[
                                { value: "", label: "Seçiniz..." },
                                { value: "A", label: "Alış" },
                                { value: "S", label: "Satış" },
                            ]} />
                            <FormSelect label="Kdv Kapsamı" value={formData.kdvKapsami} onChange={(v) => updateField("kdvKapsami", v)} options={[
                                { value: "", label: "Seçiniz..." },
                                { value: "Dahil", label: "KDV Dahil" },
                                { value: "Hariç", label: "KDV Hariç" },
                            ]} />
                            <FormSelect label="Fiyat Tipi" value={formData.fiyatTipi} onChange={(v) => updateField("fiyatTipi", v)} options={[
                                { value: "", label: "Seçiniz..." },
                                { value: "Perakende", label: "Perakende" },
                                { value: "Toptan", label: "Toptan" },
                                { value: "Bayii", label: "Bayii" },
                            ]} />
                            <FormNumber label="İskonto Oranı" value={formData.iskontoOrani} onChange={(v) => updateField("iskontoOrani", v)} suffix="%" />
                            <FormNumber label="Vade Oranı" value={formData.vadeOrani} onChange={(v) => updateField("vadeOrani", v)} suffix="%" />
                            <FormInput label="Vade Gün/Tarih" value={formData.vadeGunTarih} onChange={(v) => updateField("vadeGunTarih", v)} type="date" />
                            <FormInputWithSearch label="Ödeme Plan No" value={formData.odemePlanNo} onChange={(v) => updateField("odemePlanNo", v)} />
                            <FormNumber label="Kredi Limiti" value={formData.krediLimiti} onChange={(v) => updateField("krediLimiti", v)} />
                            <FormNumber label="Risk Limiti" value={formData.riskLimiti} onChange={(v) => updateField("riskLimiti", v)} />
                            <FormInputWithSearch label="Müşteri Kodu" value={formData.musteriKodu} onChange={(v) => updateField("musteriKodu", v)} />
                            <FormInputWithSearch label="Personel Kodu" value={formData.personelKodu} onChange={(v) => updateField("personelKodu", v)} />
                        </div>

                        {/* Kolon 3 */}
                        <div className="space-y-3">
                            <FormInput label="Firma Şirk.No" value={formData.firmaSirkNo} onChange={(v) => updateField("firmaSirkNo", v)} />
                            <FormInput label="Satıcı Kodu-1" value={formData.saticiKodu1} onChange={(v) => updateField("saticiKodu1", v)} />
                            <FormInput label="Satıcı Kodu-2" value={formData.saticiKodu2} onChange={(v) => updateField("saticiKodu2", v)} />
                            <FormInputWithSearch label="Ana Cari Kodu" value={formData.anaCariKodu} onChange={(v) => updateField("anaCariKodu", v)} />
                            <FormInput label="Üretim Konusu" value={formData.uretimKonusu} onChange={(v) => updateField("uretimKonusu", v)} />
                            <FormInput label="Çalışma Alanı" value={formData.calismaAlani} onChange={(v) => updateField("calismaAlani", v)} />
                            <FormInput label="Ödeme Bilgisi" value={formData.odemeBilgisi} onChange={(v) => updateField("odemeBilgisi", v)} />
                            <FormNumber label="Diğer İsk.Orn." value={formData.digerIskOrn} onChange={(v) => updateField("digerIskOrn", v)} suffix="%" />
                            <FormNumber label="E.O. İsk.Orn." value={formData.eoIskOrn} onChange={(v) => updateField("eoIskOrn", v)} suffix="%" />
                            <FormInput label="Brm İsk.Orn." value={formData.brmIskOrn} onChange={(v) => updateField("brmIskOrn", v)} />
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <FormInput label="Vade Tarihi-2" value={formData.vadeTarihi2} onChange={(v) => updateField("vadeTarihi2", v)} type="date" />
                                </div>
                                <div className="flex items-end pb-1">
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="checkbox"
                                            id="sirkular"
                                            checked={formData.sirkular}
                                            onChange={(e) => updateField("sirkular", e.target.checked)}
                                            className="w-4 h-4 rounded border-white/20 bg-[#0a1628] text-primary focus:ring-primary"
                                        />
                                        <label htmlFor="sirkular" className="text-white text-xs">Sirküler</label>
                                    </div>
                                </div>
                            </div>
                            <FormInputWithSearch label="Depo No" value={formData.depoNo} onChange={(v) => updateField("depoNo", v)} />
                            <FormInput label="Sprs Tarih/Gün" value={formData.sprsTarihGun} onChange={(v) => updateField("sprsTarihGun", v)} type="date" />
                        </div>

                        {/* Kolon 4 */}
                        <div className="space-y-3">
                            <FormSelect label="H.Kesim Tipi" value={formData.hKesimTipi} onChange={(v) => updateField("hKesimTipi", v)} options={[
                                { value: "", label: "Seçiniz..." },
                                { value: "Tip1", label: "Tip 1" },
                                { value: "Tip2", label: "Tip 2" },
                            ]} />
                            <FormInput label="H.K. Gün/Tar" value={formData.hkGunTar} onChange={(v) => updateField("hkGunTar", v)} type="date" />
                            <FormSelect label="S.A. Tipi" value={formData.saTipi} onChange={(v) => updateField("saTipi", v)} options={[
                                { value: "", label: "Seçiniz..." },
                                { value: "Tip1", label: "Tip 1" },
                                { value: "Tip2", label: "Tip 2" },
                            ]} />
                            <FormInput label="S.Gün/Tar." value={formData.saGunTar} onChange={(v) => updateField("saGunTar", v)} type="date" />
                            <FormNumber label="Açık Teminat" value={formData.acikTeminat} onChange={(v) => updateField("acikTeminat", v)} />
                            <FormNumber label="Banka Teminatı" value={formData.bankaTeminati} onChange={(v) => updateField("bankaTeminati", v)} />
                            <FormNumber label="İpotek Teminatı" value={formData.ipotekTeminati} onChange={(v) => updateField("ipotekTeminati", v)} />
                            <FormNumber label="Teminat Çeki" value={formData.teminatCeki} onChange={(v) => updateField("teminatCeki", v)} />
                            <FormNumber label="Teminat Senedi" value={formData.teminatSenedi} onChange={(v) => updateField("teminatSenedi", v)} />
                            <FormNumber label="Diğer Teminat" value={formData.digerTeminat} onChange={(v) => updateField("digerTeminat", v)} />
                            <FormNumber label="Teminat Tutarı" value={formData.teminatTutari} onChange={(v) => updateField("teminatTutari", v)} />
                            <FormInput label="Şube Kodu / Adı" value={formData.subeKoduAdi} onChange={(v) => updateField("subeKoduAdi", v)} />
                        </div>
                    </div>
                )}

                {activeTab === 1 && (
                    <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-secondary/40 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Adres ve İlgililer</h3>
                        <p className="text-secondary">Bu sekme yakında aktif olacak</p>
                    </div>
                )}

                {activeTab === 2 && (
                    <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-secondary/40 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Bankalar ve Notlar</h3>
                        <p className="text-secondary">Bu sekme yakında aktif olacak</p>
                    </div>
                )}

                {activeTab === 3 && (
                    <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-secondary/40 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Kimlik Bilgileri</h3>
                        <p className="text-secondary">Bu sekme yakında aktif olacak</p>
                    </div>
                )}
            </div>

            {/* İletişim Bilgileri */}
            <div className="glass-card p-3 mt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <FormInput label="Web Sitesi" value={formData.webSitesi} onChange={(v) => updateField("webSitesi", v)} placeholder="www.example.com" />
                    <FormInput label="e-Mail" value={formData.email} onChange={(v) => updateField("email", v)} placeholder="info@example.com" />
                    <FormInput label="Referanslar" value={formData.referanslar} onChange={(v) => updateField("referanslar", v)} />
                </div>
            </div>

            {/* Footer - Toplamlar */}
            <div className="glass-card p-3 mt-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <div className="bg-[#0a1628] rounded-lg p-3 border border-white/5">
                        <p className="text-secondary text-xs mb-0.5">Borç Toplamı</p>
                        <p className="text-xl font-bold text-red-500">₺0,00</p>
                    </div>
                    <div className="bg-[#0a1628] rounded-lg p-3 border border-white/5">
                        <p className="text-secondary text-xs mb-0.5">Alacak Toplamı</p>
                        <p className="text-xl font-bold text-emerald-500">₺0,00</p>
                    </div>
                    <div className="bg-[#0a1628] rounded-lg p-3 border border-white/5">
                        <p className="text-secondary text-xs mb-0.5">Bakiye Toplamı</p>
                        <p className="text-xl font-bold text-white">₺0,00</p>
                    </div>
                    <div className="bg-[#0a1628] rounded-lg p-3 border border-white/5">
                        <p className="text-secondary text-xs mb-0.5">Bakiye Tipi</p>
                        <p className="text-lg font-medium text-secondary">-</p>
                    </div>
                    <div className="bg-[#0a1628] rounded-lg p-3 border border-white/5">
                        <p className="text-secondary text-xs mb-0.5">Ger. Ödeme Vadesi</p>
                        <p className="text-lg font-medium text-secondary">-</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
