"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Clock, Play, Square, Coffee, TrendingUp,
    DollarSign, ShoppingCart, Award, Calendar,
    User, ChevronRight, BarChart3
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

interface Employee {
    id: string;
    first_name: string;
    last_name: string;
    employee_code: string;
    position: string;
}

interface Shift {
    id: string;
    employee_id: string;
    clock_in: string;
    clock_out: string | null;
    break_duration: number;
    total_sales: number;
    total_transactions: number;
    notes: string;
    employees: Employee;
}

export default function ShiftManager({ showToast }: any) {
    const { currentTenant } = useTenant();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [activeShifts, setActiveShifts] = useState<Shift[]>([]);
    const [shiftHistory, setShiftHistory] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (currentTenant) {
            fetchEmployees();
            fetchShifts();
        }
    }, [currentTenant, selectedDate]);

    const fetchEmployees = async () => {
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('status', 'active')
                .order('first_name');

            if (error) throw error;
            setEmployees(data || []);
        } catch (error: any) {
            showToast(error.message, "error");
        }
    };

    const fetchShifts = async () => {
        try {
            setLoading(true);

            // Active shifts (clock_out is null)
            const { data: active, error: activeError } = await supabase
                .from('shifts')
                .select('*, employees(*)')
                .is('clock_out', null)
                .order('clock_in', { ascending: false });

            if (activeError) throw activeError;

            // Completed shifts for selected date
            const startOfDay = new Date(selectedDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(selectedDate);
            endOfDay.setHours(23, 59, 59, 999);

            const { data: history, error: historyError } = await supabase
                .from('shifts')
                .select('*, employees(*)')
                .not('clock_out', 'is', null)
                .gte('clock_in', startOfDay.toISOString())
                .lte('clock_in', endOfDay.toISOString())
                .order('clock_in', { ascending: false });

            if (historyError) throw historyError;

            setActiveShifts(active || []);
            setShiftHistory(history || []);
        } catch (error: any) {
            showToast(error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleClockIn = async (employeeId: string) => {
        try {
            // Check if employee already has active shift
            const existingShift = activeShifts.find(s => s.employee_id === employeeId);
            if (existingShift) {
                showToast("Bu çalışan zaten vardiyada!", "warning");
                return;
            }

            const { error } = await supabase
                .from('shifts')
                .insert([{
                    employee_id: employeeId,
                    clock_in: new Date().toISOString(),
                    total_sales: 0,
                    total_transactions: 0
                }]);

            if (error) throw error;
            showToast("Vardiya başlatıldı", "success");
            fetchShifts();
        } catch (error: any) {
            showToast(error.message, "error");
        }
    };

    const handleClockOut = async (shiftId: string) => {
        try {
            const { error } = await supabase
                .from('shifts')
                .update({ clock_out: new Date().toISOString() })
                .eq('id', shiftId);

            if (error) throw error;
            showToast("Vardiya sonlandırıldı", "success");
            fetchShifts();
        } catch (error: any) {
            showToast(error.message, "error");
        }
    };

    const calculateDuration = (clockIn: string, clockOut: string | null) => {
        const start = new Date(clockIn);
        const end = clockOut ? new Date(clockOut) : new Date();
        const durationMs = end.getTime() - start.getTime();
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}s ${minutes}dk`;
    };

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Calculate daily statistics
    const dailyStats = {
        totalShifts: shiftHistory.length,
        totalSales: shiftHistory.reduce((sum, s) => sum + (s.total_sales || 0), 0),
        totalTransactions: shiftHistory.reduce((sum, s) => sum + (s.total_transactions || 0), 0),
        avgSale: shiftHistory.length > 0
            ? shiftHistory.reduce((sum, s) => sum + (s.total_sales || 0), 0) / shiftHistory.length
            : 0
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black tracking-widest uppercase flex items-center gap-3">
                    <Clock className="text-primary" />
                    VARDİYA YÖNETİMİ
                </h1>
                <p className="text-secondary font-bold text-sm uppercase tracking-wider mt-1">
                    Çalışan giriş/çıkış ve performans takibi
                </p>
            </div>

            {/* Date Selector & Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="glass-card p-4">
                    <label className="block text-xs font-bold text-secondary uppercase mb-2">Tarih Seç</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-4 py-2 bg-background border border-border rounded-xl text-white focus:outline-none focus:border-primary transition-all"
                    />
                </div>

                <motion.div className="glass-card p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-secondary uppercase">Tamamlanan</p>
                            <p className="text-2xl font-black text-white mt-1">{dailyStats.totalShifts}</p>
                        </div>
                        <Clock className="text-primary w-8 h-8 opacity-20" />
                    </div>
                </motion.div>

                <motion.div className="glass-card p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-secondary uppercase">Toplam Satış</p>
                            <p className="text-2xl font-black text-emerald-400 mt-1">₺{dailyStats.totalSales.toLocaleString('tr-TR')}</p>
                        </div>
                        <DollarSign className="text-emerald-400 w-8 h-8 opacity-20" />
                    </div>
                </motion.div>

                <motion.div className="glass-card p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-secondary uppercase">İşlem Sayısı</p>
                            <p className="text-2xl font-black text-blue-400 mt-1">{dailyStats.totalTransactions}</p>
                        </div>
                        <ShoppingCart className="text-blue-400 w-8 h-8 opacity-20" />
                    </div>
                </motion.div>

                <motion.div className="glass-card p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-secondary uppercase">Ort. Satış</p>
                            <p className="text-2xl font-black text-amber-400 mt-1">₺{dailyStats.avgSale.toFixed(0)}</p>
                        </div>
                        <TrendingUp className="text-amber-400 w-8 h-8 opacity-20" />
                    </div>
                </motion.div>
            </div>

            {/* Active Shifts */}
            <div className="glass-card">
                <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                    <h2 className="text-xl font-black uppercase flex items-center gap-2">
                        <Play className="text-emerald-400" />
                        Aktif Vardiyalar
                        {activeShifts.length > 0 && (
                            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs">
                                {activeShifts.length}
                            </span>
                        )}
                    </h2>
                </div>

                {activeShifts.length === 0 ? (
                    <div className="text-center py-12">
                        <Clock className="w-16 h-16 mx-auto text-secondary/30 mb-4" />
                        <p className="text-secondary font-bold">Aktif vardiya bulunmuyor</p>
                        <p className="text-xs text-secondary/60 mt-2">Çalışanlar aşağıdan vardiyaya başlayabilir</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeShifts.map((shift, index) => (
                            <motion.div
                                key={shift.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-3"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                            <User className="text-emerald-400" size={20} />
                                        </div>
                                        <div>
                                            <p className="font-black text-white">
                                                {shift.employees.first_name} {shift.employees.last_name}
                                            </p>
                                            <p className="text-xs text-secondary font-mono">{shift.employees.employee_code}</p>
                                        </div>
                                    </div>
                                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="bg-white/5 rounded-lg p-2">
                                        <p className="text-secondary font-bold uppercase mb-1">Başlangıç</p>
                                        <p className="text-white font-black">{formatTime(shift.clock_in)}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-2">
                                        <p className="text-secondary font-bold uppercase mb-1">Süre</p>
                                        <p className="text-emerald-400 font-black">{calculateDuration(shift.clock_in, null)}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <p className="text-secondary uppercase font-bold mb-1">Satış</p>
                                        <p className="text-white font-black">₺{shift.total_sales.toLocaleString('tr-TR')}</p>
                                    </div>
                                    <div>
                                        <p className="text-secondary uppercase font-bold mb-1">İşlem</p>
                                        <p className="text-white font-black">{shift.total_transactions}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleClockOut(shift.id)}
                                    className="w-full px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg font-bold uppercase text-xs transition-all flex items-center justify-center gap-2"
                                >
                                    <Square size={14} />
                                    Vardiyayı Bitir
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Start Shift Section */}
            <div className="glass-card">
                <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                    <h2 className="text-xl font-black uppercase">Vardiya Başlat</h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {employees.map((employee) => {
                        const hasActiveShift = activeShifts.some(s => s.employee_id === employee.id);
                        return (
                            <button
                                key={employee.id}
                                onClick={() => !hasActiveShift && handleClockIn(employee.id)}
                                disabled={hasActiveShift}
                                className={`p-4 rounded-xl border-2 transition-all ${hasActiveShift
                                        ? 'bg-white/5 border-border opacity-50 cursor-not-allowed'
                                        : 'bg-primary/5 border-primary/30 hover:bg-primary/10 hover:border-primary'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                                        <span className="font-black text-primary text-sm">
                                            {employee.first_name[0]}{employee.last_name[0]}
                                        </span>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-white text-sm">{employee.first_name}</p>
                                        <p className="text-xs text-secondary font-mono">{employee.employee_code}</p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Shift History */}
            <div className="glass-card">
                <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                    <h2 className="text-xl font-black uppercase">Vardiya Geçmişi</h2>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-secondary font-bold">Yükleniyor...</p>
                    </div>
                ) : shiftHistory.length === 0 ? (
                    <div className="text-center py-12">
                        <Calendar className="w-16 h-16 mx-auto text-secondary/30 mb-4" />
                        <p className="text-secondary font-bold">Bu tarihte vardiya kaydı bulunamadı</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5 border-b border-border">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-black uppercase text-secondary">Çalışan</th>
                                    <th className="px-4 py-3 text-left text-xs font-black uppercase text-secondary">Giriş</th>
                                    <th className="px-4 py-3 text-left text-xs font-black uppercase text-secondary">Çıkış</th>
                                    <th className="px-4 py-3 text-left text-xs font-black uppercase text-secondary">Süre</th>
                                    <th className="px-4 py-3 text-left text-xs font-black uppercase text-secondary">Satış</th>
                                    <th className="px-4 py-3 text-left text-xs font-black uppercase text-secondary">İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shiftHistory.map((shift, index) => (
                                    <motion.tr
                                        key={shift.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="border-b border-border hover:bg-white/5 transition-all"
                                    >
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-bold text-white text-sm">
                                                    {shift.employees.first_name} {shift.employees.last_name}
                                                </p>
                                                <p className="text-xs text-secondary font-mono">{shift.employees.employee_code}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-sm text-white">{formatTime(shift.clock_in)}</td>
                                        <td className="px-4 py-3 font-mono text-sm text-white">
                                            {shift.clock_out ? formatTime(shift.clock_out) : '-'}
                                        </td>
                                        <td className="px-4 py-3 font-bold text-primary text-sm">
                                            {calculateDuration(shift.clock_in, shift.clock_out)}
                                        </td>
                                        <td className="px-4 py-3 font-bold text-emerald-400 text-sm">
                                            ₺{shift.total_sales.toLocaleString('tr-TR')}
                                        </td>
                                        <td className="px-4 py-3 font-bold text-blue-400 text-sm">{shift.total_transactions}</td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
