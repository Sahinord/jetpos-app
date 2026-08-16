"use client";

import { useState, useEffect, useRef } from 'react';
import { Bell, X, Info, CheckCircle, AlertTriangle, AlertCircle, Trash2, Download, Rocket, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/lib/tenant-context';

export default function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { currentTenant } = useTenant();

    // Electron Auto-Update states
    const [updateStatus, setUpdateStatus] = useState<'none' | 'available' | 'downloading' | 'ready'>('none');
    const [updateProgress, setUpdateProgress] = useState(0);
    const [updateVersion, setUpdateVersion] = useState<any>(null);

    // Panel/baloncuk konumu (buton ekranın solundaysa panel sağa açılsın, taşmasın)
    const rootRef = useRef<HTMLDivElement>(null);
    const [alignLeft, setAlignLeft] = useState(false);

    // Baloncuk: bir kez görülünce YENİ güncelleme/bildirim gelene kadar susar (localStorage).
    const SEEN_KEY = 'jp_notif_seen_sig';
    const [seenSig, setSeenSig] = useState<string>('');
    useEffect(() => {
        try { setSeenSig(localStorage.getItem(SEEN_KEY) || ''); } catch { /* yut */ }
    }, []);

    // Butonun ekrandaki konumuna göre hizayı hesapla (mount + resize)
    useEffect(() => {
        const compute = () => {
            const el = rootRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            setAlignLeft(rect.left < window.innerWidth / 2);
        };
        compute();
        window.addEventListener('resize', compute);
        return () => window.removeEventListener('resize', compute);
    }, []);

    useEffect(() => {
        if (currentTenant) {
            fetchNotifications();

            // Realtime subscription
            const channel = supabase
                .channel('notifications_changes')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications'
                }, () => {
                    fetchNotifications();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [currentTenant]);

    // Electron Update Listeners
    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).require) {
            try {
                const { ipcRenderer } = (window as any).require('electron');

                ipcRenderer.on('update-available', (_: any, info: any) => {
                    setUpdateStatus('available');
                    setUpdateVersion(info);
                });

                ipcRenderer.on('update-download-progress', (_: any, progressObj: any) => {
                    setUpdateStatus('downloading');
                    setUpdateProgress(Math.round(progressObj.percent));
                });

                ipcRenderer.on('update-ready', (_: any, info: any) => {
                    setUpdateStatus('ready');
                    setUpdateVersion(info);
                });

                return () => {
                    ipcRenderer.removeAllListeners('update-available');
                    ipcRenderer.removeAllListeners('update-download-progress');
                    ipcRenderer.removeAllListeners('update-ready');
                };
            } catch (e) {
                console.error("Electron updater listener error:", e);
            }
        }
    }, []);

    const fetchNotifications = async () => {
        if (!currentTenant) return;

        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .or(`tenant_id.eq.${currentTenant.id},tenant_id.is.null`)
                .order('created_at', { ascending: false })
                .limit(20);

            if (data) setNotifications(data);
        } catch (err) {
            console.error('Fetch notifications error:', err);
        }
    };

    const markAsRead = async (id: string) => {
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);

        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    };

    const deleteNotification = async (id: string) => {
        await supabase
            .from('notifications')
            .delete()
            .eq('id', id);

        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const unreadCount = notifications.filter(n => !n.is_read).length + (updateStatus !== 'none' ? 1 : 0);

    // Baloncuk imzası: en yeni güncelleme sürümü + en yeni bildirim id.
    // Bu imza değişmediği sürece (aynı güncelleme) baloncuk bir daha çıkmaz.
    const currentSig = `${updateStatus !== 'none' ? (updateVersion?.version || 'upd') : ''}|${notifications[0]?.id || ''}`;
    const showBubble = unreadCount > 0 && !isOpen && seenSig !== currentSig;

    const markSeen = () => {
        try { localStorage.setItem(SEEN_KEY, currentSig); } catch { /* yut */ }
        setSeenSig(currentSig);
    };

    const handleToggle = () => {
        if (!isOpen) {
            markSeen();
            const el = rootRef.current;
            if (el) setAlignLeft(el.getBoundingClientRect().left < window.innerWidth / 2);
        }
        setIsOpen(!isOpen);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-400" />;
            case 'error': return <AlertCircle className="w-5 h-5 text-rose-400" />;
            default: return <Info className="w-5 h-5 text-blue-400" />;
        }
    };

    return (
        <div ref={rootRef} className="relative">
            <button
                onClick={handleToggle}
                className="relative p-2.5 text-secondary hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-primary rounded-full ring-4 ring-[#0f172a] animate-pulse" />
                )}
            </button>

            {showBubble && (
                <button
                    onClick={handleToggle}
                    className={`absolute top-14 ${alignLeft ? 'left-0' : 'right-0'} z-50 group`}
                >
                    {/* parlayan dış katman (nabız) */}
                    <span className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 opacity-60 blur-md animate-pulse" />
                    {/* pill */}
                    <span className="relative flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-lg shadow-violet-500/40 ring-1 ring-white/20 group-hover:scale-[1.03] transition-transform">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                        </span>
                        <Zap className="w-3.5 h-3.5 fill-white" />
                        <span>Jet Hızında Güncelleme Var!</span>
                    </span>
                    {/* ok ucu */}
                    <span className={`absolute -top-1 ${alignLeft ? 'left-5' : 'right-5'} w-2.5 h-2.5 bg-indigo-500 rotate-45 ring-1 ring-white/20`} />
                </button>
            )}

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className={`absolute ${alignLeft ? 'left-0' : 'right-0'} mt-4 w-96 max-w-[calc(100vw-1.5rem)] bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden`}
                        >
                            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    Bildirimler
                                    {unreadCount > 0 && (
                                        <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full ring-1 ring-primary/30">
                                            {unreadCount} Yeni
                                        </span>
                                    )}
                                </h3>
                                <button onClick={() => setIsOpen(false)} className="text-secondary hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                {/* Local System Update Notification */}
                                {updateStatus !== 'none' && (
                                    <div className="p-4 border-b border-primary/20 bg-primary/5 transition-all relative group">
                                        <div className="flex gap-3">
                                            <div className="mt-1 flex-shrink-0">
                                                {updateStatus === 'ready' ? (
                                                    <Rocket className="w-5 h-5 text-primary animate-bounce" />
                                                ) : (
                                                    <Download className={`w-5 h-5 text-primary ${updateStatus === 'downloading' ? 'animate-pulse' : ''}`} />
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-1.5 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                                                        {updateStatus === 'ready' ? 'GÜNCELLEME HAZIR!' : 'YENİ SÜRÜM'}
                                                        <span className="text-[9px] font-black bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.5 rounded">
                                                            v{updateVersion?.version || 'Yeni'}
                                                        </span>
                                                    </h4>
                                                    <span className="text-[9px] font-bold text-primary tracking-widest uppercase animate-pulse">Sistem</span>
                                                </div>
                                                <p className="text-xs text-slate-300 leading-relaxed">
                                                    {updateStatus === 'available' && "JetPos'un yeni versiyonu tespit edildi. İndirme başlatılıyor..."}
                                                    {updateStatus === 'downloading' && `Yeni versiyon indiriliyor: %${updateProgress}`}
                                                    {updateStatus === 'ready' && "Yeni sürüm başarıyla indirildi. Yüklemek ve yeniden başlatmak için hazırız!"}
                                                </p>
                                                {updateStatus === 'downloading' && (
                                                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                                                        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${updateProgress}%` }} />
                                                    </div>
                                                )}
                                                {updateStatus === 'ready' && (
                                                    <button
                                                        onClick={() => {
                                                            if ((window as any).require) {
                                                                const { ipcRenderer } = (window as any).require('electron');
                                                                ipcRenderer.send('install-update');
                                                            }
                                                        }}
                                                        className="mt-2 w-full py-2 bg-primary hover:bg-primary/95 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-primary/20 active:scale-98"
                                                    >
                                                        Şimdi Yeniden Başlat & Kur
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Database Notifications */}
                                {notifications.length > 0 ? (
                                    notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            className={`p-4 border-b border-white/5 hover:bg-white/5 transition-all group relative ${!n.is_read ? 'bg-primary/5' : ''}`}
                                            onClick={() => markAsRead(n.id)}
                                        >
                                            <div className="flex gap-3">
                                                <div className="mt-1 flex-shrink-0">
                                                    {getIcon(n.type)}
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className={`text-sm font-bold ${!n.is_read ? 'text-white' : 'text-slate-300'}`}>
                                                            {n.title}
                                                        </h4>
                                                        <span className="text-[10px] text-slate-500">
                                                            {new Date(n.created_at).toLocaleDateString('tr-TR')}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 leading-relaxed">
                                                        {n.message}
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteNotification(n.id);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-rose-500 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    updateStatus === 'none' && (
                                        <div className="p-10 text-center space-y-3">
                                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                                                <Bell className="w-6 h-6 text-slate-600" />
                                            </div>
                                            <p className="text-sm text-slate-500">Henüz bildirim yok.</p>
                                        </div>
                                    )
                                )}
                            </div>

                            <div className="p-3 bg-white/5 text-center">
                                <button className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-colors">
                                    Tüm Bildirimleri Gör
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
