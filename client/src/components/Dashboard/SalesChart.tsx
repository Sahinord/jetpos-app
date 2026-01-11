"use client";

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
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend
);

const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: false,
        },
        tooltip: {
            backgroundColor: '#1e293b',
            padding: 12,
            borderWidth: 1,
            borderColor: '#334155',
        },
    },
    scales: {
        y: {
            grid: {
                color: 'rgba(255, 255, 255, 0.05)',
            },
            ticks: {
                color: '#94a3b8',
            },
        },
        x: {
            grid: {
                display: false,
            },
            ticks: {
                color: '#94a3b8',
            },
        },
    },
};

const labels = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

export default function SalesChart({ sales = [] }: { sales: any[] }) {
    // Generate last 7 days labels
    const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const labels = [];
    const chartData = [0, 0, 0, 0, 0, 0, 0];

    const now = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        labels.push(days[d.getDay()]);

        // Aggregate sales for this day
        const dayStart = new Date(d.setHours(0, 0, 0, 0));
        const dayEnd = new Date(d.setHours(23, 59, 59, 999));

        const dayTotal = sales.reduce((sum, s) => {
            const saleDate = new Date(s.created_at);
            if (saleDate >= dayStart && saleDate <= dayEnd) {
                return sum + Number(s.total_amount);
            }
            return sum;
        }, 0);

        chartData[6 - i] = dayTotal;
    }

    const data = {
        labels,
        datasets: [
            {
                fill: true,
                label: 'Günlük Satış (₺)',
                data: chartData,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#fff',
                pointHoverRadius: 6,
            },
        ],
    };

    const totalThisWeek = chartData.reduce((a, b) => a + b, 0);
    // For demo/simplicity, we just show a static growth if no history, 
    // but we can calculate it if we have more data.
    const growth = totalThisWeek > 0 ? "+100%" : "0%";

    return (
        <div className="glass-card h-[400px]">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-[10px] mb-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="tracking-[2px] uppercase">Canlı Performans</span>
                    </div>
                    <h3 className="text-xl font-bold tracking-tight">Haftalık Satış Grafiği</h3>
                    <p className="text-sm text-secondary opacity-70">Son 7 günlük işletme hacmi</p>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-bold text-white block">₺{totalThisWeek.toLocaleString('tr-TR')}</span>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">TOPLAM CİRO</span>
                </div>
            </div>
            <div className="h-[260px]">
                <Line options={options} data={data} />
            </div>
        </div>
    );
}
