"use client";

import { useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Calendar as CalendarIcon,
    Wallet,
    TrendingDown,
    AlertCircle,
    Clock
} from "lucide-react";
import { motion } from "framer-motion";

const daysOfWeek = ["PZT", "SAL", "ÇAR", "PER", "CUM", "CMT", "PAZ"];

interface CalendarEvent {
    id: string;
    date: number;
    title: string;
    type: 'payment' | 'collection' | 'tax' | 'payroll';
    amount?: number;
}

export default function FinancialCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1)); // January 2026 as in screenshot
    const [events, setEvents] = useState<CalendarEvent[]>([
        { id: '1', date: 26, title: 'KDV Ödemesi', type: 'tax', amount: 0 },
        { id: '2', date: 27, title: '₺1.320 Targa Group', type: 'collection', amount: 1320 },
    ]);

    const monthName = currentDate.toLocaleString('tr-TR', { month: 'long' }).toUpperCase();
    const year = currentDate.getFullYear();

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        let day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // Adjust to start with Monday
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

    const stats = [
        { label: "BEKLENEN TAHSİLAT", val: "₺1.320,00", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: Wallet },
        { label: "TOPLAM ÖDEMELER", val: "₺0,00", color: "bg-rose-50 text-rose-600 border-rose-100", icon: TrendingDown },
        { label: "KRİTİK VERGİLER", val: "1 Ödeme", color: "bg-amber-50 text-amber-600 border-amber-100", icon: AlertCircle },
        { label: "MAAŞ GÜNÜ", val: "-", color: "bg-indigo-50 text-indigo-600 border-indigo-100", icon: Clock },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[var(--color-foreground)] tracking-tight">Mali Takvim</h1>
                    <p className="text-secondary font-medium mt-1">Ödemeleri, tahsilatları ve resmi yükümlülükleri takip edin.</p>
                </div>

                <div className="flex items-center gap-3 bg-card border border-border p-1.5 rounded-2xl shadow-sm">
                    <button className="p-2 hover:bg-secondary/5 rounded-xl transition-colors">
                        <ChevronLeft className="w-5 h-5 text-secondary" />
                    </button>
                    <div className="px-4 font-black text-sm tracking-widest text-[var(--color-foreground)]">
                        {monthName} {year}
                    </div>
                    <button className="p-2 hover:bg-secondary/5 rounded-xl transition-colors">
                        <ChevronRight className="w-5 h-5 text-secondary" />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="glass-card !p-0 overflow-hidden border-border/50 shadow-2xl shadow-black/5">
                <div className="grid grid-cols-7 border-b border-border/50 bg-secondary/5">
                    {daysOfWeek.map(day => (
                        <div key={day} className="py-4 text-center text-[10px] font-black text-secondary tracking-[2px]">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7">
                    {days.map((day, idx) => {
                        const dayEvents = events.filter(e => e.date === day);
                        const isToday = day === 30; // Hardcoded for screenshot likeness

                        return (
                            <div
                                key={idx}
                                className={`min-h-[120px] p-2 border-r border-b border-border/40 relative group transition-colors hover:bg-secondary/[0.02]
                                    ${idx % 7 === 6 ? 'border-r-0' : ''}
                                `}
                            >
                                {day && (
                                    <>
                                        <div className="flex justify-between items-start">
                                            <span className={`text-sm font-bold flex items-center justify-center w-8 h-8 rounded-full transition-all
                                                ${isToday ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-secondary group-hover:text-[var(--color-foreground)]'}
                                            `}>
                                                {day}
                                            </span>
                                            <button className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-secondary hover:text-primary">
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="mt-2 space-y-1">
                                            {dayEvents.map(event => (
                                                <div
                                                    key={event.id}
                                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold truncate border
                                                        ${event.type === 'tax' ? 'bg-amber-100/50 text-amber-700 border-amber-200' :
                                                            event.type === 'collection' ? 'bg-emerald-100/50 text-emerald-700 border-emerald-200' :
                                                                'bg-blue-100/50 text-blue-700 border-blue-200'}
                                                    `}
                                                >
                                                    {event.title}
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
                        className={`p-6 rounded-3xl border ${stat.color} flex flex-col gap-2 shadow-sm`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{stat.label}</span>
                            <stat.icon className="w-4 h-4 opacity-50" />
                        </div>
                        <span className="text-2xl font-black tracking-tight">{stat.val}</span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
