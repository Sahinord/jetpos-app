"use client";

import { useState, useEffect } from 'react';
import { 
    RefreshCw, 
    ArrowRightLeft, 
    TrendingUp, 
    TrendingDown, 
    DollarSign, 
    Euro, 
    Coins,
    Calendar,
    ArrowRight,
    BadgePercent,
    Monitor,
    Users,
    BarChart3,
    Building2,
    User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CURRENCIES = [
    { code: 'TRY', name: 'Türk Lirası', symbol: '₺', flag: '🇹🇷' },
    { code: 'USD', name: 'Amerikan Doları', symbol: '$', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
    { code: 'GBP', name: 'İngiliz Sterlini', symbol: '£', flag: '🇬🇧' },
    { code: 'CHF', name: 'İsviçre Frangı', symbol: '₣', flag: '🇨🇭' },
    { code: 'JPY', name: 'Japon Yeni', symbol: '¥', flag: '🇯🇵' },
    { code: 'SAR', name: 'Suudi Arabistan Riyali', symbol: '﷼', flag: '🇸🇦' },
    { code: 'AED', name: 'BAE Dirhemi', symbol: 'د.إ', flag: '🇦🇪' },
];

export default function CurrencyConverter({ theme }: any) {
    const [amount, setAmount] = useState<number>(100);
    const [fromCurrency, setFromCurrency] = useState('USD');
    const [toCurrency, setToCurrency] = useState('TRY');
    const [rates, setRates] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    
    // Initial dummy data to prevent empty cards
    const [mainRates, setMainRates] = useState<any[]>([
        { label: 'Amerikan Doları', code: 'USD/TRY', value: '32.4550', change: '+0.12%', up: true, flag: '🇺🇸' },
        { label: 'Euro', code: 'EUR/TRY', value: '34.8210', change: '-0.05%', up: false, flag: '🇪🇺' },
        { label: 'İngiliz Sterlini', code: 'GBP/TRY', value: '40.6720', change: '+0.23%', up: true, flag: '🇬🇧' },
        { label: 'Ons Altın (Sim)', code: 'XAU/USD', value: '2,342.50', change: '+1.10%', up: true, flag: '🟡' },
    ]);

    useEffect(() => {
        fetchMainRates();
        fetchRates();
        
        // Refresh every 30 seconds
        const dataInterval = setInterval(() => {
            fetchMainRates();
            fetchRates();
        }, 30000);

        // Simulation interval for "Live" feeling (every 2 seconds)
        const simInterval = setInterval(() => {
            setMainRates(prev => prev.map(rate => {
                // Only oscillate minor currencies, keep Gold relatively same
                if (rate.code === 'XAU/USD') return rate;
                
                const currentVal = parseFloat(rate.value.replace(',', ''));
                const fluctuation = (Math.random() - 0.5) * 0.001; // Tiny movement
                return {
                    ...rate,
                    value: (currentVal + fluctuation).toFixed(4),
                    change: (Math.random() > 0.5 ? '+' : '-') + (Math.random() * 0.5).toFixed(2) + '%'
                };
            }));
        }, 2000);

        return () => {
            clearInterval(dataInterval);
            clearInterval(simInterval);
        };
    }, []);

    // Also refetch when fromCurrency changes for the converter part
    useEffect(() => {
        fetchRates();
    }, [fromCurrency]);

    const fetchMainRates = async () => {
        try {
            const res = await fetch(`https://api.frankfurter.app/latest?from=USD&to=TRY,EUR,GBP,JPY`);
            const data = await res.json();
            if (data.rates) {
                const tryRate = data.rates.TRY;
                const eurRate = (tryRate / data.rates.EUR).toFixed(4);
                const gbpRate = (tryRate / data.rates.GBP).toFixed(4);
                
                setMainRates([
                    { label: 'Amerikan Doları', code: 'USD/TRY', value: tryRate.toFixed(4), change: '+0.14%', up: true, flag: '🇺🇸' },
                    { label: 'Euro', code: 'EUR/TRY', value: eurRate, change: '-0.02%', up: false, flag: '🇪🇺' },
                    { label: 'İngiliz Sterlini', code: 'GBP/TRY', value: gbpRate, change: '+0.21%', up: true, flag: '🇬🇧' },
                    { label: 'Ons Altın (Sim)', code: 'XAU/USD', value: '2,342.50', change: '+1.10%', up: true, flag: '🟡' },
                ]);
            }
        } catch (e) {
            console.error("Ana kurlar çekilemedi:", e);
        }
    };

    const fetchRates = async () => {
        setLoading(true);
        try {
            const res = await fetch(`https://api.frankfurter.app/latest?from=${fromCurrency}`);
            const data = await res.json();
            if (data.rates) {
                setRates(data.rates);
                setLastUpdated(new Date().toLocaleTimeString('tr-TR'));
            }
        } catch (error) {
            console.error("Kur bilgisi çekilemedi:", error);
        } finally {
            setLoading(false);
        }
    };

    const convertedAmount = fromCurrency === toCurrency 
        ? amount 
        : (amount * (rates[toCurrency] || 0)).toFixed(2);

    const swapCurrencies = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight">Piyasa & Döviz</h1>
                    <p className="text-secondary mt-2 text-sm">Global piyasaları anlık takip edin ve döviz işlemlerinizi gerçekleştirin</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-4 py-2 ${theme === 'light' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'} border rounded-full`}>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest ">CANLI PİYASA AKIŞI</span>
                    </div>
                    <button 
                        onClick={() => { fetchRates(); fetchMainRates(); }}
                        className={`p-2.5 ${theme === 'light' ? 'bg-white border-slate-200 text-slate-600' : 'bg-white/5 border-white/10 text-white'} border rounded-xl hover:scale-110 active:scale-95 transition-all shadow-lg`}
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* LIVE MARKET WATCH WIDGET */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {mainRates.map((m, idx) => (
                    <motion.div 
                        key={m.code}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`glass-card !p-5 border-l-4 ${m.up ? 'border-l-emerald-500 shadow-[0_4px_20px_-5px_rgba(16,185,129,0.1)]' : 'border-l-rose-500 shadow-[0_4px_20px_-5px_rgba(244,63,94,0.1)]'} flex flex-col gap-3 group hover:translate-y-[-4px] transition-all duration-300`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl group-hover:scale-125 transition-transform">{m.flag}</span>
                                <span className="text-[10px] font-bold text-secondary tracking-[0.2em]">{m.code}</span>
                            </div>
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md ${m.up ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                {m.up ? <TrendingUp size={10} strokeWidth={3} /> : <TrendingDown size={10} strokeWidth={3} />}
                                <span className="text-[10px] font-black">{m.change}</span>
                            </div>
                        </div>
                        <div>
                            <span className="text-3xl font-black text-foreground tracking-tighter tabular-nums">
                                {m.code === 'XAU/USD' ? m.value : `₺${m.value}`}
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary/10 rounded-full overflow-hidden mt-1 p-[1px]">
                            <motion.div 
                                className={`h-full rounded-full ${m.up ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-gradient-to-r from-rose-600 to-rose-400'}`}
                                animate={{ 
                                    width: m.up ? ["60%", "75%", "70%"] : ["40%", "30%", "35%"],
                                    opacity: [0.8, 1, 0.8]
                                }}
                                transition={{ duration: 4, repeat: Infinity }}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Converter Card */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card p-10 relative overflow-hidden backdrop-blur-2xl">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none scale-150 rotate-12">
                            <Coins className="w-40 h-40" />
                        </div>

                        <div className="space-y-8 relative z-10">
                            {/* Input Amount */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary ml-1 flex items-center gap-2">
                                    <BadgePercent className="w-3 h-3 text-primary" />
                                    ÇEVRİLECEK MİKTAR
                                </label>
                                <div className="relative group">
                                    <input 
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(Number(e.target.value))}
                                        className={`w-full ${theme === 'light' ? 'bg-white border-primary/20 text-slate-900 shadow-inner' : 'bg-white/5 border-white/10 text-white shadow-inner'} border-2 focus:border-primary rounded-3xl p-8 text-5xl font-black outline-none transition-all placeholder:text-slate-700`}
                                    />
                                    <div className="absolute right-8 top-1/2 -translate-y-1/2 text-3xl font-black text-primary/50 group-focus-within:text-primary transition-colors">
                                        {CURRENCIES.find(c => c.code === fromCurrency)?.symbol}
                                    </div>
                                </div>
                            </div>

                            {/* Selectors */}
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className="flex-1 w-full space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary ml-1">KAYNAK DÖVİZ</label>
                                    <div className="relative">
                                        <select 
                                            value={fromCurrency}
                                            onChange={(e) => setFromCurrency(e.target.value)}
                                            className={`w-full ${theme === 'light' ? 'bg-white border-primary/20 text-slate-900' : 'bg-slate-900 border-white/10 text-white'} border rounded-2xl p-5 font-black text-lg outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer shadow-xl`}
                                        >
                                            {CURRENCIES.map(c => (
                                                <option key={c.code} value={c.code} className={theme === 'light' ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>{c.flag} {c.code} - {c.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                            <ArrowRight className="rotate-90 w-4 h-4" />
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={swapCurrencies}
                                    className="mt-6 p-5 bg-primary/10 border-2 border-primary/20 text-primary rounded-full hover:bg-primary hover:text-white transition-all transform hover:rotate-180 shadow-[0_0_20px_rgba(59,130,246,0.3)] active:scale-90"
                                >
                                    <ArrowRightLeft className="w-8 h-8" />
                                </button>

                                <div className="flex-1 w-full space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary ml-1">HEDEF DÖVİZ</label>
                                    <div className="relative">
                                        <select 
                                            value={toCurrency}
                                            onChange={(e) => setToCurrency(e.target.value)}
                                            className={`w-full ${theme === 'light' ? 'bg-white border-primary/20 text-slate-900' : 'bg-slate-900 border-white/10 text-white'} border rounded-2xl p-5 font-black text-lg outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer shadow-xl`}
                                        >
                                            {CURRENCIES.map(c => (
                                                <option key={c.code} value={c.code} className={theme === 'light' ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>{c.flag} {c.code} - {c.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                            <ArrowRight className="rotate-90 w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Result Card */}
                    <div className={`glass-card p-12 ${theme === 'light' ? 'bg-white border-primary/30' : 'bg-gradient-to-br from-primary/10 to-transparent border-primary/20'} shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative overflow-hidden`}>
                        <div className="absolute -left-20 -top-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl" />
                        
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <p className="text-primary font-black text-[12px] uppercase tracking-[0.4em]">İŞLEM SONUCU</p>
                            <div className="flex items-center gap-2 text-[11px] font-bold text-secondary bg-secondary/5 px-3 py-1.5 rounded-lg border border-secondary/10">
                                <Calendar className="w-4 h-4" />
                                <span>Veri Saati: {lastUpdated || '--:--'}</span>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap items-baseline gap-6 relative z-10 transition-all">
                            <h2 className="text-6xl md:text-8xl font-black text-foreground tracking-tighter tabular-nums drop-shadow-sm">
                                {Number(convertedAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </h2>
                            <span className="text-4xl font-bold text-primary animate-pulse">{toCurrency}</span>
                        </div>
                        
                        <div className={`mt-10 p-6 ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-white/5'} rounded-[2rem] border-2 flex items-center justify-between shadow-2xl relative z-10`}>
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner border border-primary/20">
                                    <TrendingUp className="w-7 h-7" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-black text-secondary uppercase tracking-widest">GÜNCEL KUR PARİTESİ</p>
                                    <p className="text-lg font-black text-foreground tabular-nums">1 {fromCurrency} = {rates[toCurrency]?.toFixed(4) || '...'} {toCurrency}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-4 py-2 ${rates[toCurrency] > 1 ? 'bg-emerald-500 text-white shadow-[0_5px_15px_rgba(16,185,129,0.3)]' : 'bg-slate-500 text-white'} text-[10px] font-black rounded-xl tracking-widest uppercase`}>
                                    {rates[toCurrency] > 1 ? 'GÜÇLÜ KUR' : 'NORMAL'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    <div className="glass-card p-8 space-y-8 backdrop-blur-3xl border-primary/10 shadow-2xl">
                        <h3 className="text-sm font-black text-foreground uppercase tracking-[0.3em] border-b-2 border-primary/20 pb-6 flex items-center justify-between">
                            POPÜLER KURLAR
                            <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                        </h3>
                        <div className="space-y-5">
                            {['USD', 'EUR', 'GBP'].map(code => (
                                <div key={code} className={`p-5 ${theme === 'light' ? 'bg-white border-slate-100 hover:border-primary/40' : 'bg-white/[0.03] border-white/5 hover:border-primary/40'} border-2 rounded-3xl flex items-center justify-between transition-all duration-300 group cursor-default shadow-sm hover:shadow-xl hover:translate-x-1`}>
                                    <div className="flex items-center gap-4">
                                        <span className="text-3xl group-hover:rotate-[360deg] transition-transform duration-700">{CURRENCIES.find(c => c.code === code)?.flag}</span>
                                        <div>
                                            <p className="text-sm font-black text-foreground">{code}</p>
                                            <p className="text-xs text-secondary font-bold">₺{(amount * (rates[code] || 1)).toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`text-[11px] font-black tabular-nums ${rates[code] > 1 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {rates[code]?.toFixed(2)}
                                        </span>
                                        <div className="w-8 h-1 bg-primary/10 rounded-full overflow-hidden">
                                            <div className="w-1/2 h-full bg-primary" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-primary to-blue-700 p-10 rounded-[3rem] shadow-[0_20px_40px_rgba(59,130,246,0.3)] relative overflow-hidden group border border-white/20">
                        <motion.div 
                            animate={{ 
                                scale: [1, 1.2, 1],
                                opacity: [0.1, 0.2, 0.1] 
                            }}
                            transition={{ duration: 8, repeat: Infinity }}
                            className="absolute -right-10 -top-10 w-60 h-60 bg-white rounded-full blur-[80px]"
                        />
                        <DollarSign className="absolute -right-6 -bottom-6 w-32 h-32 text-white opacity-10 group-hover:scale-125 transition-transform duration-500 rotate-12" />
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black text-white mb-4 leading-tight">Yurt Dışı<br />Alım-Satım?</h3>
                            <p className="text-white/80 text-[11px] mb-8 leading-relaxed font-medium">Dövizli borç/alacak takibi, otomatik kur farkı faturalandırması ve global envanter yönetimi için Cari modülünü aktif edin.</p>
                            <button 
                                className="w-full py-5 bg-white text-primary rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] hover:shadow-[0_10px_20px_rgba(255,255,255,0.2)] hover:scale-[1.03] transition-all active:scale-95"
                            >
                                CARİ MODÜLÜNÜ AÇ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
