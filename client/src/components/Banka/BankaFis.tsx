"use client";

import { useState, useEffect } from "react";
import {
    Save, X, Trash2, Plus,
    FileText, Landmark, Wallet, Users,
    CreditCard, Info, List, Settings,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

interface BankaFisProps {
    type: "Para Çekme" | "Para Yatırma" | "Gelen Havale" | "Yapılan Havale" | "Virman" | "Devir";
    showToast?: (message: string, type: "success" | "error" | "info" | "warning") => void;
}

export default function BankaFis({ type, showToast }: BankaFisProps) {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"items" | "other">("items");

    // Data for selects
    const [banks, setBanks] = useState<any[]>([]);
    const [kasalar, setKasalar] = useState<any[]>([]);
    const [cariler, setCariler] = useState<any[]>([]);

    const [header, setHeader] = useState({
        fisNo: "",
        fisTarihi: new Date().toISOString().split("T")[0],
        fisSaati: new Date().toLocaleTimeString('tr-TR', { hour12: false }).slice(0, 5),
        belgeNo: "",
        belgeTarihi: new Date().toISOString().split("T")[0],
        belgeTipi: "",
        paraBirimi: "TRY",
        aciklama: "",
        muhAciklama: "",
        isyeriKodu: "Merkez"
    });

    const [rows, setRows] = useState<any[]>([
        {
            id: Date.now(),
            banka_id: "",
            karsi_hesap_tipi: type === "Para Çekme" || type === "Para Yatırma" ? "Kasa" : (type === "Virman" ? "Banka" : "Cari"),
            karsi_hesap_id: "",
            unvan: "",
            aciklama: "",
            belge_no: "",
            borc: 0,
            alacak: 0,
            hizmet_kodu: "",
            masraf_kodu: "",
            personel_kodu: ""
        }
    ]);

    // Otomatik Fiş No üret (BF-001, BF-002, ...)
    const generateNextFisNo = async (): Promise<string> => {
        if (!currentTenant) return 'BF-001';
        const { data } = await supabase
            .from('banka_fisleri')
            .select('fis_no')
            .eq('tenant_id', currentTenant.id)
            .like('fis_no', 'BF-%')
            .order('fis_no', { ascending: false })
            .limit(1);
        if (data && data.length > 0) {
            const num = parseInt(data[0].fis_no.replace(/^BF-/, ''), 10);
            if (!isNaN(num)) return 'BF-' + String(num + 1).padStart(3, '0');
        }
        return 'BF-001';
    };

    useEffect(() => {
        loadData();
        generateNextFisNo().then(no => {
            setHeader(prev => ({ ...prev, fisNo: no }));
        });
    }, [currentTenant]);

    const loadData = async () => {
        if (!currentTenant) return;

        // Fetch Banks
        const { data: bankData } = await supabase
            .from('bankalar')
            .select('id, banka_kodu, tanimi, banka_adi')
            .eq('tenant_id', currentTenant.id);
        if (bankData) setBanks(bankData);

        // Fetch Kasalar
        const { data: kasaData } = await supabase
            .from('kasa_tanimlari')
            .select('id, kasa_kodu, kasa_adi')
            .eq('tenant_id', currentTenant.id);
        if (kasaData) setKasalar(kasaData);

        // Fetch Cariler
        const { data: cariData } = await supabase
            .from('cari_hesaplar')
            .select('id, cari_kodu, unvani')
            .eq('tenant_id', currentTenant.id);
        if (cariData) setCariler(cariData);
    };

    const addRow = () => {
        setRows([...rows, {
            id: Date.now(),
            banka_id: "",
            karsi_hesap_tipi: rows[rows.length - 1]?.karsi_hesap_tipi || "Cari",
            karsi_hesap_id: "",
            unvan: "",
            aciklama: "",
            belge_no: "",
            borc: 0,
            alacak: 0,
            hizmet_kodu: "",
            masraf_kodu: "",
            personel_kodu: ""
        }]);
    };

    const removeRow = (id: number) => {
        if (rows.length > 1) {
            setRows(rows.filter(r => r.id !== id));
        }
    };

    const updateRow = (id: number, field: string, value: any) => {
        setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const totalBorc = rows.reduce((sum, r) => sum + (parseFloat(r.borc) || 0), 0);
    const totalAlacak = rows.reduce((sum, r) => sum + (parseFloat(r.alacak) || 0), 0);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0);

    const handleSave = async () => {
        if (!currentTenant) return;
        if (!header.fisNo) {
            showToast?.("Fiş No zorunludur", "warning");
            return;
        }

        setLoading(true);
        try {
            // 1. Save Header
            const { data: fisRes, error: fisErr } = await supabase
                .from('banka_fisleri')
                .insert([{
                    tenant_id: currentTenant.id,
                    fis_no: header.fisNo,
                    fis_tarihi: header.fisTarihi,
                    fis_tipi: type,
                    belge_no: header.belgeNo,
                    belge_tarihi: header.belgeTarihi,
                    para_birimi: header.paraBirimi,
                    toplam_borc: totalBorc,
                    toplam_alacak: totalAlacak,
                    aciklama: header.aciklama,
                    muh_aciklama: header.muhAciklama
                }])
                .select()
                .single();

            if (fisErr) throw fisErr;

            // 2. Save Lines
            const rowData = rows.map(r => ({
                tenant_id: currentTenant.id,
                fis_id: fisRes.id,
                banka_id: r.banka_id || null,
                karsi_hesap_tipi: r.karsi_hesap_tipi,
                karsi_hesap_id: r.karsi_hesap_id || null,
                karsi_hesap_unvan: r.unvan,
                aciklama: r.aciklama,
                belge_no: r.belge_no,
                borc: r.borc,
                alacak: r.alacak,
                para_birimi: header.paraBirimi,
                hizmet_kodu: r.hizmet_kodu,
                masraf_kodu: r.masraf_kodu,
                personel_kodu: r.personel_kodu
            }));

            const { error: rowErr } = await supabase.from('banka_fis_satirlari').insert(rowData);
            if (rowErr) throw rowErr;

            showToast?.("Banka fişi başarıyla kaydedildi", "success");
            handleClear();
        } catch (err: any) {
            showToast?.(err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleClear = async () => {
        const yeniNo = await generateNextFisNo();
        setHeader({
            fisNo: yeniNo,
            fisTarihi: new Date().toISOString().split("T")[0],
            fisSaati: new Date().toLocaleTimeString('tr-TR', { hour12: false }).slice(0, 5),
            belgeNo: "",
            belgeTarihi: new Date().toISOString().split("T")[0],
            belgeTipi: "",
            paraBirimi: "TRY",
            aciklama: "",
            muhAciklama: "",
            isyeriKodu: "Merkez"
        });
        setRows([{ id: Date.now(), banka_id: "", karsi_hesap_tipi: (type === "Para Çekme" || type === "Para Yatırma" ? "Kasa" : (type === "Virman" ? "Banka" : "Cari")), karsi_hesap_id: "", unvan: "", aciklama: "", belge_no: "", borc: 0, alacak: 0, hizmet_kodu: "", masraf_kodu: "", personel_kodu: "" }]);
    };

    return (
        <div className="space-y-4 max-w-[1600px] mx-auto p-4">
            {/* Header / Actions */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/5">
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-secondary/40 uppercase tracking-widest">{type}</span>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-secondary">Borç: <span className="font-bold text-emerald-500 font-mono">{formatCurrency(totalBorc)}</span></span>
                        <span className="text-xs text-secondary">Alacak: <span className="font-bold text-rose-500 font-mono">{formatCurrency(totalAlacak)}</span></span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleClear}
                        className="bg-white/5 hover:bg-white/10 text-white/70 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border border-white/10"
                    >
                        <X className="w-4 h-4" /> VAZGEÇ
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                        FİŞİ KAYDET
                    </button>
                </div>
            </div>

            {/* Fiş Bilgileri */}
            <div className="glass-card p-5 space-y-5 bg-white/[0.01] relative z-50">
                <h2 className="text-[10px] font-bold text-primary uppercase tracking-[0.25em] flex items-center gap-2 border-b border-white/5 pb-3">
                    <Landmark className="w-4 h-4" />
                    Fiş Bilgileri
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Fiş Numarası</label>
                        <input
                            type="text"
                            value={header.fisNo}
                            onChange={e => setHeader({ ...header, fisNo: e.target.value })}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                            placeholder="Fiş no..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Fiş Tarihi</label>
                        <input
                            type="date"
                            value={header.fisTarihi}
                            onChange={e => setHeader({ ...header, fisTarihi: e.target.value })}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Belge No / Tipi</label>
                        <div className="flex gap-2">
                            <select
                                value={header.belgeTipi}
                                onChange={e => setHeader({ ...header, belgeTipi: e.target.value })}
                                className="w-20 bg-background border border-border rounded-lg px-1 py-2 text-xs text-foreground outline-none focus:border-primary text-center"
                            >
                                <option value="">Tip</option>
                                <option value="Dekont">Dknt</option>
                                <option value="Havale">Hvle</option>
                                <option value="EFT">EFT</option>
                            </select>
                            <input
                                type="text"
                                value={header.belgeNo}
                                onChange={e => setHeader({ ...header, belgeNo: e.target.value })}
                                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                                placeholder="No..."
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Belge Tarihi</label>
                        <input
                            type="date"
                            value={header.belgeTarihi}
                            onChange={e => setHeader({ ...header, belgeTarihi: e.target.value })}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Para Birimi</label>
                        <select
                            value={header.paraBirimi}
                            onChange={e => setHeader({ ...header, paraBirimi: e.target.value })}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                        >
                            <option value="TRY">TRY - Türk Lirası</option>
                            <option value="USD">USD - Dolar</option>
                            <option value="EUR">EUR - Euro</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2">
                <TabButton active={activeTab === "items"} onClick={() => setActiveTab("items")} icon={List} label="İşlem Satırları" />
                <TabButton active={activeTab === "other"} onClick={() => setActiveTab("other")} icon={Settings} label="Ek Bilgiler" />
            </div>

            <AnimatePresence mode="wait">
                {activeTab === "items" ? (
                    <motion.div
                        key="items"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="glass-card p-5 space-y-5 bg-white/[0.01]"
                    >
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                            <h2 className="text-[10px] font-bold text-primary uppercase tracking-[0.25em] flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                İşlem Satırları
                            </h2>
                            <button
                                onClick={addRow}
                                className="text-primary hover:text-primary/80 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Yeni Satır Ekle
                            </button>
                        </div>

                        <div className="overflow-x-auto pb-12">
                            <table className="w-full text-xs">
                                <thead className="text-secondary/60 font-semibold uppercase tracking-wider text-[9px] border-b border-white/5">
                                    <tr>
                                        <th className="px-2 py-3 text-center w-10">#</th>
                                        <th className="px-3 py-3 text-left w-56">Banka Hesabı</th>
                                        <th className="px-3 py-3 text-center w-28">Hedef Türü</th>
                                        <th className="px-3 py-3 text-left w-56">Karşı Hesap</th>
                                        <th className="px-3 py-3 text-left">Açıklama</th>
                                        <th className="px-3 py-3 text-right w-32">Borç</th>
                                        <th className="px-3 py-3 text-right w-32">Alacak</th>
                                        <th className="px-2 py-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {rows.map((row, index) => (
                                        <tr key={row.id} className="hover:bg-white/[0.02] group">
                                            <td className="p-2 text-center text-secondary/40 font-mono">{index + 1}</td>
                                            <td className="p-2">
                                                <select
                                                    value={row.banka_id}
                                                    onChange={e => updateRow(row.id, "banka_id", e.target.value)}
                                                    className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-foreground text-xs outline-none focus:border-primary"
                                                >
                                                    <option value="">Hesap seçin...</option>
                                                    {banks.map(b => (
                                                        <option key={b.id} value={b.id}>{b.tanimi}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="p-2">
                                                <select
                                                    value={row.karsi_hesap_tipi}
                                                    onChange={e => updateRow(row.id, "karsi_hesap_tipi", e.target.value)}
                                                    className="w-full bg-background border border-border rounded-lg px-1 py-1.5 text-foreground text-xs outline-none focus:border-primary text-center"
                                                >
                                                    <option value="Cari">Cari</option>
                                                    <option value="Kasa">Kasa</option>
                                                    <option value="Banka">Banka</option>
                                                    <option value="Masraf">Masraf</option>
                                                </select>
                                            </td>
                                            <td className="p-2">
                                                <AccountSelector
                                                    type={row.karsi_hesap_tipi}
                                                    value={row.karsi_hesap_id}
                                                    onChange={(val: string, unvan: string) => {
                                                        updateRow(row.id, "karsi_hesap_id", val);
                                                        updateRow(row.id, "unvan", unvan);
                                                    }}
                                                    data={{ cariler, kasalar, banks }}
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={row.aciklama}
                                                    onChange={e => updateRow(row.id, "aciklama", e.target.value)}
                                                    className="w-full bg-transparent border-none text-foreground outline-none px-1"
                                                    placeholder="İşlem detayı..."
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    value={row.borc}
                                                    onChange={e => updateRow(row.id, "borc", e.target.value)}
                                                    className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2 py-1.5 text-emerald-500 font-bold text-right outline-none focus:border-emerald-500"
                                                    placeholder="0,00"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    value={row.alacak}
                                                    onChange={e => updateRow(row.id, "alacak", e.target.value)}
                                                    className="w-full bg-rose-500/10 border border-rose-500/20 rounded-lg px-2 py-1.5 text-rose-500 font-bold text-right outline-none focus:border-rose-500"
                                                    placeholder="0,00"
                                                />
                                            </td>
                                            <td className="p-2 text-center">
                                                {rows.length > 1 && (
                                                    <button
                                                        onClick={() => removeRow(row.id)}
                                                        className="text-rose-500/50 hover:text-rose-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="other"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="glass-card p-5 grid grid-cols-1 md:grid-cols-2 gap-5 bg-white/[0.01]"
                    >
                        <div className="space-y-2">
                            <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest flex items-center gap-2">
                                <Info className="w-3.5 h-3.5" /> Muhasebe Özel Açıklaması
                            </label>
                            <textarea
                                value={header.muhAciklama}
                                onChange={e => setHeader({ ...header, muhAciklama: e.target.value })}
                                rows={4}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary resize-none"
                                placeholder="Muhasebe kayıtları için özel entegrasyon notları..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5" /> Fiş Genel Açıklaması
                            </label>
                            <textarea
                                value={header.aciklama}
                                onChange={e => setHeader({ ...header, aciklama: e.target.value })}
                                rows={4}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary resize-none"
                                placeholder="İşlem ile ilgili detaylı bilgi ve notlar..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest">İşyeri / Şube Kodu</label>
                            <input
                                type="text"
                                value={header.isyeriKodu}
                                onChange={e => setHeader({ ...header, isyeriKodu: e.target.value })}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Firma Tanım No</label>
                            <input
                                type="text"
                                value="01 (JETPOS)"
                                disabled
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-secondary/50 outline-none opacity-50"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toplamlar */}
            <div className="glass-card p-4 space-y-3">
                <h3 className="text-xs font-bold text-secondary uppercase flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Fiş Toplamları
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-500/10 rounded-xl border border-emerald-500/20 p-4">
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Borç Toplamı</p>
                        <p className="text-xl font-bold text-emerald-500 font-mono">{formatCurrency(totalBorc)}</p>
                    </div>
                    <div className="bg-rose-500/10 rounded-xl border border-rose-500/20 p-4">
                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">Alacak Toplamı</p>
                        <p className="text-xl font-bold text-rose-500 font-mono">{formatCurrency(totalAlacak)}</p>
                    </div>
                </div>
                {totalBorc !== totalAlacak && (
                    <p className="text-[11px] text-amber-500 font-medium">
                        ⚠ Borç ve alacak toplamları eşit değil — fark: {formatCurrency(Math.abs(totalBorc - totalAlacak))}
                    </p>
                )}
            </div>
        </div>
    );
}

// Helper Components
function TabButton({ active, onClick, icon: Icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all font-bold text-[10px] uppercase tracking-widest border ${active
                ? 'bg-primary text-white border-primary'
                : 'bg-transparent text-secondary hover:text-foreground border-border hover:bg-primary/5'
                }`}
        >
            <Icon className="w-3.5 h-3.5" />
            {label}
        </button>
    );
}

function AccountSelector({ type, value, onChange, data }: any) {
    const list = type === "Cari" ? data.cariler : (type === "Kasa" ? data.kasalar : data.banks);
    const labelField = type === "Cari" ? "unvani" : (type === "Kasa" ? "kasa_adi" : "tanimi");

    return (
        <div className="relative">
            <select
                value={value}
                onChange={e => {
                    const item = list.find((i: any) => i.id === e.target.value);
                    onChange(e.target.value, item ? item[labelField] : "");
                }}
                className="w-full bg-background border border-border rounded-lg pl-7 pr-2 py-1.5 text-foreground text-xs outline-none focus:border-primary"
            >
                <option value="">{type} seçin...</option>
                {list.map((item: any) => (
                    <option key={item.id} value={item.id}>
                        {item[labelField]} {item.cari_kodu || item.kasa_kodu || item.banka_kodu ? `[${item.cari_kodu || item.kasa_kodu || item.banka_kodu}]` : ""}
                    </option>
                ))}
            </select>
            <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-secondary/40">
                {type === "Cari" ? <Users className="w-3.5 h-3.5" /> : (type === "Kasa" ? <Wallet className="w-3.5 h-3.5" /> : <Landmark className="w-3.5 h-3.5" />)}
            </div>
        </div>
    );
}
