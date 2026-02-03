"use client";

import { useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Wallet,
    TrendingDown,
    AlertCircle,
    Clock,
    X,
    Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const daysOfWeek = ["PZT", "SAL", "ÇAR", "PER", "CUM", "CMT", "PAZ"];

interface CalendarEvent {
    id: string;
    date: number;
    title: string;
    type: 'payment' | 'collection' | 'tax' | 'payroll';
    amount?: number;
    color?: string;
}

const eventTypes = [
    { id: 'payment', label: 'ÖDEME', defaultColor: '#ef4444' }, // Rose 500
    { id: 'collection', label: 'TAHSİLAT', defaultColor: '#10b981' }, // Emerald 500
    { id: 'tax', label: 'VERGİ', defaultColor: '#f59e0b' }, // Amber 500
    { id: 'payroll', label: 'MAAŞ', defaultColor: '#6366f1' }, // Indigo 500
];

export default function FinancialCalendar() {
    const today = new Date();
    const [currentDate, setCurrentDate] = useState(today);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [newEvent, setNewEvent] = useState({
        title: '',
        type: 'payment' as 'payment' | 'collection' | 'tax' | 'payroll',
        amount: '',
        color: '#ef4444'
    });

    // Gerçek Mali Takvim Verileri
    const [events, setEvents] = useState<CalendarEvent[]>([
        { id: '1', date: 14, title: 'Muhtasar Beyanname', type: 'tax', amount: 0, color: '#f59e0b' },
        { id: '2', date: 17, title: 'SGK Primleri', type: 'tax', amount: 0, color: '#f59e0b' },
        { id: '3', date: 26, title: 'KDV Beyanı', type: 'tax', amount: 0, color: '#f59e0b' },
        { id: '4', date: 27, title: 'KDV Ödemesi', type: 'payment', amount: 0, color: '#ef4444' },
        { id: '5', date: 1, title: 'Maaş Ödemeleri', type: 'payroll', amount: 0, color: '#6366f1' },
    ]);

    const monthName = currentDate.toLocaleString('tr-TR', { month: 'long' }).toUpperCase();
    const year = currentDate.getFullYear();

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        let day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1;
    };

    const daysInMonth = getDaysInMonth(year, currentDate.getMonth());
    const firstDay = getFirstDayOfMonth(year, currentDate.getMonth());

    const days = [];
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleAddEvent = () => {
        if (selectedDay && newEvent.title) {
            const event: CalendarEvent = {
                id: Math.random().toString(36).substr(2, 9),
                date: selectedDay,
                title: newEvent.title,
                type: newEvent.type,
                amount: parseFloat(newEvent.amount) || 0,
                color: newEvent.color
            };
            setEvents([...events, event]);
            setIsModalOpen(false);
            setNewEvent({ title: '', type: 'payment', amount: '', color: '#ef4444' });
        }
    };

    const handleDeleteEvent = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Bu etkinliği silmek istediğinize emin misiniz?")) {
            setEvents(events.filter(event => event.id !== id));
        }
    };

    const stats = [
        {
            label: "BEKLENEN TAHSİLAT",
            val: `₺${events.filter(e => e.type === 'collection').reduce((acc, current) => acc + (current.amount || 0), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
            color: "bg-emerald-50 text-emerald-600 border-emerald-100",
            icon: Wallet
        },
        {
            label: "TOPLAM ÖDEMELER",
            val: `₺${events.filter(e => e.type !== 'collection').reduce((acc, current) => acc + (current.amount || 0), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
            color: "bg-rose-50 text-rose-600 border-rose-100",
            icon: TrendingDown
        },
        {
            label: "KRİTİK VERGİLER",
            val: `${events.filter(e => e.type === 'tax').length} Ödeme`,
            color: "bg-amber-50 text-amber-600 border-amber-100",
            icon: AlertCircle
        },
        {
            label: "MAAŞ GÜNÜ",
            val: events.find(e => e.type === 'payroll') ? `${events.find(e => e.type === 'payroll')?.date} ${monthName.charAt(0) + monthName.slice(1).toLowerCase()}` : "-",
            color: "bg-indigo-50 text-indigo-600 border-indigo-100",
            icon: Clock
        },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Month Navigator */}
            <div className="flex justify-end">
                <div className="flex items-center gap-3 bg-card border border-border p-1.5 rounded-2xl shadow-sm">
                    <button onClick={prevMonth} className="p-2 hover:bg-secondary/5 rounded-xl transition-colors">
                        <ChevronLeft className="w-5 h-5 text-secondary" />
                    </button>
                    <div className="px-4 font-black text-sm tracking-widest text-[var(--color-foreground)]">
                        {monthName} {year}
                    </div>
                    <button onClick={nextMonth} className="p-2 hover:bg-secondary/5 rounded-xl transition-colors">
                        <ChevronRight className="w-5 h-5 text-secondary" />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="glass-card !p-0 overflow-hidden border-border/50 shadow-2xl shadow-black/5">
                <div className="grid grid-cols-7 border-b border-border/50 bg-secondary/5">
                    {daysOfWeek.map(day => (
                        <div key={day} className="py-3 text-center text-[10px] font-black text-secondary tracking-[2px]">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7">
                    {days.map((day, idx) => {
                        const dayEvents = events.filter(e => e.date === day);
                        const isToday = day === today.getDate() &&
                            currentDate.getMonth() === today.getMonth() &&
                            currentDate.getFullYear() === today.getFullYear();

                        return (
                            <div
                                key={idx}
                                className={`min-h-[100px] p-2 border-r border-b border-border/40 relative group transition-colors hover:bg-secondary/[0.02]
                                    ${idx % 7 === 6 ? 'border-r-0' : ''}
                                `}
                            >
                                {day && (
                                    <>
                                        <div className="flex justify-between items-start">
                                            <span className={`text-xs font-bold flex items-center justify-center w-7 h-7 rounded-full transition-all
                                                ${isToday ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-secondary group-hover:text-[var(--color-foreground)]'}
                                            `}>
                                                {day}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setSelectedDay(day);
                                                    setIsModalOpen(true);
                                                }}
                                                className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-secondary hover:text-primary"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        <div className="mt-1.5 space-y-1">
                                            {dayEvents.map(event => (
                                                <div
                                                    key={event.id}
                                                    style={{ backgroundColor: event.color || '#primary' }}
                                                    className="px-1.5 py-1 rounded-md text-[9px] font-bold truncate border border-black/10 text-white shadow-sm flex items-center justify-between group/event"
                                                >
                                                    <span className="truncate flex-1">{event.title}</span>
                                                    <button
                                                        onClick={(e) => handleDeleteEvent(event.id, e)}
                                                        className="opacity-0 group-hover/event:opacity-100 p-0.5 ml-1 hover:bg-black/20 rounded transition-all"
                                                    >
                                                        <Trash2 className="w-3 h-3 text-white" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className={`p-5 rounded-2xl border ${stat.color} flex flex-col gap-2 shadow-sm`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{stat.label}</span>
                            <stat.icon className="w-4 h-4 opacity-50" />
                        </div>
                        <span className="text-xl font-black tracking-tight">{stat.val}</span>
                    </motion.div>
                ))}
            </div>

            {/* Add Event Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden relative z-10"
                        >
                            <div className="p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-black text-foreground">Etkinlik Ekle ({selectedDay} {monthName})</h3>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="p-2 hover:bg-secondary/10 rounded-xl text-secondary transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-secondary tracking-widest uppercase ml-1">ETKİNLİK BAŞLIĞI</label>
                                        <input
                                            type="text"
                                            placeholder="Örn: Kira Ödemesi"
                                            value={newEvent.title}
                                            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                            className="w-full bg-secondary/5 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-secondary tracking-widest uppercase ml-1">ETKİNLİK TİPİ</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {eventTypes.map((type) => (
                                                <button
                                                    key={type.id}
                                                    onClick={() => setNewEvent({ ...newEvent, type: type.id as any, color: type.defaultColor })}
                                                    className={`px-4 py-2 rounded-xl border text-[10px] font-bold transition-all ${newEvent.type === type.id
                                                            ? 'bg-primary border-primary text-white'
                                                            : 'bg-secondary/5 border-border text-secondary hover:border-primary/50'
                                                        }`}
                                                >
                                                    {type.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-secondary tracking-widest uppercase ml-1">RENK SEÇİMİ</label>
                                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                            {['#ef4444', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'].map((color) => (
                                                <button
                                                    key={color}
                                                    onClick={() => setNewEvent({ ...newEvent, color })}
                                                    className={`w-8 h-8 rounded-full border-2 transition-all flex-shrink-0 ${newEvent.color === color ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-transparent'
                                                        }`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                            <input
                                                type="color"
                                                value={newEvent.color}
                                                onChange={(e) => setNewEvent({ ...newEvent, color: e.target.value })}
                                                className="w-8 h-8 rounded-full border-none p-0 bg-transparent cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-secondary tracking-widest uppercase ml-1">MİKTAR (₺)</label>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={newEvent.amount}
                                            onChange={(e) => setNewEvent({ ...newEvent, amount: e.target.value })}
                                            className="w-full bg-secondary/5 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-6 py-3 rounded-xl border border-border font-bold text-sm hover:bg-secondary/5 transition-colors"
                                    >
                                        İptal
                                    </button>
                                    <button
                                        onClick={handleAddEvent}
                                        disabled={!newEvent.title}
                                        className="flex-1 px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none"
                                    >
                                        Kaydet
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
