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
    Plus,
    Phone,
    MapPin,
    Building2,
    CreditCard,
    User,
    Landmark,
    StickyNote,
    ShieldCheck,
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
    const [showFihrist, setShowFihrist] = useState(false);
    const [showHareket, setShowHareket] = useState(false);
    const [showHareketSearch, setShowHareketSearch] = useState(false);
    const [hareketSearchQuery, setHareketSearchQuery] = useState('');
    const [hareketSearchResults, setHareketSearchResults] = useState<any[]>([]);
    const [hareketSearchLoading, setHareketSearchLoading] = useState(false);
    const [selectedHareketCariId, setSelectedHareketCariId] = useState<string | null>(null);
    const [selectedHareketCariName, setSelectedHareketCariName] = useState('');
    const [cariList, setCariList] = useState<any[]>([]);
    const [hareketList, setHareketList] = useState<any[]>([]);
    const [fihristLoading, setFihristLoading] = useState(false);

    // İlgili Kişiler ve Banka listesi (alt tablolar)
    const [ilgililer, setIlgililer] = useState<any[]>([]);
    const [bankalar, setBankalar] = useState<any[]>([]);

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
        // Tab 2: Adres ve İletişim
        tel1: "",
        tel2: "",
        cepTel: "",
        fax: "",
        adres: "",
        adres2: "",
        il: "",
        ilce: "",
        postaKodu: "",
        ulke: "Türkiye",
        email2: "",
        // Tab 3: Notlar
        notlar: "",
        // Tab 4: Kimlik Bilgileri
        tcKimlikNo: "",
        dogumTarihi: "",
        dogumYeri: "",
        babaAdi: "",
        anneAdi: "",
        uyruk: "T.C.",
        cinsiyet: "",
        medeniHal: "",
        ehliyetNo: "",
        pasaportNo: "",
        ticaretSicilNo: "",
        mersisNo: "",
        kepAdresi: "",
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

    // Fihrist: Tüm cari listesi
    const handleFihrist = async () => {
        if (!currentTenant) return;
        setFihristLoading(true);
        setShowFihrist(true);
        const { data } = await supabase
            .from('cari_hesaplar')
            .select('cari_kodu, unvani, cari_tipi, durum')
            .eq('tenant_id', currentTenant.id)
            .order('cari_kodu');
        setCariList(data || []);
        setFihristLoading(false);
    };

    // Hareket: Seçili carinin hareketleri
    const loadHareketForCari = async (cariId: string) => {
        setFihristLoading(true);
        setShowHareket(true);
        setShowHareketSearch(false);
        const { data } = await supabase
            .from('cari_hareketler')
            .select('*')
            .eq('cari_id', cariId)
            .order('tarih', { ascending: false })
            .limit(100);
        setHareketList(data || []);
        setFihristLoading(false);
    };

    const handleHareket = async () => {
        if (editingId) {
            // Seçili cari varsa direkt hareketlerini göster
            setSelectedHareketCariId(editingId);
            setSelectedHareketCariName(formData.unvani || formData.cariKodu);
            await loadHareketForCari(editingId);
        } else {
            // Seçili cari yoksa arama modalını aç
            setHareketSearchQuery('');
            setHareketSearchResults([]);
            setShowHareketSearch(true);
        }
    };

    // Hareket arama: Cari adı veya kodu ile arama
    const handleHareketSearch = async (query: string) => {
        setHareketSearchQuery(query);
        if (!currentTenant || query.length < 1) {
            setHareketSearchResults([]);
            return;
        }
        setHareketSearchLoading(true);
        const { data } = await supabase
            .from('cari_hesaplar')
            .select('id, cari_kodu, unvani, cari_tipi')
            .eq('tenant_id', currentTenant.id)
            .or(`unvani.ilike.%${query}%,cari_kodu.ilike.%${query}%`)
            .order('unvani')
            .limit(20);
        setHareketSearchResults(data || []);
        setHareketSearchLoading(false);
    };

    const handleSelectHareketCari = async (cari: any) => {
        setSelectedHareketCariId(cari.id);
        setSelectedHareketCariName(cari.unvani || cari.cari_kodu);
        await loadHareketForCari(cari.id);
    };

    const handleDosya = () => {
        if (!editingId) {
            showToast?.('Lütfen dosya eklemek/görmek için bir cari seçin.', 'warning');
            return;
        }
        showToast?.('Dosya modülü yakında kullanıma sunulacaktır.', 'info');
    };

    const handlePrintCari = () => {
        // Form verilerinden yazdır (editingId olsun olmasın, ekrandaki formdan al)
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Cari Kart - ${formData.unvani || formData.cariKodu}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; color: #000; }
                        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
                        .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
                        .subtitle { font-size: 14px; color: #666; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px; }
                        .info-row { display: flex; border-bottom: 1px solid #eee; padding: 6px 0; }
                        .info-label { min-width: 160px; font-weight: bold; color: #555; font-size: 13px; }
                        .info-value { font-size: 13px; }
                        .section-title { font-size: 16px; font-weight: bold; margin-top: 25px; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #333; }
                        @media print {
                            body { -webkit-print-color-adjust: exact; padding: 20px; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="title">CARİ KART BİLGİSİ</div>
                        <div class="subtitle">Tarih: ${new Date().toLocaleDateString('tr-TR')}</div>
                    </div>
                    
                    <div class="section-title">Genel Bilgiler</div>
                    <div class="info-grid">
                        <div class="info-row"><div class="info-label">Cari Kodu:</div><div class="info-value">${formData.cariKodu || '-'}</div></div>
                        <div class="info-row"><div class="info-label">Ünvanı:</div><div class="info-value">${formData.unvani || '-'}</div></div>
                        <div class="info-row"><div class="info-label">Ünvanı 2:</div><div class="info-value">${formData.unvani2 || '-'}</div></div>
                        <div class="info-row"><div class="info-label">Vergi Dairesi:</div><div class="info-value">${formData.vergiDairesi || '-'}</div></div>
                        <div class="info-row"><div class="info-label">Vergi No:</div><div class="info-value">${formData.vergiNo || '-'}</div></div>
                        <div class="info-row"><div class="info-label">Durum:</div><div class="info-value">${formData.durum || '-'}</div></div>
                        <div class="info-row"><div class="info-label">Cari Tipi:</div><div class="info-value">${formData.cariTipi || '-'}</div></div>
                        <div class="info-row"><div class="info-label">Para Birimi:</div><div class="info-value">${formData.paraBirimi || '-'}</div></div>
                        <div class="info-row"><div class="info-label">Hesap Tipi:</div><div class="info-value">${formData.hesapTipi || '-'}</div></div>
                    </div>

                    <div class="section-title">İletişim</div>
                    <div class="info-grid">
                        <div class="info-row"><div class="info-label">Web Sitesi:</div><div class="info-value">${formData.webSitesi || '-'}</div></div>
                        <div class="info-row"><div class="info-label">E-Posta:</div><div class="info-value">${formData.email || '-'}</div></div>
                        <div class="info-row"><div class="info-label">Referanslar:</div><div class="info-value">${formData.referanslar || '-'}</div></div>
                    </div>

                    <div class="section-title">Mali Bilgiler</div>
                    <div class="info-grid">
                        <div class="info-row"><div class="info-label">İskonto Oranı:</div><div class="info-value">%${formData.iskontoOrani}</div></div>
                        <div class="info-row"><div class="info-label">Vade Oranı:</div><div class="info-value">%${formData.vadeOrani}</div></div>
                        <div class="info-row"><div class="info-label">Kredi Limiti:</div><div class="info-value">${Number(formData.krediLimiti).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div></div>
                        <div class="info-row"><div class="info-label">Risk Limiti:</div><div class="info-value">${Number(formData.riskLimiti).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div></div>
                        <div class="info-row"><div class="info-label">Teminat Tutarı:</div><div class="info-value">${Number(formData.teminatTutari).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div></div>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 250);
    };

    // Otomatik Cari Kodu üret (C001, C002, ...)
    const generateNextCariKodu = async (): Promise<string> => {
        if (!currentTenant) return 'C001';
        const { data } = await supabase
            .from('cari_hesaplar')
            .select('cari_kodu')
            .eq('tenant_id', currentTenant.id)
            .like('cari_kodu', 'C%')
            .order('cari_kodu', { ascending: false })
            .limit(1);

        if (data && data.length > 0) {
            const lastKode = data[0].cari_kodu;
            const num = parseInt(lastKode.replace(/^C/, ''), 10);
            if (!isNaN(num)) {
                return 'C' + String(num + 1).padStart(3, '0');
            }
        }
        return 'C001';
    };

    // Sayfa yüklendiğinde cari sayısını al ve otomatik kod üret
    useEffect(() => {
        loadCariCount();
        // İlk yüklemede otomatik kod üret
        generateNextCariKodu().then(kod => {
            setFormData(prev => ({ ...prev, cariKodu: kod }));
        });

        if (currentTenant) {
            // Realtime subscription for cari_hesaplar
            const channel = supabase
                .channel(`cari_realtime_${currentTenant.id}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'cari_hesaplar',
                    filter: `tenant_id=eq.${currentTenant.id}`
                }, (payload) => {
                    console.log('Cari Realtime Change:', payload);
                    loadCariCount();
                    
                    // Fihrist açıksa listeyi de güncelle
                    if (showFihrist) {
                        handleFihrist();
                    }
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [currentTenant, showFihrist]);

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
        // Adres ve İletişim
        tel_1: formData.tel1,
        tel_2: formData.tel2,
        cep_tel: formData.cepTel,
        fax: formData.fax,
        adres: formData.adres,
        adres_2: formData.adres2,
        il: formData.il,
        ilce: formData.ilce,
        posta_kodu: formData.postaKodu,
        ulke: formData.ulke,
        email_2: formData.email2,
        // Notlar
        notlar: formData.notlar,
        // Kimlik
        tc_kimlik_no: formData.tcKimlikNo,
        dogum_tarihi: formData.dogumTarihi || null,
        dogum_yeri: formData.dogumYeri,
        baba_adi: formData.babaAdi,
        anne_adi: formData.anneAdi,
        uyruk: formData.uyruk,
        cinsiyet: formData.cinsiyet,
        medeni_hal: formData.medeniHal,
        ehliyet_no: formData.ehliyetNo,
        pasaport_no: formData.pasaportNo,
        ticaret_sicil_no: formData.ticaretSicilNo,
        mersis_no: formData.mersisNo,
        kep_adresi: formData.kepAdresi,
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
    const handleClear = async () => {
        setEditingId(null);
        const yeniKod = await generateNextCariKodu();
        setFormData({
            cariKodu: yeniKod,
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
            tel1: "",
            tel2: "",
            cepTel: "",
            fax: "",
            adres: "",
            adres2: "",
            il: "",
            ilce: "",
            postaKodu: "",
            ulke: "Türkiye",
            email2: "",
            notlar: "",
            tcKimlikNo: "",
            dogumTarihi: "",
            dogumYeri: "",
            babaAdi: "",
            anneAdi: "",
            uyruk: "T.C.",
            cinsiyet: "",
            medeniHal: "",
            ehliyetNo: "",
            pasaportNo: "",
            ticaretSicilNo: "",
            mersisNo: "",
            kepAdresi: "",
        });
        setIlgililer([]);
        setBankalar([]);
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
                    tel1: data.tel_1 || "",
                    tel2: data.tel_2 || "",
                    cepTel: data.cep_tel || "",
                    fax: data.fax || "",
                    adres: data.adres || "",
                    adres2: data.adres_2 || "",
                    il: data.il || "",
                    ilce: data.ilce || "",
                    postaKodu: data.posta_kodu || "",
                    ulke: data.ulke || "Türkiye",
                    email2: data.email_2 || "",
                    notlar: data.notlar || "",
                    tcKimlikNo: data.tc_kimlik_no || "",
                    dogumTarihi: data.dogum_tarihi || "",
                    dogumYeri: data.dogum_yeri || "",
                    babaAdi: data.baba_adi || "",
                    anneAdi: data.anne_adi || "",
                    uyruk: data.uyruk || "T.C.",
                    cinsiyet: data.cinsiyet || "",
                    medeniHal: data.medeni_hal || "",
                    ehliyetNo: data.ehliyet_no || "",
                    pasaportNo: data.pasaport_no || "",
                    ticaretSicilNo: data.ticaret_sicil_no || "",
                    mersisNo: data.mersis_no || "",
                    kepAdresi: data.kep_adresi || "",
                });
                // İlgili kişileri yükle
                const { data: ilgData } = await supabase
                    .from('cari_ilgililer')
                    .select('*')
                    .eq('cari_id', data.id)
                    .order('created_at');
                setIlgililer(ilgData || []);
                // Banka bilgilerini yükle
                const { data: bnkData } = await supabase
                    .from('cari_bankalar')
                    .select('*')
                    .eq('cari_id', data.id)
                    .order('created_at');
                setBankalar(bnkData || []);
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
                        <button onClick={handleFihrist} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-sm font-medium transition-all">
                            <List className="w-4 h-4" />
                            <span className="hidden lg:inline">Fihrist</span>
                        </button>
                        <button onClick={handleHareket} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-sm font-medium transition-all">
                            <FileText className="w-4 h-4" />
                            <span className="hidden lg:inline">Hareket</span>
                        </button>
                        <button onClick={handleDosya} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-sm font-medium transition-all">
                            <FolderOpen className="w-4 h-4" />
                            <span className="hidden lg:inline">Dosya</span>
                        </button>
                        <button onClick={handlePrintCari} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-sm font-medium transition-all">
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

                {/* TAB 2: ADRES VE İLGİLİLER */}
                {activeTab === 1 && (
                    <div className="space-y-6">
                        {/* Adres Bilgileri */}
                        <div>
                            <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                                <MapPin className="w-4 h-4 text-primary" /> Adres Bilgileri
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                                <div className="sm:col-span-2 lg:col-span-3 space-y-1">
                                    <label className="text-secondary text-xs font-medium">Adres</label>
                                    <textarea
                                        value={formData.adres}
                                        onChange={(e) => updateField('adres', e.target.value)}
                                        rows={2}
                                        className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-3 py-1.5 text-[var(--color-foreground)] text-sm focus:border-primary focus:outline-none transition-colors resize-none"
                                        placeholder="Adres satırı 1..."
                                    />
                                </div>
                                <div className="sm:col-span-2 lg:col-span-3 space-y-1">
                                    <label className="text-secondary text-xs font-medium">Adres 2</label>
                                    <textarea
                                        value={formData.adres2}
                                        onChange={(e) => updateField('adres2', e.target.value)}
                                        rows={2}
                                        className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded px-3 py-1.5 text-[var(--color-foreground)] text-sm focus:border-primary focus:outline-none transition-colors resize-none"
                                        placeholder="Adres satırı 2 (opsiyonel)..."
                                    />
                                </div>
                                <FormInput label="İl" value={formData.il} onChange={(v) => updateField('il', v)} placeholder="İstanbul" />
                                <FormInput label="İlçe" value={formData.ilce} onChange={(v) => updateField('ilce', v)} placeholder="Kadıköy" />
                                <FormInput label="Posta Kodu" value={formData.postaKodu} onChange={(v) => updateField('postaKodu', v)} placeholder="34000" />
                                <FormInput label="Ülke" value={formData.ulke} onChange={(v) => updateField('ulke', v)} />
                            </div>
                        </div>

                        {/* Telefon Bilgileri */}
                        <div>
                            <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                                <Phone className="w-4 h-4 text-emerald-400" /> Telefon ve E-Posta
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3">
                                <FormInput label="Telefon 1" value={formData.tel1} onChange={(v) => updateField('tel1', v)} placeholder="0212 555 00 00" />
                                <FormInput label="Telefon 2" value={formData.tel2} onChange={(v) => updateField('tel2', v)} placeholder="0216 555 00 00" />
                                <FormInput label="Cep Telefonu" value={formData.cepTel} onChange={(v) => updateField('cepTel', v)} placeholder="0532 555 00 00" />
                                <FormInput label="Fax" value={formData.fax} onChange={(v) => updateField('fax', v)} placeholder="0212 555 00 01" />
                                <FormInput label="E-Posta 2" value={formData.email2} onChange={(v) => updateField('email2', v)} placeholder="muhasebe@firma.com" />
                            </div>
                        </div>

                        {/* İlgili Kişiler */}
                        <div>
                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                                    <Users className="w-4 h-4 text-blue-400" /> İlgili Kişiler
                                </h3>
                                <button
                                    onClick={async () => {
                                        if (!editingId) { showToast?.('Önce cariyi kaydedin.', 'warning'); return; }
                                        const { data, error } = await supabase.from('cari_ilgililer').insert([{
                                            cari_id: editingId, tenant_id: currentTenant?.id,
                                            adi_soyadi: '', unvani: '', telefon_is: '', telefon_cep: '', telefon_fax: '', mail_adresi: ''
                                        }]).select().single();
                                        if (!error && data) setIlgililer(prev => [...prev, data]);
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1 bg-primary/20 hover:bg-primary/30 text-primary rounded text-xs font-medium transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Kişi Ekle
                                </button>
                            </div>
                            {ilgililer.length === 0 ? (
                                <div className="text-center py-6 text-secondary text-sm">
                                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    Henüz ilgili kişi eklenmedi
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {ilgililer.map((ilg, idx) => (
                                        <div key={ilg.id || idx} className="bg-white/5 border border-white/10 rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs text-primary font-medium">Kişi #{idx + 1}</span>
                                                <button
                                                    onClick={async () => {
                                                        if (ilg.id) await supabase.from('cari_ilgililer').delete().eq('id', ilg.id);
                                                        setIlgililer(prev => prev.filter((_, i) => i !== idx));
                                                    }}
                                                    className="p-1 hover:bg-red-500/20 rounded transition-colors text-red-400 hover:text-red-300"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                                <FormInput label="Adı Soyadı" value={ilg.adi_soyadi || ''} onChange={async (v) => {
                                                    const updated = [...ilgililer]; updated[idx] = { ...updated[idx], adi_soyadi: v }; setIlgililer(updated);
                                                    if (ilg.id) await supabase.from('cari_ilgililer').update({ adi_soyadi: v }).eq('id', ilg.id);
                                                }} />
                                                <FormInput label="Ünvanı/Görevi" value={ilg.unvani || ''} onChange={async (v) => {
                                                    const updated = [...ilgililer]; updated[idx] = { ...updated[idx], unvani: v }; setIlgililer(updated);
                                                    if (ilg.id) await supabase.from('cari_ilgililer').update({ unvani: v }).eq('id', ilg.id);
                                                }} />
                                                <FormInput label="İş Tel" value={ilg.telefon_is || ''} onChange={async (v) => {
                                                    const updated = [...ilgililer]; updated[idx] = { ...updated[idx], telefon_is: v }; setIlgililer(updated);
                                                    if (ilg.id) await supabase.from('cari_ilgililer').update({ telefon_is: v }).eq('id', ilg.id);
                                                }} />
                                                <FormInput label="Cep Tel" value={ilg.telefon_cep || ''} onChange={async (v) => {
                                                    const updated = [...ilgililer]; updated[idx] = { ...updated[idx], telefon_cep: v }; setIlgililer(updated);
                                                    if (ilg.id) await supabase.from('cari_ilgililer').update({ telefon_cep: v }).eq('id', ilg.id);
                                                }} />
                                                <FormInput label="Fax" value={ilg.telefon_fax || ''} onChange={async (v) => {
                                                    const updated = [...ilgililer]; updated[idx] = { ...updated[idx], telefon_fax: v }; setIlgililer(updated);
                                                    if (ilg.id) await supabase.from('cari_ilgililer').update({ telefon_fax: v }).eq('id', ilg.id);
                                                }} />
                                                <FormInput label="E-Posta" value={ilg.mail_adresi || ''} onChange={async (v) => {
                                                    const updated = [...ilgililer]; updated[idx] = { ...updated[idx], mail_adresi: v }; setIlgililer(updated);
                                                    if (ilg.id) await supabase.from('cari_ilgililer').update({ mail_adresi: v }).eq('id', ilg.id);
                                                }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 3: BANKALAR VE NOTLAR */}
                {activeTab === 2 && (
                    <div className="space-y-6">
                        {/* Banka Bilgileri */}
                        <div>
                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                                    <Landmark className="w-4 h-4 text-amber-400" /> Banka Hesapları
                                </h3>
                                <button
                                    onClick={async () => {
                                        if (!editingId) { showToast?.('Önce cariyi kaydedin.', 'warning'); return; }
                                        const { data, error } = await supabase.from('cari_bankalar').insert([{
                                            cari_id: editingId, tenant_id: currentTenant?.id,
                                            banka_adi: '', sube_adi: '', hesap_no: '', iban: '', para_birimi: 'TRY'
                                        }]).select().single();
                                        if (!error && data) setBankalar(prev => [...prev, data]);
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded text-xs font-medium transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Banka Ekle
                                </button>
                            </div>
                            {bankalar.length === 0 ? (
                                <div className="text-center py-6 text-secondary text-sm">
                                    <Landmark className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    Henüz banka hesabı eklenmedi
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {bankalar.map((bnk, idx) => (
                                        <div key={bnk.id || idx} className="bg-white/5 border border-white/10 rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
                                                    <CreditCard className="w-3.5 h-3.5" /> Hesap #{idx + 1}
                                                </span>
                                                <button
                                                    onClick={async () => {
                                                        if (bnk.id) await supabase.from('cari_bankalar').delete().eq('id', bnk.id);
                                                        setBankalar(prev => prev.filter((_, i) => i !== idx));
                                                    }}
                                                    className="p-1 hover:bg-red-500/20 rounded transition-colors text-red-400 hover:text-red-300"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                                                <FormInput label="Banka Adı" value={bnk.banka_adi || ''} onChange={async (v) => {
                                                    const updated = [...bankalar]; updated[idx] = { ...updated[idx], banka_adi: v }; setBankalar(updated);
                                                    if (bnk.id) await supabase.from('cari_bankalar').update({ banka_adi: v }).eq('id', bnk.id);
                                                }} />
                                                <FormInput label="Şube Adı" value={bnk.sube_adi || ''} onChange={async (v) => {
                                                    const updated = [...bankalar]; updated[idx] = { ...updated[idx], sube_adi: v }; setBankalar(updated);
                                                    if (bnk.id) await supabase.from('cari_bankalar').update({ sube_adi: v }).eq('id', bnk.id);
                                                }} />
                                                <FormInput label="Hesap No" value={bnk.hesap_no || ''} onChange={async (v) => {
                                                    const updated = [...bankalar]; updated[idx] = { ...updated[idx], hesap_no: v }; setBankalar(updated);
                                                    if (bnk.id) await supabase.from('cari_bankalar').update({ hesap_no: v }).eq('id', bnk.id);
                                                }} />
                                                <FormInput label="IBAN" value={bnk.iban || ''} onChange={async (v) => {
                                                    const updated = [...bankalar]; updated[idx] = { ...updated[idx], iban: v }; setBankalar(updated);
                                                    if (bnk.id) await supabase.from('cari_bankalar').update({ iban: v }).eq('id', bnk.id);
                                                }} placeholder="TR00 0000 0000 0000 0000 0000 00" />
                                                <FormSelect label="Para Birimi" value={bnk.para_birimi || 'TRY'} onChange={async (v) => {
                                                    const updated = [...bankalar]; updated[idx] = { ...updated[idx], para_birimi: v }; setBankalar(updated);
                                                    if (bnk.id) await supabase.from('cari_bankalar').update({ para_birimi: v }).eq('id', bnk.id);
                                                }} options={[
                                                    { value: 'TRY', label: 'TRY' },
                                                    { value: 'USD', label: 'USD' },
                                                    { value: 'EUR', label: 'EUR' },
                                                    { value: 'GBP', label: 'GBP' },
                                                ]} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Notlar */}
                        <div>
                            <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                                <StickyNote className="w-4 h-4 text-violet-400" /> Notlar
                            </h3>
                            <textarea
                                value={formData.notlar}
                                onChange={(e) => updateField('notlar', e.target.value)}
                                rows={8}
                                className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-lg px-4 py-3 text-[var(--color-foreground)] text-sm focus:border-primary focus:outline-none transition-colors resize-y placeholder:text-secondary/50"
                                placeholder="Bu cari hakkında notlarınızı buraya yazabilirsiniz... (Örn: ödeme alışkanlıkları, özel anlaşmalar, iletişim notları)"
                            />
                        </div>
                    </div>
                )}

                {/* TAB 4: KİMLİK BİLGİLERİ */}
                {activeTab === 3 && (
                    <div className="space-y-6">
                        {/* TC Kimlik ve Kişisel */}
                        <div>
                            <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                                <ShieldCheck className="w-4 h-4 text-primary" /> Kişisel Bilgiler
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3">
                                <FormInput label="TC Kimlik No" value={formData.tcKimlikNo} onChange={(v) => updateField('tcKimlikNo', v)} placeholder="11111111111" />
                                <FormInput label="Doğum Tarihi" value={formData.dogumTarihi} onChange={(v) => updateField('dogumTarihi', v)} type="date" />
                                <FormInput label="Doğum Yeri" value={formData.dogumYeri} onChange={(v) => updateField('dogumYeri', v)} />
                                <FormInput label="Uyruk" value={formData.uyruk} onChange={(v) => updateField('uyruk', v)} />
                                <FormInput label="Baba Adı" value={formData.babaAdi} onChange={(v) => updateField('babaAdi', v)} />
                                <FormInput label="Anne Adı" value={formData.anneAdi} onChange={(v) => updateField('anneAdi', v)} />
                                <FormSelect label="Cinsiyet" value={formData.cinsiyet} onChange={(v) => updateField('cinsiyet', v)} options={[
                                    { value: '', label: 'Seçiniz...' },
                                    { value: 'Erkek', label: 'Erkek' },
                                    { value: 'Kadın', label: 'Kadın' },
                                ]} />
                                <FormSelect label="Medeni Hal" value={formData.medeniHal} onChange={(v) => updateField('medeniHal', v)} options={[
                                    { value: '', label: 'Seçiniz...' },
                                    { value: 'Bekar', label: 'Bekar' },
                                    { value: 'Evli', label: 'Evli' },
                                    { value: 'Boşanmış', label: 'Boşanmış' },
                                ]} />
                            </div>
                        </div>

                        {/* Resmi Belge Bilgileri */}
                        <div>
                            <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                                <FileText className="w-4 h-4 text-cyan-400" /> Resmi Belge Bilgileri
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                                <FormInput label="Ehliyet No" value={formData.ehliyetNo} onChange={(v) => updateField('ehliyetNo', v)} />
                                <FormInput label="Pasaport No" value={formData.pasaportNo} onChange={(v) => updateField('pasaportNo', v)} />
                            </div>
                        </div>

                        {/* Ticari Bilgiler */}
                        <div>
                            <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                                <Building2 className="w-4 h-4 text-orange-400" /> Ticari Bilgiler
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                                <FormInput label="Ticaret Sicil No" value={formData.ticaretSicilNo} onChange={(v) => updateField('ticaretSicilNo', v)} />
                                <FormInput label="MERSİS No" value={formData.mersisNo} onChange={(v) => updateField('mersisNo', v)} />
                                <FormInput label="KEP Adresi" value={formData.kepAdresi} onChange={(v) => updateField('kepAdresi', v)} placeholder="firma@kep.tr" />
                            </div>
                        </div>
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

            {/* FİHRİST MODAL */}
            {showFihrist && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowFihrist(false)}>
                    <div className="bg-[#0d1b2e] border border-white/10 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h2 className="text-white font-bold text-lg flex items-center gap-2"><List className="w-5 h-5 text-primary" /> Cari Fihrist</h2>
                            <button onClick={() => setShowFihrist(false)} className="p-1.5 hover:bg-white/10 rounded transition-colors text-secondary hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="overflow-auto flex-1">
                            {fihristLoading ? (
                                <div className="flex items-center justify-center h-32 text-secondary">Yukleniyor...</div>
                            ) : cariList.length === 0 ? (
                                <div className="flex items-center justify-center h-32 text-secondary">Kayit bulunamadi</div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-[#0a1628]">
                                        <tr>
                                            <th className="text-left px-4 py-2 text-secondary font-medium">Cari Kodu</th>
                                            <th className="text-left px-4 py-2 text-secondary font-medium">Unvani</th>
                                            <th className="text-left px-4 py-2 text-secondary font-medium">Tipi</th>
                                            <th className="text-left px-4 py-2 text-secondary font-medium">Durum</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cariList.map((c: any, i: number) => (
                                            <tr key={i} className="border-t border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                                                onClick={() => { setFormData((prev: any) => ({ ...prev, cariKodu: c.cari_kodu })); setShowFihrist(false); }}>
                                                <td className="px-4 py-2 text-primary font-mono font-bold">{c.cari_kodu}</td>
                                                <td className="px-4 py-2 text-white">{c.unvani}</td>
                                                <td className="px-4 py-2 text-secondary">{c.cari_tipi}</td>
                                                <td className="px-4 py-2">
                                                    <span className={c.durum === 'Aktif' ? 'px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400' : 'px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400'}>{c.durum}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="px-4 py-3 border-t border-white/10 text-secondary text-xs">
                            Toplam: <span className="text-white font-bold">{cariList.length}</span> kayit
                        </div>
                    </div>
                </div>
            )}

            {/* CARİ ARA (HAREKET İÇİN) MODAL */}
            {showHareketSearch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowHareketSearch(false)}>
                    <div className="bg-[#0d1b2e] border border-white/10 rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h2 className="text-white font-bold text-lg flex items-center gap-2"><Search className="w-5 h-5 text-primary" /> Cari Ara - Hareket Görüntüle</h2>
                            <button onClick={() => setShowHareketSearch(false)} className="p-1.5 hover:bg-white/10 rounded transition-colors text-secondary hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-4 border-b border-white/10">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                                <input
                                    type="text"
                                    value={hareketSearchQuery}
                                    onChange={(e) => handleHareketSearch(e.target.value)}
                                    placeholder="Cari adı veya kodu yazın..."
                                    className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-lg pl-10 pr-4 py-2.5 text-[var(--color-foreground)] text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                                    autoFocus
                                />
                            </div>
                            <p className="text-secondary text-xs mt-2">Hareketlerini görmek istediğiniz carinin adını veya kodunu yazın</p>
                        </div>
                        <div className="overflow-auto flex-1">
                            {hareketSearchLoading ? (
                                <div className="flex items-center justify-center h-24 text-secondary">
                                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                                    Aranıyor...
                                </div>
                            ) : hareketSearchQuery.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-32 text-secondary">
                                    <Users className="w-8 h-8 mb-2 opacity-40" />
                                    <span>Aramak için yazmaya başlayın</span>
                                </div>
                            ) : hareketSearchResults.length === 0 ? (
                                <div className="flex items-center justify-center h-24 text-secondary">Sonuç bulunamadı</div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {hareketSearchResults.map((c: any) => (
                                        <button
                                            key={c.id}
                                            onClick={() => handleSelectHareketCari(c)}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                                        >
                                            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                                                <Users className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white text-sm font-medium truncate">{c.unvani}</div>
                                                <div className="text-secondary text-xs">{c.cari_kodu} {c.cari_tipi ? `• ${c.cari_tipi}` : ''}</div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-secondary flex-shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="px-4 py-3 border-t border-white/10 text-secondary text-xs">
                            {hareketSearchResults.length > 0 ? `${hareketSearchResults.length} sonuç bulundu` : 'Cari adı veya kodunu girin'}
                        </div>
                    </div>
                </div>
            )}

            {/* HAREKET MODAL */}
            {showHareket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowHareket(false)}>
                    <div className="bg-[#0d1b2e] border border-white/10 rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <div>
                                <h2 className="text-white font-bold text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-blue-400" /> Cari Hareketler</h2>
                                {selectedHareketCariName && <p className="text-primary text-sm mt-0.5">{selectedHareketCariName}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => { setShowHareket(false); setShowHareketSearch(true); }} className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white rounded transition-colors flex items-center gap-1">
                                    <Search className="w-3.5 h-3.5" /> Başka Cari Ara
                                </button>
                                <button onClick={() => setShowHareket(false)} className="p-1.5 hover:bg-white/10 rounded transition-colors text-secondary hover:text-white"><X className="w-5 h-5" /></button>
                            </div>
                        </div>
                        <div className="overflow-auto flex-1">
                            {fihristLoading ? (
                                <div className="flex items-center justify-center h-32 text-secondary">
                                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                                    Yükleniyor...
                                </div>
                            ) : hareketList.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-32 text-secondary">
                                    <FileText className="w-8 h-8 mb-2 opacity-40" />
                                    <span>Bu cariye ait hareket bulunamadı</span>
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-[#0a1628]">
                                        <tr>
                                            <th className="text-left px-4 py-2 text-secondary font-medium">Tarih</th>
                                            <th className="text-left px-4 py-2 text-secondary font-medium">Açıklama</th>
                                            <th className="text-right px-4 py-2 text-secondary font-medium">Borç</th>
                                            <th className="text-right px-4 py-2 text-secondary font-medium">Alacak</th>
                                            <th className="text-right px-4 py-2 text-secondary font-medium">Bakiye</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {hareketList.map((h: any, i: number) => (
                                            <tr key={i} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-2 text-secondary font-mono text-xs">{h.tarih ? new Date(h.tarih).toLocaleDateString('tr-TR') : '-'}</td>
                                                <td className="px-4 py-2 text-white">{h.aciklama || '-'}</td>
                                                <td className="px-4 py-2 text-right text-red-400 font-mono">{h.borc ? Number(h.borc).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '-'}</td>
                                                <td className="px-4 py-2 text-right text-emerald-400 font-mono">{h.alacak ? Number(h.alacak).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '-'}</td>
                                                <td className="px-4 py-2 text-right text-white font-mono font-bold">{h.bakiye !== undefined ? Number(h.bakiye).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="px-4 py-3 border-t border-white/10 text-secondary text-xs">
                            Son <span className="text-white font-bold">{hareketList.length}</span> hareket gösteriliyor
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

