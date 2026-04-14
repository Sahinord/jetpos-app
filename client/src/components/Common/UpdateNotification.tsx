"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Rocket, Sparkles, X, Loader2 } from "lucide-react";

export default function UpdateNotification() {
    const [updateStatus, setUpdateStatus] = useState<'none' | 'available' | 'downloading' | 'ready'>('none');
    const [progress, setProgress] = useState(0);
    const [versionInfo, setVersionInfo] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).require) {
            const { ipcRenderer } = (window as any).require('electron');

            ipcRenderer.on('update-available', (_: any, info: any) => {
                setUpdateStatus('available');
                setVersionInfo(info);
            });

            ipcRenderer.on('update-download-progress', (_: any, progressObj: any) => {
                setUpdateStatus('downloading');
                setProgress(Math.round(progressObj.percent));
            });

            ipcRenderer.on('update-ready', (_: any, info: any) => {
                setUpdateStatus('ready');
                setVersionInfo(info);
            });

            return () => {
                ipcRenderer.removeAllListeners('update-available');
                ipcRenderer.removeAllListeners('update-download-progress');
                ipcRenderer.removeAllListeners('update-ready');
            };
        }
    }, []);

    const handleInstall = () => {
        if ((window as any).require) {
            const { ipcRenderer } = (window as any).require('electron');
            ipcRenderer.send('install-update');
        }
    };

    if (updateStatus === 'none') return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 50 }}
                className="fixed bottom-6 right-6 z-[9999] w-[380px]"
            >
                <div className="relative overflow-hidden glass-card !p-0 border border-primary/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-background/80 backdrop-blur-2xl">
                    {/* Animated Glow Backdrop */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-[80px] rounded-full animate-pulse" />
                    
                    <div className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                {updateStatus === 'ready' ? <Rocket size={24} className="animate-bounce" /> : <Download size={24} className={updateStatus === 'downloading' ? 'animate-pulse' : ''} />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">
                                        {updateStatus === 'ready' ? 'GÜNCELLEME HAZIR' : 'YENİ VERSİYON'}
                                    </h3>
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                                        <Sparkles size={8} className="text-primary" />
                                        <span className="text-[8px] font-black text-primary uppercase">v{versionInfo?.version || 'Yeni'}</span>
                                    </div>
                                </div>

                                <p className="text-xs text-secondary font-medium leading-relaxed mb-4">
                                    {updateStatus === 'available' && "JetPos'un yeni sürümü bulundu. İndiriliyor..."}
                                    {updateStatus === 'downloading' && `Yeni sürüm indiriliyor... %${progress}`}
                                    {updateStatus === 'ready' && "Güncelleme başarıyla indirildi. Yeniden başlatmaya hazırız!"}
                                </p>

                                {updateStatus === 'downloading' && (
                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-4">
                                        <motion.div
                                            className="h-full bg-primary"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    {updateStatus === 'ready' ? (
                                        <button
                                            onClick={handleInstall}
                                            className="flex-1 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                                        >
                                            Şimdi Yeniden Başlat
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2 text-[10px] font-black text-secondary tracking-widest uppercase py-2">
                                            <Loader2 size={12} className="animate-spin" />
                                            Hazırlanıyor...
                                        </div>
                                    )}
                                    <button
                                        onClick={() => setUpdateStatus('none')}
                                        className="p-2.5 rounded-xl bg-white/5 text-secondary hover:text-white transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
