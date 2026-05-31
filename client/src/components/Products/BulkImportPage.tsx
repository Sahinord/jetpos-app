"use client";

import { useState, useRef, useMemo } from "react";
import {
    ArrowLeft, Upload, Download, FileSpreadsheet, CheckCircle2,
    AlertCircle, ChevronDown, ArrowRight, Loader2, Table2,
    FileText, Sparkles, X, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// System fields the user can map to
const SYSTEM_FIELDS = [
    { key: "", label: "— Yoksay —" },
    { key: "name", label: "Ürün Adı (*)", required: true },
    { key: "barcode", label: "Barkod" },
    { key: "purchase_price", label: "Alış Fiyatı" },
    { key: "sale_price", label: "Satış Fiyatı" },
    { key: "external_price", label: "Trendyol Fiyatı" },
    { key: "stock_quantity", label: "Stok Miktarı" },
    { key: "unit", label: "Birim" },
    { key: "vat_rate", label: "KDV Oranı (%)" },
    { key: "category", label: "Kategori" },
    { key: "status", label: "Durum (active/passive)" },
];

// Auto-match patterns
const AUTO_MATCH: Record<string, string[]> = {
    name: ["ürün adı", "adi", "adi_1", "ürün", "name", "product", "açıklama", "cisim_adi"],
    barcode: ["barkod", "stok_kodu", "stok kodu", "barkod no", "barcode", "sku"],
    purchase_price: ["alış fiyatı", "alis_fiyati", "maliyet", "cost", "alış"],
    sale_price: ["satış fiyatı", "fiyati", "fiyat", "price", "etiket", "piyasa_satış_fiyatı", "piyasa satış fiyatı"],
    external_price: ["trendyol", "online fiyat", "pazar yeri", "external"],
    stock_quantity: ["stok", "stok adedi", "stok miktarı", "miktar", "adet", "mevcut", "quantity", "qty", "bakiye"],
    unit: ["birim", "unit"],
    vat_rate: ["kdv", "kdv oranı", "vat", "tax"],
    category: ["kategori", "category"],
};

interface BulkImportPageProps {
    onBack: () => void;
    onImport: (data: any[]) => void;
}

export default function BulkImportPage({ onBack, onImport }: BulkImportPageProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [fileName, setFileName] = useState("");
    const [rawData, setRawData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ total: number; success: boolean } | null>(null);
    const [updateKey, setUpdateKey] = useState("barcode");
    const [createNew, setCreateNew] = useState(true);
    const [updateExisting, setUpdateExisting] = useState(true);
    const fileRef = useRef<HTMLInputElement>(null);

    // ─── Step 1: File Upload ───
    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = ev.target?.result as string;
                const workbook = XLSX.read(data, { type: "binary", cellDates: true });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
                if (json.length === 0) return;

                const cols = Object.keys(json[0] as any);
                setHeaders(cols);
                setRawData(json);

                // Auto-map columns
                const autoMap: Record<string, string> = {};
                cols.forEach(col => {
                    const norm = col.toLowerCase().replace(/[^a-zçğıöşü0-9]/g, "");
                    for (const [sysField, patterns] of Object.entries(AUTO_MATCH)) {
                        if (autoMap[col]) break;
                        for (const p of patterns) {
                            const cleanPattern = p.replace(/[^a-zçğıöşü0-9]/g, "");
                            if (norm.includes(cleanPattern)) {
                                // Safeguard: do not map code/id/barcode columns to numeric fields (e.g. Stok Kodu to stock_quantity)
                                const isNumericField = ["stock_quantity", "purchase_price", "sale_price", "external_price", "vat_rate"].includes(sysField);
                                const isIdentifierColumn = ["kod", "no", "id", "barkod", "barcode"].some(word => norm.includes(word));
                                if (isNumericField && isIdentifierColumn) {
                                    continue;
                                }

                                // Don't double-assign
                                if (!Object.values(autoMap).includes(sysField)) {
                                    autoMap[col] = sysField;
                                }
                                break;
                            }
                        }
                    }
                    if (!autoMap[col]) autoMap[col] = "";
                });
                setMapping(autoMap);
                setStep(2);
            } catch (err: any) {
                alert("Dosya okunamadı: " + err.message);
            }
        };
        reader.readAsBinaryString(file);
    };

    // ─── Template Downloads ───
    const downloadTemplate = (type: "basic" | "category") => {
        const rows = type === "basic"
            ? [{ "Barkod": "8699634017303", "Ürün Adı": "PİRİNÇ", "Alış Fiyatı": 12.50, "Satış Fiyatı": 29.17, "Stok Miktarı": 100, "Birim": "Adet" }]
            : [{ "Barkod": "8699634017303", "Ürün Adı": "PİRİNÇ", "Kategori": "Gıda", "Alış Fiyatı": 12.50, "Satış Fiyatı": 29.17, "Trendyol Fiyatı": 35.00, "Stok Miktarı": 100, "Birim": "Adet", "KDV Oranı": 20 }];

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Şablon");
        const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        saveAs(new Blob([buf]), `jetpos_${type === "basic" ? "basit" : "kategorili"}_sablon.xlsx`);
    };

    // ─── Step 3: Execute Import ───
    const handleStartImport = () => {
        // Build mapped data
        const mapped = rawData.map(row => {
            const obj: any = {};
            for (const [col, sysField] of Object.entries(mapping)) {
                if (sysField) obj[sysField] = row[col];
            }
            return obj;
        });

        // Transform to the format onImport expects (matching handleBulkImport's findValue pattern)
        const transformed = mapped.map(item => {
            const result: any = {};
            // Map back to Turkish column names that handleBulkImport understands
            if (item.name) result["Ürün Adı"] = item.name;
            if (item.barcode) result["Barkod"] = item.barcode;
            if (item.purchase_price) result["Alış Fiyatı"] = item.purchase_price;
            if (item.sale_price) result["Satış Fiyatı"] = item.sale_price;
            if (item.external_price) result["Trendyol Satış Fiyatı"] = item.external_price;
            if (item.stock_quantity) result["Stok Miktarı"] = item.stock_quantity;
            if (item.unit) result["Birim"] = item.unit;
            if (item.vat_rate) result["KDV"] = item.vat_rate;
            if (item.category) result["Kategori"] = item.category;
            if (item.status) result["status"] = item.status;
            return result;
        });

        setImporting(true);
        setStep(3);

        // Call the parent import handler
        onImport(transformed);

        // Show result after a delay (the parent handles the actual import)
        setTimeout(() => {
            setImporting(false);
            setImportResult({ total: transformed.length, success: true });
        }, 2000);
    };

    // Preview data (first 3 rows)
    const previewRows = useMemo(() => rawData.slice(0, 3), [rawData]);

    // Count mapped fields
    const mappedCount = Object.values(mapping).filter(v => v).length;
    const hasRequiredField = Object.values(mapping).includes("name") || Object.values(mapping).includes("barcode");

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pb-12">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-10 h-10 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95">
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-white">Toplu Ürün İçe Aktarımı</h1>
                        <p className="text-[11px] text-slate-500">Excel veya CSV dosyasından ürünlerinizi toplu olarak aktarın</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => downloadTemplate("basic")}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] text-slate-300 border border-white/[0.06] rounded-xl text-[11px] font-bold transition-all active:scale-95">
                        <Download size={13} /> Basit Şablon
                    </button>
                    <button onClick={() => downloadTemplate("category")}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] text-slate-300 border border-white/[0.06] rounded-xl text-[11px] font-bold transition-all active:scale-95">
                        <Download size={13} /> Kategorili Şablon
                    </button>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-2">
                {[
                    { n: 1, label: "Dosya Yükleme" },
                    { n: 2, label: "Sütun Eşleştirme" },
                    { n: 3, label: "İçe Aktarım" },
                ].map((s, i) => (
                    <div key={s.n} className="flex items-center gap-2 flex-1">
                        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1 transition-all
                            ${step >= s.n
                                ? 'bg-primary/10 border border-primary/15'
                                : 'bg-white/[0.02] border border-white/[0.04]'}`}>
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black
                                ${step > s.n ? 'bg-emerald-500 text-white' : step === s.n ? 'bg-primary text-white' : 'bg-white/[0.04] text-slate-500'}`}>
                                {step > s.n ? <CheckCircle2 size={14} /> : s.n}
                            </div>
                            <span className={`text-[11px] font-bold ${step >= s.n ? 'text-white' : 'text-slate-500'}`}>{s.label}</span>
                        </div>
                        {i < 2 && <ArrowRight size={14} className="text-slate-600 flex-shrink-0" />}
                    </div>
                ))}
            </div>

            {/* ─── STEP 1: File Upload ─── */}
            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-8">
                        <h2 className="text-sm font-bold text-white mb-1">Adım 1: Dosya Yükleme</h2>
                        <p className="text-[11px] text-slate-500 mb-6">İçe aktarmak istediğiniz ürün listesini içeren dosyayı seçin. Dosyanızın ilk satırı başlıkları içermelidir.</p>

                        <div
                            onClick={() => fileRef.current?.click()}
                            className="border-2 border-dashed border-white/[0.06] hover:border-primary/30 rounded-2xl p-12 text-center cursor-pointer transition-all group hover:bg-primary/[0.02]"
                        >
                            <Upload size={32} className="mx-auto text-slate-600 group-hover:text-primary transition-colors mb-4" />
                            <p className="text-sm font-bold text-slate-300 mb-1">Dosya Seç veya Sürükle</p>
                            <p className="text-[11px] text-slate-500">Excel (.xlsx, .xls) veya CSV dosyası</p>
                            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
                        </div>

                        {/* Info */}
                        <div className="mt-6 flex items-start gap-3 p-4 bg-blue-500/[0.04] border border-blue-500/10 rounded-xl">
                            <Info size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                            <div className="text-[11px] text-slate-400 space-y-1">
                                <p>• Dosyanızın ilk satırında sütun başlıkları olmalıdır (Barkod, Ürün Adı, Fiyat vs.)</p>
                                <p>• Sistem otomatik olarak sütunları tanımaya çalışacaktır</p>
                                <p>• Şablon indirerek doğru format hakkında bilgi alabilirsiniz</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ─── STEP 2: Column Mapping ─── */}
                {step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="space-y-4">

                        {/* File Success Badge */}
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/[0.06] border border-emerald-500/10 rounded-xl">
                            <CheckCircle2 size={14} className="text-emerald-400" />
                            <span className="text-[11px] font-bold text-emerald-400">{fileName} başarıyla yüklendi — {rawData.length} satır okundu</span>
                            <button onClick={() => { setStep(1); setRawData([]); setHeaders([]); setFileName(""); }}
                                className="ml-auto text-[10px] text-slate-500 hover:text-white transition-colors">Değiştir</button>
                        </div>

                        {/* Mapping Card */}
                        <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl overflow-hidden">
                            <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-bold text-white">Adım 2: Sütun Eşleştirme</h2>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Dosyanızdaki sütunları sistemdeki alanlarla eşleştirin</p>
                                </div>
                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">{mappedCount} alan eşleşti</span>
                            </div>

                            {/* Import Options */}
                            <div className="px-5 py-3 border-b border-white/[0.04] bg-white/[0.01]">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-500">Güncelleme Anahtarı:</span>
                                        <select value={updateKey} onChange={e => setUpdateKey(e.target.value)}
                                            className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-1.5 text-[11px] text-white font-bold outline-none cursor-pointer appearance-none">
                                            <option value="barcode" className="bg-[#0c1222]">Barkod</option>
                                            <option value="name" className="bg-[#0c1222]">Ürün Adı</option>
                                        </select>
                                    </div>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input type="checkbox" checked={createNew} onChange={e => setCreateNew(e.target.checked)}
                                            className="w-3.5 h-3.5 rounded accent-emerald-500" />
                                        <span className="text-[10px] font-bold text-emerald-400">Yeni Ürün Oluştur</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input type="checkbox" checked={updateExisting} onChange={e => setUpdateExisting(e.target.checked)}
                                            className="w-3.5 h-3.5 rounded accent-blue-500" />
                                        <span className="text-[10px] font-bold text-blue-400">Mevcutları Güncelle</span>
                                    </label>
                                </div>
                            </div>

                            {/* Mapping Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/[0.04]">
                                            <th className="px-5 py-3 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider w-[30%]">Dosya Sütunu</th>
                                            <th className="px-5 py-3 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider w-[35%]">Sistem Alanı</th>
                                            <th className="px-5 py-3 text-right text-[9px] font-bold text-slate-500 uppercase tracking-wider w-[35%]">Örnek Veri</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.03]">
                                        {headers.map(col => (
                                            <tr key={col} className="hover:bg-white/[0.01] transition-colors">
                                                <td className="px-5 py-3">
                                                    <span className="text-xs font-bold text-white">{col}</span>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <select
                                                        value={mapping[col] || ""}
                                                        onChange={e => setMapping(prev => ({ ...prev, [col]: e.target.value }))}
                                                        className={`w-full bg-white/[0.03] border rounded-lg px-3 py-2 text-[11px] font-bold outline-none cursor-pointer appearance-none transition-all
                                                            ${mapping[col] ? 'border-primary/20 text-white' : 'border-white/[0.06] text-slate-500'}`}
                                                    >
                                                        {SYSTEM_FIELDS.map(f => (
                                                            <option key={f.key} value={f.key} className="bg-[#0c1222]">
                                                                {f.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <span className="text-[11px] text-slate-400 font-mono">
                                                        {previewRows[0]?.[col] !== undefined ? String(previewRows[0][col]).slice(0, 30) : "—"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div className="flex items-center justify-between">
                            <button onClick={() => setStep(1)}
                                className="flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-bold text-slate-400 hover:text-white transition-all">
                                <ArrowLeft size={14} /> Geri
                            </button>
                            <button
                                onClick={handleStartImport}
                                disabled={!hasRequiredField}
                                className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Sparkles size={14} /> İçe Aktarımı Başlat ({rawData.length} ürün)
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ─── STEP 3: Import Result ─── */}
                {step === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-12 text-center">
                        {importing ? (
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 size={40} className="text-primary animate-spin" />
                                <div>
                                    <p className="text-sm font-bold text-white">İçe aktarım devam ediyor...</p>
                                    <p className="text-[11px] text-slate-500 mt-1">{rawData.length} ürün işleniyor, lütfen bekleyin</p>
                                </div>
                                <div className="w-48 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 3 }}
                                        className="h-full bg-primary rounded-full" />
                                </div>
                            </div>
                        ) : importResult ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                    <CheckCircle2 size={32} className="text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-white">İçe Aktarım Tamamlandı!</p>
                                    <p className="text-[11px] text-slate-500 mt-1">{importResult.total} ürün başarıyla aktarıldı</p>
                                </div>
                                <button onClick={onBack}
                                    className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold transition-all active:scale-95">
                                    <ArrowLeft size={14} /> Ürün Listesine Dön
                                </button>
                            </div>
                        ) : null}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
