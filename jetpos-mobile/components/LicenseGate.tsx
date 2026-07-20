"use client";

import { useState, useEffect } from 'react';
import { supabase, setCurrentTenant } from '@/lib/supabase';
import { toast } from 'sonner';

interface LicenseGateProps {
    onSuccess: (tenantId: string, companyName: string) => void;
}

/** Arka planda yavaşça akan kısa ifadeler — sadece CSS animasyonu, JS yok. */
const TICKER = [
    'Stok sayımı', 'Hızlı satış', 'Barkod okuma', 'Adisyon', 'Sipariş takibi',
    'Depo transferi', 'Raf etiketi', 'Mutfak ekranı', 'Kurye teslim', 'Gün sonu',
];

export default function LicenseGate({ onSuccess }: LicenseGateProps) {
    const [license, setLicense] = useState('');
    const [loading, setLoading] = useState(false);
    // Animasyonlar yalnızca istemcide başlasın (hydration uyuşmazlığı olmasın)
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!license.trim()) {
            toast.error('Lütfen lisans anahtarını giriniz');
            return;
        }

        setLoading(true);

        try {
            // Lisans arama — HIZ SINIRLI sunucu ucu üzerinden (kaba kuvvet
            // koruması; doğrudan RPC'nin anon izni kaldırıldı).
            const res = await fetch('/api/auth/license', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'find', licenseKey: license.trim() }),
            });
            const payload = await res.json().catch(() => null);
            const data = res.ok ? payload?.tenant : null;

            if (!data) {
                toast.error(payload?.error || 'Geçersiz lisans anahtarı!');
                setLoading(false);
                return;
            }

            // Başarılı - localStorage'a kaydet
            localStorage.setItem('licenseKey', license.trim());
            localStorage.setItem('tenantId', data.id);
            localStorage.setItem('companyName', data.company_name);

            // RLS header'larını (x-tenant-id / x-license-key) hemen güncelle —
            // reload olmadan sonraki sorguların tenant verisini görebilmesi için şart.
            await setCurrentTenant(data.id);

            // Fixed Warehouse Kontrolü (Mobil için sabitlenmiş mağaza var mı?)
            const { data: fixedWh } = await supabase
                .from('fixed_warehouses')
                .select('warehouse_id, warehouses(name)')
                .eq('tenant_id', data.id)
                .eq('platform', 'mobile')
                .single();

            if (fixedWh) {
                localStorage.setItem('activeWarehouseId', fixedWh.warehouse_id);
                localStorage.setItem('activeWarehouseName', (fixedWh.warehouses as any)?.name || 'Sabit Mağaza');
                toast.success(`${(fixedWh.warehouses as any)?.name} mağazası otomatik atandı.`);
            }

            toast.success(`Hoş geldiniz, ${data.company_name}!`);
            onSuccess(data.id, data.company_name);

        } catch (error) {
            console.error('License validation error:', error);
            toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <div className="text-center space-y-6">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
                    <p className="text-white font-bold text-xl tracking-tight">Bağlanıyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/*
              ARKA PLAN — client (JetPos masaüstü) giriş ekranıyla birebir aynı dil.
              PERFORMANS NOTU: hepsi saf CSS (transform/opacity). JS döngüsü,
              canvas ya da requestAnimationFrame YOK — düşük donanımlı el
              terminallerinde bile CPU'yu meşgul etmez.
            */}

            {/* Grid deseni */}
            <div
                className="absolute inset-0 opacity-[0.07]"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(59,130,246,.7) 1px, transparent 1px),' +
                        'linear-gradient(90deg, rgba(59,130,246,.7) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                    maskImage: 'radial-gradient(ellipse at center, black 35%, transparent 75%)',
                    WebkitMaskImage: 'radial-gradient(ellipse at center, black 35%, transparent 75%)',
                }}
            />

            {/* Gradient ışıklar */}
            <div className="absolute inset-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)]" />
            </div>

            {/* Akan ufak yazılar — iki sıra, ters yönlerde, çok yavaş */}
            {mounted && (
                <div className="absolute inset-x-0 top-[14%] pointer-events-none select-none" aria-hidden="true">
                    <div className="jp-marquee">
                        <div className="jp-marquee-track">
                            {[...TICKER, ...TICKER].map((t, i) => (
                                <span key={`a${i}`} className="jp-chip">{t}</span>
                            ))}
                        </div>
                    </div>
                    <div className="jp-marquee mt-3">
                        <div className="jp-marquee-track jp-reverse">
                            {[...TICKER, ...TICKER].map((t, i) => (
                                <span key={`b${i}`} className="jp-chip">{t}</span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full max-w-md relative z-10">
                {/* Marka */}
                <div className="text-center mb-10">
                    <h1 className="text-6xl font-black text-white tracking-tighter mb-2">
                        Jet<span className="text-blue-500">Pos</span>
                    </h1>
                    <p className="text-blue-200/50 text-sm font-bold uppercase tracking-[0.2em]">
                        Mobil • Hızlı • Akıllı
                    </p>
                </div>

                {/* Kart */}
                <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-8">
                        <div className="space-y-8">
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-bold text-white tracking-tight">Hoş Geldiniz</h2>
                                <p className="text-slate-400">Lisans anahtarınızı girerek başlayın</p>
                            </div>

                            <div className="space-y-6">
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-300" />
                                    <input
                                        type="text"
                                        value={license}
                                        onChange={(e) => setLicense(e.target.value.toUpperCase())}
                                        placeholder="XXXX-XXXX-XXXX"
                                        className="relative w-full px-6 py-5 bg-slate-950 border-none rounded-2xl text-white text-center text-xl font-mono placeholder:text-slate-700 outline-none transition-all"
                                        disabled={loading}
                                        autoFocus
                                        inputMode="text"
                                        autoCapitalize="characters"
                                        autoCorrect="off"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !license.trim()}
                                    className="relative w-full group overflow-hidden rounded-2xl p-[1px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-lg disabled:opacity-50"
                                >
                                    <div className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#3b82f6_0%,#6366f1_50%,#3b82f6_100%)]" />
                                    <div className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-2xl bg-slate-950 px-8 py-4 text-white backdrop-blur-3xl group-hover:bg-slate-900 transition-all">
                                        {loading ? 'Kontrol Ediliyor...' : 'Devam Et'}
                                    </div>
                                </button>

                                <p className="text-xs text-slate-600 text-center">
                                    Lisans anahtarınızı bilmiyorsanız yöneticinizle iletişime geçin.
                                </p>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <style jsx>{`
                .jp-marquee {
                    overflow: hidden;
                    width: 100%;
                    /* kenarlarda yumuşak kayboluş */
                    mask-image: linear-gradient(90deg, transparent, black 15%, black 85%, transparent);
                    -webkit-mask-image: linear-gradient(90deg, transparent, black 15%, black 85%, transparent);
                }
                .jp-marquee-track {
                    display: flex;
                    gap: 12px;
                    width: max-content;
                    /* transform animasyonu → GPU'da çalışır, layout tetiklemez */
                    animation: jp-scroll 48s linear infinite;
                    will-change: transform;
                }
                .jp-reverse {
                    animation-direction: reverse;
                    animation-duration: 62s;
                }
                .jp-chip {
                    flex: none;
                    padding: 6px 14px;
                    border-radius: 9999px;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: rgba(148, 197, 253, 0.35);
                    border: 1px solid rgba(59, 130, 246, 0.12);
                    background: rgba(15, 23, 42, 0.4);
                    white-space: nowrap;
                }
                @keyframes jp-scroll {
                    from { transform: translate3d(0, 0, 0); }
                    /* liste iki kez basıldığı için %50'de dikişsiz başa döner */
                    to   { transform: translate3d(-50%, 0, 0); }
                }
                /* Hareket hassasiyeti olan kullanıcılar ve pil tasarrufu için */
                @media (prefers-reduced-motion: reduce) {
                    .jp-marquee-track { animation: none; }
                }
            `}</style>
        </div>
    );
}
