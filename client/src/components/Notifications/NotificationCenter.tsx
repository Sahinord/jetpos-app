"use client";

import { useState, useEffect } from 'react';
import { Bell, X, Info, CheckCircle, AlertTriangle, AlertCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/lib/tenant-context';

export default function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { currentTenant } = useTenant();

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

    const fetchNotifications = async () => {
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

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-400" />;
            case 'error': return <AlertCircle className="w-5 h-5 text-rose-400" />;
            default: return <Info className="w-5 h-5 text-blue-400" />;
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 text-secondary hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-primary rounded-full ring-4 ring-[#0f172a] animate-pulse" />
                )}
            </button>

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
                            className="absolute right-0 mt-4 w-96 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
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
                                    <div className="p-10 text-center space-y-3">
                                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                                            <Bell className="w-6 h-6 text-slate-600" />
                                        </div>
                                        <p className="text-sm text-slate-500">Henüz bildirim yok.</p>
                                    </div>
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
