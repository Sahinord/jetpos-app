"use client";

import { useMemo } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend,
    BarElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { useState } from 'react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Filler,
    Legend
);

const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        mode: 'index' as const,
        intersect: false,
    },
    plugins: {
        legend: {
            display: false,
        },
        tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(99, 102, 241, 0.2)',
            titleColor: '#f8fafc',
            bodyColor: '#f8fafc',
            titleFont: {
                weight: '800' as const,
                size: 13,
            },
            bodyFont: {
                weight: '600' as const,
                size: 12,
            },
            cornerRadius: 12,
            displayColors: false,
            callbacks: {
                title: function (items: any[]) {
                    return items[0]?.label || '';
                },
                label: function (item: any) {
                    return `₺${Number(item.raw).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
                }
            }
        },
    },
    scales: {
        y: {
            beginAtZero: true,
            grid: {
                color: 'rgba(255, 255, 255, 0.03)',
                drawBorder: false,
            },
            border: {
                display: false,
            },
            ticks: {
                color: 'rgba(148, 163, 184, 0.5)',
                font: {
                    weight: '600' as const,
                    size: 10,
                },
                padding: 12,
                callback: function (value: any) {
                    if (value >= 1000) return `₺${(value / 1000).toFixed(0)}K`;
                    return `₺${value}`;
                }
            },
        },
        x: {
            grid: {
                display: false,
            },
            border: {
                display: false,
            },
            ticks: {
                color: 'rgba(148, 163, 184, 0.6)',
                font: {
                    weight: '700' as const,
                    size: 11,
                },
                padding: 8,
            },
        },
    },
};

export default function SalesChart({ sales = [] }: { sales: any[] }) {
    const [chartType, setChartType] = useState<'line' | 'bar'>('line');

    // Generate last 7 days data
    const { labels, chartData, dayNames, totalThisWeek, avgDaily, bestDay } = useMemo(() => {
        const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
        const dayNamesShort = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
        const labels: string[] = [];
        const chartData: number[] = [0, 0, 0, 0, 0, 0, 0];
        const dayNames: string[] = [];

        const now = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const dayShort = dayNamesShort[d.getDay()];
            const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;
            labels.push(`${dayShort}\n${dateStr}`);
            dayNames.push(days[d.getDay()]);

            // Aggregate sales for this day
            const dayStart = new Date(d);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(d);
            dayEnd.setHours(23, 59, 59, 999);

            const dayTotal = sales.reduce((sum, s) => {
                const saleDate = new Date(s.created_at);
                if (saleDate >= dayStart && saleDate <= dayEnd) {
                    return sum + Number(s.total_amount);
                }
                return sum;
            }, 0);

            chartData[6 - i] = dayTotal;
        }

        const totalThisWeek = chartData.reduce((a, b) => a + b, 0);
        const avgDaily = totalThisWeek / 7;
        const maxVal = Math.max(...chartData);
        const bestDayIdx = chartData.indexOf(maxVal);
        const bestDay = maxVal > 0 ? dayNames[bestDayIdx] : '-';

        return { labels, chartData, dayNames, totalThisWeek, avgDaily, bestDay };
    }, [sales]);

    const lineData = {
        labels,
        datasets: [
            {
                fill: true,
                label: 'Günlük Satış (₺)',
                data: chartData,
                borderColor: '#6366f1',
                backgroundColor: (context: any) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
                    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.25)');
                    gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.08)');
                    gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
                    return gradient;
                },
                tension: 0.45,
                borderWidth: 2.5,
                pointBackgroundColor: '#6366f1',
                pointBorderColor: 'rgba(15, 23, 42, 0.8)',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 7,
                pointHoverBackgroundColor: '#818cf8',
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 2,
            },
        ],
    };

    const barData = {
        labels,
        datasets: [
            {
                label: 'Günlük Satış (₺)',
                data: chartData,
                backgroundColor: (context: any) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
                    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.7)');
                    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.15)');
                    return gradient;
                },
                borderColor: 'rgba(99, 102, 241, 0.5)',
                borderWidth: 1,
                borderRadius: 8,
                borderSkipped: false,
                hoverBackgroundColor: 'rgba(129, 140, 248, 0.8)',
            },
        ],
    };

    const stats = [
        {
            label: "Haftalık Ciro",
            value: `₺${totalThisWeek.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
            color: "text-foreground",
            subColor: "text-primary"
        },
        {
            label: "Günlük Ort.",
            value: `₺${avgDaily.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
            color: "text-foreground",
            subColor: "text-cyan-400"
        },
        {
            label: "En İyi Gün",
            value: bestDay,
            color: "text-foreground",
            subColor: "text-emerald-400"
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-card/80 backdrop-blur-xl h-full"
            style={{
                boxShadow: '0 0 0 1px rgba(255,255,255,0.02), 0 8px 40px -12px rgba(99,102,241,0.1)'
            }}
        >
            {/* Top gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            {/* Background glow */}
            <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-primary/5 blur-[80px]" />

            {/* Header */}
            <div className="p-6 pb-0">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="relative w-11 h-11 rounded-xl flex items-center justify-center bg-primary/10">
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-indigo-600 opacity-[0.08]" />
                            <Activity className="w-5 h-5 text-primary relative z-10" />
                        </div>
                        <div>
                            <h3 className="text-base font-black tracking-tight text-foreground">Satış Performansı</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                                <span className="text-[9px] font-bold text-secondary/40 uppercase tracking-[2px]">Son 7 Gün</span>
                            </div>
                        </div>
                    </div>

                    {/* Chart type toggle */}
                    <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-0.5 border border-white/[0.06]">
                        <button
                            onClick={() => setChartType('line')}
                            className={`p-1.5 rounded-md transition-all ${chartType === 'line' ? 'bg-primary/20 text-primary' : 'text-secondary/40 hover:text-secondary/60'}`}
                        >
                            <TrendingUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => setChartType('bar')}
                            className={`p-1.5 rounded-md transition-all ${chartType === 'bar' ? 'bg-primary/20 text-primary' : 'text-secondary/40 hover:text-secondary/60'}`}
                        >
                            <BarChart3 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
                            <p className="text-[9px] font-bold uppercase tracking-[1.5px] text-secondary/40 mb-1">{stat.label}</p>
                            <p className={`text-sm lg:text-base font-black tracking-tight ${stat.color} tabular-nums`}>{stat.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chart Area */}
            <div className="px-6 pb-6">
                <div className="h-[220px] relative">
                    {chartType === 'line' ? (
                        <Line options={baseOptions} data={lineData} />
                    ) : (
                        <Bar options={baseOptions} data={barData} />
                    )}
                </div>
            </div>
        </motion.div>
    );
}
