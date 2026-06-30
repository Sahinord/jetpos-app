"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Settings, Check, Palette } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { getTheme, setTheme, ThemeId } from '@/components/ThemeApplier';
import { toast } from 'sonner';

const THEMES: { id: ThemeId; name: string; desc: string; gradient: string }[] = [
    { id: 'modern', name: 'Modern Koyu', desc: 'Varsayılan — koyu ve neon vurgular', gradient: 'linear-gradient(135deg, #2563FF, #6FD3FF)' },
    { id: 'light', name: 'Güneş Işığı', desc: 'Aydınlık ve ferah çalışma alanı', gradient: 'linear-gradient(135deg, #7886C7, #9AA7DF)' },
    { id: 'wood', name: 'Klasik Ahşap', desc: 'Sıcak ve nostaljik hesap makinesi', gradient: 'linear-gradient(135deg, #8b4513, #d4a017)' },
    { id: 'glass', name: 'Cam Kabarcık', desc: 'Yüksek derinlikli modern cam', gradient: 'linear-gradient(135deg, #0284c7, #38bdf8)' },
    { id: 'mavi', name: 'Main Mavi Test Tema', desc: 'Soft mavi, yeni nesil görünüm', gradient: 'linear-gradient(135deg, #7886C7, #5A659F)' },
];

export default function AyarlarPage() {
    const router = useRouter();
    const [activeTheme, setActiveTheme] = useState<ThemeId>('modern');

    useEffect(() => {
        const tid = localStorage.getItem('tenantId');
        if (!tid) {
            router.push('/');
            return;
        }
        setActiveTheme(getTheme());
    }, []);

    const handleSelectTheme = (id: ThemeId) => {
        setTheme(id);
        setActiveTheme(id);
        toast.success(`${THEMES.find(t => t.id === id)?.name} teması uygulandı`);
    };

    return (
        <div className="min-h-screen bg-background pb-24">
            <header className="sticky top-0 z-50 glass border-b border-border-glow/10 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 glass-dark rounded-xl border border-border-glow/10">
                        <ArrowLeft size={20} className="text-secondary" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-foreground tracking-tight leading-none uppercase">Ayarlar</h1>
                        <p className="text-[10px] font-black text-cyan-glow tracking-[2px] uppercase mt-1">Görünüm</p>
                    </div>
                </div>
                <div className="w-11 h-11 rounded-2xl glass border border-border-glow/10 flex items-center justify-center">
                    <Settings className="w-6 h-6 text-cyan-glow" />
                </div>
            </header>

            <div className="p-6 space-y-4">
                <p className="text-[10px] font-black text-secondary tracking-[3px] uppercase px-2 flex items-center gap-2">
                    <Palette size={12} /> Tema Seç
                </p>

                {THEMES.map((t) => {
                    const isActive = activeTheme === t.id;
                    return (
                        <button
                            key={t.id}
                            onClick={() => handleSelectTheme(t.id)}
                            className={`w-full flex items-center gap-4 p-4 rounded-3xl border transition-all text-left glass-dark ${isActive ? 'border-primary' : 'border-border-glow/10'}`}
                        >
                            <div
                                className="w-12 h-12 rounded-2xl shrink-0 shadow-lg"
                                style={{ background: t.gradient }}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-foreground">{t.name}</p>
                                <p className="text-[10px] text-secondary font-bold mt-0.5">{t.desc}</p>
                            </div>
                            {isActive && (
                                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                                    <Check className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            <BottomNav />
        </div>
    );
}
