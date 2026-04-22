"use client";

import { useState, useRef, useEffect } from 'react';
import { 
    FileText, 
    Image as ImageIcon, 
    Download, 
    RefreshCw, 
    FileUp,
    FileImage,
    AlertCircle,
    Check,
    ArrowRight,
    Split,
    Shield,
    FileType,
    Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// External libraries will be loaded dynamically via CDN
declare const pdfjsLib: any;
declare const mammoth: any;

type ConverterMode = 'image' | 'pdf' | 'word';
type ImageFormat = 'png' | 'jpeg' | 'webp';

export default function UniversalConverter() {
    const [mode, setMode] = useState<ConverterMode>('image');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [targetFormat, setTargetFormat] = useState<ImageFormat>('png');
    const [quality, setQuality] = useState(0.9);
    const [converting, setConverting] = useState(false);
    const [results, setResults] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Load external libs
        if (typeof window !== 'undefined') {
            if (!document.getElementById('pdfjs-script')) {
                const script = document.createElement('script');
                script.id = 'pdfjs-script';
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
                script.async = true;
                script.onload = () => {
                    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                };
                document.head.appendChild(script);
            }

            if (!document.getElementById('mammoth-script')) {
                const scriptMammoth = document.createElement('script');
                scriptMammoth.id = 'mammoth-script';
                scriptMammoth.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
                scriptMammoth.async = true;
                document.head.appendChild(scriptMammoth);
            }
        }
    }, []);

    const resetFiles = (newMode: ConverterMode) => {
        setMode(newMode);
        setFile(null);
        setPreview(null);
        setResults([]);
        setError(null);
        setProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setResults([]);
        setError(null);
        setProgress(0);

        if (mode === 'image') {
            const reader = new FileReader();
            reader.onload = () => setPreview(reader.result as string);
            reader.readAsDataURL(selectedFile);
        }
    };

    const convertImage = async () => {
        if (!preview || !file) return;
        setConverting(true);
        try {
            const img = new Image();
            img.src = preview;
            await new Promise((resolve) => (img.onload = resolve));
            
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d')!;
            
            if (targetFormat === 'jpeg') {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL(`image/${targetFormat}`, targetFormat === 'png' ? undefined : quality);
            setResults([dataUrl]);
        } catch (err: any) {
            setError('Görsel dönüştürme hatası: ' + err.message);
        } finally {
            setConverting(false);
        }
    };

    const convertPDF = async () => {
        if (!file || !pdfjsLib) return;
        setConverting(true);
        const images: string[] = [];
        try {
            const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement('canvas');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
                images.push(canvas.toDataURL('image/png'));
                setProgress(Math.round((i / pdf.numPages) * 100));
            }
            setResults(images);
        } catch (err: any) {
            setError('PDF hatası: ' + err.message);
        } finally {
            setConverting(false);
        }
    };

    const convertWord = async () => {
        if (!file || !mammoth) return;
        setConverting(true);
        try {
            const { value: html } = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();
            await doc.html(html, {
                callback: (d) => {
                    setResults([d.output('datauristring')]);
                    setConverting(false);
                },
                x: 10, y: 10, width: 190, windowWidth: 800
            });
        } catch (err: any) {
            setError('Word hatası: ' + err.message);
            setConverting(false);
        }
    };

    const startConversion = () => {
        if (mode === 'image') convertImage();
        else if (mode === 'pdf') convertPDF();
        else convertWord();
    };

    const downloadAll = () => {
        results.forEach((data, i) => {
            const link = document.createElement('a');
            const ext = mode === 'image' ? targetFormat : (mode === 'pdf' ? 'png' : 'pdf');
            link.download = `${file?.name.split('.')[0]}_${i + 1}.${ext}`;
            link.href = data;
            link.click();
        });
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Akıllı Dönüştürücü</h1>
                    <p className="text-slate-400 mt-2">Görsel ve belgelerinizi tek bir yerden yönetin</p>
                </div>

                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
                    {(['image', 'pdf', 'word'] as ConverterMode[]).map((m) => (
                        <button
                            key={m}
                            onClick={() => resetFiles(m)}
                            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${mode === m ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            {m === 'image' && <ImageIcon size={14} />}
                            {m === 'pdf' && <FileText size={14} />}
                            {m === 'word' && <FileType size={14} />}
                            {m === 'image' ? 'Görsel' : m === 'pdf' ? 'PDF' : 'Word'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Control Panel */}
                <div className="space-y-6">
                    <div 
                        className={`glass-card p-12 border-2 border-dashed transition-all text-center group cursor-pointer ${file ? 'border-primary/30 bg-primary/5' : 'border-white/10 hover:border-primary/30 hover:bg-primary/5'}`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            className="hidden" 
                            accept={mode === 'image' ? "image/*" : mode === 'pdf' ? ".pdf" : ".docx"}
                        />
                        
                        <div className="relative inline-block mb-8">
                            <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center transition-all ${file ? 'bg-primary text-white shadow-2xl rotate-3' : 'bg-white/5 text-slate-500 group-hover:scale-110'}`}>
                                {mode === 'image' ? <ImageIcon size={40} /> : <FileUp size={40} />}
                            </div>
                        </div>

                        {file ? (
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-white truncate max-w-xs mx-auto">{file.name}</h3>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] font-bold text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>
                                    <span className="px-2 py-0.5 bg-primary/20 rounded text-[10px] font-bold text-primary">{file.name.split('.').pop()?.toUpperCase()}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-white">Dosya Seçin</h3>
                                <p className="text-xs text-secondary leading-relaxed px-10">
                                    {mode === 'image' ? 'PNG, JPG, WEBP destekler.' : mode === 'pdf' ? 'PDF dosyalarını görsele çevirir.' : 'DOCX dosyalarını PDF yapar.'}
                                </p>
                            </div>
                        )}
                    </div>

                    <AnimatePresence>
                        {file && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 space-y-8">
                                {mode === 'image' && (
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Hedef Format</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {(['png', 'jpeg', 'webp'] as ImageFormat[]).map((f) => (
                                                    <button
                                                        key={f}
                                                        onClick={() => setTargetFormat(f)}
                                                        className={`py-3 rounded-xl border-2 transition-all font-black text-[10px] ${targetFormat === f ? 'border-primary bg-primary/10 text-white shadow-lg' : 'border-white/5 text-slate-500'}`}
                                                    >
                                                        {f === 'jpeg' ? 'JPG' : f.toUpperCase()}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        {targetFormat !== 'png' && (
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center text-[10px] font-black text-slate-500">
                                                    <span>KALİTE</span>
                                                    <span className="text-primary">%{Math.round(quality * 100)}</span>
                                                </div>
                                                <input type="range" min="0.1" max="1" step="0.05" value={quality} onChange={(e) => setQuality(parseFloat(e.target.value))} className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-primary" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                <button
                                    onClick={startConversion}
                                    disabled={converting}
                                    className="w-full py-5 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black shadow-xl shadow-primary/40 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                >
                                    {converting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><RefreshCw className="w-5 h-5" /> Dönüştür</>}
                                </button>

                                {converting && progress > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-black text-slate-500">
                                            <span>İşleniyor...</span>
                                            <span>%{progress}</span>
                                        </div>
                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Preview / Results */}
                <div className="space-y-6">
                    <div className="glass-card p-6 h-full flex flex-col min-h-[400px]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Layers className="w-4 h-4 text-primary" />
                                {results.length > 0 ? `${results.length} SONUÇ` : 'ÖNİZLEME'}
                            </h3>
                            {results.length > 0 && <Check className="text-emerald-500 w-4 h-4" />}
                        </div>

                        <div className="flex-1 bg-black/40 rounded-[2rem] border border-white/5 overflow-y-auto custom-scrollbar p-6 space-y-4">
                            {results.length > 0 ? (
                                results.map((data, i) => (
                                    <div key={i} className="group relative bg-white/5 rounded-2xl p-2 border border-white/5 overflow-hidden">
                                        {(mode === 'image' || mode === 'pdf') ? (
                                            <img src={data} alt="Result" className="w-full h-auto rounded-xl" />
                                        ) : (
                                            <div className="py-20 text-center space-y-3">
                                                <FileText className="w-12 h-12 text-primary mx-auto opacity-50" />
                                                <p className="text-[10px] font-black text-white uppercase tracking-widest">PDF HAZIR</p>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                            <button 
                                                onClick={() => {
                                                    const link = document.createElement('a');
                                                    link.download = `convert_${i + 1}.${mode === 'image' ? targetFormat : mode === 'pdf' ? 'png' : 'pdf'}`;
                                                    link.href = data;
                                                    link.click();
                                                }}
                                                className="p-3 bg-primary text-white rounded-xl shadow-2xl scale-75 group-hover:scale-100 transition-all"
                                            >
                                                <Download size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : preview && mode === 'image' ? (
                                <img src={preview} alt="Preview" className="w-full h-auto rounded-[1.5rem] opacity-50" />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-20">
                                    <Layers size={60} className="text-slate-500" />
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Henüz bir dosya işlenmedi</p>
                                </div>
                            )}
                        </div>

                        {results.length > 0 && (
                            <button onClick={downloadAll} className="mt-6 w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2">
                                <Download size={16} /> TÜMÜNÜ İNDİR
                            </button>
                        )}

                        {error && (
                            <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-500 text-xs font-bold">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
