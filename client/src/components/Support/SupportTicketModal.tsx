"use client";

import { useState } from 'react';
import { X, MessageSquare, Send, AlertCircle, CheckCircle2, LifeBuoy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/lib/tenant-context';

export default function SupportTicketModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const { currentTenant } = useTenant();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !message) {
            setError('Lütfen tüm alanları doldurun.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { error: submitError } = await supabase
                .from('support_tickets')
                .insert([{
                    tenant_id: currentTenant?.id,
                    subject,
                    message,
                    status: 'open',
                    priority: 'normal'
                }]);

            if (submitError) throw submitError;

            setSuccess(true);
            setSubject('');
            setMessage('');

            setTimeout(() => {
                setSuccess(false);
                setIsOpen(false);
            }, 2000);
        } catch (err: any) {
            setError('Talebiniz gönderilemedi: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Float Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-2xl shadow-primary/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-40 group"
            >
                <LifeBuoy className="w-7 h-7 group-hover:rotate-12 transition-transform" />
                <span className="absolute right-full mr-4 px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    Destek Talebi Oluştur
                </span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                                        <MessageSquare className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-white">Destek Talebi</h2>
                                        <p className="text-xs text-slate-400">Hata bildirimi veya yardım isteği</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                {success ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="py-10 text-center space-y-4"
                                    >
                                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">Talebiniz Alındı!</h3>
                                            <p className="text-sm text-slate-400">Ekibimiz en kısa sürede dönüş yapacaktır.</p>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Konu / Başlık</label>
                                            <input
                                                type="text"
                                                value={subject}
                                                onChange={(e) => setSubject(e.target.value)}
                                                placeholder="Örn: Stok senkronizasyon hatası"
                                                className="w-full px-5 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white outline-none focus:border-primary/50 transition-all placeholder:text-slate-700"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Mesajınız</label>
                                            <textarea
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                placeholder="Lütfen detaylı bilgi verin..."
                                                rows={5}
                                                className="w-full px-5 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white outline-none focus:border-primary/50 transition-all placeholder:text-slate-700 resize-none"
                                            />
                                        </div>

                                        {error && (
                                            <div className="flex items-center gap-2 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                                                <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                                                <p className="text-xs text-rose-500 font-bold">{error}</p>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-5 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black shadow-xl shadow-primary/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                        >
                                            {loading ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <Send className="w-5 h-5" />
                                                    Talebi Gönder
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
